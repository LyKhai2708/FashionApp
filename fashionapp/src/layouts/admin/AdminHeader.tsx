import React from 'react';
import { useSidebar } from '../../contexts/admin/SidebarContext';
import { useAdminAuth } from "../../contexts/admin/AdminAuthContext"
import {useMessage} from '../../App';
import { Menu, X, LogOut } from 'lucide-react';

const AdminHeader: React.FC = () => {
  const { logout } = useAdminAuth();
  const message = useMessage();
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      message.success("Logout successfully");
    } catch (error: any) {
      message.error(error.message);
    }
  }

  return (
    <header className="sticky top-0 flex w-full bg-white border-b border-gray-200 z-50 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between w-full px-4 py-3 lg:px-6 lg:py-4">
        {/* Left side - Toggle button */}
        <div className="flex items-center gap-4">
          <button
            className="flex items-center justify-center w-10 h-10 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 lg:h-11 lg:w-11"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Logo for mobile */}
          <div className="lg:hidden">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Fashion Admin
            </h1>
          </div>
        </div>

        {/* Right side - User info */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, Admin
            </span>
          </div>
          
          {/* User avatar */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
            
            {/* Logout button */}
            <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
            onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;