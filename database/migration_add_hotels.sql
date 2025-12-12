-- Tạo bảng hotels
CREATE TABLE IF NOT EXISTS `hotels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `address` VARCHAR(500) NULL,
  `star_rating` INT DEFAULT 0,
  `user_score` DECIMAL(3,1) DEFAULT 0,
  `price_per_night` DECIMAL(10,2) NOT NULL,
  `image` VARCHAR(500) NULL,
  `images` TEXT NULL,
  `description` TEXT NULL,
  `amenities` TEXT NULL,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `total_rooms` INT DEFAULT 0,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng hotel_bookings
CREATE TABLE IF NOT EXISTS `hotel_bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `guest_name` VARCHAR(255) NULL,
  `guest_email` VARCHAR(255) NULL,
  `guest_phone` VARCHAR(50) NULL,
  `hotel_id` INT NOT NULL,
  `check_in_date` DATE NOT NULL,
  `check_out_date` DATE NOT NULL,
  `adults` INT DEFAULT 1,
  `children` INT DEFAULT 0,
  `rooms` INT DEFAULT 1,
  `total_price` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm dữ liệu mẫu
INSERT INTO `hotels` (`name`, `location`, `address`, `star_rating`, `user_score`, `price_per_night`, `image`, `amenities`, `description`) VALUES
('The Imperial Hotel Vung Tau', 'Vũng Tàu', 'Bãi Trước, Vũng Tàu', 5, 9.2, 2500000, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', '["Wi-Fi miễn phí","Bể bơi","Bãi đỗ xe","Nhà hàng","Gym","Spa"]', 'Khách sạn 5 sao sang trọng với view biển tuyệt đẹp'),
('Malibu Hotel', 'Vũng Tàu', 'Bãi Trước, Vũng Tàu', 4, 8.8, 1800000, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', '["Wi-Fi miễn phí","Bể bơi","Nhà hàng","Bãi đỗ xe"]', 'Khách sạn 4 sao với không gian xanh mát'),
('Fusion Suites Vung Tau', 'Vũng Tàu', 'Đường Trương Công Định, Vũng Tàu', 5, 9.5, 3200000, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', '["Wi-Fi miễn phí","Bể bơi","Gym","Spa","Nhà hàng"]', 'Resort cao cấp với villa riêng và hồ bơi riêng'),
('Grand Hotel Saigon', 'TP. Hồ Chí Minh', 'Quận 1, TP. Hồ Chí Minh', 5, 9.0, 3500000, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', '["Wi-Fi miễn phí","Bể bơi","Gym","Spa","Nhà hàng","Bar"]', 'Khách sạn 5 sao tại trung tâm thành phố'),
('Hanoi Elegance Hotel', 'Hà Nội', 'Hoàn Kiếm, Hà Nội', 4, 8.5, 1500000, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', '["Wi-Fi miễn phí","Nhà hàng","Bãi đỗ xe"]', 'Khách sạn 4 sao gần phố cổ Hà Nội'),
('Da Nang Beach Resort', 'Đà Nẵng', 'Bãi biển Mỹ Khê, Đà Nẵng', 5, 9.3, 2800000, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', '["Wi-Fi miễn phí","Bể bơi","Gần bãi biển","Nhà hàng","Spa"]', 'Resort 5 sao view biển tuyệt đẹp'),
('Hue Heritage Hotel', 'Huế', 'Thành phố Huế', 4, 8.7, 1200000, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', '["Wi-Fi miễn phí","Nhà hàng","Bãi đỗ xe"]', 'Khách sạn 4 sao gần di tích lịch sử'),
('Nha Trang Beach Hotel', 'Nha Trang', 'Bãi biển Nha Trang', 4, 8.9, 2000000, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', '["Wi-Fi miễn phí","Bể bơi","Gần bãi biển","Nhà hàng"]', 'Khách sạn 4 sao view biển Nha Trang');


