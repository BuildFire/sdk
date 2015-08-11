(function() {
    var json = window.localStorage.getItem('appContext');

    if (json) {
        try {
            window.appContext = JSON.parse(json)
        }
        catch (e) {
        }
    }

    function rnd() {
        return ((new Date()).getTime() + "-" + Math.random()).replace(".","");
    }

    if (!window.appContext) {
        window.appContext = {
            currentApp: {
                appId: rnd()
                , keys: {datastoreKey:rnd()}
            }
            , currentPlugin: {
                pluginId: rnd()
                , pluginPath: "myPlugin" // [Enter your Plugin Folder Name here]
                , instanceId: rnd()
                , mode: 0
            }
        };

        window.localStorage.setItem('appContext', JSON.stringify(window.appContext));
    }
})();