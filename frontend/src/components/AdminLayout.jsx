import React, { useContext } from "react";
import { Link, useLocation, Navigate, useNavigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Kiểm tra quyền admin
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const adminMenuItems = [
    {
      path: "/admin/dashboard-pro",
      label: "Tổng quan"
    },
    {
      path: "/admin/tours-pro",
      label: "Quản lý Tour"
    },
    {
      path: "/admin/bookings",
      label: "Quản lý Đặt tour"
    },
    {
      path: "/admin/users-pro",
      label: "Quản lý Người dùng"
    },
    {
      path: "/admin/analytics-pro",
      label: "Phân tích & Báo cáo"
    },
    {
      path: "/admin/promotions",
      label: "Quản lý Khuyến mãi"
    },
    {
      path: "/admin/posts",
      label: "Quản lý Blog"
    }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Sidebar bên trái - Chỉ có chức năng admin */}
      <div
        style={{
          width: "260px",
          background: "#1e293b",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
          zIndex: 1000,
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)"
        }}
      >
        {/* Logo/Header */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            background: "#0f172a"
          }}
        >
          <Link
            to="/admin/dashboard-pro"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontSize: "24px",
              fontWeight: "bold"
            }}
          >
            Admin Panel
          </Link>
        </div>

        {/* User Info */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            background: "#0f172a"
          }}
        >
          <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}>
            Xin chào,
          </div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "#FFD700" }}>
            {user.name}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
            {user.email}
          </div>
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
          {adminMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 20px",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.8)",
                  textDecoration: "none",
                  background: isActive ? "#0E7490" : "transparent",
                  borderLeft: isActive ? "4px solid #0ea5e9" : "4px solid transparent",
                  transition: "all 0.2s",
                  fontWeight: isActive ? 600 : 500
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            background: "#0f172a"
          }}
        >
          <Link
            to="/"
            style={{
              display: "block",
              padding: "12px",
              color: "rgba(255,255,255,0.8)",
              textDecoration: "none",
              borderRadius: "6px",
              marginBottom: "8px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Về trang chủ
          </Link>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "12px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ef4444";
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          marginLeft: "260px",
          minHeight: "100vh",
          background: "#f8fafc"
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}

