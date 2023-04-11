// eslint-disable-next-line no-redeclare
const dynamicEngine = {
	/**
	* Trigger reevaluation when (onLogin, onLogout, appTheme change) happens
	* @param {Object} options - information about the triggered source (contextProperty, data)
	* @param {string} options.contextProperty - The event that have been triggered (onLogin, onLogout, appTheme change)
	* @param {Object} options.data - Data coming from the event triggering
	* @public
	*/
	triggerContextChange(options) {
		for (let key in dynamicEngine.expressions._evaluationRequests) {
			let request = dynamicEngine.expressions._evaluationRequests[key];
			if (request.context && request._context['__handler__']._usedProperties[options.contextProperty]) {
				dynamicEngine.expressions._evaluate(request);
			}
		}
	},
	getGlobalSettings(options, callback) {
		callback(null, {});
	},
	expressions: {
		_evaluationRequests: {},
		/**
		* Evaluate the received expression
		* @param {Object} options - The needed elements to evaluate the expression
		* @param {string} options.expression - The expression to be evaluated
		* @param {Object} options.extendedContext - Additional context to evaluate the expression against
		* @param {Function} callback - Returns the evaluated expression or error if existed
		* @public
		*/
		evaluate(options, callback) {
			const { id } = options; 
			const evaluationRequest = {
				callback,
				options,
				id: id || dynamicEngine.expressions._nanoid(),
				destroy() {
					dynamicEngine.expressions._destroyRequest(this.id);
				}
			};
			// if explicit id is sent, destroy if exists
			if (id) {
				dynamicEngine.expressions._destroyRequest(id);
			}
			dynamicEngine.expressions._evaluate(evaluationRequest);
			return evaluationRequest;
		},
		_evaluate(request) {
			const { expressions } = dynamicEngine;
			const { id, callback }  = request;
			const { expression } = request.options;

			expressions._prepareContext(
				request.options,
				(err, context) => {
					try {
						const handler = {
							_usedProperties: {},
							get(target, prop) {
								if (prop === '__handler__') return this;
								if (prop in target) {
									this._usedProperties[prop] = true;
									return target[prop];
								}
								return undefined;
							},
							set() {
								throw 'not_allowed';
							}
						};
						const preparedExpression = '`' + expression + '`';
						request._context = new Proxy(context, handler);
						request.context = context;
						const evaluatedExpression =  Function(`"use strict"; const context = this;return (${preparedExpression})`).bind(request._context)();
						expressions._evaluationRequests[id] = request;
						const usedDatasources = request._context.data['__handler__']._usedProperties;
						dynamicEngine.datasources._fetchNeededDatasources({usedDatasources, extendedDatasources: request.options.extendedDatasources}, (err, res) => {
							if (err) return console.error('Error occurred while fetching data: ', err);
							dynamicEngine.triggerContextChange({contextProperty: 'data', data: res});
						});
						request.callback(null, evaluatedExpression);
					} catch (err) {
						callback(err);
					}
				});
		},
		/**
		* Get the base context
		* @param {string} id - The unique id of the request that should be deleted
		* @private
		*/
		_destroyRequest(id) {
			delete dynamicEngine.expressions._evaluationRequests[id];
		},
		/**
		* Get the base context
		* @param {Object} options
		* @param {Function} callback - Returns the base context (shared between all platforms)
		* @private
		*/
		_getBaseContext(options, callback) {
			let baseContext = {}; // shared functionality that (app/web/sdk) could use
			callback(null, baseContext);
		},
		/**
		* @desc This function will be overridden in each platform; so it would get correctly the context of the platform
		* @param {Object} options
		* @param {Function} callback - Returns the context of the platform, which requested dynamicEngine.expressions
		* @public
		*/
		getContext(options, callback) {
			callback(null, {});
		},
		/**
		* @desc This function will merge the different contexts (baseContext, platform's context and the extendedContext) and return them
		* @param {Object} options
		* @param {Function} callback - Returns the final version of the context to be used in the evaluation
		* @private
		*/
		_prepareContext(options, callback) {
			dynamicEngine.expressions._getBaseContext(null, (err, baseContext) => {
				dynamicEngine.expressions.getContext({request: options}, (err, context) => {
					Object.assign(baseContext, context, options.extendedContext);
					dynamicEngine.datasources._addDatasourcesData({baseContext});
					callback(null, baseContext);
				});
			});
		},
		/**
		* @desc This function returns weather this file is loaded from a client or a server side
		* @private
		*/
		_isServer() {
			return !(typeof window !== 'undefined' && window.document);
		},
		/**
		* Get unique id each time
		* @private
		*/
		_nanoid(t=21) {
			return crypto.getRandomValues(new Uint8Array(t)).reduce(((t,e)=>t+=(e&=63)<36?e.toString(36):e<62?(e-26).toString(36).toUpperCase():e>62?'-':'_'),'');
		}
	},
	datasources: {
		_datasourcesData: {},
		_requestedDatasources: {},
		_addDatasourcesData({baseContext}){
			const handler = {
				_usedProperties: {},
				get(target, prop) {
					if (prop === '__handler__') return this;
					this._usedProperties[prop] = true;
					return target[prop];
				},
			};
			let data = this._datasourcesData;
			baseContext.data = new Proxy(data, handler);
		},
		_fetchNeededDatasources({usedDatasources, extendedDatasources}, callback) {
			if (usedDatasources && Object.keys(usedDatasources).length > 0) {
				dynamicEngine.datasources._getDatasources(null, (err, datasources) => {
					if (err) return console.error('Error occurred while fetching data: ', err);
					if (datasources || extendedDatasources) {
						datasources = datasources || [];
						if (extendedDatasources) {
							datasources = datasources.concat(extendedDatasources);
						}
						for (let usedDatasourceId in usedDatasources) {
							if (!this._requestedDatasources[usedDatasourceId] || ((new Date() - this._requestedDatasources[usedDatasourceId].lastTimeFetched) > 5000)) {
								const existedDatasource = datasources.find((datasource) => {
									return datasource.id === usedDatasourceId;
								});
								if (existedDatasource) {
									this._fetchDatasource({datasource: existedDatasource}, callback);
								}
							}
						}
					}
				});
			}
		},
		/**
		* @desc Fetch the datasource's data
		* @param {object} options.datasource - the needed configuration to fetch the datasource data
		* @param {Function} callback - Returns the data of the fetched datasource
		* @private
		*/
		_fetchDatasource({datasource}, callback) {
			const options = {};
			datasource.lastTimeFetched = new Date();
			this._requestedDatasources[datasource.id] = datasource;
			options.method = datasource.configurations.method;
			if (datasource.configurations.headers) {
				options.headers = datasource.configurations.headers;
			}
			if (datasource.configurations.body) {
				options.body = datasource.configurations.body;
			}
			fetch(datasource.configurations.url, options)
				.then((response) => response.json())
				.then((data) => {
					dynamicEngine.datasources._datasourcesData[datasource.id] = data;
					callback(null, data);
				})
				.catch((error) => {
					callback(error, null);
				});
		},
		/**
		* @desc Get all the datasources from the app global settings
		* @param {Function} callback - Returns the datasources
		* @private
		*/
		_getDatasources(options, callback) {
			dynamicEngine.getGlobalSettings(null, (err, globalSettings) => {
				if (err) return callback(err);
				if (globalSettings?.appDatasources && globalSettings.appDatasources.length > 0) {
					return callback(null, globalSettings.appDatasources);
				}
				callback(null, null);
			});
		}
	}
};
