import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function PaymentResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const status = params.get("status") || "unknown";
  const method = params.get("method") || "";
  const bookingId = params.get("bookingId");
  const message = params.get("message");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  const success = status === "success";

  useEffect(() => {
    // Clear checkout data from localStorage
    localStorage.removeItem("checkout_info");
    localStorage.removeItem("checkout_payment");
    localStorage.removeItem("checkout_promo");

    // Fetch booking details if bookingId is provided
    if (bookingId) {
      setLoading(true);
      api
        .get(`/payments/status/${bookingId}`)
        .then((res) => {
          setBooking(res.data.booking);
        })
        .catch((err) => {
          console.error("Error fetching booking:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [bookingId]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 20, textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>
        {success ? "✅" : "❌"}
      </div>
      <h1 style={{ marginBottom: 8, fontSize: "28px", fontWeight: 700 }}>
        {success ? "Thanh toán thành công!" : "Thanh toán thất bại"}
      </h1>
      
      {message && (
        <p style={{ color: success ? "#16a34a" : "#ef4444", marginBottom: 16 }}>
          {decodeURIComponent(message)}
        </p>
      )}

      <div style={{ 
        background: "#f8fafc", 
        padding: 20, 
        borderRadius: 12, 
        margin: "20px 0",
        textAlign: "left"
      }}>
        <div style={{ marginBottom: 12 }}>
          <strong>Phương thức thanh toán:</strong>{" "}
          <span style={{ textTransform: "uppercase" }}>
            {method === "vnpay" ? "🏦 VNPay" : method === "momo" ? "💜 MoMo" : "💰 Tiền mặt"}
          </span>
        </div>
        
        {booking && (
          <>
            <div style={{ marginBottom: 12 }}>
              <strong>Mã đơn hàng:</strong> #{booking.id}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Trạng thái:</strong>{" "}
              <span style={{
                color: booking.status === "paid" ? "#16a34a" : "#64748b",
                fontWeight: 600
              }}>
                {booking.status === "paid" ? "Đã thanh toán" : 
                 booking.status === "pending" ? "Chờ thanh toán" : 
                 booking.status === "completed" ? "Hoàn thành" : "Đã hủy"}
              </span>
            </div>
            <div>
              <strong>Tổng tiền:</strong>{" "}
              <span style={{ color: "#0ea5e9", fontWeight: 700, fontSize: "18px" }}>
                {Number(booking.total_price).toLocaleString()} ₫
              </span>
            </div>
          </>
        )}
      </div>

      {success && (
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #86efac",
          padding: 16,
          borderRadius: 8,
          marginBottom: 20,
          color: "#166534"
        }}>
          <strong>✨ Đơn hàng của bạn đã được xác nhận!</strong>
          <p style={{ margin: "8px 0 0", fontSize: "14px" }}>
            Chúng tôi sẽ gửi email xác nhận đến bạn trong vài phút.
          </p>
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        <Link
          to="/tours"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "#f8fafc",
            color: "#1e293b",
            borderRadius: 8,
            textDecoration: "none",
            border: "1px solid #e5e7eb",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f1f5f9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f8fafc";
          }}
        >
          Quay lại danh sách tour
        </Link>
        <Link
          to="/my-bookings"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "#0E7490",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#0891b2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#0E7490";
          }}
        >
          Xem lịch sử đặt tour
        </Link>
      </div>
    </div>
  );
}


