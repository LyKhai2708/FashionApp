const authService = require('../services/auth.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');
const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');

async function register(req, res, next) {
    try {
        const { username, email, password, phone, role } = req.body;
        
        // Validation
        if (!username || !email || !password) {
            return next(new ApiError(400, 'Username, email and password are required'));
        }
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new ApiError(400, 'Invalid email format'));
        }
        
        // Password strength validation
        if (password.length < 8) {
            return next(new ApiError(400, 'Password must be at least 8 characters long'));
        }
        
        // Password complexity validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(password)) {
            return next(new ApiError(400, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'));
        }
        
        const user = await authService.register({
            username,
            email,
            password,
            phone,
            role
        });
        
        return res.status(201).json(JSend.success({ 
            user,
            message: 'User registered successfully' 
        }));
        
    } catch (error) {
        console.log(error);
        if (error.message === 'User already exists') {
            return next(new ApiError(409, 'User with this email already exists'));
        }
        return next(new ApiError(500, 'An error occurred while registering user'));
    }
}

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
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
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
  register,
  login,
  refresh,
  logout,
};
