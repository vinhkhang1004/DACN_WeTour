# PowerShell script to run migration_add_notes.sql
# Usage: .\run_migration.ps1

Write-Host "🚀 Đang chạy migration để thêm cột notes vào bảng bookings..." -ForegroundColor Cyan

# Common MySQL paths on Windows
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
    "mysql.exe"  # If in PATH
)

$mysqlExe = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlExe = $path
        Write-Host "✅ Tìm thấy MySQL tại: $mysqlExe" -ForegroundColor Green
        break
    }
}

if (-not $mysqlExe) {
    Write-Host "❌ Không tìm thấy MySQL. Vui lòng:" -ForegroundColor Red
    Write-Host "   1. Cài đặt MySQL hoặc XAMPP/WAMP" -ForegroundColor Yellow
    Write-Host "   2. Thêm MySQL vào PATH" -ForegroundColor Yellow
    Write-Host "   3. Hoặc chạy thủ công bằng MySQL Workbench/phpMyAdmin" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 SQL cần chạy:" -ForegroundColor Cyan
    Get-Content "migration_add_notes.sql"
    exit 1
}

# Read password securely
$password = Read-Host "Nhập mật khẩu MySQL root" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

# Run migration
$sqlFile = Join-Path $PSScriptRoot "migration_add_notes.sql"
$sqlContent = Get-Content $sqlFile -Raw

try {
    $result = & $mysqlExe -u root -p$passwordPlain travel_db -e $sqlContent
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration thành công! Cột 'notes' đã được thêm vào bảng bookings." -ForegroundColor Green
    } else {
        Write-Host "⚠️ Có thể cột đã tồn tại hoặc có lỗi. Kiểm tra kết quả ở trên." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Lỗi khi chạy migration: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Bạn có thể chạy thủ công bằng MySQL Workbench hoặc phpMyAdmin:" -ForegroundColor Cyan
    Write-Host "   - Mở MySQL Workbench/phpMyAdmin" -ForegroundColor Yellow
    Write-Host "   - Chọn database 'travel_db'" -ForegroundColor Yellow
    Write-Host "   - Chạy nội dung file migration_add_notes.sql" -ForegroundColor Yellow
}

