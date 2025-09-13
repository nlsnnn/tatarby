import React from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import HomePage from "../pages/Home.jsx";
import RepetPage from "../pages/Repet.jsx";
import TranslatePage from "../pages/Translate.jsx";
import LoginPage from "../pages/Login.jsx";
import AdminPage from "../pages/Admin.jsx";
import PrivateRoute from "./PrivateRoute.jsx";

const MainRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/repet" element={<RepetPage />} />
                <Route path="/translate" element={<TranslatePage />} />
                <Route path="/login" element={<LoginPage />} />

                <Route
                    path="/admin"
                    element={
                        <PrivateRoute role="admin">
                            <AdminPage />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};

export default MainRoutes;