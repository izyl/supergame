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
io.on('connection', function (socket) {
    console.log('a user connected');
});

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.broadcast.emit('server:new player', "a user connected");

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('player move', function (delta, controls) {
        //console.log('player move: ', delta, controls);
        socket.broadcast.emit('server:player move', delta, controls);
    });

    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);
        socket.broadcast.emit('chat message', msg);
    });
});


http.listen(3000, function () {
    console.log('listening on *:3000');
});

module.exports = app;