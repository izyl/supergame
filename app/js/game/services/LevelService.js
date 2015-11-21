/** Manage the levels
 * can clean current and load new map */
var THREE = require("THREE");
require("game/loaders/ColladaLoader");
require("game/shaders/Sky");

var LevelService = function () {

    var scene;
    var loader;

    function init(game) {
        scene = game.scene;
        loader = new THREE.ColladaLoader();
        loader.options.convertUpAxis = true;
    }

    function loadMap(filePath) {
        var map;

        var promise = new Promise(function (resolve, reject) {

            try {
                loader.load(filePath, function (collada) {
                    map = collada.scene;
                    map.position.set(0, 0, 0);
                    scene.add(map);

                    map.traverse(function (obj) {

                            if (obj instanceof THREE.Mesh) {

                                obj.castShadow = true;

                                if (obj.material && obj.material.name == "grass") {
                                    obj.material.map.repeat.set(8, 8);
                                    obj.material.map.wrapS = obj.material.map.wrapT = THREE.RepeatWrapping;
                                    obj.castShadow = false;
                                    obj.receiveShadow = true;
                                }
                            }


                        }
                    );

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

                    addLigth();
                    resolve(map);
                });

            } catch (e) {
                reject(e);
            }

        });

        return promise;

    };

    function addLigth() {

        var ambientLight = new THREE.AmbientLight(0x333333, 0.04);
        scene.add(ambientLight);

        //var light = new THREE.DirectionalLight(0xffffff, 1.0);
        //light.position.set(0, 50, 10);
        //light.castShadow = true;
        //scene.add(light);

        var spotLight = new THREE.SpotLight( 0xffffff );
        spotLight.position.set( 50, 500, 50 );

        spotLight.castShadow = true;

        spotLight.shadowMapWidth = 1024;
        spotLight.shadowMapHeight = 1024;

        spotLight.shadowCameraNear = 500;
        spotLight.shadowCameraFar = 4000;
        spotLight.shadowCameraFov = 30;

        spotLight.shadowCameraFov = 10;

        scene.add( spotLight );

    };

    return {
        loadMap: loadMap,
        init: init
    };
};


module.exports = new LevelService();