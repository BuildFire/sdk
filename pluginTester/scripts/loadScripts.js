function _ScriptLoader(){
    this.pluginAPIPath ="http://int2.myapp.buildfire.com/app/scripts/framework/pluginAPI/";
    //debugger;
    //this.pluginAPIPath ="http://localhost:3000/app/scripts/framework/pluginAPI/";

    this.scripts = ["datastoreAPI.js","analyticsAPI.js","pluginAPI.js" ];
}

_ScriptLoader.prototype ={
    fileExists: function(url){
        var http = new XMLHttpRequest();
        http.open('HEAD', url, false);
        http.send();
        return http.status!=404;
    }
    ,attachFile: function(url){
        document.write('<script type="text/javascript" src="' + url  + '" ></script>');
    }
    ,init:function(){
        for(var i=0; i< this.scripts.length ; i++)
            this.attachFile(this.pluginAPIPath + this.scripts[i]);
    }
};

window._scriptLoader = new  _ScriptLoader();
window._scriptLoader.init();

delete window._scriptLoader;