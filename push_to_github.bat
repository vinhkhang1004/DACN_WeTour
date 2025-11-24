@echo off
chcp 65001 >nul
echo ========================================
echo    Push Code to GitHub
echo ========================================
echo.

REM Kiểm tra git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git chua duoc cai dat!
    echo Vui long cai dat Git: https://git-scm.com/downloads
    pause
    exit /b 1
)

REM Kiểm tra xem có trong thư mục dự án không
if not exist "backend\package.json" (
    echo [ERROR] Khong tim thay thu muc du an!
    echo Vui long chay script nay trong thu muc DACN_WeTour
    pause
    exit /b 1
)

REM Kiểm tra git repository
if not exist ".git" (
    echo [INFO] Khoi tao Git repository...
    git init
)

REM Kiểm tra remote
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Chua co remote repository!
    echo.
    echo Vui long them remote repository:
    echo   git remote add origin https://github.com/USERNAME/REPO.git
    echo.
    set /p add_remote "Ban co muon them remote ngay bay gio? (y/n): "
    if /i "%add_remote%"=="y" (
        set /p repo_url "Nhap URL GitHub repository: "
        if not "%repo_url%"=="" (
            git remote add origin %repo_url%
            echo [SUCCESS] Da them remote repository
        )
    ) else (
        echo Ban co the them remote sau bang lenh:
        echo   git remote add origin ^<your-github-repo-url^>
        pause
        exit /b 0
    )
)

REM Add files
echo.
echo [INFO] Dang them cac file vao staging area...
git add .

REM Kiểm tra có thay đổi không
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo [INFO] Khong co thay doi nao de commit
    pause
    exit /b 0
)

REM Commit
echo [INFO] Dang commit...
git commit -m "feat: Them tinh nang dat tour cho khach chua dang nhap

- Them form thong tin lien he cho khach chua dang nhap
- Cap nhat model Booking de ho tro guest booking
- Them API /bookings/guest cho khach chua dang nhap
- Cap nhat admin booking management de hien thi thong tin guest
- Gui email xac nhan den email khach nhap
- Cap nhat UI: logo, dropdown menu tai khoan, background video
- Loc bo ngay khoi hanh da qua
- Cai thien hien thi Bao gom/Khong bao gom tu database"

if %errorlevel% equ 0 (
    echo [SUCCESS] Commit thanh cong!
    
    REM Push
    echo.
    echo [INFO] Dang push len GitHub...
    git branch -M main 2>nul
    git push -u origin main
    
    if %errorlevel% equ 0 (
        echo.
        echo [SUCCESS] Push thanh cong len GitHub!
    ) else (
        echo.
        echo [ERROR] Loi khi push. Co the can set upstream:
        echo   git push -u origin main
    )
) else (
    echo [ERROR] Loi khi commit
)

echo.
pause

