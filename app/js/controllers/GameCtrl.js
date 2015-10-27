var socket = require('socket.io-client')();

var GameCtrl = function ($scope, GameService) {

    var game = GameService.getGame();
    game.restore();
    $scope.gameData = {
        id: -1,
        player: {
            name: $scope.user.name,
            hp: 100
        }
    };

    socket.on('new game', function (gameData) {
        $scope.gameData = gameData;
        $scope.$apply();
    });
};

module.exports = GameCtrl;