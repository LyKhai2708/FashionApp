const jwt = require('jsonwebtoken');

const {ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET} = process.env;

function generateAccessToken(user) {
    return jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
}


function generateRefreshToken(user) {
    return jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
}

function register(user) {
    return usersRepository().insert(user);
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



