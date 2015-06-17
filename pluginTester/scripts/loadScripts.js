function _ScriptLoader(){
    var pluginAPIPath ="../../app/scripts/framework/pluginAPI/";
    var altPluginAPIPath ="http://myapp2.buildfire.com/scripts/pluginAPI/";
    this.scripts = [
        {src: pluginAPIPath + "datastoreAPI.js"
            ,altSrc: altPluginAPIPath + "datastoreAPI.js"}
        ,{src: pluginAPIPath + "analyticsAPI.js"
            ,altSrc: altPluginAPIPath + "analyticsAPI.js"}
        ,{src: pluginAPIPath + "pluginAPI.js"
            ,altSrc: altPluginAPIPath + "pluginAPI.js"}
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
        document.write('<script type="text/javascript" src="' + url  + '" ></script>');
    }
    ,init:function(){
        if(this.scripts.length==0) return;
        var useAlt = !this.fileExists(this.scripts[0].src);
        for(var i=0; i< this.scripts.length ; i++)
            this.attachFile(useAlt?this.scripts[i].altSrc:this.scripts[i].src);
    }
};

window._scriptLoader = new  _ScriptLoader();
window._scriptLoader.init();

delete window._scriptLoader;