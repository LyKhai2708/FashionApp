const knex = require('../db/knex');

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


async function sendOtpForRegister(phone, userdata) {
    try {
        await knex('otp_verifications')
            .where({ phone, purpose: 'register', is_verified: false })
            .delete();

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 

        await knex('otp_verifications').insert({
            phone,
            otp,
            purpose: 'register',
            userdata: JSON.stringify(userdata),
            expires_at: expiresAt,
            attempts: 0,
            is_verified: false,
            created_at: new Date(),
            updated_at: new Date()
        });

        console.log(`OTP đăng ký gửi tới ${phone}: ${otp}`);
        console.log(`Hết hạn lúc: ${expiresAt.toLocaleString('vi-VN')}`);

        return {
            success: true,
            message: 'OTP đã được gửi',
            expiresAt
        };
    } catch (error) {
        console.error('Send OTP register error:', error);
        throw new Error('Không thể gửi OTP');
    }
}


async function sendOtpForChangePhone(userId, newPhone) {
    try {
        const existingUser = await knex('users')
            .where({ phone: newPhone })
            .first();

        if (existingUser) {
            throw new Error('Số điện thoại này đã được sử dụng');
        }

        await knex('otp_verifications')
            .where({ phone: newPhone, purpose: 'change_phone', is_verified: false })
            .delete();

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await knex('otp_verifications').insert({
            phone: newPhone,
            otp,
            purpose: 'change_phone',
            user_id: userId,
            expires_at: expiresAt,
            attempts: 0,
            is_verified: false,
            created_at: new Date(),
            updated_at: new Date()
        });


        console.log(`OTP đổi số gửi tới ${newPhone}: ${otp}`);
        console.log(`User ID: ${userId}`);
        console.log(`Hết hạn lúc: ${expiresAt.toLocaleString('vi-VN')}`);

        return {
            success: true,
            message: 'OTP đã được gửi',
            expiresAt
        };
    } catch (error) {
        console.error('Send OTP change phone error:', error);
        throw error;
    }
}



async function verifyOtpForRegister(phone, otp) {
    try {
        const record = await knex('otp_verifications')
            .where({
                phone,
                purpose: 'register',
                is_verified: false
            })
            .orderBy('created_at', 'desc')
            .first();

        if (!record) {
            throw new Error('OTP không tồn tại hoặc đã được sử dụng');
        }

        if (new Date() > new Date(record.expires_at)) {
            throw new Error('OTP đã hết hạn');
        }

        if (record.attempts >= 5) {
            throw new Error('Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu OTP mới');
        }

        if (record.otp !== otp) {
            await knex('otp_verifications')
                .where({ id: record.id })
                .update({
                    attempts: record.attempts + 1,
                    updated_at: new Date()
                });

            throw new Error(`OTP không đúng. Còn ${4 - record.attempts} lần thử`);
        }

        await knex('otp_verifications')
            .where({ id: record.id })
            .update({
                is_verified: true,
                verified_at: new Date(),
                updated_at: new Date()
            });

        console.log(`OTP verified thành công cho ${phone}`);

        return {
            success: true,
            message: 'Xác thực thành công',
            userdata: record.userdata ? JSON.parse(record.userdata) : null
        };
    } catch (error) {
        console.error('Verify OTP register error:', error);
        throw error;
    }
}


async function verifyOtpForChangePhone(userId, newPhone, otp) {
    try {
        const record = await knex('otp_verifications')
            .where({
                phone: newPhone,
                purpose: 'change_phone',
                user_id: userId,
                is_verified: false
            })
            .orderBy('created_at', 'desc')
            .first();

        if (!record) {
            throw new Error('OTP không tồn tại hoặc đã được sử dụng');
        }

        if (new Date() > new Date(record.expires_at)) {
            throw new Error('OTP đã hết hạn');
        }

        if (record.attempts >= 5) {
            throw new Error('Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu OTP mới');
        }

        if (record.otp !== otp) {
            await knex('otp_verifications')
                .where({ id: record.id })
                .update({
                    attempts: record.attempts + 1,
                    updated_at: new Date()
                });

            throw new Error(`OTP không đúng. Còn ${4 - record.attempts} lần thử`);
        }
        //otp dung
        await knex.transaction(async (trx) => {
            await trx('otp_verifications')
                .where({ id: record.id })
                .update({
                    is_verified: true,
                    verified_at: new Date(),
                    updated_at: new Date()
                });

            //cap nhat so dien thoai moi
            await trx('users')
                .where({ user_id: userId })
                .update({
                    phone: newPhone,
                    updated_at: new Date()
                });
        });

        console.log(` Đổi số thành công cho user ${userId}: ${newPhone}`);

        return {
            success: true,
            message: 'Đổi số điện thoại thành công',
            newPhone
        };
    } catch (error) {
        console.error('Verify OTP change phone error:', error);
        throw error;
    }
}

async function checkOtpVerified(phone, purpose = 'register') {
    const record = await knex('otp_verifications')
        .where({
            phone,
            purpose,
            is_verified: true
        })
        .orderBy('verified_at', 'desc')
        .first();

    return !!record;
}


async function clearVerifiedOtp(phone, purpose = 'register') {
    await knex('otp_verifications')
        .where({ phone, purpose, is_verified: true })
        .delete();
}

module.exports = {
    generateOtp,
    sendOtpForRegister,
    sendOtpForChangePhone,
    verifyOtpForRegister,
    verifyOtpForChangePhone,
    checkOtpVerified,
    clearVerifiedOtp
};
