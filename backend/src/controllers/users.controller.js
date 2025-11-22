const userService = require('../services/user.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');
const { getUserPermissions, getUserRoles } = require('../helpers/permission.helper');

/**
 * POST /users
 * Tạo user mới (admin only)
 */
async function createUser(req, res, next) {
  try {
    const { username, password, email, phone, role_id } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return next(new ApiError(400, 'username, email và password là bắt buộc'));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ApiError(400, 'Email không hợp lệ'));
    }

    // Validate password strength
    if (password.length < 8) {
      return next(new ApiError(400, 'Mật khẩu phải có ít nhất 8 ký tự'));
    }

    // Create user with role
    const newUser = await userService.createUser({
      username,
      password,
      email,
      phone,
      is_active: 1
    }, role_id);

    return res.status(201).json(JSend.success({ user: newUser }));
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return next(new ApiError(400, 'Email hoặc username đã tồn tại'));
    }
    return next(new ApiError(500, 'Lỗi khi tạo user'));
  }
}

// GET /users
async function getUsers(req, res, next) {
  try {
    const result = await userService.getManyUsers(req.query);
    return res.json(JSend.success(result));
  } catch (err) {
    return next(new ApiError(500, 'Error fetching users'));
  }
}
async function findUserByEmail(email) {
  try {
    const user = await userService.getUserByEmail(email);
    return user;
  } catch (err) {
    return null;
  }
}
// GET /users/:id
async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    const { getUserPermissions } = require('../helpers/permission.helper');
    const isViewingSelf = req.user && req.user.id == id;

    if (!isViewingSelf) {
      const userPermissions = await getUserPermissions(req.user.id);
      const hasPermission = userPermissions.includes('users.view');

      if (!hasPermission) {
        return next(new ApiError(403, 'Bạn không có quyền xem thông tin user khác'));
      }
    }

    return res.json(JSend.success({ user }));
  } catch (err) {
    console.error('Error fetching user:', err);
    return next(new ApiError(500, 'Error fetching user'));
  }
}

// PATCH /users/:id
async function updateUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = req.user.id;

    if (userId !== currentUserId) {
      const userRoles = await getUserRoles(currentUserId);
      if (!userRoles.includes('admin')) {
        const userPermissions = await getUserPermissions(currentUserId);
        if (!userPermissions.includes('users.edit')) {
          return next(new ApiError(403, 'Bạn không có quyền sửa thông tin user khác'));
        }
      }
    }

    const updated = await userService.updateUser(req.params.id, req.body);
    if (!updated) return next(new ApiError(404, 'User not found'));
    return res.json(JSend.success({ user: updated }));
  } catch (err) {
    return next(new ApiError(500, 'Error updating user'));
  }
}

// DELETE /users/:id
async function deleteUser(req, res, next) {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    if (!deleted) return next(new ApiError(404, 'User not found'));
    return res.json(JSend.success({ user: deleted }));
  } catch (err) {
    return next(new ApiError(500, 'Error deleting user'));
  }
}

async function getMyInformation(req, res, next) {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) return next(new ApiError(404, 'User not found'));
    return res.json(JSend.success({ user }));
  } catch (err) {
    return next(new ApiError(500, 'Error fetching user'));
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return next(new ApiError(400, 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc'));
    }

    if (newPassword.length < 8) {
      return next(new ApiError(400, 'Mật khẩu mới phải có ít nhất 8 ký tự'));
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return next(new ApiError(400, 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'));
    }

    const result = await userService.changePassword(userId, currentPassword, newPassword);
    return res.json(JSend.success(result));

  } catch (err) {
    return next(new ApiError(500, err.message));
  }
}

/**
 * GET /admin/users/:id/role
 * Lấy role hiện tại của user
 */
async function getUserRole(req, res, next) {
  try {
    const { id } = req.params;

    // Kiểm tra user tồn tại
    const user = await userService.getUserById(id);
    if (!user) {
      return next(new ApiError(404, 'Không tìm thấy user'));
    }

    const role = await userService.getUserRole(id);

    return res.json(JSend.success({
      user_id: parseInt(id),
      role: role || null
    }));
  } catch (err) {
    console.error('Error fetching user role:', err);
    return next(new ApiError(500, 'Lỗi khi lấy role của user'));
  }
}

/**
 * PUT /admin/users/:id/role
 * Cập nhật role của user (replace role cũ)
 */
async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    // Validate input
    if (!role_id) {
      return next(new ApiError(400, 'role_id là bắt buộc'));
    }

    // Kiểm tra user tồn tại
    const user = await userService.getUserById(id);
    if (!user) {
      return next(new ApiError(404, 'Không tìm thấy user'));
    }

    // Admin gán role cho user
    const assignedBy = req.user.user_id || null;

    await userService.updateUserRole(id, role_id, assignedBy);

    // Lấy role mới để trả về
    const newRole = await userService.getUserRole(id);

    return res.json(JSend.success({
      message: 'Cập nhật role thành công',
      user_id: parseInt(id),
      role: newRole
    }));
  } catch (err) {
    console.error('Error updating user role:', err);
    return next(new ApiError(500, err.message || 'Lỗi khi cập nhật role'));
  }
}

module.exports = {
  findUserByEmail,
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getMyInformation,
  changePassword,
  getUserRole,
  updateUserRole
};

