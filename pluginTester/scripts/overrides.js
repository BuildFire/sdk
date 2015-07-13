/**
 * Created by Daniel on 5/23/2015.
 */
logger = console;

if(window.appContext.currentApp.appId == null){
    alert('Please sing up for a dev account and get your app id. then replace it in here');
    return;
}

pluginAPI.init(window.appContext.currentApp.appId, 0, 1, 0);

pluginAPI.datastore.onUpdate(function(updateObj){

    var widgetIFrame = document.getElementById('widget');
    if(typeof(widgetIFrame) != 'object' || widgetIFrame.tagName !='IFRAME')
        console.error('cant find widget iframe');
    else{
        var packet = new Packet(null,'datastore.triggerOnUpdated',updateObj.detail);

        pluginAPI.sendMessage( widgetIFrame.contentWindow ,packet);
    }

});


pluginAPI.appearance.getCSSFiles =function(data, callback){
    callback(null,['/styles/bootstrap.css']);
};

pluginAPI.appearance._autosizeContainerHandler= function(height){
    var iframeControl = document.getElementById('iframeControl');
    iframeControl.style.height = height +'px';
};



pluginAPI.analytics.trackAction = function(actionName, metadata) {
  console.log('analytics mock track action [' + actionName + ']', metadata);
};

pluginAPI.analytics.trackView = function(viewName, metadata) {
    console.log('analytics mock track view [' + viewName + ']', metadata);
};


