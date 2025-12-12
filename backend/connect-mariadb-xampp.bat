@echo off
echo ========================================
echo   Connect to MariaDB (XAMPP)
echo ========================================
echo.

set XAMPP_PATH=C:\xampp

if not exist "%XAMPP_PATH%\mysql\bin\mysql.exe" (
    echo ❌ Không tìm thấy mysql.exe
    echo Vui lòng chỉnh sửa XAMPP_PATH trong file này
    pause
    exit
)

echo Đang kết nối với MariaDB qua 127.0.0.1...
echo (Nhấn Enter nếu không có password)
echo.

REM Kết nối với 127.0.0.1 thay vì localhost
"%XAMPP_PATH%\mysql\bin\mysql.exe" -u root -h 127.0.0.1 -p

pause




