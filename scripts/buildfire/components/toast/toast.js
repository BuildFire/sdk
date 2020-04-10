'use strict';

if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use popup components';

if (typeof buildfire.components == 'undefined') buildfire.components = {};

if (typeof buildfire.components.toast == 'undefined') buildfire.components.toast = {};

buildfire.components.toast.showToastMessage = function(options, callback) {
	var p = new Packet(null, 'componentUI.showToastMessage', options);
	buildfire._sendPacket(p, callback);
};

buildfire.components.toast.closeToastMessage = function(options, callback) {
	var p = new Packet(null, 'componentUI.closeToastMessage', options);
	buildfire._sendPacket(p, callback);
};
