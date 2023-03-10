
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

        static _insert(reaction, callback) {
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

        static _update(reaction, reactionType, callback) {
            let updatedReaction = new Reaction({
                itemId: reaction.itemId,
                userId: reaction.userId,
                reactions: [{ type: reactionType, createdOn: new Date() }]
            })
            updatedReaction._buildfire.index = this.buildIndex(updatedReaction);

            buildfire.appData.searchAndUpdate(
                { "_buildfire.index.string1": reaction._buildfire.index.string1 },
                updatedReaction, this.TAG,
                (err, result) => {
                    if (err) {
                        return callback(err);
                    }

                    return callback(null, result);
                }
            );
        }

        static _search(reaction, callback) {
            let filter = {
                "_buildfire.index.string1": reaction._buildfire.index.string1,
            }
            buildfire.appData.search({ filter, limit: 1 }, this.TAG, (err, result) => {
                if (err) {
                    return callback(err)
                }
                return callback(null, result)
            })
        }

        static unReactReact() {
            // to do
        }

        static react(reaction, callback) {
            if (!reaction) {
                throw new Error("Invalid reaction object!");
            }
            if (!reaction.itemId) {
                throw new Error("Invalid reaction object, Missing itemId!");
            }
            if (!reaction.userId) {
                throw new Error("Invalid reaction object, Messing userId!");
            }
            if (!reaction.reactions || !reaction.reactions.length) {
                throw new Error("Invalid reaction object, reaction type!");
            }

            if (typeof callback !== 'function') {
                throw new Error("callback must be a function!");
            }

            // setting the index
            reaction._buildfire.index = this.buildIndex(reaction);
            let reactionType = reaction.reactions[0].type;

            this._search(reaction, (err, result) => {
                if (err) {
                    return callback(err)
                }

                if (result && result.length) {
                    if (reactionType === result[0].data.reactions[0].type) {
                        return callback(null, { status: 'noAction', data: result[0] })
                    } else {
                        this._update(reaction, reactionType, (err, result) => {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, { status: 'done', data: result })
                        })
                    }
                } else {
                    this._insert(reaction, (err, result) => {
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

        static unReact(reactionId, callback) {
            if (!reactionId || typeof reactionId !== 'string') {
                throw new Error("Invalid reactionId!");
            }
            if (!callback || typeof callback !== 'function') {
                throw new Error("callback must be a function!");
            }

            buildfire.appData.delete(reactionId, this.TAG, (err, result) => {
                if (err && err.code == "NOTFOUND") {
                    return callback(null, { status: 'noAction' });
                } else if (err) {
                    return callback(err);
                }
                return callback(null, { status: 'done' });
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
                this.buildObserver();
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

        static buildObserver() {
            const observer = new MutationObserver((mutationList, observer) => {
                mutationList.forEach(element => {
                    element.addedNodes.forEach(node => {
                        if (node instanceof Element) {
                            if (node.hasAttribute('bf-reactions-itemid')) {
                                let newReactionInstance = {
                                    itemId: node.getAttribute("bf-reactions-itemid"),
                                    container: node,
                                    types: JSON.parse(node.getAttribute("bf-reactions-types")),
                                    showCount: JSON.parse(node.getAttribute("bf-reactions-showCount")),
                                    showUsersReactions: JSON.parse(node.getAttribute("bf-reactions-showUsersReactions")),
                                }
                                this._observerContainers.push(newReactionInstance);
                            } else if (node.hasAttribute('bf-reactions')) {
                                let newReactionInstance = {
                                    container: node,
                                    ...JSON.parse(node.getAttribute("bf-reactions"))
                                }
                                this._observerContainers.push(newReactionInstance);
                            }
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
            elements.forEach(newReaction=>{
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

            // don't allow user to add, update or add new reaction during 1s after the last update
            this._allowReact = true;

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
            let _container = document.querySelector(this.selector) || this.container;
            if (!_container) throw new Error('Selector is not valid');
            else {
                this.container = _container;
                this._buildComponent();
                State.debounce(this.itemId);
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
            if (this._allowReact) {
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
                this._allowReact = false;
                setTimeout(() => {
                    this._allowReact = true;
                }, 1000)
            }
        }

        _addReaction(options) {
            let { icon, selectedReaction, userId } = options;

            icon.classList.add('reacted');
            icon.style.backgroundColor = icon.getAttribute('bf-reactions-color');
            this.container.setAttribute('bf-user_react-type', selectedReaction.type);

            let countContainer = this.container.querySelector(`[bf-reactions-count="${selectedReaction.type}"]`);
            countContainer.innerHTML = parseInt(countContainer.innerText) + 1;

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

                    if (r.status === 'done') {
                        let summery = new ReactionsSummary({
                            itemId: reaction.itemId,
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
            let { icon, userReactType, newReactionType, userId } = options;

            icon.classList.add('reacted');
            icon.style.backgroundColor = icon.getAttribute('bf-reactions-color');
            this.container.querySelector(`[bf-reactions-type="${userReactType}"]`).classList.remove('reacted');
            this.container.querySelector(`[bf-reactions-type="${userReactType}"]`).style.backgroundColor = '#fff';
            this.container.setAttribute('bf-user_react-type', newReactionType);

            let oldCountContainer = this.container.querySelector(`[bf-reactions-count="${userReactType}"]`);
            oldCountContainer.innerHTML = parseInt(oldCountContainer.innerText) - 1;

            let newCountContainer = this.container.querySelector(`[bf-reactions-count="${newReactionType}"]`);
            newCountContainer.innerHTML = parseInt(newCountContainer.innerText) + 1;

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

        _deleteReaction(icon) {
            let reactionId = this.container.getAttribute('bf-user_react-id');
            let itemId = this.container.getAttribute('bf-reactions-itemid');
            let reactionType = this.container.getAttribute('bf-user_react-type');

            let countContainer = this.container.querySelector(`[bf-reactions-count="${reactionType}"]`);
            countContainer.innerHTML = parseInt(countContainer.innerText) - 1;

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
                    if (r.status === 'done') {
                        /* Reaction deleted successfully */
                        ReactionsSummaries.decrement({ itemId, reactionType }, (e, r) => { if (e) return console.log(e) });
                    } else if (r.status === 'noAction') {
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

        static build(){
            State.buildObserver();
        }
    }

    return ReactionComponent;
})();
// data model