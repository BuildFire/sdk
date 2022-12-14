'use strict';

if (typeof (buildfire) == 'undefined') throw ('please add buildfire.js first to use BuildFire services');

if (typeof (buildfire.services) == 'undefined') buildfire.services = {};

if (typeof (buildfire.services.commerce) == 'undefined') buildfire.services.commerce = {};

buildfire.services.commerce.inAppPurchase = {
	purchase: function (productId, callback) {
		if (!productId) {
			console.error('no product id');
		}

		var p = new Packet(null, 'inAppPurchase.purchase', {
			productId: productId
		});
		buildfire._sendPacket(p, callback);
	},
	getProducts: function (callback) {
		var p = new Packet(null, 'inAppPurchase.getProducts');
		buildfire._sendPacket(p, callback);
	},
	getSubscriptions: function (callback) {
		var p = new Packet(null, 'inAppPurchase.getSubscriptions');
		buildfire._sendPacket(p, callback);
	},
	checkIsPurchased: function (options, callback) {
		var p = new Packet(null, 'inAppPurchase.checkIsPurchased', options);
		buildfire._sendPacket(p, callback);
	},

	//////////////////////////////////// EVENTS /////////////////////////////////////

	onPurchaseResult: function (callback, allowMultipleHandlers) {
		buildfire.eventManager.add('inAppPurchase.onPurchaseResult', callback, allowMultipleHandlers);
	},
	_triggerOnPurchaseResult: function (purchaseResult) {
		buildfire.eventManager.trigger('inAppPurchase.onPurchaseResult', purchaseResult);
	},
	onPurchaseRequested: function (callback, allowMultipleHandlers) {
		buildfire.eventManager.add('inAppPurchase.onPurchaseRequested', callback, allowMultipleHandlers);
	},
	_triggerOnPurchaseRequested: function (requestData) {
		buildfire.eventManager.trigger('inAppPurchase.onPurchaseRequested', requestData);
	}
};