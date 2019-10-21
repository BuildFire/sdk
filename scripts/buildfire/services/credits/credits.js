/**
 * Created by Rami Abdel Hadi on 5/25/2019.
 */
if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.credits) == "undefined") buildfire.services.credits = {};

/**
 * get bundles
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.getBundles = function (options, cb) {
    var packetId = null;
    var command = 'credits.getBundles';

    if (typeof (options) == "function") {
        cb = options;
        options = {};
    }

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * purchase a bundle.
 * @param {string} options.bundle_id - the bundle id which has been selected by the user
 * @param {string} options.memo
 * @param {string} options.xRef1
 * @param {string} options.xRef2
 * @param {string} options.xRef3
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.purchaseBundle = function (options, cb) {
    var packetId = null;
    var command = 'credits.purchaseBundle';

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
buildfire.services.credits.getUser = function (options, cb) {
    if (typeof (options) == 'function') {
        cb = options;
        options = {};
    }
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
buildfire.services.credits.consumeCredits = function (options, cb) {
    var packetId = null;
    var command = 'credits.consumeCredits';

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
buildfire.services.credits.transferCredits = function (options, cb) {
    var packetId = null;
    var command = 'credits.transferCredits';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.getUserTransactions = function (options, cb) {
    var packetId = null;
    var command = 'credits.searchTransactions';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.showTransactions = function (options, cb) {
    var packetId = null;
    var command = 'credits.showTransactions';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};