@echo off
echo ========================================
echo   Fix MariaDB Permissions for XAMPP
echo ========================================
echo.

REM Tìm đường dẫn XAMPP (thường ở C:\xampp)
set XAMPP_PATH=C:\xampp

REM Kiểm tra xem thư mục có tồn tại không
if not exist "%XAMPP_PATH%\mysql\bin\mysql.exe" (
    echo ❌ Không tìm thấy mysql.exe tại %XAMPP_PATH%\mysql\bin\
    echo.
    echo Vui lòng chỉnh sửa file này và thay đổi XAMPP_PATH thành đường dẫn XAMPP của bạn
    pause
    exit
)

echo ✅ Đã tìm thấy MariaDB tại: %XAMPP_PATH%\mysql\bin\
echo.
echo 🔐 Đang cấp quyền cho root@127.0.0.1 và root@localhost...
echo    (Nhấn Enter nếu không có password)
echo.

REM Tạo file SQL tạm thời
echo GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' IDENTIFIED BY '' WITH GRANT OPTION; > temp_fix.sql
echo GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY '' WITH GRANT OPTION; >> temp_fix.sql
echo FLUSH PRIVILEGES; >> temp_fix.sql

REM Chạy SQL
"%XAMPP_PATH%\mysql\bin\mysql.exe" -u root -p < temp_fix.sql

REM Xóa file tạm
del temp_fix.sql

echo.
echo ✅ Đã hoàn thành! Hãy thử chạy lại server.
echo.
pause



