'use strict';

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use carousel components");

// jQuery me be need later, please uncomment this line when you want to use jQuery in this component
// if (typeof ($) == "undefined") throw ("please add JQuery first to use carousel components");

if (typeof (buildfire.components) == "undefined")
    buildfire.components = {};

if (typeof (buildfire.components.carousel) == "undefined")
    buildfire.components.carousel = {};

buildfire.components.carousel._resizeImage = function (url, options) {
    if (!url) {
        return "";
    }
    else {
        return buildfire.imageLib.resizeImage(url, options);
    }
};


// need to be in a public method later
buildfire.components.carousel._getDomSelector = function (selector) {
    if (selector && selector.nodeType && selector.nodeType === 1) {
        return selector;
    } else if (typeof (selector) === "string") {
        selector = document.querySelector(selector);
        if (selector) {
            return selector;
        }
        throw "selector is not a valid DOM selector";
    }
    throw "selector is not a valid DOM element nor string selector";
}

// This is the class that will be used in the plugin content, design, or settings sections
buildfire.components.carousel.editor = function (selector, items) {
    // carousel editor requires Sortable.js
    if (typeof (Sortable) == "undefined") throw ("please add Sortable first to use carousel components");
    this.selector = selector;
    this.items = [];
    this.loadItems(items);
    this.init(selector);
};

// Carousel editor methods
buildfire.components.carousel.editor.prototype = {
    onItemChange: function (item) {
        throw ("please handle onItemChange");
    },
    onOrderChange: function (item, oldIndex, newIndex) {
        console.warn("please handle onOrderChange", item, oldIndex, newIndex);
    },
    onAddItem: function (item) {
        console.warn("please handle onAddItem", item);
    },
    onDeleteItem: function (item, index) {
        console.warn("please handle onDeleteItem", item);
    },
    loadItems: function (items, appendItems) {
        var me = this;
        if (!me.itemsContainer) {
            setTimeout(function () {
                me.loadItems(items, appendItems);
            }, 500);
            return;
        }

        if (items && items instanceof Array && items.length) {
            if (!appendItems && me.items.length) {
                // here we want to remove any existing items since the user of the component don't want to append items
                me._removeAll();
            }

            for (var i = 0; i < items.length; i++) {
                me.items.push(items[i]);
                me._appendItem(items[i]);
            }
        }
    },
    init: function (selector) {
        this.selector = buildfire.components.carousel._getDomSelector(selector);
        this._renderTemplate();
        this.itemsContainer = this.selector.querySelector(".carousel-items");
        this._initEvents();
    },
    _removeAll: function () {
        this.items = [];
        var fc = this.itemsContainer.firstChild;

        while (fc) {
            this.itemsContainer.removeChild(fc);
            fc = this.itemsContainer.firstChild;
        }
    },
    _appendItem: function (item) {
        var me = this,
            // Create the required DOM elements
            wrapper = document.createElement("div"),
            moveHandle = document.createElement("span"),
            mediaHolder = document.createElement("div"),
            image = document.createElement("img"),
            details = document.createElement("div"),
            title = document.createElement("span"),
            editButton = document.createElement("a"),
            deleteButton = document.createElement("span");

        // Add the required classes to the elements
        wrapper.className = "d-item";
        moveHandle.className = "icon icon-menu pull-left";
        mediaHolder.className = "media-holder pull-left";
        details.className = "copy pull-right";
        title.className = "title ellipsis";
        editButton.className = "text-primary text";
        deleteButton.className = "btn-icon btn-delete-icon btn-danger transition-third";

        image.src = buildfire.components.carousel._resizeImage(item.iconUrl, { width: 80, height: 40 });
        title.innerText = item.title;
        editButton.innerText = "Edit";

        // Append elements to the DOM
        wrapper.appendChild(moveHandle);
        wrapper.appendChild(mediaHolder);
        mediaHolder.appendChild(image);
        details.appendChild(title);
        details.appendChild(editButton);
        details.appendChild(deleteButton);
        wrapper.appendChild(details);
        me.itemsContainer.appendChild(wrapper);

        (function () {
            // initialize the click events on the current item
            editButton.addEventListener("click", function (e) {
                e.preventDefault();
                var itemIndex = me._getItemIndex(item);
                var parentElement = e.target.parentNode.parentNode;

                me._openActionItem(item, function (actionItem) {
                    me.items[itemIndex] = actionItem;
                    item = actionItem;
                    me.onItemChange(actionItem);
                    parentElement.querySelector("img").src = buildfire.components.carousel._resizeImage(actionItem.iconUrl, { width: 80, height: 40 });
                    parentElement.querySelector(".title").innerText = actionItem.title;
                });
            });

            deleteButton.addEventListener("click", function (e) {
                e.preventDefault();
                var itemIndex = me._getItemIndex(item);
                if (itemIndex != -1) {
                    me.items.splice(itemIndex, 1);
                    this.parentNode.parentNode.remove()
                    me.onDeleteItem(item, itemIndex);
                }
            });
        })(item);
    },
    _renderTemplate: function () {
        var componentContainer = document.createElement("div");
        var componentName = document.createElement("div");
        var contentContainer = document.createElement("div");
        var buttonContainer = document.createElement("div");
        var button = document.createElement("a");
        var sliderContainer = document.createElement("div");

        componentContainer.className = "item clearfix row margin-bottom-fifteen";
        componentName.className = "labels col-md-3 padding-right-zero pull-left";
        componentName.innerText = "Image Carousel";
        contentContainer.className = "main col-md-9 pull-right";
        buttonContainer.className = "clearfix";
        button.className = "btn btn-success pull-left add-new-carousel";
        sliderContainer.className = "carousel-items draggable-list-view margin-top-twenty border-radius-four border-grey";

        button.innerText = "Add Image";

        componentContainer.appendChild(componentName);
        buttonContainer.appendChild(button);
        contentContainer.appendChild(buttonContainer);
        contentContainer.appendChild(sliderContainer);
        componentContainer.appendChild(contentContainer);

        this.selector.appendChild(componentContainer);
    },
    _initEvents: function () {
        var me = this;
        var oldIndex = 0;
        // initialize add new item button
        me.selector.querySelector(".add-new-carousel").addEventListener("click", function () {
            me._openActionItem(null, function (actionItem) {
                me.items.push(actionItem);
                me._appendItem(actionItem);
                me.onAddItem(actionItem);
                console.log(this);
            });
        });

        // initialize the sort on the container of the items
        me.sortableList = Sortable.create(me.itemsContainer, {
            animation: 150,
            onUpdate: function (evt) {
                var newIndex = me._getSortableItemIndex(evt.item);
                var tmp = me.items[oldIndex];

                if (oldIndex < newIndex) {
                    for (var i = oldIndex + 1; i <= newIndex; i++) {
                        me.items[i - 1] = me.items[i];
                    }
                } else {
                    for (var i = oldIndex - 1; i >= newIndex; i--) {
                        me.items[i + 1] = me.items[i];
                    }
                }

                me.items[newIndex] = tmp;
                me.onOrderChange(tmp, oldIndex, newIndex);
            },
            onStart: function (evt) {
                oldIndex = me._getSortableItemIndex(evt.item);
            }
        });
    },
    _openActionItem: function (item, callback) {
        buildfire.actionItems.showDialog(item, { showIcon: true }, function (err, actionItem) {
            if (err)
                console.error("Error getting item details: ", err);
            else {
                if (actionItem) {
                    callback(actionItem);
                }
            }
        });
    },
    _getItemIndex: function (item) {
        return this.items.indexOf(item);
    },
    _getSortableItemIndex: function (item) {
        var index = 0;
        while ((item = item.previousSibling) != null) {
            index++;
        }
        return index;
    }
};

// This is the class that will be used in the mobile
buildfire.components.carousel.view = function (selector, items) {
    // carousel editor requires jssor.slider.min.js
    if (typeof ($JssorSlider$) == "undefined") throw ("please add JssorSlider first to use carousel components");
    this.selector = selector;
    this.items = [];
    this.width = window.innerWidth;
    this.height = Math.ceil(9 * this.width / 16);
    this.cssWidth = this.width + "px";
    this.cssHeight = this.height + "px";
    this._loadItems(items, false);
    this.init(selector);
}

// Carousel view methods
buildfire.components.carousel.view.prototype = {
    loadItems: function (items, appendItems) {
        //this._loadItems(items, appendItems);
        //this.jssor_slider1.$Pause();
        //this.jssor_slider1.removeEventListener()
        //this.selector.remove();
        //this._removeAll();
        //this.init(this.selector);

        //this._loadImages();

        //this._applySlider();


        //this._removeAll();

        //this._loadImages();
        //this._renderSlider();

        //this.jssor_slider1.AutoPlay = false;
        //var options = { $AutoPlay: false, $SlideWidth: this.width, $SlideHeight: this.height };

        //this.jssor_slider1 = new $JssorSlider$(options);
        //debugger;
        //this._applySlider();
        // remove all items
        // init the slider again
    },
    _removeAll: function () {
        // ahmed
        var fc = this.innerSlider.firstChild;

        while (fc) {
            this.innerSlider.removeChild(fc);
            fc = this.innerSlider.firstChild;
        }
    },
    _loadItems: function (items, appendItems) {
        if (!appendItems && this.items.length) {
            this.items = [];
        }

        if (items && items instanceof Array && items.length) {
            for (var i = 0; i < items.length; i++) {
                this.items.push(items[i]);
            }
        }
    },
    init: function (selector) {
        this.selector = buildfire.components.carousel._getDomSelector(selector);
        this._renderSlider();
        this._loadImages();
        if (this.items.length) {
            this._applySlider();
        } else {
            this._hideSlider();
        }
    },
    _hideSlider: function() {
        this.selector.style.display = "none";
    },
    _showSlider: function() {
        this.selector.style.display = "block";
    },
    _applySlider: function () {
        var options = { $AutoPlay: true, $SlideWidth: this.width, $SlideHeight: this.height };
        this.jssor_slider1 = new $JssorSlider$(this.selector, options);
    },
    _renderSlider: function () {
        this.selector.style.position = "relative";
        this.selector.style.top = "0px";
        this.selector.style.left = "0px";
        this.selector.style.width = this.cssWidth;
        this.selector.style.height = this.cssHeight;

        this.innerSlider = document.createElement("div");
        this.innerSlider.setAttribute("u", "slides");
        this.innerSlider.style.cursor = "pointer";
        this.innerSlider.style.position = "absolute";
        this.innerSlider.style.overflow = "hidden";
        this.innerSlider.style.left = "0px";
        this.innerSlider.style.top = "0px";
        this.innerSlider.style.width = this.cssWidth;
        this.innerSlider.style.height = this.cssHeight;

        this.selector.appendChild(this.innerSlider);
    },
    _loadImages: function () {
        var items = this.items;
        var itemsLength = items.length;

        for (var i = 0; i < itemsLength; i++) {
            this._appendItem(items[i]);
        }
    },
    _appendItem: function (item) {
        var slider = document.createElement("div");
        slider.addEventListener("click", function () {
            buildfire.actionItems.execute(item, function (err, result) {
                if (err) {
                    console.warn('Error openning slider action: ', err);
                }
            });
        });
        var image = document.createElement("img");
        image.setAttribute("u", "image");
        image.src = buildfire.components.carousel._resizeImage(item.iconUrl, { width: this.cssWidth, height: this.cssHeight });
        image.style.width = this.cssWidth;
        image.style.height = this.cssHeight;
        slider.appendChild(image);
        this.innerSlider.appendChild(slider);
    }
};