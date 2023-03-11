
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

        // options: reaction, reactionType, operation
        static _update(options, callback) {
            
            if (!options) {
                throw new Error("Invalid options. Options must be set and have at least reaction, reactionType and operation properties!");
            }
            if (!["add","remove","toggle"].includes(options.operations)) {
                throw new Error("Invalid operations option. Operations coulde be one of the following:  add, remove or toggle");
            }
            if (!options.reaction) {
                throw new Error("Invalid options, Missing reaction!");
            }
            // TODO: add new function to check if provided reactionType already defined
            if (!options.reactionType) {
                throw new Error("Invalid options, Missing reactionType!");
            }

            const reactionId = options.reaction.id;
            let updatedReaction = new Reaction(options.reaction);

            if(options.operation=="add"){
                updatedReaction.reaction.reactions= [...options.reaction.reactions, { type: options.reactionType, createdOn: new Date() }]
            } else if(options.operation=="remove") { // remove
                updatedReaction.reaction.reactions.filter(reaction => reaction.type !== options.reactionType);
            } else {
                updatedReaction.reaction.reactions = [{ type: options.reactionType, createdOn: new Date() }];
            }

            // reaction data is now complete, build the index
            updatedReaction._buildfire.index = this.buildIndex(updatedReaction);

            
            // this part could be enhanced to use $push and $pull
            /* $push : {
                reactions: {...}
                _buildfire.index.array1.string1: {...}
            }
           
           []
           ---> like  --> [like]
           ---> angry --> [angry]
           ---> happy --> [happy]
            [like, angry, happy]
            reactions.$.type = ...
             */
            buildfire.appData.update(reactionId,
                updatedReaction, this.TAG,
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

            if(options.reactionsId){
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

        // options: {itemId, userId, reactionsId=null, reactionType}
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
    
                    if (result) {
                        if (result.data.reactions.find((reaction) => reaction.type === options.reactionType)) {
                            return callback(null, { status: 'noAction', data: result })
                        } else {
                            const reaction = result.data;
                            const oldReactionType = reaction.reactions.length ? reaction.reactions[0].type : "";
                            reaction.id = result.id;
                            let updateOptions = {
                                reaction: reaction,
                                reactionType: options.reactionType,
                                operation: "toggle"
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
                            return callback(null, { status: 'done', data: result, oldReactionType:"" })
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

                if (result) {
                    if (result.data.reactions.find((reaction) => reaction.type === options.reactionType)) {
                        return callback(null, { status: 'noAction', data: result })
                    } else {
                        const reaction = result.data;
                        reaction.id = result.id;
                        let updateOptions = {
                            reaction: reaction,
                            reactionType: options.reactionType,
                            operation: "add"
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

                if (result) {
                    if (!result.data.reactions.find((reaction) => reaction.type === options.reactionType)) {
                        return callback(null, { status: 'noAction', data: result })
                    } else {

                        const reaction = result.data;
                        reaction.id = result.id;

                        // if the reaction type we are going to remive is the only one left, delte the whole records
                        if(reaction.reactions.length==1){

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
                                operation: "remove"
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
                    let typeData = result[0].data.reactions.find(r=>r.type==reactionType);
                    let filter = {},obj={};
                    if(typeData){
                        filter = {
                            "_buildfire.index.string1": itemId,
                            "reactions.type": reactionType,
                        }
                        obj = { $inc: { "reactions.$.count": typeData.count>0?-1:0 }, $set: { "reactions.$.lastReactionBy": null } }
                    }else{
                        filter = {
                            '_buildfire.index.string1': itemId,
                        }
                        obj = { $addToSet: { reactions: {type:reactionType, count:0, lastReactionBy:null}, "_buildfire.index.array1": { string1: 'reactionType-' + reactionType } } }
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

        // use checkDuplicate for insert to avoid duplicate insertions
        static buildIndex(data = {}) {
            const index = {
                string1: data.itemId,
                array1: data.reactions.map(r => ({ string1: 'reactionType-' + r.type }))
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

    class State {
        // debounce getting item reactions to avoid multi-request to server
        static _itemIds = [];
        static _timer;

        static _debounce(itemId) {
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

    class ReactionComponent {

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
                        // this._registerAnalytics(_t.title, _t.type);
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
            if (!_container) throw new Error('Selector is not valid');
            else {
                this.container = _container;
                this._buildComponent();
                State._debounce(this.itemId);
            }
        }

        _refresh() {
            // TODO: scan all existing DOM elem 
            // typical use case: after onLOgin / onLogout
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
                this._addReaction({ icon, selectedReaction, userId })
            }
        }

        _addReaction(options) {
            let { icon, selectedReaction, userId } = options;

            icon.classList.add('reacted');
            icon.style.backgroundColor = icon.getAttribute('bf-reactions-color');
            this.container.setAttribute('bf-user_react-type', selectedReaction.type);

            // include buildfire index from the data access
            let reaction = new Reaction({
                itemId: selectedReaction.itemId,
                userId,
                reactions: [{ type: selectedReaction.type, createdOn: new Date() }],
            })
            Reactions.react(reaction, (e, r) => {
                if (e) {
                    icon.classList.remove('reacted');
                    icon.style.backgroundColor = '#fff';
                    this.container.setAttribute('bf-user_react-type', '');
                    throw new Error('Error while adding new Reaction: ' + e)
                } else if (r) {

                    this.container.setAttribute('bf-user_react-id', r.data.id);

                    if(r.status === 'done'){
                        let summery = new ReactionsSummary({
                            itemId: reaction.itemId,
                            reactions:  [{ type: selectedReaction.type, count:1, lastReactionBy: userId}],
                        })
                        ReactionsSummaries.increment(summery, (e, r) => { if (e) return console.log(e) });
                    }else if(r.status === 'noAction'){
                        // nothing will be happened
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

            let itemId = this.container.getAttribute('bf-reactions-itemid')
            let reaction = new Reaction({
                userId: userId,
                itemId: itemId,
                reactions: [{ type: newReactionType, createdOn: new Date() }]
            })
            Reactions.react(reaction, (e, r) => {
                if (e) {
                    icon.classList.remove('reacted');
                    icon.style.backgroundColor = '#fff';
                    this.container.querySelector(`[bf-reactions-type="${userReactType}"]`).classList.add('reacted');
                    this.container.querySelector(`[bf-reactions-type="${userReactType}"]`).style.backgroundColor = this.container.querySelector(`[bf-reactions-type="${userReactType}"]`).getAttribute('bf-reactions-color');
                    this.container.setAttribute('bf-user_react-type', userReactType);
                } else if (r) {
                    // reaction updated successfully 
                    if(r.status === 'done'){
                        // decrement for the old type and increment the new one
                        let summary = new ReactionsSummary({
                            itemId, reactions:[{type:newReactionType, count:1, lastReactionBy:userId}]
                        })
                        ReactionsSummaries.decrement({ itemId, reactionType: userReactType }, (e, r) => { if (e) return console.log(e) });
                        ReactionsSummaries.increment(summary, (e, r) => { if (e) return console.log(e) });
                    }else if(r.status === 'noAction'){
                        // nothing will be happened
                    }
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

            Reactions.unReact(reactionId, (e, r) => {
                if (e) {
                    this.container.setAttribute('bf-user_react-type', reactionType);
                    this.container.setAttribute('bf-user_react-id', reactionId);
                    icon.classList.add('reacted');
                    icon.style.backgroundColor = icon.getAttribute('bf-reactions-color');
                } else if (r) {
                    if(r.status==='done'){
                        /* Reaction deleted successfully */
                        ReactionsSummaries.decrement({ itemId, reactionType }, (e, r) => { if (e) return console.log(e) });
                    }else if(r.status === 'noAction'){
                        // nothing will be happened
                    }
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

    return ReactionComponent;
})();
// data model