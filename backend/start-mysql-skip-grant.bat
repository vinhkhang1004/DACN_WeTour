@echo off
echo ========================================
echo   Khởi động MySQL với --skip-grant-tables
echo ========================================
echo.

set XAMPP_PATH=C:\xampp

if not exist "%XAMPP_PATH%\mysql\bin\mysqld.exe" (
    echo ❌ Không tìm thấy mysqld.exe tại %XAMPP_PATH%
    echo Vui lòng chỉnh sửa XAMPP_PATH trong file này
    pause
    exit
)

echo ✅ Đã tìm thấy MySQL tại: %XAMPP_PATH%
echo.
echo ⚠️  QUAN TRỌNG: 
echo    1. Đảm bảo MySQL đã DỪNG trong XAMPP Control Panel
echo    2. Nhấn phím bất kỳ để tiếp tục
echo.
pause

echo.
echo ========================================
echo   Đang khởi động MySQL với skip-grant-tables...
echo ========================================
echo.
echo 📝 Lưu ý:
echo    - MySQL sẽ chạy ở chế độ nền (background)
echo    - Cửa sổ này sẽ đóng lại
echo    - Sau đó mở file: open-mysql-connect.bat để kết nối
echo.
echo ========================================
echo.

REM Chuyển đến thư mục mysql/bin
cd /d "%XAMPP_PATH%\mysql\bin"

REM Khởi động MySQL server với skip-grant-tables
start "MySQL Skip Grant Tables" /MIN mysqld.exe --skip-grant-tables --console

timeout /t 3 /nobreak > nul

echo.
echo ✅ MySQL đã được khởi động với skip-grant-tables
echo.
echo 📝 Bây giờ hãy mở file: open-mysql-connect.bat để kết nối
echo.
pause




