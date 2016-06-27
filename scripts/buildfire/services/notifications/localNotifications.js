/**
 * Created by danielhindi on 2/19/16.
 */

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

buildfire.notifications.localNotification = {
    schedule: function (options, callback) {
        var packetId = null;
        var command = 'localNotifications.schedule';

        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, callback);
    }
    , checkPermission: function (callback) {
        var packetId = null;
        var command = 'localNotifications.checkPermission';

        var packet = new Packet(packetId, command);
        buildfire._sendPacket(packet, callback);
    }, requestPermission: function (callback) {
        var packetId = null;
        var command = 'localNotifications.requestPermission';

        var packet = new Packet(packetId, command);
        buildfire._sendPacket(packet, callback);
    }
    , cancel: function (id, callback) {
        var packetId = null;
        var command = 'localNotifications.cancel';

        var packet = new Packet(packetId, command, id);
        buildfire._sendPacket(packet, callback);
    }
    , onClick: function(options){
        console.warn('Unhandled local notification on click event.');
    }
};