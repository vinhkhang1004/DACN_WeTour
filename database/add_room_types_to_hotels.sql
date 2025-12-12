-- Script để thêm các loại phòng khác nhau với giá khác nhau cho mỗi khách sạn
-- Xóa các phòng cũ nếu cần (uncomment dòng dưới)
-- DELETE FROM hotel_rooms;

-- Thêm các loại phòng cho khách sạn The Imperial Hotel Vung Tau
INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Phòng Standard',
  'Phòng tiêu chuẩn với view thành phố, đầy đủ tiện nghi cơ bản, phù hợp cho khách du lịch.',
  2,
  '1 giường đôi',
  2500000,
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
  '["Wi-Fi miễn phí","Điều hòa","TV","Tủ lạnh","Phòng tắm riêng"]',
  'available'
FROM `hotels` h 
WHERE h.name LIKE '%Imperial%' AND h.location LIKE '%Vung Tau%'
LIMIT 1;

INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Phòng Deluxe View Biển',
  'Phòng sang trọng với view biển tuyệt đẹp, ban công riêng, không gian rộng rãi.',
  2,
  '1 giường King',
  3500000,
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400',
  '["View biển","Ban công riêng","Wi-Fi tốc độ cao","Minibar","Phòng tắm sang trọng"]',
  'available'
FROM `hotels` h 
WHERE h.name LIKE '%Imperial%' AND h.location LIKE '%Vung Tau%'
LIMIT 1;

INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Suite Hướng Biển',
  'Suite cao cấp với view biển 180 độ, phòng khách riêng, bếp mini, không gian rộng rãi.',
  4,
  '1 giường King + Sofa bed',
  5500000,
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400',
  '["View biển 180 độ","Phòng khách riêng","Bếp mini","Ban công lớn","Phòng tắm Jacuzzi"]',
  'available'
FROM `hotels` h 
WHERE h.name LIKE '%Imperial%' AND h.location LIKE '%Vung Tau%'
LIMIT 1;

INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Presidential Suite',
  'Suite tổng thống sang trọng nhất, view biển tuyệt đẹp, phòng khách lớn, phòng ngủ master, bếp đầy đủ.',
  6,
  '1 giường King + 1 giường đôi',
  8500000,
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400',
  '["View biển 360 độ","Phòng khách lớn","Bếp đầy đủ","Phòng tắm spa","Butler service"]',
  'available'
FROM `hotels` h 
WHERE h.name LIKE '%Imperial%' AND h.location LIKE '%Vung Tau%'
LIMIT 1;

-- Thêm các loại phòng cho các khách sạn khác (Hà Nội)
INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Phòng Superior',
  'Phòng cao cấp với view thành phố, không gian rộng rãi, đầy đủ tiện nghi.',
  2,
  '1 giường đôi',
  1800000,
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
  '["Wi-Fi miễn phí","Điều hòa","TV","Tủ lạnh","Phòng tắm riêng"]',
  'available'
FROM `hotels` h 
WHERE h.location LIKE '%Hà Nội%' OR h.location LIKE '%Hanoi%'
LIMIT 5;

INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Phòng Deluxe',
  'Phòng sang trọng với view đẹp, ban công riêng, không gian thoáng đãng.',
  2,
  '1 giường King',
  2500000,
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400',
  '["View đẹp","Ban công riêng","Wi-Fi tốc độ cao","Minibar","Phòng tắm sang trọng"]',
  'available'
FROM `hotels` h 
WHERE h.location LIKE '%Hà Nội%' OR h.location LIKE '%Hanoi%'
LIMIT 5;

INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Suite Executive',
  'Suite cao cấp với phòng khách riêng, bếp mini, không gian rộng rãi.',
  4,
  '1 giường King + Sofa bed',
  3800000,
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400',
  '["Phòng khách riêng","Bếp mini","Ban công lớn","Phòng tắm sang trọng","Executive lounge access"]',
  'available'
FROM `hotels` h 
WHERE h.location LIKE '%Hà Nội%' OR h.location LIKE '%Hanoi%'
LIMIT 5;

-- Thêm các loại phòng cho khách sạn ở TP.HCM
INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Phòng Standard',
  'Phòng tiêu chuẩn với view thành phố, đầy đủ tiện nghi cơ bản.',
  2,
  '1 giường đôi',
  2000000,
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
  '["Wi-Fi miễn phí","Điều hòa","TV","Tủ lạnh","Phòng tắm riêng"]',
  'available'
FROM `hotels` h 
WHERE h.location LIKE '%TP.HCM%' OR h.location LIKE '%Ho Chi Minh%' OR h.location LIKE '%Saigon%'
LIMIT 5;

INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Phòng Deluxe View Thành Phố',
  'Phòng sang trọng với view thành phố, ban công riêng, không gian rộng rãi.',
  2,
  '1 giường King',
  3000000,
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400',
  '["View thành phố","Ban công riêng","Wi-Fi tốc độ cao","Minibar","Phòng tắm sang trọng"]',
  'available'
FROM `hotels` h 
WHERE h.location LIKE '%TP.HCM%' OR h.location LIKE '%Ho Chi Minh%' OR h.location LIKE '%Saigon%'
LIMIT 5;

INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Suite Premium',
  'Suite cao cấp với phòng khách riêng, bếp mini, không gian rộng rãi.',
  4,
  '1 giường King + Sofa bed',
  4500000,
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400',
  '["Phòng khách riêng","Bếp mini","Ban công lớn","Phòng tắm sang trọng","City view"]',
  'available'
FROM `hotels` h 
WHERE h.location LIKE '%TP.HCM%' OR h.location LIKE '%Ho Chi Minh%' OR h.location LIKE '%Saigon%'
LIMIT 5;

-- Thêm các loại phòng cho khách sạn ở Đà Nẵng
INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Phòng Superior View Biển',
  'Phòng cao cấp với view biển, không gian rộng rãi, đầy đủ tiện nghi.',
  2,
  '1 giường đôi',
  2200000,
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
  '["View biển","Wi-Fi miễn phí","Điều hòa","TV","Tủ lạnh","Phòng tắm riêng"]',
  'available'
FROM `hotels` h 
WHERE h.location LIKE '%Đà Nẵng%' OR h.location LIKE '%Da Nang%'
LIMIT 5;

INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Phòng Deluxe Ocean View',
  'Phòng sang trọng với view biển tuyệt đẹp, ban công riêng, không gian rộng rãi.',
  2,
  '1 giường King',
  3200000,
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400',
  '["View biển tuyệt đẹp","Ban công riêng","Wi-Fi tốc độ cao","Minibar","Phòng tắm sang trọng"]',
  'available'
FROM `hotels` h 
WHERE h.location LIKE '%Đà Nẵng%' OR h.location LIKE '%Da Nang%'
LIMIT 5;

INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Beachfront Suite',
  'Suite cao cấp ngay sát biển, view biển 180 độ, phòng khách riêng, bếp mini.',
  4,
  '1 giường King + Sofa bed',
  4800000,
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400',
  '["Ngay sát biển","View biển 180 độ","Phòng khách riêng","Bếp mini","Ban công lớn","Phòng tắm sang trọng"]',
  'available'
FROM `hotels` h 
WHERE h.location LIKE '%Đà Nẵng%' OR h.location LIKE '%Da Nang%'
LIMIT 5;

-- Thêm các loại phòng cho các khách sạn ở các địa điểm khác
INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Phòng Standard',
  'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho khách du lịch.',
  2,
  '1 giường đôi',
  1500000,
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400',
  '["Wi-Fi miễn phí","Điều hòa","TV","Tủ lạnh","Phòng tắm riêng"]',
  'available'
FROM `hotels` h 
WHERE h.id NOT IN (
  SELECT DISTINCT hotel_id FROM hotel_rooms
)
LIMIT 20;

INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Phòng Deluxe',
  'Phòng sang trọng với không gian rộng rãi, đầy đủ tiện nghi cao cấp.',
  2,
  '1 giường King',
  2200000,
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400',
  '["Không gian rộng rãi","Wi-Fi tốc độ cao","Minibar","Phòng tắm sang trọng"]',
  'available'
FROM `hotels` h 
WHERE h.id NOT IN (
  SELECT DISTINCT hotel_id FROM hotel_rooms WHERE name = 'Phòng Deluxe'
)
LIMIT 20;

INSERT INTO `hotel_rooms` (`hotel_id`, `name`, `description`, `max_guests`, `bed_type`, `price_per_night`, `image`, `features`, `status`) 
SELECT 
  h.id,
  'Suite Family',
  'Suite gia đình với không gian rộng rãi, phù hợp cho gia đình có trẻ em.',
  4,
  '1 giường King + 1 giường đơn',
  3500000,
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400',
  '["Không gian rộng rãi","Phù hợp gia đình","Phòng khách riêng","Bếp mini","Phòng tắm lớn"]',
  'available'
FROM `hotels` h 
WHERE h.id NOT IN (
  SELECT DISTINCT hotel_id FROM hotel_rooms WHERE name = 'Suite Family'
)
LIMIT 20;




