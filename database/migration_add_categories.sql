-- Migration: Add categories table and travel_style to tours
-- Date: 2024

USE travel_db;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create tour_categories junction table (many-to-many)
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

-- Add travel_style column to tours table
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS
               WHERE TABLE_SCHEMA = 'travel_db'
               AND TABLE_NAME = 'tours'
               AND COLUMN_NAME = 'travel_style');
SET @sqlstmt := IF(@exist = 0,
  'ALTER TABLE tours ADD COLUMN travel_style VARCHAR(50) NULL AFTER category',
  'SELECT "Column travel_style already exists" AS message');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert default categories
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

SELECT 'Migration completed successfully!' AS message;

