/**
 * Created by Daniel on 5/23/2015.
 */
var $app = angular.module('buildfire', ['ngRoute', 'ui.bootstrap', 'ngFileUpload', 'ngMap', 'ngAutocomplete']);

$app.config(['$routeProvider', '$sceDelegateProvider', function ($routeProvider, $sceDelegateProvider) {

	$routeProvider
		.when('/', {
			controller: function () {
				var lastPlugin = window.localStorage.getItem('lastPlugin') || 'myPlugin';
				window.location.hash = '/plugin/' + lastPlugin;
			}, template: '<i>rerouting...</i>'
		})
		.when('/plugin/:pluginFolder', {templateUrl: 'pages/templates/shell.html'})
		.when('/settings', {templateUrl: 'pages/templates/settings.html'})
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
		window.siteConfig.endPoints.pluginHost + '/**'
	]);

}]);

$app.run(function () {
	var user = localStorage.getItem("user");
	if (user) {
		window.currentUser = JSON.parse(user);
	}
});