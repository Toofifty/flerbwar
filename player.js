/*
 * player.js - server version of the player object
 */
 
var MAX_SIZE = 250, MIN_SIZE = 0.1;
var ABSORB_RATE = 0.4;

var random_hex = function() {
	return parseInt(Math.random() * 16).toString(16).toUpperCase();	
};

var Player = function(x, y, id) {

	this.x = x;
	this.y = y;
	this.ax = 0;
	this.ay = 0;
	this.id = id;
	this.name = "null";
	this.socket;

	this.size = 0.5;
	
	this.color = "#F00";
	
	this.dir = 0;
	
	this.absorb = function(other) {
		
		if (this.size <= MIN_SIZE || other.size <= MIN_SIZE) return;
		if (this.size >= MAX_SIZE || other.size >= MAX_SIZE) return;
		
		if (this.size > other.size) {
			
			this.size += ABSORB_RATE * 4/2;
			other.size -= ABSORB_RATE;
			
		} else {
			
			this.size -= ABSORB_RATE;
			other.size += ABSORB_RATE * 4/2;
			
		}
		
	};
	
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
	
	this.set_dir = function(dir) {
		
		this.dir = dir;
		
	};

	this.init_data = function() {
		
		return {
			id: this.id,
			name: this.name,
			color: this.color,
			size: this.size,
			x: this.x,
			y: this.y,
			dir: this.dir
		};
		
	};

	this.soft_data = function() {
		
		return {
			id: this.id,
			ax: this.ax,
			ay: this.ay,
			size: this.size,
			dir: this.dir
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
	
	this.self_data = function() {
		
		return {
			id: this.id,
			size: this.size
		};
		
	};

};

var SiphonBlob = function(x, y, id) {
	
	this.x = parseInt(x, 10);
	this.y = parseInt(y, 10);
	this.id = id;
	this.size = Math.random() * MAX_SIZE / 10;
	this.color = "#";

	for (var i = 0; i < 3; i++) this.color += random_hex();
	
	this.init_data = function() {
		
		return {
			id: this.id,
			size: this.size,
			x: this.x,
			y: this.y,
			color: this.color
		};
		
	};
	
	this.soft_data = function() {
		
		return {
			id: this.id,
			size: this.size
		};
		
	};
	
};

exports.Player = Player;
exports.SiphonBlob = SiphonBlob;