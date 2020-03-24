'use strict';

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use popup components");

if (typeof (buildfire.components) == "undefined")
    buildfire.components = {};

if (typeof (buildfire.components.drawer) == "undefined")
    buildfire.components.drawer = {};

buildfire.components.drawer.openBottomDrawer = function (options, callback) {
    var p = new Packet(null, 'drawer.openBottomDrawer', options);
    buildfire._sendPacket(p, callback);
};