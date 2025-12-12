@echo off
REM Batch file to run migration for adding max_children and images columns to hotel_rooms

echo ========================================
echo Adding max_children and images columns
echo ========================================
echo.

REM Try to find MySQL in common locations
set MYSQL_PATH=
if exist "C:\xampp\mysql\bin\mysql.exe" set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe
if exist "mysql.exe" set MYSQL_PATH=mysql.exe

if "%MYSQL_PATH%"=="" (
    echo ERROR: MySQL not found!
    echo Please:
    echo   1. Install MySQL or XAMPP
    echo   2. Add MySQL to PATH
    echo   3. Or run manually using MySQL Workbench/phpMyAdmin
    echo.
    echo To run manually:
    echo   1. Open MySQL Workbench or phpMyAdmin
    echo   2. Select database 'travel_db'
    echo   3. Run the SQL file: migration_add_max_children_safe.sql
    pause
    exit /b 1
)

echo Found MySQL at: %MYSQL_PATH%
echo.

REM Prompt for password
set /p MYSQL_PASSWORD="Enter MySQL root password: "

echo.
echo Running migration...
echo.

%MYSQL_PATH% -u root -p%MYSQL_PASSWORD% travel_db < migration_add_max_children_safe.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo Columns max_children and images added to hotel_rooms
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Migration may have failed or columns already exist
    echo Please check the error messages above
    echo ========================================
)

echo.
pause


