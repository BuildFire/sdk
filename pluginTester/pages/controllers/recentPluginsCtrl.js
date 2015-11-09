/**
 * Created by Daniel on 11/8/2015.
 */

$app.controller('recentPluginsCtrl', ['$scope', function ($scope) {

    var recentPlugins = localStorage.getItem('__recentPlugins');
        if (recentPlugins) {
            try {
                recentPlugins = JSON.parse(recentPlugins);
            }
            catch (e) {
            }
        }
        if (!(recentPlugins && recentPlugins.length))
            recentPlugins = [];

        $scope.recentPlugins = recentPlugins;
    }]
);

