var _ = require("lodash");
var THREE = require("THREE");

var PlayerControl = function () {

    var controls = {
        up: false,
        down: false,
        left: false,
        right: false,
        crouch: false,
        jump: false,
        attack: false
    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('mousedown', mouseDown, false);
    document.addEventListener('mouseup', mouseUp, false);

    function mouseDown(event) {

        if(event.button === THREE.MOUSE.RIGHT ){
            controls.jump = true;
        }
    }

    function mouseUp(event) {

        if(event.button === THREE.MOUSE.RIGHT ){
            controls.jump = false;
        }
    }



// TODO : Faire Diff�rentes classes pour les controls (clavier, souris), Un InputController (pouvoir changer le mode de control)
    function onKeyDown(event) {

        switch (event.keyCode) {

            case 38: /* up */
            case 87: /* W querty wsad */
            case 90: /* Z azert zsqd */

                controls.up = true;
                break;

            case 40: /* down */
            case 83: /* S */
                controls.down = true;
                break;

            case 37: /* left */
            case 65: /* A */
            case 81: /* Q */
                controls.left = true;
                break;

            case 39: /* right */
            case 68: /* D */
                controls.right = true;
                break;

            case 67: /* C */
                controls.crouch = true;
                break;
            case 17: /* ctrl */
                controls.attack = true;
                break;

            case 32: // space
                controls.jump = true;
                break;
        }
    };

    function onKeyUp(event) {

        switch (event.keyCode) {

            case 38: /* up */
            case 87: /* W querty wsad */
            case 90: /* Z azert zsqd */

                controls.up = false;
                break;

            case 40: /* down */
            case 83: /* S */
                controls.down = false;
                break;

            case 37: /* left */
            case 65: /* A */
            case 81: /* Q */
                controls.left = false;
                break;

            case 39: /* right */
            case 68: /* D */
                controls.right = false;
                break;

            case 67: /* C */
                controls.crouch = false;
                break;
            case 32: /* space */
                controls.jump = false;
                break;
            case 17: /* ctrl */
                controls.attack = false;
                break;
        }
    };

    return controls;
};

module.exports = PlayerControl;