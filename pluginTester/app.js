/**
 * Created by Daniel on 5/23/2015.
 */
var $app = angular.module('buildfire', ['ngRoute', 'ui.bootstrap', 'ngFileUpload', 'ngMap', 'ngAutocomplete','angularGrid','mp.colorPicker']);

$app.config(['$routeProvider', '$sceDelegateProvider','$sceProvider', function ($routeProvider, $sceDelegateProvider,$sceProvider) {

    // Completely disable SCE.  For demonstration purposes only!
    // Do not use in new projects.
    $sceProvider.enabled(false);

	$routeProvider
		.when('/', {
			controller: function () {
				var lastPlugin = window.localStorage.getItem('lastPlugin') || 'myPlugin';
				window.location.hash = '/plugin/' + lastPlugin;
			}, template: '<i>rerouting...</i>'
		})
		.when('/plugin/:pluginFolder', {templateUrl: 'pages/templates/shell.html'})
		.when('/settings', {templateUrl: 'pages/templates/settings.html'})
		.when('/apiKeys', {templateUrl: 'pages/templates/apiKeys.html'})
		.when('/login', {templateUrl: 'pages/templates/login.html'})
		.when('/logout', {
			controller: function () {
				localStorage.removeItem("user");
				delete window.currentUser;
				window.location.hash = '/';
			}, template: '<i>rerouting...</i>'})
		.otherwise({redirectTo: '/404'})
	;

	$sceDelegateProvider.resourceUrlWhitelist([
		// Allow same origin resource loads.
		'self',
		// Allow loading from our assets domain.  Notice the difference between * and **.
		window.siteConfig.endPoints.pluginHost + '/**',
		// Allow webpack plugins
		'http://127.0.0.1:8080/**'
	]);

}]);

$app.run(function () {
	window._appRoot = '';
	var user = localStorage.getItem("user");
	if (user) {
		window.currentUser = JSON.parse(user);
	}
});

var __tmrToastClearOut;
$app.controller('toastCtrl', ['$scope', function ($scope) {

	function clear() {
		$scope.showToast = false;
		if (!$scope.$$phase) $scope.$apply();
		$scope.text = '';
	}

	window.toast = function (text, style) {
		__tmrToastClearOut = setTimeout(clear, 5000);
		if ($scope.text && $scope.text != text)
			$scope.text += ' ' + text;
		else
			$scope.text = text;
		if (!style) style = 'success';
		$scope.style = style + ' active';

		$scope.showToast = true;
		if (!$scope.$$phase) $scope.$apply();
	};
}]);