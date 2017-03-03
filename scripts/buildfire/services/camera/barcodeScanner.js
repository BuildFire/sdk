/**
 * Created by danielhindi on 2/15/17.
 */


if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.camera) == "undefined") buildfire.services.camera = {};


buildfire.services.camera.barcodeScanner = {
    scan: function (options, callback) {
        if(!options)
            options={
                preferFrontCamera : false,
                showFlipCameraButton : true,
                showTorchButton : true,
                formats : "QR_CODE,PDF_417" // default: all but PDF_417 and RSS_EXPANDED
            };
        buildfire._sendPacket(new Packet(null,"barcodeScanner.scan",options),callback);
    }
};