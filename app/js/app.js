/* App Module */
require("app.css");
require("bootstrap/dist/css/bootstrap.css");
var bootstrap = require('bootstrap');
var angular = require('angular');
var lodash = require('lodash');
var route = require('angular-route');
var animate = require('angular-animate');

var ChatCtrl = require('controllers/ChatCtrl');
var GameCtrl = require('controllers/GameCtrl');
var NavCtrl = require('controllers/NavCtrl');
var GameService = require('services/GameService');

var app = angular.module('jambonsVsZombies', ['ngRoute', 'ngAnimate'])

    .config([
        '$locationProvider',
        '$routeProvider',
        function ($locationProvider, $routeProvider) {
            $routeProvider.
                when('/home', {
                    templateUrl: 'views/home.html',
                    controller: ChatCtrl
                }).
                when('/game', {
                    templateUrl: 'views/game.html',
                    controller: GameCtrl
                }).
                when('/chat', {
                    templateUrl: 'views/chat.html',
                    controller: ChatCtrl
                }).
                otherwise({
                    redirectTo: '/home'
                });
        }
    ])
    // services
    .service("GameService", GameService)

    //Load controllers
    .controller('RootCtrl', []).run(function ($rootScope) {
        $rootScope.user = {
            name: 'anonymous'
        };
    })
    .controller('GameCtrl', ['$scope', GameService, GameCtrl])
    .controller('ChatCtrl', ['$scope', ChatCtrl])
    .controller('NavCtrl', ['$scope', '$location', '$http', NavCtrl]);
