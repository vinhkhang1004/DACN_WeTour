// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// thêm token tự động
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Xử lý lỗi response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token không hợp lệ hoặc hết hạn
      const currentPath = window.location.pathname;
      const requestUrl = error.config?.url || "";
      
      // Không xóa token cho các API không quan trọng (notifications, etc.)
      // Chỉ xóa token cho các API quan trọng (bookings, payments, etc.)
      const criticalAPIs = ["/bookings", "/payments", "/users/me", "/admin"];
      const isCriticalAPI = criticalAPIs.some(api => requestUrl.includes(api));
      
      // Chỉ xóa token nếu là API quan trọng hoặc không phải trang login/register
      if (isCriticalAPI || (!currentPath.includes("/login") && !currentPath.includes("/register"))) {
        // Chỉ xóa token nếu thực sự là lỗi authentication (không phải do API không yêu cầu auth)
        if (isCriticalAPI) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        // Không tự động redirect, để component xử lý
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ========== ADMIN USERS ==========
export const adminUsers = {
  list: (params) => api.get("/admin/users", { params }).then((r) => r.data),
  setRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  setStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }).then((r) => r.data),
};
