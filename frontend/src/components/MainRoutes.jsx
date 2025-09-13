import React from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import HomePage from "../pages/Home.jsx";
import RepetPage from "../pages/Repet.jsx";
import TranslatePage from "../pages/Translate.jsx";
import AdminPage from "../pages/Admin.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
import ProfilePage from "../pages/Profile.jsx";

const MainRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/repet" element={<RepetPage />} />
                <Route path="/translate" element={<TranslatePage />} />
                <Route path="/profile" element={<ProfilePage />} />

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