# 📧 Hướng dẫn cấu hình Email

## Vấn đề: Khách hàng không nhận được email thông báo khi đặt tour

### Nguyên nhân có thể:
1. **Chưa cấu hình EMAIL_USER và EMAIL_PASS trong file .env**
2. **Sử dụng mật khẩu thường thay vì App Password (với Gmail)**
3. **Email của user không tồn tại trong database**

## 🔧 Cách khắc phục:

### Bước 1: Tạo file `.env` trong thư mục `backend/`

Nếu chưa có file `.env`, tạo file mới với nội dung:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=travel_db

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=5000

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### Bước 2: Cấu hình Gmail App Password

**⚠️ QUAN TRỌNG:** Với Gmail, bạn PHẢI sử dụng App Password, không thể dùng mật khẩu thường!

#### Cách lấy Gmail App Password:

1. **Bật xác thực 2 bước:**
   - Truy cập: https://myaccount.google.com/security
   - Bật "Xác minh 2 bước" (2-Step Verification)

2. **Tạo App Password:**
   - Truy cập: https://myaccount.google.com/apppasswords
   - Chọn "Mail" và "Other (Custom name)"
   - Nhập tên: "WeTour Backend"
   - Click "Generate"
   - **Copy mật khẩu 16 ký tự** (không có khoảng trắng)

3. **Cập nhật file .env:**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop  # Nhập 16 ký tự, bỏ khoảng trắng
   ```

### Bước 3: Kiểm tra cấu hình

1. **Khởi động lại server:**
   ```bash
   cd backend
   npm start
   ```

2. **Kiểm tra log khi đặt tour:**
   - Nếu thấy: `✅ Email sent successfully!` → Email đã được gửi
   - Nếu thấy: `❌ Email not configured` → Kiểm tra lại file .env
   - Nếu thấy: `❌ Authentication failed` → Kiểm tra lại App Password

### Bước 4: Kiểm tra email của user

Đảm bảo user trong database có email hợp lệ:
```sql
SELECT id, name, email FROM users WHERE id = [user_id];
```

## 🔍 Debug

### Kiểm tra log trong console:

Khi đặt tour, bạn sẽ thấy các log sau:

**Thành công:**
```
📧 Attempting to send booking confirmation email to: user@example.com
✅ Email sent successfully!
   To: user@example.com
   Subject: 🎉 Xác nhận đặt tour "Tour Name"
   Message ID: <xxx@mail.gmail.com>
✅ Booking confirmation email sent successfully to user@example.com
```

**Lỗi cấu hình:**
```
❌ Email not configured. Cannot send email.
❌ Please set EMAIL_USER and EMAIL_PASS in .env file
```

**Lỗi xác thực:**
```
❌ Error sending email:
   Error: Invalid login: 535-5.7.8 Username and Password not accepted
   Error Code: EAUTH
```

## 📝 Lưu ý:

1. **Gmail App Password:** Chỉ có hiệu lực khi đã bật 2-Step Verification
2. **Không dùng mật khẩu thường:** Gmail sẽ từ chối đăng nhập từ ứng dụng bên thứ ba
3. **Kiểm tra Spam:** Email có thể vào thư mục Spam
4. **Rate Limit:** Gmail có giới hạn số email gửi mỗi ngày

## 🔄 Alternative: Sử dụng email service khác

### Outlook/Hotmail:
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Custom SMTP:
Cần cập nhật code trong `emailService.js` để hỗ trợ custom SMTP.

## ✅ Sau khi cấu hình xong:

1. Khởi động lại backend server
2. Đặt tour thử nghiệm
3. Kiểm tra email inbox (và cả Spam folder)
4. Xem log trong console để xác nhận email đã được gửi

