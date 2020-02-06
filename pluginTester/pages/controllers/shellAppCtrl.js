/**
 * Created by Daniel on 7/10/2015.
 */


$app.controller('shellAppCtrl', ['$rootScope', '$scope', '$routeParams', '$sce', '$http', function ($rootScope, $scope, $routeParams, $sce, $http) {
	window.$http = $http;
	var config = null;
	var widgetIframe = document.getElementById('widget');
	$scope.link = {
			deeplinkData: ""
	};
	$scope.currentAppUser = window.currentAppUser;

	if (postMaster.widgetPluginAPI.history.historyItems.length == 0) {
			postMaster.widgetPluginAPI.history.historyItems.push({label: 'Plugin', source: 'control',  options: { pluginData: undefined }});
			if (!$scope.$$phase) $scope.$apply();
	}
	postMaster.widgetPluginAPI.history.onUpdate(function (data) {
			if (data.historyItems) {
					for (var i = 0; i < data.historyItems.length; i++) {
							data.historyItems[i].title = decodeURIComponent(data.historyItems[i].title);
					}
					$scope.breadcrumbs = data.historyItems.slice(0);
			}
			else {
					$scope.breadcrumbs = [];
			}
			if (!$scope.$$phase) $scope.$apply();
	});
	postMaster.widgetPluginAPI.history.onPop(function (data) {
			if (data.popTriggered) {
					return;
			}
			var packet = new Packet(null, "history.triggerOnPop", JSON.parse(angular.toJson(data.poppedItem)));
			postMaster.controlPluginAPI.sendMessage(null, packet);
			data.popTriggered = true;
	});
	$scope.popHistoryItem = function (event, breadcrumb) {
			postMaster.widgetPluginAPI.history.pop(breadcrumb);
	};

	$scope.loadWebpackFrames = function(config) {
			var root =  window.location.protocol + '//' + window.location.hostname + ':' + config.webpack;
        	postMaster.widgetPluginAPI.getContext(null, function(err, context){
                var contextQueryParameter = 'appcontext=' + encodeURIComponent(JSON.stringify(context));
                $scope.widgetSrc = root + '/widget/index.html?fid=widget&' + contextQueryParameter;

                if ($scope.isWidgetShell && config.widget && config.widget.service) {
                    serviceFrame = document.createElement('iframe');
                    serviceFrame.sandbox="allow-scripts allow-forms allow-same-origin";
                    serviceFrame.id='service';
                    serviceFrame.style.display='none';
                    serviceFrame.src = root + '/widget/' + config.widget.service + "?fid=service&" + contextQueryParameter;
                    document.body.appendChild(serviceFrame);
                }

                $scope.pluginControlIframeVisible = true;

                if (!$scope.$$phase)
                    $scope.$apply();
			});

	}

	window.serviceFrame;
	$scope.loadFrames = function (pluginFolder, config) {
			var root =  '../plugins/';
			postMaster.widgetPluginAPI.getContext(null, function(err, context){
                var contextQueryParameter = 'appcontext=' + encodeURIComponent(JSON.stringify(context));
                $scope.widgetSrc = root + pluginFolder + '/widget/index.html?fid=widget&' + contextQueryParameter;

                if ($scope.isWidgetShell && config.widget && config.widget.service) {
                    serviceFrame = document.createElement('iframe');
                    serviceFrame.sandbox="allow-scripts allow-forms allow-same-origin";
                    serviceFrame.id='service';
                    serviceFrame.style.display='none';
                    serviceFrame.src = root + pluginFolder + '/widget/' + config.widget.service + "?fid=service&" + contextQueryParameter;
                    document.body.appendChild(serviceFrame);
                }
			});

			if (!$scope.$$phase)
					$scope.$apply();
	};

	var displayEmulator = function(value){
			$rootScope.hideEmulator = value;
	};

	$scope.init = function () {
			var pluginFolder = $routeParams.pluginFolder;
			if (!pluginFolder) pluginFolder = window.appContext.currentPlugin.pluginPath;

			var xmlhttp = new XMLHttpRequest();
			var url = '../plugins/' + pluginFolder + "/plugin.json";

			xmlhttp.onreadystatechange = function () {
					if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
							config = JSON.parse(xmlhttp.responseText);
							$scope.pluginConfig = config;
							$scope.$apply();

							if (config.webpack) {
									$scope.loadWebpackFrames(config);
							} else {
									$scope.loadFrames(pluginFolder, config);
							}

							// $scope.navToValue = $scope.pluginFolder = pluginFolder;
							// keepTrackOfRecentPlugins(pluginFolder);

							var hideEmulator = (config.widget && typeof config.widget.enabled != 'undefined') ? !config.widget.enabled : false;

							displayEmulator(hideEmulator);
					}
					else if (xmlhttp.status >= 300)
							$scope.errorMessage = 'Error loading plugin';

					if (!$scope.$$phase)    $scope.$apply();
			};

			xmlhttp.open("GET", url, true);
			xmlhttp.send();


	};


	$scope.init();

	$scope.back = function () {
			var packet = new Packet(null, "navigation.onBackButtonClick");
			postMaster.widgetPluginAPI.sendMessage(null, packet);
	};

	var clickCounter = 0;
	$scope.titleClick = function () {
			clickCounter++;
			setTimeout(function () {
					clickCounter--;
			}, 3000);
			if (clickCounter > 5) {
					var packet = new Packet(null, "logger.showHistory");
					postMaster.widgetPluginAPI.sendMessage(null, packet);
			}
	};

	$scope.sendDeeplinkData = function () {
        postMaster.widgetPluginAPI.getContext(null, function(err, context){
            widgetIframe.src = $scope.widgetSrc.split("?")[0] + "?fid=widget&dld=" + $scope.link.deeplinkData + '&appcontext=' + encodeURIComponent(JSON.stringify(context));
		});
	};

	$scope.appLogin = function () {
		postMaster.widgetPluginAPI.auth.login({}, function (error, user) {
			if (error) return console.error(user);
			$scope.currentAppUser = user;
			window.currentAppUser = user;
			if (!$scope.$$phase) $scope.$apply();
		});
	};

	$scope.appLogout = function () {
		postMaster.widgetPluginAPI.auth.logout();
		$scope.currentAppUser = null;
		window.currentAppUser = null;
		if (!$scope.$$phase) $scope.$apply();
	};

	clickFeedback = function () {
			return;
	};

	postMaster.widgetPluginAPI.spinner = window.spinner;
	postMaster.widgetPluginAPI.auth = { ...postMaster.widgetPluginAPI.auth };
	postMaster.widgetPluginAPI.auth.secondaryUserLookup = function () { // prefer this
		return null;
	}

	// loop services and override
}]
);

