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
    
    fetchTextResponse(params, callback) {
        if (!params || !params.message || typeof params != 'object') {
            callback('invalid parameters');
            return;
        }
        const options = {
            ...params,
            hideAiAnimation: true,
        }

        const p = new Packet(null, 'ai.persistentConversation', options);
        if (!params.hideAiAnimation) {
            buildfire.ai.startAIAnimation(params);
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

buildfire.ai.startAIAnimation = function(options) {
    if (!options) options = {};
    if (!options.loadingMessage) options.loadingMessage = 'Generating content...';
    buildfire.spinner.show(options);
}

buildfire.ai.stopAIAnimation = function() {
    buildfire.spinner.hide();
}