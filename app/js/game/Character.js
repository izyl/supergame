/**
 * @author alteredq / http://alteredqualia.com/
 */
var THREE = require("THREE");
require("game/loaders/ColladaLoader");

Character = function () {

    var scope = this;

    this.scale = 1;

    // animation parameters
    this.animationFPS = 20;
    this.transitionFrames = 15;

    // movement model parameters
    this.maxSpeed = 6;

    // rig
    this.root = new THREE.Object3D();
    this.verticalVelocity = 9.8 * 100;
    this.isOnObject = true;
    this.fontblock = false;

    this.meshBody = null;
    this.meshWeapon = null;
    this.controls = null;

    // skins
    this.skinsBody = [];
    this.skinsWeapon = [];
    this.weapons = [];

    this.currentSkin = undefined;

    this.onLoadComplete = function () {
    };

    // internals

    this.meshes = [];
    this.animations = {};

    this.loadCounter = 0;

    // internal movement control variables

    this.speed = 0;
    this.bodyOrientation = 0;

    this.walkSpeed = this.maxSpeed;
    this.crouchSpeed = this.maxSpeed * 0.5;

    // internal animation parameters

    this.activeAnimation = null;
    this.oldAnimation = null;

    this.controls = {

        up: false,
        down: false,
        left: false,
        right: false,
        crouch: false,
        jump: false,
        attack: false
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
        for (var i = 0; i < config.weapons.length; i++) weaponsTextures[i] = config.weapons[i][1];

        // SKINS
        this.skinsBody = loadTextures(config.baseUrl + "skins/", config.skins);
        this.skinsWeapon = loadTextures(config.baseUrl + "skins/", weaponsTextures);

        // BODY
        var loader = new THREE.JSONLoader();

        loader.load(config.baseUrl + config.body, function (geo) {
            geo.computeBoundingBox();
            scope.root.position.y = -scope.scale * geo.boundingBox.min.y + 1;

            var mesh = createPart(geo, scope.skinsBody[0]);
            scope.root.add(mesh);
            scope.meshBody = mesh;
            scope.meshes.push(mesh);

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

    this.updateFromData = function (delta, controls) {
        this.controls = controls;
        this.update(delta);
    };

    this.update = function (delta) {

        if (this.controls) this.updateMovementModel(delta);

        if (this.animations) {
            this.updateBehaviors(delta);
            this.updateAnimations(delta);
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

    this.updateMovementModel = function (delta) {

        var controls = this.controls;
        // speed based on controls

        if (controls.crouch)    this.maxSpeed = this.crouchSpeed;
        else this.maxSpeed = this.walkSpeed;

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

        // displacement

        if(!this.fontblock){

            var forwardDelta = this.speed * delta;

            this.root.position.x += Math.sin(this.bodyOrientation) * forwardDelta;
            this.root.position.z += Math.cos(this.bodyOrientation) * forwardDelta;
        }

        // steering
        this.root.rotation.y = this.bodyOrientation;

        this.verticalVelocity = 9.8;
        this.verticalVelocity = Math.abs(this.verticalVelocity * delta);
        if (controls.jump) {
            this.isOnObject = false;

        } else if (!this.isOnObject) {
            this.verticalVelocity = this.verticalVelocity * -1;
        }

        if (this.jump || !this.isOnObject) {
            this.root.translateY(this.verticalVelocity);
        }

        if (this.isOnObject === true) {
            this.verticalVelocity = Math.max(0, this.verticalVelocity);
            this.controls.canJump = true;
        }


        if (this.root.position.y < -1) {

            this.verticalVelocity = 0;
            this.root.position.y = 1;

            this.controls.canJump = true;
            this.isOnObject = true;
        }
    };

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

    function exponentialEaseOut(k) {
        return k === 1 ? 1 : -Math.pow(2, -10 * k) + 1;
    }

};

module.exports = Character;