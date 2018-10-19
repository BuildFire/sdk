export class ImageList {
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
    static get style() { return "/**style-placeholder:bf-image-list:**/"; }
}
