-- Cập nhật ngày cho các chuyến bay hiện có
-- Đặt ngày khởi hành từ hôm nay trở đi

-- Cập nhật tất cả chuyến bay có departure_date < hôm nay
UPDATE flights 
SET 
  departure_date = DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL (HOUR(departure_date)) HOUR + INTERVAL (MINUTE(departure_date)) MINUTE,
  arrival_date = DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL (HOUR(arrival_date)) HOUR + INTERVAL (MINUTE(arrival_date)) MINUTE
WHERE departure_date < NOW();

-- Hoặc cập nhật cụ thể cho từng chuyến bay
-- UPDATE flights SET 
--   departure_date = DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 7 HOUR,
--   arrival_date = DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR + INTERVAL 10 MINUTE
-- WHERE id = 1;

-- UPDATE flights SET 
--   departure_date = DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 6 HOUR,
--   arrival_date = DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR + INTERVAL 10 MINUTE
-- WHERE id = 2;

SELECT 'Đã cập nhật ngày cho các chuyến bay!' AS result;







