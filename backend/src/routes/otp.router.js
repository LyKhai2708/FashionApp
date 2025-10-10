
const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otp.controller');

module.exports.setup = (app) => {
    app.use('/api/v1/otp', router);
    router.post('/OtpSend', otpController.sendOtpRegister);
    router.post('/OtpVerify', otpController.verifyOtpRegister);
}
