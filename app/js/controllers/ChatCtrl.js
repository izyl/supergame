var socket = require('socket.io-client')();

var ChatCtrl = function ($scope) {
    $scope.items = [];
    $scope.sendMessage = function () {
        if ($scope.text) {

            var msg = {
                text: $scope.text,
                timestamp: new Date(),
                // scope inheritance
                author: $scope.user.name
            };

            $scope.items.push(msg);
            socket.emit('chat message', msg);
            $scope.text = '';
        }
    };

    socket.on('chat message', function (msg) {
        $scope.items.push(msg);
        $scope.$apply();
    });
};

module.exports = ChatCtrl;