import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function FlightConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/flights/bookings/${id}`);
      setBooking(response.data);
    } catch (error) {
      console.error("Error fetching booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyBookingCode = () => {
    if (booking?.booking_code) {
      navigator.clipboard.writeText(booking.booking_code);
      alert("Đã sao chép mã đặt chỗ!");
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 20px" }}>Đang tải...</div>;
  }

  if (!booking) {
    return <div style={{ textAlign: "center", padding: "60px 20px" }}>Không tìm thấy đặt chỗ</div>;
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { 
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const passengers = booking.passengers ? (typeof booking.passengers === 'string' ? JSON.parse(booking.passengers) : booking.passengers) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 20px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Success Icon */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "#10b981",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
            margin: "0 auto 16px"
          }}>
            ✓
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "12px", color: "#1e293b" }}>
            Thanh toán thành công!
          </h1>
          <p style={{ fontSize: "16px", color: "#64748b" }}>
            Cảm ơn bạn đã đặt vé. Xác nhận đặt chỗ và vé điện tử đã được gửi đến email của bạn.
          </p>
        </div>

        {/* Flight Summary */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px", color: "#1e293b" }}>
            Tóm tắt chuyến bay
          </h2>

          <div style={{ marginBottom: "20px", padding: "16px", background: "#f0f9ff", borderRadius: "8px" }}>
            <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
              Mã đặt chỗ của bạn:
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0E7490" }}>
                {booking.booking_code}
              </div>
              <button
                onClick={copyBookingCode}
                style={{
                  padding: "6px 12px",
                  background: "#f0f9ff",
                  color: "#0E7490",
                  border: "1px solid #0E7490",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Sao chép mã
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px", fontSize: "14px", color: "#64748b", width: "150px" }}>Hành khách</td>
                  <td style={{ padding: "12px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                    {passengers.map((p, i) => (
                      <div key={i}>{p.full_name || `${p.last_name} ${p.first_name}`}</div>
                    ))}
                  </td>
                </tr>
                {booking.OutboundFlight && (
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>Chuyến đi</td>
                    <td style={{ padding: "12px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                      {booking.OutboundFlight.origin} ({booking.OutboundFlight.origin_code}) – {booking.OutboundFlight.destination} ({booking.OutboundFlight.destination_code})
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        {formatDate(booking.OutboundFlight.departure_date)}, {formatTime(booking.OutboundFlight.departure_date)}-{formatTime(booking.OutboundFlight.arrival_date)}
                      </div>
                    </td>
                  </tr>
                )}
                {booking.ReturnFlight && (
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>Chuyến về</td>
                    <td style={{ padding: "12px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                      {booking.ReturnFlight.origin} ({booking.ReturnFlight.origin_code}) – {booking.ReturnFlight.destination} ({booking.ReturnFlight.destination_code})
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        {formatDate(booking.ReturnFlight.departure_date)}, {formatTime(booking.ReturnFlight.departure_date)}-{formatTime(booking.ReturnFlight.arrival_date)}
                      </div>
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>Tổng thanh toán</td>
                  <td style={{ padding: "12px", fontSize: "18px", fontWeight: 700, color: "#0E7490" }}>
                    {Number(booking.total_price).toLocaleString()} VND
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "32px" }}>
          <Link
            to="/my-bookings"
            style={{
              padding: "12px 24px",
              background: "#0E7490",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600
            }}
          >
            Quản lý đặt chỗ
          </Link>
          <Link
            to="/"
            style={{
              padding: "12px 24px",
              background: "#f8fafc",
              color: "#1e293b",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              border: "1px solid #e5e7eb"
            }}
          >
            Về trang chủ
          </Link>
        </div>

        {/* Next Steps */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px", color: "#1e293b" }}>
            Các bước tiếp theo
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ fontSize: "32px" }}>📧</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px", color: "#1e293b" }}>
                  Kiểm tra Email của bạn
                </div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>
                  Chúng tôi đã gửi vé điện tử (e-ticket) và xác nhận chi tiết vào địa chỉ email bạn đã đăng ký.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ fontSize: "32px" }}>➕</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px", color: "#1e293b" }}>
                  Thêm dịch vụ bổ sung
                </div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>
                  Bạn có thể truy cập mục "Quản lý đặt chỗ" để mua thêm hành lý, chọn chỗ ngồi hoặc đặt suất ăn.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ fontSize: "32px" }}>📄</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px", color: "#1e293b" }}>
                  Chuẩn bị giấy tờ
                </div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>
                  Vui lòng mang theo giấy tờ tùy thân hợp lệ (CMND/CCCD, Hộ chiếu) và vé điện tử khi ra sân bay làm thủ tục.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









