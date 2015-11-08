var _ = require("lodash");

var Player = function (data) {

    this.id = data.id;
    this.name = data.name;
    this.life = data.life;

    this.snapshots = [];
    this.pendingSnapshots = [];

    this.queue = function (snapshot) {
        this.pendingSnapshots.push(snapshot);
    };

    this.validate = function () {

        _(this.snapshots).concat(this.pendingSnapshots);
        this.pendingSnapshots = [];
    }
};

module.exports = Player;