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
     *  controls : {
     *      up,...
     *      timestamp
     *  },
     *  position
     * }
     */
    socket.on('client:player controls', function (delta, data) {

        //console.log('player move: ', socket.id, data);
        var player = game.getPlayer(socket.id);
        //console.log('player move: ', player);

        var snapshot = {
            controls: data.controls,
            position: data.position

        }

        player.queue(snapshot);

        socket.broadcast.emit('server:player move', delta, {
            id: socket.id,
            controls: snapshot.controls,
            position: snapshot.position
        });
    });

    socket.on('client:chat message', function (msg) {
        console.log('message: ' + msg);
        socket.broadcast.emit('server:chat message', msg);
    });

    console.log('client start game');

    socket.emit("server:player list", game.players);
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