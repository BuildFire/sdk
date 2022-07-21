/**
 * Created by aymanhabeb on 16/4/17.
 */


if (typeof (buildfire) == 'undefined') throw ('please add buildfire.js first to use BuildFire services');

if (typeof (buildfire.services) == 'undefined') buildfire.services = {};

if (typeof (buildfire.services.camera) == 'undefined') buildfire.services.camera = {};

buildfire.services.camera.getPicture = function (options, callback) {
	if (!options) options = {};
	buildfire._sendPacket(new Packet(null, 'camera.getPicture', options), callback);
};

buildfire.services.camera.getVideo = function (options, callback) {
	if (!options) options = {};
	buildfire._sendPacket(new Packet(null, 'camera.getVideo', options), callback);
};

buildfire.services.camera.requestAuthorization = function (options, callback) {
	if (!callback) {
		throw 'callback function is mandatory';
	}
	buildfire._sendPacket(new Packet(null, 'camera.requestAuthorization', {}), callback);
};

buildfire.services.camera.isAuthorized = function (options, callback) {
	if (!callback) {
		throw 'callback function is mandatory';
	}
	buildfire._sendPacket(new Packet(null, 'camera.isAuthorized', {}), callback);
};
