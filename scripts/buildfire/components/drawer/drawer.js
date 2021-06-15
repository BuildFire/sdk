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

buildfire.components.drawer.open = function (options, callback) {
    if (options.listItems && options.tabs) {
        console.warn("Cannot use both listItems and tabs together, defaulting to listItems");
    }
    if (!options.multiSelection && options.multiSelectionActionButton) {
        console.warn("Cannot use multiSelectionActionButton when multiSelection is not enabled");
    }
    if (!options.multiSelection && options.allowSelectAll) {
        console.warn("Cannot use allowSelectAll when multiSelection is not enabled");
    }
    if (options.multiSelection && !options.listItems && options.tabs) {
        console.error('Cannot use multiSelection with tabs');
    }
    var p = new Packet(null, 'componentUI.openDrawer', options);
    buildfire._sendPacket(p, callback);
};

buildfire.components.drawer.openBottomDrawer = function (options, callback) {
    console.warn('The method (buildfire.components.drawer.openBottomDrawer) is deprecated. Please consider using (buildfire.components.drawer.open) instead');
    buildfire.components.drawer.open(options, callback);
}

buildfire.components.drawer.openBottomListDrawer = function (options, callback) {
    if (options && options.tabs) {
        options.tabs = undefined;
    }
    console.warn('The method (buildfire.components.drawer.openBottomListDrawer) is deprecated. Please consider using (buildfire.components.drawer.open) instead');
    buildfire.components.drawer.open(options, callback);
};

buildfire.components.drawer.openBottomTabDrawer = function (options, callback) {
    if (options && options.listItems) {
        options.listItems = undefined;
    }
    console.warn('The method (buildfire.components.drawer.openBottomTabDrawer) is deprecated. Please consider using (buildfire.components.drawer.open) instead');
    buildfire.components.drawer.open(options, callback);
};

buildfire.components.drawer.closeDrawer = function (callback) {
    var p = new Packet(null, 'componentUI.closeDrawer');
    buildfire._sendPacket(p, callback);
};
