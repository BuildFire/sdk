/**
 * Created by danielhindi on 1/19/17.
 * ref: https://github.com/BuildFire/sdk/wiki/iBeacon-Bluetooth-Services
 */



if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.bluetooth) == "undefined") buildfire.services.bluetooth = {};


buildfire.services.bluetooth.iBeacon = {
    createBeaconRegion: function(uuid,identifier,minor,major){
        var br = new Object();
        br.uuid = uuid;
        br.identifier = identifier;
        br.minor = minor;
        br.major = major;
        return br;
    }
    ,startMonitoring:function(beaconRegion, callback){
        var p = new Packet(null, 'iBeacon.startBeaconMonitor', beaconRegion);
        buildfire._sendPacket(p, callback);
    }
    ,stopMonitoring:function(beaconRegion, callback){
        var p = new Packet(null, 'iBeacon.stopBeaconMonitor', beaconRegion);
        buildfire._sendPacket(p, callback);
    }
    ,getMonitoredRegions: function (callback) {
        var p = new Packet(null, 'iBeacon.getMonitoredRegions');
        buildfire._sendPacket(p, callback);
    }

    ,startRanging:function(beaconRegion, callback){
        var p = new Packet(null, 'iBeacon.startBeaconRanging', beaconRegion);
        buildfire._sendPacket(p, callback);
    }
    ,stopRanging:function(beaconRegion, callback){
        var p = new Packet(null, 'iBeacon.stopBeaconRanging', beaconRegion);
        buildfire._sendPacket(p, callback);
    }
    ,getRangedRegions: function (callback) {
        var p = new Packet(null, 'iBeacon.getRangedRegions');
        buildfire._sendPacket(p, callback);
    }

    ,onRegionEntered: function(err,beaconRegion){
        console.log('iBeacon.onRegionEntered', JSON.stringify(beaconRegion));
    }
    ,onRegionExited: function(err,beaconRegion){
        console.log('iBeacon.onRegionExited', JSON.stringify(beaconRegion));
    }
    ,onRangingUpdate: function(err,beaconRegion){
        console.log('iBeacon.onRangingUpdate', JSON.stringify(beaconRegion));
    }

    ,isLocationEnabled: function (callback) {
        var p = new Packet(null, 'iBeacon.isLocationEnabled');
        buildfire._sendPacket(p, callback);
    }
    ,locationEnabled: function (result) {
        console.log('iBeacon.onLocationEnabledResult', result);
    }
    ,debugNotifications: {
        enable: function (callback) {
            var p = new Packet(null, 'iBeacon.debugNotifications.enable');
            buildfire._sendPacket(p, callback);
        },
        disable: function (callback) {
            var p = new Packet(null, 'iBeacon.debugNotifications.disable');
            buildfire._sendPacket(p, callback);
        }
    }
};

if(buildfire._whitelistedCommands) {
    buildfire._whitelistedCommands.push('services.bluetooth.iBeacon.onRegionEntered');
    buildfire._whitelistedCommands.push('services.bluetooth.iBeacon.onRegionExited');
    buildfire._whitelistedCommands.push('services.bluetooth.iBeacon.onRangingUpdate');

    buildfire._whitelistedCommands.push('services.bluetooth.iBeacon.locationEnabled');
    buildfire._whitelistedCommands.push('services.bluetooth.iBeacon.monitoredRegions');
}