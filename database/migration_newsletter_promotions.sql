-- Migration script to add Newsletter and Promotions features
-- Run this script if you already have an existing database

USE travel_db;

-- Newsletter Subscriptions Table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('active','unsubscribed') DEFAULT 'active',
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_status (status)
);

-- Promotions/Vouchers Table
CREATE TABLE IF NOT EXISTS promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type ENUM('percentage','fixed') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2) NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  category ENUM('domestic','international','combo','early','special','flash','all') DEFAULT 'all',
  image VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  usage_limit INT NULL COMMENT 'Số lần sử dụng tối đa (NULL = không giới hạn)',
  usage_count INT DEFAULT 0 COMMENT 'Số lần đã sử dụng',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_category (category),
  INDEX idx_valid_dates (valid_from, valid_to),
  INDEX idx_is_active (is_active)
);

-- Promotion Usage History Table
CREATE TABLE IF NOT EXISTS promotion_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  promotion_id INT NOT NULL,
  user_id INT,
  booking_id INT,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_promotion (promotion_id),
  INDEX idx_user (user_id),
  INDEX idx_booking (booking_id)
);

-- Update bookings table to include promotion_id (only if columns don't exist)
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS 
               WHERE TABLE_SCHEMA = 'travel_db' 
               AND TABLE_NAME = 'bookings' 
               AND COLUMN_NAME = 'promotion_id');

SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE bookings ADD COLUMN promotion_id INT NULL AFTER tour_id, ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 AFTER total_price, ADD FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL',
  'SELECT "Columns already exist" AS message');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert sample promotions data (only if promotions table is empty)
-- Note: This will insert only if the codes don't exist
INSERT IGNORE INTO promotions (title, description, code, discount_type, discount_value, min_amount, max_discount, valid_from, valid_to, category, image, is_active) VALUES
('Giảm 20% cho tour Đà Lạt', 'Áp dụng cho tất cả tour Đà Lạt trong tháng 12/2024', 'DALAT20', 'percentage', 20, 1000000, 500000, '2024-12-01', '2024-12-31', 'domestic', 'https://via.placeholder.com/400x200?text=Da+Lat+Tour', TRUE),
('Giảm 500k cho tour nước ngoài', 'Áp dụng cho tour Thái Lan, Singapore, Malaysia', 'ASIA500', 'fixed', 500000, 5000000, 500000, '2024-12-01', '2025-02-28', 'international', 'https://via.placeholder.com/400x200?text=Asia+Tour', TRUE),
('Combo 2 người giảm 15%', 'Đặt tour cho 2 người trở lên được giảm 15%', 'COMBO15', 'percentage', 15, 2000000, 1000000, '2024-12-01', '2025-01-31', 'combo', 'https://via.placeholder.com/400x200?text=Combo+Tour', TRUE),
('Early Bird - Giảm 30%', 'Đặt tour trước 30 ngày được giảm 30%', 'EARLY30', 'percentage', 30, 3000000, 2000000, '2024-12-01', '2025-06-30', 'early', 'https://via.placeholder.com/400x200?text=Early+Bird', TRUE),
('Sinh nhật đặc biệt', 'Giảm 25% cho khách hàng trong tháng sinh nhật', 'BIRTHDAY25', 'percentage', 25, 1500000, 800000, '2024-12-01', '2025-12-31', 'special', 'https://via.placeholder.com/400x200?text=Birthday+Special', TRUE),
('Flash Sale - Giảm 50%', 'Chỉ trong 24h - Giảm 50% cho 100 tour đầu tiên', 'FLASH50', 'percentage', 50, 1000000, 1000000, '2024-12-15', '2024-12-16', 'flash', 'https://via.placeholder.com/400x200?text=Flash+Sale', TRUE);

