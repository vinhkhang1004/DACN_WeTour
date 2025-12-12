-- Migration: Thêm cột quantity vào bảng hotel_rooms (Safe version - kiểm tra trước khi thêm)
-- Mô tả: Thêm số lượng phòng còn lại và tự động chuyển status khi hết phòng

-- Kiểm tra và thêm cột quantity vào bảng hotel_rooms (nếu chưa tồn tại)
SET @exist_quantity := (SELECT COUNT(*) FROM information_schema.COLUMNS 
                        WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = 'hotel_rooms' 
                        AND COLUMN_NAME = 'quantity');

SET @sqlstmt_quantity := IF(@exist_quantity = 0, 
  'ALTER TABLE `hotel_rooms` ADD COLUMN `quantity` INT NOT NULL DEFAULT 1 COMMENT ''Số lượng phòng còn lại'' AFTER `status`',
  'SELECT "Column quantity already exists" AS message');

PREPARE stmt FROM @sqlstmt_quantity;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cập nhật status dựa trên quantity cho các phòng hiện có
-- Nếu quantity <= 0 thì chuyển sang unavailable
UPDATE `hotel_rooms` 
SET `status` = 'unavailable' 
WHERE `quantity` <= 0 AND `status` = 'available';

-- Kiểm tra và xóa trigger cũ nếu tồn tại (để tránh lỗi khi tạo lại)
DROP TRIGGER IF EXISTS `update_room_status_on_quantity_change`;

-- Tạo trigger để tự động cập nhật status khi quantity thay đổi
DELIMITER $$

CREATE TRIGGER `update_room_status_on_quantity_change`
BEFORE UPDATE ON `hotel_rooms`
FOR EACH ROW
BEGIN
    -- Nếu quantity <= 0, tự động chuyển sang unavailable
    IF NEW.quantity <= 0 THEN
        SET NEW.status = 'unavailable';
    -- Nếu quantity > 0 và đang unavailable, tự động chuyển về available
    ELSEIF NEW.quantity > 0 AND OLD.status = 'unavailable' AND NEW.status = OLD.status THEN
        SET NEW.status = 'available';
    END IF;
END$$

DELIMITER ;

-- Cập nhật tất cả phòng hiện có có quantity = 1 nếu chưa có giá trị hoặc = 0
UPDATE `hotel_rooms` 
SET `quantity` = 1 
WHERE `quantity` IS NULL OR `quantity` = 0;

-- Hiển thị kết quả
SELECT 'Migration completed: quantity column added/verified' AS result;
SELECT COUNT(*) as total_rooms, 
       SUM(CASE WHEN quantity > 0 THEN 1 ELSE 0 END) as available_rooms,
       SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END) as unavailable_rooms
FROM hotel_rooms;




