var _ = require("lodash");
var socket = require('socket.io-client')();
var entityService = require("game/services/EntityService");

var NetworkService = function () {

    function init(_game) {

        var game = _game;
        var $scope = game.$scope;

        var self = this;
        socket.on('server:start game', function (player) {
            $scope.$emit('toast', "Let's get started : " + player.name);
            $scope.$emit('player name', player.name);
            player.remote = false;
            entityService.createCharacter(player).then(function (char) {
                game.character = char;
            });

        });

        socket.on('server:player list', function (newPlayers) {
            _.each(newPlayers, function (player) {
                player.remote = true;
                entityService.createPlayer(player).then(function (char) {
                    game.players.push(char);
                });
            });
        });

        socket.on('server:new player', function (remotePlayer) {
            //console.log("new player : ", remotePlayer);
            $scope.$emit('toast', "New player : " + remotePlayer.name);
            remotePlayer.remote = true;
            entityService.createPlayer(remotePlayer).then(function (char) {
                game.players.push(char);
            });
        });

        socket.on('server:remove player', function (remotePlayer) {

            $scope.$emit('toast', "Player disconnected : " + remotePlayer.name);
            //console.log("server:remove player : ", remotePlayer);
            //console.log("players :", players);
            var disconnectedRemotePlayer = _.find(players, {id: remotePlayer.id});

            //console.log("removing player : ", disconnectedRemotePlayer);
            disconnectedRemotePlayer.destroy(scene);
            _.remove(game.players, function (player) {

                return player.id != remotePlayer.id;
            });
        });

        socket.on('server:player move', function (delta, remotePlayer) {
            //console.log("server:player move", delta, remotePlayer);
            var remotePlayerLocalInstance = _.find(game.players, {id: remotePlayer.id});
            //console.log("server:player move", remotePlayerLocalInstance);

            if (remotePlayerLocalInstance)
                remotePlayerLocalInstance.updateData(remotePlayer);
        });
    }

    function sendControls(delta, snapshot) {
        //console.log("client: sending new infos to server :", snapshot);
        socket.emit('client:player controls', delta, snapshot);
    }

    return {
        init: init,
        sendControls: sendControls
    }
}


module.exports = new NetworkService();