/**
 * Created by danielhindi on 1/30/16.
 * ref: https://github.com/BuildFire/sdk/wiki/Low-Energy-Bluetooth-Service
 */

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.bluetooth) == "undefined") buildfire.services.bluetooth = {};


buildfire.services.bluetooth.ble = {

    onConnect:function(){},
    onDisconnect:function(){},
    connect: function (deviceId, callback) {
       buildfire._sendPacket(new Packet(null,"bluetooth.connect",{deviceId:deviceId}),callback);
    },
    disconnect: function (callback) {
        buildfire._sendPacket(new Packet(null,"bluetooth.disconnect"),callback);
    },
    listPairedDevices:function(callback){
        buildfire._sendPacket(new Packet(null,"bluetooth.listPairedDevices"),callback);
    },
    write: function (data, callback) {
        buildfire._sendPacket(new Packet(null,"bluetooth.write",{data:data}),callback);
    },
    available: function (callback) {
        buildfire._sendPacket(new Packet(null,"bluetooth.available",{deviceId:deviceId}),callback);
    },
    read: function (callback) {
        buildfire._sendPacket(new Packet(null,"bluetooth.read"),callback);
    },
    readUntil: function (terminator,callback) {
        buildfire._sendPacket(new Packet(null,"bluetooth.readUntil",{terminator:terminator}),callback);
    },
    _onSubscribeData: null,
    subscribe: function (delimiter,callback) {
        this._onSubscribeData = callback;
        buildfire._sendPacket(new Packet(null,"bluetooth.subscribe",{delimiter:delimiter}));
    },
    unsubscribe: function (callback) {
        buildfire._sendPacket(new Packet(null,"bluetooth.unsubscribe"),callback);
    },
    clear: function (callback) {
        buildfire._sendPacket(new Packet(null,"bluetooth.clear"),callback);
    },
    isConnected: function (callback) {
        buildfire._sendPacket(new Packet(null,"bluetooth.isConnected"),callback);
    },
    isEnabled: function (callback) {
        buildfire._sendPacket(new Packet(null,"bluetooth.isEnabled"),callback);
    }
};

if(buildfire._whitelistedCommands) {
    buildfire._whitelistedCommands.push('services.bluetooth.ble.onConnect');
    buildfire._whitelistedCommands.push('services.bluetooth.ble.onDisconnect');
    buildfire._whitelistedCommands.push('services.bluetooth.ble._onSubscribeData');
}