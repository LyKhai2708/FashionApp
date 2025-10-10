const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const knex = require('../database/knex');
const { checkPhoneVerified } = require('./otp.service');

const {ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET} = process.env;

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
        del_flag: 0
    };
    
    const [userId] = await usersRepository().insert(newUser);
    
    //xóa otp
    await knex('otp_verifications')
        .where({ phone, purpose: 'register' })
        .delete();

    const user = await usersRepository().where('user_id', userId).select('user_id', 'username', 'email', 'phone','role').first();
    
    return user;
}

async function login (email,password){
    const user = await usersRepository().where('email', email).select('*').first();
    if (!user) {
        return null;
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return null;
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return {user, token: accessToken, refreshToken };

}
module.exports = {login, generateAccessToken, generateRefreshToken, register }



