import { makeAutoObservable } from "mobx";

export class TokenStore {
    token = null;

    constructor() {
        makeAutoObservable(this);
    }

    saveToken(token) {
        this.token = token;
        localStorage.setItem("auth_token", token);
    }

    loadToken() {
        const saved = localStorage.getItem("auth_token");
        if (saved) {
            this.token = saved;
        }
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem("auth_token");
    }

    get isAuthenticated() {
        return !!this.token;
    }
}
