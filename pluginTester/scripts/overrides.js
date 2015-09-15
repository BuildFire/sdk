'use strict';
/**
 * Created by Daniel on 5/23/2015.
 */
//logger = console;

var controlIFrame=document.getElementById('iframeControl');
var widgetIFrame = document.getElementById('widget');

var pluginAPI = new PluginAPI(widgetIFrame.contentWindow, window.appContext.currentApp.appId
	, window.appContext.currentPlugin.pluginPath, window.appContext.currentPlugin.instanceId, 0);
pluginAPI.tag = 'shell';
var controlPluginAPI = new PluginAPI(controlIFrame.contentWindow, window.appContext.currentApp.appId
	, window.appContext.currentPlugin.pluginPath, window.appContext.currentPlugin.instanceId, 0);
controlPluginAPI.tag = 'controlPluginAPI';

(function() {


	/**************************************************
	sync
	*/
	var onUpdate = function (updateObj) {
		var packet = new Packet(null, 'datastore.triggerOnUpdate', updateObj.detail);
		pluginAPI.sendMessage(widgetIFrame.contentWindow, packet);
	};
	controlPluginAPI.datastore.onUpdate(onUpdate);


	pluginAPI.messaging.onNewWidgetMessage(function (message) {
		var packet = new Packet(null, 'messaging.onReceivedMessage', message);
		pluginAPI.sendMessage(widgetIFrame.contentWindow, packet);
	});

	controlPluginAPI.messaging.onNewControlMessage(function (message) {
		var packet = new Packet(null, 'messaging.onReceivedMessage', message);
		controlPluginAPI.sendMessage(controlIFrame.contentWindow, packet);
	});

	controlPluginAPI.navigation.navigateTo = pluginAPI.navigation.navigateTo = function () {
	    console.warn("supress navigation in shell");
	    alert("supress navigation in shell");
	};
	/**************************************************/

	/*
	 pluginAPI.appearance.getCSSFiles =function(data, callback){
	 callback(null,['/styles/bootstrap.css']);
	 };
	 */

	controlPluginAPI.appearance.autosizeContainerHandler = function (height) {
		var iframeControl = document.getElementById('iframeControl');
		iframeControl.style.height = height + 'px';
	};

	controlPluginAPI.analytics.trackAction = pluginAPI.analytics.trackAction = function (actionName, metadata) {
		console.log('analytics mock track action [' + actionName + ']', metadata);
	};

	controlPluginAPI.analytics.trackView = pluginAPI.analytics.trackView = function (viewName, metadata) {
		console.log('analytics mock track view [' + viewName + ']', metadata);
	};

//override the imageLibTemplate url
	imageLibCurrentApp.imageLibTemplate = 'http://int2.myapp.buildfire.com/pages/templates/imageLib.html';
	controlPluginAPI.actionItems.templateUrl = 'http://int2.myapp.buildfire.com/pages/templates/actionBuilder.html';
	pluginAPI.actionItems.listTemplateUrl = 'http://int2.myapp.buildfire.com/app/pages/templates/actionItemsListDialog.html';
	controlPluginAPI.pluginInstances.templateUrl = "http://int2.myapp.buildfire.com/pages/templates/pluginInstanceDialog.html"
	window.appContext.currentPlugin.pluginAPI = controlPluginAPI;
})();