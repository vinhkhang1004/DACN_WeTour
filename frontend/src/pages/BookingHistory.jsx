import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api
      .get("/bookings/my", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setBookings(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const cancelBooking = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy tour này không?")) return;
    const token = localStorage.getItem("token");
    try {
      await api.put(`/bookings/cancel/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
      );
      alert("✅ Đã hủy tour thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi hủy tour");
    }
  };

  if (!user)
    return <p style={{ textAlign: "center" }}>🔒 Vui lòng đăng nhập để xem lịch sử đặt tour.</p>;

  if (loading) return <p style={{ textAlign: "center" }}>Đang tải lịch sử đặt tour...</p>;

  if (bookings.length === 0)
    return <p style={{ textAlign: "center" }}>Bạn chưa đặt tour nào.</p>;

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>Lịch sử đặt tour của bạn</h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 10,
          fontSize: 15,
        }}
      >
        <thead>
          <tr style={{ background: "#0E7490", color: "#fff" }}>
            <th style={{ padding: 10 }}>Tên tour</th>
            <th>Ngày khởi hành</th>
            <th>Số người</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{b.Tour?.name}</td>
              <td>{b.booking_date}</td>
              <td>{b.people_count}</td>
              <td>{Number(b.total_price).toLocaleString()} ₫</td>
              <td>
                {b.status === "pending" && <span style={{ color: "#d97706" }}>⏳ Chờ xác nhận</span>}
                {b.status === "paid" && <span style={{ color: "#059669" }}>✅ Đã thanh toán</span>}
                {b.status === "completed" && <span style={{ color: "#0ea5e9" }}>🌟 Hoàn thành</span>}
                {b.status === "cancelled" && <span style={{ color: "#ef4444" }}>❌ Đã hủy</span>}
              </td>
              <td>
                {b.status === "pending" && (
                  <button
                    onClick={() => cancelBooking(b.id)}
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Hủy tour
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
