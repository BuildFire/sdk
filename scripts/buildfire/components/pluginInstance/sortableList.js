'use strict';

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use pluginInstances sortableList components");

if (typeof (buildfire.notifications) == "undefined") throw ("please add notifications.js first to use pluginInstances sortableList components");

if (typeof (buildfire.components) == "undefined")
    buildfire.components = {};

if (typeof (buildfire.components.pluginInstance) == "undefined")
    buildfire.components.pluginInstance = {};

/*
 options: { //optional will also ecep a number for page index
    pageIndex: 0 ,
    pageSize: 20
 }
*/
buildfire.components.pluginInstance.getAllPlugins = function (options, callback) {
    //  var me = this;
    if (typeof (options) == "function") {
        callback = options;
        options = {
            pageIndex: 0,
            pageSize: 50
        };
    }
    else if (typeof (options) == "number") {
        options = {
            pageIndex: options,
            pageSize: 50
        };
    }

    if (!callback) {
        throw "Please provide a callback forget AllPlugins";
    }
    buildfire.pluginInstance.search(options, function (err, result) {
        if (err) {
            console.error("Error searching plugins: ", err);
        }
        var data = buildfire.components.pluginInstance._mapFromSearch(result);
        console.log(result)
        callback(err, { total: result.totalRecord, data: data });
    });
},

buildfire.components.pluginInstance._mapFromSearch = function (data) {
    var result = [], dataResult = [], dataResultLength = 0, currentPlugin = null, tempObj = null;
    if (data.result && data.result instanceof Array) {
        dataResult = data.result;
        dataResultLength = dataResult.length;
        for (var i = 0; i < dataResultLength; i++) {

            currentPlugin = dataResult[i];
            if (currentPlugin.data && currentPlugin.data._buildfire) {
                tempObj = {};

                tempObj.folderName = currentPlugin.data._buildfire.pluginType.result[0].folderName;
                tempObj.instanceId = currentPlugin.data.instanceId;
                tempObj.iconUrl = currentPlugin.data.iconUrl;
                tempObj.pluginTypeId = currentPlugin.data._buildfire.pluginType.data;
                tempObj.pluginTypeName = currentPlugin.data._buildfire.pluginType.result[0].name;
                tempObj.title = currentPlugin.data.title;
                tempObj.hasAccess = currentPlugin.hasAccess === undefined?true:currentPlugin.hasAccess;
                tempObj.iconClassName = currentPlugin.data.iconClassName;
                result.push(tempObj);
                tempObj = null;
                currentPlugin = null;
            }
        }
    }
    return result;
};

// This is the class that will be used in the plugin content, design, or settings sections
buildfire.components.pluginInstance.sortableList = function (selector, items, dialogOptions, loadAllItems, hideLoadButton, widgetOptions) {
    // sortableList requires Sortable.js
    if (typeof (Sortable) == "undefined") throw ("please add Sortable first to use sortableList components");
    this.selector = selector;
    this.items = [];
    this.loadedInstances = [];
    this.checkId = "loadAllPlugins" + Math.floor((Math.random() * 1000) + 1);
    this.loadAllSelector = "#" + this.checkId;
    this.hideLoadButton = hideLoadButton;
    this._loadAllItems = loadAllItems ? true : false;
    this.dialogOptions = typeof (dialogOptions) == "object" && dialogOptions != null ? dialogOptions : { showIcon: true, confirmDeleteItem: true };
    this.widgetOptions = widgetOptions || { itemEditable: false, navigationCallback : buildfire.navigation.navigateTo };
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
    // This will be triggered when the user checks to load all plugins option
    onLoadAll: function (items) {
        console.warn("please handle onLoadAll", items);
    },
    // This will be triggered when you delete an item
    onUnloadAll: function () {
        console.warn("please handle onUnloadAll");
    },
    loadAllItems: function () {
        this._loadAllItems = true;
        this.selector.querySelector(this.loadAllSelector).setAttribute("checked", true);
        this._toggleAddButton("disable");
    },
    // this method allows you to replace the slider image or append to then if appendItems = true
    loadItems: function (items, appendItems, showPlugin) {
        if (items && items instanceof Array) {
            if (!appendItems && this.items.length !== 0) {
                // here we want to remove any existing items since the user of the component don't want to append items
                this._removeAll();
            }
            if (appendItems == 'loadAll' || showPlugin == 'loadAll') {
                this._loadAllItems = true;
                this.selector.querySelector(this.loadAllSelector).setAttribute("checked", true);
                this._toggleAddButton("disable");
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
            media = null,
            details = document.createElement("div"),
            title = this.widgetOptions.itemEditable ? document.createElement("a") : document.createElement("span"),
            buttonsWrapper = document.createElement("div"),
            deleteButton = document.createElement("span");

        // Add the required classes to the elements
        wrapper.className = "d-item clearfix";
        moveHandle.className = "icon icon-menu cursor-grab pull-left";
        details.className = "copy pull-right";
        title.className = "title ellipsis item-title";
        buttonsWrapper.className = "pull-right";
        deleteButton.className = "btn-icon btn-delete-icon btn-danger transition-third";

        title.innerHTML = item.title;

        // Append elements to the DOM
        wrapper.appendChild(moveHandle);

        if (this.dialogOptions.showIcon == true) {
            mediaHolder = document.createElement("div");
            mediaHolder.className = "media-holder pull-left";
            if (item.iconUrl) {
                media = document.createElement("img");
                media.src = this._resizeImage(item.iconUrl, { width: 80, height: 40 });
                mediaHolder.appendChild(media);
            } else if (item.iconClassName) {
                media = document.createElement("i");
                media.className = "main-icon " + item.iconClassName;
                mediaHolder.appendChild(media);
            }

            wrapper.appendChild(mediaHolder);
        }

        details.appendChild(title);
        buttonsWrapper.appendChild(deleteButton);
        details.appendChild(buttonsWrapper);
        wrapper.appendChild(details);
        me.itemsContainer.appendChild(wrapper);

        // initialize the required events on the current item
        var navigationCallback = this.widgetOptions.navigationCallback;
        var itemEditable = this.widgetOptions.itemEditable;
        (function () {
            if (itemEditable) {
				var att = document.createAttribute("href");
				att.value = "javascript:void(0);";
				title.setAttributeNode(att);
                title.addEventListener("click", function (e) {
                    e.preventDefault();
                    navigationCallback({ pluginId: item.pluginTypeId, instanceId: item.instanceId, folderName: item.folderName, title: item.title });
                });
            }

            deleteButton.addEventListener("click", function (e) {
                e.preventDefault();
                var deleteItem = function () {
                    var itemIndex = me._getItemIndex(item);
                    var itemId = me.items[itemIndex].instanceId;
                    var parent = deleteButton.parentNode.parentNode.parentNode;
                    if (itemIndex != -1) {
                        me.items.splice(itemIndex, 1);
                        me.loadedInstances.splice(me.loadedInstances.indexOf(itemId), 1);
                        parent.parentNode.removeChild(parent);
                        me.onDeleteItem(item, itemIndex);
                    }
                };
                if (me.dialogOptions.confirmDeleteItem) {
                    buildfire.notifications.confirm({
                        title: "Remove Feature",
                        message: '<p>Are you sure you want to do this?</p><p class="margin-zero">Note: If you would like to add it again, you can do so by clicking the button above.</p>',
                        buttonLabels: ["Delete", "Cancel"],
                        target: e.currentTarget
                    }, function (e) {
                        deleteItem();
                    }.bind(this));
                } else {
                    deleteItem();
                }
            });
        })(item);
    },

    _getOffset: function (el) {
        el = el.getBoundingClientRect();
        return {
            left: el.left + window.scrollX,
            top: el.top + window.scrollY
        }
    },
    // render the basic template HTML
    _renderTemplate: function () {
        var componentContainer = document.createElement("div");
        var componentName = document.createElement("div");
        var contentContainer = document.createElement("div");
        var buttonContainer = document.createElement("div");
        var getAllContainer = document.createElement("div");
        var getAllCheckbox = document.createElement("input");
        var getAlllabel = document.createElement("label");
        var button = document.createElement("button");
        var sliderContainer = document.createElement("div");

        getAllCheckbox.setAttribute("type", "checkbox");
        if (this._loadAllItems) {
            getAllCheckbox.setAttribute("checked", "checked");
        } else {
            getAllCheckbox.removeAttribute("checked");
        }

        componentContainer.className = "item clearfix row margin-bottom-fifteen";
        componentName.className = "labels col-md-3 padding-right-zero pull-left";
        componentName.innerHTML = "Features";
        contentContainer.className = "main col-md-9 pull-right";
        buttonContainer.className = "clearfix";
        getAllContainer.className = "checkbox checkbox-primary";
        button.className = "btn btn-success pull-left add-new-item";
        sliderContainer.className = "carousel-items hide-empty draggable-list-view margin-top-twenty border-radius-four border-grey";

        button.innerHTML = "Add Feature";
        getAlllabel.innerHTML = "Load all features";
        getAlllabel.setAttribute("for", this.checkId);
        getAllCheckbox.id = this.checkId;

        getAllContainer.appendChild(getAllCheckbox);
        getAllContainer.appendChild(getAlllabel);
        componentContainer.appendChild(componentName);
        buttonContainer.appendChild(button);
        contentContainer.appendChild(buttonContainer);
        contentContainer.appendChild(getAllContainer);
        contentContainer.appendChild(sliderContainer);
        componentContainer.appendChild(contentContainer);
        if (this.hideLoadButton) {
            getAllContainer.style.display = "none";
        }
        this.selector.appendChild(componentContainer);
    },
    // initialize the generic events
    _initEvents: function () {
        var me = this;
        var oldIndex = 0;
        // initialize add new item button
        me.selector.querySelector(".add-new-item").addEventListener("click", function () {
            me._openPluginInstance({}, function (plugins) {
                var newInstances = 0, pluginsLength, addedItems = [];
                if (plugins instanceof Array) {
                    pluginsLength = plugins.length;
                    for (var i = 0; i < pluginsLength; i++) {
                        if (me.loadedInstances.indexOf(plugins[i].instanceId) == -1) {
                            me.items.push(plugins[i]);
                            addedItems.push(plugins[i]);
                            me._appendItem(plugins[i]);
                            me.loadedInstances.push(plugins[i].instanceId);
                            newInstances++;
                        }
                    }

                    if (newInstances > 0) {
                        me.onAddItems(addedItems);
                    }
                }
            });
        });

        me.selector.querySelector(this.loadAllSelector).addEventListener("change", function () {
            if (this.checked) {
                me._toggleAddButton("disable");

                // remove all selected plugins from this.items and from the DOM
                // me._removeAll(); //Commented this method to Implement the feature of pivital ticket #113777595

                me.onLoadAll();

            } else {
                me.onUnloadAll();
                me._toggleAddButton("enable");
            }
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
    },
    _toggleAddButton: function (status) {
        var buttonSelector = this.selector.querySelector(".add-new-item");
        if (status == "enable") {
            buttonSelector.removeAttribute("disabled");
        } else {
            buttonSelector.setAttribute("disabled", "disabled");
        }
    }
};