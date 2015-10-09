'use strict';
/**
 * Created by Daniel on 5/23/2015.
 */
//logger = console;

var controlIFrame=document.getElementById('iframeControl');
var widgetIFrame = document.getElementById('widget');

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
		postMaster.widgetPluginAPI.sendMessage(widgetIFrame.contentWindow, packet);
	};
	postMaster.controlPluginAPI.datastore.onUpdate =onUpdate;


	postMaster.widgetPluginAPI.messaging.onNewWidgetMessage(function (message) {
		var packet = new Packet(null, 'messaging.onReceivedMessage', message);
		postMaster.widgetPluginAPI.sendMessage(widgetIFrame.contentWindow, packet);
	});

	postMaster.controlPluginAPI.messaging.onNewControlMessage(function (message) {
		var packet = new Packet(null, 'messaging.onReceivedMessage', message);
		postMaster.controlPluginAPI.sendMessage(controlIFrame.contentWindow, packet);
	});

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

	postMaster.widgetPluginAPI.navigation.navigateBack = function(){
		alert('default back behaviour');
	};

//override the imageLibTemplate url
	imageLibCurrentApp.imageLibTemplate = 'http://int2.myapp.buildfire.com/pages/templates/imageLib.html';
	postMaster.controlPluginAPI.actionItems.templateUrl = 'http://int2.myapp.buildfire.com/pages/templates/actionBuilder.html';
	postMaster.widgetPluginAPI.actionItems.listTemplateUrl = 'http://int2.myapp.buildfire.com/app/pages/templates/actionItemsListDialog.html';
	postMaster.controlPluginAPI.pluginInstances.templateUrl = "http://int2.myapp.buildfire.com/pages/templates/pluginInstanceDialog.html";
	window.appContext.currentPlugin.pluginAPI = postMaster.controlPluginAPI;
})();