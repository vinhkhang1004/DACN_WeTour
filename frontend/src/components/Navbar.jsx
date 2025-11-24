import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // 🧩 Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        const menu = document.getElementById("adminMenu");
        if (menu) menu.style.display = "none";
        const userMenu = document.getElementById("userMenu");
        if (userMenu) userMenu.style.display = "none";
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .mobile-menu-btn {
              display: block !important;
            }
            .main-menu {
              display: none !important;
            }
            .main-menu.mobile-open {
              display: flex !important;
              flex-direction: column;
              width: 100%;
              gap: 8px;
              margin-top: 16px;
              padding-top: 16px;
              border-top: 1px solid rgba(255,255,255,0.2);
            }
            .user-info {
              flex-direction: column !important;
              gap: 8px !important;
              align-items: flex-start !important;
            }
          }
          @media (max-width: 480px) {
            .main-menu.mobile-open {
              gap: 4px;
            }
            .main-menu.mobile-open a {
              padding: 6px 8px !important;
              font-size: 14px !important;
            }
          }
        `}
      </style>
      <div
        style={{
          background: "#0E7490",
          color: "#fff",
          padding: "12px 0",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 16px",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = "0.9";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = "1";
              e.target.style.transform = "scale(1)";
            }}
          >
            <img
              src="/images/wetour-logo.png"
              alt="WeTour Logo"
              style={{
                height: "100px",
                width: "auto",
                objectFit: "contain",
                maxWidth: "350px",
                backgroundColor: "transparent",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
              }}
              onError={(e) => {
                // Fallback: hiển thị text nếu logo không tìm thấy
                const img = e.target;
                const parent = img.parentElement;
                if (parent) {
                  img.style.display = "none";
                  const textFallback = parent.querySelector('.logo-text-fallback');
                  if (textFallback) {
                    textFallback.style.display = "block";
                  }
                }
              }}
            />
            <span
              className="logo-text-fallback"
              style={{
                fontWeight: "bold",
                fontSize: 32,
                color: "#fff",
                display: "none",
              }}
            >
              WeTour
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: "none",
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "24px",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "4px"
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          {/* Main Menu */}
          <div 
            className={`main-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}
            style={{ 
              display: "flex", 
              gap: 24, 
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >
            <Link 
              to="/" 
              style={{ 
                color: "#fff", 
                textDecoration: "none", 
                fontWeight: 500,
                padding: "8px 12px",
                borderRadius: "6px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
            >
              🏠 Trang chủ
            </Link>
            <Link 
              to="/tours" 
              style={{ 
                color: "#fff", 
                textDecoration: "none", 
                fontWeight: 500,
                padding: "8px 12px",
                borderRadius: "6px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
            >
              🎯 Tours
            </Link>
            <Link 
              to="/destinations" 
              style={{ 
                color: "#fff", 
                textDecoration: "none", 
                fontWeight: 500,
                padding: "8px 12px",
                borderRadius: "6px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
            >
              🗺️ Điểm đến
            </Link>
            <Link 
              to="/promotions" 
              style={{ 
                color: "#fff", 
                textDecoration: "none", 
                fontWeight: 500,
                padding: "8px 12px",
                borderRadius: "6px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
            >
              🎁 Khuyến mãi
            </Link>

            <Link 
              to="/blog" 
              style={{ 
                color: "#fff", 
                textDecoration: "none", 
                fontWeight: 500,
                padding: "8px 12px",
                borderRadius: "6px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
            >
              📝 Blog
            </Link>


            {/* Nếu chưa đăng nhập */}
            {!user && (
              <>
                <Link 
                  to="/login" 
                  style={{ 
                    color: "#fff", 
                    textDecoration: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.3)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
                    e.target.style.borderColor = "rgba(255,255,255,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.borderColor = "rgba(255,255,255,0.3)";
                  }}
                >
                  Đăng nhập
                </Link>
                <Link 
                  to="/register" 
                  style={{ 
                    color: "#fff", 
                    textDecoration: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "rgba(255,255,255,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "rgba(255,255,255,0.2)";
                  }}
                >
                  Đăng ký
                </Link>
              </>
            )}

            {/* Nếu đã đăng nhập */}
            {user && (
              <>
                {/* Notification Center */}
                <NotificationCenter user={user} />

                {/* Admin Menu Dropdown - Chỉ cho admin */}
                {user?.role === "admin" && (
                  <div style={{ position: "relative" }} ref={menuRef}>
                    <button
                      style={{
                        background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
                        color: "#fff",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        padding: "8px 12px",
                        borderRadius: "6px",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-1px)";
                        e.target.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 2px 8px rgba(245, 158, 11, 0.3)";
                      }}
                      onClick={() => {
                        const menu = document.getElementById("adminMenu");
                        menu.style.display = menu.style.display === "block" ? "none" : "block";
                      }}
                    >
                      👑 Quản trị
                    </button>

                    <div
                      id="adminMenu"
                      style={{
                        display: "none",
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        background: "#fff",
                        color: "#000",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        borderRadius: "8px",
                        overflow: "hidden",
                        zIndex: 1000,
                        minWidth: "200px",
                        border: "1px solid #e2e8f0"
                      }}
                      onMouseLeave={() =>
                        (document.getElementById("adminMenu").style.display = "none")
                      }
                    >
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>👑 Admin Panel</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Quản lý hệ thống</div>
                      </div>
                      
                      
                      <Link
                        to="/admin/dashboard-pro"
                        style={{
                          display: "block",
                          padding: "12px 16px",
                          textDecoration: "none",
                          color: "#374151",
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        📊 Tổng quan
                      </Link>
                      
                      <Link
                        to="/admin/tours-pro"
                        style={{
                          display: "block",
                          padding: "12px 16px",
                          textDecoration: "none",
                          color: "#374151",
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        🎯 Quản lý Tour
                      </Link>
                      <Link
                        to="/admin/bookings"
                        style={{
                          display: "block",
                          padding: "12px 16px",
                          textDecoration: "none",
                          color: "#374151",
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        📋 Quản lý Đặt tour
                      </Link>
                      
                      <Link
                        to="/admin/users-pro"
                        style={{
                          display: "block",
                          padding: "12px 16px",
                          textDecoration: "none",
                          color: "#374151",
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        👥 Quản lý Người dùng
                      </Link>
                      
                      <Link
                        to="/admin/analytics-pro"
                        style={{
                          display: "block",
                          padding: "12px 16px",
                          textDecoration: "none",
                          color: "#374151",
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        📊 Phân tích & Báo cáo
                      </Link>
                      <Link
                        to="/admin/promotions"
                        style={{
                          display: "block",
                          padding: "12px 16px",
                          textDecoration: "none",
                          color: "#374151",
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        🎁 Quản lý khuyến mãi
                      </Link>
                      <Link
                        to="/admin/posts"
                        style={{
                          display: "block",
                          padding: "12px 16px",
                          textDecoration: "none",
                          color: "#374151",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        📝 Quản lý Blog
                      </Link>
                    </div>
                  </div>
                )}

                {/* User Account Dropdown Menu */}
                <div className="user-info" style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px" }} ref={menuRef}>
                  <button
                    onClick={() => {
                      const menu = document.getElementById("userMenu");
                      menu.style.display = menu.style.display === "block" ? "none" : "block";
                    }}
                    style={{
                      background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
                      color: "#fff",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 14,
                      padding: "8px 16px",
                      borderRadius: "8px",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 2px 8px rgba(245, 158, 11, 0.3)";
                    }}
                  >
                    👤 <strong style={{ color: "#fff" }}>{user.name}</strong> ▼
                  </button>

                  <div
                    id="userMenu"
                    style={{
                      display: "none",
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      background: "#fff",
                      color: "#000",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      borderRadius: "8px",
                      overflow: "hidden",
                      zIndex: 1000,
                      minWidth: "220px",
                      border: "1px solid #e2e8f0",
                      marginTop: "8px"
                    }}
                    onMouseLeave={() =>
                      (document.getElementById("userMenu").style.display = "none")
                    }
                  >
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>👤 Tài khoản</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{user.email}</div>
                    </div>
                    
                    <Link
                      to="/profile"
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "#374151",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      👤 Thông tin cá nhân
                    </Link>
                    
                    <Link
                      to="/ai-recommend"
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "#374151",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      🤖 AI Gợi ý
                    </Link>
                    
                    <Link
                      to="/my-bookings"
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "#374151",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      📋 Đặt tour
                    </Link>
                    
                    <Link
                      to="/wishlist"
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "#374151",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      ❤️ Yêu thích
                    </Link>
                    
                    <Link
                      to="/compare"
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "#374151",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      ⚖️ So sánh
                    </Link>
                    
                    <button
                      onClick={() => {
                        document.getElementById("userMenu").style.display = "none";
                        handleLogout();
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "12px 16px",
                        background: "transparent",
                        border: "none",
                        borderTop: "1px solid #f1f5f9",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 500,
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#fef2f2"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      🚪 Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}