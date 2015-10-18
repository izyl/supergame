var $ = require("jQuery");
var THREE = require("THREE");
require("ui/loaders/ColladaLoader.js");
require("ui/Gyroscope");
require("ui/controls/TrackballControls.js");

var css = require('main.css');

var Main = (function () {
    var $container;

    // set the scene size
    var WIDTH = 1000, HEIGHT = 600;
    var SEGMENTS = 40;

    // set some camera attributes
    var VIEW_ANGLE = 90, ASPECT = WIDTH / HEIGHT, NEAR = 0.1, FAR = 10000;

    // WebGL renderer, camera and a scene
    var renderer;
    var camera;
    var scene;
    var loader;
    var lights = [];
    var cameraControls;

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

        scene.add(new THREE.AmbientLight(0x222222));

        var light = new THREE.DirectionalLight(0x999999);
        light.position.set(10, 10, -10);
        scene.add(light);

    }

    function addPlayer() {
        // set up the sphere vars

        loader.load('models/character/stickman.dae', function (collada) {
            //dummy1.dae
            var dae = collada.scene;
            var skin = collada.skins[0];
            dae.position.set(1, 2, 0);//x,z,y- if you think in blender dimensions ;)

            scene.add(dae);
        });

        var light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.position.set(-100, 200, 100);

        var gyro = new THREE.Gyroscope();
        gyro.add(camera);
        gyro.add(light, light.target);
        scene.add(gyro);

        cameraControls = new THREE.TrackballControls(camera, renderer.domElement);
        cameraControls.target.set(2, 2, 2);

    };

    function initColladaLoader() {

        loader = new THREE.ColladaLoader();
        loader.options.convertUpAxis = true;
    };


    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        cameraControls.update();
    }

    function initWorld() {
        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            clearAlpha: 1,
            clearColor: 0xccdddd
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 40000);
        camera.position.set(0, 20, 20);
        scene.add(camera);

        // attach the render-supplied DOM element
        var $container = $("#container");
        var info = document.createElement('div');
        info.style.position = 'absolute';
        info.style.top = '10px';
        info.style.width = '100%';
        info.style.textAlign = 'center';
        info.innerHTML = 'super game';
        $container.append(info);
        $container.append(renderer.domElement);
    }

    function init() {


        initWorld();
        initColladaLoader();
        addMap();
        addPlayer();
        addLigth();

        //stats = new Stats();
        //container.appendChild(stats.domElement);

        // draw!
        renderer.render(scene, camera);

        window.addEventListener('resize', function () {
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    };
})();


module.exports = Main;