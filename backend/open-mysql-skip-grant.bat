@echo off
echo ========================================
echo   Mở MySQL Prompt với --skip-grant-tables
echo   (Bỏ qua kiểm tra quyền)
echo ========================================
echo.

set XAMPP_PATH=C:\xampp

if not exist "%XAMPP_PATH%\mysql\bin\mysql.exe" (
    echo ❌ Không tìm thấy mysql.exe tại %XAMPP_PATH%
    echo Vui lòng chỉnh sửa XAMPP_PATH trong file này
    pause
    exit
)

echo ✅ Đã tìm thấy MySQL tại: %XAMPP_PATH%
echo.
echo ⚠️  QUAN TRỌNG: 
echo    1. Dừng MySQL service trong XAMPP Control Panel TRƯỚC!
echo    2. Sau đó nhấn phím bất kỳ để tiếp tục
echo.
pause

echo.
echo ========================================
echo   Đang mở MySQL Prompt (skip-grant-tables)...
echo ========================================
echo.
echo 📝 Lưu ý:
echo    - Bạn sẽ vào MySQL mà không cần password
echo    - Sau khi vào được, bạn sẽ thấy: mysql^>
echo    - Chạy các lệnh SQL để sửa quyền
echo.
echo ========================================
echo.

REM Chuyển đến thư mục mysql/bin
cd /d "%XAMPP_PATH%\mysql\bin"

REM Mở MySQL prompt với skip-grant-tables
mysql.exe --skip-grant-tables --user=root

echo.
echo ========================================
echo   Đã thoát khỏi MySQL Prompt
echo ========================================
echo.
echo ⚠️  Nhớ khởi động lại MySQL service trong XAMPP Control Panel!
echo.
pause




