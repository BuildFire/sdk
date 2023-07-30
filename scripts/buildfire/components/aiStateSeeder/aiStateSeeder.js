if (typeof buildfire === 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components === 'undefined') buildfire.components = {};

buildfire.components.aiStateSeeder = class AiStateSeeder {
	constructor(options = {}) {
		this.options = options;

		const { errors } = this._validateConstructorOptions();
		if (errors.length) {
			throw new Error(`validation error: ${errors.join(', ')}`);
		}

		this._applyClassDefaults();
	}

	static get DEFAULT_SAMPLE_CSV() {
		return 'val1, val2, val3\n\rval1, val2, val3';
	}

	static get DEFAULT_IMPORT_USER_MESSAGE() {
		return 'I have the following comma separated values: ';
	}

	_applyClassDefaults() {
		if (this.options.importOptions) {
			this.options.importOptions.type = 'import';

			if (!this.options.importOptions.sampleCSV) {
				this.options.importOptions.sampleCSV = AiStateSeeder.DEFAULT_SAMPLE_CSV;
			}
		}
	}

	_validateConstructorOptions() {
		const { options } = this;
		const errors = [];

		if (!Object.keys(options).length) {
			errors.push('constructor options parameter is required');
		}
		if (!options.generateOptions && !options.importOptions) {
			errors.push('one of options.generateOptions, options.importOptions parameters is required');
		}
		if (options.generateOptions) {
			if (!options.generateOptions.jsonTemplate) {
				errors.push('generateOptions.jsonTemplate parameter is required');
			}
			if (!options.generateOptions.userMessage) {
				errors.push('generateOptions.userMessage parameter is required');
			}
			if (!options.generateOptions.callback) {
				errors.push('generateOptions.callback parameter is required');
			}
		}
		if (options.importOptions) {
			if (!options.importOptions.jsonTemplate) {
				errors.push('importOptions.jsonTemplate parameter is required');
			}
			if (!options.importOptions.callback) {
				errors.push('importOptions.callback parameter is required');
			}
		}

		return {
			errors,
			isValid: !errors.length,
		};
	}

	static _validateRequestOptions(options, callback) {
		const errors = [];

		if (!Object.keys(options).length) {
			errors.push('request options parameter is required');
		}
		if (!options.jsonTemplate) {
			errors.push('jsonTemplate parameter is required');
		}
		if (!callback) {
			errors.push('callback parameter is required');
		}
		if (options.type !== 'import' && !options.userMessage) {
			errors.push('userMessage parameter is required');
		}

		return {
			errors,
			isValid: !errors.length,
		};
	}

	static _applyRequestDefaults(options) {
		if (options.type === 'import') {
			if (!options.userMessage) {
				options.userMessage = AiStateSeeder.DEFAULT_IMPORT_USER_MESSAGE;
			}

			if (!options.sampleCSV) {
				options.sampleCSV = AiStateSeeder.DEFAULT_SAMPLE_CSV;
			}
		}
	}

	request(options = {}, callback) {
		const status = {
			isReady: false,
			resetData: (options.type !== 'import'),
		};
		const { errors } = AiStateSeeder._validateRequestOptions(...arguments);

		if (errors.length) {
			throw new Error(`request validation error: ${errors.join(', ')}`);
		}

		AiStateSeeder._applyRequestDefaults(options);

		buildfire.lazyLoadScript(
			{ relativeScriptsUrl: 'buildfire/services/ai/ai.js', scriptId: 'ai' },
			() => {
				const packet = (options.type === 'import')
					? new Packet(null, 'ai.showSeederCSVPrompt', {
						sampleCSV: options.sampleCSV,
						showResetAndSaveButton: options.showResetAndSaveButton,
					})
					: new Packet(null, 'ai.showSeederMessagePrompt', {
						userMessage: options.userMessage,
						showClearDataWarning: options.showClearDataWarning
					});

				buildfire._sendPacket(packet, (err, result) => {
					// in case user requested to regenerate, dialog should appear with the last typed message
					if (result) {
						if (result.userMessage) {
							this.options.generateOptions.userMessage = result.userMessage;
							options.userMessage = result.userMessage;
						} else if (result.sampleCSV) {
							this.options.importOptions.sampleCSV = result.sampleCSV;
						}

						if (typeof result.reset !== 'undefined') status.resetData = result.reset;
					}


					const conversation = new buildfire.ai.conversation();
					conversation.userSays(options.userMessage);

					if (options.type === 'import') conversation.userSays(result.sampleCSV);
					if (options.systemMessage) conversation.systemSays(options.systemMessage);

					conversation.systemSays('If you are returning multiple records, do not exceed 5 records');
					AiStateSeeder._startAIAnimation();
					conversation.fetchJsonResponse({ jsonTemplate: options.jsonTemplate }, (err, response) => {
						if (err) {
							buildfire.dialog.toast({
								type: 'danger',
								message: err.message,
							});
							AiStateSeeder._stopAIAnimation();
							return callback(err);
						}

						status.complete = AiStateSeeder._stopAIAnimation;
						callback(err, response);
					});
				});
			}
		);

		return status;
	}

	showEmptyState(options = {  isOverlay: false }) {
		const { selector, isOverlay, showBanner } = options;
		const emptyStateContainer = document.querySelector(selector);
		const result = {
			requestResult: null,
		};

		if (!emptyStateContainer) throw new Error(`Invalid selector ${selector}`);

		const emptyStateOverlay = document.createElement('div');
		emptyStateOverlay.classList.add('ai-seeder-fixed');

		const emptyStateElement =  document.createElement('div');
		emptyStateElement.classList.add('well');
		emptyStateElement.classList.add('ai-empty-state');

		emptyStateElement.innerHTML = `<div class="ai-empty-state-content"
					<p>You haven't added anything yet.</p>
					<p>Add sample data to preview this feature.</p>
					<div>

					${isOverlay ? '<button id="skipBtn" class="btn btn-primary inverted">Enter Manually</button>' : ''}
					${isOverlay && this.options.importOptions ? '<button id="importBtn" class="btn btn-primary inverted">Import Data</button>' : ''}
            <button id="generateBtn" class="btn btn-primary">Generate AI Data</button>
					</div>
				</div>`;

		const clearEmptyState = () => {
			if (isOverlay) {
				emptyStateOverlay.remove();
			} else {
				emptyStateElement.remove();
			}
			emptyStateElement.removeEventListener('click', onClickHandler.bind(this));
		};
		const onClickHandler = (e) => {
			switch (e.target.id) {
			case 'generateBtn':
				result.requestResult = this.request(this.options.generateOptions, (err, response) => {
					clearEmptyState();
					this.options.generateOptions.callback(err, response);
				});
				break;
			case 'importBtn':
				result.requestResult = this.request(this.options.importOptions, (err, response) => {
					clearEmptyState();
					this.options.importOptions.callback(err, response);
				});
				break;
			case 'skipBtn':
				clearEmptyState();
				break;
			default:
				break;
			}
		};
		emptyStateElement.addEventListener('click', onClickHandler.bind(this));

		if (isOverlay) {
			emptyStateOverlay.appendChild(emptyStateElement);
			emptyStateContainer.appendChild(emptyStateOverlay);
		} else {
			emptyStateContainer.appendChild(emptyStateElement);
		}


		if (showBanner) {
			const bannerElement = AiStateSeeder._createBannerElement({
				hideGenerate: !this.options.generateOptions,
				hideImport: !this.options.importOptions,
			});

			if (this.options.generateOptions) {
				const bannerGenerateBtn = bannerElement.querySelector('#bannerGenerateBtn');
				bannerGenerateBtn.onclick = (e) => {
					e.preventDefault();
					result.requestResult = this.request({
						...this.options.generateOptions,
						showClearDataWarning: true
					}, this.options.generateOptions.callback);
				};
			}

			if (this.options.importOptions) {
				const bannerImportBtn = bannerElement.querySelector('#bannerImportBtn');
				bannerImportBtn.onclick = (e) => {
					e.preventDefault();
					result.requestResult = this.request({
						...this.options.importOptions,
						showResetAndSaveButton: true
					}, this.options.importOptions.callback);
				};
			}

			document.body.prepend(bannerElement);
		}

		return result;
	}

	smartShowEmptyState(options = null) {
		if (buildfire.getContext().showAiSuggestions) {
			const emptyStateOptions = {
				selector: 'body',
				isOverlay: true,
				showBanner: true,
			};

			return this.showEmptyState(emptyStateOptions);
		}
	}

	static _createBannerElement({ hideGenerate, hideImport } = {}) {
		const banner = document.createElement('p');
		banner.classList.add('ai-seeder-banner');
		banner.innerText = 'Utilize our AI-powered generator to effortlessly create compelling content for this feature. ';

		if (!hideGenerate) {
			const generateBtn = document.createElement('a');
			generateBtn.classList.add('text-primary');
			generateBtn.href = '#';
			generateBtn.id = 'bannerGenerateBtn';
			generateBtn.innerText = 'Generate AI Data';
			banner.append(generateBtn);
		}

		if (!hideImport) {
			if (!hideGenerate) {
				const separator = document.createElement('span');
				separator.innerText = ' or ';
				banner.append(separator);
			}
			const importBtn = document.createElement('a');
			importBtn.classList.add('text-primary');
			importBtn.href = '#';
			importBtn.id = 'bannerImportBtn';
			importBtn.innerText = 'AI Import Data';
			banner.append(importBtn);
		}

		return banner;
	}

	static _startAIAnimation() {
		const emptyStateElement = document.body;
		const animationElement = AiStateSeeder._createAIAnimationElement();
		animationElement.classList.add('ai-progress-overlay');
		emptyStateElement.prepend(animationElement);
	}

	static _createAIAnimationElement() {
		const animationElement =  document.createElement('div');
		animationElement.classList.add('ai-progress');
		animationElement.innerHTML = `<div class="ai-animation">
						<div class="blob"></div>
						<div class="blob1"></div>
						<div class="blob2"></div>
						<div class="blob3">
						</div>
					</div>`;
		return animationElement;
	}

	static _stopAIAnimation() {
		const progressElement = document.querySelector('.ai-progress-overlay');
		progressElement.parentElement.removeChild(progressElement);
	}
};
