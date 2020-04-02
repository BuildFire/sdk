'use strict';

if (typeof (buildfire) == "undefined") {
    throw ("please add buildfire.js first to use popup components");
}

if (typeof (buildfire.components) == "undefined") {
    buildfire.components = {};
}

if (typeof (buildfire.components.drawer) == "undefined") {
    buildfire.components.drawer = {};
}

buildfire.components.drawer.openBottomDrawer = function (options, callback) {
    var p = new Packet(null, 'componentUI.openBottomDrawer', options);
    buildfire._sendPacket(p, callback);
};

buildfire.components.drawer.openBottomListDrawer = function (options, callback) {
    if (options && options.tabs) {
        options.tabs = undefined;
    }
    var p = new Packet(null, 'componentUI.openBottomDrawer', options);
    buildfire._sendPacket(p, callback);
};

buildfire.components.drawer.openBottomTabDrawer = function (options, callback) {
    if (options && options.listItems) {
        options.listItems = undefined;
    }
    var p = new Packet(null, 'componentUI.openBottomDrawer', options);
    buildfire._sendPacket(p, callback);
};

buildfire.components.drawer.closeDrawer = function (callback) {
    var p = new Packet(null, 'componentUI.closeDrawer');
    buildfire._sendPacket(p, callback);
};
