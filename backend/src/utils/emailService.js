import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'wetour@gmail.com',
    // Remove spaces from password (Gmail App Password may have spaces when copied)
    pass: (process.env.EMAIL_PASS || 'your-app-password').replace(/\s+/g, '')
  }
});

/**
 * Send email notification to user
 */
export const sendEmailNotification = async (to, subject, htmlContent) => {
  // Validate email address
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.error('❌ Invalid email address:', to);
    return { success: false, error: 'Invalid email address' };
  }

  // Check if email config is set
  const emailUser = process.env.EMAIL_USER;
  let emailPass = process.env.EMAIL_PASS;
  
  // Remove spaces from password (Gmail App Password may have spaces when copied)
  if (emailPass) {
    emailPass = emailPass.replace(/\s+/g, '');
  }
  
  if (!emailUser || !emailPass || emailUser === 'wetour@gmail.com' || emailPass === 'your-app-password') {
    console.error('❌ Email not configured. Cannot send email.');
    console.error('❌ Please set EMAIL_USER and EMAIL_PASS in .env file');
    console.error('❌ For Gmail:');
    console.error('   1. Enable 2-Step Verification');
    console.error('   2. Generate App Password at: https://myaccount.google.com/apppasswords');
    console.error('   3. Use App Password (16 characters) as EMAIL_PASS');
    console.error('❌ Example .env:');
    console.error('   EMAIL_USER=your-email@gmail.com');
    console.error('   EMAIL_PASS=your-16-char-app-password');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const mailOptions = {
      from: `"WeTour" <${emailUser}>`,
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('   Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error('   To:', to);
    console.error('   Subject:', subject);
    console.error('   Error:', error.message);
    console.error('   Error Code:', error.code);
    console.error('   Full Error:', error);
    
    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Check EMAIL_USER and EMAIL_PASS in .env';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Check internet connection and SMTP settings';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timeout. Check SMTP server settings';
    }
    
    return { success: false, error: errorMessage, code: error.code };
  }
};

/**
 * Send booking confirmation email
 */
export const sendBookingConfirmationEmail = async (user, booking, tour) => {
  // Validate user email
  if (!user || !user.email) {
    console.error('❌ Cannot send booking confirmation: user email missing');
    return { success: false, error: 'User email missing' };
  }

  const subject = `🎉 Xác nhận đặt tour "${tour.name}"`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0E7490 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #64748b; }
        .button { display: inline-block; padding: 12px 24px; background: #0E7490; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Đặt tour thành công!</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${user.name}</strong>,</p>
          
          <p>Chúng tôi xác nhận bạn đã đặt tour <strong>"${tour.name}"</strong> thành công.</p>
          
          <h3>📋 Thông tin đặt tour:</h3>
          <div class="info-row">
            <span class="label">Mã đặt tour:</span> #${booking.id}
          </div>
          <div class="info-row">
            <span class="label">Tên tour:</span> ${tour.name}
          </div>
          <div class="info-row">
            <span class="label">Điểm đến:</span> ${tour.destination}
          </div>
          <div class="info-row">
            <span class="label">Thời gian:</span> ${tour.duration}
          </div>
          <div class="info-row">
            <span class="label">Số người:</span> ${booking.people_count} người
          </div>
          <div class="info-row">
            <span class="label">Ngày đặt:</span> ${new Date(booking.booking_date).toLocaleDateString('vi-VN')}
          </div>
          <div class="info-row">
            <span class="label">Tổng tiền:</span> <strong style="color: #0E7490; font-size: 18px;">${Number(booking.total_price).toLocaleString('vi-VN')} ₫</strong>
          </div>
          
          ${booking.discount_amount > 0 ? `
          <div class="info-row">
            <span class="label">Giảm giá:</span> -${Number(booking.discount_amount).toLocaleString('vi-VN')} ₫
          </div>
          ` : ''}
          
          <p style="margin-top: 30px;">
            Trạng thái đặt tour của bạn: <strong>${booking.status === 'pending' ? '⏳ Chờ xác nhận' : booking.status === 'paid' ? '✅ Đã thanh toán' : '✅ Hoàn thành'}</strong>
          </p>
          
          ${booking.status === 'pending' ? `
          <p style="color: #f59e0b;">
            ⚠️ Vui lòng thanh toán trong vòng 24 giờ để xác nhận đặt tour.
          </p>
          ` : ''}
          
          <p style="margin-top: 20px;">
            Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận chi tiết chuyến đi.
          </p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings" class="button">
            Xem chi tiết đặt tour →
          </a>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">Liên hệ: hotline@wetour.vn | 1900-1234</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(user.email, subject, htmlContent);
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmationEmail = async (user, booking, tour, payment) => {
  // Validate user email
  if (!user || !user.email) {
    console.error('❌ Cannot send payment confirmation: user email missing');
    return { success: false, error: 'User email missing' };
  }

  const subject = `💰 Xác nhận thanh toán tour "${tour.name}"`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #64748b; }
        .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .success-badge { display: inline-block; padding: 8px 16px; background: #d1fae5; color: #065f46; border-radius: 6px; font-weight: bold; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Thanh toán thành công!</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${user.name}</strong>,</p>
          
          <div class="success-badge">✅ Giao dịch đã hoàn tất</div>
          
          <p>Thanh toán cho tour <strong>"${tour.name}"</strong> đã được xác nhận thành công.</p>
          
          <h3>📋 Thông tin giao dịch:</h3>
          <div class="info-row">
            <span class="label">Mã đặt tour:</span> #${booking.id}
          </div>
          <div class="info-row">
            <span class="label">Mã giao dịch:</span> ${payment.transaction_code || 'N/A'}
          </div>
          <div class="info-row">
            <span class="label">Phương thức:</span> ${payment.method === 'vnpay' ? '🏦 VNPay' : payment.method === 'momo' ? '💳 MoMo' : '💰 Tiền mặt'}
          </div>
          <div class="info-row">
            <span class="label">Số tiền:</span> <strong style="color: #10b981; font-size: 18px;">${Number(payment.amount).toLocaleString('vi-VN')} ₫</strong>
          </div>
          <div class="info-row">
            <span class="label">Trạng thái:</span> <strong style="color: #10b981;">Thành công ✅</strong>
          </div>
          
          <h3 style="margin-top: 30px;">✈️ Thông tin tour:</h3>
          <div class="info-row">
            <span class="label">Tên tour:</span> ${tour.name}
          </div>
          <div class="info-row">
            <span class="label">Điểm đến:</span> ${tour.destination}
          </div>
          <div class="info-row">
            <span class="label">Thời gian:</span> ${tour.duration}
          </div>
          <div class="info-row">
            <span class="label">Số người:</span> ${booking.people_count} người
          </div>
          
          <p style="margin-top: 30px;">
            📱 Chúng tôi sẽ gửi e-ticket và thông tin chi tiết chuyến đi qua email trong vòng 24h.
          </p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings" class="button">
            Xem chi tiết booking →
          </a>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">Liên hệ: hotline@wetour.vn | 1900-1234</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(user.email, subject, htmlContent);
};

/**
 * Send tour completion email
 */
export const sendTourCompletionEmail = async (user, booking, tour) => {
  // Validate user email
  if (!user || !user.email) {
    console.error('❌ Cannot send tour completion email: user email missing');
    return { success: false, error: 'User email missing' };
  }

  const subject = `🌟 Tour "${tour.name}" đã hoàn thành!`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #64748b; }
        .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .thank-you { font-size: 24px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌟 Tour đã hoàn thành!</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${user.name}</strong>,</p>
          
          <div class="thank-you">🙏 Cảm ơn bạn đã sử dụng dịch vụ!</div>
          
          <p>Tour <strong>"${tour.name}"</strong> của bạn đã hoàn thành thành công.</p>
          
          <p>Chúng tôi hy vọng bạn đã có những trải nghiệm tuyệt vời trong chuyến đi này.</p>
          
          <h3>📝 Chia sẻ trải nghiệm:</h3>
          <p>
            Viết review và đánh giá tour của bạn sẽ giúp nhiều du khách khác lựa chọn được chuyến đi phù hợp!
          </p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tour/${tour.id}" class="button">
              💬 Đánh giá tour
            </a>
          </div>
          
          <h3 style="margin-top: 30px;">🎁 Ưu đãi đặc biệt:</h3>
          <div style="background: #fff7ed; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0;">
              <strong>🎉 Giảm 10% cho tour tiếp theo của bạn!</strong><br/>
              Mã khuyến mãi: <code style="background: white; padding: 4px 8px; border-radius: 4px;">WELCOME10</code>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tours" class="button">
              🔍 Khám phá tour mới →
            </a>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">
            Liên hệ: hotline@wetour.vn | 1900-1234<br/>
            Chúng tôi luôn sẵn sàng phục vụ bạn trong các chuyến đi sắp tới!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(user.email, subject, htmlContent);
};

/**
 * Send booking cancellation email
 */
export const sendBookingCancellationEmail = async (user, booking, tour) => {
  // Validate user email
  if (!user || !user.email) {
    console.error('❌ Cannot send cancellation email: user email missing');
    return { success: false, error: 'User email missing' };
  }

  const subject = `❌ Hủy đặt tour "${tour.name}"`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #64748b; }
        .button { display: inline-block; padding: 12px 24px; background: #0E7490; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .warning-box { background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Đã hủy đặt tour</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${user.name}</strong>,</p>
          
          <p>Chúng tôi xác nhận bạn đã hủy đặt tour <strong>"${tour.name}"</strong>.</p>
          
          <div class="warning-box">
            <p style="margin: 0; color: #991b1b;">
              <strong>⚠️ Lưu ý:</strong> Đặt tour #${booking.id} đã được hủy thành công.
            </p>
          </div>
          
          <h3>📋 Thông tin đặt tour đã hủy:</h3>
          <div class="info-row">
            <span class="label">Mã đặt tour:</span> #${booking.id}
          </div>
          <div class="info-row">
            <span class="label">Tên tour:</span> ${tour.name}
          </div>
          <div class="info-row">
            <span class="label">Điểm đến:</span> ${tour.destination}
          </div>
          <div class="info-row">
            <span class="label">Số người:</span> ${booking.people_count} người
          </div>
          <div class="info-row">
            <span class="label">Tổng tiền:</span> ${Number(booking.total_price).toLocaleString('vi-VN')} ₫
          </div>
          
          <h3 style="margin-top: 30px;">💡 Bạn có muốn:</h3>
          <ul>
            <li>Đặt lại tour này với giá ưu đãi?</li>
            <li>Khám phá các tour khác phù hợp với bạn?</li>
            <li>Liên hệ với chúng tôi để được hỗ trợ?</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tours" class="button">
              🔍 Khám phá tour mới →
            </a>
          </div>
          
          <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.
          </p>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">Liên hệ: hotline@wetour.vn | 1900-1234</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(user.email, subject, htmlContent);
};

/**
 * Send verification email with OTP code
 */
export const sendVerificationEmail = async (email, code) => {
  const subject = `🔐 Mã xác thực email WeTour`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0E7490 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .otp-box { 
          background: white; 
          border: 3px solid #0E7490; 
          border-radius: 8px; 
          padding: 20px; 
          text-align: center; 
          margin: 20px 0;
          box-shadow: 0 4px 12px rgba(14, 116, 144, 0.2);
        }
        .otp-code { 
          font-size: 36px; 
          font-weight: bold; 
          color: #0E7490; 
          letter-spacing: 8px; 
          font-family: 'Courier New', monospace;
        }
        .warning { background: #fff7ed; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .warning p { margin: 0; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Xác thực Email</h1>
        </div>
        <div class="content">
          <p>Xin chào,</p>
          
          <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>WeTour</strong>!</p>
          
          <p>Vui lòng sử dụng mã OTP sau để xác thực email của bạn:</p>
          
          <div class="otp-box">
            <div class="otp-code">${code}</div>
          </div>
          
          <div class="warning">
            <p><strong>⚠️ Lưu ý quan trọng:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Mã này có hiệu lực trong <strong>10 phút</strong></li>
              <li>Không chia sẻ mã này với bất kỳ ai</li>
              <li>WeTour sẽ không bao giờ yêu cầu bạn cung cấp mã OTP</li>
            </ul>
          </div>
          
          <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
          
          <p>Chúc bạn có những trải nghiệm tuyệt vời với WeTour! 🌴</p>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">Liên hệ: hotline@wetour.vn | 1900-1234</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(email, subject, htmlContent);
};

/**
 * Send password reset email with OTP code
 */
export const sendPasswordResetEmail = async (email, code, userName = "") => {
  const subject = `🔐 Đặt lại mật khẩu WeTour`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0E7490 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .otp-box { 
          background: white; 
          border: 3px solid #0E7490; 
          border-radius: 8px; 
          padding: 20px; 
          text-align: center; 
          margin: 20px 0;
          box-shadow: 0 4px 12px rgba(14, 116, 144, 0.2);
        }
        .otp-code { 
          font-size: 36px; 
          font-weight: bold; 
          color: #0E7490; 
          letter-spacing: 8px; 
          font-family: 'Courier New', monospace;
        }
        .warning { background: #fff7ed; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .warning p { margin: 0; color: #92400e; }
        .button { 
          display: inline-block; 
          background: #0E7490; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Đặt lại mật khẩu</h1>
        </div>
        <div class="content">
          <p>Xin chào${userName ? ` ${userName}` : ""},</p>
          
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>WeTour</strong> của bạn.</p>
          
          <p>Vui lòng sử dụng mã OTP sau để đặt lại mật khẩu:</p>
          
          <div class="otp-box">
            <div class="otp-code">${code}</div>
          </div>
          
          <div class="warning">
            <p><strong>⚠️ Lưu ý quan trọng:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Mã này có hiệu lực trong <strong>10 phút</strong></li>
              <li>Không chia sẻ mã này với bất kỳ ai</li>
              <li>WeTour sẽ không bao giờ yêu cầu bạn cung cấp mã OTP</li>
              <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
            </ul>
          </div>
          
          <p>Chúc bạn có những trải nghiệm tuyệt vời với WeTour! 🌴</p>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">Liên hệ: hotline@wetour.vn | 1900-1234</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(email, subject, htmlContent);
};

/**
 * Send hotel booking confirmation email
 */
export const sendHotelBookingConfirmationEmail = async (user, booking, hotel) => {
  // Validate user email
  if (!user || !user.email) {
    console.error('❌ Cannot send hotel booking confirmation: user email missing');
    return { success: false, error: 'User email missing' };
  }

  const checkIn = new Date(booking.check_in_date);
  const checkOut = new Date(booking.check_out_date);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  const subject = `🎉 Xác nhận đặt phòng khách sạn "${hotel.name}"`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0E7490 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #64748b; }
        .button { display: inline-block; padding: 12px 24px; background: #0E7490; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Đặt phòng thành công!</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${user.name}</strong>,</p>
          
          <p>Chúng tôi xác nhận bạn đã đặt phòng tại khách sạn <strong>"${hotel.name}"</strong> thành công.</p>
          
          <h3>📋 Thông tin đặt phòng:</h3>
          <div class="info-row">
            <span class="label">Mã đặt phòng:</span> #${booking.id}
          </div>
          <div class="info-row">
            <span class="label">Tên khách sạn:</span> ${hotel.name}
          </div>
          <div class="info-row">
            <span class="label">Địa điểm:</span> ${hotel.location || hotel.address || "N/A"}
          </div>
          <div class="info-row">
            <span class="label">Ngày nhận phòng:</span> ${checkIn.toLocaleDateString('vi-VN')}
          </div>
          <div class="info-row">
            <span class="label">Ngày trả phòng:</span> ${checkOut.toLocaleDateString('vi-VN')}
          </div>
          <div class="info-row">
            <span class="label">Số đêm:</span> ${nights} đêm
          </div>
          <div class="info-row">
            <span class="label">Số phòng:</span> ${booking.rooms || 1} phòng
          </div>
          <div class="info-row">
            <span class="label">Số người:</span> ${booking.adults || 1} người lớn${booking.children ? `, ${booking.children} trẻ em` : ''}
          </div>
          <div class="info-row">
            <span class="label">Tổng tiền:</span> <strong style="color: #0E7490; font-size: 18px;">${Number(booking.total_price).toLocaleString('vi-VN')} ₫</strong>
          </div>
          
          <p style="margin-top: 30px;">
            Trạng thái đặt phòng của bạn: <strong>${booking.status === 'pending' ? '⏳ Chờ xác nhận' : booking.status === 'confirmed' ? '✅ Đã xác nhận' : '✅ Hoàn thành'}</strong>
          </p>
          
          ${booking.status === 'pending' ? `
          <p style="color: #f59e0b;">
            ⚠️ Vui lòng thanh toán trong vòng 24 giờ để xác nhận đặt phòng.
          </p>
          ` : ''}
          
          <p style="margin-top: 20px;">
            Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận chi tiết đặt phòng.
          </p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings" class="button">
            Xem chi tiết đặt phòng →
          </a>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">Liên hệ: hotline@wetour.vn | 1900-1234</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(user.email, subject, htmlContent);
};

/**
 * Send hotel payment confirmation email
 */
export const sendHotelPaymentConfirmationEmail = async (user, booking, hotel, payment) => {
  // Validate user email
  if (!user || !user.email) {
    console.error('❌ Cannot send hotel payment confirmation: user email missing');
    return { success: false, error: 'User email missing' };
  }

  const checkIn = new Date(booking.check_in_date);
  const checkOut = new Date(booking.check_out_date);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  const subject = `💰 Xác nhận thanh toán đặt phòng "${hotel.name}"`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #64748b; }
        .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .success-badge { display: inline-block; padding: 8px 16px; background: #d1fae5; color: #065f46; border-radius: 6px; font-weight: bold; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Thanh toán thành công!</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${user.name}</strong>,</p>
          
          <div class="success-badge">✅ Giao dịch đã hoàn tất</div>
          
          <p>Thanh toán cho đặt phòng tại khách sạn <strong>"${hotel.name}"</strong> đã được xác nhận thành công.</p>
          
          <h3>📋 Thông tin giao dịch:</h3>
          <div class="info-row">
            <span class="label">Mã đặt phòng:</span> #${booking.id}
          </div>
          <div class="info-row">
            <span class="label">Mã giao dịch:</span> ${payment.transaction_code || 'N/A'}
          </div>
          <div class="info-row">
            <span class="label">Phương thức:</span> ${payment.method === 'vnpay' ? '🏦 VNPay' : payment.method === 'momo' ? '💳 MoMo' : '💰 Tiền mặt'}
          </div>
          <div class="info-row">
            <span class="label">Số tiền:</span> <strong style="color: #10b981; font-size: 18px;">${Number(payment.amount).toLocaleString('vi-VN')} ₫</strong>
          </div>
          <div class="info-row">
            <span class="label">Trạng thái:</span> <strong style="color: #10b981;">Thành công ✅</strong>
          </div>
          
          <h3 style="margin-top: 30px;">🏨 Thông tin đặt phòng:</h3>
          <div class="info-row">
            <span class="label">Tên khách sạn:</span> ${hotel.name}
          </div>
          <div class="info-row">
            <span class="label">Địa điểm:</span> ${hotel.location || hotel.address || "N/A"}
          </div>
          <div class="info-row">
            <span class="label">Ngày nhận phòng:</span> ${checkIn.toLocaleDateString('vi-VN')}
          </div>
          <div class="info-row">
            <span class="label">Ngày trả phòng:</span> ${checkOut.toLocaleDateString('vi-VN')}
          </div>
          <div class="info-row">
            <span class="label">Số đêm:</span> ${nights} đêm
          </div>
          <div class="info-row">
            <span class="label">Số phòng:</span> ${booking.rooms || 1} phòng
          </div>
          
          <p style="margin-top: 30px;">
            📱 Chúng tôi sẽ gửi xác nhận đặt phòng và thông tin chi tiết qua email trong vòng 24h.
          </p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings" class="button">
            Xem chi tiết booking →
          </a>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">Liên hệ: hotline@wetour.vn | 1900-1234</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(user.email, subject, htmlContent);
};

/**
 * Send flight payment confirmation email
 */
export const sendFlightPaymentConfirmationEmail = async (user, booking, outboundFlight, returnFlight, payment) => {
  // Validate user email
  if (!user || !user.email) {
    console.error('❌ Cannot send flight payment confirmation: user email missing');
    return { success: false, error: 'User email missing' };
  }

  const departureDate = new Date(outboundFlight.departure_date);
  const arrivalDate = new Date(outboundFlight.arrival_date);
  const returnDepartureDate = returnFlight ? new Date(returnFlight.departure_date) : null;
  const returnArrivalDate = returnFlight ? new Date(returnFlight.arrival_date) : null;

  const subject = `✈️ Xác nhận thanh toán đặt vé máy bay`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #64748b; }
        .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .success-badge { display: inline-block; padding: 8px 16px; background: #dbeafe; color: #1e40af; border-radius: 6px; font-weight: bold; margin: 10px 0; }
        .flight-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✈️ Thanh toán thành công!</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${user.name}</strong>,</p>
          
          <div class="success-badge">✅ Giao dịch đã hoàn tất</div>
          
          <p>Thanh toán cho đặt vé máy bay đã được xác nhận thành công.</p>
          
          <h3>📋 Thông tin giao dịch:</h3>
          <div class="info-row">
            <span class="label">Mã đặt vé:</span> #${booking.id} (${booking.booking_code})
          </div>
          <div class="info-row">
            <span class="label">Mã giao dịch:</span> ${payment.transaction_code || 'N/A'}
          </div>
          <div class="info-row">
            <span class="label">Phương thức:</span> ${payment.method === 'vnpay' ? '🏦 VNPay' : payment.method === 'momo' ? '💳 MoMo' : '💰 Tiền mặt'}
          </div>
          <div class="info-row">
            <span class="label">Số tiền:</span> <strong style="color: #0ea5e9; font-size: 18px;">${Number(payment.amount).toLocaleString('vi-VN')} ₫</strong>
          </div>
          <div class="info-row">
            <span class="label">Trạng thái:</span> <strong style="color: #0ea5e9;">Thành công ✅</strong>
          </div>
          
          <h3 style="margin-top: 30px;">✈️ Thông tin chuyến bay:</h3>
          
          <div class="flight-box">
            <div style="font-weight: bold; margin-bottom: 10px; color: #0ea5e9;">Chuyến đi:</div>
            <div class="info-row">
              <span class="label">Hãng bay:</span> ${outboundFlight.airline}
            </div>
            <div class="info-row">
              <span class="label">Số hiệu chuyến bay:</span> ${outboundFlight.flight_number}
            </div>
            <div class="info-row">
              <span class="label">Từ:</span> ${outboundFlight.origin} → <span class="label">Đến:</span> ${outboundFlight.destination}
            </div>
            <div class="info-row">
              <span class="label">Ngày giờ khởi hành:</span> ${departureDate.toLocaleString('vi-VN')}
            </div>
            <div class="info-row">
              <span class="label">Ngày giờ đến:</span> ${arrivalDate.toLocaleString('vi-VN')}
            </div>
            <div class="info-row">
              <span class="label">Hạng ghế:</span> ${booking.class_type === 'economy' ? 'Phổ thông' : booking.class_type === 'business' ? 'Thương gia' : 'Hạng nhất'}
            </div>
            <div class="info-row">
              <span class="label">Số hành khách:</span> ${booking.passenger_count} người
            </div>
          </div>
          
          ${returnFlight ? `
          <div class="flight-box">
            <div style="font-weight: bold; margin-bottom: 10px; color: #0ea5e9;">Chuyến về:</div>
            <div class="info-row">
              <span class="label">Hãng bay:</span> ${returnFlight.airline}
            </div>
            <div class="info-row">
              <span class="label">Số hiệu chuyến bay:</span> ${returnFlight.flight_number}
            </div>
            <div class="info-row">
              <span class="label">Từ:</span> ${returnFlight.origin} → <span class="label">Đến:</span> ${returnFlight.destination}
            </div>
            <div class="info-row">
              <span class="label">Ngày giờ khởi hành:</span> ${returnDepartureDate.toLocaleString('vi-VN')}
            </div>
            <div class="info-row">
              <span class="label">Ngày giờ đến:</span> ${returnArrivalDate.toLocaleString('vi-VN')}
            </div>
            <div class="info-row">
              <span class="label">Hạng ghế:</span> ${booking.class_type === 'economy' ? 'Phổ thông' : booking.class_type === 'business' ? 'Thương gia' : 'Hạng nhất'}
            </div>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px;">
            📱 Chúng tôi sẽ gửi e-ticket và thông tin chi tiết chuyến bay qua email trong vòng 24h.
          </p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings" class="button">
            Xem chi tiết đặt vé →
          </a>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">Liên hệ: hotline@wetour.vn | 1900-1234</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(user.email, subject, htmlContent);
};

/**
 * Send tour admin confirmation email (when admin confirms booking)
 */
export const sendTourAdminConfirmationEmail = async (user, booking, tour) => {
  // Validate user email
  if (!user || !user.email) {
    console.error('❌ Cannot send tour admin confirmation: user email missing');
    return { success: false, error: 'User email missing' };
  }

  const subject = `✅ Xác nhận đặt tour "${tour.name}" - WeTour`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #64748b; }
        .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .success-badge { display: inline-block; padding: 8px 16px; background: #d1fae5; color: #065f46; border-radius: 6px; font-weight: bold; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Đặt tour đã được xác nhận!</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${user.name}</strong>,</p>
          
          <div class="success-badge">✅ Đặt tour đã được xác nhận</div>
          
          <p>Đặt tour <strong>"${tour.name}"</strong> của bạn đã được xác nhận thành công bởi quản trị viên.</p>
          
          <h3>📋 Thông tin đặt tour:</h3>
          <div class="info-row">
            <span class="label">Mã đặt tour:</span> #${booking.id}
          </div>
          <div class="info-row">
            <span class="label">Tên tour:</span> ${tour.name}
          </div>
          <div class="info-row">
            <span class="label">Điểm đến:</span> ${tour.destination}
          </div>
          <div class="info-row">
            <span class="label">Thời gian:</span> ${tour.duration}
          </div>
          <div class="info-row">
            <span class="label">Số người:</span> ${booking.people_count} người
          </div>
          <div class="info-row">
            <span class="label">Ngày đi:</span> ${new Date(booking.booking_date).toLocaleDateString('vi-VN')}
          </div>
          <div class="info-row">
            <span class="label">Tổng tiền:</span> <strong style="color: #10b981; font-size: 18px;">${Number(booking.total_price).toLocaleString('vi-VN')} ₫</strong>
          </div>
          
          <p style="margin-top: 30px;">
            Chúng tôi đã xác nhận đặt tour của bạn. Chúc bạn có chuyến đi vui vẻ!
          </p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings" class="button">
            Xem chi tiết booking →
          </a>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">Liên hệ: hotline@wetour.vn | 1900-1234</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(user.email, subject, htmlContent);
};

/**
 * Send flight booking confirmation email (when booking is created)
 */
export const sendFlightBookingConfirmationEmail = async (user, booking, outboundFlight, returnFlight) => {
  // Validate user email
  const recipientEmail = user?.email || booking.guest_email;
  const recipientName = user?.name || booking.guest_name || "Khách hàng";
  
  if (!recipientEmail) {
    console.error('❌ Cannot send flight booking confirmation: email missing');
    return { success: false, error: 'Email missing' };
  }

  const departureDate = new Date(outboundFlight.departure_date);
  const arrivalDate = new Date(outboundFlight.arrival_date);
  const returnDepartureDate = returnFlight ? new Date(returnFlight.departure_date) : null;
  const returnArrivalDate = returnFlight ? new Date(returnFlight.arrival_date) : null;

  const subject = `✈️ Xác nhận đặt vé máy bay - WeTour`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0E7490 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #64748b; }
        .button { display: inline-block; padding: 12px 24px; background: #0E7490; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .flight-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #0E7490; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✈️ Đặt vé thành công!</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${recipientName}</strong>,</p>
          
          <p>Chúng tôi xác nhận bạn đã đặt vé máy bay thành công.</p>
          
          <h3>📋 Thông tin đặt vé:</h3>
          <div class="info-row">
            <span class="label">Mã đặt vé:</span> #${booking.id} (${booking.booking_code})
          </div>
          <div class="info-row">
            <span class="label">Tổng tiền:</span> <strong style="color: #0E7490; font-size: 18px;">${Number(booking.total_price).toLocaleString('vi-VN')} ₫</strong>
          </div>
          <div class="info-row">
            <span class="label">Trạng thái:</span> <strong style="color: #d97706;">Chờ xác nhận</strong>
          </div>
          
          <h3 style="margin-top: 30px;">✈️ Thông tin chuyến bay:</h3>
          
          <div class="flight-box">
            <div style="font-weight: bold; margin-bottom: 10px; color: #0E7490;">Chuyến đi:</div>
            <div class="info-row">
              <span class="label">Hãng bay:</span> ${outboundFlight.airline}
            </div>
            <div class="info-row">
              <span class="label">Số hiệu chuyến bay:</span> ${outboundFlight.flight_number}
            </div>
            <div class="info-row">
              <span class="label">Từ:</span> ${outboundFlight.origin} → <span class="label">Đến:</span> ${outboundFlight.destination}
            </div>
            <div class="info-row">
              <span class="label">Ngày giờ khởi hành:</span> ${departureDate.toLocaleString('vi-VN')}
            </div>
            <div class="info-row">
              <span class="label">Ngày giờ đến:</span> ${arrivalDate.toLocaleString('vi-VN')}
            </div>
            <div class="info-row">
              <span class="label">Hạng ghế:</span> ${booking.class_type === 'economy' ? 'Phổ thông' : booking.class_type === 'business' ? 'Thương gia' : 'Hạng nhất'}
            </div>
            <div class="info-row">
              <span class="label">Số hành khách:</span> ${booking.passenger_count} người
            </div>
          </div>
          
          ${returnFlight ? `
          <div class="flight-box">
            <div style="font-weight: bold; margin-bottom: 10px; color: #0E7490;">Chuyến về:</div>
            <div class="info-row">
              <span class="label">Hãng bay:</span> ${returnFlight.airline}
            </div>
            <div class="info-row">
              <span class="label">Số hiệu chuyến bay:</span> ${returnFlight.flight_number}
            </div>
            <div class="info-row">
              <span class="label">Từ:</span> ${returnFlight.origin} → <span class="label">Đến:</span> ${returnFlight.destination}
            </div>
            <div class="info-row">
              <span class="label">Ngày giờ khởi hành:</span> ${returnDepartureDate.toLocaleString('vi-VN')}
            </div>
            <div class="info-row">
              <span class="label">Ngày giờ đến:</span> ${returnArrivalDate.toLocaleString('vi-VN')}
            </div>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px; color: #d97706;">
            ⚠️ Vui lòng thanh toán trong vòng 24 giờ để xác nhận đặt vé.
          </p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings" class="button">
            Xem chi tiết đặt vé →
          </a>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">Liên hệ: hotline@wetour.vn | 1900-1234</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(recipientEmail, subject, htmlContent);
};

/**
 * Send flight admin confirmation email (when admin confirms booking)
 */
export const sendFlightAdminConfirmationEmail = async (user, booking, outboundFlight, returnFlight) => {
  // Validate user email
  const recipientEmail = user?.email || booking.guest_email;
  const recipientName = user?.name || booking.guest_name || "Khách hàng";
  
  if (!recipientEmail) {
    console.error('❌ Cannot send flight admin confirmation: email missing');
    return { success: false, error: 'Email missing' };
  }

  const departureDate = new Date(outboundFlight.departure_date);
  const arrivalDate = new Date(outboundFlight.arrival_date);
  const returnDepartureDate = returnFlight ? new Date(returnFlight.departure_date) : null;
  const returnArrivalDate = returnFlight ? new Date(returnFlight.arrival_date) : null;

  const subject = `✅ Xác nhận đặt vé máy bay - WeTour`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #64748b; }
        .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .success-badge { display: inline-block; padding: 8px 16px; background: #d1fae5; color: #065f46; border-radius: 6px; font-weight: bold; margin: 10px 0; }
        .flight-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Đặt vé đã được xác nhận!</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${recipientName}</strong>,</p>
          
          <div class="success-badge">✅ Đặt vé đã được xác nhận</div>
          
          <p>Đặt vé máy bay của bạn đã được xác nhận thành công bởi quản trị viên.</p>
          
          <h3>📋 Thông tin đặt vé:</h3>
          <div class="info-row">
            <span class="label">Mã đặt vé:</span> #${booking.id} (${booking.booking_code})
          </div>
          <div class="info-row">
            <span class="label">Tổng tiền:</span> <strong style="color: #10b981; font-size: 18px;">${Number(booking.total_price).toLocaleString('vi-VN')} ₫</strong>
          </div>
          
          <h3 style="margin-top: 30px;">✈️ Thông tin chuyến bay:</h3>
          
          <div class="flight-box">
            <div style="font-weight: bold; margin-bottom: 10px; color: #10b981;">Chuyến đi:</div>
            <div class="info-row">
              <span class="label">Hãng bay:</span> ${outboundFlight.airline}
            </div>
            <div class="info-row">
              <span class="label">Số hiệu chuyến bay:</span> ${outboundFlight.flight_number}
            </div>
            <div class="info-row">
              <span class="label">Từ:</span> ${outboundFlight.origin} → <span class="label">Đến:</span> ${outboundFlight.destination}
            </div>
            <div class="info-row">
              <span class="label">Ngày giờ khởi hành:</span> ${departureDate.toLocaleString('vi-VN')}
            </div>
            <div class="info-row">
              <span class="label">Ngày giờ đến:</span> ${arrivalDate.toLocaleString('vi-VN')}
            </div>
            <div class="info-row">
              <span class="label">Hạng ghế:</span> ${booking.class_type === 'economy' ? 'Phổ thông' : booking.class_type === 'business' ? 'Thương gia' : 'Hạng nhất'}
            </div>
            <div class="info-row">
              <span class="label">Số hành khách:</span> ${booking.passenger_count} người
            </div>
          </div>
          
          ${returnFlight ? `
          <div class="flight-box">
            <div style="font-weight: bold; margin-bottom: 10px; color: #10b981;">Chuyến về:</div>
            <div class="info-row">
              <span class="label">Hãng bay:</span> ${returnFlight.airline}
            </div>
            <div class="info-row">
              <span class="label">Số hiệu chuyến bay:</span> ${returnFlight.flight_number}
            </div>
            <div class="info-row">
              <span class="label">Từ:</span> ${returnFlight.origin} → <span class="label">Đến:</span> ${returnFlight.destination}
            </div>
            <div class="info-row">
              <span class="label">Ngày giờ khởi hành:</span> ${returnDepartureDate.toLocaleString('vi-VN')}
            </div>
            <div class="info-row">
              <span class="label">Ngày giờ đến:</span> ${returnArrivalDate.toLocaleString('vi-VN')}
            </div>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px;">
            Chúng tôi đã xác nhận đặt vé của bạn. Chúc bạn có chuyến bay an toàn và vui vẻ!
          </p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings" class="button">
            Xem chi tiết đặt vé →
          </a>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">Liên hệ: hotline@wetour.vn | 1900-1234</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(recipientEmail, subject, htmlContent);
};

/**
 * Send flight completion email
 */
export const sendFlightCompletionEmail = async (user, booking, outboundFlight, returnFlight) => {
  // Validate user email
  const recipientEmail = user?.email || booking.guest_email;
  const recipientName = user?.name || booking.guest_name || "Khách hàng";
  
  if (!recipientEmail) {
    console.error('❌ Cannot send flight completion: email missing');
    return { success: false, error: 'Email missing' };
  }

  const subject = `🌟 Hoàn thành chuyến bay - WeTour`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #64748b; }
        .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .thank-you { font-size: 24px; text-align: center; margin: 20px 0; }
        .flight-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌟 Chuyến bay đã hoàn thành!</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${recipientName}</strong>,</p>
          
          <div class="thank-you">🙏 Cảm ơn bạn đã sử dụng dịch vụ!</div>
          
          <p>Chuyến bay của bạn đã hoàn thành thành công.</p>
          
          <p>Chúng tôi hy vọng bạn đã có chuyến bay an toàn và thoải mái.</p>
          
          <h3>📋 Thông tin chuyến bay:</h3>
          <div class="info-row">
            <span class="label">Mã đặt vé:</span> #${booking.id} (${booking.booking_code})
          </div>
          
          <div class="flight-box">
            <div style="font-weight: bold; margin-bottom: 10px; color: #f59e0b;">Chuyến đi:</div>
            <div class="info-row">
              <span class="label">Hãng bay:</span> ${outboundFlight.airline}
            </div>
            <div class="info-row">
              <span class="label">Số hiệu chuyến bay:</span> ${outboundFlight.flight_number}
            </div>
            <div class="info-row">
              <span class="label">Từ:</span> ${outboundFlight.origin} → <span class="label">Đến:</span> ${outboundFlight.destination}
            </div>
          </div>
          
          ${returnFlight ? `
          <div class="flight-box">
            <div style="font-weight: bold; margin-bottom: 10px; color: #f59e0b;">Chuyến về:</div>
            <div class="info-row">
              <span class="label">Hãng bay:</span> ${returnFlight.airline}
            </div>
            <div class="info-row">
              <span class="label">Số hiệu chuyến bay:</span> ${returnFlight.flight_number}
            </div>
            <div class="info-row">
              <span class="label">Từ:</span> ${returnFlight.origin} → <span class="label">Đến:</span> ${returnFlight.destination}
            </div>
          </div>
          ` : ''}
          
          <h3 style="margin-top: 30px;">🎁 Ưu đãi đặc biệt:</h3>
          <div style="background: #fff7ed; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0;">
              <strong>🎉 Giảm 10% cho chuyến bay tiếp theo của bạn!</strong><br/>
              Mã khuyến mãi: <code style="background: white; padding: 4px 8px; border-radius: 4px;">FLIGHT10</code>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/flights" class="button">
              🔍 Đặt chuyến bay mới →
            </a>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 WeTour. All rights reserved.</p>
          <p style="font-size: 12px; opacity: 0.8;">
            Liên hệ: hotline@wetour.vn | 1900-1234<br/>
            Chúng tôi luôn sẵn sàng phục vụ bạn trong các chuyến bay sắp tới!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification(recipientEmail, subject, htmlContent);
};

export default {
  sendEmailNotification,
  sendBookingConfirmationEmail,
  sendPaymentConfirmationEmail,
  sendTourCompletionEmail,
  sendTourAdminConfirmationEmail,
  sendBookingCancellationEmail,
  sendVerificationEmail,
  sendHotelBookingConfirmationEmail,
  sendHotelPaymentConfirmationEmail,
  sendFlightBookingConfirmationEmail,
  sendFlightPaymentConfirmationEmail,
  sendFlightAdminConfirmationEmail,
  sendFlightCompletionEmail
};

