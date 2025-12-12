-- Migration: Thêm cột max_children và images vào bảng hotel_rooms (Safe version)
-- Kiểm tra và thêm cột nếu chưa tồn tại

USE travel_db;

-- Kiểm tra và thêm cột max_children vào bảng hotel_rooms (nếu chưa tồn tại)
SET @exist_max_children := (SELECT COUNT(*) FROM information_schema.COLUMNS 
                        WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = 'hotel_rooms' 
                        AND COLUMN_NAME = 'max_children');

SET @sqlstmt_max_children := IF(@exist_max_children = 0, 
  'ALTER TABLE `hotel_rooms` ADD COLUMN `max_children` INT DEFAULT 0 AFTER `max_guests`',
  'SELECT "Column max_children already exists" AS message');

PREPARE stmt FROM @sqlstmt_max_children;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột images vào bảng hotel_rooms (nếu chưa tồn tại)
SET @exist_images := (SELECT COUNT(*) FROM information_schema.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'hotel_rooms' 
                    AND COLUMN_NAME = 'images');

SET @sqlstmt_images := IF(@exist_images = 0, 
  'ALTER TABLE `hotel_rooms` ADD COLUMN `images` TEXT NULL AFTER `image`',
  'SELECT "Column images already exists" AS message');

PREPARE stmt FROM @sqlstmt_images;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cập nhật dữ liệu cũ: nếu có image thì chuyển thành images array (chỉ nếu images là NULL hoặc rỗng)
UPDATE `hotel_rooms` 
SET `images` = JSON_ARRAY(`image`)
WHERE `image` IS NOT NULL AND `image` != '' AND (`images` IS NULL OR `images` = '');

-- Thông báo hoàn thành
SELECT 'Migration completed: max_children and images columns added to hotel_rooms' AS result;


