/**
 * Created by danielhindi on 2/19/16.
 */
if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");


buildfire.notifications.localNotification = {
    send: function (options, callback) {
        var packetId = null;
        var command = 'localNotifications.send';
        var data = {
            id: options.id,
            title: options.title,
            text: options.text
        };

        var packet = new Packet(packetId, command, data);
        buildfire._sendPacket(packet, callback);
    }
    , schedule: function (options, callback) {
        var packetId = null;
        var command = 'localNotifications.schedule';
        //https://github.com/katzer/cordova-plugin-local-notifications/wiki/04.-Scheduling
        var data = {
            id: options.id,
            title: options.title,
            text: options.text,
            firstAt: options.firstAt
        };

        //firstAt: options.firstAt

        var packet = new Packet(packetId, command, data);
        buildfire._sendPacket(packet, callback);
    }
    , hasPermission: function (options, callback) {
    }
    , cancel: function (options, callback) {
    }
};