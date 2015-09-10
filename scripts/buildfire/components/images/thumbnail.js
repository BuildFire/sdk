'use strict';

if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use sortableList components");

if (typeof (buildfire.components) == "undefined")
    buildfire.components = {};

if (typeof (buildfire.components.images) == "undefined")
    buildfire.components.images = {};

// This is the class that will be used in the plugin content, design, or settings sections
// imageUrl
buildfire.components.images.thumbnail = function (selector, settings) {
    this.selector = selector;

    if (settings) {
        if (typeof (settings) == "string") {
            this.imageUrl = settings;
        } else {
            this.imageUrl = settings.imageUrl ? settings.imageUrl : "";
            this.title = settings.title ? settings.title : "";
            this.dimensionsLabel = settings.dimensionsLabel ? settings.dimensionsLabel : "";
        }
    } else {
        this.imageUrl = "";
        this.title = "";
        this.dimensionsLabel = "";
    }

    this.init(selector);
    this.loadbackground(this.imageUrl);
};

// images thumbnail methods
buildfire.components.images.thumbnail.prototype = {
    // will be called to initialize the setting in the constructor
    init: function (selector) {
        this.selector = this._getDomSelector(selector);
        this._renderTemplate();
        this.imageElement = this.selector.querySelector("img");
        this._initEvents();
    },
    // This will be triggered when you change the background image
    onChange: function (newUrl) {
        console.warn("please handle onChange", newUrl);
    },
    // This will be triggered when you delete the background
    onDelete: function (url) {
        console.warn("please handle onDelete", url);
    },
    // remove the background image
    clear: function () {
        this.imageElement.className = "hidden";
        this.onDelete(this.imageUrl);
        this.imageElement.removeAttribute("src");
        this.imageUrl = "";
    },
    loadbackground: function (url) {
        if (url) {
            this.imageElement.src = this._resizeImage(url, { width: 88 });
            this.imageElement.className = "";
            this.imageUrl = url;
            this.onChange(url);
        }
    },
    // initialize the generic events
    _initEvents: function () {
        var me = this;
        me.selector.querySelector(".change-background").addEventListener("click", function () {
            me._openImageLib(function (newUrl) {
                me.loadbackground(newUrl);
            });
        });

        me.selector.querySelector(".delete-background").addEventListener("click", function () {
            me.clear();
        });
    },
    // render the basic template HTML
    _renderTemplate: function () {
        var template =
            '<div class="item clearfix row">\
                <div class="labels col-md-3 padding-right-zero pull-left">\
                    <span>#title</span>\
                </div>\
                <div class="main col-md-9 pull-right">\
                    <div class="screens clearfix">\
	                    <div class="screen text-center layouticon pull-left">\
                            <a class="border-grey border-radius-three default-background-hover change-background">\
                                <span class="add-icon">+</span>\
                                <img alt="Background Image" class="hidden">\
                            </a>\
                            <label class="secondary">#dimensions-label</label>\
                            <span class="icon btn-icon btn-delete-icon btn-danger transition-third delete-background"></span>\
                        </div>\
                    </div>\
                </div>\
            </div>';
        this.selector.innerHTML = template
            .replace("#title", this.title ? this.title : "Background Image")
            .replace("#dimensions-label", this.dimensionsLabel ? this.dimensionsLabel : "750x1334")
    },
    // a wrapper method over buildfire image library
    _openImageLib: function (callback) {
        buildfire.imageLib.showDialog({ multiSelect: false, showIcons: false }, function (err, result) {
            if (err) {
                console.error("Error getting images: ", err);
            }
            else if (result.selectedFiles.length) {
                callback(result.selectedFiles[0]);
            }

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
    _resizeImage: function (url, options) {
        if (!url) {
            return "";
        }
        else {
            return buildfire.imageLib.resizeImage(url, options);
        }
    }
};