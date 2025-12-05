const knex = require('../database/knex');
const crypto = require('crypto');
const emailService = require('./email.service');

/**
 * Generate secure token (32 bytes = 64 hex chars)
 * Replaces old OTP generation
 */
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Send verification email (universal function)
 * @param {string} email - Email to verify
 * @param {string} purpose - 'register' or 'change_email'
 * @param {number|null} userId - Required for 'change_email', null for 'register'
 * @returns {Promise<{success: boolean, message: string, expiresAt: Date}>}
 */
async function sendVerification(email, purpose = 'register', userId = null) {
    try {
        // Validate purpose
        if (!['register', 'change_email'].includes(purpose)) {
            throw new Error('Invalid purpose. Must be "register" or "change_email"');
        }

        // For change_email, check if email is already in use
        if (purpose === 'change_email') {
            const existingUser = await knex('users')
                .where({ email })
                .first();

            if (existingUser) {
                throw new Error('Email này đã được sử dụng');
            }

            if (!userId) {
                throw new Error('userId is required for change_email purpose');
            }
        }

        // Delete old unverified requests for this email + purpose
        const deleteConditions = { email, purpose, is_verified: false };
        if (userId) {
            deleteConditions.user_id = userId;
        }

        await knex('otp_verifications')
            .where(deleteConditions)
            .delete();

        // Generate token and expiry
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Prepare record for database
        const record = {
            email,
            token,
            purpose,
            expires_at: expiresAt,
            attempts: 0,
            is_verified: false,
            created_at: new Date(),
            updated_at: new Date()
        };

        // Add user_id if provided
        if (userId) {
            record.user_id = userId;
        }

        // Save to database
        await knex('otp_verifications').insert(record);

        // Send email
        await emailService.sendVerificationEmail(email, token, purpose);

        console.log(`Verification email sent to ${email} (purpose: ${purpose})`);

        return {
            success: true,
            message: purpose === 'register'
                ? 'Email xác nhận đăng ký đã được gửi. Vui lòng kiểm tra hộp thư'
                : 'Email xác nhận đổi email đã được gửi',
            expiresAt
        };
    } catch (error) {
        console.error('Send verification error:', error);
        throw error;
    }
}


async function verifyToken(token) {
    try {
        // Find record
        const record = await knex('otp_verifications')
            .where({ token, is_verified: false })
            .first();

        if (!record) {
            throw new Error('Token không hợp lệ hoặc đã được sử dụng');
        }

        // Check expiry
        if (new Date() > new Date(record.expires_at)) {
            throw new Error('Token đã hết hạn. Vui lòng yêu cầu gửi lại email');
        }

        if (record.purpose === 'change_email' && record.user_id) {
            await knex.transaction(async (trx) => {
                await trx('otp_verifications')
                    .where({ id: record.id })
                    .update({
                        is_verified: true,
                        verified_at: new Date(),
                        updated_at: new Date()
                    });


                await trx('users')
                    .where({ user_id: record.user_id })
                    .update({
                        email: record.email,
                        google_id: null,
                        auth_provider: 'local'
                    });
            });


            return {
                success: true,
                message: 'Email đã được cập nhật thành công',
                email: record.email,
                purpose: record.purpose
            };
        }

        // Handle register - just mark as verified
        await knex('otp_verifications')
            .where({ id: record.id })
            .update({
                is_verified: true,
                verified_at: new Date(),
                updated_at: new Date()
            });

        console.log(`Email verified: ${record.email} (purpose: ${record.purpose})`);

        return {
            success: true,
            message: record.purpose === 'register'
                ? 'Email đã được xác nhận. Bạn có thể hoàn tất đăng ký'
                : 'Email đã được xác nhận thành công',
            email: record.email,
            purpose: record.purpose
        };
    } catch (error) {
        console.error('Verify token error:', error);
        throw error;
    }
}

/**
 * Check if email has been verified (for registration flow)
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} true if verified within last 15 minutes
 */
async function checkEmailVerified(email) {
    try {
        const record = await knex('otp_verifications')
            .where({ email, purpose: 'register', is_verified: true })
            .where('verified_at', '>', new Date(Date.now() - 15 * 60 * 1000))
            .first();

        return !!record;
    } catch (error) {
        console.error('Check email verified error:', error);
        return false;
    }
}

module.exports = {
    generateToken,
    sendVerification,
    verifyToken,
    checkEmailVerified
};
