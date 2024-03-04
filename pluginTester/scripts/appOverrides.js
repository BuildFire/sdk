/*
Use only for overriding postMaster.widgetPluginAPI or postMaster.servicePluginAPIs functions
to allow distinction between functions triggered from widget side or control side.

Don't minify or rename as the name "appOverrides.js" is detected in callstack to figure out the source
in any nested API function calls to handle issues from control plugin APIs and widget plugin APIs
living in one space (pluginTester)
 */
(function () {
	let forceOriginationFromAppOverride = function(object) {
		// Function to wrap each method in the object
		function wrapMethod(obj, methodName) {
			const originalMethod = obj[methodName];
			obj[methodName] = function() {
				return originalMethod.apply(this, arguments);
			};
		}

		// Wrap each method in the object
		for (const methodName in object) {
			if (typeof object[methodName] === 'function') {
				wrapMethod(object, methodName);
			}
		}
	}

	postMaster.widgetPluginAPI.auth = { ...authAPI };
	postMaster.servicePluginAPIs.service.auth = { ...authAPI };
	forceOriginationFromAppOverride(postMaster.widgetPluginAPI.auth);
	forceOriginationFromAppOverride(postMaster.servicePluginAPIs.service.auth);
})();




