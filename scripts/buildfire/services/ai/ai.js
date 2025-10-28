if (typeof (buildfire) == 'undefined') throw ('please add buildfire.js first to use BuildFire services');

if (typeof (buildfire.ai) == 'undefined') buildfire.ai = {};

buildfire.ai.conversation = class Conversation {
    constructor () {
        this.messages = [];
    }

    systemSays(content) {
        this.messages.push({ role: "system", content });
    }

    assistantSays(content) {
        this.messages.push({ role: "assistant", content });
    }

    userSays(content) {
        this.messages.push({ role: "user", content });
    }

    fetchJsonResponse (params, callback) {
        if (!params) {
            params = {};
        }
        if (!params.jsonTemplate || typeof params.jsonTemplate != 'object') {
            callback('invalid JSON template');
            return;
        }
        const options = {
            messages: this.messages,
            jsonTemplate: params.jsonTemplate,
            hideAiAnimation: true
        }
        const p = new Packet(null, 'ai.chat', options);
        if (!params.hideAiAnimation) {
            this.startAIAnimation();
        }
        buildfire._sendPacket(p, (error, result) => {
            if (!params.hideAiAnimation) {
                this.stopAIAnimation();
            }
            if (callback) callback(error, result);
        });
    }

    fetchTextResponse (params, callback) {
        if (!params) {
            params = {};
        }

        const options = {
            messages: this.messages,
            hideAiAnimation: true
        }
        const p = new Packet(null, 'ai.chat', options);
        if (!params.hideAiAnimation) {
            this.startAIAnimation();
        }
        buildfire._sendPacket(p, (error, result) => {
            if (!params.hideAiAnimation) {
                this.stopAIAnimation();
            }
            if (callback) callback(error, result);
        });
    }

    clear () {
        this.messages = [];
    }

    startAIAnimation() {
		const emptyStateElement = document.body;
		const animationElement = this._createAIAnimationElement();
		animationElement.classList.add('ai-progress-overlay');
		emptyStateElement.prepend(animationElement);
	}

	_createAIAnimationElement() {
		const animationElement = document.createElement('div');
		animationElement.classList.add('ai-progress');
		animationElement.innerHTML =
			`<div id="cp-container-loader">
				<div class="ai-animation">
					<div class="square sq1"></div>
					<div class="square sq2"></div>
					<div class="square sq3"></div>
				</div>
				<p class="ai-text">Generating content...</p>
			</div>`;
		return animationElement;
	}

	 stopAIAnimation() {
		const progressElement = document.querySelector('.ai-progress-overlay');
		progressElement.parentElement.removeChild(progressElement);
	}
};