-- Migration: Add guest booking fields to bookings table
-- Cho phép khách hàng chưa đăng nhập đặt tour

-- Thêm các cột mới cho thông tin khách chưa đăng nhập
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255) NULL AFTER notes,
ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(20) NULL AFTER guest_name,
ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255) NULL AFTER guest_phone;

-- Cho phép user_id NULL (khách chưa đăng nhập)
ALTER TABLE bookings 
MODIFY COLUMN user_id INT NULL;

-- Thêm index cho guest_email để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_guest_email ON bookings(guest_email);

-- Thêm index cho guest_phone
CREATE INDEX IF NOT EXISTS idx_guest_phone ON bookings(guest_phone);

