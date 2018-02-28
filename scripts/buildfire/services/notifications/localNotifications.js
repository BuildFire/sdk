if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

//https://github.com/BuildFire/sdk/wiki/Buildfire-Local-Notifications-API
buildfire.notifications.localNotification = {
    _isDate: function(date){
        var isDate = (Object.prototype.toString.call(date) === "[object Date]") ? true: false;

        return isDate;
    },

    //--- options properties ---
    //title: string
    //text: string
    //data: object (optional), data that you want to persist for when the notification is clicked or triggered.
    //returnToPluginInstanceId string (optional)
    send: function (options, callback) {
        var packetId = null;
        var command = 'localNotifications.schedule';
        if(options.at && !window.buildfire.notifications.localNotification._isDate(options.at)){
            callback('Option "at" must be a Date type.', null);
            return;
        }
        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, callback);
    },
    //--- options properties ---
    //title: string
    //text: string
    //at: Date, representing the time to send the notification.
    //data: object (optional), data that you want to persist for when the notification is clicked or triggered.
    //returnToPluginInstanceId string (optional)
    schedule: function (options, callback) {
        var packetId = null;
        var command = 'localNotifications.schedule';
        if(options.at && !window.buildfire.notifications.localNotification._isDate(options.at)){
            callback('Option "at" must be a Date type.', null);
            return;
        }
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