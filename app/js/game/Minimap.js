var THREE = require("THREE");
var $ = require("jQuery");
var _ = require("lodash");

var MiniMap = function ($container) {

    var scene = new THREE.Scene();
    var markers = [];
    var visible;

    var renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setSize(120, 120);
    renderer.setClearColor(0xffffff, 0);

    var $minimap = $container;

    $minimap.hide();
    $minimap.append(renderer.domElement);
    $minimap.css({
        left: "50px",
        top: "70px",
        width: "120px",
        height: "120px"
    });

    var directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    directionalLight.position.set(-1, 0, 0);
    scene.add(directionalLight);

    var cam = new THREE.OrthographicCamera(-60, 60, 60, -60, 1, 1e4);
    cam.position.set(0, 0, 50);

    function animate() {


        requestAnimationFrame(animate);

        if ($minimap.is(":visible"))
            renderer.render(scene, cam);

    }

    animate();

    var update = function (positions) {

        var i = 0;
        _.each(positions, function (position) {
            if (!markers[i]) {
                markers[i] = createMarker();
            }

            markers[i].position.copy(positions[i]);
            if (markers[i].center) {
                cam.lookAt(markers[i]);
            }

            i++;
        });

        for (i; i < markers.length; i++) {
            scene.remove(markers[i]);
            markers[i] = null;
        }

        _.compact(markers);
    };

    var createMarker = function () {

        var material = new THREE.MeshBasicMaterial({
            color: 0x0000ff
        });

        var radius = 5;
        var segments = 0;

        var circleGeometry = new THREE.CircleGeometry(radius, segments);
        var circle = new THREE.Mesh(circleGeometry, material);
        scene.add(circle);
        return circle;
    };

    var toggle = function () {

        $(".minimap").toggle();
    };

    return {
        update: update,
        toggle: toggle
    }
};

module.exports = MiniMap;