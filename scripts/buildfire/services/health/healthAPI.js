'use strict';

if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use BuildFire services';

if (typeof buildfire.services == 'undefined') buildfire.services = {};

if (typeof buildfire.services.health == 'undefined') buildfire.services.health = {};

buildfire.services.health = {
	requestAuthorization: function (dataTypes, callback) {
		var p = new Packet(null, 'health.requestAuthorization', dataTypes);
		buildfire._sendPacket(p, callback);
	},
	query: function (options, callback) {
		var p = new Packet(null, 'health.query', options);
		buildfire._sendPacket(p, callback);
	},
	queryAggregated: function (options, callback) {
		var p = new Packet(null, 'health.queryAggregated', options);
		buildfire._sendPacket(p, callback);
	},
	getAvailableDataTypes: function (options, callback) {
		if (!callback) throw 'callback function is mandatory';
		var p = new Packet(null, 'health.getAvailableDataTypes', options);
		buildfire._sendPacket(p, callback);
	},
};
