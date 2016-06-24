/*
 * client.js - client side socket connection to the server
 */
 
/* global Player LocalControls Map Camera Graphics $ io Keyboard log_message 
update_hs */

var game;

var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

function escape_html(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
}

$(document).ready(function() {
    
    $(window).resize(function(event) {
        game.resize();
    });

    var socket = io();

    socket.on("new player", function(data) {

        // prevent duplicate players
        if (game.get_player(data.id) != null) return;

        var noob = new Player(data.x, data.y, data.id);
        noob.set_name(data.name);
        noob.set_color(data.color);
        game.add_player(noob);
        
        log_message(noob.name + " joined");

    });
    
    socket.on("del player", function(id) {
        
        var player = game.del_player(id);
        
        if (player == null) return;
        
        log_message(player.name + " left");
        
    });

    socket.on("new id", function(id) {

        game.local_player.set_id(id);

    });

    socket.on("soft update player", function(data) {

        var player = game.get_player(data.id);

        if (player == null) return;

        player.update_acc(data.ax, data.ay);
        player.resize(data.size);
        player.reset_deadmarks();

    });

    socket.on("hard update player", function(data) {

        var player = game.get_player(data.id);

        if (player == null || player == game.local_player) return;

        player.move(data.x, data.y);

        player.update_acc(data.ax, data.ay);

    });
    
    socket.on("player name update", function(data) {
        
        if (data.id == game.local_player.id) {
            
            log_message("You are now known as " + data.name);
            return;
            
        }
        
        var player = game.get_player(data.id);
        
        if (player != null) {
            
            log_message(player.name + " is now known as " + data.name);
            player.set_name(data.name);
            
        }
        
    });
    
    socket.on("broadcast message", function(msg) {
        
       log_message(msg);
        
    });

    // looping functions
    var update_game = function() { game.update(); };
    var soft_update = function() { game.soft_update(); };
    var hard_update = function() { game.hard_update(); };

    /*
     * GAME object
     * Contains all game-specific data, including renderer, player list,
     * update loop etc
     */
    game = {

        canvas: $("#game")[0],

        socket: socket,

        local_player: null,

        players: [],

        objects: [],
        
        map: null,
        
        camera: null,

        keyboard: new Keyboard($(window)),

        init: function() {

            this.canvas.width = $(window).innerWidth();
            this.canvas.height = $(window).innerHeight();

            this.context = this.canvas.getContext("2d");
            
            this.context.font = "20px Comic Sans MS";
            this.context.textAlign = "center";
            this.context.strokeStyle = "#FFF";

            this.interval = setInterval(update_game, 20);
            this.server_interval = setInterval(soft_update, 20);
            this.full_server_interval = setInterval(hard_update, 2000);
            
            this.map = new Map();
            
            this.camera = new Camera(this.canvas.width, this.canvas.height);
            
            this.graphics = new Graphics(this);

        },

        clear: function() {

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        },
        
        resize: function() {

            this.canvas.width = $(window).innerWidth();
            this.canvas.height = $(window).innerHeight();
            
            this.context.font = "20px Comic Sans MS";
            this.context.textAlign = "center";
            
            this.camera.resize($(window).innerWidth(), $(window).innerHeight())
            
        },

        update: function() {

            this.clear();
            
            this.map.draw(this);
            
            this.controls.update(this);
            
            this.camera.update();
            
            for (var i in this.objects) {
                this.objects[i].update(this);
                this.objects[i].draw(this);
            }

            for (var i in this.players) {
                if (this.players[i].id == this.local_player.id) continue;
                this.players[i].update(this);
                // players can be destroyed while in 'update'
                if (this.players[i] !== undefined)
                    this.players[i].draw(this);
            }
            
            // draw local player last
            this.local_player.update(this);
            this.local_player.draw(this);

        },

        soft_update: function() {

            this.socket.emit("soft update", this.local_player.soft_data());

        },

        hard_update: function() {

            this.socket.emit("hard update", this.local_player.hard_data());
            
            update_hs(this.players);

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
        
        del_player: function(id) {
            
            if (id == this.local_player.id) return;
            
            for (var i in this.players) {
                
                if (this.players[i].id == id) {
                    
                    var p = this.players[i];
                    this.players.splice(i, 1);
                    return p;
                    
                }
                
            }
            
        },

        add_local_player: function(player) {

            this.controls = new LocalControls(player);
            this.camera.focus(player);
            this.camera.update();
            
            socket.emit("new player", {
                x: player.x, 
                y: player.y, 
                name: player.name,
                color: player.blob.color
            });

            this.local_player = player;
            this.add_player(player);
        
        },

        get_player: function(id) {

            for (var i in this.players) {

                if (this.players[i].id == id) return this.players[i];

            }

            return null;

        },
        
        set_local_player_name: function(name) {
            
            this.local_player.set_name(name);
            this.socket.emit("player name update", name);
            
        }

    };

    game.init();

    game.add_local_player(new Player(game.map.size / 2, game.map.size / 2));

});