var _ = require('lodash');
var $ = require("jQuery");

var NavCtrl = function ($scope, $location, $http, $rootScope) {

    var current;

    $http.get('nav/nav.json').success(function (data) {
        $scope.items = data;

        var path = "#" + $location.path();
        var res = _.find($scope.items, {'href': path});

        if (!res) {
            res = _.find($scope.items, {'href': '#/home'});
        }
        $scope.openLink(res);
    });

    $scope.openLink = function (item) {
        if (current)
            current.active = '';
        current = item;
        current.active = 'active';
    };
    // 0: fps, 1: ms, 2: mb
    $scope.toggleStats = function ($event) {
        $rootScope.$broadcast("toggle stats", $event.target);
    };

    $scope.toggleMap = function ($event) {
        $rootScope.$broadcast("toggle minimap");
    };

    $scope.toggleShadow = function ($event) {
        $rootScope.$broadcast("toggle shadow");
    };

    $scope.toggleCollisions = function ($event) {
        $rootScope.$broadcast("toggle collisions");
    };

    $scope.showChat = function () {
        $rootScope.$broadcast("show chat");
    };

    $scope.hideChat = function () {
        $rootScope.$broadcast("hide chat");
    };

    $scope.logoff = function () {
        $location.path("/")
        window.location="/";
    };


};

module.exports = NavCtrl;