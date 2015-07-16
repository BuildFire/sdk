/**
 * Created by Daniel on 5/23/2015.
 */
logger = console;

var pluginAPI = new PluginAPI(document.getElementById('widget').contentWindow ,window.appContext.currentApp.appId, 0, 1, 0);
pluginAPI.tag='shell';
var controlPluginAPI = new PluginAPI(document.getElementById('iframeControl').contentWindow ,window.appContext.currentApp.appId
    , 0, 1,0);
controlPluginAPI.tag='controlPluginAPI';

var onUpdate =function(updateObj){

    var widgetIFrame = document.getElementById('widget');
    if(typeof(widgetIFrame) != 'object' || widgetIFrame.tagName !='IFRAME')
        console.error('cant find widget iframe');
    else{
        var packet = new Packet(null,'datastore.triggerOnUpdate',updateObj.detail);

        pluginAPI.sendMessage( widgetIFrame.contentWindow ,packet);
    }

};
pluginAPI.datastore.onUpdate(onUpdate);
controlPluginAPI.datastore.onUpdate(onUpdate);

/*
pluginAPI.appearance.getCSSFiles =function(data, callback){
    callback(null,['/styles/bootstrap.css']);
};
*/

controlPluginAPI.appearance._autosizeContainerHandler= function(height){
    var iframeControl = document.getElementById('iframeControl');
    iframeControl.style.height = height +'px';
};

controlPluginAPI.analytics.trackAction = pluginAPI.analytics.trackAction = function(actionName, metadata) {
  console.log('analytics mock track action [' + actionName + ']', metadata);
};

controlPluginAPI.analytics.trackView  = pluginAPI.analytics.trackView = function(viewName, metadata) {
    console.log('analytics mock track view [' + viewName + ']', metadata);
};


