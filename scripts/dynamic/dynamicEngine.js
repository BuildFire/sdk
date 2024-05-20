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
	/**
	* @desc This function returns weather this file is loaded from a client or a server side
	* @private
	*/
	_isServer() {
		return !(typeof window !== 'undefined' && window.document);
	},
	_decode({encodedString}) {
		return atob(encodedString); // control side is using (btoa) to encode
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
			options = options || {};
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
			let expression = request.options.expression || '';

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
						const evaluateExpression = () => {
							const preparedExpression = '`' + expression + '`';
							request._context = new Proxy(context, handler);
							request.context = context;
							const evaluatedExpression =  Function(`"use strict"; const context = this;return (${preparedExpression})`).bind(request._context)();
							expressions._evaluationRequests[id] = request;
							const usedDatasources = request._context.datasource['__handler__']._usedProperties;
							dynamicEngine.datasources._fetchNeededDatasources({usedDatasources, extendedDatasources: request.options.extendedDatasources}, (err, res) => {
								if (err) return console.error('Error occurred while fetching data: ', err);
								dynamicEngine.triggerContextChange({contextProperty: 'datasource', data: res});
							});
							callback(null, {evaluatedExpression, evaluationRequest: request});
						};

						if (expression.includes('buildfire-repeat')) {
							dynamicEngine.expressions.repeater._replaceRepeaters({expression, context}, (err, result) => {
								if (err) return callback(err);
								expression = result;
								evaluateExpression();
							});
						} else {
							evaluateExpression();
						}
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
			let baseContext = {
				// shared functionality that (app/web/sdk) could use
				htmlEncode: function(expression) {
					let divElement = document.createElement('div');
					divElement.innerText = expression;
					return divElement.innerHTML;
				},
				htmlDecode: function(expression) {
					let divElement = document.createElement('div');
					divElement.innerHTML = expression;
					return divElement.innerText;
				}
			};
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
					dynamicEngine.datasources._addDatasourcesData({context: baseContext});
					callback(null, baseContext);
				});
			});
		},
		repeater: {
			_exposeRepeaterStructure: false, // change it to false to show the repeater structure for development purposes
			/**
			* @desc Handle all the repeaters functionality; so the content of the repeaters could be evaluated
			* @param {Object} options.expression - The expression to be evaluated
			* @param {Object} options.context - The context that is being used in the evaluation process
			* @public
			*/
			_replaceRepeaters({expression, context}, callback) {
				try {
					let container = document.createElement('div');
					container.innerHTML = expression;
					dynamicEngine.expressions.repeater._replaceRepeaterTree({container, context, scope: {}});
					if (dynamicEngine.expressions.repeater._exposeRepeaterStructure) console.log('Repeater Structure', container.innerHTML);
					callback(null, container.innerHTML);
				} catch (err) {
					callback(err);
				}
			},
			/**
			* @desc Handle all the repeaters functionality; so the content of the repeaters could be evaluated
			* @param {Object} options.element - The container element to check if it contains any repeater element
			* @param {Object} options.context - The context that is being used in the evaluation process
			* @param {Object} options.scope - Contains all the paths for the repeaters' scoped variables
			* @private
			*/
			_replaceRepeaterTree({container, context, scope}) {
				const repeatElement = container.querySelector('[buildfire-repeat]');
				if (repeatElement) {
					// remove the reference of the scope property
					scope = JSON.parse(JSON.stringify(scope));

					const repeatAttr = repeatElement.getAttribute('buildfire-repeat');

					repeatElement.removeAttribute('buildfire-repeat');

					// Extract the loop variable and array name from the (buildfire-repeat) attribute
					let [scopeVariableName, qualifiedArrayPath] = repeatAttr.split(' in ').map(item => item.trim());

					// handle arrays that are not starting with (context); so they can be evaluated
					// For example, (order.items) will be converted to something like (context.datasource.orders[0].items); so it can be evaluated
					qualifiedArrayPath = qualifiedArrayPath.replace(/(^(?! *context\.).*)/, (match, expr) => {
						// Get the first part of the qualifiedArrayPath
						// For example, if the qualifiedArrayPath is (order.items), propertyName will be (order)
						const propertyName = qualifiedArrayPath.split('.')[0];
						// check if the path to the array (order) is existing
						return expr.replace(propertyName, scope[propertyName]);
					});

					try {
						// Get the array to loop over
						const array = Function(`"use strict"; const context = this;return (${qualifiedArrayPath})`).bind(context)();
						// Loop over the array
						if (array) {
							array.forEach((item, index) => {
								scope[scopeVariableName] = `${qualifiedArrayPath}[${index}]`;

								// Create a new element based on the container
								const newItem = repeatElement.cloneNode(true);

								// check for any elements that contains the (buildfire-repeat) attribute and handle them
								dynamicEngine.expressions.repeater._replaceRepeaterTree({container: newItem, context, scope});

								// select all template literals that is not starting with (context) and handle them
								newItem.innerHTML = newItem.innerHTML.replace(/\${((?! *context\.)[^{}]*)}/g, (match, expr) => {
									// Evaluate the expression in the loop scope
									const updatedExpr = expr.replace(scopeVariableName, scope[scopeVariableName]);
									if (dynamicEngine.expressions.repeater._exposeRepeaterStructure) {
										return '${' + updatedExpr + '}' + '<span style="display:none">' + updatedExpr + '</span>';
									}
									return '${' + updatedExpr + '}';
								});

								// Append the new element to the container's parent
								repeatElement.parentNode.insertBefore(newItem, repeatElement);
							});
						}
						repeatElement.remove();
					} catch (err) {
						repeatElement.remove();
						if (!err.message || !(err.message.includes('undefined') || err.message.includes('null'))) {
							throw err;
						}
					}
				}
				if (container.querySelector('[buildfire-repeat]')) { // check if there still nested repeaters
					dynamicEngine.expressions.repeater._replaceRepeaterTree({container, context, scope});
				}
			},
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
		datasourcesData: {},
		requestedDatasources: {},
		/**
		* @desc Add all of the datasources' data to the context to be used in the evaluation process
		* @param {Object} options.context - The context that is being used in the evaluation process
		* @private
		*/
		_addDatasourcesData({context}){
			const handler = {
				_usedProperties: {},
				get(target, prop) {
					if (prop === '__handler__') return this;
					this._usedProperties[prop] = true;
					return target[prop];
				},
			};
			context.datasource = new Proxy(this.datasourcesData, handler);
		},
		/**
		* @desc Check for just the needed datasources and fetch them
		* @param {Object} options - Datasources's configuration that is used to fetch the datasource's data
		* @param {Object} options.usedDatasources - Datasources that is being used in the evaluated expression
		* @param {string} options.extendedDatasources - The extended datasources, which have been sent with the evaluation request
		* @param {Function} callback - Returns the data of the fetched datasource
		* @private
		*/
		_fetchNeededDatasources({usedDatasources, extendedDatasources}, callback) {
			if (usedDatasources && Object.keys(usedDatasources).length > 0) {
				dynamicEngine.datasources._getDatasources(null, (err, datasources) => {
					if (err) return console.error('Error occurred while fetching data: ', err);
					if (datasources || extendedDatasources) {
						datasources = datasources || [];
						let allDatasources = JSON.parse(JSON.stringify(datasources));
						if (extendedDatasources) {
							let filteredDatasources = []; // contain datasources from globalSettings without duplicates
							datasources.forEach(datasource => {
								let duplicateDatasource = extendedDatasources.find((extendedDatasource) => {
									return extendedDatasource.id === datasource.id;
								});
								// don't push a datasource from globalSettings if it has the same id as a datasource in extendedDatasources
								if (!duplicateDatasource) {
									filteredDatasources.push(datasource);
								}
							});
							allDatasources = [...filteredDatasources, ...extendedDatasources];
						}
						for (let usedDatasourceId in usedDatasources) {
							if (!this.requestedDatasources[usedDatasourceId] || ((new Date() - this.requestedDatasources[usedDatasourceId].lastTimeFetched) > 5000)) {
								const existingDatasource = allDatasources.find((datasource) => {
									return datasource.id === usedDatasourceId;
								});
								if (existingDatasource) {
									this.fetchDatasource({datasource: existingDatasource}, callback);
								}
							}
						}
					}
				});
			}
		},
		/**
		* @desc Fetch the datasource's data
		* @param {object} options.datasource - The needed configuration to fetch the datasource data
		* @param {Function} callback - Returns the data of the fetched datasource
		* @public
		*/
		fetchDatasource({ datasource }, callback) {
			datasource.lastTimeFetched = new Date();
			this.requestedDatasources[datasource.id] = datasource;

			switch (datasource.type) {
			case 'api':
				dynamicEngine.datasources._fetchApi({ datasource }, callback);
				break;
			}
		},
		/**
		* @desc Fetch the datasource's data
		* @param {Object} options - Datasources's configuration that is used to fetch the datasource's data
		* @param {Function} callback - Contains the datasource's data
		* @private
		*/
		_fetchApi({ datasource }, callback) {
			let datasourceConfiguration = JSON.parse(dynamicEngine._decode({encodedString: datasource.configuration}));
			const promises = dynamicEngine.datasources._evaluateDatasourceConfiguration([
				datasourceConfiguration?.url,
				datasourceConfiguration?.method,
				datasourceConfiguration?.headers,
				datasourceConfiguration?.body,
				datasourceConfiguration?.params,
			]);

			Promise.all(promises)
				.then(([url, method, headers, body, params]) => {
					const options = {};
					url = new URL(url);
					if (method) options.method = method;
					if (headers) options.headers = JSON.parse(headers);
					if (body) options.body = body;
					if (params) {
						params = JSON.parse(params);
						Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
					}
					fetch(url, options)
						.then((response) => {
							if (response.ok) {
								return response.json()
									.then((response) => {
										return response;
									})
									.catch(() => {
										throw new Error('Error Handling', {cause: {message: 'response is not JSON'}});
									});
							} else {
								return response.json()
									.then((errJson) => {
										throw new Error('Error Handling', {cause: {data: errJson, status: response.status, statusText: response.statusText}});
									})
									.catch((err) => {
										throw new Error('Error Handling', {cause: {data: err.cause?.data, status: response.status, statusText: response.statusText}});
									});
							}
						})
						.then((data) => {
							dynamicEngine.datasources.datasourcesData[datasource.id] = data;
							callback(null, data);
						})
						.catch((err) => {
							callback({message: 'Failed to fetch \'' + datasource.id + '\'', details: err.cause}, null);
						});
				})
				.catch((error) => {
					callback(error, null);
				});
		},
		/**
		* @desc Evaluate the datasource configuration. For example, the url to fetch the datasource would contain expressions
		* @param {Array} values - Contains the datasource's configurations that should be evaluated
		* @private
		*/
		_evaluateDatasourceConfiguration(values) {
			const promises = [];
			for (const value of values) {
				if (!value) {
					promises.push(Promise.resolve(''));
					continue;
				}
				promises.push(new Promise((resolve, reject) => {
					dynamicEngine.expressions.evaluate({ expression: value }, (error, result) => {
						if (error) {
							reject(error);
						} else {
							result.evaluationRequest.destroy();
							resolve(result.evaluatedExpression);
						}
					});
				}));
			}
			return promises;
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
