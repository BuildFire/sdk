if (typeof buildfire == 'undefined')
    throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};

if (typeof Tagify == 'undefined') {
    document.write('<script src="' + '../../../../scripts/tagify/tagify.min.js"></script>');
    document.write('<script src="' + '../../../../scripts/tagify/tagify.polyfills.min.js"></script>');
}

buildfire.components.tagsInput = class TagsInput {

    constructor(selector, data = {}) {
        // tags arrays
        this._tagifyTags = null;
        this.activeTags = [];
        this.container = null;
        this.selectorId = selector || null;
        this.errorsContainer = null;

        this.settings = {
            source: data.settings?.source ? data.settings.source : [],
            sourceType: data.settings?.sourceType ? data.settings.sourceType : 'list',
            allowAutoComplete: typeof (data.settings?.allowAutoComplete) === 'undefined' ? true : data.settings.allowAutoComplete,
            allowUserInput: typeof (data.settings?.allowUserInput) === 'undefined' ? true : data.settings.allowUserInput,
        }
        // languageSettings = strings
        this.languageSettings = {
            placeholder: data.languageSettings?.placeholder || "Select Tags",
        }
        this._init();
    }

    _init() {
        let _container = document.querySelector(this.selectorId);
        if (!_container) throw new Error('Element not found!');
        else {
            this.container = _container;
            this._buildComponent();
        }
    }

    // methods
    set(tags) {
        this._tagifyTags.removeAllTags();
        this.activeTags = [];

        if (tags && tags.length) {
            tags = tags.map(tag => ({ ...tag, value: tag.tagName })) || []
            this._tagifyTags.addTags(tags);
        }
    }

    get() {
        return this.activeTags;
    }

    // events && handlers
    onUpdate(callBack) {
        if (callBack && typeof callBack === 'function') this._onChangeHandler = callBack;
        else throw 'invalid property, please set a correct function callBack';
    }

    onRequest(){
        throw new Error('function not implemented')
    }

    _tagify(input) {
        const tagifyOptions = { whitelist: this.settings.source, autoComplete: {enabled: this.settings.allowAutoComplete, rightKey: this.settings.allowAutoComplete}, enforceWhitelist: false, userInput: this.settings.allowUserInput }

        this._tagifyTags = new Tagify(input, tagifyOptions);

        this._tagifyTags.on('remove', () => this._onAddRemoveTag())
        this._tagifyTags.on('add', () => this._onAddRemoveTag())
    }

    _buildComponent() {
        if(this.settings.sourceType === 'list')
            this.container.innerHTML = `<input type="text" class="form-control" placeholder="${this.languageSettings.placeholder}" >`
        else {
            this.container.innerHTML = `
            <div class="input-group">
                <input type="text" class="form-control tagify_input_hide_courser" placeholder="${this.languageSettings.placeholder}" >
                <span class="input-group-addon icon icon-plus add_tagBtn"></span>
            </div>`

            let _addButton = this.container.querySelector('span');
            _addButton.addEventListener('click', () => {
                this.onRequest();
            })
        }

        let _input = this.container.querySelector('input');

        this._tagify(_input);
    }

    _onAddRemoveTag() {
        this.activeTags = (this._tagifyTags.value.length) ? this._tagifyTags.value.map(tag => {
            if(!tag.hasOwnProperty('tagName')) tag.tagName = tag.value; // to maintain the same object format returned by buildfire.auth.showTagsSearchDialog
            delete tag.value;
            delete tag.__tagId;
            return tag;
        }) : [];

        this._onChangeHandler(this.activeTags);
    }

    _onChangeHandler(tags) { }
}

buildfire.components.userTagsInput = class UserTagsInput extends buildfire.components.tagsInput {

    constructor(selector, data = {}) {

        let _data = {
            settings: {
                sourceType: 'custom',
                allowAutoComplete: false,
                allowUserInput: false
            },
            languageSettings: data.languageSettings,
        }
        super(selector, _data);
    }

    // User-Tag view methods
    onRequest() {
        buildfire.auth.showTagsSearchDialog(null, (err, result) => {
            if (err) return console.error(err);
            if (result) {
                let allTags = [...result, ...this.activeTags];
                // since tagify require value property, we are appending it and we are removing it from exposed method when returning the value "get, onUpdate"
                allTags = allTags.map(tag => ({ ...tag, value: tag.tagName }));

                // remove repeat tags
                for (let i = 0; i < allTags.length; i++) {
                    for (let j = i + 1; j < allTags.length; j++) {
                        if (allTags[i].value === allTags[j].value) {
                            allTags.splice(j, 1);
                            j -= 1;
                        }
                    }
                }

                // reset tags
                this._tagifyTags.removeAllTags();
                // add tags and hide the buttons until user remove all tags
                if (allTags.length) {
                    this._tagifyTags.addTags(allTags); // Multiple tags are now allowed
                }
            }
        });
    }

}


