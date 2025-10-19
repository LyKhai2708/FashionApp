import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../../contexts/admin/SidebarContext';
import AdminHeader from './AdminHeader';
import Sidebar from './AdminSidebar';

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <Sidebar />
      
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AdminHeader />
        
        <main className="p-4 mx-auto max-w-7xl md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AdminLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AdminLayout;