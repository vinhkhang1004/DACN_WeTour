@echo off
chcp 65001 >nul
echo ========================================
echo    Quick Git Push
echo ========================================
echo.

REM Chuyển vào thư mục dự án
cd /d "%~dp0"
echo Thu muc hien tai: %CD%
echo.

REM Kiểm tra git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git chua duoc cai dat!
    pause
    exit /b 1
)

REM Kiểm tra thư mục dự án
if not exist "backend\package.json" (
    echo [ERROR] Khong tim thay thu muc du an!
    echo Vui long chay file nay trong thu muc DACN_WeTour
    pause
    exit /b 1
)

REM Khởi tạo git nếu chưa có
if not exist ".git" (
    echo [INFO] Khoi tao Git repository...
    git init
)

REM Kiểm tra remote
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Chua co remote repository!
    echo.
    echo Ban can them remote repository truoc:
    echo   git remote add origin https://github.com/USERNAME/REPO.git
    echo.
    set /p repo_url "Nhap URL GitHub repository (hoac Enter de bo qua): "
    if not "%repo_url%"=="" (
        git remote add origin %repo_url%
        echo [SUCCESS] Da them remote repository
    ) else (
        echo Ban co the them remote sau bang lenh:
        echo   git remote add origin ^<your-github-repo-url^>
        pause
        exit /b 0
    )
)

REM Add files
echo.
echo [INFO] Dang them cac file...
git add .

REM Commit
echo [INFO] Dang commit...
git commit -m "feat: Them tinh nang dat tour cho khach chua dang nhap" >nul 2>&1

REM Push
echo [INFO] Dang push len GitHub...
git branch -M main 2>nul
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Push thanh cong!
) else (
    echo.
    echo [ERROR] Loi khi push!
    echo.
    echo Co the do:
    echo  1. Chua dang nhap GitHub (can Personal Access Token)
    echo  2. Repository chua ton tai tren GitHub
    echo  3. Khong co quyen truy cap
    echo.
    echo Thu cac lenh sau:
    echo  git push -u origin main
)

echo.
pause

