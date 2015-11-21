/**
 * @author alteredq / http://alteredqualia.com/
 */
var _ = require("lodash");
var THREE = require("THREE");
require("game/loaders/ColladaLoader");
var _ = require("lodash");

var Character = function (cfg) {


    /************************
     * Model part
     * **************************/
    var scene;
    var id;
    var name;
    var root = new THREE.Object3D();

    var maxSpeed = 6;
    var walkSpeed = maxSpeed;
    var crouchSpeed = maxSpeed * 0.5;
    var scale = 1;
    var speed = 0;
    var bodyOrientation = 0;
    var verticalVelocity = 9.8 * 500;
    var jumpHeight = 0;
    var maxJumpHeight = 2;
    var weapons = [];

    var idleControl = {
        up: false,
        down: false,
        left: false,
        right: false,
        crouch: false,
        jump: false,
        attack: false
    };
    var controls = _.clone(idleControl);
    var lastControl = null;

    /**
     * for remote processing
     */
    var pendingControls = [];
    var ground;
    var collision;
    var remote = false;

    /*************************
     * 3D part
     * ***************************/
    var animationFPS = 20;
    var transitionFrames = 15;

    var meshBody = null;
    var meshWeapon = null;

    // skins
    var baseUrl;
    var body;
    var skins = [];
    var skinsBody = [];
    var skinsWeapon = [];

    // internals
    var meshes = [];
    var animations = {};
    var loadCounter = 0;


    // collision
    var box3 = new THREE.Box3();
    var showCollisions = false;
    var grounds = [];
    var collisions = [];

    // internal animation parameters
    var activeAnimation = null;
    var oldAnimation = null;

    var callback;
    var onLoadComplete = function () {

        if (callback) {
            callback();
        }
    };

    var setConfig = function (cfg) {
        scene = cfg.scene;
        controls = cfg.controls;
        id = cfg.id;
        name = cfg.name;
        remote = cfg.remote;
        scale = cfg.scale;
        baseUrl = cfg.baseUrl;

        root.position.copy(cfg.position);
        //root.position = cfg.position;
        body = cfg.body;
        skins = cfg.skins;
        weapons = cfg.weapons;
        animations = cfg.animations;
        callback = cfg.callback;


        loadParts();
    }

    var destroy = function (scene) {

        meshBody.traverse(function (node) {
            scene.remove(node);
        });

        _.each(meshes, function (mesh) {
            mesh.traverse(function (node) {
                scene.remove(node);
            });
        });
        scene.remove(root);
    };

    // API
    function enableShadows(enable) {

        for (var i = 0; i < meshes.length; i++) {
            meshes[i].castShadow = enable;
            meshes[i].receiveShadow = enable;
        }
    };

    function setVisible(enable) {

        for (var i = 0; i < meshes.length; i++) {
            meshes[i].visible = enable;
            meshes[i].visible = enable;
        }
    };


    function loadParts() {

        loadCounter = weapons.length * 2 + skins.length;

        var weaponsTextures = [];
        for (var j = 0; i < weapons.length; i++) {
            weaponsTextures[i] = weapons[i][1];
        }

        // SKINS
        skinsBody = loadTextures(baseUrl + "skins/", skins);
        skinsWeapon = loadTextures(baseUrl + "skins/", weaponsTextures);

        // BODY
        var loader = new THREE.JSONLoader();
        loader.load(baseUrl + body, function (geo) {
            geo.computeBoundingBox();
            var mesh = createPart(geo, skinsBody[0]);
            root.add(mesh);
            meshBody = mesh;
            meshes.push(mesh);
            box3.setFromObject(mesh);
            mesh.scale.set(scale, scale, scale);

            checkLoadingComplete();
        });

        // WEAPONS

        var generateCallback = function (index, name) {

            return function (geo) {

                var mesh = createPart(geo, skinsWeapon[index]);

                mesh.visible = false;
                mesh.name = name;
                root.add(mesh);
                weapons[index] = mesh;
                meshWeapon = mesh;
                meshes.push(mesh);

                checkLoadingComplete();
            };
        };

        for (var i = 0; i < weapons.length; i++) {
            loader.load(baseUrl + weapons[i][0], generateCallback(i, weapons[i][0]));
        }
    };

    function setPlaybackRate(rate) {
        if (meshBody) meshBody.duration = meshBody.baseDuration / rate;
        if (meshWeapon) meshWeapon.duration = meshWeapon.baseDuration / rate;
    };

    function setSkin(index) {
        if (meshBody && meshBody.material.wireframe === false) {
            meshBody.material.map = skinsBody[index];
            currentSkin = index;
        }
    };

    function setWeapon(index) {

        for (var i = 0; i < weapons.length; i++) weapons[i].visible = false;
        var activeWeapon = weapons[index];
        if (activeWeapon) {
            activeWeapon.visible = true;
            meshWeapon = activeWeapon;

            if (activeAnimation) {
                activeWeapon.playAnimation(activeAnimation);
                meshWeapon.setAnimationTime(activeAnimation, meshBody.getAnimationTime(activeAnimation));
            }
        }
    };

    function setAnimation(animationName) {

        if (animationName === activeAnimation || !animationName) return;

        if (meshBody) {
            meshBody.setAnimationWeight(animationName, 0);
            meshBody.playAnimation(animationName);

            oldAnimation = activeAnimation;
            activeAnimation = animationName;

            blendCounter = transitionFrames;
        }

        if (meshWeapon) {
            meshWeapon.setAnimationWeight(animationName, 0);
            meshWeapon.playAnimation(animationName);
        }
    };


    function updateData(remotePlayer) {

        controls = remotePlayer.controls;
        root.position.copy (remotePlayer.position);

        ground = remotePlayer.ground;
        collision = remotePlayer.collision;
    };

    function update(delta, collidables) {
        box3.setFromObject(meshBody);

        var all = grounds.concat(collisions).concat(meshBody);
        _.each(all, function (collidable) {
            toggleBoxHelper(collidable, null);
        });

        updateMovementModel(delta, collidables);
        if (animations) {
            updateBehaviors(delta);
            updateAnimations(delta);
        }

        if (showCollisions) {

            toggleBoxHelper(meshBody, 0x00ff00);

            _.each(grounds, function (collidable) {
                toggleBoxHelper(collidable, 0x0000ff);
            });
            _.each(collisions, function (collidable) {
                toggleBoxHelper(collidable, 0xff0000);
            });
        }
    };

    function toggleBoxHelper(collidable, hexColor) {

        if (hexColor == null) {
            if (collidable.box3Helper) {
                collidable.box3Helper.visible = false;
            }

        } else {

            if (showCollisions) {

                if (!collidable.box3Helper) {
                    collidable.box3Helper = new THREE.BoundingBoxHelper(collidable, hexColor);
                    scene.add(collidable.box3Helper);
                }

                collidable.box3Helper.visible = true;

                collidable.box3Helper.material.color.setHex(hexColor);
                collidable.box3Helper.update();
            }
        }
    };

    function updateAnimations(delta) {

        var mix = 1;

        if (blendCounter > 0) {
            mix = ( transitionFrames - blendCounter ) / transitionFrames;
            blendCounter -= 1;
        }

        if (meshBody) {
            meshBody.update(delta);
            meshBody.setAnimationWeight(activeAnimation, mix);
            meshBody.setAnimationWeight(oldAnimation, 1 - mix);
        }

        if (meshWeapon) {
            meshWeapon.update(delta);
            meshWeapon.setAnimationWeight(activeAnimation, mix);
            meshWeapon.setAnimationWeight(oldAnimation, 1 - mix);
        }
    };

    function updateBehaviors(delta) {

        var moveAnimation, idleAnimation;

        // crouch vs stand
        if (controls.crouch) {
            moveAnimation = animations["crouchMove"];
            idleAnimation = animations["crouchIdle"];
        } else {
            moveAnimation = animations["move"];
            idleAnimation = animations["idle"];
        }

        // actions

        if (controls.jump) {
            moveAnimation = animations["jump"];
            idleAnimation = animations["jump"];
        }

        if (controls.attack) {
            if (controls.crouch) {
                moveAnimation = animations["crouchAttack"];
                idleAnimation = animations["crouchAttack"];
            } else {
                moveAnimation = animations["attack"];
                idleAnimation = animations["attack"];
            }
        }

        // set animations

        if (controls.up || controls.down || controls.left || controls.right) {
            if (activeAnimation !== moveAnimation) {
                setAnimation(moveAnimation);
            }
        }


        if (Math.abs(speed) < 0.2 * maxSpeed && !( controls.left || controls.right || controls.up || controls.down )) {
            if (activeAnimation !== idleAnimation) {
                setAnimation(idleAnimation);
            }
        }

        // set animation direction

        if (controls.up) {
            if (meshBody) {
                meshBody.setAnimationDirectionForward(activeAnimation);
                meshBody.setAnimationDirectionForward(oldAnimation);
            }

            if (meshWeapon) {
                meshWeapon.setAnimationDirectionForward(activeAnimation);
                meshWeapon.setAnimationDirectionForward(oldAnimation);
            }
        }

        if (controls.down) {
            if (meshBody) {
                meshBody.setAnimationDirectionBackward(activeAnimation);
                meshBody.setAnimationDirectionBackward(oldAnimation);
            }

            if (meshWeapon) {
                meshWeapon.setAnimationDirectionBackward(activeAnimation);
                meshWeapon.setAnimationDirectionBackward(oldAnimation);
            }
        }
    };

    function updateMovementModel(delta, collidables) {

        // speed based on controls

        if (controls.crouch) {
            maxSpeed = crouchSpeed;
        }
        else {
            maxSpeed = walkSpeed;
        }

        // orientation based on controls
        // (don't just stand while turning)
        if (controls.up) {
            bodyOrientation = Math.PI;
        }

        if (controls.down) {
            bodyOrientation = 0;
        }

        if (controls.left) {
            bodyOrientation = -Math.PI / 2;
        }

        if (controls.right) {
            bodyOrientation = Math.PI / 2;
        }

        if (controls.up && controls.left) {
            bodyOrientation = -Math.PI * 3 / 4;
        }
        if (controls.up && controls.right) {
            bodyOrientation = Math.PI * 3 / 4;
        }

        if (controls.down && controls.right) {
            bodyOrientation = Math.PI / 4;
        }

        if (controls.down && controls.left) {
            bodyOrientation = -Math.PI / 4;
        }


        // speed
        if (!( controls.up || controls.down || controls.right || controls.left )) {
            speed = 0;
        } else {
            speed = maxSpeed;
        }


        // steering
        root.rotation.y = bodyOrientation;
        // vertical move

        verticalMove(delta, collidables);

        // horizontal move
        if (!remote && _.isEmpty(collisions) || remote && !collision) {
            var forwardDelta = speed * delta;
            root.position.x += Math.sin(bodyOrientation) * forwardDelta;
            root.position.z += Math.cos(bodyOrientation) * forwardDelta;
        }
    };

    function verticalMove(delta, collidables) {
        var orig = root.position.clone();

        if (collidables) {
            // console.log("start ground detect with ", collidables.length, " collidables, char at ", root.position.y, " box at ", box3, " ground ", grounds);
            // collision verticale box3d
            // remote only
            var test = _.flatten(_.pluck(collidables, 'children'));
            var obstacleBox3d = new THREE.Box3();
            grounds = [];
            collisions = [];


            // ground detection : we move the char vertically and then we test for ground collision
            // la zone de contact en dessous de laquelle on considere l'obstacle comme un sol : on peut monter sur une plaque par exemple
            var acceptedHeight = (box3.max.y - box3.min.y) / 3;
            var acceptedY = box3.min.y + acceptedHeight;

            _.each(test, function (object3d) {

                    box3 = new THREE.Box3().setFromObject(meshBody);
                    obstacleBox3d.setFromObject(object3d);
                    var type = null;

                    if (box3.isIntersectionBox(obstacleBox3d)) {
                        var inter = box3.intersect(obstacleBox3d);


                        if (inter.size().y > acceptedHeight || obstacleBox3d.min.y > acceptedY) {
                            // collision
                            collisions.push(object3d);

                        } else {
                            // ground
                            grounds.push(object3d);
                        }
                    }
                }
            );

            // chutte
            var vDir = -1;

            if ((jumpHeight >= maxJumpHeight)) {
                controls.jump = false;
            }

            // ascension
            if (controls.jump) {
                vDir = 1;
            }
        }

        verticalVelocity = 9.8 * delta * vDir;
        if (vDir == 1) {
            jumpHeight += verticalVelocity;
        }

        if (!remote) {

            if (!_.isEmpty(grounds) && vDir == -1) {
                jumpHeight = 0;
                root.position.setY(orig.y);
            } else {
                root.translateY(verticalVelocity);
            }
        } else {

            if (!ground) {
                vDir = 0;
            }
        }
    }


    // internal helpers
    function loadTextures(baseUrl, textureUrls) {
        var mapping = THREE.UVMapping;
        var textures = [];

        for (var i = 0; i < textureUrls.length; i++) {
            textures[i] = THREE.ImageUtils.loadTexture(baseUrl + textureUrls[i], mapping, checkLoadingComplete);
            textures[i].name = textureUrls[i];
        }

        return textures;
    }

    function createPart(geometry, skinMap) {
        var materialTexture = new THREE.MeshPhongMaterial({
            shading: THREE.FlatShading,
            morphTargets: true
        });

        var mesh = new THREE.MorphBlendMesh(geometry, materialTexture);
        mesh.rotation.y = -Math.PI / 2;
        mesh.materialTexture = materialTexture;
        mesh.autoCreateAnimations(animationFPS);

        return mesh;
    }

    function checkLoadingComplete() {

        loadCounter -= 1;
        if (loadCounter === 0)
            onLoadComplete();
    }

    function checkControls() {

        if (remote) return false;

        var update = false;

        // if the user send inputs or if he just stopped but not when he is not doing anything
        if (_.includes(controls, true)
            || !_.isEqual(lastControl, controls)
            || !_.isEqual(ground, !_.isEmpty(grounds))
            || !_.isEqual(collision, !_.isEmpty(collisions))

        ) {

            //console.log(controls);
            controls.timestamp = Date.now();
            pendingControls.push(lastControl);
            update = true;
        }

        ground = !_.isEmpty(grounds);
        collision = !_.isEmpty(collisions);

        lastControl = _.clone(controls);
        return update;
    }


    return {
        onLoadComplete: onLoadComplete,
        setConfig: setConfig,
        root: root,
        remote: remote,
        controls: controls,
        showCollisions: showCollisions,
        lastControl: lastControl,
        ground: ground,
        collision: collision,

        update: update,
        updateData: updateData,
        checkControls: checkControls
    }
};

module.exports = Character;