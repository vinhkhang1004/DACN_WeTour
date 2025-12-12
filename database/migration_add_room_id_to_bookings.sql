-- Migration: Thêm cột room_id vào bảng hotel_bookings
-- Mô tả: Thêm room_id để lưu loại phòng cụ thể được đặt và đồng bộ số lượng phòng còn lại

-- Kiểm tra và thêm cột room_id nếu chưa tồn tại
SET @exist_room_id := (SELECT COUNT(*) FROM information_schema.COLUMNS 
                        WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = 'hotel_bookings' 
                        AND COLUMN_NAME = 'room_id');

SET @sqlstmt_room_id := IF(@exist_room_id = 0, 
  'ALTER TABLE `hotel_bookings` ADD COLUMN `room_id` INT NULL COMMENT ''ID của loại phòng được đặt (nếu có)'' AFTER `hotel_id`, ADD FOREIGN KEY (`room_id`) REFERENCES `hotel_rooms`(`id`) ON DELETE SET NULL',
  'SELECT "Column room_id already exists" AS message');

PREPARE stmt FROM @sqlstmt_room_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Thông báo hoàn thành
SELECT 'Migration completed: room_id column added to hotel_bookings' AS result;

