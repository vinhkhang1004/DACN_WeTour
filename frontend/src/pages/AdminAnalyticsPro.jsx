import React, { useEffect, useState } from "react";
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
  AreaChart,
  Scatter,
  ScatterChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminAnalyticsPro() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30days");
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsData, setAnalyticsData] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [bookingData, setBookingData] = useState([]);
  const [tourData, setTourData] = useState([]);
  const [geographicData, setGeographicData] = useState([]);
  const [hotelStats, setHotelStats] = useState({
    totalBookings: 0,
    revenue: 0,
  });
  const [flightStats, setFlightStats] = useState({
    totalBookings: 0,
    revenue: 0,
  });
  const [hotelBookingData, setHotelBookingData] = useState([]);
  const [flightBookingData, setFlightBookingData] = useState([]);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [
        overviewRes,
        revenueRes,
        monthlyRes,
        userRes,
        bookingRes,
        tourRes,
        bookingStatusRes,
        geoRes,
        hotelBookingsRes,
        flightBookingsRes
      ] = await Promise.all([
        api.get("/stats/overview", { headers }).catch(() => ({ data: {} })),
        api.get("/stats/revenue", { headers }).catch(() => ({ data: [] })),
        api.get("/stats/monthly", { headers }).catch(() => ({ data: [] })),
        api.get("/stats/users", { headers }).catch(() => ({ data: {} })),
        api.get("/stats/bookings", { headers }).catch(() => ({ data: [] })),
        api.get("/stats/top-tours", { headers }).catch(() => ({ data: [] })),
        api.get("/stats/booking-status", { headers }).catch(() => ({ data: [] })),
        api.get("/stats/revenue-by-destination", { headers }).catch(() => ({ data: [] })),
        api.get("/stats/hotel-bookings", { headers }).catch(() => ({ data: [] })),
        api.get("/stats/flight-bookings", { headers }).catch(() => ({ data: [] }))
      ]);

      // Set overview data (bao gồm Tour, Khách sạn, Chuyến bay)
      const overview = overviewRes.data || {};
      setAnalyticsData({
        totalRevenue: overview.totalRevenue || 0,
        totalUsers: overview.totalUsers || 0,
        totalBookings: overview.totalBookings || 0,
        totalTours: overview.totalTours || 0,
        totalTourBookings: overview.totalTourBookings || overview.totalBookings || 0,
        totalHotelBookings: overview.totalHotelBookings || 0,
        totalFlightBookings: overview.totalFlightBookings || 0,
        tourRevenue: overview.tourRevenue || 0,
        hotelRevenue: overview.hotelRevenue || 0,
        flightRevenue: overview.flightRevenue || 0,
        completedBookings: bookingStatusRes.data?.find(b => b.status === "completed")?.count || 0,
        paidBookings: bookingStatusRes.data?.find(b => b.status === "paid")?.count || 0,
        pendingBookings: bookingStatusRes.data?.find(b => b.status === "pending")?.count || 0,
        cancelledBookings: bookingStatusRes.data?.find(b => b.status === "cancelled")?.count || 0
      });

      // Simple stats cho khách sạn & chuyến bay dùng cho thẻ riêng
      setHotelStats({
        totalBookings: overview.totalHotelBookings || 0,
        revenue: overview.hotelRevenue || 0,
      });
      setFlightStats({
        totalBookings: overview.totalFlightBookings || 0,
        revenue: overview.flightRevenue || 0,
      });

      // Format revenue data for charts (daily)
      setRevenueData(Array.isArray(revenueRes.data) ? revenueRes.data.map(item => ({
        date: item.date || "",
        revenue: Number(item.revenue || 0)
      })) : []);

      // Format monthly revenue data
      setMonthlyRevenueData(Array.isArray(monthlyRes.data) ? monthlyRes.data.map(item => ({
        month: item.month || "",
        revenue: Number(item.revenue || 0)
      })) : []);
      
      // Format user data
      setUserData([{
        date: new Date().toISOString().split('T')[0],
        totalUsers: userRes.data?.totalUsers || 0,
        newUsers: 0,
        activeUsers: userRes.data?.activeUsers || 0,
        inactiveUsers: (userRes.data?.totalUsers || 0) - (userRes.data?.activeUsers || 0)
      }]);

      // Format booking data
      setBookingData(Array.isArray(bookingRes.data) ? bookingRes.data.map(item => ({
        date: item.date || "",
        bookings: Number(item.count || item.bookings || 0)
      })) : []);

      // Hotel booking chart data
      setHotelBookingData(Array.isArray(hotelBookingsRes.data) ? hotelBookingsRes.data.map(item => ({
        date: item.date || "",
        bookings: Number(item.bookings || item.count || 0),
        revenue: Number(item.revenue || 0)
      })) : []);

      // Flight booking chart data
      setFlightBookingData(Array.isArray(flightBookingsRes.data) ? flightBookingsRes.data.map(item => ({
        date: item.date || "",
        bookings: Number(item.bookings || item.count || 0),
        revenue: Number(item.revenue || 0)
      })) : []);

      // Format tour data
      setTourData(Array.isArray(tourRes.data) ? tourRes.data.map(item => ({
        name: item.name || "N/A",
        views: Number(item.bookings || 0),
        revenue: Number(item.revenue || 0),
        bookings: Number(item.bookings || 0)
      })) : []);

      // Format geographic data
      setGeographicData(Array.isArray(geoRes.data) ? geoRes.data.map(item => ({
        region: item.destination || "N/A",
        users: 0,
        bookings: 0,
        revenue: Number(item.revenue || 0)
      })) : []);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setAnalyticsData({});
      setRevenueData([]);
      setMonthlyRevenueData([]);
      setUserData([]);
      setBookingData([]);
      setTourData([]);
      setGeographicData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const tabs = [
    { id: "overview", name: "Tổng quan", icon: "📊" },
    { id: "revenue", name: "Doanh thu", icon: "💰" },
    { id: "users", name: "Người dùng", icon: "👥" },
    { id: "bookings", name: "Đặt tour", icon: "📋" },
    { id: "tours", name: "Tour", icon: "🎯" },
    { id: "geographic", name: "Địa lý", icon: "🌍" },
    { id: "hotels", name: "Khách sạn", icon: "🏨" },
    { id: "flights", name: "Chuyến bay", icon: "✈️" }
  ];

  if (loading) {
    return <LoadingSpinner size="large" text="Đang tải dữ liệu phân tích..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Phân tích nâng cao</h1>
              <p className="text-gray-600 mt-1">Báo cáo chi tiết và thống kê hệ thống</p>
            </div>
            <div className="flex gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7days">7 ngày qua</option>
                <option value="30days">30 ngày qua</option>
                <option value="90days">90 ngày qua</option>
                <option value="1year">1 năm qua</option>
              </select>
              <button
                onClick={fetchAnalyticsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Làm mới
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="text-3xl text-blue-600 mr-4">💰</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analyticsData.totalRevenue || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Tổng doanh thu</div>
                    <div className="text-xs text-green-600">+12.5% so với kỳ trước</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="text-3xl text-green-600 mr-4">👥</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(analyticsData.totalUsers || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Tổng người dùng</div>
                    <div className="text-xs text-green-600">+8.2% so với kỳ trước</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="text-3xl text-yellow-600 mr-4">📋</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(analyticsData.totalTourBookings || analyticsData.totalBookings || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Tổng đặt tour</div>
                    <div className="text-xs text-green-600">+15.3% so với kỳ trước</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="text-3xl text-purple-600 mr-4">🎯</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(analyticsData.totalTours || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Tổng tour</div>
                    <div className="text-xs text-green-600">+5.7% so với kỳ trước</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel & Flight summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="text-3xl text-indigo-600 mr-4">🏨</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(hotelStats.totalBookings || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Đặt phòng khách sạn</div>
                    <div className="text-xs text-gray-500">
                      Doanh thu: {formatCurrency(hotelStats.revenue || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="text-3xl text-sky-600 mr-4">✈️</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(flightStats.totalBookings || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Đặt vé máy bay</div>
                    <div className="text-xs text-gray-500">
                      Doanh thu: {formatCurrency(flightStats.revenue || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu theo thời gian</h3>
                <div className="h-80">
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
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Đặt tour theo thời gian</h3>
                <div className="h-80">
                  {bookingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bookingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === "revenue" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu theo tháng</h3>
                <div className="h-80">
                  {monthlyRevenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCurrency(value), 'Doanh thu']} />
                        <Bar dataKey="revenue" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top tour doanh thu cao</h3>
                <div className="h-80">
                  {tourData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tourData.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name.substring(0, 15)}... ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {tourData.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatCurrency(value), 'Doanh thu']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hotels Tab */}
        {activeTab === "hotels" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="text-3xl text-indigo-600 mr-4">🏨</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(hotelStats.totalBookings || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Tổng đặt phòng khách sạn</div>
                    <div className="text-xs text-gray-500">
                      Doanh thu: {formatCurrency(hotelStats.revenue || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6 col-span-1 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Đặt phòng khách sạn theo thời gian</h3>
                <div className="h-80">
                  {hotelBookingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hotelBookingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) =>
                            name === "revenue"
                              ? [formatCurrency(value), "Doanh thu"]
                              : [formatNumber(value), "Số booking"]
                          }
                        />
                        <Line type="monotone" dataKey="bookings" stroke="#6366F1" strokeWidth={2} name="Số booking" />
                        <Line type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} name="Doanh thu" yAxisId={1} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chưa có dữ liệu đặt phòng khách sạn
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flights Tab */}
        {activeTab === "flights" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="text-3xl text-sky-600 mr-4">✈️</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(flightStats.totalBookings || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Tổng đặt vé máy bay</div>
                    <div className="text-xs text-gray-500">
                      Doanh thu: {formatCurrency(flightStats.revenue || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6 col-span-1 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Đặt vé máy bay theo thời gian</h3>
                <div className="h-80">
                  {flightBookingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={flightBookingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) =>
                            name === "revenue"
                              ? [formatCurrency(value), "Doanh thu"]
                              : [formatNumber(value), "Số booking"]
                          }
                        />
                        <Line type="monotone" dataKey="bookings" stroke="#0EA5E9" strokeWidth={2} name="Số booking" />
                        <Line type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} name="Doanh thu" yAxisId={1} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chưa có dữ liệu đặt vé máy bay
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê người dùng</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="font-medium text-gray-700">Tổng người dùng</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatNumber(analyticsData.totalUsers || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-700">Người dùng hoạt động</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatNumber(userData[0]?.activeUsers || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Người dùng không hoạt động</span>
                    <span className="text-2xl font-bold text-gray-600">
                      {formatNumber(userData[0]?.inactiveUsers || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố người dùng</h3>
                <div className="h-80">
                  {userData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Hoạt động", value: userData[0]?.activeUsers || 0 },
                            { name: "Không hoạt động", value: userData[0]?.inactiveUsers || 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#10B981" />
                          <Cell fill="#EF4444" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Đặt tour theo thời gian</h3>
                <div className="h-80">
                  {bookingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={bookingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="bookings"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái đặt tour</h3>
                <div className="h-80">
                  {(analyticsData.completedBookings || analyticsData.paidBookings || analyticsData.pendingBookings || analyticsData.cancelledBookings) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Hoàn thành", value: analyticsData.completedBookings || 0, color: "#10B981" },
                            { name: "Đã thanh toán", value: analyticsData.paidBookings || 0, color: "#3B82F6" },
                            { name: "Chờ xác nhận", value: analyticsData.pendingBookings || 0, color: "#F59E0B" },
                            { name: "Đã hủy", value: analyticsData.cancelledBookings || 0, color: "#EF4444" }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: "Hoàn thành", value: analyticsData.completedBookings || 0, color: "#10B981" },
                            { name: "Đã thanh toán", value: analyticsData.paidBookings || 0, color: "#3B82F6" },
                            { name: "Chờ xác nhận", value: analyticsData.pendingBookings || 0, color: "#F59E0B" },
                            { name: "Đã hủy", value: analyticsData.cancelledBookings || 0, color: "#EF4444" }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tours Tab */}
        {activeTab === "tours" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top tour phổ biến</h3>
                <div className="h-80">
                  {tourData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tourData.slice(0, 10)} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="bookings" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu theo tour</h3>
                <div className="h-80">
                  {tourData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tourData.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCurrency(value), 'Doanh thu']} />
                        <Bar dataKey="revenue" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Geographic Tab */}
        {activeTab === "geographic" && (
          <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu theo điểm đến</h3>
              <div className="h-80">
                {geographicData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={geographicData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Doanh thu']} />
                      <Bar dataKey="revenue" fill="#3B82F6" name="Doanh thu" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Chưa có dữ liệu
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
