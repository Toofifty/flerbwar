/*
 * local and network player classes
 */
 
/* global log_message */

var MAX_SIZE = 250, MIN_SIZE = 0.1;

var two_dec = function(num) {
	return parseInt(num * 100, 10) / 100;
};

var random_hex = function() {
	return parseInt(Math.random() * 16).toString(16).toUpperCase();	
};

var Blob = function(x, y, size, color) {

	this.x = x;
	this.y = y;
	this.size = size;
	this.color = color;

	this.reduce = function(game) {

		this.size /= 1.03;
		if (this.size < MIN_SIZE) this.size = MIN_SIZE;
		
		game.socket.emit("debug resize", this.size);

	};

	this.increase = function(game) {

		this.size *= 1.03;
		if (this.size > MAX_SIZE) this.size = MAX_SIZE;
		
		game.socket.emit("debug resize", this.size);

	};

	this.draw = function(game) {
		
		if (this.size === undefined) console.log("undefined size for " + this.color);
		
		// game.graphics.circle(this.x, this.y, this.size, 
		// 	"hsl(" + this.color + ", 50%, 50%)");
		
		game.graphics.circle(this.x, this.y, this.size, this.color);
		
		game.graphics.minimap_dot(this.x, this.y, this.size, this.color);

	};

	this.move = function(x, y) {

		this.x = x;
		this.y = y;

	};

};

var Player = function(x, y, id) {

	// screen position (int)
	this.x = x;
	this.y = y;

	// acceleration (2-dec float)
	this.ax = 0;
	this.ay = 0;
	
	this.id = id || -1;
	this.name = "#";
	
	for (var i = 0; i < 3; i++) this.name += random_hex();

	this.blob = new Blob(x, y, 0.5, this.name);
	
	this.dir = 0;
	
	this.deadmarks = 0;
	
	this.reset_deadmarks = function() {
		
		this.deadmarks = 0;
		
	};

	this.set_id = function(id) { 
		
		this.id = id; 
		
	};
	
	this.set_name = function(name) {
		
		this.name = name;
		
	};
	
	this.set_color = function(color) {
		
		this.blob.color = color;
		
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
		
		this.blob.size = size;
		
	};
	
	this.set_dir = function(dir) {
		
		this.dir = dir;
		
	};

	/* apply acceleration and calculate new position */
	this.update = function(game) {

		this.x += this.ax;
		this.y += this.ay;

		this.ax = two_dec(this.ax / 1.05);
		this.ay = two_dec(this.ay / 1.05);

		this.blob.move(this.x, this.y);
		
		if (this.id != game.local_player.id) this.deadmarks++;
		
		if (this.deadmarks == 1000) {
			
			game.del_player(this.id);
			log_message(this.name + " vanished");
			
		}

	};

	this.draw = function(game) {
			
		game.graphics.pointer(this.x, this.y, this.blob.size * 17/16, "#FFF",
			this.dir);

		this.blob.draw(game);
		
		game.graphics.pointer(this.x, this.y, this.blob.size, this.blob.color,
			this.dir);
			
		game.graphics.text(this.name, this.x, this.y);// - this.blob.size - 10);

	};

	this.soft_data = function() {

		return {
			id: this.id,
			ax: this.ax,
			ay: this.ay,
			dir: this.dir
		};

	};

	this.hard_data = function() {

		return {
			id: this.id,
			ax: this.ax,
			ay: this.ay,
			x: this.x,
			y: this.y
		};

	};

};

var LocalControls = function(player) {

	this.player = player;

	this.update = function(game) {
		
		// var inc = 0.1 / Math.pow(this.player.blob.size, 0.1);
		var inc = 0.1 / Math.pow((this.player.blob.size + 0.5), 0.25);

		if (game.keyboard.is_down("w")) this.player.ay -= inc;
		if (game.keyboard.is_down("a")) this.player.ax -= inc;
		if (game.keyboard.is_down("s")) this.player.ay += inc;
		if (game.keyboard.is_down("d")) this.player.ax += inc;
		// if (game.keyboard.is_down("r")) this.player.dir += 0.1;
		// if (game.keyboard.is_down("t")) this.player.dir -= 0.1;
		if (game.keyboard.is_down("e")) this.player.blob.reduce(game);
		if (game.keyboard.is_down("q")) this.player.blob.increase(game);
		
		// game.camera.scale = 20 / Math.sqrt(this.player.blob.size);
		game.camera.scale = 20 / Math.sqrt(this.player.blob.size) - 0.5;
		
		var sx = game.canvas.width / 2;
		var sy = game.canvas.height / 2;
		
		var mx = game.mouse.x;
		var my = game.mouse.y;
		
		this.player.set_dir(Math.atan2((my - sy), (mx - sx)) + Math.PI / 2);

	};

};

var SiphonBlob = function(x, y, id, size, color) {
	
	this.id = id;
	
	this.blob = new Blob(x, y, size, color);
	
	this.resize = function(size) {
		
		this.blob.size = size;
		
	};

	this.update = function(game) {
		
		
		
	};
	
	this.draw = function(game) {
		
		this.blob.draw(game);
		
	};
	
};

var Keyboard = function(elem) {

	var self = this;

	this.keys = [];

	// shortcut for common keys
	this.keymap = {
		"w": 87, "a": 65, "s": 83, "d": 68,
		"space": 32, "q": 81, "e": 69, "r": 82, "t": 84
	};

	elem.keydown(function(event) {

		if (self.keys.indexOf(event.keyCode) == -1)
			self.keys.push(event.keyCode);

		console.log("Key " + event.keyCode);

	}).keyup(function(event) {

		self.keys.splice(self.keys.indexOf(event.keyCode), 1);

	});

	this.is_down = function(key) {

		if (typeof key == "string") {

			return this.is_down(this.keymap[key]);

		} else {

			return this.keys.indexOf(key) > -1;

		}

	};

};