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

    getJsonResponse (jsonTemplate, callback) {
        if (!jsonTemplate || typeof jsonTemplate != 'object') {
            callback('invalid JSON template');
            return;
        }
        const options = {
            messages: this.messages,
            jsonTemplate: jsonTemplate
        }
        const p = new Packet(null, 'ai.chat', options);
        buildfire._sendPacket(p, callback);
    }

    getTextResponse (params, callback) {
        const options = {
            messages: this.messages,
        }
        const p = new Packet(null, 'ai.chat', options);
        buildfire._sendPacket(p, callback);
    }

    clear () {
        this.messages = [];
    }
};