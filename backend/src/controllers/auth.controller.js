const authService = require('../services/auth.service');
const ApiError = require('../api-error');
const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
    if(!email || !password) {
        return next(new ApiError(400, 'Email and password are required'));
    }
    const result = await authService.login(email, password);

    if(!result) {
        return next(new ApiError(401, 'Invalid email or password'));
    }
    const {user, accessToken, refreshToken} = result;

    res.cookie('refreshToken', refreshToken, 
        { httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
         });
    return res.json({
      status: "success",
      data: {
        user: { id: user.user_id, email: user.email, role: user.role },
        accessToken,
      },
    });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, 'An error occurred while logging in'));
    }
}
async function refresh(req, res, next) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return next(new ApiError(401, 'No refresh token'));
  
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await userService.getUserById(decoded.id);
      if (!user) return next(new ApiError(401, 'Invalid user'));
  
      const newAccessToken = authService.generateAccessToken(user);
      return res.json({
        status: "success",
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (err) {
      return next(new ApiError(403, 'Invalid refresh token'));
    }
}

function logout(req, res) {
  res.clearCookie("refreshToken");
  return res.json({ status: "success", message: "Logged out" });
}
  
module.exports = {
  login,
  refresh,
  logout,
};
