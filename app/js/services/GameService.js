var Game = require("game/game");

var GameService = function () {
    var game;

    this.getGame = function ($scope) {
        if (!game) {
            game = new Game($scope);
        }
        return game;
    };

};

module.exports = GameService;