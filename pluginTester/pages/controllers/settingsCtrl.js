/**
 * Created by Daniel on 11/8/2015.
 */

$app.controller('settingsCtrl', ['$scope', function ($scope) {
    let key = window.appContext.currentApp.appId;
    let context = {
        currentApp: window.appContext.currentApp,
        currentPlugin: {
            pluginId: key,
            pluginPath: '',
            instanceId: key,
            mode: 0
        }
    };

    $scope.appContext = JSON.parse(JSON.stringify(context));// make a copy

    var tmr;
    $scope.$watch('appContext', function (newContext) {
        if (tmr) clearTimeout(tmr);
        tmr = setTimeout(function () {
            window.appContext = newContext;
            let key = window.appContext.currentApp.appId;
            let context = {
                currentApp: window.appContext.currentApp,
                currentPlugin: {
                    pluginId: key,
                    pluginPath: '',
                    instanceId: key,
                    mode: 0
                }
            };
            window.localStorage.setItem('appContext', JSON.stringify(context));
        }
            , 500);
    }, true);
}]);