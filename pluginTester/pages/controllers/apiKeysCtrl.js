'use strict';
$app.controller('apiKeysCtrl', ['$scope',
    function ($scope) {
        $scope.keys = {};

        $scope.load = function () {
            var keys = localStorage.getItem('apiKeys');
            if (keys) {
                keys = JSON.parse(keys);
            }
            $scope.keys = keys;
        };

        $scope.load();

        $scope.save = function () {
            var keys = {};
            angular.copy($scope.keys, keys);
            localStorage.setItem('apiKeys', JSON.stringify(keys));

            window.appContext.currentApp.apiKeys = keys;

            window.toast('Saved');
        };
    }]);
