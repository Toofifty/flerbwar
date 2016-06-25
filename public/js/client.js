/*
 * client.js - client side socket connection to the server
 */
 
/* global Player LocalControls SiphonBlob Map Camera Graphics $ io Keyboard 
log_message update_hs two_dec */

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
    
    $("#game").mousemove(function(event) {
        
        game.update_mouse(event.clientX, event.clientY);
        
    }).mousedown(function(event) {
        
        event.preventDefault();
        event.stopPropagation();
        
        game.mousedown(event.button);
        
    });

    var socket = io();

    socket.on("new player", function(data) {

        // prevent duplicate players
        if (game.get_player(data.id) != null) return;

        var noob = new Player(data.x, data.y, data.id);
        noob.set_name(data.name);
        noob.set_color(data.color);
        noob.set_dir(data.dir);
        noob.resize(data.size);
        game.add_player(noob);
        
        log_message(noob.name + " joined");

    });
    
    socket.on("del player", function(id) {
        
        var player = game.del_player(id);
        
        if (player == null) return;
        
        log_message(player.name + " left");
        
    });

    socket.on("confirm player", function(data) {

        game.local_player.set_id(data.id);
        //game.local_player.resize(data.size);

    });

    socket.on("soft update player", function(data) {

        var player = game.get_player(data.id);

        if (player == null) return;

        player.update_acc(data.ax, data.ay);
        player.resize(data.size);
        player.set_dir(data.dir);
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
    
    socket.on("new siphon", function(data) {
        
        var siphon = new SiphonBlob(data.x, data.y, 
            data.id, data.size, data.color);
            
        game.add_siphon(siphon);
        
    });
    
    socket.on("siphon update", function(data) {
        
        game.siphons[data.id].resize(data.size);
        
    });
    
    socket.on("self update", function(data) {
        
        var player = game.get_player(data.id);
        
        player.resize(data.size);
        
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
        
        mm_canvas: $("#minimap")[0],

        socket: socket,

        local_player: null,

        players: [],

        siphons: [],
        
        map: null,
        
        camera: null,
        
        mouse: {x: 0, y: 0, b: -1},

        keyboard: new Keyboard($(window)),

        init: function() {

            this.canvas.width = $(window).innerWidth();
            this.canvas.height = $(window).innerHeight();
            
            this.mm_canvas.width = $("#minimap").innerWidth();
            this.mm_canvas.height = $("#minimap").innerHeight();

            this.context = this.canvas.getContext("2d");
            this.mm_context = this.mm_canvas.getContext("2d");
            
            this.context.font = "20px Indie Flower";
            this.context.textAlign = "center";
            this.context.strokeStyle = "#FFF";

            this.interval = setInterval(update_game, 20);
            this.server_interval = setInterval(soft_update, 20);
            this.full_server_interval = setInterval(hard_update, 200);
            
            this.map = new Map();
            
            this.camera = new Camera(this.canvas.width, this.canvas.height);
            
            this.graphics = new Graphics(this);

        },

        clear: function() {

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.mm_context.clearRect(0, 0, this.mm_canvas.width, this.mm_canvas.height);

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
            
            for (var i in this.siphons) {
                this.siphons[i].update(this);
                this.siphons[i].draw(this);
            }

            for (var i in this.players) {
                if (this.players[i].id == this.local_player.id) continue;
                this.players[i].update(this);
                // players can be destroyed while in 'update'
                if (this.players[i] !== undefined) {
                    this.players[i].draw(this);
                }
            }
            
            // draw local player last
            this.local_player.update(this);
            this.local_player.draw(this);
            
            this.graphics.minimap_ring(this.local_player.x, this.local_player.y,
                this.local_player.blob.size);

        },

        soft_update: function() {

            this.socket.emit("soft update", this.local_player.soft_data());

        },

        hard_update: function() {

            this.socket.emit("hard update", this.local_player.hard_data());
            
            update_hs(this.players);

        },

        add_siphon: function(obj) {

            this.siphons.push(obj);

        },

        remove_siphon: function(obj) {

            var i = this.siphons.indexOf(obj);
            if (i > -1) this.siphons.splice(i, 1);

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
            
        },
        
        update_mouse: function(x, y) {
            
            this.mouse.x = x;
            this.mouse.y = y;
            
        },
        
        mousedown: function(b) {
            
            this.mouse.b = b;
            console.log(b);
            
        },
        
        total_mass: function() {
            
            var tm = 0;
            
            for (var i in this.siphons) tm += this.siphons[i].blob.size;
            for (var i in this.players) tm += this.players[i].blob.size;
            
            console.log(tm);
            
            return tm;
            
        },
        
        players_percentage: function(player) {
            
            player = player || this.local_player;
            
            return two_dec(player.blob.size / this.total_mass() * 100);
            
        }

    };

    game.init();

    game.add_local_player(new Player(game.map.size / 2, game.map.size / 2));

});