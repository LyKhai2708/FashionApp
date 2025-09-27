const userService = require('../services/user.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');

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
    const user = await userService.getUserById(req.params.id);
    if (!user) return next(new ApiError(404, 'User not found'));
    return res.json(JSend.success({ user }));
  } catch (err) {
    return next(new ApiError(500, 'Error fetching user'));
  }
}

// PATCH /users/:id
async function updateUser(req, res, next) {
  try {
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

module.exports = {
  findUserByEmail,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
