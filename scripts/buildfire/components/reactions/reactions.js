
if (typeof buildfire == 'undefined')
    throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};


// data model
class Reaction {
    constructor(data = {}) {
        this.itemId = data.itemId || null;
        this.userId = data.userId || null;
        this.createdOn = data.createdOn || new Date();

        this.reactions = data.reactions || []; // object (type)  {type: "like"}, {type: "heart"}
        this._buildfire = data._buildfire || {};
    }
}
// like
// like  heart  support
class Reactions {
    static get TAG() {
        return "$$reactions";
    }
    
    // methods
    static add(reaction, callback) {
        if (!reaction || !reaction.itemId || !reaction.userId) {
            throw new Error("Invalid reaction object!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

        // setting the index
        reaction._buildfire.index = this.buildIndex(reaction);

        buildfire.appData.insert(
            reaction, Reactions.TAG, true,
            (err, result) => {
                if (err) {
                    return callback(err);
                }

                if (result) {
                    // to do 
                    // to add increment --
                    ReactionsSummaries.increment({ itemId: reaction.itemId, reactionType: reaction.reactions[0].type }, ()=>{})
                    return callback(null, result);
                }
                return callback(null, null);
            }
        );
    }

    static update(options, callback) {
        let { itemId, oldReactionType, newReactionType, userId } = options;
        if (!itemId || typeof itemId !== 'string') {
            throw new Error("Invalid item ID!");
        }

        if (!oldReactionType || !newReactionType) {
            throw new Error("Invalid reaction data!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

        let filter = {
            "_buildfire.index.string1": itemId + "-" + userId,
            "_buildfire.index.array1.string1": "reactionType-" + itemId + "-" + oldReactionType,
            "reactions.type": oldReactionType
        }
        let set = {
            $set: {
                "reactions.$.type": newReactionType,
                "_buildfire.index.array1.$.string1": "reactionType-" + itemId + "-" + newReactionType
            }
        }

        buildfire.appData.searchAndUpdate(
            filter, set, // set the reaction [{type:'like', ...}]
            Reactions.TAG,
            (err, result) => {
                if (err) {
                    return callback(err);
                }

                // toggle on the selected reaction type, and toggle off the old one
                if (result) {
                    return callback(null, result);
                }
                return callback(null, null);
            }
        );
    }

    static remove(reactionId, callback) {

        if (!reactionId || typeof reactionId !== 'string') {
            throw new Error("Invalid reaction Data!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

        buildfire.appData.delete(reactionId, Reactions.TAG, (err, result) => {
            if (err) {
                return callback(err);
            }

            // toggle off the reaction
            if (result) {
                return callback(null, result);
            }
            return callback(null, null);
        });
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
            pageIndex = 50;
        }

        buildfire.appData.search(
            {
                filter: {
                    "_buildfire.index.array1.string1": "reactionType-" + itemId + "-" + reactionType
                },
                page: pageIndex,
                pageSize,
            }, Reactions.TAG,
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

        let searchOptions = { // need to be check ----
            filter: { "$json.itemId": { $in: itemIds }, "$json.userId": userId }
        }

        buildfire.appData.search(searchOptions, Reactions.TAG, (err, result) => {
            if (err) {
                return callback(err);
            }
            if (result) {
                return callback(null, result);
            }
            return callback(null, null);
        })
    }
    
    static buildIndex(data = {}){
        const index = {
            date1: data.createdOn,
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

    static add(summery, callback) {
        if (!summery.itemId || !summery.reactions || !summery.reactions.length) {
            throw new Error("Invalid reaction summery object!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

        // build reaction summery indexes 
        summery._buildfire.index = ReactionsSummaries.buildIndex(summery);

        buildfire.publicData.insert(
            summery, ReactionsSummaries.TAG, true,
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

    static get(itemIds, callback) {
        if (!itemIds) {
            throw new Error("Invalid get options!");
        }

        if (typeof callback !== 'function' || !callback) {
            throw new Error("callback must be a function!");
        }

        buildfire.publicData.search(
            {
                filter: {
                    "_buildfire.index.string1": { $in: itemIds }
                }
            }, ReactionsSummaries.TAG,
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

    static increment(options, callback) {
        let { itemId, reactionType, userId } = options;

        if (!itemId || !reactionType || !callback) {
            throw new Error("Invalid get options!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

        let filter = {
            "_buildfire.index.string1": itemId,
            "reactions.type": reactionType,
        }
        let set = { $inc: { "reactions.$.count": 1 }, $set:{"reactions.$.lastReactionBy": userId} }

        buildfire.publicData.searchAndUpdate(
            filter, set, ReactionsSummaries.TAG,
            (err, result) => {
                if (err) return callback(err);

                if (result) callback(null, result);
                return callback(null, null);
            }
        );
    }

    static decrement(options, callback) {
        let { itemId, reactionType } = options;

        if (!itemId || !reactionType || !callback) {
            throw new Error("Invalid get options!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

        let filter = {
            "_buildfire.index.string1": itemId,
            "reactions.type": reactionType,
        }
        let inc = { $inc: { "reactions.$.count": -1 } }

        buildfire.publicData.searchAndUpdate(
            filter, inc, ReactionsSummaries.TAG,
            (err, result) => {
                if (err) return callback(err);

                if (result) callback(null, result);
                return callback(null, null);
            }
        );
    }

    static insertOrIncrement(options, callback) {
        if (!options.summery || !options.reactionType) {
            throw new Error("Invalid reaction summery data!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

        ReactionsSummaries.add(options.summery, (err, res) => {
            if (err && err.message == "Duplicate Entry") {
                // remove the item id from the _itemsWithoutSummery array, sence it has a summery 
                ReactionsComponentGlobalState._itemsWithoutSummery.splice(ReactionsComponentGlobalState._itemsWithoutSummery.indexOf(options.summery.itemId), 1);

                ReactionsSummaries.increment({ itemId: options.summery.itemId, reactionType: options.reactionType }, (e, r) => {
                    if (e) {
                        return callback(e);
                    }

                    if (r) {
                        callback(null, r);
                    }
                })
            }

            if (res) {
                // remove the item id from the _itemsWithoutSummery array, sence it has a summery 
                ReactionsComponentGlobalState._itemsWithoutSummery.splice(ReactionsComponentGlobalState._itemsWithoutSummery.indexOf(options.summery.itemId), 1);
                return callback(null, res);
            }
            return callback(null, null);
        })

    }
  
    // use checkDuplicate for insert to avoid duplicate insertions
    static buildIndex(data = {}){
        const index = {
            string1: data.itemId
        };


        return index;
    }
}
// data access
class ReactionsTypes {
    static get types() {
        return [
            { type: "like", title: "like", color: "#FF0000", url: "thumbs_up" },
            { type: "heart", title: "heart", color: "#FF0000", url: "thumbs_up" },
            { type: "sad", title: "sad", color: "#FF0000", url: "thumbs_up" },
            { type: "angry", title: "angry", color: "#FF0000", url: "thumbs_up" },
        ]
    }
}

class ReactionsComponentGlobalState {
    // debounce getting item reactions to avoid multi-request to server
    static allItemsinDom = [];
    static _itemIds = [];
    static _timer;
    static _itemsWithoutSummery = [];

    static _reactionDebounce(itemId) {
        // to save new item ids that will be rendered
        if (itemId && ReactionsComponentGlobalState._itemIds.indexOf(itemId) < 0) {
            ReactionsComponentGlobalState._itemIds.push(itemId);
        }
        // to save all item ids that rendered to manage them in case the user logged in or logged out 
        if (itemId && ReactionsComponentGlobalState.allItemsinDom.indexOf(itemId) < 0) {
            ReactionsComponentGlobalState.allItemsinDom.push(itemId);
        }

        clearTimeout(ReactionsComponentGlobalState._timer);
        ReactionsComponentGlobalState._timer = setTimeout(() => {
            let __itemIds = ReactionsComponentGlobalState._itemIds;
            ReactionsComponentGlobalState._itemIds = []; // if the user send new itemIds after the delay and before getting the res from db

            ReactionsSummaries.get(__itemIds, (err, res) => {
                if (err) console.log(err)
                if (res) {/* show reaction summaries on items */
                    ReactionsComponentGlobalState._showAllReactionCount(res, __itemIds);
                }
                console.log(res, __itemIds);

                buildfire.auth.getCurrentUser((err, user) => {
                    if (err) return console.error(err);

                    if (user && user._id) {
                        Reactions.getByUserId(user._id, __itemIds, (e, r) => {
                            if (e) console.log(e);
                            if (r) {/* show users reactions on items */
                                ReactionsComponentGlobalState._showUserReactions(r)
                            }
                            console.log(r);
                        })
                    }
                });
            })
        }, 300)
    }

    static _showAllReactionCount(summeries, itemIds) {
        // save all items that don't have summeries yet
        if (summeries.length < itemIds.length) {
            itemIds.forEach(item => {
                let validSummery = summeries.find(i => i.data.itemId == item);
                if (!validSummery) {
                    ReactionsComponentGlobalState._itemsWithoutSummery.push(item);
                }
            })
        }
        // print reactions count in the dom
        summeries.forEach(summery => {
            let container = document.querySelector(`[bf-reactions-itemid="${summery.data.itemId}"]`);
            if (container) {
                summery.data.reactions.forEach(r => {
                    let countContainer = container.querySelector(`[bf-reactions-count="${r.type}"]`);
                    countContainer.innerHTML = r.count;
                })
            }
        })
    }

    static _showUserReactions(reactions) {
        reactions.forEach(reaction => {
            let container = document.querySelector(`[bf-reactions-itemid="${reaction.data.itemId}"]`);
            if (container) {
                let userReactionIcon = container.querySelector(`[bf-reactions-type="${reaction.data.reactions[0].type}"]`);
                container.setAttribute('bf-user_react-type', reaction.data.reactions[0].type);
                container.setAttribute('bf-user_react-id', reaction.id);
                userReactionIcon.classList.add('reacted');
                userReactionIcon.style.backgroundColor = userReactionIcon.getAttribute('bf-reactions-color');
            }
        })
    }
}

buildfire.components.reactions = class ReactionComponent {

    constructor(data = {}) {
        this.selector = data.selector || null; // make sure that selector is valid
        this.showCount = typeof data.showCount === 'boolean' ? data.showCount : false; // default false
        this.showUsersReactions = typeof data.showUsersReactions === 'boolean' ? data.showUsersReactions : false; // show who reacted for each reaction

        if (data.types && data.types.length) {
            this.types = data.types.map(t => {
                if (!t.type) {
                    throw new Error('Reaction must have a property type');
                }

                let availableReactionTypes = ReactionsTypes.types;
                t.type = t.type.toLowerCase();
                let validReactionType = availableReactionTypes.find(r => r.type === t.type);
                if (validReactionType) {
                    let _t = { ...validReactionType, ...t };
                    this._registerAnalytics(_t.title, _t.type);
                    return _t;
                } else {
                    throw new Error('Invalid reaction type' + t.type);
                }
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
        let _container = document.querySelector(this.selector);
        if (!_container) throw new Error('Element not found!');
        else {
            this.container = _container;
            this._buildComponent();
            ReactionsComponentGlobalState._reactionDebounce(this.itemId);
        }
    }

    _buildComponent() {
        // build the component HTML elements
        let iconsContainer = '';
        this.types.forEach(t => {
            iconsContainer += ` <div class="iconsSpan">
                                    <span bf-reactions-type="${t.type}" bf-reactions-color="${t.color}" class="${t.type} reactionIcon">${t.title}</span>
                                    <span bf-reactions-count="${t.type}" class="reactionIcon">0</span>
                                </div>`
        });

        this.container.setAttribute('bf-reactions-itemid', this.itemId);
        this.container.setAttribute('bf-user_react-type', ''); // to save the reaction type that user reacted with
        this.container.setAttribute('bf-user_react-id', ''); // to save the reaction id that the user reacted with 
        this.container.classList.add('reactions');
        this.container.innerHTML = `
            <div class="iconContainer">${iconsContainer}</div>
        `;

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
            })
        })
        // when click on a reaction type
        // this._reactionHandler(type)
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
                this._deleteReaction(icon)
            } else {
                // update the reaction
                this._updateReaction({ icon, userReactType, newReactionType, userId })
            }
        } else {
            // add new reaction
            this._addReaction({ icon, newReactionType, selectedReaction, userId })
        }
    }

    _addReaction(options) {
        let { icon, newReactionType, selectedReaction, userId } = options;

        icon.classList.add('reacted');
        icon.style.backgroundColor = icon.getAttribute('bf-reactions-color');
        this.container.setAttribute('bf-user_react-type', newReactionType);

        // include buildfire index from the data access
        let reaction = new Reaction({
            itemId: selectedReaction.itemId,
            userId,
            reactions: [{ type: selectedReaction.type }],
            _buildfire: {
                index: {
                    string1: selectedReaction.itemId + '-' + userId,
                    array1: [{ string1: "reactionType-" + selectedReaction.itemId + "-" + selectedReaction.type }]
                }
            },
        })
        Reactions.add(reaction, (e, r) => {
            if (e) {
                icon.classList.remove('reacted');
                icon.style.backgroundColor = '#fff';
                this.container.setAttribute('bf-user_react-type', '');
                throw new Error('Error while adding new Reaction: ' + e)
            } else if (r) {
                this.container.setAttribute('bf-user_react-id', r.id);

                if (ReactionsComponentGlobalState._itemsWithoutSummery.indexOf(reaction.itemId) >= 0) {
                    let reactions = this.types.map(t => ({ type: t.type, count: t.type === selectedReaction.type ? 1 : 0, lastReactionBy: userId }));

                    let summery = new ReactionsSummary({
                        itemId: reaction.itemId,
                        reactions,
                    })
                    ReactionsSummaries.insertOrIncrement({ summery, reactionType: selectedReaction.type }, (e, r) => { if (e) return console.log(e) })
                } else {
                    ReactionsSummaries.increment({ itemId: reaction.itemId, reactionType: selectedReaction.type }, (e, r) => { if (e) return console.log(e) });
                }
            }
        });
    }

    _updateReaction(options) {
        let { icon, userReactType, newReactionType, userId } = options;

        icon.classList.add('reacted');
        icon.style.backgroundColor = icon.getAttribute('bf-reactions-color');
        this.container.querySelector(`[bf-reactions-type="${userReactType}"]`).classList.remove('reacted');
        this.container.querySelector(`[bf-reactions-type="${userReactType}"]`).style.backgroundColor = '#fff';
        this.container.setAttribute('bf-user_react-type', newReactionType);

        let itemId= this.container.getAttribute('bf-reactions-itemid')
        let updateOptions = {
            oldReactionType: userReactType,
            newReactionType: newReactionType,
            userId: userId,
            itemId: itemId
        }
        Reactions.update(updateOptions, (e, r) => {
            if (e) {
                icon.classList.remove('reacted');
                icon.style.backgroundColor = '#fff';
                this.container.querySelector(`[bf-reactions-type="${userReactType}"]`).classList.add('reacted');
                this.container.querySelector(`[bf-reactions-type="${userReactType}"]`).style.backgroundColor = this.container.querySelector(`[bf-reactions-type="${userReactType}"]`).getAttribute('bf-reactions-color');
                this.container.setAttribute('bf-user_react-type', userReactType);
            } else if (r) {
                // reaction updated successfully 

                // decrement for the old type and increment the new one
                ReactionsSummaries.decrement({ itemId, reactionType: userReactType }, (e, r) => { if (e) return console.log(e) });
                ReactionsSummaries.increment({ itemId, reactionType: newReactionType }, (e, r) => { if (e) return console.log(e) });
            }
        })
    }

    _deleteReaction(icon) {
        let reactionId = this.container.getAttribute('bf-user_react-id');
        let itemId = this.container.getAttribute('bf-reactions-itemid');
        let reactionType = this.container.getAttribute('bf-user_react-type');

        icon.classList.remove('reacted');
        icon.style.backgroundColor = '#fff';
        this.container.setAttribute('bf-user_react-type', '');
        this.container.setAttribute('bf-user_react-id', '');

        Reactions.remove(reactionId, (e, r) => {
            if (e) {
                this.container.setAttribute('bf-user_react-type', reactionType);
                this.container.setAttribute('bf-user_react-id', reactionId);
                icon.classList.add('reacted');
                icon.style.backgroundColor = icon.getAttribute('bf-reactions-color');
            } else if (r) {
                /* Reaction deleted successfully */
                ReactionsSummaries.decrement({ itemId, reactionType }, (e, r) => { if (e) return console.log(e) });
            }
        });
    }

    _registerAnalytics(title, key) {
        // add analytics methods
        // 1. for each type, when the user reacted with an item
        // 2. for each type, when the user removed the reaction from an item
        buildfire.analytics.registerEvent(
            {
                title: title,
                key,
                description: `How many users reacted as ${key} `,
            },
            { silentNotification: true }
        );
    }

}
