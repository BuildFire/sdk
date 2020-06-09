'use strict';
/**
 * Created by Daniel on 5/23/2015.
 */
//logger = console;

postMaster.widgetPluginAPI = new PluginAPI('widget', window.appContext.currentApp.appId
	, window.appContext.currentPlugin.pluginPath, window.appContext.currentPlugin.instanceId, 0,null,'app');
postMaster.widgetPluginAPI.tag = 'shell';

PluginAPI.configType = window.appContext.currentApp.config ? window.appContext.currentApp.config.type : undefined;
postMaster.controlPluginAPI = new PluginAPI('iframeControl', window.appContext.currentApp.appId
	, window.appContext.currentPlugin.pluginPath, window.appContext.currentPlugin.instanceId, 0,appContext.currentApp.keys.datastoreKey,'control');
postMaster.controlPluginAPI.tag = 'controlPluginAPI';

postMaster.servicePluginAPIs = {
	service:new PluginAPI('service', window.appContext.currentApp.appId
		, window.appContext.currentPlugin.pluginPath, window.appContext.currentPlugin.instanceId, 0)
};
postMaster.servicePluginAPIs.service.tag = 'service';


(function() {

	LocalNotificationsAPI.notificationModal = function(notification){
		var options = {
			data: {
				title: notification.title,
				body: notification.text
			}
			, templateUrl: 'https://app.buildfire.com/app/pages/templates/modal.html'
			, controller: 'modalCtrl'
		};

		window.openDialog(options, function(result){
			if(result){
				LocalNotificationsAPI.navToPlugin(notification);
			}
		});
	};

	/**************************************************
	sync
	*/
	var onUpdate = function (updateObj) {
		var packet = new Packet(null, 'datastore.triggerOnUpdate', updateObj);
		postMaster.widgetPluginAPI.sendMessage(null, packet);
		if(postMaster.servicePluginAPIs && postMaster.servicePluginAPIs.service)
			postMaster.servicePluginAPIs.service.sendMessage(null, packet);
	};
    postMaster.controlPluginAPI.datastore.onUpdate = onUpdate;
    
    postMaster.controlPluginAPI.userData.onUpdate = function (updateObj) {
        var packet = new Packet(null, 'userData.triggerOnUpdate', updateObj);
        postMaster.widgetPluginAPI.sendMessage(null, packet);
    };
    
    postMaster.widgetPluginAPI.userData.onUpdate = function (updateObj) {
        var packet = new Packet(null, 'userData.triggerOnUpdate', updateObj);
        postMaster.controlPluginAPI.sendMessage(null, packet);
    };

    postMaster.controlPluginAPI.publicData.onUpdate = function (updateObj) {
        var packet = new Packet(null, 'publicData.triggerOnUpdate', updateObj);
        postMaster.widgetPluginAPI.sendMessage(null, packet);
    };

    postMaster.widgetPluginAPI.publicData.onUpdate = function (updateObj) {
        var packet = new Packet(null, 'publicData.triggerOnUpdate', updateObj);
        postMaster.controlPluginAPI.sendMessage(null, packet);
		};
	
		postMaster.controlPluginAPI.appData.onUpdate = function (updateObj) {
			var packet = new Packet(null, 'appData.triggerOnUpdate', updateObj);
			postMaster.widgetPluginAPI.sendMessage(null, packet);
	};

	postMaster.widgetPluginAPI.appData.onUpdate = function (updateObj) {
			var packet = new Packet(null, 'appData.triggerOnUpdate', updateObj);
			postMaster.controlPluginAPI.sendMessage(null, packet);
	};

	PluginAPI.prototype.messaging.triggerOnNewWidgetMessage = function (message) {
		var packet = new Packet(null, 'messaging.onReceivedMessage', message);
		postMaster.widgetPluginAPI.sendMessage(null, packet);
	};

	PluginAPI.prototype.messaging.triggerOnNewControlMessage =function (message) {
		var packet = new Packet(null, 'messaging.onReceivedMessage', message);
		postMaster.controlPluginAPI.sendMessage(null, packet);
	};

	postMaster.controlPluginAPI.navigation.navigateTo = postMaster.widgetPluginAPI.navigation.navigateTo = function () {
	    console.warn("supress navigation in shell");
	    alert("supress navigation in shell");
	};

	/**************************************************/

	/*
	 postMaster.widgetPluginAPI.appearance.getCSSFiles =function(data, callback){
	 callback(null,['/styles/bootstrap.css']);
	 };
	 */

	postMaster.controlPluginAPI.appearance.autosizeContainerHandler = function (height) {
		var iframeControl = document.getElementById('iframeControl');
		iframeControl.style.height = height + 'px';
	};

	postMaster.controlPluginAPI.analytics.trackAction = postMaster.widgetPluginAPI.analytics.trackAction = function (actionName, metadata) {
		console.log('analytics mock track action [' + actionName + ']', metadata);
	};

	postMaster.controlPluginAPI.analytics.trackView = postMaster.widgetPluginAPI.analytics.trackView = function (viewName, metadata) {
		console.log('analytics mock track view [' + viewName + ']', metadata);
	};


	///override the authAPI.getCurrentUser to return auth
	authAPI.secondaryUserLookup = function () {
		if(!window.currentUser || !window.currentUser.userToken || !window.currentUser.auth)
			return null;

        if (!window.currentAuthUser) {
            var appId = '';
            if (appContext.currentApp && appContext.currentApp.appId)
                appId = appContext.currentApp.appId;

            var request = new XMLHttpRequest();
            request.open('GET', 'https://app.buildfire.com/api/user/auth/' + appId, false);  // `false` makes the request synchronous
            request.setRequestHeader("userToken", window.currentUser.userToken);
            request.setRequestHeader("auth", window.currentUser.auth);
            request.send(null);
            if (request.status === 200) {
                window.currentAuthUser = JSON.parse(request.responseText);
            }
        }
        if (window.currentAuthUser)
            window.currentAuthUser._cpUser = window.currentUser;

        return window.currentAuthUser;
	};
	///

//override the imageLibTemplate url
	imageLibCurrentApp.imageLibTemplate = 'https://app.buildfire.com/pages/imageLib/imageLib.html';
	postMaster.controlPluginAPI.actionItems.templateUrl = 'https://app.buildfire.com/pages/share/actionBuilder.html';
	postMaster.widgetPluginAPI.actionItems.listTemplateUrl = 'https://app.buildfire.com/app/pages/templates/actionItemsListDialog.html';
	postMaster.controlPluginAPI.pluginInstances.templateUrl = "https://app.buildfire.com/pages/plugins/pluginInstanceDialog/pluginInstanceDialog.html";
	window.appContext.currentPlugin.pluginAPI = postMaster.controlPluginAPI;
})();


/**
 * Created by Rami Hadi.
 * description : this is a Dummy secition just used to mock things to work like in the CP
 */
$app.service('$analytics', [ function () {

	var analytics = {
		eventTrack : function(dummy1,dummy2) {}
	};


	return analytics;
}]);

