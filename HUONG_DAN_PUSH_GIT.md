# Hướng dẫn Push Code lên GitHub - Phiên bản đơn giản

## Vấn đề thường gặp
- Git repository đang ở thư mục sai
- Chưa có remote repository
- Lỗi authentication

## Giải pháp từng bước

### Bước 1: Mở PowerShell trong thư mục dự án

**Cách 1: Từ File Explorer**
1. Mở File Explorer
2. Điều hướng đến: `C:\Users\ADMIN\OneDrive\Máy tính\DACN_WeTour`
3. Click vào thanh địa chỉ, gõ `powershell` và nhấn Enter

**Cách 2: Từ PowerShell**
```powershell
cd "C:\Users\ADMIN\OneDrive\Máy tính\DACN_WeTour"
```

### Bước 2: Kiểm tra và khởi tạo Git

```powershell
# Kiểm tra xem đã có git chưa
git status

# Nếu báo lỗi "not a git repository", khởi tạo:
git init
```

### Bước 3: Thêm Remote Repository

**Nếu chưa có GitHub repository:**
1. Vào https://github.com
2. Tạo repository mới (New Repository)
3. Copy URL repository (ví dụ: `https://github.com/username/repo.git`)

**Thêm remote:**
```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

**Kiểm tra:**
```powershell
git remote -v
```

### Bước 4: Add và Commit

```powershell
# Add tất cả file
git add .

# Commit
git commit -m "feat: Them tinh nang dat tour cho khach chua dang nhap"
```

### Bước 5: Push lên GitHub

```powershell
# Tạo branch main
git branch -M main

# Push
git push -u origin main
```

## Nếu gặp lỗi Authentication

### Cách 1: Sử dụng Personal Access Token
1. Vào GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Chọn quyền: `repo`
4. Copy token
5. Khi push, dùng token thay vì password:
   - Username: GitHub username
   - Password: Personal Access Token

### Cách 2: Sử dụng GitHub CLI
```powershell
# Cài đặt GitHub CLI
winget install GitHub.cli

# Đăng nhập
gh auth login

# Push
git push -u origin main
```

### Cách 3: Sử dụng SSH
1. Tạo SSH key:
```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. Copy public key:
```powershell
cat ~/.ssh/id_ed25519.pub
```

3. Thêm vào GitHub: Settings → SSH and GPG keys → New SSH key

4. Đổi remote sang SSH:
```powershell
git remote set-url origin git@github.com:USERNAME/REPO.git
```

## Lệnh nhanh (Copy tất cả và chạy)

```powershell
# 1. Chuyển vào thư mục dự án
cd "C:\Users\ADMIN\OneDrive\Máy tính\DACN_WeTour"

# 2. Khởi tạo git (nếu chưa có)
if (-not (Test-Path .git)) { git init }

# 3. Thêm remote (THAY URL CỦA BẠN)
# git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 4. Add và commit
git add .
git commit -m "feat: Them tinh nang dat tour cho khach chua dang nhap"

# 5. Push
git branch -M main
git push -u origin main
```

## Kiểm tra kết quả

Sau khi push thành công, vào GitHub repository và kiểm tra code đã được upload chưa.

## Cần giúp đỡ?

Nếu vẫn gặp lỗi, hãy:
1. Copy toàn bộ thông báo lỗi
2. Kiểm tra:
   - Đã có GitHub repository chưa?
   - Đã đăng nhập GitHub chưa?
   - Remote URL đúng chưa?

