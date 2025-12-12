@echo off
echo ========================================
echo   XAMPP MariaDB Command Line
echo ========================================
echo.

REM Tìm đường dẫn XAMPP (thường ở C:\xampp)
set XAMPP_PATH=C:\xampp

REM Kiểm tra xem thư mục có tồn tại không
if not exist "%XAMPP_PATH%\mysql\bin\mysql.exe" (
    echo ❌ Không tìm thấy mysql.exe tại %XAMPP_PATH%\mysql\bin\
    echo.
    echo Vui lòng chỉnh sửa file này và thay đổi XAMPP_PATH thành đường dẫn XAMPP của bạn
    echo Thường là: C:\xampp hoặc D:\xampp
    pause
    exit
)

echo ✅ Đã tìm thấy MariaDB tại: %XAMPP_PATH%\mysql\bin\
echo.
echo 🔐 Đang kết nối đến MariaDB...
echo    (Nhấn Enter nếu không có password)
echo.

REM Kết nối đến MariaDB
"%XAMPP_PATH%\mysql\bin\mysql.exe" -u root -p

pause




