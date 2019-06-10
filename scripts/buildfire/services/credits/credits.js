/**
 * Created by Rami Abdel Hadi on 5/25/2019.
 */
if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.credits) == "undefined") buildfire.services.credits = {};

/**
 * add credit for user.
 * @param {string} options.public_key - A unique key for merchant public key.
 * @param {string} options.amount - An amount which the user paid through stripe
 * @param {string} options.provider - the payment provider "stripe"
 * @param {object} options.stripe - the stripe object which will contain the stripe token data
 * @param {object} options.stripe.source_token - the stripe source token which return back after the customer filled stripe popup
 * @param {object} options.bundle_id - the bundle id which has been selected by the user
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.add = function(options, cb){
    var packetId = null;
    var command = 'credits.add';
    debugger;
    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};


/**
* get merchant bundles
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
    debugger;
    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * get merchant bundles
 * @param {string} options.public_key - A unique key for merchant public key.
 * @param {string} options.apple_product_id - A unique key for apple product
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.addBundles = function(options, cb){
    var packetId = null;
    var command = 'credits.addBundles';
    debugger;
    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};



/**
 * get credit balance
 * @param {string} options.public_key - A unique key for merchant public key.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.getBalance = function(options, cb){
    var packetId = null;
    var command = 'credits.getBalance';
    debugger;
    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * get credit balance
 * @param {string} options.public_key - A unique key for merchant public key.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.addUser = function(options, cb){
    var packetId = null;
    var command = 'credits.addUser';
    debugger;
    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * get credit balance
 * @param {string} options.public_key - A unique key for merchant public key.
 * @param {string} options.amount - credit amount to be consume from the logged in user
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.credits.consume = function(options, cb){
    var packetId = null;
    var command = 'credits.consume';
    debugger;
    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};





/*buildfire.services.credits.add({
    "access_token": "q8cDMjg2GUj8LfVwkQTOuap0IBxWkKCvrqCEiIoVb0o=",
    "amount" : 50 ,
    "provider" : "stripe",
    "stripe" : {
        "source_token" : "tok_visa_debit"
    },
    "bundle_id" : "123",
    "public_key" : "123"
},function(err,result){debugger});*/


/*buildfire.services.credits.getBundles({
    "public_key" : "123"
},function(err,result){debugger});*/

/*buildfire.services.credits.getBalance({
    "public_key" : "123"
},function(err,result){debugger});*/

/*buildfire.services.credits.addUser({
    "public_key" : "123"
},function(err,result){debugger});*/

buildfire.services.credits.consume({
    "public_key" : "123",
    "credit_amount" : "5",
},function(err,result){debugger});
