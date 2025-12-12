import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function UserProfile() {
  const { showError, showWarning, showSuccess } = useToast();
  const { user, login, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [activeNav, setActiveNav] = useState("overview");
  const fileInputRef = useRef(null);
  
  // Data states
  const [notifications, setNotifications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [flightBookings, setFlightBookings] = useState([]);
  const [customTours, setCustomTours] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: ""
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUniqueId, setAvatarUniqueId] = useState(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch profile
      const profileRes = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({
        name: profileRes.data.name || "",
        email: profileRes.data.email || "",
        phone: profileRes.data.phone || "",
        address: profileRes.data.address || "",
        dateOfBirth: profileRes.data.date_of_birth || profileRes.data.dateOfBirth || "",
        gender: profileRes.data.gender || ""
      });
      
      // Load avatar if exists
      if (profileRes.data.avatar) {
        setAvatarPreview(profileRes.data.avatar);
        // Tạo unique ID để tránh cache
        setAvatarUniqueId(`${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
      } else {
        // Use user initial as default
        setAvatarPreview(null);
        setAvatarUniqueId(null);
      }

      // Fetch notifications
      try {
        const notifRes = await api.get("/notifications/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const notifData = (notifRes.data || []).map(n => ({
          id: n.id,
          type: n.type || 'info',
          title: n.title,
          message: n.message,
          timestamp: new Date(n.created_at),
          read: !!n.is_read,
        }));
        setNotifications(notifData);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }

      // Fetch bookings
      try {
        const bookingsRes = await api.get("/bookings/my", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(bookingsRes.data || []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }

      // Fetch hotel bookings
      try {
        const hotelRes = await api.get("/hotels/bookings/my", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHotelBookings(hotelRes.data || []);
      } catch (err) {
        console.error("Error fetching hotel bookings:", err);
      }

      // Fetch flight bookings
      try {
        const flightRes = await api.get("/flights/bookings/my", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFlightBookings(flightRes.data || []);
      } catch (err) {
        console.error("Error fetching flight bookings:", err);
      }

      // Fetch custom tours
      try {
        const customRes = await api.get("/custom-tours/my-tours", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const approvedTours = (customRes.data || []).filter(tour => 
          tour.status === "approved" || tour.status === "paid" || tour.status === "completed"
        );
        setCustomTours(approvedTours);
      } catch (err) {
        console.error("Error fetching custom tours:", err);
      }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showWarning("Kích thước file không được vượt quá 5MB");
        return;
      }
      if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
        showWarning("Chỉ chấp nhận file PNG hoặc JPG");
        return;
      }
      
      // Resize và compress ảnh trước khi hiển thị
      const reader = new FileReader();
      reader.onloadend = (event) => {
        const img = new Image();
        img.onload = () => {
          // Tạo canvas để resize
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          // Tính toán kích thước mới
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert sang base64 với chất lượng 0.8 (compress)
          // Thêm timestamp để đảm bảo mỗi ảnh có identifier unique, tránh cache
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          // Thêm metadata vào data URL để đảm bảo unique (không ảnh hưởng đến hiển thị)
          // Sử dụng timestamp và random để tạo unique identifier
          const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          // Lưu uniqueId vào state để sử dụng sau
          setAvatarPreview(compressedBase64);
          // Lưu uniqueId vào một state riêng để dùng khi cần
          setAvatarUniqueId(uniqueId);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null
      };
      
      // If avatar was changed, include it
      if (avatarPreview && avatarPreview.startsWith('data:')) {
        updateData.avatar = avatarPreview;
      }
      
      const response = await api.put("/users/me", updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Determine the final avatar value
      let finalAvatar = null;
      if (response.data.user?.avatar) {
        // Use avatar from server response (preferred)
        finalAvatar = response.data.user.avatar;
      } else if (avatarPreview && avatarPreview.startsWith('data:')) {
        // Use the base64 preview if server didn't return one
        finalAvatar = avatarPreview;
      }
      
      // Update avatarPreview state
      if (finalAvatar) {
        setAvatarPreview(finalAvatar);
        // Tạo unique ID mới khi avatar được cập nhật
        setAvatarUniqueId(`${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
      }
      
      // Update localStorage and AuthContext
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { 
        ...userData, 
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        avatar: finalAvatar || userData.avatar // Keep old avatar if no new one
      };
      
      // Save to localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Update AuthContext - use both login and updateUser to ensure sync
      updateUser(updatedUser);
      login({ token, user: updatedUser });
      
      // Force a small delay to ensure state updates propagate
      setTimeout(() => {
        window.dispatchEvent(new Event('userUpdated'));
      }, 100);
      
      showSuccess(response.data.message || "Cập nhật thông tin thành công!");
    } catch (error) {
      showError(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showWarning("Mật khẩu mới không khớp!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showWarning("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await api.put("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showSuccess(response.data.message || "Đổi mật khẩu thành công!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      showError(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.put("/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(days / 7);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return `${weeks} tuần trước`;
  };

  const getNotificationIcon = (type) => {
    const icons = {
      booking: '✈️',
      promotion: '🏷️',
      reminder: '📅',
      update: '🔄',
      success: '✅',
      warning: '⚠️',
      info: 'ℹ️',
      flight: '✈️',
      hotel: '🏨'
    };
    return icons[type] || '📢';
  };

  // Get upcoming trips (future dates)
  const getUpcomingTrips = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const trips = [];
    
    // Regular tours
    bookings.forEach(booking => {
      if (booking.status !== 'cancelled' && booking.Tour) {
        const bookingDate = new Date(booking.booking_date);
        if (bookingDate >= today) {
          trips.push({
            id: booking.id,
            type: 'tour',
            title: booking.Tour.name || booking.Tour.destination,
            startDate: booking.booking_date,
            endDate: booking.booking_date,
            status: booking.status === 'paid' || booking.status === 'completed' ? 'confirmed' : 'pending',
            image: booking.Tour.image
          });
        }
      }
    });

    // Hotel bookings
    hotelBookings.forEach(booking => {
      if (booking.status !== 'cancelled') {
        const checkIn = new Date(booking.check_in_date);
        if (checkIn >= today) {
          trips.push({
            id: booking.id,
            type: 'hotel',
            title: booking.Hotel?.name || 'Khách sạn',
            startDate: booking.check_in_date,
            endDate: booking.check_out_date,
            status: booking.status === 'confirmed' || booking.status === 'completed' ? 'confirmed' : 'pending',
            image: booking.Hotel?.image
          });
        }
      }
    });

    // Custom tours
    customTours.forEach(tour => {
      const startDate = new Date(tour.start_date);
      if (startDate >= today) {
        trips.push({
          id: tour.id,
          type: 'custom',
          title: tour.destination,
          startDate: tour.start_date,
          endDate: tour.end_date,
          status: tour.status === 'paid' || tour.status === 'completed' ? 'confirmed' : 'pending'
        });
      }
    });

    return trips.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 2);
  };

  // Get booking history
  const getBookingHistory = () => {
    const history = [];
    
    bookings.forEach(booking => {
      history.push({
        id: booking.id,
        type: 'tour',
        typeLabel: 'Tour',
        details: booking.Tour?.name || 'Tour',
        date: booking.booking_date,
        status: booking.status === 'completed' ? 'completed' : booking.status === 'cancelled' ? 'cancelled' : 'pending'
      });
    });

    hotelBookings.forEach(booking => {
      history.push({
        id: booking.id,
        type: 'hotel',
        typeLabel: 'Khách sạn',
        details: booking.Hotel?.name || 'Khách sạn',
        date: booking.check_in_date,
        status: booking.status === 'completed' ? 'completed' : booking.status === 'cancelled' ? 'cancelled' : 'pending'
      });
    });

    flightBookings.forEach(booking => {
      history.push({
        id: booking.id,
        type: 'flight',
        typeLabel: 'Chuyến bay',
        details: booking.OutboundFlight 
          ? `${booking.OutboundFlight.origin} → ${booking.OutboundFlight.destination}`
          : 'Chuyến bay',
        date: booking.OutboundFlight?.departure_date || booking.created_at,
        status: booking.status === 'completed' ? 'completed' : booking.status === 'cancelled' ? 'cancelled' : 'pending'
      });
    });

    return history.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatDateRange = (start, end) => {
    if (!start) return '';
    try {
      const startDate = new Date(start);
      const endDate = end ? new Date(end) : null;
      const startStr = startDate.toLocaleDateString('vi-VN', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      if (endDate) {
        const endStr = endDate.toLocaleDateString('vi-VN', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        return `${startStr} - ${endStr}`;
      }
      return startStr;
    } catch (e) {
      return start;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const upcomingTrips = getUpcomingTrips();
  const bookingHistory = getBookingHistory();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f8fafc",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Main Content */}
      <div style={{
        flex: 1,
        display: "flex",
        maxWidth: 1400,
        margin: "0 auto",
        width: "100%",
        padding: "24px"
      }}>
        {/* Left Sidebar */}
        <aside style={{
          width: "280px",
          background: "#fff",
          borderRadius: "16px",
          padding: "24px",
          height: "fit-content",
          position: "sticky",
          top: "100px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginRight: "24px"
        }}>
          {/* User Profile Section */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingBottom: "24px",
            borderBottom: "1px solid #e5e7eb",
            marginBottom: "24px"
          }}>
            <div style={{ position: "relative" }}>
              {avatarPreview && avatarPreview.startsWith('data:') ? (
                <img
                  key={avatarUniqueId || `avatar-sidebar-${Date.now()}`}
                  src={avatarPreview}
                  alt="Avatar"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #e5e7eb",
                    marginBottom: "16px"
                  }}
                />
              ) : avatarPreview ? (
                <img
                  key={`avatar-sidebar-url-${avatarUniqueId || Date.now()}`}
                  src={`${avatarPreview}${avatarPreview.includes('?') ? '&' : '?'}v=${avatarUniqueId || Date.now()}`}
                  alt="Avatar"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #e5e7eb",
                    marginBottom: "16px"
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#0E7490",
                  display: avatarPreview && avatarPreview.startsWith('data:') ? "none" : avatarPreview ? "none" : "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "32px",
                  marginBottom: "16px",
                  border: "2px solid #e5e7eb"
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            </div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
              {user?.name || "Người dùng"}
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
              {user?.email || ""}
            </p>
          </div>

          {/* Navigation Menu */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {activeNav === "settings" ? (
              // Settings submenu
              [
                { id: "edit-profile", label: "Chỉnh sửa Hồ sơ", icon: "👤", submenu: true },
                { id: "security", label: "Bảo mật tài khoản", icon: "🛡️", submenu: true },
                { id: "settings-notifications", label: "Thông báo", icon: "🔔", submenu: true, badge: unreadCount }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "edit-profile") {
                      setActiveTab("info");
                    } else if (item.id === "security") {
                      setActiveTab("password");
                    } else if (item.id === "settings-notifications") {
                      setActiveNav("notifications");
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    background: (item.id === "edit-profile" && activeTab === "info") || (item.id === "security" && activeTab === "password") ? "#e0f2fe" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    color: (item.id === "edit-profile" && activeTab === "info") || (item.id === "security" && activeTab === "password") ? "#0E7490" : "#64748b",
                    fontSize: "16px",
                    fontWeight: (item.id === "edit-profile" && activeTab === "info") || (item.id === "security" && activeTab === "password") ? 600 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    if (!((item.id === "edit-profile" && activeTab === "info") || (item.id === "security" && activeTab === "password"))) {
                      e.currentTarget.style.background = "#f8fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!((item.id === "edit-profile" && activeTab === "info") || (item.id === "security" && activeTab === "password"))) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{item.icon}</span>
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <span style={{
                      marginLeft: "auto",
                      background: "#0E7490",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600
                    }}>
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </button>
              ))
            ) : (
              // Main menu
              [
                { id: "overview", label: "Tổng quan", icon: "📊", path: null },
                { id: "upcoming", label: "Chuyến đi sắp tới", icon: "✈️", path: "/my-bookings" },
                { id: "history", label: "Lịch sử đặt chỗ", icon: "🕐", path: "/my-bookings" },
                { id: "notifications", label: "Thông báo", icon: "🔔", path: null, badge: unreadCount },
                { id: "settings", label: "Cài đặt tài khoản", icon: "⚙️", path: null }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.path) {
                      navigate(item.path);
                    } else {
                      setActiveNav(item.id);
                      if (item.id === "settings") {
                        setActiveTab("info");
                      }
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    background: activeNav === item.id ? "#e0f2fe" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    color: activeNav === item.id ? "#0E7490" : "#64748b",
                    fontSize: "16px",
                    fontWeight: activeNav === item.id ? 600 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    if (activeNav !== item.id) {
                      e.currentTarget.style.background = "#f8fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeNav !== item.id) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{item.icon}</span>
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <span style={{
                      marginLeft: "auto",
                      background: "#0E7490",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600
                    }}>
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </button>
              ))
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1 }}>
          {activeNav === "overview" && (
            <div>
              {/* Welcome Section */}
              <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px", color: "#1e293b" }}>
                  Chào mừng trở lại, {user?.name || "Người dùng"}!
                </h1>
                <p style={{ fontSize: "16px", color: "#64748b" }}>
                  Bạn có {upcomingTrips.length} chuyến đi sắp tới. Chúc bạn có một hành trình tuyệt vời!
                </p>
              </div>

              {/* Notifications Section */}
              <div style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "32px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px"
                }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1e293b", margin: 0 }}>
                    Thông báo
                  </h2>
                  <div style={{ display: "flex", gap: "16px" }}>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#0E7490",
                          fontSize: "14px",
                          cursor: "pointer",
                          fontWeight: 500
                        }}
                      >
                        Đánh dấu tất cả là đã đọc
                      </button>
                    )}
                    <button
                      onClick={() => setActiveNav("notifications")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0E7490",
                        fontSize: "14px",
                        cursor: "pointer",
                        fontWeight: 500
                      }}
                    >
                      Xem tất cả
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {notifications.slice(0, 4).map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        display: "flex",
                        gap: "16px",
                        padding: "16px",
                        background: notif.read ? "#fff" : "#f0f9ff",
                        borderRadius: "8px",
                        border: notif.read ? "1px solid #e5e7eb" : "1px solid #e0f2fe",
                        position: "relative"
                      }}
                    >
                      <div style={{ fontSize: "24px" }}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: "14px", color: "#64748b" }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
                          {formatTime(notif.timestamp)}
                        </div>
                      </div>
                      {!notif.read && (
                        <div style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#0E7490",
                          position: "absolute",
                          top: "16px",
                          right: "16px"
                        }} />
                      )}
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
                      Không có thông báo nào
                    </p>
                  )}
                </div>
              </div>

              {/* Upcoming Trips Section */}
              <div style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "32px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1e293b", marginBottom: "20px" }}>
                  Chuyến đi sắp tới của bạn
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
                  {upcomingTrips.length > 0 ? upcomingTrips.map((trip) => (
                    <div
                      key={`${trip.type}-${trip.id}`}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "#fff"
                      }}
                    >
                      {trip.image && (
                        <img
                          src={trip.image}
                          alt={trip.title}
                          style={{
                            width: "100%",
                            height: "160px",
                            objectFit: "cover"
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      <div style={{ padding: "16px" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "12px"
                        }}>
                          {trip.status === "confirmed" && (
                            <span style={{ fontSize: "16px" }}>✅</span>
                          )}
                          <span style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: trip.status === "confirmed" ? "#059669" : "#d97706",
                            background: trip.status === "confirmed" ? "#d1fae5" : "#fef3c7",
                            padding: "4px 8px",
                            borderRadius: "4px"
                          }}>
                            {trip.status === "confirmed" ? "Đã xác nhận" : "Chờ xác nhận"}
                          </span>
                        </div>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
                          {trip.title}
                        </h3>
                        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                          {formatDateRange(trip.startDate, trip.endDate)}
                        </p>
                        <button
                          onClick={() => navigate("/my-bookings")}
                          style={{
                            width: "100%",
                            padding: "10px",
                            background: "#0E7490",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "40px",
                      color: "#64748b"
                    }}>
                      Bạn chưa có chuyến đi sắp tới nào
                    </div>
                  )}
                </div>
              </div>

              {/* Booking History Section */}
              <div style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1e293b", marginBottom: "20px" }}>
                  Lịch sử đặt chỗ
                </h2>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse"
                }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: "#64748b" }}>
                        LOẠI
                      </th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: "#64748b" }}>
                        CHI TIẾT
                      </th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: "#64748b" }}>
                        NGÀY
                      </th>
                      <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: "#64748b" }}>
                        TRẠNG THÁI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingHistory.length > 0 ? bookingHistory.map((item) => (
                      <tr key={`${item.type}-${item.id}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "14px",
                            color: "#1e293b"
                          }}>
                            {item.type === "tour" && "🏞️"}
                            {item.type === "hotel" && "🏨"}
                            {item.type === "flight" && "✈️"}
                            {item.typeLabel}
                          </span>
                        </td>
                        <td style={{ padding: "12px", fontSize: "14px", color: "#1e293b" }}>
                          {item.details}
                        </td>
                        <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>
                          {formatDate(item.date)}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background: item.status === "completed" ? "#dbeafe" : item.status === "cancelled" ? "#fee2e2" : "#fef3c7",
                            color: item.status === "completed" ? "#0E7490" : item.status === "cancelled" ? "#dc2626" : "#d97706"
                          }}>
                            {item.status === "completed" ? "Hoàn thành" : item.status === "cancelled" ? "Đã hủy" : "Đang xử lý"}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                          Chưa có lịch sử đặt chỗ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeNav === "notifications" && (
            <div>
              <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "24px", color: "#1e293b" }}>
                Thông báo
              </h1>
              <div style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                {notifications.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        style={{
                          display: "flex",
                          gap: "16px",
                          padding: "16px",
                          background: notif.read ? "#fff" : "#f0f9ff",
                          borderRadius: "8px",
                          border: notif.read ? "1px solid #e5e7eb" : "1px solid #e0f2fe"
                        }}
                      >
                        <div style={{ fontSize: "24px" }}>
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                            {notif.title}
                          </div>
                          <div style={{ fontSize: "14px", color: "#64748b" }}>
                            {notif.message}
                          </div>
                          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
                            {formatTime(notif.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                    Không có thông báo nào
                  </p>
                )}
              </div>
            </div>
          )}

          {activeNav === "settings" && (
            <div>
              {activeTab === "info" && (
                <div>
                  <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "32px", color: "#1e293b" }}>
                    Chỉnh sửa Hồ sơ
                  </h1>

                  <form onSubmit={handleUpdateProfile} style={{ background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                    {/* Profile Picture Section */}
                    <div style={{ marginBottom: "40px", display: "flex", alignItems: "center", gap: "24px" }}>
                      <div style={{ position: "relative" }}>
                        {avatarPreview && avatarPreview.startsWith('data:') ? (
                          <img
                            key={avatarUniqueId || `avatar-${Date.now()}`}
                            src={avatarPreview}
                            alt="Avatar"
                            style={{
                              width: "120px",
                              height: "120px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "3px solid #e5e7eb"
                            }}
                          />
                        ) : avatarPreview ? (
                          <img
                            key={`avatar-url-${avatarUniqueId || Date.now()}`}
                            src={`${avatarPreview}${avatarPreview.includes('?') ? '&' : '?'}v=${avatarUniqueId || Date.now()}`}
                            alt="Avatar"
                            style={{
                              width: "120px",
                              height: "120px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "3px solid #e5e7eb"
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            width: "120px",
                            height: "120px",
                            borderRadius: "50%",
                            background: "#fbbf24",
                            display: avatarPreview && avatarPreview.startsWith('data:') ? "none" : avatarPreview ? "none" : "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: "48px",
                            border: "3px solid #e5e7eb"
                          }}
                        >
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
                          Ảnh đại diện
                        </h3>
                        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                          PNG hoặc JPG, không quá 5MB.
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleAvatarChange}
                          style={{ display: "none" }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            padding: "10px 20px",
                            background: "#0E7490",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Thay đổi ảnh đại diện
                        </button>
                      </div>
                    </div>

                    {/* Personal Information Section */}
                    <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1e293b", marginBottom: "24px" }}>
                      Thông tin cá nhân
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                      {/* Left Column */}
                      <div>
                        <div style={{ marginBottom: 24 }}>
                          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                            Họ và tên *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{
                              width: "100%",
                              padding: 12,
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              fontSize: 16,
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                            Số điện thoại
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+84 123 456 789"
                            style={{
                              width: "100%",
                              padding: 12,
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              fontSize: 16,
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                            Ngày sinh
                          </label>
                          <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            style={{
                              width: "100%",
                              padding: 12,
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              fontSize: 16,
                              boxSizing: "border-box"
                            }}
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div>
                        <div style={{ marginBottom: 24 }}>
                          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            disabled
                            style={{
                              width: "100%",
                              padding: 12,
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              fontSize: 16,
                              background: "#f8fafc",
                              color: "#64748b",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                            Địa chỉ
                          </label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 Đường ABC, Phường X, Quận Y, TP. Z"
                            style={{
                              width: "100%",
                              padding: 12,
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              fontSize: 16,
                              boxSizing: "border-box"
                            }}
                          />
                        </div>

                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            name: user?.name || "",
                            email: user?.email || "",
                            phone: formData.phone || "",
                            address: formData.address || "",
                            dateOfBirth: formData.dateOfBirth || "",
                          });
                          setAvatarPreview(user?.avatar || null);
                          setAvatarUniqueId(user?.avatar ? `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` : null);
                        }}
                        style={{
                          padding: "12px 24px",
                          background: "#f8fafc",
                          color: "#64748b",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          fontSize: 16,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{
                          padding: "12px 24px",
                          background: saving ? "#94a3b8" : "#0E7490",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 16,
                          fontWeight: 600,
                          cursor: saving ? "not-allowed" : "pointer"
                        }}
                      >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "password" && (
                <div>
                  <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "32px", color: "#1e293b" }}>
                    Bảo mật tài khoản
                  </h1>

                  <form onSubmit={handleChangePassword} style={{ background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                        Mật khẩu hiện tại *
                      </label>
                      <input
                        type="password"
                        required
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        style={{
                          width: "100%",
                          padding: 12,
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          fontSize: 16,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                        Mật khẩu mới *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        style={{
                          width: "100%",
                          padding: 12,
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          fontSize: 16,
                          boxSizing: "border-box"
                        }}
                      />
                      <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        Tối thiểu 6 ký tự
                      </p>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                        Xác nhận mật khẩu mới *
                      </label>
                      <input
                        type="password"
                        required
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        style={{
                          width: "100%",
                          padding: 12,
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          fontSize: 16,
                          boxSizing: "border-box"
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: ""
                          });
                        }}
                        style={{
                          padding: "12px 24px",
                          background: "#f8fafc",
                          color: "#64748b",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          fontSize: 16,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{
                          padding: "12px 24px",
                          background: saving ? "#94a3b8" : "#0E7490",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 16,
                          fontWeight: 600,
                          cursor: saving ? "not-allowed" : "pointer"
                        }}
                      >
                        {saving ? "Đang xử lý..." : "Lưu thay đổi"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
