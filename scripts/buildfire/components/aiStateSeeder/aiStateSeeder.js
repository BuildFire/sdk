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

			if (!this.options.importOptions.sampleCsv) {
				this.options.importOptions.sampleCsv = AiStateSeeder.DEFAULT_SAMPLE_CSV;
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
		}
		if (options.importOptions) {
			if (!options.importOptions.jsonTemplate) {
				errors.push('importOptions.jsonTemplate parameter is required');
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

			if (!options.sampleCsv) {
				options.sampleCsv = AiStateSeeder.DEFAULT_SAMPLE_CSV;
			}
		}
	}

	request(options = {}, callback) {
		const status = { isReady: false };
		const { errors } = AiStateSeeder._validateRequestOptions(...arguments);

		if (errors.length) {
			throw new Error(`request validation error: ${errors.join(', ')}`);
		}

		AiStateSeeder._applyRequestDefaults(options);

		buildfire.lazyLoadScript(
			{ relativeScriptsUrl: 'buildfire/services/ai/ai.js', scriptId: 'ai' },
			() => {
				const packet = (options.type === 'import')
					? new Packet(null, 'ai.showSeederCSVPrompt', { sampleCsv: options.sampleCsv })
					: new Packet(null, 'ai.showSeederMessagePrompt', { userMessage: options.userMessage });

				buildfire._sendPacket(packet, (err, result) => {
					// in case user requested to regenerate, dialog should appear with the last typed message
					if (result) {
						if (result.userMessage) {
							options.userMessage = result.userMessage;
						} else if (result.sampleCsv) {
							options.sampleCsv = result.sampleCsv;
						}
					}

					const conversation = new buildfire.ai.conversation();
					conversation.userSays(options.userMessage);

					if (options.type === 'import') conversation.userSays(result.sampleCsv);
					if (options.systemMessage) conversation.systemSays(options.systemMessage);

					AiStateSeeder._startAIAnimation();
					conversation.fetchJsonResponse({ jsonTemplate: options.jsonTemplate }, (err, response) => {
						status.complete = () => {
							AiStateSeeder._stopAIAnimation();
							// show toast asap
							// todo below is temporary to allow testing re-generation in the plugins
							buildfire.dialog.toast({
								hideDismissButton: false,
								duration: 60000,
								type: 'success',
								message: 'Loaded Successfully',
								actionButton: {
									text: 'Regenerate',
									action: () => {
										this.request(options, callback);
									},
								},
							});
						};

						callback(err, response);
					});
				});
			}
		);

		return status;
	}

	showEmptyState(options = {  isOverlay: false, _result: {} }, callback) {
		const { selector, isOverlay, _result } = options;
		const emptyStateContainer = document.querySelector(selector);

		if (!emptyStateContainer) throw new Error(`Invalid selector ${selector}`);
		if (!callback) throw new Error('callback parameter is required');

		const emptyStateOverlay = document.createElement('div');
		emptyStateOverlay.classList.add('ai-seeder-fixed');

		const emptyStateElement =  document.createElement('div');
		emptyStateElement.classList.add('well');
		emptyStateElement.classList.add('ai-empty-state');

		emptyStateElement.innerHTML = `<div class="ai-empty-state-content"
					<p>You haven’t added anything yet.</p>
					<p>Add sample data to preview this feature.</p>
					<div>

					${isOverlay ? '<button id="skipBtn" class="btn btn-primary inverted">Enter Manually</button>\n            <button id="importBtn" class="btn btn-primary inverted">Import Data</button>' : ''}
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
				_result.requestResult = this.request(this.options.generateOptions, (err, response) => {
					clearEmptyState();
					callback(err, response);
				});
				break;
			case 'importBtn':
				_result.requestResult = this.request(this.options.importOptions, (err, response) => {
					clearEmptyState();
					callback(err, response);
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
		return _result;
	}

	smartShowEmptyState(options = null, callback) {
		const urlParams = new URLSearchParams(window.location.search);
		const isNewInstance = true; // urlParams.get('new_instance'); todo

		if (isNewInstance) {
			const emptyStateOptions = { selector: 'body', isOverlay: true, _result: {} };

			// create banner element
			const banner = document.createElement('p');
			banner.classList.add('ai-seeder-banner');
			banner.innerText = 'Utilize our AI-powered generator to effortlessly create compelling content for this feature. ';

			const bannerBtn = document.createElement('a');
			bannerBtn.classList.add('text-primary');
			bannerBtn.href = '#';
			bannerBtn.innerText = 'Generate AI Data';
			bannerBtn.onclick = () => {
				emptyStateOptions._result.requestResult = this.request(this.options.generateOptions, callback);
			};

			banner.append(bannerBtn);
			document.body.prepend(banner);

			return this.showEmptyState(emptyStateOptions, callback);
		}
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
