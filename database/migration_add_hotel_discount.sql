-- Migration: Thêm cột discount_amount và promotion_id vào bảng hotel_bookings
-- Chạy migration này để hỗ trợ khuyến mãi cho đặt phòng khách sạn

-- Kiểm tra và thêm cột discount_amount nếu chưa tồn tại
SET @exist_discount := (SELECT COUNT(*) FROM information_schema.COLUMNS 
                        WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = 'hotel_bookings' 
                        AND COLUMN_NAME = 'discount_amount');

SET @sqlstmt_discount := IF(@exist_discount = 0, 
  'ALTER TABLE hotel_bookings ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 AFTER total_price',
  'SELECT "Column discount_amount already exists" AS message');

PREPARE stmt FROM @sqlstmt_discount;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột promotion_id nếu chưa tồn tại
SET @exist_promotion := (SELECT COUNT(*) FROM information_schema.COLUMNS 
                         WHERE TABLE_SCHEMA = DATABASE()
                         AND TABLE_NAME = 'hotel_bookings' 
                         AND COLUMN_NAME = 'promotion_id');

SET @sqlstmt_promotion := IF(@exist_promotion = 0, 
  'ALTER TABLE hotel_bookings ADD COLUMN promotion_id INT NULL AFTER discount_amount, ADD FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL',
  'SELECT "Column promotion_id already exists" AS message');

PREPARE stmt FROM @sqlstmt_promotion;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Thông báo hoàn thành
SELECT 'Migration completed: discount_amount and promotion_id columns added to hotel_bookings' AS result;








