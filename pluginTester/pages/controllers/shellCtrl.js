/**
 * Created by Daniel on 7/10/2015.
 */


 $app.controller('shellCtrl', ['$rootScope', '$scope', '$routeParams', '$sce', '$http', function ($rootScope, $scope, $routeParams, $sce, $http) {
	window.$http = $http;
	var config = null;
	$scope.link = {
		deeplinkData: ''
	};
	$scope.currentUser = window.currentUser;

	const controlDefaultTheme = {
		appName: '',
		colors: {
			backgroundColor: '#ffffff',
			bodyText: '#5f5f5f',
			dangerTheme: '#f24965',
			defaultTheme: '#09a3ee',
			footerMenuBackgroundColor: '#ffffff',
			footerMenuIconColor: '#33b3f3',
			headerText: '#000000',
			icons: '#33b3f3',
			infoTheme: '#33b3f3',
			primaryTheme: '#00a1f1',
			successTheme: '#14cb5d',
			titleBar: '00a1f1',
			titleBarTextAndIcons: '#ffffff',
			warningTheme: '#ffcf40'
		},
		fontId : 'Lato',
		fontName: 'Lato'
	};

	$scope.loadFrames = function (pluginRoot, config) {
		postMaster.controlPluginAPI.getContext(null, function(err, controlContext){
			var context = JSON.parse(JSON.stringify(controlContext));
			context.widgetTheme = controlContext.appTheme; // don't change the original context
			context.appTheme = controlDefaultTheme;
			var contextQueryParameter = 'appcontext=' + encodeURIComponent(JSON.stringify(context));
			let lastTabName = sessionStorage.getItem($routeParams.pluginFolder); // Get the last tab opened in a specific plugin

			if (config.control.content.enabled) {
				$scope.contentSrc = pluginRoot + '/control/content/index.html?fid=controlContent&' + contextQueryParameter;
				if (lastTabName === 'content' || !$scope.currentControl) {
					$scope.currentControl = $scope.contentSrc;
					$scope.activeTab = 'content';
				}
			}
			
			if (config.control.cssInjection && config.control.cssInjection.enabled) {
				$scope.layoutsSrc = 'https://app.buildfire.com/pages/plugins/pluginControl/layouts/pluginLayouts.html';
				if (lastTabName === 'layouts' || !$scope.currentControl) {
					$scope.activeTab = 'layouts';
				}
			}

			if (config.control.design.enabled) {
				$scope.designSrc = pluginRoot + '/control/design/index.html?fid=controlDesign&' + contextQueryParameter;
				if (lastTabName === 'design' || !$scope.currentControl) {
					$scope.currentControl = $scope.designSrc;
					$scope.activeTab = 'design';
				}
			}

			if (config.control.settings.enabled) {
				$scope.settingsSrc = pluginRoot + '/control/settings/index.html?fid=controlSettings&' + contextQueryParameter;
				if (lastTabName === 'settings' || !$scope.currentControl) {
					$scope.currentControl = $scope.settingsSrc;
					$scope.activeTab = 'settings';
				}
			}

			$scope.pluginControlIframeVisible = true;

			if(config.control.customTabs && config.control.customTabs.length) {
				for(var i = 0 ; i < config.control.customTabs.length; i++) {
					var tab = config.control.customTabs[i];
					if(tab && tab.url) {
						if(tab.url.indexOf('//') != 0 && tab.url.indexOf('http://') != 0 && tab.url.indexOf('https://') != 0) {
							var root = pluginRoot + '/control/';
							// strip leading '/' if any
							var customTabUrl = tab.url.indexOf('/') == 0 ? tab.url.substr(1) : tab.url;
							var contextSeparator = customTabUrl.indexOf('?') > -1 ? '&' : '?';
							customTabUrl += contextSeparator + contextQueryParameter;
							tab.controlUrl = $sce.trustAsResourceUrl(root + customTabUrl);
						} else {
							tab.secureUrl = $sce.trustAsResourceUrl(tab.url);
						}
						if (lastTabName === tab.title) {
							$scope.loadCustomTab(tab);
						}
					}
				}
				$scope.customTabs = config.control.customTabs;
			}
			if(!$scope.currentControl && $scope.customTabs && $scope.customTabs.length) {
				$scope.currentControl = $scope.customTabs[0].controlUrl || $scope.customTabs[0].secureUrl;
				$scope.activeTab = $scope.customTabs[0].title;
			}

			if (!$scope.$$phase)
				$scope.$apply();
		});
	};

	$scope.loadIFrame = function (section, deeplinkData) {
		$scope.pluginControlIframeVisible = true;
		var pluginFolder = $routeParams.pluginFolder;
		if (!pluginFolder) pluginFolder = window.appContext.currentPlugin.pluginPath;

		postMaster.controlPluginAPI.getContext(null, function(err, controlContext){
			var context = JSON.parse(JSON.stringify(controlContext));
			context.widgetTheme = controlContext.appTheme; // don't change the original context
			context.appTheme = controlDefaultTheme;
			var contextQueryParameter = 'appcontext=' + encodeURIComponent(JSON.stringify(context));
			$scope.currentControl = $scope.pluginConfig.webpack
				?  window.location.protocol + '//' + window.location.hostname + ':' + config.webpack + '/control/' + section + '/index.html?fid=control&' + contextQueryParameter
				: '../plugins/' + pluginFolder + '/control/' + section + '/index.html?fid=control&' + contextQueryParameter;

			if (deeplinkData) {
				$scope.currentControl += `&dld=${encodeURIComponent(JSON.stringify(deeplinkData))}`;
			}

			$scope.activeTab = section;
			sessionStorage.setItem(pluginFolder, section);
			if (!$scope.$$phase)$scope.$digest();
		});
	};

	$scope.loadCustomTab = function (tab, deeplinkData) {
		var pluginFolder = $routeParams.pluginFolder;
		if (!pluginFolder) pluginFolder = window.appContext.currentPlugin.pluginPath;

		if(tab.controlUrl) {
			$scope.pluginControlIframeVisible = true;
			$scope.currentControl = tab.controlUrl;
			if (deeplinkData) {
				$scope.currentControl += `&dld=${encodeURIComponent(JSON.stringify(deeplinkData))}`;
			}
		} else {
			$scope.pluginControlIframeVisible = false;
			$scope.currentNonControl = tab.secureUrl;
			if (deeplinkData) {
				$scope.currentNonControl += `&dld=${encodeURIComponent(JSON.stringify(deeplinkData))}`;
			}
		}

		$scope.activeTab = tab.title;
		sessionStorage.setItem(pluginFolder, tab.title);

		if (!$scope.$$phase) $scope.$apply();
	};

	/****************keep track of recent plugins *****/
	function keepTrackOfRecentPlugins(pluginFolder) {

		window.localStorage.setItem('lastPlugin', pluginFolder);
		var recentPlugins = localStorage.getItem('__recentPlugins');
		if (recentPlugins) {
			try {
				recentPlugins = JSON.parse(recentPlugins);
			}
			catch (e) {
			}
		}
		if (!(recentPlugins && recentPlugins.length))
			recentPlugins = [];
		if (pluginFolder) {
			var index = recentPlugins.indexOf(pluginFolder);
			if (index > 0)
				recentPlugins.splice(index, 1);

			if (index != 0)
				recentPlugins.unshift(pluginFolder);

			if (recentPlugins.length > 5) // lust keep the last 5
				recentPlugins.pop();
		}
		$scope.recentPlugins = recentPlugins;
		localStorage.setItem('__recentPlugins', JSON.stringify(recentPlugins));
	}

	$scope.init = function () {
		var pluginFolder = $routeParams.pluginFolder;
		if (!pluginFolder) pluginFolder = window.appContext.currentPlugin.pluginPath;

		var xmlhttp = new XMLHttpRequest();
		var url = '../plugins/' + pluginFolder + '/plugin.json';

		xmlhttp.onreadystatechange = function () {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				config = JSON.parse(xmlhttp.responseText);
				$scope.pluginConfig = config;
				$scope.$apply();

				if (config.webpack) {
					let pluginRoot = window.location.protocol + '//' + window.location.hostname + ':' + config.webpack;
					$scope.loadFrames(pluginRoot, config);
				} else {
					let pluginRoot = '../plugins/' + pluginFolder;
					$scope.loadFrames(pluginRoot, config);
				}

				$scope.navToValue = $scope.pluginFolder = pluginFolder;
				keepTrackOfRecentPlugins(pluginFolder);
			}
			else if (xmlhttp.status >= 300)
				$scope.errorMessage = 'Error loading plugin';

			if (!$scope.$$phase)    $scope.$apply();
		};

		xmlhttp.open('GET', url, true);
		xmlhttp.send();


	};

	$scope.scrollTabs = function (type) {
		var moveBy = document.querySelectorAll('#pluginControlHeaderTabs ul li')[0].clientWidth;
		switch (type) {
		case 'left':
			// document.querySelector("#pluginControlHeaderTabs").scrollBy(-1 * moveBy,0);

			document.querySelector('#pluginControlHeaderTabs').scrollBy({
				top: 0, // could be negative value
				left: -1 * moveBy,
				behavior: 'smooth'
			});
			break;

		case 'right':
			// document.querySelector("#pluginControlHeaderTabs").scrollBy(moveBy,0);
			document.querySelector('#pluginControlHeaderTabs').scrollBy({
				top: 0, // could be negative value
				left: moveBy,
				behavior: 'smooth'
			});

			break;
		}
	};

	$scope.init();

	$scope.navigateToTab = ({ tabTitle, deeplinkData }, callback) => {
		if (!tabTitle) return callback('Tab title shouldn\'t be empty');
		if (typeof tabTitle !== 'string') return callback('Tab title should be a string');
		const title = tabTitle.toLowerCase().trim();

		if (title === 'content' || title === 'design' || title === 'settings') {
			$scope.loadIFrame(title, deeplinkData);
		}
		else {
			const customTab = $scope.customTabs.find(tab => tab.title.toLowerCase().trim() === title);
			if (!customTab) return callback(`Tab with title ${title} not found`);
			$scope.loadCustomTab(customTab, deeplinkData);
		}

		// Success
		callback();
	};

	$scope.navTo = function ($event) {

		if ($event.keyCode == 13)
			window.location.hash = '/plugin/' + $scope.navToValue;
	};

	if (postMaster.controlPluginAPI) {
		postMaster.controlPluginAPI.spinner.show = function () {
			$scope.showSpinner = true;
			$scope.$apply();
		};
		postMaster.controlPluginAPI.spinner.hide = function () {
			$scope.showSpinner = false;
			$scope.$apply();
		};

		postMaster.controlPluginAPI.auth = { ...postMaster.controlPluginAPI.auth };
		postMaster.controlPluginAPI.auth.getCurrentUser = function (data, callback) {
			if (typeof(data) == 'function') {
				callback = data;
			}
			var user = authAPI.secondaryUserLookup();
			if(!user){
				user = localStorage.getItem('user');
				user = JSON.parse(user);

			}
			if (!(user && user.userToken)) {
				user = null;
			}
			if (callback)
				callback(null, user);
			else
				return user;
		};

		postMaster.controlPluginAPI.deepLink.setData = function (obj, callback) {
			var url = 'app' + window.appContext.currentApp.appId.substring(0, 6) + '://plugin/' + window.appContext.currentPlugin.instanceId;
			if (obj.data) {
				var updateQueryStringParameter = function(uri, key, value) {
					var re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
					var separator = uri.indexOf('?') !== -1 ? '&' : '?';
					if (uri.match(re)) {
						return uri.replace(re, '$1' + encodeURIComponent(key) + '=' + encodeURIComponent(value) + '$2');
					} else {
						return uri + separator + encodeURIComponent(key) + '=' + encodeURIComponent(value);
					}
				};
				url = updateQueryStringParameter(url, 'dld', JSON.stringify(obj.data));
			}
			callback(null, url);
		};

		// This will allow us to navigate through CP tabs using the SDK
		if (!postMaster.controlPluginAPI.navigation) {
			postMaster.controlPluginAPI.navigation = {};
		}

		postMaster.controlPluginAPI.navigation.navigateToTab = (options, callback) => {
			$scope.navigateToTab(options, callback);
		};
	}
}]
);

