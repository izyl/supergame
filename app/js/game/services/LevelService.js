/** Manage the levels
 * can clean current and load new map */
var THREE = require("THREE");
require("game/loaders/ColladaLoader");
require("game/shaders/Sky");

var LevelService = function () {

    var game;
    var map;
    var loader;

    function init(_game) {
        game = _game;
        loader = new THREE.ColladaLoader();
        loader.options.convertUpAxis = true;
    }

    function loadMap(filePath) {


        var promise = new Promise(function (resolve, reject) {

            try {
                loader.load(filePath, function (collada) {
                    map = collada.scene;
                    map.position.set(0, 0, 0);
                    game.scene.add(map);
                    console.log(map);
                    map.traverse(function (obj) {

                            // while we load the map we use the mesh names to identify our blender's objects

                            if (obj instanceof THREE.Light) {
                                console.log(obj);
                            }
                            else if (obj instanceof THREE.Mesh) {

                                if (obj.material && obj.material.name == "grass") {
                                    obj.material.map.repeat.set(8, 8);
                                    obj.material.map.wrapS = obj.material.map.wrapT = THREE.RepeatWrapping;
                                }

                                obj.castShadow = true;
                                obj.receiveShadow = true;
                            }

                            if (obj.name.startsWith("Bonus")) {
                                console.log(obj);
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
                    game.scene.add(sky);

                    //addLigth();
                    resolve(map);
                });

            } catch (e) {
                reject(e);
            }

        });

        return promise;

    }

    function toggleShadow() {
        map.traverse(function (obj) {
            if (obj instanceof THREE.Mesh) {
                obj.castShadow = !obj.castShadow;
                obj.receiveShadow = !obj.receiveShadow;
            }

            if (obj instanceof THREE.Light) {
                obj.castShadow = !obj.castShadow;
            }
        });
    }

    function addLigth() {

        var ambientLight = new THREE.AmbientLight(0x333333, 0.04);
        game.scene.add(ambientLight);

        var light = new THREE.PointLight(0xffffff, 1, 200, 0);
        light.position.set(20, 50, 20);
        light.castShadow = true;
        game.scene.add(light);

        //
        //var spotLight = new THREE.SpotLight(0xffffff);
        //spotLight.position.set(20, 500, 20);
        //spotLight.shadowMapWidth = 2048;
        //spotLight.shadowMapHeight = 2048;
        //spotLight.shadowCameraNear = 500;
        //spotLight.shadowCameraFar = 4000;
        //spotLight.shadowCameraFov = 4;
        //spotLight.castShadow = true;
        //
        //scene.add(spotLight);

    }

    return {
        loadMap: loadMap,
        toggleShadow: toggleShadow,
        init: init,
        addLigth : addLigth
    };
};


module.exports = new LevelService();