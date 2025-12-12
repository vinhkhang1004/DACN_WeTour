import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function HotelConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/hotels/bookings/${id}`);
      setBooking(response.data);
    } catch (error) {
      console.error("Error fetching booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyBookingCode = () => {
    if (booking?.id) {
      navigator.clipboard.writeText(`HOTEL${booking.id}`);
      alert("Đã sao chép mã đặt phòng!");
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 20px" }}>Đang tải...</div>;
  }

  if (!booking) {
    return <div style={{ textAlign: "center", padding: "60px 20px" }}>Không tìm thấy đặt phòng</div>;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { 
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const hotel = booking.Hotel || {};
  const user = booking.User || {};
  const guestName = booking.guest_name || user.name || "Khách hàng";
  
  // Tính số đêm
  const checkIn = new Date(booking.check_in_date);
  const checkOut = new Date(booking.check_out_date);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

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
            Cảm ơn bạn đã đặt phòng. Xác nhận đặt phòng và thông tin chi tiết đã được gửi đến email của bạn.
          </p>
        </div>

        {/* Hotel Summary */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px", color: "#1e293b" }}>
            Tóm tắt đặt phòng
          </h2>

          <div style={{ marginBottom: "20px", padding: "16px", background: "#f0f9ff", borderRadius: "8px" }}>
            <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
              Mã đặt phòng của bạn:
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0E7490" }}>
                HOTEL{booking.id}
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
                  <td style={{ padding: "12px", fontSize: "14px", color: "#64748b", width: "150px" }}>Khách hàng</td>
                  <td style={{ padding: "12px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                    {guestName}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>Khách sạn</td>
                  <td style={{ padding: "12px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                    {hotel.name || "N/A"}
                    {hotel.location && (
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        Địa điểm: {hotel.location}
                      </div>
                    )}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>Ngày nhận phòng</td>
                  <td style={{ padding: "12px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                    {formatDate(booking.check_in_date)}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>Ngày trả phòng</td>
                  <td style={{ padding: "12px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                    {formatDate(booking.check_out_date)}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>Số đêm</td>
                  <td style={{ padding: "12px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                    {nights} đêm
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>Số phòng</td>
                  <td style={{ padding: "12px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                    {booking.rooms || 1} phòng
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>Tổng thanh toán</td>
                  <td style={{ padding: "12px", fontSize: "18px", fontWeight: 700, color: "#0E7490" }}>
                    {Number(booking.total_price || 0).toLocaleString()} VND
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
            Quản lý đặt phòng
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
                  Chúng tôi đã gửi xác nhận đặt phòng và thông tin chi tiết vào địa chỉ email bạn đã đăng ký.
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
                  Bạn có thể truy cập mục "Quản lý đặt phòng" để thêm dịch vụ, thay đổi thông tin hoặc hủy đặt phòng.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ fontSize: "32px" }}>📄</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px", color: "#1e293b" }}>
                  Chuẩn bị cho chuyến đi
                </div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>
                  Vui lòng mang theo giấy tờ tùy thân hợp lệ (CMND/CCCD, Hộ chiếu) và xác nhận đặt phòng khi đến khách sạn làm thủ tục nhận phòng.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}








