-- Thêm cột latitude và longitude cho Google Maps
USE travel_db;

ALTER TABLE tours 
  ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER highlights,
  ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude;

-- Kiểm tra
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'travel_db' 
  AND TABLE_NAME = 'tours' 
  AND COLUMN_NAME IN ('latitude', 'longitude');

