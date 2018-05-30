$app.service('gdprService', [function () {
    var service = {};

    service.shouldShowAppTerms = function() {
        if (appContext.currentApp && appContext.currentApp.config && appContext.currentApp.config.TermsOfUse) {
            return appContext.currentApp.config.TermsOfUse.indexOf('appdocumentation.com') < 0;
        } else {
            return false;
        }
    }

    return service;
}]);
