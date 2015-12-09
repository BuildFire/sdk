/**
 * Created by Daniel on 11/8/2015.
 */

$app.controller('indexCtrl', ['$scope', function ($scope) {

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


    $scope.dataTracer = "http://beta.app.buildfire.com:89/#/dataTracer/" + window.appContext.currentApp.appId
        + "/" + window.appContext.currentPlugin.pluginPath
        + "/" + window.appContext.currentPlugin.instanceId
        + "/" + window.appContext.currentApp.keys.datastoreKey;

}]);

