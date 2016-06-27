/*
 * player.js - server version of the player object
 */
 
var MAX_MASS = 250000, MIN_MASS = 0.1;
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

	this.mass = 0.5;
	
	this.color = "#F00";
	
	this.dir = 0;
	
	this.absorb = function(other) {
		
		var mass = (Math.sqrt(this.mass * 100) / 100) * Math.min(
			Math.max(Math.pow(other.mass / this.mass, 2), 0.9), 50);
		
		if (this.mass > other.mass) {
			
			if (this.mass >= MAX_MASS || other.mass <= MIN_MASS) return;
			
			this.mass += mass;
			other.mass -= mass;
			
		} else {
			
			if (this.mass <= MIN_MASS || other.mass >= MAX_MASS) return;
			
			this.mass -= mass;
			other.mass += mass * 1/2;
			
		}
		
		if (this.mass <= MIN_MASS) this.mass = MIN_MASS;
		
		if (other.mass <= MIN_MASS) {
			
			if (other.name !== undefined) {
				
				this.socket.emit("broadcast message", "You devoured " 
					+ other.name + "!");
					
				this.player.socket.broadcast.emit("broadcast message", 
					this.name + " devoured " + other.name + "!");
				
			} else {
				
				this.socket.emit("broadcast message", 
					"Siphon destroyed.");
					
			}
			
			other.mass = MIN_MASS;
		}
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
	
	this.resize = function(mass) {
		
		if (mass > MAX_MASS) mass = MAX_MASS;
		else if (mass < MIN_MASS) mass = MIN_MASS;
		this.mass = mass;
		
	};
	
	this.set_dir = function(dir) {
		
		this.dir = dir;
		
	};
	
	this.radius = function() {
		
		return Math.sqrt(this.mass / Math.PI);
		
	};

	this.init_data = function() {
		
		return {
			id: this.id,
			name: this.name,
			color: this.color,
			mass: this.mass,
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
			mass: this.mass,
			dir: this.dir
		};
		
	};

	this.hard_data = function() {

		return {
			id: this.id,
			vx: this.vx,
			vy: this.vy,
			mass: this.mass,
			x: this.x,
			y: this.y
		};

	};
	
	this.self_data = function() {
		
		return {
			id: this.id,
			mass: this.mass
		};
		
	};

};

var SiphonBlob = function(mapsize, id, max_size) {
	
	this.mapsize = mapsize;
	this.max_size = max_size || MAX_MASS;
	
	this.mass = 0;
	
	this.radius = function() {
		
		return Math.sqrt(this.mass / Math.PI);
		
	};
	
	this.init_data = function() {
		
		return {
			id: this.id,
			mass: this.mass,
			x: this.x,
			y: this.y,
			color: this.color
		};
		
	};
	
	this.soft_data = function() {
		
		return {
			id: this.id,
			mass: this.mass
		};
		
	};
	
	this.refresh = function(max) {
		
		var max = max || this.max_size;
	
		this.x = Math.random() * this.mapsize;
		this.y = Math.random() * this.mapsize;
		this.id = id;
		this.mass = Math.random() * max, 1;
		
		
		// this.color = "#";
	
		// for (var i = 0; i < 3; i++) this.color += random_hex();
		
		this.color = "hsl(" + (Math.random() * 255) + ", 50%, 50%)";
		
		return this.mass;
		
	};
	
	this.is_dead = function() {
		
		return this.mass <= MIN_MASS;
		
	};
	
};

var Projectile = function(id, player) {
	
	this.id = id;
	
	this.player = player;
	
	this.x = player.x;
	this.y = player.y;
	
	var speed = Math.sqrt(player.radius()) / 2;
	
	this.mass = Math.sqrt(player.mass * 100) / 100;
	
	this.vx = Math.sin(player.dir) * speed + player.vx;
	this.vy = -Math.cos(player.dir) * speed + player.vy;
	
	this.color = player.color;
	
	this.player.mass -= this.mass;
	if (this.player.mass < MIN_MASS) this.player.mass = MIN_MASS;
	
	this.radius = function() {
		
		return Math.sqrt(this.mass / Math.PI);
		
	};
	
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
			mass: this.mass,
			color: this.color,
			pid: this.player.id
		};
		
	};
	
	this.hit = function(other) {
		
		if (other.mass <= MIN_MASS) return;
		
		var mass = this.mass * Math.min(Math.max(Math.pow(other.mass / this.player.mass, 2), 0.9), 50);
		
		other.mass -= mass;
		
		if (other.mass <= MIN_MASS) {
			
			if (other.name !== undefined) {
				
				this.player.socket.emit("broadcast message", "You dominated " 
					+ other.name + "!");
					
				this.player.socket.broadcast.emit("broadcast message", 
					this.player.name + " dominated " + other.name + "!");
				
			} else {
				this.player.socket.emit("broadcast message", 
					"Siphon destroyed.");
			}
			
			other.mass = MIN_MASS;
		}
		
		if (this.player.mass >= MAX_MASS) return;
		
		this.player.mass += this.mass + mass;
		
		if (this.player.mass > MAX_MASS) this.player.mass = MAX_MASS;
		
	};
	
};

exports.Player = Player;
exports.SiphonBlob = SiphonBlob;
exports.Projectile = Projectile;