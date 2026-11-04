if (typeof (buildfire) == 'undefined') throw ('please add buildfire.js first to use BuildFire services');

if (typeof (buildfire.services) == 'undefined') buildfire.services = {};

if (typeof (buildfire.services.communication) == 'undefined') buildfire.services.communication = {};

if (typeof (buildfire.services.communication.email) == 'undefined') buildfire.services.communication.email = {};

/**
 * Sends an email through the app's email account; credentials never reach the plugin or the app.
 * Recipients must be allowed by the app's recipient policy (by default any recipient; the app owner can restrict to addresses or domains).
 * @param {Object} options
 * @param {string|string[]} options.to - recipient addresses
 * @param {string|string[]} [options.cc]
 * @param {string|string[]} [options.bcc]
 * @param {string} [options.contentType='custom'] - 'custom' or 'template'
 * @param {Object} options.content - { subject, body } for custom (body is HTML), { templateId, templateData } for template
 * @param {Object[]} [options.attachments] - [{ filename, type, content }], content is base64
 * @param {string} [options.fromName] - overrides the app's sender name
 * @param {string} [options.replyTo] - overrides the app's reply-to address
 */

/**
 * @callback cb
 * @param {Object} error - { code, message }; recipientNotAllowed and invalidRecipient also have notAllowed and invalid
 * @param {Object} result - { sent, messageId, recipients, notAllowed, invalid } - notAllowed: skipped by the app's recipient policy; invalid: skipped as malformed
 */
buildfire.services.communication.email.send = function (options, cb) {
	var packetId = null;
	var command = 'communication.email.send';

	var packet = new Packet(packetId, command, options);
	buildfire._sendPacket(packet, cb);
};
