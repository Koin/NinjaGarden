Decision = function(state, dir, evt) {
	this.state = state;
	this.dir = dir;
	this.evt = evt;
}

Decision.prototype = {
	isEvent: function() {
		return this.evt == undefined;
	}
}

exports.Decision = Decision;