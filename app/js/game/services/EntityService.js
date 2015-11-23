var THREE = require("THREE");
var Character = require("game/entities/Character");
require("game/controls/Gyroscope");
var PlayerControls = require("game/controls/PlayerControls");

var EntityService = function () {

    var scene;
    var camera;

    function init(game) {
        scene = game.scene;
        camera = game.camera
    }

    function createPlayer(player) {
        player.remote = true;

        return new Promise(function (resolve, reject) {
            var onLoadComplete = function () {
                scene.add(character.getRoot());
                resolve(character);
            };
            var character = buildPlayer(player, onLoadComplete);
        });
    }

    function buildPlayer(player, onLoadComplete) {

        var cfg = {
            baseUrl: "models/character/",
            scene: scene,
            id: player.id,
            name: player.name,
            remote: player.remote,
            scale: 1,
            position: new THREE.Vector3(0, 15, 3),

            body: "stickman.json",
            skins: ["stickman.png"],
            weapons: [],
            animations: {
                move: "run",
                idle: "stand",
                jump: "jump",
                attack: "attack",
                crouchMove: "cwalk",
                crouchIdle: "cstand",
                crouchAttach: "crattack"
            },
            callback: onLoadComplete
        };

        if (!player.remote) {
            cfg.controls = new PlayerControls();
        }

        return new Character(cfg);
    }

    function createCharacter(player) {
        player.remote = false;

        return new Promise(function (resolve, reject) {
            var onLoadComplete = function () {
                var gyro = new THREE.Gyroscope();
                gyro.position.set(0, 1, 0);
                gyro.add(camera);
                character.getRoot().add(gyro);
                scene.add(character.getRoot());

                resolve(character);
            };

            var character = buildPlayer(player, onLoadComplete);
        });
    }

    return {
        createPlayer: createPlayer,
        createCharacter: createCharacter,
        init: init
    };
}

module.exports = new EntityService();