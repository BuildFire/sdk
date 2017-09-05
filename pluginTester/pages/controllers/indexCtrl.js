/**
 * Created by Daniel on 11/8/2015.
 */

$app.controller('indexCtrl', ['$scope', function ($scope) {
    //show navigation bar by default
    $scope.showNavigationBar = true;
    
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


    $scope.dataTracer = "https://dev.buildfire.com/#/dataTracer/" + window.appContext.currentApp.appId
        + "/" + window.appContext.currentPlugin.pluginPath
        + "/" + window.appContext.currentPlugin.instanceId
        + "/" + window.appContext.currentApp.keys.datastoreKey;

}]);

