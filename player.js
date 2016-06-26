/*
 * player.js - server version of the player object
 */
 
var MAX_SIZE = 250, MIN_SIZE = 0.1;
var ABSORB_RATE = 0.1;

var random_hex = function() {
	return parseInt(Math.random() * 16).toString(16).toUpperCase();	
};

var Player = function(x, y, id) {

	this.x = x;
	this.y = y;
	this.vx = 0;
	this.vy = 0;
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
			
			this.size += ABSORB_RATE * 1/2;
			other.size -= ABSORB_RATE;
			
		} else {
			
			this.size -= ABSORB_RATE;
			other.size += ABSORB_RATE * 1/2;
			
		}
		
		if (this.size <= MIN_SIZE) this.size = MIN_SIZE;
		if (other.size <= MIN_SIZE) other.size = MIN_SIZE;
	};
	
	this.hit = function(other) {
		
		if (other.size > MIN_SIZE)
			other.size -= ABSORB_RATE;
		
		if (other.size <= MIN_SIZE) 
			other.size = MIN_SIZE;
		
		if (this.size < MAX_SIZE) 
			this.size += ABSORB_RATE * 1/2;
		
	};
	
	this.set_name = function(name) {
		
		this.name = name;
		
	};
	
	this.set_color = function(color) {
		
		this.color = color;
		
	};

	this.update = function() {
		
		this.x += this.vx;
		this.y += this.vy;
		
	};

	this.move = function(x, y) {
		
		this.x = x;
		this.y = y;
		
	};

	this.update_vel = function(ax, ay) {
		
		this.vx = ax;
		this.vy = ay;
		
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
			vx: this.vx,
			vy: this.vy,
			size: this.size,
			dir: this.dir
		};
		
	};

	this.hard_data = function() {

		return {
			id: this.id,
			vx: this.vx,
			vy: this.vy,
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

var SiphonBlob = function(mapsize, id) {
	
	this.mapsize = mapsize;
	
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
	
	this.refresh = function() {
	
		this.x = Math.random() * this.mapsize;
		this.y = Math.random() * this.mapsize;
		this.id = id;
		this.size = Math.random() * MAX_SIZE / 10;
		this.color = "#";
	
		for (var i = 0; i < 3; i++) this.color += random_hex();
		
	};
	
	this.is_dead = function() {
		
		return this.size <= MIN_SIZE;
		
	};
	
};

var Projectile = function(id, player) {
	
	this.id = id;
	
	this.player = player;
	
	this.x = player.x;
	this.y = player.y;
	
	this.size = Math.sqrt(player.size);
	
	this.vx = Math.sin(player.dir) * this.size + player.vx;
	this.vy = -Math.cos(player.dir) * this.size + player.vy;
	
	this.color = player.color;
	
	this.update = function() {
		
		this.x += this.vx;
		this.y += this.vy;
		
	};
	
	this.init_data = function() {
		
		return {
			id: this.id,
			vx: this.vx,
			vy: this.vy,
			x: this.x,
			y: this.y,
			size: this.size,
			color: this.color,
			pid: this.player.id
		};
		
	};
	
};

exports.Player = Player;
exports.SiphonBlob = SiphonBlob;
exports.Projectile = Projectile;