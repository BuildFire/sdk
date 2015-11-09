/**
 * Created by Daniel on 11/8/2015.
 */

$app.controller('settingsCtrl', ['$scope', function ($scope) {
debugger;
    $scope.appContext=JSON.parse(JSON.stringify(window.appContext)) ;// make a copy

}]);