/**
 * Created by Daniel on 8/4/2015.
 */
function initPullDownRefresh () {
    var pluginFrame;
    var fnLoading = function () {
        if(!pluginFrame)
            pluginFrame = document.getElementById('widget');
        var packet = new Packet(null, "datastore.triggerOnRefresh");
        postMaster.widgetPluginAPI.sendMessage(pluginFrame.contentWindow, packet);
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };

    WebPullToRefresh.init({
        loadingFunction: fnLoading,
        // ID of the element holding pull to refresh loading area
        ptrEl: document.getElementById('pluginRefreshPanel'),
        // ID of the element holding dragable content area
        contentEl: document.getElementById('pluginContentPanel'),
        // Number of pixels of dragging down until refresh will fire
        distanceToRefresh: 70,
        // The dragging resistance level, the higher the more you'll need to drag down.
        resistance: 1.0
    });

    postMaster.widgetPluginAPI.datastore.onDisableRefresh(function(){
        WebPullToRefresh.disable();
    });
}

initPullDownRefresh();