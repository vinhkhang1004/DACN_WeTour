-- Migration: Thêm max_children và images vào bảng hotel_rooms

-- Thêm cột max_children
ALTER TABLE `hotel_rooms` 
ADD COLUMN IF NOT EXISTS `max_children` INT DEFAULT 0 AFTER `max_guests`;

-- Thêm cột images (TEXT để lưu JSON array)
ALTER TABLE `hotel_rooms` 
ADD COLUMN IF NOT EXISTS `images` TEXT NULL AFTER `image`;

-- Cập nhật dữ liệu cũ: nếu có image thì chuyển thành images array
UPDATE `hotel_rooms` 
SET `images` = JSON_ARRAY(`image`)
WHERE `image` IS NOT NULL AND `image` != '' AND (`images` IS NULL OR `images` = '');



