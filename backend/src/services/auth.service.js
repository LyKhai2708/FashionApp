const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const knex = require('../database/knex');
const { checkEmailVerified } = require('./email-verification.service');
const { OAuth2Client } = require('google-auth-library');
const { sendPasswordResetEmail } = require('./email.service');

const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, GOOGLE_CLIENT_ID } = process.env;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function usersRepository() {
    return knex('users');
}

function generateAccessToken(user) {
    return jwt.sign({
        id: user.user_id,
        role: user.role
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });
}

function generateRefreshToken(user) {
    return jwt.sign({
        id: user.user_id
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });
}

async function register(userData) {

    const { username, email, password, phone } = userData;

    const verified = await checkEmailVerified(email);
    if (!verified) throw new Error('Email chưa được xác nhận. Vui lòng kiểm tra email và xác nhận trước khi đăng ký');

    const existingUser = await usersRepository()
        .where('email', email)
        .first();
    if (existingUser) {
        throw new Error('User already exists');
    }


    const customerRole = await knex('roles')
        .where('role_name', 'customer')
        .first();

    if (!customerRole) {
        throw new Error('Customer role not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        username,
        email,
        password: hashedPassword,
        phone,
        is_active: 1
    };

    const [userId] = await usersRepository().insert(newUser);

    await knex('user_roles').insert({
        user_id: userId,
        role_id: customerRole.role_id,
        assigned_by: null
    });


    await knex('otp_verifications')
        .where({ email, purpose: 'register' })
        .delete();

    const user = await usersRepository().where('user_id', userId).select('user_id', 'username', 'email', 'phone').first();

    return user;
}

async function login(emailOrPhone, password) {
    const isEmail = emailOrPhone.includes('@');

    const user = await knex('users')
        .leftJoin('user_roles', 'users.user_id', 'user_roles.user_id')
        .leftJoin('roles', 'user_roles.role_id', 'roles.role_id')
        .where(isEmail ? 'users.email' : 'users.phone', emailOrPhone)
        .select(
            'users.*',
            'roles.role_name as role'
        )
        .first();

    if (!user) {
        return { error: 'USER_NOT_FOUND' };
    }

    if (!user.password && user.auth_provider === 'google') {
        return { error: 'GOOGLE_ONLY_ACCOUNT', email: user.email };
    }

    if (!user.password) {
        return { error: 'NO_PASSWORD' };
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return { error: 'INVALID_PASSWORD' };
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return { success: true, user, token: accessToken, refreshToken };
}

async function googleLogin(idToken) {
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            throw new Error('Email không tồn tại trong Google account');
        }

        let user = await knex('users')
            .leftJoin('user_roles', 'users.user_id', 'user_roles.user_id')
            .leftJoin('roles', 'user_roles.role_id', 'roles.role_id')
            .where('users.email', email)
            .orWhere('users.google_id', googleId)
            .select(
                'users.*',
                'roles.role_name as role'
            )
            .first();

        if (user) {
            if (!user.google_id) {
                await usersRepository()
                    .where('user_id', user.user_id)
                    .update({
                        google_id: googleId,
                        auth_provider: 'google'
                    });
                user.google_id = googleId;
                user.auth_provider = 'google';
            }
        } else {
            const newUser = {
                username: name || email.split('@')[0],
                email,
                google_id: googleId,
                auth_provider: 'google',
                password: null,
                phone: null,
                is_active: 1
            };

            const [userId] = await usersRepository().insert(newUser);

            const customerRole = await knex('roles').where('role_name', 'customer').first();
            if (customerRole) {
                await knex('user_roles').insert({
                    user_id: userId,
                    role_id: customerRole.role_id
                });
            }

            user = await knex('users')
                .leftJoin('user_roles', 'users.user_id', 'user_roles.user_id')
                .leftJoin('roles', 'user_roles.role_id', 'roles.role_id')
                .where('users.user_id', userId)
                .select(
                    'users.*',
                    'roles.role_name as role'
                )
                .first();
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return { user, token: accessToken, refreshToken };

    } catch (error) {
        console.error('Google login error:', error);
        throw new Error('Xác thực Google thất bại');
    }
}

async function forgotPassword(email) {
    const user = await usersRepository()
        .where('email', email)
        .first();

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    if (!user.password && user.auth_provider === 'google') {
        throw new Error('GOOGLE_ONLY_ACCOUNT');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await knex('password_resets')
        .where('email', email)
        .delete();

    // Insert new reset token
    await knex('password_resets').insert({
        email: email,
        token: resetTokenHash,
        expires_at: resetTokenExpiry
    });

    await sendPasswordResetEmail(email, resetToken, user.username);

    return { success: true };
}

async function resetPassword(token, newPassword) {
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetRecord = await knex('password_resets')
        .where('token', resetTokenHash)
        .where('expires_at', '>', new Date())
        .whereNull('used_at')
        .first();

    if (!resetRecord) {
        throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }

    // Find user by email
    const user = await usersRepository()
        .where('email', resetRecord.email)
        .first();

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await usersRepository()
        .where('user_id', user.user_id)
        .update({ password: hashedPassword });

    // Mark token as used
    await knex('password_resets')
        .where('id', resetRecord.id)
        .update({ used_at: new Date() });

    return { success: true };
}

module.exports = {
    login,
    googleLogin,
    generateAccessToken,
    generateRefreshToken,
    register,
    forgotPassword,
    resetPassword
}



