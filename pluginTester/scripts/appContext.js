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
                , pluginPath: hash // [Enter your Plugin Folder Name here]
                , instanceId: key
                , mode: 0
            }
        };

        window.localStorage.setItem('appContext',JSON.stringify(window.appContext));
    }
    /*
    var hash = window.location.hash;
    if(hash && hash.length > 1)
        hash= hash.substring(1);
    else
        hash="myPlugin";
*/



})();