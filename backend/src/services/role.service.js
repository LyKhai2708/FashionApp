const knex = require('../database/knex');
const Paginator = require('./paginator');

function rolesRepository() {
    return knex('roles');
}

function permissionsRepository() {
    return knex('permissions');
}

function rolePermissionsRepository() {
    return knex('role_permissions');
}

function userRolesRepository() {
    return knex('user_roles');
}

/**
 * Lấy tất cả roles với thống kê
 */
async function getRoles() {
    const results = await rolesRepository()
        .select(
            'roles.role_id',
            'roles.role_name',
            'roles.display_name',
            'roles.description',
            knex.raw('COUNT(DISTINCT user_roles.user_id) as user_count'),
            knex.raw('COUNT(DISTINCT role_permissions.permission_id) as permission_count')
        )
        .leftJoin('user_roles', 'roles.role_id', 'user_roles.role_id')
        .leftJoin('role_permissions', 'roles.role_id', 'role_permissions.role_id')
        .groupBy('roles.role_id', 'roles.role_name', 'roles.display_name', 'roles.description')
        .orderByRaw(`
            CASE roles.role_name
                WHEN 'admin' THEN 1
                WHEN 'manager' THEN 2
                WHEN 'staff' THEN 3
                WHEN 'customer' THEN 4
            END
        `);

    return results;
}

/**
 * Lấy chi tiết role theo ID
 */
async function getRoleById(roleId) {
    const role = await rolesRepository()
        .where('role_id', roleId)
        .select('role_id', 'role_name', 'display_name', 'description', 'is_active')
        .first();

    return role || null;
}

/**
 * Lấy tất cả permissions của một role
 */
async function getRolePermissions(roleId) {
    const results = await permissionsRepository()
        .select(
            'permissions.permission_id',
            'permissions.permission_name',
            'permissions.display_name',
            'permissions.description',
            'permissions.module'
        )
        .join('role_permissions', 'permissions.permission_id', 'role_permissions.permission_id')
        .where('role_permissions.role_id', roleId)
        .orderBy('permissions.module')
        .orderBy('permissions.permission_name');

    return results;
}

/**
 * Cập nhật permissions của role (replace toàn bộ)
 */
async function updateRolePermissions(roleId, permissionIds) {
    return await knex.transaction(async (trx) => {
        // Xóa tất cả permissions cũ
        await trx('role_permissions')
            .where('role_id', roleId)
            .delete();

        // Thêm permissions mới
        if (permissionIds && permissionIds.length > 0) {
            const insertData = permissionIds.map(permId => ({
                role_id: roleId,
                permission_id: permId
            }));

            await trx('role_permissions').insert(insertData);
        }

        return true;
    });
}

/**
 * Lấy danh sách users có role cụ thể
 */
async function getRoleUsers(roleId, page = 1, limit = 20) {
    const paginator = new Paginator(page, limit);

    let results = await knex('users')
        .select(
            knex.raw('COUNT(users.user_id) OVER() AS recordCount'),
            'users.user_id',
            'users.username',
            'users.email',
            'users.phone',
            'users.is_active',
            'users.created_at'
        )
        .join('user_roles', 'users.user_id', 'user_roles.user_id')
        .where('user_roles.role_id', roleId)
        .orderBy('users.created_at', 'desc')
        .limit(paginator.limit)
        .offset(paginator.offset);

    let totalRecords = 0;
    results = results.map((result) => {
        totalRecords = result.recordCount;
        delete result.recordCount;
        return result;
    });

    return {
        users: results,
        metadata: paginator.getMetadata(totalRecords)
    };
}

module.exports = {
    getRoles,
    getRoleById,
    getRolePermissions,
    updateRolePermissions,
    getRoleUsers
};
