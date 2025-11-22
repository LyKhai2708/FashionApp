const { PERMISSION_ROUTES } = require('../config/permission.config');
const knex = require('../database/knex');


function normalizePath(path) {
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * Khớp route pattern với URL thực tế
 * VD: 'GET /api/v1/products/:id' khớp với 'GET /api/v1/products/123'
 * 
 * @param {string} pattern - Route pattern như 'GET /api/v1/users/:id'
 * @param {string} method - HTTP method
 * @param {string} path - Actual request path
 * @returns {boolean}
 */
function matchRoute(pattern, method, path) {
    const [patternMethod, patternPath] = pattern.split(' ');

    if (patternMethod !== method) {
        return false;
    }

    const normalizedPath = normalizePath(path);
    const normalizedPattern = normalizePath(patternPath);


    const regexPath = normalizedPattern
        .replace(/:[^/]+/g, '[^/]+')  // Replace :id, :category_id etc
        .replace(/\*/g, '.*');         // Replace wildcards

    const regex = new RegExp(`^${regexPath}$`);
    return regex.test(normalizedPath);
}

//lay permission can thiet cho route => khong co tuc la public
function getRequiredPermission(method, path) {
    for (const [permission, config] of Object.entries(PERMISSION_ROUTES)) {
        if (config.paths.some(pattern => matchRoute(pattern, method, path))) {
            return permission;
        }
    }
    return null;
}

//lay tat ca permission cua 1 user tu database (co cache)
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 phut

async function getUserPermissions(userId) {
    const cacheKey = `user_${userId}`;
    const cached = permissionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.permissions;
    }

    try {
        const rows = await knex('user_roles as ur')
            .select('p.permission_name')
            .distinct()
            .innerJoin('roles as r', 'ur.role_id', 'r.role_id')
            .innerJoin('role_permissions as rp', 'r.role_id', 'rp.role_id')
            .innerJoin('permissions as p', 'rp.permission_id', 'p.permission_id')
            .where('ur.user_id', userId)
            .where('r.is_active', 1);

        const permissions = rows.map(row => row.permission_name);

        permissionCache.set(cacheKey, {
            permissions,
            timestamp: Date.now()
        });

        return permissions;
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        return [];
    }
}

//lay tat ca role cua 1 user tu database
async function getUserRoles(userId) {
    try {
        const rows = await knex('user_roles as ur')
            .select('r.role_name')
            .distinct()
            .innerJoin('roles as r', 'ur.role_id', 'r.role_id')
            .where('ur.user_id', userId)
            .where('r.is_active', 1);

        return rows.map(row => row.role_name);
    } catch (error) {
        console.error('Error fetching user roles:', error);
        return [];
    }
}

//clear permission cache
function clearPermissionCache() {
    permissionCache.clear();
}

module.exports = {
    matchRoute,
    getRequiredPermission,
    getUserPermissions,
    getUserRoles,
    clearPermissionCache
};
