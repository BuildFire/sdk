"use strict";

function Packet(id, cmd, data) {
	this.id = id ? id : new Date().toISOString() + Math.random();
	this.cmd = cmd;
	this.data = data;
}

var buildfire = {
	logger: {
		_suppress: true
		, show: function () {
			this._suppress = false;
		}
		, hide: function () {
			this._suppress = true;
		}
		, error: function () {
			if (!this._suppress)
				console.error.apply(console, arguments);
		}
		, log: function () {
			if (!this._suppress)
				console.log.apply(console, arguments);
		}
		, warn: function () {
			if (!this._suppress)
				console.warn.apply(console, arguments);
		}
		, debug: function () {
			if (!this._suppress)
				console.debug.apply(console, arguments);
		}
	}
	, _callbacks: {}
	, init: function () {
		// Listen to message from child window
		window.removeEventListener('message', buildfire._postMessageHandler, false);
		window.addEventListener('message', buildfire._postMessageHandler, false);
		buildfire._insertHTMLAttributes();
		buildfire.appearance.attachCSSFiles();
		buildfire.getContext(function (err, context) {
			if (err) {
				buildfire.logger.error(err);
			}
			else {
				buildfire.context = context;
				if (window.location.pathname.indexOf('/widget/') > 0) {
					buildfire.appearance.attachAppThemeCSSFiles(context.appId, context.liveMode, context.endPoints.appHost);
				}
			}
		});
	}
	, _whitelistedCommands:["datastore.triggerOnUpdate"
		,"datastore.triggerOnRefresh"
		,"messaging.onReceivedMessage"
		, "history.triggerOnPop"
		,"navigation.onBackButtonClick"
		,"services.media.audioPlayer.triggerOnEvent"]
	, _postMessageHandler: function (e) {
		if (e.source === window) return;//e.origin != "null"
		buildfire.logger.log('buildfire.js received << ' + e.data, window.location.href);
		var packet = JSON.parse(e.data);

		if (packet.id && buildfire._callbacks[packet.id]) {
			buildfire._callbacks[packet.id](packet.error, packet.data);
			delete buildfire._callbacks[packet.id];
		}
		else if (buildfire._whitelistedCommands.indexOf(packet.cmd) + 1) {
			var sequence = packet.cmd.split('.');

			var obj = buildfire;
			var parent = buildfire;
			for (var i = 0; i < sequence.length; i++) {
				if (i > 0)parent = obj;
				if (obj[sequence[i]])
					obj = obj[sequence[i]];
				else
					return; // sorry i cant help you
			}
			obj.apply(parent, [packet.data]);

		}
		else {
			buildfire.logger.warn(window.location.href + ' unhandled packet', packet);
			//alert('parent sent: ' + packet.data);
		}
	}
	, getContext: function (callback) {
		var p = new Packet(null, 'getContext');
		buildfire._sendPacket(p, callback);
	}
	, navigation: {
		/**
		 * Navigate To plugin
		 * @pluginData {pluginId : pluginId,instanceId : instanceId,folderName:folderName,title:title }
		 */
         navigateTo: function (pluginData) {

            var p = new Packet(null, 'navigation.navigateTo', {pluginId: pluginData.pluginId, instanceId: pluginData.instanceId, title: pluginData.title,folderName: pluginData.folderName});
            buildfire._sendPacket(p);
        }
        , navigateHome: function () {
            var p = new Packet(null, 'navigation.navigateHome');
			buildfire._sendPacket(p);
        }
        , openWindow: function (url, target, callback) {
            if (!target) target = '_blank';
            if (!callback) callback = function () {
                logger.log('openWindow:: completed');
            };
            var actionItem = {
                action: 'linkToWeb'
                , url: url
                , openIn: target
            };

            var p = new Packet(null, 'actionItems.execute', actionItem, callback);
            buildfire._sendPacket(p);
        }
		, _goBackOne:function(){
			buildfire._sendPacket(new Packet(null,'navigation.navigateBack'));
		}
		, onBackButtonClick: function(){this._goBackOne();}
		, restoreBackButtonClick:function(){
			buildfire.navigation.onBackButtonClick= function(){buildfire.navigation._goBackOne()};
		}
    }
	, appearance: {
		getCSSFiles: function (callback) {
			var p = new Packet(null, 'appearance.getCSSFiles');
			buildfire._sendPacket(p, callback);
		}
		, attachCSSFiles: function () {
			var files = ['styles/bootstrap.css'];
			if (window.location.pathname.indexOf('/control/') > 0)
				files.push('styles/siteStyle.css') &&
				files.push('styles/pluginScreen.css');
			else
				files.push('styles/appStyle.css');

			var base;
			var scripts = document.getElementsByTagName("script");
			for (var i = 0; i < scripts.length; i++) {
				if (scripts[i].src.indexOf('buildfire.js') > 0) {
					base = scripts[i].src.replace('/scripts/buildfire.js', '');
					break;
				}
			}

			if (base[base.length - 1] != "/") base += '/';

			for (var i = 0; i < files.length; i++)
				document.write('<link rel="stylesheet" href="' + base + files[i] + '"/>');


		}
		, attachAppThemeCSSFiles: function (appId, liveMode, appHost) {
			var linkElement = document.createElement("link");
			linkElement.setAttribute("rel", "stylesheet");
			linkElement.setAttribute("type", "text/css");
			linkElement.setAttribute("href", appHost + '/api/app/styles/appTheme.css?appId=' + appId + '&liveMode=' + liveMode);
			document.getElementsByTagName('head')[0].appendChild(linkElement);
		}
		, _resizedTo: 0
		, autosizeContainer: function () {
			var height = Math.max(
				document.documentElement.clientHeight,
				document.body.scrollHeight,
				document.documentElement.scrollHeight,
				document.body.offsetHeight,
				document.documentElement.offsetHeight
			);
			if (buildfire.appearance._resizedTo == height || height < 100) return;
			var p = new Packet(null, 'appearance.autosizeContainer', {height: height});
			buildfire._sendPacket(p);
			buildfire.appearance._resizedTo = height;
		}
		, setHeaderVisibility: function (value) {
			var p = new Packet(null, "appearanceAPI.setHeaderVisibility", value);
			buildfire._sendPacket(p);
		}
	}
	, _sendPacket: function (packet, callback) {
		if (typeof (callback) != "function")// handels better on response
			callback = function (err, result) {
				buildfire.logger.log('buildfire.js ignored callback ' + JSON.stringify(arguments)), window.location.href
			};

		buildfire._callbacks[packet.id] = callback;
		var p ;
		if(typeof(angular) != "undefined")
		  p = angular.toJson(packet);
		else
			p = JSON.stringify(packet);
		buildfire.logger.log("BuildFire.js Send >> " + p, window.location.href);
		if (parent)parent.postMessage(p, "*");
	}
	, analytics: {
		trackAction: function (actionName, metadata) {
			var p = new Packet(null, "analytics.trackActionCommand", {
				value: actionName,
				metadata: metadata
			}); // wrap object to follow the command(obj, callback)
			buildfire._sendPacket(p);
		}
		,
		trackView: function (actionName, metadata) {
			var p = new Packet(null, "analytics.trackViewCommand", {
				value: actionName,
				metadata: metadata
			}); // wrap object to follow the command(obj, callback)
			buildfire._sendPacket(p);
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore
	, datastore: {
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoreget-tag-optional-id-optional-callback
		get: function ( tag, callback) {

			var tagType = typeof(tag);
			if (tagType == "undefined")
				tag = '';
			else if (tagType == "function" && typeof(callback) == "undefined") {
				callback = tag;
				tag = '';
			}
            var obj ={tag:tag };
			var p = new Packet(null, 'datastore.get', obj);
			buildfire._sendPacket(p, callback);

		},
        /// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoregetbyid--id--tag-optional-callback
		getById: function (id, tag, callback) {

			var idType = typeof(id);
			if (idType == "function" && typeof(callback) == "undefined") {
				callback = id;
				id = '';
			}

			var tagType = typeof(tag);
			if (tagType == "undefined")
				tag = '';
			else if (tagType == "function" && typeof(callback) == "undefined") {
				callback = tag;
				tag = '';
			}
			var obj = {tag: tag, id: id};
			var p = new Packet(null, 'datastore.get', obj);
			buildfire._sendPacket(p, callback);

		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoresave-obj-tag-optional-callback
		, save: function (obj, tag, callback) {

			var tagType = typeof(tag);
			if (tagType == "undefined")
				tag = '';
			else if (tagType == "function" && typeof(callback) == "undefined") {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'datastore.save', {tag: tag, obj: obj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.datastore.triggerOnUpdate(result);
				if (callback)callback(err, result);
			});
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoreinsert-obj-tag-optionalcheckduplicate--callback
		, insert: function (obj, tag, checkDuplicate, callback) {

			var checkDuplicateType = typeof(checkDuplicate);
			if (checkDuplicateType == "undefined")
				checkDuplicate = false;
			else if (checkDuplicateType == "function" && typeof(callback) == "undefined") {
				callback = checkDuplicate;
				checkDuplicate = false;
			}
			var tagType = typeof(tag);
			if (tagType == "undefined")
				tag = '';
			else if (tagType == "function" && typeof(callback) == "undefined") {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'datastore.insert', {tag: tag, obj: obj, checkDuplicate: checkDuplicate});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.datastore.triggerOnUpdate(result);
				callback(err, result);
			});
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastorebulkinsert-obj-tag-optional---callback
		, bulkInsert: function (arrayObj, tag, callback) {

			if (arrayObj.constructor !== Array) {

				callback({"code": "error", "message": "the data should be an array"}, null);
				return;
			}

			var tagType = typeof(tag);
			if (tagType == "undefined")
				tag = '';
			else if (tagType == "function" && typeof(callback) == "undefined") {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'datastore.bulkInsert', {tag: tag, obj: arrayObj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.datastore.triggerOnUpdate(result);
				callback(err, result);
			});
		}
		/// ref https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoreupdateidobj-tag-optional-callback
		, update: function (id, obj, tag, callback) {
			var tagType = typeof(tag);
			if (tagType == "undefined")
				tag = '';
			else if (tagType == "function" && typeof(callback) == "undefined") {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'datastore.update', {tag: tag, id: id, obj: obj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.datastore.triggerOnUpdate(result);
				if (callback)callback(err, result);
			});
		}
        /// ref https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoredeleteidobj-tag-optional-callback
       , delete: function (id, tag, callback) {
			var tagType = typeof(tag);
			if (tagType == "undefined")
				tag = '';
			else if (tagType == "function" && typeof(callback) == "undefined") {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'datastore.delete', {tag: tag,id:id });
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.datastore.triggerOnUpdate(result);
				if(callback)callback(err, result);
			});
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoresearchoptions-tag-optional-callback
		, search: function (options, tag, callback) {

			var tagType = typeof(tag);
			if (tagType == "undefined")
				tag = '';
			else if (tagType == "function" && typeof(callback) == "undefined") {
				callback = tag;
				tag = '';
			}

			//auto correct empty string filter
			if (typeof(options) == "undefined") options = {filter: {}};
			if (!options.filter) options.filter = {};

			var p = new Packet(null, 'datastore.search', {tag: tag, obj: options});
			buildfire._sendPacket(p, function (err, result) {
				callback(err, result);
			});
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoreonupdatecallback
		, onUpdate: function (callback) {
			var handler = function (e) { if (callback)callback(e.detail); };
			document.addEventListener('datastoreOnUpdate', handler, false);
			return {
				clear:function () {document.removeEventListener('datastoreOnUpdate', handler, false); }
			};
		}
		, triggerOnUpdate: function (data) {
			var onUpdateEvent = new CustomEvent('datastoreOnUpdate', {'detail': data});
			buildfire.logger.log("Announce the data has changed!!!", window.location.href);
			document.dispatchEvent(onUpdateEvent);
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoreonrefreshcallback
		, onRefresh: function (callback) {
			document.addEventListener('datastoreOnRefresh', function (e) {
				if (callback)callback(e.detail, e);
			}, false);
		}
		, triggerOnRefresh: function (data) {
			var onRefreshEvent = new CustomEvent('datastoreOnRefresh', {'detail': data});
			buildfire.logger.log("Announce the data needs refresh!!!", window.location.href);
			document.dispatchEvent(onRefreshEvent);
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoredisablerefresh
		, disableRefresh: function () {
			var p = new Packet(null, "datastore.disableRefresh");
			buildfire._sendPacket(p);
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-ImageLib
	, imageLib: {
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-ImageLib#buildfireimagelibshowdialogoptions-callback
		showDialog: function (options, callback) {
			var p = new Packet(null, 'imageLib.showDialog', options);
			buildfire._sendPacket(p, callback);
		}
		, resizeImage: function (url, options) {
			var root = "http://s7obnu.cloudimage.io/s/";

			if(!options)
				options = {width: window.innerWidth};
			else if (typeof(options) != "object")
				throw ("options not an object");

			if(options.width == 'full') options.width= window.innerWidth;
			if(options.height== 'full') options.height= window.innerHeight;

			if (options.width && !options.height)
				return root + "width/" + options.width + "/" + url;
			else if (!options.width && options.height)
				return root + "height/" + options.height + "/" + url;
			else if (options.width && options.height)
				return root + "resizenp/" + options.width + "x" + options.height + "/" + url;
			else
				return url;
		}
		, cropImage: function (url, options) {
			var root = "http://s7obnu.cloudimage.io/s/crop/";
			if (typeof(options) != "object")
				throw ("options not an object");

			if (!options.width || !options.height)
				throw ("options must have both height and width");

			return root + options.width + "x" + options.height + "/" + url;

		}

	}
	, notifications: {
		alert: function (options, callback) {
			var p = new Packet(null, 'notificationsAPI.alert', options);
			buildfire._sendPacket(p, callback);
		}
		,confirm: function (options, callback) {
			var p = new Packet(null, 'notificationsAPI.confirm', options);
			buildfire._sendPacket(p, callback);
		}
        ,prompt: function (options, callback) {
			var p = new Packet(null, 'notificationsAPI.prompt', options);
			buildfire._sendPacket(p, callback);
		}
		,beep: function (options) {
			var p = new Packet(null, 'notificationsAPI.beep', options);
			buildfire._sendPacket(p, callback);
		}
		,vibrate: function (options) {
			var p = new Packet(null, 'notificationsAPI.vibrate', options);
			buildfire._sendPacket(p, callback);
		}
	}
	, actionItems: {
		showDialog: function (actionItem, options, callback) {
			var p = new Packet(null, 'actionItems.showDialog', {actionItem: actionItem, options: options});
			buildfire._sendPacket(p, callback);
		},
		execute: function (actionItem, options, callback) {
			var p = new Packet(null, 'actionItems.execute',  actionItem);
			buildfire._sendPacket(p, callback);
		},
		list : function(actionItems,options,callback) {
			var p = new Packet(null, 'actionItems.list',  {actionItems : actionItems ,options : options } );
			buildfire._sendPacket(p, callback);
		},
		create : function(action,iconUrl,title){
			var actionItem = {
				action: action,
				iconUrl : iconUrl,
				title : title
			};

			return actionItem;
		}
	}
	, history: {
		push: function( label, options, callback) {
			var p = new Packet(null, 'history.push',  {label : label ,options : options, source: "plugin" } );
			buildfire._sendPacket(p, callback);
		},
		onPop: function (callback) {
			document.addEventListener('historyOnPop', function (e) {
				if (callback)callback(e.detail, e);
			}, false);
		},
		triggerOnPop: function (data) {
			var onUpdateEvent = new CustomEvent('historyOnPop', {'detail': data});
			buildfire.logger.log("Announce the data has changed!!!", window.location.href);
			document.dispatchEvent(onUpdateEvent);
		},
		pop: function() {
			// add to allow user to popup history items
		}
	}
	, messaging:{
		sendMessageToControl:function(data){
			var p = new Packet(null,'messaging.triggerOnNewControlMessage',data);
			buildfire._sendPacket(p);
		}
		,sendMessageToWidget:function(data){
			var p = new Packet(null,'messaging.triggerOnNewWidgetMessage',data);
			buildfire._sendPacket(p);
		}
		,onReceivedMessage:function(message){
			buildfire.logger.log('onReceivedMessage ignored', window.location);
		}
	}
	, pluginInstance:{
		showDialog: function (options, callback) {
			var p = new Packet(null, 'pluginInstanceLib.showDialog', {options: options});
			buildfire._sendPacket(p, callback);
		},
		get : function (ids , callback){
			var p = new Packet(null, 'pluginInstanceLib.get', ids);
			buildfire._sendPacket(p, callback);
		}
	}
	, _insertHTMLAttributes:function(){
		var html = document.getElementsByTagName('html')[0];
		html.setAttribute('buildfire', 'enabled');

		var nVer = navigator.appVersion;
		var nAgt = navigator.userAgent;
		var browserName  = navigator.appName;
		var fullVersion  = ''+parseFloat(navigator.appVersion);
		var majorVersion = parseInt(navigator.appVersion,10);
		var nameOffset,verOffset,ix;
		var os="Unknown OS";
// In Opera, the true version is after "Opera" or after "Version"
		if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
			browserName = "Opera";
			fullVersion = nAgt.substring(verOffset+6);
			if ((verOffset=nAgt.indexOf("Version"))!=-1)
				fullVersion = nAgt.substring(verOffset+8);
		}
// In MSIE, the true version is after "MSIE" in userAgent
		else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
			browserName = "Microsoft Internet Explorer";
			fullVersion = nAgt.substring(verOffset+5);
		}
// In Chrome, the true version is after "Chrome"
		else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
			browserName = "Chrome";
			fullVersion = nAgt.substring(verOffset+7);
		}
// In Safari, the true version is after "Safari" or after "Version"
		else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
			browserName = "Safari";
			fullVersion = nAgt.substring(verOffset+7);
			if ((verOffset=nAgt.indexOf("Version"))!=-1)
				fullVersion = nAgt.substring(verOffset+8);
		}
// In Firefox, the true version is after "Firefox"
		else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
			browserName = "Firefox";
			fullVersion = nAgt.substring(verOffset+8);
		}
// In most other browsers, "name/version" is at the end of userAgent
		else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) <
			(verOffset=nAgt.lastIndexOf('/')) )
		{
			browserName = nAgt.substring(nameOffset,verOffset);
			fullVersion = nAgt.substring(verOffset+1);
			if (browserName.toLowerCase()==browserName.toUpperCase()) {
				browserName = navigator.appName;
			}
		}
// trim the fullVersion string at semicolon/space if present
		if ((ix=fullVersion.indexOf(";"))!=-1)
			fullVersion=fullVersion.substring(0,ix);
		if ((ix=fullVersion.indexOf(" "))!=-1)
			fullVersion=fullVersion.substring(0,ix);

		majorVersion = parseInt(''+fullVersion,10);
		if (isNaN(majorVersion)) {
			fullVersion  = ''+parseFloat(navigator.appVersion);
			majorVersion = parseInt(navigator.appVersion,10);
		}


		if (navigator.appVersion.indexOf("Win")!=-1) os="Windows";
		if (navigator.appVersion.indexOf("Mac")!=-1) os="MacOS";
		if (navigator.appVersion.indexOf("X11")!=-1) os="UNIX";
		if (navigator.appVersion.indexOf("Linux")!=-1)os="Linux";

		html.setAttribute('os', os);
		html.setAttribute('browser', browserName);
		html.setAttribute('majorVersion', majorVersion);
		html.setAttribute('fullVersion', fullVersion);

	}
};
buildfire.init();


document.addEventListener("DOMContentLoaded", function (event) {
	buildfire.appearance.autosizeContainer();
});
document.addEventListener("resize", function (event) {
	buildfire.appearance.autosizeContainer();
});