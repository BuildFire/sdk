var $home = angular.module('home',[]);
var counter=0;
$home.controller('homeCtrl', ['$scope'
    , function ($scope) {

        $scope.logoUrl = "/images/logo.jpg";
        //$scope.logoUrl = "http://www.placehold.it/200x50";
        $scope.images = ["http://www.placehold.it/500x400"
            ,"http://www.placehold.it/501x401"];

        $scope.appContentId = 123;

        var fn = function(w){
            buildfire.navigateTo(w.widgetId,w.instanceId, w.title);
        };
        $scope.click=fn;

        var widgets = [
            {click:fn, title:"widget1", widgetId:'examplePlugin',instanceId:123, icon:"icon-home", requiresConnection:false }
            ,{click:fn,title:"widget2", widgetId:'examplePlugin',instanceId:321, icon:"icon-home", requiresConnection:true}
        ];

        $scope.widgets=widgets;

    }
]);