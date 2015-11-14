/**
 * @author alteredq / http://alteredqualia.com/
 */
var _ = require("lodash");
var THREE = require("THREE");
require("game/loaders/ColladaLoader");

Character = function (_scene) {

    var scene = _scene;
    var scope = this;

    /************************
     * Model part
     * **************************/
    this.maxSpeed = 6;
    this.walkSpeed = this.maxSpeed;
    this.crouchSpeed = this.maxSpeed * 0.5;
    this.scale = 1;
    this.speed = 0;
    this.bodyOrientation = 0;

    this.root = new THREE.Object3D();
    this.verticalVelocity = 9.8 * 500;

    this.jumpHeight = 0;
    this.maxJumpHeight = 2;


    this.weapons = [];

    this.idleControl = {
        up: false,
        down: false,
        left: false,
        right: false,
        crouch: false,
        jump: false,
        attack: false
    };
    this.controls = _.clone(this.idleControl);
    this.lastControl = null;
    this.pendingControls = [];

    this.remote = false;

    /*************************
     * 3D part
     * ***************************/
    this.animationFPS = 20;
    this.transitionFrames = 15;

    this.meshBody = null;
    this.meshWeapon = null;

    // skins
    this.skinsBody = [];
    this.skinsWeapon = [];

    // internals
    this.meshes = [];
    this.animations = {};
    this.loadCounter = 0;


    // collision
    this.box3 = new THREE.Box3();
    this.box3Helper = null;
    this.showCollisions = false;
    this.grounds = [];
    this.collisions = [];

    // internal animation parameters
    this.activeAnimation = null;
    this.oldAnimation = null;

    this.onLoadComplete = function () {
    };

    this.destroy = function (scene) {

        this.meshBody.traverse(function (node) {
            scene.remove(node);
        });

        _.each(this.meshes, function (mesh) {
            mesh.traverse(function (node) {
                scene.remove(node);
            });
        });
        scene.remove(this.root);
    };

    // API
    this.enableShadows = function (enable) {

        for (var i = 0; i < this.meshes.length; i++) {
            this.meshes[i].castShadow = enable;
            this.meshes[i].receiveShadow = enable;
        }
    };

    this.setVisible = function (enable) {

        for (var i = 0; i < this.meshes.length; i++) {
            this.meshes[i].visible = enable;
            this.meshes[i].visible = enable;
        }
    };


    this.loadParts = function (config) {

        this.animations = config.animations;
        this.walkSpeed = config.walkSpeed || this.walkSpeed;
        this.crouchSpeed = config.crouchSpeed || this.crouchSpeed;
        this.loadCounter = config.weapons.length * 2 + config.skins.length + 1;

        var weaponsTextures = [];
        for (var j = 0; i < config.weapons.length; i++) {
            weaponsTextures[i] = config.weapons[i][1];
        }

        // SKINS
        this.skinsBody = loadTextures(config.baseUrl + "skins/", config.skins);
        this.skinsWeapon = loadTextures(config.baseUrl + "skins/", weaponsTextures);

        // BODY
        var loader = new THREE.JSONLoader();
        loader.load(config.baseUrl + config.body, function (geo) {
            geo.computeBoundingBox();
            var mesh = createPart(geo, scope.skinsBody[0]);
            scope.root.add(mesh);
            scope.meshBody = mesh;
            scope.meshes.push(mesh);
            scope.box3.setFromObject(mesh);

            checkLoadingComplete();
        });

        // WEAPONS

        var generateCallback = function (index, name) {

            return function (geo) {

                var mesh = createPart(geo, scope.skinsWeapon[index]);
                mesh.scale.set(scope.scale, scope.scale, scope.scale);
                mesh.visible = false;
                mesh.name = name;
                scope.root.add(mesh);
                scope.weapons[index] = mesh;
                scope.meshWeapon = mesh;
                scope.meshes.push(mesh);

                checkLoadingComplete();
            };
        };

        for (var i = 0; i < config.weapons.length; i++) {
            loader.load(config.baseUrl + config.weapons[i][0], generateCallback(i, config.weapons[i][0]));
        }
    };

    this.setPlaybackRate = function (rate) {
        if (this.meshBody) this.meshBody.duration = this.meshBody.baseDuration / rate;
        if (this.meshWeapon) this.meshWeapon.duration = this.meshWeapon.baseDuration / rate;
    };

    this.setSkin = function (index) {
        if (this.meshBody && this.meshBody.material.wireframe === false) {
            this.meshBody.material.map = this.skinsBody[index];
            this.currentSkin = index;
        }
    };

    this.setWeapon = function (index) {

        for (var i = 0; i < this.weapons.length; i++) this.weapons[i].visible = false;
        var activeWeapon = this.weapons[index];
        if (activeWeapon) {
            activeWeapon.visible = true;
            this.meshWeapon = activeWeapon;

            if (this.activeAnimation) {
                activeWeapon.playAnimation(this.activeAnimation);
                this.meshWeapon.setAnimationTime(this.activeAnimation, this.meshBody.getAnimationTime(this.activeAnimation));
            }
        }
    };

    this.setAnimation = function (animationName) {

        if (animationName === this.activeAnimation || !animationName) return;

        if (this.meshBody) {
            this.meshBody.setAnimationWeight(animationName, 0);
            this.meshBody.playAnimation(animationName);

            this.oldAnimation = this.activeAnimation;
            this.activeAnimation = animationName;

            this.blendCounter = this.transitionFrames;
        }

        if (this.meshWeapon) {
            this.meshWeapon.setAnimationWeight(animationName, 0);
            this.meshWeapon.playAnimation(animationName);
        }
    };


    this.updateData = function (remotePlayer) {

        this.controls = remotePlayer.controls;
        this.root.position.copy (remotePlayer.position);

        this.ground = remotePlayer.ground;
        this.collision = remotePlayer.collision;
    };

    this.update = function (delta, collidables) {
        scope.box3.setFromObject(scope.meshBody);

        var all = this.grounds.concat(scope.collisions).concat(scope.meshBody);
        _.each(all, function (collidable) {
            scope.toggleBoxHelper(collidable, null);
        });

        this.updateMovementModel(delta, collidables);
        if (this.animations) {
            this.updateBehaviors(delta);
            this.updateAnimations(delta);
        }

        if (scope.showCollisions) {

            scope.toggleBoxHelper(scope.meshBody, 0x00ff00);

            _.each(this.grounds, function (collidable) {
                scope.toggleBoxHelper(collidable, 0x0000ff);
            });
            _.each(scope.collisions, function (collidable) {
                scope.toggleBoxHelper(collidable, 0xff0000);
            });
        }
    };

    this.toggleBoxHelper = function (collidable, hexColor) {

        if (hexColor == null) {
            if (collidable.box3Helper) {
                collidable.box3Helper.visible = false;
            }

        } else {

            if (this.showCollisions) {

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

    this.updateAnimations = function (delta) {

        var mix = 1;

        if (this.blendCounter > 0) {
            mix = ( this.transitionFrames - this.blendCounter ) / this.transitionFrames;
            this.blendCounter -= 1;
        }

        if (this.meshBody) {
            this.meshBody.update(delta);
            this.meshBody.setAnimationWeight(this.activeAnimation, mix);
            this.meshBody.setAnimationWeight(this.oldAnimation, 1 - mix);
        }

        if (this.meshWeapon) {
            this.meshWeapon.update(delta);
            this.meshWeapon.setAnimationWeight(this.activeAnimation, mix);
            this.meshWeapon.setAnimationWeight(this.oldAnimation, 1 - mix);
        }
    };

    this.updateBehaviors = function (delta) {

        var controls = this.controls;
        var animations = this.animations;

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
            if (this.activeAnimation !== moveAnimation) {
                this.setAnimation(moveAnimation);
            }
        }


        if (Math.abs(this.speed) < 0.2 * this.maxSpeed && !( controls.left || controls.right || controls.up || controls.down )) {
            if (this.activeAnimation !== idleAnimation) {
                this.setAnimation(idleAnimation);
            }
        }

        // set animation direction

        if (controls.up) {
            if (this.meshBody) {
                this.meshBody.setAnimationDirectionForward(this.activeAnimation);
                this.meshBody.setAnimationDirectionForward(this.oldAnimation);
            }

            if (this.meshWeapon) {
                this.meshWeapon.setAnimationDirectionForward(this.activeAnimation);
                this.meshWeapon.setAnimationDirectionForward(this.oldAnimation);
            }
        }

        if (controls.down) {
            if (this.meshBody) {
                this.meshBody.setAnimationDirectionBackward(this.activeAnimation);
                this.meshBody.setAnimationDirectionBackward(this.oldAnimation);
            }

            if (this.meshWeapon) {
                this.meshWeapon.setAnimationDirectionBackward(this.activeAnimation);
                this.meshWeapon.setAnimationDirectionBackward(this.oldAnimation);
            }
        }
    };

    this.updateMovementModel = function (delta, collidables) {

        var controls = this.controls;
        // speed based on controls

        if (controls.crouch) {
            this.maxSpeed = this.crouchSpeed;
        }
        else {
            this.maxSpeed = this.walkSpeed;
        }

        // orientation based on controls
        // (don't just stand while turning)
        if (controls.up) {
            this.bodyOrientation = Math.PI;
        }

        if (controls.down) {
            this.bodyOrientation = 0;
        }

        if (controls.left) {
            this.bodyOrientation = -Math.PI / 2;
        }

        if (controls.right) {
            this.bodyOrientation = Math.PI / 2;
        }

        if (controls.up && controls.left) {
            this.bodyOrientation = -Math.PI * 3 / 4;
        }
        if (controls.up && controls.right) {
            this.bodyOrientation = Math.PI * 3 / 4;
        }

        if (controls.down && controls.right) {
            this.bodyOrientation = Math.PI / 4;
        }

        if (controls.down && controls.left) {
            this.bodyOrientation = -Math.PI / 4;
        }


        // speed
        if (!( controls.up || controls.down || controls.right || controls.left )) {
            this.speed = 0;
        } else {
            this.speed = this.maxSpeed;
        }


        // steering
        this.root.rotation.y = this.bodyOrientation;

        // vertical move

        this.verticalMove(delta, collidables);

        // horizontal move
        if (!this.remote && _.isEmpty(scope.collisions) || this.remote && !this.collision) {
            var forwardDelta = this.speed * delta;
            this.root.position.x += Math.sin(this.bodyOrientation) * forwardDelta;
            this.root.position.z += Math.cos(this.bodyOrientation) * forwardDelta;
        }
    };

    this.verticalMove = function (delta, collidables) {
        var controls = this.controls;

        if (collidables) {
            // console.log("start ground detect with ", collidables.length, " collidables, char at ", scope.root.position.y, " box at ", scope.box3, " ground ", scope.grounds);
            // collision verticale box3d
            // remote only
            var test = _.flatten(_.pluck(collidables, 'children'));
            var obstacleBox3d = new THREE.Box3();
            this.grounds = [];
            this.collisions = [];
            var orig = this.root.position.clone();

            // ground detection : we move the char vertically and then we test for ground collision
            // la zone de contact en dessous de laquelle on considere l'obstacle comme un sol : on peut monter sur une plaque par exemple
            var acceptedHeight = (scope.box3.max.y - scope.box3.min.y) / 5;
            var acceptedY = scope.box3.min.y + acceptedHeight;

            _.each(test, function (object3d) {

                    scope.box3 = new THREE.Box3().setFromObject(scope.meshBody);
                    obstacleBox3d.setFromObject(object3d);
                    var type = null;

                    if (scope.box3.isIntersectionBox(obstacleBox3d)) {
                        var inter = scope.box3.intersect(obstacleBox3d);


                        if (inter.size().y > acceptedHeight || obstacleBox3d.min.y > acceptedY) {
                            // collision
                            scope.collisions.push(object3d);

                        } else {
                            // ground
                            scope.grounds.push(object3d);
                        }
                    }
                }
            );

            // chutte
            var vDir = -1;

            if ((this.jumpHeight >= this.maxJumpHeight)) {
                controls.jump = false;
            }

            // ascension
            if (controls.jump) {
                vDir = 1;
            }
        }

        this.verticalVelocity = 9.8 * delta * vDir;
        if (vDir == 1) {
            this.jumpHeight += this.verticalVelocity;
        }

        if(!this.remote) {

            if (!_.isEmpty(scope.grounds) && vDir == -1) {
                this.jumpHeight = 0;
                scope.root.position.setY(orig.y);
            } else {
                this.root.translateY(this.verticalVelocity);
            }
        } else {

            if(!scope.ground){
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
        mesh.autoCreateAnimations(scope.animationFPS);

        return mesh;
    }

    function checkLoadingComplete() {

        scope.loadCounter -= 1;
        if (scope.loadCounter === 0)    scope.onLoadComplete();
    }

    this.checkControls = function () {

        if (this.remote) return false;

        var update = false;

        // if the user send inputs or if he just stopped but not when he is not doing anything
        if (_.includes(this.controls, true)
            || !_.isEqual(this.lastControl, this.controls)
            || !_.isEqual(this.ground, !_.isEmpty(this.grounds))
            || !_.isEqual(this.collision, !_.isEmpty(this.collisions))

        ) {

            //console.log(this.controls);
            this.controls.timestamp = Date.now();
            this.pendingControls.push(this.lastControl);
            update = true;
        }

        this.ground = !_.isEmpty(this.grounds);
        this.collision = !_.isEmpty(this.collisions);

        this.lastControl = _.clone(this.controls);
        return update;
    }
};

module.exports = Character;