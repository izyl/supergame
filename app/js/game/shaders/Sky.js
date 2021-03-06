/*global THREE, requestAnimationFrame, Detector, dat */
var THREE = require("THREE");

THREE.ShaderTypes = {

    'sky': {

        uniforms: {

            topColor: {type: "c", value: new THREE.Color(0x0077ff)},
            bottomColor: {type: "c", value: new THREE.Color(0x0077ff)},
            offset: {type: "f", value: 33},
            exponent: {type: "f", value: 0.6}
        },

        vertexShader: [

            "varying vec3 vWorldPosition;",

            "void main() {",

            "vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
            "vWorldPosition = worldPosition.xyz;",

            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

            "}"
        ].join("\n"),

        fragmentShader: [
            "uniform vec3 topColor;",
            "uniform vec3 bottomColor;",
            "uniform float offset;",
            "uniform float exponent;",

            "varying vec3 vWorldPosition;",

            "void main() {",

            "float h = normalize( vWorldPosition + offset ).y;",
            "gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );",

            "}"

        ].join("\n")

    }

};