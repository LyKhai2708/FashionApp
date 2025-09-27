const jwt = require('jsonwebtoken');
const ApiError = require('../api-error');
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  const token = authHeader.split(' ')[1]; // Lấy token từ "Bearer <token>"

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded; // Lưu thông tin user vào req
    next();
  } catch (err) {
    next(new ApiError(403, 'Invalid token'));
  }
};

function authorizeRoles(roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ status: "error", message: "Access denied" });
      }
      next();
    };
  }

module.exports = { authMiddleware, authorizeRoles };