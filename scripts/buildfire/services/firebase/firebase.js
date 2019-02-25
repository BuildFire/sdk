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
        var command = 'firebase.createCustomToken';

        var packet = new Packet(packetId, command, options);
        buildfire._sendPacket(packet, callback);
    },
    getRootPath: function (options, callback) {
        if (typeof (options) === "function") {
            callback = options;
            options = undefined;
        }
        if (!options)
            options = {};

        function getRoot() {
            //buildfireApps/{appId}/{pluginId}/{instanceId}/
            var rootPath = 'buildfireApps/' + buildfire.services.firebase._context.appId + '/';
            switch (options.scope) {
                case "app":
                    break;
                case "plugin":
                    rootPath = rootPath + buildfire.services.firebase._context.pluginId + '/';
                    break;
                case "instance":
                default:
                    rootPath = rootPath + buildfire.services.firebase._context.pluginId + '/' + buildfire.services.firebase._context.instanceId + '/';
                    break;
            }
            callback(null, rootPath);
        }

        if (buildfire.services.firebase._context) {
            getRoot();
        } else {
            buildfire.getContext(function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    if (result && result.appId) {
                        buildfire.services.firebase._context = result;
                        getRoot();
                    } else {
                        callback({message: "Invalid appId"});
                    }
                }
            });
        }
    },
    getCollectionPath: function (options, callback) {
        if (typeof (options) === "function") {
            callback = options;
            options = undefined;
        }
        if (!options)
            options = {};
        buildfire.services.firebase.getRootPath(options, function (err, rootPath) {
            if (err) {
                if (callback)
                    callback(err);
            } else {
                if (rootPath) {
                    callback(null, rootPath + (options.collectionName ? options.collectionName : ''));
                } else {
                    callback({message: "Invalid appId"});
                }
            }
        });
    }
};

//call the getRoot to cache the context and be ready on first load
buildfire.services.firebase.getRootPath(function (err, result) {
//do nothing
});