const authService = require('../services/auth.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');
const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');

async function register(req, res, next) {
    try {
        const { username, email, password, phone, role } = req.body;
        
        if (!username || !email || !password || !phone) {
            return next(new ApiError(400, 'Thiếu thông tin'));
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new ApiError(400, 'Sai định dạng email'));
        }
        
        if (password.length < 8) {
            return next(new ApiError(400, 'Mật khẩu dài ít nhất 8 ký tự'));
        }
        

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(password)) {
            return next(new ApiError(400, 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa, một chữ cái viết thường, một số và một ký tự đặc biệt'));
        }
        const userdata = { username, email, password, role };
        const result = await authService.register(
            phone, userdata
        );
        
        // const token = authService.generateAccessToken(result);
        // const refreshToken = authService.generateRefreshToken(result);
        // res.cookie('refreshToken', refreshToken, 
        //     { httpOnly: true,
        //         secure: process.env.NODE_ENV === 'production',
        //         sameSite: 'strict',
        //         maxAge: 7 * 24 * 60 * 60 * 1000
        // });
        return res.status(201).json(JSend.success({ 
            message: 'Đăng ký thành công',
            user: {
                    id: result.user_id,
                    username: result.username,
                    email: result.email,
                    phone: result.phone,
                    role: 'customer'
            },
        }));
        
    } catch (error) {
        console.log(error);
        if (error.message === 'User already exists') {
            return next(new ApiError(409, 'Email đã được sử dụng'));
        }
        if(error.message === 'Số điện thoại chưa được xác thực') {
            return next(new ApiError(409, 'Số điện thoại chưa được xác thực'));
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
    const {user, token, refreshToken} = result;

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
        token,
      },
    });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, 'An error occurred while logging in'));
    }
}

async function adminLogin(req, res, next) {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            return next(new ApiError(400, 'Email and password are required'));
        }
        
        const result = await authService.login(email, password);
        if(!result) {
            return next(new ApiError(401, 'Invalid email or password'));
        }
        
        const {user, token, refreshToken} = result;

        if(user.role !== 'admin') {
            return next(new ApiError(403, 'Access denied. Admin privileges required.'));
        }

        res.cookie('adminRefreshToken', refreshToken, 
            { httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
        
        return res.json({
            status: "success",
            data: {
                user: { id: user.user_id, email: user.email, role: user.role },
                token,
            },
        });
    } catch (error) {
        console.log(error);
        return next(new ApiError(500, 'An error occurred while logging in'));
    }
}


async function refresh(req, res, next) {
    const userRefreshToken = req.cookies.refreshToken;
    const adminRefreshToken = req.cookies.adminRefreshToken;
    
    const refreshToken = adminRefreshToken || userRefreshToken;
    
    if (!refreshToken) return next(new ApiError(401, 'No refresh token'));
  
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = await userService.getUserById(decoded.id);
      if (!user) return next(new ApiError(401, 'Invalid user'));
  
      const newAccessToken = authService.generateAccessToken(user);
      return res.json({
        status: "success",
        data: {
          token: newAccessToken,
        },
      });
    } catch (err) {
      return next(new ApiError(401, 'Invalid or expired refresh token'));
    }
}

function logout(req, res) {
  res.clearCookie("refreshToken");
  return res.json({ status: "success", message: "Logged out" });
}

function adminLogout(req, res) {
  res.clearCookie("adminRefreshToken");
  return res.json({ status: "success", message: "Admin logged out" });
}
  


module.exports = {
  adminLogin,
  adminLogout,
  register,
  login,
  refresh,
  logout,
};
