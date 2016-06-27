/*
 * local and network player classes
 */
 
/* global log_message format_mass */

var MAX_MASS = 250000, MIN_MASS = 0.1, COOLDOWN = 20;

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

var Blob = function(x, y, mass, color) {
	
	var self = this;

	this.x = x;
	this.y = y;
	
	this._mass = mass;
	this._color = color;
	
	// list of text drops
	this.drops = [];
	
	// single drop
	this.drop = null;
	
	this.mass_goal = this._mass;

	this.debug_reduce = function(game) {

		this.mass(this._mass / 1.03);
		
		game.socket.emit("debug resize", this.mass());

	};

	this.debug_increase = function(game) {

		this.mass(this._mass * 1.03);
		
		game.socket.emit("debug resize", this.mass());

	};

	this.draw = function(game) {
		
		if (this.mass_goal != this._mass) {
			
			this._mass += (this.mass_goal - this._mass) / 20;
			
		}
		
		game.graphics.circle(this.x, this.y, this.radius(), this.color());
		
		game.graphics.minimap_dot(this.x, this.y, this.radius(), this.color());
		
		if (this.drop != null) {
			
			game.graphics.text(
				this.drop.text, this.x, 
				this.y + this.radius() / 2 + this.drop.y, 
				"rgba(255,255,255," + (1 - this.drop.y / this.radius()) + ")"
			);
			
			this.drop.y += this.radius() / (2 *this.drop.timeout / 20);
			
		}
		
		for (var i in this.drops) {
			
			var d = this.drops[i];
			
			game.graphics.text(
				d.text, this.x, 
				this.y + this.radius() / 2 + d.y, 
				"rgba(255,255,255," + (1 - d.y / this.radius()) + ")"
			);
			
			d.y += this.radius() / (2 * d.timeout / 20);
			
		}

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
	
	/* mass, AKA the area of the blob */
	this.mass = function(mass) {
		
		if (mass !== undefined) {
			
			var diff = mass - this.mass_goal;
			
			if (diff == 0) return this.mass_goal;
			
			var sign = diff >= 0 ? "+" : "-";
			
			this.add_drop(sign + format_mass(Math.abs(diff)), 500);
			
			this.mass_goal = mass;
			
			if (this.mass_goal > MAX_MASS) this.mass_goal = MAX_MASS;
			if (this.mass_goal < MIN_MASS) this.mass_goal = MIN_MASS;
			
		}
		
		return this.mass_goal;
		
	};
	
	this.radius = function() {
		
		return Math.sqrt(this._mass / Math.PI);
		
	};
	
	this.color = function(color) {
		
		if (color !== undefined) this._color = color;
		
		return this._color;
		
	};
	
	this.add_drop = function(text, timeout) {
		
		this.drop = {
			id: parseInt(Math.random() * 1000).toString(),
			text: text,
			y: 0,
			timeout: timeout
		};
		
		//this.drops.push(drop);
		
		setTimeout(this.delete_drop, timeout);
		
	};
	
	this.delete_drop = function() {
		
		// if (self.drops.length >= 1)
		// 	self.drops.splice(0, 1);
		
		this.drop = null;
		
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
	
	this.goal_dir = 0;
	
	this.deadmarks = 0;
	
	this.shoot = function(game) {
		
		if (this.cooldown > 0) return;
		
		var speed = Math.sqrt(this.radius()) / 2;
		
		var id = parseInt(Math.random() * 1000, 10);
		
		game.add_projectile(new Projectile(id, this.pos().x, 
			this.pos().y, Math.sin(this.dir()) * speed + this.vx, 
			-Math.cos(this.dir()) * speed + this.vy, this.projectile_mass(), this.color(), 
			this._id));
		
		game.socket.emit("player shoot", this.hard_data());
		
		setTimeout(function() {
			
			game.del_projectile(id);
			
		}, 4000);
		
		this.reduce(this.projectile_mass());
		
		this.cooldown = COOLDOWN;
		
	};
	
	this.add_drop = function(text) {
		
		this.blob.add_drop(text, 500);
		
	};
	
	this.reduce = function(mass) {
		
		this.mass(this.mass() - mass);
		
		this.add_drop("-" + format_mass(mass));
		
	};
	
	this.increase = function(mass) {
		
		this.mass(this.mass() + mass);
		
		this.add_drop("+" + format_mass(mass));
		
	};
	
	
	this.debug_reduce = function(mass, game) {
		
		mass = 100 * mass;
		
		game.socket.emit("debug resize", this.mass(this.mass() - mass));
		
		this.add_drop("-" + format_mass(mass));
		
	};
	
	this.debug_increase = function(mass, game) {
		
		mass = 100 * mass;
		
		game.socket.emit("debug resize", this.mass(this.mass() + mass));
		
		this.add_drop("+" + format_mass(mass));
		
	};
	
	this.projectile_mass = function() {
		
		return Math.sqrt(this.mass() * 100) / 100;
		
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
	
	this.mass = function(mass) {
		
		return this.blob.mass(mass);
		
	};
	
	this.radius = function() {
		
		return this.blob.radius();
		
	};
	
	this.dir = function(dir) {
		
		if (dir !== undefined) this.goal_dir = dir;
		
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
		
		// this._dir = (this._dir + 2 * Math.PI) % (2 * Math.PI);
		// this.goal_dir = (this.goal_dir + 2 * Math.PI) % (2 * Math.PI);
		
		// var rot = Math.min(Math.PI * 2, Math.max(Math.PI / 10 / this.radius(), 0.01));
		
		// if (this._dir < this.goal_dir) {
			
		// 	if (this.goal_dir - Math.PI > this._dir) this._dir -= rot;
		// 	else this._dir += rot;
			
		// } else if (this._dir > this.goal_dir) {
			
		// 	if (this.goal_dir + Math.PI < this._dir) this._dir += rot;
		// 	else this._dir -= rot;
			
		// }
		
		// if (Math.abs(this.goal_dir - this._dir) <= rot)
			this._dir = this.goal_dir;

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
			
		game.graphics.pointer(p.x, p.y, this.radius() * 17/16, "#FFF",
			this.dir());
		
		game.graphics.pointer(p.x, p.y, this.radius(), this.color(), this.dir());

		this.blob.draw(game);
			
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

var Projectile = function(id, x, y, vx, vy, mass, color, pid) {
	
	this._id = id;
	
	this.vx = vx;
	this.vy = vy;
	
	this.blob = new Blob(x, y, mass, color);
	
	this.pid = pid;
	
	this.id = function(id) {
		
		if (id !== undefined) this._id = id;
		
		return this._id;
		
	};
	
	this.mass = function(mass) {
		
		return this.blob.mass(mass);
		
	};
	
	this.radius = function() {
		
		return this.blob.radius();
		
	};
	
	this.update = function(game) {
		
		this.blob.move(this.vx, this.vy);
		
		// check if dead
		
		for (var i in game.players) {
			
			var pl = game.players[i];
			
			if (pl.id() == this.pid) continue;
			
			var max_dist = pl.radius() + this.radius();
			
			if (dist(this.pos(), pl.pos()) < max_dist) {
				
				game.del_projectile(this._id);
				
			}
			
		}
		
		for (var i in game.siphons) {
			
			var si = game.siphons[i];
			
			var max_dist = si.radius() + this.radius();
			
			if (dist(this.pos(), si.pos()) < max_dist) {
				
				game.del_projectile(this._id);
				
			}
			
		}
		
	};
	
	this.pos = function(x, y) {
		
		return this.blob.pos(x, y);
		
	};
	
	this.draw = function(game) {
		
		this.blob.draw(game);
		
	};
	
};

var LocalControls = function(player) {

	this.player = player;

	this.update = function(game) {
		
		var acc = 100 * 0.1 / Math.pow((this.player.radius() + 2.5), 0.25);

		if (game.keyboard.is_down("w")) this.player.accelerate(0, -acc);
		if (game.keyboard.is_down("a")) this.player.accelerate(-acc, 0);
		if (game.keyboard.is_down("s")) this.player.accelerate(0, acc);
		if (game.keyboard.is_down("d")) this.player.accelerate(acc, 0);
		
		if (game.keyboard.is_down("e")) this.player.debug_reduce(this.player.projectile_mass(), game);
		if (game.keyboard.is_down("q")) this.player.debug_increase(this.player.projectile_mass(), game);
		
		if (game.keyboard.is_down(" ") || game.mouse.b > -1) this.player.shoot(game);
		
		game.camera.scale_goal = 20 / this.player.radius() + 1;
		
		var sx = game.canvas.width / 2;
		var sy = game.canvas.height / 2;
		
		var mx = game.mouse.x;
		var my = game.mouse.y;
		
		this.player.dir(Math.atan2((my - sy), (mx - sx)) + Math.PI / 2);

	};

};

var SiphonBlob = function(x, y, id, mass, color) {
	
	this.id = id;
	
	this.blob = new Blob(x, y, mass, color);
	
	this.mass = function(mass) {
		
		return this.blob.mass(mass);
		
	};
	
	this.radius = function() {
		
		return this.blob.radius();
		
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

		//console.log("Key " + event.keyCode);

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