const roleService = require('../services/role.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');

/**
 * GET /admin/roles
 * Lấy danh sách tất cả roles với thống kê
 */
async function getRoles(req, res, next) {
    try {
        const roles = await roleService.getRoles();
        return res.json(JSend.success({ roles }));
    } catch (err) {
        console.error('Error fetching roles:', err);
        return next(new ApiError(500, 'Lỗi khi lấy danh sách roles'));
    }
}

/**
 * GET /admin/roles/:roleId
 * Lấy chi tiết role
 */
async function getRole(req, res, next) {
    try {
        const { roleId } = req.params;
        const role = await roleService.getRoleById(roleId);

        if (!role) {
            return next(new ApiError(404, 'Không tìm thấy role'));
        }

        return res.json(JSend.success({ role }));
    } catch (err) {
        console.error('Error fetching role:', err);
        return next(new ApiError(500, 'Lỗi khi lấy thông tin role'));
    }
}

/**
 * GET /admin/roles/:roleId/permissions
 * Lấy tất cả permissions của role
 */
async function getRolePermissions(req, res, next) {
    try {
        const { roleId } = req.params;

        // Kiểm tra role tồn tại
        const role = await roleService.getRoleById(roleId);
        if (!role) {
            return next(new ApiError(404, 'Không tìm thấy role'));
        }

        const permissions = await roleService.getRolePermissions(roleId);

        return res.json(JSend.success({
            role: {
                role_id: role.role_id,
                role_name: role.role_name,
                display_name: role.display_name
            },
            permissions
        }));
    } catch (err) {
        console.error('Error fetching role permissions:', err);
        return next(new ApiError(500, 'Lỗi khi lấy permissions của role'));
    }
}

/**
 * PUT /admin/roles/:roleId/permissions
 * Cập nhật permissions của role
 */
async function updateRolePermissions(req, res, next) {
    try {
        const { roleId } = req.params;
        const { permission_ids } = req.body;

        // Validate input
        if (!permission_ids || !Array.isArray(permission_ids)) {
            return next(new ApiError(400, 'permission_ids phải là một mảng'));
        }

        // Kiểm tra role tồn tại
        const role = await roleService.getRoleById(roleId);
        if (!role) {
            return next(new ApiError(404, 'Không tìm thấy role'));
        }

        // Không cho phép sửa permissions của customer
        if (role.role_name === 'customer') {
            return next(new ApiError(403, 'Không thể sửa permissions của customer role'));
        }

        await roleService.updateRolePermissions(roleId, permission_ids);

        return res.json(JSend.success({
            message: 'Cập nhật permissions thành công',
            role_id: parseInt(roleId),
            permission_count: permission_ids.length
        }));
    } catch (err) {
        console.error('Error updating role permissions:', err);
        return next(new ApiError(500, err.message || 'Lỗi khi cập nhật permissions'));
    }
}

/**
 * GET /admin/roles/:roleId/users
 * Lấy danh sách users có role này
 */
async function getRoleUsers(req, res, next) {
    try {
        const { roleId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Kiểm tra role tồn tại
        const role = await roleService.getRoleById(roleId);
        if (!role) {
            return next(new ApiError(404, 'Không tìm thấy role'));
        }

        const result = await roleService.getRoleUsers(roleId, parseInt(page), parseInt(limit));

        return res.json(JSend.success(result));
    } catch (err) {
        console.error('Error fetching role users:', err);
        return next(new ApiError(500, 'Lỗi khi lấy danh sách users'));
    }
}

module.exports = {
    getRoles,
    getRole,
    getRolePermissions,
    updateRolePermissions,
    getRoleUsers
};
