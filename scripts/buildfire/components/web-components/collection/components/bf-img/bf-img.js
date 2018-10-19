export class Img {
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
    static get style() { return "/**style-placeholder:bf-img:**/"; }
}
