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
  Legend,
} from "recharts";
import * as XLSX from "xlsx";

export default function AdminStats() {
  const [stats, setStats] = useState({
    totalTours: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [topTours, setTopTours] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // 📦 Gọi API thống kê
  const fetchData = async () => {
    try {
      setLoading(true);
     const [summaryRes, monthlyRes, topRes] = await Promise.all([
  api.get("/admin/stats", { headers }),
  api.get(`/admin/stats/monthly?year=${year}${month ? `&month=${month}` : ""}`, { headers }),
  api.get("/admin/stats/top-tours", { headers }),
]);

      setStats(summaryRes.data.summary);
      setMonthlyRevenue(monthlyRes.data);
      setTopTours(topRes.data);
    } catch (err) {
      console.error("❌ Lỗi khi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 100, fontSize: 20 }}>
        ⏳ Đang tải thống kê...
      </div>
    );

  // 🗓️ Danh sách năm động
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 5; i--) {
    yearOptions.push(i);
  }

  // Function to export data to Excel
  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // 1. Tổng quan
      const overviewSheet = XLSX.utils.json_to_sheet([
        { "Chỉ số": "Tổng tour", "Giá trị": stats.totalTours, "Đơn vị": "tour" },
        { "Chỉ số": "Lượt đặt tour", "Giá trị": stats.totalBookings, "Đơn vị": "đơn" },
        { "Chỉ số": "Tổng doanh thu", "Giá trị": stats.totalRevenue, "Đơn vị": "VND" }
      ]);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, "Tổng quan");

      // 2. Doanh thu theo tháng
      if (monthlyRevenue.length > 0) {
        const monthlySheet = XLSX.utils.json_to_sheet(
          monthlyRevenue.map(item => ({
            "Tháng": item.month || "",
            "Doanh thu": item.revenue || 0
          }))
        );
        XLSX.utils.book_append_sheet(workbook, monthlySheet, "Doanh thu theo tháng");
      }

      // 3. Top tour
      if (topTours.length > 0) {
        const topToursSheet = XLSX.utils.json_to_sheet(
          topTours.map((tour, index) => ({
            "Hạng": index + 1,
            "Tên tour": tour.name || "",
            "Số lượt đặt": tour.bookings || 0,
            "Tổng doanh thu": tour.revenue || 0
          }))
        );
        XLSX.utils.book_append_sheet(workbook, topToursSheet, "Top Tour");
      }

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `Bao_Cao_Thong_Ke_${year}${month ? `_Thang${month}` : ''}_${dateStr}.xlsx`;

      // Write file
      XLSX.writeFile(workbook, filename);
      
      alert(`✅ Đã xuất file Excel thành công: ${filename}`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("❌ Có lỗi xảy ra khi xuất file Excel: " + error.message);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "auto", padding: 20 }}>
      <h2 style={{ marginBottom: 25 }}>📊 Thống kê doanh thu & hoạt động</h2>

      {/* --- Bộ lọc thời gian --- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 15,
          marginBottom: 25,
        }}
      >
        <label>🗓️ Năm:</label>
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <label>📅 Tháng:</label>
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Tất cả</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              Tháng {i + 1}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setMonth("");
            setYear(currentYear);
            fetchData();
          }}
          style={{
            padding: "4px 10px",
            border: "1px solid #ccc",
            borderRadius: 4,
            background: "#f1f5f9",
            cursor: "pointer",
          }}
        >
          🔄 Làm mới
        </button>
        <button
          onClick={exportToExcel}
          style={{
            padding: "4px 10px",
            border: "1px solid #10b981",
            borderRadius: 4,
            background: "#10b981",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          📊 Xuất Excel
        </button>
      </div>

      {/* --- Tổng quan --- */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          background: "#f8fafc",
          borderRadius: 10,
          padding: 20,
          marginBottom: 40,
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h3>🏝️ Tổng tour</h3>
          <p style={{ fontSize: 26, fontWeight: "bold" }}>{stats.totalTours}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <h3>🧳 Lượt đặt tour</h3>
          <p style={{ fontSize: 26, fontWeight: "bold" }}>{stats.totalBookings}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <h3>💰 Tổng doanh thu</h3>
          <p style={{ fontSize: 26, fontWeight: "bold", color: "#16a34a" }}>
            {stats.totalRevenue.toLocaleString()} ₫
          </p>
        </div>
      </div>

      {/* --- Biểu đồ doanh thu theo tháng --- */}
      <h3 style={{ marginBottom: 10 }}>📈 Doanh thu theo tháng</h3>
      {monthlyRevenue.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>Chưa có dữ liệu doanh thu</p>
      ) : (
        <div style={{ width: "100%", height: 350, marginBottom: 40 }}>
          <ResponsiveContainer>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Doanh thu (₫)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* --- Top 5 tour đặt nhiều nhất --- */}
      <h3 style={{ marginBottom: 10 }}>🏆 Top 5 tour được đặt nhiều nhất</h3>
      {topTours.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>Chưa có dữ liệu top tour</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "center",
            background: "#fff",
            boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
          }}
        >
          <thead style={{ background: "#fff7ed" }}>
            <tr>
              <th>Hạng</th>
              <th>Tên tour</th>
              <th>Số lượt đặt</th>
              <th>Tổng doanh thu (₫)</th>
            </tr>
          </thead>
          <tbody>
            {topTours.map((t, index) => (
              <tr key={t.id}>
                <td>#{index + 1}</td>
                <td>{t.name}</td>
                <td>{t.bookings}</td>
                <td>{t.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 50, textAlign: "center", color: "#777" }}>
        <small>© WeTour Dashboard | Phiên bản quản trị nâng cao</small>
      </div>
    </div>
  );
}
