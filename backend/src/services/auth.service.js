const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const knex = require('../database/knex');

const {ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET} = process.env;

function usersRepository() {
    return knex('users');
}

function generateAccessToken(user) {
    return jwt.sign({ 
        id: user.user_id, 
        role: user.role 
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m", // Tăng từ 5m lên 15m cho UX tốt hơn
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
    const { username, email, password, phone, role = 'customer' } = userData;
    
    // Check if user already exists
    const existingUser = await usersRepository().where('email', email).first();
    if (existingUser) {
        throw new Error('User already exists');
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user object
    const newUser = {
        username,
        email,
        password: hashedPassword,
        phone,
        role,
        del_flag: 0
    };
    
    // Insert user and get ID
    const [userId] = await usersRepository().insert(newUser);
    
    // Return user without password
    const user = await usersRepository().where('user_id', userId).select('user_id', 'username', 'email', 'phone', 'address', 'role').first();
    
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
    return {user, accessToken, refreshToken };

}
module.exports = {login, generateAccessToken, generateRefreshToken, register }



