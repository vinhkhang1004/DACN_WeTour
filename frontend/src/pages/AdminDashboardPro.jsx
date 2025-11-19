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
      
      const [summaryRes, revenueRes, bookingsRes, toursRes, usersRes] = await Promise.all([
        api.get("/stats/summary", { headers }),
        api.get(`/stats/revenue?period=${timeRange}`, { headers }),
        api.get("/admin/bookings?limit=10&sort=created_at", { headers }),
        api.get("/tours?sort=popularity&limit=5", { headers }),
        api.get(`/stats/users?period=${timeRange}`, { headers })
      ]);

      setSummary(summaryRes.data);
      setRevenueData(revenueRes.data || []);
      setRecentBookings(bookingsRes.data || []);
      setTopTours(toursRes.data || []);
      setUserGrowthData(usersRes.data || []);

      // Note: chartData will be empty until we have proper time-series data
      setChartData([]);

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
    <div className="min-h-screen bg-gray-50" style={{ padding: "24px" }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 rounded-xl mb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">👑 Admin Dashboard Pro</h1>
              <p className="text-xl opacity-90">Quản lý và theo dõi hệ thống du lịch</p>
            </div>
            <div className="flex gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="7days">7 ngày qua</option>
                <option value="30days">30 ngày qua</option>
                <option value="90days">90 ngày qua</option>
                <option value="1year">1 năm qua</option>
              </select>
              <button
                onClick={fetchDashboardData}
                className="px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                🔄 Làm mới
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: "Tổng Tour", 
              value: summary.totalTours || 0, 
              icon: "🎯", 
              color: "blue",
              change: "+12%",
              changeType: "positive"
            },
            { 
              title: "Tổng Khách hàng", 
              value: summary.totalUsers || 0, 
              icon: "👥", 
              color: "green",
              change: "+8%",
              changeType: "positive"
            },
            { 
              title: "Tổng Đặt tour", 
              value: summary.totalBookings || 0, 
              icon: "📋", 
              color: "yellow",
              change: "+15%",
              changeType: "positive"
            },
            { 
              title: "Doanh thu tháng", 
              value: formatCurrency(summary.monthlyRevenue || 0), 
              icon: "💰", 
              color: "purple",
              change: "+23%",
              changeType: "positive"
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl">{stat.icon}</div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                }`}>
                  <span>{stat.changeType === "positive" ? "↗" : "↘"}</span>
                  <span>{stat.change}</span>
                </div>
              </div>
              <div className={`text-3xl font-bold mb-2 text-${stat.color}-600`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {stat.title}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                📈 Doanh thu theo thời gian
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Doanh thu']} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">📋 Đặt tour gần đây</h3>
                <Link
                  to="/admin/bookings"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Xem tất cả →
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">📋</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {booking.Tour?.name || "Tour không xác định"}
                      </h4>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>👤 {booking.User?.name || "N/A"}</span>
                        <span>👥 {booking.people_count}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusText(booking.status)}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mt-1">
                        {formatCurrency(booking.total_price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Tours */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">🎯 Tour phổ biến</h3>
                <Link
                  to="/admin/tours-pro"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Quản lý tour →
                </Link>
              </div>
              
              <div className="space-y-4">
                {topTours.map((tour, index) => (
                  <div key={tour.id} className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-blue-600 min-w-[40px]">
                      #{index + 1}
                    </div>
                    <img
                      src={tour.image || "https://via.placeholder.com/60x45?text=Tour"}
                      alt={tour.name}
                      className="w-15 h-11 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{tour.name}</h4>
                      <div className="flex gap-3 text-sm text-gray-600">
                        <span>📍 {tour.destination}</span>
                        <span>👁️ {tour.views || 0}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(tour.price)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {tour.bookings_count || 0} đặt tour
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
