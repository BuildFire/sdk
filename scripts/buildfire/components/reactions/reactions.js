
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
    static add(reaction, type, callback) {
        if (!reaction || !reaction.itemId || !reaction.userId || !type) {
            throw Error("Invalid reaction object!");
        }

        if (typeof callback !== 'function') {
            throw Error("callback must be a function!");
        }

        buildfire.appData.insert(
            reaction, Reactions.TAG, false,
            (err, result) => {
                if (err) return callback(err);

                ReactionsSummaries.increment({itemId:reaction.itemId, reactionType:type}, (e,r)=>{if(e)return console.log(e)});
                // toggle on the selected reaction type
                if (result) return callback(null, result);
                return callback(null, null);
            }
        );
    }

    static update(reactionId, oldData, newData, callback) {
        if (!reactionId || typeof reactionId !== 'string') {
            throw Error("Invalid reaction ID!");
        }
        // data need to be checked 
        if (!oldData || !newData) {
            throw Error("Invalid reaction data!");
        }

        if (typeof callback !== 'function') {
            throw Error("callback must be a function!");
        }

        var filter = {
            "_buildfire.index.string1": oldData.itemId + "-" + oldData.userId, 
            "_buildfire.index.array1.string1": "reactionType-" + oldData.itemId + "-" + oldData.type, 
            "reactions.type": oldData.type
        }
        var set = {
            $set:{
                "reactions.$.type": newData.type, 
                "_buildfire.index.array1.$.string1": "reactionType-" + newData.itemId + "-" + newData.type
            }
        }


        buildfire.appData.searchAndUpdate(
            filter, set, // set the reaction [{type:'like', ...}]
            Reactions.TAG,
            (err, result) => {
                if (err) return callback(err);

                // decrement for the old type and increment the new one
                ReactionsSummaries.decrement({itemId:oldData.itemId, reactionType:oldData.type}, (e,r)=>{if(e)return console.log(e)});
                ReactionsSummaries.increment({itemId:newData.itemId, reactionType:newData.type}, (e,r)=>{if(e)return console.log(e)});
                // toggle on the selected reaction type, and toggle off the old one
                if (result) return callback(null, result);
                return callback(null, null);
            }
        );
    }

    static remove(options, callback) {
        var {reactionId, itemId, reactionType} = options;

        if (!reactionId || typeof reactionId !== 'string' || !itemId || !reactionType) {
            throw Error("Invalid reaction Data!");
        }

        if (typeof callback !== 'function') {
            throw Error("callback must be a function!");
        }

        buildfire.appData.delete(reactionId, Reactions.TAG, (err, result) => {
            if (err) return callback(err);

            ReactionsSummaries.decrement({itemId, reactionType}, (e,r)=>{if(e)return console.log(e)});
            // toggle off the reaction
            if (result) return callback(null, result);
            return callback(null, null);
        });
    }

    static get(options, callback) { // fetch who reacted for specific item
        var { itemId, reactionType, pageIndex, pageSize } = options;

        if (!itemId || !reactionType) {
            throw Error("Invalid get options!");
        }

        if (!callback || typeof callback !== 'function') {
            throw Error("callback must be a function!");
        }

        if(!pageIndex){
            pageIndex = 0;
        }

        if(!pageSize){
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
                if (err) return callback(err);

                if (result) return callback(null, result)
                return callback(null, null);
            }
        );
    }

    static getByUserId(userId, itemIds, callback) { // array of item ids ????
        if (!userId || typeof userId !== 'string' || !itemIds || !itemIds.length) {
            throw Error('Invalid arguments');
        }

        if (!callback || typeof callback !== 'function') {
            throw Error("callback must be a function!");
        }
        
        var searchOptions = {
            filter:{"$json.itemId":{$in:itemIds}, "$json.userId":userId}
        }

        buildfire.appData.search(searchOptions, Reactions.TAG, (err, result) => {
            if (err) return callback(err);
            if(result) return callback(null, result);
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

    static add(summery, callback){
        if(!summery.itemId || !summery.reactions){
            throw Error("Invalid reaction summery object!");
        }

        if (typeof callback !== 'function') {
            throw Error("callback must be a function!");
        }

        buildfire.publicData.insert(
            summery, ReactionsSummaries.TAG, true,
            (err, result) => {
                if (err) return callback(err);

                if (result) return callback(null, result);
            }
        );
    }

    static get(itemIds, callback) {
        if (!itemIds || !callback) {
            throw Error("Invalid get options!");
        }

        if (typeof callback !== 'function') {
            throw Error("callback must be a function!");
        }

        buildfire.publicData.search(
            {
                filter: {
                    "_buildfire.index.string1": {$in: itemIds}
                }
            }, ReactionsSummaries.TAG,
            (err, result) => {
                if (err) return callback(err);

                if (result) {
                    return callback(null, result);
                }
            }
        );
    }

    // reactionType: like, heart, ...
    static increment(options, callback) {
        var { itemId, reactionType } = options;

        if (!itemId || !reactionType || !callback) {
            throw Error("Invalid get options!");
        }

        if (typeof callback !== 'function') {
            throw Error("callback must be a function!");
        }

        var filter = {
            "_buildfire.index.string1": itemId,
            "reactions.type": reactionType,
        }
        var inc = { $inc: {"reactions.$.count": 1} }

        buildfire.publicData.searchAndUpdate(
            filter, inc, ReactionsSummaries.TAG,
            (err, result) => {
                if (err) return callback(err);

                if (result) callback(null, result);
            }
        );
    }

    static decrement(options, callback) {
        var { itemId, reactionType } = options;

        if (!itemId || !reactionType || !callback) {
            throw Error("Invalid get options!");
        }

        if (typeof callback !== 'function') {
            throw Error("callback must be a function!");
        }

        var filter = {
            "_buildfire.index.string1": itemId,
            "reactions.type": reactionType,
        }
        var inc = { $inc:{"reactions.$.count": -1 }}

        buildfire.publicData.searchAndUpdate(
            filter, inc, ReactionsSummaries.TAG,
            (err, result) => {
                if (err) return callback(err);

                if (result) callback(null, result);
            }
        );
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

    constructor(data = {}) {
        this.selector = data.selector || null; // make sure that selector is valid
        this.showCount = typeof data.showCount === 'boolean' ? data.showCount : false; // default false
        this.showUsersReactions = typeof data.showUsersReactions === 'boolean' ? data.showUsersReactions : false; // show who reacted for each reaction
        this.userReactedWith = null; // reaction type that the user is reacted with

        if (data.types && data.types.length) {
            for (var i = 0; i < data.types.length; i++) {
                if (!this._validateReactionTypes(data.types[i])) {
                    throw Error('Invalid reaction types');
                    return;
                }
            }
        } else {
            throw Error('Invalid reaction types');
        }
        this.types = data.types.map(t => ({ ...t, type: t.type.toLowerCase() }));

        if (data.itemId && typeof data.itemId === 'string') {
            this.itemId = data.itemId;
        } else {
            throw Error('Invalid Item ID');
        }

        this._init();
    }

    _validateReactionTypes(reaction) {
        var availableReactions = ReactionsTypes.types;

        if (reaction && reaction.type && reaction.title) {
            var validReaction = availableReactions.find(r => r.type.toLowerCase() === reaction.type.toLowerCase());
            if (!validReaction) {
                return false;
            }
            return true;
        } else {
            return false;
        }
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
        // if the user is logged in, then we will check if he is reacted with this item or not
        // this._userReactedWith();

        // when click on a reaction type
        // this._react(type)

        // ...
        // this._registerAnalytics();
    }

    _userReactedWith() {
        buildfire.auth.getCurrentUser((err, user) => {
            if (err) return console.error(err);

            Reactions.getByUserId(user._id, this.itemId, (e, r) => {
                if (e) {
                    throw new Error('error while getting user reaction ' + e);
                }
                if (r) {
                    this.userReactedWith = r.data;
                }
            })
        });
    }

    _react(type) {
        // trigger when the user click on reaction icon

        // if the user select a type that he reacted with, then it will be removed
        if (!this.userReactedWith) {
            var reactionData = {
                itemId: this.itemId,
                reactions: {},
                _buildfire: {
                    index: {
                        array1: [{ string1: this.itemId + '-' + type }]
                    }
                }
            }
            buildfire.auth.getCurrentUser((err, user) => {
                if (err) return console.error(err);

                if (!user) {
                    buildfire.auth.login({}, (err, user) => {
                        if (err) return console.error(err);
                        if (user) {
                            reactionData.userId = user._id;
                            reactionData._buildfire.index.string1 = this.itemId + "-" + user._id;

                            var reaction = new Reaction(reactionData);
                            this.add(reaction, (e, r) => {
                                if (e) throw new Error('error while adding reaction ' + e);
                                if (r) {
                                    // add analytics (reaction title);
                                    userReactedWith = r.data;
                                }
                            });
                        }
                    });
                } else {
                    reactionData.userId = user._id;
                    reactionData._buildfire.index.string1 = this.itemId + "-" + user._id;

                    var reaction = new Reaction(reactionData);
                    this.add(reaction, (e, r) => {
                        if (e) throw new Error('error while adding reaction ' + e);
                        if (r) {
                            // add analytics (reaction title);
                            userReactedWith = r.data;
                        }
                    });
                }
            })
        } else {
            // if the user click on the same reaction type, then the reaction will be removed
            // otherwise the reaction will be updated
        }

        // edge cases: 
        // 1. if the user reacted with other type
        // 2. if the user is not logged in
    }

    _registerAnalytics() {
        // add analytics methods
        // 1. for each type, when the user add a reaction with item
        // 2. for each type, when the user remove a reaction with item
        // 3. create ReactionsSummary record if not exist
    }

}