'use strict';

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use carousel components");

if (typeof (buildfire.components) == "undefined")
    buildfire.components = {};

if (typeof (buildfire.components.carousel) == "undefined")
    buildfire.components.carousel = {};

var defaultCarouselImages = [{
    "action": "noAction",
    "iconUrl": "http://buildfire.imgix.net/b55ee984-a8e8-11e5-88d3-124798dea82d/7ef5f050-134f-11e6-bd0b-2511d1715baa.jpeg",
    "title": "image"
}, {
    "action": "noAction",
    "iconUrl": "http://buildfire.imgix.net/b55ee984-a8e8-11e5-88d3-124798dea82d/7e028fa0-134f-11e6-b7ce-51a0b9ba84fd.jpg",
    "title": "image"
}];

buildfire.components.carousel._resizeImage = function (url, options) {
    if (!url) {
        return "";
    }
    else {
        return buildfire.imageLib.resizeImage(url, options);
    }
};

buildfire.components.carousel._cropImage = function (url, options) {
    if (!url) {
        return "";
    }
    else {
        return buildfire.imageLib.cropImage(url, options);
    }
};

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
};

buildfire.components.carousel.deleteData = function (name, callback) {
    if ((!name || 0 === name.length)) callback(null, null);
    var filter = { filter: { "$json.name": name } };
    buildfire.datastore.search(filter, 'carouselSettings', function (err, response) {
        var first = response[0];
        if (err)
            callback(err, null);
        buildfire.datastore.delete(first.id, 'carouselSettings', function (err, status) {
            if (err)
                callback(err, null);
            else
                callback(null, status);
        });
    });
}

buildfire.components.carousel.getPlaceHolders = function (name, callback) {
    if ((!name || 0 === name.length)) callback(null, []);
    var filter = { filter: { "$json.name": name } };
    buildfire.datastore.search(filter, 'carouselSettings', function (err, response) {
        var first = response[0];
        if (err)
            callback(err, []);
        if (!first || !first.data || !first.data.items)
            callback(null, []);
        else callback(null, first.data.items);
    });
}

// This is the class that will be used in the plugin content, design, or settings sections
buildfire.components.carousel.editor = function (selector, items, name) {//added
    if (typeof name === "string") {
        if (/^[a-zA-Z]+$/.test(name)) {
            if (name.length < 20)
                this.name = name;
            else throw "Carousel name is too long!";
        } else throw "Carousel name must contain only letters!";
    };
    this.saveImages = (typeof name === "string");
    // carousel editor requires Sortable.js
    if (typeof (Sortable) == "undefined") throw ("please add Sortable first to use carousel components");
    // this.settings=(speed)?{speed:speed,order:order,display:display}:null;//added
    this.selector = selector;
    this.items = [];
    this.init(selector);
};


// Carousel editor methods
buildfire.components.carousel.editor.prototype = {
    // will be called to initialize the setting in the constructor
    init: function (selector) {
        this.selector = buildfire.components.carousel._getDomSelector(selector);
        this._renderTemplate();
        this._appendSettings();
        this.itemsContainer = this.selector.querySelector(".carousel-items");
        this._initEvents();
    },
    // This will be triggered when you edit existing item details
    onItemChange: function (item, index) {
        if (!this.saveImages)
            throw ("please handle onItemChange");
    },
    /* This will be triggered when the order of items changes
     Example: if you move the first item location to be the second this will return item object, 0, 1 */
    onOrderChange: function (item, oldIndex, newIndex) {
        if (!this.saveImages)
            console.warn("please handle onOrderChange", item, oldIndex, newIndex);
    },
    // This will be triggered when you add a new item, item index will be items.length
    onAddItems: function (items) {
        if (!this.saveImages)
            console.warn("please handle onAddItems", item);
    },
    onOptionSpeedChange: function (speed) {//added
        // console.warn("please handle onOptionSpeedChange", speed);//added
    },//added
    onOptionOrderChange: function (order) {//added
        // console.warn("please handle onOptionOrderChange", order);//added
    },//added
    onOptionDisplayChange: function (display) {//added
        //console.warn("please handle onOptioDisplayChange", display);//added
    },//added
    // This will be triggered when you delete an item
    onDeleteItem: function (item, index) {
        if (!this.saveImages)
            console.warn("please handle onDeleteItem", item);
    },
    setOptionSpeed: function (speed) {//added
    },//added
    setOptionOrder: function (order) {//added
    },//added
    setOptionDisplay: function (display) {//added
    },//added
    // this method allows you to replace the slider image or append to then if appendItems = true
    loadItems: function (items, appendItems) {
        if (items && items instanceof Array) {
            if (!appendItems && this.items.length !== 0) {
                // here we want to remove any existing items since the user of the component don't want to append items
                this._removeAll();
            }
            for (var i = 0; i < items.length; i++) {
                this.items.push(items[i]);
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
        if (this.saveImages) this._saveState();
    },
    // remove all the DOM element and empty the items array
    _removeAll: function () {
        this.items = [];
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
            mediaHolder = document.createElement("div"),
            image = document.createElement("img"),
            details = document.createElement("div"),
            title = document.createElement("span"),
            actionsWrapper = document.createElement("div"),
            editButton = document.createElement("a"),
            deleteButton = document.createElement("span");

        // Add the required classes to the elements
        wrapper.className = "d-item";
        moveHandle.className = "icon icon-menu pull-left";
        mediaHolder.className = "media-holder pull-left";
        details.className = "copy pull-right";
        title.className = "title ellipsis";
        actionsWrapper.className = "pull-right";
        editButton.className = "text-primary text";
        deleteButton.className = "btn-icon btn-delete-icon btn-danger transition-third";

        image.src = buildfire.components.carousel._resizeImage(item.iconUrl, { width: 80, height: 40 });
        title.innerHTML = item.title;
        editButton.innerHTML = (item.action && item.action != "noAction") ? "Edit Action/Link" : "Add Action/Link";

        // Append elements to the DOM
        wrapper.appendChild(moveHandle);
        wrapper.appendChild(mediaHolder);
        mediaHolder.appendChild(image);
        details.appendChild(title);

        actionsWrapper.appendChild(editButton);
        actionsWrapper.appendChild(deleteButton);

        details.appendChild(actionsWrapper);

        wrapper.appendChild(details);
        me.itemsContainer.appendChild(wrapper);

        // initialize the required events on the current item
        (function () {
            editButton.addEventListener("click", function (e) {
                e.preventDefault();
                var itemIndex = me._getItemIndex(item);
                var currentTarget = e.target;
                var parentElement = currentTarget.parentNode.parentNode.parentNode;
                me._openActionItem(item, function (actionItem) {
                    me.items[itemIndex] = actionItem;
                    item = actionItem;
                    me.onItemChange(actionItem, itemIndex);
                    if (me.saveImages) me._saveState();
                    parentElement.querySelector("img").src = buildfire.components.carousel._resizeImage(actionItem.iconUrl, {
                        width: 80,
                        height: 40
                    });
                    parentElement.querySelector(".title").innerHTML = actionItem.title;
                    currentTarget.innerHTML = actionItem.action && actionItem.action != "noAction" ? "Edit Action" : "Add Action/Link";
                });
            });

            deleteButton.addEventListener("click", function (e) {
                e.preventDefault();
                var itemIndex = me._getItemIndex(item),
                    parent = this.parentNode.parentNode.parentNode;
                if (itemIndex != -1) {
                    me.items.splice(itemIndex, 1);
                    parent.parentNode.removeChild(parent);
                    me.onDeleteItem(item, itemIndex);
                    if (me.saveImages) me._saveState();
                }
            });
        })(item);
    },
    _saveState: function () {
        let saveObj = {
            settings: { speed: this.state.Speed, order: this.state.Order, display: this.state.Display },
            text: { visible: this.state.Visible, background: this.state.Background, position: this.state.Positions, alignment: this.state.Alignment, fontSize: this.state["Font Size"] }
        };
        var me = this;
        if (me.name && 0 != me.name.length) saveObj.name = me.name;
        if (me.saveImages) saveObj.items = me.items;
        if (me.myId == "none")
            buildfire.datastore.insert(saveObj, 'carouselSettings', function (err, data) {
                if (err)
                    console.log('there was a problem saving your data');
                me.myId = data.id;
            });
        else
            buildfire.datastore.update(me.myId, saveObj, 'carouselSettings', (err, record) => {
                if (err)
                    console.log('there was a problem saving your data');
            });
    },
    _appendSettings: function () {
        var me = this;
        me.control = {
            "Settings": {
                "Speed": [{ "text": "Still", "value": 0 }, { "text": "1 sec", "value": 1000 }, { "text": "2 sec", "value": 2000 },
                { "text": "3 sec", "value": 3000 }, { "text": "4 sec", "value": 4000 }, { "text": "5 sec", "value": 5000 }, { "text": "7 sec", "value": 7000 },
                { "text": "10 sec", "value": 10000 }, { "text": "15 sec", "value": 15000 }],
                "Order": [{ "text": "In order", "value": 0 }, { "text": "Random", "value": 1 }],
                "Display": [{ "text": "All images", "value": 0 }, { "text": "One image", "value": 1 }]
            },
            "Hover Text": {
                "Visible": false,
                "Font Size": [{ "text": "11px", "value": 11 }, { "text": "12px", "value": 12 },
                { "text": "14px", "value": 14 }, { "text": "18px", "value": 18 }, { "text": "24px", "value": 24 }, { "text": "30px", "value": 30 }, { "text": "36px", "value": 36 }, { "text": "48px", "value": 48 }
                    , { "text": "60px", "value": 60 }, { "text": "72px", "value": 72 }],
                "Positions": [{ "text": "Top", "value": 0 }, { "text": "Middle", "value": 1 }, { "text": "Bottom", "value": 2 }],
                "Alignment": [{ "text": "Left", "value": 0 }, { "text": "Center", "value": 1 }, { "text": "Right", "value": 2 }],
                "Background": true
            }
        };
        var filter;
        if ((!me.name || 0 === me.name.length)) filter = {};
        else filter = { filter: { "$json.name": me.name } };
        buildfire.datastore.search(filter, 'carouselSettings', function (err, response) {
            var first = response[0];
            if (err || !first || !first.data || !first.data.settings || !first.data.text) {
                buildfire.datastore.getWithDynamicData((err, obj) => {
                    if (err || !obj || !obj.data || !obj.data.content) {
                        me.state = {
                            "Speed": me.control.Settings.Speed[5].value, "Order": me.control.Settings.Order[0].value, "Display": me.control.Settings.Display[0].value,
                            "Visible": me.control["Hover Text"].Visible, "Background": me.control["Hover Text"].Background, "Positions": me.control["Hover Text"].Positions[1].value, "Alignment": me.control["Hover Text"].Alignment[1].value,
                            "Font Size": me.control["Hover Text"]["Font Size"][4].value
                        };
                    } else {
                        me.state = {
                            "Speed": (!obj.data.content.speed) ? me.control.Settings.Speed[5].value : obj.data.content.speed
                            , "Order": (!obj.data.content.order) ? me.control.Settings.Order[0].value : obj.data.content.order,
                            "Display": (!obj.data.content.display) ? me.control.Settings.Display[0].value : obj.data.content.display,
                            "Visible": me.control["Hover Text"].Visible, "Background": me.control["Hover Text"].Background, "Positions": me.control["Hover Text"].Positions[1].value, "Alignment": me.control["Hover Text"].Alignment[1].value,
                            "Font Size": me.control["Hover Text"]["Font Size"][4].value
                        };
                    }
                    me.myId = "none";
                    if (me.saveImages) me.items = defaultCarouselImages;
                    me._saveState();
                    me.loadItems(me.items);
                    me._createOptions();
                });
            } else {
                me.myId = first.id;
                me.state = {
                    "Speed": first.data.settings.speed, "Order": first.data.settings.order, "Display": first.data.settings.display,
                    "Visible": first.data.text.visible, "Background": first.data.text.background, "Positions": first.data.text.position, "Alignment": first.data.text.alignment,
                    "Font Size": first.data.text.fontSize
                };
                if (first.data.items && first.data.items.length > 0) {
                    me.items = first.data.items;
                }
                me.loadItems(me.items);
                me._createOptions();
            }
        });
    },
    _createOptions: function () {
        var me = this;
        Object.keys(me.control).forEach(attribute => {
            var controlDropDown = document.createElement("div");// added
            controlDropDown.className = "dropdown";
            controlDropDown.setAttribute("style", "overflow: unset; display: inline-block; margin-left: 10px;");//added
            var btn = document.createElement("button");
            btn.className = "btn btn-default dropdown-toggle";
            btn.innerHTML = attribute + "&#160;";

            var dropDownIcon = document.createElement("span");
            dropDownIcon.className = "caret";
            btn.appendChild(dropDownIcon);
            controlDropDown.appendChild(btn);//added


            var controlDropDownMenu = document.createElement("ul");
            controlDropDownMenu.className = "dropdown-menu";
            controlDropDownMenu.setAttribute("style", "min-width: 0px !important; overflow: unset; margin-top: 0px;");

            var clickFields = [];
            var clickOptions = [];

            var sideBarHidden = "min-width: 130px !important;top: 0; left: 100%;  margin-top: -1px;";
            var sideBarVisible = "display: block;" + sideBarHidden;
            var subMenuStyleEnabled = "overflow: unset; margin-top: 0px;";
            var subMenuStyleDisabled = subMenuStyleEnabled + " opacity:0.2;";
            Object.keys(me.control[attribute]).forEach(key => {
                let controlElement = document.createElement("li");
                let controlLabel = document.createElement("a");
                controlElement.appendChild(controlLabel);

                if (typeof me.control[attribute][key] === "boolean") {
                    if (key == "Visible") controlLabel.innerHTML = ((me.state.Visible) ? "<span>&#10004;</span>&#160;&#160;" + key : key);
                    if (key == "Background") {
                        controlLabel.innerHTML = ((me.state.Background) ? "<span>&#10004;</span>&#160;&#160;" + key : key);
                        controlLabel.style.opacity = (me.state.Visible) ? 1 : 0.2;
                    }
                    controlLabel.className = key.replace(" ", "");
                    clickFields.push({ attribute: attribute, name: key, label: controlLabel, showObj: null, list: false });
                }
                else {
                    controlLabel.innerHTML = key;
                    let controlIcon = document.createElement("span");
                    controlIcon.className = "caret";
                    controlIcon.setAttribute("style", `float:right; -webkit-transform: rotate(-90deg); -moz-transform: rotate(-90deg); 
                    -o-transform: rotate(-90deg); -ms-transform: rotate(-90deg); transform: rotate(-90deg);`);
                    controlLabel.appendChild(controlIcon);
                    controlElement.className = "dropdown-submenu " + key.replace(" ", "");
                    controlElement.setAttribute("style", (me.state.Visible || Object.keys(me.control)[1] != attribute) ? subMenuStyleEnabled : subMenuStyleDisabled);
                    let controlList = document.createElement("ul");
                    controlList.className = "dropdown-menu";
                    controlList.setAttribute("style", sideBarHidden);
                    me.control[attribute][key].forEach(el => {//added
                        let opt = document.createElement('li');//added
                        let optA = document.createElement('a');
                        optA.innerHTML = ((el.value == me.state[key]) ? "<span>&#10004;</span> " : "&#160;&#160;") + el.text;//added
                        clickOptions.push({ key: key, text: el.text, value: el.value, element: optA });
                        opt.appendChild(optA);
                        controlList.appendChild(opt);//added
                    });
                    controlElement.appendChild(controlList);
                    clickFields.push({ attribute: attribute, name: key, label: controlLabel, showObj: controlList, list: true });
                }
                controlDropDownMenu.appendChild(controlElement);

            });

            clickFields.forEach((el, index) => {
                var objItems = [...clickFields];
                if (clickFields.length == 5) { objItems.shift(); objItems.pop(); index = index - 1; }
                var first = objItems[(objItems.length + index + 1) % objItems.length]
                    , second = objItems[(objItems.length + index + 2) % objItems.length]
                if (el.list) {
                    el.label.addEventListener('click', function (e) {
                        if (me.state.Visible || Object.keys(me.control)[1] != el.attribute) {
                            el.showObj.setAttribute("style", sideBarVisible);//added
                            if (first && first.showObj && first != el) first.showObj.setAttribute("style", sideBarHidden);
                            if (second && second.showObj && second != el) second.showObj.setAttribute("style", sideBarHidden);
                        }
                    });
                } else {
                    el.label.addEventListener('click', function (e) {
                        if (el.name == "Visible") {
                            var third = objItems[(objItems.length + index + 3) % objItems.length],
                                fourth = clickFields[(clickFields.length + index + 5) % clickFields.length];
                            me.state.Visible = !me.state.Visible;
                            el.label.innerHTML = (me.state.Visible) ? "<span>&#10004;</span>&#160;&#160;" + el.name : el.name;
                            first.showObj.setAttribute("style", sideBarHidden);
                            second.showObj.setAttribute("style", sideBarHidden);
                            if (third) third.showObj.setAttribute("style", sideBarHidden);
                            let firstSubMenu = me.selector.querySelector("." + first.name.replace(" ", "")),
                                secondSubMenu = me.selector.querySelector("." + second.name.replace(" ", "")),
                                thirdSubMenu = me.selector.querySelector("." + third.name.replace(" ", "")),
                                fourthOption = me.selector.querySelector("." + fourth.name.replace(" ", ""));
                            firstSubMenu.setAttribute("style", (me.state.Visible) ? subMenuStyleEnabled : subMenuStyleDisabled);
                            secondSubMenu.setAttribute("style", (me.state.Visible) ? subMenuStyleEnabled : subMenuStyleDisabled);
                            if (thirdSubMenu) thirdSubMenu.setAttribute("style", (me.state.Visible) ? subMenuStyleEnabled : subMenuStyleDisabled);
                            fourthOption.style.opacity = (me.state.Visible) ? 1 : 0.2;
                            me._saveState();
                        } else {
                            if (me.state.Visible) {
                                me.state.Background = !me.state.Background;
                                el.label.innerHTML = (me.state.Background) ? "<span>&#10004;</span>&#160;&#160;" + el.name : el.name;
                                me._saveState();
                            }
                        }
                    });
                }
            });

            clickOptions.forEach(option => {
                option.element.addEventListener('click', function (e) {
                    let findLast = clickOptions.find(element => element.key == option.key && element.value == me.state[option.key]);
                    if (findLast) findLast.element.innerHTML = "&#160;&#160;" + findLast.text;
                    option.element.innerHTML = "<span>&#10004;</span> " + option.text;
                    me.state[option.key] = option.value;
                    me._saveState();
                })
            });

            controlDropDown.appendChild(controlDropDownMenu);
            var container = me.selector.querySelector(".settings-container");
            container.appendChild(controlDropDown);//added

            controlDropDown.addEventListener('mouseleave', function (e) {
                if (controlDropDown.classList.contains('open')) {
                    controlDropDown.classList.remove('open');
                    clickFields.forEach(el => {
                        if (el.showObj) el.showObj.setAttribute("style", sideBarHidden);
                    });
                }
            })
            controlDropDown.addEventListener('mouseenter', function (e) {
                if (!controlDropDown.classList.contains('open')) {
                    controlDropDown.classList.add('open');
                }
            })
        });
    }
    ,
    // render the basic template HTML
    _renderTemplate: function () {
        var componentContainer = document.createElement("div");
        var componentName = document.createElement("span");
        var contentContainer = document.createElement("div");
        var buttonContainer = document.createElement("div");
        var button = document.createElement("a");
        var sliderContainer = document.createElement("div");


        componentContainer.className = "item clearfix row";
        componentName.className = "labels col-md-3 padding-right-zero pull-left";
        componentName.innerHTML = "Image Carousel";
        contentContainer.className = "main col-md-9 pull-right";
        buttonContainer.className = "clearfix settings-container";
        button.className = "btn btn-success pull-left add-new-carousel";
        sliderContainer.className = "carousel-items hide-empty draggable-list-view margin-top-twenty border-radius-four border-grey";

        button.innerHTML = "Add Image";

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

        me.selector.querySelector(".add-new-carousel").addEventListener("click", function () {
            me._openImageLib(function (imageUrls) {
                var newItems = [], currentItem = null;
                for (var i = 0; i < imageUrls.length; i++) {
                    currentItem = buildfire.actionItems.create(null, imageUrls[i], 'image');
                    if (!currentItem.action) {
                        currentItem.action = "noAction";
                    }

                    newItems.push(currentItem);
                    currentItem = null;
                }

                if (newItems.length) {
                    me.loadItems(newItems, true);
                    me.onAddItems(newItems);
                    if (me.saveImages) me._saveState();
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
                if (me.saveImages) me._saveState();
            },
            onStart: function (evt) {
                oldIndex = me._getSortableItemIndex(evt.item);
            }
        });
    },
    // a wrapper method over buildfire showDialog
    _openActionItem: function (item, callback) {
        buildfire.actionItems.showDialog(item, { showIcon: true, allowNoAction: true }, function (err, actionItem) {
            if (err)
                console.error("Error getting item details: ", err);
            else {
                if (actionItem) {
                    callback(actionItem);
                }
            }
        });
    },
    // a wrapper method over buildfire imageLib showDialog
    _openImageLib: function (callback) {
        buildfire.imageLib.showDialog({ multiSelect: true, showIcons: false }, function (err, result) {
            if (err)
                console.error("Error getting images: ", err);
            else
                callback(result.selectedFiles);
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
    }
};