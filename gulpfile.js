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

    entries: [srcDir + "js/app.js"],
    paths: [srcDir + "js", srcDir + "css"],

    debug: true // genere sourceMappingURL=bundle.js.map : permet le mapping des sources pour le debugging
};
var opts = assign({}, watchify.args, customOpts);
gulp.task("default", ["js", "resources"]);

gulp.watch([srcDir + "models/**/*", srcDir + "index.html", srcDir + "nav/**/*", srcDir + "views/**/*"], ["resources"]);
gulp.task("resources", resources);
function resources() {

    gutil.log("copyinh resources : " + new Date());

    gulp.src([srcDir + "models/**/*"])
        .pipe(gulp.dest(buildDir + "models/"));

    gulp.src([srcDir + "img/**/*"])
        .pipe(gulp.dest(buildDir + "img/"));

    gulp.src(["node_modules/bootstrap/dist/fonts/**/*"])
        .pipe(gulp.dest(buildDir + "fonts/"));

    gulp.src([srcDir + "nav/**/*"])
        .pipe(gulp.dest(buildDir + "nav/"));

    gulp.src([srcDir + "views/**/*"])
        .pipe(gulp.dest(buildDir + "views/"));

    gulp.src(srcDir + "index.html")
        .pipe(gulp.dest(buildDir));
}

gulp.task("js", bundle); // so you can run `gulp` to build the file
function bundle() {

    gutil.log("bundling js : " + new Date());

    //gutil.log(opts);
    var b = watchify(browserify([], opts));
    b.on("update", bundle); // on any dep update, runs the bundler
    b.on("log", gutil.log); // output build logs to terminal
    b.transform(browserifyCss, {
        global: true,
        "rootDir": "node_modules",
        rebaseUrls : false
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