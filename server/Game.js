var _ = require("lodash");

var Game = function () {

    this.players = [];

    this.getPlayer = function (id) {
        return _.find(this.players, {id: id});
    }

    this.addPlayer = function (player) {
        this.players.push({id: player.id, name: 'Super gamer ' + player.count, life: 100, controls: {}});
    }

    this.removePlayer = function (id) {

        console.log("removing player : ", id);
        this.players = _.filter(this.players, function (player) {

            return player.id != id;
        });
        console.log("players : ", this.players);
    }
};

module.exports = Game;