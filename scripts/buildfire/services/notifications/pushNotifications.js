if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");
if (!buildfire.notifications) buildfire.notifications = {};

//https://github.com/BuildFire/sdk/wiki/Buildfire-Push-Notifications-API
buildfire.notifications.pushNotification = {
    //--- options properties ---
    //title: string
    //text: string
    //at: Date (optional), representing the time to send the push notification.
    //users: array (optional)
    //userTags: array (optional)
    //groupName: string (optional)
    //queryString: string (optional)
    schedule: function (options, callback) {
        var packetId = null;
        var command = 'pushNotifications.schedule';

        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, callback);
    },
    //--- properties ---
    //id: string, notification Id
    cancel: function (id, callback) {
        var packetId = null;
        var command = 'pushNotifications.cancel';

        var packet = new Packet(packetId, command, id);
        buildfire._sendPacket(packet, callback);
    },
    //--- options properties ---
    //groupName: string (optional)
    subscribe: function (options, callback) {
        var packetId = null;
        var command = 'pushNotifications.subscribe';

        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, callback);
    },
    //--- options properties ---
    //groupName: string (optional)
    unsubscribe: function (options, callback) {
        var packetId = null;
        var command = 'pushNotifications.unsubscribe';

        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, callback);
    }
};