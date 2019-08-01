/**
 * Created by AhmadFHamed on 7/23/2019.
 * Ref: https://github.com/BuildFire/AWSGatewayPublicAPI/wiki/Stripe-checkout-integration
 */
if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.stripe) == "undefined") buildfire.services.stripe = {};

/**
 * charge dynamic products using stripe checkout.
 * @param {Object} options.
 * @param {Array.<Object>} options.items - a list of items.
 * @param {string} options.items[].name - The name for the line item.
 * @param {string} [options.items[].description] - The description for the line item.
 * @param {integer} options.items[].amount - The amount to be collected per unit of the line item.
 * @param {string} [options.items[].currency = "usd"] - Three-letter ISO currency code, in lowercase. Must be a supported, for more details check [https://stripe.com/docs/currencies].
 * @param {integer} [options.items[].quantity = 1] - The quantity of the line item being purchased.
 * @param {string} [options.submitType] - Describes the type of transaction being performed by Checkout in order to customize relevant text on the page, such as the submit button. Supported values are "auto, book, donate, or pay".
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.charge = function (options, cb) {
    var packetId = null;
    var command = 'stripe.charge';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * subscribe to specific stripe plan using stripe checkout.
 * @param {Object} options.
 * @param {Array.<Object>} options.items - a list of items.
 * @param {string} options.items[].planId - Plan ID for this item.
 * @param {integer} [options.items[].quantity = 1] - Quantity for this item.
 * @param {integer} [options.trialPeriodDays = 1] - The number of trial period days before the customer is charged for the first time. Has to be at least 1.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.subscribe = function (options, cb) {
    var packetId = null;
    var command = 'stripe.subscribe';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * purchase stripe products using stripe checkout.
 * @param {Object} options.
 * @param {Array.<Object>} options.items - a list of items.
 * @param {string} options.items[].sku - The ID of the SKU that the customer would like to purchase.
 * @param {integer} [options.items[].quantity = 1] - The quantity of the line item being purchased.
 * @param {string} [options.submitType] - Describes the type of transaction being performed by Checkout in order to customize relevant text on the page, such as the submit button. Supported values are "auto, book, donate, or pay".
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.purchase = function (options, cb) {
    var packetId = null;
    var command = 'stripe.purchase';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};