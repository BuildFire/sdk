
if (typeof buildfire == 'undefined')
    throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};


buildfire.components.reactions = (() => {

    class Reaction {
        constructor(data = {}) {
            this.itemId = data.itemId || null;
            this.userId = data.userId || null;

            this.reactions = data.reactions || [];
            this._buildfire = data._buildfire || {};
        }
    }

    class Reactions {
        static get TAG() {
            return "$$reactions";
        }

        // options: {itemId, userId, reactionId=null, reactionType}
        static _insert(options, callback) {
            let reaction = new Reaction({
                itemId: options.itemId,
                userId: options.userId,
                reactions: [{ type: options.reactionType, createdOn: new Date() }]
            })
            reaction._buildfire.index = this.buildIndex(reaction);

            buildfire.appData.insert(
                reaction, this.TAG, false,
                (err, result) => {
                    if (err) {
                        return callback(err);
                    }
                    buildfire.analytics.trackAction(options.itemId + "-" + options.reactionType + "-react");
                    return callback(null, result);
                }
            );
        }

        // options: reaction, reactionType, operation, allowMultipleReactions
        static _update(options, callback) {

            if (!options) {
                return callback("Invalid options. Options must be set and have at least reaction, reactionType and operation properties!");
            }
            if (!["add", "remove", "toggle"].includes(options.operation)) {
                return callback("Invalid operations option. Operations coulde be one of the following:  add, remove or toggle");
            }
            if (!options.reaction) {
                return callback("Invalid options, Missing reaction!");
            }

            if (!options.reactionType && ReactionsTypes.validateReactionTypes(options.reactionType)) {
                return callback("Invalid options, Missing reactionType!");
            }

            let filter = {
                "_buildfire.index.string1": options.reaction.itemId + '-' + options.reaction.userId
            };
            let obj = {};

            if (options.allowMultipleReactions) {
                if (options.operation == "add" || options.operation == "toggle") {
                    obj = { $addToSet: { reactions: { type: options.reactionType, createdOn: new Date() } } }
                } else if (options.operation == "remove") {
                    obj = { $pull: { reactions: { type: options.reactionType } } }
                }
            } else {
                if (options.operation == "add" || options.operation == "toggle") {
                    obj = { $set: { reactions: [{ type: options.reactionType, createdOn: new Date() }] } }
                } else if (options.operation == "remove") {
                    obj = { $set: { reactions: [] } }
                }
            }

            buildfire.appData.searchAndUpdate(filter,
                obj, this.TAG,
                (err, result) => {
                    if (err) {
                        return callback(err);
                    }

                    return callback(null, result);
                }
            );
        }

        // options: {itemId, userId, reactionId=null, reactionType}
        static _search(options, callback) {

            if (options.reactionId) {
                buildfire.appData.getById(options.reactionId, this.TAG, (err, result) => {
                    if (err) {
                        return callback(err)
                    }
                    return callback(null, result)
                })
            } else {
                let filter = {
                    "_buildfire.index.string1": options.itemId + '-' + options.userId,
                }
                buildfire.appData.search({ filter, limit: 1 }, this.TAG, (err, result) => {
                    if (err) {
                        return callback(err)
                    }
                    return callback(null, result[0] || {})
                })
            }

        }

        // options: {itemId, userId, reactionId=null, reactionType, allowMultipleReactions}
        static unReactReact(options, callback) {
            if (typeof callback !== 'function') {
                return console.error("callback must be a function!");
            }

            if (!options) {
                return callback("Invalid options. Options must be set and have at least oldReactionType, newReactionType, userId and itemId properties!");
            }
            if (!options.itemId) {
                return callback("Invalid options, Missing itemId!");
            }
            if (!options.userId) {
                return callback("Invalid options, Messing userId!");
            }
            if (!options.reactionType) {
                return callback("Invalid options, Missing reactionType!");
            }

            this._search(options, (err, result) => {
                if (err) {
                    return callback(err)
                }

                if (result && result.data) {
                    if (result.data.reactions.find((reaction) => reaction.type === options.reactionType)) {
                        return callback(null, { status: 'noAction', data: result })
                    } else {
                        const reaction = result.data;
                        const oldReactionType = reaction.reactions.length ? reaction.reactions[0].type : "";
                        reaction.id = result.id;
                        let updateOptions = {
                            reaction: reaction,
                            reactionType: options.reactionType,
                            operation: "toggle",
                            allowMultipleReactions: options.allowMultipleReactions
                        };
                        this._update(updateOptions, (err, result) => {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, { status: 'updated', data: result, oldReactionType: oldReactionType })
                        })
                    }
                } else {
                    this._insert(options, (err, result) => {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, { status: 'added', data: result, oldReactionType: "" })
                    })
                }
            })

        }

        // options: {itemId, userId, reactionId=null, reactionType}
        static react(options, callback) {
            if (typeof callback !== 'function') {
                return console.error("callback must be a function!");
            }
            
            if (!options) {
                return callback("Invalid options. Options must be set and have at least reactionType, userId and itemId properties!");
            }
            if (!options.itemId) {
                return callback("Invalid options, Missing itemId!");
            }
            if (!options.reactionType) {
                return callback("Invalid options, Missing reactionType!");
            }
            if (!options.userId) {
                return callback("Invalid options, Messing userId!");
            }

            this._search(options, (err, result) => {
                if (err) {
                    return callback(err)
                }
                if (result && result.data) {
                    if (result.data.reactions.find((reaction) => reaction.type === options.reactionType)) {
                        return callback(null, { status: 'noAction', data: result })
                    } else {
                        const reaction = result.data;
                        reaction.id = result.id;
                        let updateOptions = {
                            reaction: reaction,
                            reactionType: options.reactionType,
                            operation: "add",
                            allowMultipleReactions: options.allowMultipleReactions
                        };
                        this._update(updateOptions, (err, result) => {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, { status: 'updated', data: result })
                        })
                    }
                } else {
                    this._insert(options, (err, result) => {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, { status: 'added', data: result });
                    })
                }
            })
        }

        // options: {itemId, userId, reactionId=null, reactionType}
        static unReact(options, callback) {
            if (typeof callback !== 'function') {
                return console.error("callback must be a function!");
            }

            if (!options) {
                return callback("Invalid options. Options must be set and have at least reactionType, userId and itemId properties!");
            }
            if (!options.itemId) {
                return callback("Invalid options, Missing itemId!");
            }
            if (!options.userId) {
                return callback("Invalid options, Messing userId!");
            }
            if (!options.reactionType) {
                return callback("Invalid options, Missing reactionType!");
            }

            this._search(options, (err, result) => {
                if (err) {
                    return callback(err)
                }

                if (result && result.data) {
                    if (!result.data.reactions.find((reaction) => reaction.type === options.reactionType)) {
                        return callback(null, { status: 'noAction', data: result })
                    } else {

                        const reaction = result.data;
                        reaction.id = result.id;

                        // if the reaction type that we are going to remove is the only one left, delte the whole records
                        if (reaction.reactions.length == 1) {

                            buildfire.appData.delete(reaction.id, this.TAG, (err, result) => {
                                if (err && err.code == "NOTFOUND") {
                                    return callback(null, { status: 'noAction' });
                                } else if (err) {
                                    return callback(err);
                                }
                                buildfire.analytics.trackAction(options.itemId + "-" + options.reactionType + "-unReact");
                                return callback(null, { status: 'deleted' });
                            });

                        } else { // remove only the reaction type from the array

                            let updateOptions = {
                                reaction: reaction,
                                reactionType: options.reactionType,
                                operation: "remove",
                                allowMultipleReactions: options.allowMultipleReactions
                            };

                            this._update(updateOptions, (err, result) => {
                                if (err) {
                                    return callback(err);
                                }
                                buildfire.analytics.trackAction(options.itemId + "-" + options.reactionType + "-unReact");
                                return callback(null, { status: 'deleted', data: result })
                            })
                        }
                    }
                } else {
                    return callback(null, { status: 'noAction' });
                }
            })
        }
        // options: { itemId, reactionType, pageIndex, pageSize }
        static get(options, callback) { // fetch who reacted for specific item
            if (!callback || typeof callback !== 'function') {
                return console.error("callback must be a function!");
            }

            if (!options) {
                return callback("missing get options!");
            }
            let { itemId, reactionType, pageIndex, pageSize } = options;

            if (!itemId) {
                return callback("Invalid get options!");
            }

            if (typeof pageIndex !== 'number') {
                pageIndex = 0;
            }

            if (!pageSize) {
                pageSize = 50;
            }

            let filter = {};
            if (reactionType) {
                filter = { "_buildfire.index.array1.string1": "reactionType-" + itemId + "-" + reactionType }
            } else {
                // get all types
                // put all available types in an array as [itemId-type, ...]
                let reactionType = ReactionsTypes.types;
                let inArr = reactionType.map(reactio => {
                    return `reactionType-${itemId}-${reactio.type}`
                })

                filter = { "_buildfire.index.array1.string1": { $in: inArr } }
            }

            buildfire.appData.search(
                {
                    filter, page: pageIndex, pageSize,
                }, this.TAG,
                (err, result) => {
                    if (err) {
                        return callback(err);
                    }

                    if (result) {
                        return callback(null, result);
                    }
                    return callback(null, null);
                }
            );
        }

        static getByUserId(userId, itemIds, callback) {
            if (!callback || typeof callback !== 'function') {
                return console.error("callback must be a function!");
            }
           
            if (!userId || typeof userId !== 'string' || !itemIds || !itemIds.length) {
                return callback('Invalid arguments');
            }

            let inArray = itemIds.map(itemId => (itemId + '-' + userId))
            let searchOptions = {
                filter: { "_buildfire.index.string1": { $in: inArray } }
            }

            buildfire.appData.search(searchOptions, this.TAG, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (result) {
                    return callback(null, result);
                }
                return callback(null, null);
            })
        }

        static buildIndex(data = {}) {
            const index = {
                string1: data.itemId + '-' + data.userId,
                array1: data.reactions.map(reaction => ({ string1: "reactionType-" + data.itemId + "-" + reaction.type }))
            };

            return index;
        }
    }

    class ReactionsSummary {
        constructor(data = {}) {
            this.itemId = data.itemId || null;
            this.reactions = data.reactions || []; // reaction types {type, count, lastReactionBy} 

            this._buildfire = data._buildfire || {}
        }
    }

    class ReactionsSummaries {
        static get TAG() {
            return "$$reactionsSummary";
        }

        static _search(itemId, callback) {
            let filter = {
                "_buildfire.index.string1": itemId,
            }
            buildfire.appData.search({ filter, limit: 1 }, this.TAG, (err, result) => {
                if (err) {
                    return callback(err)
                }
                return callback(null, result)
            })
        }

        static _create(summery, callback) {
            buildfire.appData.insert(summery, this.TAG, false, (err, result) => {
                if (err) {
                    return callback(err);
                }
                return callback(null, result)
            })
        }

        static _update(filter, data, callback) {
            buildfire.appData.searchAndUpdate(
                filter, data, this.TAG,
                (err, result) => {
                    if (err) return callback(err);

                    callback(null, result);
                }
            );
        }

        static get(itemIds, callback) {
            if (typeof callback !== 'function' || !callback) {
                return console.error("callback must be a function!");
            }

            if (!itemIds || !itemIds.length) {
                return callback("Missing get itemIds!");
            }

            buildfire.appData.search(
                {
                    filter: {
                        "_buildfire.index.string1": { $in: itemIds }
                    }
                }, this.TAG,
                (err, result) => {
                    if (err) {
                        return callback(err);
                    }

                    if (result) {
                        return callback(null, result);
                    }
                    return callback(null, null);
                }
            );
        }
        // options = { itemId, reactionType, userId }
        static increment(options, callback) {
            if (!callback || typeof callback !== 'function') {
                return console.error("callback must be a function!");
            }
            if (!options) {
                return callback("Invalid options!");
            }
            if (!options.itemId) {
                return callback("Invalid options, Missing increment itemId!");
            }
            if (!options.reactionType) {
                return callback("Invalid options, Missing increment reactionType!");
            }
            if (!options.userId) {
                return callback("Invalid options, Missing increment userId!");
            }

            let { itemId, reactionType, userId } = options;
            this._search(itemId, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (!result || !result.length) {
                    let summery = new ReactionsSummary({
                        itemId,
                        reactions: [{ type: reactionType, count: 1, lastReactionBy: userId }]
                    })
                    summery._buildfire.index = this.buildIndex(summery);
                    this._create(summery, (err, res) => {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, { status: 'done' })
                    })
                } else {
                    let typeData = result[0].data.reactions.find(reaction => reaction.type == reactionType);
                    let filter = {}, obj = {};
                    if (typeData) {
                        filter = {
                            "_buildfire.index.string1": itemId,
                            "reactions.type": reactionType,
                        }
                        obj = { $inc: { "reactions.$.count": 1 }, $set: { "reactions.$.lastReactionBy": userId } }
                    } else {
                        filter = {
                            '_buildfire.index.string1': itemId,
                        }
                        obj = { $addToSet: { reactions: { type: reactionType, count: 1, lastReactionBy: userId }, "_buildfire.index.array1": { string1: 'reactionType-' + reactionType } } }
                    }

                    this._update(filter, obj, (err, res) => {
                        if (err) {
                            return callback(err)
                        }
                        return callback(null, { status: 'done' })
                    })
                }
            })
        }
        // options = { itemId, reactionType }
        static decrement(options, callback) {
            if (!callback || typeof callback !== 'function') {
                return console.error("callback must be a function!");
            }
            if (!options) {
                return callback("Invalid options, Missing decrement options!");
            }
            if (!options.reactionType) {
                return callback("Invalid options, Missing decrement reactionType!");
            }
            if (!options.itemId) {
                return callback("Invalid options, Missing decrement itemId!");
            }

            let { itemId, reactionType } = options;
            this._search(itemId, (err, result) => {
                if (err) {
                    return callback(err);
                }
                if (!result || !result.length) {
                    let summery = new ReactionsSummary({
                        itemId,
                        reactions: [{ type: reactionType, count: 0, lastReactionBy: null }]
                    })
                    summery._buildfire.index = this.buildIndex(summery);
                    this._create(summery, (err, res) => {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, { status: 'done' })
                    })
                } else {
                    let typeData = result[0].data.reactions.find(reaction => reaction.type == reactionType);
                    let filter = {}, obj = {};
                    if (typeData) {
                        filter = {
                            "_buildfire.index.string1": itemId,
                            "reactions.type": reactionType,
                        }
                        obj = { $inc: { "reactions.$.count": typeData.count > 0 ? -1 : 0 }, $set: { "reactions.$.lastReactionBy": null } }
                    } else {
                        filter = {
                            '_buildfire.index.string1': itemId,
                        }
                        obj = { $addToSet: { reactions: { type: reactionType, count: 0, lastReactionBy: null }, "_buildfire.index.array1": { string1: 'reactionType-' + reactionType } } }
                    }

                    this._update(filter, obj, (err, res) => {
                        if (err) {
                            return callback(err)
                        }
                        return callback(null, { status: 'done' })
                    })
                }
            })

        }

        static buildIndex(data = {}) {
            const index = {
                string1: data.itemId,
                array1: data.reactions.map(reaction => ({ string1: 'reactionType-' + reaction.type }))
            };

            return index;
        }
    }

    class ReactionsTypes {
        static get types() {
            return [
                { type: "like", title: "like", color: "#FF0000", url: "sentiment_satisfied", reactedUrl: "./component/like/1.png", nonReactedUrl: "./component/like/0.png" },
                { type: "admirable", title: "admirable", color: "#FF0000", url: "sentiment_satisfied", reactedUrl: "./component/admirable/1.png", nonReactedUrl: "./component/admirable/0.png" },
                { type: "fire", title: "fire", color: "#FF0000", url: "sentiment_satisfied", reactedUrl: "./component/fire/1.png", nonReactedUrl: "./component/fire/0.png" },
                { type: "smiley", title: "smiley", color: "#FF0000", url: "sentiment_satisfied", reactedUrl: "./component/smiley/1.png", nonReactedUrl: "./component/smiley/0.png" },
            ]
        }

        static validateReactionTypes(reactionType, callback) {
            let allValidReactions = this.types;
            reactionType = reactionType.toLowerCase();
            let validState = allValidReactions.find(reaction => reaction.type === reactionType);

            if (validState) {
                return callback(null, validState)
            }
            return callback('Invalid Reaction Type');
        }
    }

    class State {
        // debounce getting item reactions to avoid multi-request to server
        static _itemIds = [];
        static _timer;
        static _observerContainers = [];
        static _observerTimer;

        // options = {itemId, getUsersData, getSummariesData}
        static debounce(options) {
            let { itemId, getUsersData, getSummariesData } = options;
            if (!itemId) {
                return console.error("Missing itemId");
            }
            // to save new item ids that will be rendered
            if (itemId && State._itemIds.indexOf(itemId) < 0) {
                State._itemIds.push(itemId);
            }

            clearTimeout(State._timer);
            State._timer = setTimeout(() => {
                let requestedIds = [...State._itemIds];
                State._itemIds = []; // if the user send new itemIds after the delay and before getting the res from db

                if (getSummariesData) {
                    ReactionsSummaries.get(requestedIds, (err, res) => {
                        if (err) console.error(err)
                        if (res) {/* show reaction summaries on items */
                            State._showAllReactionCount(res, requestedIds);
                        }
                    });
                }
                if (getUsersData) {
                    buildfire.auth.getCurrentUser((err, user) => {
                        if (err) return console.error(err);

                        if (user && user._id) {
                            Reactions.getByUserId(user._id, requestedIds, (error, result) => {
                                if (error) console.error(error);
                                if (result) {/* show users reactions on items */
                                    State._showUserReactions(result)
                                }
                            })
                        }
                    });
                }
            }, 50)
        }

        static _showAllReactionCount(summaries, itemIds) {
            // print reactions count in the dom
            summaries.forEach(summery => {
                let container = document.querySelector(`[bf-reactions-itemid="${summery.data.itemId}"]`);
                let totalReactionCount = 0;
                if (container) {
                    summery.data.reactions.forEach(reaction => {
                        totalReactionCount += reaction.count;
                    })
                    totalReactionCount = totalReactionCount > 0 ? totalReactionCount : 0;

                    let totalCountContainer = container.querySelector(`[bf-reactions-total-count]`);
                    totalCountContainer.setAttribute('bf-reactions-total-count', totalReactionCount);
                    totalCountContainer.innerHTML = totalReactionCount;
                }
            })
            // show all count containers
            let countContainers = document.querySelectorAll("[bf-reactions-total-count]");
            countContainers.forEach(el => {
                el.style.visibility = 'visible';
            })
        }

        static _showUserReactions(reactions) {
            reactions.forEach(reaction => {
                // check if the reaction is valid or not
                if (reaction && reaction.data && reaction.data.itemId && reaction.data.reactions && reaction.data.reactions.length) {
                    ReactionsTypes.validateReactionTypes(reaction.data.reactions[0].type, (e, r) => {
                        if (e) {
                            return console.error(e);
                        }
                        if (r) {
                            let container = document.querySelector(`[bf-reactions-itemid="${reaction.data.itemId}"]`);
                            let mainButton = container.querySelector('[bf-reactions-btn]');
                            let userReactionIcon = container ? container.querySelector(`[bf-reactions-type="${reaction.data.reactions[0].type}"]`) : null;

                            if (container && userReactionIcon) {
                                container.setAttribute('bf-user_react-type', reaction.data.reactions[0].type);
                                container.setAttribute('bf-user_react-id', reaction.id);
                                userReactionIcon.classList.add('reacted');
                                userReactionIcon.style.color = userReactionIcon.getAttribute('bf-reactions-color');

                                let image = mainButton.querySelector('img');
                                image.src = userReactionIcon.getAttribute('bf-reactions-reacted-url');
                                image.classList.add('reactions-show-main-icon');
                                setTimeout(() => {
                                    image.classList.remove('reactions-show-main-icon');
                                }, 300)
                            }
                        }
                    })
                }
            })
        }

        static buildObserver() {
            const observer = new MutationObserver((mutationList, observer) => {
                let allAddedElements = [];
                mutationList.forEach(element => {
                    element.addedNodes.forEach(node => {
                        if (node instanceof Element) {
                            // to get all passed elements if added inside other elements
                            allAddedElements.push(node);
                            [...node.querySelectorAll('[bf-reactions-itemid]'), ...node.querySelectorAll('[bf-reactions]')].forEach(internalPassed => allAddedElements.push(internalPassed));
                        }
                    })

                    allAddedElements.forEach(node => {
                        let newReactionInstance = {};
                        try {
                            if (node.hasAttribute('bf-reactions-itemid')) {
                                let bfOnReaction = node.getAttribute("bf-on-reaction");
                                let onReaction;
                                if (bfOnReaction) {
                                    onReaction = window[bfOnReaction];
                                }

                                newReactionInstance = {
                                    itemId: node.getAttribute("bf-reactions-itemid"),
                                    container: node,
                                    reactionType: JSON.parse(node.getAttribute("bf-reactions-reactionType")),
                                    showCount: JSON.parse(node.getAttribute("bf-reactions-showCount")),
                                    showUsersReactions: JSON.parse(node.getAttribute("bf-reactions-showUsersReactions")),
                                    onReaction,
                                }
                                if (!this._observerContainers.find(item => item.itemId === newReactionInstance.itemId)) {
                                    this._observerContainers.push(newReactionInstance);
                                }
                            } else if (node.hasAttribute('bf-reactions')) {
                                newReactionInstance = {
                                    container: node,
                                    ...JSON.parse(node.getAttribute("bf-reactions")),
                                }
                                if(newReactionInstance.onReaction){
                                    newReactionInstance.onReaction = window[newReactionInstance.onReaction];
                                }
                                if (!this._observerContainers.find(item => item.itemId === newReactionInstance.itemId)) {
                                    this._observerContainers.push(newReactionInstance);
                                }
                            }
                        } catch (error) {
                            return console.error('Error while parsing JSON: ' + error)
                        }
                    })
                })

                clearTimeout(this._observerTimer);
                this._observerTimer = setTimeout(() => {
                    let newItems = [...this._observerContainers];
                    this._observerContainers = [];
                    this.buildComponentByHTML(newItems);
                }, 50);
            });

            const config = { attributes: true, childList: true, subtree: true };
            observer.observe(document, config);
        }

        static buildComponentByHTML(elements) {
            elements.forEach(newReaction => {
                new ReactionComponent(newReaction);
            })
        }
    }

    class ReactionComponent {
        constructor(data = {}) {

            if (!data.itemId) {
                return console.error('Missing itemId');
            }
            if (!data.container && !data.selector) {
                return console.error('Missing selector');
            }

            if (data.onReaction) {
                this.onReaction = data.onReaction;
            }

            this.itemId = data.itemId;
            this.selector = data.selector || null;
            this.container = data.container || null;
            this.container = document.querySelector(this.selector) || this.container;

            this.showCount = typeof data.showCount === 'boolean' ? data.showCount : true; // default true
            this.showUsersReactions = typeof data.showUsersReactions === 'boolean' ? data.showUsersReactions : true; // show who reacted for each reaction
            this.allowMultipleReactions = false;

            if (data.reactionType && data.reactionType.length) {
                this.reactionType = []
                data.reactionType.forEach(reaction => {
                    if (!reaction.type) {
                        return console.error('Reaction must have a property type');
                    }
                    reaction.type = reaction.type.toLowerCase();
                    ReactionsTypes.validateReactionTypes(reaction.type, (error, res) => {
                        if (error) {
                            return console.error('Invalid reaction type' + reaction.type);
                        }
                        if (res) {
                            let _reaction = { ...res, ...reaction, reactedUrl: res.reactedUrl, nonReactedUrl: res.nonReactedUrl };
                            this.reactionType.push(_reaction);
                        }
                    })

                })
            } else {
                this.reactionType = ReactionsTypes.types;
            }

            this._init();
        }

        _init() {
            this._buildComponent();
            State.debounce({ itemId: this.itemId, getUsersData: true, getSummariesData: true });
        }

        _buildComponent() {
            this.container.innerHTML = null;
            // build the component HTML elements
            let iconsContainer = '';
            this.reactionType.forEach((reaction, idx) => {
                iconsContainer += ` <div reactions-icon-buttons class="reactions-icon-buttons reaction-container-show">
                                        <img style="animation-duration:${idx / 10 + 0.1}s;" bf-reactions-non-reacted-url="${reaction.nonReactedUrl}" bf-reactions-reacted-url="${reaction.reactedUrl}" bf-reactions-url="${reaction.url}" bf-reactions-type="${reaction.type}" bf-reactions-color="${reaction.color}" class="reactions-clickable-image reactions-icon-animation" src="${reaction.nonReactedUrl}" />
                                    </div>`
            });
            this.container.setAttribute('bf-reactions-itemid', this.itemId);
            this.container.setAttribute('bf-user_react-type', ''); // to save the reaction type that user reacted with
            this.container.setAttribute('bf-user_react-id', ''); // to save the reaction id that the user reacted with 
            this.container.classList.add('reactions-main-container');
            this.container.innerHTML = `
                <div class="reaction-main-button">
                    <div bf-reactions-btn class="reactions-main-icon-container" ><img class="reactions-main-icon" bf-reactions-default-src="${this.reactionType[0].nonReactedUrl}" src="${this.reactionType[0].nonReactedUrl}" /></div>
                    <span style="visibility:hidden;" class="reactions-total-count reactions-hidden" bf-reactions-total-count="0">0</span>
                </div>
                <div class="reactions-icon-container reactions-hidden" bf-reaction-icon-container>${iconsContainer}</div>
            `;

            let reactionBtn = this.container.querySelector('[bf-reactions-btn]');
            let reactionCountBtn = this.container.querySelector('[bf-reactions-total-count]');

            if (this.showCount) {
                reactionCountBtn.classList.remove('reactions-hidden');
                // show user reactions list
                if (this.showUsersReactions) {
                    reactionCountBtn.addEventListener('click', () => {
                        this._showUsersList(this.itemId);
                    })
                }
            }

            // show reactions container
            this.holdTimer = null;
            this.holdPeriod = 0;

            let startHoldTimer = (event) => {
                this._hideReactionIcons();
                // prevent download image on iOS
                if (event.target.tagName.toLowerCase() === 'img') {
                    event.preventDefault();
                }
                // press and hold to show reactions list
                this.holdTimer = setInterval(() => {
                    this.holdPeriod += 1;
                    if (this.holdPeriod > 10 && this.reactionType.length > 1) {
                        this._showReactionIcons();
                        this.holdPeriod = 0;
                        clearInterval(this.holdTimer);
                    }
                }, 50);
            }

            let clearHoldTimer = () => {
                let reactionIconsContainer = this.container.querySelector('[bf-reaction-icon-container]');
                if ((this.holdPeriod < 10 || this.reactionType.length === 1) && reactionIconsContainer && reactionIconsContainer.classList.contains('reactions-hidden')) {
                    let reactionIcons = this.container.querySelectorAll('[bf-reactions-type]');
                    let reacted = this.container.querySelector('.reacted');
                    if (reacted) {
                        this._validateUserAndReact(reacted.getAttribute('bf-reactions-type'), reacted);
                    } else {
                        this._validateUserAndReact(reactionIcons[0].getAttribute('bf-reactions-type'), reactionIcons[0]);
                    }
                }

                this.holdPeriod = 0;
                clearInterval(this.holdTimer);
            }

            reactionBtn.addEventListener('mousedown', startHoldTimer);
            reactionBtn.addEventListener('touchstart', startHoldTimer);

            reactionBtn.addEventListener('mouseup', clearHoldTimer);
            reactionBtn.addEventListener('touchend', clearHoldTimer);

            let reactionIcons = this.container.querySelectorAll('[bf-reactions-type]');
            reactionIcons.forEach(icon => {
                icon.addEventListener('click', (event) => {
                    // prevent download image on iOS
                    if (event.target.tagName.toLowerCase() === 'img') {
                        event.preventDefault();
                    }

                    this._validateUserAndReact(icon.getAttribute('bf-reactions-type'), icon);
                })
            })
        }

        _showReactionIcons() {
            let reactionIconsContainer = this.container.querySelector('[bf-reaction-icon-container]');
            if (reactionIconsContainer) {
                reactionIconsContainer.classList.remove('reactions-hidden');
            }

            document.body.addEventListener('click', (e) => {
                if (e && !this.container.contains(e.target)) {
                    this._hideReactionIcons(this.container);
                }
            });
        }

        _validateUserAndReact(newReactionType, icon) {
            buildfire.auth.getCurrentUser((err, user) => {
                if (err || !user) {
                    buildfire.auth.login({}, (err, user) => {
                        if (user && user._id) {
                            this._reactionHandler(newReactionType, icon, user._id);
                        }
                    });
                } else if (user && user._id) {
                    this._reactionHandler(newReactionType, icon, user._id);
                }
            })
        }

        _reactionHandler(newReactionType, icon, userId) {
            let userReactType = this.container.getAttribute('bf-user_react-type');

            let selectedReaction = {
                type: newReactionType,
                reactionId: this.container.getAttribute('bf-user_react-id'),
                itemId: this.container.getAttribute('bf-reactions-itemid'),
            }

            if (userReactType) {
                if (userReactType === newReactionType) {
                    this._deselectReaction({ icon, userReactType, userId, selectedReaction })
                } else {
                    this._toggleReaction({ icon, userReactType, userId, selectedReaction })
                }
            } else {
                this._addReaction({ icon, selectedReaction, userId })
            }
        }

        _addReaction(options) {
            let { icon, selectedReaction, userId, fromQueue } = options;

            this._hideReactionInconsBox({ newIcon: icon, fromQueue })

            let reactOptions = { itemId: selectedReaction.itemId, userId, reactionType: selectedReaction.type, allowMultipleReactions: this.allowMultipleReactions }
            if (this.isPending) {
                this.nextRequest = { type: 'add', options }
            } else {
                this.isPending = true;
                Reactions.react(reactOptions, (error, result) => {
                    if (error) {
                        this._hideReactionInconsBox({ oldIcon: icon });
                        return console.error('Error while adding new Reaction: ' + error)
                    } else if (result) {

                        this.container.setAttribute('bf-user_react-id', result.data.data.id);
                        this.onReaction({ status: 'add', reactionType: selectedReaction.type, itemId: selectedReaction.itemId, userId })

                        if (result.status === 'added') {
                            let options = { reactionType: selectedReaction.type, itemId: selectedReaction.itemId, userId }
                            ReactionsSummaries.increment(options, (err, res) => {
                                this._checkPendingRequest();

                                if (err) return console.error(err);
                                if (res.status === 'done') {

                                } else if (res.status === 'noAction') {
                                    // nothing will be happened
                                }
                            });
                        } else if (result.status === 'updated') {
                            let options = { reactionType: selectedReaction.type, itemId: selectedReaction.itemId, userId }
                            ReactionsSummaries.increment(options, (err, res) => {
                                this._checkPendingRequest();

                                if (err) return console.error(err);
                                if (res.status === 'done') {

                                } else if (res.status === 'noAction') {
                                    // nothing will be happened
                                }
                            });
                            // nothing will be happened
                        } else if (result.status === 'noAction') {
                            this._checkPendingRequest();
                            // nothing will be happened
                        }
                    }
                });
            }
        }

        _toggleReaction(options) {
            let { icon, userReactType, userId, selectedReaction, fromQueue } = options;

            let itemId = selectedReaction.itemId
            this._hideReactionInconsBox({ fromQueue, newIcon: icon, oldIcon: this.container.querySelector(`[bf-reactions-type="${userReactType}"]`) });

            if (this.isPending) {
                this.nextRequest = { type: 'update', options }
            } else {
                this.isPending = true;
                let reactOptions = { itemId, userId, reactionType: selectedReaction.type, reactionId: selectedReaction.reactionId, allowMultipleReactions: this.allowMultipleReactions }
                Reactions.unReactReact(reactOptions, (error, result) => {
                    if (error) {
                        this._hideReactionInconsBox({ oldIcon: icon, newIcon: this.container.querySelector(`[bf-reactions-type="${userReactType}"]`) });
                        return console.error('Error while updated the Reaction: ' + error)
                    } else if (result) {
                        // reaction updated successfully 
                        this.onReaction({ status: 'update', reactionType: selectedReaction.type, itemId, userId })
                        if (result.status === 'updated') {

                            // decrement for the old type and increment the new one
                            ReactionsSummaries.decrement({ itemId, reactionType: userReactType }, (err, res) => {
                                this._checkPendingRequest();
                                if (err) return console.error(err)
                            });
                            ReactionsSummaries.increment({ itemId, reactionType: selectedReaction.type, userId }, (err, res) => {
                                this._checkPendingRequest();
                                if (err) return console.error(err)
                            });
                        } else if (result.status === 'added') {
                            ReactionsSummaries.increment({ itemId, reactionType: userReactType, userId }, (err, res) => {
                                this._checkPendingRequest();
                                if (err) return console.error(err)
                            });
                            // nothing will be happened
                        } else if (result.status === 'noAction') {
                            this._checkPendingRequest();
                            // nothing will be happened
                        }
                    }
                })
            }
        }

        _deselectReaction(options) {
            let { icon, userReactType, userId, selectedReaction, fromQueue } = options;

            let reactionId = selectedReaction.reactionId;
            let itemId = selectedReaction.itemId;
            let reactionType = userReactType;

            let reactOptions = { itemId, userId, reactionId, reactionType, allowMultipleReactions: this.allowMultipleReactions }

            this._hideReactionInconsBox({ oldIcon: icon, fromQueue });

            if (this.isPending) {
                this.nextRequest = { type: 'delete', options }
            } else {
                this.isPending = true;
                Reactions.unReact(reactOptions, (error, result) => {
                    if (error) {
                        this._hideReactionInconsBox({ newIcon: icon });
                        return console.error('Error while deleting the Reaction: ' + error)
                    } else if (result) {
                        if (result.status === 'deleted') {
                            this.onReaction({ status: 'delete', reactionType: userReactType, itemId, userId })

                            /* Reaction deleted successfully */
                            ReactionsSummaries.decrement({ itemId, reactionType }, (err, res) => {
                                this._checkPendingRequest();
                                if (err) return console.error(err)
                            });
                        } else if (result.status === 'noAction') {
                            this._checkPendingRequest();
                            this.onReaction({ status: 'delete', reactionType: userReactType, itemId, userId })
                            // nothing will be happened
                        }
                    }
                });
            }
        }

        _checkPendingRequest() {
            this.isPending = false;
            if (this.nextRequest) {
                switch (this.nextRequest.type) {
                    case 'add':
                        this._addReaction({...this.nextRequest.options, fromQueue:true})
                        break;
                    case 'update':
                        this._toggleReaction({...this.nextRequest.options, fromQueue:true})
                        break;
                    case 'delete':
                        this._deselectReaction({...this.nextRequest.options, fromQueue:true})
                        break;
                }
            }
            this.nextRequest = {};
        }

        _hideReactionInconsBox(options) {
            let { newIcon, oldIcon, fromQueue } = options;

            this._hideReactionIcons();

            if(!fromQueue){
                let mainButton = this.container.querySelector('[bf-reactions-btn]');
    
                if (oldIcon) {
                    oldIcon.classList.remove('reacted');
                    this.container.setAttribute('bf-user_react-type', '');
                    this.container.setAttribute('bf-user_react-id', '');
                }
    
                if (newIcon) {
                    newIcon.classList.add('reacted');
                    this.container.setAttribute('bf-user_react-type', newIcon.getAttribute('bf-reactions-type'));
    
                    let image = mainButton.querySelector('img');
                    image.src = newIcon.getAttribute('bf-reactions-reacted-url');
                    image.classList.add('reactions-show-main-icon');
                    setTimeout(() => {
                        image.classList.remove('reactions-show-main-icon');
                    }, 300)
                }
    
                if (newIcon && !oldIcon) {
                    let reactionsCountContainer = this.container.querySelector('[bf-reactions-total-count]');
                    let reactionsCount = reactionsCountContainer.getAttribute('bf-reactions-total-count');
                    let newCount = parseInt(reactionsCount) + 1;
                    reactionsCountContainer.setAttribute('bf-reactions-total-count', newCount);
                    reactionsCountContainer.innerHTML = newCount;
                }
    
                if (!newIcon && oldIcon) {
                    let reactionsCountContainer = this.container.querySelector('[bf-reactions-total-count]');
                    let reactionsCount = reactionsCountContainer.getAttribute('bf-reactions-total-count');
                    let newCount = parseInt(reactionsCount) - 1;
                    newCount = newCount >= 0 ? newCount : 0
                    reactionsCountContainer.setAttribute('bf-reactions-total-count', newCount);
                    reactionsCountContainer.innerHTML = newCount;
    
                    let image = mainButton.querySelector('img');
                    image.src = this.reactionType[0].nonReactedUrl;
                    image.classList.add('reactions-show-main-icon');
                    setTimeout(() => {
                        image.classList.remove('reactions-show-main-icon');
                    }, 300)
                }
            }
        }

        _hideReactionIcons(hideElement) {
            if (hideElement) {
                let reactionBox = hideElement.querySelector('[bf-reaction-icon-container]')
                reactionBox.classList.remove('reaction-container-show');
                reactionBox.classList.add('reaction-container-hide');
                setTimeout(() => {
                    reactionBox.classList.remove('reaction-container-hide');
                    reactionBox.classList.add('reaction-container-show');
                    reactionBox.classList.add('reactions-hidden');
                }, 250)
            } else {
                document.querySelectorAll('[bf-reaction-icon-container]').forEach(reactionBox => {
                    reactionBox.classList.remove('reaction-container-show');
                    reactionBox.classList.add('reaction-container-hide');
                    setTimeout(() => {
                        reactionBox.classList.remove('reaction-container-hide');
                        reactionBox.classList.add('reaction-container-show');
                        reactionBox.classList.add('reactions-hidden');
                    }, 250)
                })
            }
        }

        _showUsersList(itemId, reactionType) {
            let listItems = [];
            buildfire.spinner.show();

            let _setUsersList = (reactions, index, callBack) => {
                let reaction = reactions[index];

                let url = this.reactionType.find(reactionType => reactionType.type === reaction.data.reactions[0].type).reactedUrl;
                let color = this.reactionType.find(reactionType => reactionType.type === reaction.data.reactions[0].type).color;
                buildfire.auth.getUserProfile({ userId: reaction.data.userId }, (err, user) => {
                    if (err) return console.error(err);
                    listItems.push({
                        text: `<div class="reactions-users-list" style="display: flex;width: calc(100vw - 85px);justify-content: space-between;align-items: center;">
                                    <p style="max-width: 75%;">${user.displayName ? user.displayName : user.firstName ? user.firstName : 'User'}</p>
                                    <span style="color:${color} !important;" class="material-icons material-icons-sharp"><img style="width: 32px;height: 32px;" src="${url}" /></span>
                                </div>`,
                        imageUrl: user.imageUrl
                    })
                    if (index == reactions.length - 1) {
                        this._openDrawer(listItems);
                    } else {
                        callBack(reactions, index + 1, _setUsersList)
                    }
                });
            }

            let options = { itemId, pageIndex: 0, pageSize: 50 };
            Reactions.get(options, (error, result) => {
                if (error) { }
                else if (result.length) {
                    _setUsersList(result, 0, _setUsersList);
                } else {
                    this._openDrawer([]);
                }
            })
        }

        _openDrawer(listItems) {
            buildfire.spinner.hide();
            buildfire.components.drawer.open(
                {
                    content: 'Reactions',
                    isHTML: true,
                    triggerCallbackOnUIDismiss: false,
                    autoUseImageCdn: true,
                    listItems
                },
                (err, result) => {
                    if (err) return console.error(err);
                }
            );
        }

        onReaction(event) { }

        static refresh() {
            let validNodes = document.querySelectorAll('[bf-reactions-itemid]');
            validNodes.forEach(node => {
                let mainBtn = node.querySelector('[bf-reactions-default-src]');
                if (mainBtn) {
                    mainBtn.src = mainBtn.getAttribute('bf-reactions-default-src');
                }

                let itemId = node.getAttribute('bf-reactions-itemid');
                if (itemId) {
                    State.debounce({ itemId, getUsersData: true });
                }
            })
        }

        static build() {
            State.buildObserver();
        }
    }

    return ReactionComponent;
})();