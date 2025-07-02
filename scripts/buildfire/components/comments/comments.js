if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};

if (typeof buildfire.components.swipeableDrawer == 'undefined') {
    throw 'please add swipeableDrawer component first to use comments component';
}

if (typeof buildfire.components.listView == 'undefined') {
    throw 'please add listView component first to use comments component';
}
buildfire.lazyLoadScript(
    { relativeScriptsUrl: 'moment.min.js', scriptId: 'bfMomentSDK' }, () => {
        //TODO: handle moment.js loading
    }
)
/**
 * 
 */

/************************************************************ THE ITEM ID IS NOT THE COMMENT ID, IT IS THE POST ID *************************************************************/

/**TODO:
 * check for components/services used if the user included them or not, if not throw an error
 * remember to add support for messages like the header "Comments", look at list view for translations 
 * in SDK docs, mention that the component has z-index of 100.
 * add moment.js and load it dynamically, rename it's exposed API to bfMoment
 * in delete, update UI then call the API
 * get the user dynamically
 * handle when the list is empty and adding a new comment 
 * handle when user deletes the last comment
 * scroll to top when adding a new comment
 * get the current user in component
 * make not exposed API functions private with _ prefix
 * lazyLoadScript for moment.js
 * to make add comment like delete (ui then api) use the current user to get the name and the profile image
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
 * @property {string} noCommentsTitle - Message title to show when there are no comments
 * * @property {string} noCommentsMessage - Message to show when there are no comments
 * * @property {string} addCommentPlaceholder - Placeholder for the comment input field
 * * @property {string} readMore - Text for the read more link in the list view
 * * @property {string} report - Text for the report action in the list view
 * * @property {string} delete - Text for the delete action in the list view
 * * @property {string} reportCommentSuccess - Success message for reporting a comment
 * * @property {string} deleteCommentSuccess - Success message for deleting a comment
 * * @property {string} addCommentSuccess - Success message for adding a comment
 * * @property {string} commentDeleted - Message to show when a comment is deleted
 * * @property {string} commentAdded - Message to show when a comment is added
 * * @property {string} commentUpdated - Message to show when a comment is updated
 * * @property {string} commentReported - Message to show when a comment is reported
 * * @property {string} commentNotFound - Message to show when a comment is not found
 * * @property {string} commentNotAuthorized - Message to show when a user is
 * username
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
                    this._resetDrawer();
                }
            });

        }

        openCommentsDrawer(options = {}, callback) {
            if (!options.itemId) {
                return callback ? callback('Invalid options, Missing itemId!') : console.error('Invalid options, Missing itemId!');
            }
            this.options = options;
            buildfire.auth.getCurrentUser((err, user) => {
                this.user = user;
                this.getSummary({ itemId: this.options.itemId }, (err, summary) => {
                    this.summary = summary;
                    this.getComments(this.options, (err, comments) => {
                        const drawerHeaderHtml = this._getDrawerHeaderHtml({ count: summary.count, commentsHeader: this.options.translations?.commentsHeader });
                        let drawerContentHtml = `
                            <div id="commentsListContainer">
                                <div id="listViewContainer"></div>
                                <div id="commentSafeArea"></div>
                            </div>
                            <div class="add-comment-section">
                                <img src="${this.user?.imageUrl || 'https://app.buildfire.com/app/media/avatar.png'}" alt="Profile Image">
                                <textarea name="commentInput" id="commentInput" maxlength="1000" placeholder="${this.options.translations?.addCommentPlaceholder ? this.options.translations.addCommentPlaceholder : 'Add comment'}"></textarea>
                                <span id="addCommentIcon" class="add-comment bf-icon-arrow-right-tail"></span>
                            </div>
                            <div class="empty-state-container">
                                <div class="empty-state-title">${this.options.translations?.noCommentsTitle || 'No comments yet.'}</div>
                                <div class="empty-state-message">${this.options.translations?.noCommentsMessage || 'Be the first one to comment.'}</div>
                            </div>
                            `;

                        buildfire.components.swipeableDrawer.initialize({
                            startingStep: 'max',
                            header: drawerHeaderHtml,
                            mode: 'steps',
                            content: drawerContentHtml,
                            transitionDuration: 125,
                            backdropEnabled: true,
                            backdropShadow: 'rgba(0, 0, 0, 0.50)'
                        }, (err, res) => {
                            if (!comments || comments.length == 0) {
                                const commentsListContainer = document.getElementById('commentsListContainer');
                                commentsListContainer.classList.add('d-none');
                            }
                            const paginationOptions = {
                                pageSize: 50
                            };
                            const contentMapping = {
                                idKey: 'id',
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
                            };
                            const listViewTranslations = {
                                readMore: 'Read more',

                            };
                            this.listView = new buildfire.components.listView('#listViewContainer', {
                                settings: listViewSettings,
                                translations: listViewTranslations
                            });
                            this.listView.onDataRequest = (listViewOptions, callback) => {
                                this.getComments({
                                    itemId: this.options.itemId,
                                    userId: this.user?.userId,
                                    skip: listViewOptions.page * listViewOptions.pageSize,
                                    limit: listViewOptions.pageSize
                                }, (err, comments) => {
                                    if (err) return callback([]);
                                    callback(comments);
                                });
                            };
                            this.listView.onItemRender = (options) => {
                                let actions = [
                                    { actionId: 'report', text: 'Report' },
                                ];
                                if (this.user?.userId && options.item.data.userId === this.user.userId) {
                                    actions = [{ actionId: 'delete', text: 'Delete' }];
                                }
                                return { actions };
                            };
                            this.listView.onItemActionClick = (event) => {
                                if (event.action.actionId === 'report') {
                                    this.reportComment({
                                        comment: event.item,
                                    }, (err, result) => {
                                        if (err) {
                                            console.error('Error reporting comment:', err);
                                            buildfire.dialog.toast({
                                                message: err || 'Error reporting comment. Please try again later.',
                                                type: 'danger',
                                            });
                                            return;
                                        }
                                        buildfire.dialog.toast({
                                            message: 'Comment reported successfully.',
                                            type: 'success',
                                        });
                                    });
                                } else if (event.action.actionId === 'delete') {
                                    this.listView.remove(event.item.id);
                                    this.summary.count = this.summary.count > 0 ? this.summary.count -= 1 : 0;
                                    buildfire.components.swipeableDrawer.setHeaderContent(this._getDrawerHeaderHtml({
                                        count: summary.count,
                                        commentsHeader: this.options.translations?.commentsHeader
                                    }));
                                    this.deleteComment({
                                        itemId: event.item.data.itemId,
                                        commentId: event.item.id,
                                        userId: this.user?.userId,
                                    }, (err, res) => {
                                        if (err) {
                                            this.listView.append([event.item]);
                                            this.listView.refresh();
                                            this.summary.count += 1;
                                            buildfire.components.swipeableDrawer.setHeaderContent(this._getDrawerHeaderHtml({
                                                count: summary.count,
                                                commentsHeader: this.options.translations?.commentsHeader
                                            }));

                                            console.error('Error deleting comment:', err);
                                            buildfire.dialog.toast({
                                                message: err || 'Error deleting comment. Please try again later.',
                                                type: 'danger',
                                            });
                                            return;
                                        }
                                        buildfire.dialog.toast({
                                            message: 'Comment deleted successfully.',
                                            type: 'success',
                                        });
                                    });
                                }
                            }
                            this._configureAddCommentSection();
                            buildfire.components.swipeableDrawer.show();
                            this.drawerOpened = true;
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
            })

        }

        /**         
         *  Add a new comment
         * @param {Object} options - Options object
         * @param {string} options.itemId - ID of the item to add the comment to
         * @param {Object} options.comment - Comment object containing the comment text and other properties
         * @param {function} callback - Callback function to handle the result
         * @returns {void}
         */

        addComment(options, callback) {
            if (!options) {
                return callback('Invalid options');
            }
            if (typeof callback !== 'function') {
                return console.error('callback must be a function');
            }
            if (!options.itemId) {
                return callback('Invalid options, Missing itemId');
            }

            buildfire.auth.login({}, (err, user) => {
                if (err || !user) {
                    buildfire.dialog.toast({
                        message: 'You must be logged in to add a comment.',
                        type: 'danger',
                    })
                    return callback(err || 'User not logged in');
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
                        this._updateSummary(options, (err, res) => {
                            if (err) return callback(err);
                            buildfire.auth.getUserProfile({ userId: options.userId }, (err, user) => {
                                if (err || !user) {
                                    console.error('Error getting user profile:', err);
                                    return callback(err);
                                }
                                result.data.profileImage = user.imageUrl || 'https://app.buildfire.com/app/media/avatar.png';
                                result.data.username = this._getUsername(user);
                                callback(null, result);
                            });
                        });
                    }
                );
            });

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

        /**
         * Delete a comment
         * @param {Object} options - Options object
         * @param {string} options.itemId - ID of the item the comment belongs to
         * @param {string} options.commentId - ID of the comment to delete
         * @param {string} options.userId - ID of the user deleting the comment
         * @param {function} callback - Callback function to handle the result
         * @returns {void}
         */
        deleteComment(options, callback) {
            if (!options) {
                return callback('Invalid options parameter');
            }
            if (!options.itemId || !options.commentId) {
                return callback('Invalid itemId or commentId parameter');
            }

            this._getComment(options, (err, comment) => {
                if (err) return callback(err);
                if (comment && comment.data) {
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

        /**         
         * Get comments for a specific item
         * @param {Object} options - Options object
         * @param {string} options.itemId - ID of the item to get comments for
         * @param {string} options.userId - ID of the user making the request
         * @param {number} [options.skip=0] - Number of comments to skip
         * @param {number} [options.limit=50] - Maximum number of comments to return
         * @param {function} callback - Callback function to handle the result
         * @returns {void}
         */

        getComments(options, callback) {
            if (!options.itemId) {
                return callback('Invalid item ID');
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
                                        comment.data.profileImage = user.imageUrl || 'https://app.buildfire.com/app/media/avatar.png';
                                        comment.data.username = this._getUsername(user);
                                    }
                                    comment.data.displayDate = bfMomentSDK(comment.data.createdOn).fromNow();
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

        /**
         * Report abuse for a comment
         * @param {Object} options - Options object
         * @param {Object} options.comment - Comment object containing the comment text and other properties
         * @param {function} callback - Callback function to handle the result
         * @returns {void}
         */
        reportComment(options, callback) {
            if (!options || !options.comment || !options.comment.id || !options.comment.data || !options.comment.data.userId) {
                return callback('Invalid options parameter');
            }
            buildfire.services.reportAbuse.report(
                {
                    itemId: options.comment.id,
                    reportedUserId: options.comment.data.userId,
                    deeplink: {
                        itemId: options.comment.data.itemId,
                        commentId: options.comment.id,
                    },
                    itemType: "Comment",
                },
                callback
            );
        }

        /** Utilities */

        _configureAddCommentSection() {
            const commentInput = document.getElementById('commentInput');
            const commentSafeArea = document.getElementById('commentSafeArea');
            const addCommentIcon = document.getElementById('addCommentIcon');
            commentInput.oninput = function () {
                const lineHeight = 20;
                this.style.height = '20px';
                commentSafeArea.style.marginBottom = '80px';
                const lines = Math.floor(this.scrollHeight / (lineHeight * 2));
                const newHeight = Math.min((lines * lineHeight), 100);
                commentSafeArea.style.marginBottom = `${newHeight + 60}px`;
                this.style.height = `${newHeight}px`;
            };

            addCommentIcon.addEventListener('click', () => {
                if (commentInput.value && commentInput.value.trim()) {
                    const comment = {
                        text: commentInput.value.trim(),
                        createdOn: new Date().toISOString(),
                        lastUpdatedOn: new Date().toISOString()
                    }
                    commentInput.value = '';
                    commentInput.style.height = '20px';
                    commentSafeArea.style.marginBottom = '80px';
                    this.addComment({
                        itemId: this.options.itemId,
                        userId: this.user?.userId,
                        comment: comment,
                    }, (err, result) => {
                        if (err) {
                            console.error('Error adding comment:', err);
                            return;
                        }
                        buildfire.dialog.toast({
                            message: 'Comment added successfully.',
                            type: 'success',
                        });
                        this.listView.append([result], true);
                        this.summary.count += 1;
                        const listViewContainer = document.getElementById('listViewContainer');
                        listViewContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        buildfire.components.swipeableDrawer.setHeaderContent(this._getDrawerHeaderHtml({
                            count: this.summary.count,
                            commentsHeader: this.options.translations?.commentsHeader
                        }));
                    })
                } else { }
            });
        }

        _resetDrawer() {
            this.openCommentsDrawer(this.options);
        }
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
            let username = 'Someone'; // TODO: add to translations
            if (user.displayName && user.displayName.trim()) {
                username = user.displayName;
            } else if (user.firstName) {
                username = user.firstName;
                if (user.lastName) {
                    username += ` ${user.lastName}`;
                }
            }
            return username;
        }

        _getDrawerHeaderHtml(options) {
            return `
                <div class="comments-header-container">
                    <div class="comments-header">${options.commentsHeader || 'Comments'}</div>
                    <div class="comments-count">${options.count ? `${options.count}` : '0'}</div>
                </div>
                `;
        }

        _switchEmptyState() {

        }

        _destroy() {
            this.drawerOpened = false;
            this.keyboardShown = false;
            this.options = null;
            this.summary = null;
            this.listView = null;
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