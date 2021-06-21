/**
 * Created by AhmadFHamed on 7/23/2019.
 * Ref: https://github.com/BuildFire/sdk/wiki/Stripe-Services
 */
if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.services) == "undefined") buildfire.services = {};

if (typeof (buildfire.services.stripe) == "undefined") buildfire.services.stripe = {};

/**
 * charge dynamic products using stripe checkout.
 * @param {Object} options.
 * @param {Array.<Object>} options.items - a list of items.
 * @param {string} options.items[].name - The name for the line item.
 * @param {number} options.items[].amount - The amount to be collected per unit of the line item.
 * @param {string} [options.items[].description] - The description for the line item.
 * @param {string} [options.items[].currency = "usd"] - Three-letter ISO currency code, in lowercase. Must be a supported, for more details check [https://stripe.com/docs/currencies].
 * @param {number} [options.items[].quantity = 1] - The quantity of the line item being purchased.
 * @param {string} [options.submitType] - Describes the type of transaction being performed by Checkout in order to customize relevant text on the page, such as the submit button. Supported values are "auto, book, donate, or pay".
 * @param {string} [options.customerId] - ID of an existing customer, if one exists. If blank, Checkout will create a new customer object based on information provided during the session. The email stored on the customer will be used to prefill the email field on the Checkout page. If the customer changes their email on the Checkout page, the Customer object will be updated with the new email.
 * @param {string} [options.customerEmail] - If provided, this value will be used when the Customer object is created. If not provided, customers will be asked to enter their email address. Use this parameter to prefill customer data if you already have an email on file. To access information about the customer once a session is complete, use the customer field.
 * @param {string} [params.captureMethod=automatic] - Controls when the funds will be captured from the customer’s account. Possible enum values [automatic, manual].
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
 * @param {number} [options.items[].quantity = 1] - Quantity for this item.
 * @param {number} [options.trialPeriodDays] - The number of trial period days before the customer is charged for the first time.
 * @param {string} [options.customerId] - ID of an existing customer, if one exists. If blank, Checkout will create a new customer object based on information provided during the session. The email stored on the customer will be used to prefill the email field on the Checkout page. If the customer changes their email on the Checkout page, the Customer object will be updated with the new email.
 * @param {string} [options.customerEmail] - If provided, this value will be used when the Customer object is created. If not provided, customers will be asked to enter their email address. Use this parameter to prefill customer data if you already have an email on file. To access information about the customer once a session is complete, use the customer field.
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
 * @param {number} [options.items[].quantity = 1] - The quantity of the line item being purchased.
 * @param {string} [options.submitType] - Describes the type of transaction being performed by Checkout in order to customize relevant text on the page, such as the submit button. Supported values are "auto, book, donate, or pay".
 * @param {string} [options.customerEmail] - If provided, this value will be used when the Customer object is created. If not provided, customers will be asked to enter their email address. Use this parameter to prefill customer data if you already have an email on file. To access information about the customer once a session is complete, use the customer field.
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

/**
 * get stripe subscription details.
 * @param {Object} options.
 * @param {string} options.subscriptionId - stripe subscription id.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.getSubscription = function (options, cb) {
    var packetId = null;
    var command = 'stripe.getSubscription';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * cancel stripe subscription.
 * @param {Object} options.
 * @param {string} options.subscriptionId - stripe subscription id.
 * @param {string} options.customerId - stripe customer id.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.cancelSubscription = function (options, cb) {
    var packetId = null;
    var command = 'stripe.cancelSubscription';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * add customer card.
 * @param {Object} options.
 * @param {string} options.customerId - stripe customer id.
 * @param {string} [options.customerEmail] - If provided, this value will be used when the Customer object is created. If not provided, customers will be asked to enter their email address. Use this parameter to prefill customer data if you already have an email on file. To access information about the customer once a session is complete, use the customer field.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.addCustomerCard = function (options, cb) {
    var packetId = null;
    var command = 'stripe.addCustomerCard';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * capture payment.
 * @param {Object} options.
 * @param {string} options.paymentIntentsId - stripe payment intents id.
 * @param {number} [options.amountToCapture] - The amount to capture from the PaymentIntent, which must be less than or equal to the original amount. Any additional amount will be automatically refunded. Defaults to the full.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.capturePayment = function (options, cb) {
    var packetId = null;
    var command = 'stripe.capturePayment';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};

/**
 * capture payment.
 * @param {Object} options.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 * @param {string} response.status - Account status, values ['pending', 'active'].
 * @param {Boolean} response.isActive - Account activity status.
 * @param {string} response.bfStripeConnectToken - Buildfire Stripe connect token, this should be saved in your database.
 */
buildfire.services.stripe.connect.account = function (options, cb) {
    var packetId = null;
    var command = 'stripe.connect.account';

    var packet = new Packet(packetId, command, options);
    buildfire._sendPacket(packet, cb);
};