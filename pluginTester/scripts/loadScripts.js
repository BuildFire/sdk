function _ScriptLoader(){
    this.domain="http://int2.myapp.buildfire.com/";
    this.scripts = [
        this.domain + "scripts/framework/pluginAPI/imageLibAPI.js"
        , this.domain + "scripts/framework/pluginAPI/actionItemsAPI.js"
        , this.domain + "app/scripts/lib/hammer.2.0.4.js"// pull down to refresh
        , this.domain + "app/scripts/lib/wptr.1.1.js"// pull down to refresh
        , this.domain + "app/scripts/framework/pluginAPI/datastoreAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/analyticsAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/appearanceAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/mediaAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/notificationsAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/appAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/actionItemsAPI.js"
        , this.domain + "scripts/framework/pluginAPI/pluginInstanceLibAPI.js"
        , this.domain + "app/scripts/framework/pluginAPI/pluginAPI.js"
        , this.domain + "scripts/framework/openDialogCtrl.js"
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