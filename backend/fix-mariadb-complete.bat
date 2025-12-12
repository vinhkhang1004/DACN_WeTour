@echo off
echo ========================================
echo   Fix MariaDB Connection Issue (XAMPP)
echo   Complete Solution
echo ========================================
echo.

set XAMPP_PATH=C:\xampp

if not exist "%XAMPP_PATH%\mysql\bin\mysql.exe" (
    echo ❌ Không tìm thấy mysql.exe tại %XAMPP_PATH%
    echo Vui lòng chỉnh sửa XAMPP_PATH trong file này
    pause
    exit
)

echo ✅ Đã tìm thấy MariaDB tại: %XAMPP_PATH%
echo.
echo ========================================
echo   BƯỚC 1: Kiểm tra MySQL Service
echo ========================================
echo.
echo Vui lòng đảm bảo MySQL đang chạy trong XAMPP Control Panel
echo Nhấn phím bất kỳ sau khi đã kiểm tra...
pause > nul

echo.
echo ========================================
echo   BƯỚC 2: Tạo file SQL để sửa lỗi
echo ========================================
echo.

REM Tạo file SQL với các lệnh cần thiết
(
echo -- Fix MariaDB permissions
echo -- Drop existing problematic users first
echo DROP USER IF EXISTS 'root'@'localhost';
echo DROP USER IF EXISTS 'root'@'127.0.0.1';
echo DROP USER IF EXISTS 'root'@'%%';
echo.
echo -- Create new users with proper permissions
echo CREATE USER 'root'@'localhost' IDENTIFIED BY '';
echo CREATE USER 'root'@'127.0.0.1' IDENTIFIED BY '';
echo CREATE USER 'root'@'%%' IDENTIFIED BY '';
echo.
echo -- Grant all privileges
echo GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
echo GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
echo GRANT ALL PRIVILEGES ON *.* TO 'root'@'%%' WITH GRANT OPTION;
echo.
echo -- Apply changes
echo FLUSH PRIVILEGES;
echo.
echo -- Show users
echo SELECT User, Host FROM mysql.user WHERE User = 'root';
) > fix_mariadb.sql

echo ✅ Đã tạo file fix_mariadb.sql
echo.

echo ========================================
echo   BƯỚC 3: Thử các cách kết nối
echo ========================================
echo.

echo Đang thử kết nối với socket (nếu có)...
if exist "%XAMPP_PATH%\mysql\data\mysql.sock" (
    echo Tìm thấy socket file
    "%XAMPP_PATH%\mysql\bin\mysql.exe" -u root --socket="%XAMPP_PATH%\mysql\data\mysql.sock" < fix_mariadb.sql
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Thành công với socket!
        goto :success
    )
)

echo.
echo Đang thử kết nối với 127.0.0.1 qua TCP...
echo (Nhấn Enter nếu không có password)
"%XAMPP_PATH%\mysql\bin\mysql.exe" -u root -h 127.0.0.1 -p --protocol=TCP < fix_mariadb.sql
if %ERRORLEVEL% EQU 0 (
    echo ✅ Thành công với TCP!
    goto :success
)

echo.
echo ❌ Không thể kết nối tự động
echo.
echo ========================================
echo   HƯỚNG DẪN THỦ CÔNG
echo ========================================
echo.
echo Vui lòng làm theo các bước sau:
echo.
echo 1. Mở XAMPP Control Panel
echo 2. Dừng MySQL service (nếu đang chạy)
echo 3. Khởi động lại MySQL service
echo 4. Mở XAMPP Shell và chạy:
echo.
echo    cd %XAMPP_PATH%\mysql\bin
echo    mysql.exe -u root --skip-grant-tables
echo.
echo 5. Trong MySQL prompt, chạy các lệnh từ file fix_mariadb.sql
echo    (Mở file đó bằng Notepad để xem nội dung)
echo.
echo 6. Sau khi chạy xong, thoát và khởi động lại MySQL service
echo.
goto :end

:success
echo.
echo ========================================
echo   ✅ ĐÃ SỬA XONG!
echo ========================================
echo.
echo Đã cấp quyền cho:
echo   - root@localhost
echo   - root@127.0.0.1
echo   - root@%%
echo.
echo Bây giờ hãy thử chạy lại server Node.js:
echo   npm start
echo.

:end
echo.
echo File SQL đã được tạo: fix_mariadb.sql
echo Bạn có thể mở file này để xem các lệnh SQL
echo.
pause




