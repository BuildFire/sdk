if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.publicFiles) == "undefined")
    buildfire.services.publicFiles = {};

buildfire.services.publicFiles.upload = function(options,onProgress , callback) {
    buildfire.eventManager.clear('publicFilesOnProgress');
    var p = new Packet(null, 'publicFiles.upload', options);
    buildfire._sendPacket(p, callback);
};

buildfire.services.publicFiles._triggerOnProgress = function (data) {
    buildfire.eventManager.trigger('publicFilesOnProgress', data);
}