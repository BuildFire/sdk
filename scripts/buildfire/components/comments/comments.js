if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};
/**
 * we have to use two datastore (publicData) tags, one for comments and one for summary.
 * 
 */

/************************************************************ THE ITEM ID IS NOT THE COMMENT ID, IT IS THE POST ID *************************************************************/

/**TODO:
 * placeholder for profile image
 * Discuss state 
 * check for components/services used if the user included them or not, if not throw an error
 * remember to add support for messages like the header "Comments", look at list view for translations 
 * in SDK docs, mention that the body should not be scrollable, also mention that the component has z-index of 100.
 * add moment.js and load it dynamically, rename it's exposed API to bfMoment
 */

/**
 * basic exposed API functions 
 * openComments(itemId, userId)
 * getComments(by itemId) -- done
 * getSummary(by itemId) -- done
 * getSummaries(itemIds[]) -- done
 * addComment(itemId, comment) -- done
 * deleteComment(itemId, commentId) -- done
 * updateComment(itemId, commentId, comment)
 * reportAbuse
 * getComment(itemId, commentId) -- done
 */

/** 
 * comment structure
 * @typedef {Object} Comment
 * @property {string} userId - userId of the user who created the comment
 * @property {string} text - the comment text
 * @property {string} createdOn - ISO date string of when the comment was created
 * @property {string} itemId - ID of the item this comment is for
 * @property {string} lastUpdatedOn - ISO date string of when the comment was last updated
 * 
 * 
 * got from buildfire.auth.getUserProfiles
 * profileImage 
 * username
*/

/**
 * * summary structure
 * @typedef {Object} CommentsSummary
 * @property {string} itemId - ID of the item this summary is for
 * @property {Number} count  - Total number of comments for this item
 * @property {string} lastUpdatedBy - userId of the user who last updated the summary
 * @property {string} lastUpdatedOn - ISO date string of when the summary was last updated
 * @property {string} createdOn - ISO date string of when the summary was created
 * 
 * 
 * lastCommenters, 10 last unique commenters -- nice to have but not required
 */

/**
 * * @typedef {Object} translations
 * @property {string} commentsHeader - Header for the comments drawer
 * @property {string} noComments - Message to show when there are no comments
 * TODO: add more translations as needed
 
*/

// nice to have:
// component handles the comments element via a selector to display the icon + count (summary) 
buildfire.components.comments = {};
buildfire.components.comments = (() => {

    class CommentsComponent {
        static get TAG() {
            return '$$comments';
        }

        constructor(data = {}) {
            // init
            this.keyboardShown = false;
            this.drawerOpened = false;
            this.commentsSummaries = new CommentsSummaries();
            buildfire.services.reportAbuse.triggerWidgetReadyForAdminResponse();

            // abuse reporting
            buildfire.services.reportAbuse.onAdminResponse((event) => {
                console.log("onAdminResponse ", event);
                buildfire.services.reportAbuse.triggerOnAdminResponseHandled({
                    reportId: event.report.id,
                });
            });

            // keyboard events
            buildfire.device.onKeyboardShow((data) => {
                this.keyboardShown = true;
                if (this.drawerOpened) {
                    buildfire.components.swipeableDrawer.setStep('max');
                }
            });
            buildfire.device.onKeyboardHide(() => {
                this.keyboardShown = false;
            });

        }

        openCommentsDrawer(options = {}, callback) {
            if (!options.itemId) {
                return callback ? callback('Invalid options, Missing itemId!') : console.error('Invalid options, Missing itemId!');
            }
            if (!options.userId) {
                return callback ? callback('Invalid options, Missing userId!') : console.error('Invalid options, Missing userId!');
            }

            this.getSummary({ itemId: options.itemId }, (err, summary) => {
                this.getComments(options, (err, comments) => {

                    let commentHTML = '';
                    if (comments && comments.length > 0) {
                        commentHTML = comments.map(comment => {
                            return `<div class="comment-item">
                                        <div class="comment-user">
                                            <img style="width: 50px; height: 50px; border-radius: 50%;" src="${comment.data.profileImage}" alt="${comment.data.username || 'User'}" class="comment-user-image">
                                            <span class="comment-username">${comment.data.username || 'User'}</span>
                                        </div>
                                        <div class="comment-text">${comment.data.text || ''}</div>
                                        <div class="comment-actions">
                                            <!-- <span class="comment-date">moment(${comment.data.createdOn}).fromNow()</span> -->
                                        </div>
                                    </div>`;
                        }).join('');
                        commentHTML += `<div id="add-comment" style="position:fixed; bottom: 0; width: 100%; padding: 10px; background: #f9f9f9;">
                                            <textarea id="newCommentText" placeholder="Add a comment..."></textarea>
                                            <button id="addCommentBtn">Add Comment</button>
                                        </div>`;
                    } else {
                        commentHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
                    }
                    buildfire.components.swipeableDrawer.initialize({
                        startingStep: 'mid',
                        header: `Comments ${summary.count ? `(${summary.count})` : ''}`,
                        mode: 'steps',
                        content: commentHTML,
                        transitionDuration: 125,
                    }, (err, res) => {
                        this.drawerOpened = true;
                        buildfire.components.swipeableDrawer.show();
                        buildfire.components.swipeableDrawer.onStepChange = (step) => {
                            if (this.keyboardShown && step !== 'max') {
                                buildfire.components.swipeableDrawer.setStep('max');
                            } else {
                                if (step === 'min') {
                                    buildfire.components.swipeableDrawer.hide();
                                    this._destroy();
                                }

                            }
                        };

                    })
                });
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
                        string1: options.itemId,
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
                    options.incrementValue = 1; // increment by 1
                    this._updateSummary(options, callback);
                }
            );
        }

        // TODO: 
        updateComment(options, callback) {
            if (!itemId || !commentId || !comment) {
                return callback('Invalid itemId, commentId or comment parameter');
            }

            const updatedComment = {
                _id: commentId,
                _buildfire: {
                    index: {
                        string1: options.itemId
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
                    this._updateSummary(itemId, callback);
                }
            );
        }

        deleteComment(options, callback) {
            if (!options) {
                return callback('Invalid options parameter');
            }
            if (!options.itemId || !options.commentId) {
                return callback('Invalid itemId or commentId parameter');
            }

            this._getComment(options, (err, comment) => {
                if (err) return callback(err);
                if (comment) {
                    if (comment.data.itemId !== options.itemId) {
                        return callback('Comment does not belong to this item');
                    }
                    if (comment.data.userId !== options.userId) {
                        return callback('You are not authorized to delete this comment');
                    }
                    buildfire.publicData.delete(options.commentId, CommentsComponent.TAG, (err, result) => {
                        if (err) return callback(err);
                        options.incrementValue = -1; // decrement by 1
                        this._updateSummary(options, callback);
                    });

                } else {
                    return callback('Comment not found');
                }
            });

        }

        getComments(options, callback) {
            if (!options.itemId || !options.userId) {
                return callback('Invalid parameters');
            }

            buildfire.publicData.search(
                {
                    filter: { '_buildfire.index.string1': options.itemId },
                    sort: { createdOn: -1 },
                    skip: options.skip || 0,
                    limit: options.limit || 50
                },
                CommentsComponent.TAG,
                (err, result) => {
                    if (err) return callback(err);
                    const comments = result || [];

                    // Get User Profiles for each comment
                    const chunkSize = 50; // maximum number of userIds to fetch at once
                    let userIds = comments.map(c => c.data.userId);
                    userIds = [...new Set(userIds)]; // remove duplicates
                    let userDataPromises = [];
                    const loadUsersData = (userIds) => {
                        return new Promise((resolve, reject) => {
                            buildfire.auth.getUserProfiles({ userIds }, (err, users) => {
                                if (err) {
                                    console.error(err);
                                    return reject(err);
                                }
                                for (let i = 0; i < comments.length; i++) {
                                    const comment = comments[i];
                                    const user = users.find(u => u.userId == comment.data.userId);
                                    if (user) {
                                        comment.data.profileImage = user.imageUrl;
                                        comment.data.username = this._getUsername(user);
                                    }
                                    comments[i] = comment;
                                }
                                resolve(true);
                            });
                        });

                    }
                    for (let i = 0; i < userIds.length; i += chunkSize) {
                        const chunk = userIds.slice(i, i + chunkSize);
                        userDataPromises.push(loadUsersData(chunk));
                    }
                    Promise.all(userDataPromises).then(() => callback(null, comments)).catch(err => callback(err));
                }
            );
        }

        getSummaries(options, callback) {
            if (!options.itemIds || !Array.isArray(options.itemIds) || options.itemIds.length === 0) {
                return callback('Invalid itemIds parameter');
            }

            if (!options.userId) {
                return callback('Invalid userId parameter');
            }

            this.commentsSummaries._getSummaries(options, (err, results) => {
                if (err) return callback(err);
                const summaries = results.map(summary => new CommentsSummary(summary.data));
                callback(null, summaries);
            });
        }

        getSummary(options, callback) {
            if (!options.itemId) {
                return callback('Invalid itemId parameter');
            }

            this.commentsSummaries._getSummary(options, (err, summary) => {
                if (err) return callback(err);
                callback(null, new CommentsSummary(summary?.data ? summary.data : { itemId: options.itemId }));
            });
        }

        reportAbuse(options, callback) {
            if (!options || !options.commentId || !options.userId) {
                return callback('Invalid options parameter');
            }

            buildfire.services.reportAbuse.report(
                {
                    itemId: options.commentId,
                    reportedUserId: 'USER_ID',
                    deeplink: {
                        itemId: '12345',
                    },
                    itemType: "Post",
                },
                callback
            );
        }

        /** Utilities */
        _updateSummary(options, callback) {
            if (!options) {
                return callback('Invalid itemId parameter');
            }

            this.commentsSummaries._updateSummary(options, (err, result) => {
                if (err) return callback(err);
                callback(null, result);
            });
        }

        _getComment(options, callback) {
            buildfire.publicData.getById(
                options.commentId,
                CommentsComponent.TAG,
                callback
            )
        }

        _getUsername(user) {
            let username = 'someone';
            if (user.firstName) {
                username = user.firstName;
                if (user.lastName) {
                    username += ` ${user.lastName}`;
                }
            }
            return username;
        }

        _destroy() {
            this.drawerOpened = false;
            this.keyboardShown = false;
        }
    }

    class CommentsSummaries {
        static get TAG() {
            return '$$commentsSummary';
        }

        constructor() { }

        _create(options, callback) {
            if (!options || !options.itemId || !options.userId) {
                return callback('Invalid options parameter');
            }

            const summary = {
                _buildfire: {
                    index: {
                        string1: options.itemId
                    }
                },
                itemId: options.itemId,
                userId: options.userId,
                lastUpdatedBy: options.userId,
                lastUpdatedOn: new Date().toISOString(),
                createdOn: new Date().toISOString(),
                count: 1
            };

            buildfire.publicData.insert(
                summary,
                CommentsSummaries.TAG,
                (err, result) => {
                    if (err) return callback(err);
                    callback(null, result);
                }
            );
        }

        _getSummary(options, callback) {
            if (!itemId) {
                return callback('Invalid itemId parameter');
            }

            buildfire.publicData.search(
                { filter: { '_buildfire.index.string1': options.itemId } },
                CommentsSummaries.TAG,
                (err, result) => {
                    if (err) return callback(err);
                    callback(null, result[0]);
                }
            );
        }

        _getSummaries(options, callback) {
            if (!options.itemIds || !Array.isArray(options.itemIds) || options.itemIds.length === 0) {
                return callback('Invalid itemIds parameter');
            }

            const records = [];
            const getRecordsPage = (page) => {
                let inArray = options.itemIds.map(itemId => (itemId))
                buildfire.publicData.search(
                    {
                        filter: { '_buildfire.index.string1': { $in: inArray } },
                        sort: { createdOn: -1 },
                        skip: page,
                        limit: 50
                    },
                    CommentsSummaries.TAG,
                    (err, result) => {
                        if (err) return callback(err);
                        if (result && result.length > 0) {
                            records.push(...result);
                            getRecordsPage(page + 50);
                        } else {
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
                    buildfire.publicData.searchAndUpdate(
                        { '_buildfire.index.string1': options.itemId },
                        {
                            $inc: { "count": options.incrementValue },
                            $set: { lastUpdatedBy: options.userId, lastUpdatedOn: new Date().toISOString() }
                        },
                        CommentsSummaries.TAG,
                        (err, result) => {
                            if (err) return callback(err);
                            callback(null, result);
                        }
                    );
                }
            });
        }
    }

    /** Utilities */

    class CommentsSummary {
        constructor(data = {}) {
            this.itemId = data.itemId || null;
            this._buildfire = data._buildfire || {}
            this.count = data.count || 0;
            this.lastUpdatedBy = data.lastUpdatedBy || null;
            this.lastUpdatedOn = data.lastUpdatedOn || new Date().toISOString();
            this.createdOn = data.createdOn || new Date().toISOString();
        }
    }

    return CommentsComponent;
})();