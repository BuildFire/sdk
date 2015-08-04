var $home = angular.module('home',[]);
var counter=0;
$home.controller('homeCtrl', ['$scope'
    , function ($scope) {

        $scope.logoUrl = "https://s3.amazonaws.com/kaleo.live/mobile/whitelabel/56898399-b378-4ca8-bab7-e75aba7c43a7.png";
        $scope.images = ["http://rack.3.mshcdn.com/media/ZgkyMDEzLzEyLzAzL2M3L01vYmlsZVBsYXRmLmE5NjIxLmpwZwpwCXRodW1iCTk1MHg1MzQjCmUJanBn/4412ed4b/9e6/MobilePlatforms.jpg"];

        for(var i=0;i< $scope.images.length ;i++)
            $scope.images[i]= buildfire.imageLib.resizeImage($scope.images[i],{width:400});


        $scope.appContentId = 123;

        var fn = function(w){
            buildfire.navigateTo(w.widgetId,w.instanceId, w.title);
        };
        $scope.click=fn;

        var widgets = [
            {click:fn, title:"widget1", widgetId:'examplePlugin',instanceId:123, icon:"http://www.graphicsfuel.com/wp-content/uploads/2012/07/steel-app-icon-512.png", requiresConnection:false }
            ,{click:fn,title:"widget2", widgetId:'examplePlugin',instanceId:321, icon:"http://www.canadatechblog.com/wp-content/uploads/2013/08/mzl.iqdiiykr.png", requiresConnection:true}
        ];

        for(var i=0;i< widgets.length ;i++)
            widgets[i].icon= buildfire.imageLib.resizeImage(widgets[i].icon,{width:64});
        $scope.widgets=widgets;

    }
]);