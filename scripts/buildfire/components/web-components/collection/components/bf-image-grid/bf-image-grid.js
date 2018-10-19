export class Grid1 {
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
    static get style() { return "/**style-placeholder:bf-image-grid:**/"; }
}
