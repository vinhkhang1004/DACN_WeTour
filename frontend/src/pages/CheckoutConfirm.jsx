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

  // Calculate total price including combo
  const tourPrice = tour && info ? Number(tour.price) * Number(info.people || 1) : 0;
  const hotelPrice = info?.selectedHotel ? (Number(info.selectedHotel.price_per_night) * 1) : 0; // Assuming 1 night
  const flightPrice = info?.selectedFlight ? (Number(info.selectedFlight.economy_price || info.selectedFlight.business_price || info.selectedFlight.first_class_price) * Number(info.people || 1)) : 0;
  const originalPrice = tourPrice + hotelPrice + flightPrice;
  const finalAmount = promo?.finalAmount || originalPrice;
  const discountAmount = promo?.discountAmount || 0;

  const handlePayment = async () => {
    if (!info || !tour || !payment) {
      showError("Thiếu thông tin đặt tour");
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create tour booking
      const bookingData = {
        tour_id: parseInt(tourId),
        people_count: parseInt(info.people) || 1,
        booking_date: info.date,
        payment_method: payment.method === "cash" ? null : payment.method,
        promotion_code: null, // We'll apply promotion to combo total, not individual bookings
        notes: info.notes || null,
      };

      const bookingRes = await api.post("/bookings", bookingData);
      const newBookingId = bookingRes.data.booking.id;
      setBookingId(newBookingId);

      // Step 2: Create hotel booking if selected
      let hotelBookingId = null;
      if (info?.selectedHotel) {
        try {
          // Calculate check-in and check-out dates (assuming check-in is tour date, check-out is next day)
          const checkInDate = new Date(info.date);
          const checkOutDate = new Date(checkInDate);
          checkOutDate.setDate(checkOutDate.getDate() + 1);
          
          const hotelBookingData = {
            hotel_id: info.selectedHotel.id,
            check_in: checkInDate.toISOString().split('T')[0],
            check_out: checkOutDate.toISOString().split('T')[0],
            rooms: 1,
            adults: parseInt(info.people) || 1,
            children: 0,
            guest_name: info.fullName,
            guest_email: info.email,
            guest_phone: info.phone,
            promotion_code: null, // Promotion applied to combo total
          };
          
          const hotelBookingRes = await api.post(`/hotels/${info.selectedHotel.id}/book`, hotelBookingData);
          hotelBookingId = hotelBookingRes.data.booking?.id;
        } catch (error) {
          console.error("Error creating hotel booking:", error);
          // Continue with tour booking even if hotel booking fails
        }
      }

      // Step 3: Create flight booking if selected
      let flightBookingId = null;
      if (info?.selectedFlight) {
        try {
          const flightBookingData = {
            return_flight_id: null,
            passengers: parseInt(info.people) || 1,
            class_type: "economy",
            passenger_info: Array(parseInt(info.people) || 1).fill(null).map((_, i) => ({
              full_name: info.fullName,
              email: info.email,
              phone: info.phone,
              date_of_birth: "",
              nationality: "VN"
            })),
            contact_email: info.email,
            contact_phone: info.phone,
            promotion_code: null, // Promotion applied to combo total
          };
          
          const flightBookingRes = await api.post(`/flights/${info.selectedFlight.id}/book`, flightBookingData);
          flightBookingId = flightBookingRes.data.booking?.id;
        } catch (error) {
          console.error("Error creating flight booking:", error);
          // Continue with tour booking even if flight booking fails
        }
      }

      // Step 4: Apply promotion to combo total if promo code exists
      // Note: This is a simplified approach. In production, you might want to create a combo booking record
      // For now, we'll apply the discount proportionally or just to the tour booking
      if (promo?.code && (info?.selectedHotel || info?.selectedFlight)) {
        // Apply promotion discount proportionally to tour booking
        // The actual implementation might need backend support for combo bookings
        try {
          // For now, we'll just note that promotion was applied to combo
          // Backend should handle the actual discount calculation
        } catch (error) {
          console.error("Error applying combo promotion:", error);
        }
      }

      // Step 5: Handle payment based on method
      if (payment.method === "cash") {
        // Cash payment - redirect to success
        const comboType = info?.selectedHotel && info?.selectedFlight ? "combo_all" : 
                         info?.selectedHotel ? "combo_tour_hotel" : 
                         info?.selectedFlight ? "combo_tour_flight" : "tour";
        showSuccess("Đặt tour thành công! Bạn sẽ thanh toán khi nhận tour.");
        navigate(`/payment/result?status=success&bookingId=${newBookingId}&method=cash&type=${comboType}`);
      } else if (payment.method === "vnpay") {
        // Create VNPay payment URL for tour booking (combo payment would need special handling)
        const paymentRes = await api.post("/payments/vnpay/create", {
          booking_id: newBookingId,
          amount: finalAmount, // Use combo total amount
        });
        // Redirect to VNPay
        window.location.href = paymentRes.data.paymentUrl;
      } else if (payment.method === "momo") {
        // Create MoMo payment URL for tour booking
        const paymentRes = await api.post("/payments/momo/create", {
          booking_id: newBookingId,
          amount: finalAmount, // Use combo total amount
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
          <div>Mã KM: {promo?.code || payment?.promo || "(không)"}</div>
        </div>
        {(info?.selectedHotel || info?.selectedFlight) && (
          <div style={{ background: "#f0f9ff", padding: 12, borderRadius: 8, border: "1px solid #bae6fd" }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: "#0E7490" }}>📦 Đơn hàng Combo</div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Tour: {tour?.name}</div>
            {info?.selectedHotel && (
              <div style={{ fontSize: 14, marginBottom: 4 }}>Khách sạn: {info.selectedHotel.name}</div>
            )}
            {info?.selectedFlight && (
              <div style={{ fontSize: 14 }}>Chuyến bay: {info.selectedFlight.flight_number}</div>
            )}
          </div>
        )}
      </div>
      <div style={{ marginTop: 12, background: "#f8fafc", padding: 12, borderRadius: 8 }}>
        {(info?.selectedHotel || info?.selectedFlight) ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>Tour:</span>
              <span>{Number(tourPrice).toLocaleString()} ₫</span>
            </div>
            {info?.selectedHotel && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>Khách sạn:</span>
                <span>{Number(hotelPrice).toLocaleString()} ₫</span>
              </div>
            )}
            {info?.selectedFlight && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>Chuyến bay:</span>
                <span>{Number(flightPrice).toLocaleString()} ₫</span>
              </div>
            )}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span>Tạm tính</span>
              <span>{Number(originalPrice).toLocaleString()} ₫</span>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span>Tạm tính</span>
            <span>{Number(originalPrice).toLocaleString()} ₫</span>
          </div>
        )}
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


