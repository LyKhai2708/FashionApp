const knex = require('../database/knex');
const otpGenerator = require('otp-generator');

function generateOtp() {
    return otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });
}


async function sendOtpForRegister(phone) {
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
            expires_at: expiresAt,
            attempts: 0,
            is_verified: false
        });

        console.log(`OTP gửi tới ${phone}: ${otp}`);
    return { success: true, message: 'OTP đã được gửi', expiresAt };
    } catch (error) {
        console.error('Send OTP register error:', error);
        throw new Error('Không thể gửi OTP');
    }
}


async function sendOtpForAddPhone(userId, newPhone) {
    try {
        const existingUser = await knex('users')
            .where({ phone: newPhone })
            .first();

        if (existingUser) {
            throw new Error('Số điện thoại này đã được sử dụng');
        }

        await knex('otp_verifications')
            .where({ phone: newPhone, purpose: 'add_phone', is_verified: false })
            .delete();

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await knex('otp_verifications').insert({
            phone: newPhone,
            otp,
            purpose: 'add_phone',
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
        .where({ phone, purpose: 'register', is_verified: false })
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
        };
    } catch (error) {
        console.error('Verify OTP register error:', error);
        throw error;
    }
}


async function verifyOtpForAddPhone(userId, newPhone, otp) {
    try {
        const record = await knex('otp_verifications')
            .where({
                phone: newPhone,
                purpose: 'add_phone',
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
                });

            throw new Error(`OTP không đúng. Còn ${4 - record.attempts} lần thử`);
        }

        await knex.transaction(async (trx) => {
            await trx('otp_verifications')
                .where({ id: record.id })
                .update({
                    is_verified: true,
                    verified_at: new Date(),
                });

            await trx('users')
                .where({ user_id: userId })
                .update({
                    phone: newPhone,
                });
        });


        return {
            success: true,
            message: 'Thêm số điện thoại thành công',
            newPhone
        };
    } catch (error) {
        console.error('Verify OTP change phone error:', error);
        throw error;
    }
}

async function checkPhoneVerified(phone) {
    const record = await knex('otp_verifications')
        .where({ phone, purpose: 'register', is_verified: true })
        .where('verified_at', '>', new Date(Date.now() - 15 * 60 * 1000))
        .first();
    return !!record;
}


// async function clearVerifiedOtp(phone, purpose = 'register') {
//     await knex('otp_verifications')
//         .where({ phone, purpose, is_verified: true })
//         .delete();
// }



module.exports = {
    generateOtp,
    sendOtpForRegister,
    verifyOtpForRegister,
    checkPhoneVerified,
    sendOtpForAddPhone,
    verifyOtpForAddPhone
};
