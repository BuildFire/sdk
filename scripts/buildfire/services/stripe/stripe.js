/**
 * Created by AhmadFHamed on 7/23/2019.
 * Ref: https://github.com/BuildFire/sdk/wiki/Stripe-Services
 */
if (typeof (buildfire) == 'undefined') throw ('please add buildfire.js first to use BuildFire services');

if (typeof (buildfire.services) == 'undefined') buildfire.services = {};

if (typeof (buildfire.services.stripe) == 'undefined') buildfire.services.stripe = {};

if (typeof (buildfire.services.stripe.connect) == 'undefined') buildfire.services.stripe.connect = {};

if (typeof (buildfire.services.stripe.invoice) == 'undefined') buildfire.services.stripe.invoice = {};

/**
 * charge dynamic products using stripe checkout.
 * @param {Object} options.
 * @param {Array.<Object>} options.items - a list of items.
 * @param {string} options.items[].name - The name for the line item.
 * @param {number} options.items[].amount - The amount to be collected per unit of the line item.
 * @param {string} [options.items[].description] - The description for the line item.
 * @param {string} [options.items[].currency = "usd"] - Three-letter ISO currency code, in lowercase. Must be a supported, for more details check [https://stripe.com/docs/currencies].
 * @param {number} [options.items[].quantity = 1] - The quantity of the line item being purchased.
 * @param {number} [params.items[].taxBehavior=unspecified] - Specifies whether the price is considered inclusive of taxes or exclusive of taxes. Possible enum values `["inclusive", "exclusive"]`. Once specify it cannot be changed. Required to specify it when enable `automatic tax`
 * @param {string} options.invoiceId - Invoice id, optional. If provided invoice items will be pulled from db in API level, no need to send any info of items here.
 * @param {string} [options.submitType] - Describes the type of transaction being performed by Checkout in order to customize relevant text on the page, such as the submit button. Supported values are "auto, book, donate, or pay".
 * @param {string} [options.customerId] - ID of an existing customer, if one exists. If blank, Checkout will create a new customer object based on information provided during the session. The email stored on the customer will be used to prefill the email field on the Checkout page. If the customer changes their email on the Checkout page, the Customer object will be updated with the new email.
 * @param {string} [options.customerEmail] - If provided, this value will be used when the Customer object is created. If not provided, customers will be asked to enter their email address. Use this parameter to prefill customer data if you already have an email on file. To access information about the customer once a session is complete, use the customer field.
 * @param {string} [params.captureMethod=automatic] - Controls when the funds will be captured from the customer’s account. Possible enum values [automatic, manual].
 * @param {boolean} [params.automaticTax=false] - Settings for automatic tax lookup for this session and resulting payments, invoices, and subscriptions. Set it to automaticTax=true to enable automatic taxes.
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
 * @param {Object} [options.metadata] - Set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format. Individual keys can be unset by posting an empty value to them. All keys can be unset by posting an empty value to metadata.
 * @param {boolean} [params.automaticTax=false] - Settings for automatic tax lookup for this session and resulting payments, invoices, and subscriptions. Set it to automaticTax=true to enable automatic taxes.
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
 * @param {string} options.items[].sku - The ID of the SKU that the customer would like to purchase. One of sku or price is required.
 * @param {string} params.items[].price - The ID of the Price object. One of price or sku is required.
 * @param {number} [options.items[].quantity = 1] - The quantity of the line item being purchased.
 * @param {string} [options.submitType] - Describes the type of transaction being performed by Checkout in order to customize relevant text on the page, such as the submit button. Supported values are "auto, book, donate, or pay".
 * @param {string} [options.customerEmail] - If provided, this value will be used when the Customer object is created. If not provided, customers will be asked to enter their email address. Use this parameter to prefill customer data if you already have an email on file. To access information about the customer once a session is complete, use the customer field.
 * @param {boolean} [params.automaticTax=false] - Settings for automatic tax lookup for this session and resulting payments, invoices, and subscriptions. to be enable should set it to true. just work with prices (use price instead of sku in item object)
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
 * add customer.
 * @param {Object} options.
 * @param {string} options.email - Customer’s email address. It’s displayed alongside the customer in your dashboard and can be useful for searching and tracking. This may be up to 512 characters.
 * @param {string} options.name - The customer’s full name or business name.
 * @param {string} options.description - An arbitrary string that you can attach to a customer object. It is displayed alongside the customer in the dashboard.
 * @param {string} options.metadata - Set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format. Individual keys can be unset by posting an empty value to them. All keys can be unset by posting an empty value to metadata.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 * @param {stripe} response.customer - Stripe customer id.
 */
buildfire.services.stripe.addCustomer = function (options, cb) {
	var packetId = null;
	var command = 'stripe.addCustomer';

	var packet = new Packet(packetId, command, options);
	buildfire._sendPacket(packet, cb);
};

/**
 * add customer card.
 * @param {Object} options.
 * @param {string} options.customerId - stripe customer id.
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
 * Add Stripe Connect account.
 * @param {Object} options.
 * @param {string} options.email - The email address of the account holder. This is only to make the account easier to identify to you. Stripe will never directly email Custom accounts.
 * @param {Object} options.metadata - Set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format. Individual keys can be unset by posting an empty value to them. All keys can be unset by posting an empty value.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 * @param {string} response.status - Account status, values ['pending', 'active'].
 * @param {Boolean} response.is_active - Account activity status.
 * @param {string} response.bf_stripe_connect_token - Buildfire Stripe connect token, this should be saved in your database.
 */
buildfire.services.stripe.connect.account = function (options, cb) {
	var packetId = null;
	var command = 'stripe.connect.account';

	var packet = new Packet(packetId, command, options);
	buildfire._sendPacket(packet, cb);
};

/**
 * Delete Stripe Connect account.
 * @param {Object} options.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.connect.deleteAccount = function (options, cb) {
	var packetId = null;
	var command = 'stripe.connect.deleteAccount';

	var packet = new Packet(packetId, command, options);
	buildfire._sendPacket(packet, cb);
};

/**
 * cancel payment.
 * @param {Object} options.
 * @param {string} options.paymentIntentsId - stripe payment intents id.
 * @param {string} [options.cancellationReason] - Reason for canceling this PaymentIntent. Possible values are duplicate, fraudulent, requested_by_customer, or abandoned.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.cancelPayment = function (options, cb) {
	var packetId = null;
	var command = 'stripe.cancelPayment';

	var packet = new Packet(packetId, command, options);
	buildfire._sendPacket(packet, cb);
};

/**
 * refund payment.
 * @param {Object} options.
 * @param {string} options.paymentIntentsId - ID of the PaymentIntent to refund.
 * @param {integer} [options.amount] - Default is entire charge. A positive integer in cents representing how much of this charge to refund. Can refund only up to the remaining, unrefunded amount of the charge.
 * @param {string} [options.reason] - The reason for the refund. If set, possible values are duplicate, fraudulent, and requested_by_customer. If you believe the charge to be fraudulent, specifying fraudulent as the reason will add the associated card and email to your block lists, and will also help us improve our fraud detection algorithms.
 * @param {Object} [options.metadata] - A set of key-value pairs that you can attach to a Refund object. This can be useful for storing additional information about the refund in a structured format. You can unset individual keys if you POST an empty value for that key. You can clear all keys if you POST an empty value for metadata.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.refundPayment = function (options, cb) {
	var packetId = null;
	var command = 'stripe.refundPayment';

	var packet = new Packet(packetId, command, options);
	buildfire._sendPacket(packet, cb);
};

/**
 * Create invoice.
 * @param {Object} options.
 * @param {Object} options.metadata - Metadata for invoice, like instanceId, pluginTypeId to be used in PN.
 * @param {Array.<Object>} options.items - a list of items.
 * 
 * Required properties:
 * @param {string} options.items[].itemId - Unique Id for item.
 * @param {string} options.items[].itemName - Item name.
 * @param {string} options.items[].itemType - Item type.
 * @param {number} options.items[].unitAmount - Item price amount.
 * 
 * Optional properties:
 * @param {string} options.items[].description - Item description.
 * @param {number} options.items[].quantity - Quantity to be purchased.
 * @param {string} options.items[].currency - "unitAmount" currency, default is "usd".
 * @param {Object} options.items[].metadata - Item metadata.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.invoice.create = function (options, cb) {
	var packetId = null;
	var command = 'stripe.invoice.create';

	var packet = new Packet(packetId, command, options);
	buildfire._sendPacket(packet, cb);
};


/**
 * Update invoice.
 * @param {Object} options.
 * @param {Object} options.metadata - Metadata for invoice, like instanceId, pluginTypeId to be used in PN.
 * @param {string} options.invoiceId - Invoice id.
 * @param {Array.<Object>} options.items - a list of items, this array of items will override the existed items array in db.
 * 
 * Required properties:
 * @param {string} options.items[].itemId - Unique Id for item.
 * @param {string} options.items[].itemName - Item name.
 * @param {string} options.items[].itemType - Item type.
 * @param {number} options.items[].unitAmount - Item price amount.
 * 
 * Optional properties:
 * @param {string} options.items[].description - Item description.
 * @param {number} options.items[].quantity - Quantity to be purchased.
 * @param {string} options.items[].currency - "unitAmount" currency, default is "usd".
 * @param {Object} options.items[].metadata - Item metadata.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.invoice.update = function (options, cb) {
	var packetId = null;
	var command = 'stripe.invoice.update';

	var packet = new Packet(packetId, command, options);
	buildfire._sendPacket(packet, cb);
};

/**
 * Get invoice by invoiceId.
 * @param {Object} options.
 * @param {string} options.invoiceId - Invoice id.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.invoice.get = function (options, cb) {
	var packetId = null;
	var command = 'stripe.invoice.get';

	var packet = new Packet(packetId, command, options);
	buildfire._sendPacket(packet, cb);
};

/**
 * Delete invoice.
 * @param {Object} options.
 * @param {string} options.invoiceId - Invoice id.
 */

/**
 * @callback cb
 * @param {Object} error
 * @param {Object} response
 */
buildfire.services.stripe.invoice.delete = function (options, cb) {
	var packetId = null;
	var command = 'stripe.invoice.delete';

	var packet = new Packet(packetId, command, options);
	buildfire._sendPacket(packet, cb);
};