var _ = require("lodash");
var $ = require("jQuery");
var THREE = require("THREE");
require("game/controls/OrbitControls");
var levelService = require("game/services/LevelService");
var minimapService = require("game/services/MinimapService");
var networkService = require("game/services/NetworkService");
var statService = require("game/services/StatService");
var entityService = require("game/services/EntityService");


var Game = function () {
    var self = this;
    // the dom element where we will add the renderer : #game-container
    var $container;

    // WebGL renderer, camera and a scene
    var renderer;
    var clock;
    var cameraControls;

    var map;
    var stats = null;

    var module = {
        players: [],
        character: null,
        // game controller angular scope for allowing feedback to angular views
        $scope: null,
        $minimap: null
    };

    init();

    function init() {
        initWorld();
        entityService.init(module);
        levelService.init(module);
        levelService.loadMap("models/map/map_3.dae").then(function (_map) {
            map = _map;
        });
    }

    function initWorld() {
        var $container = $("#game-container");
        module.scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            //clearAlpha: 1,
            //clearColor: 0xccdddd
        });
        //renderer.autoClear = false;
        //renderer.gammaInput = true;
        //renderer.gammaOutput = true;

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.cullFace = THREE.CullFaceBack;

        clock = new THREE.Clock();
        module.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 40000);
        module.camera.position.set(0, 20, 20);
        module.scene.add(module.camera);

        cameraControls = new THREE.OrbitControls(module.camera, renderer.domElement);
        cameraControls.zoomSpeed = 1.2;
        //cameraControls.noRotate = true;
        cameraControls.keys = [65, 83, 68];


    }

    function restore(_$scope) {
        module.$scope = _$scope;

        networkService.init(module);

        animate();
        initPrefs();
        $container = $("#game-container");
        $container.append(renderer.domElement);
        renderer.setSize($container.width(), $container.height());

        window.addEventListener('resize', function () {
            var viewportWidth = $container.width();
            var viewportHeight = $container.height();
            renderer.setSize(viewportWidth, viewportHeight);
            module.camera.aspect = viewportWidth / viewportHeight;
            module.camera.updateProjectionMatrix();
        });
    }

    function initPrefs() {
        statService.init(module);
        stats = statService.getStats();
        initCollisions();
        initMinimap();
    }

    function initMinimap() {
        module.$minimap = $(".minimap");
        minimapService.init(module);
        module.$scope.$on("toggle minimap", function () {
            minimapService.toggle();
        });

        // force minimap
        module.$scope.$emit("toggle minimap");
    }

    function initCollisions() {
        // 0: fps, 1: ms, 2: mb
        module.$scope.$on("toggle collisions", function () {

            if (module.character)
                module.character.toggleCollisions();
        });

    }

    function animate() {

        if (stats)
            stats.begin();

        update();
        renderer.render(module.scene, module.camera);
        if (stats)
            stats.end();

        requestAnimationFrame(animate);

    }

    function update() {
        var delta = clock.getDelta();

        if (map) {

            if (module.character) {
                module.character.update(delta, map.children);
                if (module.character.checkControls()) {

                    var snapshot = {
                        controls: module.character.lastControl,
                        position: module.character.root.position,
                        ground: module.character.ground,
                        collision: module.character.collision

                    };
                    networkService.sendControls(delta, snapshot);

                }
            }

            _.each(module.players, function (player) {
                player.update(delta);
            });
        }

        minimapService.update();
        cameraControls.update(delta);
    }

    return {
        module: module,
        restore: restore
    }
}

var singleton = new Game();
module.exports = singleton;