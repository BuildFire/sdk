if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.publicFiles) == "undefined")
    buildfire.services.publicFiles = {};

buildfire.services.publicFiles.showDialog = function(options,onProgress ,onComplete, callback) {
    buildfire.eventManager.clear('publicFilesOnProgress');
    buildfire.eventManager.clear('publicFilesOnComplete');

    if (typeof onProgress == "function") {
        buildfire.eventManager.add('publicFilesOnProgress', function (data) {
            onProgress(data);
        }, false);
    }

    if (typeof onComplete == "function") {
        buildfire.eventManager.add('publicFilesOnComplete', function (data) {
            onComplete(data);
        }, false);
    }

    var p = new Packet(null, 'publicFiles.showDialog', options);
    buildfire._sendPacket(p, callback);
};

buildfire.services.publicFiles._triggerOnProgress = function (data) {
    buildfire.eventManager.trigger('publicFilesOnProgress', data);
}

buildfire.services.publicFiles._triggerOnComplete = function (data) {
    buildfire.eventManager.trigger('publicFilesOnComplete', data);
}