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
            buildfire.navigation.navigateTo({pluginId:w.widgetId,instanceId:w.instanceId, title:w.title, folderName:w.folderName});
        };
        $scope.click=fn;

        var widgets = [
            {click:fn, title:"Example", widgetId:'examplePlugin',folderName:'examplePlugin',instanceId:123, icon:"https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQOKEK6H0b9ORLmevNkHpU44XYFP-yvK3OhJLRY5rP0RRykmAOL", requiresConnection:false }
            ,{click:fn,title:"Simple Search", widgetId:'exampleSimpleSearch',folderName :'exampleSimpleSearch',instanceId:321, icon:"https://www.bellbanks.com/wp-content/uploads/2013/02/mobile-app-icon.jpg", requiresConnection:true}
            ,{click:fn,title:"People", widgetId:'peoplePlugin',folderName :'peoplePlugin',instanceId:321, icon:"http://www.allthingsscene.co/wp-content/uploads/2014/07/App-icon.png", requiresConnection:true}
            ,{click:fn,title:"Contact Us", widgetId:'contactUsPlugin',folderName :'contactUsPlugin',instanceId:321, icon:"http://www.codeandlogic.com/media/home/appIcon.png", requiresConnection:true}
            ,{click:fn,title:"Text", widgetId:'textPlugin',folderName :'textPlugin',instanceId:654645, icon:"https://ipadnotebook.files.wordpress.com/2014/01/screen-shot-2014-01-01-at-8-53-44-am.png", requiresConnection:true}
            ,{click:fn,title:"YouTube", widgetId:'youtubePlugin',instanceId:654, icon:"http://files.softicons.com/download/social-media-icons/ios-7-style-social-media-icons-by-design-bolts/png/256x256/YouTube.png", requiresConnection:true}
        ];

        for(var i=0;i< widgets.length ;i++)
            widgets[i].icon= buildfire.imageLib.resizeImage(widgets[i].icon,{width:64});
        $scope.widgets=widgets;

    }
]);
