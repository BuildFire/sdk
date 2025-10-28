if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};

if (typeof buildfire.components.swipeableDrawer == 'undefined') {
    throw 'please add swipeableDrawer component first to use comments component';
}

if (typeof buildfire.components.listView == 'undefined') {
    throw 'please add listView component first to use comments component';
}

if (typeof buildfire.services == 'undefined' || typeof buildfire.services.reportAbuse == 'undefined') {
    throw 'please add reportAbuse service first to use comments component';
}

/** 
 * comment structure
 * @typedef {Object} Comment
 * @property {string} userId - userId of the user who created the comment
 * @property {string} text - the comment text
 * @property {string} createdOn - date object of when the comment was created
 * @property {string} itemId - ID of the item this comment is for
 * @property {string} lastUpdatedOn - date object of when the comment was last updated
 * @property {string} commentId - unique ID of the comment, generated as itemId + userId + timestamp
 * @property {Object} _buildfire - buildfire metadata
 * got from buildfire.auth.getUserProfiles
 * profileImage 
 * username
*/

/**
 * summary structure
 * @typedef {Object} CommentsSummary
 * @property {string} itemId - ID of the item this summary is for
 * @property {Number} count  - Total number of comments for this item
 * @property {string} lastUpdatedBy - userId of the user who last updated the summary
 * @property {string} lastUpdatedOn - date object of when the summary was last updated
 * @property {string} createdOn - date object of when the summary was created
 * @property {Object} _buildfire - buildfire metadata
 */

/**
 * @typedef {Object} translations
 * @property {string} you - Text to show for the current user
 * @property {string} someone - Text to show for other users
 * @property {string} commentsHeader - Header for the comments drawer
 * @property {string} emptyStateTitle - Message title to show when there are no comments
 * @property {string} emptyStateMessage - Message to show when there are no comments
 * @property {string} addCommentPlaceholder - Placeholder for the comment input field
 * @property {string} readMore - Text for the read more link in the list view
 * @property {string} readLess - Text for the read less link in the list view
 * @property {string} report - Text for the report action in the list view
 * @property {string} delete - Text for the delete action in the list view
 * @property {string} commentReported - Success message for reporting a comment
 * @property {string} commentDeleted - Success message for deleting a comment
 * @property {string} commentAdded - Success message for adding a comment
 * @property {string} loginRequired - Message to show when the user is not logged in and tries to add a comment
 * TODO: add more translations as needed
 
*/

/**
 * nice to have:
 * component handles the comments element via a selector to display the icon + count (summary)
 * events for when a comment is added, deleted, updated, reported
 * lastCommenters in summary, 10 last unique commenters -- nice to have but not required
 */

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
                    string1: options.itemId,
                    date1: new Date(), // created on
                }
            },
            itemId: options.itemId,
            userId: options.userId,
            lastUpdatedBy: options.userId,
            lastUpdatedOn: new Date(),
            createdOn: new Date(),
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
        if (!options.itemId) {
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

            buildfire.publicData.search(
                {
                    filter: { '_buildfire.index.string1': { $in: options.itemIds } },
                    sort: { '_buildfire.index.date1': -1 },
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
                const updatedOn = new Date();
                buildfire.publicData.searchAndUpdate(
                    { '_buildfire.index.string1': options.itemId },
                    {
                        $inc: { "count": options.incrementValue },
                        $set: { lastUpdatedBy: options.userId, lastUpdatedOn: updatedOn, '_buildfire.index.date1': updatedOn }
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

    _deleteSummary(options, callback) {
        this._getSummary(options, (err, result) => {
            if (err) return callback(err);
            if (!result || !result.data) {
                return callback('Summary not found', null);
            } else {
                buildfire.publicData.delete(
                    result.id,
                    CommentsSummaries.TAG,
                    (err, result) => {
                        if (err) return callback(err);
                        callback(null);
                    }
                );
            }
        });
    }

}

class CommentsSummary {
    constructor(data = {}) {
        this.itemId = data.itemId || null;
        this._buildfire = data._buildfire || {}
        this.count = data.count || 0;
        this.lastUpdatedBy = data.lastUpdatedBy || null;
        this.lastUpdatedOn = new Date(data.lastUpdatedOn) || new Date();
        this.createdOn = new Date(data.createdOn) || new Date();
    }
}

buildfire.components.comments = {
    commentsSummaries: new CommentsSummaries(),
    get TAG() {
        return '$$comments';
    },

    _initialize() {
        this.keyboardShown = false;
        this.drawerOpened = false;
        this.comments = [];

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

        // auth state change
        buildfire.auth.onLogout(() => {
            if (this.listView) {
                this.listView.reset();
            }
            this.user = null;
            if (this.drawerOpened) {
                this._resetDrawer();
            }
        });

        buildfire.auth.onLogin((user) => {
            this.user = user;
            if (this.drawerOpened) {
                if (this.addingCommentInProgress) {
                    this._addingCommentDone = () => {
                        this._resetDrawer();
                        this._addingCommentDone = null; // reset the function to avoid multiple calls
                    }
                } else {
                    this._resetDrawer();
                }
            }
        });
    },

    open(options = {}, callback) {

        buildfire.lazyLoadScript(
            { relativeScriptsUrl: 'moment.min.js', scriptId: 'bfMomentSDK' }, () => {
                this.originalWidth = window.innerWidth;
                window.addEventListener('resize', this._onResize.bind(this), false);
                this._openCommentsDrawer(options, callback);
            }
        )
    },

    getSummaries(options, callback) {
        if (!options.itemIds || !Array.isArray(options.itemIds) || options.itemIds.length === 0) {
            return callback('Invalid itemIds parameter');
        }

        this.commentsSummaries._getSummaries(options, (err, results) => {
            if (err) return callback(err);
            const summaries = results.map(summary => new CommentsSummary(summary.data));
            callback(null, summaries);
        });
    },

    /**         
     * Get comments for a specific item
     * @param {Object} options - Options object
     * @param {string} options.itemId - ID of the item to get comments for
     * @param {number} [options.skip=0] - Number of comments to skip
     * @param {number} [options.limit=50] - Maximum number of comments to return
     * @param {object} options.filter - Filter object containing an array of comment IDs to filter by
     * @param {function} callback - Callback function to handle the result
     * @returns {void}
     */

    getComments(options, callback) {
        if (!options.itemId) {
            return callback('Invalid item ID');
        }

        this._getComments(
            options,
            (err, result) => {
                if (err) return callback(err);
                const comments = result || [];
                // Get User Profiles for each comment
                const chunkSize = 50;
                let userIds = comments.map(c => c.data.userId);
                userIds = [...new Set(userIds)];
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
                                    comment.data.profileImage = user.imageUrl || 'https://app.buildfire.com/app/media/avatar.png';
                                    comment.data.username = this._getNameOfUser({ user: user, isOwner: comment.data.userId == this.user?.userId });
                                } else {
                                    // deleted user or user not found
                                    comment.data.profileImage = 'https://app.buildfire.com/app/media/avatar.png'; // default avatar
                                    comment.data.username = this._getNameOfUser(null); // "Someone"
                                }
                                if (typeof bfMomentSDK !== 'undefined') comment.data.displayDate = bfMomentSDK(comment.data.createdOn).fromNow();
                                comment.data.text = this._processComment(comment.data.text);
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
    },

    _getComments(options, callback) {
        let filter = {
            '_buildfire.index.string1': options.itemId
        };
        if (options.filter && options.filter.commentIds && Array.isArray(options.filter.commentIds)) {
            filter = {
                "$json.commentId": { $in: options.filter.commentIds },
                ...filter,
            }
        }
        buildfire.publicData.search(
            {
                filter: filter,
                sort: { '_buildfire.index.date1': -1 },
                skip: options.skip || 0,
                limit: options.limit || 50
            },
            this.TAG,
            callback
        );
    },

    _getAllComments(options, callback) {
        const limit = 40;
        let allComments = [];
        const fetchComments = (pageIndex) => {
            this._getComments({ ...options, limit: limit, skip: pageIndex * limit }, (err, comments) => {
                if (err) return callback(err);
                if (comments && comments.length > 0) {
                    allComments = allComments.concat(comments);
                    pageIndex += 1;
                    fetchComments(pageIndex);
                } else {
                    callback(null, allComments);
                }
            });
        };
        fetchComments(0);
    },

    /**
     * Delete a comment
     * @param {Object} options - Options object
     * @param {string} options.itemId - ID of the item the comment belongs to
     * @param {string} options.commentId - ID of the comment to delete
     * @param {function} callback - Callback function to handle the result
     * @returns {void}
     */
    deleteComment(options, callback) {
        if (!options) {
            return callback('Invalid options parameter');
        }
        if (!options.itemId) {
            return callback('Invalid itemId');
        }
        if (!options.commentId) {
            return callback('Invalid commentId');
        }
        options.limit = 1;
        options.filter = { commentIds: [options.commentId] };
        this.getComments(options, (err, comments) => {
            if (err) return callback(err);
            if (comments && comments[0] && comments[0].data) {
                if (comments[0].data.itemId !== options.itemId) {
                    return callback('Comment does not belong to this item');
                }
                buildfire.publicData.delete(comments[0].id, this.TAG, (err, result) => {
                    if (err) return callback(err);
                    options.incrementValue = -1; // decrement by 1
                    this._updateSummary(options, callback);
                });
            } else {
                return callback('Comment not found');
            }
        });

    },

    close(callback) {
        if (this.drawerOpened) {
            buildfire.components.swipeableDrawer.hide();
            this._destroy();
            callback && callback(null);
        } else {
            callback && callback('Drawer is not opened');
        }
    },

    deleteSummary(options, callback) {
        if (!options || !options.itemId) {
            return callback('Invalid options, Missing itemId!');
        }
        if (options.deleteComments) {
            this._getAllComments({ itemId: options.itemId }, (err, comments) => {
                if (err) return callback(err);
                if (comments && comments.length > 0) {
                    // If there are comments, we need to delete them first
                    const commentIds = comments.map(comment => comment.id);
                    buildfire.publicData.bulkDelete(
                        commentIds,
                        this.TAG,
                        (err, result) => {
                            if (err) return callback(err);
                            this.commentsSummaries._deleteSummary(options, callback);
                        }
                    );
                } else {
                    this.commentsSummaries._deleteSummary(options, callback);
                }
            });
        } else {
            this._getComments({ itemId: options.itemId }, (err, comments) => {
                if (err) return callback(err);

                if (comments && comments.length > 0) {
                    return callback('Cannot delete summary, there are existing comments for this item.');
                } else {
                    this.commentsSummaries._deleteSummary(options, callback);
                }
            });
        }
    },

    onClose() { },
    onAdd() { },
    onDelete() { },

    _openCommentsDrawer(options = {}, callback) {
        if (!options.itemId) {
            return callback ? callback('Invalid options, Missing itemId!') : console.error('Invalid options, Missing itemId!');
        }
        this.options = options;
        buildfire.auth.getCurrentUser((err, user) => {
            this.user = user;
            this._getSummary({ itemId: this.options.itemId }, (err, summary) => {
                this.summary = summary;
                this._initializeDrawer((err, res) => {
                    this._configureAddCommentSection();

                    this._initializeListView(() => {
                        buildfire.components.swipeableDrawer.show();
                        callback && callback(null);
                        this.drawerOpened = true;
                    });
                })
            });
        })
    },

    /**         
     *  Add a new comment
     * @param {Object} options - Options object
     * @param {string} options.itemId - ID of the item to add the comment to
     * @param {Object} options.comment - Comment object containing the comment text and other properties
     * @param {function} callback - Callback function to handle the result
     * @returns {void}
     */

    _addComment(options, callback) {
        if (!options) {
            return callback('Invalid options');
        }
        if (typeof callback !== 'function') {
            return console.error('callback must be a function');
        }
        if (!options.itemId) {
            return callback('Invalid options, Missing itemId');
        }

        const createdOn = new Date();
        let comment = {
            itemId: options.itemId,
            text: options.commentText,
            createdOn: createdOn,
            lastUpdatedOn: createdOn,
            _buildfire: {
                index: {
                    string1: options.itemId,
                    date1: createdOn,
                }
            },
        };
        let commentToDisplay;
        if (!options.userId) {
            buildfire.auth.login({}, (err, user) => {
                if (err || !user) {
                    buildfire.dialog.toast({
                        message: this.options.translations?.loginRequired || 'You must be logged in to add a comment.',
                        type: 'danger',
                    })
                    return callback(err || 'User not logged in');
                }
                options.userId = user.userId;
                comment = this._loadUserIdToComment({ comment: comment, userId: options.userId, itemId: options.itemId });
                options.comment = comment;
                commentToDisplay = this._addCommentToList(comment);
                this._createComment(options, (err, res) => {
                    if (err) {
                        this._removeCommentFromList(comment.commentId);
                        callback(err);
                        return;
                    }
                    this.comments.unshift({ data: commentToDisplay });
                    callback(null, res);
                });
            });
        } else {
            comment = this._loadUserIdToComment({ comment: comment, userId: options.userId, itemId: options.itemId });
            commentToDisplay = this._addCommentToList(comment);
            options.comment = comment;
            this._createComment(options, (err, res) => {
                if (err) {
                    this._removeCommentFromList(comment.commentId);
                    callback(err);
                    return;
                }
                this.comments.unshift({ data: commentToDisplay });
                callback(null, res);
            });
        }
    },

    _createComment(options, callback) {
        buildfire.publicData.insert(
            options.comment,
            this.TAG,
            (err, result) => {
                if (err) return callback(err);
                options.incrementValue = 1; // increment by 1
                this._updateSummary(options, (err, res) => {
                    if (err) return callback(err);
                    result.data.profileImage = this.user.imageUrl || 'https://app.buildfire.com/app/media/avatar.png';
                    result.data.username = this._getNameOfUser({ user: this.user, isOwner: options.userId == this.user.userId });
                    callback(null, result);
                });
            }
        );
    },

    _addCommentToList(comment) {
        const commentToDisplay = JSON.parse(JSON.stringify(comment));
        commentToDisplay.profileImage = this.user?.imageUrl || 'https://app.buildfire.com/app/media/avatar.png';
        commentToDisplay.username = this._getNameOfUser({ user: this.user, isOwner: true });
        commentToDisplay.displayDate = bfMomentSDK(commentToDisplay.createdOn).fromNow();
        commentToDisplay.text = this._processComment(commentToDisplay.text);
        this.listView.append([{ data: commentToDisplay }], true);
        this._switchEmptyState(false);
        this.summary.count += 1;
        const listViewContainer = document.querySelector('#listViewContainer');
        listViewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        buildfire.components.swipeableDrawer.setHeaderContent(this._getDrawerHeaderHtml({
            count: this.summary.count,
            commentsHeader: this.options.translations?.commentsHeader
        }));
        return commentToDisplay;
    },

    _removeCommentFromList(commentId) {
        this.listView.remove(commentId);
        this.summary.count -= 1;
        if (this.summary.count == 0) {
            this._switchEmptyState(true);
        }
        const listViewContainer = document.querySelector('#listViewContainer');
        listViewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        buildfire.components.swipeableDrawer.setHeaderContent(this._getDrawerHeaderHtml({
            count: this.summary.count,
            commentsHeader: this.options.translations?.commentsHeader
        }));
    },

    _loadUserIdToComment(options) {
        options.comment.userId = options.userId;
        options.comment.commentId = options.itemId + '-' + options.userId + '-' + Date.now(); // unique comment ID
        options.comment._buildfire.index.number1 = this._getAsciiEquivalent(options.userId);
        return options.comment;
    },

    _getSummary(options, callback) {
        if (!options.itemId) {
            return callback('Invalid itemId parameter');
        }

        this.commentsSummaries._getSummary(options, (err, summary) => {
            if (err) return callback(err);
            callback(null, new CommentsSummary(summary?.data ? summary.data : { itemId: options.itemId }));
        });
    },

    /**
     * Report abuse for a comment
     * @param {Object} options - Options object
     * @param {Object} options.comment - Comment object containing the comment text and other properties
     * @param {function} callback - Callback function to handle the result
     * @returns {void}
     */
    _reportComment(options, callback) {
        if (!options || !options.comment || !options.comment.id || !options.comment.data || !options.comment.data.userId) {
            return callback('Invalid options parameter');
        }
        buildfire.services.reportAbuse.report(
            {
                itemId: options.comment.data.commentId,
                reportedUserId: options.comment.data.userId,
                deeplink: {
                    itemId: options.itemId,
                    commentId: options.comment.data.commentId,
                },
                itemType: "Comment",
            },
            callback
        );
    },

    /** Utilities */

    _initializeDrawer(callback) {
        const drawerHeaderHtml = this._getDrawerHeaderHtml({ count: this.summary?.count, commentsHeader: this.options.translations?.commentsHeader });
        const drawerContentHtml = `
            <div id="commentsListContainer">
                <div id="listViewContainer"></div>
                <div id="commentSafeArea"></div>
            </div>
            <div class="add-comment-section">
                <img src="${this.user?.imageUrl || 'https://app.buildfire.com/app/media/avatar.png'}" alt="Profile Image">
                <textarea name="commentInput" id="commentInput" maxlength="1000" placeholder="${this.options.translations?.addCommentPlaceholder ? this.options.translations.addCommentPlaceholder : 'Add comment'}"></textarea>
                <span id="addCommentIcon" class="add-comment bf-icon-arrow-right-tail"></span>
            </div>
            <div id="commentsEmptyStateContainer" class="empty-state-container">
                <div class="empty-state-title ellipsis">${this.options.translations?.emptyStateTitle || 'No comments yet.'}</div>
                <div class="empty-state-message ellipsis">${this.options.translations?.emptyStateMessage || 'Be the first one to comment.'}</div>
            </div>
            `;

        buildfire.components.swipeableDrawer.initialize({
            startingStep: 'max',
            header: drawerHeaderHtml,
            mode: 'steps',
            content: drawerContentHtml,
            transitionDuration: 125,
            backdropEnabled: true,
        }, callback);
        buildfire.components.swipeableDrawer.onHide = () => {
            this._destroy();
            if (this.onClose && typeof this.onClose === 'function') {
                this.onClose();
            }
        }
        buildfire.components.swipeableDrawer.onStepChange = (step) => {
            if (this.keyboardShown && step !== 'max') {
                buildfire.components.swipeableDrawer.setStep('max');
            } else {
                if (step === 'min') {
                    this.close();
                }

            }
        };
    },

    _initializeListView(callback) {
        const paginationOptions = {
            pageSize: 50
        };
        const contentMapping = {
            idKey: 'data.commentId',
            imageKey: 'data.profileImage',
            titleKey: 'data.username',
            descriptionKey: 'data.text',
            subtitleKey: 'data.displayDate',
        };
        const listViewSettings = {
            showSearchBar: false,
            itemImage: 'circle',
            paginationEnabled: true,
            enableReadMore: true,
            contentMapping: contentMapping,
            paginationOptions: paginationOptions,
            paginationRootElementSelector: '.swipeable-drawer-content',
        };
        const listViewTranslations = {
            readMore: this.options.translations?.readMore || 'Read more',
            readLess: this.options.translations?.readLess || 'Read less',
        };
        this.listView = new buildfire.components.listView('#listViewContainer', {
            settings: listViewSettings,
            translations: listViewTranslations
        });
        this.listView.onDataRequest = (listViewOptions, dataRequestCallback) => {
            this.getComments({
                itemId: this.options.itemId,
                skip: listViewOptions.page * listViewOptions.pageSize,
                limit: listViewOptions.pageSize,
                filter: this.options.filter ? this.options.filter : null
            }, (err, comments) => {
                if ((!comments || comments.length === 0) && listViewOptions.page == 0) {
                    this._switchEmptyState(true);
                } else {
                    this._switchEmptyState(false);
                }
                if (err) return dataRequestCallback([]);
                this.comments = comments;
                dataRequestCallback(comments);
            });
        };
        this.listView.onItemRender = (options) => {
            let actions = [
                { actionId: 'report', text: this.options.translations?.report || 'Report' },
            ];
            if (this.user?.userId && options.item.data.userId === this.user.userId) {
                actions = [{ actionId: 'delete', text: this.options.translations?.delete || 'Delete' }];
            }
            return { actions };
        };
        this.listView.onItemActionClick = (event) => {
            if (event.action.actionId === 'report') {
                this._reportComment({
                    comment: event.item,
                    itemId: this.options.itemId,
                }, (err, result) => {
                    if (err) {
                        console.error('Error reporting comment:', err);
                        buildfire.dialog.toast({
                            message: 'Error reporting comment. Please try again later.',
                            type: 'danger',
                        });
                        return;
                    }
                    if (typeof this.options.translations?.commentReported == 'undefined' || (this.options.translations.commentReported !== null && (typeof this.options.translations.commentReported === 'string' && this.options.translations?.commentReported.trim() !== ''))) {
                        buildfire.dialog.toast({
                            message: this.options.translations?.commentReported || 'Comment reported successfully.',
                            type: 'success',
                        });
                    }
                });
            } else if (event.action.actionId === 'delete') {
                this.listView.remove(event.item.data.commentId);
                this.summary.count = this.summary.count > 0 ? this.summary.count -= 1 : 0;
                buildfire.components.swipeableDrawer.setHeaderContent(this._getDrawerHeaderHtml({
                    count: this.summary.count,
                    commentsHeader: this.options.translations?.commentsHeader
                }));
                this.deleteComment({
                    itemId: event.item.data.itemId,
                    commentId: event.item.data.commentId,
                }, (err, res) => {
                    if (err) {
                        this.listView.clear();
                        this.listView.append(this.comments);
                        this.summary.count += 1;
                        buildfire.components.swipeableDrawer.setHeaderContent(this._getDrawerHeaderHtml({
                            count: this.summary.count,
                            commentsHeader: this.options.translations?.commentsHeader
                        }));
                        console.error('Error deleting comment:', err);
                        buildfire.dialog.toast({
                            message: 'Error deleting comment. Please try again later.',
                            type: 'danger',
                        });
                        return;
                    }
                    this.listView.refresh();
                    if (this.onDelete && typeof this.onDelete === 'function') {
                        this.onDelete();
                    }
                    if (typeof this.options.translations?.commentDeleted == 'undefined' || (this.options.translations.commentDeleted !== null && (typeof this.options.translations.commentDeleted === 'string' && this.options.translations?.commentDeleted.trim() !== ''))) {
                        buildfire.dialog.toast({
                            message: this.options.translations?.commentDeleted || 'Comment deleted successfully.',
                            type: 'success',
                        });
                    }
                });
            }
        }
        this.listView.onItemClick = (event) => {
            if (event?.target == 'title') {
                if (event?.item?.data?.userId) {
                    buildfire.auth.openProfile(event.item.data.userId);
                }
            }
        };
        callback();
    },

    _configureAddCommentSection() {
        const commentInput = document.querySelector('#commentInput');
        const commentSafeArea = document.querySelector('#commentSafeArea');
        const addCommentIcon = document.querySelector('#addCommentIcon');
        commentInput.oninput = function () {
            this.style.height = '40px';
            const newHeight = Math.min(this.scrollHeight, 100);
            this.style.height = `${newHeight}px`;
            commentSafeArea.style.marginBottom = `${newHeight + 80}px`;
        };

        addCommentIcon.addEventListener('click', () => {
            if (commentInput.value && commentInput.value.trim()) {
                const commentText = commentInput.value.trim();
                commentInput.value = '';
                commentInput.style.height = '40px';
                commentSafeArea.style.marginBottom = '80px';
                this.addingCommentInProgress = true;
                this._addComment({
                    itemId: this.options.itemId,
                    userId: this.user?.userId,
                    commentText: commentText,
                }, (err, result) => {
                    this.addingCommentInProgress = false;
                    if (this._addingCommentDone) this._addingCommentDone();
                    if (err) {
                        buildfire.dialog.toast({
                            message: 'Error adding comment. Please try again later.',
                            type: 'danger',
                        });
                        console.error('Error adding comment:', err);
                        return;
                    }
                    if (this.onAdd && typeof this.onAdd === 'function') {
                        this.onAdd();
                    }
                    if (typeof this.options.translations?.commentAdded == 'undefined' || (this.options.translations.commentAdded !== null && (typeof this.options.translations.commentAdded === 'string' && this.options.translations?.commentAdded.trim() !== ''))) {
                        buildfire.dialog.toast({
                            message: this.options.translations?.commentAdded || 'Comment added successfully.',
                            type: 'success',
                        });
                    }
                })
            } else {
                // do nothing if the input is empty
            }
        });
    },

    _resetDrawer() {
        this._openCommentsDrawer(this.options);
    },


    _onResize() {
        const currentWidth = window.innerWidth;
        if (this.originalWidth !== currentWidth) {
            const drawer = document.querySelector('.swipeable-drawer');
            if (drawer) drawer.style.height = '100%'; // reset height to 100% on resize
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this._initializeDrawer((err, res) => {
                    this._configureAddCommentSection();
                    this._initializeListView(() => {
                        buildfire.components.swipeableDrawer.show();
                        this.resizeFromKeyboard = false;
                    });
                })
            }, 200);
        }
    },

    _updateSummary(options, callback) {
        if (!options?.itemId) {
            return callback('Invalid itemId parameter');
        }

        this.commentsSummaries._updateSummary(options, (err, result) => {
            if (err) return callback(err);
            callback(null, result);
        });
    },

    _getNameOfUser(options = {}) {
        if (options?.isOwner) {
            return this.options.translations?.you || 'You';
        }
        let nameOfUser = this.options?.translations?.someone || 'Someone';
        if (options?.user?.displayName && options?.user?.displayName?.trim()) {
            nameOfUser = options?.user?.displayName;
        } else if (options?.user?.firstName) {
            nameOfUser = options?.user?.firstName;
            if (options?.user?.lastName) {
                nameOfUser += ` ${options?.user?.lastName}`;
            }
        } else if (options?.user?.lastName) {
            nameOfUser = options?.user?.lastName;
        }
        return nameOfUser;
    },

    _getDrawerHeaderHtml(options) {
        return `
                <div class="comments-header-container">
                    <div class="comments-header ellipsis">${options.commentsHeader || 'Comments'}</div>
                    <div class="comments-count">${options.count ? `${options.count}` : '0'}</div>
                </div>
                <div class="comments-header-hr"></div>
                `;
    },

    _getAsciiEquivalent(string) {
        if (!string || typeof string !== 'string') {
            return '';
        }
        let charCodes = [];
        for (let i = 0; i < string.length; i++) {
            const code = string.charCodeAt(i);
            if ((code >= 48 && code <= 57)) { // 0-9
                charCodes.push(string.charAt(i))
            } else {
                charCodes.push(code);
            }
        }
        return charCodes.join('');
    },

    _processComment(comment) {
        comment = comment
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        // Process URLs in the comment text
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const processedText = comment.replace(urlRegex, (url) => {
            let fullUrl = url;
            const maxDisplayLength = 30;
            let displayUrl = url;

            if (url.length > maxDisplayLength) {
                displayUrl = url.substring(0, maxDisplayLength - 3) + '...';
            }
            return `<a href="${fullUrl?.toLowerCase()}" target="_blank" rel="noopener noreferrer">${displayUrl}</a>`;
        });
        return processedText;
    },

    _switchEmptyState(on) {
        const commentsListContainer = document.querySelector('#commentsListContainer');
        const commentsEmptyStateContainer = document.querySelector('#commentsEmptyStateContainer');
        if (on) {
            commentsListContainer.classList.add('d-none');
            commentsEmptyStateContainer.classList.remove('d-none');
        } else {
            commentsListContainer.classList.remove('d-none');
            commentsEmptyStateContainer.classList.add('d-none');
        }
    },

    _destroy() {
        this.drawerOpened = false;
        this.keyboardShown = false;
        this.options = null;
        this.summary = null;
        this.listView = null;
        this.user = null;
        this.comments = [];
        window.removeEventListener('resize', this._onResize.bind(this), false);
    },

    _addingCommentDone() { }
};
buildfire.components.comments._initialize();