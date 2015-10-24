var socket = require('socket.io-client')();
var Game = require("game/game");
var game;

var GameCtrl = function ($scope) {

    if(!game) {
        game = Game();
    }

    $scope.game = {
        id: -1,
        player: {
            name: $scope.user.name,
            hp: 100
        }
    };

    socket.on('new game', function (game) {
        $scope.game = game;
        $scope.$apply();
    });
};

module.exports = GameCtrl;