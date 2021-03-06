//*******
//** Config
//*******
var config = require('./config').Config;
//*******

//*******
//** Utils
//*******
var utils = require('./utils').Utils;
//*******

//*******
//** Class
//*******
var Game                = require('./game/game').Game;
var Character           = require('./character/character').Character;
var Bot                 = require('./character/bot').Bot;
var Player              = require('./character/player').Player;
var Map                 = require('./map/map').Map;
var Pillar              = require('./map/pillar').Pillar;
var Director            = require('./decision/director').Director;
var Decision            = require('./decision/decision').Decision;

var game                = new Game(config.GameStates, config.Games);
//*******

// Handler
function handler (req, res) {
    fs.readFile(__dirname + '/client/index.html',
    function (err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }
        res.writeHead(200);
        res.end(data);
    });
}

// Servers initialisation
var http    = require('http').createServer(handler);
var socket  = require('socket.io');
var fs      = require('fs');

// Server listening
var app = http.listen(config.port, config.host);
var io  = socket.listen(app);
console.log('Server running at http://'+config.host+':'+config.port+'/');

// On client connection, check game state and connect him
io.sockets.on('connection', function(socket) {

    // Debug event
    if( config.debug ) {

        // Reset game ()
        socket.on('game.reset', function() {
            game.stop();
            game = new Game(config.GameStates, config.Games);
            game.addPlayer(new Player(new Character(), socket.id));
            sendGameState(socket);
        });

        // This event will send an event back defined by data's first element
        // Data's second element will be send as data into back event
        socket.on('debug.ask', function(data) {
            socket.emit(data[0], data[1]);
        });        
    }

    // Check if player can join the game
    if( !game.addPlayer(new Player(new Character())) ) {
        socket.emit('game.cannot_join')
        // If player cannot join, avoid all event connection
        //return false;
    }
    
    // Send initial map state
    socket.emit('map.init', {
        config: {
            maps: {
                'height': config.Dists.MAP_HEIGHT,
                'width':  config.Dists.MAP_WIDTH
            }
        },
        state: []
    });
    // 

    // Client is now connected, send him game state
    sendGameState(socket);

    // Event on player (player.action)
    socket.on('player.action', function(data) { 

    });
});

// On client disconnection
io.sockets.on('disconnect', function(socket) {
    // TODO : kill player but keep game started
});

/**
 *  Regarding game state, send some event to clients
 */
function sendGameState(socket) {
    // After player connection, handle the
    switch(game.state)
    {
        // no more players, must wait
        case config.GameStates.AWAITING_PLAYERS:
            socket.emit('game.awaiting');
            break;

        // game will start 
        case config.GameStates.READY:
            // Milliseconds between game.ready and game.start
            count_down = config.Games.TIME_WAITING * 1000;

            // Inform client that game will soon start
            utils.emitAll(socket, 'game.ready', {count_down: count_down});

            // Game will start in few second
            setTimeout(function() {
                utils.emitAll(socket, 'game.start');
                game.start(socket, utils);
            }, count_down);

            // Game start !
            game.prepareStart(socket, utils);
            break;
    }
}

