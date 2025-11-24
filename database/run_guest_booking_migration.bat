@echo off
echo Running guest booking migration...
echo.
echo Please enter your MySQL root password when prompted.
echo.
mysql -u root -p travel_db < migration_add_guest_booking.sql
echo.
echo Migration completed!
pause

