import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0); // Force re-render avatar

  // Listen for user updates
  useEffect(() => {
    const handleUserUpdate = () => {
      setAvatarKey(prev => prev + 1);
    };
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);
  
  // Also update when user changes
  useEffect(() => {
    if (user?.avatar) {
      setAvatarKey(prev => prev + 1);
    }
  }, [user?.avatar]);

  // Check if a route is active
  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

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
          background: "#fff",
          color: "#1e293b",
          padding: "12px 0",
          marginBottom: "0",
          borderBottom: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
          background: "rgba(255, 255, 255, 0.95)"
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
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "12px",
              boxShadow: "0 2px 8px rgba(14, 116, 144, 0.2)"
            }}>
              <img
                src="/images/wetour-logo.png"
                alt="WeTour"
                style={{
                  width: "32px",
                  height: "32px",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = "✈️";
                  e.target.parentElement.style.fontSize = "24px";
                }}
              />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: "26px",
                background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.5px"
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
              color: "#1e293b",
              fontSize: "24px",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "4px"
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#f1f5f9"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          {/* Main Menu */}
          <div 
            className={`main-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}
            style={{ 
              display: "flex", 
              gap: 8, 
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >
            {[
              { path: "/", label: "Trang chủ" },
              { path: "/tours", label: "Tour du lịch" },
              { path: "/hotels", label: "Khách sạn" },
              { path: "/flights", label: "Chuyến bay" },
              { path: "/custom-tour", label: "Tự Thiết Kế" },
              { path: "/blog", label: "Blog" }
            ].map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    color: active ? "#0E7490" : "#475569",
                    textDecoration: "none",
                    fontWeight: active ? 600 : 500,
                    padding: "10px 16px",
                    borderRadius: "8px",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    fontSize: "15px",
                    background: active ? "#f0f9ff" : "transparent"
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.target.style.color = "#0E7490";
                      e.target.style.backgroundColor = "#f8fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.target.style.color = "#475569";
                      e.target.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {item.label}
                  {active && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "60%",
                        height: "2px",
                        background: "#0E7490",
                        borderRadius: "2px"
                      }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Nếu chưa đăng nhập */}
            {!user && (
              <>
                <Link 
                  to="/register" 
                  style={{ 
                    color: "#0E7490", 
                    textDecoration: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    border: "1px solid #0E7490",
                    background: "transparent",
                    transition: "all 0.2s",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#f0f9ff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                  }}
                >
                  Đăng ký
                </Link>
                <Link 
                  to="/login" 
                  style={{ 
                    color: "#fff", 
                    textDecoration: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    background: "#0E7490",
                    border: "none",
                    transition: "all 0.2s",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#0891b2";
                    e.target.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#0E7490";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  Đăng nhập
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
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "0",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.querySelector('.avatar-container').style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.querySelector('.avatar-container').style.transform = "scale(1)";
                    }}
                  >
                    <div
                      className="avatar-container"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "2px solid #0E7490",
                        background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                        boxShadow: "0 2px 8px rgba(14, 116, 144, 0.2)",
                        position: "relative"
                      }}
                    >
                      {user.avatar && user.avatar.trim() ? (
                        <img
                          key={`avatar-${avatarKey}-${user.avatar?.substring(0, 50)}`} // Force re-render when avatar changes
                          src={user.avatar}
                          alt={user.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            zIndex: 1
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                            const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="avatar-fallback"
                        style={{
                          width: "100%",
                          height: "100%",
                          display: user.avatar && user.avatar.trim() ? "none" : "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "absolute",
                          top: 0,
                          left: 0,
                          zIndex: 0
                        }}
                      >
                        <span style={{
                          color: "#fff",
                          fontSize: "18px",
                          fontWeight: 600,
                          textTransform: "uppercase"
                        }}>
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </span>
                      </div>
                    </div>
                    <span style={{
                      color: "#1e293b",
                      fontWeight: 500,
                      fontSize: "15px"
                    }}>
                      {user.name}
                    </span>
                    <span style={{
                      color: "#64748b",
                      fontSize: "12px"
                    }}>
                      ▼
                    </span>
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
                      <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "16px" }}>Tài khoản</div>
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
                        transition: "background-color 0.2s",
                        fontSize: "15px",
                        fontFamily: "inherit"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      Thông tin cá nhân
                    </Link>
                    
                    <Link
                      to="/ai-recommend"
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "#374151",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s",
                        fontSize: "15px",
                        fontFamily: "inherit"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      AI Gợi ý
                    </Link>
                    
                    <Link
                      to="/my-bookings"
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "#374151",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s",
                        fontSize: "15px",
                        fontFamily: "inherit"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      Đặt tour
                    </Link>
                    
                    <Link
                      to="/promotions"
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "#374151",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s",
                        fontSize: "15px",
                        fontFamily: "inherit"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      Khuyến mãi
                    </Link>
                    
                    <Link
                      to="/wishlist"
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "#374151",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s",
                        fontSize: "15px",
                        fontFamily: "inherit"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      Yêu thích
                    </Link>
                    
                    <Link
                      to="/compare"
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "#374151",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s",
                        fontSize: "15px",
                        fontFamily: "inherit"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      So sánh
                    </Link>
                    
                    <Link
                      to="/destinations"
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "#374151",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s",
                        fontSize: "15px",
                        fontFamily: "inherit"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      Điểm đến
                    </Link>
                    
                    <Link
                      to="/contact"
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "#374151",
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s",
                        fontSize: "15px",
                        fontFamily: "inherit"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      onClick={() => document.getElementById("userMenu").style.display = "none"}
                    >
                      Liên hệ
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
                        fontSize: "15px",
                        fontWeight: 500,
                        transition: "background-color 0.2s",
                        fontFamily: "inherit"
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#fef2f2"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      Đăng xuất
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