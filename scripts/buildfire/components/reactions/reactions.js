
if (typeof buildfire == 'undefined')
    throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};


buildfire.components.reactions = (() => {

    // data model
    class Reaction {
        constructor(data = {}) {
            this.itemId = data.itemId || null;
            this.userId = data.userId || null;

            this.reactions = data.reactions || []; // object (type, createdOn)  {type: "like", createdOn: date}, {type: "heart"}
            this._buildfire = data._buildfire || {};
        }
    }

    class Reactions {
        static get TAG() {
            return "$$reactions";
        }

        // how it should works
        // on each React:
        // 1-  we go search()
        // 2- if DB row not exists -> insert()
        // 3- if exists and type exists return noAction
        // 4- if exists and type not exists -> update()

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

                    return callback(null, result);
                }
            );
        }

        // options: reaction, reactionType, operation, allowMultipleReactions
        static _update(options, callback) {

            if (!options) {
                throw new Error("Invalid options. Options must be set and have at least reaction, reactionType and operation properties!");
            }
            if (!["add", "remove", "toggle"].includes(options.operation)) {
                throw new Error("Invalid operations option. Operations coulde be one of the following:  add, remove or toggle");
            }
            if (!options.reaction) {
                throw new Error("Invalid options, Missing reaction!");
            }

            if (!options.reactionType && ReactionsTypes.validateReactionTypes(options.reactionType)) {
                throw new Error("Invalid options, Missing reactionType!");
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
            if (!options) {
                throw new Error("Invalid options. Options must be set and have at least oldReactionType, newReactionType, userId and itemId properties!");
            }
            if (!options.itemId) {
                throw new Error("Invalid options, Missing itemId!");
            }
            if (!options.userId) {
                throw new Error("Invalid options, Messing userId!");
            }
            if (!options.reactionType) {
                throw new Error("Invalid options, Missing reactionType!");
            }
            if (typeof callback !== 'function') {
                throw new Error("callback must be a function!");
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
                            return callback(null, { status: 'done', data: result, oldReactionType: oldReactionType })
                        })
                    }
                } else {
                    this._insert(options, (err, result) => {
                        if (err) {
                            return callback(err);
                        }
                        // analytics should be by  1. itemId-type-react
                        // analytics should be by  2. itemId-type-unReact
                        return callback(null, { status: 'done', data: result, oldReactionType: "" })
                    })
                }
            })

        }

        // options: {itemId, userId, reactionId=null, reactionType}
        static react(options, callback) {
            if (!options) {
                throw new Error("Invalid options. Options must be set and have at least reactionType, userId and itemId properties!");
            }
            if (!options.itemId) {
                throw new Error("Invalid options, Missing itemId!");
            }
            if (!options.reactionType) {
                throw new Error("Invalid options, Missing reactionType!");
            }
            if (!options.userId) {
                throw new Error("Invalid options, Messing userId!");
            }

            if (typeof callback !== 'function') {
                throw new Error("callback must be a function!");
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
                            return callback(null, { status: 'done', data: result })
                        })
                    }
                } else {
                    this._insert(options, (err, result) => {
                        if (err) {
                            return callback(err);
                        }
                        // analytics should be by  1. itemId-type-react
                        // analytics should be by  2. itemId-type-unReact
                        return callback(null, { status: 'done', data: result })
                    })
                }
            })
        }

        // options: {itemId, userId, reactionId=null, reactionType}
        static unReact(options, callback) {

            if (!options) {
                throw new Error("Invalid options. Options must be set and have at least reactionType, userId and itemId properties!");
            }
            if (!options.itemId) {
                throw new Error("Invalid options, Missing itemId!");
            }
            if (!options.userId) {
                throw new Error("Invalid options, Messing userId!");
            }
            if (!options.reactionType) {
                throw new Error("Invalid options, Missing reactionType!");
            }
            if (typeof callback !== 'function') {
                throw new Error("callback must be a function!");
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

                        // if the reaction type we are going to remive is the only one left, delte the whole records
                        if (reaction.reactions.length == 1) {

                            buildfire.appData.delete(reaction.id, this.TAG, (err, result) => {
                                if (err && err.code == "NOTFOUND") {
                                    return callback(null, { status: 'noAction' });
                                } else if (err) {
                                    return callback(err);
                                }
                                return callback(null, { status: 'done' });
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
                                return callback(null, { status: 'done', data: result })
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
            let { itemId, reactionType, pageIndex, pageSize } = options;

            if (!itemId) {
                throw new Error("Invalid get options!");
            }

            if (!callback || typeof callback !== 'function') {
                throw new Error("callback must be a function!");
            }

            if (typeof pageIndex !== 'number') {
                pageIndex = 0;
            }

            if (!pageSize) {
                pageSize = 50;
            }

            let filter = {};
            if (reactionType && false) {
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

        static getByUserId(userId, itemIds, callback) { // array of item ids ????
            if (!userId || typeof userId !== 'string' || !itemIds || !itemIds.length) {
                throw new Error('Invalid arguments');
            }

            if (!callback || typeof callback !== 'function') {
                throw new Error("callback must be a function!");
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
            if (!itemIds) {
                throw new Error("Invalid get options!");
            }

            if (typeof callback !== 'function' || !callback) {
                throw new Error("callback must be a function!");
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

        static increment(summery, callback) {
            if (!summery.itemId || !summery.reactions || !summery.reactions.length) {
                throw new Error("Invalid ReactionsSummeries data!");
            }

            if (!callback || typeof callback !== 'function') {
                throw new Error("callback must be a function!");
            }

            summery._buildfire.index = this.buildIndex(summery);
            this._search(summery.itemId, (err, result) => {
                if (err) {
                    return callback(err)
                }
                if (result && result.length) {
                    let filter = {}, obj = {};
                    let dbReactions = result[0].data.reactions, newReaction = summery.reactions[0].type;
                    let validReactionType = dbReactions.find(reaction => reaction.type == newReaction)
                    if (validReactionType) {
                        filter = {
                            '_buildfire.index.string1': summery._buildfire.index.string1,
                            "reactions.type": newReaction
                        }
                        obj = { $inc: { "reactions.$.count": 1 } }
                    } else {
                        filter = {
                            '_buildfire.index.string1': summery._buildfire.index.string1,
                        }
                        obj = { $addToSet: { reactions: summery.reactions[0], "_buildfire.index.array1": { string1: 'reactionType-' + newReaction } } }
                    }
                    this._update(filter, obj, (err, result) => {
                        if (err) {
                            return callback(err)
                        }
                        return callback(null, { status: 'done' })
                    })
                } else {
                    this._create(summery, (err, result) => {
                        if (err) {
                            return callback(err)
                        }
                        return callback(null, { status: 'done' })
                    })
                }
            })
        }

        static decrement(options, callback) {
            let { itemId, reactionType } = options;

            if (!itemId || !reactionType) {
                throw new Error("Invalid get options!");
            }

            if (!callback || typeof callback !== 'function') {
                throw new Error("callback must be a function!");
            }
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
                { type: "like", title: "like", color: "#FF0000", url: "sentiment_satisfied", reactedUrl: "https://pngimg.com/uploads/like/like_PNG51.png", nonReactedUrl: "https://icon-library.com/images/like-icon-transparent/like-icon-transparent-7.jpg" },
                { type: "heart", title: "heart", color: "#FF0000", url: "sentiment_satisfied", reactedUrl: "https://i.natgeofe.com/k/7bfcf2d2-542e-44f0-962a-c36f2efa98a5/heart.jpg", nonReactedUrl: "https://assets.churchofjesuschrist.org/37/92/3792230683d2795443b919278fc331b5f67683c91061391/heart.jpeg" }
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
        // TODO: hide count before reciving res
        // TODO: when recive res hide all types eccept user current reaction type

        // debounce getting item reactions to avoid multi-request to server
        static _itemIds = [];
        static _timer;
        static _observerContainers = [];
        static _observerTimer;
        static enableShowIcons = true;

        static debounce(itemId) {
            // to save new item ids that will be rendered
            if (itemId && State._itemIds.indexOf(itemId) < 0) {
                State._itemIds.push(itemId);
            }

            clearTimeout(State._timer);
            State._timer = setTimeout(() => {
                let requestedIds = [...State._itemIds];
                State._itemIds = []; // if the user send new itemIds after the delay and before getting the res from db

                ReactionsSummaries.get(requestedIds, (err, res) => {
                    if (err) console.log(err)
                    if (res) {/* show reaction summaries on items */
                        State._showAllReactionCount(res, requestedIds);
                    }
                    console.log(res, requestedIds);
                });
                buildfire.auth.getCurrentUser((err, user) => {
                    if (err) return console.error(err);

                    if (user && user._id) {
                        Reactions.getByUserId(user._id, requestedIds, (error, result) => {
                            if (error) console.log(error);
                            if (result) {/* show users reactions on items */
                                State._showUserReactions(result)
                            }
                            console.log(result);
                        })
                    }
                });
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

                    let totalCountContainer = container.querySelector(`[bf-reactions-total-count]`);
                    totalCountContainer.setAttribute('bf-reactions-total-count', totalReactionCount);
                    totalCountContainer.innerHTML = totalReactionCount;
                }
            })
        }

        static _showUserReactions(reactions) {
            let allReactionTypes = ReactionsTypes.types;
            reactions.forEach(reaction => {
                // check if the reaction is valid or not
                if (reaction && reaction.data && reaction.data.itemId && reaction.data.reactions && reaction.data.reactions.length) {
                    let container = document.querySelector(`[bf-reactions-itemid="${reaction.data.itemId}"]`);
                    let mainButton = container.querySelector('[bf-reactions-btn]');
                    if (container) {
                        let userReactionIcon = container.querySelector(`[bf-reactions-type="${reaction.data.reactions[0].type}"]`);
                        let userType = allReactionTypes.find(_reaction => _reaction.type === reaction.data.reactions[0].type);

                        container.setAttribute('bf-user_react-type', reaction.data.reactions[0].type);
                        container.setAttribute('bf-user_react-id', reaction.id);
                        userReactionIcon.classList.add('reacted');
                        userReactionIcon.style.color = userReactionIcon.getAttribute('bf-reactions-color');

                        mainButton.querySelector('img').src = userReactionIcon.getAttribute('bf-reactions-reacted-url');
                    }
                }
            })
        }

        static buildObserver(callback) {
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
                                newReactionInstance = {
                                    itemId: node.getAttribute("bf-reactions-itemid"),
                                    container: node,
                                    reactionType: JSON.parse(node.getAttribute("bf-reactions-reactionType")),
                                    showCount: JSON.parse(node.getAttribute("bf-reactions-showCount")),
                                    showUsersReactions: JSON.parse(node.getAttribute("bf-reactions-showUsersReactions")),
                                    onReaction: callback
                                }
                                this._observerContainers.push(newReactionInstance);
                            } else if (node.hasAttribute('bf-reactions')) {
                                newReactionInstance = {
                                    container: node,
                                    onReaction: callback,
                                    ...JSON.parse(node.getAttribute("bf-reactions"))
                                }
                                this._observerContainers.push(newReactionInstance);
                            }
                        } catch (error) {
                            throw new Error('Error while parsing JSON: ' + error)
                        }
                    })
                })

                clearTimeout(this._observerTimer);
                this._observerTimer = setTimeout(() => {
                    let newItems = [...this._observerContainers];
                    this._observerContainers = [];
                    this.buildByHTML(newItems);
                }, 100);
            });

            const config = { attributes: true, childList: true, subtree: true };
            observer.observe(document, config);
        }

        static buildByHTML(elements) {
            elements.forEach(newReaction => {
                new ReactionComponent(newReaction);
            })
        }
    }

    class ReactionComponent {
        constructor(data = {}) {

            if (!data.itemId) {
                throw new Error('Missing itemId');
            }
            if (!data.container && !data.selector) {
                throw new Error('Missing selector');
            }
            if (data.onReaction) {
                this.onReaction = data.onReaction;
            }

            this.itemId = data.itemId;
            this.selector = data.selector || null; 
            this.container = data.container || null; 
            this.container = document.querySelector(this.selector) || this.container;

            this.showCount = typeof data.showCount === 'boolean' ? data.showCount : false; // default false
            this.showUsersReactions = typeof data.showUsersReactions === 'boolean' ? data.showUsersReactions : false; // show who reacted for each reaction
            this.allowMultipleReactions = false;

            if (data.reactionType && data.reactionType.length) {
                this.reactionType = []
                data.reactionType.forEach(reaction => {
                    if (!reaction.type) {
                        throw new Error('Reaction must have a property type');
                    }
                    reaction.type = reaction.type.toLowerCase();
                    ReactionsTypes.validateReactionTypes(reaction.type, (error, res) => { 
                        if (error) {
                            throw new Error('Invalid reaction type' + reaction.type);
                        }
                        if (res) {
                            let _reaction = { ...res, ...reaction };
                            this.reactionType.push(_reaction);
                        }
                    })

                })
            } else {
                throw new Error('Missing reactionTypes');
            }

            this._init();
        }

        _init() {
            this._buildComponent();
            State.debounce(this.itemId);
        }

        _buildComponent() {
            // build the component HTML elements
            let iconsContainer = '';
            this.reactionType.forEach((reaction, idx) => {
                iconsContainer += ` <div reactions-icon-buttons class="reactions-icon-buttons reaction-container-show">
                                        <img bf-reactions-non-reacted-url="${reaction.nonReactedUrl}" bf-reactions-reacted-url="${reaction.reactedUrl}" bf-reactions-url="${reaction.url}" bf-reactions-type="${reaction.type}" bf-reactions-color="${reaction.color}" class="reactions-clickable-image reactions-icon-animation" src="${reaction.reactedUrl}" />
                                    </div>`
            });

            this.container.setAttribute('bf-reactions-itemid', this.itemId);
            this.container.setAttribute('bf-user_react-type', ''); // to save the reaction type that user reacted with
            this.container.setAttribute('bf-user_react-id', ''); // to save the reaction id that the user reacted with 
            this.container.classList.add('reactions-main-container');
            this.container.innerHTML = `
                <div class="reaction-main-button">
                    <div bf-reactions-btn class="reactions-main-icon-container" ><img class="reactions-main-icon" src="${this.reactionType[0].nonReactedUrl}" /></div>
                    <span class="reactions-total-count" bf-reactions-total-count="0">0</span>
                </div>
                <div class="reactions-icon-container reactions-hidden" bf-reaction-icon-container>${iconsContainer}</div>
            `;

            let reactionBtn = this.container.querySelector('[bf-reactions-btn]');
            let reactionCountBtn = this.container.querySelector('[bf-reactions-total-count]');

            // show user reactions list
            reactionCountBtn.addEventListener('click', () => {
                this._showUsersList(this.itemId);
            })
            
            // show reactions container
            this.holdTimer = null;
            this.holdPeriod = 0;

            let startHoldTimer = () => {
                State.enableShowIcons = true;
                this.holdTimer = setInterval(() => {
                    this.holdPeriod += 1;
                    if (this.holdPeriod > 10) {
                        this._showReactionIcons();

                        this.holdPeriod = 0;
                        clearInterval(this.holdTimer);
                    }
                }, 50);
            }

            let clearHoldTimer = () => {
                if (this.holdPeriod > 10) {
                    this._showReactionIcons();
                } else {
                    // do the reaction or unreaction
                    let reactionIcons = this.container.querySelectorAll('[bf-reactions-type]');
                    let reacted = this.container.querySelector('.reacted');
                    if(reacted){
                        this._validateUserAndReact(reacted.getAttribute('bf-reactions-type'), reacted);
                    }else{
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

            // hide reactions when user clicked outside
            document.addEventListener('click', (event) => {
                if (!State.enableShowIcons) {
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
            });

            let reactionIcons = this.container.querySelectorAll('[bf-reactions-type]');
            reactionIcons.forEach(icon => {
                icon.addEventListener('click', () => {
                    this._validateUserAndReact(icon.getAttribute('bf-reactions-type'), icon);
                })
            })
        }

        _showReactionIcons() {
            this.holdPeriod = 0;
            clearInterval(this.holdTimer);

            State.enableShowIcons = true;
            setTimeout(() => {
                State.enableShowIcons = false;
            }, 300)
            let reactionIconsContainer = this.container.querySelector('[bf-reaction-icon-container]');
            if (reactionIconsContainer) {
                reactionIconsContainer.classList.remove('reactions-hidden');
            }
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

            // trigger when the user click on reaction icon

            // if the user select a type that he reacted with, then it will be removed
            // if the user click on the same reaction type, then the reaction will be removed
            // otherwise the reaction will be updated

            // edge cases: 
            // 1. if the user reacted with other type
            // 2. if the user is not logged in
            let userReactType = this.container.getAttribute('bf-user_react-type');

            let selectedReaction = {
                type: newReactionType,
                reactionId: this.container.getAttribute('bf-user_react-id'),
                itemId: this.container.getAttribute('bf-reactions-itemid'),
            }

            if (userReactType) {
                if (userReactType === newReactionType) {
                    // delete the reaction
                    this._deleteReaction({ icon, userReactType, userId, selectedReaction })
                } else {
                    // update the reaction
                    this._updateReaction({ icon, userReactType, userId, selectedReaction })
                }
            } else {
                // add new reaction
                this._addReaction({ icon, selectedReaction, userId })
            }
        }

        _addReaction(options) {
            let { icon, selectedReaction, userId } = options;

            this._hideReactionInconsBox({ newIcon: icon })

            let reactOptions = { itemId: selectedReaction.itemId, userId, reactionType: selectedReaction.type, allowMultipleReactions: this.allowMultipleReactions }
            Reactions.react(reactOptions, (error, result) => {
                if (error) {
                    this._hideReactionInconsBox({ oldIcon: icon });
                    throw new Error('Error while adding new Reaction: ' + error)
                } else if (result) {

                    this.container.setAttribute('bf-user_react-id', result.data.id);

                    if (result.status === 'done') {
                        this.onReaction({ status: 'add', reactionType: selectedReaction.type, itemId: selectedReaction.itemId, userId })

                        let summery = new ReactionsSummary({
                            itemId: selectedReaction.itemId,
                            reactions: [{ type: selectedReaction.type, count: 1, lastReactionBy: userId }],
                        })
                        ReactionsSummaries.increment(summery, (err, res) => {
                            if (err) return console.log(err);
                            if (res.status === 'done') {

                            } else if (res.status === 'noAction') {
                                // nothing will be happened
                            }
                        });
                    } else if (res.status === 'noAction') {
                        this.onReaction({ status: 'add', reactionType: selectedReaction.type, itemId: selectedReaction.itemId, userId })
                        // nothing will be happened
                    }
                }
            });
        }

        _updateReaction(options) {
            let { icon, userReactType, userId, selectedReaction } = options;

            let itemId = selectedReaction.itemId
            this._hideReactionInconsBox({ newIcon: icon, oldIcon: this.container.querySelector(`[bf-reactions-type="${userReactType}"]`) });

            let reactOptions = { itemId, userId, reactionType: selectedReaction.type, reactionId: selectedReaction.reactionId, allowMultipleReactions: this.allowMultipleReactions }
            Reactions.unReactReact(reactOptions, (error, result) => {
                if (error) {
                    this._hideReactionInconsBox({ oldIcon: icon, newIcon: this.container.querySelector(`[bf-reactions-type="${userReactType}"]`) });
                } else if (result) {
                    // reaction updated successfully 
                    if (result.status === 'done') {
                        this.onReaction({ status: 'update', reactionType: selectedReaction.type, itemId, userId })

                        // decrement for the old type and increment the new one
                        let summary = new ReactionsSummary({
                            itemId, reactions: [{ type: selectedReaction.type, count: 1, lastReactionBy: userId }]
                        })
                        ReactionsSummaries.decrement({ itemId, reactionType: userReactType }, (err, res) => { if (err) return console.log(err) });
                        ReactionsSummaries.increment(summary, (err, res) => { if (err) return console.log(err) });
                    } else if (result.status === 'noAction') {
                        this.onReaction({ status: 'update', reactionType: selectedReaction.type, itemId, userId })
                        // nothing will be happened
                    }
                }
            })
        }

        _deleteReaction(options) {
            let { icon, userReactType, userId, selectedReaction } = options;

            let reactionId = selectedReaction.reactionId;
            let itemId = selectedReaction.itemId;
            let reactionType = userReactType;

            let reactOptions = { itemId, userId, reactionId, reactionType, allowMultipleReactions: this.allowMultipleReactions }

            this._hideReactionInconsBox({ oldIcon: icon });
            Reactions.unReact(reactOptions, (error, result) => {
                if (error) {
                    this._hideReactionInconsBox({ newIcon: icon });
                } else if (result) {
                    if (result.status === 'done') {
                        this.onReaction({ status: 'delete', reactionType: userReactType, itemId, userId })

                        /* Reaction deleted successfully */
                        ReactionsSummaries.decrement({ itemId, reactionType }, (err, res) => { if (err) return console.log(err) });
                    } else if (result.status === 'noAction') {
                        this.onReaction({ status: 'delete', reactionType: userReactType, itemId, userId })
                        // nothing will be happened
                    }
                }
            });
        }

        _hideReactionInconsBox(options) {
            let { newIcon, oldIcon } = options;
            let mainButton = this.container.querySelector('[bf-reactions-btn]');

            if (oldIcon) {
                oldIcon.classList.remove('reacted');
                this.container.setAttribute('bf-user_react-type', '');
                this.container.setAttribute('bf-user_react-id', '');
            }

            if (newIcon) {
                newIcon.classList.add('reacted');
                this.container.setAttribute('bf-user_react-type', newIcon.getAttribute('bf-reactions-type'));
                this.container.setAttribute('bf-user_react-id', '');

                mainButton.querySelector('img').src = newIcon.getAttribute('bf-reactions-reacted-url');
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
                reactionsCountContainer.setAttribute('bf-reactions-total-count', newCount);
                reactionsCountContainer.innerHTML = newCount;

                mainButton.querySelector('img').src = this.reactionType[0].nonReactedUrl;
            }

            let reactionIconsContainer = this.container.querySelector('[bf-reaction-icon-container]');
            reactionIconsContainer.classList.remove('reaction-container-show');
            reactionIconsContainer.classList.add('reaction-container-hide');
            setTimeout(() => {
                reactionIconsContainer.classList.remove('reaction-container-hide');
                reactionIconsContainer.classList.add('reaction-container-show');
                reactionIconsContainer.classList.add('reactions-hidden');
            }, 250)
        }

        // TODO: drawer 
        // 1. load dynamically --> from app
        // 2. skeleton --> from app
        // 3. render icons --> can be solved using CSS injection
        // 4. text and icons width --> width: calc(100vw - 85px);

        _showUsersList(itemId, reactionType) {
            let options = { itemId, reactionType, pageIndex: 0, pageSize: 50 };
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
                    console.log("Selected Contacts", result);
                }
            );
        }

        onReaction(event) {

        }

        refresh() {
            // TODO: scan all existing DOM elem //  use bf-reactions-itemid attribute
            // typical use case: after onLOgin / onLogout
            buildfire.auth.onLogin(() => {
                State.debounce(this.itemId);
            }, true);

            buildfire.auth.onLogout(() => {
                let userReactionType = this.container.getAttribute('bf-user_react-type');
                let userReactionIcon = this.container.querySelector(`[bf-reactions-type="${userReactionType}"]`);

                if (userReactionIcon) {
                    userReactionIcon.classList.remove('reacted');
                    userReactionIcon.style.color = 'var(--bf-theme-body-text)';
                }

                this.container.setAttribute('bf-user_react-type', '');
                this.container.setAttribute('bf-user_react-id', '');
            }, true);
        }

        static build(callback) {
            State.buildObserver(callback);
        }
    }

    return ReactionComponent;
})();