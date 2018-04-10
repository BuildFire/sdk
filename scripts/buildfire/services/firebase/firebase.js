/**
 * Created by Ayman on 4/4/2018.
 * Ref: https://github.com/BuildFire/sdk/wiki/Firebase
 */
if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

buildfire.services.firebase = {
    //--- options properties ---
    //integrationToken: string
    //forceLogin: bool, by default false
    createCustomToken: function (options, callback) {
        var packetId = null;
        var command = 'firebase.login';

        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, callback);
    }
};