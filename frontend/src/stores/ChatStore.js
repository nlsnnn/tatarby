import { makeAutoObservable } from "mobx";

export class ChatStore {
    messages = [];

    constructor() {
        makeAutoObservable(this);
    }

    addMessage(message) {
        this.messages.push({
            id: Date.now(),
            text: message,
            type: "user", // user | bot
        });
    }

    addBotMessage(message) {
        this.messages.push({
            id: Date.now(),
            text: message,
            type: "bot",
        });
    }

    clearChat() {
        this.messages = [];
    }
}
