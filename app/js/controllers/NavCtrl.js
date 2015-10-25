var _ = require('lodash');

var NavCtrl = function ($scope, $location, $http) {

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
};

module.exports = NavCtrl;