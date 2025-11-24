@echo off
REM Batch script to run migration_add_notes.sql
REM Usage: run_migration.bat

echo 🚀 Đang chạy migration để thêm cột notes vào bảng bookings...

REM Try to find MySQL
set MYSQL_PATH=
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
)
if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" (
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe
)
if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
)
if exist "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe" (
    set MYSQL_PATH=C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe
)

if "%MYSQL_PATH%"=="" (
    echo ❌ Không tìm thấy MySQL. Vui lòng:
    echo    1. Cài đặt MySQL hoặc XAMPP/WAMP
    echo    2. Hoặc chạy thủ công bằng MySQL Workbench/phpMyAdmin
    echo.
    echo 📝 SQL cần chạy:
    type migration_add_notes.sql
    pause
    exit /b 1
)

echo ✅ Tìm thấy MySQL tại: %MYSQL_PATH%
echo.
echo Nhập mật khẩu MySQL root khi được yêu cầu:
"%MYSQL_PATH%" -u root -p travel_db < migration_add_notes.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migration thành công! Cột 'notes' đã được thêm vào bảng bookings.
) else (
    echo.
    echo ⚠️ Có thể cột đã tồn tại hoặc có lỗi. Kiểm tra kết quả ở trên.
)

pause

