var $ = require("jQuery");
var THREE = require("THREE");
require("game/loaders/ColladaLoader");
require("game/Gyroscope");
require("game/controls/OrbitControls");
require("game/Character");
var KeyboardControls = require("game/controls/KeyboardControls");

// reseau
var socket = require('socket.io-client')();

var Game = function () {
    var $container;

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
    var character;
    var players = [];

    init();
    animate();

    function addMap() {
        loader.load('models/map/map_1.dae', function (collada) {
            //dummy1.dae
            var dae = collada.scene;
            var skin = collada.skins[0];
            dae.position.set(0, 0, 0);//x,z,y- if you think in blender dimensions ;)

            scene.add(dae);
        });
    };

    function addLigth() {

        scene.add(new THREE.AmbientLight(0x777777));
        light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.position.set(-100, 200, 100);
        scene.add(light);
    }

    function createCharacter() {
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
        character.scale = 3;
        character.loadParts(stickmanCfg);
        character.enableShadows(true);
        character.setWeapon(0);
        character.setSkin(0);
        scene.add(character.root);

        return character;
    };

    function addPlayer() {

        character = createCharacter();
        character.controls = new KeyboardControls(character);
        //var gyro = new THREE.Gyroscope();
        //gyro.position.set(0,1,0);
        //gyro.add(camera);
        //character.root.add(gyro);

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
            clearAlpha: 1,
            clearColor: 0xccdddd
        });

        clock = new THREE.Clock();
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 40000);
        camera.position.set(0, 20, 20);
        scene.add(camera);
        cameraControls = new THREE.OrbitControls(camera,renderer.domElement);
        cameraControls.zoomSpeed = 1.2;
        cameraControls.panSpeed = 0.01;

        cameraControls.noZoom = false;
        cameraControls.noPan = false;
        cameraControls.noRotate = true;

        cameraControls.staticMoving = true;
        cameraControls.dynamicDampingFactor = 0.3;

        cameraControls.keys = [ 65, 83, 68 ];


        window.addEventListener('resize', function () {
            viewportWidth = $container.width();
            viewportHeight = $container.height();
            renderer.setSize(viewportWidth, viewportHeight);
            camera.aspect = viewportWidth / viewportHeight;
            camera.updateProjectionMatrix();
            cameraControls.handleResize();
        });
    };

    this.restore = function() {
        var $container = $("#game-container");

        $container.append(renderer.domElement);
        renderer.setSize($container.width(), $container.height());
    };

    function initNetwork() {
        socket.emit('new player', "");

        socket.on('new game', function (game) {
            console.log('new game');
        });

        socket.on('server:new player', function (msg) {
            console.log(msg);
            players.push(createCharacter());
        });

        socket.on('server:player move', function (delta, controls) {
            if (players.length > 0)
                players[0].updateFromData(delta, controls);
        });
    }

    function init() {


        initWorld();
        initColladaLoader();
        addMap();
        addLigth();
        addPlayer();
        initNetwork();

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
        character.update(delta);
        socket.emit('player move', delta, character.controls);

        cameraControls.update(delta);
    };
};


module.exports = Game;