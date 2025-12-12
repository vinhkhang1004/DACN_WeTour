import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function TourConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${id}`);
      setBooking(response.data);
    } catch (error) {
      console.error("Error fetching booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyBookingCode = () => {
    if (booking?.id) {
      const bookingCode = `GT-${String(booking.id).padStart(7, '0')}`;
      navigator.clipboard.writeText(bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, color: "#0E7490", marginBottom: "20px" }}>🔄</div>
        <h2 style={{ color: "#1e293b", marginBottom: "8px" }}>Đang tải thông tin...</h2>
        <p style={{ color: "#64748b" }}>Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, color: "#ef4444", marginBottom: "20px" }}>❌</div>
        <h2 style={{ color: "#1e293b", marginBottom: "8px" }}>Không tìm thấy đặt tour</h2>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>Đặt tour này có thể không tồn tại hoặc đã bị xóa</p>
        <Link
          to="/"
          style={{
            background: "#0E7490",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 500,
            textDecoration: "none",
            display: "inline-block"
          }}
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa xác định";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { 
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const tour = booking.Tour || {};
  const user = booking.User || {};
  const passengerName = booking.guest_name || user.name || "Khách hàng";
  const bookingCode = `GT-${String(booking.id).padStart(7, '0')}`;
  const images = tour.images ? tour.images.split(',').map(img => img.trim()) : [tour.image || "https://via.placeholder.com/800x500?text=Tour+Image"];

  // Parse adults and children from notes or use people_count as fallback
  const totalPeople = booking.people_count || 1;
  let adults = totalPeople;
  let children = 0;
  
  // Try to parse from notes
  if (booking.notes) {
    const peopleInfoMatch = booking.notes.match(/__PEOPLE_INFO__:(.+)$/);
    if (peopleInfoMatch) {
      try {
        const peopleInfo = JSON.parse(peopleInfoMatch[1]);
        adults = parseInt(peopleInfo.adults) || totalPeople;
        children = parseInt(peopleInfo.children) || 0;
      } catch (e) {
        console.error("Error parsing people info from notes:", e);
        // Fallback to totalPeople
        adults = totalPeople;
        children = 0;
      }
    }
  }
  
  // Ensure adults + children = totalPeople
  if (adults + children !== totalPeople) {
    // If mismatch, assume all are adults
    adults = totalPeople;
    children = 0;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Success Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
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
            margin: "0 auto 20px",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
          }}>
            ✓
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "12px", color: "#1e293b" }}>
            Chúc mừng! Bạn đã đặt tour thành công.
          </h1>
          <p style={{ fontSize: "16px", color: "#64748b", marginBottom: "24px" }}>
            Một email xác nhận với đầy đủ chi tiết đã được gửi đến hòm thư của bạn.
          </p>
          
          {/* Booking Code Box */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "16px",
            padding: "16px 24px",
            background: "#f1f5f9",
            borderRadius: "8px",
            marginTop: "16px"
          }}>
            <div style={{ fontSize: "14px", color: "#64748b" }}>
              Mã đặt tour của bạn: <strong style={{ color: "#0E7490", fontSize: "16px" }}>{bookingCode}</strong>
            </div>
            <button
              onClick={copyBookingCode}
              style={{
                padding: "6px 12px",
                background: "#fff",
                color: "#0E7490",
                border: "1px solid #0E7490",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 500,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#0E7490";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#fff";
                e.target.style.color = "#0E7490";
              }}
            >
              <span>📋</span>
              {copied ? "Đã sao chép!" : "Sao chép"}
            </button>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div style={{ display: "flex", gap: "32px", marginBottom: "40px", flexWrap: "wrap" }}>
          {/* Left: Tour Summary */}
          <div style={{ flex: 1, minWidth: "500px" }}>
            <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px", color: "#1e293b" }}>
                Tóm tắt đặt tour
              </h2>

              {/* Tour Image */}
              <div style={{ marginBottom: "20px", borderRadius: "8px", overflow: "hidden" }}>
                <img
                  src={images[0]}
                  alt={tour.name}
                  style={{
                    width: "100%",
                    height: "300px",
                    objectFit: "cover"
                  }}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/800x300?text=Tour+Image";
                  }}
                />
              </div>

              {/* Tour Name */}
              <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: "#1e293b" }}>
                {tour.name || "Tour du lịch"}
              </h3>

              {/* Tour Details - Two Columns */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "24px" }}>
                {/* Left Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>📅</span>
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Ngày khởi hành</div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                        {formatDate(booking.booking_date)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>👥</span>
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Số lượng người tham gia</div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                        {adults > 0 && `${adults} người lớn`}
                        {adults > 0 && children > 0 && ", "}
                        {children > 0 && `${children} trẻ em`}
                        {adults === 0 && children === 0 && `${totalPeople} người`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>🕐</span>
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Thời lượng</div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                        {tour.duration || "3 ngày, 2 đêm"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>🧳</span>
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Hành khách</div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                        {passengerName}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Price */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "20px",
                borderTop: "1px solid #e5e7eb"
              }}>
                <div style={{ fontSize: "16px", color: "#64748b" }}>
                  Tổng chi phí đã thanh toán
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#0E7490" }}>
                  {Number(booking.total_price || 0).toLocaleString()} VNĐ
                </div>
              </div>
            </div>
          </div>

          {/* Right: Next Steps */}
          <div style={{ width: "400px" }}>
            <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", color: "#1e293b" }}>
                Các bước tiếp theo
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Check Email */}
                <div style={{
                  padding: "20px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb"
                }}>
                  <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                    Kiểm tra email của bạn
                  </div>
                  <div style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6" }}>
                    Chúng tôi đã gửi về điện tử và tất cả thông tin chi tiết về chuyến đi. Đừng quên kiểm tra hộp thư spam nhé.
                  </div>
                </div>

                {/* Need Support */}
                <div style={{
                  padding: "20px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb"
                }}>
                  <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                    Cần hỗ trợ?
                  </div>
                  <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "12px", lineHeight: "1.6" }}>
                    Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ bộ phận hỗ trợ của chúng tôi 24/7.
                  </div>
                  <Link
                    to="/contact"
                    style={{
                      display: "inline-block",
                      color: "#0E7490",
                      fontSize: "14px",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = "#0891b2";
                      e.target.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = "#0E7490";
                      e.target.style.textDecoration = "none";
                    }}
                  >
                    Liên hệ hỗ trợ →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <Link
            to="/"
            style={{
              padding: "14px 32px",
              background: "#0E7490",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              transition: "all 0.2s",
              display: "inline-block"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#0891b2";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#0E7490";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Về trang chủ
          </Link>
          <Link
            to="/tours"
            style={{
              padding: "14px 32px",
              background: "#f1f5f9",
              color: "#1e293b",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              border: "1px solid #e5e7eb",
              transition: "all 0.2s",
              display: "inline-block"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#e2e8f0";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#f1f5f9";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Khám phá tour khác
          </Link>
        </div>
      </div>
    </div>
  );
}
