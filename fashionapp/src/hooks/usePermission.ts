import { useAdminAuth } from '../contexts/admin/AdminAuthContext';

export const usePermission = () => {
    const { user } = useAdminAuth();
    const permissions = user?.permissions || [];

    /**
     * Check if user has a specific permission
     */
    const hasPermission = (permission: string): boolean => {
        // Admin role has ALL permissions
        if (user?.role === 'admin') {
            return true;
        }

        return permissions.includes(permission);
    };

    /**
     * Check if user has ANY of the permissions in the list
     */
    const hasAnyPermission = (permissionList: string[]): boolean => {
        if (user?.role === 'admin') {
            return true;
        }

        return permissionList.some(p => permissions.includes(p));
    };

    /**
     * Check if user has ALL permissions in the list
     */
    const hasAllPermissions = (permissionList: string[]): boolean => {
        if (user?.role === 'admin') {
            return true;
        }

        return permissionList.every(p => permissions.includes(p));
    };

    /**
     * Check if user has ANY permission related to a resource
     * e.g., hasResourceAccess('products') checks for products.create, products.edit, products.delete, etc.
     */
    const hasResourceAccess = (resource: string): boolean => {
        if (user?.role === 'admin') {
            return true;
        }

        return permissions.some(p => p.startsWith(`${resource}.`));
    };

    /**
     * Check if user is admin
     */
    const isAdmin = (): boolean => {
        return user?.role === 'admin';
    };

    return {
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasResourceAccess,
        isAdmin,
    };
};
