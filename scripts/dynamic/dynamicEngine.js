// eslint-disable-next-line no-redeclare
const dynamicEngine = {
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
		evaluate({id, expression, extendedContext}, callback) {
			const evaluationRequest = {
				callback,
				expression,
				extendedContext,
				id: id || dynamicEngine.expressions._nanoid(),
				destroy: function() {
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
		_evaluate: function(request) {
			const { expressions } = dynamicEngine;
			const { id, extendedContext, expression, callback } = request;

			expressions._prepareContext(
				{ extendedContext },
				(err, context) => {
					try {
						const handler = {
							_usedProperties: {},
							get(target, prop) {
								if (prop === '__handler__') return this;
								if (prop in target) {
									handler._usedProperties[prop] = true;
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
						const evaluatedExpression =  Function(`"use strict"; const context = this;return (${preparedExpression})`).bind(request.context)();
						expressions._evaluationRequests[id] = request;
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
		_destroyRequest: function(id) {
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
		_prepareContext({extendedContext}, callback) {
			dynamicEngine.expressions._getBaseContext(null, (err, baseContext) => {
				dynamicEngine.expressions.getContext(null, (err, context) => {
					Object.assign(baseContext, context, extendedContext);
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
		},
		/**
		* Trigger reevaluation when (onLogin, onLogout, appTheme change) happens
		* @param {Object} options - information about the triggered source (contextProperty, data)
		* @param {string} options.contextProperty - The event that have been triggered (onLogin, onLogout, appTheme change)
		* @param {Object} options.data - Data coming from the event triggering
		* @public
		*/
		triggerExpressionContextChange(options) {
			for (let key in dynamicEngine.expressions._evaluationRequests) {
				let request = dynamicEngine.expressions._evaluationRequests[key];
				if (request.context && request._context['__handler__']._usedProperties[options.contextProperty]) {
					dynamicEngine.expressions._evaluate(request);
				}
			}
		}
	}
};
