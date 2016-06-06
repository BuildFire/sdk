//"use strict";

function Packet(id, cmd, data) {
    this.id = id ? id : new Date().toISOString() + Math.random();
    this.cmd = cmd;
    this.data = data;
    this.instanceId = null;
}

/// ref: https://github.com/BuildFire/sdk/wiki
var buildfire = {
    logger: {
        _suppress: false
        ,attachRemoteLogger:function (tag){

            // dont attach twice
            if(document.getElementById('BuildFireAppDebuggerScript')) {
                alert('debugger already attached');
                return;
            }

            if(!tag)
                tag = prompt('Enter is a unique tag to send your logs to');

            if(!tag) return;

            var header = document.querySelector('head');
            var script = document.createElement('script');
            script.src='http://debug.buildfire.com/target/target-script-min.js#' + tag;
            script.id = 'BuildFireAppDebuggerScript';
            header.appendChild(script);

        }
        , logMaxLength: 500
        , clearHistory: function () {
            buildfire.logger._getLogContainerDIV().innerHTML = '';
        }
        , _logContainerDIV: null
        , _getLogContainerDIV: function () {
            if (buildfire.logger._logContainerDIV)
                return buildfire.logger._logContainerDIV;
            else
                return buildfire.logger._createLogContainerDIV();
        }
        , _createLogContainerDIV: function () {
            var div = document.getElementById('__buildfireLog');
            if (!div) {
                div = document.createElement('div');
                div.style.position = 'fixed';
                div.style.left = div.style.top = 0;
                div.style.width = '100%';
                div.style.backgroundColor = 'black';
                div.style.opacity = 0.9;
                div.style.display = 'none';
                div.style.zIndex = 9999;
                buildfire.logger._logContainerDIV = div;



                function filterOutLogs(className){
                    var id= 'bf_style_filter';
                    var styleBlock = document.querySelector('head #' + id );
                    if(!styleBlock) {
                        styleBlock = document.createElement('style');
                        styleBlock.id = id;
                        document.head.appendChild(styleBlock);
                    }

                    var logClassTypes=['.bflog-info','.bflog-log','.bflog-debug','.bflog-warn','.bflog-error'];
                    var index = logClassTypes.indexOf('.' + className);
                    if(index >=0) {
                        logClassTypes.splice(index,1);
                        styleBlock.innerHTML=logClassTypes.join(' , ') + ' { display:none;}';
                    }
                    else
                        styleBlock.innerHTML='';

                }

                var select = document.createElement('select');
                select.className = 'form-control';
                select.onchange = function(){
                    var value=select.options[select.selectedIndex].value;
                    if(value=='close') {
                        buildfire.logger.hideHistory();
                        select.selectedIndex=0;
                    }
                    else
                        filterOutLogs(value);
                };
                buildfire.logger.pushHistory(select);
                function createFilterOption(text,toggleClass){
                    var option = document.createElement('option');
                    option.text = text;
                    option.value = toggleClass;
                    select.appendChild(option);
                }

                createFilterOption('Show all','');
                createFilterOption('Info logs only','bflog-info');
                createFilterOption('Logs only','bflog-log');
                createFilterOption('Debug logs only','bflog-debug');
                createFilterOption('Warning logs only','bflog-warn');
                createFilterOption('Error logs only','bflog-error');
                createFilterOption('<<< Close Debugger','close');

            }
            return div;
        }
        , showHistory: function () {
            var div = buildfire.logger._getLogContainerDIV();
            div.style.display = '';
            if (!div.parentNode && document.body)
                document.body.appendChild(div);
        }
        , hideHistory: function () {
            var div = buildfire.logger._getLogContainerDIV();
            div.style.display = 'none';
        }
        , pushHistory: function (element) {
            if (typeof(element) == "string") {
                var d = document.createElement('div');
                d.innerHTML = element;
                element = d;
            }
            var div = buildfire.logger._getLogContainerDIV();
            div.appendChild(element);
            if (div.childNodes.length > buildfire.logger.logMaxLength)
                div.removeChild(div.childNodes[0]);
        }
        , init: function () {
            //buildfire.logger._suppress = window.location.href.indexOf('http') >=0;

            var qs = buildfire.parseQueryString();
            buildfire.fid = qs.fid;

            buildfire.logger._createLogContainerDIV();
            ///hijack console
            var l = console.log;
            console.log = function (message) {
                var dv = document.createElement('div');
                dv.innerHTML = "l: " + message;
                dv.className = 'bflog-log';
                buildfire.logger.pushHistory(dv);
                d.apply(console, arguments);
            };

            var d = console.debug;
            console.debug = function (message) {
                var dv = document.createElement('div');
                dv.innerHTML = "d: " + message;
                dv.className = 'bflog-debug bg-info';
                buildfire.logger.pushHistory(dv);
                d.apply(console, arguments);
            };

            var e = console.error;
            console.error = function (message) {
                var dv = document.createElement('div');
                dv.innerHTML = "e: " + message;
                dv.className = 'bflog-error bg-error';
                buildfire.logger.pushHistory(dv);
                e.apply(console, arguments);
            };

            var w = console.warn;
            console.warn = function (message) {
                var dv = document.createElement('div');
                dv.innerHTML = "w: " + message;
                dv.className = 'bflog-warn bg-warning';
                buildfire.logger.pushHistory(dv);
                w.apply(console, arguments);
            };

            var i = console.info;
            console.info = function (message) {
                var dv = document.createElement('div');
                dv.innerHTML = "i: " + message;
                dv.className = 'bflog-info bg-info';
                buildfire.logger.pushHistory(dv);
                i.apply(console, arguments);
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
    , parseQueryString: function () {
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        var obj = new Object();
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            obj[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return obj;
    }
    , options:{}
    , parseMetaOptions: function(){
        var options = {};
        var tags = document.head.querySelector("meta[name=buildfire]");
        if(tags && tags.content) {
            var sections = tags.content.split(",");
            sections.forEach(function(section){
               var s = section.split("=");
                options[s[0]] = s.length>1?s[1]:true;
            });
        }

        return options;
    }
    ///custom events are super thus this implementation
    , eventManager: {
        events: {}
        , add: function (event, handler, allowMultipleHandlers) {
            if (typeof(handler) != 'function')throw ("Invalid event handler");

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

        buildfire.logger.init();
        //buildfire.logger.showHistory();


        buildfire.appearance.insertHTMLAttributes();
        if(!buildfire.options.disableTheme)
            buildfire.appearance.attachCSSFiles();
    }
    , _whitelistedCommands: ["datastore.triggerOnUpdate"
        , "datastore.triggerOnRefresh"
         ,"userData.triggerOnUpdate"
        , "userData.triggerOnRefresh"
        , "messaging.onReceivedMessage"
        , "history.triggerOnPop"
        , "navigation.onBackButtonClick"
        , "services.media.audioPlayer.triggerOnEvent"
        , "auth.triggerOnLogin"
        , "auth.triggerOnLogout"
        , "logger.showHistory"
        , "logger.attachRemoteLogger"
        , "appearance.triggerOnUpdate"
        , "services.bluetooth.ble.onConnect"
        , "services.bluetooth.ble.onDisconnect"
        , "services.bluetooth.ble._onSubscribeData"
        , "device.triggerOnAppBackgrounded"
        , "device.triggerOnAppResumed"
        ,"geo.onPositionChange"
    ]
    , _postMessageHandler: function (e) {
        if (e.source === window) {
            console.log(' >>>> IGNORE MESSAGE <<<< ');
            return;
        }//e.origin != "null"
        console.info('buildfire.js received << ' + e.data, window.location.href);
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
            console.warn(window.location.href + ' unhandled packet', packet);
            //alert('parent sent: ' + packet.data);
        }
    }
    , _resendAttempts:0
    , _sendPacket: function (packet, callback) {
        if (typeof (callback) != "function")// handels better on response
            callback = function (err, result) {
                console.info('buildfire.js ignored callback ' + JSON.stringify(arguments));
            };


        // Commented the code to prevent the multiple insert hits

        var timeout = setTimeout(function () {
            
            if(buildfire._resendAttempts < 15) {
                var rerun ;

                if (packet.cmd.indexOf('datastore') == 0
                    && packet.cmd.indexOf('datastore.insert') != 0
                    && packet.cmd.indexOf('datastore.bulkInsert') != 0
                    && packet.cmd.indexOf('datastore.disableRefresh') != 0
                )
                    rerun=true;
                else if (packet.cmd.indexOf('getContext') == 0 )
                    rerun=true;

                if(rerun)
                {
                    console.warn("calling" + packet.cmd + ' again! total overall resend attempts ' + buildfire._resendAttempts);
                    buildfire._sendPacket(packet, function (e, d) {
                        buildfire._resendAttempts--;
                        callback(e, d);
                    });
                    buildfire._resendAttempts++;
                }
            }
        }, packet.cmd.indexOf('getContext') == 0? 250 : 1000);

        var wrapper = function (err, data) {
            clearTimeout(timeout); // commented this to remove the 'timeout is not defined' error.
            callback(err, data);
        };

        buildfire._callbacks[packet.id] = wrapper;
        packet.fid= buildfire.fid;
        var p;
        if (typeof(angular) != "undefined")
            p = angular.toJson(packet);
        else
            p = JSON.stringify(packet);


        console.info("BuildFire.js Send >> " + p, window.location.href);
        buildfire._parentPost(p,callback);  //if (parent)parent.postMessage(p, "*");
    }
    ,_parentPost: function (packet) {
        if (parent)parent.postMessage(packet, "*");
    }
    , getContext: function (callback) {
        if (buildfire._context)
            callback(null, buildfire._context);
        else {
            var p = new Packet(null, 'getContext');
            buildfire._sendPacket(p, function (err, data) {
                if (data)
                    buildfire._context = data;
                callback(err, data);
            });
        }
    }
    /// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Navigation
    , navigation: {
        /**
         * Navigate To plugin
         * @pluginData {pluginId : pluginId,instanceId : instanceId,folderName:folderName,title:title }
         */
        navigateTo: function (pluginData) {

            if (pluginData.pluginId
                && pluginData.instanceId
                && pluginData.folderName) {

                var p = new Packet(null, 'navigation.navigateTo', {
                    pluginId: pluginData.pluginId,
                    instanceId: pluginData.instanceId,
                    title: pluginData.title,
                    folderName: pluginData.folderName
                });
                buildfire._sendPacket(p);
            }
            else
                console.error('invalid navigation request ' ,pluginData);
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
                action: 'linkToWeb'
                , url: url
                , openIn: target
            };

            var p = new Packet(null, 'actionItems.execute', actionItem, callback);
            buildfire._sendPacket(p);
        }
        , _goBackOne: function () {
            buildfire._sendPacket(new Packet(null, 'navigation.navigateBack'));
        }
        , onBackButtonClick: function () {
            this._goBackOne();
        }
        , restoreBackButtonClick: function () {
            buildfire.navigation.onBackButtonClick = function () {
                buildfire.navigation._goBackOne()
            };
        }
        , goBack: function () {
            buildfire.navigation.onBackButtonClick();
        }
        , makeSafeLinks: function (element) {
            var t = this;
            if (typeof(element) != "object")
                element = document.getElementById(element);

            var anchors = element.querySelectorAll('a[href^=http], a[href^=https],a[href^=www]');
            for (var i = 0; i < anchors.length; i++) {
                anchors[i].setAttribute("inAppBrowser",true);
                anchors[i].addEventListener("click", function (evt) {
                    evt.preventDefault();
                    t.openWindow(this.href, this.target, null);
                }, false);
            }
        }
        , navigateEmulator: function(){
            buildfire._sendPacket(new Packet(null, 'navigation.navigateEmulator'));
        }
    }
    /// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Appearance
    , appearance: {
		_forceCSSRender: function(){
			// WebKit Rendering Reset on Plugins
			if(window.location.href.indexOf('widget') > 0){
				var html = document.getElementsByTagName('html')[0];
				var style = document.createElement('style');
				style.type = 'text/css';
				style.innerHTML = 'body{position:relative !important; z-index:1 !important;} .plugin-slide{position:relative !important;} .plugin-slide, .plugin-slide img{transform: translateZ(0) !important;';
				html.appendChild(style);
			}
		},
        insertHTMLAttributes: function () {
            var html = document.getElementsByTagName('html')[0];

            if(window.location.href.indexOf('widget') > 0){
                html.setAttribute('buildfire', 'widget');
            }else{
                html.setAttribute('buildfire', 'control');
            }

            var nVer = navigator.appVersion;
            var nAgt = navigator.userAgent;
            var browserName = navigator.appName;
            var fullVersion = '' + parseFloat(navigator.appVersion);
            var majorVersion = parseInt(navigator.appVersion, 10);
            var nameOffset, verOffset, ix;
            var os = "Unknown OS";
// In Opera, the true version is after "Opera" or after "Version"
            if ((verOffset = nAgt.indexOf("Opera")) != -1) {
                browserName = "Opera";
                fullVersion = nAgt.substring(verOffset + 6);
                if ((verOffset = nAgt.indexOf("Version")) != -1)
                    fullVersion = nAgt.substring(verOffset + 8);
            }
// In MSIE, the true version is after "MSIE" in userAgent
            else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
                browserName = "Microsoft Internet Explorer";
                fullVersion = nAgt.substring(verOffset + 5);
            }
// In Chrome, the true version is after "Chrome"
            else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
                browserName = "Chrome";
                fullVersion = nAgt.substring(verOffset + 7);
            }
// In Safari, the true version is after "Safari" or after "Version"
            else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
                browserName = "Safari";
                fullVersion = nAgt.substring(verOffset + 7);
                if ((verOffset = nAgt.indexOf("Version")) != -1)
                    fullVersion = nAgt.substring(verOffset + 8);
            }
// In Firefox, the true version is after "Firefox"
            else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
                browserName = "Firefox";
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
            if ((ix = fullVersion.indexOf(";")) != -1)
                fullVersion = fullVersion.substring(0, ix);
            if ((ix = fullVersion.indexOf(" ")) != -1)
                fullVersion = fullVersion.substring(0, ix);

            majorVersion = parseInt('' + fullVersion, 10);
            if (isNaN(majorVersion)) {
                fullVersion = '' + parseFloat(navigator.appVersion);
                majorVersion = parseInt(navigator.appVersion, 10);
            }


            if (navigator.appVersion.indexOf("Win") != -1) os = "Windows";
            if (navigator.appVersion.indexOf("Mac") != -1) os = "MacOS";
            if (navigator.appVersion.indexOf("X11") != -1) os = "UNIX";
            if (navigator.appVersion.indexOf("Linux") != -1)os = "Linux";

            html.setAttribute('os', os);
            html.setAttribute('browser', browserName);
            html.setAttribute('majorVersion', majorVersion);
            html.setAttribute('fullVersion', fullVersion);

        }
        , getCSSFiles: function (callback) {
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
        , disableFastClickOnLoad:false
        , attachFastClick: function(){

            var path;
            var scripts = document.getElementsByTagName("script");
            for (var i = 0; i < scripts.length; i++) {
                if (scripts[i].src.indexOf('buildfire.js') > 0)
                    path = scripts[i].src.replace('buildfire.js', 'fastclick.js');
                else if (scripts[i].src.indexOf('fastclick.js') > 0){
                    console.warn('fastclick already attached');
                    return;
                }
            }
            if(!path){
                console.error('buildfire.js not found? This should never happen. I cant trust anything anymore.. mommy!');
                return;
            }
            else {
                var script = document.createElement('script');
                script.src = path;
                script.type="text/javascript";
                script.onload=function(){
                    console.info('fastclick.js loaded');
                    if(typeof(FastClick) == "undefined")
                        console.error('fastclick undefined');
                    else
                        FastClick.attach(document.body);
                };
                document.body.appendChild(script);
            }
        }
        , applyFastClick: function(element){
            if(!element)element=document.body;
            if(typeof(FastClick) == "undefined")
                console.error('fastclick undefined');
            else
                FastClick.attach(element);
        }
        , attachAppThemeCSSFiles: function (appId, liveMode, appHost) {
            var linkElement = document.createElement("link");
            buildfire.appearance.CSSBusterCounter = 0;
            linkElement.setAttribute("rel", "stylesheet");
            linkElement.setAttribute("type", "text/css");
            linkElement.setAttribute("id", "appThemeCSS");
            linkElement.setAttribute("href", appHost + '/api/app/styles/appTheme.css?appId=' + appId + '&liveMode=' + liveMode + '&v=' + buildfire.appearance.CSSBusterCounter);
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
            var p = new Packet(null, "appearance.setHeaderVisibility", value);
            buildfire._sendPacket(p);
        }
        , triggerOnUpdate: function () {
            var appThemeCSSElement = document.getElementById("appThemeCSS");
            if(appThemeCSSElement) {
                appThemeCSSElement.href = appThemeCSSElement.href.replace("&v=" + buildfire.appearance.CSSBusterCounter, "&v=" + ++buildfire.appearance.CSSBusterCounter);
            }
        }, titlebar: {
            show: function() {
                var p = new Packet(null, "appearance.titlebar.show");
                buildfire._sendPacket(p);
            },
            hide: function() {
                var p = new Packet(null, "appearance.titlebar.hide");
                buildfire._sendPacket(p);
            }
        }
    }
    /// ref: https://github.com/BuildFire/sdk/wiki/How-to-capture-Analytics-for-your-plugin
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
        get: function (tag, callback) {

            var tagType = typeof(tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof(callback) == "undefined") {
                callback = tag;
                tag = '';
            }
            var obj = {tag: tag};
            var p = new Packet(null, 'datastore.get', obj);
            buildfire._sendPacket(p, callback);

        },
        getWithDynamicData: function (tag, callback) {

            var tagType = typeof(tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof(callback) == "undefined") {
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

            var p = new Packet(null, 'datastore.delete', {tag: tag, id: id});
            buildfire._sendPacket(p, function (err, result) {
                if (result)buildfire.datastore.triggerOnUpdate(result);
                if (callback)callback(err, result);
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
            var p = new Packet(null, "datastore.disableRefresh");
            buildfire._sendPacket(p);
        }
    }
    ,userData: {
        /// ref:
        get: function (tag, callback) {

            var tagType = typeof (tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
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
            if (idType == "function" && typeof (callback) == "undefined") {
                callback = id;
                id = '';
            }

            var tagType = typeof (tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
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
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
                callback = tag;
                tag = '';
            }
            var userTokenType = typeof (userToken);
            if (userTokenType == "undefined")
                userToken = '';
            else if (userTokenType == "function" && typeof (callback) == "undefined") {
                callback = userToken;
                userToken = '';
            }

            var p = new Packet(null, 'userData.save', { tag: tag,userToken: userToken, obj: obj });
            buildfire._sendPacket(p, function (err, result) {

                if (callback) callback(err, result);
            });
        }
        /// ref: 
        , insert: function (obj, tag, userToken, checkDuplicate, callback) {

            var userTokenType = typeof (userToken);
            if (userTokenType == "undefined")
                userToken = '';
            else if (userTokenType == "function" && typeof (callback) == "undefined") {
                callback = userToken;
                userToken = '';
            }
            var checkDuplicateType = typeof (checkDuplicate);
            if (checkDuplicateType == "undefined")
                checkDuplicate = false;
            else if (checkDuplicateType == "function" && typeof (callback) == "undefined") {
                callback = checkDuplicate;
                checkDuplicate = false;
            }
            var userTokenType = typeof (userToken);
            if (userTokenType == "undefined")
                userToken = '';
            else if (userTokenType == "function" && typeof (callback) == "undefined") {
                callback = userToken;
                userToken = '';
            }

            var tagType = typeof (tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
                callback = tag;
                tag = '';
            }

            var p = new Packet(null, 'userData.insert', { tag: tag, userToken: userToken, obj: obj, checkDuplicate: checkDuplicate });
            buildfire._sendPacket(p, function (err, result) {

                callback(err, result);
            });
        }
        /// ref: 
        , bulkInsert: function (arrayObj, tag, userToken, callback) {

            if (arrayObj.constructor !== Array) {

                callback({ "code": "error", "message": "the data should be an array" }, null);
                return;
            }
            var userTokenType = typeof (userToken);
            if (userTokenType == "undefined")
                userToken = '';
            else if (userTokenType == "function" && typeof (callback) == "undefined") {
                callback = userToken;
                userToken = '';
            }
            var tagType = typeof (tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
                callback = tag;
                tag = '';
            }

            var p = new Packet(null, 'userData.bulkInsert', { tag: tag, userToken: userToken, obj: arrayObj });
            buildfire._sendPacket(p, function (err, result) {

                callback(err, result);
            });
        }
        ///  
        , update: function (id, obj, tag, userToken, callback) {
            var userTokenType = typeof (userToken);
            if (userTokenType == "undefined")
                userToken = '';
            else if (userTokenType == "function" && typeof (callback) == "undefined") {
                callback = userToken;
                userToken = '';
            }

            var tagType = typeof (tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
                callback = tag;
                tag = '';
            }

            var p = new Packet(null, 'userData.update', { tag: tag, userToken: userToken, id: id, obj: obj });
            buildfire._sendPacket(p, function (err, result) {

                if (callback) callback(err, result);
            });
        }
        /// ref 
        , delete: function (id, tag, userToken, callback) {

            var userTokenType = typeof (userToken);
            if (userTokenType == "undefined")
                userToken = '';
            else if (userTokenType == "function" && typeof (callback) == "undefined") {
                callback = userToken;
                userToken = '';
            }
            var tagType = typeof (tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
                callback = tag;
                tag = '';
            }

            var p = new Packet(null, 'userData.delete', { tag: tag, userToken: userToken, id: id });
            buildfire._sendPacket(p, function (err, result) {

                if (callback) callback(err, result);
            });
        }
        /// 
        , search: function (options, tag, callback) {

            var tagType = typeof (tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
                callback = tag;
                tag = '';
            }

            //auto correct empty string filter
            if (typeof (options) == "undefined") options = { filter: {} };
            if (!options.filter) options.filter = {};

            var p = new Packet(null, 'userData.search', { tag: tag, obj: options });
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
            var p = new Packet(null, "userData.disableRefresh");
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
        //options:{
        // width: integer or 'full'
        // height: integer or 'full'
        // disablePixelRation: bool
        // }
        , resizeImage: function (url, options) {

            var ratio = options.disablePixelRation?1:window.devicePixelRatio;

			// Don't pass any value under 1
			if(ratio < 1){
				var ratio = 1;
			}

            if (!options)
                options = {width: window.innerWidth};
            else if (typeof(options) != "object")
                throw ("options not an object");

            if (options.width == 'full') options.width = window.innerWidth;
            if (options.height == 'full') options.height = window.innerHeight;

            var root;

            if(url.indexOf("http://imageserver.prod.s3.amazonaws.com") == 0 || url.indexOf("https://imageserver.prod.s3.amazonaws.com") == 0){
                url = url.replace(/^https:\/\//i, 'http://');
                root ="http://buildfire.imgix.net" + url.substring(40); // length of root host
            }
            else if (url.indexOf("Kaleo.DevBucket/") > 0 ){
                root ="http://bflegacy.imgix.net/" + url.split('Kaleo.DevBucket/')[1];
            }

            if(root){


                if (options.width && !options.height)
                    return root + "?w=" + Math.floor(options.width * ratio) ;
                else if (!options.width && options.height)
                    return root + "?h=" + Math.floor(options.height * ratio) ;
                else if (options.width && options.height)
                    return root + "?w" + Math.floor(options.width * ratio) + "&h=" + Math.floor(options.height * ratio) ;
                else
                    return url;
            }
            else{
                root = "http://s7obnu.cloudimage.io/s/";
                if (options.width && !options.height)
                    return root + "width/" + Math.floor(options.width * ratio) + "/" + url;
                else if (!options.width && options.height)
                    return root + "height/" + Math.floor(options.height * ratio) + "/" + url;
                else if (options.width && options.height)
                    return root + "resizenp/" + Math.floor(options.width * ratio) + "x" + Math.floor(options.height * ratio) + "/" + url;
                else
                    return url;
            }
        }

        , cropImage: function (url, options) {

            var ratio = options.disablePixelRation?1:window.devicePixelRatio;

            if (typeof(options) != "object")
                throw ("options not an object");

            if (!options.width && !options.height)
                options = {width: 'full', height: 'full'};

            if (options.width == 'full') options.width = window.innerWidth;
            if (options.height == 'full') options.height = window.innerHeight;

            if(!options.width || !options.height){
                console.warn('cropImage doenst have width or height please fix. returning original url');
                return url;
            }


            var root;

            if(url.indexOf("http://imageserver.prod.s3.amazonaws.com") == 0||url.indexOf("https://imageserver.prod.s3.amazonaws.com") == 0){
                url = url.replace(/^https:\/\//i, 'http://');
                root ="http://buildfire.imgix.net" + url.substring(40); // length of root host
            }
            else if (url.indexOf("Kaleo.DevBucket/") > 0 ){
                root ="http://bflegacy.imgix.net/" + url.split('Kaleo.DevBucket/')[1];
            }


            if(root) {
                return root + "?fit=crop"
                    + (options.width? "&w=" + Math.floor(options.width * ratio):"")
                    + (options.height ? "&h=" + Math.floor(options.height * ratio) : "") ;
            }
            else {
                root = "http://s7obnu.cloudimage.io/s/crop/";
                return root + Math.floor(options.width * ratio) + "x" + Math.floor(options.height * ratio) + "/" + url;
            }

        }
        ,local: {
            _parser: document.createElement('a')
            , localImageLibPath: window.location.href.split('pluginTemplate/')[0] + "imageLib/"
            , parseFileFromUrl: function (url) {
                buildfire.imageLib.local._parser.href = url;
                var sections = buildfire.imageLib.local._parser.pathname.split("/");
                if (sections.length == 0)
                    return null;
                else
                    return sections[sections.length - 1];
            }
            , toLocalPath: function (url) {
                if (url.toLowerCase().indexOf("/imageserver") > 0) {
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
                else if (typeof(options) != "object")
                    throw ("options not an object");

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
                    }
                }
                else
                    callback(null, buildfire.imageLib.resizeImage(url, options));


            }
            , cropImage: function (url, options, callback) {

                //var ratio = options.disablePixelRation ? 1 : window.devicePixelRatio;
                if (!options)
                    options = {width: window.innerWidth};
                else if (typeof(options) != "object")
                    throw ("options not an object");

                if (options.width == 'full') options.width = window.innerWidth;
                if (options.height == 'full') options.height = window.innerHeight;


                if(typeof(SmartCrop) == "undefined")
                    console.warn("smartcrop.js isnt imported");



                if (url.indexOf("http://imageserver.prod.s3.amazonaws.com") == 0 || url.indexOf("https://imageserver.prod.s3.amazonaws.com") == 0) {
                    url = url.replace(/^https:\/\//i, 'http://');

                    var localURL = buildfire.imageLib.local.toLocalPath(url);
                    if (localURL && typeof(SmartCrop) != "undefined") {
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

                            SmartCrop.crop(img, options, function(result){

                                var sug = result.topCrop;
                                ctx.drawImage(img, sug.x, sug.y, sug.width, sug.height,0,0,options.width, options.height);

                                callback(null, canvas.toDataURL());

                            });

                        };
                        img.onerror = function () {
                            callback(null, buildfire.imageLib.cropImage(url, options));
                        }
                    }
                    else
                        callback(null, buildfire.imageLib.cropImage(url, options));
                }
                else
                    callback(null, buildfire.imageLib.cropImage(url, options));


            }
        }


    }
    /// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Notifications
    , notifications: {
        alert: function (options, callback) {
            var p = new Packet(null, 'notificationsAPI.alert', options);
            buildfire._sendPacket(p, callback);
        }
        , confirm: function (options, callback) {
            var p = new Packet(null, 'notificationsAPI.confirm', options);
            buildfire._sendPacket(p, callback);
        }
        , prompt: function (options, callback) {
            var p = new Packet(null, 'notificationsAPI.prompt', options);
            buildfire._sendPacket(p, callback);
        }
        , beep: function (options) {
            var p = new Packet(null, 'notificationsAPI.beep', options);
            buildfire._sendPacket(p, callback);
        }
        , vibrate: function (options) {
            var p = new Packet(null, 'notificationsAPI.vibrate', options);
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
            var p = new Packet(null, 'history.push', {label: label, options: options, source: "plugin"});
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
    }
    /// ref: https://github.com/BuildFire/sdk/wiki/Deep-Links
    , deeplink: {
        getData: function (callback) {
            var qs = buildfire.parseQueryString();
            if(qs.dld)
                callback(JSON.parse(qs.dld)); /// dld: Deep Link Data
            else
                callback(null);
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
            var root = "app" + buildfire._context.appId + "://plugin";
            if (!obj)
                return root;
            else
                return root + "?dld=" + JSON.stringify(obj);
        }
    }
    /// ref: https://github.com/BuildFire/sdk/wiki/Spinners
    , spinner: {
        show: function () {
            buildfire._sendPacket(new Packet(null, 'spinner.show'));
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
        },
        onLogout: function (callback, allowMultipleHandlers) {
            return buildfire.eventManager.add('authOnLogout', callback, allowMultipleHandlers);
        }
        , triggerOnLogout: function (data) {
            return buildfire.eventManager.trigger('authOnLogout', data);
        },
        openProfile: function (userId) {
            var p = new Packet(null, 'auth.openProfile', userId);
            buildfire._sendPacket(p);
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
        }
    }
    /// ref: https://github.com/BuildFire/sdk/wiki/BuildFire-Geo-Location-Feature
    , geo : {
        getCurrentPosition:function(options, callback){
            buildfire._sendPacket(new Packet(null,"geo.getCurrentPosition",options),callback);
        }
        ,watchPosition:function(options, callback){
            buildfire._sendPacket(new Packet(null,"geo.watchPosition",options));
            this.onPositionChange = callback;
        }
        /// override this event handler for when you are watching for GPS Position Changes
        ,onPositionChange: function(err,position){

        }
        ,clearWatch:function(watchId, callback){
            buildfire._sendPacket(new Packet(null,"geo.clearWatch",watchId),callback);
        }
    }

};
buildfire.init();


document.addEventListener("DOMContentLoaded", function (event) {
    //buildfire.appearance.autosizeContainer();
    console.info('DOMContentLoaded');

    buildfire.getContext(function (err, context) {
        console.log("tracer: got getContext");
        if (err) {
            console.error(err);
        }
        else {
            if (context.debugTag)
                buildfire.logger.attachRemoteLogger(context.debugTag);
            if (window.location.pathname.indexOf('/widget/') > 0) {
                buildfire.appearance.attachAppThemeCSSFiles(context.appId, context.liveMode, context.endPoints.appHost);
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
            var inAppBrowser  = element.getAttribute("inAppBrowser");
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
		buildfire.appearance._forceCSSRender();
	}, 1750);

});
document.addEventListener("resize", function (event) {
    buildfire.appearance.autosizeContainer();
});

window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
    console.error('Error: ' + errorMsg, ' Script: ' + url, ' Line: ' + lineNumber
        , ' Column: ' + column, ' StackTrace: ' + errorObj);
};


//IE and old Android Custom Event Fix
if(typeof(CustomEvent) != "function"){
    function CustomEvent(event, params) {
        params = params || {bubbles: false, cancelable: false, detail: undefined};
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
}


