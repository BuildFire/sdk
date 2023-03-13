
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

        // options: {itemId, userId, reactionsId=null, reactionType}
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

            if(options.allowMultipleReactions){
                if (options.operation == "add" || options.operation == "toggle") {
                    obj = {$addToSet: {reactions: { type: options.reactionType, createdOn: new Date() }}}
                } else if (options.operation == "remove") {
                    obj = {$pull: {reactions: { type: options.reactionType }}}
                }
            }else{
                if (options.operation == "add" || options.operation == "toggle") {
                    obj = {$set: {reactions: [{ type: options.reactionType, createdOn: new Date() }]}}
                } else if (options.operation == "remove") {
                    obj = {$set: {reactions: []}}
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

        // options: {itemId, userId, reactionsId=null, reactionType}
        static _search(options, callback) {

            if (options.reactionsId) {
                buildfire.appData.getById(options.reactionsId, this.TAG, (err, result) => {
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

        // options: {itemId, userId, reactionsId=null, reactionType, allowMultipleReactions}
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
                            allowMultipleReactions:options.allowMultipleReactions
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

        // options: {itemId, userId, reactionsId=null, reactionType}
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

        // options: {itemId, userId, reactionsId=null, reactionType}
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

        static get(options, callback) { // fetch who reacted for specific item
            let { itemId, reactionType, pageIndex, pageSize } = options;

            if (!itemId || !reactionType) {
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

            buildfire.appData.search(
                {
                    filter: {
                        "_buildfire.index.array1.string1": "reactionType-" + itemId + "-" + reactionType
                    },
                    page: pageIndex,
                    pageSize,
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
                    let validReactionType = dbReactions.find(r => r.type == newReaction)
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
                    let typeData = result[0].data.reactions.find(r => r.type == reactionType);
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
                array1: data.reactions.map(r => ({ string1: 'reactionType-' + r.type }))
            };

            return index;
        }
    }

    class ReactionsTypes {
        static get types() {
            return [
                { type: "like", title: "like", color: "#FF0000", url: "sentiment_satisfied" },
                { type: "heart", title: "heart", color: "#FF0000", url: "favorite" },
                { type: "sad", title: "sad", color: "#FF0000", url: "water_drop" },
                { type: "angry", title: "angry", color: "#FF0000", url: "flight" },
                { type: "fire", title: "fire", color: "#EC971F", url: "local_fire_department" },
            ]
        }

        static validateReactionTypes(reactionType, callback){
            let allValidReactions = this.types;
            reactionType = reactionType.toLowerCase();
            let validState = allValidReactions.find(r => r.type === reactionType);

            if(validState){
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
                        Reactions.getByUserId(user._id, requestedIds, (e, r) => {
                            if (e) console.log(e);
                            if (r) {/* show users reactions on items */
                                State._showUserReactions(r)
                            }
                            console.log(r);
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
                    summery.data.reactions.forEach(r => {
                        let countContainer = container.querySelector(`[bf-reactions-count="${r.type}"]`);
                        countContainer.innerHTML = r.count;
                        totalReactionCount += r.count;
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
                if(reaction && reaction.data && reaction.data.itemId && reaction.data.reactions && reaction.data.reactions.length){
                    let container = document.querySelector(`[bf-reactions-itemid="${reaction.data.itemId}"]`);
                    if (container) {
                        let userReactionIcon = container.querySelector(`[bf-reactions-type="${reaction.data.reactions[0].type}"]`);
                        let userType = allReactionTypes.find(t => t.type === reaction.data.reactions[0].type);
    
                        container.setAttribute('bf-user_react-type', reaction.data.reactions[0].type);
                        container.setAttribute('bf-user_react-id', reaction.id);
                        userReactionIcon.classList.add('reacted');
                        userReactionIcon.style.color = userReactionIcon.getAttribute('bf-reactions-color');
    
                        let userToggoledIcon = container.querySelector(`[bf-reaction-current-toggled]`);
                        if (userToggoledIcon) {
                            userToggoledIcon.classList.remove('reactions-hidden');
                            userToggoledIcon.innerHTML = userType.url;
                            userToggoledIcon.style.color = userReactionIcon.getAttribute('bf-reactions-color');
                        }
                    }
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
                                newReactionInstance = {
                                    itemId: node.getAttribute("bf-reactions-itemid"),
                                    container: node,
                                    types: JSON.parse(node.getAttribute("bf-reactions-types")),
                                    showCount: JSON.parse(node.getAttribute("bf-reactions-showCount")),
                                    showUsersReactions: JSON.parse(node.getAttribute("bf-reactions-showUsersReactions")),
                                }
                                this._observerContainers.push(newReactionInstance);
                            } else if (node.hasAttribute('bf-reactions')) {
                                newReactionInstance = {
                                    container: node,
                                    ...JSON.parse(node.getAttribute("bf-reactions"))
                                }
                                this._observerContainers.push(newReactionInstance);
                            }
                        } catch (e) {
                            throw new Error('Error while parsing JSON: ' + e)
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
            this.selector = data.selector || null; // make sure that selector is valid
            this.container = data.container || null; // make sure that selector is valid
            this.showCount = typeof data.showCount === 'boolean' ? data.showCount : false; // default false
            this.showUsersReactions = typeof data.showUsersReactions === 'boolean' ? data.showUsersReactions : false; // show who reacted for each reaction
            this.allowMultipleReactions = typeof data.allowMultipleReactions === 'boolean' ? data.allowMultipleReactions : false;

            if (data.types && data.types.length) {
                this.types = []
                data.types.forEach(t => {
                    if (!t.type) {
                        throw new Error('Reaction must have a property type');
                    }
                    t.type = t.type.toLowerCase();
                    ReactionsTypes.validateReactionTypes(t.type, (e,r)=>{
                        if(e){
                            throw new Error('Invalid reaction type' + t.type);
                        }
                        if (r) {
                            let _t = { ...r, ...t };
                            this.types.push(_t);
                        } 
                    })
                    
                })
            } else {
                throw new Error('Invalid reaction types');
            }

            if (data.itemId && typeof data.itemId === 'string') {
                this.itemId = data.itemId;
            } else {
                throw new Error('Invalid Item ID');
            }

            this._init();
        }

        _init() {
            let _container = document.querySelector(this.selector) || this.container;
            if (!_container) throw new Error('Selector is not valid');
            else {
                this.container = _container;
                this._buildComponent();
                State.debounce(this.itemId);
                this._onRefresh();
            }
        }

        _onRefresh() {
            // TODO: scan all existing DOM elem 
            // typical use case: after onLOgin / onLogout
            buildfire.auth.onLogin(() => {
                State.debounce(this.itemId);
            }, true);

            buildfire.auth.onLogout(() => {
                let userReactionType = this.container.getAttribute('bf-user_react-type');
                let userReactionIcon = this.container.querySelector(`[bf-reactions-type="${userReactionType}"]`);

                if(userReactionIcon){
                    userReactionIcon.classList.remove('reacted');
                    userReactionIcon.style.color = 'var(--bf-theme-body-text)';
                }
                
                let userToggoledIcon = this.container.querySelector(`[bf-reaction-current-toggled]`);
                if(userToggoledIcon){
                    userToggoledIcon.classList.add('reactions-hidden');
                    userToggoledIcon.innerHTML = '';
                    userToggoledIcon.style.color = 'var(--bf-theme-body-text)';
                }

                this.container.setAttribute('bf-user_react-type', '');
                this.container.setAttribute('bf-user_react-id', '');
            }, true);
        }

        _buildComponent() {
            // build the component HTML elements
            let iconsContainer = '';
            this.types.forEach((t, idx) => {
                iconsContainer += ` <div class="reactions-icon-buttons">
                                        <span style="animation-duration:0.${idx}s;" bf-reactions-url="${t.url}" bf-reactions-type="${t.type}" bf-reactions-color="${t.color}" class="${t.title} material-icons material-icons-sharp reactions-show-icon-animation">${t.url}</span>
                                        <span bf-reactions-count="${t.type}" class="reactions-hidden reactions-icon-buttons">0</span>
                                    </div>`
            });

            this.container.setAttribute('bf-reactions-itemid', this.itemId);
            this.container.setAttribute('bf-user_react-type', ''); // to save the reaction type that user reacted with
            this.container.setAttribute('bf-user_react-id', ''); // to save the reaction id that the user reacted with 
            this.container.classList.add('reactions-main-container');
            this.container.innerHTML = `
                <div class="reaction-main-button">
                    <span class="material-icons-outlined material-icons reaction-add-icon">add_reaction<span bf-reaction-current-toggled class="reactions-hidden material-icons material-icons-sharp reaction-current-toggled"></span></span>
                    <span class="reactions-total-count" bf-reactions-total-count="0">0</span>
                    <span class="reaction-clickable-button" bf-reactions-btn></span>
                </div>
                <div class="reactions-icon-container reactions-hidden" bf-reaction-icon-container>${iconsContainer}</div>
            `;

            let reactionBtn = this.container.querySelector('[bf-reactions-btn]');
            reactionBtn.addEventListener('click', () => {
                let reactionIconsContainer = this.container.querySelector('[bf-reaction-icon-container]');
                if (reactionIconsContainer) {
                    reactionIconsContainer.classList.remove('reactions-hidden');
                }
            })
            // hide reactions when user clicked outside
            document.addEventListener('click', function handleClickOutsideBox(event) {
                if (!event.target.hasAttribute('bf-reaction-icon-container') && !event.target.hasAttribute('bf-reactions-btn')) {
                    document.querySelectorAll('[bf-reaction-icon-container]').forEach(reactionBox => {
                        reactionBox.classList.add('reactions-hide-icons-animations');
                        setTimeout(() => {
                            reactionBox.classList.add('reactions-hidden');
                            reactionBox.classList.remove('reactions-hide-icons-animations');
                        }, 250)
                    })
                }
            });

            let reactionIcons = this.container.querySelectorAll('[bf-reactions-type]');
            reactionIcons.forEach(icon => {
                icon.addEventListener('click', () => {
                    buildfire.auth.getCurrentUser((err, user) => {
                        if (err || !user) {
                            buildfire.auth.login({}, (err, user) => {
                                if (user && user._id) {
                                    this._reactionHandler(icon.getAttribute('bf-reactions-type'), icon, user._id);
                                }
                            });
                        } else if (user && user._id) {
                            this._reactionHandler(icon.getAttribute('bf-reactions-type'), icon, user._id);
                        }
                    })
                    // this._showUsersList(this.itemId, icon.getAttribute('bf-reactions-type'))
                })
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
                    this._deleteReaction({ icon, userReactType, newReactionType, userId, selectedReaction })
                } else {
                    // update the reaction
                    this._updateReaction({ icon, userReactType, newReactionType, userId, selectedReaction })
                }
            } else {
                // add new reaction
                this._addReaction({ icon, selectedReaction, userId })
            }
        }

        _addReaction(options) {
            let { icon, selectedReaction, userId } = options;

            this._hideReactionInconsBox({ newIcon: icon })

            let reactOptions = { itemId: selectedReaction.itemId, userId, reactionType: selectedReaction.type, allowMultipleReactions:this.allowMultipleReactions }
            Reactions.react(reactOptions, (e, r) => {
                if (e) {
                    this._hideReactionInconsBox({ oldIcon: icon });
                    throw new Error('Error while adding new Reaction: ' + e)
                } else if (r) {

                    this.container.setAttribute('bf-user_react-id', r.data.id);

                    if (r.status === 'done') {
                        let summery = new ReactionsSummary({
                            itemId: selectedReaction.itemId,
                            reactions: [{ type: selectedReaction.type, count: 1, lastReactionBy: userId }],
                        })
                        ReactionsSummaries.increment(summery, (e, r) => {
                            if (e) return console.log(e);
                            if (r.status === 'done') {

                            } else if (r.status === 'noAction') {
                                // nothing will be happened
                            }
                        });
                    } else if (r.status === 'noAction') {
                        // nothing will be happened
                    }
                }
            });
        }

        _updateReaction(options) {
            let { icon, userReactType, newReactionType, userId, selectedReaction } = options;

            let itemId = this.container.getAttribute('bf-reactions-itemid')
            this._hideReactionInconsBox({ newIcon: icon, oldIcon: this.container.querySelector(`[bf-reactions-type="${userReactType}"]`) });

            let reactOptions = { itemId, userId, reactionType: newReactionType, reactionsId: selectedReaction.reactionId, allowMultipleReactions:this.allowMultipleReactions }
            Reactions.unReactReact(reactOptions, (e, r) => {
                if (e) {
                    this._hideReactionInconsBox({ oldIcon: icon, newIcon: this.container.querySelector(`[bf-reactions-type="${userReactType}"]`) });
                } else if (r) {
                    // reaction updated successfully 
                    if (r.status === 'done') {
                        // decrement for the old type and increment the new one
                        let summary = new ReactionsSummary({
                            itemId, reactions: [{ type: newReactionType, count: 1, lastReactionBy: userId }]
                        })
                        ReactionsSummaries.decrement({ itemId, reactionType: userReactType }, (e, r) => { if (e) return console.log(e) });
                        ReactionsSummaries.increment(summary, (e, r) => { if (e) return console.log(e) });
                    } else if (r.status === 'noAction') {
                        // nothing will be happened
                    }
                }
            })
        }

        _deleteReaction(options) {
            let { icon, userReactType, newReactionType, userId, selectedReaction } = options;

            let reactionId = this.container.getAttribute('bf-user_react-id');
            let itemId = this.container.getAttribute('bf-reactions-itemid');
            let reactionType = this.container.getAttribute('bf-user_react-type');

            let reactOptions = { itemId, userId, reactionsId: selectedReaction.reactionId, reactionType, allowMultipleReactions:this.allowMultipleReactions }

            this._hideReactionInconsBox({ oldIcon: icon });
            Reactions.unReact(reactOptions, (e, r) => {
                if (e) {
                    this._hideReactionInconsBox({ newIcon: icon });
                } else if (r) {
                    if (r.status === 'done') {
                        /* Reaction deleted successfully */
                        ReactionsSummaries.decrement({ itemId, reactionType }, (e, r) => { if (e) return console.log(e) });
                    } else if (r.status === 'noAction') {
                        // nothing will be happened
                    }
                }
            });
        }

        _hideReactionInconsBox(options) {
            let { newIcon, oldIcon } = options;
            let userToggoledIcon = this.container.querySelector(`[bf-reaction-current-toggled]`);

            if (oldIcon) {
                oldIcon.classList.remove('reacted');
                oldIcon.style.color = 'var(--bf-theme-body-text)';
                this.container.setAttribute('bf-user_react-type', '');
                this.container.setAttribute('bf-user_react-id', '');
            }

            if (newIcon) {
                newIcon.classList.add('reacted');
                newIcon.style.color = newIcon.getAttribute('bf-reactions-color');
                this.container.setAttribute('bf-user_react-type', newIcon.getAttribute('bf-reactions-type'));
                this.container.setAttribute('bf-user_react-id', '');
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
            }

            if (userToggoledIcon && newIcon) {
                userToggoledIcon.classList.remove('reactions-hidden');
                userToggoledIcon.innerHTML = newIcon.getAttribute(`bf-reactions-url`);
                userToggoledIcon.style.color = newIcon.getAttribute('bf-reactions-color');
            }
            
            if (userToggoledIcon && !newIcon) {
                userToggoledIcon.classList.add('reactions-hidden');
                userToggoledIcon.innerHTML = '';
                userToggoledIcon.style.color = 'var(--bf-theme-body-text)';
            }

            let reactionIconsContainer = this.container.querySelector('[bf-reaction-icon-container]');
            if (reactionIconsContainer) {
                reactionIconsContainer.classList.add('reactions-hide-icons-animations');
                setTimeout(() => {
                    reactionIconsContainer.classList.add('reactions-hidden');
                    reactionIconsContainer.classList.remove('reactions-hide-icons-animations');
                }, 250)
            }
        }

        _showUsersList(itemId, reactionType) {
            let options = { itemId, reactionType, pageIndex: 0, pageSize: 50 };
            this._openDrawerSkeleton();

            Reactions.get(options, (e, r) => {
                if (e) { }
                else if (r.length) {
                    let listItems = [];
                    let url = this.types.find(t => t.type === reactionType).url;
                    let color = this.types.find(t => t.type === reactionType).color;
                    r.forEach((item, idx) => {
                        buildfire.auth.getUserProfile({ userId: item.data.userId }, (err, user) => {
                            if (err) return console.error(err);

                            listItems.push({
                                text: `<div style="display: flex;width: -webkit-fill-available;justify-content: space-between;"><p>${user.displayName}</p><span style="color:${color};" class="material-icons material-icons-sharp">${url}</span></div>`,
                                imageUrl: user.imageUrl
                            })
                            if (idx == r.length - 1) {
                                this._openDrawer(listItems);
                            }
                        });
                    })
                } else {
                    this._openDrawer([]);
                }
            })
        }

        _openDrawerSkeleton(){
            let listItems=[];
            let customDrawerSkeleton = `
                <div style="width:42px;height:42px;border-radius:100%;background-color:#dadce7;"></div>
                <div style="width:200px;height: 15px;background:#dadce7;border-radius:50px"></div>
            `
            for(let i=0;i<3;i++){
                listItems.push({
                    text: `<div style="display:flex;align-items: center;gap: 1rem;">${customDrawerSkeleton}</div>`
                })
            }
            this._openDrawer(listItems)
        }

        _openDrawer(listItems) {
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

        static build() {
            State.buildObserver();
        }
    }

    return ReactionComponent;
})();