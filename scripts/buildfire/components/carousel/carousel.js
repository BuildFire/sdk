'use strict';
// Add to dummy items for testing purposes
var helpItem = [{
    "actionName": "Link to Web Content", "action": "linkToWeb", "openIn": "_blank", "title": "ONE",
    "iconUrl": "https://imagelibserver.s3.amazonaws.com/1439498230636-034027228760533035/d4210610-4202-11e5-b604-e5d8df00b595.jpg",
    "url": "http://www.developercode.net"
}, {
    "actionName": "Link to Web Content", "action": "linkToWeb", "openIn": "_blank", "title": "ONE",
    "iconUrl": "https://imagelibserver.s3.amazonaws.com/1439498230636-034027228760533035/d4210610-4202-11e5-b604-e5d8df00b595.jpg",
    "url": "http://www.developercode.net"
}];

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

    if (items && items instanceof Array && items.length) {
        this.items = items;
        this.loadItems(this.items);
    }
    else {
        this.items = [];
    }
    this.init(selector);
}

// Carousel Editor methods
buildfire.components.carousel.editor.prototype = {
    onItemChange: function (item) {
        throw ("please handle onAddItem");
    },
    onOrderChange: function (item) {
        console.log("please handle onAddItem");
    },
    loadItems: function (items) {

    },
    init: function (selector) {
        var self = this;
        this.selector = this._getDomSelector(selector);
        console.info(this.selector)
        this._loadTemplate(function (html) {
            self.selector.innerHTML = html;
            self.itemsContainer = self.selector.querySelector(".carousel-items");
            // add to items to the component for testing purposes
            self._appendItem(helpItem[0]);
            self._appendItem(helpItem[1]);
            self._initEvents();
        });
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

        image.src = item.iconUrl;
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

        // initialize the click events on the current item
        editButton.addEventListener("click", (function (item) {
            return function (e) {
                e.preventDefault();
                console.warn("Editing item: ", item);
            };
        })(item));

        deleteButton.addEventListener("click", (function (item) {
            return function (e) {
                e.preventDefault();
                console.warn("Editing item: ", item);
            };
        })(item));
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

        // initialize add new item button
        self.selector.querySelector(".add-new-carousel").addEventListener("click", function () {
            buildfire.actionItems.showDialog(null, { showIcon: true }, function (err, actionItem) {
                if (err)
                    console.error("Error adding a new carousel: ", err);
                else {
                    self._appendItem(actionItem);
                }
            });
        });

        // initialize the sort on the container of the items
        self.sortableList = Sortable.create(self.itemsContainer, {
            animation: 150,
            onAdd: function (evt) { console.log('onAdd.foo:', [evt.item, evt.from]); },
            onUpdate: function (evt) { console.log('onUpdate.foo:', [evt.item, evt.from]); },
            onRemove: function (evt) { console.log('onRemove.foo:', [evt.item, evt.from]); },
            onStart: function (evt) { console.log('onStart.foo:', [evt.item, evt.from]); },
            onSort: function (evt) { console.log('onStart.foo:', [evt.item, evt.from]); },
            onEnd: function (evt) { console.log('onEnd.foo:', [evt.item, evt.from]); }
        });
    }
};