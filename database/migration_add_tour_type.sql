-- ============================================
-- Migration: Thêm cột tour_type vào bảng tours
-- ============================================

USE travel_db;

-- Kiểm tra và thêm cột tour_type nếu chưa có
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'travel_db' 
    AND TABLE_NAME = 'tours' 
    AND COLUMN_NAME = 'tour_type'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE tours ADD COLUMN tour_type VARCHAR(50) NULL DEFAULT "Tour ghép" AFTER travel_style',
  'SELECT "Column tour_type already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cập nhật giá trị mặc định cho các tour hiện có
UPDATE tours SET tour_type = 'Tour ghép' WHERE tour_type IS NULL;

SELECT 'Migration completed successfully!' AS message;

-- Kiểm tra kết quả
SHOW COLUMNS FROM tours LIKE 'tour_type';


