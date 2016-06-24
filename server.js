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

// game variables
var players = [];

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

// game events
io.on("connection", function(socket){

    console.log(socket.id + " connected");

    socket.on("disconnect", function(){

        var i = get_player_index(this.id);
        
        if (i == -1) return;
        
        console.log(players[i].name + " left");
        
        players.splice(i, 1);
        
        this.broadcast.emit("del player", this.id);

    });

    socket.on("new player", function(data) {

        console.log(data.name + " joined");
        console.log(data);

        var noob = new Player(data.x, data.y, this.id);
        
        noob.set_name(data.name);
        noob.set_color(data.color);

        // send back id
        this.emit("new id", this.id);

        // broadcast to other players
        this.broadcast.emit("new player", noob.init_data());

        // get other players
        for (var i in players) {
            this.emit("new player", players[i].init_data());
        }

        // add to players
        players.push(noob);

    });

    /*
     * "soft update" - updates only the acceleration (x, y, r) and the size
     * of the player
     */
    socket.on("soft update", function(data) {

        var player = get_player(this.id);

        player.resize(data.size);
        player.update_acc(data.ax, data.ay);

        this.broadcast.emit("soft update player", player.soft_data());

    });

    /*
     * "hard update" - updates all "soft update" data, as well as current
     * position and rotation
     * runs less often than soft updates
     */
    socket.on("hard update", function(data) {

        var player = get_player(this.id);

        player.resize(data.size);
        player.update_acc(data.ax, data.ay);
        player.move(data.x, data.y);

        this.broadcast.emit("hard update player", player.hard_data());

    });
    
    socket.on("player name update", function(name) {
        
        var player = get_player(this.id);
        
        console.log(player.name + " is now " + name);
        
        player.set_name(name);
        
        this.broadcast.emit("player name update", {id: this.id, name: name});
        this.emit("player name update", {id: this.id, name: name});
        
    });
});