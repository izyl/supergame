var socket = require('socket.io-client')();

var GameCtrl = function ($scope, GameService) {
    var game = GameService.getGame();

    $scope.gameData = {
        id: -1,
        player: {
            name: $scope.user.name,
            hp: 100
        }
    };

    this.getGame = function(){

        return GameService.getGame();
    }
};

module.exports = GameCtrl;