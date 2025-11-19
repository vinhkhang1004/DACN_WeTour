import React, { useEffect, useState } from "react";
import api from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    api.get("/stats/summary", { headers }).then((res) => setSummary(res.data));
    api.get("/stats/revenue-monthly", { headers }).then((res) => {
      const data = res.data.map((d) => ({
        month: `Tháng ${d.month}`,
        revenue: Number(d.revenue),
      }));
      setChartData(data);
    });
  }, []);

  return (
    <div style={{ maxWidth: 1000, margin: "auto", padding: 20 }}>
      <h2>📊 Thống kê tổng quan</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          margin: "24px 0",
        }}
      >
        <div style={{ background: "#0ea5e9", color: "#fff", borderRadius: 10, padding: 16 }}>
          <h3>Tổng Tour</h3>
          <p style={{ fontSize: 26, margin: 0 }}>{summary.totalTours || 0}</p>
        </div>
        <div style={{ background: "#22c55e", color: "#fff", borderRadius: 10, padding: 16 }}>
          <h3>Khách hàng</h3>
          <p style={{ fontSize: 26, margin: 0 }}>{summary.totalUsers || 0}</p>
        </div>
        <div style={{ background: "#f59e0b", color: "#fff", borderRadius: 10, padding: 16 }}>
          <h3>Đơn đặt tour</h3>
          <p style={{ fontSize: 26, margin: 0 }}>{summary.totalBookings || 0}</p>
        </div>
        <div style={{ background: "#ef4444", color: "#fff", borderRadius: 10, padding: 16 }}>
          <h3>Doanh thu</h3>
          <p style={{ fontSize: 26, margin: 0 }}>
            {(summary.totalRevenue || 0).toLocaleString()}₫
          </p>
        </div>
      </div>

      <h3>💹 Doanh thu theo tháng</h3>
      <div style={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(val) => `${val.toLocaleString()}₫`} />
            <Bar dataKey="revenue" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
