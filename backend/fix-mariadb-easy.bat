@echo off
echo ========================================
echo   Sửa lỗi MariaDB - Cách Đơn Giản Nhất
echo ========================================
echo.

set XAMPP_PATH=C:\xampp

if not exist "%XAMPP_PATH%\mysql\bin\mysqld.exe" (
    echo ❌ Không tìm thấy MySQL tại %XAMPP_PATH%
    echo Vui lòng chỉnh sửa XAMPP_PATH trong file này
    pause
    exit
)

echo ✅ Đã tìm thấy MySQL tại: %XAMPP_PATH%
echo.
echo ========================================
echo   HƯỚNG DẪN TỪNG BƯỚC
echo ========================================
echo.
echo BƯỚC 1: Dừng MySQL trong XAMPP Control Panel
echo    - Mở XAMPP Control Panel
echo    - Click "Stop" cho MySQL service
echo.
echo BƯỚC 2: Nhấn phím bất kỳ sau khi đã dừng MySQL...
pause > nul

echo.
echo ========================================
echo   BƯỚC 3: Khởi động MySQL với skip-grant-tables
echo ========================================
echo.

cd /d "%XAMPP_PATH%\mysql\bin"

REM Khởi động MySQL server với skip-grant-tables ở chế độ nền
start "MySQL Skip Grant" /MIN mysqld.exe --skip-grant-tables --console

echo Đang khởi động MySQL...
timeout /t 5 /nobreak > nul

echo.
echo ✅ MySQL đã được khởi động
echo.
echo ========================================
echo   BƯỚC 4: Kết nối và sửa lỗi
echo ========================================
echo.

REM Tạo file SQL tạm thời
(
echo FLUSH PRIVILEGES;
echo DELETE FROM mysql.user WHERE User='root' AND Host='localhost';
echo DELETE FROM mysql.user WHERE User='root' AND Host='127.0.0.1';
echo CREATE USER 'root'@'localhost' IDENTIFIED BY '';
echo CREATE USER 'root'@'127.0.0.1' IDENTIFIED BY '';
echo GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
echo GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;
echo FLUSH PRIVILEGES;
echo SELECT User, Host FROM mysql.user WHERE User = 'root';
) > temp_fix.sql

echo Đang chạy các lệnh SQL để sửa lỗi...
mysql.exe -u root < temp_fix.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ĐÃ SỬA XONG!
    echo.
    del temp_fix.sql
    
    echo ========================================
    echo   BƯỚC 5: Dừng MySQL và khởi động lại bình thường
    echo ========================================
    echo.
    echo ⚠️  QUAN TRỌNG:
    echo    1. Đóng cửa sổ "MySQL Skip Grant" (hoặc kill process)
    echo    2. Hoặc chạy lệnh: taskkill /F /IM mysqld.exe
    echo    3. Sau đó khởi động lại MySQL trong XAMPP Control Panel
    echo.
    
    echo Bạn có muốn tự động dừng MySQL skip-grant-tables không? (Y/N)
    set /p choice="Nhập Y hoặc N: "
    
    if /i "%choice%"=="Y" (
        echo.
        echo Đang dừng MySQL...
        taskkill /F /IM mysqld.exe > nul 2>&1
        timeout /t 2 /nobreak > nul
        echo ✅ Đã dừng MySQL
        echo.
        echo Bây giờ hãy khởi động lại MySQL trong XAMPP Control Panel
    )
    
) else (
    echo.
    echo ❌ Có lỗi xảy ra
    echo.
    echo Hãy thử cách thủ công:
    echo 1. Chạy file: open-mysql-connect.bat
    echo 2. Copy các lệnh từ file: mysql-commands-to-fix.txt
    echo 3. Paste vào MySQL prompt
)

echo.
pause



