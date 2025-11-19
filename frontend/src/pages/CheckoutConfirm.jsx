import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useNotifications } from "../components/NotificationCenter";

export default function CheckoutConfirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tourId = params.get("tourId") || "";
  const [info, setInfo] = useState(null);
  const [payment, setPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [tour, setTour] = useState(null);
  const [promo, setPromo] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    const a = localStorage.getItem("checkout_info");
    const b = localStorage.getItem("checkout_payment");
    if (a) setInfo(JSON.parse(a));
    if (b) setPayment(JSON.parse(b));
    (async () => {
      try {
        if (tourId) {
          const res = await api.get(`/tours/${tourId}`);
          setTour(res.data);
        }
      } catch {}
      const p = localStorage.getItem("checkout_promo");
      if (p) setPromo(JSON.parse(p));
    })();
  }, []);

  const originalPrice = tour && info ? Number(tour.price) * Number(info.people || 1) : 0;
  const finalAmount = promo?.finalAmount || originalPrice;
  const discountAmount = promo?.discountAmount || 0;

  const handlePayment = async () => {
    if (!info || !tour || !payment) {
      showError("Thiếu thông tin đặt tour");
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create booking
      const bookingData = {
        tour_id: parseInt(tourId),
        people_count: parseInt(info.people) || 1,
        booking_date: info.date,
        payment_method: payment.method === "cash" ? null : payment.method,
        promotion_code: promo?.code || null,
      };

      const bookingRes = await api.post("/bookings", bookingData);
      const newBookingId = bookingRes.data.booking.id;
      setBookingId(newBookingId);

      // Step 2: Handle payment based on method
      if (payment.method === "cash") {
        // Cash payment - just redirect to success
        showSuccess("Đặt tour thành công! Bạn sẽ thanh toán khi nhận tour.");
        navigate(`/payment/result?status=success&bookingId=${newBookingId}&method=cash`);
      } else if (payment.method === "vnpay") {
        // Create VNPay payment URL
        const paymentRes = await api.post("/payments/vnpay/create", {
          booking_id: newBookingId,
        });
        // Redirect to VNPay
        window.location.href = paymentRes.data.paymentUrl;
      } else if (payment.method === "momo") {
        // Create MoMo payment URL
        const paymentRes = await api.post("/payments/momo/create", {
          booking_id: newBookingId,
        });
        // Redirect to MoMo
        window.location.href = paymentRes.data.paymentUrl;
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi thanh toán";
      showError(errorMessage);
      setSubmitting(false);
      
      // Navigate to failed result if we have booking ID
      if (bookingId) {
        navigate(`/payment/result?status=failed&bookingId=${bookingId}&method=${payment?.method || "unknown"}&message=${encodeURIComponent(errorMessage)}`);
      }
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>✅ Bước 3/3: Xác nhận</h1>
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Thông tin khách</div>
          <div>{info?.fullName}</div>
          <div>{info?.email} • {info?.phone}</div>
          <div>Ngày đi: {info?.date} • Số người: {info?.people}</div>
        </div>
        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Thanh toán</div>
          <div>Phương thức: {payment?.method?.toUpperCase()}</div>
          <div>Mã KM: {payment?.promo || "(không)"}</div>
        </div>
      </div>
      <div style={{ marginTop: 12, background: "#f8fafc", padding: 12, borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span>Tạm tính</span>
          <span>{Number(originalPrice).toLocaleString()} ₫</span>
        </div>
        {discountAmount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#16a34a" }}>
            <span>Giảm giá</span>
            <span>-{Number(discountAmount).toLocaleString()} ₫</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Tổng thanh toán</span>
          <span style={{ color: "#0ea5e9" }}>{Number(finalAmount).toLocaleString()} ₫</span>
        </div>
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button 
          onClick={()=>navigate(`/checkout/payment?tourId=${encodeURIComponent(tourId)}`)}
          style={{ padding: "10px 16px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}
        >
          Quay lại
        </button>
        <button 
          disabled={submitting} 
          onClick={handlePayment} 
          style={{ 
            background: submitting ? "#94a3b8" : "#16a34a", 
            color: "#fff", 
            border: "none", 
            padding: "10px 16px", 
            borderRadius: 6,
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
        >
          {submitting ? "Đang xử lý..." : payment?.method === "cash" ? "Xác nhận đặt tour" : "Thanh toán"}
        </button>
      </div>
    </div>
  );
}


