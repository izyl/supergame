var THREE = require("THREE");
var $ = require("jQuery");
var _ = require("lodash");

var MinimapService = function (game) {

    var game;
    var scene = new THREE.Scene();
    var $minimap;

    // 0 : map
    var LOOK_AT_MODE_MAP = 0;
    // 1 : marker mode (follow)
    var LOOK_AT_MODE_MARKER = 1;
    var lookAtMode = LOOK_AT_MODE_MAP;

    var markers = [];
    var visible;

    var renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setSize(120, 120);
    renderer.setClearColor(0xffffff, 0);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    directionalLight.position.set(-1, 0, 0);
    scene.add(directionalLight);

    var cam = new THREE.OrthographicCamera(-60, 60, 60, -60, -1, 100);
    //var cam = new THREE.OrthographicCamera(90, 1, 1, 500);
    cam.position.y = 20;
    cam.up = new THREE.Vector3(0, 0, -1);
    scene.add(cam);
    cam.lookAt(scene.position);


    function init(_game) {
        game = _game;
        $minimap = game.$minimap;
        $minimap.hide();
        $minimap.append(renderer.domElement);
        $minimap.css({
            left: "50px",
            top: "70px",
            width: "120px",
            height: "120px"
        });

    }

    function animate() {

        requestAnimationFrame(animate);
        if ($minimap && $minimap.is(":visible")) {
            renderer.render(scene, cam);
        }

    }

    animate();

    function update() {
        if ($minimap && $minimap.is(":visible")) {

            var players = game.players;
            var character = game.character;

            var positions = [];
            _.each(players, function(player){
                positions.push(player.getRoot().position.clone());
            });
            if (character) {
                var centerPosition = character.getRoot().position.clone();
                centerPosition.center = true;
                positions.push(centerPosition);
            }
            positions = _.compact(positions);

            var i = 0;
            var marker;

            _.each(positions, function (position) {
                if (!markers[i]) {
                    markers[i] = createMarker();
                }

                markers[i].position.copy(positions[i]);

                if (positions[i].center) {
                    marker = markers[i];
                }

                i++;
            });

            for (i; i < markers.length; i++) {
                scene.remove(markers[i]);
                markers[i] = null;
            }

            _.compact(markers);

            if (lookAtMode == LOOK_AT_MODE_MARKER) {

                if (marker)
                    cam.lookAt(marker.position);

            } else if (lookAtMode == LOOK_AT_MODE_MAP) {
                cam.lookAt(scene.position);
            }
        }
    }

    function createMarker() {

        //var geometry =new THREE.CircleGeometry( 50, 8);
        //var material = new THREE.MeshLambertMaterial({color: 0xffff00});
        //var mesh = new THREE.Mesh(geometry, material);


        var geometry = new THREE.SphereGeometry(2);
        var material = new THREE.MeshBasicMaterial({color: 0xffff00});
        var mesh = new THREE.Mesh(geometry, material);

        scene.add(mesh);
        return mesh;
    }

    function toggle() {

        $(".minimap").toggle();
    }

    return {
        update: update,
        toggle: toggle,
        init: init
    }
};

module.exports = new MinimapService();