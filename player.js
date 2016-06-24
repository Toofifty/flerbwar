/*
 * player.js - server version of the player object
 */
 
var MAX_SIZE = 250, MIN_SIZE = 0.1;

var Player = function(x, y, id) {

	this.x = x;
	this.y = y;
	this.ax = 0;
	this.ay = 0;
	this.id = id;
	this.name = "null";

	this.size = 20;
	
	this.color = "#F00";
	
	this.set_name = function(name) {
		
		this.name = name;
		
	};
	
	this.set_color = function(color) {
		
		this.color = color;
		
	};

	this.update = function() {
		
		this.x += this.ax;
		this.y += this.ay;
		
	};

	this.move = function(x, y) {
		
		this.x = x;
		this.y = y;
		
	};

	this.update_acc = function(ax, ay) {
		
		this.ax = ax;
		this.ay = ay;
		
	};
	
	this.resize = function(size) {
		
		if (size > MAX_SIZE) size = MAX_SIZE;
		else if (size < MIN_SIZE) size = MIN_SIZE;
		this.size = size;
		
	};

	this.init_data = function() {
		
		return {
			id: this.id,
			name: this.name,
			color: this.color,
			x: this.x,
			y: this.y
		};
		
	};

	this.soft_data = function() {
		
		return {
			id: this.id,
			ax: this.ax,
			ay: this.ay,
			size: this.size
		};
		
	};

	this.hard_data = function() {

		return {
			id: this.id,
			ax: this.ax,
			ay: this.ay,
			size: this.size,
			x: this.x,
			y: this.y
		};

	};

};

exports.Player = Player;