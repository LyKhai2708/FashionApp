const { getRequiredPermission, getUserPermissions, getUserRoles } = require('../helpers/permission.helper');
const ApiError = require('../api-error');

/**
 * Middleware check quyền tự động
 * 
 * CHỈ áp dụng cho routes được define trong PERMISSION_ROUTES
 * Routes không có trong config sẽ pass through (chỉ check auth)
 * 
 * Cách dùng: Thêm vào route cần check quyền
 * VD: router.post('/', authMiddleware, checkPermission, controller.create);
 */
const checkPermission = async (req, res, next) => {
    try {
        const method = req.method;
        const path = req.baseUrl + (req.route?.path || req.path);

        // lay permission can thiet cho route nay
        const requiredPermission = getRequiredPermission(method, path);

        // route khong co trong config = khong can check permission
        // chỉ can authentication (neu co authMiddleware)
        if (!requiredPermission) {
            return next();
        }

        //kiem tra da authenticate chua
        if (!req.user || !req.user.id) {
            return next(new ApiError(401, 'Vui lòng đăng nhập'));
        }

        // lay roles cua user tu user_roles table
        const userRoles = await getUserRoles(req.user.id);

        //admin toan quyen bypass check
        if (userRoles.includes('admin')) {
            return next();
        }

        // lay permissions cua user
        const userPermissions = await getUserPermissions(req.user.id);

        //check xem user co permission nay khong
        if (!userPermissions.includes(requiredPermission)) {
            return res.status(403).json({
                status: 'fail',
                message: 'Bạn không có quyền thực hiện hành động này, yêu cầu quyền cao hơn',
                required_permission: requiredPermission
            });

        }

        //co per cho phep tiep tuc
        next();
    } catch (error) {
        console.error('Permission check error:', error);
        next(new ApiError(500, 'Lỗi kiểm tra quyền'));
    }
};

module.exports = { checkPermission };
