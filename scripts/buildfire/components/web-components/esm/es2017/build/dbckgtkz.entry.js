/*! Built with http://stenciljs.com */
import { h } from '../buildfire-components.core.js';

var View;
(function (View) {
    View[View["grid"] = 0] = "grid";
    View[View["list"] = 1] = "list";
})(View || (View = {}));
class Grid {
    constructor() {
        this.images = [];
        this.viewState = View.grid;
    }
    handleBack(event) {
        event.preventDefault;
        if (this.viewState != View.grid) {
            this.viewState = View.grid;
        }
    }
    showList(event) {
        event.preventDefault;
        if (this.viewState === View.grid) {
            this.viewState = View.list;
        }
    }
    render() {
        return (h("div", null, this.viewState == View.grid ?
            h("bf-image-grid", { images: this.images, token: this.token, onClick: this.showList.bind(this) })
            :
                h("bf-image-list", { images: this.images, token: this.token })));
    }
    static get is() { return "bf-grid"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
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
    }; }
    static get events() { return [{
            "name": "imageSelected",
            "method": "imageSelected",
            "bubbles": true,
            "cancelable": true,
            "composed": true
        }]; }
    static get listeners() { return [{
            "name": "body:backClick",
            "method": "handleBack"
        }]; }
    static get style() { return ".wrapper{display:grid;grid-gap:2px}.box{margin:2vh 0}.row-1{grid-template-columns:100%}.row-2{grid-template-columns:50% 50%}.row-3{grid-template-columns:33% 33% 33%}.row-4{grid-template-columns:25% 25% 25% 25%}.row-5{grid-template-columns:20% 20% 20% 20% 20%}"; }
}

class Grid1 {
    watchHandler() {
        this.setItemCount();
        this.calculateWidth();
    }
    calculateWidth() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const padding = 2;
        if (this.imageCount > 0) {
            this.imageWidth = Math.floor(windowWidth / this.imageCount) - (padding * 2);
            this.imageHeight = Math.floor(windowHeight / 4);
        }
    }
    setItemCount() {
        this.imageCount = (this.images && this.images.length) ? this.images.length : 0;
    }
    componentWillLoad() {
        this.setItemCount();
        this.calculateWidth();
    }
    render() {
        const classes = `wrapper row-${this.imageCount}`;
        return (h("div", { class: classes }, this.images.map((image) => h("bf-img", { token: this.token, operation: "crop", width: this.imageWidth.toString(), height: this.imageHeight.toString(), url: image }))));
    }
    static get is() { return "bf-image-grid"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
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
    }; }
    static get listeners() { return [{
            "name": "window:resize",
            "method": "calculateWidth",
            "passive": true
        }]; }
    static get style() { return ".wrapper{display:grid;grid-gap:2px}.box{margin:2vh 0}.row-1{grid-template-columns:100%}.row-2{grid-template-columns:50% 50%}.row-3{grid-template-columns:33% 33% 33%}.row-4{grid-template-columns:25% 25% 25% 25%}.row-5{grid-template-columns:20% 20% 20% 20% 20%}"; }
}

class ImageList {
    constructor() {
        this.images = [];
    }
    componentWillLoad() {
        this.setItemCount();
        this.calculateWidth();
    }
    componentDidLoad() {
    }
    calculateWidth() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        this.listImageWidth = windowWidth;
        this.listImageHeight = Math.floor(windowHeight / 3);
    }
    setItemCount() {
        this.imageCount = (this.images && this.images.length) ? this.images.length : 0;
    }
    selectImage(selectedImage, event) {
        event.preventDefault;
        let images = this.images;
        const imageObject = images.map((image) => {
            return {
                name: image,
                selected: (image === selectedImage)
            };
        });
        this.imageSelected.emit(imageObject);
    }
    render() {
        return (this.images.map((image) => h("div", { class: "box" },
            h("bf-img", { token: this.token, onClick: this.selectImage.bind(this, image), operation: "width", width: (this.width) ? this.width.toString() : this.listImageWidth.toString(), url: image }))));
    }
    static get is() { return "bf-image-list"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
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
    }; }
    static get events() { return [{
            "name": "imageSelected",
            "method": "imageSelected",
            "bubbles": true,
            "cancelable": true,
            "composed": true
        }]; }
    static get listeners() { return [{
            "name": "window:resize",
            "method": "calculateWidth",
            "passive": true
        }]; }
    static get style() { return ".box{margin:2vh 0;max-width:100%;overflow:hidden}"; }
}

class Img {
    constructor() {
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
    getOperation() {
        let operation = (this.operation) ? this.operation : this.defaultOperation;
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
    }
    getSize() {
        let size = 'n';
        if (this.height && this.width) {
            size = `${this.width}x${this.height}`;
        }
        else if (this.width) {
            size = `${this.width}`;
        }
        else if (this.height) {
            size = `${this.height}`;
        }
        return size;
    }
    buildUrl() {
        const operation = this.getOperation();
        const size = this.getSize();
        const filter = (this.quality) ? (`q${this.quality.toString()}`) : this.filterDefault;
        const suffixWithToken = this.suffix.replace('{token}', this.token);
        return `${suffixWithToken}/${operation}/${size}/${filter}/${this.url}`;
    }
    componentWillUpdate() {
        this.realSrc = this.buildUrl();
    }
    componentDidLoad() {
        this.realSrc = this.buildUrl();
    }
    render() {
        return (h("img", { src: this.realSrc }));
    }
    static get is() { return "bf-img"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
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
    }; }
    static get style() { return ""; }
}

export { Grid as BfGrid, Grid1 as BfImageGrid, ImageList as BfImageList, Img as BfImg };
