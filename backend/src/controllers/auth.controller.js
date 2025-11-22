const authService = require('../services/auth.service');
const ApiError = require('../api-error');
const JSend = require('../jsend');
const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');
const chatService = require('../services/chat.service');
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
    const userdata = { username, email, password, phone, role };
    const result = await authService.register(userdata);

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
    if (error.message === 'Số điện thoại chưa được xác thực') {
      return next(new ApiError(409, 'Số điện thoại chưa được xác thực'));
    }
    return next(new ApiError(500, 'An error occurred while registering user'));
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ApiError(400, 'Email/SĐT và mật khẩu là bắt buộc'));
    }
    const result = await authService.login(email, password);


    if (result.error) {
      if (result.error === 'GOOGLE_ONLY_ACCOUNT') {
        return next(new ApiError(403, 'GOOGLE_ONLY_ACCOUNT'));
      }
      if (result.error === 'USER_NOT_FOUND' || result.error === 'INVALID_PASSWORD') {
        return next(new ApiError(401, 'Email/SĐT hoặc mật khẩu không đúng'));
      }
      return next(new ApiError(401, 'Đăng nhập thất bại'));
    }

    const { user, token, refreshToken } = result;

    const guestToken = req.cookies.guest_token;
    if (guestToken) {

      await chatService.migrateGuestToUser(user.user_id, guestToken);
      res.clearCookie('guest_token');
    }

    res.cookie('refreshToken', refreshToken,
      {
        httpOnly: true,
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
    if (!email || !password) {
      return next(new ApiError(400, 'Email and password are required'));
    }

    const result = await authService.login(email, password);

    // Handle login errors
    if (result.error) {
      if (result.error === 'GOOGLE_ONLY_ACCOUNT') {
        return next(new ApiError(403, 'GOOGLE_ONLY_ACCOUNT'));
      }
      if (result.error === 'USER_NOT_FOUND' || result.error === 'INVALID_PASSWORD') {
        return next(new ApiError(401, 'Email hoặc mật khẩu không đúng'));
      }
      return next(new ApiError(401, 'Đăng nhập thất bại'));
    }

    const { user, token, refreshToken } = result;

    if (!user.role || user.role === 'customer') {
      return next(new ApiError(403, 'Tài khoản không có quyền truy cập admin panel'));
    }

    res.cookie('adminRefreshToken', refreshToken,
      {
        httpOnly: true,
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

  if (!userRefreshToken) return next(new ApiError(401, 'No refresh token'));

  try {
    const decoded = jwt.verify(userRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await userService.getUserById(decoded.id);
    if (!user) return next(new ApiError(401, 'Invalid user'));

    if (user.role === 'admin') {
      return next(new ApiError(403, 'Use admin refresh endpoint'));
    }

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

async function adminRefresh(req, res, next) {
  const adminRefreshToken = req.cookies.adminRefreshToken;

  if (!adminRefreshToken) return next(new ApiError(401, 'No admin refresh token'));

  try {
    const decoded = jwt.verify(adminRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await userService.getUserById(decoded.id);
    if (!user) return next(new ApiError(401, 'Invalid user'));

    if (!user.role || user.role === 'customer') {
      return next(new ApiError(403, 'Yêu cầu quyền admin'));
    }

    const newAccessToken = authService.generateAccessToken(user);
    return res.json({
      status: "success",
      data: {
        token: newAccessToken,
      },
    });
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired admin refresh token'));
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

async function googleLogin(req, res, next) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return next(new ApiError(400, 'Google ID token is required'));
    }

    const result = await authService.googleLogin(idToken);

    if (!result) {
      return next(new ApiError(401, 'Google authentication failed'));
    }

    const { user, token, refreshToken } = result;

    const guestToken = req.cookies.guest_token;
    if (guestToken) {
      await chatService.migrateGuestToUser(user.user_id, guestToken);
      res.clearCookie('guest_token');
    }

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      status: "success",
      data: {
        user: {
          id: user.user_id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          auth_provider: user.auth_provider,
          google_id: user.google_id
        },
        token,
      },
    });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, error.message || 'An error occurred during Google login'));
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new ApiError(400, 'Email là bắt buộc'));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ApiError(400, 'Email không hợp lệ'));
    }

    await authService.forgotPassword(email);

    return res.json({
      status: "success",
      message: "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn."
    });

  } catch (error) {
    console.log(error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.json({
        status: "success",
        message: "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn."
      });
    }

    if (error.message === 'GOOGLE_ONLY_ACCOUNT') {
      return next(new ApiError(400, 'Tài khoản này đăng nhập bằng Google. Vui lòng sử dụng Google để đăng nhập.'));
    }

    return next(new ApiError(500, 'Đã xảy ra lỗi khi xử lý yêu cầu'));
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return next(new ApiError(400, 'Token và mật khẩu mới là bắt buộc'));
    }

    if (password.length < 8) {
      return next(new ApiError(400, 'Mật khẩu phải có ít nhất 8 ký tự'));
    }

    if (password.length > 50) {
      return next(new ApiError(400, 'Mật khẩu không được vượt quá 50 ký tự'));
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return next(new ApiError(400, 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa, một chữ cái viết thường, một số và một ký tự đặc biệt'));
    }

    await authService.resetPassword(token, password);

    return res.json({
      status: "success",
      message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới."
    });

  } catch (error) {
    console.log(error);

    if (error.message === 'INVALID_OR_EXPIRED_TOKEN') {
      return next(new ApiError(400, 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'));
    }

    return next(new ApiError(500, 'Đã xảy ra lỗi khi đặt lại mật khẩu'));
  }
}

module.exports = {
  adminLogin,
  adminLogout,
  adminRefresh,
  register,
  login,
  googleLogin,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
