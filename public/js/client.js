/*
 * client.js - client side socket connection to the server
 */

$(document).ready(function() {

	var socket = io();

	var players = [];

	socket.on("new player", function(data) {

		console.log(data);
		game.add_player(new Player(data.x, data.y, data.id));

	});

	socket.on("new id", function(id) {

		game.local_player.set_id(id);
		console.log("set id to " + id);

	});

	socket.on("update player", function(data) {

		var player = game.get_player(data.id);

		if (player == null) return;

		player.update_acc(data.ax, data.ay);

	});

	socket.on("full update player", function(data) {

		var player = game.get_player(data.id);

		if (player == null) return;

		player.move(data.x, data.y);

		if (player == game.local_player) return;

		player.update_acc(data.ax, data.ay);

	});

	var update_game = function() {
		game.update();
	}

	var update_server = function() {
		game.update_server();
	}

	var full_update_server = function() {
		game.full_update_server();
	}

	var game = {

		canvas: $("#game")[0],

		socket: socket,

		local_player: null,

		players: [],

		objects: [],

		keyboard: new Keyboard($(window)),

		init: function() {

			this.canvas.width = $(window).innerWidth();
			this.canvas.height = $(window).innerHeight();

			this.context = this.canvas.getContext("2d");

			this.interval = setInterval(update_game, 20);
			this.server_interval = setInterval(update_server, 20);
			this.full_server_interval = setInterval(full_update_server, 2000);

			this.context.fillStyle = "hsl(0,50%,50%)";
			this.context.fillRect(50, 50, 150, 150);

		},

		clear: function() {

			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		},

		update: function() {

			this.clear();
			for (i in this.objects) {
				this.objects[i].update(this);
				this.objects[i].draw(this);
			}

			for (i in this.players) {
				this.players[i].update(this);
				this.players[i].draw(this);
			}

		},

		update_server: function() {

			this.socket.emit("update", this.local_player.regular_data());

		},

		full_update_server: function() {

			this.socket.emit("full update", this.local_player.full_data());

		},

		add_object: function(obj) {

			this.objects.push(obj);

		},

		remove_object: function(obj) {

			var i = this.objects.indexOf(obj);
			if (i > -1) this.objects.splice(i, 1);

		},

		add_player: function(player) {

			this.players.push(player);

		},

		add_local_player: function(player) {

			socket.emit("new player", {x: player.player.x, y: player.player.y});

			this.local_player = player;
			this.add_player(player);
		
		},

		get_player: function(id) {

			for (var i in this.players) {

				if (this.players[i].id == id) return this.players[i];

			}

			return null;

		}

	}

	game.init();

	game.add_local_player(new LocalPlayer(500, 500));

});