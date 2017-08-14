/**
 * Created by danielhindi on 6/9/17.
 * Ref: https://github.com/BuildFire/sdk/wiki/File-System-Services
 */
if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.fileSystem) == "undefined") buildfire.services.fileSystem = {};
if (typeof (buildfire.services.fileSystem.fileManager) == "undefined") buildfire.services.fileSystem.fileManager = {};

(function(){
    /*
     *   example:
     *   buildfire.services.fileSystem.fileManager.download({uri:"https://s3-us-west-2.amazonaws.com/pluginserver.prod/overrides/poc.html",path:"/test/me",fileName:"test.txt"}, function(err,r){window.result=r;}  );
     *   buildfire.services.fileSystem.fileManager.readFileAsText({path:"/test/me",fileName:"test.txt"}, function(err,r){ console.log("read",r,err);}  );
     *   buildfire.services.fileSystem.fileManager.deleteFile({path:"/test/me",fileName:"test.txt"}, function(err,r){ console.log("delete",r,err);}  );
     */

    var fm = buildfire.services.fileSystem.fileManager;

    /*
     * options= {
     *   uri // url to download
     *   , path // where to download it (remember this cant be anywhere on the device)
     *   , fileName // what to call the file
     * }
     * , callback // function
     */
    fm.download = function (options,  callback) {
        buildfire._sendPacket(new Packet(null,"fileManager.download",options),callback);
    };

    /*
     * options= {
     *    path // where is the file
     *   , fileName // whats the file name
     * }
     */
    fm.deleteFile = function (options,  callback) {
        buildfire._sendPacket(new Packet(null,"fileManager.deleteFile",options),callback);
    };

    /*
     * options= {
     *    path // where is the file
     *   , fileName // whats the file name
     * }
     */
    buildfire.services.fileSystem.fileManager.readFileAsText = function (options,  callback) {
        buildfire._sendPacket(new Packet(null,"fileManager.readFileAsText",options),callback);
    };

    /*
     * options= {
     *    path // where is the file
     *   , fileName // whats the file name
     *   , content // the string you want to save to the file
     *   , append // add to end
     * }
     */
    fm.writeFileAsText = function (options,  callback) {
        buildfire._sendPacket(new Packet(null,"fileManager.writeFileAsText",options),callback);
    };

})();
