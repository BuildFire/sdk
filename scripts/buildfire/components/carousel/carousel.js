'use strict';

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use carousel components");

// jQuery me be need later, please uncomment this line when you want to use jQuery in this component
// if (typeof ($) == "undefined") throw ("please add JQuery first to use carousel components");

if (typeof (Sortable) == "undefined") throw ("please add Sortable first to use carousel components");


if (typeof (buildfire.components) == "undefined")
    buildfire.components = {};

if (typeof (buildfire.components.carousel) == "undefined")
    buildfire.components.carousel = {};

// This is the class that will be used in the plugin content, design, or settings sections
buildfire.components.carousel.editor = function (selector, items) {
    this.selector = selector;
    this.items = [];
    this.loadItems(items);
    this.init(selector);
}

// Carousel Editor methods
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
        var self = this;
        if (!self.itemsContainer) {
            setTimeout(function () {
                self.loadItems(items, appendItems);
            }, 500);
            return;
        }

        if (items && items instanceof Array && items.length) {
            if (!appendItems && self.items.length) {
                debugger;
                // here we want to remove any existing items since the user of the component don't want to append items
                self._removeAll();
            }

            for (var i = 0; i < items.length; i++) {
                self.items.push(items[i]);
                self._appendItem(items[i]);
            }
        }
    },
    init: function (selector) {
        var self = this;
        self.selector = self._getDomSelector(selector);
        self._loadTemplate(function (html) {
            self.selector.innerHTML = html;
            self.itemsContainer = self.selector.querySelector(".carousel-items");
            self._initEvents();
        });
    },
    _removeAll: function () {
        var self = this;
        self.items = [];
        var fc = self.itemsContainer.firstChild;

        while (fc) {
            self.itemsContainer.removeChild(fc);
            fc = self.itemsContainer.firstChild;
        }
    },
    _appendItem: function (item) {
        var self = this,
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
        image.className = "border-radius-four border-grey";
        details.className = "copy pull-right";
        title.className = "title ellipsis";
        editButton.className = "text-primary text";
        deleteButton.className = "btn-icon btn-delete-icon btn-danger transition-third";

        image.src = buildfire.imageLib.resizeImage(item.iconUrl, { width: 80, height: 40 });
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
        self.itemsContainer.appendChild(wrapper);

        (function () {
            // initialize the click events on the current item
            editButton.addEventListener("click", function (e) {
                e.preventDefault();
                var itemIndex = self._getItemIndex(item);
                var parentElement = e.target.parentNode.parentNode;

                self._openActionItem(item, function (actionItem) {
                    self.items[itemIndex] = actionItem;
                    item = actionItem;
                    self.onItemChange(actionItem);
                    parentElement.querySelector("img").src = actionItem.iconUrl;
                    parentElement.querySelector(".title").innerText = actionItem.title;
                });
            });

            deleteButton.addEventListener("click", function (e) {
                e.preventDefault();
                var itemIndex = self._getItemIndex(item);
                if (itemIndex != -1) {
                    self.items.splice(itemIndex, 1);
                    this.parentNode.parentNode.remove()
                    self.onDeleteItem(item, itemIndex);
                }
            });
        })(item);
    },
    _getDomSelector: function (selector) {
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
    },
    _loadTemplate: function (callback) {
        var xmlhttp,
            appRoot = document.location.pathname,
            templateUrl = appRoot.substr(0, appRoot.indexOf("/plugins/")) + "/scripts/buildfire/components/carousel/carousel.html";
        if (window.XMLHttpRequest) {
            // code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        }
        else {
            // code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                callback(xmlhttp.responseText);
            }
        }
        xmlhttp.open("GET", templateUrl, true);
        xmlhttp.send();
    },
    _initEvents: function () {
        var self = this;
        var oldIndex = 0;
        // initialize add new item button
        self.selector.querySelector(".add-new-carousel").addEventListener("click", function () {
            self._openActionItem(null, function (actionItem) {
                self.items.push(actionItem);
                self._appendItem(actionItem);
                self.onAddItem(actionItem);
            });
        });

        // initialize the sort on the container of the items
        self.sortableList = Sortable.create(self.itemsContainer, {
            animation: 150,
            onUpdate: function (evt) {
                var newIndex = self._getSortableItemIndex(evt.item);
                var tmp = self.items[oldIndex];

                if (oldIndex < newIndex) {
                    for (var i = oldIndex + 1; i <= newIndex; i++) {
                        self.items[i - 1] = self.items[i];
                    }
                } else {
                    for (var i = oldIndex - 1; i >= newIndex; i--) {
                        self.items[i + 1] = self.items[i];
                    }
                }

                self.items[newIndex] = tmp;
                self.onOrderChange(tmp, oldIndex, newIndex);
            },
            onStart: function (evt) {
                oldIndex = self._getSortableItemIndex(evt.item);
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
        var self = this;
        return self.items.indexOf(item);
    },
    _getSortableItemIndex: function (item) {
        var index = 0;
        while ((item = item.previousSibling) != null) {
            index++;
        }
        return index;
    }
};