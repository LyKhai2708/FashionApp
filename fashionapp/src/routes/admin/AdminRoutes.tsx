// src/admin/routes/AdminRoutes.tsx - FILE MỚI

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/admin/AdminAuthContext';

// Admin pages
import AdminLogin from '../../pages/admin/AdminLogin';
import AdminLayout from '../../layouts/admin/AdminLayout';
import Dashboard from '../../pages/admin/Dashboard';

const AdminRoutes: React.FC = () => {
    const { isAuthenticated } = useAdminAuth();

    return (
        <Routes>
            <Route 
                path="/login" 
                element={
                    isAuthenticated ? (
                        <Navigate to="/admin/dashboard" replace />
                    ) : (
                        <AdminLogin />
                    )
                } 
            />

            <Route
                path="/*"
                element={
                    isAuthenticated ? (
                        <AdminLayout />
                    ) : (
                        <Navigate to="/admin/login" replace />
                    )
                }
            >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                <Route path="products" element={<div>Products</div>} />
                <Route path="orders" element={<div>Orders</div>} />
                <Route path="users" element={<div>Users</div>} />
            </Route>

            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
    );
};

export default AdminRoutes;