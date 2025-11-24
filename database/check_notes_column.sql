-- Script để kiểm tra xem cột notes đã tồn tại trong bảng bookings chưa

USE travel_db;

-- Kiểm tra cấu trúc bảng bookings
DESCRIBE bookings;

-- Hoặc kiểm tra bằng information_schema
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'travel_db' 
  AND TABLE_NAME = 'bookings' 
  AND COLUMN_NAME = 'notes';

-- Nếu không có kết quả, cột notes chưa tồn tại
-- Nếu có kết quả, cột notes đã tồn tại

