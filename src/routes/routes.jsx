// src/routes/AppRoutes.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";

// Lazy load pages
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const Home = lazy(() => import("../pages/Home"));
const ChatPage = lazy(() => import("../pages/ChatPage"));

export const AppRoutes = () => {
    return (
        <Router>
            <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
                <Routes>
                    {/* Public Routes - without authentication */}
                    <Route path="/" element={<Home />} />
                    
                    {/* Auth routes with PublicRoute protection */}
                    <Route path="/login" element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    } />
                    
                    <Route path="/register" element={
                        <PublicRoute>
                            <RegisterPage />
                        </PublicRoute>
                    } />
                    
                    {/* Protected Routes - require authentication */}
                    <Route path="/chat" element={
                        <PrivateRoute>
                            <ChatPage />
                        </PrivateRoute>
                    } />
                    
                    {/* 404 fallback */}
                    <Route path="*" element={<div className="text-center mt-10">Page Not Found</div>} />
                </Routes>
            </Suspense>
        </Router>
    );
};