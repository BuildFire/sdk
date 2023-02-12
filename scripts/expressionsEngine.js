const expressionsEngine = {
    evaluationRequests: {},
    /**
    * Evaluate the received expression
    * @param {Object} options - The needed elements to evaluate the expression.
    * @param {string} options.expression - The expression to be evaluated.
    * @param {Object} options.extendedContext - Additional context to evaluate the expression against.
    * @param {Function} callback - Returns the evaluated expression or error if existed
    * @public
    */
    evaluate({id, expression, extendedContext}, callback) {
        const evaluationRequest = {
            callback,
            expression,
            extendedContext,
            id: id || expressionsEngine._nanoid(),
            destroy: function() {
                expressionsEngine._destroyRequest(this.id);
            }
        };
        // if explicit id is sent, destroy if exists
        if (id) {
            expressionsEngine._destroyRequest(id);
        }
        expressionsEngine._evaluate(evaluationRequest);
        return evaluationRequest;
    },
    _evaluate: function(evaluationRequest) {
        expressionsEngine._prepareContext({extendedContext: evaluationRequest.extendedContext}, (err, context) => {
            evaluationRequest.context = context;
            expressionsEngine.evaluationRequests[evaluationRequest.id] = evaluationRequest;
            try {
                let preparedExpression = '`' + evaluationRequest.expression + '`';
                expressionsEngine._getBaseContextProxy(null, (err, contextProxy) => {
                    // consider switching to javascript proxy (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#finding_an_array_item_object_by_its_property)
                    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#a_complete_traps_list_example
                    for (key in context) {
                        if (context.hasOwnProperty(key)) {
                            let clonedKey = key; // should be cloned because key inside the getter is referencing the last key every time
                            Object.defineProperty(contextProxy, key, {
                                get: function() { 
                                    contextProxy._used[clonedKey] = true;
                                    return context[clonedKey]; 
                                }
                            })
                        }
                    }
    
                    evaluationRequest.contextProxy = contextProxy;
                    let evaluatedExpression =  Function(`"use strict"; const context = this;return (${preparedExpression})`).bind(contextProxy)();
                    evaluationRequest.callback(null, evaluatedExpression);
                });
            } catch (err) {
                evaluationRequest.callback(err);
            }
        });
    },
    /**
    * Get the base context
    * @param {string} id - The unique id of the request that should be deleted 
    * @private
    */
    _destroyRequest: function(id) {
        delete expressionsEngine.evaluationRequests[id];
    },
    /**
    * Get the base context
    * @param {Function} callback - Returns the base baseContextProxy
    * @private
    */
    _getBaseContextProxy(options, callback) {
        let baseContextProxy = {
            _used: {}
        };
        callback(null, baseContextProxy);
    },
    /**
    * Get the base context
    * @param {Function} callback - Returns the base context (shared between all platforms)
    * @private
    */
    _getBaseContext(options, callback) {
        let baseContext = {}; // shared functionality that (app/web/sdk) could use
        callback(null, baseContext);
    },
    /**
    * @desc This function will be overridden in each platform; so it would get correctly the context of the platform
    * @param {Function} callback - Returns the context of the platform, which requested expressionsEngine
    * @public
    */
    getContext(options, callback) {
        callback(null, {});
    },
    /**
    * @desc This function will merge the different contexts (baseContext, platform's context and the extendedContext) and return them
    * @param {Function} callback - Returns the final version of the context to be used in the evaluation
    * @private
    */
    _prepareContext({extendedContext}, callback) { 
        expressionsEngine._getBaseContext(null, (err, baseContext) => {
            expressionsEngine.getContext(null, (err, context) => {
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
        return crypto.getRandomValues(new Uint8Array(t)).reduce(((t,e)=>t+=(e&=63)<36?e.toString(36):e<62?(e-26).toString(36).toUpperCase():e>62?"-":"_"),"");
    },
    /**
    * Trigger reevaluation when (onLogin, onLogout, appTheme change) happens
    * @param {Object} options - information about the triggered source (type, data)
    * @param {string} options.type - The event that have been triggered (onLogin, onLogout, appTheme change)
    * @param {Object} options.data - Data coming from the event triggering
    * @public
    */
    triggerExpressionStateChange(options) {
        for (let key in expressionsEngine.evaluationRequests) {
            let request = expressionsEngine.evaluationRequests[key];
            if (request.contextProxy && request.contextProxy._used[options.type]) {
                expressionsEngine._evaluate(request);
            }    
        }
    }
}