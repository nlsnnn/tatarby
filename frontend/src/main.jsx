import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { RootStoreProvider } from "./stores/RootStoreContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <RootStoreProvider>
            <App />
        </RootStoreProvider>
    </React.StrictMode>
);
