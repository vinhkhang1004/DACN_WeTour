@echo off
echo ========================================
echo   Kiểm tra trạng thái MySQL (XAMPP)
echo ========================================
echo.

REM Kiểm tra xem MySQL process có đang chạy không
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MySQL đang CHẠY
    echo.
    echo Các process MySQL đang chạy:
    tasklist /FI "IMAGENAME eq mysqld.exe"
) else (
    echo ❌ MySQL KHÔNG chạy
    echo.
    echo ========================================
    echo   HƯỚNG DẪN KHỞI ĐỘNG
    echo ========================================
    echo.
    echo 1. Mở XAMPP Control Panel
    echo 2. Tìm MySQL service
    echo 3. Click nút "Start" (màu xanh)
    echo 4. Đợi cho đến khi status chuyển sang "Running"
    echo.
)

echo.
echo ========================================
echo   Kiểm tra port 3306
echo ========================================
echo.

netstat -an | findstr ":3306" > nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Port 3306 đang được sử dụng (MySQL đang lắng nghe)
    echo.
    echo Các kết nối trên port 3306:
    netstat -an | findstr ":3306"
) else (
    echo ❌ Port 3306 KHÔNG được sử dụng
    echo    MySQL có thể không đang chạy hoặc không lắng nghe trên port này
)

echo.
pause



