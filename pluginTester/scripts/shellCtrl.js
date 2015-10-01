/**
 * Created by Daniel on 7/10/2015.
 */


$app.controller('shellCtrl', ['$scope', '$sce', '$http', function ($scope, $sce, $http) {
        window.$http = $http;
        var config = null;
        var widgetIframe = document.getElementById('widget');
        $scope.link = {
            deeplinkData: ""
        };

        $scope.dataTracer = "http://int2.myapp.buildfire.com:89/#/dataTracer/" + window.appContext.currentApp.appId
        + "/" + window.appContext.currentPlugin.pluginPath
        + "/" + window.appContext.currentPlugin.instanceId
        + "/" + window.appContext.currentApp.keys.datastoreKey;


        $scope.loadFrames = function (pluginFolder, config) {
            var root = '../plugins/';
            $scope.widgetSrc = root + pluginFolder + '/widget/index.html';

            if (config.control.settings.enabled) {
                $scope.currentControl = $scope.settingsSrc = root + pluginFolder + '/control/settings/index.html';
                $sce.trustAsResourceUrl($scope.currentControl);
            }

            if (config.control.design.enabled) {
                $scope.currentControl = $scope.designSrc = root + pluginFolder + '/control/design/index.html';
                $sce.trustAsResourceUrl($scope.currentControl);
            }

            if (config.control.content.enabled) {
                $scope.currentControl = $scope.contentSrc = root + pluginFolder + '/control/content/index.html';
                $sce.trustAsResourceUrl($scope.currentControl);
            }

            $scope.$apply();
        };

        $scope.loadIFrame = function (section, e) {
            var pluginFolder = window.location.hash.replace('#', '');
            if (!pluginFolder) pluginFolder = window.appContext.currentPlugin.pluginPath;

            $scope.currentControl = '../plugins/' + pluginFolder + '/control/' + section + '/index.html';
            var element = document.querySelector('.active');
            if (element)element.className = '';
            e.target.className = 'active'

        };

        /****************keep track of recent plugins *****/
        function keepTrackOfRecentPlugins(pluginFolder) {
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
            if (pluginFolder) {
                var index = recentPlugins.indexOf(pluginFolder);
                if (index > 0)
                    recentPlugins.splice(index, 1);

                if (index != 0)
                    recentPlugins.unshift(pluginFolder);

                if (recentPlugins.length > 5) // lust keep the last 5
                    recentPlugins.pop();
            }
            $scope.recentPlugins = recentPlugins;
            localStorage.setItem('__recentPlugins', JSON.stringify(recentPlugins));
        }

        $scope.init = function () {
            var pluginFolder = window.location.hash.replace('#', '');
            if (!pluginFolder) pluginFolder = window.appContext.currentPlugin.pluginPath;

            var xmlhttp = new XMLHttpRequest();
            var url = '../plugins/' + pluginFolder + "/plugin.json";

            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    config = JSON.parse(xmlhttp.responseText);
                    $scope.loadFrames(pluginFolder, config);
                    keepTrackOfRecentPlugins(pluginFolder);
                    $scope.pluginFolder=pluginFolder;
                    $scope.$apply();
                }
                else if (xmlhttp.status >= 300)
                    alert('Error loading plugin');

            };

            xmlhttp.open("GET", url, true);
            xmlhttp.send();


        };


        $scope.init();

        $scope.sendDeeplinkData = function () {
            debugger;
            widgetIframe.src = $scope.widgetSrc.split("?")[0] + "?dld=" + $scope.link.deeplinkData;
        };

        if (postMaster.widgetPluginAPI && postMaster.controlPluginAPI) {
            postMaster.controlPluginAPI.spinner.show = postMaster.widgetPluginAPI.spinner.show = function () {
                $scope.showSpinner = true;
                $scope.$apply();
            };

            postMaster.controlPluginAPI.spinner.hide = postMaster.widgetPluginAPI.spinner.hide = function () {
                $scope.showSpinner = false;
                $scope.$apply();
            };
        }

    }]
);

