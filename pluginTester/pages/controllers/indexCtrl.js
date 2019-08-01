/**
 * Created by Daniel on 11/8/2015.
 */

$app.controller('indexCtrl', ['$scope', '$http', function ($scope, $http) {
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

    var sdkReleaseUrl = 'https://api.github.com/repos/buildfire/sdk/releases/latest',
        packageJsonUrl = '/package.json',
        sdkWikiLink = 'https://github.com/BuildFire/sdk/wiki/How-to-Update-the-SDK',
        storageKey = 'sdkVersion',
        releaseSdkVersion, localSdkVersion;

    var storage = localStorage.getItem(storageKey);

    if(storage){
        var cache = JSON.parse(storage),
            now = new Date(),
            lastCheckDate = new Date(cache.date),
            timeDiff = Math.abs(now.getTime() - lastCheckDate.getTime()),
            diffInHours = timeDiff / (1000 * 60 * 60);

        if(diffInHours < 2){
            return;
        }
    }

    $http.get(sdkReleaseUrl)
        .success(function (result) {
            if (result) {
                releaseSdkVersion = result.tag_name;

                $http.get(packageJsonUrl)
                    .success(function (result) {
                        if (result) {
                            localSdkVersion = result.version;

                            if(releaseSdkVersion != localSdkVersion){
                                $scope.sdkMessage = 'Your SDK is not up to date. (' + localSdkVersion + ' -> ' + releaseSdkVersion + ')';
                                $scope.status = 'text-danger';
                                $scope.sdkWikiLink = sdkWikiLink;
                            }
                            else{
                                $scope.sdkMessage = '';
                                $scope.status = 'text-primary';
                            }

                            var updatedCache = {
                                version: releaseSdkVersion,
                                date: new Date()
                            };

                            localStorage.setItem(storageKey, JSON.stringify(updatedCache));
                        }
                    }).error(function (err) {
                    console.warn('Error fetching package.json', err);
                });
            }
        }).error(function (err) {
        console.warn('Error fetching SDK release version', err);
    });

}]);

