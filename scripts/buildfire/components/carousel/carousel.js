'use strict';

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use carousel components");

if (typeof ($) == "undefined") throw ("please add JQuery first to use carousel components")

if (typeof (buildfire.components) == "undefined")
    buildfire.components = {};

if (typeof (buildfire.components.carousel) == "undefined")
    buildfire.components.carousel = {};

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
            self.itemTemplate = self.selector.querySelector("#itemTemplate").innerHTML;
            self.itemsContainer = self.selector.querySelector(".carousel-items");
            self.itemsContainer.innerHTML = self.itemTemplate;
            self._initEvents();
        });
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
                    console.info(actionItem);
                }
            });

        });
    }
};