/**
 * Created by Daniel on 7/10/2015.
 */


$app.controller('shellCtrl', ['$scope', '$sce', '$http', '$modal', function ($scope, $sce, $http, $modal) {
		window.$http = $http;
		var config = null;

		/**
		 * Show Dialog
		 * @options {templateUrl : templateUrl , controller: controller , size: size  } a
		 * @callback {function}
		 */
		window.openDialog = function(options, callback){
			if(!options.controller)
				console.warn("window.openDialog :: You have to pass the controller value to the openDialog function");
			var modalInstance = $modal.open({
				animation: true,
				templateUrl: options.templateUrl,
				controller: options.controller,
				size: options.size,
				resolve: {$data : function(){
					return options.data;
				}}
			});

			modalInstance.result.then(function (r) {
				if (callback) {
					callback(r);
				}
			});

			window.closeDialog = function (result) {
				modalInstance.close(result);
			}
		};

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

		$scope.init = function () {
			var pluginFolder = window.location.hash.replace('#', '');
			if (!pluginFolder) pluginFolder = window.appContext.currentPlugin.pluginPath;

			var xmlhttp = new XMLHttpRequest();
			var url = '../plugins/' + pluginFolder + "/plugin.json";

			xmlhttp.onreadystatechange = function () {
				if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
					config = JSON.parse(xmlhttp.responseText);
					$scope.loadFrames(pluginFolder, config);
					$scope.$apply();
				}
				else if (xmlhttp.status >= 300)
					alert('Error loading plugin');

			};

			xmlhttp.open("GET", url, true);
			xmlhttp.send();
		};
		$scope.init();
	}]
);

