var toastr = require("toastr");
toastr.options = {
    "positionClass": "toast-top-center"
};

var GameCtrl = function ($scope, GameService) {

    $scope.init = function(){
        var game = require("game/game");
        game.restore($scope);
    }

    $scope.$on("toast", function(event, data){
        toastr.info(data);
    });
};

module.exports = GameCtrl;