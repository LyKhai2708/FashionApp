const nodemailer = require('nodemailer');


function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}


async function sendPasswordResetEmail(email, resetToken, username) {
    const transporter = createTransporter();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Đặt lại mật khẩu - DELULU Fashion',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #f8f8f8; padding: 20px; text-align: center;">
                    <h1 style="color: #8FD9FB; margin: 0;">DELULU FASHION</h1>
                </div>
                
                <div style="padding: 20px;">
                    <h2>Xin chào ${username}!</h2>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                    
                    <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #8FD9FB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Đặt lại mật khẩu
                        </a>
                    </div>
                    
                    <p>Hoặc copy link sau vào trình duyệt:</p>
                    <p style="background: #f8f8f8; padding: 10px; border-radius: 5px; word-break: break-all;">
                        ${resetUrl}
                    </p>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        <strong>Lưu ý:</strong> Link này chỉ có hiệu lực trong <strong>15 phút</strong>. 
                        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        Email này được gửi tự động, vui lòng không trả lời.<br>
                        © 2024 DELULU Fashion. All rights reserved.
                    </p>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}


//send verification email for register , change email
async function sendVerificationEmail(email, token, purpose = 'register') {
    const transporter = createTransporter();

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    const content = {
        register: {
            subject: 'Xác nhận đăng ký - DELULU Fashion',
            title: 'Xác Nhận Email',
            greeting: 'Chào mừng bạn!',
            message: 'Cảm ơn bạn đã đăng ký tài khoản tại DELULU Fashion.',
            instruction: 'Vui lòng nhấp vào nút bên dưới để xác nhận email của bạn:',
            buttonText: 'Xác Nhận Email',
            warning: 'Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.'
        },
        change_email: {
            subject: 'Xác nhận thay đổi email - DELULU Fashion',
            title: 'Xác Nhận Email Mới',
            greeting: 'Yêu cầu đổi email',
            message: 'Bạn vừa yêu cầu thay đổi địa chỉ email đăng nhập.',
            instruction: 'Vui lòng nhấp vào nút bên dưới để xác nhận email mới:',
            buttonText: 'Xác Nhận Email Mới',
            warning: '<strong>LƯU Ý:</strong> Nếu không phải bạn yêu cầu, vui lòng đổi mật khẩu ngay!'
        }
    };

    const template = content[purpose] || content.register;

    const mailOptions = {
        from: `"DELULU Fashion" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: template.subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #f8f8f8; padding: 20px; text-align: center;">
                    <h1 style="color: #8FD9FB; margin: 0;">DELULU FASHION</h1>
                </div>
                
                <div style="padding: 20px;">
                    <h2>${template.greeting}</h2>
                    <p>${template.message}</p>
                    
                    <p>${template.instruction}</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" 
                           style="background-color: #8FD9FB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            ${template.buttonText}
                        </a>
                    </div>
                    
                    <p>Hoặc copy link sau vào trình duyệt:</p>
                    <p style="background: #f8f8f8; padding: 10px; border-radius: 5px; word-break: break-all;">
                        ${verificationLink}
                    </p>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        <strong>Lưu ý:</strong> Link này chỉ có hiệu lực trong <strong>15 phút</strong>. 
                        ${template.warning}
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        Email này được gửi tự động, vui lòng không trả lời.<br>
                        © ${new Date().getFullYear()} DELULU Fashion. All rights reserved.
                    </p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email send error:', error);
        throw new Error('Không thể gửi email xác nhận');
    }
}


async function sendOrderConfirmationEmail(orderData, orderDetails) {
    const transporter = createTransporter();

    const subTotal = orderDetails.reduce((sum, item) => sum + parseFloat(item.sub_total), 0);
    const shippingFee = parseFloat(orderData.shipping_fee) || 0;
    const totalAmount = parseFloat(orderData.total_amount);

    const itemsHtml = orderDetails.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                ${item.product_name}<br>
                <small style="color: #666;">${item.color_name ? `Màu: ${item.color_name}` : ''} ${item.size_name ? `| Size: ${item.size_name}` : ''}</small>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                ${item.price.toLocaleString('vi-VN')}₫<br>
                <small style="color: #666;">Tổng: ${item.sub_total.toLocaleString('vi-VN')}₫</small>
            </td>
        </tr>
    `).join('');

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: orderData.receiver_email,
        subject: `Xác nhận đơn hàng #${orderData.order_code} - DELULU Fashion`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #f8f8f8; padding: 20px; text-align: center;">
                    <h1 style="color: #8FD9FB; margin: 0;">DELULU FASHION</h1>
                </div>
                
                <div style="padding: 20px;">
                    <h2>Xin chào ${orderData.receiver_name}!</h2>
                    <p>Cảm ơn bạn đã đặt hàng tại DELULU Fashion. Đơn hàng <strong>#${orderData.order_code}</strong> của bạn đã được đặt thành công và đang trong quá trình xử lý.</p>
                    
                    <h3>Chi tiết đơn hàng:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f8f8;">
                                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                                <th style="padding: 10px; text-align: center;">SL</th>
                                <th style="padding: 10px; text-align: right;">Giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #f8f8f8; border-radius: 5px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>Tạm tính:</span>
                            <strong>${subTotal.toLocaleString('vi-VN')}₫</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>Phí vận chuyển:</span>
                            <strong>${shippingFee === 0 ? 'Miễn phí' : shippingFee.toLocaleString('vi-VN') + '₫'}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #ddd;">
                            <span style="font-size: 18px;">Tổng cộng:</span>
                            <strong style="font-size: 18px; color: #ef4444;">${totalAmount.toLocaleString('vi-VN')}₫</strong>
                        </div>
                    </div>
                    
                    <h3>Thông tin giao hàng:</h3>
                    <p>
                        <strong>Người nhận:</strong> ${orderData.receiver_name}<br>
                        <strong>Số điện thoại:</strong> ${orderData.receiver_phone}<br>
                        <strong>Địa chỉ:</strong> ${orderData.shipping_detail_address}, ${orderData.shipping_ward}, ${orderData.shipping_province}
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.<br>
                        © 2024 DELULU Fashion. All rights reserved.
                    </p>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}

module.exports = {
    createTransporter,
    sendPasswordResetEmail,
    sendVerificationEmail,
    sendOrderConfirmationEmail
};
