# Hướng Dẫn Deploy Backend WeTour

Tài liệu này hướng dẫn cách deploy backend lên các nền tảng khác nhau.

## 📋 Mục Lục

1. [Deploy lên Vercel (Serverless)](#vercel)
2. [Deploy lên Railway](#railway)
3. [Deploy lên Render](#render)
4. [Deploy lên Fly.io](#flyio)
5. [Cấu hình Environment Variables](#env-vars)
6. [Cấu hình Database](#database)

---

## 🚀 Deploy lên Vercel (Serverless)

### Ưu điểm:
- ✅ Miễn phí cho hầu hết use cases
- ✅ Auto-scaling
- ✅ CDN tích hợp
- ✅ Hỗ trợ Cron Jobs

### Nhược điểm:
- ⚠️ Cold start có thể chậm
- ⚠️ Function timeout (30s default, có thể tăng lên 60s với Pro)
- ⚠️ Không phù hợp cho long-running processes

### Các bước:

1. **Cài đặt Vercel CLI** (nếu chưa có):
```bash
npm i -g vercel
```

2. **Login vào Vercel**:
```bash
vercel login
```

3. **Deploy từ thư mục backend**:
```bash
cd backend
vercel
```

4. **Cấu hình Environment Variables**:
   - Vào Vercel Dashboard → Project → Settings → Environment Variables
   - Thêm các biến môi trường (xem phần [Environment Variables](#env-vars))

5. **Cấu hình Database**:
   - Vercel không hỗ trợ MySQL/MariaDB trực tiếp
   - Bạn cần sử dụng database hosting riêng:
     - **PlanetScale** (MySQL serverless, miễn phí)
     - **Railway** (MySQL/MariaDB)
     - **Aiven** (MySQL/MariaDB)
     - **AWS RDS** (MySQL)

6. **Cấu hình Cron Jobs**:
   - File `vercel.json` đã được cấu hình với cron job
   - Vercel sẽ tự động gọi `/api/cron/notifications` mỗi ngày lúc 9:00 AM (theo timezone Asia/Ho_Chi_Minh)

### Lưu ý quan trọng:
- Vercel Cron Jobs chỉ hoạt động với Pro plan ($20/tháng) hoặc trong Hobby plan với giới hạn
- Nếu không có Pro plan, bạn có thể dùng external cron service như:
  - [cron-job.org](https://cron-job.org) (miễn phí)
  - [EasyCron](https://www.easycron.com)
  - Gọi endpoint `/api/cron/notifications` theo lịch

---

## 🚂 Deploy lên Railway

### Ưu điểm:
- ✅ Hỗ trợ MySQL/MariaDB tích hợp
- ✅ Persistent connections (phù hợp cho cron jobs)
- ✅ Dễ cấu hình
- ✅ Miễn phí $5 credit/tháng

### Nhược điểm:
- ⚠️ Có thể tốn phí sau khi hết credit miễn phí
- ⚠️ Ít tính năng hơn Vercel

### Các bước:

1. **Tạo tài khoản Railway**:
   - Truy cập [railway.app](https://railway.app)
   - Đăng nhập bằng GitHub

2. **Tạo Project mới**:
   - Click "New Project"
   - Chọn "Deploy from GitHub repo"
   - Chọn repository của bạn

3. **Cấu hình Service**:
   - Root Directory: `backend`
   - Build Command: (không cần, Railway tự detect)
   - Start Command: `node server.js`

4. **Thêm MySQL Database**:
   - Click "New" → "Database" → "Add MySQL"
   - Railway sẽ tự động tạo database và cung cấp connection string

5. **Cấu hình Environment Variables**:
   - Railway tự động inject database variables
   - Thêm các biến khác (xem phần [Environment Variables](#env-vars))

6. **Deploy**:
   - Railway sẽ tự động deploy khi bạn push code
   - Hoặc click "Deploy" trong dashboard

---

## 🎨 Deploy lên Render

### Ưu điểm:
- ✅ Miễn phí tier (với giới hạn)
- ✅ Hỗ trợ MySQL/MariaDB
- ✅ Persistent connections
- ✅ Auto-deploy từ GitHub

### Nhược điểm:
- ⚠️ Free tier có thể sleep sau 15 phút không hoạt động
- ⚠️ Cold start khi wake up

### Các bước:

1. **Tạo tài khoản Render**:
   - Truy cập [render.com](https://render.com)
   - Đăng nhập bằng GitHub

2. **Tạo Web Service**:
   - Click "New" → "Web Service"
   - Connect GitHub repository
   - Cấu hình:
     - **Name**: `wetour-backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Root Directory**: `backend`

3. **Thêm PostgreSQL Database** (hoặc MySQL):
   - Click "New" → "PostgreSQL" (hoặc MySQL nếu có)
   - Render cung cấp connection string tự động

4. **Cấu hình Environment Variables**:
   - Thêm các biến môi trường (xem phần [Environment Variables](#env-vars))

5. **Cấu hình Cron Jobs**:
   - Render không hỗ trợ cron jobs trực tiếp trong free tier
   - Sử dụng external cron service để gọi `/api/cron/notifications`

---

## ✈️ Deploy lên Fly.io

### Ưu điểm:
- ✅ Miễn phí với giới hạn hợp lý
- ✅ Global edge deployment
- ✅ Persistent volumes
- ✅ Hỗ trợ cron jobs

### Nhược điểm:
- ⚠️ Cần cấu hình Dockerfile
- ⚠️ Learning curve cao hơn

### Các bước:

1. **Cài đặt Fly CLI**:
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

2. **Login**:
```bash
fly auth login
```

3. **Tạo Fly App**:
```bash
cd backend
fly launch
```

4. **Cấu hình fly.toml** (sẽ được tạo tự động):
```toml
app = "wetour-backend"
primary_region = "sin"  # Singapore (gần Việt Nam)

[build]

[http_service]
  internal_port = 5000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

5. **Thêm Secrets**:
```bash
fly secrets set DB_HOST=your-db-host
fly secrets set DB_NAME=your-db-name
# ... (xem phần Environment Variables)
```

6. **Deploy**:
```bash
fly deploy
```

---

## 🔐 Cấu hình Environment Variables

Dưới đây là danh sách các biến môi trường cần thiết:

### Database:
```env
DB_HOST=your-database-host
DB_PORT=3306
DB_NAME=travel_db
DB_USER=your-username
DB_PASS=your-password
```

### Server:
```env
PORT=5000  # Vercel tự động set, không cần config
NODE_ENV=production
```

### JWT Secret:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Google OAuth (nếu có):
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Gemini AI (nếu có):
```env
GEMINI_API_KEY=your-gemini-api-key
```

### Email Service (nếu có):
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Payment Gateway (nếu có):
```env
VNPAY_TMN_CODE=your-tmn-code
VNPAY_HASH_SECRET=your-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

---

## 🗄️ Cấu hình Database

### Option 1: PlanetScale (MySQL Serverless - Miễn phí)

1. Tạo tài khoản tại [planetscale.com](https://planetscale.com)
2. Tạo database mới
3. Lấy connection string từ dashboard
4. Cấu hình environment variables:
```env
DB_HOST=your-branch.psdb.cloud
DB_PORT=3306
DB_NAME=your-db-name
DB_USER=your-username
DB_PASS=your-password
```

### Option 2: Railway MySQL

1. Tạo MySQL database trong Railway
2. Railway tự động inject các biến:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`

3. Map sang các biến của app:
```env
DB_HOST=$MYSQL_HOST
DB_PORT=$MYSQL_PORT
DB_NAME=$MYSQL_DATABASE
DB_USER=$MYSQL_USER
DB_PASS=$MYSQL_PASSWORD
```

### Option 3: Aiven (MySQL/MariaDB)

1. Tạo tài khoản tại [aiven.io](https://aiven.io)
2. Tạo MySQL service
3. Lấy connection string và cấu hình tương tự

---

## 🔄 Migration Database

Sau khi deploy, bạn cần chạy migrations:

1. **SSH vào server** (nếu có quyền truy cập)
2. **Hoặc chạy migration script từ local** (với connection string production):
```bash
cd backend
DB_HOST=your-production-db-host DB_NAME=your-db-name DB_USER=your-user DB_PASS=your-pass node src/migrate.js
```

---

## ✅ Checklist Sau Khi Deploy

- [ ] Database đã được migrate
- [ ] Environment variables đã được cấu hình đầy đủ
- [ ] Health check endpoint hoạt động: `GET /api/health/db`
- [ ] Cron jobs đã được cấu hình (nếu dùng Vercel)
- [ ] CORS đã được cấu hình đúng (cho phép frontend domain)
- [ ] Frontend đã được cập nhật với API URL mới

---

## 🆘 Troubleshooting

### Lỗi Database Connection:
- Kiểm tra database host có cho phép kết nối từ IP của hosting
- Kiểm tra firewall rules
- Kiểm tra credentials

### Lỗi Timeout:
- Tăng timeout trong `vercel.json` (nếu dùng Vercel)
- Kiểm tra database connection pool settings

### Cron Jobs không chạy:
- Kiểm tra cấu hình trong `vercel.json`
- Kiểm tra logs trong Vercel dashboard
- Thử gọi endpoint `/api/cron/notifications` thủ công

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Logs trong hosting dashboard
2. Database connection
3. Environment variables
4. Network/firewall settings

