/**
 * Created by Daniel on 7/10/2015.
 */


$app.controller('shellCtrl', ['$scope', '$sce', '$http', '$modal', function ($scope, $sce, $http, $modal) {
		window.$http = $http;
		var config = null;


		$scope.dataTracer = "http://int2.myapp.buildfire.com:89/#/dataTracer/" + window.appContext.currentApp.appId
		+ "/" + window.appContext.currentPlugin.pluginPath
		+ "/" +window.appContext.currentPlugin.instanceId
		+ "/" + window.appContext.currentApp.keys.datastoreKey;


		/**
		 * Show Dialog
		 * @options {templateUrl : templateUrl , controller: controller , size: size  } a
		 * @callback {function}
		 */
		window.openDialog = function(options, callback){
			if(!options.controller)
				console.warn("window.openDialog :: You have to pass the controller value to the openDialog function");
			var d = new Dialog($modal,options,callback);
			d.open();
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

function Dialog($model,options,callback){
	this.$model = $model;
	this.modalInstance = null;
	this.options = options;
	this.callback = callback;
};

Dialog.prototype.open = function(){
	
	var t = this;
	if(!this.options.data)
		this.options.data = {};

	this.options.data.dialog = this;
	this.modalInstance = this.$model.open({
		animation: true,
		templateUrl: this.options.templateUrl,
		controller: this.options.controller,
		size: this.options.size,
		resolve: {$data : function(){
			return t.options.data;
		},
			$dialog : function(){
				return t;
			}}
	});

	this.modalInstance.result.then(function(r){
		if(t.callback){
			t.callback(r);
		}
	});
};

Dialog.prototype.close = function(result){
	this.modalInstance.close(result);
};