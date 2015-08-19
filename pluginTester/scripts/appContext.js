(function () {

    var key = window.localStorage.getItem('autoGenKey');

    //legacy
    var oldContext = window.localStorage.getItem('appContext');
    if (oldContext && !key) {
        try {
            var appContext = JSON.parse(json);
            key = appContext.currentApp.keys.datastoreKey;
        }
        catch (e) {
        }
        window.localStorage.removeItem('appContext');
    }

    if (!key) {
        key = ((new Date()).getTime() + "-" + Math.random()).replace(".", "");
        window.localStorage.setItem('autoGenKey', key);
    }


    window.appContext = {
        currentApp: {
            appId: key
            , keys: {datastoreKey: key}
        }
        , currentPlugin: {
            pluginId: key
            , pluginPath: "myPlugin" // [Enter your Plugin Folder Name here]
            , instanceId: key
            , mode: 0
        }
    };


})();