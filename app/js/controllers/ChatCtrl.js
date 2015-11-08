var socket = require('socket.io-client')();
var $ = require("jQuery");
var toastr = require("toastr");

var ChatCtrl = function ($scope) {

    var id = Date.now();
    $scope.items = [];
    $scope.showChat = false;

    $(document).keydown(function (event) {

        console.log("id", id);
        if (event.keyCode === 13)
            $scope.showChat = true;

        if (event.keyCode === 27)
            $scope.showChat = false;

        $scope.$apply();
    });

    $scope.sendMessage = function () {
        if ($scope.text) {

            var msg = {
                text: $scope.text,
                timestamp: new Date(),
                // scope inheritance
                author: $scope.user.name
            };

            $scope.items.push(msg);
            socket.emit('client:chat message', msg);
            $scope.text = '';
        }
    };

    socket.on('server:chat message', function (msg) {
        $scope.items.push(msg);
        console.log(msg);
        toastr.success(msg.author + " : " + msg.text );
        $scope.$apply();
    });
};

module.exports = ChatCtrl;