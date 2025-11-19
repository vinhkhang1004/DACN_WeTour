import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export default function UserDashboardEnhanced() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [comparisonTours, setComparisonTours] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    completedTours: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    wishlistCount: 0,
    reviewsCount: 0,
    averageRating: 0,
  });
  const [loyalty, setLoyalty] = useState({ points: 0, tier: "Member", transactions: [] });

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
      const savedWishlist = JSON.parse(localStorage.getItem(`wishlist_${user.id}`) || "[]");
      setWishlist(savedWishlist);

      // Fetch comparison tours from localStorage
      const savedComparison = JSON.parse(localStorage.getItem("comparisonTours") || "[]");
      setComparisonTours(savedComparison);

      // Fetch user reviews
      try {
        const reviewsRes = await api.get(`/reviews/user/${user.id}`, { headers });
        setReviews(reviewsRes.data || []);
      } catch (error) {
        console.log("No reviews found");
        setReviews([]);
      }

      // Calculate stats
      const totalBookings = bookingsRes.data?.length || 0;
      const totalSpent = bookingsRes.data?.reduce((sum, booking) => sum + parseFloat(booking.total_price), 0) || 0;
      const completedTours = bookingsRes.data?.filter(b => b.status === "completed").length || 0;
      const pendingBookings = bookingsRes.data?.filter(b => b.status === "pending").length || 0;
      const cancelledBookings = bookingsRes.data?.filter(b => b.status === "cancelled").length || 0;
      const wishlistCount = savedWishlist.length;
      const reviewsCount = reviews.length;
      const averageRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

      setStats({
        totalBookings,
        totalSpent,
        completedTours,
        pendingBookings,
        cancelledBookings,
        wishlistCount,
        reviewsCount,
        averageRating,
      });

      // Fetch loyalty info
      try {
        const loyaltyRes = await api.get("/loyalty/me", { headers });
        setLoyalty({
          points: loyaltyRes.data?.user?.loyaltyPoints || 0,
          tier: loyaltyRes.data?.user?.loyaltyTier || "Member",
          transactions: loyaltyRes.data?.transactions || [],
        });
      } catch (e) {
        setLoyalty({ points: 0, tier: "Member", transactions: [] });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đặt tour này?")) return;

    try {
      const token = localStorage.getItem("token");
      await api.put(`/bookings/${bookingId}/cancel`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      // Refresh bookings
      const bookingsRes = await api.get("/bookings/my", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setBookings(bookingsRes.data || []);
      
      alert("Đã hủy đặt tour thành công!");
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi hủy đặt tour");
    }
  };

  const removeFromWishlist = (tourId) => {
    const newWishlist = wishlist.filter(tour => tour.id !== tourId);
    setWishlist(newWishlist);
    localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(newWishlist));
    
    // Update stats
    setStats(prev => ({ ...prev, wishlistCount: newWishlist.length }));
  };

  const removeFromComparison = (tourId) => {
    const newComparison = comparisonTours.filter(tour => tour.id !== tourId);
    setComparisonTours(newComparison);
    localStorage.setItem("comparisonTours", JSON.stringify(newComparison));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "paid": return "#10b981";
      case "completed": return "#059669";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "Chờ thanh toán";
      case "paid": return "Đã thanh toán";
      case "completed": return "Hoàn thành";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, color: "#0E7490", marginBottom: "20px" }}>🔄</div>
        <h2 style={{ color: "#1e293b", marginBottom: "8px" }}>Đang tải dashboard...</h2>
        <p style={{ color: "#64748b" }}>Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
          color: "#fff",
          padding: "40px 20px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ fontSize: "36px", margin: "0 0 8px", fontWeight: 700 }}>
            👋 Xin chào, {user?.name}!
          </h1>
          <p style={{ fontSize: "18px", margin: 0, opacity: 0.95 }}>
            Quản lý thông tin cá nhân và lịch sử du lịch của bạn
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          {[
            { 
              title: "Tổng đặt tour", 
              value: stats.totalBookings, 
              icon: "📋", 
              color: "#0E7490",
              description: "Tất cả đặt tour"
            },
            { 
              title: "Tổng chi tiêu", 
              value: `${Number(stats.totalSpent).toLocaleString()} ₫`, 
              icon: "💰", 
              color: "#10b981",
              description: "Tổng số tiền đã chi"
            },
            { 
              title: "iVIVUPoint", 
              value: loyalty.points, 
              icon: "🏅", 
              color: "#eab308",
              description: `Hạng: ${loyalty.tier}`
            },
            { 
              title: "Tour hoàn thành", 
              value: stats.completedTours, 
              icon: "✅", 
              color: "#059669",
              description: "Tour đã hoàn thành"
            },
            { 
              title: "Chờ thanh toán", 
              value: stats.pendingBookings, 
              icon: "⏳", 
              color: "#f59e0b",
              description: "Tour chờ thanh toán"
            },
            { 
              title: "Danh sách yêu thích", 
              value: stats.wishlistCount, 
              icon: "❤️", 
              color: "#ef4444",
              description: "Tour đã lưu"
            },
            { 
              title: "Đánh giá trung bình", 
              value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A", 
              icon: "⭐", 
              color: "#fbbf24",
              description: "Điểm đánh giá của bạn"
            },
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                textAlign: "center",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>{stat.icon}</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: stat.color, marginBottom: "4px" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                {stat.title}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", gap: "24px" }}>
          {/* Sidebar */}
          <div style={{ width: "250px", flexShrink: 0 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                position: "sticky",
                top: "20px",
              }}
            >
              <h3 style={{ fontSize: "18px", margin: "0 0 20px", color: "#1e293b" }}>
                📋 Menu
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { id: "overview", label: "Tổng quan", icon: "📊" },
                  { id: "bookings", label: "Đặt tour", icon: "📋" },
                  { id: "wishlist", label: "Yêu thích", icon: "❤️" },
                  { id: "comparison", label: "So sánh", icon: "⚖️" },
                  { id: "reviews", label: "Đánh giá", icon: "⭐" },
                  { id: "profile", label: "Thông tin", icon: "👤" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: activeTab === tab.id ? "#f0f9ff" : "transparent",
                      color: activeTab === tab.id ? "#0E7490" : "#64748b",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 500,
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.style.background = "#f8fafc";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.target.style.background = "transparent";
                      }
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                minHeight: "600px",
              }}
            >
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div>
                  <h2 style={{ fontSize: "24px", margin: "0 0 24px", color: "#1e293b" }}>
                    📊 Tổng quan hoạt động
                  </h2>
                  
                  {/* Recent Activity */}
                  <div style={{ marginBottom: "32px" }}>
                    <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: "#1e293b" }}>
                      Hoạt động gần đây
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {bookings.slice(0, 5).map((booking) => (
                        <div
                          key={booking.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px",
                            background: "#f8fafc",
                            borderRadius: "8px",
                          }}
                        >
                          <div style={{ fontSize: "20px" }}>📋</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, color: "#1e293b" }}>
                              {booking.Tour?.name || "Tour không xác định"}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {formatDate(booking.booking_date)} • {getStatusText(booking.status)}
                            </div>
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#0E7490" }}>
                            {Number(booking.total_price).toLocaleString()} ₫
                          </div>
                        </div>
                      ))}
                      {bookings.length === 0 && (
                        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                          <p>Chưa có hoạt động nào</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: "#1e293b" }}>
                      Thao tác nhanh
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                      <Link
                        to="/tours"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "16px",
                          background: "#f0f9ff",
                          borderRadius: "8px",
                          textDecoration: "none",
                          color: "#0E7490",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e0f2fe";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f0f9ff";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div style={{ fontSize: "24px" }}>🎯</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>Tìm tour mới</div>
                          <div style={{ fontSize: "12px", opacity: 0.8 }}>Khám phá các tour</div>
                        </div>
                      </Link>
                      
                      <Link
                        to="/wishlist"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "16px",
                          background: "#fef2f2",
                          borderRadius: "8px",
                          textDecoration: "none",
                          color: "#ef4444",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fee2e2";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fef2f2";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div style={{ fontSize: "24px" }}>❤️</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>Danh sách yêu thích</div>
                          <div style={{ fontSize: "12px", opacity: 0.8 }}>{stats.wishlistCount} tour</div>
                        </div>
                      </Link>
                      
                      <Link
                        to="/compare"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "16px",
                          background: "#f0fdf4",
                          borderRadius: "8px",
                          textDecoration: "none",
                          color: "#10b981",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#dcfce7";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f0fdf4";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div style={{ fontSize: "24px" }}>⚖️</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>So sánh tour</div>
                          <div style={{ fontSize: "12px", opacity: 0.8 }}>{comparisonTours.length} tour</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === "bookings" && (
                <div>
                  <h2 style={{ fontSize: "24px", margin: "0 0 24px", color: "#1e293b" }}>
                    📋 Lịch sử đặt tour
                  </h2>
                  
                  {bookings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ fontSize: "64px", marginBottom: "20px" }}>📋</div>
                      <h3 style={{ color: "#1e293b", marginBottom: "8px" }}>Chưa có đặt tour nào</h3>
                      <p style={{ color: "#64748b", marginBottom: "24px" }}>
                        Hãy khám phá và đặt tour đầu tiên của bạn!
                      </p>
                      <Link
                        to="/tours"
                        style={{
                          display: "inline-block",
                          background: "#0E7490",
                          color: "#fff",
                          padding: "12px 24px",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        Xem tour ngay
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            padding: "20px",
                            background: "#fff",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600, color: "#1e293b" }}>
                                {booking.Tour?.name || "Tour không xác định"}
                              </h3>
                              <div style={{ display: "flex", gap: "16px", marginBottom: "8px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "14px", color: "#64748b" }}>
                                  📍 {booking.Tour?.destination || "N/A"}
                                </span>
                                <span style={{ fontSize: "14px", color: "#64748b" }}>
                                  📅 {formatDate(booking.booking_date)}
                                </span>
                                <span style={{ fontSize: "14px", color: "#64748b" }}>
                                  👥 {booking.people_count} người
                                </span>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div
                                style={{
                                  display: "inline-block",
                                  padding: "4px 12px",
                                  borderRadius: "20px",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  background: getStatusColor(booking.status) + "20",
                                  color: getStatusColor(booking.status),
                                  marginBottom: "8px",
                                }}
                              >
                                {getStatusText(booking.status)}
                              </div>
                              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0E7490" }}>
                                {Number(booking.total_price).toLocaleString()} ₫
                              </div>
                            </div>
                          </div>
                          
                          {booking.Promotion && (
                            <div style={{ marginBottom: "12px", padding: "8px 12px", background: "#f0f9ff", borderRadius: "6px", fontSize: "14px", color: "#0E7490" }}>
                              🎁 Sử dụng mã: {booking.Promotion.code} - Giảm {Number(booking.discount_amount || 0).toLocaleString()} ₫
                            </div>
                          )}
                          
                          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <Link
                              to={`/tour/${booking.tour_id}`}
                              style={{
                                padding: "8px 16px",
                                background: "#f8fafc",
                                color: "#374151",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontSize: "14px",
                                fontWeight: 500,
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              Xem chi tiết
                            </Link>
                            {booking.status === "pending" && (
                              <button
                                onClick={() => cancelBooking(booking.id)}
                                style={{
                                  padding: "8px 16px",
                                  background: "#ef4444",
                                  color: "#fff",
                                  borderRadius: "6px",
                                  border: "none",
                                  fontSize: "14px",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                }}
                              >
                                Hủy đặt tour
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Wishlist Tab */}
              {activeTab === "wishlist" && (
                <div>
                  <h2 style={{ fontSize: "24px", margin: "0 0 24px", color: "#1e293b" }}>
                    ❤️ Danh sách yêu thích
                  </h2>
                  
                  {wishlist.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ fontSize: "64px", marginBottom: "20px" }}>❤️</div>
                      <h3 style={{ color: "#1e293b", marginBottom: "8px" }}>Danh sách yêu thích trống</h3>
                      <p style={{ color: "#64748b", marginBottom: "24px" }}>
                        Hãy thêm các tour bạn yêu thích vào danh sách!
                      </p>
                      <Link
                        to="/tours"
                        style={{
                          display: "inline-block",
                          background: "#0E7490",
                          color: "#fff",
                          padding: "12px 24px",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        Khám phá tour
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                      {wishlist.map((tour) => (
                        <div
                          key={tour.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            overflow: "hidden",
                            background: "#fff",
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <img
                            src={tour.image || "https://via.placeholder.com/400x250?text=Tour+Image"}
                            alt={tour.name}
                            style={{
                              width: "100%",
                              height: "180px",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/400x250?text=Tour+Image";
                            }}
                          />
                          <div style={{ padding: "16px" }}>
                            <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                              {tour.name}
                            </h3>
                            <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#64748b" }}>
                              📍 {tour.destination}
                            </p>
                            <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#64748b" }}>
                              ⏱️ {tour.duration}
                            </p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "18px", fontWeight: 700, color: "#0ea5e9" }}>
                                {Number(tour.price).toLocaleString()} ₫
                              </span>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <Link
                                  to={`/tour/${tour.id}`}
                                  style={{
                                    padding: "6px 12px",
                                    background: "#0E7490",
                                    color: "#fff",
                                    borderRadius: "6px",
                                    textDecoration: "none",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                  }}
                                >
                                  Xem
                                </Link>
                                <button
                                  onClick={() => removeFromWishlist(tour.id)}
                                  style={{
                                    padding: "6px 12px",
                                    background: "#ef4444",
                                    color: "#fff",
                                    borderRadius: "6px",
                                    border: "none",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                  }}
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Comparison Tab */}
              {activeTab === "comparison" && (
                <div>
                  <h2 style={{ fontSize: "24px", margin: "0 0 24px", color: "#1e293b" }}>
                    ⚖️ So sánh tour
                  </h2>
                  
                  {comparisonTours.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ fontSize: "64px", marginBottom: "20px" }}>⚖️</div>
                      <h3 style={{ color: "#1e293b", marginBottom: "8px" }}>Chưa có tour để so sánh</h3>
                      <p style={{ color: "#64748b", marginBottom: "24px" }}>
                        Thêm tối đa 3 tour để so sánh các tính năng và giá cả!
                      </p>
                      <Link
                        to="/tours"
                        style={{
                          display: "inline-block",
                          background: "#0E7490",
                          color: "#fff",
                          padding: "12px 24px",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        Thêm tour
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <p style={{ margin: 0, color: "#64748b" }}>
                          {comparisonTours.length} / 3 tour được chọn
                        </p>
                        <Link
                          to="/compare"
                          style={{
                            padding: "8px 16px",
                            background: "#0E7490",
                            color: "#fff",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        >
                          So sánh chi tiết →
                        </Link>
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                        {comparisonTours.map((tour) => (
                          <div
                            key={tour.id}
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              padding: "16px",
                              background: "#fff",
                              position: "relative",
                            }}
                          >
                            <button
                              onClick={() => removeFromComparison(tour.id)}
                              style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                                background: "#ef4444",
                                color: "#fff",
                                border: "none",
                                borderRadius: "50%",
                                width: "24px",
                                height: "24px",
                                cursor: "pointer",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              ✕
                            </button>
                            
                            <img
                              src={tour.image || "https://via.placeholder.com/200x150?text=Tour+Image"}
                              alt={tour.name}
                              style={{
                                width: "100%",
                                height: "120px",
                                objectFit: "cover",
                                borderRadius: "8px",
                                marginBottom: "12px",
                              }}
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/200x150?text=Tour+Image";
                              }}
                            />
                            
                            <h3 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                              {tour.name}
                            </h3>
                            <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#64748b" }}>
                              📍 {tour.destination}
                            </p>
                            <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#64748b" }}>
                              ⏱️ {tour.duration}
                            </p>
                            <div style={{ fontSize: "16px", fontWeight: 700, color: "#0ea5e9" }}>
                              {Number(tour.price).toLocaleString()} ₫
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <div>
                  <h2 style={{ fontSize: "24px", margin: "0 0 24px", color: "#1e293b" }}>
                    ⭐ Đánh giá của bạn
                  </h2>
                  
                  {reviews.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ fontSize: "64px", marginBottom: "20px" }}>⭐</div>
                      <h3 style={{ color: "#1e293b", marginBottom: "8px" }}>Chưa có đánh giá nào</h3>
                      <p style={{ color: "#64748b", marginBottom: "24px" }}>
                        Hãy chia sẻ trải nghiệm của bạn sau khi hoàn thành tour!
                      </p>
                      <Link
                        to="/tours"
                        style={{
                          display: "inline-block",
                          background: "#0E7490",
                          color: "#fff",
                          padding: "12px 24px",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        Xem tour
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            padding: "20px",
                            background: "#fff",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <div>
                              <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                                {review.Tour?.name || "Tour không xác định"}
                              </h3>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ display: "flex", gap: "2px" }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      style={{
                                        color: star <= review.rating ? "#fbbf24" : "#d1d5db",
                                        fontSize: "16px",
                                      }}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span style={{ fontSize: "14px", color: "#64748b" }}>
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
                            {review.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div>
                  <h2 style={{ fontSize: "24px", margin: "0 0 24px", color: "#1e293b" }}>
                    👤 Thông tin cá nhân
                  </h2>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: "#1e293b" }}>
                        Thông tin cơ bản
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                            Họ và tên
                          </label>
                          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", fontSize: "14px", color: "#1e293b" }}>
                            {user?.name || "N/A"}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                            Email
                          </label>
                          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", fontSize: "14px", color: "#1e293b" }}>
                            {user?.email || "N/A"}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                            Vai trò
                          </label>
                          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", fontSize: "14px", color: "#1e293b" }}>
                            {user?.role === "admin" ? "👑 Quản trị viên" : "👤 Người dùng"}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: "#1e293b" }}>
                        Thống kê hoạt động
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                          <span style={{ fontSize: "14px", color: "#64748b" }}>Tổng đặt tour:</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{stats.totalBookings}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                          <span style={{ fontSize: "14px", color: "#64748b" }}>Tổng chi tiêu:</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{Number(stats.totalSpent).toLocaleString()} ₫</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                          <span style={{ fontSize: "14px", color: "#64748b" }}>Tour hoàn thành:</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{stats.completedTours}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                          <span style={{ fontSize: "14px", color: "#64748b" }}>Đánh giá trung bình:</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

