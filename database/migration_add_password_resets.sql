-- Migration: Tạo bảng password_resets để lưu mã OTP đặt lại mật khẩu
-- Mô tả: Hỗ trợ tính năng quên mật khẩu với mã OTP

-- Kiểm tra và tạo bảng password_resets nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `code` VARCHAR(6) NOT NULL COMMENT 'Mã OTP 6 chữ số',
  `is_used` BOOLEAN DEFAULT FALSE COMMENT 'Đã sử dụng chưa',
  `expires_at` DATETIME NOT NULL COMMENT 'Thời gian hết hạn',
  `used_at` DATETIME NULL COMMENT 'Thời gian sử dụng',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_code` (`code`),
  INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Xóa các mã đã hết hạn hoặc đã sử dụng (cleanup)
DELETE FROM `password_resets` 
WHERE (`expires_at` < NOW() AND `is_used` = FALSE) 
   OR (`is_used` = TRUE AND `used_at` < DATE_SUB(NOW(), INTERVAL 7 DAY));

-- Thông báo hoàn thành
SELECT 'Migration completed: password_resets table created' AS result;

