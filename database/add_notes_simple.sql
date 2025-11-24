-- Script đơn giản để thêm cột notes (không kiểm tra tồn tại)
-- Chạy script này nếu migration_add_notes.sql không hoạt động

USE travel_db;

-- Thêm cột notes vào bảng bookings
ALTER TABLE bookings 
ADD COLUMN notes TEXT NULL AFTER status;

-- Kiểm tra lại
DESCRIBE bookings;

