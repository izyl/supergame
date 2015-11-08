var _ = require("lodash");
var Player = require("./Player");

var Game = function () {

    this.players = [];
    /**
     *
     * @param id : player id
     * @param snapshot
     */
    this.addSnapshot = function (id, snapshot) {
        var player = this.getPlayer(id);
        player.queue(snapshot);
    };

    this.getPlayer = function (id) {
        return _.find(this.players, {id: id});
    }

    this.addPlayer = function (player) {
        var player = new Player({id: player.id, name: 'Super gamer ' + player.count, life: 100});
        this.players.push(player);
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