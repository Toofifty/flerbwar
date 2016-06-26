/*
 * local and network player classes
 */
 
/* global log_message */

var MAX_SIZE = 250, MIN_SIZE = 0.1, COOLDOWN = 20;

var two_dec = function(num) {
	
	return parseInt(num * 100, 10) / 100;
	
};

var random_hex = function() {
	
	return parseInt(Math.random() * 16).toString(16).toUpperCase();	
	
};

var dist = function(x, y, x1, y1) {
	
	if (x1 === undefined && y1 === undefined)
		return Math.sqrt((x.x - y.x) * (x.x - y.x) + (x.y - y.y) * (x.y - y.y));
    
    return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
    
};

var Blob = function(x, y, size, color) {

	this.x = x;
	this.y = y;
	
	this._size = size;
	this._color = color;

	this.reduce = function(game) {

		this.size(this._size / 1.03);
		
		game.socket.emit("debug resize", this.size());

	};

	this.increase = function(game) {

		this.size(this._size * 1.03);
		
		game.socket.emit("debug resize", this.size());

	};

	this.draw = function(game) {
		
		if (this.size() === undefined) console.log("undefined size for " + this.color());
		
		// game.graphics.circle(this.x, this.y, this.size, 
		// 	"hsl(" + this.color + ", 50%, 50%)");
		
		game.graphics.circle(this.x, this.y, this.size(), this.color());
		
		game.graphics.minimap_dot(this.x, this.y, this.size(), this.color());

	};

	this.pos = function(x, y) {
		
		if (y !== undefined) {
			
			this.x = x;
			this.y = y;
			
		}

		return {x: this.x, y: this.y};

	};
	
	this.move = function(vx, vy) {
		
		this.x += vx;
		this.y += vy;
		
	};
	
	this.size = function(size) {
		
		if (size !== undefined) {
			
			this._size = size;
			
			if (this._size > MAX_SIZE) this._size = MAX_SIZE;
			if (this._size < MIN_SIZE) this._size = MIN_SIZE;
			
		}
		
		return this._size;
		
	};
	
	this.color = function(color) {
		
		if (color !== undefined) this._color = color;
		
		return this._color;
		
	};

};

var Player = function(x, y, id) {
	
	var self = this;

	// velocity (2-dec float)
	this.vx = 0;
	this.vy = 0;
	
	this._id = id || -1;
	this._name = "#";
	
	for (var i = 0; i < 3; i++) this._name += random_hex();

	this.blob = new Blob(x, y, 0.5, this._name);
	
	this._dir = 0;
	
	this.deadmarks = 0;
	
	this.shoot = function(game) {
		
		if (this.cooldown > 0) return;
		
		var sq_s = Math.sqrt(this.size());
		
		var id = parseInt(Math.random() * 1000, 10);
		
		game.add_projectile(new Projectile(id, this.pos().x, 
			this.pos().y, Math.sin(this.dir()) * sq_s + this.vx, 
			-Math.cos(this.dir()) * sq_s + this.vy, sq_s, this.color()), 
			this._id);
		
		game.socket.emit("player shoot", this.hard_data());
		
		setTimeout(function() {
			
			game.del_projectile(id);
			
		}, 2000);
		
		this.cooldown = COOLDOWN;
		
	};
	
	this.reset_deadmarks = function() {
		
		this.deadmarks = 0;
		
	};

	this.id = function(id) { 
		
		if (id !== undefined) this._id = id;
		
		return this._id;
		
	};
	
	this.name = function(name) {
		
		if (name !== undefined) this._name = name;
		
		return this._name;
		
	};
	
	this.color = function(color) {
		
		return this.blob.color(color);
		
	};

	this.pos = function(x, y) {

		return this.blob.pos(x, y);

	};

	this.vel = function(vx, vy) {

		if (vy !== undefined) {
			
			this.vx = vx;
			this.vy = vy;
			
		}
		
		return {x: this.vx, y: this.vy};

	};
	
	this.size = function(size) {
		
		return this.blob.size(size);
		
	};
	
	this.dir = function(dir) {
		
		if (dir !== undefined) this._dir = dir;
		
		return this._dir;
		 
	};
	
	this.move = function(vx, vy) {
		
		this.blob.move(vx, vy);
		
	};
	
	this.accelerate = function(ax, ay) {
		
		this.vel(this.vx + ax, this.vy + ay);
		
	};

	/* apply acceleration and calculate new position */
	this.update = function(game) {

		// move blob by velocity
		this.move(this.vx, this.vy);
		
		// add friction force
		this.vel(two_dec(this.vx / 1.05), two_dec(this.vy / 1.05));
		
		if (this.id() != game.local_player.id()) this.deadmarks++;
		else this.cooldown--;
		
		if (this.deadmarks == 1000) {
			
			game.del_player(this.id());
			log_message(this.name() + " vanished");
			
		}

	};

	this.draw = function(game) {
		
		var p = this.pos();
			
		game.graphics.pointer(p.x, p.y, this.size() * 17/16, "#FFF",
			this.dir());

		this.blob.draw(game);
		
		game.graphics.pointer(p.x, p.y, this.size(), this.color(), this.dir());
			
		game.graphics.text(this.name(), p.x, p.y);// - this.blob.size - 10);

	};

	this.soft_data = function() {

		return {
			id: this.id(),
			vx: this.vx,
			ay: this.vy,
			dir: this.dir()
		};

	};

	this.hard_data = function() {

		return {
			id: this.id(),
			vx: this.vx,
			vy: this.vy,
			x: this.pos().x,
			y: this.pos().y,
			dir: this.dir()
		};

	};

};

var Projectile = function(id, x, y, vx, vy, size, color, pid) {
	
	this._id = id;
	
	this.vx = vx;
	this.vy = vy;
	
	this.blob = new Blob(x, y, size, color);
	
	this.pid = pid;
	
	this.id = function(id) {
		
		if (id !== undefined) this._id = id;
		
		return this._id;
		
	};
	
	this.update = function(game) {
		
		this.blob.move(this.vx, this.vy);
		
		// check if dead
		
		for (var i in game.players) {
			
			var pl = game.players[i];
			
			if (pl.id() == this.pid) continue;
			
			var max_dist = pl.size() + this.blob.size();
			
			if (dist(this.blob.pos(), pl.pos()) < max_dist) {
				
				game.del_projectile(this.id);
				
			}
			
		}
		
		for (var i in game.siphons) {
			
			var si = game.siphons[i];
			
			var max_dist = si.size() + this.blob.size();
			
			if (dist(this.blob.pos(), si.pos()) < max_dist) {
				
				game.del_projectile(this.id);
				
			}
			
		}
		
	};
	
	this.draw = function(game) {
		
		this.blob.draw(game);
		
	};
	
};

var LocalControls = function(player) {

	this.player = player;

	this.update = function(game) {
		
		// var acc = 0.1 / Math.pow(this.player.blob.size, 0.1);
		var acc = 0.1 / Math.pow((this.player.blob.size() + 2.5), 0.25);

		if (game.keyboard.is_down("w")) this.player.accelerate(0, -acc);
		if (game.keyboard.is_down("a")) this.player.accelerate(-acc, 0);
		if (game.keyboard.is_down("s")) this.player.accelerate(0, acc);
		if (game.keyboard.is_down("d")) this.player.accelerate(acc, 0);
		// if (game.keyboard.is_down("r")) this.player.dir += 0.1;
		// if (game.keyboard.is_down("t")) this.player.dir -= 0.1;
		// if (game.keyboard.is_down("e")) this.player.blob.reduce(game);
		// if (game.keyboard.is_down("q")) this.player.blob.increase(game);
		
		if (game.keyboard.is_down(" ")) this.player.shoot(game);
		
		// game.camera.scale = 20 / Math.sqrt(this.player.blob.size);
		game.camera.scale = 20 / Math.sqrt(this.player.blob.size()) - 0.5;
		
		var sx = game.canvas.width / 2;
		var sy = game.canvas.height / 2;
		
		var mx = game.mouse.x;
		var my = game.mouse.y;
		
		this.player.dir(Math.atan2((my - sy), (mx - sx)) + Math.PI / 2);

	};

};

var SiphonBlob = function(x, y, id, size, color) {
	
	this.id = id;
	
	this.blob = new Blob(x, y, size, color);
	
	this.size = function(size) {
		
		return this.blob.size(size);
		
	};

	this.update = function(game) {};
	
	this.pos = function(x, y) {
		
		return this.blob.pos(x, y);
		
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
		" ": 32, "q": 81, "e": 69, "r": 82, "t": 84
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