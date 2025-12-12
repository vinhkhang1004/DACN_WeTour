-- Tạo bảng hotel_rooms
CREATE TABLE IF NOT EXISTS `hotel_rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hotel_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `max_guests` INT DEFAULT 2,
  `bed_type` VARCHAR(100) NULL,
  `price_per_night` DECIMAL(10,2) NOT NULL,
  `image` VARCHAR(500) NULL,
  `features` TEXT NULL,
  `status` ENUM('available', 'unavailable') DEFAULT 'available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm dữ liệu mẫu cho các phòng
-- Lấy hotel_id từ bảng hotels (giả sử có ít nhất 1 hotel)
INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`) 
SELECT 
  h.id,
  'Phòng Classic',
  'Phòng sang trọng với view vườn, ban công riêng, Wi-Fi tốc độ cao.',
  2,
  '1 giường đôi',
  3500000,
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
  '["Hướng vườn","Ban công riêng","Wi-Fi tốc độ cao"]'
FROM `hotels` h 
WHERE h.name LIKE '%Imperial%' OR h.name LIKE '%Vung Tau%'
LIMIT 1;

INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`) 
SELECT 
  h.id,
  'Overwater Pavilion',
  'Nằm trên mặt hồ, tầm nhìn toàn cảnh Hồ Tây.',
  2,
  '1 giường King',
  5200000,
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400',
  '["Nằm trên mặt hồ","Tầm nhìn toàn cảnh","Ban công riêng"]'
FROM `hotels` h 
WHERE h.name LIKE '%Imperial%' OR h.name LIKE '%Vung Tau%'
LIMIT 1;

-- Thêm phòng cho các khách sạn khác (sử dụng LEFT JOIN để tránh lỗi MariaDB)
INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`) 
SELECT 
  h.id,
  'Phòng Deluxe',
  'Phòng rộng rãi với view đẹp, đầy đủ tiện nghi hiện đại.',
  2,
  '1 giường đôi',
  h.price_per_night * 1.2,
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
  '["View đẹp","Wi-Fi miễn phí","TV màn hình phẳng"]'
FROM `hotels` h 
LEFT JOIN (
  SELECT DISTINCT hotel_id 
  FROM hotel_rooms
) hr ON h.id = hr.hotel_id
WHERE hr.hotel_id IS NULL
LIMIT 3;

