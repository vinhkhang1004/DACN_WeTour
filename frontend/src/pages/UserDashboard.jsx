import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export default function UserDashboard() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    completedTours: 0,
    pendingBookings: 0,
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch bookings
      const bookingsRes = await api.get("/bookings/my", { headers });
      setBookings(bookingsRes.data || []);

      // Fetch wishlist from localStorage
      const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlist(savedWishlist);

      // Calculate stats
      const totalBookings = bookingsRes.data?.length || 0;
      const totalSpent = bookingsRes.data?.reduce((sum, booking) => sum + parseFloat(booking.total_price), 0) || 0;
      const completedTours = bookingsRes.data?.filter(b => b.status === "completed").length || 0;
      const pendingBookings = bookingsRes.data?.filter(b => b.status === "pending").length || 0;

      setStats({
        totalBookings,
        totalSpent,
        completedTours,
        pendingBookings,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f59e0b",
      paid: "#10b981",
      completed: "#3b82f6",
      cancelled: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "Chờ xác nhận",
      paid: "Đã thanh toán",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return texts[status] || status;
  };

  const removeFromWishlist = (tourId) => {
    const updatedWishlist = wishlist.filter(tour => tour.id !== tourId);
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 24, color: "#0E7490" }}>🔄</div>
        <p style={{ marginTop: 16, color: "#64748b" }}>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
          color: "#fff",
          padding: "40px",
          borderRadius: "16px",
          marginBottom: "32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30px",
            left: "-30px",
            width: "150px",
            height: "150px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "36px", margin: "0 0 8px", fontWeight: 700 }}>
            👋 Xin chào, {user?.name}!
          </h1>
          <p style={{ fontSize: "18px", margin: 0, opacity: 0.95 }}>
            Quản lý đặt tour và danh sách yêu thích của bạn
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
            {stats.totalBookings}
          </div>
          <div style={{ color: "#64748b", fontSize: "14px" }}>Tổng đặt tour</div>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>💰</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
            {Number(stats.totalSpent).toLocaleString()} ₫
          </div>
          <div style={{ color: "#64748b", fontSize: "14px" }}>Tổng chi tiêu</div>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
            {stats.completedTours}
          </div>
          <div style={{ color: "#64748b", fontSize: "14px" }}>Tour hoàn thành</div>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
            {stats.pendingBookings}
          </div>
          <div style={{ color: "#64748b", fontSize: "14px" }}>Chờ xác nhận</div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
          <button
            onClick={() => setActiveTab("bookings")}
            style={{
              flex: 1,
              padding: "16px 24px",
              background: activeTab === "bookings" ? "#f8fafc" : "transparent",
              border: "none",
              borderBottom: activeTab === "bookings" ? "3px solid #0E7490" : "3px solid transparent",
              color: activeTab === "bookings" ? "#0E7490" : "#64748b",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            📋 Đặt tour của tôi
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            style={{
              flex: 1,
              padding: "16px 24px",
              background: activeTab === "wishlist" ? "#f8fafc" : "transparent",
              border: "none",
              borderBottom: activeTab === "wishlist" ? "3px solid #0E7490" : "3px solid transparent",
              color: activeTab === "wishlist" ? "#0E7490" : "#64748b",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            ❤️ Danh sách yêu thích
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {activeTab === "bookings" && (
            <div>
              <h3 style={{ margin: "0 0 20px", color: "#1e293b", fontSize: "20px" }}>
                Lịch sử đặt tour
              </h3>
              {bookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                  <p>Bạn chưa có đặt tour nào</p>
                  <Link
                    to="/tours"
                    style={{
                      display: "inline-block",
                      marginTop: "16px",
                      padding: "12px 24px",
                      background: "#0E7490",
                      color: "#fff",
                      textDecoration: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Khám phá tours →
                  </Link>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "20px",
                        background: "#fff",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                        e.currentTarget.style.borderColor = "#0E7490";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                        <div>
                          <h4 style={{ margin: "0 0 8px", fontSize: "18px", color: "#1e293b" }}>
                            {booking.Tour?.name}
                          </h4>
                          <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: "14px" }}>
                            📍 {booking.Tour?.destination}
                          </p>
                          <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: "14px" }}>
                            👥 {booking.people_count} người
                          </p>
                          <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: "14px" }}>
                            📅 {formatDate(booking.booking_date)}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              background: getStatusColor(booking.status),
                              color: "#fff",
                              fontSize: "12px",
                              fontWeight: 600,
                              marginBottom: "8px",
                            }}
                          >
                            {getStatusText(booking.status)}
                          </div>
                          <div style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
                            {Number(booking.total_price).toLocaleString()} ₫
                          </div>
                          {booking.discount_amount > 0 && (
                            <div style={{ fontSize: "12px", color: "#16a34a" }}>
                              Đã giảm: {Number(booking.discount_amount).toLocaleString()} ₫
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                        <Link
                          to={`/tour/${booking.tour_id}`}
                          style={{
                            padding: "8px 16px",
                            background: "#f8fafc",
                            color: "#0E7490",
                            textDecoration: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          Xem tour
                        </Link>
                        {booking.status === "pending" && (
                          <button
                            style={{
                              padding: "8px 16px",
                              background: "#fef2f2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              borderRadius: "6px",
                              fontSize: "14px",
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            Hủy tour
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "wishlist" && (
            <div>
              <h3 style={{ margin: "0 0 20px", color: "#1e293b", fontSize: "20px" }}>
                Danh sách yêu thích
              </h3>
              {wishlist.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>❤️</div>
                  <p>Danh sách yêu thích trống</p>
                  <Link
                    to="/tours"
                    style={{
                      display: "inline-block",
                      marginTop: "16px",
                      padding: "12px 24px",
                      background: "#0E7490",
                      color: "#fff",
                      textDecoration: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Khám phá tours →
                  </Link>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {wishlist.map((tour) => (
                    <div
                      key={tour.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "#fff",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <Link
                        to={`/tour/${tour.id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <img
                          src={tour.image || "https://via.placeholder.com/400x200?text=Tour+Image"}
                          alt={tour.name}
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x200?text=Tour+Image";
                          }}
                        />
                        <div style={{ padding: "16px" }}>
                          <h4 style={{ margin: "0 0 8px", fontSize: "16px", color: "#1e293b" }}>
                            {tour.name}
                          </h4>
                          <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: "14px" }}>
                            📍 {tour.destination}
                          </p>
                          <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: "14px" }}>
                            ⏱️ {tour.duration}
                          </p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "18px", fontWeight: 700, color: "#0E7490" }}>
                              {Number(tour.price).toLocaleString()} ₫
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                removeFromWishlist(tour.id);
                              }}
                              style={{
                                padding: "6px 12px",
                                background: "#fef2f2",
                                color: "#dc2626",
                                border: "1px solid #fecaca",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 500,
                                cursor: "pointer",
                              }}
                            >
                              ❌ Xóa
                            </button>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



