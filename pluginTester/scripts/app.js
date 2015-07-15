/**
 * Created by Daniel on 5/23/2015.
 */
var $app = angular.module('buildfire',[]);

$app.config(['$sceDelegateProvider',function ($sceDelegateProvider) {

    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        // Allow loading from our assets domain.  Notice the difference between * and **.
        window.siteConfig.endPoints.pluginHost + '/**'
    ]);

}]);

