# WeTour Backend API

## 🚀 Chạy ứng dụng

```bash
cd d:\DACN\backend
npm install
npm start
```

API sẽ chạy tại `http://localhost:5000`

## 📋 Database

Sử dụng MySQL database `travel_db`. Đã có các bảng:
- users, tours, bookings, payments, reviews
- promotions, promotion_usage
- loyalty_transactions, notifications
- posts, categories
- newsletter_subscriptions
- email_verifications (xác thực OTP email)

## 🔗 API Endpoints

### Users
- `POST /api/users/register` - Đăng ký (yêu cầu email verified)
- `POST /api/users/login` - Đăng nhập
- `POST /api/users/oauth/google` - OAuth Google
- `POST /api/users/send-verification` - Gửi mã OTP qua email
- `POST /api/users/verify-email` - Xác thực email với mã OTP

### Tours
- `GET /api/tours` - Danh sách tour
- `GET /api/tours/:id` - Chi tiết tour
- `GET /api/tours/stats/recent-bookings` - Thống kê đặt tour 24h

### Bookings
- `GET /api/bookings` - Lịch sử đặt tour (user)
- `POST /api/bookings` - Tạo booking mới

### Promotions
- `GET /api/promotions` - Danh sách khuyến mãi
- `GET /api/promotions?showAll=true` - Tất cả (admin)
- `GET /api/promotions/code/:code` - Chi tiết mã
- `POST /api/promotions` - Tạo mã mới (admin)
- `PUT /api/promotions/:id` - Sửa mã (admin)
- `DELETE /api/promotions/:id` - Xóa mã (admin)

### Loyalty
- `GET /api/loyalty/me` - Điểm tích lũy của user
- `POST /api/loyalty/earn` - Cộng điểm (admin/staff)
- `POST /api/loyalty/spend` - Sử dụng điểm

### Notifications
- `GET /api/notifications/me` - Thông báo của user
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc
- `PUT /api/notifications/read-all` - Đánh dấu tất cả
- `POST /api/notifications` - Tạo thông báo (admin/staff)

### Blog/Posts
- `GET /api/posts` - Danh sách bài viết
- `GET /api/posts?showAll=true` - Tất cả (admin)
- `GET /api/posts/:id` - Chi tiết bài viết
- `POST /api/posts` - Tạo bài viết (admin/staff)
- `PUT /api/posts/:id` - Sửa bài (admin/staff)
- `DELETE /api/posts/:id` - Xóa bài (admin)

### Admin
- `GET /api/admin/tours` - Quản lý tour
- `GET /api/admin/bookings` - Quản lý đặt tour
- `GET /api/stats/summary` - Tổng quan thống kê
- `GET /api/stats/revenue` - Doanh thu
- `GET /api/stats/revenue-by-destination` - Doanh thu theo điểm đến

## 🔐 Authentication

JWT Token được gửi qua header:
```
Authorization: Bearer <token>
```

## 📧 Email Notifications

Hệ thống gửi email tự động cho khách hàng trong các trường hợp:
- **Đặt tour**: Xác nhận đặt tour mới
- **Thanh toán**: Xác nhận thanh toán thành công
- **Hoàn thành**: Tour đã hoàn thành

### Cấu hình Email

Tạo file `.env` trong thư mục backend với nội dung:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=travel_db
JWT_SECRET=your-secret-key
PORT=5000

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

**Lưu ý Gmail:**
1. Sử dụng App Password (không phải mật khẩu thường)
2. Truy cập: https://myaccount.google.com/apppasswords
3. Tạo app password cho "Mail"
4. Sử dụng mật khẩu đó làm `EMAIL_PASS`

## 📝 Notes

- Database sẽ tự động sync khi khởi động (sequelize.sync())
- Production cần dùng migrations thay vì sync
- Admin role cần được set trong database
- Email notifications yêu cầu cấu hình EMAIL_USER và EMAIL_PASS

