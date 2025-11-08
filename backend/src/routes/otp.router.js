
const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otp.controller');
const {authMiddleware} = require('../middleware/auth.middleware');
module.exports.setup = (app) => {
    app.use('/api/v1/otp', router);
    router.post('/OtpSend', otpController.sendOtpRegister);
    router.post('/OtpVerify', otpController.verifyOtpRegister);
    
    // add phone OTP
    router.post('/sendAddPhoneOtp', authMiddleware, otpController.sendAddPhoneOtp);
    router.post('/verifyAddPhone', authMiddleware, otpController.verifyAddPhone);
}
