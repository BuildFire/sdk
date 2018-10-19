var View;
(function (View) {
    View[View["grid"] = 0] = "grid";
    View[View["list"] = 1] = "list";
})(View || (View = {}));
;
export class Grid {
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
    static get style() { return "/**style-placeholder:bf-grid:**/"; }
}
