@echo off
echo ========================================
echo Them cac loai phong cho khach san
echo ========================================
echo.

REM Kiem tra xem co file SQL khong
if not exist "add_room_types_to_hotels.sql" (
    echo ERROR: Khong tim thay file add_room_types_to_hotels.sql
    echo Vui long chay script trong thu muc database
    pause
    exit /b 1
)

echo Ban co muon them cac loai phong cho khach san khong?
echo.
echo Script nay se them:
echo - 4 loai phong cho The Imperial Hotel Vung Tau (Standard, Deluxe, Suite, Presidential)
echo - 3 loai phong cho khach san Ha Noi (Superior, Deluxe, Executive Suite)
echo - 3 loai phong cho khach san TP.HCM (Standard, Deluxe, Suite Premium)
echo - 3 loai phong cho khach san Da Nang (Superior, Deluxe, Beachfront Suite)
echo - 3 loai phong cho cac khach san khac (Standard, Deluxe, Suite Family)
echo.
set /p confirm="Nhan Y de tiep tuc, hoac phim bat ky de huy: "

if /i not "%confirm%"=="Y" (
    echo Da huy.
    pause
    exit /b 0
)

echo.
echo Dang ket noi den database...
echo Vui long nhap thong tin ket noi MySQL/MariaDB:
echo.

REM Doc thong tin ket noi tu nguoi dung
set /p dbhost="Host (mac dinh: localhost): "
if "%dbhost%"=="" set dbhost=localhost

set /p dbport="Port (mac dinh: 3306): "
if "%dbport%"=="" set dbport=3306

set /p dbname="Ten database (mac dinh: wetour): "
if "%dbname%"=="" set dbname=wetour

set /p dbuser="Username (mac dinh: root): "
if "%dbuser%"=="" set dbuser=root

set /p dbpass="Password: "

echo.
echo Dang chay script SQL...
echo.

REM Chay script SQL
mysql -h %dbhost% -P %dbport% -u %dbuser% -p%dbpass% %dbname% < add_room_types_to_hotels.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Thanh cong! Da them cac loai phong.
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Co loi xay ra! Vui long kiem tra lai.
    echo ========================================
    echo.
    echo Neu ban dung XAMPP, co the chay:
    echo   mysql -u root -p wetour ^< add_room_types_to_hotels.sql
    echo.
)

pause




