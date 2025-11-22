

const express = require('express');
const router = express.Router();
const emailVerificationController = require('../controllers/email-verification.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

module.exports.setup = (app) => {
    app.use('/api/v1/email-verifications', router);

    router.post('/', emailVerificationController.sendVerificationRegister);

    // Verify email token - RESTful: PATCH /resource/:id
    router.patch('/:token', emailVerificationController.verifyEmail);

    // Change email verification (requires auth) - RESTful: POST /resource with auth context
    router.post('/change-email', authMiddleware, emailVerificationController.sendVerificationChangeEmail);
};
