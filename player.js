/*
 * player.js - server version of the player object
 */

var Player = function(x, y, id) {

	this.x = x;
	this.y = y;
	this.ax = 0;
	this.ay = 0;
	this.id = id;

	this.size = 0;

	this.update = function() {
		this.x += this.ax;
		this.y += this.ay;
	}

	this.move = function(x, y) {
		this.x = x;
		this.y = y;
	}

	this.update_acc = function(ax, ay) {
		this.ax = ax;
		this.ay = ay;
	}

	this.as_data = function() {
		return {
			id: this.id,
			x: this.x,
			y: this.y
		}
	}

	this.regular_data = function() {
		return {
			id: this.id,
			ax: this.ax,
			ay: this.ay
		}
	}

	this.full_data = function() {

		return {
			id: this.id,
			ax: this.ax,
			ay: this.ay,
			size: this.size,
			x: this.x,
			y: this.y
		}

	}

}

exports.Player = Player;