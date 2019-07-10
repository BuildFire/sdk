'use strict';

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use popup components");

if (typeof (buildfire.components) == "undefined")
    buildfire.components = {};

if (typeof (buildfire.components.popup) == "undefined")
    buildfire.components.popup = {};

buildfire.components.popup.display = function (options, callback) {
    var p = new Packet(null, 'popup.display', options);
    buildfire._sendPacket(p, callback);
};