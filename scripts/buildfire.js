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
        return (url.indexOf("s3.amazonaws.com") !== -1);
    }
    , isWeb: function(){
        return (window.location.protocol.indexOf("http") == 0);
    }
    , logger: {
        attachRemoteLogger:function (tag){

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
    }
    , _callbacks: {}
    , parseQueryString: function () {
        var query = window.location.search.substring(1);
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


        buildfire.appearance.insertHTMLAttributes();

        buildfire.appearance.attachCSSFiles();

        buildfire.localStorage.overrideNativeLocalStorage();

    }
    , _whitelistedCommands: [
        "datastore.triggerOnUpdate"
        , "datastore.triggerOnRefresh"
        , "userData.triggerOnUpdate"
        , "userData.triggerOnRefresh"
        , "publicData.triggerOnUpdate"
        , "publicData.triggerOnRefresh"
        , "appData.triggerOnUpdate"
        , "appData.triggerOnRefresh"
        , "messaging.onReceivedMessage"
        , "history.triggerOnPop"
        , "navigation.onBackButtonClick"
        , "services.media.audioPlayer.triggerOnEvent"
        , "auth.triggerOnLogin"
        , "auth.triggerOnLogout"
        , "auth.triggerOnUpdate"
        , "logger.attachRemoteLogger"
        , "appearance.triggerOnUpdate"
        , "device.triggerOnAppBackgrounded"
        , "device.triggerOnAppResumed"
        , "notifications.localNotification.onClick"
        , "geo.onPositionChange"
        , "navigation.triggerOnAppLauncherActive"
        , "navigation.triggerOnAppLauncherInactive"
        , "colorLib._triggerOnChange"
        , "services.publicFiles._triggerOnProgress"
        , "services.publicFiles._triggerOnComplete"
        , "notes.triggerOnSeekTo"
        , "navigation.triggerOnPluginOpened"
    ]
    , _postMessageHandler: function (e) {
        if (e.source === window) {
            return;
        }//e.origin != "null"

        var packet;
        if(typeof(e.data) == "object")
            packet = e.data;
        else
            packet = JSON.parse(e.data);

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
    //, _resendAttempts:0
    , _sendPacket: function (packet, callback) {
        if (typeof (callback) != "function")// handels better on response
            callback = function (err, result) {
                //console.info('buildfire.js ignored callback ' + JSON.stringify(arguments));
            };

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
                console.log("calling " + packet.cmd + ' again. total overall resend attempts ' + resendAttempts);

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

        //packet.cmd.indexOf('getContext') == 0? 250 :

        var wrapper = function (err, data) {
            clearTimeout(timeout); // commented this to remove the 'timeout is not defined' error.
            callback(err, data);
        };

        buildfire._callbacks[packet.id] = wrapper;
        packet.fid= buildfire.fid;


        //console.info("BuildFire.js Send >> " , packet.cmd, buildfire.fid);
        buildfire._parentPost(packet,callback);  //if (parent)parent.postMessage(p, "*");
    }
    ,_parentPost: function (packet) {

        function sanitize(data){
            if(data)delete data.$$hashKey;
            for(var p in data){
                var obj = data[p];
                if( typeof(obj) == "object")
                    data[p] = sanitize (obj);
            }
            return data;
        }

        if (parent && packet) {
            if(packet.data && typeof(angular) != "undefined") packet.data= sanitize(packet.data);
            parent.postMessage(packet, "*");
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
    /// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-Navigation
    , navigation: {
        /**
         * Navigate To plugin
         * @pluginData {pluginId : pluginId,instanceId : instanceId,folderName:folderName,title:title ,queryString: to pass to next plugin}
         */
        navigateTo: function (pluginData) {

            if(pluginData.pluginTypeId && !pluginData.pluginId)
                pluginData.pluginId=pluginData.pluginTypeId;


            var p = new Packet(null, 'navigation.navigateTo', {
                pluginId: pluginData.pluginId,
                instanceId: pluginData.instanceId,
                title: pluginData.title,
                folderName: pluginData.folderName,
                queryString: pluginData.queryString
            });
            buildfire._sendPacket(p);
        }
        , navigateToSocialWall: function (pluginData, callback) {
            var pluginIds = {
                'social2.0': '697f1612-8208-4870-93f9-555c65103578',
                'social': '7b3d82bf-e5f1-4b2e-82bf-966d2ab0340d'
            };
            if (!callback) {
                callback = console.warn;
            }
            if (!pluginData) {
                pluginData = {};
            }

            navigate(pluginData, pluginIds['social2.0'], function (error) {
                if (!error) return callback(null, {status: 'completed'});

                navigate(pluginData, pluginIds['social'], callback);
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
                action: 'linkToWeb'
                , url: url
                , openIn: target
            };
            var p = new Packet(null, 'actionItems.execute', actionItem, callback);
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
    },
    //buildfire.getFrameType API returns string "launcherPluginv" if it is Home plugin
    // else it returns "controlIFrame"
    getFrameType: function () {
        var PLUGIN_STRING_ENUM={
            LAUNCHER_PLUGIN : "launcherPluginv",
            CONTROL_FRAME : "controlIFrame"
        };

        var PLUGIN_TYPE_ENUM={
            LAUNCHER_PLUGIN : "LAUNCHER_PLUGIN",
            CONTROL_FRAME : "CONTROL_FRAME",
            UNKNOWN : "UNKNOWN"
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
                backgroundColor: "#ffffff",
                bodyText: "#858585",
                dangerTheme: "#f24965",
                defaultTheme: "#07a05e",
                footerMenuBackgroundColor: "#ffffff",
                footerMenuIconColor: "#45cae6",
                headerText: "#000000",
                icons: "#45cae6",
                infoTheme: "#66d6ed",
                primaryTheme: "#45cae6",
                successTheme: "#0ac775",
                titleBar: "#0ac775",
                titleBarTextAndIcons: "#ffffff",
                warningTheme: "#ffcf40"
            },
            fontId : "Lato",
            fontName: "Lato"
        },
        getAppTheme: function (callback) {
            buildfire.getContext(function(err,context){
                if(err)
                    callback(err,null);
                if(context){
                    if(buildfire.isWeb() && !context.appTheme){
                        context.appTheme = buildfire.appearance._defaultTheme;
                    }

                    callback(null,context.appTheme);
                }
                else
                    callback(null,null);

            });
        },
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

            var userAgent = navigator.userAgent || navigator.vendor || window.opera;
            if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
                var p = new Packet(null, 'appearance.getFooterMenu');
                buildfire._sendPacket(p, function (err, footerMenu) {
                    if (err) {
                        console.error(err);
                    } else if (footerMenu && footerMenu.settings && !footerMenu.settings.turnOnFooterMenu) {
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

                // TODO: verify why in attachCSSFiles and if should not run if disableTheme === true ?
                var scripts = document.getElementsByTagName("script");

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
            }

            if (enableMDTheme) {
                buildfire.appearance.getAppTheme(function(err, appTheme) {
                    var styleElement = document.createElement('style');
                    styleElement.id = 'appMDTheme';
                    styleElement.type = 'text/css';
                    var css = "";
                    if ( typeof(appTheme.fontId) !== 'undefined' && appTheme.fontId !== 'Arial'
                    && appTheme.fontId !== 'Sans-Serif' && appTheme.fontId !== 'Helvetica'
                    && appTheme.fontId !== 'Shadows+into+Light'&& appTheme.fontId !== 'Asap+condensed') {
                        css += '@import url(\'https://fonts.googleapis.com/css?family='+ appTheme.fontName +'\');'
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
                            + '{ font-family: ' + appTheme.fontName + ', sans-serif !important '
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
                    (document.head || document.body || document).appendChild(styleElement);

                });
            }

            if (base[base.length - 1] != "/"){
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
                (document.head || document.body || document).appendChild(_sharedStyle);
            }

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
                else if (scripts[i].src.indexOf('buildfire.min.js') > 0)
                    path = scripts[i].src.replace('buildfire.min.js', 'fastclick.js');
                else if (scripts[i].src.indexOf('fastclick.js') > 0){
                    console.warn('fastclick already attached');
                    return;
                }
            }
            if(!path){
                console.warn('fastclick.js requires a buildfire.js reference.');
                return;
            }
            else {
                var script = document.createElement('script');
                script.src = path;
                script.type="text/javascript";
                script.onload=function(){
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
            this._attachAppThemeCSSFiles(appHost + '/api/app/styles/appTheme.css?appId=' + appId + '&liveMode=' + liveMode + '&v=' + buildfire.appearance.CSSBusterCounter);
        }
        , attachLocalAppThemeCSSFiles: function (appId) {
            this._attachAppThemeCSSFiles( '../../../../app/scripts/offline/appTheme'+appId+'.css');
        }
        ,_attachAppThemeCSSFiles:function(url){
            var linkElement = document.createElement("link");
            buildfire.appearance.CSSBusterCounter = 0;
            linkElement.setAttribute("rel", "stylesheet");
            linkElement.setAttribute("type", "text/css");
            linkElement.setAttribute("id", "appThemeCSS");
            linkElement.setAttribute("href", url);
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
        },
        /// ref: https://github.com/BuildFire/sdk/wiki/Plugin-Custom-Events
        registerEvent: function (event, options, callback) {
            if (typeof(options) == "function") {
                callback = options;
                options = null;
            }
            var p = new Packet(null, "analytics.registerPluginEvent", {data: event, options: options});
            buildfire._sendPacket(p, callback);
        },
        unregisterEvent: function (key, callback) {
            var p = new Packet(null, "analytics.unregisterPluginEvent", {
                key: key
            });
            buildfire._sendPacket(p, callback);
        },
        ///params:{eventKey:''}
        showReports: function (params, callback) {
            if (!params)
                params = {};
            var p = new Packet(null, "analytics.showReports", params);
            buildfire._sendPacket(p, callback);
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
        , searchAndUpdate: function (search, obj, tag, callback) {
            var tagType = typeof(tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof(callback) == "undefined") {
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
    /// ref:
    ,userTags: {
        assignUserTags: function(tags, options, callback) {
            var p = new Packet(null, 'userTags.assignUserTags', {tags: tags, options: options});
            buildfire._sendPacket(p, callback);
        }
    }
    /// ref: https://github.com/BuildFire/sdk/wiki/User-Data:-Save-user-data-from-the-widget
    ,userData: {
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
                if (result)buildfire.userData.triggerOnUpdate(result);
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
                if (result)buildfire.userData.triggerOnUpdate(result);
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
                if (result)buildfire.userData.triggerOnUpdate(result);
                if (callback) callback(err, result);
            });
        }
        , searchAndUpdate: function (search, obj, tag, userToken, callback) {
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
                if (result)buildfire.userData.triggerOnUpdate(result);
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
    , publicData: {
        /// ref:
        get: function (tag, callback) {

            var tagType = typeof (tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
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
            var obj = {tag: tag, id: id};
            var p = new Packet(null, 'publicData.get', obj);
            buildfire._sendPacket(p, callback);

        }
        /// ref:
        , save: function (obj, tag, callback) {
            var tagType = typeof (tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
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
            if (checkDuplicateType == "undefined")
                checkDuplicate = false;
            else if (checkDuplicateType == "function" && typeof (callback) == "undefined") {
                callback = checkDuplicate;
                checkDuplicate = false;
            }

            var tagType = typeof (tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
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

                callback({"code": "error", "message": "the data should be an array"}, null);
                return;
            }

            var tagType = typeof (tag);
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
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
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
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
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
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
            if (tagType == "undefined")
                tag = '';
            else if (tagType == "function" && typeof (callback) == "undefined") {
                callback = tag;
                tag = '';
            }

            var p = new Packet(null, 'publicData.delete', {tag: tag, id: id});
            buildfire._sendPacket(p, function (err, result) {
                if (result)buildfire.publicData.triggerOnUpdate(result);
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
            if (typeof (options) == "undefined") options = {filter: {}};
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
            var p = new Packet(null, "publicData.disableRefresh");
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
            if (idType == "function" && typeof (callback) == "undefined") {
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
            if (checkDuplicateType == "undefined")
                checkDuplicate = false;
            else if (checkDuplicateType == "function" && typeof (callback) == "undefined") {
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
                callback({"code": "error", "message": "the data should be an array"}, null);
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
        , search: function (options, tag, callback) {
            if (!this._isTagValid(tag, callback)) return;

            //auto correct empty string filter
            if (typeof (options) == "undefined") options = {filter: {}};
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
            var p = new Packet(null, "appData.disableRefresh");
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

            callback({ "code": "error", "message": "tag is required for appData, and must be a string" }, null);

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
                    get fifth_width() {
                        return this.findNearest(5);
                    },
                    get sixth_width() {
                        return this.findNearest(6);
                    },
                    findNearest: function (ratio) {
                        var match = null;
                        for (var i = 0; i < this.VALID_SIZES.length; i++) {
                            var size = this.VALID_SIZES[i];

                            if ((window.innerWidth / ratio) < this[size]) {
                                match = size;
                                break;
                            }
                        }
                        return this[match];
                    },
                    VALID_SIZES: [
                        'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', //standard
                        '720', '1080', '1440', //desktop
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
            }
        },
        /// ref: https://github.com/BuildFire/sdk/wiki/How-to-use-ImageLib#buildfireimagelibshowdialogoptions-callback
        showDialog: function (options, callback) {
            var p = new Packet(null, 'imageLib.showDialog', options);
            buildfire._sendPacket(p, callback);
        }
        ,isProdImageServer: function(url){
            return ((url.indexOf("http://imageserver.prod.s3.amazonaws.com") == 0
                || url.indexOf("https://imageserver.prod.s3.amazonaws.com") == 0
                || url.indexOf("https://s3-us-west-2.amazonaws.com/imageserver.prod") == 0
            ));
        }
        //options:{
        // width: integer or 'full'
        // height: integer or 'full'
        // disablePixelRation: bool
        // }
        , resizeImage: function (url, options, element, callback) {
            if (!url) return null;
            // return unsupported file types
            if (/\..{3,4}(?!.)/g.test(url) && !(/.(png|jpg|jpeg)(?!.)/gi.test(url))) {
                var filetype = (/.{0,4}(?!.)/g.exec(url) || ['Selected'])[0];
                console.warn(filetype + ' files are not supported by resizeImage. Returning original URL: ' + url);
                return url;
            }

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

            /*if(buildfire.imageLib.isProdImageServer(url)){
                url = url.replace(/^https:\/\//i, 'http://');
                root ="http://buildfire.imgix.net" + url.substring(40); // length of root host
            }
            else if (url.indexOf("Kaleo.DevBucket/") > 0 ){
                root ="http://bflegacy.imgix.net/" + url.split('Kaleo.DevBucket/')[1];
            }

            if(false && root){


                if (options.width && !options.height)
                    return root + "?w=" + Math.floor(options.width * ratio) ;
                else if (!options.width && options.height)
                    return root + "?h=" + Math.floor(options.height * ratio) ;
                else if (options.width && options.height)
                    return root + "?w" + Math.floor(options.width * ratio) + "&h=" + Math.floor(options.height * ratio) ;
                else
                    return url;
            }
            else
             */
            {
                //var protocol = window.location.protocol == "https:" ? "https:" : "http:";
                var protocol = "https:";
                var root = protocol + "//alnnibitpo.cloudimg.io/";
                var compression = buildfire.imageLib.getCompression(options.compression);
                var result = '';

                if (options.size && options.aspect) {
                    if (this.ENUMS.SIZES.VALID_SIZES.indexOf(options.size) < 0) {
                        var sizes = this.ENUMS.SIZES.VALID_SIZES.join(', ');
                        console.warn('Inavlid size. Availible options are ' + sizes + '. Returning original url');
                        return url;
                    }
                    if (this.ENUMS.ASPECT_RATIOS.VALID_RATIOS.indexOf(options.aspect) < 0) {
                        var ratios = this.ENUMS.ASPECT_RATIOS.VALID_RATIOS.join(', ');
                        console.warn('Inavlid aspect ratio. Availible options are ' + ratios + '. Returning original url');
                        return url;
                    }
                    //math.round
                    options.width = this.ENUMS.SIZES[options.size];
                    options.height = options.width * this.ENUMS.ASPECT_RATIOS[options.aspect];
                }
                // check for missing size or aspect
                if (options.width && !options.height) {
                    var size = Math.floor(options.width * ratio);
                    result = root + "width/" + size + "/" + compression + url;
                }
                else if (!options.width && options.height) {
                    var size = Math.floor(options.height * ratio);
                    result = root + "height/" + size + "/" + compression + url;
                }
                else if (options.width && options.height) {
                    var size = Math.floor(options.width * ratio) + "x" + Math.floor(options.height * ratio);
                    result = root + "bound/" + size + "/" + compression + url;
                } else {
                    result = url;
                }

                this._handleElement(element, result, callback);

                return result;
            }
        }

        , cropImage: function (url, options, element, callback) {
            if (!url) return null;
            // return unsupported file types
            if (/\..{3,4}(?!.)/g.test(url) && !(/.(png|jpg|jpeg)(?!.)/gi.test(url))) {
                var filetype = (/.{0,4}(?!.)/g.exec(url) || ['Selected'])[0];
                console.warn(filetype + ' files are not supported by cropImage. Returning original URL: ' + url);
                return url;
            }

            /*if (buildfire.imageLib.isProdImageServer(url)) {
                url = url.replace(/^https:\/\//i, 'http://');
            }*/
            if (!options) {
                options = {};
            }
            if (typeof (options) != "object") {
                throw ("options not an object");
            }
            if (options.size && options.aspect) {
                if (this.ENUMS.SIZES.VALID_SIZES.indexOf(options.size) < 0) {
                    var sizes = this.ENUMS.SIZES.VALID_SIZES.join(', ');
                    console.warn('Inavlid size. Availible options are ' + sizes + '. Returning original url');
                    return url;
                }
                if (this.ENUMS.ASPECT_RATIOS.VALID_RATIOS.indexOf(options.aspect) < 0) {
                    var ratios = this.ENUMS.ASPECT_RATIOS.VALID_RATIOS.join(', ');
                    console.warn('Inavlid aspect ratio. Availible options are ' + ratios + '. Returning original url');
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
                console.warn('cropImage doenst have width or height please fix. returning original url');
                return url + '?h=' + options.height + '&w=' + options.width;
            }

            var ratio = window.devicePixelRatio;
            if (options && options.disablePixelRatio) {
                ratio = options.disablePixelRatio;
            }

            //var protocol = window.location.protocol == "https:" ? "https:" : "http:";
            var protocol = "https:";
            var root = protocol + "//alnnibitpo.cloudimg.io/crop/";

            var size = Math.floor(options.width * ratio) + "x" + Math.floor(options.height * ratio) + "/";
            var compression = buildfire.imageLib.getCompression(options.compression);

            var result = root + size + compression + url;

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
                }

                element.onerror = function () {
                    element.src = src;
                    var p = new Packet(null, 'imageCache.download', src);
                    buildfire._sendPacket(p, function () {
                        if (callback) callback(path);
                    });
                }
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
            }

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
            }

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
            var extension = string.match(/(png|jpg|jpeg)/g)[0] || '';
            extension = extension ? '.' + extension : '';

            var hash = 0;
            if (!string.length) return hash;

            for (var i = 0; i < string.length; i++) {
                var char = string.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash |= 0; // Convert to 32bit integer
            }

            return 'cdvfile://localhost/persistent/imageCache/images/' + hash + extension;
        },
        getCompression: function (c) {
            var result = 'n/'
            if (c) {
                var isValid = typeof c === "number" && c >= 1 && c <= 100;
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

                //If we are online, use the normal crop image.
                if (window.navigator.onLine) {
                    callback(null, buildfire.imageLib.cropImage(url, options));
                    return;
                }

                var ratio = options.disablePixelRatio ? 1 : window.devicePixelRatio;

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
                        var canvas = document.createElement('canvas');
                        var ctx = canvas.getContext('2d');
                        var dim = {
                            width:0,
                            height:0
                        }
                        var offset = {
                            x:0,
                            y:0
                        }
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
                    }
                } else {
                    callback(null, buildfire.imageLib.cropImage(url, options));
                }
            }
        }
    }
    , colorLib: {
        showDialog: function (data, options, onchange, callback) {
            buildfire.eventManager.clear('colorLibOnChange');
            if (typeof onchange == "function") {
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
            //make it compatible with app, cp and the old versions
            if(options && options.buttonName && !options.okButton){
                options.okButton = {text: options.buttonName};
            }
            var p = new Packet(null, 'notificationsAPI.alert', options);
            buildfire._sendPacket(p, callback);
        }
        , confirm: function (options, callback) {
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
            var p = new Packet(null, 'notificationsAPI.showDialog', options);
            buildfire._sendPacket(p, callback);
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
        , sendMessageToService: function (data) {
            var p = new Packet(null, 'messaging.sendMessageToService', data);
            buildfire._sendPacket(p);
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
        },
        generateUrl: function (params, callback) {
            var p = new Packet(null, 'shortLinks.generate', params);
            buildfire._sendPacket(p, callback);
        }
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
        },
        onLogout: function (callback, allowMultipleHandlers) {
            return buildfire.eventManager.add('authOnLogout', callback, allowMultipleHandlers);
        },
        triggerOnLogout: function (data) {
            return buildfire.eventManager.trigger('authOnLogout', data);
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
            var qString = key + "=" + value;

            var authUrl = "https://auth.buildfire.com";
            if (buildfire._context) {
                if (buildfire._context.endPoints && buildfire._context.endPoints.authHost) {
                    authUrl = buildfire._context.endPoints.authHost;
                }
                if (buildfire._context.appId) {
                    qString = qString + '&externalAppId=' + encodeURIComponent(buildfire._context.appId);
                }
            }

            return authUrl + "/src/server.js/user/picture?" + qString;
        },
        showUsersSearchDialog: function(options,callback){
            var p = new Packet(null, 'usersLib.showSearchDialog', options);
            buildfire._sendPacket(p, callback);
        },
        showTagsSearchDialog: function(options,callback){
            var p = new Packet(null, 'usersLib.showTagsSearchDialog', options);
            buildfire._sendPacket(p, callback);
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
        ,clearWatch:function(watchId, callback) {
            buildfire._sendPacket(new Packet(null, "geo.clearWatch", watchId), callback);
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
    }
    , localStorage : {
        setItem: function(key,value,callback) {
            if(!callback)callback = function(err){ if(err) console.error(err) };

            if(typeof(value) === "object" )
                value = JSON.stringify(value);
            else
                value = value + ""; // mimic localStorage behavior. e.g: null is stored as "null"

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
                        callback(null, "no context");
                    }
                }
            });
        }
        ,getItem: function(key,callback) {
            if(!callback){
                // let getContext throw if context is not ready and no callback is provided
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
            if(!callback)callback = function(err){ if(err) console.error(err) };
            buildfire._sendPacket(new Packet(null, 'localStorage.removeItem', key), callback);
            buildfire.getContext(function(err, context){
                if (err) {
                    callback(err);
                } else {
                    if(context && context.localStorage) {
                        delete context.localStorage[key];
                    }
                    else {
                        callback(null, "no context");
                    }
                }
            });
        }
        ,clear: function(callback){
            if(!callback)callback = function(err){ if(err) console.error(err) };
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
                        callback(null, "no context");
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
            buildfire.eventManager.trigger('NOTES_SEEK_TO', data, false)
        },
        getByItemId: function (options, callback) {
            buildfire._sendPacket(new Packet(null, 'notes.getByItemId', options), callback);
        }
    }
};

window.parsedQuerystring = buildfire.parseQueryString();
buildfire.fid = window.parsedQuerystring.fid;
buildfire.init();

buildfire.eventManager.add('deviceAppBackgrounded', function () {
    var stopVideos=function (iframes, videos) {
        if (iframes) {
            for(var i = 0 ; i < iframes.length; i++) {
                if( iframes[i].src.indexOf("youtube.com")>-1){
                    if(iframes[i].src.indexOf("enablejsapi=1")==-1)
                        iframes[i].src = iframes[i].src+"?enablejsapi=1";
                    var youtube_command = window.JSON.stringify( { event: 'command', func: 'pauseVideo' } );
                    iframes[i].contentWindow.postMessage( youtube_command, 'https://www.youtube.com' );
                } else if (iframes[i].src.indexOf("vimeo.com")>-1) {
                    var vimeo_command = JSON.stringify( { method: "pause" } );
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
    var iframes=window.document.getElementsByTagName("iframe");
    var videos = window.document.getElementsByTagName("video");
    stopVideos(iframes, videos);

}, true);


document.addEventListener("DOMContentLoaded", function (event) {
    //buildfire.appearance.autosizeContainer();

    if(!buildfire.options.disableSelect){
        document.getElementsByTagName('body')[0].className += " noSelect";
    }

    buildfire.getContext(function (err, context) {
        if (err) {
            console.error(err);
        }
        else {
            if (context && context.debugTag)
                buildfire.logger.attachRemoteLogger(context.debugTag);
            if (window.location.pathname.indexOf('/widget/') > 0) {
                var disableTheme = (buildfire.options && buildfire.options.disableTheme) ? buildfire.options.disableTheme : false;
                var enableMDTheme = (buildfire.options && buildfire.options.enableMDTheme) ? buildfire.options.enableMDTheme  : false;

                if(!disableTheme && !enableMDTheme) {
                    if(buildfire.isWeb() || !context.liveMode)
                        buildfire.appearance.attachAppThemeCSSFiles(context.appId, context.liveMode, context.endPoints.appHost);
                    else
                        buildfire.appearance.attachLocalAppThemeCSSFiles(context.appId);
                }
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
        if(!buildfire.options.disableTheme)
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