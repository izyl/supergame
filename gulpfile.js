"use strict";

var watchify = require("watchify");
var browserify = require("browserify");
var gulp = require("gulp");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var gutil = require("gulp-util");
var sourcemaps = require("gulp-sourcemaps");
var assign = require("lodash.assign");
var clean = require('gulp-clean');
var browserifyCss = require('browserify-css');

var buildDir = "dist/";
var srcDir = "app/";

// add custom browserify options here
var customOpts = {

    entries: [srcDir + "js/main.js"],
    paths: [srcDir + "js", srcDir + "css"],

    debug: true // genere sourceMappingURL=bundle.js.map : permet le mapping des sources pour le debugging
};
var opts = assign({}, watchify.args, customOpts);
gulp.task("default", ["js", "resources"]);

gulp.watch([srcDir + "models/**/*",srcDir + "css/**/*", srcDir + "index.html"], ["resources"]);
gulp.task("resources", resources);
function resources() {

    gulp.src([srcDir + "css/**/*"])
        // Will be put in the [buildDir]/css folder
        .pipe(gulp.dest(buildDir + "css/"));

    gulp.src([srcDir + "models/**/*"])
        // Will be put in the [buildDir]/css folder
        .pipe(gulp.dest(buildDir + "models/"));


    gulp.src(srcDir + "index.html")
        .pipe(gulp.dest(buildDir));
}

gulp.task("js", bundle); // so you can run `gulp` to build the file
function bundle() {

    var b = watchify(browserify(opts));
    b.on("update", bundle); // on any dep update, runs the bundler
    b.on("log", gutil.log); // output build logs to terminal
    /*
     * Ici on exporte les librairies pour qu"elles soient disponibles
     * dans la page appelante sous l"alias [:expose]
     * */

    b.transform('browserify-css', {
        global: true,
        "autoInject": true,
        "minify": false,
        "rootDir": srcDir,
        processRelativeUrl: function (relativeUrl) {
            return relativeUrl;
        }
    });

    return b.bundle()
        // log errors if they happen
        .on("error", gutil.log.bind(gutil, "Browserify Error"))

        .pipe(source("supergame.js"))

        .pipe(clean({read: false}))
        // optional, remove if you don"t need to buffer file contents
        .pipe(buffer())
        // optional, remove if you dont want sourcemaps
        .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
        // Add transformation tasks to the pipeline here.
        .pipe(sourcemaps.write("./")) // writes .map file

        .pipe(gulp.dest(buildDir));
}