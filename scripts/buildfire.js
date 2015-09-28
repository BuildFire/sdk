"use strict";

function Packet(id, cmd, data) {
	this.id = id ? id : new Date().toISOString() + Math.random();
	this.cmd = cmd;
	this.data = data;
	this.instanceId= null;
}

var buildfire = {
	logger: {
		_suppress: true
		, logMaxLength:500
		, clearHistory: function(){
			buildfire.logger._getLogContainerDIV().innerHTML='';
		}
		, _logContainerDIV: null
		, _getLogContainerDIV: function(){
			if(buildfire.logger._logContainerDIV)
				return buildfire.logger._logContainerDIV;
			else
				return buildfire.logger._createLogContainerDIV();
		}
		, _createLogContainerDIV: function(){
			var div = document.getElementById('__buildfireLog');
			if(!div){
				div = document.createElement('div');
				div.style.position='fixed';
				div.style.left=div.style.top=0;
				div.style.width='100%';
				div.style.backgroundColor='black';
				div.style.opacity=0.8;
				div.style.display='none';
				buildfire.logger._logContainerDIV= div;

				var btn=document.createElement('button');
				btn.className='btn btn-warn pull-right';
				btn.innerText='Hide';
				btn.onclick= buildfire.logger.hideHistory;
				buildfire.logger.pushHistory(btn);


			}
			return div;
		}
		, showHistory:function(){
			var div = buildfire.logger._getLogContainerDIV();
			div.style.display='';
			if(!div.parentNode)
				document.body.appendChild(div);
		}
		, hideHistory:function(){
			var div = buildfire.logger._getLogContainerDIV();
			div.style.display='none';
		}
		, pushHistory: function(element){
			if(typeof(element) == "string") {
				var d = document.createElement('div');
				d.innerHTML=element;
				element = d;
			}
			var div = buildfire.logger._getLogContainerDIV();
			div.appendChild(element);
			if(div.childNodes.length > buildfire.logger.logMaxLength)
				div.removeChild(div.childNodes[0]);
		}
		, init: function(){

			buildfire.logger._createLogContainerDIV();
			///hijack console
			var l = console.log;
			console.log = function (message) {
				buildfire.logger.pushHistory("l: " +  message);
				l.apply(console, arguments);
			};

			var d = console.debug;
			console.debug = function (message) {
				var dv = document.createElement('div');
				dv.innerHTML = "d: " + message;
				dv.className = 'bg-info';
				buildfire.logger.pushHistory(dv);
				d.apply(console, arguments);
			};

			var e = console.error;
			console.error = function (message) {
				var dv = document.createElement('div');
				dv.innerHTML = "e: " + message;
				dv.className = 'bg-error';
				buildfire.logger.pushHistory(dv);
				e.apply(console, arguments);
			};

			var w = console.warn;
			console.warn = function (message) {
				var dv = document.createElement('div');
				dv.innerHTML = "w: " + message;
				dv.className = 'bg-warning';
				buildfire.logger.pushHistory(dv);
				buildfire.logger.pushHistory("w: " +  message);
				w.apply(console, arguments);
			};
		}
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
	///custom events are super thus this implementation
	, eventManager:{
		events:{}
		,add:function(event,handler,allowMultipleHandlers){
			if(typeof(handler) != 'function')throw ("Invalid event handler");

			if(!allowMultipleHandlers) this.clear(event);

			if (!this.events[event])
				this.events[event] = [handler];
			else
				this.events[event].push(handler);

			var eh= this.events[event];
			return {
				clear:function () {
					for(var i = 0; i <eh.length; i++ )
						if (eh[i] === handler)
							eh.splice(i, 1);
				}
			};
		}
		,clear:function(event){
			this.events[event]=[];
		}
		,trigger:function(event,data){
			if(this.events[event])
				for(var i = 0; i <this.events[event].length; i++ ) {
					try {this.events[event][i](data);}
					catch (e) {console.error(e);}
				}
		}
	}

	, context:null
	, init: function () {
		// Listen to message from child window
		window.removeEventListener('message', buildfire._postMessageHandler, false);
		window.addEventListener('message', buildfire._postMessageHandler, false);

		buildfire.logger.init();
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

		buildfire._insertHTMLAttributes();
		buildfire.appearance.attachCSSFiles();
	}
	, _whitelistedCommands:["datastore.triggerOnUpdate"
		,"datastore.triggerOnRefresh"
		,"messaging.onReceivedMessage"
		, "history.triggerOnPop"
		,"navigation.onBackButtonClick"
		,"services.media.audioPlayer.triggerOnEvent"
		, "auth.triggerOnLogin"
		, "auth.triggerOnLogout"
		,"logger.showHistory"]
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
		,goBack:function(){
			buildfire.navigation.onBackButtonClick();
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
				buildfire.logger.log('buildfire.js ignored callback ' + JSON.stringify(arguments));
			};

		var timeout = setTimeout(function(){
			console.warn('plugin never received a callback ' + packet.cmd,packet,window.location.href);
		},5000);
		var wrapper = function(err,data){

			clearTimeout( timeout);
			callback(err,data);
		};

		buildfire._callbacks[packet.id] = wrapper;

		if(buildfire.context && buildfire.context.instanceId) packet.instanceId = buildfire.context.instanceId;
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
		getWithDynamicData: function ( tag, callback) {

			var tagType = typeof(tag);
			if (tagType == "undefined")
				tag = '';
			else if (tagType == "function" && typeof(callback) == "undefined") {
				callback = tag;
				tag = '';
			}
			var obj ={tag:tag, withDynamicData: true };
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
		, onUpdate: function (callback,allowMultipleHandlers) {
			return buildfire.eventManager.add('datastoreOnUpdate',callback,allowMultipleHandlers);
		}
		, triggerOnUpdate: function (obj) {
			buildfire.eventManager.trigger('datastoreOnUpdate',obj);
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoreonrefreshcallback
		, onRefresh: function (callback,allowMultipleHandlers) {
			return buildfire.eventManager.add('datastoreOnRefresh',callback,allowMultipleHandlers);
		}
		, triggerOnRefresh: function (obj) {
			buildfire.eventManager.trigger('datastoreOnRefresh',obj);
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

			if (!options.width && !options.height)
				options={width:'full',height:'full'};

			if(options.width == 'full') options.width= window.innerWidth;
			if(options.height== 'full') options.height= window.innerHeight;

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
		onPop: function (callback,allowMultipleHandlers) {
			return buildfire.eventManager.add('historyOnPop',callback,allowMultipleHandlers);
		},
		triggerOnPop: function (obj) {
			buildfire.eventManager.trigger('historyOnPop',obj);
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
			var p = new Packet(null, 'pluginInstances.showDialog', {options: options});
			buildfire._sendPacket(p, callback);
		}
		,get : function (ids , callback){
			var p = new Packet(null, 'pluginInstances.get', ids);
			buildfire._sendPacket(p, callback);
		}
		/*
		* options {
		* title : for searching
		* , pageIndex : 0
		* , pageSize: max 20
		* }
		* */
		,search: function (options, callback){
			var p = new Packet(null, 'pluginInstances.search', options);
			buildfire._sendPacket(p, callback);
		}
	}
	, parseQueryString:function () {
		var query = window.location.search.substring(1);
		var vars = query.split('&');
		var obj= {};
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');
			obj[decodeURIComponent(pair[0])] = decodeURIComponent(pair[2]);
		}
		return obj;
	}
	, deeplink:{
		getData: function(callback){
			var qs = buildfire.parseQueryString();
			callback(qs.dld); /// dld: Deep Link Data
		}
		,createLink: function(obj){
			var root = "app" + buildfire.context.appId + "://plugin";
			if(!obj)
				return root;
			else
				return root + "?dld=" + JSON.stringify(obj);
		}
	}
	,spinner:{
		show:function(){
			buildfire._sendPacket(new Packet(null,'spinner.show'));
		}
		,hide:function(){
			buildfire._sendPacket(new Packet(null,'spinner.hide'));
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
	, auth: {
		login: function () {
			var p = new Packet(null, 'auth.login', options);
			buildfire._sendPacket(p, callback);
		},
		logout: function () {
			var p = new Packet(null, 'auth.logout', options);
			buildfire._sendPacket(p, callback);
		},
		getCurrentUser: function () {
			var p = new Packet(null, 'auth.getCurrentUser', options);
			buildfire._sendPacket(p, callback);
		},
		onLogin: function (callback,allowMultipleHandlers) {
			return buildfire.eventManager.add('authOnLogin',callback,allowMultipleHandlers);
		},
		triggerOnLogin: function (user) {
			buildfire.eventManager.trigger('authOnLogin',user);
		},
		onLogout: function (callback,allowMultipleHandlers) {
			return buildfire.eventManager.add('authOnLogout',callback,allowMultipleHandlers);
		}
		, triggerOnLogout: function (data) {
			return buildfire.eventManager.add('authOnLogout',data);
		}
	}
};
buildfire.init();


document.addEventListener("DOMContentLoaded", function (event) {
	buildfire.appearance.autosizeContainer();
});
document.addEventListener("resize", function (event) {
	buildfire.appearance.autosizeContainer();
});

