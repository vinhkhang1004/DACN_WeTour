@echo off
echo ========================================
echo   Kết nối MySQL (sau khi đã chạy skip-grant-tables)
echo ========================================
echo.

set XAMPP_PATH=C:\xampp

if not exist "%XAMPP_PATH%\mysql\bin\mysql.exe" (
    echo ❌ Không tìm thấy mysql.exe tại %XAMPP_PATH%
    pause
    exit
)

echo ✅ Đang kết nối đến MySQL...
echo.
echo 📝 Bạn sẽ vào MySQL mà không cần password
echo    Sau khi vào được, chạy các lệnh từ file: mysql-commands-to-fix.txt
echo.
echo ========================================
echo.

REM Chuyển đến thư mục mysql/bin
cd /d "%XAMPP_PATH%\mysql\bin"

REM Kết nối MySQL (không cần password khi đã skip-grant-tables)
mysql.exe -u root

echo.
echo ========================================
echo   Đã thoát khỏi MySQL
echo ========================================
echo.
echo ⚠️  QUAN TRỌNG: 
echo    Sau khi sửa xong, bạn CẦN:
echo    1. Dừng MySQL đang chạy với skip-grant-tables
echo    2. Khởi động lại MySQL bình thường trong XAMPP Control Panel
echo.
pause




