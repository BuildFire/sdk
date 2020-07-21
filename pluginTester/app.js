/**
 * Created by Daniel on 5/23/2015.
 */
var $app = angular.module('buildfire', ['ngRoute', 'ui.bootstrap', 'ngFileUpload', 'ngMap', 'ngAutocomplete', 'angularGrid', 'mp.colorPicker', 'infinite-scroll']);
$app.config(['$routeProvider', '$sceDelegateProvider', '$sceProvider', '$httpProvider', function ($routeProvider, $sceDelegateProvider, $sceProvider, $httpProvider) {
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
            }, template: '<i>rerouting...</i>'
        })
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
    $httpProvider.interceptors.push('httpInterceptor');
}]);
$app.run(function () {
    window._appRoot = '';
    var user = localStorage.getItem("user");
    if (user) {
        window.currentUser = JSON.parse(user);
    }
    var appUser = localStorage.getItem("AUTH_CURRENT_USER");
    if (appUser) {
        window.currentAppUser = JSON.parse(appUser);
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
window.spinner = {
    element: null,
    hideCount: 0,
    hideTimer: null,
    hide: function (forceHide) {
        console.log('hide', {
            forceHide: forceHide,
            hideCount: window.spinner.hideCount,
            element: window.spinner.element
        });
        if (!window.spinner.element) {
            window.spinner.element = document.getElementById('loading-bar-spinner');
        }
        window.spinner.hideCount--;
        if (window.spinner.hideCount <= 0 || forceHide) {
            window.spinner.element.style.display = 'none';
            window.spinner.hideCount = 0;
            if (window.spinner.hideTimer) {
                clearTimeout(window.spinner.hideTimer);
            }
        }
        ;
    },
    show: function(options) {
        console.log('show', { hideCount: window.spinner.hideCount });

        if (!window.spinner.element) {
            window.spinner.element = document.getElementById('loading-bar-spinner');
        }

        if (!options) options = {};

        var timeout = 10000;

        if (options.timeout && typeof options.timeout == 'number') {
            if (options.timeout > 60000) options.timeout = 60000;
            if (options.timeout < 1000) options.timeout = 1000;

            timeout = options.timeout;
        }

        if (window.spinner.hideCount == 0) {
            window.spinner.hideTimer = setTimeout(function() {
                window.spinner.hide(true);
            }, timeout);
        }

        window.spinner.hideCount++;
        window.spinner.element.style.display = 'block';
    }
};
$app.factory('httpInterceptor', function ($q, $rootScope) {
    return {
        'request': function (config) {
            if (config.url.indexOf(window.siteConfig.endPoints.appHost + '/api') > -1) {
                var user = localStorage.getItem('user');
                if (user) {
                    user = JSON.parse(user);
                    config.headers.auth = user.auth;
                    config.headers.userToken = user.userToken;
                }
            }
            return config;
        },
        'responseError': function (e) {
            if (e.config.bypassInterceptorForStatus == e.status) {
                // will be handled locally
                return $q.reject(e);
            }
            if (e && e.config && e.config.url && e.config.url.indexOf(window.siteConfig.endPoints.appHost + '/api') > -1) {
                if (e && (e.status == 401 || e.status == 403)) {
                    //auth or userToken are not valid .. kick Out the user
                    window.location.hash = 'login';
                }
            }
            return $q.reject(e);
        }
    };
});