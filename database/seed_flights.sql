-- Seed dữ liệu chuyến bay mẫu
-- Chạy file này để thêm dữ liệu chuyến bay vào database

-- Xóa dữ liệu cũ (tùy chọn - comment nếu muốn giữ dữ liệu cũ)
-- DELETE FROM flights;

-- Lấy ngày hiện tại và tạo các chuyến bay trong 30 ngày tới
-- Insert sample flights với ngày từ hôm nay đến 30 ngày sau

INSERT INTO flights (airline, flight_number, origin, origin_code, origin_airport, destination, destination_code, destination_airport, departure_date, arrival_date, duration, flight_type, economy_price, business_price, first_class_price, available_seats_economy, available_seats_business, available_seats_first, baggage_carry_on, baggage_checked, status) VALUES
-- Hà Nội - TP. Hồ Chí Minh
('Vietnam Airlines', 'VN-201', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 6 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1500000, 3500000, 5500000, 50, 20, 10, '7kg', '23kg', 'scheduled'),
('Vietjet Air', 'VJ-301', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 10 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1250000, 0, 0, 100, 0, 0, '7kg', '20kg', 'scheduled'),
('Vietnam Airlines', 'VN-215', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 10 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 12 HOUR + INTERVAL 15 MINUTE, 135, 'direct', 1620000, 3800000, 5800000, 45, 15, 8, '7kg', '23kg', 'scheduled'),
('Bamboo Airways', 'QH-501', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 14 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 16 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1400000, 3200000, 0, 60, 15, 0, '7kg', '23kg', 'scheduled'),

-- TP. Hồ Chí Minh - Hà Nội
('Vietnam Airlines', 'VN-245', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 7 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1500000, 3500000, 5500000, 50, 20, 10, '7kg', '23kg', 'scheduled'),
('Vietjet Air', 'VJ-302', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 11 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1250000, 0, 0, 100, 0, 0, '7kg', '20kg', 'scheduled'),
('Vietnam Airlines', 'VN-225', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 13 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 15 HOUR + INTERVAL 15 MINUTE, 135, 'direct', 1620000, 3800000, 5800000, 45, 15, 8, '7kg', '23kg', 'scheduled'),

-- Hà Nội - Đà Nẵng
('Bamboo Airways', 'QH-201', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'Đà Nẵng', 'DAD', 'Sân bay Đà Nẵng', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR + INTERVAL 30 MINUTE, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 10 HOUR, 90, 'direct', 1200000, 2800000, 0, 80, 20, 0, '7kg', '20kg', 'scheduled'),
('Vietnam Airlines', 'VN-155', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'Đà Nẵng', 'DAD', 'Sân bay Đà Nẵng', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 12 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 13 HOUR + INTERVAL 30 MINUTE, 90, 'direct', 1300000, 3000000, 4800000, 60, 25, 12, '7kg', '23kg', 'scheduled'),

-- TP. Hồ Chí Minh - Đà Nẵng
('Vietnam Airlines', 'VN-155', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', 'Đà Nẵng', 'DAD', 'Sân bay Đà Nẵng', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 10 HOUR + INTERVAL 30 MINUTE, 90, 'direct', 1100000, 2800000, 4500000, 60, 25, 10, '7kg', '23kg', 'scheduled'),
('Vietjet Air', 'VJ-401', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', 'Đà Nẵng', 'DAD', 'Sân bay Đà Nẵng', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 11 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 12 HOUR + INTERVAL 30 MINUTE, 90, 'direct', 1050000, 0, 0, 90, 0, 0, '7kg', '20kg', 'scheduled'),

-- Đà Nẵng - Hà Nội
('Bamboo Airways', 'QH-202', 'Đà Nẵng', 'DAD', 'Sân bay Đà Nẵng', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 10 HOUR + INTERVAL 30 MINUTE, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 12 HOUR, 90, 'direct', 1200000, 2800000, 0, 80, 20, 0, '7kg', '20kg', 'scheduled'),

-- Đà Nẵng - TP. Hồ Chí Minh
('Vietnam Airlines', 'VN-156', 'Đà Nẵng', 'DAD', 'Sân bay Đà Nẵng', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 11 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 12 HOUR + INTERVAL 30 MINUTE, 90, 'direct', 1100000, 2800000, 4500000, 60, 25, 10, '7kg', '23kg', 'scheduled'),

-- Thêm các chuyến bay cho ngày 2, 3, 4, 5, 7, 14, 30 ngày sau
-- Ngày 2
('Vietnam Airlines', 'VN-202', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 6 HOUR, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 8 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1500000, 3500000, 5500000, 50, 20, 10, '7kg', '23kg', 'scheduled'),
('Vietjet Air', 'VJ-303', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 8 HOUR, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 10 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1250000, 0, 0, 100, 0, 0, '7kg', '20kg', 'scheduled'),

-- Ngày 3
('Vietnam Airlines', 'VN-203', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 6 HOUR, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 8 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1500000, 3500000, 5500000, 50, 20, 10, '7kg', '23kg', 'scheduled'),
('Bamboo Airways', 'QH-502', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 14 HOUR, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 16 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1400000, 3200000, 0, 60, 15, 0, '7kg', '23kg', 'scheduled'),

-- Ngày 7
('Vietnam Airlines', 'VN-207', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 6 HOUR, DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 8 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1500000, 3500000, 5500000, 50, 20, 10, '7kg', '23kg', 'scheduled'),
('Vietjet Air', 'VJ-307', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 8 HOUR, DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 10 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1250000, 0, 0, 100, 0, 0, '7kg', '20kg', 'scheduled'),

-- Ngày 14
('Vietnam Airlines', 'VN-214', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 14 DAY) + INTERVAL 6 HOUR, DATE_ADD(NOW(), INTERVAL 14 DAY) + INTERVAL 8 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1500000, 3500000, 5500000, 50, 20, 10, '7kg', '23kg', 'scheduled'),
('Vietjet Air', 'VJ-314', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 14 DAY) + INTERVAL 8 HOUR, DATE_ADD(NOW(), INTERVAL 14 DAY) + INTERVAL 10 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1250000, 0, 0, 100, 0, 0, '7kg', '20kg', 'scheduled'),

-- Ngày 30
('Vietnam Airlines', 'VN-230', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 30 DAY) + INTERVAL 6 HOUR, DATE_ADD(NOW(), INTERVAL 30 DAY) + INTERVAL 8 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1500000, 3500000, 5500000, 50, 20, 10, '7kg', '23kg', 'scheduled'),
('Vietjet Air', 'VJ-330', 'Hà Nội', 'HAN', 'Sân bay Nội Bài', 'TP. Hồ Chí Minh', 'SGN', 'Sân bay Tân Sơn Nhất', DATE_ADD(NOW(), INTERVAL 30 DAY) + INTERVAL 8 HOUR, DATE_ADD(NOW(), INTERVAL 30 DAY) + INTERVAL 10 HOUR + INTERVAL 10 MINUTE, 130, 'direct', 1250000, 0, 0, 100, 0, 0, '7kg', '20kg', 'scheduled');

-- Thông báo hoàn thành
SELECT 'Đã thêm dữ liệu chuyến bay mẫu thành công!' AS result;







