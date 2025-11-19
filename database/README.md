# Database Setup Guide

## 📁 Files trong thư mục database:

1. **travel_db.sql** - File SQL chính để tạo database từ đầu
2. **migration_newsletter_promotions.sql** - File migration để cập nhật database đã tồn tại

## 🚀 Cách sử dụng:

### Tạo database mới (lần đầu):

```bash
mysql -u root -p < travel_db.sql
```

Hoặc sử dụng MySQL Workbench/phpMyAdmin để import file `travel_db.sql`

### Cập nhật database đã tồn tại:

Nếu bạn đã có database và muốn thêm các tính năng Newsletter và Promotions:

```bash
mysql -u root -p travel_db < migration_newsletter_promotions.sql
```

## 📊 Cấu trúc Database:

### Bảng mới được thêm:

1. **newsletter_subscriptions**
   - Lưu thông tin đăng ký newsletter
   - Fields: id, name, email, status, subscribed_at, unsubscribed_at

2. **promotions**
   - Lưu thông tin voucher/khuyến mãi
   - Fields: id, title, description, code, discount_type, discount_value, min_amount, max_discount, valid_from, valid_to, category, image, is_active, usage_limit, usage_count

3. **promotion_usage**
   - Lưu lịch sử sử dụng voucher
   - Fields: id, promotion_id, user_id, booking_id, discount_amount, used_at

### Bảng được cập nhật:

- **bookings**
  - Thêm cột `promotion_id` để liên kết với voucher đã sử dụng
  - Thêm cột `discount_amount` để lưu số tiền được giảm

## ⚠️ Lưu ý:

- File `travel_db.sql` sẽ tạo lại toàn bộ database từ đầu
- File `migration_newsletter_promotions.sql` chỉ thêm các bảng và cột mới mà không ảnh hưởng đến dữ liệu cũ
- Nên backup database trước khi chạy migration

## 📝 Sample Data:

File SQL đã bao gồm 6 voucher mẫu:
- DALAT20 - Giảm 20% tour Đà Lạt
- ASIA500 - Giảm 500k tour nước ngoài
- COMBO15 - Giảm 15% combo 2 người
- EARLY30 - Giảm 30% early bird
- BIRTHDAY25 - Giảm 25% sinh nhật
- FLASH50 - Giảm 50% flash sale




