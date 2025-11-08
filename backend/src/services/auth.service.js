const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const knex = require('../database/knex');
const { checkPhoneVerified } = require('./otp.service');
const { OAuth2Client } = require('google-auth-library');

const {ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, GOOGLE_CLIENT_ID} = process.env;
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

async function register(phone, userData) {

    const { username, email, password, role = 'customer' } = userData;

    const verified = await checkPhoneVerified(phone);
    if (!verified) throw new Error('Số điện thoại chưa được xác thực');

    const existingUser = await usersRepository()
    .where('email', email)
    .first();
    if (existingUser) {
        throw new Error('User already exists');
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
        username,
        email,
        password: hashedPassword,
        phone,
        role,
        is_active: 1
    };
    
    const [userId] = await usersRepository().insert(newUser);
    
    //xóa otp
    await knex('otp_verifications')
        .where({ phone, purpose: 'register' })
        .delete();

    const user = await usersRepository().where('user_id', userId).select('user_id', 'username', 'email', 'phone','role').first();
    
    return user;
}

async function login (emailOrPhone, password){
    const isEmail = emailOrPhone.includes('@');
    
    const user = await usersRepository()
        .where(isEmail ? 'email' : 'phone', emailOrPhone)
        .select('*')
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
        
        let user = await usersRepository()
            .where('email', email)
            .orWhere('google_id', googleId)
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
                role: 'customer',
                is_active: 1
            };
            
            const [userId] = await usersRepository().insert(newUser);
            user = await usersRepository()
                .where('user_id', userId)
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

module.exports = {login, googleLogin, generateAccessToken, generateRefreshToken, register }



