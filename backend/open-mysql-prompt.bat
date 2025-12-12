@echo off
echo ========================================
echo   Mở MySQL Prompt (XAMPP)
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
echo ⚠️  QUAN TRỌNG: Đảm bảo MySQL đang CHẠY trong XAMPP Control Panel!
echo.
echo Nhấn phím bất kỳ để tiếp tục...
pause > nul

echo.
echo ========================================
echo   Đang mở MySQL Prompt...
echo ========================================
echo.
echo 📝 Hướng dẫn:
echo    - Nhấn Enter nếu không có password
echo    - Hoặc nhập password nếu có
echo    - Sau khi vào được, bạn sẽ thấy: mysql^>
echo.
echo ========================================
echo.

REM Chuyển đến thư mục mysql/bin
cd /d "%XAMPP_PATH%\mysql\bin"

REM Mở MySQL prompt
mysql.exe -u root -p

echo.
echo ========================================
echo   Đã thoát khỏi MySQL Prompt
echo ========================================
pause




