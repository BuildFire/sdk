(function () {

    var strContext = window.localStorage.getItem('appContext');
    if (strContext) {
        try {
            window.appContext = JSON.parse(strContext);
        } catch (e) {
        }
    }

    if (!window.appContext || !window.appContext.currentApp || !window.appContext.currentApp.config) {
        var key = window.localStorage.getItem('autoGenKey'); //legacy
        if (!key) key = ((new Date()).getTime() + "-" + Math.random()).replace(".", "");
        window.appContext = {
            currentApp: {
                appId: key
                , keys: {datastoreKey: key}
                , config: {type: "trial"}
            }
            , currentPlugin: {
                pluginId: key
                , pluginPath: ''
                , instanceId: key
                , mode: 0
            }
        };

        window.localStorage.setItem('appContext', JSON.stringify(window.appContext));
    }
    if (window.appContext.currentApp) {
        window.appContext.currentApp.liveMode = 0;
    }

    var hash = window.location.hash.split('/');
    if (hash && hash.length > 2)
        hash = hash[2];
    else
        hash = "myPlugin";

    window.appContext.currentPlugin.pluginPath = hash;

    var apiKeys = localStorage.getItem('apiKeys');
    if (apiKeys) {
        apiKeys = JSON.parse(apiKeys);
    }

    if (apiKeys) {
        window.appContext.currentApp.apiKeys = apiKeys;
    } else {
        apiKeys = {
            creditsSystemPublicKey: "test-public",
            stripePublicKey: "pk_test_Uc7I6bT2fxNiTp3bFqstkyFh00mbnGl0A5"
        };
        localStorage.setItem('apiKeys', JSON.stringify(apiKeys));

        window.appContext.currentApp.apiKeys = apiKeys;
    }

})();