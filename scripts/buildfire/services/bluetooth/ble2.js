if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.bluetooth) == "undefined") buildfire.services.bluetooth = {};

buildfire.services.bluetooth.ble2 = {
	/////////////////////////////////////// SCANNING ///////////////////////////////////////
	scan: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.scan", options), callback);
	},
	startScan: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.startScan", options), callback);
	},
	startScanWithOptions: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.startScanWithOptions", options), callback);
	},
	stopScan: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.stopScan", options), callback);
	},

	onDeviceDiscovered: function (callback, allowMultipleHandlers) {
		buildfire.eventManager.add('ble2.onDeviceDiscovered', callback, allowMultipleHandlers);
	},
	triggerOnDeviceDiscovered: function (device) {
		buildfire.eventManager.trigger('ble2.onDeviceDiscovered', device);
	},
	///////////////////////////////////// CONNECTIONS //////////////////////////////////////
	connect: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.connect", options), callback);
	},
	autoConnect: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.autoConnect", options), callback);
	},
	isConnected: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.isConnected", options), callback);
	},
	connectedPeripheralsWithServices: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.connectedPeripheralsWithServices", options), callback);
	},
	onDeviceConnected: function (callback, allowMultipleHandlers) {
		buildfire.eventManager.add('ble2.onDeviceConnected', callback, allowMultipleHandlers);
	},
	triggerOnDeviceConnected: function (device) {
		buildfire.eventManager.trigger('ble2.onDeviceConnected', device);
	},

	disconnect: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.disconnect", options), callback);
	},
	onDeviceDisonnected: function (callback, allowMultipleHandlers) {
		buildfire.eventManager.add('ble2.onDeviceDisonnected', callback, allowMultipleHandlers);
	},
	triggerOnDeviceDisonnected: function (device) {
		buildfire.eventManager.trigger('ble2.onDeviceDisonnected', device);
	},
	////////////////////////////////////// READ/WRITE //////////////////////////////////////
	read: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.read", options), callback);
	},
	write: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.write", options), callback);
	},
	writeWithoutResponse: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.writeWithoutResponse", options), callback);
	},
	readRSSI: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.readRSSI", options), callback);
	},
	//////////////////////////////////// NOTIFICATIONS /////////////////////////////////////
	startNotification: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.startNotification", options), callback);
	},
	stopNotification: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.stopNotification", options), callback);
	},

	onNotification: function (callback, allowMultipleHandlers) {
		buildfire.eventManager.add('ble2.onNotification', callback, allowMultipleHandlers);
	},
	triggerOnNotification: function (device) {
		buildfire.eventManager.trigger('ble2.onNotification', device);
	},

	startStateNotifications: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.startStateNotifications", options), callback);
	},
	stopStateNotifications: function (options, callback) {
		buildfire._sendPacket(new Packet(null, "ble.stopStateNotifications", options), callback);
	},

	onStateNotification: function (callback, allowMultipleHandlers) {
		buildfire.eventManager.add('ble2.onStateNotification', callback, allowMultipleHandlers);
	},
	triggerOnStateNotification: function (device) {
		buildfire.eventManager.trigger('ble2.onStateNotification', device);
	}
};

if (buildfire._whitelistedCommands) {
	//////////////////////////////////// SCANNING /////////////////////////////////////
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.scan');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.startScan');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.startScanWithOptions');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.stopScan');

	buildfire._whitelistedCommands.push('services.bluetooth.ble2.triggerOnDeviceDiscovered');
	/////////////////////////////////// CONNECTIONS ///////////////////////////////////
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.connect');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.autoConnect');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.isConnected');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.connectedPeripheralsWithServices');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.disconnect');

	buildfire._whitelistedCommands.push('services.bluetooth.ble2.triggerOnDeviceConnected');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.triggerOnDeviceDisonnected');
	/////////////////////////////////// READ/WRITE ////////////////////////////////////
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.read');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.write');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.writeWithoutResponse');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.readRSSI');
	/////////////////////////////////// NOTIFICATIONS ////////////////////////////////////
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.startNotification');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.stopNotification');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.startStateNotifications');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.stopStateNotifications');

	buildfire._whitelistedCommands.push('services.bluetooth.ble2.triggerOnNotification');
	buildfire._whitelistedCommands.push('services.bluetooth.ble2.triggerOnStateNotification');
}