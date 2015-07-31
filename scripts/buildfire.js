"use strict";

function Packet(id, cmd, data) {
	this.id = id ? id : new Date().toISOString();
	this.cmd = cmd;
	this.data = data;
}

var buildfire = {
	logger: {
		_suppress:true
		,show:function(){
			this._suppress=false;
		}
		,hide:function(){
			this._suppress=true;
		}
		,error:function(){
			if(!this._suppress)
				console.error.apply(console, arguments);
		}
		,log:function(){
			if(!this._suppress)
				console.log.apply(console, arguments);
		}
		,warn:function(){
			if(!this._suppress)
				console.warn.apply(console, arguments);
		}
		,debug:function(){
			if(!this._suppress)
				console.debug.apply(console, arguments);
		}
	}
	,_callbacks: {}
	, init: function () {
		// Listen to message from child window
		window.removeEventListener('message', buildfire.postMessageHandler, false);
		window.addEventListener('message', buildfire.postMessageHandler, false);
		document.getElementsByTagName('html')[0].setAttribute('buildfire', 'enabled');
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
	, postMessageHandler: function (e) {
		if (e.source === window) return;//e.origin != "null"
		buildfire.logger.log('buildfire.js received << ' + e.data, window.location.href);
		var packet = JSON.parse(e.data);

		if (packet.id && buildfire._callbacks[packet.id]) {
			buildfire._callbacks[packet.id](packet.error, packet.data);
			delete buildfire._callbacks[packet.id];
		}
		else if (packet.cmd == "datastore.triggerOnUpdate" /// cmds that are allowed to be pushed in
		|| packet.cmd == "datastore.triggerOnRefresh") {
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
		buildfire.sendPacket(p, callback);
	}
	, navigateTo: function (pluginId, instanceId, title) {
		var p = new Packet(null, 'navigateTo', {pluginId: pluginId, instanceId: instanceId, title: title});
		this.sendPacket(p);
	}
	, navigateHome: function () {
		var p = new Packet(null, 'navigateHome');
		this.sendPacket(p);
	}
	, appearance: {
		getCSSFiles: function (callback) {
			var p = new Packet(null, 'appearance.getCSSFiles');
			buildfire.sendPacket(p, callback);
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
			linkElement.setAttribute("href", appHost + '/api/app/styles/appTheme.css?appId=' + appId +'&liveMode=' + liveMode);
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
			if (buildfire.appearance._resizedTo != height || height < 100) return;
			var p = new Packet(null, 'appearance.autosizeContainer', {height: height});
			buildfire.sendPacket(p);
			buildfire.appearance._resizedTo = height;
		}
		, setHeaderVisibility: function(value){
			var p = new Packet(null, "appearanceAPI.setHeaderVisibility", value);
			buildfire.sendPacket(p);
		}
	}
	, sendPacket: function (packet, callback) {
		if (typeof (callback) != "function")// handels better on response
			callback = function (err, result) {
				buildfire.logger.log('buildfire.js ignored callback ' + JSON.stringify(arguments)), window.location.href
			};

		buildfire._callbacks[packet.id] = callback;

		var p = JSON.stringify(packet);
		buildfire.logger.log("BuildFire.js Send >> " + p, window.location.href);
		if (parent)parent.postMessage(p, "*");
	}
	, analytics: {
		trackAction: function (actionName, metadata) {
			var p = new Packet(null, "analytics.trackActionCommand", {
				value: actionName,
				metadata: metadata
			}); // wrap object to follow the command(obj, callback)
			buildfire.sendPacket(p);
		}
		,
		trackView: function (actionName, metadata) {
			var p = new Packet(null, "analytics.trackViewCommand", {
				value: actionName,
				metadata: metadata
			}); // wrap object to follow the command(obj, callback)
			buildfire.sendPacket(p);
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore
	, datastore: {
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoreget-tag-optional-id-optional-callback
		get: function (tag, id, callback) {

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
            var obj ={tag:tag , id:id};
			var p = new Packet(null, 'datastore.get', obj);
			buildfire.sendPacket(p, callback);

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
			buildfire.sendPacket(p, function (err, result) {
				if (result)buildfire.datastore.triggerOnUpdate(result);
				if (callback)callback(err, result);
			});
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoreinsert-obj-tag-optionalcheckduplicate--callback
		, insert: function (obj, tag,checkDuplicate, callback) {

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

			var p = new Packet(null, 'datastore.insert', {tag: tag, obj: obj , checkDuplicate:checkDuplicate});
			buildfire.sendPacket(p, function (err, result) {
				if (result)buildfire.datastore.triggerOnUpdate(result);
				callback(err, result);
			});
		}
        /// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastorebulkinsert-obj-tag-optional---callback
		, bulkInsert: function (arrayObj, tag, callback) {

            if(arrayObj.constructor !== Array){

                 callback({"code":"error","message":"the data should be an array"},null);
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
            buildfire.sendPacket(p, function (err, result) {
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

			var p = new Packet(null, 'datastore.update', {tag: tag,id:id, obj: obj});
			buildfire.sendPacket(p, function (err, result) {
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
			if(typeof(options) == "undefined") options ={filter:{}};
			if(!options.filter) options.filter ={};

			var p = new Packet(null, 'datastore.search', {tag: tag, obj: options});
			buildfire.sendPacket(p, function (err, result) {
				if (result)buildfire.datastore.triggerOnUpdate(result);
				callback(err, result);
			});
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoreonupdatecallback
		, onUpdate: function (callback) {
			document.addEventListener('datastoreOnUpdate', function (e) {
				if (callback)callback(e.detail);
			}, false);
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
		, disableRefresh: function(){
			var p = new Packet(null, "datastore.disableRefresh");
			buildfire.sendPacket(p);
		}
	}
	, imageLib: {
		showDialog: function (options, callback) {
			var p = new Packet(null, 'imageLib.showDialog', options);
			buildfire.sendPacket(p, callback);
		}
		,resizeImage: function (url, options) {
			var root="s7obnu.cloudimage.io/s/";
			if(typeOf(options) != "object")
				throw ("options not an object");

			if(options.width && !option.height)
				return root + "width/" + options.width + "/" + url;
			else if(!options.width && option.height)
				return root + "height/" + options.height + "/" + url;
			else if(options.width && option.height)
				return root + "resizenp/" + options.width+ "x" + options.height + "/" + url;
			else
				return url;
		}
		,cropImage: function (url, options) {
			var root="s7obnu.cloudimage.io/s/crop/";
			if(typeOf(options) != "object")
				throw ("options not an object");

			if(!options.width && !option.height)
				throw ("options must have both height and width");

			return root + options.width + "x" + options.height + "/" + url;

		}

	}
	, notifications: {
		alert: function (message, callback) {
			alert(message);
		}
	}
    , actionItems: {
        showDialog: function (actionItem, options, callback) {
            var p = new Packet(null, 'actionItems.showDialog', {actionItem: actionItem, options: options});
            buildfire.sendPacket(p, callback);
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