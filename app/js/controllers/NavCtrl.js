var _= require('lodash');

var NavCtrl = function ($scope, $location, $http) {

    var current;
    $http.get('nav/nav.json').success(function (data) {
        console.log(data);

        var index = _.findIndex(data, {'name': 'Chat'});
        if (index >= 0) {
            current = data[index];
            current.active = 'active';
        }
        $scope.items = data;
    });

    $scope.openLink = function (item) {
        if (current)
            current.active = '';
        current = item;
        current.active = 'active';
    }
};

module.exports = NavCtrl;