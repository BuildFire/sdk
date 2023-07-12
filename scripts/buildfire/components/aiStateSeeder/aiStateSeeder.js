if (typeof buildfire === 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components === 'undefined') buildfire.components = {};

buildfire.components.aiStateSeeder = class AiStateSeeder {
	constructor(options) {
		// if (!options.userMessage) throw new Error('userMessage parameter is required');
		// if (!options.jsonTemplate) throw new Error('jsonTemplate parameter is required');
		this.options = options;
	}

	// eslint-disable-next-line no-unused-vars
	request(options = {}, callback) {
		const status = { isReady: false };

		if (!document.body) throw new Error('Cannot find body element');
		if (!options.userMessage) throw new Error('userMessage parameter is required');
		if (!options.jsonTemplate) throw new Error('jsonTemplate parameter is required');
		if (!callback) throw new Error('callback parameter is required');

		buildfire.lazyLoadScript(
			{ relativeScriptsUrl: 'buildfire/services/ai/ai.js', scriptId: 'ai' },
			() => {
				const packet = new Packet(null, 'ai.showSeederPrompt', { userMessage: options.userMessage });

				buildfire._sendPacket(packet, (err, result) => {
					// in case user requested to regenerate, dialog should appear with the last typed message
					if (result && result.userMessage) {
						options.userMessage = result.userMessage;
					}
					AiStateSeeder._startAIAnimation(options.emptyStateElement);

					const conversation = new buildfire.ai.conversation();
					if (options.systemMessage) conversation.systemSays(options.systemMessage);
					if (options.userMessage) conversation.userSays(options.userMessage);

					conversation.fetchJsonResponse({ jsonTemplate: options.jsonTemplate }, (err, response) => {
						status.complete = () => {
							if (options.emptyStateElement) {
								options.emptyStateElement.style.display = 'none';
							}
							AiStateSeeder._stopAIAnimation(options.emptyStateElement);
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
										options.emptyStateElement.style.display = 'block';
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

	// if no selector is provided then body is the default
	// buttons visibility are configurable
	showEmptyState({ selector } = {}, callback) {
		const emptyStateContainer = document.querySelector(selector);

		if (!emptyStateContainer) throw new Error(`Invalid selector ${selector}`);
		if (!callback) throw new Error('callback parameter is required');

		const result = {};
		const emptyStateElement =  document.createElement('div');
		emptyStateElement.classList.add('well');
		emptyStateElement.classList.add('ai-empty-state');

		emptyStateElement.innerHTML = `<div class="ai-empty-state-content"
					<p>You haven’t added anything yet.</p>
					<p>Add sample data to preview this feature.</p>
					<p><button class="btn btn-primary">Generate AI Data</button></p>
				</div>`;

		// in the future, we can generate multiple buttons for each seeder
		// if the plugin developer passes a certain request or specifies certain seeder we show only one
		emptyStateElement.querySelector('button').onclick = () => {
			result.requestResult = this.request(this.options.generateOptions, callback);
		};
		this.options.generateOptions.emptyStateElement = emptyStateElement;
		emptyStateContainer.appendChild(emptyStateElement);
		return result;
	}

	static _startAIAnimation(emptyStateElement) {
		const animationElement = AiStateSeeder._createAIAnimationElement();
		if (emptyStateElement) {
			emptyStateElement.insertBefore(animationElement, emptyStateElement.querySelector('.ai-empty-state-content'));
		} else {
			animationElement.classList.add('ai-progress-overlay');
			document.body.append(animationElement);
		}
	}

	static _createAIAnimationElement() {
		const animationElement =  document.createElement('div');
		animationElement.classList.add('well');
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

	static _stopAIAnimation(emptyStateElement) {
		if (emptyStateElement) {
			const progressElement = emptyStateElement.querySelector('.ai-progress');
			progressElement.parentElement.removeChild(progressElement);
		} else {
			const progressElement = document.querySelector('.ai-progress-overlay');
			progressElement.parentElement.removeChild(progressElement);
		}
	}
};
