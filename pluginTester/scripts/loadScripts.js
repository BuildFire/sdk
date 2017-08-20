function _ScriptLoader(){
    this.domain="https://app.buildfire.com/";
    window._appRoot = 'app/';

    this.scripts = [
        , this.domain + "app/scripts/framework/postMaster.js"
        , this.domain + "scripts/framework/pluginAPI/imageLibAPI.js"
        , this.domain + "scripts/framework/pluginAPI/actionItemsAPI.js"
        , this.domain + "app/scripts/lib/hammer.2.0.4.js"// pull down to refresh
        , this.domain + "app/scripts/lib/wptr.1.1.js"// pull down to refresh
        , this.domain + "app/scripts/framework/httpClient.js"
        , this.domain + "app/scripts/framework/bfUtils.js"
        , this.domain + "app/scripts/framework/remoteDatastore.js"
        , this.domain + "app/scripts/framework/pluginAPI/datastoreAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/userDatastoreAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/publicDatastoreAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/analyticsAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/appearanceAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/mediaAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/notificationsAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/appAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/actionItemsAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/pluginInstanceAPI.js"
        , this.domain + "scripts/framework/pluginAPI/pluginInstanceLibAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/deviceAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/historyAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/pluginAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/geoAPI.js"
        , this.domain + "app/pages/controllers/authCtrl.js"
        , this.domain + "app/scripts/framework/pluginAPI/authAPI.js"
        , this.domain + "scripts/framework/openDialogCtrl.js"
        , this.domain + "app/scripts/framework/modalCtrl.js"
        , this.domain + "pages/plugins/addPlugin/modals/addPageCtrl.js"
        , this.domain + "app/scripts/framework/pluginAPI/localNotificationsAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/localStorageAPI.js"
        , this.domain + "app/scripts/framework/validator.js"
    ];
}

_ScriptLoader.prototype ={
    fileExists: function(url){
        var http = new XMLHttpRequest();
        http.open('HEAD', url, false);
        http.send();
        return http.status!=404;
    }
    ,attachFile: function(url){
        if(!url)return;
        document.write('<script type="text/javascript" src="' + url  + '" ></script>');
    }
    ,init:function(){
        for(var i=0; i< this.scripts.length ; i++)
            this.attachFile(this.scripts[i]);
    }
};


window._scriptLoader = new  _ScriptLoader();
window._scriptLoader.init();

delete window._scriptLoader;