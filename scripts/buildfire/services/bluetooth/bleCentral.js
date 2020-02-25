if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.bluetooth) == "undefined") buildfire.services.bluetooth = {};

buildfire.services.bluetooth.bleCentral = {
	/////////////////////////////////////// SCANNING ///////////////////////////////////////
	scan: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.scan", options), callback);
	},
	startScan: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.startScan", options), callback);
	},
	startScanWithOptions: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.startScanWithOptions", options), callback);
	},
	stopScan: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.stopScan", options), callback);
	},

	onDeviceDiscovered: function (callback, allowMultipleHandlers) {
		buildfire.eventManager.add('bleCentral.onDeviceDiscovered', callback, allowMultipleHandlers);
	},
	triggerOnDeviceDiscovered: function (device) {
		buildfire.eventManager.trigger('bleCentral.onDeviceDiscovered', device);
	},
	///////////////////////////////////// CONNECTIONS //////////////////////////////////////
	connect: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.connect", options), callback);
	},
	autoConnect: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.autoConnect", options), callback);
	},
	isConnected: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.isConnected", options), callback);
	},
	connectedPeripheralsWithServices: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.connectedPeripheralsWithServices", options), callback);
	},
	onDeviceConnected: function (callback, allowMultipleHandlers) {
		buildfire.eventManager.add('bleCentral.onDeviceConnected', callback, allowMultipleHandlers);
	},
	triggerOnDeviceConnected: function (device) {
		buildfire.eventManager.trigger('bleCentral.onDeviceConnected', device);
	},

	disconnect: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.disconnect", options), callback);
	},
	onDeviceDisonnected: function (callback, allowMultipleHandlers) {
		buildfire.eventManager.add('bleCentral.onDeviceDisonnected', callback, allowMultipleHandlers);
	},
	triggerOnDeviceDisonnected: function (device) {
		buildfire.eventManager.trigger('bleCentral.onDeviceDisonnected', device);
	},
	////////////////////////////////////// READ/WRITE //////////////////////////////////////
	read: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.read", options), callback);
	},
	write: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.write", options), callback);
	},
	writeWithoutResponse: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.writeWithoutResponse", options), callback);
	},
	readRSSI: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.readRSSI", options), callback);
	},
	//////////////////////////////////// NOTIFICATIONS /////////////////////////////////////
	startNotification: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.startNotification", options), callback);
	},
	stopNotification: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.stopNotification", options), callback);
	},

	onNotification: function (callback, allowMultipleHandlers) {
		buildfire.eventManager.add('bleCentral.onNotification', callback, allowMultipleHandlers);
	},
	triggerOnNotification: function (device) {
		buildfire.eventManager.trigger('bleCentral.onNotification', device);
	},

	startStateNotifications: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.startStateNotifications", options), callback);
	},
	stopStateNotifications: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "bleCentral.stopStateNotifications", options), callback);
	},

	onStateNotification: function (callback, allowMultipleHandlers) {
		buildfire.eventManager.add('bleCentral.onStateNotification', callback, allowMultipleHandlers);
	},
	triggerOnStateNotification: function (device) {
		buildfire.eventManager.trigger('bleCentral.onStateNotification', device);
	}
};

if (buildfire._whitelistedCommands) {
	//////////////////////////////////// SCANNING /////////////////////////////////////
	buildfire._whitelistedCommands.push('services.bluetooth.bleCentral.triggerOnDeviceDiscovered');
	/////////////////////////////////// CONNECTIONS ///////////////////////////////////
	buildfire._whitelistedCommands.push('services.bluetooth.bleCentral.triggerOnDeviceConnected');
	buildfire._whitelistedCommands.push('services.bluetooth.bleCentral.triggerOnDeviceDisconnected');
	/////////////////////////////////// NOTIFICATIONS ////////////////////////////////////
	buildfire._whitelistedCommands.push('services.bluetooth.bleCentral.triggerOnNotification');
	buildfire._whitelistedCommands.push('services.bluetooth.bleCentral.triggerOnStateNotification');
}