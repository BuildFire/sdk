
if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
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

        // options: {itemId, userId, reactionType}
        static _insert(options, callback) {
            let reaction = new Reaction({
                itemId: options.itemId,
                userId: options.userId,
                reactions: [{ reactionType: options.reactionType }]
            })
            reaction._buildfire.index = this._buildIndex(reaction);

            buildfire.appData.insert(
                reaction, this.TAG, false,
                (err, result) => {
                    if (err) {
                        return callback(err);
                    }
                    // track reaction event
                    let groupName = ReactionsTypes.itemsReactionsGroupName[options.itemId];
                    buildfire.analytics.trackAction('react', { groupName, itemId: options.itemId, reactionType: options.reactionType });
                    return callback(null, result);
                }
            );
        }

        // options: reaction, reactionType, operation, allowMultipleReactions
        static _update(options, callback) {

            let filter = {
                "_buildfire.index.string1": options.reaction.itemId + '-' + options.reaction.userId
            };
            let obj = {};
            /**
             * "obj" is a variable used to handle the process associated with a reaction. The behavior of the process depends on the user's selection. Here are the possibilities:
             * - If the user chooses the same reaction type as before, the process will be remove.
             * - If the user selects a new reaction type represented by a different icon, the process can either be toggle or add.
            */
            if (options.allowMultipleReactions) {
                if (options.operation == "add" || options.operation == "toggle") {
                    obj = { $addToSet: { reactions: { reactionType: options.reactionType }, "_buildfire.index.array1": { string1: "reactionType-" + options.reaction.itemId + "-" + options.reactionType } } }
                } else if (options.operation == "remove") {
                    obj = { $pull: { reactions: { reactionType: options.reactionType } } }
                }
            } else {
                if (options.operation == "add" || options.operation == "toggle") {
                    obj = { $set: { reactions: [{ reactionType: options.reactionType }], "_buildfire.index.array1": [{ string1: "reactionType-" + options.reaction.itemId + "-" + options.reactionType }] } }
                } else if (options.operation == "remove") {
                    obj = { $set: { reactions: [], "_buildfire.index.array1": [] } }
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
                return callback("Invalid options. Options must be set and have at least oldReactionType, newReactionUUID, userId and itemId properties!");
            }
            if (!options.itemId) {
                return callback("Invalid options, Missing itemId!");
            }
            if (!options.userId) {
                return callback("Invalid options, Missing userId!");
            }
            if (!options.reactionType) {
                return callback("Invalid options, Missing reaction Type!");
            }

            this._search(options, (err, result) => {
                if (err) {
                    return callback(err)
                }

                if (result && result.data) {
                    if (result.data.reactions.find((reaction) => reaction.id === options.reactionType)) {
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
                return callback("Invalid options. Options must be set and have at least reaction ID, userId and itemId properties!");
            }
            if (!options.itemId) {
                return callback("Invalid options, Missing itemId!");
            }

            if (!options.reactionType) {
                return callback("Invalid options, Missing reaction Type!");
            }
            if (!options.userId) {
                return callback("Invalid options, Missing userId!");
            }

            this._search(options, (err, result) => {
                if (err) {
                    return callback(err)
                }
                if (result && result.data) {
                    if (result.data.reactions.find((reaction) => reaction.reactionType === options.reactionType)) {
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
                        this._update(updateOptions, (err, res) => {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, { status: 'updated', data: res, oldData: result.data })
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
                return callback("Invalid options. Options must be set and have at least reaction ID, userId and itemId properties!");
            }
            if (!options.itemId) {
                return callback("Invalid options, Missing itemId!");
            }
            if (!options.userId) {
                return callback("Invalid options, Missing userId!");
            }
            if (!options.reactionType) {
                return callback("Invalid options, Missing reaction Type!");
            }

            this._search(options, (err, result) => {
                if (err) {
                    return callback(err)
                }

                if (result && result.data) {
                    if (!result.data.reactions.find((reaction) => reaction.reactionType === options.reactionType)) {
                        return callback(null, { status: 'noAction', data: result })
                    } else {

                        const reaction = result.data;
                        reaction.id = result.id;

                        // if the reaction type that we are going to remove is the only one left, delete the whole records
                        if (reaction.reactions.length == 1) {
                            buildfire.appData.delete(reaction.id, this.TAG, (err, result) => {
                                if (err && err.code == "NOTFOUND") {
                                    return callback(null, { status: 'noAction' });
                                } else if (err) {
                                    return callback(err);
                                }
                                // track reaction event
                                let groupName = ReactionsTypes.itemsReactionsGroupName[options.itemId];
                                buildfire.analytics.trackAction('unReact', { groupName, itemId: options.itemId, reactionType: options.reactionType });

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
                                return callback(null, { status: 'deleted', data: result })
                            })
                        }
                    }
                } else {
                    return callback(null, { status: 'noAction' });
                }
            })
        }
        // options: { itemId, groupName, pageIndex, pageSize }
        static get(options, callback) { // fetch who reacted for specific item
            if (!callback || typeof callback !== 'function') {
                return console.error("callback must be a function!");
            }

            if (!options) {
                return callback("missing get options!");
            }
            let { itemId, groupName, pageIndex, pageSize } = options;

            if (!itemId) {
                return callback("Invalid get options!");
            }

            if (typeof pageIndex !== 'number') {
                pageIndex = 0;
            }

            if (!pageSize) {
                pageSize = State.userListPageSize;
            }

            // get all available types for this item
            ReactionsTypes.getReactionsTypes({ groupName, itemId }, (err, reactions) => {
                if (err) {
                    return callback(err)
                }
                let inArr = reactions.map(reaction => {
                    return `reactionType-${itemId}-${reaction.id}`
                })

                let filter = { "_buildfire.index.array1.string1": { $in: inArr } }

                buildfire.appData.search(
                    {
                        filter, page: pageIndex, pageSize, recordCount: true
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
            });
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

        static _buildIndex(data = {}) {
            const index = {
                string1: data.itemId + '-' + data.userId,
                array1: data.reactions.map(reaction => ({ string1: "reactionType-" + data.itemId + "-" + reaction.reactionType }))
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
                return callback("Invalid options, Missing increment reaction Type!");
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
                        reactions: [{ reactionType, count: 1, lastReactionBy: userId }]
                    })
                    summery._buildfire.index = this._buildIndex(summery);
                    this._create(summery, (err, res) => {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, { status: 'done' })
                    })
                } else {
                    let reactionData = result[0].data.reactions.find(reaction => reaction.reactionType == reactionType);
                    let filter = {}, obj = {};
                    if (reactionData) {
                        filter = {
                            "_buildfire.index.string1": itemId,
                            "reactions.reactionType": reactionType,
                        }
                        obj = { $inc: { "reactions.$.count": 1 }, $set: { "reactions.$.lastReactionBy": userId } }
                    } else {
                        filter = {
                            '_buildfire.index.string1': itemId,
                        }
                        obj = { $addToSet: { reactions: { reactionType, count: 1, lastReactionBy: userId }, "_buildfire.index.array1": { string1: 'reactionType-' + reactionType } } }
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
                return callback("Invalid options, Missing decrement reaction Type!");
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
                        reactions: [{ reactionType, count: 0, lastReactionBy: null }]
                    })
                    summery._buildfire.index = this._buildIndex(summery);
                    this._create(summery, (err, res) => {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, { status: 'done' })
                    })
                } else {
                    let typeData = result[0].data.reactions.find(reaction => reaction.reactionType == reactionType);
                    let filter = {}, obj = {};
                    if (typeData) {
                        filter = {
                            "_buildfire.index.string1": itemId,
                            "reactions.reactionType": reactionType,
                        }
                        obj = { $inc: { "reactions.$.count": typeData.count > 0 ? -1 : 0 }, $set: { "reactions.$.lastReactionBy": null } }
                    } else {
                        filter = {
                            '_buildfire.index.string1': itemId,
                        }
                        obj = { $addToSet: { reactions: { reactionType, count: 0, lastReactionBy: null }, "_buildfire.index.array1": { string1: 'reactionType-' + reactionType } } }
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

        static _buildIndex(data = {}) {
            const index = {
                string1: data.itemId,
                array1: data.reactions.map(reaction => ({ string1: 'reactionType-' + reaction.reactionType }))
            };

            return index;
        }
    }

    class ReactionsTypes {
        static itemsReactionsGroupName = {};
        static groups = null;

        static get TAG() {
            return "$$reactionsGroups";
        }

        // options = saved to futuer use
        static getReactionsGroups(options, callback) {
            if (!callback || typeof callback !== 'function') {
                return console.error("callback must be a function!");
            }

            buildfire.appData.get(this.TAG, (err, result) => {
                if (err) return callback(err)

                if (!result.data || !result.data.groups || !result.data.groups.length) {
                    this.groups = [];
                    return callback(null, []);
                }

                this.groups = result.data.groups;
                return callback(null, this.groups);
            });
        }

        // options ={groupName, itemId}
        static getReactionsTypes(options, callback) {
            const { groupName, itemId } = options;

            if (!callback || typeof callback !== 'function') {
                return console.error("callback must be a function!");
            }

            if (!this.groups || !this.groups.length) {
                return callback("No Reactions Group Added yet");
            }

            if (!itemId) {
                return callback("missing itemId", null);
            }

            let group = null;
            if (groupName) {
                for (let i = 0; i < this.groups.length; i++) {
                    if (this.groups[i].name.toLowerCase() === groupName.toLowerCase()) {
                        group = this.groups[i];
                        break;
                    }
                }
                if (!group) {
                    return callback("Invalid group name");
                }
            } else {
                group = this.groups[0];
            }

            let allActiveReactions = group.reactions.filter(reaction => (reaction.isActive == true && reaction.selectedUrl && reaction.unSelectedUrl));
            // resize reaction images
            allActiveReactions = allActiveReactions.map(reaction => {
                let selectedUrl = buildfire.imageLib.resizeImage(reaction.selectedUrl, { size: "xs", aspect: "1:1" }),
                    unSelectedUrl = buildfire.imageLib.resizeImage(reaction.unSelectedUrl, { size: "xs", aspect: "1:1" });

                return ({ ...reaction, selectedUrl, unSelectedUrl });
            });

            if (!this.itemsReactionsGroupName[itemId]) {
                this.itemsReactionsGroupName[itemId] = groupName || group.name;
            }

            return callback(null, allActiveReactions);
        }

        // options ={reactionType, groupName, itemId}
        static validateReactionTypes(options, callback) {
            const { reactionType, itemId, groupName } = options;

            if (!reactionType) {
                return callback('Missing reaction Type');
            }
            if (!itemId) {
                return callback('Missing itemId');
            }

            this.getReactionsTypes({ itemId, groupName }, (err, res) => {
                if (err) {
                    return callback(err);
                }
                let validState = res.find(reaction => reaction.id == reactionType);

                if (validState) {
                    return callback(null, validState)
                }
                return callback('Invalid Reaction ID');
            });
        }
    }

    class State {
        // debounce getting item reactions to avoid multi-request to server
        static _itemIds = [];
        static _timer;
        static _valid_HTML_Elements = [];
        static _observerTimer;
        static _firstReactionsSet = false; // check if the observer selector set the first elements or not
        static user = null;
        static longPressPeriod = 500; //  500 ms
        static userListLimit = 250; // 250 users maximum
        static userListPageSize = 50; // 50 records per page

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
                    if (!this.user || !this.user._id) {
                        this._setCurrentUser((err, user) => {
                            if (err) return console.error(err);

                            if (user && user._id) {
                                Reactions.getByUserId(user._id, requestedIds, (error, result) => {

                                    if (error) console.error(error);
                                    if (result) {/* show users reactions on items */
                                        State._showUserReactions(result)
                                    }
                                })
                            }
                        })
                    } else {
                        Reactions.getByUserId(this.user._id, requestedIds, (error, result) => {

                            if (error) console.error(error);
                            if (result) {/* show users reactions on items */
                                State._showUserReactions(result)
                            }
                        })
                    }
                }
            }, 300)
        }

        static _showAllReactionCount(summaries, itemIds) {
            // print reactions count in the dom
            summaries.forEach(summery => {
                let containers = document.querySelectorAll(`[bf-reactions-item-id="${summery.data.itemId}"]`),
                    iconIds = [];
                containers.forEach(container => {
                    if (container) {
                        let groupName = ReactionsTypes.itemsReactionsGroupName[summery.data.itemId];
                        let totalReactionCount = 0;
                        summery.data.reactions.forEach(reaction => {
                            ReactionsTypes.validateReactionTypes({ reactionType: reaction.reactionType, itemId: summery.data.itemId, groupName: groupName ? groupName : '' }, (err, res) => {
                                if (err) console.error(err);
                                else if (reaction.count > 0) {
                                    totalReactionCount += reaction.count;
                                    iconIds.push({ id: res.id, count: reaction.count });
                                }
                            })
                        });

                        let secondaryImages = container.querySelectorAll('[bf-reaction-image-id]');
                        let userReactionType = container.getAttribute('bf-user_react-type');
                        secondaryImages = Array.from(secondaryImages).filter(icon => {
                            let id = icon.getAttribute('bf-reaction-image-id');
                            let iconExist = iconIds.find(icon => icon.id == id);
                            if (iconExist) {
                                icon.setAttribute('bf-reaction-image-count', iconExist.count);
                            } else {
                                icon.setAttribute('bf-reaction-image-count', 0);
                            }
                            return (iconExist && userReactionType !== id);
                        })

                        secondaryImages.forEach((icon, idx) => {
                            icon.classList.remove('reactions-hidden');
                        })

                        let totalCountContainer = container.querySelector(`[bf-reactions-total-count]`);

                        if (totalCountContainer) {
                            totalCountContainer.setAttribute('bf-reactions-total-count', totalReactionCount);
                            totalCountContainer.innerHTML = this.correctCountNumbers(totalReactionCount);
                        }
                    }

                })
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
                    ReactionsTypes.validateReactionTypes({ itemId: reaction.data.itemId, reactionType: reaction.data.reactions[0].reactionType, groupName: ReactionsTypes.itemsReactionsGroupName[reaction.data.itemId] || '' }, (e, r) => {
                        if (e) {
                            return console.error(e);
                        }
                        if (r) {
                            let containers = document.querySelectorAll(`[bf-reactions-item-id="${reaction.data.itemId}"]`);
                            containers.forEach(container => {
                                let mainButton = container.querySelector('[bf-reactions-btn]');
                                let userReactionIcon = container ? container.querySelector(`[bf-reaction-type="${reaction.data.reactions[0].reactionType}"]`) : null;

                                if (container && userReactionIcon) {
                                    container.setAttribute('bf-user_react-type', reaction.data.reactions[0].reactionType);
                                    container.setAttribute('bf-user_react-id', reaction.id);
                                    userReactionIcon.classList.add('reacted');
                                    userReactionIcon.style.color = userReactionIcon.getAttribute('bf-reactions-color');

                                    let userIcon = container.querySelector(`[bf-reaction-image-id="${reaction.data.reactions[0].reactionType}"]`);
                                    if (!userIcon.classList.contains('reactions-hidden')) {
                                        userIcon.classList.add('reactions-hidden');
                                    }

                                    mainButton.src = userReactionIcon.getAttribute('bf-reactions-reacted-url');
                                    mainButton.classList.add('reactions-show-main-icon');
                                    setTimeout(() => {
                                        mainButton.classList.remove('reactions-show-main-icon');
                                    }, 300)
                                }
                            })
                        }
                    })
                }
            })
        }

        static correctCountNumbers(num) {
            let code = '';
            if (num >= 1000000000) {
                code = 'b';
                num = (num / 1000000000);
            }
            if (num >= 1000000) {
                code = 'm';
                num = (num / 1000000);
            }
            if (num >= 1000) {
                code = 'k';
                num = (num / 1000);
            }

            num = num.toString();
            if (num.includes('.')) {
                num = num.split('.')[0] + '.' + num.split('.')[1].substring(0, 1);
            }

            if (num.split('.')[1] == '0') {
                num = num.split('.')[0];
            }
            return num + code;
        }

        static buildReactionElements(selector) {
            let container;
            if (selector) {
                container = document.querySelector(selector);
            } else {
                container = document.body;
            }
            let firstElements = container.querySelectorAll('*');
            this._valid_HTML_Elements = [];
            this._getValidHTMLElements(firstElements);
            this._buildComponentByHTML(this._valid_HTML_Elements);
        }

        static _getValidHTMLElements(elements) {
            elements.forEach(node => {
                let newReactionInstance = {};
                try {
                    if (node.hasAttribute('bf-reactions-item-id')) {
                        let bfOnReaction = node.getAttribute("bf-reactions-on-update");
                        let bfOnError = node.getAttribute("bf-reactions-on-error");
                        let onUpdate, onError;
                        if (bfOnReaction) {
                            onUpdate = window[bfOnReaction];
                        }
                        if (bfOnError) {
                            onError = window[bfOnError];
                        }
                        newReactionInstance = {
                            itemId: node.getAttribute("bf-reactions-item-id"),
                            container: node,
                            groupName: node.getAttribute("bf-reactions-group-name"),
                            itemType: node.getAttribute("bf-reactions-item-type"),
                            showCount: JSON.parse(node.getAttribute("bf-reactions-show-count")),
                            showUsersReactions: JSON.parse(node.getAttribute("bf-reactions-show-users-reactions")),
                            onUpdate, onError,
                        }
                        this._valid_HTML_Elements.push(newReactionInstance);
                    } else if (node.hasAttribute('bf-reactions')) {
                        newReactionInstance = {
                            container: node,
                            ...JSON.parse(node.getAttribute("bf-reactions")),
                        }
                        if (newReactionInstance.onUpdate) {
                            newReactionInstance.onUpdate = window[newReactionInstance.onUpdate];
                        }
                        if (newReactionInstance.onError) {
                            newReactionInstance.onError = window[newReactionInstance.onError];
                        }
                        this._valid_HTML_Elements.push(newReactionInstance);
                    }
                } catch (error) {
                    return console.error('Error while parsing JSON: ' + error)
                }
            })
        }

        static _buildComponentByHTML(elements) {
            elements = Array.from(elements);
            // filter and remove repeated HTML elements
            elements = elements.filter((element, idx) => elements.findIndex(ele => ele.container == element.container) == idx);
            elements.forEach(newReaction => {
                new buildfire.components.reactions(null, newReaction);
            })
        }

        static _onLoginLogoutHandler(user) {
            let validNodes = document.querySelectorAll('[bf-reactions-item-id]');
            validNodes.forEach(node => {
                let mainBtn = node.querySelector('[bf-reactions-default-src]');
                if (mainBtn && !user) {
                    mainBtn.src = mainBtn.getAttribute('bf-reactions-default-src');
                }

                let itemId = node.getAttribute('bf-reactions-item-id');
                if (itemId && user) {
                    State.debounce({ itemId, getUsersData: true });
                }
            })
        }
        // this method is used to get the current user one time and store his data
        // there is no need to search about the user and wait for the response
        static _setCurrentUser(callback) {
            buildfire.auth.getCurrentUser((err, user) => {
                if (err || !user) {
                    this.user = {};
                } else if (user && user._id) {
                    this.user = user;
                }

                buildfire.auth.onLogin((loggedUser) => {
                    this._onLoginLogoutHandler(loggedUser);
                    this.user = loggedUser;
                }, true);

                buildfire.auth.onLogout(() => {
                    this._onLoginLogoutHandler(null);
                    this.user = {};
                }, true);

                return callback(err, this.user);
            })
        }
    }

    class ReactionComponent {
        // Widget side
        constructor(selector, data = {}) {
            if (data.onUpdate) {
                this.onUpdate = data.onUpdate;
            }

            if (data.onError) {
                this.onError = data.onError;
            }

            this.itemType = data.itemType || '';
			/**
			 * itemId note:
			 * we have two itemId related properties:
			 * 1. this.itemId : which is the original item id provided by developper and used in the plugin level
			 *
			 * 2. this._itemId : which is a combination between actual item id and item type
			 *    this property is used on component level to manage reactions and shouldn't be returned to user side
			 *
			*/
            this._itemId = this.itemType ? `${this.itemType}-${data.itemId}` : data.itemId;
            this.itemId = data.itemId;
            this.groupName = data.groupName || '';
            this.selector = selector || null;
            this.container = data.container || null;
            this.container = this.container || document.querySelector(this.selector);

            this.showCount = typeof data.showCount === 'boolean' ? data.showCount : true; // default true
            this.showUsersReactions = typeof data.showUsersReactions === 'boolean' ? data.showUsersReactions : true; // show who reacted for each reaction
            this.allowMultipleReactions = false;

            if (data.dataFromMessage) {
                ReactionsTypes.groups = data.dataFromMessage;
                ReactionsTypes.itemsReactionsGroupName[this._itemId] = data.groupName || data.dataFromMessage[0].name;
            }

            if (!this.itemId && buildfire.context.type !== "control") {
                this.onError({ errorCode: '1001', message: 'missing required data, invalid itemId' })
                return console.error('Missing itemId');
            }

            if (!this.container) {
                this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '1001', message: 'missing required data, invalid selector/container' })
                return console.error('Missing selector');
            }

            buildfire.components.reactions.getReactionGroups((error, res) => {
                if (error) return console.error(error);

                let options = {
                    groupName: this.groupName,
                    itemId: this._itemId
                }
                this._getReactionTypes(options, (err, reactions) => {
                    if (err) return this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '1002', message: 'wrong data, invalid group name' });

                    this.reactionsArr = reactions;
                    this._init();
                });

            });
        }

        _init() {
            if (this.reactionsArr.length) {
                this._fixGroupName(this.groupName, (err, res) => {
                    if (err) {
                        this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '5001', message: 'error while getting data, ' + err });
                    } else if (!res.existGroupName) {
                        this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '1002', message: 'wrong data, invalid group name' });
                    } else {
                        this._buildComponent();
                        State.debounce({ itemId: this._itemId, getUsersData: true, getSummariesData: true });
                    }
                });
            } else {
                this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '1003', message: 'empty record, No Reactions added yet' });
                return console.error('No Reactions added yet');
            }
        }

        _fixGroupName(groupName, callback) {
            const validateName = () => {
                if (groupName && ReactionsTypes.groups.length) {
                    let currentGroup;
                    for (let i = 0; i < ReactionsTypes.groups.length; i++) {
                        if (ReactionsTypes.groups[i].name.toLowerCase() === groupName.toLowerCase()) {
                            currentGroup = ReactionsTypes.groups[i];
                            break;
                        }
                    }
                    if (currentGroup && currentGroup.name) {
                        return callback(null, { existGroupName: true });
                    } else {
                        return callback(null, { existGroupName: false });
                    }
                    // if no group provided then return {existGroupName:true}, so we will take the default group
                } else if (ReactionsTypes.groups.length) {
                    return callback(null, { existGroupName: true });
                }
            }
            if (!ReactionsTypes.groups) {
                buildfire.components.reactions.getReactionGroups((error, res) => {
                    if (error) return callback(error);
                    validateName();
                });
            } else {
                validateName();
            }
        }

        _buildComponent() {
            this.container.innerHTML = null;
            // build the component HTML elements
            let iconsContainer = '';
            this.reactionsArr.forEach((reaction, idx) => {
                iconsContainer += ` <div reactions-icon-buttons class="reactions-icon-buttons reaction-container-show">
                                        <img style="animation-duration:${idx / 10 + 0.1}s;" bf-reactions-non-reacted-url="${reaction.unSelectedUrl}" bf-reactions-reacted-url="${reaction.selectedUrl}" bf-reactions-url="${reaction.url}" bf-reaction-type="${reaction.id}" class="disable-user-select reactions-clickable-image reactions-icon-animation" src="${reaction.selectedUrl}" />
                                    </div>`
            });
            this.container.setAttribute('bf-reactions-item-id', this._itemId);
            this.container.setAttribute('bf-user_react-type', ''); // reaction id from the reaction list
            this.container.setAttribute('bf-user_react-id', '');   // selected reaction id that autogenerated when the user selected
            this.container.classList.add('reactions-main-container');
            let secondaryIcons = ``;

            this.reactionsArr.forEach((icon, idx) => {
                secondaryIcons += `<img bf-reaction-image-id="${icon.id}" style="z-index:${9 - idx}" bf-reaction-image-count="0" class="disable-user-select reactions-hidden reactions-secondary-icon" src="${icon.selectedUrl}" />`
            })
            this.container.innerHTML = `
                <div class="reaction-main-button">
                    <div bf-reactions-image-container class="reactions-main-icon-container" >
                        <img bf-reactions-btn class="disable-user-select reactions-main-icon" bf-reactions-default-src="${this.reactionsArr[0].unSelectedUrl}" src="${this.reactionsArr[0].unSelectedUrl}" />
                        ${secondaryIcons}
                    </div>
                    <span style="visibility:hidden;" class="reactions-total-count reactions-hidden" bf-reactions-total-count="0">0</span>
                </div>
                <div class="reactions-icon-container reactions-hidden" bf-reaction-icon-container>${iconsContainer}</div>
            `;

            // show reactions container
            this.holdTimer = null;
            this.holdPeriod = 0;

            let startHoldTimer = (event) => {
                event.preventDefault();
                this._hideReactionIcons();
                // press and hold to show reactions list
                this.holdTimer = setInterval(() => {
                    this.holdPeriod += State.longPressPeriod / 10;
                    if (this.holdPeriod >= State.longPressPeriod && this.reactionsArr.length > 1) {
                        this._showReactionIcons();
                        this.holdPeriod = 0;
                        clearInterval(this.holdTimer);
                    }
                }, State.longPressPeriod / 10);
            }

            let clearHoldTimer = (event) => {
                event.preventDefault();
                let reactionIconsContainer = this.container.querySelector('[bf-reaction-icon-container]');
                if ((this.holdPeriod < State.longPressPeriod || this.reactionsArr.length === 1) && reactionIconsContainer && reactionIconsContainer.classList.contains('reactions-hidden')) {
                    let reactionIcons = this.container.querySelectorAll('[bf-reaction-type]');
                    let reacted = this.container.querySelector('.reacted');
                    if (reacted) {
                        this._validateUserAndReact(reacted.getAttribute('bf-reaction-type'), reacted);
                    } else {
                        this._validateUserAndReact(reactionIcons[0].getAttribute('bf-reaction-type'), reactionIcons[0]);
                    }
                }

                this.holdPeriod = 0;
                clearInterval(this.holdTimer);
            }

            let reactionBtn = this.container.querySelector('[bf-reactions-btn]');
            let reactionCountBtn = this.container.querySelector('[bf-reactions-total-count]');

            if (this.showCount) {
                reactionCountBtn.classList.remove('reactions-hidden');
                // show user reactions list
                if (this.showUsersReactions) {
                    reactionCountBtn.addEventListener('click', (event) => {
                        event.preventDefault();
                        this._showUsersList();
                    })
                }
            }

            reactionBtn.addEventListener('mousedown', startHoldTimer);
            reactionBtn.addEventListener('touchstart', startHoldTimer);

            reactionBtn.addEventListener('mouseup', clearHoldTimer);
            reactionBtn.addEventListener('touchend', clearHoldTimer);

            let reactionIcons = this.container.querySelectorAll('[bf-reaction-type]');
            reactionIcons.forEach(icon => {
                icon.addEventListener('click', (event) => {
                    event.preventDefault();
                    this._validateUserAndReact(icon.getAttribute('bf-reaction-type'), icon);
                })
            })
        }

        _showReactionIcons() {
            let reactionIconsContainer = this.container.querySelector('[bf-reaction-icon-container]');
            if (reactionIconsContainer) {
                reactionIconsContainer.classList.remove('reactions-hidden');
            }

            document.body.addEventListener('click', (event) => {
                event.preventDefault();
                if (event && !this.container.contains(event.target)) {
                    this._hideReactionIcons(this.container);
                }
            });
        }

        _validateUserAndReact(newReactionUUID, icon) {
            if (State.user && State.user._id) {
                this._reactionHandler(newReactionUUID, icon, State.user._id);
            } else {
                buildfire.auth.login({}, (err, user) => {
                    if (user && user._id) {
                        State.user = user;
                        this._reactionHandler(newReactionUUID, icon, user._id);
                    }
                });
            }
        }

        _reactionHandler(newReactionUUID, icon, userId) {
            let userReactUUID = this.container.getAttribute('bf-user_react-type');

            let selectedReaction = {
                reactionType: newReactionUUID,
                reactionId: this.container.getAttribute('bf-user_react-id') || null,
                itemId: this.container.getAttribute('bf-reactions-item-id'),
            }

            if (userReactUUID) {
                if (userReactUUID === newReactionUUID) {
                    this._deselectReaction({ icon, userReactUUID, userId, selectedReaction })
                } else {
                    this._toggleReaction({ icon, userReactUUID, userId, selectedReaction })
                }
            } else {
                this._addReaction({ icon, selectedReaction, userId })
            }
        }

        _addReaction(options) {
            let { icon, selectedReaction, userId, fromQueue } = options;

            this._renderReactionIconsBox({ newIcon: icon, fromQueue })

            let reactOptions = { itemId: selectedReaction.itemId, userId, reactionType: selectedReaction.reactionType, allowMultipleReactions: this.allowMultipleReactions }
            if (this.hasPendingRequest) {
                this.nextRequest = { type: 'add', options }
            } else {
                this.hasPendingRequest = true;
                Reactions.react(reactOptions, (error, result) => {
                    if (error) {
                        this._renderReactionIconsBox({ oldIcon: icon });
                        this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '5002', message: 'error while updating the data, ' + error });
                        return console.error('Error while adding new Reaction: ' + error)
                    } else if (result) {
                        if (result.status === 'added') {
                            this.container.setAttribute('bf-user_react-id', result.data.id);
                            let options = { reactionType: selectedReaction.reactionType, itemId: selectedReaction.itemId, userId }
                            ReactionsSummaries.increment(options, (err, res) => {
                                this._checkPendingRequest();

                                if (err) {
                                    this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '5002', message: 'error while updating the data, ' + err });
                                    return console.error(err);
                                }
                                if (res.status === 'done') {

                                } else if (res.status === 'noAction') {
                                    // nothing will be happened
                                }
                            });
                        } else if (result.status === 'updated') {
                            ReactionsSummaries.decrement({ itemId: selectedReaction.itemId, reactionType: result.oldData.reactions[0].reactionType }, (err, res) => {
                                if (err) {
                                    this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '5002', message: 'error while updating the data, '+ err });
                                    return console.error(err);
                                }
                            });

                            let incrementOptions = { reactionType: selectedReaction.reactionType, itemId: selectedReaction.itemId, userId }
                            ReactionsSummaries.increment(incrementOptions, (err, res) => {
                                this._checkPendingRequest();

                                if (err) {
                                    this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '5002', message: 'error while updating the data, '+ err });
                                    return console.error(err)
                                }
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
                        let groupName = ReactionsTypes.itemsReactionsGroupName[this._itemId];
                        this.onUpdate({ status: 'add', reactionType: selectedReaction.reactionType, itemId: this.itemId, userId, itemType: this.itemType, name: groupName })
                    }
                });
            }
        }

        _toggleReaction(options) {
            let { icon, userReactUUID, userId, selectedReaction, fromQueue } = options;

            let itemId = selectedReaction.itemId
            this._renderReactionIconsBox({ fromQueue, newIcon: icon, oldIcon: this.container.querySelector(`[bf-reaction-type="${userReactUUID}"]`) });

            if (this.hasPendingRequest) {
                this.nextRequest = { type: 'update', options }
            } else {
                this.hasPendingRequest = true;
                let reactOptions = { itemId, userId, reactionType: selectedReaction.reactionType, reactionId: selectedReaction.reactionId, allowMultipleReactions: this.allowMultipleReactions }
                Reactions.unReactReact(reactOptions, (error, result) => {
                    if (error) {
                        this._renderReactionIconsBox({ oldIcon: icon, newIcon: this.container.querySelector(`[bf-reaction-type="${userReactUUID}"]`) });
                        this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '5002', message: 'error while updating the data, '+ error });
                        return console.error('Error while updated the Reaction: ' + error)
                    } else if (result) {
                        // reaction updated successfully
                        if (result.status === 'updated') {
                            // decrement for the old type and increment the new one
                            ReactionsSummaries.decrement({ itemId, reactionType: userReactUUID }, (err, res) => {
                                this._checkPendingRequest();
                                if (err) {
                                    this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '5002', message: 'error while updating the data, '+ err });
                                    return console.error(err)
                                }
                            });
                            ReactionsSummaries.increment({ itemId, reactionType: selectedReaction.reactionType, userId }, (err, res) => {
                                this._checkPendingRequest();
                                if (err) {
                                    this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '5002', message: 'error while updating the data, '+ err });
                                    return console.error(err)
                                }
                            });
                        } else if (result.status === 'added') {
                            this.container.setAttribute('bf-user_react-id', result.data.id);
                            ReactionsSummaries.increment({ itemId, reactionType: selectedReaction.reactionType, userId }, (err, res) => {
                                this._checkPendingRequest();
                                if (err) {
                                    this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '5002', message: 'error while updating the data, '+ err });
                                    return console.error(err)
                                }
                            });
                            // nothing will be happened
                        } else if (result.status === 'noAction') {
                            this._checkPendingRequest();
                            // nothing will be happened
                        }
                        let groupName = ReactionsTypes.itemsReactionsGroupName[this._itemId];
                        this.onUpdate({ status: 'update', reactionType: selectedReaction.reactionType, itemId:this.itemId, userId, itemType: this.itemType, name: groupName });
                    }
                })
            }
        }

        _deselectReaction(options) {
            let { icon, userReactUUID, userId, selectedReaction, fromQueue } = options;

            let reactionId = selectedReaction.reactionId;
            let itemId = selectedReaction.itemId;
            let reactionType = userReactUUID;

            let reactOptions = { itemId, userId, reactionId, reactionType, allowMultipleReactions: this.allowMultipleReactions }

            this._renderReactionIconsBox({ oldIcon: icon, fromQueue });

            if (this.hasPendingRequest) {
                this.nextRequest = { type: 'delete', options }
            } else {
                this.hasPendingRequest = true;
                Reactions.unReact(reactOptions, (error, result) => {
                    if (error) {
                        this._renderReactionIconsBox({ newIcon: icon });
                        this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '5003', message: 'error while deleting the data, ' + error });
                        return console.error('Error while deleting the Reaction: ' + error)
                    } else if (result) {
                        if (result.status === 'deleted') {
                            this.container.setAttribute('bf-user_react-id', '');
                            /* Reaction deleted successfully */
                            ReactionsSummaries.decrement({ itemId, reactionType }, (err, res) => {
                                this._checkPendingRequest();
                                if (err) {
                                    this.onError({ itemType: this.itemType, itemId: this.itemId, errorCode: '5002', message: 'error while updating the data, ' + err });
                                    return console.error(err)
                                }
                            });
                        } else if (result.status === 'noAction') {
                            this._checkPendingRequest();
                            // nothing will be happened
                        }
                        let groupName = ReactionsTypes.itemsReactionsGroupName[this._itemId];
                        this.onUpdate({ status: 'delete', reactionType, itemId:this.itemId, userId, itemType: this.itemType, name: groupName });
                    }
                });
            }
        }

        _checkPendingRequest() {
            this.hasPendingRequest = false;
            if (this.nextRequest) {
                switch (this.nextRequest.type) {
                    case 'add':
                        this._addReaction({ ...this.nextRequest.options, fromQueue: true })
                        break;
                    case 'update':
                        this._toggleReaction({ ...this.nextRequest.options, fromQueue: true })
                        break;
                    case 'delete':
                        this._deselectReaction({ ...this.nextRequest.options, fromQueue: true })
                        break;
                }
            }
            this.nextRequest = {};
        }

        _renderReactionIconsBox(options) {
            let { newIcon, oldIcon, fromQueue } = options;

            this._hideReactionIcons();

            if (!fromQueue) {
                let mainButton = this.container.querySelector('[bf-reactions-btn]');

                if (oldIcon) {
                    oldIcon.classList.remove('reacted');
                    this.container.setAttribute('bf-user_react-type', '');
                    this.container.setAttribute('bf-user_react-id', '');

                    let userIcon = this.container.querySelector(`[bf-reaction-image-id="${oldIcon.getAttribute('bf-reaction-type')}"]`);
                    let oldIconCount = parseInt(userIcon.getAttribute("bf-reaction-image-count"));
                    userIcon.setAttribute("bf-reaction-image-count", oldIconCount - 1);
                    if (userIcon.classList.contains('reactions-hidden') && oldIconCount >= 2) {
                        userIcon.classList.remove('reactions-hidden');
                    }
                }

                if (newIcon) {
                    newIcon.classList.add('reacted');
                    this.container.setAttribute('bf-user_react-type', newIcon.getAttribute('bf-reaction-type'));
                    mainButton.src = newIcon.getAttribute('bf-reactions-reacted-url');
                    mainButton.classList.add('reactions-show-main-icon');
                    setTimeout(() => {
                        mainButton.classList.remove('reactions-show-main-icon');
                    }, 300)

                    let userIcon = this.container.querySelector(`[bf-reaction-image-id="${newIcon.getAttribute('bf-reaction-type')}"]`);
                    if (!userIcon.classList.contains('reactions-hidden')) {
                        userIcon.classList.add('reactions-hidden');
                    }

                    let oldIconCount = parseInt(userIcon.getAttribute("bf-reaction-image-count"));
                    userIcon.setAttribute("bf-reaction-image-count", oldIconCount + 1);
                }

                let reactionsCountContainer = this.container.querySelector('[bf-reactions-total-count]');
                if (newIcon && !oldIcon && reactionsCountContainer) {
                    let reactionsCount = reactionsCountContainer.getAttribute('bf-reactions-total-count');
                    let newCount = parseInt(reactionsCount) + 1;
                    newCount = newCount >= 0 ? newCount : 0
                    reactionsCountContainer.setAttribute('bf-reactions-total-count', newCount);
                    reactionsCountContainer.innerHTML = State.correctCountNumbers(newCount);
                }

                if (!newIcon && oldIcon) {
                    let reactionsCount = reactionsCountContainer.getAttribute('bf-reactions-total-count');
                    let newCount = parseInt(reactionsCount) - 1;
                    newCount = newCount >= 0 ? newCount : 0
                    reactionsCountContainer.setAttribute('bf-reactions-total-count', newCount);
                    reactionsCountContainer.innerHTML = State.correctCountNumbers(newCount);

                    mainButton.src = this.reactionsArr[0].unSelectedUrl;
                    mainButton.classList.add('reactions-show-main-icon');
                    setTimeout(() => {
                        mainButton.classList.remove('reactions-show-main-icon');
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

        _showUsersList() {
            let listItems = [];
            buildfire.spinner.show();

            let _setUsersList = (reactions, index, callBack) => {
                let reaction = reactions[index];

                let reactionObject = this.reactionsArr.find(itemReaction => itemReaction.id === reaction.data.reactions[0].reactionType);
                if (reactionObject) {
                    let url = reactionObject.selectedUrl;

                    buildfire.auth.getUserProfile({ userId: reaction.data.userId }, (err, user) => {
                        if (err) return console.error(err);
                        if (!user) user = { // handle deleted user
                            displayName: 'User',
                            imageUrl: 'https://app.buildfire.com/app/media/avatar.png'
                        };
                        let userName = user.displayName ? user.displayName : user.firstName ? user.firstName : 'User';
                        let userImage = user.imageUrl ? user.imageUrl : 'https://app.buildfire.com/app/media/avatar.png';
                        userImage = buildfire.imageLib.resizeImage(userImage, { size: "xs", aspect: "1:1" });

                        // create user list item
                        const listItem = document.createElement('div');
                        // Create the main div
                        const div = document.createElement('div');
                        div.style = 'display:flex; gap:1rem; align-items:center';

                        // Create the user image
                        const img = document.createElement('img');
                        img.style = "border-radius:100%; width:42px; height:42px; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-user-select: none;";
                        img.alt = 'user image';
                        img.src = userImage;
                        div.appendChild(img);

                        // Create the user name paragraph
                        const p = document.createElement('p');
                        p.style = "overflow:auto; max-width: 75%; margin:0 !important;";
                        p.textContent = userName;
                        div.appendChild(p);

                        // Create the span with the reaction icon
                        const span = document.createElement('span');
                        span.style = "position: absolute;bottom: 0;left: 2.6rem;width: 2rem;height: 2rem;display: flex;align-items: center;justify-content: center; margin-left:0 !important;";

                        // Create the reaction icon within the span
                        const imgIcon = document.createElement('img');
                        imgIcon.style = "width: 2rem;height: 2rem; border-radius:100%;" ;
                        imgIcon.src = url;
                        span.appendChild(imgIcon);
                        div.appendChild(span);

                        listItem.appendChild(div);

                        listItems.push({
                            text: listItem.innerHTML
                        })
                        if (index == reactions.length - 1) {
                            this._openDrawer(listItems);
                        } else {
                            callBack(reactions, index + 1, _setUsersList)
                        }
                    });
                } else if (index == reactions.length - 1) {
                    this._openDrawer(listItems);
                }
            }

            let options = { itemId: this._itemId, groupName: this.groupName, pageIndex: 0, pageSize: State.userListPageSize }, totalUsersReactions = [];
            Reactions.get(options, (error, res) => {
                if (error) { }
                else if (res.result.length) {
                    totalUsersReactions = res.result;

                    let promiseArr = [], totalRecords = res.totalRecord;
                    let requestNumber = Math.ceil(((Math.min(totalRecords, State.userListLimit) - State.userListPageSize) / State.userListPageSize));
                    for (let i = 0; i < requestNumber; i++) {
                        promiseArr[i] = new Promise((resolve, reject) => {
                            Reactions.get({ ...options, pageIndex: i + 1 }, (error, res) => {
                                if (res.result.length) {
                                    totalUsersReactions = [...totalUsersReactions, ...res.result];
                                }
                                resolve(true);
                            })
                        })
                    }

                    if (promiseArr.length >= 1) {
                        Promise.all(promiseArr).then(() => {
                            _setUsersList(totalUsersReactions, 0, _setUsersList);
                        });
                    } else {
                        _setUsersList(totalUsersReactions, 0, _setUsersList);
                    }
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

        static getReactionGroups(callback) {
            if (ReactionsTypes.groups) {
                return callback(null, ReactionsTypes.groups);
            } else {
                ReactionsTypes.getReactionsGroups({}, (err, res) => {
                    if (err) return callback(err);

                    return callback(null, res);
                })
            }
        }

        _getReactionTypes(options, callback) {
            let { groupName, itemId } = options;
            ReactionsTypes.getReactionsTypes({ groupName, itemId }, (error, res) => {
                if (error) return callback(error);

                return callback(null, res);
            });
        }

        onUpdate(event) { /* event = {itemType, itemId, groupName, status, reactionID, userId} */ }
        onError(event) { /* event = {itemType, itemId, errorCode, message} */ }

        static injectReactions(selector) {
            State.buildReactionElements(selector);
        }
    }

    return ReactionComponent
})();
