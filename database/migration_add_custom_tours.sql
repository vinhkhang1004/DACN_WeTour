-- ============================================
-- Migration: Tạo bảng cho chức năng tự thiết kế tour
-- ============================================

USE travel_db;

-- Tạo bảng activities (hoạt động)
CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL COMMENT 'Ăn uống, Tham quan, Mua sắm, Giải trí, v.v.',
  duration_hours DECIMAL(4,2) NOT NULL COMMENT 'Thời lượng tính bằng giờ',
  price_per_person DECIMAL(12,2) DEFAULT 0 COMMENT 'Giá mỗi người',
  image VARCHAR(500),
  location VARCHAR(255) COMMENT 'Địa điểm',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng custom_tours (tour tự thiết kế)
CREATE TABLE IF NOT EXISTS custom_tours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL COMMENT 'NULL nếu là guest',
  guest_name VARCHAR(255) NULL,
  guest_email VARCHAR(255) NULL,
  guest_phone VARCHAR(50) NULL,
  destination VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  adults INT DEFAULT 1,
  children INT DEFAULT 0,
  tour_type VARCHAR(50) DEFAULT 'Nghỉ dưỡng',
  budget DECIMAL(12,2) NULL,
  estimated_cost DECIMAL(12,2) DEFAULT 0,
  total_hours DECIMAL(6,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, approved, rejected, completed',
  admin_notes TEXT NULL COMMENT 'Ghi chú từ admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng custom_tour_activities (hoạt động trong tour tự thiết kế)
CREATE TABLE IF NOT EXISTS custom_tour_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  custom_tour_id INT NOT NULL,
  activity_id INT NOT NULL,
  day_number INT NOT NULL COMMENT 'Ngày thứ mấy trong tour',
  start_time TIME NULL COMMENT 'Giờ bắt đầu',
  order_index INT DEFAULT 0 COMMENT 'Thứ tự trong ngày',
  notes TEXT NULL COMMENT 'Ghi chú của người dùng',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (custom_tour_id) REFERENCES custom_tours(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  INDEX idx_custom_tour_id (custom_tour_id),
  INDEX idx_day_number (day_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert mẫu activities
INSERT IGNORE INTO activities (name, description, category, duration_hours, price_per_person, image, location) VALUES
-- Đà Nẵng
('Tham quan Cầu Vàng – Bà Nà Hills', 'Khám phá kiến trúc độc đáo và cảnh quan tuyệt đẹp tại Bà Nà Hills', 'Tham quan', 5.0, 750000, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', 'Đà Nẵng'),
('Tắm biển Mỹ Khê', 'Thư giãn và tắm biển tại bãi biển Mỹ Khê nổi tiếng', 'Giải trí', 2.5, 0, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Đà Nẵng'),
('Thưởng thức Mỳ Quảng', 'Trải nghiệm món ăn đặc sản Đà Nẵng', 'Ăn uống', 1.0, 150000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', 'Đà Nẵng'),
('Tham quan Chùa Linh Ứng', 'Tham quan ngôi chùa nổi tiếng với tượng Phật lớn nhất Việt Nam', 'Tham quan', 2.0, 0, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Đà Nẵng'),
('Mua sắm tại Chợ Hàn', 'Khám phá và mua sắm tại chợ đêm Hàn nổi tiếng', 'Mua sắm', 2.0, 0, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 'Đà Nẵng'),
-- Hội An
('Tham quan Phố Cổ Hội An', 'Khám phá di sản văn hóa thế giới UNESCO', 'Tham quan', 4.0, 120000, 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800', 'Hội An'),
('Thưởng thức Cao Lầu', 'Món ăn đặc sản Hội An', 'Ăn uống', 1.0, 120000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', 'Hội An'),
('Tham quan Làng Gốm Thanh Hà', 'Tìm hiểu nghề gốm truyền thống', 'Tham quan', 2.5, 80000, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', 'Hội An'),
-- Hà Nội
('Tham quan Văn Miếu Quốc Tử Giám', 'Khám phá trường đại học đầu tiên của Việt Nam', 'Tham quan', 2.0, 30000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Hà Nội'),
('Thưởng thức Phở Hà Nội', 'Thưởng thức món phở truyền thống Hà Nội', 'Ăn uống', 1.0, 80000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', 'Hà Nội'),
('Tham quan Hồ Hoàn Kiếm', 'Dạo bộ quanh hồ Hoàn Kiếm và đền Ngọc Sơn', 'Tham quan', 1.5, 0, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Hà Nội'),
('Mua sắm tại Phố Cổ Hà Nội', 'Khám phá 36 phố phường cổ kính', 'Mua sắm', 3.0, 0, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 'Hà Nội'),
('Tham quan Lăng Chủ tịch Hồ Chí Minh', 'Tham quan lăng Bác và quảng trường Ba Đình', 'Tham quan', 2.5, 0, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Hà Nội'),
-- TP. Hồ Chí Minh
('Tham quan Dinh Độc Lập', 'Khám phá di tích lịch sử quan trọng', 'Tham quan', 2.0, 40000, 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800', 'TP. Hồ Chí Minh'),
('Thưởng thức Bánh mì Sài Gòn', 'Thưởng thức bánh mì đặc sản Sài Gòn', 'Ăn uống', 0.5, 30000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', 'TP. Hồ Chí Minh'),
('Tham quan Chợ Bến Thành', 'Mua sắm và khám phá chợ nổi tiếng Sài Gòn', 'Mua sắm', 2.0, 0, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 'TP. Hồ Chí Minh'),
('Tham quan Nhà thờ Đức Bà', 'Chiêm ngưỡng kiến trúc Pháp cổ kính', 'Tham quan', 1.0, 0, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'TP. Hồ Chí Minh'),
('Tham quan Bảo tàng Chứng tích Chiến tranh', 'Tìm hiểu lịch sử Việt Nam', 'Tham quan', 2.5, 40000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'TP. Hồ Chí Minh'),
-- Huế
('Tham quan Đại Nội Huế', 'Khám phá cố đô Huế và Hoàng thành', 'Tham quan', 3.0, 200000, 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800', 'Huế'),
('Thưởng thức Bún Bò Huế', 'Thưởng thức món bún bò đặc sản Huế', 'Ăn uống', 1.0, 60000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', 'Huế'),
('Tham quan Lăng Tự Đức', 'Tham quan lăng tẩm đẹp nhất của các vua Nguyễn', 'Tham quan', 2.0, 150000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Huế'),
('Tham quan Chùa Thiên Mụ', 'Tham quan ngôi chùa cổ nhất Huế', 'Tham quan', 1.5, 0, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Huế'),
-- Nha Trang
('Tắm biển Nha Trang', 'Thư giãn tại bãi biển đẹp nhất Việt Nam', 'Giải trí', 3.0, 0, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Nha Trang'),
('Tham quan Tháp Bà Ponagar', 'Tham quan tháp Chăm cổ', 'Tham quan', 1.5, 22000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Nha Trang'),
('Thưởng thức Nem Nướng Nha Trang', 'Thưởng thức món nem nướng đặc sản', 'Ăn uống', 1.0, 80000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', 'Nha Trang'),
('Lặn biển tại Hòn Mun', 'Khám phá thế giới dưới đáy biển', 'Giải trí', 4.0, 500000, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Nha Trang'),
-- An Giang
('Tham quan Chùa Hang', 'Tham quan chùa Hang độc đáo tại An Giang', 'Tham quan', 2.0, 0, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'An Giang'),
('Tham quan Núi Sam', 'Leo núi và tham quan các đền chùa trên núi', 'Tham quan', 3.0, 0, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'An Giang'),
('Thưởng thức Bánh Xèo An Giang', 'Thưởng thức bánh xèo đặc sản miền Tây', 'Ăn uống', 1.0, 70000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', 'An Giang'),
('Tham quan Chợ nổi Long Xuyên', 'Khám phá chợ nổi trên sông', 'Mua sắm', 2.5, 0, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', 'An Giang'),
-- Đà Lạt
('Tham quan Hồ Xuân Hương', 'Dạo bộ quanh hồ Xuân Hương', 'Tham quan', 1.5, 0, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Đà Lạt'),
('Tham quan Dinh Bảo Đại', 'Tham quan dinh thự của vua Bảo Đại', 'Tham quan', 2.0, 50000, 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800', 'Đà Lạt'),
('Thưởng thức Bánh ướt Đà Lạt', 'Thưởng thức món bánh ướt đặc sản', 'Ăn uống', 1.0, 50000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800', 'Đà Lạt'),
('Tham quan Vườn Hoa Đà Lạt', 'Ngắm hoa và chụp ảnh tại vườn hoa', 'Tham quan', 2.0, 40000, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Đà Lạt');

SELECT 'Migration completed successfully!' AS message;

-- Kiểm tra kết quả
SHOW TABLES LIKE 'activities';
SHOW TABLES LIKE 'custom_tours';
SHOW TABLES LIKE 'custom_tour_activities';

