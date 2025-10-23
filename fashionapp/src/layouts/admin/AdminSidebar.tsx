import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../../contexts/admin/SidebarContext';
import { Package, Shirt, Tag, User, Ticket } from 'lucide-react';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

const navItems: NavItem[] = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
      </svg>
    ),
    name: "Dashboard",
    path: "/admin/dashboard",
  },
  {
    icon: (
      <Shirt/>
    ),
    name: "Products",
    subItems: [
      { name: "All Products", path: "/admin/products" },
      { name: "Add Product", path: "/admin/products/add" },
      { name: "Categories", path: "/admin/categories" },
      { name: "Brands", path: "/admin/brands" },
      { name: "Colors", path: "/admin/colors" },
      { name: "Sizes", path: "/admin/sizes" },
    ],
  },
  {
    icon: (
      <Package/>
    ),
    name: "Orders",
    path: "/admin/orders",
  },
  {
    icon: (
      <User/>
    ),
    name: "Users",
    path: "/admin/users",
  },
  {
    icon: (
      <Tag/>
    ),
    name: "Promotions",
    path: "/admin/promotions",
  },
  {
    icon: (
      <Ticket/>
    ),
    name: "Vouchers",
    path: "/admin/vouchers",
  },
];

const AdminSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu(openSubmenu === index ? null : index);
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setIsHovered(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 dark:text-white h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
          ${
            isExpanded || isMobileOpen
              ? "w-[290px]"
              : isHovered
              ? "w-[290px]"
              : "w-[90px]"
          }
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div
          className={`py-6 px-6 border-b border-gray-200 dark:border-gray-800 flex ${
            !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
        >
          <Link to="/admin/dashboard">
            {isExpanded || isHovered || isMobileOpen ? (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Fashion Admin
              </h1>
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={item.name}>
                {item.subItems ? (
                  // Menu with submenu
                  <div>
                    <button
                      onClick={() => handleSubmenuToggle(index)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        openSubmenu === index
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                      } ${
                        !isExpanded && !isHovered
                          ? "lg:justify-center"
                          : "lg:justify-start"
                      }`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <>
                          <span className="ml-3">{item.name}</span>
                          <svg
                            className={`ml-auto w-4 h-4 transition-transform ${
                              openSubmenu === index ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>

                    {item.subItems && (isExpanded || isHovered || isMobileOpen) && (
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          openSubmenu === index ? "max-h-96 mt-2" : "max-h-0"
                        }`}
                      >
                        <ul className="ml-8 space-y-1">
                          {item.subItems.map((subItem) => (
                            <li key={subItem.name}>
                              <Link
                                to={subItem.path}
                                className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                                  isActive(subItem.path)
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                                }`}
                              >
                                {subItem.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  // Simple menu item
                  <Link
                    to={item.path!}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive(item.path!)
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    } ${
                      !isExpanded && !isHovered
                        ? "lg:justify-center"
                        : "lg:justify-start"
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="ml-3">{item.name}</span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;