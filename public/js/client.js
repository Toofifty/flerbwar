/*
 * client.js - client side socket connection to the server
 */
 
/* global Player LocalControls SiphonBlob Projectile Map Camera Graphics $ io 
Keyboard log_message update_hs two_dec update_info */

var game;

var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
 };

var escape_html = function(string) {
    
    return String(string).replace(/[&<>"'\/]/g, function(s) {
        
      return entityMap[s];
      
    });
    
};

$(document).ready(function() {
    
    console.log("dont hack pls kyle");
    
    // window resizing
    $(window).resize(function(event) {
        
        game.resize();
        
    });
    
    // game mouse updating
    $("#game").mousemove(function(event) {
        
        game.update_mouse(event.clientX, event.clientY);
        
    }).mousedown(function(event) {
        
        event.preventDefault();
        event.stopPropagation();
        
        game.mousedown(event.button);
        
    }).mouseup(function() {
        
        game.mouseup();
        
    });

    var socket = io();

    socket.on("new player", function(data) {

        // prevent duplicate players
        if (game.get_player(data.id) != null) return;

        var noob = new Player(data.x, data.y, data.id);
        
        noob.name(data.name);
        noob.color(data.color);
        noob.dir(data.dir);
        noob.mass(data.mass);
        
        game.add_player(noob);
        
        log_message(noob.name() + " joined");
        log_message("There are now " + game.players.length 
            + " players online.");

    });
    
    socket.on("del player", function(id) {
        
        var player = game.del_player(id);
        
        if (player == null) return;
        
        log_message(player.name() + " left");
        log_message("There are now " + game.players.length 
            + " players online.");
        
    });

    socket.on("confirm player", function(data) {

        game.local_player.id(data.id);
        game.local_player.mass(data.mass);

    });

    socket.on("soft update player", function(data) {

        var player = game.get_player(data.id);

        if (player == null) return;

        player.vel(data.vx, data.vy);
        player.mass(data.mass);
        player.dir(data.dir);
        player.reset_deadmarks();

    });

    socket.on("hard update player", function(data) {

        var player = game.get_player(data.id);

        if (player == null || player == game.local_player) return;

        player.pos(data.x, data.y);

        player.vel(data.vx, data.vy);

    });
    
    socket.on("player name update", function(data) {
        
        if (data.id == game.local_player.id()) {
            
            log_message("You are now known as " + data.name);
            return;
            
        }
        
        var player = game.get_player(data.id);
        
        if (player != null) {
            
            log_message(player.name() + " is now known as " + data.name);
            player.name(data.name);
            
        }
        
    });
    
    socket.on("broadcast message", function(msg) {
        
       log_message(msg);
        
    });
    
    socket.on("new siphon", function(data) {
        
        var siphon = new SiphonBlob(data.x, data.y, 
            data.id, data.mass, data.color);
            
        game.add_siphon(siphon);
        
    });
    
    socket.on("siphon update", function(data) {
        
        game.siphons[data.id].mass(data.mass);
        
    });
    
    socket.on("siphon refresh", function(data) {
        
        var siphon = game.get_siphon(data.id);
        
        if (siphon == null) {
            
            siphon = new SiphonBlob(data.x, data.y, data.id, data.mass, 
                data.color);
                
        } else {
            
            siphon.mass(data.mass);
            siphon.pos(data.x, data.y);
            
        }
        
    });
    
    socket.on("self update", function(data) {
        
        var player = game.get_player(data.id);
        
        if (player == null) return;
        
        player.mass(data.mass);
        
    });
    
    socket.on("new projectile", function(data) {
        
        var proj = new Projectile(data.id, data.x, data.y, data.vx, data.vy,
            data.mass, data.color, data.pid);
            
        game.add_projectile(proj);
        
    });
    
    socket.on("del projectile", function(id) {
        
        game.del_projectile(id); 
        
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

        players: [],
        local_player: null,
        siphons: [],
        projectiles: [],
        
        map: new Map(),
        camera: null,
        
        mouse: {x: 0, y: 0, b: -1},

        keyboard: new Keyboard($(window)),

        /* initialise the game canvases, and begin game loop intervals */
        init: function() {

            this.canvas.width = $(window).innerWidth();
            this.canvas.height = $(window).innerHeight();
            
            this.mm_canvas.width = $("#minimap").innerWidth();
            this.mm_canvas.height = $("#minimap").innerHeight();

            this.context = this.canvas.getContext("2d");
            this.mm_context = this.mm_canvas.getContext("2d");
            
            this.context.font = "20px Nova Square";
            this.context.textAlign = "center";
            this.context.strokeStyle = "#FFF";

            this.interval = setInterval(update_game, 20);
            this.server_interval = setInterval(soft_update, 20);
            this.full_server_interval = setInterval(hard_update, 200);
            
            this.camera = new Camera(this.canvas.width, this.canvas.height);
            
            this.graphics = new Graphics(this);

        },

        /* clear both canvases before the next frame */
        clear: function() {

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.mm_context.clearRect(0, 0, this.mm_canvas.width, 
                this.mm_canvas.height);

        },
        
        /* update canvas width and height to prevent stretching */
        resize: function() {

            this.canvas.width = $(window).innerWidth();
            this.canvas.height = $(window).innerHeight();
            
            this.context.font = "20px Nova Square";
            this.context.textAlign = "center";
            
            this.camera.resize($(window).innerWidth(), $(window).innerHeight());
            
        },

        /* draw all objects - map, siphons, players, projectiles */
        update: function() {

            this.clear();
            
            this.map.draw(this);
            //this.map.draw_minimap(this);
            
            this.controls.update(this);
            
            this.camera.update();
            
            for (var i in this.siphons) {
                
                this.siphons[i].update(this);
                this.siphons[i].draw(this);
                
            }

            for (var i in this.players) {
                
                if (this.players[i].id() == this.local_player.id()) continue;
                
                this.players[i].update(this);
                
                // players may be destroyed while in 'update'
                if (this.players[i] !== undefined)
                    this.players[i].draw(this);
                    
            }
            
            // draw local player last
            this.local_player.update(this);
            this.local_player.draw(this);
            
            this.graphics.minimap_ring(
                this.local_player.pos().x, 
                this.local_player.pos().y,
                this.local_player.radius()
            );
            
            for (var i in this.projectiles) {
                
                this.projectiles[i].update(this);
                
                if (this.projectiles[i] !== undefined)
                    this.projectiles[i].draw(this);
                
            }
            
            update_info(this.local_player);

        },

        /* send a small update to the server */
        soft_update: function() {

            this.socket.emit("soft update", this.local_player.soft_data());

        },

        /* send a full update to the server, and update highscores */
        hard_update: function() {

            this.socket.emit("hard update", this.local_player.hard_data());
            
            update_hs(this.players);

        },

        add_siphon: function(obj) {

            this.siphons.push(obj);

        },
        
        get_siphon: function(id) {
            
            for (var i in this.siphons) {
                
                if (this.siphons[i].id == id) {
                    
                    return this.siphons[i];
                    
                }
                
            }
            
            return null;
            
        },

        remove_siphon: function(obj) {

            var i = this.siphons.indexOf(obj);
            if (i > -1) this.siphons.splice(i, 1);

        },

        add_player: function(player) {

            this.players.push(player);

        },
        
        del_player: function(id) {
            
            if (id == this.local_player.id()) return;
            
            for (var i in this.players) {
                
                if (this.players[i].id() == id) {
                    
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
                x: player.pos().x, 
                y: player.pos().y, 
                name: player.name(),
                color: player.color()
            });

            this.local_player = player;
            this.add_player(player);
        
        },

        get_player: function(id) {

            for (var i in this.players) {

                if (this.players[i].id() == id) return this.players[i];

            }

            return null;

        },
        
        set_local_player_name: function(name) {
            
            this.local_player.name(name);
            this.socket.emit("player name update", name);
            
        },
        
        update_mouse: function(x, y) {
            
            this.mouse.x = x;
            this.mouse.y = y;
            
        },
        
        mousedown: function(b) {
            
            this.mouse.b = b;
            
        },
        
        mouseup: function() {
            
            this.mouse.b = -1;
            
        },
        
        total_mass: function() {
            
            var tm = 0;
            
            for (var i in this.siphons) tm += this.siphons[i].mass();
            for (var i in this.players) tm += this.players[i].mass();
            for (var i in this.projectiles) tm += this.projectiles[i].mass();
            
            return tm;
            
        },
        
        players_percentage: function(player) {
            
            player = player || this.local_player;
            
            return player.mass() / this.total_mass() * 100;
            
        },
        
        add_projectile: function(projectile) {
            
            this.projectiles.push(projectile);
            
        },
        
        del_projectile: function(id) {
            
            for (var i in this.projectiles) {
                
                if (this.projectiles[i].id() == id) {
                    
                    var p = this.projectiles[i];
                    this.projectiles.splice(i, 1);
                    return p;
                    
                }
                
            }
            
        }

    };

    game.init();

    game.add_local_player(new Player(game.map.size / 2, game.map.size / 2));

});