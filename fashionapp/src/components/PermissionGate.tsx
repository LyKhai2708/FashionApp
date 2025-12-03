import React from 'react';
import { usePermission } from '../hooks/usePermission';
import { Tooltip } from 'antd';

interface PermissionGateProps {
    permission: string | string[];
    mode?: 'any' | 'all';
    children: React.ReactElement;
    fallback?: React.ReactNode;
    showTooltip?: boolean;
    tooltipMessage?: string;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
    permission,
    mode = 'any',
    children,
    fallback = null,
    showTooltip = false,
    tooltipMessage = 'Bạn không có quyền thực hiện hành động này',
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

    const permissionArray = Array.isArray(permission) ? permission : [permission];

    let hasAccess: boolean;
    if (permissionArray.length === 1) {
        hasAccess = hasPermission(permissionArray[0]);
    } else {
        hasAccess = mode === 'any'
            ? hasAnyPermission(permissionArray)
            : hasAllPermissions(permissionArray);
    }

    if (!hasAccess) {
        if (showTooltip && fallback) {
            return (
                <Tooltip title={tooltipMessage}>
                    <span>{fallback}</span>
                </Tooltip>
            );
        }
        return <>{fallback}</>;
    }

    return children;
};
