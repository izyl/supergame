var $ = require("jQuery");
var THREE = require("THREE");
require("game/loaders/ColladaLoader");
require("game/Gyroscope");
require("game/controls/OrbitControls");
require("game/Character");
var KeyboardControls = require("game/controls/PlayerControls");
var _ = require("lodash");

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
    var map;
    var character;
    var players = [];

    // collision
    var rayBot = new THREE.Vector3(0, -1, 0);
    var caster = new THREE.Raycaster();

    init();

    function addMap() {
        loader.load('models/map/map_1.dae', function (collada) {
            //dummy1.dae
            map = collada.scene;
            var skin = collada.skins[0];
            map.position.set(0, 0, 0);//x,z,y- if you think in blender dimensions ;)

            scene.add(map);
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
        cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
        cameraControls.zoomSpeed = 1.2;
        cameraControls.noRotate = true;

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

    this.restore = function () {
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

    function collisions() {

        if (!character.meshBody) return;

        // collision bot
        var originPoint = character.root.position.clone();
        var ray = new THREE.Vector3(0, -1, 0);
        caster.set(originPoint, ray);
        var collisions = caster.intersectObjects(map.children[0].children);
        if (!_.isEmpty(collisions) && collisions[0].distance < 1) {
            character.isOnObject = true;
        } else {
            character.isOnObject = false;
        }

        // collision front
        var matrix = new THREE.Matrix4();
        matrix.extractRotation( character.root.matrix );
        ray = new THREE.Vector3( 0, 0, 1 );
        ray.applyMatrix4(matrix);
        caster.set(originPoint, ray);
        collisions = caster.intersectObjects(map.children[0].children);
        if (!_.isEmpty(collisions) && collisions[0].distance < 1) {
            character.fontblock = true;
        } else {
            character.fontblock = false;
        }
    }


    function update() {
        var delta = clock.getDelta();
        character.update(delta);
        socket.emit('player move', delta, character.controls);

        if (map)
            collisions();
        cameraControls.update(delta);
    };
};


module.exports = Game;