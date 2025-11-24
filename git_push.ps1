# Script để push code lên GitHub
# Chạy script này trong thư mục dự án

Write-Host "=== Git Push Script ===" -ForegroundColor Cyan

# Kiểm tra xem có trong thư mục dự án không
if (-not (Test-Path "backend\package.json") -and -not (Test-Path "frontend\package.json")) {
    Write-Host "❌ Không tìm thấy thư mục dự án!" -ForegroundColor Red
    Write-Host "Vui lòng chạy script này trong thư mục DACN_WeTour" -ForegroundColor Yellow
    exit 1
}

# Kiểm tra git
if (-not (Test-Path ".git")) {
    Write-Host "📦 Khởi tạo Git repository..." -ForegroundColor Yellow
    git init
}

# Kiểm tra remote
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "⚠️  Chưa có remote repository!" -ForegroundColor Yellow
    Write-Host "Vui lòng thêm remote repository:" -ForegroundColor Yellow
    Write-Host "  git remote add origin <your-github-repo-url>" -ForegroundColor Cyan
    Write-Host ""
    $addRemote = Read-Host "Bạn có muốn thêm remote ngay bây giờ? (y/n)"
    if ($addRemote -eq "y" -or $addRemote -eq "Y") {
        $repoUrl = Read-Host "Nhập URL GitHub repository (ví dụ: https://github.com/username/repo.git)"
        if ($repoUrl) {
            git remote add origin $repoUrl
            Write-Host "✅ Đã thêm remote repository" -ForegroundColor Green
        }
    } else {
        Write-Host "Bạn có thể thêm remote sau bằng lệnh:" -ForegroundColor Yellow
        Write-Host "  git remote add origin <your-github-repo-url>" -ForegroundColor Cyan
        exit 0
    }
}

# Add tất cả các file
Write-Host "📝 Đang thêm các file vào staging area..." -ForegroundColor Yellow
git add .

# Kiểm tra có thay đổi không
$status = git status --porcelain
if (-not $status) {
    Write-Host "ℹ️  Không có thay đổi nào để commit" -ForegroundColor Yellow
    exit 0
}

# Commit
Write-Host "💾 Đang commit..." -ForegroundColor Yellow
$commitMessage = @"
feat: Thêm tính năng đặt tour cho khách chưa đăng nhập

- Thêm form thông tin liên hệ cho khách chưa đăng nhập
- Cập nhật model Booking để hỗ trợ guest booking
- Thêm API /bookings/guest cho khách chưa đăng nhập
- Cập nhật admin booking management để hiển thị thông tin guest
- Gửi email xác nhận đến email khách nhập
- Cập nhật UI: logo, dropdown menu tài khoản, background video
- Lọc bỏ ngày khởi hành đã qua
- Cải thiện hiển thị Bao gồm/Không bao gồm từ database
"@

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit thành công!" -ForegroundColor Green
    
    # Push lên GitHub
    Write-Host "🚀 Đang push lên GitHub..." -ForegroundColor Yellow
    $branch = git branch --show-current
    if (-not $branch) {
        $branch = "main"
        git branch -M main
    }
    
    git push -u origin $branch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Push thành công lên GitHub!" -ForegroundColor Green
    } else {
        Write-Host "❌ Lỗi khi push. Có thể cần set upstream:" -ForegroundColor Red
        Write-Host "  git push -u origin $branch" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Lỗi khi commit" -ForegroundColor Red
}

