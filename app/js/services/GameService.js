var Game = require("game/game");

var GameService = function () {
    var game;

    this.getGame = function ($scope) {
        if (!game) {
            game = new Game($scope);
        } else {
            game.restore();
        }
        return game;
    };

};

module.exports = GameService;