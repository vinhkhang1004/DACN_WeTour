@echo off
echo ========================================
echo   Fix MariaDB Permissions for XAMPP
echo   Step by Step Guide
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
echo ========================================
echo   BƯỚC 1: Kết nối với 127.0.0.1
echo ========================================
echo.
echo Đang thử kết nối với 127.0.0.1 (thay vì localhost)...
echo Nhấn Enter nếu không có password
echo.

REM Thử kết nối với 127.0.0.1
"%XAMPP_PATH%\mysql\bin\mysql.exe" -u root -h 127.0.0.1 -p -e "SELECT 'Connection successful!' AS Status;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Kết nối thành công với 127.0.0.1!
    echo.
    echo ========================================
    echo   BƯỚC 2: Cấp quyền
    echo ========================================
    echo.
    
    REM Tạo file SQL
    echo GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' IDENTIFIED BY '' WITH GRANT OPTION; > temp_fix.sql
    echo GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY '' WITH GRANT OPTION; >> temp_fix.sql
    echo FLUSH PRIVILEGES; >> temp_fix.sql
    echo SELECT User, Host FROM mysql.user WHERE User = 'root'; >> temp_fix.sql
    
    echo Đang cấp quyền...
    "%XAMPP_PATH%\mysql\bin\mysql.exe" -u root -h 127.0.0.1 -p < temp_fix.sql
    
    REM Xóa file tạm
    del temp_fix.sql
    
    echo.
    echo ✅ Đã hoàn thành! Hãy thử chạy lại server Node.js.
) else (
    echo.
    echo ❌ Không thể kết nối với 127.0.0.1
    echo.
    echo ========================================
    echo   GIẢI PHÁP THAY THẾ
    echo ========================================
    echo.
    echo Hãy thử các cách sau:
    echo.
    echo 1. Kiểm tra XAMPP Control Panel - đảm bảo MySQL đang chạy
    echo.
    echo 2. Thử kết nối qua socket (nếu trên Windows có thể):
    echo    %XAMPP_PATH%\mysql\bin\mysql.exe -u root --socket=%XAMPP_PATH%\mysql\data\mysql.sock
    echo.
    echo 3. Kiểm tra file my.ini trong %XAMPP_PATH%\mysql\bin\
    echo    và đảm bảo bind-address = 127.0.0.1
    echo.
    echo 4. Khởi động lại MySQL service trong XAMPP Control Panel
    echo.
)

echo.
pause




