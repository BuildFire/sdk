
if (typeof buildfire == 'undefined')
    throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};


// data model
class Reaction {
    constructor(data = {}) {
        this.itemId = data.itemId || null;
        this.userId = data.userId || null;
        // the user can react with multi types for the same item ?????
        this.reactions = data.reactions || []; // object (type)  {type: "like, title: "like", color:"#FF0000", url:"thumbs_up"}
        this._buildfire = data._buildfire || {}
        // string1 = data.itemId + "-" + data.userId;
        // array1.string1 = "reactionType-" + data.itemId + "-" + data.type;
    }
}

class Reactions {
    static get TAG() {
        return "$$reactions";
    }
    // methods
    static add(reaction, reactionType, callback) {
        if (!reaction || !reaction.itemId || !reaction.userId || !reactionType) {
            throw new Error("Invalid reaction object!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

        buildfire.appData.insert(
            reaction, Reactions.TAG, false,
            (err, result) => {
                if (err) {
                    return callback(err);
                }

                // toggle on the selected reaction type
                if (result) {
                    return callback(null, result);
                }
                return callback(null, null);
            }
        );
    }

    static update(itemId, oldData, newData, callback) {
        if (!itemId || typeof itemId !== 'string') {
            throw new Error("Invalid item ID!");
        }
        // data need to be checked 
        if (!oldData || !newData) {
            throw new Error("Invalid reaction data!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

        var filter = {
            "_buildfire.index.string1": itemId + "-" + oldData.userId,
            "_buildfire.index.array1.string1": "reactionType-" + itemId + "-" + oldData.type,
            "reactions.type": oldData.type
        }
        var set = {
            $set: {
                "reactions.$.type": newData.type,
                "_buildfire.index.array1.$.string1": "reactionType-" + itemId + "-" + newData.type
            }
        }


        buildfire.appData.searchAndUpdate(
            filter, set, // set the reaction [{type:'like', ...}]
            Reactions.TAG,
            (err, result) => {
                if (err) {
                    return callback(err);
                }

                // decrement for the old type and increment the new one
                ReactionsSummaries.decrement({ itemId, reactionType: oldData.type }, (e, r) => { if (e) return console.log(e) });
                ReactionsSummaries.increment({ itemId, reactionType: newData.type }, (e, r) => { if (e) return console.log(e) });
                // toggle on the selected reaction type, and toggle off the old one
                if (result) {
                    return callback(null, result);
                }
                return callback(null, null);
            }
        );
    }

    static remove(options, callback) {
        var { reactionId, itemId, reactionType } = options;

        if (!reactionId || typeof reactionId !== 'string' || !itemId || !reactionType) {
            throw new Error("Invalid reaction Data!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

        buildfire.appData.delete(reactionId, Reactions.TAG, (err, result) => {
            if (err) {
                return callback(err);
            }

            ReactionsSummaries.decrement({ itemId, reactionType }, (e, r) => { if (e) return console.log(e) });
            // toggle off the reaction
            if (result) {
                return callback(null, result);
            }
            return callback(null, null);
        });
    }

    static get(options, callback) { // fetch who reacted for specific item
        var { itemId, reactionType, pageIndex, pageSize } = options;

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

        var searchOptions = { // need to be check ----
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
}

class ReactionsSummary {
    constructor(data = {}) {
        this.itemId = data.itemId || null;
        this.reactions = data.reactions || []; // reaction types {type, count, lastReactionBy} 
        // ex. [{type: 'like', count:15, lastReactionBy:'ahmed'}, {type: 'heart', count:61, lastReactionBy:'ali'}, ...]
        this._buildfire = data._buildfire || {}
        // index.string1.string1: itemId,
        // array1:  {string1: type} // ex. [{string1: 'like'}, {string1: 'heart'}, ...]
    }
}

class ReactionsSummaries {
    static get TAG() {
        return "$$reactionsSummary";
    }
   
    static _itemsWithoutSummery = [];

    static add(summery, callback) {
        if (!summery.itemId || !summery.reactions || !summery.reactions.length) {
            throw new Error("Invalid reaction summery object!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

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

    // reactionType: like, heart, ...
    static increment(options, callback) {
        var { itemId, reactionType } = options;

        if (!itemId || !reactionType || !callback) {
            throw new Error("Invalid get options!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

        var filter = {
            "_buildfire.index.string1": itemId,
            "reactions.type": reactionType,
        }
        var inc = { $inc: { "reactions.$.count": 1 } }

        buildfire.publicData.searchAndUpdate(
            filter, inc, ReactionsSummaries.TAG,
            (err, result) => {
                if (err) return callback(err);

                if (result) callback(null, result);
                return callback(null, null);
            }
        );
    }

    static decrement(options, callback) {
        var { itemId, reactionType } = options;

        if (!itemId || !reactionType || !callback) {
            throw new Error("Invalid get options!");
        }

        if (typeof callback !== 'function') {
            throw new Error("callback must be a function!");
        }

        var filter = {
            "_buildfire.index.string1": itemId,
            "reactions.type": reactionType,
        }
        var inc = { $inc: { "reactions.$.count": -1 } }

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
                return callback(null, res);
            }
            return callback(null, null);
        })

    }
    // add new method called -=> insertOrIncrement to be called only if itemId is not returned by get() "no reactions yet"
    // use checkDuplicate for insert to avoid duplicate insertions
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

buildfire.components.reactions = class ReactionComponent {

    // debounce getting item reactions to avoid multi-request to server
    static _itemIds = [];
    static _timer;
    static _reactionDebounce(itemId) {
        if (itemId && ReactionComponent._itemIds.indexOf(itemId) < 0) {
            ReactionComponent._itemIds.push(itemId);
        }
        clearTimeout(ReactionComponent._timer);
        ReactionComponent._timer = setTimeout(() => {
            var __itemIds = ReactionComponent._itemIds;
            ReactionComponent._itemIds = []; // if the user send new itemIds after the delay and before getting the res from db

            ReactionsSummaries.get(__itemIds, (err, res) => {
                if (err) console.log(err)
                if (res) {/* show reaction summaries on items */ }
                if(res.length<__itemIds.length){
                    __itemIds.forEach(item=>{
                        var validSummery = res.find(i=>i.data.itemId == item);
                        if(!validSummery){
                            ReactionsSummaries._itemsWithoutSummery.push(item);
                        }
                    })
                }
                console.log(res);

                buildfire.auth.getCurrentUser((err, user) => {
                    if (err) return console.error(err);

                    if (user && user._id) {
                        Reactions.getByUserId(user._id, __itemIds, (e, r) => {
                            if (e) console.log(e);
                            if (r) {/* show users reactions on items */ }
                            console.log(r);
                        })
                    }
                });
            })
        }, 300)
    }

    constructor(data = {}) {
        this.selector = data.selector || null; // make sure that selector is valid
        this.showCount = typeof data.showCount === 'boolean' ? data.showCount : false; // default false
        this.showUsersReactions = typeof data.showUsersReactions === 'boolean' ? data.showUsersReactions : false; // show who reacted for each reaction

        if (data.types && data.types.length) {
            this.types = data.types.map(t => {
                if (!t.type) {
                    throw new Error('Reaction must have a property type');
                }

                var availableReactionTypes = ReactionsTypes.types;
                t.type = t.type.toLowerCase();
                var validReactionType = availableReactionTypes.find(r => r.type === t.type);
                if (validReactionType) {
                    var _t = { ...validReactionType, ...t };
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
        ReactionComponent._reactionDebounce(this.itemId);
    }

    _init() {
        let _container = document.querySelector(this.selector);
        if (!_container) throw new Error('Element not found!');
        else {
            this.container = _container;
            this._buildComponent();
        }
    }

    _buildComponent() {
        // build the component HTML elements
        var iconsContainer = '';
        this.types.forEach(t => {
            iconsContainer += `<span bf-reactions-type="${t.type}" bf-reactions-color="${t.color}" class="${t.type} reactionIcon">${t.title}</span>`
        });

        this.container.setAttribute('bf-reactions-itemid', this.itemId);
        this.container.setAttribute('bf-user_react-type', ''); // to save the reaction type that user reacted with
        this.container.setAttribute('bf-user_react-id', ''); // to save the reaction id that the user reacted with 
        this.container.classList.add('reactions');
        this.container.innerHTML = `
            <div class="iconContainer">${iconsContainer}</div>
            <div bf-reactions-count="" class="count">
                <span class="reactionCount">0</span>
            </div>
        `;

        var reactionIcons = this.container.querySelectorAll('[bf-reactions-type]');
        reactionIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                buildfire.auth.getCurrentUser((err, user) => {
                    if (err || !user) {
                        buildfire.auth.login({}, (err, user) => {
                            if (user && user._id) {
                                this._react(icon.getAttribute('bf-reactions-type'), icon, user._id)
                            }
                        });
                    } else if (user && user._id) {
                        this._react(icon.getAttribute('bf-reactions-type'), icon, user._id)
                    }
                })
            })
        })
        // when click on a reaction type
        // this._react(type)
    }

    _react(newReactionType, icon, userId) {
        // trigger when the user click on reaction icon

        // if the user select a type that he reacted with, then it will be removed
        // if the user click on the same reaction type, then the reaction will be removed
        // otherwise the reaction will be updated

        // edge cases: 
        // 1. if the user reacted with other type
        // 2. if the user is not logged in
        var userReactType = this.container.getAttribute('bf-user_react-type');

        var selectedReaction = {
            type: newReactionType,
            reactionId: this.container.getAttribute('bf-user_react-id'),
            itemId: this.container.getAttribute('bf-reactions-itemid'),
        }

        if (userReactType) {
            if (userReactType === newReactionType) {
                // delete the reaction
                icon.classList.remove('reacted');
                icon.style.backgroundColor = '#fff';
                this.container.setAttribute('bf-user_react-type', '');
                // Reactions.remove({}, (e,r)=>{});
            } else {
                // update the reaction
                icon.classList.add('reacted');
                icon.style.backgroundColor = icon.getAttribute('bf-reactions-color');
                this.container.querySelector(`[bf-reactions-type="${userReactType}"]`).classList.remove('reacted');
                this.container.querySelector(`[bf-reactions-type="${userReactType}"]`).style.backgroundColor = '#fff';
                this.container.setAttribute('bf-user_react-type', newReactionType);
            }
        } else {
            // add new reaction
            icon.classList.add('reacted');
            icon.style.backgroundColor = icon.getAttribute('bf-reactions-color');
            this.container.setAttribute('bf-user_react-type', newReactionType);

            var reaction = new Reaction({
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
            Reactions.add(reaction, selectedReaction.type, (e, r) => {
                if (e) {
                    icon.classList.remove('reacted');
                    icon.style.backgroundColor = '#fff';
                    this.container.setAttribute('bf-user_react-type', '');
                    throw new Error('Error while adding new Reaction: ' + e)
                } else if (r) {
                    if(ReactionsSummaries._itemsWithoutSummery.indexOf(reaction.itemId)>=0){
                        var reactions = this.types.map(t=>({type:t.type, count: 0, lastReactionBy: userId}));
                        var array1 = this.types.map(t=>({string1:t.type}));

                        var summery = new ReactionsSummary({
                            itemId: reaction.itemId,
                            reactions,
                            _buildfire:{
                                index:{
                                    string1: reaction.itemId,
                                    array1
                                }
                            }
                        })
                        ReactionsSummaries.insertOrIncrement({summery, reactionType:selectedReaction.type}, (e, r) => { if (e) return console.log(e) })
                    }else{
                        ReactionsSummaries.increment({ itemId: reaction.itemId, reactionType:selectedReaction.type }, (e, r) => { if (e) return console.log(e) });
                    }
                }
            });
        }
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
