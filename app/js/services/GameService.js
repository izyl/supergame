var Game = require("game/game");

var GameService = function () {
    var game;

    this.getGame = function () {
        if (!game) {
            game = new Game();
        }
        return game;
    };

};

module.exports = GameService;