import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../layouts/admin/AdminLayout';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/Dashboard';
import { useAuth } from '../contexts/AuthContext';

const AdminApp: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || user?.role !== 'admin') {
    return <AdminLogin />;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminApp;
