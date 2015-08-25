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


    var hash = window.location.hash;
    if(hash && hash.length > 1)
        hash= hash.substring(1);
    else
        hash="myPlugin";

    window.appContext = {
        currentApp: {
            appId: key
            , keys: {datastoreKey: key}
        }
        , currentPlugin: {
            pluginId: key
            , pluginPath: hash // [Enter your Plugin Folder Name here]
            , instanceId: key
            , mode: 0
        }
    };


})();