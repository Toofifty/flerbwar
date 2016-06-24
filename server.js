/*
 * server.js - handles client/server communication
 */

// dependencies
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);

// local
var Player = require("./player").Player;

// game variables
var players = [];

// basic webserver
app.use(express.static("public"));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/public/index.html");
})

http.listen(3000, function() {
    console.log("listening on *:3000");
});

var get_player = function(id) {
    for (var i in players) 
        if (players[i].id == id) return players[i];
    return null;
}

var del_player = function(id) {
    var p;
    for (var i in players) {
        if (players[i].id == id) { 
            p = i;
            break;
        }
    }

    if (i > -1)
        players.splice(i, 1);
}

// game events
io.on("connection", function(socket){

    console.log(socket.id + " connected");

    socket.on("disconnect", function(){

        console.log(this.id + " disconnected");
        del_player(this.id);

    });

    socket.on("new player", function(data) {

        console.log("New player " + this.id + " joined");
        console.log(data);

        var noob = new Player(data.x, data.y, this.id);

        // send back id
        this.emit("new id", this.id);

        // broadcast to other players
        this.broadcast.emit("new player", noob.as_data());

        // get other players
        for (i in players) {
            this.emit("new player", players[i].as_data());
        }

        // add to players
        players.push(noob);

    });

    socket.on("update", function(data) {

        var player = get_player(this.id);

        player.update_acc(data.ax, data.ay);

        this.broadcast.emit("update player", player.regular_data());

    });

    socket.on("full update", function(data) {

        var player = get_player(this.id);

        player.update_acc(data.ax, data.ay);
        player.move(data.x, data.y);

        this.broadcast.emit("full update player", player.full_data());

    });
});