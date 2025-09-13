import React, { createContext, useContext } from "react";
import { RootStore } from "./RootStore";

const RootStoreContext = createContext(null);

export const RootStoreProvider = ({ children }) => {
    const store = new RootStore();
    store.token.loadToken();
    return (
        <RootStoreContext.Provider value={store}>
            {children}
        </RootStoreContext.Provider>
    );
};

export const useStores = () => {
    const store = useContext(RootStoreContext);
    if (!store) {
        throw new Error("useStores must be used within RootStoreProvider");
    }
    return store;
};
