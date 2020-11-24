if (typeof buildfire == "undefined")
    throw "please add buildfire.js first to use buildfire components";

if (typeof buildfire.components == "undefined") buildfire.components = {};

class Rating {
    constructor(record = {}) {
        if (!record.data) record.data = {};
        this.id = record.id || undefined;
        this.isActive =
            typeof record.data.isActive === "boolean" ? record.data.isActive : true;
        this.createdOn = record.data.createdOn || new Date();
        this.createdBy = record.data.createdBy || undefined;
        this.lastUpdatedOn = record.data.lastUpdatedOn || undefined;
        this.lastUpdatedBy = record.data.lastUpdatedBy || undefined;
        this.deletedOn = record.data.deletedOn || undefined;
        this.deletedBy = record.data.deletedBy || undefined;

        this.user = record.data.user || {
            _id: "",
            displayName: "",
            imageUrl: "",
        };
        this.ratingId = record.data.ratingId || undefined;
        this.rating = record.data.rating || undefined;
        this.comment = record.data.comment || "";
        this.images = record.data.images || [];
    }

    toJSON() {
        return {
            id: this.id,
            isActive: this.isActive,
            createdOn: this.createdOn,
            createdBy: this.createdBy,
            lastUpdatedOn: this.lastUpdatedOn,
            lastUpdatedBy: this.lastUpdatedBy,
            deletedOn: this.deletedOn,
            deletedBy: this.deletedBy,

            user: this.user,
            ratingId: this.ratingId,
            rating: this.rating,
            comment: this.comment,
            images: this.images,
            _buildfire: {
                index: {
                    number1: this.isActive ? 1 : 0,
                    date1: this.createdOn,
                    array1: [this.rating, this.user._id],
                    string1: this.ratingId,
                },
            },
        };
    }
}

class Ratings {
    /**
     * Get Database Tag
     */
    static get TAG() {
        return "rating";
    }

    /**
     * Get List Of Ratings
     * @param {Object} filters Filters object with search operators
     * @param {Function} callback Callback function
     */
    static search(filters, callback) {
        buildfire.appData.search(filters, Ratings.TAG, (err, records) => {
            if (err) return callback(err);
            return callback(
                null,
                records.map((record) => new Rating(record))
            );
        });
    }

    static findRatingByUser(ratingId, userId, callback) {
        Ratings.search(
            {
                filter: {
                    "_buildfire.index.array1": userId,
                    "_buildfire.index.string1": ratingId,
                },
            },
            (err, ratings) => {
                if (err) return callback(err);
                return callback(null, ratings[0]);
            }
        );
    }

    /**
     * Add new rating
     * @param {Rating} rating Instance of rating data class
     * @param {Function} callback Callback function
     */
    static add(rating, callback) {
        if (!(rating instanceof Rating))
            return callback(new Error("Only Rating instance can be used"));

        if (!rating.user || !rating.user._id)
            return callback(new Error("User must be logged in"));

        // Check if there is an existing rating from this user
        Ratings.search(
            {
                filter: {
                    "_buildfire.index.array1": rating.user._id,
                    "_buildfire.index.string1": rating.ratingId,
                },
            },
            (err, ratings) => {
                if (err) return callback(err);
                if (ratings && ratings.length)
                    return callback(new Error("User already rated item"));
                if (!ratings || ratings.length === 0) {
                    rating.createdOn = new Date();

                    buildfire.appData.insert(
                        rating.toJSON(),
                        Ratings.TAG,
                        false,
                        (err, record) => {
                            if (err) return callback(err);
                            record = new Rating(record);

                            Summaries.addRating(record, (err, data) => {
                                return callback(null, { rating: record, summary: data });
                            });
                        }
                    );
                }
            }
        );
    }
    /**
     * Edit single rating instance
     * @param {Rating} rating Instance of rating data class
     * @param {Function} callback Callback function
     */
    static set(originalRating, rating, callback) {
        if (!(rating instanceof Rating))
            return callback(new Error("Only Rating instance can be used"));

        rating.lastUpdatedOn = new Date();

        buildfire.appData.update(
            rating.id,
            rating.toJSON(),
            Ratings.TAG,
            (err, record) => {
                if (err) return callback(err);
                record = new Rating(record);
                Summaries.updateRating(originalRating, record, (err, data) => {
                    return callback(null, { rating: record, summary: data });
                });
            }
        );
    }
    /**
     * Delete single rating instance
     * @param {Rating} rating Instance of rating data class
     * @param {Function} callback Callback function
     */
    static del(rating, callback) {
        if (!(rating instanceof Rating))
            return callback(new Error("Only Rating instance can be used"));

        buildfire.appData.delete(rating.id, Ratings.TAG, (err, record) => {
            if (err) return callback(err);
            Summaries.deleteRating(rating, (err, data) => {
                buildfire.messaging.sendMessageToControl({ type: "ratings" });
                return callback(null, { rating, summary: data });
            });
        });
    }

    /**
     * Soft delete single rating instance
     * @param {Rating} rating Instance of rating data class
     * @param {Function} callback Callback function
     */
    static softDel(rating, callback) {
        if (!(rating instanceof Rating))
            return callback(new Error("Only Rating instance can be used"));

        let shouldUpdateSummary = rating.isActive;

        rating.isActive = false;

        buildfire.appData.update(
            rating.id,
            rating.toJSON(),
            Ratings.TAG,
            (err, record) => {
                if (err) return callback(err);
                if (!shouldUpdateSummary) return callback(null, rating);

                Summaries.deleteRating(rating, (err, data) => {
                    buildfire.messaging.sendMessageToControl({ type: "ratings" });
                    return callback(null, rating);
                });
            }
        );
    }
}

class Summary {
    constructor(record = {}) {
        if (!record.data) record.data = {};
        this.id = record.id || undefined;

        this.ratingId = record.data.ratingId || null;
        this.count = record.data.count || 0;
        this.total = record.data.total || 0;
    }

    toJSON() {
        return {
            id: this.id,
            ratingId: this.ratingId,
            count: this.count,
            total: this.total,
            _buildfire: {
                index: {
                    string1: this.ratingId,
                },
            },
        };
    }
}

class Summaries {
    /**
     * Get Database Tag
     */
    static get TAG() {
        return "fivestarsummary";
    }

    /**
     * Get List Of Summaries
     * @param {Object} filters Filters object with search operators
     * @param {Function} callback Callback function
     */
    static search(filters, callback) {
        buildfire.appData.search(filters, Summaries.TAG, (err, records) => {
            if (err) return callback(err);
            return callback(
                null,
                records.map((record) => new Summary(record))
            );
        });
    }

    static addRating(rating, callback) {
        const filters = {
            filter: {
                "_buildfire.index.string1": rating.ratingId,
            },
        };
        buildfire.appData.search(filters, Summaries.TAG, (err, summaries) => {
            if (err) return callback(err);
            let summary = summaries[0];
            if (!summary) {
                summary = new Summary({
                    data: {
                        ratingId: rating.ratingId,
                        count: 1,
                        total: rating.rating,
                    },
                });
                buildfire.appData.insert(
                    summary.toJSON(),
                    Summaries.TAG,
                    false,
                    (err, record) => {
                        if (err) return callback(err);
                        return callback(null, new Summary(record));
                    }
                );
            } else {
                summary = new Summary(summary);

                summary.count++;
                summary.total += rating.rating;

                buildfire.appData.update(
                    summary.id,
                    summary.toJSON(),
                    Summaries.TAG,
                    (err, record) => {
                        if (err) return callback(err);
                        return callback(null, new Summary(record));
                    }
                );
            }
        });
    }

    static updateRating(originalRating, newRating, callback) {
        const filters = {
            filter: {
                "_buildfire.index.string1": newRating.ratingId,
            },
        };
        buildfire.appData.search(filters, Summaries.TAG, (err, summaries) => {
            if (err) return callback(err);
            let summary = new Summary(summaries[0]);

            summary.total += newRating.rating;
            summary.total -= originalRating.rating;

            buildfire.appData.update(
                summary.id,
                summary.toJSON(),
                Summaries.TAG,
                (err, record) => {
                    if (err) return callback(err);
                    return callback(null, new Summary(record));
                }
            );
        });
    }

    static deleteRating(rating, callback) {
        const filters = {
            filter: {
                "_buildfire.index.string1": rating.ratingId,
            },
        };
        buildfire.appData.search(filters, Summaries.TAG, (err, summaries) => {
            if (err) return callback(err);
            let summary = new Summary(summaries[0]);

            summary.total -= rating.rating;
            summary.count--;

            buildfire.appData.update(
                summary.id,
                summary.toJSON(),
                Summaries.TAG,
                (err, record) => {
                    if (err) return callback(err);
                    return callback(null, new Summary(record));
                }
            );
        });
    }
}

const FULL_STAR = "&#9733;";
const ADMIN_TAG = "bf_ratings_admin";
const defaultOptions = {
    hideAverage: true,
    showRatingsOnClick: true,
    translations: {
        "ratings": "Ratings",
        "addRating": "Add Rating",
        "updateRating": "Update Rating",
        "leaveAReview": "Leave a review",
        "writeAComment": "Write a comment",
        "basedOn": "Based on",
        "review": "Review",
        "reviews": "Reviews",
        "viewAll": "View All",
        "overallRating": "Overall rating",
        "emptyStateText": "No reivews yet. Be the first to leave a review!"
    }
};
function getNotRatedUI(container) {
    for (let i = 0; i < 5; i++) {
        let star = document.createElement("span");
        star.innerHTML = FULL_STAR;
        star.style.opacity = "0.3";
        container.appendChild(star);
    }
}

function injectRatings(options = defaultOptions, callback) {
    let elements = options.elements;
    if (typeof elements === "undefined")
        elements = document.querySelectorAll("[data-rating-id]");

    let ratingIds = options.ratingIds;
    if (typeof ratingIds === "undefined")
        ratingIds = Array.from(elements).map((element, index) => {
            let id = element.dataset.ratingId;
            if (id.includes("tinymce") && !element.innerHTML.includes("★ ★ ★ ★ ★")) {
                return undefined;
            }
            return id;
        });

    if (options.pluginLevel === true) {
        let instanceId = buildfire.getContext().instanceId;
        ratingIds = ratingIds.map(id => `${id}-${instanceId}`)
    }

    const filters = {
        filter: {
            "_buildfire.index.string1": {
                $in: ratingIds,
            },
        },
    };

    Summaries.search(filters, (err, summaries) => {
        if (err) return console.error(err);

        ratingIds.forEach((ratingId, index) => {
            if (!ratingId) return;
            let summary = summaries.find((s) => s.ratingId === ratingId);

            options.notRated = !summary;
            options.summary = summary;

            options.onBackButtonClick = buildfire.navigation.onBackButtonClick;
            options.callback = callback;

            injectAverageRating(elements[index], ratingId, options);
        });
    });
}

function injectAverageRating(container, ratingId, options) {
    if (!container) return console.error(`Container not found in DOM`);
    let containerClone = container.cloneNode(true);
    const filters = {
        filter: {
            "_buildfire.index.string1": ratingId,
        },
    };

    let isFromWysiwyg = container.innerHTML.split("★ ★ ★ ★ ★").length == 2;

    const reRender = () => {
        delete options.summary;
        container.innerHTML = containerClone.innerHTML;
        injectAverageRating(container, ratingId, options);
    };

    if (options && options.summary) {
        let averageRating = options.summary.total / options.summary.count;
        createStarsUI(container, averageRating, options, ratingId, reRender, isFromWysiwyg);
    } else {
        Summaries.search(filters, (err, summaries) => {
            if (err) return console.error(err);

            if (!summaries || !summaries[0] || summaries[0].count === 0) {
                summaries = [{ total: 0, count: 1 }]
            }

            options.summary = summaries[0];

            let averageRating = summaries[0].total / summaries[0].count;

            createStarsUI(container, averageRating, options, ratingId, reRender, isFromWysiwyg);
        });
    }
}

function applyStyling() {
    let styleRatings = document.getElementById("style-ratings");
    if (styleRatings) styleRatings.parentElement.removeChild(styleRatings);

    styleRatings = document.createElement("style");

    buildfire.appearance.getAppTheme((err, theme) => {
        const { backgroundColor, primaryTheme } = theme.colors;
        styleRatings.innerHTML = `
            .backgroundColorTheme {
                background-color: ${backgroundColor} !important;
            }

            .primaryTheme {
                color: ${primaryTheme} !important;
            }
        `
        document.head.appendChild(styleRatings);
    })
}

function openAddRatingScreen(
    ratingId,
    options = defaultOptions,
    callback = () => { }
) {
    buildfire.auth.getCurrentUser((err, loggedInUser) => {
        if (err || !loggedInUser) {
            return buildfire.auth.login(
                { allowCancel: true, showMenu: true },
                (err, user) => {
                    if (user) return openAddRatingScreen(ratingId);
                }
            );
        }
        Ratings.findRatingByUser(ratingId, loggedInUser._id, (err, rating) => {
            let currentBackBehavior = buildfire.navigation.onBackButtonClick;
            buildfire.navigation.onBackButtonClick = () => {
                closeAddRatingScreen();
                buildfire.navigation.onBackButtonClick = currentBackBehavior;
            };
            if (rating && !rating.isActive) {
                let container = document.createElement("div");
                container.className = "add-rating-screen";
                container.style.padding = "10px";
                container.innerText =
                    "Your rating has been removed for violating community guildelines";
                return document.body.appendChild(container);
            }
            let originalRating;
            if (!rating) {
                rating = new Rating({
                    data: {
                        createdBy: loggedInUser._id,
                        user: {
                            _id: loggedInUser._id,
                            displayName: loggedInUser.displayName,
                            imageUrl: loggedInUser.imageUrl,
                        },
                        ratingId: ratingId,
                    },
                });
            } else {
                originalRating = new Rating({
                    data: rating,
                });
            }

            let backDrop = document.createElement("div");
            backDrop.className = "add-rating-screen";
            backDrop.addEventListener("click", (e) => {
                if (e.target.className == "add-rating-screen") {
                    buildfire.navigation.onBackButtonClick();
                }
            });

            let container = document.createElement("div");
            container.className = "add-rating-screen-content backgroundColorTheme";

            let header = document.createElement("div");
            header.className = "add-rating-header";

            let cancelButton = document.createElement("div");
            cancelButton.className = "cancel-rating-button";
            cancelButton.innerHTML = "&#10005;";
            cancelButton.addEventListener("click", () => {
                closeAddRatingScreen();
            });

            let title = document.createElement("div");
            title.className = "add-rating-title";
            title.innerText = rating.id ? (options && options.translations && options.translations.updateRating) || defaultOptions.translations.updateRating : (options && options.translations && options.translations.addRating) || defaultOptions.translations.addRating;

            header.appendChild(cancelButton);
            header.appendChild(title);

            let subtitle = document.createElement("div");
            subtitle.className = "add-rating-subtitle";
            subtitle.innerText = (options && options.translations && options.translations.leaveAReview) || defaultOptions.translations.leaveAReview;

            let updateStarsUI = () => {
                for (let i = 0; i < 5; i++) {
                    const star = document.getElementById("stars" + i);
                    star.style.opacity = i < rating.rating ? "1" : "0.3";
                }
            };

            let ratingStars = document.createElement("div");
            ratingStars.className = "rating-stars";
            for (let i = 0; i < 5; i++) {
                let star = document.createElement("div");
                star.id = "stars" + i;
                star.addEventListener("click", function () {
                    rating.rating = i + 1;
                    updateStarsUI();
                });
                star.innerHTML = FULL_STAR;
                star.style.color = "#fcb040";
                ratingStars.appendChild(star);
            }

            const openTextDialog = () => {
                buildfire.input.showTextDialog(
                    {
                        placeholder: (options && options.translations && options.translations.writeAComment) || defaultOptions.translations.writeAComment,
                        saveText: "Save",
                        defaultValue:
                            textArea.innerText !== ((options && options.translations && options.translations.writeAComment) || defaultOptions.translations.writeAComment)
                                ? textArea.innerText
                                : "",
                        attachments: {
                            images: {
                                enable: true,
                                multiple: true,
                            },
                        },
                    },
                    (e, response) => {
                        if (e || response.cancelled) return;
                        rating.comment = response.results[0].textValue;
                        rating.images = [...rating.images, ...response.results[0].images];
                        updateTextAreaUI();
                        updateImagesUI();
                    }
                );
            };

            let updateTextAreaUI = () => {
                textArea.innerText = rating.comment
                    ? rating.comment
                    : (options && options.translations && options.translations.writeAComment) || defaultOptions.translations.writeAComment;
            };

            let textAreaSubtitle = document.createElement("div");
            textAreaSubtitle.className = "add-rating-subtitle";
            textAreaSubtitle.innerText = (options && options.translations && options.translations.writeAComment) || defaultOptions.translations.writeAComment;

            let textArea = document.createElement("div");
            textArea.className = "text-area";
            textArea.addEventListener("click", openTextDialog);

            let imagesContainer = document.createElement("images");
            imagesContainer.className = "review-images-container";

            const removeImage = (index) => {
                rating.images.splice(index, 1);
                updateImagesUI();
            };

            const updateImagesUI = () => {
                imagesContainer.innerHTML = "";
                rating.images.forEach((imageUrl, index) => {
                    let imageContainer = document.createElement("div");
                    imageContainer.className = "review-image-container";

                    let deleteImageButton = document.createElement("div");
                    deleteImageButton.className = "review-image-delete";
                    deleteImageButton.innerHTML = "✖";
                    deleteImageButton.style.background = "red";
                    deleteImageButton.style.color = "white";

                    let image = document.createElement("img");
                    image.className = "review-image";
                    image.src = buildfire.imageLib.resizeImage(imageUrl, {
                        size: "s",
                        aspect: "1:1",
                    });
                    imageContainer.appendChild(image);
                    imageContainer.appendChild(deleteImageButton);
                    imageContainer.addEventListener("click", () => {
                        removeImage(index);
                    });

                    imagesContainer.appendChild(imageContainer);
                });
            };

            let submitButton = document.createElement("div");
            submitButton.className = "submit-button";
            submitButton.innerText = rating.id ? (options && options.translations && options.translations.updateRating) || defaultOptions.translations.updateRating : (options && options.translations && options.translations.addRating) || defaultOptions.translations.addRating;
            submitButton.addEventListener("click", () => {
                if (rating.id) {
                    Ratings.set(originalRating, rating, (err, updatedRating) => {
                        buildfire.navigation.onBackButtonClick();
                        buildfire.messaging.sendMessageToControl({ type: "ratings" });
                        callback(err, updatedRating);
                        if (options.callback) options.callback(err, updatedRating);
                        buildfire.components.ratingSystem.onRating(updatedRating)
                    });
                } else {
                    Ratings.add(rating, (err, addedRating) => {
                        buildfire.navigation.onBackButtonClick();
                        closeAddRatingScreen();
                        buildfire.messaging.sendMessageToControl({ type: "ratings" });
                        callback(err, addedRating);
                        if (options.callback) options.callback(err, addedRating);
                        buildfire.components.ratingSystem.onRating(addedRating)
                    });
                }
            });

            container.appendChild(header);
            container.appendChild(subtitle);
            container.appendChild(ratingStars);
            container.appendChild(textAreaSubtitle);
            container.appendChild(textArea);
            container.appendChild(imagesContainer);

            container.appendChild(submitButton);
            backDrop.appendChild(container);

            document.body.appendChild(backDrop);

            updateImagesUI();
            updateStarsUI();
            updateTextAreaUI();
        });
    });
}

function closeAddRatingScreen() {
    let addRatingScreen = document.querySelector(".add-rating-screen");
    if (!addRatingScreen) return;

    document.body.removeChild(addRatingScreen);
}

function createRatingUI(rating, editRatingButton, options) {
    let container = document.createElement("div");
    container.className = "ratings-screen-rating";
    container.id = rating.id;
    container.dataset.rating = JSON.stringify(rating);

    let header = document.createElement("div");
    header.className = "rating-header";
    container.appendChild(header);

    let profileImage = document.createElement("img");
    profileImage.className = "rating-user-image";
    profileImage.src =
        rating.user && rating.user.imageUrl
            ? rating.user.imageUrl
            : "https://pluginserver.buildfire.com/styles/media/avatar-placeholder.png";
    profileImage.src = buildfire.imageLib.resizeImage(profileImage.src, {
        size: "s",
        aspect: "1:1",
    });
    header.appendChild(profileImage);

    let nameAndStars = document.createElement("div");
    nameAndStars.className = "rating-name-and-stars";
    header.appendChild(nameAndStars);

    let userName = document.createElement("div");
    userName.className = "rating-user-display-name";
    userName.innerText =
        rating.user && rating.user.displayName
            ? rating.user.displayName
            : "Unknown User";

    if (editRatingButton) {
        userName.appendChild(editRatingButton);
    }

    nameAndStars.appendChild(userName);

    let stars = document.createElement("div");
    stars.className = "rating-user-stars";
    nameAndStars.appendChild(stars);

    let starsSpan = document.createElement("span");
    starsSpan.className = "stars-span";
    createStarsUI(starsSpan, Number(rating.rating), { hideAverage: true });

    let ratingTime = document.createElement("span");
    ratingTime.className = "rating-time-ago";
    ratingTime.innerHTML = formatTime(new Date(rating.createdOn));

    stars.appendChild(starsSpan);
    stars.appendChild(ratingTime);

    let ratingReview = document.createElement("div");
    ratingReview.className = "rating-review";
    container.appendChild(ratingReview);

    let ratingReviewText = document.createElement("div");
    ratingReviewText.className = "rating-review-text";
    ratingReviewText.innerText =
        rating.comment.length > 120
            ? rating.comment.slice(0, 120) + "..."
            : rating.comment;
    if (rating.comment.length > 120) {
        let seeMore = document.createElement("a");
        seeMore.innerText = "see more";
        seeMore.addEventListener("click", () => {
            ratingReviewText.innerText = rating.comment;
        });
        ratingReviewText.append(seeMore);
    }
    ratingReview.appendChild(ratingReviewText);

    let ratingImages = document.createElement("div");
    ratingImages.className = "rating-review-images";
    ratingReview.appendChild(ratingImages);

    for (let i = 0; i < rating.images.length; i++) {
        const imageUrl = rating.images[i];
        let image = document.createElement("img");
        image.className = "rating-review-image";
        image.src = buildfire.imageLib.resizeImage(imageUrl, {
            size: "m",
            aspect: "1:1",
        });
        image.addEventListener("click", () => {
            const options = {
                images: rating.images,
                index: i
            };

            buildfire.imagePreviewer.show(options, callback)
        })
        ratingImages.appendChild(image);
    }

    return container;
}

function openRatingsScreen(ratingId, options, reRenderComponent) {
    let container = document.createElement("div");
    container.id = "ratingsScreenContainer";
    container.className = "ratings-screen backgroundColorTheme";

    buildfire.spinner.show();

    buildfire.navigation.onBackButtonClick = () => {
        if (options.callback) options.callback(undefined, null)
        closeRatingsScreen();
        buildfire.navigation.onBackButtonClick = options.onBackButtonClick;
    };

    let header = document.createElement("div");
    header.className = "ovarall-rating-container";
    let headerTitle = document.createElement("h5");
    headerTitle.innerText = (options && options.translations && options.translations.overallRating) || defaultOptions.translations.overallRating;
    headerTitle.style.fontWeight = 400;
    headerTitle.style.fontSize = "14px";
    header.appendChild(headerTitle);

    let headerSubtitle = document.createElement("h6");
    headerSubtitle.style.fontSize = "12px";
    headerSubtitle.style.fontWeight = "normal";
    header.appendChild(headerSubtitle);

    let overallRating = document.createElement("div");
    overallRating.className = "overall-rating-stars";
    header.appendChild(overallRating);

    container.appendChild(header);

    let myRating = document.createElement("div");
    container.appendChild(myRating);

    let emptyState = document.createElement("div");
    emptyState.className = "empty-state-container";

    let emptyStateText = document.createElement("h5");
    emptyStateText.innerText = (options && options.translations && options.translations.emptyStateText) || defaultOptions.translations.emptyStateText;
    emptyState.appendChild(emptyStateText);

    Summaries.search(
        {
            filter: {
                "_buildfire.index.string1": ratingId,
            },
        },
        (err, summaries) => {
            if (err) return console.error(err);
            if (!summaries[0]) {
                getNotRatedUI(overallRating);
                return container.appendChild(emptyState);
            }

            const { count, total } = summaries[0];

            createStarsUI(overallRating, total / count, { hideAverage: true });

            headerSubtitle.innerText = `${(options && options.translations && options.translations.basedOn) || defaultOptions.translations.basedOn} ${count} ${(options && options.translations && options.translations.reviews) || defaultOptions.translations.reviews}`;
        }
    );

    checkIfUserIsAdmin((user, isAdmin) => {
        // Find review by current user
        Ratings.findRatingByUser(ratingId, user._id, (err, rating) => {
            if (err) return console.error(err);

            if (!rating) {
                let addRatingButton = document.createElement("div");
                addRatingButton.className = "add-rating-button primaryTheme";
                addRatingButton.innerText = options && options.translations && (options && options.translations && options.translations.addRating) || defaultOptions.translations.addRating;
                addRatingButton.addEventListener("click", () => {
                    openAddRatingScreen(ratingId, options, () => {
                        reRender();
                        reRenderComponent();
                    });
                });
                header.appendChild(addRatingButton);
            } else {
                const editRatingButton = document.createElement("div");
                editRatingButton.className = "edit-rating-button primaryTheme";
                editRatingButton.innerText = options && options.translations && (options && options.translations && options.translations.updateRating) || defaultOptions.translations.updateRating;
                editRatingButton.addEventListener("click", () => {
                    openAddRatingScreen(ratingId, options, () => {
                        reRender();
                        reRenderComponent();
                    });
                });
                let ratingUI = createRatingUI(rating, editRatingButton, options);
                if (isAdmin) {
                    addControlsToRating(ratingUI);
                }
                myRating.appendChild(ratingUI);
            }
        }
        );
        // Find reviews by other users
        Ratings.search(
            {
                filter: {
                    "_buildfire.index.string1": ratingId,
                    "_buildfire.index.number1": 1,
                    "_buildfire.index.array1": {
                        "$ne": user._id
                    },
                },
            },
            (err, ratings) => {
                if (err) return console.error(err);

                ratings.forEach((rating) => {
                    let ratingUI = createRatingUI(rating);
                    if (isAdmin) {
                        addControlsToRating(ratingUI);
                    }
                    container.appendChild(ratingUI);
                });
                const ratingsScreenContainer = document.getElementById("ratingsScreenContainer");
                if (ratingsScreenContainer) document.body.removeChild(ratingsScreenContainer);
                document.body.appendChild(container);
                buildfire.spinner.hide();
            }
        );
    });

    const reRender = () => {
        openRatingsScreen(ratingId, options, reRenderComponent);
    };
}

function checkIfUserIsAdmin(cb) {
    buildfire.auth.getCurrentUser((err, loggedInUser) => {
        if (err || !loggedInUser) {
            return buildfire.auth.login(
                { allowCancel: true, showMenu: true },
                (err, user) => {
                    if (user) return checkIfUserIsAdmin(cb);
                }
            );
        }
        if (!loggedInUser.tags) return cb(loggedInUser, false);
        Object.keys(loggedInUser.tags).forEach(appId => {
            let tagIndex = loggedInUser.tags[appId].findIndex(tagObject => tagObject.tagName == ADMIN_TAG);
            if (tagIndex != -1) return cb(loggedInUser, true);
        });
        return cb(loggedInUser, false);
    });
}

function formatTime(date) {
    return new Date(date).toLocaleDateString();
}

function closeRatingsScreen() {
    let ratingsScreen = document.querySelector(".ratings-screen");

    document.body.removeChild(ratingsScreen);
}

function createStarsUI(container, averageRating, options, ratingId, reRender, isFromWysiwyg) {
    const { hideAverage, showRatingsOnClick } = options;

    let content, containerStylesWysiwyg;

    if (!isFromWysiwyg) {
        container.innerHTML = "";
        container.classList.add("flex-center");
    } else {
        content = container.innerHTML;
        content = content.split("★ ★ ★ ★ ★")

        if (container.children && container.children[0]) {
            containerStylesWysiwyg = container.children[0].style;
        }
        container.innerHTML = "";
    }
    for (let i = 1; i < 6; i++) {
        let star = document.createElement("span");
        star.innerHTML = FULL_STAR;
        star.className = "full-star";

        if (i > averageRating && i === Math.trunc(averageRating) + 1) {
            star.innerHTML = `<span style="opacity: 0.3">${FULL_STAR}</span>`;
            let percentage = (averageRating - Math.trunc(averageRating)) * 100;
            star.style.position = "relative";
            let otherHalf = document.createElement("span");
            otherHalf.innerHTML = FULL_STAR;
            otherHalf.className = "half-star";
            otherHalf.style.backgroundImage = `linear-gradient(to right, currentColor ${percentage}%, transparent ${percentage}%)`;
            star.appendChild(otherHalf);
        } else if (i > averageRating) {
            star.style.opacity = "0.3";
        }
        container.appendChild(star);
    }
    if (!hideAverage && averageRating > 0) {
        let averageRatingSpan = document.createElement("span");
        averageRatingSpan.className = "average-rating";
        averageRatingSpan.innerText = averageRating.toFixed(1);

        container.appendChild(averageRatingSpan);
    }

    if (showRatingsOnClick) {
        container.style.cursor = "pointer";
        container.addEventListener("click", () => {
            openRatingsScreen(ratingId, options, reRender);
        });
    }

    if (isFromWysiwyg) {
        if (content) {
            container.innerHTML = content[0] + container.innerHTML + content[1];
        }
        if (containerStylesWysiwyg) {
            container.style = container.style.cssText + containerStylesWysiwyg.cssText;
            if (container.children && container.children[0]) {
                container.children[0].style = container.style.cssText + containerStylesWysiwyg.cssText;
            }
        }
    }
}

function injectRatingComponent(container, ratingId, options = defaultOptions) {
    container.innerHTML = "";
    let ratings = document.createElement("div");
    ratings.className = "ratings";

    let reviewsContainer = document.createElement("div");
    reviewsContainer.className = "reviews-container";
    let originalRatingId = ratingId;

    if (options.pluginLevel === true) {
        let instanceId = buildfire.getContext().instanceId;
        ratingId = `${ratingId}-${instanceId}`;
    }

    ratings.addEventListener("click", () => {
        openRatingsScreen(ratingId, options, reRender);
    });

    ratings.appendChild(reviewsContainer);

    const getSummary = () => {
        Summaries.search(
            {
                filter: {
                    "_buildfire.index.string1": ratingId,
                },
            },
            (err, summaries) => {
                if (err) return console.err(err);

                if (!summaries || !summaries[0] || summaries[0].count === 0) {
                    summaries = [{ total: 0, count: 1 }]
                }

                let averageRating = summaries[0].total / summaries[0].count;
                createStarsUI(reviewsContainer, averageRating, { hideAverage: true }, ratingId, reRender);
            }
        );
    };

    getSummary();

    container.appendChild(ratings);

    const reRender = () => {
        injectRatingComponent(container, originalRatingId, options);
    };
}

function addControlsToRating(ratingElement) {
    let rating = JSON.parse(ratingElement.dataset.rating);
    rating = new Rating({ data: rating, id: rating.id });

    if (!rating.isActive) {
        let inActiveRating = document.createElement("div");
        inActiveRating.innerText = "This rating has been blocked";
        ratingElement.appendChild(inActiveRating);
    }

    let controls = document.createElement("div");

    let deleteButton = document.createElement("button");
    deleteButton.innerText = "Delete";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", () => {
        buildfire.notifications.confirm(
            {
                title: "Are you sure?",
                message: "Are you sure you want to remove this review?",
                confirmButton: { text: "Yes", key: "yes", type: "danger" },
                cancelButton: { text: "No", key: "no", type: "default" },
            },
            function (e, data) {
                if ((e && e !== 2) || (data && data.selectedButton.key === "yes")) {
                    Ratings.del(rating, (err, data) => {
                        let ratingElement = document.getElementById(data.rating.id);
                        ratingElement.parentElement.removeChild(ratingElement);
                    });
                }
            }
        );
    });

    let blockButton = document.createElement("button");
    blockButton.innerText = "Block";
    blockButton.className = "delete-button";
    blockButton.addEventListener("click", () => {
        buildfire.notifications.confirm(
            {
                title: "Are you sure you want to block this review?",
                message: "User will not be able to submit another review for this item",
                confirmButton: { text: "Yes", key: "yes", type: "danger" },
                cancelButton: { text: "No", key: "no", type: "default" },
            },
            function (e, data) {
                if ((e && e !== 2) || (data && data.selectedButton.key === "yes")) {
                    Ratings.softDel(rating, (err, data) => {
                        // let ratingElement = document.getElementById(data.rating.id);
                        // ratingElement.parentElement.removeChild(ratingElement)
                    });
                }
            }
        );
    });
    controls.appendChild(deleteButton);
    controls.appendChild(blockButton);

    ratingElement.appendChild(controls);
}

function onRating() {

}

buildfire.components.ratingSystem = {
    injectRatings,
    injectRatingComponent,
    openAddRatingScreen,
    openRatingsScreen,
    onRating
};

applyStyling();