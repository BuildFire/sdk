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
            buildfire.ai.startAIAnimation();
        }
        buildfire._sendPacket(p, (error, result) => {
            if (!params.hideAiAnimation) {
                buildfire.ai.stopAIAnimation();
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
            buildfire.ai.startAIAnimation();
        }
        buildfire._sendPacket(p, (error, result) => {
            if (!params.hideAiAnimation) {
                buildfire.ai.stopAIAnimation();
            }
            if (callback) callback(error, result);
        });
    }

    clear () {
        this.messages = [];
    }

};

buildfire.ai.persistentConversation = class PersistentConversation {
    constructor (conversationId) {
        this.conversationId = conversationId;
    }
    
    fetchResponse(params, callback) {
        if (!params || !params.message) {
            callback('invalid parameters');
            return;
        }
        const options = {
            hideAiAnimation: true,
            ...params
        }

        const p = new Packet(null, 'ai.persistentConversation', options);
        if (!params.hideAiAnimation) {
            buildfire.ai.startAIAnimation();
        }
        buildfire._sendPacket(p, (error, result) => {
            if (!params.hideAiAnimation) {
                buildfire.ai.stopAIAnimation();
            }
            if (callback) callback(error, result);
        });
    }

    deleteConversation(params, callback) {
        if ((!params || !params.conversationId) && !this.conversationId) {
            callback('invalid parameters');
            return;
        }

        const p = new Packet(null, 'ai.deleteConversation', params);
        buildfire._sendPacket(p, (error, result) => {
            if (callback) callback(error, result);
        });
    }
}

buildfire.ai.startAIAnimation = function() {
    const emptyStateElement = document.body;
    const animationElement = buildfire.ai._createAIAnimationElement();
    animationElement.classList.add('ai-progress-overlay');
    emptyStateElement.prepend(animationElement);
}

buildfire.ai._createAIAnimationElement = function() {
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

buildfire.ai.stopAIAnimation = function() {
    const progressElement = document.querySelector('.ai-progress-overlay');
    progressElement.parentElement.removeChild(progressElement);
}