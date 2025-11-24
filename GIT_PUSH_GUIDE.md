# Hướng dẫn Push Code lên GitHub

## Bước 1: Mở Terminal/Command Prompt trong thư mục dự án

Mở PowerShell hoặc Command Prompt và di chuyển đến thư mục dự án:
```powershell
cd "C:\Users\ADMIN\OneDrive\Máy tính\DACN_WeTour"
```

## Bước 2: Kiểm tra Git Repository

```bash
git status
```

Nếu chưa có git repository, khởi tạo:
```bash
git init
```

## Bước 3: Thêm Remote Repository (nếu chưa có)

Nếu chưa có remote repository, thêm GitHub repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

Thay `YOUR_USERNAME` và `YOUR_REPO_NAME` bằng thông tin repository của bạn.

Kiểm tra remote:
```bash
git remote -v
```

## Bước 4: Add và Commit các thay đổi

```bash
# Add tất cả các file
git add .

# Commit với message mô tả
git commit -m "feat: Thêm tính năng đặt tour cho khách chưa đăng nhập

- Thêm form thông tin liên hệ cho khách chưa đăng nhập
- Cập nhật model Booking để hỗ trợ guest booking
- Thêm API /bookings/guest cho khách chưa đăng nhập
- Cập nhật admin booking management để hiển thị thông tin guest
- Gửi email xác nhận đến email khách nhập
- Cập nhật UI: logo, dropdown menu tài khoản, background video
- Lọc bỏ ngày khởi hành đã qua
- Cải thiện hiển thị Bao gồm/Không bao gồm từ database"
```

## Bước 5: Push lên GitHub

```bash
# Push lên branch main (hoặc master)
git branch -M main
git push -u origin main
```

Nếu đã có branch, chỉ cần:
```bash
git push -u origin main
```

## Sử dụng Script Tự động

Bạn cũng có thể sử dụng script PowerShell đã tạo:

```powershell
.\git_push.ps1
```

Script sẽ tự động:
- Kiểm tra git repository
- Thêm remote nếu chưa có
- Add và commit các thay đổi
- Push lên GitHub

## Lưu ý

1. **Nếu chưa có GitHub repository:**
   - Tạo repository mới trên GitHub
   - Copy URL repository
   - Thêm remote bằng lệnh ở Bước 3

2. **Nếu gặp lỗi authentication:**
   - Sử dụng Personal Access Token thay vì password
   - Hoặc cấu hình SSH key

3. **Nếu có conflict:**
   - Pull code mới nhất trước: `git pull origin main`
   - Giải quyết conflict
   - Commit và push lại

## Các file đã thay đổi chính

- `backend/src/models/Booking.js` - Thêm guest fields
- `backend/src/routes/bookingRoutes.js` - Thêm API guest booking
- `frontend/src/pages/TourDetailEnhanced.jsx` - Thêm form guest
- `frontend/src/pages/TourDetail.jsx` - Thêm form guest
- `frontend/src/pages/AdminBookings.jsx` - Hiển thị guest info
- `frontend/src/pages/AdminManage.jsx` - Hiển thị guest info
- `database/migration_add_guest_booking.sql` - Migration script
- Và nhiều file khác...

