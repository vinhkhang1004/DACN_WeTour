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
    console.warn('⚠️ Email not configured. Skipping email send.');
    console.warn('⚠️ Please set EMAIL_USER and EMAIL_PASS in .env file');
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
    console.log('✅ Email sent to:', to, 'Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
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

export default {
  sendEmailNotification,
  sendBookingConfirmationEmail,
  sendPaymentConfirmationEmail,
  sendTourCompletionEmail,
  sendBookingCancellationEmail,
  sendVerificationEmail
};

