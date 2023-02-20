if (typeof buildfire == 'undefined')
	throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};
if (typeof buildfire.components.control == 'undefined') buildfire.components.control = {};

if (typeof Tagify == 'undefined') {
	document.write('<script src="' + '../../../scripts/tagify/tagify.min.js"></script>');
	document.write('<script src="' + '../../../scripts/tagify/tagify.polyfills.min.js"></script>');
}

buildfire.components.control.tagsInput = class TagsInput {

	constructor(selector, data = {}) {
		// tags arrays
		this._readyToFireEvent = true;
		this._tagifyTags = null;
		this.activeTags = [];
		this.container = null;
		this.selector = selector || null;

		let _source = data.settings?.source ? data.settings.source : [];
		let _sourceType = 'list';
		if (typeof _source === "function") {
			_sourceType = 'custom';
		} else {
			//validate the list
			for (let i = 0; i < _source.length; i++) {
				if (!this._validateSource(_source[i])) {
					throw Error('Invalid source, missing value');
					return;
				}
			}
		}

		this.settings = {
			source: _source,
			sourceType: _sourceType,
			allowAutoComplete: typeof (data.settings?.allowAutoComplete) === 'undefined' ? true : data.settings.allowAutoComplete,
			allowUserInput: typeof (data.settings?.allowUserInput) === 'undefined' ? true : data.settings.allowUserInput,
		}
		// languageSettings = strings
		this.languageSettings = {
			placeholder: data.languageSettings?.placeholder || "Select Tags",
		}
		this._init();
	}

	_validateSource(item) {
		if (item && item.value && typeof (item.value) === "string") {
			return true;
		}
		return false;
	}

	_init() {
		let _container = document.querySelector(this.selector);
		if (!_container) throw new Error('Element not found!');
		else {
			this.container = _container;
			this._buildComponent();
		}
	}

	_tagify(input) {
		const tagifyOptions = {
			whitelist: this.settings.sourceType === 'list' ? this.settings.source : [],
			autoComplete: {
				enabled: this.settings.allowAutoComplete,
				rightKey: this.settings.allowAutoComplete
			},
			enforceWhitelist: false,
			userInput: this.settings.allowUserInput
		}

		this._tagifyTags = new Tagify(input, tagifyOptions);

		this._tagifyTags.on('remove', () => this._onAddRemoveTag());
		this._tagifyTags.on('change', () => this._onAddRemoveTag());
	}

	_buildComponent() {
		if (this.settings.sourceType === 'list')
			this.container.innerHTML = `<input type="text" class="form-control" placeholder="${this.languageSettings.placeholder}" >`
		else {
			this.container.innerHTML = `
            <div class="input-group">
                <input type="text" class="form-control tagify_input_hide_courser" placeholder="${this.languageSettings.placeholder}" >
                <span class="input-group-addon icon icon-plus add_tagBtn"></span>
            </div>`

			let _addButton = this.container.querySelector('span');
			_addButton.addEventListener('click', () => {
				this.settings.source({}, (items) => {
					this.set(items);
				});
			})
		}

		let _input = this.container.querySelector('input');

		this._tagify(_input);
	}

	_onAddRemoveTag() {
		this.activeTags = (this._tagifyTags.value.length) ? this._tagifyTags.value.map(tag => {
			return tag;
		}) : [];

		if (this._readyToFireEvent) {
			this.onUpdate({tags: this.activeTags});
		}
	}

	// methods
	append(data) {
		let _tags = [];
		if (data && Array.isArray(data)) {
			for (let i = 0; i < data.length; i++) {
				if (this._validateSource(data[i])) {
					_tags.push(data[i]);
				} else {
					throw Error('Invalid data, missing value');
					return;
				}
			}
		} else {
			if (this._validateSource(data)) {
				_tags.push(data);
			} else {
				throw Error('Invalid data, missing value');
				return;
			}
		}
		for (let i = 0; i < _tags.length; i++) {
			this.activeTags.push(_tags[i]);
		}
		this._tagifyTags.addTags(_tags);
	}

	clear() {
		this.activeTags = [];
		this._tagifyTags.removeAllTags();
	}

	set(data) {
		this._readyToFireEvent = false;
		this.activeTags = [];
		this._tagifyTags.removeAllTags();
		this._readyToFireEvent = true;
		this.append(data);
	}

	get() {
		return this.activeTags;
	}

	// events && handlers
	onUpdate(event) {
		throw new Error('function not implemented');
	}
}

buildfire.components.control.userTagsInput = class UserTagsInput extends buildfire.components.control.tagsInput {

	constructor(selector, data = {}) {

		let _data = {
			settings: {
				source: (options, callback) => {
					buildfire.auth.showTagsSearchDialog(null, (err, result) => {
						if (err) return console.error(err);
						if (result) {
							let _currentTags = this.get();
							let allTags = [...result, ..._currentTags];
							// since tagify require value property, we are appending it and we are removing it from exposed method when returning the value "get, onUpdate"
							allTags = allTags.map(tag => ({...tag, value: tag.tagName}));

							// remove repeat tags
							for (let i = 0; i < allTags.length; i++) {
								for (let j = i + 1; j < allTags.length; j++) {
									if (allTags[i].value === allTags[j].value) {
										allTags.splice(j, 1);
										j -= 1;
									}
								}
							}

							callback(allTags);
						}
					});
				},
				allowAutoComplete: false,
				allowUserInput: false
			},
			languageSettings: data.languageSettings,
		}
		super(selector, _data);
	}
}
