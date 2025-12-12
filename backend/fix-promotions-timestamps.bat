@echo off
echo ========================================
echo   Fix Promotions Table - Add Timestamps
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
echo ⚠️  Đảm bảo MySQL đang CHẠY trong XAMPP Control Panel!
echo.
echo Nhấn phím bất kỳ để tiếp tục...
pause > nul

echo.
echo ========================================
echo   Đang thêm cột created_at và updated_at
echo ========================================
echo.

cd /d "%XAMPP_PATH%\mysql\bin"

REM Chạy SQL script
mysql.exe -u root -p travel_db < "%~dp0fix-promotions-timestamps.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Đã thêm các cột thành công!
    echo.
    echo Bây giờ hãy thử chạy lại server: npm run dev
) else (
    echo.
    echo ❌ Có lỗi xảy ra
    echo.
    echo Hãy thử chạy SQL script thủ công:
    echo 1. Mở MySQL prompt: mysql -u root -p
    echo 2. Chạy: USE travel_db;
    echo 3. Copy nội dung từ file: fix-promotions-timestamps.sql
    echo 4. Paste vào MySQL prompt
)

echo.
pause




