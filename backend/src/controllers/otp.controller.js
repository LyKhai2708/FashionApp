const otpService = require('../services/otp.service');
const knex = require('../database/knex');

async function sendOtpRegister(req, res) {
    try {
        const { phone } = req.body;
        
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu số điện thoại'
            });
        }

        const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại không hợp lệ'
            });
        }

        const existingUser = await knex('users').where({ phone }).first();
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại đã được đăng ký'
            });
        }

        const result = await otpService.sendOtpForRegister(phone);
        
        res.json({
            success: true,
            message: result.message,
            data: { expiresAt: result.expiresAt }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function verifyOtpRegister(req, res) {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu số điện thoại hoặc OTP'
            });
        }

        const result = await otpService.verifyOtpForRegister(phone, otp);

        res.status(200).json({
            success: true,
            message: result.message,
            data: {phoneVerified: true}
        });
    } catch (error) {
        console.error('Verify OTP register error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Xác thực OTP thất bại'
        });
    }
}
module.exports = {
    sendOtpRegister,
    verifyOtpRegister
}