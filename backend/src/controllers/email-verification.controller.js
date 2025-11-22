const emailVerificationService = require('../services/email-verification.service');
const knex = require('../database/knex');

/**
 * Create new email verification for registration
 * POST /api/v1/email-verifications
 */
async function sendVerificationRegister(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu địa chỉ email'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        // Check if email already registered
        const existingUser = await knex('users').where({ email }).first();
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được đăng ký'
            });
        }

        const result = await emailVerificationService.sendVerification(email, 'register');

        res.json({
            success: true,
            message: result.message,
            data: { expiresAt: result.expiresAt }
        });
    } catch (error) {
        console.error('Send verification register error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Không thể gửi email xác nhận'
        });
    }
}

/**
 * Verify email token (from link click)
 * PATCH /api/v1/email-verifications/:token
 */
async function verifyEmail(req, res) {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu token xác nhận'
            });
        }

        const result = await emailVerificationService.verifyToken(token);

        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                emailVerified: true,
                email: result.email,
                purpose: result.purpose
            }
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Xác thực email thất bại'
        });
    }
}


const bcrypt = require('bcrypt');



async function sendVerificationChangeEmail(req, res) {
    try {
        const userId = req.user.id;
        const { newEmail, password } = req.body;

        if (!newEmail || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email mới và mật khẩu là bắt buộc'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        // Verify password
        const user = await knex('users').where({ user_id: userId }).first();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản này đăng nhập bằng Google, không thể đổi email theo cách này'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu không chính xác'
            });
        }

        const result = await emailVerificationService.sendVerification(newEmail, 'change_email', userId);

        return res.json({
            success: true,
            message: result.message,
            data: { expiresAt: result.expiresAt }
        });
    } catch (err) {
        console.error('Send change email error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Không thể gửi email xác nhận'
        });
    }
}

module.exports = {
    sendVerificationRegister,
    verifyEmail,
    sendVerificationChangeEmail
};
