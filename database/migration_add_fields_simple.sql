-- Migration đơn giản - Thêm các cột mới vào bảng tours
-- Lưu ý: Nếu cột đã tồn tại sẽ báo lỗi, nhưng có thể bỏ qua
USE travel_db;

-- Thêm các cột mới vào bảng tours
ALTER TABLE tours 
  ADD COLUMN status VARCHAR(50) DEFAULT 'active' AFTER image,
  ADD COLUMN images TEXT AFTER status,
  ADD COLUMN departure_date DATETIME NULL AFTER duration,
  ADD COLUMN available_dates TEXT NULL AFTER departure_date,
  ADD COLUMN max_people INT NULL AFTER available_dates,
  ADD COLUMN category VARCHAR(255) NULL AFTER max_people,
  ADD COLUMN categories TEXT NULL AFTER category,
  ADD COLUMN includes TEXT NULL AFTER categories,
  ADD COLUMN excludes TEXT NULL AFTER includes,
  ADD COLUMN itinerary TEXT NULL AFTER excludes,
  ADD COLUMN highlights TEXT NULL AFTER itinerary;

-- Thêm các cột mới vào bảng users (nếu chưa có)
ALTER TABLE users 
  ADD COLUMN status VARCHAR(50) DEFAULT 'active' AFTER role,
  ADD COLUMN loyalty_points INT DEFAULT 0 AFTER status,
  ADD COLUMN loyalty_tier VARCHAR(50) DEFAULT 'Member' AFTER loyalty_points;

