//"use strict";

function Packet(id, cmd, data) {
	this.id = id ? id : new Date().toISOString() + Math.random();
	this.cmd = cmd;
	this.data = data;
	this.instanceId = null;
}



/// ref: https://github.com/BuildFire/sdk/wiki
var buildfire = {
	isFileServer: function(url){
		return (url.indexOf('s3.amazonaws.com') !== -1);
	}
	, isWidget: function() {
		return window.location.href.indexOf('/widget/') > 0;
	}
	, isWidgetService: function() {
		return buildfire.isWidget() && window.location.href.indexOf('/widget/index.html') < 0;
	}
	, isWeb: function(callback){
		var isWebFromContext = function (context) {
			if (context && context.device && context.device.platform) {
				return context.device.platform.toLowerCase() === 'web';
			} else {
				console.error('context device platform not defined');
				return (window.location.protocol.indexOf('http') === 0);
			}
		};
		var context = buildfire.getContext(function(err, callbackContext){
			if(callback){
				if(err) {
					callback(err);
				} else {
					callback(null, isWebFromContext(callbackContext));
				}
			}
		});
		if(context) {
			return isWebFromContext(context);
		} else {
			if(!callback) {
				console.warn('context not ready. must use isWeb with callback parameter: function(err, isWebResult)');
				return (window.location.protocol.indexOf('http') === 0);
			}
			// don't return anything if context is not ready but we have a callback
		}

	},
	_lazyScriptsQueues: {},
	lazyLoadScript: function({ relativeScriptsUrl, scriptId }, readyCallback) {
		if (!this._lazyScriptsQueues[scriptId]) {
			this._lazyScriptsQueues[scriptId] = { loaded: false, queue:[] };
		} else if (this._lazyScriptsQueues[scriptId].loaded && readyCallback) {
			return readyCallback();
		}


		const lazyQueue = this._lazyScriptsQueues[scriptId];
		lazyQueue.queue.push(readyCallback);

		if (lazyQueue.queue.length > 1) {
			return;
		}
		const url = buildfire.getContext().type === 'control' ?
			`../../../../scripts/${relativeScriptsUrl}`
			: `../../../scripts/${relativeScriptsUrl}`;

		const _executeQueue = (err) => {
			lazyQueue.queue.forEach((callback) => {
				if (callback) callback(err);
			});
			lazyQueue.loaded = true;
			lazyQueue.queue = []; // clear queue
		};
		buildfire.loadScript({ url, scriptId }, _executeQueue);
	},
	loadScript: function({ url, scriptId }, callback = Function()) {
		let script = document.getElementById(scriptId);
		const scripts = document.getElementsByTagName('script');

		// script exist
		if (script ||  Array.from(scripts).some((s) =>  s.src.includes(url.replaceAll("../", "")))) {
			return callback();
		}

		const parentElement = (document.head || document.body);
		script = document.createElement('script');
		script.id = scriptId || '';
		script.type = 'text/javascript';
		script.src = url;
		script.onload = callback;
		script.onerror = function () {
			callback(new Error('failed to load script component'));
			console.error('failed to load script component');
		};
		parentElement.appendChild(script);
	}, ratingSystem: {
		inject: function () {
			if (typeof buildfire === 'undefined') return;
			if (typeof (buildfire.components) == 'undefined' || typeof (buildfire.components.ratingSystem) == 'undefined') {
				loadScript('../../../scripts/buildfire/components/ratingSystem/index.min.js', function (err) {
					var parentElement = (document.head || document.body);
					var link = document.createElement('link');
					link.rel = 'stylesheet';
					link.type = 'text/css';
					link.href = '../../../scripts/buildfire/components/ratingSystem/index.min.css';
					parentElement.appendChild(link);
					// utf-8 encoding is necessary for the rating system to function
					const charset = parentElement.querySelector('meta[charset]');
					if (!charset || !charset.getAttribute('charset').toLowerCase().includes('utf-8')) {
						console.warn('UTF-8 charset is required for ratingSystem to function properly');
					}
					buildfire.components.ratingSystem.injectRatings({ isFromWysiwyg: true });
				});
			} else buildfire.components.ratingSystem.injectRatings({ isFromWysiwyg: true });

			function hasScript(url) {
				while (url.includes('../')) url = url.replace('../', '');
				var scripts = document.getElementsByTagName('script');
				for (var i = 0; i < scripts.length; i++) {
					if(scripts[i].src.includes(url)) return true;
				}
				return false;
			}

			function loadScript(url, callback) {
				if(hasScript(url)) return;
				var parentElement = (document.head || document.body);
				var script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = url;
				script.charset = 'utf-8';
				script.onreadystatechange = callback;
				script.onload = callback;
				parentElement.appendChild(script);
			}
		}
	}
	, logger: {
		attachRemoteLogger:function (tag){

			// dont attach twice
			let buildFireAppDebuggerScript = document.getElementById('BuildFireAppDebuggerScript');
			if (buildFireAppDebuggerScript) {
				buildFireAppDebuggerScript.parentElement.removeChild(buildFireAppDebuggerScript);
			}

			if(!tag)
				tag = prompt('Enter is a unique tag to send your logs to');

			if(!tag) return;

			var header = document.querySelector('head');
			var script = document.createElement('script');
			script.src='http://debug.buildfire.com/target/target-script-min.js#' + tag;
			script.id = 'BuildFireAppDebuggerScript';
			header.appendChild(script);

		},
		init: function () {
			const originalConsoleError = console.error;
			console.error = function (...args) {
				if (args && args[0]) {
					buildfire.logger.log({
						message: typeof args[0] == "string" ? args[0] : "no error message provided.",
						data: args.length > 1 ? {...args} : undefined,
						level: "error",
						category: "ConsoleError"
					});
				}
				originalConsoleError(...args);
			};
			window.addEventListener("error", (event) => {
				// ignore 90% of errors to sample error reporting
				if(Math.random() >= 0.9) {
					buildfire.logger.log({
						message: event.message,
						level: "error",
						category: "BrowserJsException",
						exception: {
							colno: event.colno,
							lineno: event.lineno,
							message: event.message,
							stack: event.error && event.error.stack ? event.error && event.error.stack : "n/a",
							url: event.filename
						}
					});
				}
				originalConsoleError('Error: ' + event.message, ' Script: ' + event.filename, ' Line: ' + event.lineno
					, ' Column: ' + event.colno, ' StackTrace: ' + event.error && event.error.stack ? event.error && event.error.stack : "n/a");
			});
		},
		log: function (options, callback) {
			if (!options || (options && typeof options != 'object')) {
				options = {};
			}
			buildfire.getContext((err, context) => {
				if (!options.context) {
					options.context = {};
				}
				options.context.pluginId = context?.pluginId;
				options.context.instanceId = context?.instanceId;
				options.context.pluginTitle = context?.title;
				if (!options.tags) {
					options.tags = [];
				}
				options.tags.push('sdkAndPlugins');
				const p = new Packet(null, 'logger.log', options);
				buildfire._sendPacket(p, callback);
			});
		}
	}
	, _callbacks: {}
	, parseQueryString: function (str) {
		var query = str || window.location.search.substring(1);
		var vars = query.split('&');
		var obj = new Object();
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');
			obj[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
			var index = vars[i].indexOf('=');
			var key = vars[i].substring(0, index);
			var value = vars[i].substring(index + 1);
			obj[decodeURIComponent(key)] = decodeURIComponent(value);
		}
		return obj;
	}
	, options:{}
	, parseMetaOptions: function(){
		var options = {};

		var tags = document.head.querySelector('meta[name=buildfire]');
		if(tags && tags.content) {
			var sections = tags.content.split(',');
			sections.forEach(function(section){
				var s = section.split('=');
				options[s[0]] = s.length>1?s[1]:true;
			});
		}

		return options;
	}
	///custom events are super thus this implementation
	, eventManager: {
		events: {}
		, add: function (event, handler, allowMultipleHandlers) {
			if (typeof(handler) != 'function')throw ('Invalid event handler');

			if (!allowMultipleHandlers) this.clear(event);

			if (!this.events[event])
				this.events[event] = [handler];
			else
				this.events[event].push(handler);

			var eh = this.events[event];
			return {
				clear: function () {
					for (var i = 0; i < eh.length; i++)
						if (eh[i] === handler)
							eh.splice(i, 1);
				}
			};
		}
		, clear: function (event) {
			this.events[event] = [];
		}
		, trigger: function (event, data) {
			if (this.events[event])
				for (var i = 0; i < this.events[event].length; i++) {
					try {
						this.events[event][i](data);
					}
					catch (e) {
						console.error(e);
					}
				}
		}
	}
	, _context: null
	, get context() {
		console.warn('buildfire.context is obsolete and will be removed soon');
		return buildfire._context;
	}
	, set context(obj) {
		buildfire._context = obj;
	}
	, init: function () {
		// Listen to message from child window
		window.removeEventListener('message', buildfire._postMessageHandler, false);
		window.addEventListener('message', buildfire._postMessageHandler, false);

		buildfire.options = buildfire.parseMetaOptions();


		buildfire.appearance.insertHTMLAttributes();

		buildfire.appearance.attachCSSFiles();

		buildfire.localStorage.overrideNativeLocalStorage();

		buildfire.wysiwyg.extend();

		//attach plugin.js script that contains plugin.json content.
		function attachPluginJsScript () {
			document.write('<script src="plugin.js" type=\"text/javascript\"><\/script>');
		}

		function getPluginJson(callback) {
			const url = `../plugin.json?v=${(new Date()).getTime()}`;
			fetch(url)
				.then(response => response.json())
				.then(res => {
					callback(null,res);
				})
				.catch(error => {
					callback(error, null);
				});
		}

		if (window.location.pathname.indexOf('/widget/') >= 0 && buildfire.options.enablePluginJsonLoad) {
			buildfire.getContext((err, context) => {
				if (err) return console.error(err);
				if (context && context.scope === 'sdk') {
					getPluginJson((err, pluginJson)=>{
						if(err) console.error(err);
						window.pluginJson = pluginJson;
						buildfire._cssInjection.handleCssLayoutInjection(pluginJson);

						if (pluginJson && pluginJson.control && pluginJson.control.language && pluginJson.control.language.enabled) {
							//handle language settings
							function getPluginLanguageJson(callback) {
								const url = `../${pluginJson.control.language.languageJsonPath}`;
								fetch(url)
									.then(response => response.json())
									.then(res => {
										callback(null, res);
									})
									.catch(error => {
										callback(error, null);
									});
							}
							getPluginLanguageJson((err, pluginLanguageJson)=>{
								if(err) console.error(err);
								window.pluginLanguageJson = pluginLanguageJson;
								buildfire.language.handleLanguageSettings(window.pluginJson, pluginLanguageJson);
							});
						}
					});
				} else {
					attachPluginJsScript();
				}
			});
		}
		//init logger
		buildfire.logger.init();

		// signal plugin loading
		var p = new Packet(null, 'diagnostics.signal', { pluginLoadingAt: new Date() });
		buildfire._sendPacket(p);
	}
	, _whitelistedCommands: [
		'datastore.triggerOnUpdate'
		, 'datastore.triggerOnRefresh'
		, 'userData.triggerOnUpdate'
		, 'userData.triggerOnRefresh'
		, 'publicData.triggerOnUpdate'
		, 'publicData.triggerOnRefresh'
		, 'appData.triggerOnUpdate'
		, 'appData.triggerOnRefresh'
		, 'messaging.onReceivedMessage'
		, 'messaging.onReceivedBroadcast'
		, 'dynamic.triggerContextChange'
		, 'dynamic.onReceivedWidgetContextRequest'
		, 'dynamic.expressions.onReceivedCustomExpressionsRequest'
		, 'history.triggerOnPop'
		, 'navigation.onBackButtonClick'
		, 'services.media.audioPlayer.triggerOnEvent'
		, 'auth.triggerOnLogin'
		, 'auth.triggerOnLogout'
		, 'auth.triggerOnUpdate'
		, 'logger.attachRemoteLogger'
		, 'device.triggerKeyboardWillShow'
		, 'device.triggerKeyboardWillHide'
		, 'appearance.triggerOnUpdate'
		, '_cssInjection.triggerOnUpdate'
		, 'language.triggerOnUpdate'
		, 'device.triggerOnAppBackgrounded'
		, 'device.triggerOnAppResumed'
		, 'notifications.localNotification.onClick'
		, 'geo.onPositionChange'
		, 'navigation.triggerOnAppLauncherActive'
		, 'navigation.triggerOnAppLauncherInactive'
		, 'colorLib._triggerOnChange'
		, 'services.publicFiles._triggerOnProgress'
		, 'services.publicFiles._triggerOnComplete'
		, 'services.fileSystem.fileManager._triggerOnProgress'
		, 'notes.triggerOnSeekTo'
		, 'navigation.triggerOnPluginOpened'
		, 'deeplink.triggerOnUpdate'
		, 'services.commerce.inAppPurchase._triggerOnPurchaseRequested'
		, 'services.commerce.inAppPurchase._triggerOnPurchaseResult'
		, 'services.reportAbuse._triggerOnAdminResponse'
		, 'geo.session._triggerOnSessionWatchChange'
	]
	, _postMessageHandler: function (e) {
		if (e.source === window) {
			return;
		}

		var packet;
		if (typeof(e.data) === 'object') {
			packet = e.data;
		} else {
			try {
				packet = JSON.parse(e.data);
			} catch (error) {
				buildfire.getContext(function (err, { pluginId, instanceId, title }) {
					let data = {
						origin: e.origin,
						data: e.data,
						pluginId,
						instanceId,
						title
					};
					console.warn('ignored malformed packet', data);
				});
				return;
			}
		}

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

			let callback = function (err, result) {
				if (err) console.warn(e.data, err);
				let newPacket = new Packet(packet.id, 'noop', result, err);
				buildfire._parentPost(newPacket);
			};

			obj.apply(parent, [packet.data, callback]);

		}
		else {
			console.warn(window.location.href + ' unhandled packet', packet);
		}
	}

	//, _resendAttempts:0
	, _sendPacket: function (packet, callback) {
		if (typeof (callback) != 'function')// handles better on response
			callback = function (err, result) {
				// don't do anything
			};
		if (buildfire.isWidget()) {
			packet.source = 'widget';
		} else {
			packet.source = 'control';
		}

		// avoid using buildfire.getContext here, as it might cause an infinite loop
		if (buildfire._context) {
			packet.originInstanceId = buildfire._context.instanceId;
		}

		var retryInterval = 3000,
			command = packet.cmd,
			maxResendAttempts = 5,
			resendAttempts = 0;

		var isDataStoreRetry = (command.indexOf('datastore') == 0
            && command.indexOf('datastore.insert') != 0
            && command.indexOf('datastore.bulkInsert') != 0
            && command.indexOf('datastore.disableRefresh') != 0
            && command.indexOf('datastore.searchAndUpdate') != 0
            && command.indexOf('datastore.update') != 0
		);

		var isGetContextRetry = (command.indexOf('getContext') == 0);

		var allowRetry = (isDataStoreRetry || isGetContextRetry);

		var resend = function(){
			if(resendAttempts < maxResendAttempts) {
				console.log('calling ' + packet.cmd + ' again. total overall resend attempts ' + resendAttempts);

				buildfire._sendPacket(packet, function (e, d) {
					resendAttempts--;
					callback(e, d);
				});
				resendAttempts++;
			}
		};

		if(allowRetry) {
			var timeout = setTimeout(resend,  retryInterval);
		}

		var wrapper = function (err, data) {
			clearTimeout(timeout); // commented this to remove the 'timeout is not defined' error.
			callback(err, data);
		};

		buildfire._callbacks[packet.id] = wrapper;
		packet.fid= buildfire.fid;

		buildfire._parentPost(packet,callback);
	}
	,_parentPost: function (packet) {

		function sanitize(data){
			if(data)delete data.$$hashKey;
			for(var p in data){
				var obj = data[p];
				if( typeof(obj) == 'object')
					data[p] = sanitize (obj);
			}
			return data;
		}

		if (parent && packet) {
			if(packet.data && typeof(angular) != 'undefined') packet.data= sanitize(packet.data);
			parent.postMessage(packet, '*');
		}
	}

	, getContext: function (callback) {
		if (buildfire._context) {
			if(callback)callback(null, buildfire._context);
		}
		else {
			if(window.parsedQuerystring.appcontext) {
				buildfire._context = JSON.parse(window.parsedQuerystring.appcontext);
				if(callback)callback(null, buildfire._context);
			} else {
				if(!callback) throw 'Context not ready. Use callback parameter instead of direct return';
				var p = new Packet(null, 'getContext');
				buildfire._sendPacket(p, function (err, data) {
					if (data)
						buildfire._context = data;
					if(callback)callback(err, data);
				});
			}
		}
		return buildfire._context;
	}
	, getGlobalSettings: function (options, callback) {
		const p = new Packet(null, 'getGlobalSettings');
		buildfire._sendPacket(p, function (err, data) {
			if (err) return callback(err);
			callback(null, data);
		});
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Navigation
	, navigation: {
		/**
         * Navigate To plugin
         * @pluginData {pluginId : pluginId,instanceId : instanceId,folderName:folderName,title:title ,queryString: to pass to next plugin}
         */
		navigateTo: function (pluginData, callback) {
			if(pluginData.pluginTypeId && !pluginData.pluginId)
				pluginData.pluginId=pluginData.pluginTypeId;


			var p = new Packet(null, 'navigation.navigateTo', {
				pluginId: pluginData.pluginId,
				instanceId: pluginData.instanceId,
				title: pluginData.title,
				folderName: pluginData.folderName,
				queryString: pluginData.queryString
			});
			buildfire._sendPacket(p, callback);
		}
		, navigateToSocialWall: function (options, callback) {
			if (!callback) {
				callback = console.warn;
			}
			if (!options) {
				options = {};
			}
			if(options.wallUserIds) {
				var wid = options.wallUserIds.sort().reverse().join('');
				if(options.queryString) {
					options.queryString += '&wid=' + wid;
				} else {
					options.queryString = 'wid=' + wid;
				}
			}
			if(options.headerContentHtml) {
				var encodedHeaderContent = encodeURIComponent(options.headerContentHtml);
				if(encodedHeaderContent.length < 4000) {
					if(options.queryString) {
						options.queryString += `&headerContentHtml=${encodedHeaderContent}`;
					} else {
						options.queryString = `headerContentHtml=${encodedHeaderContent}`;
					}
				}
				delete options.headerContentHtml;
			}
			var predefinedPluginIds = {
				'community': 'b15c62f2-7a99-48dc-a37a-e42d46bd3289',
				'premium_social': '697f1612-8208-4870-93f9-555c65103578',
				'social': '7b3d82bf-e5f1-4b2e-82bf-966d2ab0340d'
			};
			var orderedPluginIds = [];
			options.pluginTypeOrder = options.pluginTypeOrder && options.pluginTypeOrder.length ? options.pluginTypeOrder : [
				'community',
				'premium_social',
				'social'
			];
			for (var orderIndex = 0; orderIndex < options.pluginTypeOrder.length; orderIndex++) {
				if (!predefinedPluginIds[options.pluginTypeOrder[orderIndex]]) {
					return callback ('unknown plugin ' + options.pluginTypeOrder[orderIndex]);
				}
				orderedPluginIds.push(predefinedPluginIds[options.pluginTypeOrder[orderIndex]]);
			}
			navigate(options, orderedPluginIds[0], function (error) {
				if (!error) return callback(null, {status: 'completed'});
				if (orderedPluginIds[1]) {
					navigate(options, orderedPluginIds[1], function (error) {
						if (!error) return callback(null, {status: 'completed'});
						if (orderedPluginIds[2]) {
							navigate(options, orderedPluginIds[2], callback);
						} else {
							callback(error);
						}
					});
				} else {
					callback(error);
				}
			});
			function navigate(data, pluginId, cb) {
				data.pluginId = pluginId;
				var p = new Packet(null, 'navigation.navigateTo', {
					pluginId: data.pluginId,
					instanceId: data.instanceId,
					title: data.title,
					folderName: data.folderName,
					queryString: data.queryString
				});
				buildfire._sendPacket(p, cb);
			}
		}
		, navigateHome: function () {
			var p = new Packet(null, 'navigation.navigateHome');
			buildfire._sendPacket(p);
		}
		, scrollTop: function(callback){
			var p = new Packet(null, 'navigation.scrollTop');
			buildfire._sendPacket(p,callback);
		}
		, openWindow: function (url, target, callback) {
			if (!target) target = '_blank';
			if (!callback) callback = function () {
				console.info('openWindow:: completed');
			};
			var actionItem = {
				url: url
				, openIn: target
			};
			var p = new Packet(null, 'actionItems.executeOpenWebLink', actionItem, callback);
			buildfire._sendPacket(p, callback);
		}
		, _goBackOne: function () {
			buildfire._sendPacket(new Packet(null, 'navigation.navigateBack'));
		}
		, onBackButtonClick: function () {
			buildfire.navigation._goBackOne();
		}
		, restoreBackButtonClick: function () {
			buildfire.navigation.onBackButtonClick = function () {
				buildfire.navigation._goBackOne();
			};
		}
		, goBack: function () {
			buildfire.navigation.onBackButtonClick();
		}
		, makeSafeLinks: function (element) {
			var t = this;
			if (typeof(element) != 'object')
				element = document.getElementById(element);

			var anchors = element.querySelectorAll('a[href^=http], a[href^=https],a[href^=www]');
			for (var i = 0; i < anchors.length; i++) {
				anchors[i].setAttribute('inAppBrowser',true);
				anchors[i].addEventListener('click', function (evt) {
					evt.preventDefault();
					t.openWindow(this.href, this.target, null);
				}, false);
			}
		}
		, navigateEmulator: function(options){
			buildfire._sendPacket(new Packet(null, 'navigation.navigateEmulator', options));
		}
		, onAppLauncherActive: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('appLauncherActive', callback, allowMultipleHandlers);
		}
		, onAppLauncherInactive: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('appLauncherInactive', callback, allowMultipleHandlers);
		}
		, triggerOnAppLauncherActive: function (data) {
			return buildfire.eventManager.trigger('appLauncherActive', data);
		}
		, triggerOnAppLauncherInactive: function (data) {
			return buildfire.eventManager.trigger('appLauncherInactive', data);
		}
		, onPluginOpened: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('pluginOpened', callback, allowMultipleHandlers);
		}
		, triggerOnPluginOpened: function (data) {
			return buildfire.eventManager.trigger('pluginOpened', data);
		}
		, getBackNavigationInstanceId: function () {
			var qs = buildfire.parseQueryString();
			if (qs.backnavigationinstance)
				return qs.backnavigationinstance;
			return undefined;
		}
		, navigateToTab(options = {}, callback) {
			var p = new Packet(null, 'navigation.navigateToTab', options);
			buildfire._sendPacket(p, callback);
		}
	},
	//buildfire.getFrameType API returns string "launcherPluginv" if it is Home plugin
	// else it returns "controlIFrame"
	getFrameType: function () {
		var PLUGIN_STRING_ENUM={
			LAUNCHER_PLUGIN : 'launcherPluginv',
			CONTROL_FRAME : 'controlIFrame'
		};

		var PLUGIN_TYPE_ENUM={
			LAUNCHER_PLUGIN : 'LAUNCHER_PLUGIN',
			CONTROL_FRAME : 'CONTROL_FRAME',
			UNKNOWN : 'UNKNOWN'
		};
		var fid= buildfire.fid;
		if (fid && fid.indexOf(PLUGIN_STRING_ENUM.LAUNCHER_PLUGIN) > -1)
			return PLUGIN_TYPE_ENUM.LAUNCHER_PLUGIN;
		else if (fid && fid.indexOf(PLUGIN_STRING_ENUM.CONTROL_FRAME) > -1)
			return  PLUGIN_TYPE_ENUM.CONTROL_FRAME;
		else
			return PLUGIN_TYPE_ENUM.UNKNOWN;

	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Appearance
	, appearance: {
		ready: function() {
			var p = new Packet(null, 'appearance.ready');
			buildfire._sendPacket(p);
		},
		_defaultTheme:  {
			appName: '',
			colors: {
				backgroundColor: '#ffffff',
				bodyText: '#858585',
				dangerTheme: '#f24965',
				defaultTheme: '#07a05e',
				footerMenuBackgroundColor: '#ffffff',
				footerMenuIconColor: '#45cae6',
				headerText: '#000000',
				icons: '#45cae6',
				infoTheme: '#66d6ed',
				primaryTheme: '#45cae6',
				successTheme: '#0ac775',
				titleBar: '#0ac775',
				titleBarTextAndIcons: '#ffffff',
				warningTheme: '#ffcf40'
			},
			fontId : 'Lato',
			fontName: 'Lato'
		},
		_setFontUrl: function (context, appTheme) {
			if (appTheme.fontId) {
				if (appTheme.isCustomFont) {
					appTheme.fontUrl = `${context.endPoints.pluginRootHost}/${appTheme.fontFolderPath}/${context.appId}/${encodeURIComponent(appTheme.fontFileName)}?cdn-buster=${appTheme.fontLastUpdatedOn}`;
				} else {
					appTheme.fontUrl = `https://fonts.googleapis.com/css?family=${appTheme.fontId}`;
				}
			}
		},
		getAppTheme: function (callback) {
			buildfire.getContext(function(err, context){
				if(err)
					callback(err,null);
				if(context){
					if(buildfire.isWeb() && !context.appTheme){
						context.appTheme = buildfire.appearance._defaultTheme;
					}

					buildfire.appearance._setFontUrl(context, context.appTheme);

					callback(null, context.appTheme);
				}
				else
					callback(null,null);
			});
		},
		getWidgetTheme: function (callback) {
			buildfire.getContext(function(err, context){
				if (err) return callback(err, null);
				if (context){
					if (context.widgetTheme) {

						buildfire.appearance._setFontUrl(context, context.widgetTheme);

						return callback(null, context.widgetTheme);
					}
					return buildfire.appearance.getAppTheme(callback);
				} else {
					callback(null, null);
				}
			});
		},
		_forceCSSRender: function(){
			// WebKit Rendering Reset on Plugins
			if(window.location.href.indexOf('/widget/') > 0){
				var html = document.getElementsByTagName('html')[0];
				var style = document.createElement('style');
				style.type = 'text/css';
				style.innerHTML = 'body{position:relative !important; z-index:1 !important;} .plugin-slide{position:relative !important;} .plugin-slide, .plugin-slide img{transform: translateZ(0) !important;';
				html.appendChild(style);
			}
		},
		insertHTMLAttributes: function () {
			var html = document.getElementsByTagName('html')[0];

			if(window.location.href.indexOf('/widget/') > 0){
				html.setAttribute('buildfire', 'widget');
				html.setAttribute('type', 'app');
			}else{
				html.setAttribute('buildfire', 'control');
			}

			var nVer = navigator.appVersion;
			var nAgt = navigator.userAgent;
			var browserName = navigator.appName;
			var fullVersion = '' + parseFloat(navigator.appVersion);
			var majorVersion = parseInt(navigator.appVersion, 10);
			var nameOffset, verOffset, ix;
			var os = 'Unknown OS';
			// In Opera, the true version is after "Opera" or after "Version"
			if ((verOffset = nAgt.indexOf('Opera')) != -1) {
				browserName = 'Opera';
				fullVersion = nAgt.substring(verOffset + 6);
				if ((verOffset = nAgt.indexOf('Version')) != -1)
					fullVersion = nAgt.substring(verOffset + 8);
			}
			// In MSIE, the true version is after "MSIE" in userAgent
			else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
				browserName = 'Microsoft Internet Explorer';
				fullVersion = nAgt.substring(verOffset + 5);
			}
			// In Chrome, the true version is after "Chrome"
			else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
				browserName = 'Chrome';
				fullVersion = nAgt.substring(verOffset + 7);
			}
			// In Safari, the true version is after "Safari" or after "Version"
			else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
				browserName = 'Safari';
				fullVersion = nAgt.substring(verOffset + 7);
				if ((verOffset = nAgt.indexOf('Version')) != -1)
					fullVersion = nAgt.substring(verOffset + 8);
			}
			// In Firefox, the true version is after "Firefox"
			else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
				browserName = 'Firefox';
				fullVersion = nAgt.substring(verOffset + 8);
			}
			// In most other browsers, "name/version" is at the end of userAgent
			else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
                (verOffset = nAgt.lastIndexOf('/'))) {
				browserName = nAgt.substring(nameOffset, verOffset);
				fullVersion = nAgt.substring(verOffset + 1);
				if (browserName.toLowerCase() == browserName.toUpperCase()) {
					browserName = navigator.appName;
				}
			}
			// trim the fullVersion string at semicolon/space if present
			if ((ix = fullVersion.indexOf(';')) != -1)
				fullVersion = fullVersion.substring(0, ix);
			if ((ix = fullVersion.indexOf(' ')) != -1)
				fullVersion = fullVersion.substring(0, ix);

			majorVersion = parseInt('' + fullVersion, 10);
			if (isNaN(majorVersion)) {
				fullVersion = '' + parseFloat(navigator.appVersion);
				majorVersion = parseInt(navigator.appVersion, 10);
			}


			if (navigator.appVersion.indexOf('Win') != -1) os = 'Windows';
			if (navigator.appVersion.indexOf('Mac') != -1) os = 'MacOS';
			if (navigator.appVersion.indexOf('X11') != -1) os = 'UNIX';
			if (navigator.appVersion.indexOf('Linux') != -1)os = 'Linux';

			html.setAttribute('os', os);
			html.setAttribute('browser', browserName);
			html.setAttribute('majorVersion', majorVersion);
			html.setAttribute('fullVersion', fullVersion);

			var userAgent = navigator.userAgent || navigator.vendor || window.opera;
			if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i) || (userAgent.match(/Macintosh/i) && navigator.maxTouchPoints > 1)) {
				var p = new Packet(null, 'appearance.getFooterMenu');
				buildfire._sendPacket(p, function (err, footerMenu) {
					if (err) {
						console.error(err);
					}
					if ((!footerMenu || !footerMenu.settings) || !footerMenu.settings.turnOnFooterMenu) {
						html.setAttribute('safe-area', 'true');
					}
				});
			}
		}
		, getCSSFiles: function (callback) {
			var p = new Packet(null, 'appearance.getCSSFiles');
			buildfire._sendPacket(p, callback);
		}
		, attachCSSFiles: function () {
			var files = [], base = '';

			var disableBootstrap = (buildfire.options && buildfire.options.disableBootstrap) ? buildfire.options.disableBootstrap : false;
			var disableTheme = (buildfire.options && buildfire.options.disableTheme) ? buildfire.options.disableTheme : false;
			var enableMDTheme = (buildfire.options && buildfire.options.enableMDTheme) ? buildfire.options.enableMDTheme  : false;
			var disableFontIcons = (buildfire.options && buildfire.options.disableFontIcons) ? buildfire.options.disableFontIcons  : false;

			if (!disableTheme && !enableMDTheme) {
				if(!disableTheme && !disableBootstrap){
					files.push('styles/bootstrap.css');
				}

				if (window.location.pathname.indexOf('/control/') >= 0) {
					files.push('styles/siteStyle.css') &&
                    files.push('styles/pluginScreen.css');
				}
				else{
					var disableAppStyles = (buildfire.options && buildfire.options.disableAppStyles) ? buildfire.options.disableAppStyles : false;

					if(!disableAppStyles){
						files.push('styles/appStyle.css');
					}
				}
			}

			// TODO: verify why in attachCSSFiles and if should not run if disableTheme === true ?
			var scripts = document.getElementsByTagName('script');

			for (var i = 0; i < scripts.length; i++) {
				var src = scripts[i].src;

				if (src.indexOf('buildfire.js') > 0) {
					base = src.replace('/scripts/buildfire.js', '');
					break;
				} else if (src.indexOf('buildfire.min.js') > 0) {
					base = src.replace('/scripts/buildfire.min.js', '');
					break;
				}
				else if (src.match(/(\/scripts\/_bundle\S+.js)/gi)) {
					base = src.replace(/(\/scripts\/_bundle\S+.js)/gi, '');
					break;
				}
			}

			const attachFontIcons = function(theme) {
				const fontIconLinkId = 'bfFontIcons';

				let iconPack;
				if (theme && theme.icons && theme.icons.iconPack) {
					iconPack = theme.icons.iconPack;
				} else {
					iconPack = 'glyph';
				}

				let fontFilePath = '';

				switch (iconPack) {
					case 'bootstrap':
						if (buildfire.isWidget()) {
							fontFilePath = '../../../styles/icons/bootstrap@5.0/bf-bootstrap-icons.css';
						} else {
							fontFilePath = '../../../../styles/icons/bootstrap@5.0/bf-bootstrap-icons.css';
						}
						break;
					default:
						if (buildfire.isWidget()) {
							fontFilePath = '../../../styles/icons/glyph@3.0/bf-glyph-icons.css';
						} else {
							fontFilePath = '../../../../styles/icons/glyph@3.0/bf-glyph-icons.css';
						}
						break;
				}

				if (fontFilePath) {
					buildfire.appearance._attachAppCSSFiles(fontFilePath, fontIconLinkId);
	     		}
			};


			buildfire.appearance.getWidgetTheme(function(err, theme) {
				if (err) return console.error(err);
				var bfWidgetTheme = document.createElement('style');
				bfWidgetTheme.id = 'bfWidgetTheme';
				bfWidgetTheme.rel = 'stylesheet';
				bfWidgetTheme.innerHTML = buildfire.appearance._getCommonCss(theme);
				(document.head || document.body).appendChild(bfWidgetTheme);
				files.push('styles/bfUIElements.css');

				if (!disableFontIcons &&
					((window.location.pathname.indexOf('/widget/') >= 0 && (disableTheme || enableMDTheme))
					|| window.location.pathname.indexOf('/control/'))) {
					// if appTheme.css is loaded, common css will be referenced already
					attachFontIcons(theme);
				}
			});

			if (enableMDTheme) {
				var styleElement = document.createElement('style');
				styleElement.id = 'appMDTheme';
				styleElement.type = 'text/css';
				function applyMDTheme(err, appTheme) {
					var css = '';
					if ( typeof(appTheme.fontId) !== 'undefined' && appTheme.fontId !== 'Arial'
                    && appTheme.fontId !== 'Sans-Serif' && appTheme.fontId !== 'Helvetica'
                    && appTheme.fontId !== 'Shadows+into+Light' && appTheme.fontId !== 'Asap+condensed' && appTheme.fontUrl) {
						if (appTheme.isCustomFont) {
							css+= '@font-face { font-family: \'' + appTheme.fontId + '\'; src: url(\'' + appTheme.fontUrl + '\') format(\'' + appTheme.fontFormat + '\'); }';
						} else {
							css += '@import url(\'' + appTheme.fontUrl + '\');';
						}
					}

					css +=  ':root:root {'
                            + '  --mdc-typography-font-family: unquote("' + appTheme.fontName + ', sans-serif");'
                            + '  --mdc-theme-primary:' + appTheme.colors.primaryTheme +';'
                            + '  --mdc-theme-secondary:' + appTheme.colors.successTheme + ';'
                            + '  --mdc-theme-surface:' + appTheme.colors.backgroundColor + ';'
                            + '  --mdc-theme-background:' + appTheme.colors.backgroundColor + ';'
                            + '  --mdc-theme-error:' + appTheme.colors.dangerTheme + ';'
                            + '  --mdc-theme-on-background:' + appTheme.colors.bodyText + ';'
                            + '  --mdc-theme-on-primary: white;'
                            + '  --mdc-theme-on-secondary: white;'
                            + '  --mdc-theme-on-error: white;'
                            + '  --mdc-theme-on-surface:' + appTheme.colors.bodyText + ';'
                            + '  --mdc-theme-text-primary-on-background:' + appTheme.colors.bodyText + ';'
                            + '  --mdc-theme-text-secondary-on-background:' + appTheme.colors.bodyText + ';'
                            + '  --mdc-theme-text-disabled-on-background:' + appTheme.colors.bodyText + ';'
                            + '  --mdc-theme-text-primary-on-light: white;'
                            + '  --mdc-theme-text-secondary-on-light: white;'
                            + '  --mdc-theme-text-hint-on-light: white;'
                            + '  --mdc-theme-text-disabled-on-light: white;'
                            + '  --mdc-theme-text-icon-on-light:  white;'
                            + '  --mdc-theme-text-primary-on-dark: white;'
                            + '  --mdc-theme-text-secondary-on-dark: white;'
                            + '  --mdc-theme-text-hint-on-dark: white;'
                            + '  --mdc-theme-text-disabled-on-dark: white;'
                            + '  --mdc-theme-text-icon-on-dark: white;'
                            + '  --mdc-theme-text-icon-on-background:' + appTheme.colors.icons + ';'
                            + '}'
                            + '*:not(i):not(.material-icons):not(.mdc-icon):not(.mdc-button__icon):not(.mdc-icon-button__icon)'
                            + '{ font-family: \'' + appTheme.fontName + '\', sans-serif !important '
                            + '}'
                            + '.mdc-typography { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-typography--headline1 { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-typography--headline2 { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-typography--headline3 { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-typography--headline4 { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-typography--headline5 { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-typography--headline6 { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-typography--subtitle1 { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-typography--subtitle2 { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-typography--body1 { font-family: ' + appTheme.fontName + ', sans-serif }, sans-serif'
                            + '.mdc-typography--body2 { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-typography--caption { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-typography--button { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-typography--overline { font-family: ' + appTheme.fontName + ', sans-serif }'
                            + '.mdc-theme--primary { color: #6200ee !important; color: var(--mdc-theme-primary, #6200ee) !important; }'
                            + '.mdc-theme--secondary { color: #018786 !important; color: var(--mdc-theme-secondary, #018786) !important; }'
                            + '.mdc-theme--background { background-color: #fff; background-color: var(--mdc-theme-background, #fff);}'
                            + '.mdc-theme--surface { background-color: #fff; background-color: var(--mdc-theme-surface, #fff);}'
                            + '.mdc-theme--error { color: #b00020 !important; color: var(--mdc-theme-error, #b00020) !important;}'
                            + '.mdc-theme--on-primary { color: #fff !important; color: var(--mdc-theme-on-primary, #fff) !important;}'
                            + '.mdc-theme--on-secondary { color: #fff !important; color: var(--mdc-theme-on-secondary, #fff) !important;}'
                            + '.mdc-theme--on-surface { color: #000 !important; color: var(--mdc-theme-on-surface, #000) !important;}'
                            + '.mdc-theme--on-error { color: #fff !important; color: var(--mdc-theme-on-error, #fff) !important;}'
                            + '.mdc-theme--text-primary-on-background { color: rgba(0, 0, 0, 0.87) !important; color: var(--mdc-theme-text-primary-on-background, rgba(0, 0, 0, 0.87)) !important;}'
                            + '.mdc-theme--text-secondary-on-background { color: rgba(0, 0, 0, 0.54) !important; color: var(--mdc-theme-text-secondary-on-background, rgba(0, 0, 0, 0.54)) !important;}'
                            + '.mdc-theme--text-hint-on-background {color: rgba(0, 0, 0, 0.38) !important; color: var(--mdc-theme-text-hint-on-background, rgba(0, 0, 0, 0.38)) !important;}'
                            + '.mdc-theme--text-disabled-on-background {color: rgba(0, 0, 0, 0.38) !important; color: var(--mdc-theme-text-disabled-on-background, rgba(0, 0, 0, 0.38)) !important;}'
                            + '.mdc-theme--text-icon-on-background { color: rgba(0, 0, 0, 0.38) !important; color: var(--mdc-theme-text-icon-on-background, rgba(0, 0, 0, 0.38)) !important;}'
                            + '.mdc-theme--text-primary-on-light { color: rgba(0, 0, 0, 0.87) !important; color: var(--mdc-theme-text-primary-on-light, rgba(0, 0, 0, 0.87)) !important;}'
                            + '.mdc-theme--text-secondary-on-light { color: rgba(0, 0, 0, 0.54) !important; color: var(--mdc-theme-text-secondary-on-light, rgba(0, 0, 0, 0.54)) !important;}'
                            + '.mdc-theme--text-hint-on-light { color: rgba(0, 0, 0, 0.38) !important; color: var(--mdc-theme-text-hint-on-light, rgba(0, 0, 0, 0.38)) !important;}'
                            + '.mdc-theme--text-disabled-on-light { color: rgba(0, 0, 0, 0.38) !important; color: var(--mdc-theme-text-disabled-on-light, rgba(0, 0, 0, 0.38)) !important;}'
                            + '.mdc-theme--text-icon-on-light { color: rgba(0, 0, 0, 0.38) !important; color: var(--mdc-theme-text-icon-on-light, rgba(0, 0, 0, 0.38)) !important;}'
                            + '.mdc-theme--text-primary-on-dark { color: white !important; color: var(--mdc-theme-text-primary-on-dark, white) !important;}'
                            + '.mdc-theme--text-secondary-on-dark { color: rgba(255, 255, 255, 0.7) !important; color: var(--mdc-theme-text-secondary-on-dark, rgba(255, 255, 255, 0.7)) !important;}'
                            + '.mdc-theme--text-hint-on-dark { color: rgba(255, 255, 255, 0.5) !important; color: var(--mdc-theme-text-hint-on-dark, rgba(255, 255, 255, 0.5)) !important;}'
                            + '.mdc-theme--text-disabled-on-dark { color: rgba(255, 255, 255, 0.5) !important; color: var(--mdc-theme-text-disabled-on-dark, rgba(255, 255, 255, 0.5)) !important;}'
                            + '.mdc-theme--text-icon-on-dark { color: rgba(255, 255, 255, 0.5) !important; color: var(--mdc-theme-text-icon-on-dark, rgba(255, 255, 255, 0.5)) !important;}'
                            + '.mdc-theme--primary-bg { background-color: #6200ee !important; background-color: var(--mdc-theme-primary, #6200ee) !important;}'
                            + '.mdc-theme--secondary-bg { background-color: #018786 !important; background-color: var(--mdc-theme-secondary, #018786) !important;}';
					styleElement.innerHTML = css;
				}
				buildfire.appearance.getAppTheme(function(err, appTheme) {
					applyMDTheme(err, appTheme);
					(document.head || document.body).appendChild(styleElement);
				});
				buildfire.appearance.onUpdate(function(appTheme){
					buildfire.getContext((err, context) => {
						if (err) console.error(err);
						if (context) {
							buildfire.appearance._setFontUrl(context, appTheme);
							applyMDTheme(null, appTheme);
						} else {
							applyMDTheme(null, appTheme);
						}
					});
				});
			}

			if (base[base.length - 1] != '/'){
				base += '/';
			}

			//Remove Scrollbars css
			{
				var _sharedStyle = document.createElement('style');
				_sharedStyle.type = 'text/css';
				_sharedStyle.innerHTML = '@media(max-width: 1200px){' +
                    '/* Remove Scrollbars */' +
                    '[buildfire="widget"] ::-webkit-scrollbar,' +
                    '[buildfire="widget"] html::-webkit-scrollbar,' +
                    '[buildfire="widget"] body::-webkit-scrollbar,' +
                    '[buildfire="widget"] html *::-webkit-scrollbar,' +
                    '[buildfire="widget"] body *::-webkit-scrollbar{' +
                    'display: none !important;' +
                    '}' +
                    '[buildfire="widget"] html,' +
                    '[buildfire="widget"] body,' +
                    '[buildfire="widget"] html *,' +
                    '[buildfire="widget"] body *{' +
                    '-ms-overflow-style: none;' +
                    'scrollbar-width: none;' +
                    '}' +
                    '}';
				(document.head || document.body).appendChild(_sharedStyle);
			}

			for (var i = 0; i < files.length; i++)
				document.write('<link rel="stylesheet" href="' + base + files[i] + '"/>');
		}
		, disableFastClickOnLoad:false
		, attachFastClick: function(){
			var path;
			var scripts = document.getElementsByTagName('script');
			var references = [
				'buildfire.js',
				'buildfire.min.js',
				'buildfire_lightcarousel.min.js',
				'jquery_angular_buildfire_smartcrop.min.js',
			];
			for (var i = 0; i < scripts.length; i++) {
				for (var j = 0; j !== references.length; j++) {
					var ref = references[j];
					if (scripts[i].src.indexOf(ref) > 0) {
						// fastclick.js exist in root scripts, following replaces _bundles dir
						path = (scripts[i].src.replace(ref, 'fastclick.js')).replace('_bundles/', '');
						break;
					} else if (scripts[i].src.indexOf('fastclick.js') > 0){
						console.warn('fastclick already attached');
						break;
					}
				}
			}
			if (!path) {
				console.warn('fastclick.js requires a buildfire.js reference.');
			} else {
				var script = document.createElement('script');
				script.src = path;
				script.type='text/javascript';
				script.onload=function(){
					if(typeof(FastClick) == 'undefined')
						console.error('fastclick undefined');
					else
						FastClick.attach(document.body);
				};
				document.body.appendChild(script);
			}
		}
		, applyFastClick: function(element){
			if(!element)element=document.body;
			if(typeof(FastClick) == 'undefined')
				console.error('fastclick undefined');
			else
				FastClick.attach(element);
		}
		, attachAppThemeCSSFiles: function (appId, liveMode, appHost) {
			const cssUrl = `${appHost}/api/app/styles/appTheme.css?appId=${appId}&liveMode=${liveMode}&v=${buildfire.appearance.CSSBusterCounter}&isWeb=true`;
			this._attachAppCSSFiles(cssUrl, 'appThemeCSS');
		}
		, attachLocalAppThemeCSSFiles: function (appId) {
			const cssUrl = `../../../../app/scripts/offline/appTheme${appId}.css`;
			this._attachAppCSSFiles(cssUrl, 'appThemeCSS');
		}
		, attachCustomAppCSSUrl: function (appId, liveMode, appHost) {
			const cssUrl = `${appHost}/api/app/styles/customAppCSS.css?appId=${appId}&liveMode=${liveMode}&v=${buildfire.appearance.CSSBusterCounter}`;
			this._attachAppCSSFiles(cssUrl, 'customAppCSS');
		}
		, attachLocalCustomAppCSSUrl: function (appId) {
			const cssUrl = `../../../../app/scripts/offline/customAppCSS${appId}.css`;
			this._attachAppCSSFiles(cssUrl, 'customAppCSS');
		}
		,_attachAppCSSFiles:function(url, id){
			var linkElement = document.createElement('link');
			buildfire.appearance.CSSBusterCounter = 0;
			linkElement.setAttribute('rel', 'stylesheet');
			linkElement.setAttribute('type', 'text/css');
			linkElement.setAttribute('id', id);
			linkElement.setAttribute('href', url);
			document.getElementsByTagName('head')[0].appendChild(linkElement);
		}
		, _resizedTo: 0
		, autosizeContainer: function () {
			var height;
			try {
				height = Math.max(
					document.documentElement.clientHeight,
					document.body.scrollHeight,
					document.documentElement.scrollHeight,
					document.body.offsetHeight,
					document.documentElement.offsetHeight
				);
			}
			catch(e){}
			if (!height || buildfire.appearance._resizedTo == height || height < 100) return;
			var p = new Packet(null, 'appearance.autosizeContainer', {height: height});
			buildfire._sendPacket(p);
			buildfire.appearance._resizedTo = height;
		}
		, setHeaderVisibility: function (value) {
			var p = new Packet(null, 'appearance.setHeaderVisibility', value);
			buildfire._sendPacket(p);
		}
		, onUpdate: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('appearanceOnUpdate', callback, allowMultipleHandlers);
		}
		, triggerOnUpdate: function (appTheme) {
			var appThemeCSSElement = document.getElementById('appThemeCSS');
			if(appThemeCSSElement) {
				appThemeCSSElement.href = appThemeCSSElement.href.replace('&v=' + buildfire.appearance.CSSBusterCounter, '&v=' + ++buildfire.appearance.CSSBusterCounter);
			}

			var customAppCSSElement = document.getElementById('customAppCSS');
			if (customAppCSSElement) {
				customAppCSSElement.href = customAppCSSElement.href.replace('&v=' + buildfire.appearance.CSSBusterCounter, '&v=' + ++buildfire.appearance.CSSBusterCounter);
			}

			if (appTheme) {
				var bfWidgetTheme = document.getElementById('bfWidgetTheme');

				if (bfWidgetTheme) {
					buildfire.getContext((err, context) => {
						if (err) console.error(err);
						if (context) {
							buildfire.appearance._setFontUrl(context, appTheme);
							bfWidgetTheme.innerHTML = buildfire.appearance._getCommonCss(appTheme);
						} else {
							bfWidgetTheme.innerHTML = buildfire.appearance._getCommonCss(appTheme);
						}
					});
				}
				buildfire.eventManager.trigger('appearanceOnUpdate', appTheme);
				buildfire.dynamic.triggerContextChange({contextProperty: 'appTheme', data: appTheme});
			}
		}, titlebar: {
			show: function(options, callback) {
				var p = new Packet(null, 'appearance.titlebar.show');
				buildfire._sendPacket(p, callback);
			},
			hide: function(options, callback) {
				var p = new Packet(null, 'appearance.titlebar.hide');
				buildfire._sendPacket(p, callback);
			},
			isVisible: function(options, callback) {
				var p = new Packet(null, 'appearance.titlebar.isVisible');
				buildfire._sendPacket(p, callback);
			},
			setText: function(options, callback) {
				var p = new Packet(null, 'appearance.titlebar.setText', options);
				buildfire._sendPacket(p, callback);
			}
		}, navbar: {
			show: function(options, callback) {
				var p = new Packet(null, 'appearance.navbar.show');
				buildfire._sendPacket(p, callback);
			},
			hide: function(options, callback) {
				var p = new Packet(null, 'appearance.navbar.hide');
				buildfire._sendPacket(p, callback);
			}
		}, sideMenu: {
			show: function(options, callback) {
				var p = new Packet(null, 'appearance.sideMenu.show');
				buildfire._sendPacket(p, callback);
			},
			hide: function(options, callback) {
				var p = new Packet(null, 'appearance.sideMenu.hide');
				buildfire._sendPacket(p, callback);
			},
			open: function(options, callback) {
				var p = new Packet(null, 'appearance.sideMenu.open');
				buildfire._sendPacket(p, callback);
			},
			close: function(options, callback) {
				var p = new Packet(null, 'appearance.sideMenu.close');
				buildfire._sendPacket(p, callback);
			}
		}, fullScreenMode: {
			enable: function(options, callback) {
				var p = new Packet(null, 'appearance.fullScreenMode.enable');
				buildfire._sendPacket(p, callback);
			},
			disable: function(options, callback) {
				var p = new Packet(null, 'appearance.fullScreenMode.disable');
				buildfire._sendPacket(p, callback);
			},
		},
		_getCommonCss: function(appTheme) {
			var css = '';
			if ( typeof(appTheme.fontId) !== 'undefined' && appTheme.fontId !== 'Arial'
            && appTheme.fontId !== 'Sans-Serif' && appTheme.fontId !== 'Helvetica'
            && appTheme.fontId !== 'Shadows+into+Light' && appTheme.fontId !== 'Asap+condensed' && appTheme.fontUrl) {
				if (appTheme.isCustomFont) {
					css+= '@font-face { font-family: \'' + appTheme.fontId + '\'; src: url(\'' + appTheme.fontUrl + '\') format(\'' + appTheme.fontFormat + '\'); }';
				} else {
					css += '@import url(\'' + appTheme.fontUrl + '\');';
				}
			}
			let lightBodyText = appTheme.colors.bodyText;
			if (appTheme.colors.bodyText?.startsWith('#')) { // just support hex colors
				// create a new color, which is the bodyText's color with an opacity (33%)
				lightBodyText = `${appTheme.colors.bodyText}54`;
			}
			css += ':root {'
                + '--bf-theme-primary: ' + appTheme.colors.primaryTheme + ' !important;'
                + '--bf-theme-success: ' + appTheme.colors.successTheme + ' !important;'
                + '--bf-theme-warning: ' + appTheme.colors.warningTheme + ' !important;'
                + '--bf-theme-info: ' + appTheme.colors.infoTheme + ' !important;'
                + '--bf-theme-default: ' + appTheme.colors.defaultTheme + ' !important;'
                + '--bf-theme-danger: ' + appTheme.colors.dangerTheme + ' !important;'
                + '--bf-theme-background: ' + appTheme.colors.backgroundColor + ' !important;'
                + '--bf-theme-body-text: ' + appTheme.colors.bodyText + ' !important;'
				+ '--bf-theme-container-highlight: ' + lightBodyText + ' !important;'
                + '--bf-theme-footer-background: ' + appTheme.colors.footerMenuBackgroundColor + ' !important;'
                + '--bf-theme-footer-icon: ' + appTheme.colors.footerMenuIconColor + ' !important;'
                + '--bf-theme-header-text: ' + appTheme.colors.headerText + ' !important;'
                + '--bf-theme-icons: ' + appTheme.colors.icons + ' !important;'
                + '--bf-theme-title-bar: ' + appTheme.colors.titleBar + ' !important;'
                + '--bf-theme-title-bar-text-icons: ' + appTheme.colors.titleBarTextAndIcons + ' !important;'
                + '--bf-font-family:' + appTheme.fontName + ', sans-serif !important'
            +'}';
			return css;
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-capture-Analytics-for-your-plugin
	, analytics: {
		trackAction: function (actionName, metadata) {
			var p = new Packet(null, 'analytics.trackActionCommand', {
				value: actionName,
				metadata: metadata
			}); // wrap object to follow the command(obj, callback)
			buildfire._sendPacket(p);
		}
		,
		trackView: function (actionName, metadata) {
			var p = new Packet(null, 'analytics.trackViewCommand', {
				value: actionName,
				metadata: metadata
			}); // wrap object to follow the command(obj, callback)
			buildfire._sendPacket(p);
		},
		/// ref: https://github.com/BuildFire/sdk/wiki/Plugin-Custom-Events
		registerEvent: function (event, options, callback) {
			if (typeof(options) == 'function') {
				callback = options;
				options = null;
			}
			var p = new Packet(null, 'analytics.registerPluginEvent', {data: event, options: options});
			buildfire._sendPacket(p, callback);
		},
		bulkRegisterEvents: function (events, options, callback) {
			if (typeof(options) == 'function') {
				callback = options;
				options = null;
			}
			var p = new Packet(null, 'analytics.bulkRegisterPluginEvents', {events: events, options: options});
			buildfire._sendPacket(p, callback);
		},
		unregisterEvent: function (key, callback) {
			var p = new Packet(null, 'analytics.unregisterPluginEvent', {
				key: key
			});
			buildfire._sendPacket(p, callback);
		},
		bulkUnregisterEvents: function(keys, callback) {
			var p = new Packet(null, 'analytics.bulkUnregisterPluginEvents', {
				keys: keys
			});
			buildfire._sendPacket(p, callback);
		},
		///params:{eventKey:''}
		showReports: function (params, callback) {
			if (!params)
				params = {};
			var p = new Packet(null, 'analytics.showReports', params);
			buildfire._sendPacket(p, callback);
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore
	, datastore: {
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoreget-tag-optional-id-optional-callback
		get: function (tag, callback) {

			var tagType = typeof(tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof(callback) == 'undefined') {
				callback = tag;
				tag = '';
			}
			var obj = {tag: tag};
			var p = new Packet(null, 'datastore.get', obj);
			buildfire._sendPacket(p, callback);

		},
		getWithDynamicData: function (tag, callback) {

			var tagType = typeof(tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof(callback) == 'undefined') {
				callback = tag;
				tag = '';
			}
			var obj = {tag: tag, withDynamicData: true};
			var p = new Packet(null, 'datastore.get', obj);
			buildfire._sendPacket(p, callback);

		},
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoregetbyid--id--tag-optional-callback
		getById: function (id, tag, callback) {

			var idType = typeof(id);
			if (idType == 'function' && typeof(callback) == 'undefined') {
				callback = id;
				id = '';
			}

			var tagType = typeof(tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof(callback) == 'undefined') {
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
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof(callback) == 'undefined') {
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
			if (checkDuplicateType == 'undefined')
				checkDuplicate = false;
			else if (checkDuplicateType == 'function' && typeof(callback) == 'undefined') {
				callback = checkDuplicate;
				checkDuplicate = false;
			}
			var tagType = typeof(tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof(callback) == 'undefined') {
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

				callback({'code': 'error', 'message': 'the data should be an array'}, null);
				return;
			}

			var tagType = typeof(tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof(callback) == 'undefined') {
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
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof(callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'datastore.update', {tag: tag, id: id, obj: obj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.datastore.triggerOnUpdate(result);
				if (callback)callback(err, result);
			});
		}
		, searchAndUpdate: function (search, obj, tag, callback) {
			var tagType = typeof(tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof(callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'datastore.searchAndUpdate', {tag: tag, search: search, obj: obj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.datastore.triggerOnUpdate(result);
				if (callback)callback(err, result);
			});
		}
		/// ref https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoredeleteidobj-tag-optional-callback
		, delete: function (id, tag, callback) {
			var tagType = typeof(tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof(callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'datastore.delete', {tag: tag, id: id});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.datastore.triggerOnUpdate(result);
				if (callback)callback(err, result);
			});
		}
		, bulkDelete: function ( ids, tag, callback) {

			let tagType = typeof(tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof(callback) == 'undefined') {
				callback = tag;
				tag = '';
			}
			if (ids.constructor !== Array) {
				callback({'code': 'error', 'message': 'the data should be an array'}, null);
				return;
			}
			if (ids.length == 0) {
				callback({'code': 'error', 'message': 'the data should not be empty'}, null);
				return;
			}

			let p = new Packet(null, 'datastore.bulkDelete', {tag: tag, ids: ids});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.datastore.triggerOnUpdate(result);
				if (callback)callback(err, result);
			});
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoresearchoptions-tag-optional-callback
		, search: function (options, tag, callback) {

			var tagType = typeof(tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof(callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			//auto correct empty string filter
			if (typeof(options) == 'undefined') options = {filter: {}};
			if (!options.filter) options.filter = {};

			var p = new Packet(null, 'datastore.search', {tag: tag, obj: options});
			buildfire._sendPacket(p, function (err, result) {
				callback(err, result);
			});
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoreonupdatecallback
		, onUpdate: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('datastoreOnUpdate', callback, allowMultipleHandlers);
		}
		, triggerOnUpdate: function (obj) {
			buildfire.eventManager.trigger('datastoreOnUpdate', obj);
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoreonrefreshcallback
		, onRefresh: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('datastoreOnRefresh', callback, allowMultipleHandlers);
		}
		, triggerOnRefresh: function (obj) {
			buildfire.eventManager.trigger('datastoreOnRefresh', obj);
		}
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Datastore#buildfiredatastoredisablerefresh
		, disableRefresh: function () {
			var p = new Packet(null, 'datastore.disableRefresh');
			buildfire._sendPacket(p);
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/User-Data:-Save-user-data-from-the-widget
	,userData: {
		get: function (tag, callback) {

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}
			var obj = { tag: tag };
			var p = new Packet(null, 'userData.get', obj);
			buildfire._sendPacket(p, callback);

		},
		/// ref:
		getById: function (id, tag, callback) {

			var idType = typeof (id);
			if (idType == 'function' && typeof (callback) == 'undefined') {
				callback = id;
				id = '';
			}

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}
			var obj = { tag: tag, id: id };
			var p = new Packet(null, 'userData.get', obj);
			buildfire._sendPacket(p, callback);

		}
		/// ref:
		, save: function (obj, tag,userToken, callback) {

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}
			var userTokenType = typeof (userToken);
			if (userTokenType == 'undefined')
				userToken = '';
			else if (userTokenType == 'function' && typeof (callback) == 'undefined') {
				callback = userToken;
				userToken = '';
			}

			var p = new Packet(null, 'userData.save', { tag: tag,userToken: userToken, obj: obj });
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.userData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});
		}
		/// ref:
		, insert: function (obj, tag, userToken, checkDuplicate, callback) {

			var userTokenType = typeof (userToken);
			if (userTokenType == 'undefined')
				userToken = '';
			else if (userTokenType == 'function' && typeof (callback) == 'undefined') {
				callback = userToken;
				userToken = '';
			}
			var checkDuplicateType = typeof (checkDuplicate);
			if (checkDuplicateType == 'undefined')
				checkDuplicate = false;
			else if (checkDuplicateType == 'function' && typeof (callback) == 'undefined') {
				callback = checkDuplicate;
				checkDuplicate = false;
			}
			var userTokenType = typeof (userToken);
			if (userTokenType == 'undefined')
				userToken = '';
			else if (userTokenType == 'function' && typeof (callback) == 'undefined') {
				callback = userToken;
				userToken = '';
			}

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'userData.insert', { tag: tag, userToken: userToken, obj: obj, checkDuplicate: checkDuplicate });
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.userData.triggerOnUpdate(result);
				callback(err, result);
			});

			var hasIndex = false;

			if (obj && obj._buildfire && obj._buildfire.index && Object.keys(obj._buildfire.index)) {
				var filterKeys = Object.keys(obj._buildfire.index);
				var validKeys = ['string1', 'date1', 'number1', 'array1', 'text'];

				for (var i = 0; i < filterKeys.length; i++) {
					var key = filterKeys[i];
					if ((validKeys.indexOf(key) > -1) && obj._buildfire.index[key]) {
						hasIndex = true;
						break;
					}
				}
			}

			if (!hasIndex) {
				console.warn('WARNING: no index on inserted data! Please see https://github.com/BuildFire/sdk/wiki/User-Data-and-Public-Data-Indexed-Fields');
			}
		}
		/// ref:
		, bulkInsert: function (arrayObj, tag, userToken, callback) {

			if (arrayObj.constructor !== Array) {

				callback({ 'code': 'error', 'message': 'the data should be an array' }, null);
				return;
			}
			var userTokenType = typeof (userToken);
			if (userTokenType == 'undefined')
				userToken = '';
			else if (userTokenType == 'function' && typeof (callback) == 'undefined') {
				callback = userToken;
				userToken = '';
			}
			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'userData.bulkInsert', { tag: tag, userToken: userToken, obj: arrayObj });
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.userData.triggerOnUpdate(result);
				callback(err, result);
			});
		}
		///
		, update: function (id, obj, tag, userToken, callback) {
			var userTokenType = typeof (userToken);
			if (userTokenType == 'undefined')
				userToken = '';
			else if (userTokenType == 'function' && typeof (callback) == 'undefined') {
				callback = userToken;
				userToken = '';
			}

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'userData.update', { tag: tag, userToken: userToken, id: id, obj: obj });
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.userData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});
		}
		, searchAndUpdate: function (search, obj, tag, userToken, callback) {
			var userTokenType = typeof (userToken);
			if (userTokenType == 'undefined')
				userToken = '';
			else if (userTokenType == 'function' && typeof (callback) == 'undefined') {
				callback = userToken;
				userToken = '';
			}

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'userData.searchAndUpdate', { tag: tag, userToken: userToken, search: search, obj: obj });
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.userData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});

			if (!search.$text || !search.$text.$search) {
				var hasIndex = false;
				var filterKeys = Object.keys(search);

				for (var i = 0; i < filterKeys.length; i++) {
					var key = filterKeys[i];
					if ((key.indexOf('_buildfire.index') > -1) && search[key]) {
						hasIndex = true;
						break;
					}
				}

				if (!hasIndex) {
					console.warn('WARNING: no index on search filter! Please see https://github.com/BuildFire/sdk/wiki/User-Data-and-Public-Data-Indexed-Fields. Filter: ' + JSON.stringify(search));
				}
			}
		}
		/// ref
		, delete: function (id, tag, userToken, callback) {

			var userTokenType = typeof (userToken);
			if (userTokenType == 'undefined')
				userToken = '';
			else if (userTokenType == 'function' && typeof (callback) == 'undefined') {
				callback = userToken;
				userToken = '';
			}
			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'userData.delete', { tag: tag, userToken: userToken, id: id });
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.userData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});
		}
		, bulkDelete: function (ids, tag, userToken, callback) {

			let userTokenType = typeof (userToken);
			if (userTokenType == 'undefined')
				userToken = '';
			else if (userTokenType == 'function' && typeof (callback) == 'undefined') {
				callback = userToken;
				userToken = '';
			}
			let tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}
			if (ids.constructor !== Array) {
				callback({'code': 'error', 'message': 'the data should be an array'}, null);
				return;
			}
			if (ids.length == 0) {
				callback({'code': 'error', 'message': 'the data should not be empty'}, null);
				return;
			}

			let p = new Packet(null, 'userData.bulkDelete', { tag: tag, userToken: userToken, ids: ids});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.userData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});
		}
		///
		, search: function (options, tag, callback) {

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			//auto correct empty string filter
			if (typeof (options) == 'undefined') options = { filter: {} };
			if (!options.filter) options.filter = {};

			var p = new Packet(null, 'userData.search', { tag: tag, obj: options });
			buildfire._sendPacket(p, function (err, result) {
				callback(err, result);
			});

			if (!options.filter.$text || !options.filter.$text.$search) {
				var hasIndex = false;
				var filterKeys = Object.keys(options.filter);

				for (var i = 0; i < filterKeys.length; i++) {
					var key = filterKeys[i];
					if ((key.indexOf('_buildfire.index') > -1) && options.filter[key]) {
						hasIndex = true;
						break;
					}
				}

				if (!hasIndex) {
					console.warn('WARNING: no index on search filter! Please see https://github.com/BuildFire/sdk/wiki/User-Data-and-Public-Data-Indexed-Fields. Filter: ' + JSON.stringify(options.filter));
				}
			}
		}
		, aggregate: function (params, tag, callback) {
			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			if (!params || typeof params !== 'object') {
				params = {};
			}

			function validate() {

				function _checkIfMatchHasIndexes(matchStage) {

					if (typeof matchStage !== 'object' || Object.keys(matchStage).length === 0) {
						return false;
					}

					var matchKeys = Object.keys(matchStage);
					for (var i = 0; i < matchKeys.length; i++) {
						var key = matchKeys[i];
						if ((key.indexOf('_buildfire.index') > -1)) {
							return true;
						}
					}
					return false;
				}

				function _findFirstGeoNearStage(stages) {

					if (stages && stages.length === 0) {
						return null;
					}

					for (var i = 0; i < stages.length; i++) {
						var stage = stages[i];

						if (typeof stage !== 'object') {
							continue;
						}

						if (stage.$geoNear && typeof stage.$geoNear === 'object') {
							return { $geoNear: stage.$geoNear, index: i };
						}
					}

					return null;
				}

				function _checkIfGeoNearStagesHasRightKey(stages) {
					// key : Specify the geospatial indexed field to use when calculating the distance.

					for (var i = 0; i < stages.length; i++) {
						var stage = stages[i];

						if (typeof stage !== 'object') {
							continue;
						}

						if (stage.$geoNear && (typeof stage.$geoNear !== 'object' || !stage.$geoNear.key ||  !stage.$geoNear.key.endsWith('_buildfire.geo'))) {
							return false;
						}
					}

					return true;
				}

				if (!params.pipelineStages) {
					callback('pipelineStages is required property for aggregation', null);
					return false;
				}

				if (!Array.isArray(params.pipelineStages)) {
					callback('pipelineStages property should be an array of your pipeline stages', null);
					return false;
				}

				var geoStage = _findFirstGeoNearStage(params.pipelineStages);

				if (geoStage) {
					if (geoStage.index !== 0) {
						callback('$geoNear should be first stage of pipeline', null);
						return false;
					}

					if (!_checkIfGeoNearStagesHasRightKey(params.pipelineStages)) {
						callback('$geoNear stages doesn\'t have the right geospatial indexed field name for key option', null);
						return false;
					}
				} else {
					// check $match stage should first stage of pipeline
					if (typeof params.pipelineStages[0] !== 'object' || !params.pipelineStages[0].$match) {
						callback('$match stage should be first stage of pipeline', null);
						return false;
					}

					if (!_checkIfMatchHasIndexes(params.pipelineStages[0].$match)) {
						callback('$match stage should has at least one of the buildfire indexes', null);
						return false;
					}
				}

				return true;
			}

			// these validation not used  for current state, we handle that on server side
			// if (!validate()) {
			//     return;
			// }

			var p = new Packet(null, 'userData.aggregate', {tag: tag, obj: params});
			buildfire._sendPacket(p, function (err, result) {
				callback(err, result);
			});
		}
		/// ref:
		, onUpdate: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('userDataOnUpdate', callback, allowMultipleHandlers);
		}
		, triggerOnUpdate: function (obj) {
			buildfire.eventManager.trigger('userDataOnUpdate', obj);
		}
		/// ref:
		, onRefresh: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('userDataOnRefresh', callback, allowMultipleHandlers);
		}
		, triggerOnRefresh: function (obj) {
			buildfire.eventManager.trigger('userDataOnRefresh', obj);
		}
		/// ref:
		, disableRefresh: function () {
			var p = new Packet(null, 'userData.disableRefresh');
			buildfire._sendPacket(p);
		}
	}
	, publicData: {
		/// ref:
		get: function (tag, callback) {

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}
			var obj = {tag: tag};
			var p = new Packet(null, 'publicData.get', obj);
			buildfire._sendPacket(p, callback);

		},
		/// ref:
		getById: function (id, tag, callback) {

			var idType = typeof (id);
			if (idType == 'function' && typeof (callback) == 'undefined') {
				callback = id;
				id = '';
			}

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}
			var obj = {tag: tag, id: id};
			var p = new Packet(null, 'publicData.get', obj);
			buildfire._sendPacket(p, callback);

		}
		/// ref:
		, save: function (obj, tag, callback) {
			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'publicData.save', {tag: tag, obj: obj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.publicData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});
		}
		/// ref:
		, insert: function (obj, tag, checkDuplicate, callback) {

			var checkDuplicateType = typeof (checkDuplicate);
			if (checkDuplicateType == 'undefined')
				checkDuplicate = false;
			else if (checkDuplicateType == 'function' && typeof (callback) == 'undefined') {
				callback = checkDuplicate;
				checkDuplicate = false;
			}

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'publicData.insert', {tag: tag, obj: obj, checkDuplicate: checkDuplicate});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.publicData.triggerOnUpdate(result);
				callback(err, result);
			});

			var hasIndex = false;

			if (obj && obj._buildfire && obj._buildfire.index && Object.keys(obj._buildfire.index)) {
				var filterKeys = Object.keys(obj._buildfire.index);
				var validKeys = ['string1', 'date1', 'number1', 'array1', 'text'];

				for (var i = 0; i < filterKeys.length; i++) {
					var key = filterKeys[i];
					if ((validKeys.indexOf(key) > -1) && obj._buildfire.index[key]) {
						hasIndex = true;
						break;
					}
				}
			}

			if (!hasIndex) {
				console.warn('WARNING: no index on inserted data! Please see https://github.com/BuildFire/sdk/wiki/User-Data-and-Public-Data-Indexed-Fields');
			}
		}
		/// ref:
		, bulkInsert: function (arrayObj, tag, callback) {

			if (arrayObj.constructor !== Array) {

				callback({'code': 'error', 'message': 'the data should be an array'}, null);
				return;
			}

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'publicData.bulkInsert', {tag: tag, obj: arrayObj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.publicData.triggerOnUpdate(result);
				callback(err, result);
			});
		}
		///
		, update: function (id, obj, tag, callback) {

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'publicData.update', {tag: tag, id: id, obj: obj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.publicData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});
		}
		, searchAndUpdate: function (search, obj, tag, callback) {

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'publicData.searchAndUpdate', {tag: tag, search: search, obj: obj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.publicData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});

			if (!search.$text || !search.$text.$search) {
				var hasIndex = false;
				var filterKeys = Object.keys(search);

				for (var i = 0; i < filterKeys.length; i++) {
					var key = filterKeys[i];
					if ((key.indexOf('_buildfire.index') > -1) && search[key]) {
						hasIndex = true;
						break;
					}
				}

				if (!hasIndex) {
					console.warn('WARNING: no index on search filter! Please see https://github.com/BuildFire/sdk/wiki/User-Data-and-Public-Data-Indexed-Fields. Filter: ' + JSON.stringify(search));
				}
			}
		}
		/// ref
		, delete: function (id, tag, callback) {

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			var p = new Packet(null, 'publicData.delete', {tag: tag, id: id});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.publicData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});
		}
		, bulkDelete: function (ids, tag, callback) {

			let tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}
			if (ids.constructor !== Array) {
				callback({'code': 'error', 'message': 'the data should be an array'}, null);
				return;
			}
			if (ids.length == 0) {
				callback({'code': 'error', 'message': 'the data should not be empty'}, null);
				return;
			}

			let p = new Packet(null, 'publicData.bulkDelete', {tag: tag, ids: ids});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.publicData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});
		}
		///
		, search: function (options, tag, callback) {

			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			//auto correct empty string filter
			if (typeof (options) == 'undefined') options = {filter: {}};
			if (!options.filter) options.filter = {};



			var p = new Packet(null, 'publicData.search', {tag: tag, obj: options});
			buildfire._sendPacket(p, function (err, result) {
				callback(err, result);
			});

			if (!options.filter.$text || !options.filter.$text.$search) {
				var hasIndex = false;
				var filterKeys = Object.keys(options.filter);

				for (var i = 0; i < filterKeys.length; i++) {
					var key = filterKeys[i];
					if ((key.indexOf('_buildfire.index') > -1) && options.filter[key]) {
						// if (key.includes('_buildfire.index') && options.filter[key]) {
						hasIndex = true;
						break;
					}
				}

				if (!hasIndex) {
					console.warn('WARNING: no index on search filter! Please see https://github.com/BuildFire/sdk/wiki/User-Data-and-Public-Data-Indexed-Fields. Filter: ' + JSON.stringify(options.filter));
				}
			}
		}
		, aggregate: function (params, tag, callback) {
			var tagType = typeof (tag);
			if (tagType == 'undefined')
				tag = '';
			else if (tagType == 'function' && typeof (callback) == 'undefined') {
				callback = tag;
				tag = '';
			}

			if (!params || typeof params !== 'object') {
				params = {};
			}

			function validate() {

				function _checkIfMatchHasIndexes(matchStage) {

					if (typeof matchStage !== 'object' || Object.keys(matchStage).length === 0) {
						return false;
					}

					var matchKeys = Object.keys(matchStage);
					for (var i = 0; i < matchKeys.length; i++) {
						var key = matchKeys[i];
						if ((key.indexOf('_buildfire.index') > -1)) {
							return true;
						}
					}
					return false;
				}

				function _findFirstGeoNearStage(stages) {

					if (stages && stages.length === 0) {
						return null;
					}

					for (var i = 0; i < stages.length; i++) {
						var stage = stages[i];

						if (typeof stage !== 'object') {
							continue;
						}

						if (stage.$geoNear && typeof stage.$geoNear === 'object') {
							return { $geoNear: stage.$geoNear, index: i };
						}
					}

					return null;
				}

				function _checkIfGeoNearStagesHasRightKey(stages) {
					// key : Specify the geospatial indexed field to use when calculating the distance.

					for (var i = 0; i < stages.length; i++) {
						var stage = stages[i];

						if (typeof stage !== 'object') {
							continue;
						}

						if (stage.$geoNear && (typeof stage.$geoNear !== 'object' || !stage.$geoNear.key ||  !stage.$geoNear.key.endsWith('_buildfire.geo'))) {
							return false;
						}
					}

					return true;
				}

				if (!params.pipelineStages) {
					callback('pipelineStages is required property for aggregation', null);
					return false;
				}

				if (!Array.isArray(params.pipelineStages)) {
					callback('pipelineStages property should be an array of your pipeline stages', null);
					return false;
				}

				var geoStage = _findFirstGeoNearStage(params.pipelineStages);

				if (geoStage) {
					if (geoStage.index !== 0) {
						callback('$geoNear should be first stage of pipeline', null);
						return false;
					}

					if (!_checkIfGeoNearStagesHasRightKey(params.pipelineStages)) {
						callback('$geoNear stages doesn\'t have the right geospatial indexed field name for key option', null);
						return false;
					}
				} else {
					// check $match stage should first stage of pipeline
					if (typeof params.pipelineStages[0] !== 'object' || !params.pipelineStages[0].$match) {
						callback('$match stage should be first stage of pipeline', null);
						return false;
					}

					if (!_checkIfMatchHasIndexes(params.pipelineStages[0].$match)) {
						callback('$match stage should has at least one of the buildfire indexes', null);
						return false;
					}
				}

				return true;
			}

			// these validation not used  for current state, we handle that on server side
			// if (!validate()) {
			//     return;
			// }


			var p = new Packet(null, 'publicData.aggregate', {tag: tag, obj: params});
			buildfire._sendPacket(p, function (err, result) {
				callback(err, result);
			});
		}
		/// ref:
		, onUpdate: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('publicDataOnUpdate', callback, allowMultipleHandlers);
		}
		, triggerOnUpdate: function (obj) {
			buildfire.eventManager.trigger('publicDataOnUpdate', obj);
		}
		/// ref:
		, onRefresh: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('publicDataOnRefresh', callback, allowMultipleHandlers);
		}
		, triggerOnRefresh: function (obj) {
			buildfire.eventManager.trigger('publicDataOnRefresh', obj);
		}
		/// ref:
		, disableRefresh: function () {
			var p = new Packet(null, 'publicData.disableRefresh');
			buildfire._sendPacket(p);
		}
	}
	, appData: {
		get: function (tag, callback) {
			if (!this._isTagValid(tag, callback)) return;

			var obj = {tag: tag};
			var p = new Packet(null, 'appData.get', obj);
			buildfire._sendPacket(p, callback);
		},
		getById: function (id, tag, callback) {

			var idType = typeof (id);
			if (idType == 'function' && typeof (callback) == 'undefined') {
				callback = id;
				id = '';
			}

			if (!this._isTagValid(tag, callback)) return;

			var obj = {tag: tag, id: id};
			var p = new Packet(null, 'appData.get', obj);
			buildfire._sendPacket(p, callback);
		}
		, save: function (obj, tag, callback) {
			if (!this._isTagValid(tag, callback)) return;

			var p = new Packet(null, 'appData.save', {tag: tag, obj: obj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.appData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});
		}
		, insert: function (obj, tag, checkDuplicate, callback) {

			var checkDuplicateType = typeof (checkDuplicate);
			if (checkDuplicateType == 'undefined')
				checkDuplicate = false;
			else if (checkDuplicateType == 'function' && typeof (callback) == 'undefined') {
				callback = checkDuplicate;
				checkDuplicate = false;
			}

			if (!this._isTagValid(tag, callback)) return;

			var p = new Packet(null, 'appData.insert', {tag: tag, obj: obj, checkDuplicate: checkDuplicate});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.appData.triggerOnUpdate(result);
				callback(err, result);
			});

			var hasIndex = false;

			if (obj && obj._buildfire && obj._buildfire.index && Object.keys(obj._buildfire.index)) {
				var filterKeys = Object.keys(obj._buildfire.index);
				var validKeys = ['string1', 'date1', 'number1', 'array1', 'text'];

				for (var i = 0; i < filterKeys.length; i++) {
					var key = filterKeys[i];
					if ((validKeys.indexOf(key) > -1) && obj._buildfire.index[key]) {
						hasIndex = true;
						break;
					}
				}
			}

			if (!hasIndex) {
				console.warn('WARNING: no index on inserted data! Please see https://github.com/BuildFire/sdk/wiki/User-Data-and-Public-Data-Indexed-Fields');
			}
		}
		, bulkInsert: function (arrayObj, tag, callback) {
			if (arrayObj.constructor !== Array) {
				callback({'code': 'error', 'message': 'the data should be an array'}, null);
				return;
			}

			if (!this._isTagValid(tag, callback)) return;

			var p = new Packet(null, 'appData.bulkInsert', {tag: tag, obj: arrayObj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.appData.triggerOnUpdate(result);
				callback(err, result);
			});
		}
		, update: function (id, obj, tag, callback) {
			if (!this._isTagValid(tag, callback)) return;

			var p = new Packet(null, 'appData.update', {tag: tag, id: id, obj: obj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.appData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});
		}
		, searchAndUpdate: function (search, obj, tag, callback) {
			if (!this._isTagValid(tag, callback)) return;

			var p = new Packet(null, 'appData.searchAndUpdate', {tag: tag, search: search, obj: obj});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.appData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});

			if (!search.$text || !search.$text.$search) {
				var hasIndex = false;
				var filterKeys = Object.keys(search);

				for (var i = 0; i < filterKeys.length; i++) {
					var key = filterKeys[i];
					if ((key.indexOf('_buildfire.index') > -1) && search[key]) {
						hasIndex = true;
						break;
					}
				}

				if (!hasIndex) {
					console.warn('WARNING: no index on search filter! Please see https://github.com/BuildFire/sdk/wiki/User-Data-and-Public-Data-Indexed-Fields. Filter: ' + JSON.stringify(search));
				}
			}
		}
		, delete: function (id, tag, callback) {
			if (!this._isTagValid(tag, callback)) return;

			var p = new Packet(null, 'appData.delete', {tag: tag, id: id});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.appData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});
		}
		, bulkDelete: function (ids, tag, callback) {
			if (!this._isTagValid(tag, callback)) return;
			if (ids.constructor !== Array) {
				callback({'code': 'error', 'message': 'the data should be an array'}, null);
				return;
			}
			if (ids.length == 0) {
				callback({'code': 'error', 'message': 'the data should not be empty'}, null);
				return;
			}

			let p = new Packet(null, 'appData.bulkDelete', {tag: tag, ids: ids});
			buildfire._sendPacket(p, function (err, result) {
				if (result)buildfire.appData.triggerOnUpdate(result);
				if (callback) callback(err, result);
			});
		}
		, search: function (options, tag, callback) {
			if (!this._isTagValid(tag, callback)) return;

			//auto correct empty string filter
			if (typeof (options) == 'undefined') options = {filter: {}};
			if (!options.filter) options.filter = {};

			if (!options.filter.$text || !options.filter.$text.$search) {
				var hasIndex = false;
				var filterKeys = Object.keys(options.filter);

				for (var i = 0; i < filterKeys.length; i++) {
					var key = filterKeys[i];
					if ((key.indexOf('_buildfire.index') > -1) && options.filter[key]) {
						hasIndex = true;
						break;
					}
				}

				if (!hasIndex) {
					console.warn('WARNING: no index on search filter! Please see https://github.com/BuildFire/sdk/wiki/User-Data-and-Public-Data-Indexed-Fields. Filter: ' + JSON.stringify(options.filter));
				}
			}

			var p = new Packet(null, 'appData.search', {tag: tag, obj: options});
			buildfire._sendPacket(p, function (err, result) {
				callback(err, result);
			});
		}
		, aggregate: function (params, tag, callback) {
			if (!this._isTagValid(tag, callback)) return;

			if (!params || typeof params !== 'object') {
				params = {};
			}

			function validate() {

				function _checkIfMatchHasIndexes(matchStage) {

					if (typeof matchStage !== 'object' || Object.keys(matchStage).length === 0) {
						return false;
					}

					var matchKeys = Object.keys(matchStage);
					for (var i = 0; i < matchKeys.length; i++) {
						var key = matchKeys[i];
						if ((key.indexOf('_buildfire.index') > -1)) {
							return true;
						}
					}
					return false;
				}

				function _findFirstGeoNearStage(stages) {

					if (stages && stages.length === 0) {
						return null;
					}

					for (var i = 0; i < stages.length; i++) {
						var stage = stages[i];

						if (typeof stage !== 'object') {
							continue;
						}

						if (stage.$geoNear && typeof stage.$geoNear === 'object') {
							return { $geoNear: stage.$geoNear, index: i };
						}
					}

					return null;
				}

				function _checkIfGeoNearStagesHasRightKey(stages) {
					// key : Specify the geospatial indexed field to use when calculating the distance.

					for (var i = 0; i < stages.length; i++) {
						var stage = stages[i];

						if (typeof stage !== 'object') {
							continue;
						}

						if (stage.$geoNear && (typeof stage.$geoNear !== 'object' || !stage.$geoNear.key ||  !stage.$geoNear.key.endsWith('_buildfire.geo'))) {
							return false;
						}
					}

					return true;
				}

				if (!params.pipelineStages) {
					callback('pipelineStages is required property for aggregation', null);
					return false;
				}

				if (!Array.isArray(params.pipelineStages)) {
					callback('pipelineStages property should be an array of your pipeline stages', null);
					return false;
				}

				var geoStage = _findFirstGeoNearStage(params.pipelineStages);

				if (geoStage) {
					if (geoStage.index !== 0) {
						callback('$geoNear should be first stage of pipeline', null);
						return false;
					}

					if (!_checkIfGeoNearStagesHasRightKey(params.pipelineStages)) {
						callback('$geoNear stages doesn\'t have the right geospatial indexed field name for key option', null);
						return false;
					}
				} else {
					// check $match stage should first stage of pipeline
					if (typeof params.pipelineStages[0] !== 'object' || !params.pipelineStages[0].$match) {
						callback('$match stage should be first stage of pipeline', null);
						return false;
					}

					if (!_checkIfMatchHasIndexes(params.pipelineStages[0].$match)) {
						callback('$match stage should has at least one of the buildfire indexes', null);
						return false;
					}
				}

				return true;
			}

			// these validation not used  for current state, we handle that on server side
			/* if (!validate()){
                return;
            } */


			var p = new Packet(null, 'appData.aggregate', {tag: tag, obj: params});
			buildfire._sendPacket(p, function (err, result) {
				callback(err, result);
			});
		}
		, onUpdate: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('appDataOnUpdate', callback, allowMultipleHandlers);
		}
		, triggerOnUpdate: function (obj) {
			buildfire.eventManager.trigger('appDataOnUpdate', obj);
		}
		, onRefresh: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('appDataOnRefresh', callback, allowMultipleHandlers);
		}
		, triggerOnRefresh: function (obj) {
			buildfire.eventManager.trigger('appDataOnRefresh', obj);
		}
		, disableRefresh: function () {
			var p = new Packet(null, 'appData.disableRefresh');
			buildfire._sendPacket(p);
		}
		, _isTagValid: function (tag, callback) {
			var isTagValid = false;

			if (typeof tag === 'string' && tag) {
				isTagValid = true;
			}

			if (isTagValid) return isTagValid;

			if (typeof tag === 'function') {
				callback = tag;
			}

			if (typeof callback !== 'function') {
				callback = console.warn;
			}

			callback({ 'code': 'error', 'message': 'tag is required for appData, and must be a string' }, null);

			return isTagValid;
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-ImageLib
	, imageLib: {
		get ENUMS() {
			return {
				SIZES: {
					xxs: 32,
					xs: 64,
					s: 128,
					m: 200,
					l: 304,
					xl: 416,
					xxl: 600,
					'720': 720,
					'1080': 1080,
					'1440': 1440,
					'1920': 1920,
					'2560': 2560,
					get full_width() {
						return this.findNearest(1);
					},
					get half_width() {
						return this.findNearest(2);
					},
					get third_width() {
						return this.findNearest(3);
					},
					get fourth_width() {
						return this.findNearest(4);
					},
					get quarter_width() {
						return this.findNearest(4);
					},
					get fifth_width() {
						return this.findNearest(5);
					},
					get sixth_width() {
						return this.findNearest(6);
					},
					findNearest: function (ratio) {
						var match = null;
						const sizes = this.VALID_SIZES.filter(size => size.indexOf('_') == -1);

						for (size of sizes) {
							if ((window.innerWidth / ratio) < this[size]) {
								match = size;
								break;
							}
						}
						return match ? this[match] : window.innerWidth;
					},
					VALID_SIZES: [
						'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', //standard
						'720', '1080', '1440', '1920', '2560', //desktop
						'full_width', 'half_width', 'third_width', 'quarter_width', 'fifth_width', 'sixth_width' // responsive
					]
				},
				ASPECT_RATIOS: {
					'1:1': 1,
					'4:3': 0.75,
					'16:9': 0.5625,
					'9:16': 1.77777778,
					'11:5': 0.45454545,
					'4:1': 0.25,
					'2.39:1': 0.41841004,
					VALID_RATIOS: ['1:1', '4:3', '16:9', '9:16', '11:5', '4:1', '2.39:1']
				}
			};
		},
		/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-ImageLib#buildfireimagelibshowdialogoptions-callback
		showDialog: function (options, callback) {
			var p = new Packet(null, 'imageLib.showDialog', options);
			buildfire._sendPacket(p, callback);
		}
		,isProdImageServer: function(url){
			return ((url.indexOf('http://imageserver.prod.s3.amazonaws.com') == 0
                || url.indexOf('https://imageserver.prod.s3.amazonaws.com') == 0
                || url.indexOf('https://s3-us-west-2.amazonaws.com/imageserver.prod') == 0
			));
		}
		//options:{
		// width: integer or 'full'
		// height: integer or 'full'
		// disablePixelRation: bool
		// }
		, resizeImage: function (url, options, element, callback) {
			if (!url) return null;
			const forceImgix = buildfire.getContext()?.forceImgix;

			const primaryHandler = forceImgix ? buildfire.imageLib._imgix : buildfire.imageLib._cloudImg;
			const fallbackHandler = forceImgix ? buildfire.imageLib._cloudImg : buildfire.imageLib._imgix;

			let imageCdnHandler = primaryHandler;

			if (primaryHandler.isSupportedUrl(url)) {
				imageCdnHandler = primaryHandler;
			} else if (fallbackHandler.isSupportedUrl(url)) {
				console.warn('Primary handler does not support URL for resizeImage. Using fallback handler.');
				imageCdnHandler = fallbackHandler;
			} else {
				console.warn('URL is not supported by resizeImage. Returning original URL: ' + url);
				return url;
			}

			if (!options)
				options = {width: window.innerWidth};
			else if (typeof(options) != 'object')
				throw ('options not an object');

			if(!options.disablePixelRation && options.disablePixelRatio) {
				options.disablePixelRation = options.disablePixelRatio;
			}
			if(!options.disablePixelRatio && options.disablePixelRation) {
				options.disablePixelRatio = options.disablePixelRation;
			}

			var ratio = options.disablePixelRation?1:window.devicePixelRatio;

			// Don't pass any value under 1
			if(ratio < 1){
				var ratio = 1;
			}

			if (options.width == 'full') options.width = window.innerWidth;
			if (options.height == 'full') options.height = window.innerHeight;

			if (options.size && options.aspect) {
				if (this.ENUMS.SIZES.VALID_SIZES.indexOf(options.size) < 0) {
					var sizes = this.ENUMS.SIZES.VALID_SIZES.join(', ');
					console.warn('Invalid size. Available options are ' + sizes + '. Returning original url');
					return url;
				}
				if (this.ENUMS.ASPECT_RATIOS.VALID_RATIOS.indexOf(options.aspect) < 0) {
					var ratios = this.ENUMS.ASPECT_RATIOS.VALID_RATIOS.join(', ');
					console.warn('Invalid aspect ratio. Available options are ' + ratios + '. Returning original url');
					return url;
				}
				//math.round
				options.width = this.ENUMS.SIZES[options.size];
				options.height = options.width * this.ENUMS.ASPECT_RATIOS[options.aspect];
			}
			let width;
			let height;
			let blur;
			// check for missing size or aspect
			if (options.width && !options.height) {
				width = Math.floor(options.width * ratio);
			}
			else if (!options.width && options.height) {
				height = Math.floor(options.height * ratio);
			}
			else if (options.width && options.height) {
				width = Math.floor(options.width * ratio);
				height = Math.floor(options.height * ratio);
			}
			if (options.blur) {
				blur = options.blur;
			}

			let result = imageCdnHandler.constructUrl({width, height, url, blur, method: 'resize'});

			this._handleElement(element, result, callback);

			return result;
		}

		, cropImage: function (url, options, element, callback) {
			if (!url) return null;
			const forceImgix = buildfire.getContext()?.forceImgix;
			const primaryHandler = forceImgix ? buildfire.imageLib._imgix : buildfire.imageLib._cloudImg;
			const fallbackHandler = forceImgix ? buildfire.imageLib._cloudImg : buildfire.imageLib._imgix;

			let imageCdnHandler = primaryHandler;

			if (primaryHandler.isSupportedUrl(url)) {
				imageCdnHandler = primaryHandler;
			} else if (fallbackHandler.isSupportedUrl(url)) {
				console.warn('Primary handler does not support URL for cropImage. Using fallback handler.');
				imageCdnHandler = fallbackHandler;
			} else {
				console.warn('URL is not supported by cropImage. Returning original URL: ' + url);
				return url;
			}

			if (!options) {
				options = {};
			}
			if (typeof (options) != 'object') {
				throw ('options not an object');
			}
			if(!options.disablePixelRation && options.disablePixelRatio) {
				options.disablePixelRation = options.disablePixelRatio;
			}
			if(!options.disablePixelRatio && options.disablePixelRation) {
				options.disablePixelRatio = options.disablePixelRation;
			}
			if (options.size && options.aspect) {
				if (this.ENUMS.SIZES.VALID_SIZES.indexOf(options.size) < 0) {
					var sizes = this.ENUMS.SIZES.VALID_SIZES.join(', ');
					console.warn('Invalid size. Available options are ' + sizes + '. Returning original url');
					return url;
				}
				if (this.ENUMS.ASPECT_RATIOS.VALID_RATIOS.indexOf(options.aspect) < 0) {
					var ratios = this.ENUMS.ASPECT_RATIOS.VALID_RATIOS.join(', ');
					console.warn('Invalid aspect ratio. Available options are ' + ratios + '. Returning original url');
					return url;
				}

				options.width = this.ENUMS.SIZES[options.size];
				options.height = options.width * this.ENUMS.ASPECT_RATIOS[options.aspect];
			}
			if (!options.width && !options.height) {
				options = { width: 'full', height: 'full' };
			}
			if (options.width == 'full') {
				options.width = window.innerWidth;
			}
			if (options.height == 'full') {
				options.height = window.innerHeight;
			}
			if (!options.width || !options.height) {
				console.warn('cropImage does not have width or height please fix. returning original url');
				return url;
			}

			var ratio = window.devicePixelRatio;
			if (options && options.disablePixelRatio) {
				ratio = options.disablePixelRatio;
			}

			let width = Math.floor(options.width * ratio);
			let height = Math.floor(options.height * ratio);
			let blur;
			if (options.blur) {
				blur = options.blur;
			}

			let result = imageCdnHandler.constructUrl({width, height, url, blur, method: 'crop'});

			this._handleElement(element, result, callback);

			return result;
		},
		_handleElement: function (element, src, callback) {
			if (!element || !src) return;

			var path = this._getLocalPath(src);

			if (element.tagName === 'IMG') {
				element.style.setProperty('opacity', '0', 'important');
				element.src = path;

				element.onload = function () {
					element.style.removeProperty('opacity');
					if (callback) callback(path);
				};

				element.onerror = function () {
					element.src = src;
					var p = new Packet(null, 'imageCache.download', src);
					buildfire._sendPacket(p, function () {
						if (callback) callback(path);
					});
				};
			} else {
				this._handleBgImage(element, path, src, callback);
			}
		},
		_handleBgImage: function (element, path, src, callback) {
			applyStyle(element, path);

			var img = new Image();
			img.src = path;

			img.onload = function () {
				if (callback) callback(path);
			};

			img.onerror = function () {
				applyStyle(element, src);
				var p = new Packet(null, 'imageCache.download', src);
				buildfire._sendPacket(p, function (error, localPath) {
					if (error) {
						if (callback) callback(src);
					}
					window.requestAnimationFrame(function () {
						if (callback) callback(localPath);
					});
				});
			};

			function applyStyle(ele, source) {
				if (!source) {
					return ele.style.removeProperty('background-image');
				}
				var backgroundCss = 'url("' + source + '")';
				ele.style.setProperty('background-image', backgroundCss, 'important');
			}
		},
		_getLocalPath: function (string) {
			if (buildfire.isWeb()) {
				return string;
			}

			string = string.replace(/(http|https):\/\/\S{0,8}.cloudimg.io\//g, '');
			var extension = string.match(/(png|jpg|jpeg|gif|jfif|svg)/g)[0] || '';
			extension = extension ? '.' + extension : '';

			var hash = 0;
			if (!string.length) return hash;

			for (var i = 0; i < string.length; i++) {
				var char = string.charCodeAt(i);
				hash = (hash << 5) - hash + char;
				hash |= 0; // Convert to 32bit integer
			}

			return buildfire.getContext().endPoints.pluginHost.replace('pluginTemplate/plugins', 'imageCache/images') + '/' + hash + extension;
		},
		getCompression: function (c) {
			var result = 'n/';
			if (c) {
				var isValid = typeof c === 'number' && c >= 1 && c <= 100;
				if (isValid) {
					var value = 'png-lossy-' + c + '.q' + c + '/';
					if (/png-lossy-\d{1,3}.q\d{1,3}\//g.test(value)) {
						result = value;
					}
				} else {
					console.warn('Disabling compression, must be an integer between 1-100');
				}
			}
			return result;
		}
		,local: {
			_parser: document.createElement('a')
			, localImageLibPath: window.location.href.split('pluginTemplate/')[0] + 'imageLib/'
			, parseFileFromUrl: function (url) {
				buildfire.imageLib.local._parser.href = url;
				var sections = buildfire.imageLib.local._parser.pathname.split('/');
				if (sections.length == 0)
					return null;
				else
					return sections[sections.length - 1];
			}
			, toLocalPath: function (url) {
				if (buildfire.isFileServer(url)) {
					var localURL = this.localImageLibPath + this.parseFileFromUrl(url); // length of root host
					//localURL = localURL.substring(localURL.indexOf('/'));
					return localURL;
				}
				else
					return null;
			}
			, resizeImage: function (url, options, callback) {

				//var ratio = options.disablePixelRation ? 1 : window.devicePixelRatio;
				if (!options)
					options = {width: window.innerWidth};
				else if (typeof(options) != 'object')
					throw ('options not an object');

				if (options.width == 'full') options.width = window.innerWidth;
				if (options.height == 'full') options.height = window.innerHeight;

				var localURL = buildfire.imageLib.local.toLocalPath(url);
				if (localURL) {
					var img = new Image();
					img.src = localURL;
					img.onload = function () {

						if (options.width && !options.height)
							options.height = (img.height * options.width) / img.width;
						else if (!options.width && options.height)
							options.width = (img.width * options.height) / img.width;

						var canvas = document.createElement('canvas');
						var ctx = canvas.getContext('2d');
						canvas.width = options.width;
						canvas.height = options.height;


						ctx.drawImage(img, 0, 0, options.width, options.height);

						callback(null, canvas.toDataURL());
					};
					img.onerror = function () {
						callback(null, buildfire.imageLib.resizeImage(url, options));
					};
				}
				else
					callback(null, buildfire.imageLib.resizeImage(url, options));


			}
			, cropImage: function (url, options, callback) {

				//If we are online, use the normal crop image.
				if (window.navigator.onLine) {
					callback(null, buildfire.imageLib.cropImage(url, options));
					return;
				}

				var ratio = options.disablePixelRatio ? 1 : window.devicePixelRatio;

				if (!options)
					options = {width: window.innerWidth};
				else if (typeof(options) != 'object')
					throw ('options not an object');

				if (options.width == 'full') options.width = window.innerWidth;
				if (options.height == 'full') options.height = window.innerHeight;

				var localURL = buildfire.imageLib.local.toLocalPath(url);
				if (localURL) {
					var img = new Image();
					img.src = localURL;
					img.onload = function () {
						var canvas = document.createElement('canvas');
						var ctx = canvas.getContext('2d');
						var dim = {
							width:0,
							height:0
						};
						var offset = {
							x:0,
							y:0
						};
						if (options.width !== options.height) {
							if (options.width > options.height) {
								dim.width = options.width;
								dim.height = (img.height * options.width) / img.width;
								offset.y = (options.height-dim.height)/2;
							} else {
								dim.width = (img.width * options.height) / img.height;
								dim.height = options.height;
								offset.x = (options.width-dim.width)/2;
							}
						} else {
							if (img.width < img.height) {
								dim.width = options.width;
								dim.height = (img.height * options.width) / img.width;
								offset.y = (options.height-dim.height)/2;
							} else {
								dim.width = (img.width * options.height) / img.height;
								dim.height = options.height;
								offset.x = (options.width-dim.width)/2;
							}
						}
						dim.width      *= ratio;
						dim.height     *= ratio;
						options.width  *= ratio;
						options.height *= ratio;

						canvas.width = options.width;
						canvas.height = options.height;
						ctx.drawImage(img, offset.x, offset.y, dim.width, dim.height);
						callback(null, canvas.toDataURL());
					};
					img.onerror = function () {
						callback(null, buildfire.imageLib.cropImage(url, options));
					};
				} else {
					callback(null, buildfire.imageLib.cropImage(url, options));
				}
			}
		},
		_imgix: {
			isSupportedUrl: function(url) {
				const isSupportedExtension =  !(/\..{3,4}(?!.)/g.test(url) && !(/.(png|jpg|jpeg|gif|jfif|svg)(?!.)/gi.test(url)));
				if (!isSupportedExtension) return false;
				return this._transformToImgix(url) != null; // return false if the url wasn't supported in imgix
			},
			constructUrl: function({width, height, url, blur, method}) {
				const baseImgUrl = this._transformToImgix(url);
				const hasQueryString = url.indexOf('?') !== -1;
				if (width || height) {
					return baseImgUrl + (hasQueryString ? '&' : '?') + (method == 'crop' ? 'fit=crop&' : '' ) + 'width=' + width + '&height=' + height + (blur ? '&blur=' + blur : '');
				}
				return url;
			},
			// consists of whitelisted AWS urls in imgix as keys and the corresponding imgix urls as values
			_imgixWhitelistedUrls: {
				'http://imageserver.prod.s3.amazonaws.com': 'https://buildfire.imgix.net',
				'http://s3-us-west-2.amazonaws.com/imageserver.prod': 'https://buildfire.imgix.net',
				'http://pluginserver.buildfire.com': 'https://bfplugins.imgix.net',
				'http://s3.amazonaws.com/Kaleo.DevBucket': 'https://bflegacy.imgix.net',
				'http://s3-us-west-2.amazonaws.com/imagelibserver': 'https://buildfire-uat.imgix.net',
				'http://s3-us-west-2.amazonaws.com/pluginserver.uat': 'https://bfplugins-uat.imgix.net',
				'http://s3-us-west-2.amazonaws.com/pluginserver.uat2': 'https://bfplugins-uat.imgix.net',
				'http://s3-us-west-2.amazonaws.com/pluginserver.uat3': 'https://bfplugins-uat.imgix.net',
				'http://s3.us-west-2.amazonaws.com/imageserver.prod': 'https://buildfire.imgix.net',
				'http://s3.us-west-2.amazonaws.com/pluginserver.prod': 'https://bfplugins.imgix.net',
				'http://s3-us-west-2.amazonaws.com/pluginserver.prod': 'https://bfplugins.imgix.net',

				//uat urls
				'http://d1q5x1plk9guz6.cloudfront.net': 'https://bfplugins-uat.imgix.net',
				'http://d3lkxgii6udy4q.cloudfront.net': 'https://bfplugins-uat.imgix.net',
				'http://d26kqod42fnsx0.cloudfront.net': 'https://bfplugins-uat.imgix.net',

				// support Unsplash images
				'http://images.unsplash.com': 'https://images.unsplash.com',
			},
			_transformToImgix: function(url) {
				url = url.replace(/^https:\/\//i, 'http://');
				for (let whitelistedUrl in this._imgixWhitelistedUrls) {
					if (url.indexOf(whitelistedUrl) === 0) {
						return this._imgixWhitelistedUrls[whitelistedUrl] + url.split(whitelistedUrl)[1];
					}
				}
				return null; // return nothing if the url wasn't supported in imgix
			}
		},
		_cloudImg: {
			isSupportedUrl: function(url) {
				return !(/\..{3,4}(?!.)/g.test(url) && !(/.(png|jpg|jpeg|gif|jfif|svg|webp)(?!.)/gi.test(url)));
			},
			constructUrl: function({width, height, url, blur, method}) {
				const baseImgUrl = 'https://alnnibitpo.cloudimg.io/v7/' + url;
				const hasQueryString = url.indexOf('?') !== -1;
				if (width || height) {
					const isDevMode = window.location.pathname.indexOf('&devMode=true') !== -1;
					return baseImgUrl + (hasQueryString ? '&' : '?') + (method == 'crop' ? 'func=crop': 'func=bound') + '&width=' + width + '&height=' + height + (blur ? '&blur=' + blur : '') + (isDevMode ? '&ci_info=1' : '');
				}
				return url;
			},
		}
	}
	, colorLib: {
		showDialog: function (data, options, onchange, callback) {
			buildfire.eventManager.clear('colorLibOnChange');
			if (typeof onchange == 'function') {
				buildfire.eventManager.add('colorLibOnChange', function (data) {
					onchange(null, data);
				}, false);
			}
			var packetData = {};
			if (options)
				packetData = JSON.parse(JSON.stringify(options));
			packetData.data = data;

			var p = new Packet(null, 'colorLib.showDialog', packetData);
			buildfire._sendPacket(p, callback);
		},
		_triggerOnChange: function (data) {
			buildfire.eventManager.trigger('colorLibOnChange', data);
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Notifications
	, notifications: {
		alert: function (options, callback) {
			console.warn('Notifications api is deprecated. Please use dialog api. https://github.com/BuildFire/sdk/wiki/How-to-use-Dialogs');
			//make it compatible with app, cp and the old versions
			if(options && options.buttonName && !options.okButton){
				options.okButton = {text: options.buttonName};
			}
			var p = new Packet(null, 'notificationsAPI.alert', options);
			buildfire._sendPacket(p, callback);
		}
		, confirm: function (options, callback) {
			console.warn('Notifications api is deprecated. Please use dialog api. https://github.com/BuildFire/sdk/wiki/How-to-use-Dialogs');
			//make it compatible with app, cp and the old versions
			if (options && options.buttonLabels) {
				if (!options.confirmButton) {
					options.confirmButton = {text: options.buttonLabels[0]};
				}
				if (!options.cancelButton) {
					options.cancelButton = {text: options.buttonLabels[1]};
				}
			}
			var p = new Packet(null, 'notificationsAPI.confirm', options);
			buildfire._sendPacket(p, callback);
		}
		, prompt: function (options, callback) {
			var p = new Packet(null, 'notificationsAPI.prompt', options);
			buildfire._sendPacket(p, callback);
		}
		, beep: function (options, callback) {
			var p = new Packet(null, 'notificationsAPI.beep', options);
			buildfire._sendPacket(p, callback);
		}
		, vibrate: function (options, callback) {
			var p = new Packet(null, 'notificationsAPI.vibrate', options);
			buildfire._sendPacket(p, callback);
		}, showDialog: function (options, callback) {
			console.warn('Notifications api is deprecated. Please use dialog api. https://github.com/BuildFire/sdk/wiki/How-to-use-Dialogs');
			var p = new Packet(null, 'notificationsAPI.showDialog', options);
			buildfire._sendPacket(p, callback);
		}
	},
	dialog: {
		alert: function (options, callback) {
			var p = new Packet(null, 'dialogAPI.alert', options);
			buildfire._sendPacket(p, function () {
				if (callback)
					return callback(null);
			});
		},
		confirm: function (options, callback) {
			if (!options.confirmButtonText) {
				options.confirmButtonText = 'Confirm';
			}
			var p = new Packet(null, 'dialogAPI.confirm', options);
			buildfire._sendPacket(p, callback);
		},
		show: function (options, callback) {
			var p = new Packet(null, 'dialogAPI.show', options);

			var actionButtonCallbacks = new Object();

			if (options.actionButtons && options.actionButtons.length) {
				options.actionButtons.forEach(function (button) {
					actionButtonCallbacks[button.text] = button.action;
					delete button.action;
				});
			}
			buildfire._sendPacket(p, function (err, result) {
				if (result && result.selectedButton) {
					var action = actionButtonCallbacks[result.selectedButton.text];
					if (action)
						action();
					result.selectedButton.action = action;
					callback && callback(err, result.selectedButton);
				} else {
					callback && callback(err);
				}
			});
		},
		toast: function (options, callback) {
			var p = new Packet(null, 'dialogAPI.toast', options);
			var actionButton = new Object();
			if (options.actionButton && options.actionButton.action) {
				actionButton = Object.assign(actionButton, options.actionButton);
				delete options.actionButton.action;
			}
			buildfire._sendPacket(p, function (err, actionClicked) {
				if (actionClicked) {
					actionButton.action && actionButton.action();
					callback && callback(err, actionButton);
				} else {
					callback && callback(err, null);
				}
			});
		}
	},
	bookmarks: {
		add: function(options, callback) {
			var p = new Packet(null, 'bookmarkAPI.add', options);
			buildfire._sendPacket(p, callback);
		},
		_getParameterByName: function(name, url) {
			if (!url) url = window.location.href;
			name = name.replace(/[\[\]]/g, '\\$&');
			var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
				results = regex.exec(url);
			if (!results) return null;
			if (!results[2]) return '';
			return decodeURIComponent(results[2].replace(/\+/g, ' '));
		},
		get: function(callback) {
			var param = buildfire.bookmarks._getParameterByName('bookmarkPayload');
			var bookmark = JSON.parse(param);
			callback(null, bookmark);
		},
		getAll: function(callback) {
			var p = new Packet(null, 'bookmarkAPI.getAllFromPlugin');
			buildfire._sendPacket(p, callback);
		},
		delete: function(options, callback) {
			var p = new Packet(null, 'bookmarkAPI.deleteFromPlugin', options);
			buildfire._sendPacket(p, callback);
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-action-Items
	/// also https://github.com/BuildFire/sdk/wiki/BuildFire-Action-Items-Component
	, actionItems: {
		showDialog: function (actionItem, options, callback) {
			var p = new Packet(null, 'actionItems.showDialog', {actionItem: actionItem, options: options});
			buildfire._sendPacket(p, callback);
		},
		execute: function (actionItem, options, callback) {
			if (typeof options === 'function') callback = options;
			var p = new Packet(null, 'actionItems.execute', actionItem);
			buildfire._sendPacket(p, callback);
		},
		list: function (actionItems, options, callback) {
			var p = new Packet(null, 'actionItems.list', {actionItems: actionItems, options: options});
			buildfire._sendPacket(p, callback);
		},
		create: function (action, iconUrl, title) {
			var actionItem = {
				action: action,
				iconUrl: iconUrl,
				title: title
			};

			return actionItem;
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Breadcrumbs
	, history: {
		push: function (label, options, callback) {
			var p = new Packet(null, 'history.push', {label: label, options: options, source: 'plugin'});
			buildfire._sendPacket(p, callback);
		},
		onPop: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('historyOnPop', callback, allowMultipleHandlers);
		},
		triggerOnPop: function (obj) {
			buildfire.eventManager.trigger('historyOnPop', obj);
		},
		pop: function (callback) {
			var p = new Packet(null, 'history.pop');
			buildfire._sendPacket(p, callback);
		},
		get: function (options, callback) {
			var p = new Packet(null, 'history.get', options);
			buildfire._sendPacket(p, callback);
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Messaging-to-sync-your-Control-to-Widget
	, messaging: {
		sendMessageToControl: function (data) {
			var p = new Packet(null, 'messaging.triggerOnNewControlMessage', data);
			buildfire._sendPacket(p);
		}
		, sendMessageToWidget: function (data) {
			var p = new Packet(null, 'messaging.triggerOnNewWidgetMessage', data);
			buildfire._sendPacket(p);
		}
		, onReceivedMessage: function (message) {
			console.info('onReceivedMessage ignored', window.location);
		}
		, sendMessageToService: function (data) {
			var p = new Packet(null, 'messaging.sendMessageToService', data);
			buildfire._sendPacket(p);
		}
		, broadcast: function (options) {
			if (!options || !options.message) {
				throw new Error('options.message is required');
			}
			if (options.source) {
				throw new Error('options.source is not allowed');
			}
			buildfire.getContext(function (err, context) {
				let source = {
					instanceId: context.instanceId,
					pluginId: context.pluginId,
					title: context.title,
					isWidgetService: buildfire.isWidgetService()
				}
				let data = { source: source, message: options.message };
				let p = new Packet(null, 'messaging.broadcast', data);
				buildfire._sendPacket(p);
			});
		}
		, onReceivedBroadcast: function (broadcast) {
			/* do not log anything as it will be too noisy */
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/Plugin-Instances
	, pluginInstance: {
		showDialog: function (options, callback) {
			var p = new Packet(null, 'pluginInstances.showDialog', {options: options});
			buildfire._sendPacket(p, callback);
		}
		, get: function (ids, callback) {
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
		, search: function (options, callback) {
			var p = new Packet(null, 'pluginInstances.search', options);
			buildfire._sendPacket(p, callback);
		}
		, showCreatePluginInstancesDialog: function (options, callback) {
			if(typeof(options) == 'function' && !callback){
				callback = options;
				options = {skipPluginInstances : true};
			}else if(options){
				options.skipPluginInstances = true;
			}
			buildfire.pluginInstance.showDialog(options,callback);
		}
		, create: function (options, callback) {
			var p = new Packet(null, 'pluginInstances.create', options);
			buildfire._sendPacket(p, callback);
		}
		, clone: function (options, callback) {
			var p = new Packet(null, 'pluginInstances.clone', options);
			buildfire._sendPacket(p, callback);
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/Deep-Links
	, deeplink: {
		getData: function (callback) {
			if (buildfire.deeplink._data) {
				return callback(buildfire.deeplink._data);
			}

			var qs = buildfire.parseQueryString();
			if (qs.dld) {
				var obj = JSON.parse(qs.dld);
				buildfire.deeplink._data = obj;
				callback(obj); /// dld: Deep Link Data
			} else {
				callback(null);
			}
		},
		template: {
			get: function (callback) {
				var p = new Packet(null, 'deepLink.getTemplate', {});
				buildfire._sendPacket(p, callback);
			}
		},
		setData: function (obj, options, callback) {
			var p = new Packet(null, 'deepLink.setData', {data : obj, options: options});
			buildfire._sendPacket(p, callback);
		}
		,
		createLink: function (obj) {
			console.log('this method is obsolete you have to call deeplink.template.get instead and it will return back the full deep link');
			var root = 'app' + buildfire._context.appId + '://plugin';
			if (!obj)
				return root;
			else
				return root + '?dld=' + JSON.stringify(obj);
		},
		generateUrl: function (params, callback) {
			var p = new Packet(null, 'shortLinks.generate', params);
			buildfire._sendPacket(p, callback);
		},
		registerDeeplink : function(options, callback) {
			if (!callback) {
				callback = function(err) {
					if(err) console.error(err);
				};
			}
			if(!options) {
				return callback('Missing options parameter', null);
			}
			if(!options.id)  {
				return callback('Missing deeplink id', null);
			}
			if(!options.name) {
				return callback('Missing deeplink name', null);
			}
			if(!options.deeplinkData) {
				return callback('Missing deeplink deeplinkData', null);
			}

			var _self = this;
			buildfire.getContext(function(err, context) {
				if(err) {
					callback(err, null);
				} else {
					if(context && context.instanceId && context.pluginId) {
						var deeplinkItem = {
							name: options.name,
							deeplinkId: options.id,
							imageUrl: options.imageUrl,
							deeplinkData: options.deeplinkData,
							pluginInstanceId: context.instanceId,
							pluginTypeId: context.pluginId,
							_buildfire: {
								index: {
									string1: context.instanceId,
									text: options.name,
									array1: [{string1: options.id}]
								}
							}
						};

						_self.getDeeplink(options.id, function(err, result) {
							if(err) return callback(err, null);
							if(result) {
								buildfire.appData.update(result.id, deeplinkItem, '$$deeplinks', callback);
							} else {
								buildfire.appData.insert(deeplinkItem, '$$deeplinks', false, callback);
							}
						});
					} else {
						callback('no context', null);
					}
				}
			});
		},
		getDeeplink : function(deeplinkId, callback) {
			if(!callback) {
				return console.error('Missing callback parameter');
			}
			buildfire.getContext(function(err, context) {
				if(err) return callback(err, null);
				if(context && context.instanceId) {
					var searchOptions = {
						filter : {
							'_buildfire.index.string1' : context.instanceId,
							'_buildfire.index.array1.string1' : deeplinkId
						}
					};
					buildfire.appData.search(searchOptions, '$$deeplinks', function(err, result) {
						if(err) return callback(err, null);
						if(result) {
							callback(null, result[0]);
						} else {
							callback(null, null);
						}
					});
				} else {
					callback('no context', null);
				}
			});
		},
		getAllDeeplinks : function(options, callback) {
			if(!callback) {
				return console.error('Missing callback parameter');
			}
			options = options || {};
			buildfire.getContext(function(err, context) {
				if(err) {
					callback(err, null);
				} else {
					if(context && context.instanceId) {
						var searchOptions = {
							pageSize : options.pageSize,
							filter: {
								'_buildfire.index.string1' : context.instanceId
							}
						};
						buildfire.appData.search(searchOptions, '$$deeplinks', callback);
					} else {
						callback('no context', null);
					}
				}
			});
		},
		unregisterDeeplink : function(deeplinkId, callback) {
			if (!callback) {
				callback = function(err) {
					if(err) console.error(err);
				};
			}
			this.getDeeplink(deeplinkId, function(err, result) {
				if(err) return callback(err, null);
				if(result) {
					buildfire.appData.delete(result.id, '$$deeplinks', callback);
				} else {
					callback('no result found for this deeplink id', null);
				}
			});
		},
		onUpdate: function (callback, allowMultipleHandlers) {
			buildfire.eventManager.add('deeplinkOnUpdate', callback, allowMultipleHandlers);
		},
		triggerOnUpdate: function (queryString) {
			try {
				var qs = buildfire.parseQueryString(decodeURIComponent(queryString));
				buildfire.deeplink._data = JSON.parse(qs.dld);
			} catch (error) {
				console.error(error);
				buildfire.deeplink._data = queryString;
			}
			buildfire.eventManager.trigger('deeplinkOnUpdate', buildfire.deeplink._data);
		},
		_data: null
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/Spinners
	, spinner: {
		show: function (options) {
			buildfire._sendPacket(new Packet(null, 'spinner.show', options));
		}
		, hide: function () {
			buildfire._sendPacket(new Packet(null, 'spinner.hide'));
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Auth
	, auth: {
		login: function (options, callback) {
			var p = new Packet(null, 'auth.login', options);
			buildfire._sendPacket(p, callback);
		},
		logout: function () {
			var p = new Packet(null, 'auth.logout');
			buildfire._sendPacket(p);
		},
		getCurrentUser: function (callback) {
			var p = new Packet(null, 'auth.getCurrentUser');
			buildfire._sendPacket(p, callback);
		},
		onLogin: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('authOnLogin', callback, allowMultipleHandlers);
		},
		triggerOnLogin: function (user) {
			buildfire.eventManager.trigger('authOnLogin', user);
			buildfire.dynamic.triggerContextChange({contextProperty: 'appUser', data: user});
		},
		onLogout: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('authOnLogout', callback, allowMultipleHandlers);
		},
		triggerOnLogout: function (data) {
			buildfire.eventManager.trigger('authOnLogout', data);
			buildfire.dynamic.triggerContextChange({contextProperty: 'appUser', data: data});
		},
		onUpdate: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('authOnUpdate', callback, allowMultipleHandlers);
		},
		triggerOnUpdate: function (data) {
			return buildfire.eventManager.trigger('authOnUpdate', data);
		},
		openProfile: function (userId) {
			var p = new Packet(null, 'auth.openProfile', userId);
			buildfire._sendPacket(p);
		},
		getUserProfile: function (options, callback) {
			var p = new Packet(null, 'auth.getUserProfile', options);
			buildfire._sendPacket(p, callback);
		},
		getUserProfiles: function (options, callback) {
			var p = new Packet(null, 'auth.getUserProfiles', options);
			buildfire._sendPacket(p, callback);
		},
		getUsersByEmail: function (options, callback) {
			var p = new Packet(null, 'auth.getUsersByEmail', options);
			buildfire._sendPacket(p, callback);
		},
		getUserPictureUrl: function (params) {
			var key = null;
			var value = null;
			if (!params) {
				params = {};
			}
			if (params.userId) {
				key = 'userId';
				value = params.userId;
			}
			if (params.email) {
				key = 'email';
				value = params.email;
			}
			if (params.username) {
				key = 'username';
				value = params.username;
			}
			if (!key || !value)
				throw Error('Invalid user picture params');

			value = encodeURIComponent(value);
			var qString = key + '=' + value;

			var authUrl = 'https://auth.buildfire.com';
			if (buildfire._context) {
				if (buildfire._context.endPoints && buildfire._context.endPoints.authHost) {
					authUrl = buildfire._context.endPoints.authHost;
				}
				if (buildfire._context.appId) {
					qString = qString + '&externalAppId=' + encodeURIComponent(buildfire._context.appId);
				}
			}
			// TODO: move caching invalidation logic to KAUTH rather than adding (new Date().getTime())
			return authUrl + '/src/server.js/user/picture?' + qString + '&v=' + new Date().getTime();
		},
		showUsersSearchDialog: function(options,callback){
			var p = new Packet(null, 'usersLib.showSearchDialog', options);
			buildfire._sendPacket(p, callback);
		},
		showTagsSearchDialog: function(options,callback){
			var p = new Packet(null, 'usersLib.showTagsSearchDialog', options);
			buildfire._sendPacket(p, callback);
		},
		assignUserTags: function(tags, options, callback) {
			var p = new Packet(null, 'userTags.assignUserTags', {tags: tags, options: options});
			buildfire._sendPacket(p, callback);
		},
		keepSessionAlive: function(options, callback) {
			buildfire._sendPacket(new Packet(null, 'auth.keepSessionAlive', options), callback);
		},
		searchUsers: function (params, callback) {
			var p = new Packet(null, 'auth.searchUsers', params);
			buildfire._sendPacket(p, callback);
		},
		getDeletedUsers: function(params , callback){
			if (!params || !params.fromDate) {
				return callback('params or fromDate not defined', null);
			}
			if ((params.fromDate instanceof Date) == false) {
				return callback('fromDate must be a Date type.', null);
			}
			buildfire.appData.search(
				{
					filter: {
						'_buildfire.index.date1': { $gte: params.fromDate.getTime() },
					},
				},
				'$$deletedUsers',
				(err,result) => {
					if (err) return callback(err, null);
					if (result) {
						const deletedUsers  = result.map(({data}) => {
							return {
								userId: data.userId,
								deletedOn: new Date(data._buildfire.index.date1)
							};
						});
						return callback(null, deletedUsers);
					}
					return callback(null, []);
				}
			);
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/BuildFire-Device-Features
	, device: {
		calendar: {
			addEvent: function (event, callback) {
				buildfire._sendPacket(new Packet(null, 'device.calendar.addEvent', event), callback);
			}
		},
		share: function (messageObj, callback) {
			buildfire._sendPacket(new Packet(null, 'device.share', messageObj), callback);
		},
		onAppBackgrounded: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('deviceAppBackgrounded', callback, allowMultipleHandlers);
		},
		onAppResumed: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('deviceAppResumed', callback, allowMultipleHandlers);
		},
		triggerOnAppBackgrounded: function (data) {
			return buildfire.eventManager.trigger('deviceAppBackgrounded', data);
		},
		triggerOnAppResumed: function (data) {
			return buildfire.eventManager.trigger('deviceAppResumed', data);
		},
		isKeyboardVisible: function(options, callback) {
			const isVisible = document.documentElement.classList.contains('keyboard-visible');
			if (callback) return callback(null, isVisible);
		},
		onKeyboardShow: function(callback, allowMultipleHandlers = true) {
			buildfire.eventManager.add('keyboardWillShow', callback, allowMultipleHandlers);
		},
		onKeyboardHide: function(callback, allowMultipleHandlers = true) {
			buildfire.eventManager.add('keyboardWillHide', callback, allowMultipleHandlers);
		},
		triggerKeyboardWillShow: function(options) {
			const root = document.documentElement;
			root.classList.add('keyboard-visible');
			root.style.setProperty('--bf-keyboard-height', `${options.keyboardHeight}px`);
			buildfire.eventManager.trigger('keyboardWillShow', {keyboardHeight: options.keyboardHeight});
		},
		triggerKeyboardWillHide: function() {
			const root = document.documentElement;
			root.classList.remove('keyboard-visible');
			buildfire.eventManager.trigger('keyboardWillHide');
		},
		contacts: {
			showDialog: function (options, callback) {
				var p = new Packet(null, 'device.contacts.showDialog', options);
				buildfire._sendPacket(p, callback);
			},
			search: function (options, callback) {
				var p = new Packet(null, 'device.contacts.search', options);
				buildfire._sendPacket(p, callback);
			}
		}
	}
	/// ref: https://github.com/BuildFire/sdk/wiki/BuildFire-Geo-Location-Feature
	, geo : {
		getCurrentPosition:function(options, callback){
			buildfire._sendPacket(new Packet(null,'geo.getCurrentPosition',options),callback);
		}
		,watchPosition:function(options, callback){
			buildfire._sendPacket(new Packet(null,'geo.watchPosition',options));
			this.onPositionChange = callback;
		}
		/// override this event handler for when you are watching for GPS Position Changes
		,onPositionChange: function(err,position){

		}
		,clearWatch:function(watchId, callback) {
			buildfire._sendPacket(new Packet(null, 'geo.clearWatch', watchId), callback);
		}
		,calculateDistance: function (start, end, options) {
			var R = (options && options.unitSystem === 'metric') ? 6371 : 3960,
				decimalPlaces = (options && options.decimalPlaces) ? options.decimalPlaces : 2,
				dLat = buildfire.geo.degreesToRadians(end.latitude - start.latitude),
				dLon = buildfire.geo.degreesToRadians(end.longitude - start.longitude),
				lat1 = buildfire.geo.degreesToRadians(start.latitude),
				lat2 = buildfire.geo.degreesToRadians(end.latitude),

				a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2),
				c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

			return buildfire.geo.round((R * c), decimalPlaces);
		}
		, round: function (value, decimals) {
			return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
		}
		// Converts numeric degrees to radians
		, degreesToRadians: function (degrees) {
			return (degrees * Math.PI)/180;
		},
		startTracking: function(options, callback) {
			buildfire.getContext((err, res) => {
				if (err){
					return callback(err, null);
				}
				if (res && res.instanceId) {
					(options || {}).instanceId = res.instanceId;
					buildfire._sendPacket(new Packet(null,'geo.startTracking', options), callback);
				} else {
					callback('instanceId not found', null);
				}
			});
		},
		isTracking: function(options, callback) {
			buildfire.getContext((err, res) => {
				if (err){
					return callback(err, null);
				}
				if (res && res.instanceId) {
					(options || {}).instanceId = res.instanceId;
					buildfire._sendPacket(new Packet(null,'geo.isTracking', options), callback);
				} else {
					callback('instanceId not found', null);
				}
			});
		},
		stopTracking: function(options, callback) {
			buildfire.getContext((err, res) => {
				if (err){
					return callback(err, null);
				}
				if (res && res.instanceId) {
					(options || {}).instanceId = res.instanceId;
					buildfire._sendPacket(new Packet(null,'geo.stopTracking', options), callback);
				} else {
					callback('instanceId not found', null);
				}
			});
		}
		, session: {
			create: function(options, callback) {
				buildfire.getContext((err, res) => {
					if (err){
						return callback(err, null);
					}
					if (res && res.instanceId) {
						(options || {}).instanceId = res.instanceId;
						buildfire._sendPacket(new Packet(null,'geo.session.create',options),callback);
					} else {
						callback('instanceId not found', null);
					}
				});
			},
			delete: function(options, callback) {
				buildfire._sendPacket(new Packet(null,'geo.session.delete',options),callback);
			},
			addUsers: function(options, callback) {
				buildfire._sendPacket(new Packet(null,'geo.session.addUsers',options),callback);
			},
			removeUsers: function(options, callback) {
				buildfire._sendPacket(new Packet(null,'geo.session.removeUsers',options),callback);
			},
			updateInfo: function(options, callback) {
				buildfire._sendPacket(new Packet(null,'geo.session.updateInfo',options),callback);
			},
			get: function(options, callback) {
				buildfire._sendPacket(new Packet(null,'geo.session.get',options),callback);
			},
			getCurrentUserSessions: function(options, callback) {
				buildfire._sendPacket(new Packet(null, 'geo.session.getCurrentUserSessions', options), callback);
			},
			enableTrackability: function(options, callback) {
				(options || {}).isTrackable = true;
				buildfire._sendPacket(new Packet(null,'geo.session.updateUser', options), callback);
			},
			disableTrackability: function(options, callback) {
				(options || {}).isTrackable = false;
				buildfire._sendPacket(new Packet(null,'geo.session.updateUser', options), callback);
			},
			startWatch: function(options, callback) {

				buildfire.getContext((err, res) => {
					if (err){
						return callback(err, null);
					}
					if (!options || !options.sessionId) {
						return callback('please provide a valid sessionId', null);
					}
					if (res && res.instanceId) {
						const generatedWatchId = res.instanceId + '-' + options.sessionId + '-' + Date.now();
						options.instanceId = res.instanceId;
						options.watchId = generatedWatchId;
						buildfire._sendPacket(new Packet(null,'geo.session.startSessionWatch', options), (err, res) => {
							if (err) callback(err, null);
						});

						buildfire.eventManager.add('onSessionWatchChange', function ({watchId, session}) {
							let sessionWatchId = generatedWatchId;
							if (watchId == sessionWatchId) {
								callback(null, {session: session, watchId: watchId});
							}
						}, true);
					} else {
						callback('instanceId not found', null);
					}
				});
			},
			_triggerOnSessionWatchChange: function(data) {
				buildfire.eventManager.trigger('onSessionWatchChange', data);
			},
			stopWatch: function(options, callback) {
				buildfire._sendPacket(new Packet(null,'geo.session.stopSessionWatch', options), callback);
			},
		},
		// for testing only, to be removed, todo
		_updateLastKnownLocation: function(options, callback) {
			buildfire._sendPacket(new Packet(null,'geo._updateLastKnownLocation', options), callback);
		}
	}
	, localStorage : {
		setItem: function(key,value,callback) {
			if(!callback)callback = function(err){ if(err) console.error(err); };

			if(typeof(value) === 'object' )
				value = JSON.stringify(value);
			else
				value = value + ''; // mimic localStorage behavior. e.g: null is stored as "null"

			buildfire._sendPacket(new Packet(null, 'localStorage.setItem', {key:key,value:value}), callback);
			buildfire.getContext(function(err, context){
				if (err) {
					callback(err);
				} else {
					if(context) {
						context.localStorage = context.localStorage || [];
						// update local copy so we don't have to sync
						context.localStorage[key] = value;
					}
					else {
						callback(null, 'no context');
					}
				}
			});
		}
		,getItem: function(key,callback) {
			if(!callback){
				// var getContext throw if context is not ready and no callback is provided
				var context = buildfire.getContext();
				if(context && context.localStorage) {
					var val = context.localStorage[key];
					return val === undefined ? null : val;
				} else {
					return null;
				}
			}
			var context = buildfire.getContext(function(err, context){
				if (err) {
					callback(err);
				} else {
					if(context && context.localStorage) {
						var val = context.localStorage[key];
						callback(null, val === undefined ? null : val);
					}
					else {
						callback(null, null);
					}
				}
			});
			if(context && context.localStorage) {
				var val = context.localStorage[key];
				return val === undefined ? null : val;
			}
		}
		,removeItem: function(key,callback) {
			if(!callback)callback = function(err){ if(err) console.error(err); };
			buildfire._sendPacket(new Packet(null, 'localStorage.removeItem', key), callback);
			buildfire.getContext(function(err, context){
				if (err) {
					callback(err);
				} else {
					if(context && context.localStorage) {
						delete context.localStorage[key];
					}
					else {
						callback(null, 'no context');
					}
				}
			});
		}
		,clear: function(callback){
			if(!callback)callback = function(err){ if(err) console.error(err); };
			buildfire._sendPacket(new Packet(null, 'localStorage.clear', {}), callback);
			buildfire.getContext(function(err, context){
				if (err) {
					callback(err);
				} else {
					if(context) {
						// clear local copy
						context.localStorage = [];
					}
					else {
						callback(null, 'no context');
					}
				}
			});
		}
		,overrideNativeLocalStorage: function() {
			localStorage.getItem = function (key) {
				return buildfire.localStorage.getItem(key);
			};
			localStorage.setItem = function (key, value) {
				return buildfire.localStorage.setItem(key, value);
			};
			localStorage.removeItem = function (key) {
				return buildfire.localStorage.removeItem(key);
			};
			localStorage.clear = function () {
				return buildfire.localStorage.clear();
			};
		}
	},
	input: {
		showTextDialog: function(options, callback) {
			buildfire._sendPacket(new Packet(null, 'input.showTextDialog', options), callback);
		},
		showListDialog: function (options, callback) {
			buildfire._sendPacket(new Packet(null, 'input.showListDialog', options), callback);
		}
	},
	imagePreviewer: {
		show: function(options, callback) {
			buildfire._sendPacket(new Packet(null, 'imagePreviewer.show', options), callback);
		}
	},
	notes: {
		openDialog: function(options, callback) {
			buildfire._sendPacket(new Packet(null, 'notes.openDialog', options), callback);
		},
		onSeekTo: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('NOTES_SEEK_TO', callback, allowMultipleHandlers);
		},
		triggerOnSeekTo: function (data) {
			buildfire.eventManager.trigger('NOTES_SEEK_TO', data, false);
		},
		getByItemId: function (options, callback) {
			buildfire._sendPacket(new Packet(null, 'notes.getByItemId', options), callback);
		}
	},
	dynamicBlocks: {
		// keep for backward compatability (old namespace)
		// content will not be transformed but will be visible as is
		execute: function(e){
			document.querySelectorAll('.bf-wysiwyg-hide-app').forEach(function(e) {
				e.classList.remove('bf-wysiwyg-hide-app');
			});
		},
	},
	dynamic: {
		requestWidgetContext(options, callback) {
			var p = new Packet(null, 'dynamic.triggerRequestWidgetContext', options);
			buildfire._sendPacket(p, callback);
		},
		onReceivedWidgetContextRequest(options, callback) {
			buildfire.dynamic.expressions._prepareContext(null, (err, result) => {
				if (err) return callback(err);
				callback(null , buildfire.dynamic.expressions._cleanseContext(result));
			});
		},
		triggerContextChange(options) {
			if (typeof dynamicEngine !== 'undefined') {
				dynamicEngine.triggerContextChange(...arguments);
			}
		},
		execute(e) {
			if (!e.parentElement) return;
			const imageContainer = e.parentElement; // give an id to the parent
			const targets = imageContainer.querySelectorAll('[data-type]');
			const VALID_TYPES = ['dynamic-expression'];

			Array.from(targets).forEach((e) => {
				const { type } = e.dataset;
				if (!type || !VALID_TYPES.includes(type)) {
					throw 'invalid_dynamic_block_type';
				}

				switch(type) {
				case 'dynamic-expression':
					this.expressions.handleContentExecution(e);
					break;
				case 'dynamic-api':
					// todo
					break;
				}
			});
		},
		expressions: {
			requestPluginCustomExpressions(options, callback) {
				var p = new Packet(null, 'dynamic.expressions.triggerRequestCustomExpressions', options);
				buildfire._sendPacket(p, callback);
			},
			onReceivedCustomExpressionsRequest(options, callback) {
				if (buildfire.dynamic.expressions.getCustomExpressions) {
					buildfire.dynamic.expressions.getCustomExpressions(null, (err, res) => {
						if (err) return callback(err);
						callback(null, res);
					});
				} else {
					callback(null, null);
				}
			},
			_prepareContext(options, callback) {
				if (buildfire.getContext().type == 'control') {
					// get the widget's context to evaluate expressions against it rather than the control's context
					let options = {
						request: {
							instanceId: buildfire.getContext().instanceId
						}
					};
					buildfire.dynamic.requestWidgetContext(options, (err, context) => {
						if (err) return callback(err);
						buildfire.dynamic.expressions._mergeContext({context}, callback);
					});
				} else {
					const { appId, appTheme, pluginId } = buildfire.getContext();
					buildfire.auth.getCurrentUser((err, appUser) => {
						if (err) return callback(err);
						const expressionsContext = { appUser, appId, appTheme, pluginId };

						buildfire.dynamic.expressions._mergeContext({context: expressionsContext}, callback);
					});
				}
			},
			_mergeContext({context}, callback) {
				if (buildfire.dynamic.expressions.getContext) {
					buildfire.dynamic.expressions.getContext(null, (err, newContext) => {
						callback(null, { ...context, ...newContext });
					});
				} else {
					callback(null, context);
				}
			},
			_cleanseContext(context) {
				let cleansedContext = {};
				Object.keys(context).forEach(key => {
					if (typeof context[key] !== 'function' ) {
						cleansedContext[key] = context[key];
					}
				});
				cleansedContext.sdk = null;
				return cleansedContext;
			},
			_dynamicEngineQueue: [],
			_htmlContainers: {},
			_getDynamicEngine(callback) {
				if (this._dynamicEngineQueue.length > 0) {
					this._dynamicEngineQueue.push(callback);
				} else if (typeof dynamicEngine !== 'undefined') { // this object will be assigned from the new file (expressions.js)
					callback(null, dynamicEngine);
				} else {
					let url;
					this._dynamicEngineQueue.push(callback);
					if (buildfire.getContext().type == 'control') {
						url = '../../../../scripts/dynamic/dynamicEngine.min.js';
					} else {
						url = '../../../scripts/dynamic/dynamicEngine.min.js';
					}
					const scriptId = 'dynamicEngine';
					buildfire.loadScript({ url, scriptId }, () => {
						dynamicEngine.expressions.getContext = this._prepareContext; // overwrite the getContext to be suitable for the sdk environment
						dynamicEngine.getGlobalSettings = buildfire.getGlobalSettings; // overwrite the getGlobalSettings to be suitable for the sdk environment
						_executeDynamicEngineQueue(dynamicEngine);
					});
				}
				const _executeDynamicEngineQueue = (dynamicEngine) => {
					this._dynamicEngineQueue.forEach((callback) => {
						callback(null, dynamicEngine);
					});
					this._dynamicEngineQueue = [];
				};
			},
			/**
			 * evaluate
			 * @description evaluate a JS expression result within a defined context
			 * @public
			 */
			evaluate(options, callback) {
				this._getDynamicEngine((err, dynamicEngine) => {
					if (err) return callback(err);
					dynamicEngine.expressions.evaluate(options, callback);
				});
			},
			/**
			 * handleContentExecution
			 * @description dynamic expressions handler, prepare the content, context and then evaluate it.
			 * @public
			 */
			handleContentExecution(e) {
				const container = e.parentElement.classList.contains('bf-wysiwyg-top')
					? e.parentElement.parentElement
					: e.parentElement;

				if (!container) return;
				if (!e.parentElement.innerText && e.parentElement.children.length === 1) {
					e.parentElement.remove();
				} else {
					e.remove();
				}
				let id = e.getAttribute('data-id');
				let expressionHtmlContainers = buildfire.dynamic.expressions._htmlContainers;
				expressionHtmlContainers[id] = expressionHtmlContainers[id] || [];
				expressionHtmlContainers[id].push(container);

				const content = container.innerHTML.replace(/bf-wysiwyg-hide-app/g, '');

				this.evaluate({id: id, expression: content}, (err, res) => {

					let container = expressionHtmlContainers[id].find((item) => item.parentElement !== null );
					if (!container) {
						expressionHtmlContainers[id] = []; // reset to cleanup in case of DOM elements being removed and added again
					} else {
						expressionHtmlContainers[id] = [container]; // reset to cleanup in case of DOM elements being removed and added again
						if (err) {
							if (buildfire.getContext().liveMode) throw err;
							container.classList.add('bf-expression-error');
							container.innerHTML = `<span style="color: #E36049">Error:</span><br><br>${err.message}`;
						} else {
							let tempElement = document.createElement('div');
							tempElement.innerHTML = res.evaluatedExpression;
							const elements = tempElement.querySelectorAll('*');
							elements.forEach(element => {
								Array.from(element.attributes).forEach(({name}) => {
									if (name.startsWith('expr-') || name.startsWith('data-expr-')){
										const cleanedName = name.replace('data-', '');
										const attributeName = cleanedName.slice(5);
										if (element.getAttribute(name) && !element.getAttribute(name).includes('undefined')) {
											element.setAttribute(attributeName, element.getAttribute(name));
											element.removeAttribute(name);
										}
									}
								});
							});
							container.innerHTML = tempElement.innerHTML;
							container.classList.remove('bf-expression-error');
						}
					}
				});
			},
			showDialog: function (options, callback) {
				if (typeof options === 'undefined' || !options) {
					options = {};
				}
				buildfire.getContext(function(err, context){
					if(context && context.instanceId) {
						options.instanceId = context.instanceId;
					}
					const p = new Packet(null, 'dynamic.expressions.showDialog', {options: options});
					buildfire._sendPacket(p, callback);
				});
			}
		},
		appDatasources: {
			showDialog: function (options = {}, callback) {
				const p = new Packet(null, 'appDatasources.showDialog', options);
				buildfire._sendPacket(p, callback);
			}
		}
	},
	wysiwyg: {
		injectPluginStyles: function(css) {
			var tinymcePluginStylesElement = document.getElementById('tinymcePluginStyles');
			if (tinymcePluginStylesElement) {
				tinymcePluginStylesElement.innerHTML = css;
			} else {
				var tinymcePluginStyles = document.createElement('style');
				tinymcePluginStyles.id = 'tinymcePluginStyles';
				tinymcePluginStyles.rel = 'stylesheet';
				tinymcePluginStyles.innerHTML = css;
				(document.head || document.body).appendChild(tinymcePluginStyles);
			}
		},
		extend: function() {
			if (typeof tinymce !== 'undefined' && tinymce.init && tinymce.isBuildfire) {
				var appContext = buildfire.getContext();
				if (appContext && appContext.endPoints) {
					var appTheme = appContext.endPoints.appHost + '/api/app/styles/appTheme.css?appId=' + appContext.appId + '&liveMode=' + appContext.liveMode + '&isWeb=true';
					var originalTinymceInit = tinymce.init.bind(tinymce);

					tinymce.init = function(options) {
						if (options._bfInitialize === true) {
							return originalTinymceInit(options);
						}
						options.images_dataimg_filter = function(img) {
							// adding (data-no-blob) attribute to an image, prevents its (src) from being converted from (base64) to (blob)
							return !img.hasAttribute('data-no-blob');
						};
						var dynamicExpressionsEnabled = (typeof options.bf_dynamic_expressions !== 'undefined') ? options.bf_dynamic_expressions : true;
						var originalSetup = options.setup;
						if (originalSetup) {
							options.setup = function (editor) {
								let dynamicExpressionsActivated;
								const originalSetContent = editor.setContent.bind(editor);
								editor.setContent = (content, args) => {
									originalSetContent(content, args);
									if (content && typeof dynamicExpressionsActivated === 'undefined' && dynamicExpressionsEnabled) {
										_syncExpressionButtonActivation();
									}
								};
								const timestamp = new Date().getTime();
								const EXPRESSION_HTML = `<img data-no-blob data-id="${timestamp}" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=" style="display: none;" onload="typeof buildfire !== \'undefined\' &amp;&amp; buildfire.dynamic.execute(this);" data-type="dynamic-expression" class="bf-wysiwyg-hide-app" />`;
								const _injectExpressionNode = () => {
									if (!editor.dom.doc.body.querySelector('[data-type="dynamic-expression"]')) {
										const currentContent = editor.getContent();
										editor.setContent(`${currentContent ? EXPRESSION_HTML : EXPRESSION_HTML + '&nbsp;'}${currentContent}`);
										editor.dom.doc.body.querySelectorAll('body > *').forEach(function(ele) { ele.classList.add('bf-wysiwyg-hide-app'); });
									}
								};
								const _removeExpressionNode = () => {
									const div = document.createElement('div');
									div.innerHTML = editor.getContent();
									const elements = div.querySelectorAll('[data-type="dynamic-expression"]');
									Array.from(elements).forEach((e) => {
										if (e.parentElement && !e.parentElement.innerText && e.parentElement.children.length === 1) {
											e.parentElement.remove();
										} else {
											e.remove();
										}
									});
									editor.setContent(div.innerHTML);
									editor.dom.doc.body.querySelectorAll('body > *').forEach(function(ele) { ele.classList.remove('bf-wysiwyg-hide-app'); });
								};
								const _syncExpressionButtonActivation = () => {
									const div = document.createElement('div');
									div.innerHTML = editor.getContent();
									const expression = div.querySelector('[data-type="dynamic-expression"]');
									if (typeof dynamicExpressionsActivated === 'undefined') {
										dynamicExpressionsActivated = !!expression;
									}
								};
								const _restoreCursorPosition = () => { // This function works with sync functionality
									editor.selection.collapse(); // to prevent content removal
									editor.execCommand('mceInsertContent', false, '<span id="temp-cursor-position"></span>');
									setTimeout(() => {
										const tempElement = editor.dom.select('#temp-cursor-position')[0];
										editor.selection.select(tempElement);
										editor.dom.remove(tempElement);
									}, 0);
								};
								const checkExpressionStatus = () => {
									if (dynamicExpressionsEnabled && !dynamicExpressionsActivated && editor.getContent().search(/\${[^$]*}/) > -1) {
										dynamicExpressionsActivated = true;
										_restoreCursorPosition(); // This function works with sync functionality
										_injectExpressionNode();
										editor.isNotDirty = false;
										editor.fire('change');
									} else if (dynamicExpressionsEnabled && dynamicExpressionsActivated && editor.getContent().search('data-type="dynamic-expression"') === -1) {
										setTimeout(() => {
											_restoreCursorPosition();
											_injectExpressionNode();
											editor.isNotDirty = false;
											editor.fire('change');
										}, 0);
									} else if (dynamicExpressionsEnabled && dynamicExpressionsActivated && editor.getContent().search(/\${[^$]*}/) === -1) {
										dynamicExpressionsActivated = false;
										_restoreCursorPosition(); // This function works with sync functionality
										_removeExpressionNode();
									}
								};

								editor.on('init', function () {
									// add a mimic of buildfire object to prevent errors in tinymce
									var scriptElm = editor.dom.create( 'script', {},
										'var buildfire = {'
										+   'actionItems: { execute: function() { console.log("ignore actionItems in tinymce")}},'
										+   'dynamic: { execute: function() { console.log("ignore handleScriptExecution in tinymce")}},'
										+   'ratingSystem: {inject: function() { console.log("ignore rating in tinymce")}}'
										+'};'
									);
									editor.getDoc().getElementsByTagName('head')[0].appendChild(scriptElm);
								});
								editor.on('change', function() {
									// check if there are unused style elements for layouts and delete them
									var styleElementsInBody = editor.dom.doc.body.querySelectorAll('style[data-layout-name]');
									if (styleElementsInBody.length > 0) {
										var allLayouts = editor.dom.doc.body.querySelectorAll('div[data-layout-name]');
										allLayouts = Array.from(allLayouts);
										styleElementsInBody.forEach(function(element) {
											var isStyleUsed;
											isStyleUsed = allLayouts.find(function(layout) {
												return layout.dataset.layoutName === element.dataset.layoutName;
											});
											if (!isStyleUsed) {
												element.parentElement.removeChild(element);
											}
										});
									}
									// delete all the existed (bf-wysiwyg-top/bf-wysiwyg-hide-app) classes from the WYSIWYG, where they should be (at the root) of the WYSIWYG body element
									// but sometimes they are not; so we will delete all of them before adding them to root elements again
									editor.dom.doc.body.querySelectorAll('.bf-wysiwyg-top, .bf-wysiwyg-hide-app').forEach(function(ele) {
										const classes = ['bf-wysiwyg-top', 'bf-wysiwyg-hide-app'];
										ele.classList.remove(...classes);
									});
									// add the class (bf-wysiwyg-top) to all first level elements (at the root) of the WYSIWYG body element
									editor.dom.doc.body.querySelectorAll('body > *').forEach(function(ele) {
										const classes = ['bf-wysiwyg-top'];
										if (dynamicExpressionsEnabled && dynamicExpressionsActivated) {
											classes.push('bf-wysiwyg-hide-app');
										} else {
											ele.classList.remove('bf-wysiwyg-hide-app');
										}
										ele.classList.add(...classes);
									});
									if (dynamicExpressionsEnabled) {
										// check if the expressions evaluation should be turned on or off
										checkExpressionStatus();
										// Get the image that triggers the evaluation process
										let expressionImage = editor.dom.doc.body.querySelectorAll('[data-type="dynamic-expression"]');
										// check if there is any duplicate of the image that trigger the evaluation process and delete duplicates if exist
										expressionImage.forEach((element, index) => {
											if (index === 0) {
												if (element.parentElement.className.indexOf('bf-wysiwyg-top') == -1) {
													// add the expressionImage to an element at the body root if it wasn't
													editor.dom.doc.body.children[0].prepend(element);
												}
											} else {
												// if there multiple expressionImage, then delete the duplicates
												if (element.parentElement && !element.parentElement.innerText && element.parentElement.children.length === 1) {
													element.parentElement.remove();
												} else {
													element.remove();
												}
											}
										});
									}
								});
								let keyupListenerDelay = null;
								editor.on('keyup', function() {
									if (keyupListenerDelay) clearTimeout(keyupListenerDelay);
									keyupListenerDelay = setTimeout(() => {
										// check if the expressions evaluation should be turned on or off
										checkExpressionStatus();
									}, 500);
								});
								editor.ui.registry.addMenuItem('bf_clearContent', {
									text: 'Delete all',
									icon: 'remove',
									onAction: function() {
										editor.execCommand('mceNewDocument');
									}
								});
								editor.ui.registry.addMenuItem('bf_delete', {
									text: 'Delete',
									icon: 'remove',
									shortcut: 'Del',
									onAction: function() {
										editor.execCommand('Delete');
									}
								});
								editor.ui.registry.addMenuItem('bf_insertBefore', {
									text: 'Insert before',
									icon: 'chevron-left',
									onAction: function() {
										let selectedNode = editor.selection.getNode();
										selectedNode.insertAdjacentHTML('beforebegin', '&nbsp;');
									}
								});
								editor.ui.registry.addMenuItem('bf_insertAfter', {
									text: 'Insert after',
									icon: 'chevron-right',
									onAction: function() {
										let selectedNode = editor.selection.getNode();
										selectedNode.insertAdjacentHTML('afterend', '&nbsp;');
									}
								});
								editor.ui.registry.addContextMenu('bf_defaultmenuItems', {
									update: function (element) {
										return element.dataset.bfLayout ? '' : 'cut copy paste bf_insertBefore bf_insertAfter | bf_delete';
									}
								});

								editor.ui.registry.addMenuItem('bf_insertExpression', {
									text: 'Insert expression',
									onAction: function() {
										buildfire.dynamic.expressions.showDialog(null, (err, res) => {
											if (err) return console.error(err);
											if (res) {
												editor.insertContent(res);
											}
										});
									}
								});

								editor.ui.registry.addMenuItem('bf_datasources', {
									text: 'Datasources',
									onAction: function() {
										buildfire.dynamic.appDatasources.showDialog(null, (err, res) => {
											if (err) return console.error(err);
										});
									}
								});
								originalSetup(editor);
							};
						}

						buildfire.appearance.getWidgetTheme(function(err, theme) {
							if (err) return console.error(err);
							if (options.content_style) {
								options.content_style += buildfire.appearance._getCommonCss(theme);
							} else {
								options.content_style = buildfire.appearance._getCommonCss(theme);
							}
						});
						if (options.content_css) {
							if (options.content_css instanceof Array) {
								options.content_css.push(appTheme, '../../../../styles/bfUIElements.css', '../../../../scripts/tinymce/bf_tinymce.css');
							} else {
								var splittedStyleFiles = options.content_css.split(',');
								splittedStyleFiles.push(appTheme, '../../../../styles/bfUIElements.css', '../../../../scripts/tinymce/bf_tinymce.css');
								options.content_css = splittedStyleFiles;
							}
						} else {
							options.content_css = [appTheme , '../../../../styles/bfUIElements.css', '../../../../scripts/tinymce/bf_tinymce.css'];
						}

						options.menubar = options.menubar || 'edit insert view format tools ai';
						var userMenu = options.menu ? JSON.parse(JSON.stringify(options.menu)) : null;
						options.menu = {
							edit: {title: 'Edit', items: 'undo redo | cut copy paste | selectall | bf_clearContent'},
							insert: {title: 'Insert', items: `bf_insertActionItem media bf_insertImage | bf_insertButtonOrLink | bf_insertRating bf_insertLayout ${dynamicExpressionsEnabled ? 'bf_insertExpression' : ''}`},
							view: {title: 'View', items: 'visualaid | preview'},
							format: {title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat'},
							tools: {title: 'Tools', items: 'code bf_datasources'},
							ai: {title: 'AI Content (Beta)', items: 'bf_aiTextGenerator'},
						};
						if (userMenu) {
							for (let item in userMenu) {
								options.menu[item] = userMenu[item];
							}
						}
						var defaultPlugins = ['preview', 'code', 'media', 'textcolor', 'colorpicker', 'fullscreen', 'bf_actionitem', 'bf_imagelib', 'bf_rating', 'bf_buttons', 'lists', 'paste', 'bf_layouts', 'bf_ai'];
						if (options.plugins) {
							if (options.plugins instanceof Array) {
								options.plugins = defaultPlugins.concat(options.plugins);
							} else {
								var splittedPlugins = options.plugins.split(' ');
								options.plugins = defaultPlugins.concat(splittedPlugins);
							}
						} else {
							options.plugins = defaultPlugins;
						}
						var defaultToolbar = 'fontsizeselect forecolor backcolor bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | bf_actionitem bf_imagelib media | code | fullscreen | bf_ai';
						if (options.toolbar) {
							if (options.toolbar instanceof Array) {
								if (!(options.toolbar[0] instanceof Object)) {
									options.toolbar.forEach(function (toolbarGroup) {
										defaultToolbar += ' | ' + toolbarGroup;
									});
									options.toolbar = defaultToolbar;
								}
							} else {
								defaultToolbar += ' | ' + options.toolbar;
								options.toolbar = defaultToolbar;
							}
						} else {
							options.toolbar = defaultToolbar;
						}
						let extended_valid_elements = '';
						// These are the elements that we want to support all of their attributes in tinymce (custom attributes in addition to the non-custom attribute)
						const supportedElement = ['a','article','aside','audio','button','code','details','div','textarea','fieldset','form',
							'h1','h2','h3','h4','h5','h6','input','img','li','ol','ul','option','p','section','select','span','table','tr','iframe'];
						supportedElement.forEach((element, index) => {
							extended_valid_elements += `${element}[*]`;
							if (index != supportedElement.length - 1) extended_valid_elements += ',';
						});
						options.extended_valid_elements = extended_valid_elements;
						options.toolbar_mode = 'floating';
						options.theme = 'silver';
						options.skin = 'bf-skin';
						options.contextmenu = 'bf_buttonOrLinkContextMenu bf_imageContextMenu bf_actionItemContextMenu bf_customLayouts bf_defaultmenuItems';
						options.fontsize_formats= '8px 10px 12px 14px 16px 18px 24px 36px';
						options.height = options.height || 265;
						options.custom_elements = 'style';
						options.convert_urls = false;
						options._bfInitialize = true;
						return originalTinymceInit(options);
					};
				}
			}
		},
	},
	_cssInjection:{
		handleCssLayoutInjection: function (pluginJson) {
			if (typeof pluginJson == 'undefined' || !pluginJson || !pluginJson.control.cssInjection || !pluginJson.control.cssInjection.enabled || !pluginJson.control.cssInjection.layouts.length ) {
				return;
			}

			let activeLayoutTag = '$$activeLayout';
			if (pluginJson.control.cssInjection.activeLayoutTag) {
				activeLayoutTag = pluginJson.control.cssInjection.activeLayoutTag;
			}

			function _handleDataStoreActiveLayoutResponse (result) {
				let activeLayout;
				result = result && result.data ? result.data : {};
				//check if nothing saved as selected layout, so save the default one
				if (!Object.keys(result).length) {
					activeLayout = pluginJson.control.cssInjection.layouts[0];
				} else {
					//this to handle old instances to make it backwards compatible. the old data saved inside `design` property.
					if (result.design && result.design.selectedLayout) {
						activeLayout = result.design.selectedLayout;
					} else if (result.selectedLayout) {
						activeLayout = result.selectedLayout;
					}
				}

				if (activeLayout.cssPath) {
					// so it's predefined

					let cssUrl;
					//check if the cssPath from old instances that doesn't include `widget` in the path or not.
					if (activeLayout.cssPath.startsWith('widget')) {
						cssUrl= `../${activeLayout.cssPath}`;
					} else {
						cssUrl= `./${activeLayout.cssPath}`;
					}
					_attachActiveLayoutCSSFile(cssUrl,'$$bf_layout_css');
				} else if (activeLayout.css) {
					// so it's custom layout
					_attachActiveLayoutCSSContent(activeLayout.css,'$$bf_layout_css');
				}

			}

			function _attachActiveLayoutCSSFile (url, id){
				let activeLayoutStyleElement = document.getElementById(id);

				let linkElement = document.createElement('link');
				linkElement.setAttribute('rel', 'stylesheet');
				linkElement.setAttribute('type', 'text/css');
				linkElement.setAttribute('id', id);
				linkElement.setAttribute('href', url);
				document.head.appendChild(linkElement);

				if (activeLayoutStyleElement) {
					activeLayoutStyleElement.remove();
				}
			}
			function _attachActiveLayoutCSSContent (cssContent, id){

				let activeLayoutStyleElement = document.getElementById(id);

				let styleElement = document.createElement('style');
				styleElement.id = id;
				styleElement.innerHTML = cssContent;
				document.head.appendChild(styleElement);

				if (activeLayoutStyleElement) {
					activeLayoutStyleElement.remove();
				}
			}
			buildfire.datastore.get(activeLayoutTag, (err, result) => {

				if (err) console.error('Error while retrieving active layout', err);
				_handleDataStoreActiveLayoutResponse(result);
			});

			buildfire._cssInjection.onUpdate((data)=>{
				if (data.tag === activeLayoutTag) {
					if (data.data && data.data.$set) {
						data.data = data.data.$set;
					}
					_handleDataStoreActiveLayoutResponse(data);
				}
			},true);


		}
		// might be used by old plugins to manipulate look through JS
		, onUpdate: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('cssInjectionOnUpdate', callback, allowMultipleHandlers);
		}
		, triggerOnUpdate: function (obj) {
			buildfire.eventManager.trigger('cssInjectionOnUpdate', obj);
		}
	},
	language: {
		handleLanguageSettings: function (pluginJson, pluginLanguageJson) {
			if (typeof pluginJson == 'undefined' || !pluginJson || !pluginJson.control.language || !pluginJson.control.language.enabled || !pluginJson.control.language.languageJsonPath || !pluginLanguageJson) {
				return;
			}

			let languageTag = '$$languageSettings';
			if (pluginJson.control.language.tagName) {
				languageTag = pluginJson.control.language.tagName;
			}

			//get data from datastore
			const getLanguage = () => {
				buildfire.datastore.get(languageTag, (err, result) => {
					//even if there is an error found, continue and load default stings.
					_handleDataStoreLanguageSettingsResponse(result);
				});
			};

			//handle data format
			const prepareDataObjectToRead = (pluginLanguageJson) => {
				const sections = pluginLanguageJson.sections;
				if (!Object.keys(sections).length) {
					return null;
				}

				let obj = {};
				for (let sectionKey in sections) {
					let section = obj[sectionKey] = {};
					for (let labelKey in sections[sectionKey].labels) {
						section[labelKey] = {
							value : sections[sectionKey].labels[labelKey].defaultValue
						};
					}
				}

				return obj;
			};

			//inject strings into targeted html elements.
			const injectStrings = (strings) => {
				if (!strings || !Object.keys(strings).length) {
					return;
				}
				//get instanceId
				buildfire.getContext((err, context) => {
					let instanceId = null;
					if (context && context.instanceId) {
						instanceId = context.instanceId;
					}
					const bfElements = document.querySelectorAll('*[bfString]');
					bfElements.forEach(e => {
						buildfire.language._handleNode(e, instanceId);
					});
					//trigger on strings injected and ready.
					buildfire.eventManager.trigger('languageSettingsOnStringsInjected', null);
					buildfire.eventManager.trigger('_languageSettingsOnStringsInjected', null);

					buildfire.language.watch(instanceId);
				});
			};

			//merge updated default strings into datastore strings.
			const mergeUpdatedDefaultStrings = (strings, pluginLanguageJson) => {
				const sections = pluginLanguageJson.sections;
				let obj = {};
				// merge values from datastore into pluginLanguageJson
				for (const sectionKey in sections) {
					const dbSection = strings[sectionKey];
					const defaultSection = sections[sectionKey].labels;
					obj[sectionKey] = {};

					for (const labelKey in defaultSection) {
						if (dbSection && dbSection[labelKey] && (dbSection[labelKey].hasOwnProperty('value') || dbSection[labelKey].hasOwnProperty('defaultValue'))) {
							//handle backward compatibility, cuz some plugins has it in "value" and the others in "defaultValue"
							if (dbSection[labelKey].hasOwnProperty('value')) {
								obj[sectionKey][labelKey] = {
									value: dbSection[labelKey].value
								};
							} else if (dbSection[labelKey].hasOwnProperty('defaultValue')) {
								obj[sectionKey][labelKey] = {
									defaultValue: dbSection[labelKey].defaultValue
								};
							}

						} else {
							obj[sectionKey][labelKey] = {
								defaultValue: defaultSection[labelKey].defaultValue
							};
						}

						//check if we have `hasExpression` flag for each label.
						if (dbSection && dbSection[labelKey] && dbSection[labelKey].hasOwnProperty('hasExpression')) {
							obj[sectionKey][labelKey].hasExpression = dbSection[labelKey].hasExpression;
						}
					}

				}

				return obj;
			};

			function _handleDataStoreLanguageSettingsResponse (result) {
				let strings;
				result = result && result.data ? result.data : {};
				//check if no languages saved or on error, use default strings.
				if (!Object.keys(result).length) {
					strings = prepareDataObjectToRead(pluginLanguageJson);
				} else {
					if (result && result.strings) {
						strings = result.strings;
					// handle backward compatibility
					} else {
						strings = result;
					}

					//merge objects to get the updated default strings values.
					strings = mergeUpdatedDefaultStrings(strings, pluginLanguageJson);
				}
				buildfire.language._strings = strings;
				//attach strings in html.
				injectStrings(strings);
			}

			function init() {
				getLanguage();
			}

			init();

			buildfire.language._onUpdate((data)=>{
				window.location.reload(); //reload frame to update strings for non-bfString html elements in widget.
				// _handleDataStoreLanguageSettingsResponse(data);
			}, true);
		}
		,
		/**
		* get one language string.
		* @param {Object} params - The needed elements to get the language string.
		* @param {string} params.stringKey - The Section key and the label key separated by a dot. (required)
		* @param {string} params.instanceId - Instance Id of the plugin. (optional)
		* @param {Boolean} params.executeCallbackOnUpdate - To keep executing the callback on language string value update or not. (optional)
		* @param {Object} params.node - DOM node element. (optional)
		* @param {Function} callback - Returns the value of the language string or error if existed
		* @public
		*/
		get: function (params, callback) {
			let error;
			if (!params) {
				error = 'Invalid options';
				callback(error, null);
				return;
			}
			if (typeof callback !== 'function') {
				error = 'callback is not a function';
				callback(error, null);
				return;
			}
			if (!params.stringKey) {
				error = 'Invalid options';
				callback(error, null);
				return;
			}
			const stringKeys = params.stringKey.split('.');
			if (!stringKeys || stringKeys.length !== 2) {
				error = 'Invalid options';
				callback(error, null);
				return;
			}

			function onStringsReady(instanceId) {
				const section = stringKeys[0];
				const label = stringKeys[1];
				const strings = buildfire.language._strings;
				if (!strings || !strings[section] || !strings[section][label] || (!strings[section][label].hasOwnProperty('value') && !strings[section][label].hasOwnProperty('defaultValue'))) {
					error = 'String not found.';
					callback(error, null);
					return;
				}


				function getStringValue(stringObj) {
					if (stringObj.hasOwnProperty('value')) {
						return stringObj.value;
					} else if (stringObj.hasOwnProperty('defaultValue')) {
						return stringObj.defaultValue;
					}
				}

				function checkExpression(str) {
					let hasExpression = false;
					if (str) hasExpression = str.search(/\${[^{}]*}/) > -1;
					return hasExpression;
				}

				const valueObj = strings[section][label];
				const stringHasExpression = valueObj.value ? checkExpression(valueObj.value) : checkExpression(valueObj.defaultValue);

				if (stringHasExpression) {
					const stringValue = getStringValue(valueObj);
					const options = {
						instanceId: instanceId,
						expression: stringValue,
						// don't pass "id" here. it must be unique id for each string. even if it's the same string, it must have a unique id.
					};

					//clean up previous request if it's existed. (should not be existed)
					if (params.node && params.node.request && params.node.request.destroy) {
						params.node.request.destroy();
						console.warn('node.request has a value: ', params.node, params.node.request);
						params.node.request = null;
					}
					//get evaluated expression
					buildfire.dynamic.expressions.evaluate(options, (err, {evaluatedExpression, evaluationRequest}) => {
						if (err) {
							callback(null, stringValue);
						} else {
							callback(null, evaluatedExpression);
						}
						//attach the evaluationRequest to node object to be able to destroy it later.
						if (params.node && typeof params.node === 'object' && evaluationRequest) {
							params.node.request = evaluationRequest;
						}
						//stop listening for callbacks.
						if (evaluationRequest && evaluationRequest.destroy && !params.executeCallbackOnUpdate) {
							evaluationRequest.destroy();
						}
					});
				} else {
					const stringValue = getStringValue(valueObj);
					callback(null, stringValue);
				}
			}

			if (params.instanceId) {
				registerStringsReady(params.instanceId);
			} else {
				buildfire.getContext((err, context) => {
					let instanceId = null;
					if (context && context.instanceId) {
						instanceId = context.instanceId;
					}
					registerStringsReady(instanceId);
				});
			}
			function registerStringsReady (instanceId) {
				if (!buildfire.language._strings) {
					buildfire.eventManager.add('_languageSettingsOnStringsInjected', ()=>{
						onStringsReady(instanceId);
					}, true);
				} else {
					onStringsReady(instanceId);
				}
			}
		}
		,
		watch: function (instanceId) {

			const destroyRemovedNodeExpressionsCallbacks = (node) => {
				//remove bfString attribute
				node.removeAttribute('bfString');
				//destroy expressions callbacks
				if (node && node.request && node.request.destroy) {
					node.request.destroy();
					node.request = null;
				}

			};

			// Callback function to execute when mutations are observed
			const callback = (mutationList, observer) => {
				for (const mutation of mutationList) {

					//detect removed nodes
					if (mutation && mutation.removedNodes && mutation.removedNodes.length > 0) {
						for (let i = 0; i < mutation.removedNodes.length; i++) {

							const removedNode = mutation.removedNodes[i];
							if (removedNode && removedNode.tagName) {
								destroyRemovedNodeExpressionsCallbacks(removedNode);

								//get all child elements of removed that has "bfString" attribute to destroy their expressions callbacks
								let childList = removedNode.querySelectorAll('*[bfString]');
								for (let i = 0; i < childList.length; i++) {
									destroyRemovedNodeExpressionsCallbacks(childList[i]);
								}
							}
						}
					}

					if (mutation.type === 'childList' && mutation.target) {
						buildfire.language._handleNode(mutation.target, instanceId);
						let childList = mutation.target.querySelectorAll('*[bfString]');
						for (let i = 0; i < childList.length; i++) {
							buildfire.language._handleNode(childList[i], instanceId);
						}
					}
				}
			};

			let observe = function (targetNode) {
				// Options for the observer (which mutations to observe)
				// attributes should be false >> performance issues
				const config = { childList: true, subtree: true, attributes: false };
				// Create an observer instance linked to the callback function
				const observer = new MutationObserver(callback);
				// Start observing the target node for configured mutations
				observer.observe(targetNode, config);
			};

			if (document.body != null) {
				observe(document.body);
			} else {
				let currentTrial = 0;
				function checkTargetNode() {
					if (document.body) {
						console.info(`document.body found at trial ${currentTrial + 1}`);
						clearInterval(intervalId);
						observe(document.body);
					} else {
						if (++currentTrial >= 10) {
							clearInterval(intervalId);
							console.warn("max trials reached. Unable to find document.body to observe.");
						}
					}
				}
				let intervalId = setInterval(checkTargetNode, 250);
			}
		}
		,
		onStringsReady: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('languageSettingsOnStringsInjected', callback, allowMultipleHandlers);
		}
		, onUpdate: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('languageSettingsOnUpdate', callback, allowMultipleHandlers);
		}
		, _onUpdate: function (callback, allowMultipleHandlers) {
			return buildfire.eventManager.add('_languageSettingsOnUpdate', callback, allowMultipleHandlers);
		}
		, triggerOnUpdate: function (obj) {
			buildfire.eventManager.trigger('_languageSettingsOnUpdate', obj);
			buildfire.eventManager.trigger('languageSettingsOnUpdate', obj);
		}
		,
		_handleNode: function (node, instanceId) { //inject strings for [bfString] elements.
			const injectString = (string, attributes, node) => {
				if (!(node && node.parentNode)) {
					return;
				}
				if (attributes && attributes.length) {
					attributes.forEach(attr => node.setAttribute(attr, string));
				} else {
					node.innerHTML = string;
				}
				//mark initialized elements.
				node.setAttribute('bfString-initialized', '');
			};

			if (!node.tagName) {// not an element
				return;
			}
			if (!node.hasAttribute('bfString')) {
				return;
			}
			//check if this element got bfString value already
			if (node.hasAttribute('bfString-initialized')) {
				return;
			}
			const injectAttributes = node.getAttribute('bfString-attrs');
			let attributes;
			//handle multiple attributes.
			if (injectAttributes) {
				attributes = injectAttributes.split(',');
			}
			const stringKey = node.getAttribute('bfString');
			buildfire.language.get({stringKey, instanceId, executeCallbackOnUpdate: true, node}, (err, string) => {
				if (string) {
					//inject the string into the element.
					injectString(string, attributes, node);
				}
			});
		}
		,
		onPluginLanguageJsLoaded: function (pluginLanguageJson) {
			buildfire.language.handleLanguageSettings(window.pluginJson, pluginLanguageJson);
		}
		,
		_strings: null
	},
	ai: {
		content: {
			showDialog: function (options = {}, callback) {
				const p = new Packet(null, 'ai.showGenerateTextDialog', options);
				buildfire._sendPacket(p, callback);
			}
		},
		getAppRecipe: function (options = {}, callback) {
			var p = new Packet(null, 'ai.getAppRecipe', options);
			buildfire._sendPacket(p, callback);
		}
	},
	diagnostics: {
		checkFeature: function (options = {}, callback) {
			var p = new Packet(null, 'diagnostics.checkFeature', options);
			buildfire._sendPacket(p, callback);
		},
		requestFeaturePermission: function (options = {}, callback) {
			var p = new Packet(null, 'diagnostics.requestFeaturePermission', options);
			buildfire._sendPacket(p, callback);
		}
	},
	onPluginJsonLoaded: function (pluginJson) {
		//attach pluginLanguage.js script that contains languages.json content.
		function attachPluginLanguageJsScript () {
			document.write('<script src="pluginLanguage.js" type=\"text/javascript\"><\/script>');
		}
		if (pluginJson && pluginJson.control && pluginJson.control.language && pluginJson.control.language.enabled) {
			attachPluginLanguageJsScript();
		}
		buildfire._cssInjection.handleCssLayoutInjection(pluginJson);
	}
};

window.parsedQuerystring = buildfire.parseQueryString();
buildfire.fid = window.parsedQuerystring.fid;
buildfire.init();

buildfire.eventManager.add('deviceAppBackgrounded', function () {
	var stopVideos=function (iframes, videos) {
		if (iframes) {
			for(var i = 0 ; i < iframes.length; i++) {
				if( iframes[i].src.indexOf('youtube.com')>-1){
					if(iframes[i].src.indexOf('enablejsapi=1')==-1)
						iframes[i].src = iframes[i].src+'?enablejsapi=1';
					var youtube_command = window.JSON.stringify( { event: 'command', func: 'pauseVideo' } );
					iframes[i].contentWindow.postMessage( youtube_command, 'https://www.youtube.com' );
				} else if (iframes[i].src.indexOf('vimeo.com')>-1) {
					var vimeo_command = JSON.stringify( { method: 'pause' } );
					iframes[i].contentWindow.postMessage( vimeo_command, '*' );
				}
			}
		}
		if (videos) {
			for (var j = 0; j < videos.length; j++) {
				if (videos[j].pause) videos[j].pause();
			}
		}
	};
	var iframes=window.document.getElementsByTagName('iframe');
	var videos = window.document.getElementsByTagName('video');
	stopVideos(iframes, videos);

}, true);


(function () {
	var processedClick = false;
	var handleEvent = function(eventType, event){
		if (!processedClick) {
			processedClick = true;
			setTimeout(function(){ processedClick = false; }, 1000);
			buildfire.auth.keepSessionAlive({ type: eventType });
		}
	};
	document.addEventListener('click', function(e) {
		setTimeout(function(){
			handleEvent('click', e);
		});
	});
	document.addEventListener('touchstart', function(e) {
		setTimeout(function(){
			handleEvent('touchstart', e);
		});
	});
})();


document.addEventListener('DOMContentLoaded', function (event) {
	//buildfire.appearance.autosizeContainer();

	if(!buildfire.options.disableSelect){
		document.getElementsByTagName('body')[0].className += ' noSelect';
	}

	//attach plugin class names and css paths for highlighting and customization
	const injectCSS = () => {
		let injectCSS = buildfire.parseQueryString().injectCSS;
		if (!injectCSS) return;
		try {
			injectCSS = JSON.parse(injectCSS);
		} catch (error) {
			console.error('Error parsing injectCSS', error);
			return;
		}
		const { classNames, paths } = injectCSS;
		if (classNames && classNames.length && document.body) {
			for (let i = 0; i < classNames.length; i++) {
				document.body.classList.add(classNames[i]);
			}
		}
		if (paths && paths.length && document.head) {
			for (let i = 0; i < paths.length; i++) {
				 const cssPath = paths[i];
				if (cssPath) {
					const link = document.createElement('link');
					link.rel = 'stylesheet';
					link.type = 'text/css';
					link.href = cssPath;
					document.head.appendChild(link);
				}
			}
		}
	};
	injectCSS();

	buildfire.getContext(function (err, context) {
		if (err) {
			console.error(err);
		}
		else {
			if (context && context.debugTag)
				buildfire.logger.attachRemoteLogger(context.debugTag);
			if (window.location.pathname.indexOf('/widget/') >= 0) {
				var disableTheme = (buildfire.options && buildfire.options.disableTheme) ? buildfire.options.disableTheme : false;
				var enableMDTheme = (buildfire.options && buildfire.options.enableMDTheme) ? buildfire.options.enableMDTheme  : false;

				if(!disableTheme && !enableMDTheme) {
					if(buildfire.isWeb() || !context.liveMode)
						buildfire.appearance.attachAppThemeCSSFiles(context.appId, context.liveMode, context.endPoints.appHost);
					else
						buildfire.appearance.attachLocalAppThemeCSSFiles(context.appId);
				}

				// Custom App CSS
				buildfire.appearance.getWidgetTheme((err, appTheme) => {
					if (err) return console.error(err);
					if (appTheme.customCSS && appTheme.customCSS.active && window.location.pathname.indexOf('/widget/') >= 0) {
						if (buildfire.isWeb() || !context.liveMode) {
							buildfire.appearance.attachCustomAppCSSUrl(context.appId, context.liveMode, context.endPoints.appHost);
						}
						else {
							buildfire.appearance.attachLocalCustomAppCSSUrl(context.appId);
						}
					}
				});
			}
		}
	});

	if(window.location.href.indexOf('/widget/')
        && !buildfire.appearance.disableFastClickOnLoad
        && !buildfire.options.disableFastClick
	)
		buildfire.appearance.attachFastClick();

	if(!buildfire.options.disableExternalLinkOverride) {
		document.onclick = function (e) {
			e = e ||  window.event;
			var element = e.target || e.srcElement;
			var href = element.getAttribute('href');
			var inAppBrowser  = element.getAttribute('inAppBrowser');
			if(element.tagName == 'A' && href != null && href != '' && inAppBrowser == null){
				var regexp = new RegExp('^(http:\/|https:\/|http:\/\/|https:\/\/|www.)[a-z0-9]');
				if (element.tagName == 'A' && regexp.test(href)) {
					e.preventDefault();
					var target = element.getAttribute('inAppBrowser') || '_blank';
					buildfire.navigation.openWindow(href, target, null);
				}
			}
		};
	}
	setTimeout(function(){
		if(!buildfire.options.disableTheme)
			buildfire.appearance._forceCSSRender();
	}, 1750);



});

document.addEventListener('resize', function (event) {
	buildfire.appearance.autosizeContainer();
});

//IE and old Android Custom Event Fix
if(typeof(CustomEvent) != 'function'){
	function CustomEvent(event, params) {
		params = params || {bubbles: false, cancelable: false, detail: undefined};
		var evt = document.createEvent('CustomEvent');
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	}

	CustomEvent.prototype = window.Event.prototype;
	window.CustomEvent = CustomEvent;
}
