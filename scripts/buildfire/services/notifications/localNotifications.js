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

        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, callback);
    }
    , schedule: function (options, callback) {
        var packetId = null;
        var command = 'localNotifications.schedule';

        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, callback);
    }
    , hasPermission: function (options, callback) {
    }
    , cancel: function (options, callback) {
    }
    , onClick: function(options, callback){
        alert('Back');
        debugger;
    }
};