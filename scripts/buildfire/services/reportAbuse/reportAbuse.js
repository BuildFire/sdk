'use strict';

if (typeof (buildfire) == 'undefined') throw ('please add buildfire.js first to use BuildFire services');
if (typeof (buildfire.services) == 'undefined') buildfire.services = {};
if (typeof (buildfire.services.reportAbuse) == 'undefined') buildfire.services.reportAbuse = {};

(function () {

	class Abuse {
		constructor(record = {}) {
			if (!record.data) record.data = {};
			this.id = record.id || undefined;
			this.archivedOn = record.data.archivedOn ? new Date().getTime() : 0;
			this.createdOn = record.data.createdOn || new Date();
			this.createdBy = record.data.createdBy || undefined;
			this.lastUpdatedOn = record.data.lastUpdatedOn || undefined;
			this.lastUpdatedBy = record.data.lastUpdatedBy || undefined;
			this.deletedOn = record.data.deletedOn || undefined;
			this.deletedBy = record.data.deletedBy || undefined;
			this.reportedUserId = record.data.reportedUserId || undefined;
			this.deeplink = record.data.deeplink || undefined;
			this.itemId = record.data.itemId || undefined;
			this.itemType = record.data.itemType || undefined;
			this.reason = record.data.reason || {};
			this.comment = record.data.comment || '';
			this.pluginId = record.data.pluginId || buildfire.getContext().pluginId;
			this.instanceId = record.data.instanceId || buildfire.getContext().instanceId;
		}
		toJSON() {
			return {
				id: this.id,
				archivedOn: this.archivedOn,
				createdOn: this.createdOn,
				createdBy: this.createdBy,
				lastUpdatedOn: this.lastUpdatedOn,
				lastUpdatedBy: this.lastUpdatedBy,
				deletedOn: this.deletedOn,
				deletedBy: this.deletedBy,
				reportedUserId: this.reportedUserId,
				deeplink: this.deeplink,
				itemId: this.itemId,
				itemType: this.itemType,
				reason: this.reason,
				comment: this.comment,
				instanceId: this.instanceId,
				pluginId: this.pluginId,
				_buildfire: {
					index: {
						number1: this.archivedOn,
						date1: this.createdOn,
						string1: this.createdBy,
						text: this.reason.value,
						array1: [
							{
								string1: `itemId_${this.itemId}`,
							},
							{
								string1: `reportedUserId_${this.reportedUserId}`,
							}
						]
					},
				},
			};
		}
	}

	class ReportsAbuse {
		/**
       * Get AppData Tag
       */
		static get TAG() {
			return '$$reportedAbuse';
		}
		/**
        * Get List Of ReportsAbuse
        * @param {Object} filters Filters object with search operators
        * @param {Function} callback Callback function
        */
		static search(filters) {
			return new Promise((resolve, reject) => {
				buildfire.appData.search(filters, this.TAG, (err, records) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(
						records.map((record) => new Abuse(record))
					);
				});

			});
		}
		/**
         * Add new abuse
         * @param {abuse} abuse Instance of abuse data class
         * @param {Function} callback Callback function
         */
		static add(abuse) {
			return new Promise((resolve, reject) => {
				if (!(abuse instanceof Abuse)) {
					reject(new Error('Only Abuse instance can be used'));
					return;
				}
				buildfire.appData.insert(
					abuse.toJSON(),
					this.TAG,
					false,
					(err, record) => {
						if (err) {
							reject(err);
							return;
						}
						Analytics.newReportCall();
						record = new Abuse(record);
						resolve(record);
					}
				);
			});
		}
	}

	const abuseReasonList = [
		{ id: 'false_or_misleading_information', value: 'False or Misleading Information' },
		{ id: 'privacy_violation', value: 'Privacy Violation' },
		{ id: 'profanity_or_hate_speech', value: 'Profanity or Hate Speech' },
		{ id: 'discrimination', value: 'Discrimination' },
		{ id: 'something_else', value: 'Something Else' },
	];

	/**
      * @param {Object} params - insert params.
      * @param {string} [params.itemId] - This reported item id
      * @param {string} params.itemType - This reported item type
      * @param {string} params.reportedUserId - The user that you wanna reported him
      * @param {string} params.deeplink - The deeplink data
    */
	buildfire.services.reportAbuse.report = (params, callback) => {
		if (typeof (buildfire.components) == 'undefined' || typeof (buildfire.components.drawer) == 'undefined')
			throw ('please add drawer.js first to use BuildFire drawer component');

		// validate the required params
		if (!params || !params.itemId || !params.reportedUserId || !params.deeplink) {
			callback(new Error('Missing required data: {itemId, reportedUserId, deeplink} must be specified'), null);
			return;
		}

		buildfire.spinner.show();
		// require Login
		getCurrentUser().then((user) => {

			if (!user) {
				buildfire.spinner.hide();
             	callback(new Error('Login is required'));
				return;
			}

			const insertedData = {
				itemId: params.itemId,
				itemType: params.itemType,
				reportedUserId: params.reportedUserId,
				createdBy: user.userId,
				deeplink: params.deeplink,
			};
			// check if this item is already reported
			buildfire.services.reportAbuse.getReport({
				itemId: params.itemId,
				reportingUserId: user.userId,
			}, (err, res) => {
				buildfire.spinner.hide();
				if (err) {
					callback(err, null);
					return;
				}
				if (res.length > 0) {
					callback(new Error('This item is already reported!'), null);
					return;
				}
				// open drawer to choice reason
				showAbuseComponent().then((res) => {
					insertedData.reason = res.reason;
					insertedData.comment = res.comment;
					const abuse = new Abuse({ data: insertedData });
					ReportsAbuse.add(abuse).then((data) => {
						return callback(null, data);
					}).catch(callback);
				}).catch(callback);
			});
		}).catch((err) => {
			buildfire.spinner.hide();
			callback(err);
		});
	};

	/**
    * get the user information
    */
	function getCurrentUser() {
		return new Promise((resolve, reject) => {
			buildfire.auth.getCurrentUser((err, user) => {
				if (err) {
					reject(err);
					return;
				}
				if (user) {
					resolve(user);
				} else {
					buildfire.auth.login({ allowCancel: true }, (err, user) => {
						if (err || !user) {
							reject(err);
							return;
						}

						resolve(user);
					});
				}
			});
		});
	}

	/**
     * open the drawer and input area to got the reason and comment text
     */
	function showAbuseComponent() {
		return new Promise((resolve, reject) => {
			//open drawer
			buildfire.components.drawer.open(
				{
					listItems: abuseReasonList.map((reason) => ({ id: reason.id, text: reason.value })),
				},
				(err, reason) => {
					if (err) {
						reject(err);
						return;
					}

					buildfire.components.drawer.closeDrawer();

					if (!reason || !reason.text) {
						reject(new Error('Reason is required'));
						return;
					}

					const data = { };

					data.reason = { id: reason.id, value: reason.text };

					// open text dialog
					buildfire.input.showTextDialog(
						{
							saveText: 'Report',
							placeholder: 'Enter your comment here',
						}, (err, res) => {
							if (err) {
								reject(err);
								return;
							}

							if (res.cancelled) {
								resolve(data);
								return;
							}


							if (res && res.results && res.results[0] && res.results[0].textValue) {
								data.comment = res.results[0].textValue;
							} else {
								console.error(new Error('comment is required'));
							}

							resolve(data);
						});

				});
		});
	}


	/**
    * @param {Object} params - query params.
    * @param {string} [params.itemId] - The reported item id
    * @param {string} params.reportingUserId - The user who's created the report
    */

	buildfire.services.reportAbuse.getReport = function (params, callback) {
		// validate the required params
		if (!params || !params.itemId || !params.reportingUserId) {
			callback(new Error('Missing required data: {itemId, reportingUserId} must be specified'), null);
			return;
		}

		const option = {
			filter: {
				'_buildfire.index.string1': params.reportingUserId,
				'_buildfire.index.array1.string1': `itemId_${params.itemId}`
			},
		};
		Analytics.searchReportCall();
		ReportsAbuse.search(option).then((data) => {
			return callback(null, data);
		}).catch(callback);
	};

	/**
     * listing to app owner event when take the action for an reported item.
     * @param {action} action
     */
	buildfire.services.reportAbuse.onAdminResponse = function (action) {
		console.log('Admin Response', action);
	};


	buildfire.services.reportAbuse.triggerWidgetReadyForAdminResponse = function (data) {
		const p = new Packet(null, 'messaging.triggerOnWidgetReadyForReportAbuseAdminResponse', data);
		buildfire._sendPacket(p);
	};

	class Analytics {

		static get NEW_REPORT() {
			return 'newReportCreated';
		}

		static get SEARCH_REPORT() {
			return 'searchReport';
		}

		static get ADMIN_RESPONSE() {
			return 'adminResponse';
		}

		static newReportCall() {
			buildfire.analytics.trackAction(this.NEW_REPORT);
		}

		static searchReportCall() {
			buildfire.analytics.trackAction(this.SEARCH_REPORT);
		}

		static adminResponseCall() {
			buildfire.analytics.trackAction(this.ADMIN_RESPONSE);
		}
	}

})();
