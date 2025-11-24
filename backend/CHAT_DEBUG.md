# 🔍 Debug Chat - Hướng dẫn kiểm tra lỗi

## Nếu vẫn gặp lỗi 500 sau khi chạy migration:

### 1. Kiểm tra Backend Logs

Xem terminal đang chạy backend server, tìm các dòng bắt đầu bằng:
- `❌ Error sending message:`
- `❌ Error fetching conversation:`
- `❌ Database error`

### 2. Kiểm tra Database Tables

Trong phpMyAdmin, kiểm tra:
- ✅ Bảng `conversations` đã tồn tại
- ✅ Bảng `messages` đã tồn tại
- ✅ Các cột trong bảng đúng với migration

### 3. Kiểm tra Backend đã khởi động lại chưa

**QUAN TRỌNG:** Sau khi chạy migration, PHẢI khởi động lại backend:

1. Dừng backend (Ctrl+C trong terminal)
2. Chạy lại:
   ```bash
   cd backend
   npm start
   ```

### 4. Kiểm tra Routes đã được đăng ký

Trong `backend/server.js`, phải có:
```javascript
app.use("/api/chat", chatRoutes);
app.use("/api/admin/chat", adminChatRoutes);
```

### 5. Test API trực tiếp

Mở Postman hoặc browser, test:
- `GET http://localhost:5000/api/health/db` - Kiểm tra DB connection
- `GET http://localhost:5000/api/chat/conversation` - Cần token trong header

### 6. Kiểm tra Token Authentication

Đảm bảo user đã đăng nhập và có token hợp lệ trong localStorage.

### 7. Common Errors

**Error: "Table doesn't exist"**
→ Chạy lại migration SQL

**Error: "Cannot read property 'findOne' of undefined"**
→ Backend chưa khởi động lại sau khi thêm models

**Error: "Foreign key constraint fails"**
→ Kiểm tra bảng `users` đã tồn tại

**Error: "Column 'createdAt' cannot be null"**
→ Kiểm tra migration đã tạo đúng cột timestamps

