# Script để fix và push git
# Tự động tìm thư mục dự án và setup git

Write-Host "=== Fix và Push Git ===" -ForegroundColor Cyan
Write-Host ""

# Tìm thư mục dự án
$projectPath = $null
$possiblePaths = @(
    "$env:USERPROFILE\OneDrive\Máy tính\DACN_WeTour",
    "$env:USERPROFILE\OneDrive\Desktop\DACN_WeTour",
    "$env:USERPROFILE\Desktop\DACN_WeTour",
    ".\DACN_WeTour"
)

foreach ($path in $possiblePaths) {
    if (Test-Path "$path\backend\package.json") {
        $projectPath = $path
        Write-Host "✓ Tìm thấy thư mục dự án: $projectPath" -ForegroundColor Green
        break
    }
}

# Nếu không tìm thấy, tìm trong OneDrive
if (-not $projectPath) {
    Write-Host "Đang tìm thư mục dự án trong OneDrive..." -ForegroundColor Yellow
    $found = Get-ChildItem -Path "$env:USERPROFILE\OneDrive" -Recurse -Filter "package.json" -Depth 4 -ErrorAction SilentlyContinue | 
        Where-Object { $_.DirectoryName -like "*DACN*" -or $_.DirectoryName -like "*WeTour*" } | 
        Select-Object -First 1
    
    if ($found) {
        $projectPath = Split-Path (Split-Path $found.DirectoryName -Parent) -Parent
        Write-Host "✓ Tìm thấy: $projectPath" -ForegroundColor Green
    }
}

if (-not $projectPath) {
    Write-Host "❌ Không tìm thấy thư mục dự án!" -ForegroundColor Red
    Write-Host "Vui lòng chạy script này trong thư mục DACN_WeTour" -ForegroundColor Yellow
    Write-Host ""
    $manualPath = Read-Host "Hoặc nhập đường dẫn thủ công (Enter để bỏ qua)"
    if ($manualPath -and (Test-Path "$manualPath\backend\package.json")) {
        $projectPath = $manualPath
    } else {
        exit 1
    }
}

# Chuyển vào thư mục dự án
Set-Location $projectPath
Write-Host "Đã chuyển vào: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Xóa .git cũ nếu có (ở thư mục cha)
$parentGit = Join-Path (Split-Path $projectPath -Parent) ".git"
if (Test-Path $parentGit) {
    Write-Host "⚠️  Phát hiện .git ở thư mục cha, bỏ qua..." -ForegroundColor Yellow
}

# Khởi tạo git trong thư mục dự án
if (-not (Test-Path ".git")) {
    Write-Host "📦 Khởi tạo Git repository..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "✓ Đã có Git repository" -ForegroundColor Green
}

# Kiểm tra remote
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host ""
    Write-Host "⚠️  Chưa có remote repository!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Bạn cần thêm GitHub repository:" -ForegroundColor Cyan
    Write-Host "  git remote add origin https://github.com/USERNAME/REPO.git" -ForegroundColor White
    Write-Host ""
    $addRemote = Read-Host "Bạn có muốn thêm remote ngay bây giờ? (y/n)"
    if ($addRemote -eq "y" -or $addRemote -eq "Y") {
        $repoUrl = Read-Host "Nhập URL GitHub repository"
        if ($repoUrl) {
            git remote add origin $repoUrl
            Write-Host "✅ Đã thêm remote repository" -ForegroundColor Green
        }
    } else {
        Write-Host ""
        Write-Host "Bạn có thể thêm remote sau bằng lệnh:" -ForegroundColor Yellow
        Write-Host "  git remote add origin <your-github-repo-url>" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Sau đó chạy lại script này để push code." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "✓ Remote repository: $remote" -ForegroundColor Green
}

# Add tất cả các file
Write-Host ""
Write-Host "📝 Đang thêm các file vào staging area..." -ForegroundColor Yellow
git add .

# Kiểm tra có thay đổi không
$status = git status --porcelain
if (-not $status) {
    Write-Host "ℹ️  Không có thay đổi nào để commit" -ForegroundColor Yellow
    Write-Host "Có thể code đã được commit rồi." -ForegroundColor Yellow
    exit 0
}

# Commit
Write-Host "💾 Đang commit..." -ForegroundColor Yellow
$commitMessage = "feat: Thêm tính năng đặt tour cho khách chưa đăng nhập

- Thêm form thông tin liên hệ cho khách chưa đăng nhập
- Cập nhật model Booking để hỗ trợ guest booking
- Thêm API /bookings/guest cho khách chưa đăng nhập
- Cập nhật admin booking management để hiển thị thông tin guest
- Gửi email xác nhận đến email khách nhập
- Cập nhật UI: logo, dropdown menu tài khoản, background video
- Lọc bỏ ngày khởi hành đã qua
- Cải thiện hiển thị Bao gồm/Không bao gồm từ database"

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit thành công!" -ForegroundColor Green
    
    # Push lên GitHub
    Write-Host ""
    Write-Host "🚀 Đang push lên GitHub..." -ForegroundColor Yellow
    $branch = git branch --show-current
    if (-not $branch) {
        $branch = "main"
        git branch -M main
    }
    
    Write-Host "Branch: $branch" -ForegroundColor Cyan
    git push -u origin $branch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅✅✅ Push thành công lên GitHub! ✅✅✅" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Lỗi khi push. Có thể do:" -ForegroundColor Red
        Write-Host "  1. Chưa đăng nhập GitHub (cần Personal Access Token)" -ForegroundColor Yellow
        Write-Host "  2. Repository chưa tồn tại trên GitHub" -ForegroundColor Yellow
        Write-Host "  3. Không có quyền truy cập repository" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Thử các lệnh sau:" -ForegroundColor Cyan
        Write-Host "  git push -u origin $branch" -ForegroundColor White
    }
} else {
    Write-Host "❌ Lỗi khi commit" -ForegroundColor Red
}

Write-Host ""
Write-Host "Hoàn tất!" -ForegroundColor Cyan

