'use strict';
/**
 * Created by Daniel on 5/23/2015.
 */
//logger = console;

postMaster.widgetPluginAPI = new PluginAPI('widget', window.appContext.currentApp.appId
	, window.appContext.currentPlugin.pluginPath, window.appContext.currentPlugin.instanceId, 0);
postMaster.widgetPluginAPI.tag = 'shell';

postMaster.controlPluginAPI = new PluginAPI('iframeControl', window.appContext.currentApp.appId
	, window.appContext.currentPlugin.pluginPath, window.appContext.currentPlugin.instanceId, 0,appContext.currentApp.keys.datastoreKey);
postMaster.controlPluginAPI.tag = 'controlPluginAPI';

(function() {


	/**************************************************
	sync
	*/
	var onUpdate = function (updateObj) {
		var packet = new Packet(null, 'datastore.triggerOnUpdate', updateObj);
		postMaster.widgetPluginAPI.sendMessage(null, packet);
	};
	postMaster.controlPluginAPI.datastore.onUpdate =onUpdate;


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


	///override the authAPI.getCurrentUser to return CP loggedIn user
	var oldFN = authAPI.getCurrentUser;
	authAPI.secondaryUserLookup = function () {
		return window.currentUser;
	};
	authAPI.getCurrentUser = function (data, callback) {
		if (window.currentUser) {
			authAPI.logout();
		}
		return oldFN(data, callback);
	};
	///

//override the imageLibTemplate url
	imageLibCurrentApp.imageLibTemplate = 'http://app.buildfire.com/pages/templates/imageLib.html';
	postMaster.controlPluginAPI.actionItems.templateUrl = 'http://app.buildfire.com/pages/templates/actionBuilder.html';
	postMaster.widgetPluginAPI.actionItems.listTemplateUrl = 'http://app.buildfire.com/app/pages/templates/actionItemsListDialog.html';
	postMaster.controlPluginAPI.pluginInstances.templateUrl = "http://app.buildfire.com/pages/templates/pluginInstanceDialog.html";
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

