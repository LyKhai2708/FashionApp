import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/admin/AdminAuthContext';

import AdminLogin from '../../pages/admin/AdminLogin';
import AdminLayout from '../../layouts/admin/AdminLayout';
import Dashboard from '../../pages/admin/Dashboard';
import Orders from '../../pages/admin/Orders';
import OrderDetail from '../../pages/admin/OrderDetail';
import Users from '../../pages/admin/Users';
import Products from '../../pages/admin/Products';
import AddProduct from '../../pages/admin/AddProduct';
import EditProduct from '../../pages/admin/EditProduct';
import Colors from '../../pages/admin/Colors';
import Sizes from '../../pages/admin/Sizes';
import Categories from '../../pages/admin/Categories';
import Brands from '../../pages/admin/Brands';
import Vouchers from '../../pages/admin/Vouchers';
import Promotions from '../../pages/admin/Promotions';
import PromotionProducts from '../../pages/admin/PromotionProducts';
import Banners from '../../pages/admin/Banners';
import Inventory from '../../pages/admin/Inventory';

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
                <Route path="products" element={<Products />} />
                <Route path="products/add" element={<AddProduct />} />
                <Route path="products/edit/:id" element={<EditProduct />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="users" element={<Users />} />
                <Route path="colors" element={<Colors />} />
                <Route path="sizes" element={<Sizes />} />
                <Route path="categories" element={<Categories />} />
                <Route path="brands" element={<Brands />} />
                <Route path="promotions" element={<Promotions />} />
                <Route path="promotions/:promo_id/products" element={<PromotionProducts />} />
                <Route path="vouchers" element={<Vouchers />} />
                <Route path="banners" element={<Banners />} />
                <Route path="inventory" element={<Inventory />} />
            </Route>

            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
    );
};

export default AdminRoutes;