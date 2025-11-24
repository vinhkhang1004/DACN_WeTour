@echo off
REM Batch script to run chat migration
echo 🚀 Đang chạy migration để thêm bảng chat...

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
    echo ❌ Không tìm thấy MySQL. Vui lòng chạy thủ công bằng MySQL Workbench/phpMyAdmin
    pause
    exit /b 1
)

echo ✅ Tìm thấy MySQL tại: %MYSQL_PATH%
echo.
echo Nhập mật khẩu MySQL root khi được yêu cầu:
"%MYSQL_PATH%" -u root -p travel_db < migration_add_chat.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migration thành công! Bảng conversations và messages đã được tạo.
) else (
    echo.
    echo ⚠️ Có thể bảng đã tồn tại hoặc có lỗi. Kiểm tra kết quả ở trên.
)

pause

