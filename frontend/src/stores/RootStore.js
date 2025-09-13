import { TokenStore } from "./TokenStore";
import {ChatStore} from "./ChatStore.js";

export class RootStore {
    constructor() {
        this.token = new TokenStore();
        this.chat = new ChatStore();
    }
}
