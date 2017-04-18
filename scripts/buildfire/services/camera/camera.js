/**
 * Created by aymanhabeb on 16/4/17.
 */


if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.camera) == "undefined") buildfire.services.camera = {};

buildfire.services.camera.getPicture = function (options, callback) {
    if (!options)
        options = {};
    buildfire._sendPacket(new Packet(null, "camera.getPicture", options), callback);
};