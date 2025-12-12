@echo off
echo ========================================
echo Checking and Adding quantity column to hotel_rooms table
echo ========================================
echo.

REM Đọc thông tin database từ .env hoặc config
REM Bạn cần điều chỉnh các biến này theo cấu hình của bạn
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASS=
set DB_NAME=wetour

echo Checking if quantity column exists...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% %DB_NAME% -e "SELECT COUNT(*) as column_exists FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = '%DB_NAME%' AND TABLE_NAME = 'hotel_rooms' AND COLUMN_NAME = 'quantity';"

echo.
echo Running migration...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% %DB_NAME% < ..\database\migration_add_room_quantity.sql

echo.
echo Migration completed!
echo.
pause



