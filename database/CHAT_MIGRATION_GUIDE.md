# 🔧 Hướng dẫn chạy Migration Chat

## Cách 1: Sử dụng MySQL Workbench (Khuyến nghị)

1. Mở **MySQL Workbench**
2. Kết nối với database `travel_db`
3. Mở file `database/migration_add_chat.sql`
4. Copy toàn bộ nội dung SQL
5. Dán vào MySQL Workbench
6. Chạy (Ctrl+Enter hoặc click Execute)

## Cách 2: Sử dụng Command Prompt (CMD)

**⚠️ Không dùng PowerShell**, mở **Command Prompt (CMD)**:

1. Mở CMD (không phải PowerShell)
2. Di chuyển đến thư mục database:
   ```cmd
   cd "C:\Users\ADMIN\OneDrive\Máy tính\DACN_WeTour\database"
   ```
3. Chạy migration:
   ```cmd
   run_chat_migration.bat
   ```

## Cách 3: Chạy SQL trực tiếp trong MySQL

1. Mở MySQL Command Line hoặc MySQL Workbench
2. Chọn database:
   ```sql
   USE travel_db;
   ```
3. Chạy SQL từ file `migration_add_chat.sql`

Nội dung SQL:

```sql
-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  status ENUM('active', 'resolved', 'closed') DEFAULT 'active',
  last_message_at DATETIME NULL,
  is_read_by_admin BOOLEAN DEFAULT FALSE,
  is_read_by_user BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_last_message_at (last_message_at)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NULL COMMENT 'NULL for system/auto-reply messages',
  sender_type ENUM('user', 'admin', 'system') NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_sender_type (sender_type),
  INDEX idx_created_at (created_at)
);
```

## Sau khi chạy migration:

1. ✅ Kiểm tra xem 2 bảng đã được tạo:
   ```sql
   SHOW TABLES LIKE 'conversations';
   SHOW TABLES LIKE 'messages';
   ```

2. 🔄 Khởi động lại Backend Server:
   ```bash
   cd backend
   npm start
   ```

3. 🧪 Test chat:
   - Mở website
   - Click vào chat support ở góc phải dưới
   - Gửi tin nhắn đầu tiên
   - Sẽ nhận được auto-reply tự động

## Lỗi thường gặp:

- **Error: Table already exists** → Bảng đã tồn tại, có thể bỏ qua
- **Error: Foreign key constraint fails** → Đảm bảo bảng `users` đã tồn tại
- **Error: Access denied** → Kiểm tra quyền của MySQL user

