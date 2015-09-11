'use strict';

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use sortableList components");

if (typeof (buildfire.components) == "undefined")
    buildfire.components = {};

if (typeof (buildfire.components.pluginInstance) == "undefined")
    buildfire.components.pluginInstance = {};

// This is the class that will be used in the plugin content, design, or settings sections
buildfire.components.pluginInstance.sortableList = function (selector, items, dialogOptions) {
    // sortableList requires Sortable.js
    if (typeof (Sortable) == "undefined") throw ("please add Sortable first to use sortableList components");
    this.selector = selector;
    this.items = [];
    this.loadedInstances = [];
    this.dialogOptions = typeof (dialogOptions) == "object" ? dialogOptions : { showIcon: true };
    this.init(selector);
    this.loadItems(items);
};

// sortableList editor methods
buildfire.components.pluginInstance.sortableList.prototype = {
    // will be called to initialize the setting in the constructor
    init: function (selector) {
        this.selector = this._getDomSelector(selector);
        this._renderTemplate();
        this.itemsContainer = this.selector.querySelector(".draggable-list-view");
        this._initEvents();
    },
    /* This will be triggered when the order of items changes
       Example: if you move the first item location to be the second this will return item object, 0, 1 */
    onOrderChange: function (item, oldIndex, newIndex) {
        console.warn("please handle onOrderChange", item, oldIndex, newIndex);
    },
    // This will be triggered when you add a new item, item index will be items.length
    onAddItems: function (items) {
        console.warn("please handle onAddItems", items);
    },
    // This will be triggered when you delete an item
    onDeleteItem: function (item, index) {
        console.warn("please handle onDeleteItem", item);
    },
    // this method allows you to replace the slider image or append to then if appendItems = true
    loadItems: function (items, appendItems) {
        if (items && items instanceof Array) {
            if (!appendItems && this.items.length !== 0) {
                // here we want to remove any existing items since the user of the component don't want to append items
                this._removeAll();
            }

            for (var i = 0; i < items.length; i++) {
                this.items.push(items[i]);
                this.loadedInstances.push(items[i].instanceId);
                this._appendItem(items[i]);
            }
        }
    },
    // allows you to append a single item or an array of items
    append: function (items) {
        if (!items)
            return;
        else if (!(items instanceof Array) && typeof (items) == "object")
            items = [items];

        this.loadItems(items, true);
    },
    // remove all items in list
    clear: function () {
        this._removeAll();
        this.onDeleteItem();
    },
    // remove all the DOM element and empty the items array
    _removeAll: function () {
        this.items = [];
        this.loadedInstances = [];
        var fc = this.itemsContainer.firstChild;

        while (fc) {
            this.itemsContainer.removeChild(fc);
            fc = this.itemsContainer.firstChild;
        }
    },
    // append new sortable item to the DOM
    _appendItem: function (item) {
        var me = this,
            // Create the required DOM elements
            wrapper = document.createElement("div"),
            moveHandle = document.createElement("span"),
            mediaHolder = null,
            image = null,
            details = document.createElement("div"),
            title = document.createElement("span"),
            buttonsWrapper = document.createElement("div"),
            navigateButton = document.createElement("span"),
            deleteButton = document.createElement("span");

        // Add the required classes to the elements
        wrapper.className = "d-item clearfix";
        moveHandle.className = "icon icon-menu cursor-grab pull-left";
        details.className = "copy pull-right";
        title.className = "title ellipsis item-title";
        buttonsWrapper.className = "pull-right";
        navigateButton.className = "btn-icon btn-link-icon btn-primary";
        deleteButton.className = "btn-icon btn-delete-icon btn-danger transition-third";

        title.innerHTML = item.title;

        // Append elements to the DOM
        wrapper.appendChild(moveHandle);

        if (this.dialogOptions.showIcon == true) {
            mediaHolder = document.createElement("div");
            mediaHolder.className = "media-holder pull-left";
            image = document.createElement("img");
            image.src = this._resizeImage(item.iconUrl, { width: 80, height: 40 });
            mediaHolder.appendChild(image);
            wrapper.appendChild(mediaHolder);
        }

        details.appendChild(title);
        buttonsWrapper.appendChild(navigateButton);
        buttonsWrapper.appendChild(deleteButton);

        details.appendChild(buttonsWrapper);
        wrapper.appendChild(details);
        me.itemsContainer.appendChild(wrapper);

        // initialize the required events on the current item
        (function () {
            navigateButton.addEventListener("click", function (e) {
                e.preventDefault();
                buildfire.navigation.navigateTo(item.pluginTypeId, item.instanceId, item.title);
            });

            deleteButton.addEventListener("click", function (e) {
                e.preventDefault();
                var itemIndex = me._getItemIndex(item);
                if (itemIndex != -1) {
                    me.items.splice(itemIndex, 1);
                    me.loadedInstances.splice(me.loadedInstances.indexOf(item), 1);
                    this.parentNode.parentNode.parentNode.remove()
                    me.onDeleteItem(item, itemIndex);
                }
            });
        })(item);
    },
    // render the basic template HTML
    _renderTemplate: function () {
        var componentContainer = document.createElement("div");
        var componentName = document.createElement("div");
        var contentContainer = document.createElement("div");
        var buttonContainer = document.createElement("div");
        var button = document.createElement("a");
        var sliderContainer = document.createElement("div");

        componentContainer.className = "item clearfix row margin-bottom-fifteen";
        componentName.className = "labels col-md-3 padding-right-zero pull-left";
        componentName.innerHTML = "Plugins";
        contentContainer.className = "main col-md-9 pull-right";
        buttonContainer.className = "clearfix";
        button.className = "btn btn-success pull-left add-new-item";
        sliderContainer.className = "carousel-items hide-empty draggable-list-view margin-top-twenty border-radius-four border-grey";

        button.innerHTML = "Add Plugin";

        componentContainer.appendChild(componentName);
        buttonContainer.appendChild(button);
        contentContainer.appendChild(buttonContainer);
        contentContainer.appendChild(sliderContainer);
        componentContainer.appendChild(contentContainer);

        this.selector.appendChild(componentContainer);
    },
    // initialize the generic events
    _initEvents: function () {
        var me = this;
        var oldIndex = 0;
        // initialize add new item button
        me.selector.querySelector(".add-new-item").addEventListener("click", function () {
            me._openPluginInstance({}, function (plugins) {
                var currentPlugin = null, newInstances = 0, pluginsLength, addedItems = [];
                // consider array ineasted of object
                if (plugins instanceof Array) {
                    pluginsLength = plugins.length;
                    for (var i = 0; i < pluginsLength; i++) {
                        currentPlugin = plugins[i];
                        if (me.loadedInstances.indexOf(currentPlugin.instanceId) == -1) {
                            me.items.push(currentPlugin);
                            addedItems.push(currentPlugin);
                            me._appendItem(currentPlugin);
                            me.loadedInstances.push(currentPlugin.instanceId);
                            newInstances++;
                        }
                    }

                    if (newInstances > 0) {
                        me.onAddItems(addedItems);
                    }

                }
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
    // a wrapper method over buildfire showDialog
    _openPluginInstance: function (options, callback) {
        buildfire.pluginInstance.showDialog(options, function (err, plugin) {
            if (err)
                console.error("Error getting item details: ", err);
            else {
                if (plugin) {
                    callback(plugin);
                }
            }
        });
    },
    // get item index in the items array
    _getItemIndex: function (item) {
        return this.items.indexOf(item);
    },
    // get item index from the DOM sortable elements
    _getSortableItemIndex: function (item) {
        var index = 0;
        while ((item = item.previousSibling) != null) {
            index++;
        }
        return index;
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
    _resizeImage: function (url, options) {
        if (!url) {
            return "";
        }
        else {
            return buildfire.imageLib.resizeImage(url, options);
        }
    }
};