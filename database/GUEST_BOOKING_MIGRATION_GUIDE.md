# Hướng dẫn Migration: Thêm Guest Booking

Migration này cho phép khách hàng chưa đăng nhập có thể đặt tour bằng cách điền thông tin liên hệ.

## Thay đổi

1. **Thêm các cột mới vào bảng `bookings`:**
   - `guest_name` (VARCHAR(255)) - Tên khách chưa đăng nhập
   - `guest_phone` (VARCHAR(20)) - Số điện thoại khách chưa đăng nhập
   - `guest_email` (VARCHAR(255)) - Email khách chưa đăng nhập

2. **Cho phép `user_id` NULL:**
   - Khách chưa đăng nhập sẽ có `user_id = NULL`
   - Thông tin khách được lưu trong `guest_name`, `guest_phone`, `guest_email`

## Cách chạy Migration

### Cách 1: Sử dụng MySQL Workbench
1. Mở MySQL Workbench
2. Kết nối đến database `travel_db`
3. Mở file `migration_add_guest_booking.sql`
4. Chạy script (Ctrl+Shift+Enter)

### Cách 2: Sử dụng Command Line
```bash
mysql -u root -p travel_db < migration_add_guest_booking.sql
```

### Cách 3: Sử dụng Batch Script (Windows)
```bash
cd database
run_guest_booking_migration.bat
```

### Cách 4: Copy và paste trực tiếp
1. Mở file `migration_add_guest_booking.sql`
2. Copy toàn bộ nội dung
3. Paste vào MySQL Workbench hoặc phpMyAdmin
4. Chạy script

## Kiểm tra Migration

Sau khi chạy migration, kiểm tra bằng cách:

```sql
DESCRIBE bookings;
```

Bạn sẽ thấy các cột mới:
- `guest_name`
- `guest_phone`
- `guest_email`

Và `user_id` sẽ cho phép NULL.

## Lưu ý

- Migration này an toàn và không xóa dữ liệu hiện có
- Các booking cũ vẫn hoạt động bình thường
- Chỉ các booking mới từ khách chưa đăng nhập mới có `user_id = NULL`

