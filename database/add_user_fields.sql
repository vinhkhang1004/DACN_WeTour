-- Thêm cột phone và address vào bảng users
USE travel_db;

ALTER TABLE users 
  ADD COLUMN phone VARCHAR(20) NULL AFTER email,
  ADD COLUMN address TEXT NULL AFTER phone;

