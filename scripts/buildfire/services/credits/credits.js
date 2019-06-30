/**
 * Created by Rami Abdel Hadi on 5/25/2019.
 */
if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.credits) == "undefined") buildfire.services.credits = {};

/**
 * purchase a bundle.
 * @param {string} options.paymentProvider - the payment provider "stripe"
 * @param {object} options.stripe - the stripe object which will contain the stripe token data
 * @param {object} options.stripe.source_token - the stripe source token which return back after the customer filled stripe popup
 * @param {object} options.bundle_id - the bundle id which has been selected by the user
 * @param {object} options.memo -
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.purchaseBundle = function(options, cb){
    var packetId = null;
    var command = 'credits.purchaseBundle';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};


/**
* get bundles
* @param {string} options.public_key - A unique key for merchant public key.
*/

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.getBundles = function(options, cb){
    var packetId = null;
    var command = 'credits.getBundles';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * get user details
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.getUser = function(options, cb){
    var packetId = null;
    var command = 'credits.getUser';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * consume credit
 * @param {string} options.amount - credit amount to be consume from the logged in user
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.consumeCredit = function(options, cb){
    var packetId = null;
    var command = 'credits.consumeCredit';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.getUserHistroy = function(options, cb){
    var packetId = null;
    var command = 'credits.getUserHistroy';
    debugger;
    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};