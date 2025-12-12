# Hướng dẫn kiểm tra và khắc phục vấn đề Quantity phòng

## 🔍 Vấn đề
Số lượng phòng (quantity) bị reset về 1 sau khi chỉnh sửa trong admin panel.

## ✅ Các bước kiểm tra

### 1. Kiểm tra Database có column `quantity` chưa

Chạy script kiểm tra:
```bash
cd backend
node check-room-quantity-column.js
```

Hoặc kiểm tra trực tiếp trong MySQL/MariaDB:
```sql
DESCRIBE hotel_rooms;
-- Hoặc
SHOW COLUMNS FROM hotel_rooms LIKE 'quantity';
```

**Nếu chưa có column `quantity`:**
- Chạy migration SQL: `database/migration_add_room_quantity_safe.sql`
- Hoặc chạy: `database/migration_add_room_quantity.sql`

### 2. Kiểm tra Console Logs

Khi update phòng trong admin panel, kiểm tra console backend để xem:

```
[Update Room] Room ID: X
[Update Room] Old quantity: Y, Old status: Z
[Update Room] Request quantity: A, Parsed quantity: B
[Update Room] Request status: C, Final status: D
[Update Room] Update data: {...}
[Update Room] Before update - Room ID: X, Current quantity: Y, New quantity: B
[Update Room] After update - Room ID: X, quantity: B, status: D
```

**Nếu thấy warning:**
```
[Update Room] WARNING: Quantity mismatch! Expected: X, Got: Y
```
→ Có nghĩa là Sequelize không lưu đúng, script sẽ tự động dùng raw SQL để fix.

### 3. Kiểm tra Frontend có gửi quantity đúng không

Mở Developer Tools (F12) → Network tab → Tìm request PUT `/admin/hotels/:hotelId/rooms/:roomId`
→ Kiểm tra Request Payload có field `quantity` không và giá trị có đúng không.

### 4. Kiểm tra Model Hook

File: `backend/src/models/HotelRoom.js`

Hook `beforeSave` đã được cải thiện để:
- Xử lý quantity là số hợp lệ
- Không override quantity nếu không được truyền vào
- Tự động chuyển status dựa trên quantity

## 🔧 Các cải thiện đã thực hiện

### 1. Backend (`adminHotelRoutes.js`)
- ✅ Parse quantity đúng cách, xử lý NaN
- ✅ Đảm bảo quantity >= 0
- ✅ Luôn cập nhật quantity trong updateData (không dùng undefined)
- ✅ Thêm fallback raw SQL nếu Sequelize không lưu đúng
- ✅ Thêm extensive logging để debug

### 2. Model (`HotelRoom.js`)
- ✅ Cải thiện hook `beforeSave` để xử lý quantity tốt hơn
- ✅ Không override quantity nếu không được truyền vào
- ✅ Xử lý trường hợp quantity không phải số

### 3. Frontend (`AdminHotelManagement.jsx`)
- ✅ Input field quantity đã có
- ✅ Parse quantity thành số nguyên khi submit
- ✅ Tự động cập nhật status khi quantity thay đổi

## 🚀 Cách khắc phục nếu vẫn bị lỗi

### Bước 1: Chạy Migration SQL
```bash
# Vào MySQL/MariaDB
mysql -u root -p wetour < database/migration_add_room_quantity_safe.sql
```

### Bước 2: Kiểm tra lại Database
```bash
cd backend
node check-room-quantity-column.js
```

### Bước 3: Restart Backend Server
```bash
# Dừng server hiện tại (Ctrl+C)
# Khởi động lại
npm start
```

### Bước 4: Test lại
1. Vào admin panel
2. Chỉnh sửa số lượng phòng (ví dụ: 5)
3. Lưu lại
4. Kiểm tra console logs backend
5. Refresh trang admin và kiểm tra lại số lượng

## 📝 Lưu ý quan trọng

1. **Database phải có column `quantity`** - Nếu không có, Sequelize sẽ không lưu được field này
2. **Quantity phải là số nguyên >= 0** - Frontend và backend đã validate
3. **Hook `beforeSave` không override quantity** - Chỉ xử lý khi quantity được truyền vào
4. **Logging đầy đủ** - Kiểm tra console để debug

## 🐛 Nếu vẫn không được

1. Kiểm tra database có column `quantity`:
   ```sql
   SELECT COLUMN_NAME FROM information_schema.COLUMNS 
   WHERE TABLE_NAME = 'hotel_rooms' AND COLUMN_NAME = 'quantity';
   ```

2. Kiểm tra dữ liệu hiện tại:
   ```sql
   SELECT id, name, quantity, status FROM hotel_rooms LIMIT 10;
   ```

3. Thử update trực tiếp bằng SQL:
   ```sql
   UPDATE hotel_rooms SET quantity = 5 WHERE id = 1;
   SELECT id, name, quantity, status FROM hotel_rooms WHERE id = 1;
   ```

4. Nếu SQL update được nhưng Sequelize không được → Vấn đề ở Sequelize model hoặc hook
5. Nếu SQL update không được → Vấn đề ở database schema




