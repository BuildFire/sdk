/**
 * Created by Daniel on 11/8/2015.
 */

$app.controller('settingsCtrl', ['$scope', function ($scope) {

    $scope.appContext=JSON.parse(JSON.stringify(window.appContext)) ;// make a copy

    var tmr;
    $scope.$watch('appContext',function(newContext){
        if(tmr)clearTimeout(tmr);
        tmr = setTimeout(function(){
            window.appContext = newContext;
            window.localStorage.setItem('appContext',JSON.stringify(window.appContext));
        }
        ,500);
    },true);
}]);