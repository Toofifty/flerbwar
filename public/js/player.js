/*
 * local and network player classes
 */

var two_dec = function(num) {
	return parseInt(num * 100) / 100;
}

var Blob = function(x, y, size, color) {

	this.x = x;
	this.y = y;
	this.size = size || parseInt(Math.random() * 100);
	this.color = color || parseInt(Math.random() * 255);

	this.reduce = function() {

		this.size /= 1.1;

	}

	this.increase = function() {

		this.size *= 1.1;

	}

	this.draw = function(game) {

		game.context.beginPath();
		game.context.fillStyle = "hsl(" + this.color + ", 50%, 50%)";
		game.context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		game.context.fill();
		game.context.stroke();

	}

	this.move = function(x, y) {

		this.x = parseInt(x);
		this.y = parseInt(y);

	}

}

var Player = function(x, y, id) {

	// screen position (int)
	this.x = x;
	this.y = y;

	// acceleration (2-dec float)
	this.ax = 0;
	this.ay = 0;
	
	this.id = id || -1;

	this.blob = new Blob(x, y, 20);

	this.reduce = function() { this.blob.reduce(); }
	this.increase = function() { this.blob.increase(); }

	this.move = function(x, y) {

		this.x = x;
		this.y = y;

	}

	this.update_acc = function(ax, ay) {

		this.ax = ax;
		this.ay = ay;

	}

	/* apply acceleration and calculate new position */
	this.update = function(game) {

		console.log(this.ax);

		this.x += this.ax;
		this.y += this.ay;

		this.ax = two_dec(this.ax / 1.1);
		this.ay = two_dec(this.ay / 1.1);

		this.blob.move(this.x, this.y);

	}

	this.draw = function(game) {

		this.blob.draw(game);

	}

}

var LocalPlayer = function(x, y) {

	this.player = new Player(x, y);

	this.set_id = function(id) { this.player.id = id; }

	this.update = function(game) {

		if (game.keyboard.is_down("w")) this.player.ay -= 1;
		if (game.keyboard.is_down("a")) this.player.ax -= 1;
		if (game.keyboard.is_down("s")) this.player.ay += 1;
		if (game.keyboard.is_down("d")) this.player.ax += 1;
		if (game.keyboard.is_down("e")) this.player.reduce();
		if (game.keyboard.is_down("q")) this.player.increase();

		this.player.update();

	}

	this.draw = function(game) {

		this.player.draw(game);

	}

	this.regular_data = function() {

		return {
			id: this.player.id,
			ax: this.player.ax,
			ay: this.player.ay,
			size: this.player.blob.size
		}

	}

	this.full_data = function() {

		return {
			id: this.player.id,
			ax: this.player.ax,
			ay: this.player.ay,
			size: this.player.blob.size,
			x: this.player.x,
			y: this.player.y
		}

	}

}

var Keyboard = function(elem) {

	var self = this;

	this.keys = [];

	// shortcut for common keys
	this.keymap = {
		"w": 87, "a": 65, "s": 83, "d": 68,
		"space": 32, "q": 81, "e": 69
	};

	elem.keydown(function(event) {

		event.stopPropagation();
		event.preventDefault();

		if (self.keys.indexOf(event.keyCode) == -1)
			self.keys.push(event.keyCode);

		console.log(event.keyCode);

	}).keyup(function(event) {

		self.keys.splice(self.keys.indexOf(event.keyCode), 1);

	});

	this.is_down = function(key) {

		if (typeof key == "string") {

			return this.is_down(this.keymap[key]);

		} else {

			return this.keys.indexOf(key) > -1;

		}

	}

}