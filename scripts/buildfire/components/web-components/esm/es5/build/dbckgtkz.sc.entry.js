/*! Built with http://stenciljs.com */
import { h } from '../buildfire-components.core.js';
var View;
(function (View) {
    View[View["grid"] = 0] = "grid";
    View[View["list"] = 1] = "list";
})(View || (View = {}));
var Grid = /** @class */ (function () {
    function Grid() {
        this.images = [];
        this.viewState = View.grid;
    }
    Grid.prototype.handleBack = function (event) {
        event.preventDefault;
        if (this.viewState != View.grid) {
            this.viewState = View.grid;
        }
    };
    Grid.prototype.showList = function (event) {
        event.preventDefault;
        if (this.viewState === View.grid) {
            this.viewState = View.list;
        }
    };
    Grid.prototype.render = function () {
        return (h("div", null, this.viewState == View.grid ?
            h("bf-image-grid", { images: this.images, token: this.token, onClick: this.showList.bind(this) })
            :
                h("bf-image-list", { images: this.images, token: this.token })));
    };
    Object.defineProperty(Grid, "is", {
        get: function () { return "bf-grid"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid, "encapsulation", {
        get: function () { return "shadow"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid, "properties", {
        get: function () {
            return {
                "images": {
                    "type": "Any",
                    "attr": "images"
                },
                "token": {
                    "type": String,
                    "attr": "token"
                },
                "viewState": {
                    "state": true
                }
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid, "events", {
        get: function () {
            return [{
                    "name": "imageSelected",
                    "method": "imageSelected",
                    "bubbles": true,
                    "cancelable": true,
                    "composed": true
                }];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid, "listeners", {
        get: function () {
            return [{
                    "name": "body:backClick",
                    "method": "handleBack"
                }];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid, "style", {
        get: function () { return ".wrapper.sc-bf-grid{display:grid;grid-gap:2px}.box.sc-bf-grid{margin:2vh 0}.row-1.sc-bf-grid{grid-template-columns:100%}.row-2.sc-bf-grid{grid-template-columns:50% 50%}.row-3.sc-bf-grid{grid-template-columns:33% 33% 33%}.row-4.sc-bf-grid{grid-template-columns:25% 25% 25% 25%}.row-5.sc-bf-grid{grid-template-columns:20% 20% 20% 20% 20%}"; },
        enumerable: true,
        configurable: true
    });
    return Grid;
}());
var Grid1 = /** @class */ (function () {
    function Grid1() {
    }
    Grid1.prototype.watchHandler = function () {
        this.setItemCount();
        this.calculateWidth();
    };
    Grid1.prototype.calculateWidth = function () {
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;
        var padding = 2;
        if (this.imageCount > 0) {
            this.imageWidth = Math.floor(windowWidth / this.imageCount) - (padding * 2);
            this.imageHeight = Math.floor(windowHeight / 4);
        }
    };
    Grid1.prototype.setItemCount = function () {
        this.imageCount = (this.images && this.images.length) ? this.images.length : 0;
    };
    Grid1.prototype.componentWillLoad = function () {
        this.setItemCount();
        this.calculateWidth();
    };
    Grid1.prototype.render = function () {
        var _this = this;
        var classes = "wrapper row-" + this.imageCount;
        return (h("div", { class: classes }, this.images.map(function (image) { return h("bf-img", { token: _this.token, operation: "crop", width: _this.imageWidth.toString(), height: _this.imageHeight.toString(), url: image }); })));
    };
    Object.defineProperty(Grid1, "is", {
        get: function () { return "bf-image-grid"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid1, "encapsulation", {
        get: function () { return "shadow"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid1, "properties", {
        get: function () {
            return {
                "imageCount": {
                    "state": true
                },
                "imageHeight": {
                    "state": true
                },
                "images": {
                    "type": "Any",
                    "attr": "images",
                    "watchCallbacks": ["watchHandler"]
                },
                "imageWidth": {
                    "state": true
                },
                "token": {
                    "type": String,
                    "attr": "token"
                }
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid1, "listeners", {
        get: function () {
            return [{
                    "name": "window:resize",
                    "method": "calculateWidth",
                    "passive": true
                }];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid1, "style", {
        get: function () { return ".wrapper.sc-bf-image-grid{display:grid;grid-gap:2px}.box.sc-bf-image-grid{margin:2vh 0}.row-1.sc-bf-image-grid{grid-template-columns:100%}.row-2.sc-bf-image-grid{grid-template-columns:50% 50%}.row-3.sc-bf-image-grid{grid-template-columns:33% 33% 33%}.row-4.sc-bf-image-grid{grid-template-columns:25% 25% 25% 25%}.row-5.sc-bf-image-grid{grid-template-columns:20% 20% 20% 20% 20%}"; },
        enumerable: true,
        configurable: true
    });
    return Grid1;
}());
var ImageList = /** @class */ (function () {
    function ImageList() {
        this.images = [];
    }
    ImageList.prototype.componentWillLoad = function () {
        this.setItemCount();
        this.calculateWidth();
    };
    ImageList.prototype.componentDidLoad = function () {
    };
    ImageList.prototype.calculateWidth = function () {
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;
        this.listImageWidth = windowWidth;
        this.listImageHeight = Math.floor(windowHeight / 3);
    };
    ImageList.prototype.setItemCount = function () {
        this.imageCount = (this.images && this.images.length) ? this.images.length : 0;
    };
    ImageList.prototype.selectImage = function (selectedImage, event) {
        event.preventDefault;
        var images = this.images;
        var imageObject = images.map(function (image) {
            return {
                name: image,
                selected: (image === selectedImage)
            };
        });
        this.imageSelected.emit(imageObject);
    };
    ImageList.prototype.render = function () {
        var _this = this;
        return (this.images.map(function (image) { return h("div", { class: "box" }, h("bf-img", { token: _this.token, onClick: _this.selectImage.bind(_this, image), operation: "width", width: (_this.width) ? _this.width.toString() : _this.listImageWidth.toString(), url: image })); }));
    };
    Object.defineProperty(ImageList, "is", {
        get: function () { return "bf-image-list"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImageList, "encapsulation", {
        get: function () { return "shadow"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImageList, "properties", {
        get: function () {
            return {
                "height": {
                    "type": Number,
                    "attr": "height"
                },
                "imageCount": {
                    "state": true
                },
                "images": {
                    "type": "Any",
                    "attr": "images"
                },
                "listImageHeight": {
                    "state": true
                },
                "listImageWidth": {
                    "state": true
                },
                "token": {
                    "type": String,
                    "attr": "token"
                },
                "width": {
                    "type": Number,
                    "attr": "width"
                }
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImageList, "events", {
        get: function () {
            return [{
                    "name": "imageSelected",
                    "method": "imageSelected",
                    "bubbles": true,
                    "cancelable": true,
                    "composed": true
                }];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImageList, "listeners", {
        get: function () {
            return [{
                    "name": "window:resize",
                    "method": "calculateWidth",
                    "passive": true
                }];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImageList, "style", {
        get: function () { return ".box.sc-bf-image-list{margin:2vh 0;max-width:100%;overflow:hidden}"; },
        enumerable: true,
        configurable: true
    });
    return ImageList;
}());
var Img = /** @class */ (function () {
    function Img() {
        this.suffix = 'https://{token}.cloudimg.io';
        this.filterDefault = 'n';
        this.operations = {
            cdn: 'cdn',
            cdno: 'cdno',
            width: 'width',
            height: 'height',
            crop: 'crop'
        };
        this.defaultOperation = this.operations.cdn;
        this.quality = 100;
    }
    Img.prototype.getOperation = function () {
        var operation = (this.operation) ? this.operation : this.defaultOperation;
        if (!this.operation && this.width) {
            operation = this.operations.width;
        }
        if (!this.operation && this.height) {
            operation = this.operations.height;
        }
        if (this.width && this.height) {
            operation = this.operations.crop;
        }
        return operation;
    };
    Img.prototype.getSize = function () {
        var size = 'n';
        if (this.height && this.width) {
            size = this.width + "x" + this.height;
        }
        else if (this.width) {
            size = "" + this.width;
        }
        else if (this.height) {
            size = "" + this.height;
        }
        return size;
    };
    Img.prototype.buildUrl = function () {
        var operation = this.getOperation();
        var size = this.getSize();
        var filter = (this.quality) ? ("q" + this.quality.toString()) : this.filterDefault;
        var suffixWithToken = this.suffix.replace('{token}', this.token);
        return suffixWithToken + "/" + operation + "/" + size + "/" + filter + "/" + this.url;
    };
    Img.prototype.componentWillUpdate = function () {
        this.realSrc = this.buildUrl();
    };
    Img.prototype.componentDidLoad = function () {
        this.realSrc = this.buildUrl();
    };
    Img.prototype.render = function () {
        return (h("img", { src: this.realSrc }));
    };
    Object.defineProperty(Img, "is", {
        get: function () { return "bf-img"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Img, "encapsulation", {
        get: function () { return "shadow"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Img, "properties", {
        get: function () {
            return {
                "height": {
                    "type": String,
                    "attr": "height"
                },
                "operation": {
                    "type": String,
                    "attr": "operation"
                },
                "quality": {
                    "type": Number,
                    "attr": "quality"
                },
                "realSrc": {
                    "state": true
                },
                "token": {
                    "type": String,
                    "attr": "token"
                },
                "url": {
                    "type": String,
                    "attr": "url"
                },
                "width": {
                    "type": String,
                    "attr": "width"
                }
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Img, "style", {
        get: function () { return ""; },
        enumerable: true,
        configurable: true
    });
    return Img;
}());
export { Grid as BfGrid, Grid1 as BfImageGrid, ImageList as BfImageList, Img as BfImg };
