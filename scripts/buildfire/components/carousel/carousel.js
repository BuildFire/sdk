'use strict';

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use carousel components");

if (typeof ($) == "undefined") throw ("please add JQuery first to use carousel components");

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
}

// This is the class that will be used in the plugin content, design, or settings sections
buildfire.components.carousel.editor = function (selector, items) {
    // carousel editor requires Sortable.js
    if (typeof (Sortable) == "undefined") throw ("please add Sortable first to use carousel components");
    this.selector = selector;
    this.items = [];
    this.init(selector);
    this.loadItems(items);
};

// Carousel editor methods
buildfire.components.carousel.editor.prototype = {
    // will be called to initialize the setting in the constructor
    init: function (selector) {
        this.selector = buildfire.components.carousel._getDomSelector(selector);
        this._renderTemplate();
        this.itemsContainer = this.selector.querySelector(".carousel-items");
        this._initEvents();
    },
    // This will be triggered when you edit existing item details
    onItemChange: function (item, index) {
        throw ("please handle onItemChange");
    },
    /* This will be triggered when the order of items changes
       Example: if you move the first item location to be the second this will return item object, 0, 1 */
    onOrderChange: function (item, oldIndex, newIndex) {
        console.warn("please handle onOrderChange", item, oldIndex, newIndex);
    },
    // This will be triggered when you add a new item, item index will be items.length
    onAddItems: function (items) {
        console.warn("please handle onAddItems", item);
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
                this._appendItem(items[i]);
            }
        }
    },
    // allows you to append a single item or an array of items
    append: function(items){
        if(!items)
            return;
        else if(!(items instanceof Array) && typeof(items) == "object")
            items=[items];

        this.loadItems(items,true);
    },
    // remove all items in list
    clear: function(){
        this._removeAll();
        this.onDeleteItem();
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
                    parentElement.querySelector("img").src = buildfire.components.carousel._resizeImage(actionItem.iconUrl, { width: 80, height: 40 });
                    parentElement.querySelector(".title").innerHTML = actionItem.title;
                    currentTarget.innerHTML = actionItem.action && actionItem.action != "noAction" ? "Edit Action" : "Add Action";
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
                }
            });
        })(item);
    },
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
        buttonContainer.className = "clearfix";
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
        // initialize add new item button
        me.selector.querySelector(".add-new-carousel").addEventListener("click", function () {
            me._openImageLib( function (imageUrls) {
                var newItems = [], currentItem = null;
                for (var i = 0; i < imageUrls.length ; i++) {
                    currentItem = buildfire.actionItems.create(null, imageUrls[i], 'image');
                    if (!currentItem.action) {
                        currentItem.action = "noAction";
                    }

                    newItems.push(currentItem);
                    currentItem = null;
                }

                if(newItems.length) {
                    me.loadItems(newItems, true);
                    me.onAddItems(newItems);
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
        buildfire.imageLib.showDialog({ multiSelect : true ,showIcons :false }, function (err, result) {
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

// This is the class that will be used in the mobile
buildfire.components.carousel.view = function (selector, items, layout, speed, disableResponsive) {
	if (typeof($.fn) != "object" || !($.fn && $.fn.owlCarousel)) {
        throw ("please add owlCarousel.js first to use carousel component");
    }
    this.selector = selector;
    this.items = [];
    this.responsive = disableResponsive ? false : true;
    this._initDimensions(layout);
    this._loadItems(items, false);
    this.init(selector,speed);
	window.dispatchEvent(new CustomEvent('resize'));
};

// Carousel view methods
buildfire.components.carousel.view.prototype = {
    // will be called to initialize the setting in the constructor
    init: function (selector,speed) {
        this.selector = buildfire.components.carousel._getDomSelector(selector);
        this._renderSlider();

        var that = this;

        this._loadImages(speed, function(){
            if (that.items.length) {
                if(typeof speed === 'undefined')
                    that._applySlider();
                else
                    that._applySlider(speed);
            } else {
                that._hideSlider();
            }
        });
    },
    // this method allows you to append or replace slider images
    loadItems: function (items, appendItems, layout,speed) {
        if (this.$slider) {
            this._destroySlider();
            this._removeAll();
        }

        this._initDimensions(layout);
        this._renderSlider();

        this._loadItems(items, appendItems);

        var that = this;

        this._loadImages(speed, function(){
            if (!that.items.length) {
                that._hideSlider();
            } else {
                that._showSlider();
            }

            // if items.length == 0 and appendItems == undefined no need to init the slider it will break if we do so
            if (items instanceof Array && !items.length && !appendItems) {
                return;
            }
            that._applySlider(speed);
        });
    },
    // allows you to append a single item or an array of items
    append: function(items){
        if(!items)
            return;
        else if (!(items instanceof Array) && typeof(items) == "object")
            items=[items];

        this.loadItems(items,true);
    },

    _initDimensions: function (layout) {
        this.width = window.innerWidth;
        layout = layout || "WideScreen";
        if (layout == "WideScreen") {
          this.height = Math.ceil(9 * this.width / 16);
        } else if (layout == "Square") {
            this.height = this.width;
        } else if (layout == "Cinema") {
            this.height = Math.ceil(1 * this.width / 2.39);
        }else if(layout == "MobileScreen"){
            this.height=(window.innerHeight/this.width)*this.width;
            this.width=this.width;
        }

        this.cssWidth = this.width + "px";
		if(this.height > 380){
			this.cssHeight = '380px';
		}else{
			this.cssHeight = this.height + "px";			
		}

		// Set Min height on carousel so doesn't push content down on load.
		this._minHeight = '180px';
		this._minHeight = this.cssHeight;
    },
    // remove all nodes from the slider
    _removeAll: function () {
        if(!this.$slider)return;
        var slider = this.$slider.get(0);
        var fc = slider.firstChild;
        while (fc) {
            slider.removeChild(fc);
            fc = slider.firstChild;
        }
    },
    // internal method to load the provided item in this class items property
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
    // this method will be called when the slide has no items
    _hideSlider: function () {
        this.selector.style.display = "none";
    },
    // this method will be called to show the slider if it's already hidden
    _showSlider: function () {
        this.selector.style.display = "block";
    },
    // initialize the slider
    _applySlider: function (speed) {
        var me = this;
        var renderOwlCarousel=function () {
            me.$slider = $(me.selector);
            if (me.items.length > 1) {

                var sliderOptions = {
                    navigation: false,
                    dots: false,
                    slideSpeed: 800,
                    paginationSpeed: 800,
                    singleItem: true,
                    pagination: false,
                    items: 1,
                    itemsMobile: true,
                    lazyLoad: true,
                    autoHeight: false,
                    autoplay: true,
                    responsive: me.responsive,
                    autoplaySpeed: 800
                };

                sliderOptions.autoplay = (speed == 0) ? 0 : 3000;
                sliderOptions.autoplayTimeout = speed ? speed : 5000;
                sliderOptions.loop = true;
                me.$slider.owlCarousel(sliderOptions);
            }
            if (typeof speed === 'undefined')
                $('.plugin-slide').show();
            else
                $('.my-slide').show();
        };

        renderOwlCarousel();

        buildfire.getContext(function (err, result) {
            if (result && result.device && result.device.platform && result.device.platform.toLowerCase() == 'ios') {
                buildfire.navigation.onAppLauncherActive(function () {
                    renderOwlCarousel();
                }, true);
                buildfire.navigation.onAppLauncherInactive(function () {
                    me.$slider.trigger('destroy.owl.carousel').removeClass('owl-carousel owl-loaded');
                    me.$slider.find('.owl-stage-outer').children().unwrap();
                }, true);
            }
        });
    },
    // destroy the slider if it's already in the DOM
    _destroySlider: function () {
        if(!this.$slider || !this.$slider.data) return;
        var sliderData = this.$slider.data('owlCarousel');
        if (sliderData) {
            this.$slider.trigger('autoplay.stop.owl');
            this.$slider.trigger('autoplay.loop.owl', false);
            sliderData.destroy();
        }
    },
    // render the slider wrapper HTML
    _renderSlider: function () {
        var me = this;

		// Add min-height to carousel to prevent it from pushing content down.
		me.selector.style['min-height'] = me._minHeight;
        me.selector.style.position = "relative";
        me.selector.style.top = "0px";
        me.selector.style.left = "0px";
		
        //me.selector.style.width = this.cssWidth;
        //me.selector.style.height = this.cssHeight;
        me.selector.className = "plugin-slider text-center";
    },
    // loop and append the images to the DOM
    _loadImages: function (speed, callback) {
        var items = this.items;
        var itemsLength = items.length;

        var pending =  itemsLength;

        if(itemsLength == 0){
            callback();
        }

        for (var i = 0; i < itemsLength; i++) {
            this._appendItem(items[i], i,speed, function(){
                pending--;

                if(pending == 0){
                    callback();
                }
            });
        }
    },
    // add new slider to the DOM
    _appendItem: function (item, index, speed, callback) {
        var slider = document.createElement("div");

        if(typeof speed === 'undefined')
            slider.className = "plugin-slide";
        else
            slider.className = "my-slide";
		
		if(0 != index) {
			slider.style.display = "none";
		}
		
        slider.addEventListener("click", function () {
            buildfire.actionItems.execute(item, function (err, result) {
                if (err) {
                    console.warn('Error openning slider action: ', err);
                }
            });
        });

        // Images
        var me = this;
        var image = document.createElement("img");
        me.$slider = $(me.selector);

        buildfire.imageLib.local.cropImage(item.iconUrl, {
            width: this.width,
            height: this.height
        }, function (err, result) {
            if (!err) {
                image.src = result;
                image.style.transform = "translateZ(0)";
                slider.appendChild(image);
                me.selector.appendChild(slider);
            }
            else
                console.log('Error occurred while cropping image: ', err);

            callback();
        });
    }
};