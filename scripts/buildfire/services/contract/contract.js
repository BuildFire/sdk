if (typeof (buildfire) === 'undefined') throw ('please add buildfire.js first to use BuildFire services');

if (typeof (buildfire.services) === 'undefined') buildfire.services = {};

buildfire.services.contract = {
	/**
	 * List the operations registered by a plugin's contract.
	 * Reads the target plugin's plugin.contract.json and returns its operations.
	 * @param {Object} options At least one of pluginId, instanceId, or folderName must be provided.
	 * @param {String} [options.pluginId] The id (type token) of the plugin that owns the contract.
	 * @param {String} [options.instanceId] Instance id to scope the lookup to a specific instance.
	 * @param {String} [options.folderName] The plugin's folder name. When provided, the app fetches the
	 *                                       contract directly and skips the instance lookup.
	 * @param {String} [options.host] Optional filter — return only operations whose host matches ("plugin" | "generic").
	 * @param {Function} callback Node-style callback (err, res) invoked with the list of operations.
	 */
	list: function (options, callback) {
		if (!callback || typeof (callback) !== 'function') {
			throw 'callback function is mandatory';
		}

		options = options || {};

		if (typeof (options) !== 'object') {
			return callback({ code: 'error', message: 'options must be an object' }, null);
		}

		if (!options.pluginId && !options.instanceId && !options.folderName) {
			return callback({ code: 'error', message: 'pluginId, instanceId, or folderName is required' }, null);
		}

		var packet = new Packet(null, 'contract.list', options);
		buildfire._sendPacket(packet, callback);
	},

	/**
	 * Invoke an operation by name. The app dispatches on the operation's declared "type":
	 *   type: "function"  → runs in the target plugin's iframe
	 *   type: "datastore" → runs in the app (builds the query from the operation's context)
	 * The caller does not need to know which; it just names the operation.
	 * @param {Object} options
	 * @param {String} options.instanceId The target plugin instance id (pins the specific instance whose
	 *                                     data/frame the operation runs against).
	 * @param {String} [options.fid] Optional — if you already prepared the frame via use(), pass its fid to
	 *                                run the function directly (skips instance lookup + contract fetch).
	 * @param {String} [options.pluginId] Optional plugin type token; passing it with folderName skips the instance lookup.
	 * @param {String} [options.folderName] Optional plugin folder name; passing it with pluginId skips the instance lookup.
	 * @param {String} options.functionName The operation to invoke.
	 * @param {Object} [options.options] Parameters passed to the operation.
	 * @param {Function} callback Node-style callback (err, res) invoked with the result.
	 */
	invoke: function (options, callback) {
		if (!callback || typeof (callback) !== 'function') {
			throw 'callback function is mandatory';
		}

		options = options || {};

		if (typeof (options) !== 'object') {
			return callback({ code: 'error', message: 'options must be an object' }, null);
		}

		if (!options.functionName) {
			return callback({ code: 'error', message: 'functionName is required' }, null);
		}

		if (!options.instanceId && !options.fid) {
			return callback({ code: 'error', message: 'instanceId or fid is required' }, null);
		}

		var packet = new Packet(null, 'contract.invoke', options);
		buildfire._sendPacket(packet, callback);
	},

	/**
	 * Prepare (create or reuse) a server plugin frame ahead of time, so a later invoke of a
	 * function-type operation on that instance runs against an already-loaded frame.
	 * @param {Object} options
	 * @param {String} options.instanceId The instance id of the server plugin to prepare.
	 * @param {Function} callback Node-style callback (err, data) where data holds the frame handle (e.g. { fid }).
	 */
	use: function (options, callback) {
		if (!callback || typeof (callback) !== 'function') {
			throw 'callback function is mandatory';
		}

		options = options || {};

		if (typeof (options) !== 'object') {
			return callback({ code: 'error', message: 'options must be an object' }, null);
		}

		if (!options.instanceId) {
			return callback({ code: 'error', message: 'instanceId is required' }, null);
		}

		var packet = new Packet(null, 'contract.use', options);
		buildfire._sendPacket(packet, callback);
	},

	/**
	 * Destroy a server plugin frame previously created (via use, or on demand by invoke),
	 * tearing down its iframe and freeing its resources.
	 * @param {Object} options Identifies the frame to destroy: { fid } and/or { instanceId }.
	 * @param {Function} [callback] Node-style callback (err, res).
	 */
	destroy: function (options, callback) {
		options = options || {};

		if (typeof (options) !== 'object') {
			if (callback) return callback({ code: 'error', message: 'options must be an object' }, null);
			return;
		}

		if (!options.fid && !options.instanceId) {
			if (callback) return callback({ code: 'error', message: 'fid or instanceId is required' }, null);
			return;
		}

		var packet = new Packet(null, 'contract.destroy', options);
		buildfire._sendPacket(packet, callback);
	},

	/* --------------------------------------------------------------------------
	 * Server side: a plugin that EXPOSES a contract implements its operations on
	 * window.widgetContract (in plugin.contract.js). These two handlers are the thin
	 * receiver the app posts into the loaded frame — _ping to know the frame is ready,
	 * _runFunction to run the requested method and relay its callback to the caller.
	 * ------------------------------------------------------------------------ */

	/**
	 * Readiness probe. The app pings a freshly loaded server frame until this responds,
	 * so a function call is never posted before the frame's SDK is ready.
	 */
	_ping: function (options, callback) {
		if (callback) callback(null, { ready: true });
	},

	/**
	 * Invoked by the app to run one of this plugin's contract operations.
	 * Just calls window.widgetContract[functionName](params, callback) and lets the
	 * plugin's own callback flow back to the caller.
	 * @param {Object} options { functionName, options } — the function to run and its params.
	 * @param {Function} callback Node-style callback relayed back to the caller plugin.
	 */
	_runFunction: function (options, callback) {
		options = options || {};
		if (!callback) callback = function () {};
		if (!options.functionName) {
			return callback('functionName is required');
		}
		var operations = (typeof (window) !== 'undefined' && window.widgetContract) ? window.widgetContract : {};
		var handler = operations[options.functionName];
		if (typeof (handler) !== 'function') {
			return callback('contract function "' + options.functionName + '" is not implemented on Widget Contract');
		}
		try {
			handler(options.options || {}, callback);
		} catch (e) {
			callback('error executing contract function: ' + (e && e.message ? e.message : e));
		}
	},

	/* --------------------------------------------------------------------------
	 * Events: the "events" a plugin declares in its plugin.contract.json are the triggers
	 * automations (workflows) listen for. A plugin announces one with events.send; the app
	 * finds the workflows listening for it, tests their conditions, fills their
	 * "{{eventData.x}}" references and runs their actions.
	 * ------------------------------------------------------------------------ */
	events: {
		/**
		 * List the events a plugin declares in its plugin.contract.json.
		 * @param {Object} options At least one of pluginId, instanceId, or folderName must be provided.
		 * @param {String} [options.pluginId] The id (type token) of the plugin that owns the contract.
		 * @param {String} [options.instanceId] Instance id of the plugin.
		 * @param {String} [options.folderName] The plugin's folder name; skips the instance lookup.
		 * @param {Function} callback Node-style callback (err, events) — [{ name, displayName, description, data }].
		 */
		list: function (options, callback) {
			if (!callback || typeof (callback) !== 'function') {
				throw 'callback function is mandatory';
			}

			options = options || {};

			if (typeof (options) !== 'object') {
				return callback({ code: 'error', message: 'options must be an object' }, null);
			}

			if (!options.pluginId && !options.instanceId && !options.folderName) {
				return callback({ code: 'error', message: 'pluginId, instanceId, or folderName is required' }, null);
			}

			var packet = new Packet(null, 'contract.listEvents', options);
			buildfire._sendPacket(packet, callback);
		},

		/**
		 * Announce that one of this plugin's declared events happened. Call it only after the action succeeded.
		 * The event is attributed to the sending instance; the workflows listening for it run in the app.
		 * @param {String} eventName The event's name, exactly as declared in plugin.contract.json.
		 * @param {Object} [data] The event payload, matching the event's declared "data" block.
		 * @param {Function} [callback] Node-style callback (err, results) — one { workflowId, status } per workflow run.
		 */
		send: function (eventName, data, callback) {
			if (typeof (data) === 'function') {
				callback = data;
				data = {};
			}

			if (!eventName || typeof (eventName) !== 'string') {
				if (callback) return callback({ code: 'error', message: 'eventName is required' }, null);
				return;
			}

			if (data !== undefined && data !== null && typeof (data) !== 'object') {
				if (callback) return callback({ code: 'error', message: 'data must be an object' }, null);
				return;
			}

			var packet = new Packet(null, 'contract.sendEvent', { eventName: eventName, data: data || {} });
			buildfire._sendPacket(packet, callback);
		}
	}

};
