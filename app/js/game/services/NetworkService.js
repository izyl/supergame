var _ = require("lodash");
var socket = require('socket.io-client')();
var entityService = require("game/services/EntityService");

var NetworkService = function () {

    var game;
    var $scope;

    function init(_game) {
        game = _game;
        $scope = game.$scope;

        var self = this;
        socket.on('server:start game', function (player) {
            $scope.$emit('toast', "Let's get started : " + player.name);
            $scope.$emit('player name', player.name);
            entityService.createCharacter(player).then(function (char) {
                game.character = char;
            });

        });

        socket.on('server:player list', function (newPlayers) {
            _.each(newPlayers, function (player) {
                console.log("new player : ", player);
                entityService.createPlayer(player).then(function (char) {
                    game.players.push(char);
                });
            });
        });

        socket.on('server:new player', function (remotePlayer) {
            console.log("new player : ", remotePlayer);
            $scope.$emit('toast', "New player : " + remotePlayer.name);
            entityService.createPlayer(remotePlayer).then(function (char) {
                game.players.push(char);
            });
        });

        socket.on('server:remove player', function (remotePlayer) {

            $scope.$emit('toast', "Player disconnected : " + remotePlayer.name);
            //console.log("server:remove player : ", remotePlayer);
            //console.log("players :", players);
            var disconnectedRemotePlayer = _.find(game.players, function(player){
                return remotePlayer.id == player.getId();
            });

            //console.log("removing player : ", disconnectedRemotePlayer);
            disconnectedRemotePlayer.destroy(game.scene);
            _.remove(game.players, function (player) {

                return player.id != remotePlayer.id;
            });
        });

        socket.on('server:player move', function (delta, remotePlayer) {
            //console.log("server:player move", delta, remotePlayer);
            var remotePlayerLocalInstance =_.find(game.players, function(player){
                return remotePlayer.id == player.getId();
            });
            //console.log("server:player move", remotePlayerLocalInstance);

            if (remotePlayerLocalInstance)
                remotePlayerLocalInstance.updateData(remotePlayer);
        });
    }

    // maybe refine : for example scale or bonus that affects character stats should be sent alone and only once
    function sendControls(delta) {

        var snapshot = {
            id : game.character.getId(),
            controls: game.character.getLastControl(),
            position: game.character.getRoot().position,
            ground: game.character.isOnGround(),
            collision: game.character.isOnCollision(),
            scale : game.character.getScale()
        };
        //console.log("client: sending new infos to server :", snapshot);
        socket.emit('client:player controls', delta, snapshot);
        console.log(snapshot);
    }

    return {
        init: init,
        sendControls: sendControls
    }
}


module.exports = new NetworkService();