if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};
/**
 * we have to use two datastore (publicData) tags, one for comments and one for summary.
 * 
 */

/************************************************************ THE ITEM ID IS NOT THE COMMENT ID, IT IS THE POST ID *************************************************************/
/**
 * basic exposed API functions 
 * getComments(by itemId)
 * getSummary(by itemId)
 * getSummaries(itemIds[])
 * addComment(itemId, comment)
 * deleteComment(itemId, commentId)
 * updateComment(itemId, commentId, comment)
 * report
 * optional ---------------
 * getComment(itemId, commentId)
 */

/** 
 * comment structure
 * @typedef {Object} Comment
 * @property {string} createdBy - userId of the user who created the comment
 * @property {string} text - the comment text
 * @property {string} createdOn - ISO date string of when the comment was created
 * itemId
*/

/**
 * * summary structure
 * @typedef {Object} CommentsSummary
 * @property {string} itemId - ID of the item this summary is for
 * @property {Number} count  - Total number of comments for this item
 * lastUpdatedBy
 * lastUpdatedOn
 * lastCommenters, 10 last unique commenters -- nice to have but not required
 */
// TODO:
// add moment.js and load it dynamically, rename it's exposed API to bfMoment
// get name and img from => https://sdk.buildfire.com/docs/auth#getuserprofiles-
// DisplayName => First Name Last Name => “Someone”


// nice to have:
// component handles the comments element via a selector to display the icon + count (summary) 

buildfire.components.comments = (() => {

    class CommentsComponent {
        static get TAG() {
            return '$$comments';
        }

        constructor(data = {}) {

            console.log('CommentsComponent initialized with data:', data);
            // data = {itemIds}
            this.itemIds = data.itemIds || [];
            this._buildfire = data._buildfire || {};
            this.comments = [];
            this.summaries = [];
            this.commentsSummaries = new CommentsSummaries();
        }
        getComments(options, callback) {
            if (!options.itemId || !options.userId) {
                return callback(new Error('Invalid parameters'));
            }

            buildfire.publicData.search(
                {
                    filter: { '_buildfire.index.string1': `${options.itemId}-${options.userId}` },
                    sort: { createdOn: -1 },
                    skip: options.skip || 0,
                    limit: options.limit || 100
                },
                CommentsComponent.TAG,
                (err, result) => {
                    if (err) return callback(err);
                    this.comments = result || [];
                    callback(null, this.comments);
                }
            );
        }
        getComment(itemId, commentId, callback) {
            if (!itemId || !commentId) {
                return callback(new Error('Invalid itemId or commentId parameter'));
            }

            this.getComments(itemId, (err, comments) => {
                if (err) return callback(err);
                const comment = comments.find(c => c._id === commentId);
                callback(null, comment);
            });
        }
        addComment(options, callback) {
            if (!options) {
                return callback('Invalid options. Options must be set and have at least item ID and userId!');
            }
            if (typeof callback !== 'function') {
                return console.error('callback must be a function!');
            }
            if (!options.itemId) {
                return callback('Invalid options, Missing itemId!');
            }
            if (!options.userId) {
                return callback('Invalid options, Missing userId!');
            }

            const newComment = {
                _buildfire: {
                    index: {
                        string1: `${options.itemId}-${options.userId}`,
                    }
                },
                itemId: options.itemId,
                userId: options.userId,
                ...options.comment
            };

            buildfire.publicData.insert(
                newComment,
                CommentsComponent.TAG,
                (err, result) => {
                    if (err) return callback(err);
                    this.comments.push(result);
                    options.incrementValue = 1; // increment by 1
                    this._updateSummary(options, callback);
                }
            );
        }
        deleteComment(options, callback) {
            if (!options) {
                return callback(new Error('Invalid options parameter'));
            }
            if (!options.itemId || !options.commentId) {
                return callback(new Error('Invalid itemId or commentId parameter'));
            }

            buildfire.publicData.delete(options.commentId, CommentsComponent.TAG, (err, result) => {
                if (err) return callback(err);
                this.comments = this.comments.filter(c => c._id !== commentId);
                options.incrementValue = -1; // decrement by 1
                this._updateSummary(options, callback);
            });
        }
        updateComment(options, callback) {
            if (!itemId || !commentId || !comment) {
                return callback(new Error('Invalid itemId, commentId or comment parameter'));
            }

            const updatedComment = {
                _id: commentId,
                _buildfire: {
                    index: {
                        string1: `${options.itemId}-${options.userId}`
                    }
                },
                ...comment
            };

            buildfire.publicData.update(
                commentId,
                updatedComment,
                CommentsComponent.TAG,
                (err, result) => {
                    if (err) return callback(err);
                    const index = this.comments.findIndex(c => c._id === commentId);
                    if (index !== -1) this.comments[index] = result;
                    this._updateSummary(itemId, callback);
                }
            );
        }
        getSummaries(itemIds, callback) {
            if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
                return callback(new Error('Invalid itemIds parameter'));
            }

            CommentsSummaries.getSummaries(itemIds, (err, summaries) => {
                if (err) return callback(err);
                this.summaries = summaries.map(data => new CommentsSummary(data));
                callback(null, this.summaries);
            });
        }
        _updateSummary(options, callback) {
            if (!options) {
                return callback(new Error('Invalid itemId parameter'));
            }

            this.commentsSummaries._updateSummary(options, (err, result) => {
                if (err) return callback(err);
                callback(null, result);
            });
        }

        getSummary(options, callback) {
            if (!options.itemId) {
                return callback(new Error('Invalid itemId parameter'));
            }

            this.commentsSummaries._getSummary(options, (err, summary) => {
                if (err) return callback(err);
                callback(null, new CommentsSummary(summary.data));
            });
        }
    }

    class CommentsSummary {
        constructor(data = {}) {
            this.itemId = data.itemId || null;
            this._buildfire = data._buildfire || {}
            this.count = data.count || 0;
        }
    }

    class CommentsSummaries {
        static get TAG() {
            return '$$commentsSummary';
        }

        constructor() {
            this.summaries = [];
        }

        _create(options, callback) {
            if (!options || !options.itemId || !options.userId) {
                return callback(new Error('Invalid options parameter'));
            }

            const summary = {
                _buildfire: {
                    index: {
                        string1: `${options.itemId}-${options.userId}`
                    }
                },
                itemId: options.itemId,
                userId: options.userId,
                count: 1
            };

            buildfire.publicData.insert(
                summary,
                CommentsSummaries.TAG,
                (err, result) => {
                    if (err) return callback(err);
                    this.summaries.push(result);
                    callback(null, result);
                }
            );
        }

        _getSummaries(itemIds, callback) {
            if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
                return callback(new Error('Invalid itemIds parameter'));
            }

            const records = [];
            const getRecordsPage = (page) => {
                let inArray = itemIds.map(itemId => (`${itemId}-${userId}`))
                buildfire.publicData.search(
                    {
                        filter: { '_buildfire.index.string1': { $in: inArray } },
                        sort: [{ '_buildfire.index.string1': 1 }],
                        skip: page * 100,
                        limit: 100
                    },
                    CommentsSummaries.TAG,
                    (err, result) => {
                        if (err) return callback(err);
                        if (result && result.length > 0) {
                            records.push(...result);
                            getRecordsPage(page + 1);
                        } else {
                            this.summaries = records;
                            callback(null, records);
                        }
                    }
                );
            };
            getRecordsPage(0);
        }

        _updateSummary(options, callback) {
            this._getSummary(options, (err, result) => {
                if (err) return callback(err);
                if (!result || !result.data) {
                    this._create(options, callback);
                } else {
                    // buildfire.publicData.search({
                    //     filter: { '_buildfire.index.string1': `${options.itemId}-${options.userId}` },
                    //     sort: {},
                    //     limit: 1
                    // }, CommentsSummaries.TAG, (err, res) => {
                    //     debugger
                    // });
                    buildfire.publicData.searchAndUpdate(
                        { '_buildfire.index.string1': `${options.itemId}-${options.userId}` },
                        { $inc: { "count": options.incrementValue } }, // data to update
                        CommentsSummaries.TAG,
                        (err, result) => {
                            if (err) return callback(err);
                            callback(null, result);
                        }
                    );
                }
            });
        }

        _getSummary(options, callback) {
            if (!itemId) {
                return callback(new Error('Invalid itemId parameter'));
            }

            buildfire.publicData.search(
                { filter: { '_buildfire.index.string1': `${options.itemId}-${options.userId}` } },
                CommentsSummaries.TAG,
                (err, result) => {
                    if (err) return callback(err);
                    callback(null, result[0]);
                }
            );
        }
    }

    return CommentsComponent;
})();