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

        return new Promise(function (resolve, reject) {

            var onLoadComplete = function () {
                console.log("complete");
                scene.add(character);
                resolve(character.root);
            };
            var character = new Character();
            buildPlayer(player, character, onLoadComplete);
        });
    }

    function buildPlayer(player, character, onLoadComplete) {

        var cfg = {
            baseUrl: "models/character/",
            scene: scene,
            id: player.id,
            name: player.name,
            remote: player.remote,
            scale: .5,
            position: new THREE.Vector3(0, 15, 3),
            controls: new PlayerControls(),

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

        character.setConfig(cfg);
    }

    function createCharacter(player) {

        return new Promise(function (resolve, reject) {
            player.remote = false;

            var onLoadComplete = function () {
                console.log("complete");
                var gyro = new THREE.Gyroscope();
                gyro.position.set(0, 1, 0);
                gyro.add(camera);
                character.root.add(gyro);
                scene.add(character.root);

                resolve(character);
            };

            var character = new Character();
            buildPlayer(player, character, onLoadComplete);
        });
    }

    return {
        createPlayer: createPlayer,
        createCharacter: createCharacter,
        init : init
    };
}

module.exports =  new EntityService();