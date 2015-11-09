(function () {

    var strContext = window.localStorage.getItem('appContext');
    if (strContext ) {
        try {
            window.appContext = JSON.parse(strContext);
        }
        catch (e) {
        }
    }

    if(!window.appContext) {
        var key= window.localStorage.getItem('autoGenKey'); //legacy
        if(!key) key= ((new Date()).getTime() + "-" + Math.random()).replace(".", "");
        window.appContext = {
            currentApp: {
                appId: key
                , keys: {datastoreKey: key}
            }
            , currentPlugin: {
                pluginId: key
                , pluginPath: ''
                , instanceId: key
                , mode: 0
            }
        };

        window.localStorage.setItem('appContext',JSON.stringify(window.appContext));
    }


    var hash = window.location.hash.split('/');
    if(hash && hash.length > 2)
        hash= hash[2];
    else
        hash="myPlugin";

    window.appContext.currentPlugin.pluginPath = hash;



})();