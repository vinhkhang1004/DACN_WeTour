-- Fix MySQL max_allowed_packet error for avatar uploads
-- Chạy lệnh này trong MySQL để tăng giới hạn packet size

-- Kiểm tra giá trị hiện tại
SHOW VARIABLES LIKE 'max_allowed_packet';

-- Tăng max_allowed_packet lên 16MB (tạm thời cho session hiện tại)
SET GLOBAL max_allowed_packet = 16777216;

-- Hoặc tăng lên 32MB nếu cần
-- SET GLOBAL max_allowed_packet = 33554432;

-- Lưu ý: Để thay đổi vĩnh viễn, cần chỉnh sửa file my.cnf hoặc my.ini:
-- [mysqld]
-- max_allowed_packet = 16M
-- Sau đó restart MySQL service





