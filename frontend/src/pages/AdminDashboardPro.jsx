import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";

export default function AdminDashboardPro() {
  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [topTours, setTopTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30days");
  const [revenueData, setRevenueData] = useState([]);
  const [bookingData, setBookingData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data
      const [summaryRes, revenueRes, bookingsRes, toursRes] = await Promise.all([
        api.get("/stats/summary", { headers }),
        api.get(`/stats/revenue?period=${timeRange}`, { headers }).catch(() => ({ data: [] })),
        api.get("/admin/bookings?limit=10&sort=created_at", { headers }).catch(() => ({ data: [] })),
        api.get("/stats/top-tours", { headers }).catch((err) => {
          console.error("Error fetching top tours:", err);
          return { data: [] };
        })
      ]);
      
      console.log("Top tours response:", toursRes.data);
      
      setSummary(summaryRes.data || {});
      setRevenueData(revenueRes.data || []);
      setRecentBookings(bookingsRes.data || []);
      setTopTours(toursRes.data || []);
      
      // If no top tours from bookings, fetch popular tours by views
      if (!toursRes.data || toursRes.data.length === 0) {
        try {
          const popularToursRes = await api.get("/tours?limit=5", { headers });
          console.log("Popular tours fallback:", popularToursRes.data);
          if (popularToursRes.data && popularToursRes.data.length > 0) {
            // Sort by views or bookings_count if available
            const sorted = [...popularToursRes.data].sort((a, b) => {
              const aViews = a.views || a.bookings_count || 0;
              const bViews = b.views || b.bookings_count || 0;
              return bViews - aViews;
            });
            setTopTours(sorted.slice(0, 5));
          }
        } catch (err) {
          console.error("Error fetching popular tours fallback:", err);
        }
      }

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", background: "#f9fafb", minHeight: "100%" }}>
      {/* Title */}
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", marginBottom: "32px" }}>
        Tổng quan
      </h1>

      {/* Key Metrics Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(4, 1fr)", 
        gap: "20px", 
        marginBottom: "32px" 
      }}>
        {[
          { 
            title: "Tổng lượt đặt", 
            value: summary.totalBookings || 0, 
            icon: "🎫",
            color: "#0ea5e9"
          },
          { 
            title: "Doanh thu", 
            value: formatCurrency(summary.monthlyRevenue || 0), 
            icon: "💵",
            color: "#10b981"
          },
          { 
            title: "Người dùng mới", 
            value: summary.newUsers || 0, 
            icon: "👥",
            color: "#f59e0b"
          },
          { 
            title: "Tổng người dùng", 
            value: summary.totalUsers || 0, 
            icon: "👁️",
            color: "#8b5cf6"
          },
        ].map((stat, index) => (
          <div
            key={index}
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb"
            }}
          >
            <div style={{ 
              fontSize: "32px", 
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <span>{stat.icon}</span>
            </div>
            <div style={{ 
              fontSize: "28px", 
              fontWeight: 700, 
              color: stat.color,
              marginBottom: "8px"
            }}>
              {stat.value}
            </div>
            <div style={{ 
              fontSize: "14px", 
              color: "#64748b",
              fontWeight: 500
            }}>
              {stat.title}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "2fr 1fr", 
        gap: "24px",
        marginBottom: "32px"
      }}>
        {/* Revenue Chart */}
        <div style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <h2 style={{ 
            fontSize: "20px", 
            fontWeight: 700, 
            color: "#1e293b", 
            marginBottom: "20px" 
          }}>
            Doanh thu theo thời gian
          </h2>
          <div style={{ height: "300px" }}>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Doanh thu']} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0E7490"
                    fill="#0E7490"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ 
                height: "100%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: "#64748b"
              }}>
                Chưa có dữ liệu doanh thu
              </div>
            )}
          </div>
        </div>

        {/* Top Tours */}
        <div style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <h2 style={{ 
              fontSize: "20px", 
              fontWeight: 700, 
              color: "#1e293b",
              margin: 0
            }}>
              Tour phổ biến
            </h2>
            <Link
              to="/admin/tours-pro"
              style={{
                fontSize: "14px",
                color: "#0E7490",
                textDecoration: "none",
                fontWeight: 500
              }}
            >
              Xem tất cả →
            </Link>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {topTours.length === 0 ? (
              <div style={{ 
                padding: "20px", 
                textAlign: "center", 
                color: "#64748b",
                fontSize: "14px"
              }}>
                Chưa có tour nào
              </div>
            ) : (
              topTours.map((tour, index) => (
                <div
                  key={tour.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                >
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    background: "#0E7490",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: "14px",
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  {tour.image && (
                    <img
                      src={tour.image}
                      alt={tour.name}
                      style={{
                        width: "50px",
                        height: "40px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        flexShrink: 0
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1e293b",
                      marginBottom: "4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {tour.name}
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: "#64748b",
                      display: "flex",
                      gap: "12px"
                    }}>
                      <span>📍 {tour.destination}</span>
                      {tour.views && <span>👁️ {tour.views}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#0E7490"
                    }}>
                      {tour.price && Number(tour.price) > 0 ? formatCurrency(Number(tour.price)) : "N/A"}
                    </div>
                    {tour.bookings && (
                      <div style={{
                        fontSize: "11px",
                        color: "#64748b",
                        marginTop: "4px"
                      }}>
                        {tour.bookings} đặt tour
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "20px"
        }}>
          <h2 style={{ 
            fontSize: "20px", 
            fontWeight: 700, 
            color: "#1e293b",
            margin: 0
          }}>
            Đặt tour gần đây
          </h2>
          <Link
            to="/admin/bookings"
            style={{
              fontSize: "14px",
              color: "#0E7490",
              textDecoration: "none",
              fontWeight: 500
            }}
          >
            Xem tất cả →
          </Link>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {recentBookings.length === 0 ? (
            <div style={{ 
              padding: "40px", 
              textAlign: "center", 
              color: "#64748b",
              fontSize: "14px"
            }}>
              Chưa có đơn đặt tour nào
            </div>
          ) : (
            recentBookings.map((booking) => (
              <div
                key={booking.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                }}
              >
                <div style={{ fontSize: "24px", flexShrink: 0 }}>📋</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "6px"
                  }}>
                    {booking.Tour?.name || "Tour không xác định"}
                  </div>
                  <div style={{
                    fontSize: "13px",
                    color: "#64748b",
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap"
                  }}>
                    <span>👤 {booking.User?.name || booking.guest_name || "N/A"}</span>
                    <span>👥 {booking.people_count} người</span>
                    <span>📅 {formatDate(booking.booking_date)}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: getStatusColor(booking.status) + "20",
                    color: getStatusColor(booking.status),
                    marginBottom: "8px"
                  }}>
                    {getStatusText(booking.status)}
                  </div>
                  <div style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#0E7490"
                  }}>
                    {formatCurrency(booking.total_price)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
