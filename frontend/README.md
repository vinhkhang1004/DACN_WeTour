# WeTour - Travel Booking Frontend

## 🚀 Chạy ứng dụng

```bash
cd d:\DACN\frontend
npm install
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

## 📂 Cấu trúc Project

```
src/
├── components/          # Components tái sử dụng
│   ├── Navbar.jsx      # Navigation bar
│   ├── Footer.jsx      # Footer
│   ├── LoadingSpinner.jsx
│   ├── NotificationCenter.jsx
│   └── ChatSupport.jsx
├── pages/               # Các trang chính
│   ├── Homepage.jsx
│   ├── TourListEnhanced.jsx
│   ├── TourDetailEnhanced.jsx
│   ├── CheckoutInfo.jsx
│   ├── CheckoutPayment.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Blog.jsx
│   ├── Promotions.jsx
│   ├── UserDashboardEnhanced.jsx
│   └── admin/           # Admin pages
│       ├── AdminDashboardPro.jsx
│       ├── AdminTourManagement.jsx
│       ├── AdminUserManagement.jsx
│       ├── AdminPromotions.jsx
│       ├── AdminPosts.jsx
│       ├── AdminTools.jsx
│       └── AdminAnalyticsPro.jsx
├── context/
│   └── AuthContext.jsx  # Authentication state
├── services/
│   └── api.js          # Axios config
└── main.jsx            # Entry point

```

## 🎯 Tính năng chính

### Customer Features
- ✅ Đăng ký/đăng nhập (Email, Google OAuth)
- ✅ Tìm kiếm và lọc tour
- ✅ Chi tiết tour với badge khuyến mãi
- ✅ Đặt tour và thanh toán
- ✅ Quản lý đặt tour
- ✅ Dashboard cá nhân
- ✅ Điểm tích lũy (iVIVUPoint)
- ✅ Thông báo real-time
- ✅ Blog/Cẩm nang du lịch
- ✅ Khuyến mãi
- ✅ Wishlist
- ✅ So sánh tour

### Admin Features
- ✅ Dashboard với thống kê
- ✅ Quản lý Tour (CRUD)
- ✅ Quản lý User
- ✅ Quản lý Booking
- ✅ Quản lý Mã khuyến mãi
- ✅ Quản lý Blog Posts
- ✅ Analytics & Reports
- ✅ Admin Tools
- ✅ Notifications management

## 🎨 Tech Stack

- **React** 18+
- **React Router** v6
- **Axios** for API calls
- **TailwindCSS** (via CDN)
- **Chart.js** for analytics
- **React Helmet** for SEO

## 🔗 Routes

### Public
- `/` - Trang chủ
- `/tours` - Danh sách tour
- `/tour/:id` - Chi tiết tour
- `/blog` - Blog
- `/promotions` - Khuyến mãi
- `/login`, `/register` - Auth

### User
- `/dashboard` - Dashboard cá nhân
- `/my-bookings` - Lịch sử đặt tour
- `/wishlist` - Danh sách yêu thích
- `/compare` - So sánh tour
- `/checkout/*` - Checkout flow

### Admin
- `/admin` → `/admin/dashboard-pro`
- `/admin/tours-pro` - Quản lý Tour
- `/admin/users-pro` - Quản lý User
- `/admin/bookings` - Quản lý Booking
- `/admin/promotions` - Quản lý Khuyến mãi
- `/admin/posts` - Quản lý Blog
- `/admin/analytics-pro` - Analytics
- `/admin/tools` - Admin Tools

## 🔐 Authentication

- JWT Token được lưu trong localStorage
- Protected routes dùng `RequireAdmin` component
- Context API cho user state

## 📦 Dependencies

Xem `package.json` để biết đầy đủ dependencies.

## 🌐 API Base URL

Default: `http://localhost:5000/api`

Config trong `src/services/api.js`

## 🐛 Development Tips

1. Backend phải chạy trước trên port 5000
2. Database MySQL phải được setup
3. Check Network tab để debug API calls
4. Sử dụng React DevTools cho state debugging

## 📝 Notes

- Responsive design cho mobile và desktop
- Loading states cho tất cả async operations
- Error handling với user-friendly messages
- Optimistic updates cho UX tốt hơn

