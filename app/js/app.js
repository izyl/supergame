/* App Module */
require("bootstrap/dist/css/bootstrap.css");
require("toastr/build/toastr.css");
require("app.css");

var bootstrap = require('bootstrap');
var angular = require('angular');
var lodash = require('lodash');
var route = require('angular-route');
var animate = require('angular-animate');

var ChatCtrl = require('controllers/ChatCtrl');
var GameCtrl = require('controllers/GameCtrl');
var NavCtrl = require('controllers/NavCtrl');

var app = angular.module('jambonsVsZombies', ['ngRoute', 'ngAnimate'])

    .config([
        '$locationProvider',
        '$routeProvider',
        function ($locationProvider, $routeProvider) {
            $routeProvider.
            when('/home', {
                templateUrl: 'views/home.html'
            }).
            when('/game', {
                templateUrl: 'views/game.html'
            }).
            otherwise({
                redirectTo: '/home'
            });
        }
    ])
    // services

    //Load controllers
    .controller('RootCtrl', []).run(function ($rootScope) {
        $rootScope.user = {
            name: 'anonymous'
        };

        $rootScope.$on("player name", function (event, data) {
            $rootScope.user.name = data;
        });

    })
    .controller('GameCtrl', ['$scope', GameCtrl])
    .controller('ChatCtrl', ['$scope', ChatCtrl])
    .controller('NavCtrl', ['$scope', '$location', '$http', '$rootScope', NavCtrl]);
