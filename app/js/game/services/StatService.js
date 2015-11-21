var $ = require("jQuery");
var Stats = require("stats.js");

/***
 *
 * @returns {{initStats: initStats}}
 * @constructor
 */
var StatService = function () {

    var $stats;
    var stats;
    var $scope;

    function init(game) {

        $scope= game.$scope
        if (stats == null) {
            stats = new Stats();
            stats.setMode(-1);
        }

        if (!$stats) {
            $stats = $(stats.domElement);
            $stats.css("display", "table");
            $(".stats-container").append($stats);
        }

        // 0: fps, 1: ms, 2: mb
        $scope.$on("toggle stats", function (event, btn) {

            var mode = btn.value;
            var monitor = $stats.children().eq(+mode);
            if (monitor.css("display") == "table-cell") {
                monitor.css("display", "none");
            } else {
                monitor.css("display", "table-cell");

                var destination = $(btn).offset();
                monitor.css({top: destination.top, left: destination.left});
            }

            if ($stats.children().find(":hidden").length == 3) {
                $(".stats-container").remove($stats);
                stats = null;
                $stats = null;
            }
        });
    }

    function getStats(){
        return stats;
    }

    return {
        init : init,
        getStats : getStats
    }
}


module.exports = new StatService();