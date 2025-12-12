-- ============================================
-- FIX: Thêm các cột còn thiếu vào bảng categories
-- Chạy file này nếu bảng categories đã tồn tại nhưng thiếu cột description/icon
-- ============================================

USE travel_db;

-- Kiểm tra và thêm cột description nếu chưa có
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'travel_db' 
    AND TABLE_NAME = 'categories' 
    AND COLUMN_NAME = 'description'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE categories ADD COLUMN description TEXT AFTER name',
  'SELECT "Column description already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột icon nếu chưa có
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'travel_db' 
    AND TABLE_NAME = 'categories' 
    AND COLUMN_NAME = 'icon'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE categories ADD COLUMN icon VARCHAR(100) AFTER description',
  'SELECT "Column icon already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột created_at nếu chưa có
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'travel_db' 
    AND TABLE_NAME = 'categories' 
    AND COLUMN_NAME = 'created_at'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE categories ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER icon',
  'SELECT "Column created_at already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- Tạo bảng tour_categories (nếu chưa có)
-- ============================================
CREATE TABLE IF NOT EXISTS tour_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tour_id INT NOT NULL,
  category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_tour_category (tour_id, category_id),
  FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_tour_id (tour_id),
  INDEX idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Thêm cột travel_style vào bảng tours
-- ============================================
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'travel_db' 
    AND TABLE_NAME = 'tours' 
    AND COLUMN_NAME = 'travel_style'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE tours ADD COLUMN travel_style VARCHAR(50) NULL AFTER category',
  'SELECT "Column travel_style already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- Thêm các danh mục mặc định (chỉ insert nếu chưa có)
-- ============================================
-- Sử dụng INSERT IGNORE để bỏ qua các entry đã tồn tại
-- Tạo slug tự động từ name (chuyển thành chữ thường, thay khoảng trắng bằng dấu gạch ngang)
INSERT IGNORE INTO categories (name, description, slug) VALUES
('Miền Bắc', 'Các tour du lịch miền Bắc Việt Nam', 'mien-bac'),
('Miền Trung', 'Các tour du lịch miền Trung Việt Nam', 'mien-trung'),
('Miền Nam', 'Các tour du lịch miền Nam Việt Nam', 'mien-nam'),
('Đảo & Biển', 'Các tour du lịch đảo và biển', 'dao-bien'),
('Núi & Rừng', 'Các tour du lịch núi và rừng', 'nui-rung'),
('Thành phố', 'Các tour du lịch thành phố', 'thanh-pho'),
('Văn hóa & Lịch sử', 'Các tour văn hóa và lịch sử', 'van-hoa-lich-su'),
('Ẩm thực', 'Các tour ẩm thực', 'am-thuc'),
('Nghỉ dưỡng', 'Các tour nghỉ dưỡng', 'nghi-duong'),
('Mạo hiểm', 'Các tour mạo hiểm', 'mao-hiem'),
('Thiên nhiên', 'Các tour thiên nhiên', 'thien-nhien'),
('Tâm linh', 'Các tour tâm linh', 'tam-linh');

-- ============================================
-- Kiểm tra kết quả
-- ============================================
SELECT 'Migration completed successfully!' AS message;

-- Xem cấu trúc bảng categories
SHOW COLUMNS FROM categories;

-- Xem danh sách categories
SELECT id, name, description FROM categories ORDER BY id;

