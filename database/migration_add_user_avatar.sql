-- Migration: Thêm cột avatar và các trường bổ sung vào bảng users
USE travel_db;

-- Thêm cột avatar để lưu đường dẫn hoặc base64 của hình ảnh
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS avatar TEXT NULL AFTER address,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE NULL AFTER avatar,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20) NULL AFTER date_of_birth;

-- Nếu MySQL không hỗ trợ IF NOT EXISTS, sử dụng cách này:
-- Kiểm tra và thêm cột avatar
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'travel_db' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar') > 0,
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN avatar TEXT NULL AFTER address'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Kiểm tra và thêm cột date_of_birth
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'travel_db' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'date_of_birth') > 0,
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN date_of_birth DATE NULL AFTER avatar'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Kiểm tra và thêm cột gender
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'travel_db' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'gender') > 0,
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN gender VARCHAR(20) NULL AFTER date_of_birth'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;




