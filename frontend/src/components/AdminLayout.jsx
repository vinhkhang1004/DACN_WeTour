import React, { useContext, useState, useEffect } from "react";
import { Link, useLocation, Navigate, useNavigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export default function AdminLayout() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Fetch notifications
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchNotifications();
      // Poll for new notifications every 5 seconds
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('[data-notification-dropdown]')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await api.get("/notifications/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = (res.data || []).map(n => ({
        id: n.id,
        type: n.type || 'info',
        title: n.title,
        message: n.message,
        timestamp: new Date(n.created_at),
        read: !!n.is_read,
        metadata: n.metadata || {}
      }));
      
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await api.put(`/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === "booking") {
      navigate("/admin/bookings");
    } else if (notification.type === "hotel_booking" || notification.message?.includes("khách sạn")) {
      navigate("/admin/hotel-bookings");
    } else if (notification.type === "chat") {
      navigate("/admin/chat");
    }
    
    setShowNotifications(false);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return timestamp.toLocaleDateString('vi-VN');
  };

  const adminMenuItems = [
    {
      path: "/admin/dashboard-pro",
      label: "Tổng quan",
      icon: "📊"
    },
    {
      path: "/admin/tours-pro",
      label: "Quản lý Tour",
      icon: "🗺️"
    },
    {
      path: "/admin/bookings",
      label: "Quản lý Đặt tour",
      icon: "📅"
    },
    {
      path: "/admin/users-pro",
      label: "Quản lý Người dùng",
      icon: "👥"
    },
    {
      path: "/admin/analytics-pro",
      label: "Phân tích & Báo cáo",
      icon: "📈"
    },
    {
      path: "/admin/promotions",
      label: "Quản lý Khuyến mãi",
      icon: "💎"
    },
    {
      path: "/admin/posts",
      label: "Quản lý Blog",
      icon: "📝"
    },
    {
      path: "/admin/chat",
      label: "Quản lý Chat",
      icon: "💬"
    },
    {
      path: "/admin/custom-tours",
      label: "Tour Tự Thiết Kế",
      icon: "✓"
    },
    {
      path: "/admin/hotels",
      label: "Quản lý Khách sạn",
      icon: "🏨"
    },
    {
      path: "/admin/hotel-bookings",
      label: "Quản lý Đặt phòng KS",
      icon: "🛏️"
    },
    {
      path: "/admin/flights",
      label: "Quản lý Chuyến bay",
      icon: "✈️"
    },
    {
      path: "/admin/flight-bookings",
      label: "Quản lý Đặt vé máy bay",
      icon: "🎫"
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f9fafb" }}>
      {/* Header trên cùng */}
      <div
        style={{
          height: "70px",
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}
      >
        <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>
          WeTourAdmin
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ position: "relative" }}>
            <div
              data-notification-dropdown
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s"
              }}
              onClick={() => setShowNotifications(!showNotifications)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#d1d5db";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#e5e7eb";
              }}
            >
              🔔
              {unreadCount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </div>
              )}
            </div>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div
                data-notification-dropdown
                style={{
                  position: "absolute",
                  top: "50px",
                  right: "0",
                  width: "400px",
                  maxHeight: "500px",
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  border: "1px solid #e5e7eb",
                  zIndex: 1000,
                  overflow: "hidden"
                }}
                onClick={(e) => e.stopPropagation()}
              >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f8fafc"
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", margin: 0 }}>
                  Thông báo
                </h3>
                {unreadCount > 0 && (
                  <span style={{ 
                    fontSize: "12px", 
                    color: "#64748b",
                    background: "#e0f2fe",
                    padding: "4px 8px",
                    borderRadius: "12px"
                  }}>
                    {unreadCount} mới
                  </span>
                )}
              </div>
              
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                    Không có thông báo nào
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        background: notification.read ? "#fff" : "#f0f9ff",
                        transition: "all 0.2s"
                      }}
                      onClick={() => handleNotificationClick(notification)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = notification.read ? "#f8fafc" : "#e0f2fe";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = notification.read ? "#fff" : "#f0f9ff";
                      }}
                    >
                      <div style={{ display: "flex", gap: "12px" }}>
                        <div style={{ fontSize: "24px", flexShrink: 0 }}>
                          {notification.type === "booking" ? "📋" :
                           notification.type === "hotel_booking" ? "🏨" :
                           notification.type === "chat" ? "💬" : "🔔"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontSize: "14px", 
                            fontWeight: notification.read ? 500 : 600,
                            color: notification.read ? "#64748b" : "#1e293b",
                            marginBottom: "4px"
                          }}>
                            {notification.title}
                          </div>
                          <div style={{ 
                            fontSize: "13px", 
                            color: "#64748b",
                            marginBottom: "8px",
                            lineHeight: "1.4"
                          }}>
                            {notification.message}
                          </div>
                          <div style={{ 
                            fontSize: "11px", 
                            color: "#94a3b8"
                          }}>
                            {formatTime(notification.timestamp)}
                          </div>
                        </div>
                        {!notification.read && (
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#0E7490",
                              flexShrink: 0,
                              marginTop: "6px"
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#0E7490",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 600,
                fontSize: "16px"
              }}
            >
              {user.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                {user.name || "Administrator"}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {user.email || ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar bên trái */}
        <div
          style={{
            width: "260px",
            background: "#f3f4f6",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #e5e7eb"
          }}
        >
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
                    color: isActive ? "#0E7490" : "#64748b",
                    textDecoration: "none",
                    background: isActive ? "#e0f2fe" : "transparent",
                    transition: "all 0.2s",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: "14px"
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "#f8fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ fontSize: "18px" }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid #e5e7eb",
              background: "#fff"
            }}
          >
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "10px",
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
            minHeight: "calc(100vh - 70px)",
            background: "#f9fafb",
            overflowY: "auto"
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}

