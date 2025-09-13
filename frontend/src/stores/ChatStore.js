import { makeAutoObservable } from "mobx";

export class ChatStore {
    messages = [];

    constructor() {
        makeAutoObservable(this);
        const saved = localStorage.getItem("chat_messages");
        if (saved) {
            try {
                this.messages = JSON.parse(saved);
            } catch (e) {
                console.warn("Failed to parse saved messages", e);
                this.messages = [];
            }
        }
    }

    persist() {
        try {
            localStorage.setItem("chat_messages", JSON.stringify(this.messages));
        } catch (e) {
            console.warn("Failed to persist chat messages (maybe quota exceeded)", e);
        }
    }

    // payload: either string (text) or { audio: dataURL, text?: string }
    addMessage(payload) {
        const msg = {
            id: Date.now() + Math.random(),
            type: (payload && payload.type) ? payload.type : "user",
            text: typeof payload === "string" ? payload : (payload?.text ?? ""),
            audio: typeof payload === "object" && payload?.audio ? payload.audio : null,
            createdAt: new Date().toISOString()
        };
        this.messages.push(msg);
        this.persist();
        return msg;
    }

    addBotMessage(payload) {
        const msg = {
            id: Date.now() + Math.random(),
            type: "bot",
            text: typeof payload === "string" ? payload : (payload?.text ?? ""),
            feedback: typeof payload === "object" ? payload.feedback : null,
            structure: typeof payload === "object" ? payload.structure : null,
            audio: null,
            createdAt: new Date().toISOString()
        };
        this.messages.push(msg);
        this.persist();
        return msg;
    }

    clearChat() {
        this.messages = [];
        localStorage.removeItem("chat_messages");
    }
}
