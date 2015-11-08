/* express : le socle du server */
var express = require('express');
var app = express();
var path = require('path');

/*******************************************/
/* Config du server express                */
/*******************************************/
app.use(express.static(__dirname + '/dist'));


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/index.html'));
});

/*******************************************/
/* Config du server io                */
/*******************************************/
var http = require('http').Server(app);
var io = require('socket.io')(http);

var Game = require("./server/Game.js");
var game = new Game();
var playerCounter = 0;

io.on('connection', function (socket) {

    socket.on('disconnect', function () {
        console.log('user disconnected');
        socket.broadcast.emit('server:remove player', game.getPlayer(socket.id));

        game.removePlayer(socket.id);
    });

    /**
     * data : {
     *  controls,
     *  position
     * }
     */
    socket.on('player move', function (delta, data) {

        console.log('player move: ', socket.id, data);
        var player = game.getPlayer(socket.id);
        console.log('player move: ', player);
        player.controls = data.controls;
        player.position = data.position;
        socket.broadcast.emit('server:player move', delta, player);
    });

    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);
        socket.broadcast.emit('chat message', msg);
    });

    console.log('client start game');

    socket.emit("player list", game.players);
    game.addPlayer({
        id: socket.id,
        count: ++playerCounter
    });
    socket.emit("server:start game", game.getPlayer(socket.id));
    console.log(game.players);
    socket.broadcast.emit('server:new player', game.getPlayer(socket.id));

});


http.listen(3000, function () {
    console.log('listening on *:3000');
});

module.exports = app;