/*
 * server.js - handles client/server communication
 */

// dependencies
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);

var port = process.argv[2] || 3000;

// local
var Player = require("./player").Player;
var SiphonBlob = require("./player").SiphonBlob;

var sockets = [];

// game variables
var players = [];
var siphons = [];

var map_size = 4000;

// basic webserver
app.use(express.static("public"));

app.get("/", function(req, res) {
    
    res.sendFile(__dirname + "/public/index.html");
    
});

http.listen(port, function() {
    
    console.log("listening on *:" + port);
    
});

/*
 * get a player's position in the array using key
 * where key is either a player ID or player object
 */
var get_player_index = function(key) {
  
    for (var i in players)
        if (players[i].id == key || players[i] == key) return i;

    return -1;
    
};

/*
 * get a player from their ID
 */
var get_player = function(id) {
    
    var i = get_player_index(id);
    if (i > -1) return players[i];
    return null;
    
};

// set up siphons
for (var i = 0; i < 50; i++) {
    
    siphons.push(
        new SiphonBlob(Math.random() * map_size, Math.random() * map_size, i)
    );
    
}

var dist = function(x, y, x1, y1) {
    
    return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
    
};

// game logic loop
var game_loop = function() {
    
    if (players.length < 1) return;
    
    var changed_siphons = [];
    var changed_players = [];
    
    for (var i = 0; i < players.length; i++) {
        
        var pl = players[i];
        
        for (var j = i + 1; j < players.length; j++) {
            
            var oth = players[j];
            
            var max_dist = pl.size + oth.size;
            
            if (dist(pl.x, pl.y, oth.x, oth.y) < max_dist) {
                
                pl.absorb(oth);
                
                if (changed_players.indexOf(pl) == -1) changed_players.push(pl);
                if (changed_players.indexOf(oth) == -1) changed_players.push(oth);
                
            }
            
        }
        
        for (var j = 0; j < siphons.length; j++) {
            
            var oth = siphons[j];
            
            var max_dist = pl.size + oth.size;
            
            if (dist(pl.x, pl.y, oth.x, oth.y) < max_dist) {
                
                pl.absorb(oth);
                
                if (changed_siphons.indexOf(oth) == -1) changed_siphons.push(oth);
                if (changed_players.indexOf(pl) == -1) changed_players.push(pl);
                
            }
            
        }
        
    }
    
    for (var i in changed_players) {
        
        changed_players[i].socket.emit("self update", changed_players[i].self_data());
        
    }
    
    for (var i in players) {
        
        for (var j in changed_siphons) {
            
            players[i].socket.emit("siphon update", changed_siphons[j].soft_data());
            
        }
        
    }
    
};

// begin game loop
setInterval(game_loop, 25);

// game events
io.on("connection", function(socket){

    console.log(socket.id + " connected");

    socket.on("disconnect", function(){

        var i = get_player_index(this.id);
        
        if (i == -1) return;
        
        console.log(players[i].name + " left");
        
        players.splice(i, 1);
        sockets.splice(i, 1);
        
        this.broadcast.emit("del player", this.id);

    });

    socket.on("new player", function(data) {

        console.log(data.name + " joined");
        console.log(data);

        var noob = new Player(data.x, data.y, this.id);
        
        noob.set_name(data.name);
        noob.set_color(data.color);

        // send back player
        this.emit("confirm player", noob.init_data());

        // broadcast to other players
        this.broadcast.emit("new player", noob.init_data());

        // send other players
        for (var i in players) {
            this.emit("new player", players[i].init_data());
        }
        
        // send siphons
        for (var i in siphons) {
            this.emit("new siphon", siphons[i].init_data());
        }
        
        noob.socket = this;

        // add to players
        players.push(noob);
    
        sockets.push(this);

    });

    /*
     * "soft update" - updates only the acceleration (x, y, r) and the size
     * of the player
     */
    socket.on("soft update", function(data) {

        var player = get_player(this.id);
        
        if (player == null) return;

        player.update_acc(data.ax, data.ay);
        player.set_dir(data.dir);

        this.broadcast.emit("soft update player", player.soft_data());

    });

    /*
     * "hard update" - updates all "soft update" data, as well as current
     * position and rotation
     * runs less often than soft updates
     */
    socket.on("hard update", function(data) {

        var player = get_player(this.id);
        
        if (player == null) return;

        player.update_acc(data.ax, data.ay);
        player.move(data.x, data.y);

        this.broadcast.emit("hard update player", player.hard_data());

    });
    
    socket.on("player name update", function(name) {
        
        var player = get_player(this.id);
        
        if (player == null) return;
        
        console.log(player.name + " is now " + name);
        
        player.set_name(name);
        
        this.broadcast.emit("player name update", {id: this.id, name: name});
        this.emit("player name update", {id: this.id, name: name});
        
    });
    
    socket.on("debug resize", function(size) {
        
        var player = get_player(this.id);
        
        if (player != null) player.resize(size);
        
    });
});