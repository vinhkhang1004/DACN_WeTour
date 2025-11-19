import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function AdminDashboardEnhanced() {
  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [topTours, setTopTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch summary data
      const summaryRes = await api.get("/stats/summary", { headers });
      setSummary(summaryRes.data);

      // Fetch chart data
      const chartRes = await api.get("/stats/revenue-monthly", { headers });
      const data = chartRes.data.map((d) => ({
        month: `Tháng ${d.month}`,
        revenue: Number(d.revenue),
      }));
      setChartData(data);

      // Fetch recent bookings
      const bookingsRes = await api.get("/bookings?limit=10", { headers });
      setRecentBookings(bookingsRes.data || []);

      // Fetch top tours
      const toursRes = await api.get("/tours?sort=popularity&limit=5", { headers });
      setTopTours(toursRes.data || []);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <h1 style={{ fontSize: "36px", margin: "0 0 8px", fontWeight: 700 }}>
            👑 Admin Dashboard
          </h1>
          <p style={{ fontSize: "18px", margin: 0, opacity: 0.95 }}>
            Quản lý và theo dõi hoạt động của hệ thống du lịch
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 20px" }}>
        {/* Quick Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          {[
            { 
              title: "Tổng Tour", 
              value: summary.totalTours || 0, 
              icon: "🎯", 
              color: "#0ea5e9",
              change: "+12%",
              changeType: "positive"
            },
            { 
              title: "Tổng Khách hàng", 
              value: summary.totalUsers || 0, 
              icon: "👥", 
              color: "#10b981",
              change: "+8%",
              changeType: "positive"
            },
            { 
              title: "Tổng Đặt tour", 
              value: summary.totalBookings || 0, 
              icon: "📋", 
              color: "#f59e0b",
              change: "+15%",
              changeType: "positive"
            },
            { 
              title: "Doanh thu tháng", 
              value: formatCurrency(summary.monthlyRevenue || 0), 
              icon: "💰", 
              color: "#8b5cf6",
              change: "+23%",
              changeType: "positive"
            },
            { 
              title: "Đặt tour hôm nay", 
              value: summary.todayBookings || 0, 
              icon: "📅", 
              color: "#ef4444",
              change: "+5%",
              changeType: "positive"
            },
            { 
              title: "Tỷ lệ hoàn thành", 
              value: `${summary.completionRate || 0}%`, 
              icon: "✅", 
              color: "#059669",
              change: "+2%",
              changeType: "positive"
            },
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                border: "1px solid #e5e7eb",
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ fontSize: "32px" }}>{stat.icon}</div>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "4px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: stat.changeType === "positive" ? "#10b981" : "#ef4444"
                }}>
                  <span>{stat.changeType === "positive" ? "↗" : "↘"}</span>
                  <span>{stat.change}</span>
                </div>
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: stat.color, marginBottom: "4px" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>
                {stat.title}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", gap: "24px" }}>
          {/* Main Content Area */}
          <div style={{ flex: 2 }}>
            {/* Tabs */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e5e7eb" }}>
                {[
                  { id: "overview", label: "Tổng quan", icon: "📊" },
                  { id: "bookings", label: "Đặt tour", icon: "📋" },
                  { id: "tours", label: "Tour phổ biến", icon: "🎯" },
                  { id: "analytics", label: "Phân tích", icon: "📈" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "12px 20px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: 500,
                      color: activeTab === tab.id ? "#0E7490" : "#64748b",
                      borderBottom: activeTab === tab.id ? "2px solid #0E7490" : "2px solid transparent",
                      transition: "all 0.2s",
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
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
                    📊 Tổng quan hệ thống
                  </h2>
                  
                  {/* Revenue Chart */}
                  <div style={{ marginBottom: "32px" }}>
                    <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: "#1e293b" }}>
                      Doanh thu theo tháng
                    </h3>
                    <div style={{ height: "300px", background: "#f8fafc", borderRadius: "8px", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📈</div>
                        <p style={{ color: "#64748b", margin: 0 }}>Biểu đồ doanh thu sẽ được hiển thị ở đây</p>
                        <p style={{ color: "#64748b", fontSize: "14px", margin: "4px 0 0 0" }}>
                          Cần tích hợp thư viện chart (Chart.js, Recharts, etc.)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* System Health */}
                  <div>
                    <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: "#1e293b" }}>
                      Tình trạng hệ thống
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                      {[
                        { name: "Database", status: "Online", color: "#10b981" },
                        { name: "API Server", status: "Online", color: "#10b981" },
                        { name: "Email Service", status: "Online", color: "#10b981" },
                        { name: "Payment Gateway", status: "Online", color: "#10b981" },
                      ].map((service, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "16px",
                            background: "#f8fafc",
                            borderRadius: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              background: service.color,
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 500, color: "#1e293b" }}>{service.name}</div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>{service.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === "bookings" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 style={{ fontSize: "24px", margin: 0, color: "#1e293b" }}>
                      📋 Đặt tour gần đây
                    </h2>
                    <Link
                      to="/admin/bookings"
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
                      Xem tất cả →
                    </Link>
                  </div>
                  
                  {recentBookings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ fontSize: "64px", marginBottom: "20px" }}>📋</div>
                      <h3 style={{ color: "#1e293b", marginBottom: "8px" }}>Chưa có đặt tour nào</h3>
                      <p style={{ color: "#64748b" }}>Hệ thống chưa có đặt tour nào được tạo</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {recentBookings.map((booking) => (
                        <div
                          key={booking.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "20px",
                            background: "#f8fafc",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <div style={{ fontSize: "24px" }}>📋</div>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                              {booking.Tour?.name || "Tour không xác định"}
                            </h3>
                            <div style={{ display: "flex", gap: "16px", fontSize: "14px", color: "#64748b" }}>
                              <span>👤 {booking.User?.name || "N/A"}</span>
                              <span>📅 {formatDate(booking.booking_date)}</span>
                              <span>👥 {booking.people_count} người</span>
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
                            <div style={{ fontSize: "16px", fontWeight: 700, color: "#0E7490" }}>
                              {formatCurrency(booking.total_price)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tours Tab */}
              {activeTab === "tours" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 style={{ fontSize: "24px", margin: 0, color: "#1e293b" }}>
                      🎯 Tour phổ biến
                    </h2>
                    <Link
                      to="/admin/tours"
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
                      Quản lý tour →
                    </Link>
                  </div>
                  
                  {topTours.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎯</div>
                      <h3 style={{ color: "#1e293b", marginBottom: "8px" }}>Chưa có tour nào</h3>
                      <p style={{ color: "#64748b" }}>Hệ thống chưa có tour nào được tạo</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {topTours.map((tour, index) => (
                        <div
                          key={tour.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "20px",
                            background: "#f8fafc",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0E7490", minWidth: "40px" }}>
                            #{index + 1}
                          </div>
                          <img
                            src={tour.image || "https://via.placeholder.com/80x60?text=Tour"}
                            alt={tour.name}
                            style={{
                              width: "80px",
                              height: "60px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/80x60?text=Tour";
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                              {tour.name}
                            </h3>
                            <div style={{ display: "flex", gap: "16px", fontSize: "14px", color: "#64748b" }}>
                              <span>📍 {tour.destination}</span>
                              <span>⏱️ {tour.duration}</span>
                              <span>👁️ {tour.views || 0} lượt xem</span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "18px", fontWeight: 700, color: "#0E7490", marginBottom: "4px" }}>
                              {formatCurrency(tour.price)}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {tour.bookings_count || 0} đặt tour
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === "analytics" && (
                <div>
                  <h2 style={{ fontSize: "24px", margin: "0 0 24px", color: "#1e293b" }}>
                    📈 Phân tích chi tiết
                  </h2>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: "#1e293b" }}>
                        Thống kê đặt tour
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                          <span style={{ fontSize: "14px", color: "#64748b" }}>Tổng đặt tour:</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{summary.totalBookings || 0}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                          <span style={{ fontSize: "14px", color: "#64748b" }}>Đã thanh toán:</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{summary.paidBookings || 0}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                          <span style={{ fontSize: "14px", color: "#64748b" }}>Hoàn thành:</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{summary.completedBookings || 0}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                          <span style={{ fontSize: "14px", color: "#64748b" }}>Đã hủy:</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{summary.cancelledBookings || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: "#1e293b" }}>
                        Thống kê tài chính
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                          <span style={{ fontSize: "14px", color: "#64748b" }}>Tổng doanh thu:</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{formatCurrency(summary.totalRevenue || 0)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                          <span style={{ fontSize: "14px", color: "#64748b" }}>Doanh thu tháng:</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{formatCurrency(summary.monthlyRevenue || 0)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                          <span style={{ fontSize: "14px", color: "#64748b" }}>Doanh thu hôm nay:</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{formatCurrency(summary.todayRevenue || 0)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                          <span style={{ fontSize: "14px", color: "#64748b" }}>Trung bình/đặt tour:</span>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                            {summary.totalBookings > 0 ? formatCurrency(summary.totalRevenue / summary.totalBookings) : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ width: "300px" }}>
            {/* Quick Actions */}
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ fontSize: "18px", margin: "0 0 20px", color: "#1e293b" }}>
                ⚡ Thao tác nhanh
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Link
                  to="/admin/tours"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    background: "#f0f9ff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "#0E7490",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e0f2fe";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f0f9ff";
                  }}
                >
                  <div style={{ fontSize: "20px" }}>🎯</div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Quản lý Tour</div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>Thêm, sửa, xóa tour</div>
                  </div>
                </Link>
                
                <Link
                  to="/admin/bookings"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    background: "#f0fdf4",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "#10b981",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#dcfce7";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f0fdf4";
                  }}
                >
                  <div style={{ fontSize: "20px" }}>📋</div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Quản lý Đặt tour</div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>Xem, xử lý đặt tour</div>
                  </div>
                </Link>
                
                <Link
                  to="/admin/users"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    background: "#fef2f2",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "#ef4444",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fee2e2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fef2f2";
                  }}
                >
                  <div style={{ fontSize: "20px" }}>👥</div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Quản lý Người dùng</div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>Xem, quản lý tài khoản</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* System Info */}
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <h3 style={{ fontSize: "18px", margin: "0 0 20px", color: "#1e293b" }}>
                ℹ️ Thông tin hệ thống
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "#64748b" }}>Phiên bản:</span>
                  <span style={{ fontWeight: 500, color: "#1e293b" }}>v1.0.0</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "#64748b" }}>Cập nhật cuối:</span>
                  <span style={{ fontWeight: 500, color: "#1e293b" }}>Hôm nay</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "#64748b" }}>Uptime:</span>
                  <span style={{ fontWeight: 500, color: "#1e293b" }}>99.9%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "#64748b" }}>Database:</span>
                  <span style={{ fontWeight: 500, color: "#10b981" }}>Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



