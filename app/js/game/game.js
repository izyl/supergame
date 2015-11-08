var $ = require("jQuery");
var THREE = require("THREE");
require("game/loaders/ColladaLoader");
require("game/Gyroscope");
require("game/controls/OrbitControls");
require("game/Character");
require("game/shaders/Sky");
var KeyboardControls = require("game/controls/PlayerControls");
var _ = require("lodash");

// reseau
var socket = require('socket.io-client')();

var Game = function ($scope) {
    var $container;

    // game controller angular scope for allowing feedback to angular views
    var $scope = $scope;

    // set the scene size
    var WIDTH = 1000, HEIGHT = 600;
    var SEGMENTS = 40;

    // set some camera attributes
    var VIEW_ANGLE = 90, ASPECT = WIDTH / HEIGHT, NEAR = 0.1, FAR = 10000;

    // WebGL renderer, camera and a scene
    var renderer;
    var clock;

    var nextGameTick = (new Date).getTime();
    var fps = 30;
    var max_frame_skip = 10;
    var skip_ticks = 1000 / fps;


    var camera;
    var scene;
    var loader;
    var cameraControls;

    var light;
    var map;
    var character;
    var players = [];

    init();

    function addMap() {
        loader.load('models/map/map_2.dae', function (collada) {
            map = collada.scene;
            map.position.set(0, 0, 0);

            collada.scene.traverse(function (node) {
                if (node.material) {
                    node.material.side = THREE.DoubleSide;
                }
            });

            scene.add(map);

            var skyShader = THREE.ShaderTypes['sky'];

            var skyGeo = new THREE.SphereGeometry(200, 20, 20);
            var skyMat = new THREE.ShaderMaterial({
                vertexShader: skyShader.vertexShader,
                fragmentShader: skyShader.fragmentShader,
                uniforms: skyShader.uniforms,
                side: THREE.BackSide
            });

            var sky = new THREE.Mesh(skyGeo, skyMat);
            scene.add(sky);
        });
    };

    function addLigth() {

        var ambientLight = new THREE.AmbientLight(0x333333); // 0.2
        scene.add(ambientLight);

        light = new THREE.DirectionalLight(0xffffff, 1.0);
        light.position.set(0, 200, 0);
        scene.add(light);
    }

    function createCharacter(player) {
        // CHARACTER
        var stickmanCfg = {
            baseUrl: "models/character/",

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
            }
        };

        var character = new Character();
        character.id = player.id;
        character.name = player.name;
        character.remote = player.remote;
        if (character.remote) {
            character.verticalVelocity = 0;
        }

        character.scale = 3;
        character.loadParts(stickmanCfg);
        character.enableShadows(true);
        character.setWeapon(0);
        character.setSkin(0);
        scene.add(character.root);

        return character;
    };

    function addPlayer(player) {

        character = createCharacter(player);
        character.controls = new KeyboardControls(character);
        var gyro = new THREE.Gyroscope();
        gyro.position.set(0, 1, 0);
        gyro.add(camera);
        character.root.add(gyro);

    };

    function initColladaLoader() {
        loader = new THREE.ColladaLoader();
        loader.options.convertUpAxis = true;
    };

    function initWorld() {
        var $container = $("#game-container");

        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            //clearAlpha: 1,
            clearColor: 0xccdddd
        });

        renderer.gammaInput = true;
        renderer.gammaOutput = true;

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.cullFace = THREE.CullFaceBack;

        clock = new THREE.Clock();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 40000);
        camera.position.set(0, 20, 20);
        scene.add(camera);
        cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
        cameraControls.zoomSpeed = 1.2;
        //cameraControls.noRotate = true;

        cameraControls.keys = [65, 83, 68];


        window.addEventListener('resize', function () {
            viewportWidth = $container.width();
            viewportHeight = $container.height();
            renderer.setSize(viewportWidth, viewportHeight);
            camera.aspect = viewportWidth / viewportHeight;
            camera.updateProjectionMatrix();
            cameraControls.handleResize();
        });
    };

    function restore() {
        var $container = $("#game-container");

        $container.append(renderer.domElement);
        renderer.setSize($container.width(), $container.height());
    };

    function initNetwork() {
        var self = this;
        socket.emit('new player');

        socket.on('server:start game', function (player) {
            $scope.$emit('toast', "Let's get started : " + player.name);
            addPlayer(player);
            restore();
        });

        socket.on('player list', function (newPlayers) {
            _.each(newPlayers, function (player) {
                player.remote = true;
                players.push(createCharacter(player));
            });
        });

        socket.on('server:new player', function (remotePlayer) {
            //console.log("new player : ", remotePlayer);
            $scope.$emit('toast', "New player : " + remotePlayer.name);
            remotePlayer.remote = true;
            players.push(createCharacter(remotePlayer));
        });

        socket.on('server:remove player', function (remotePlayer) {

            $scope.$emit('toast', "Player disconnected : " + remotePlayer.name);
            //console.log("server:remove player : ", remotePlayer);
            //console.log("players :", players);
            var disconnectedRemotePlayer = _.find(players, {id: remotePlayer.id});

            //console.log("removing player : ", disconnectedRemotePlayer);
            disconnectedRemotePlayer.destroy(scene);
            players = _.filter(players, function (player) {

                return player.id != remotePlayer.id;
            });
        });

        socket.on('server:player move', function (delta, remotePlayer) {
            console.log("server:player move", delta, remotePlayer);
            var remotePlayerLocalInstance = _.find(players, {id: remotePlayer.id});
            console.log("server:player move", remotePlayerLocalInstance);

            if (remotePlayerLocalInstance)
                remotePlayerLocalInstance.updateData(remotePlayer);
        });
    }

    function init() {


        initWorld();
        initColladaLoader();
        addMap();
        addLigth();
        initNetwork();

        animate();
        //stats = new Stats();
        //container.appendChild(stats.domElement);
    };

    function animate() {
        requestAnimationFrame(animate);
        render();
        update();
    };

    function render() {
        loops = 0;

        // Attempt to update as many times as possible to get to our nextGameTick 'timeslot'
        // However, we only can update up to 10 times per frame
        while ((new Date).getTime() > nextGameTick && loops < max_frame_skip) {
            update();
            nextGameTick += skip_ticks;
            loops++;
        }

        /*
         * If we fall really far behind in updates then we need to set nextGameTick to the current time to prevent the situation where nextGameTick is so
         * far ahead of our current update that we start running updates extremely fast
         */
        if (loops === max_frame_skip) {
            nextGameTick = (new Date).getTime();
        }

        renderer.render(scene, camera);
    }

    function update() {
        var delta = clock.getDelta();

        if (map) {

            if (character.checkControls()) {

                //console.log("client: sending new infos to server");
                socket.emit('player move', delta, {
                    controls: character.controls,
                    position: character.root.position
                });
            }
            character.update(delta, map.children);

            _.each(players, function (player) {
                player.update(delta);
            });
        }
        cameraControls.update(delta);
    };
};


module.exports = Game;