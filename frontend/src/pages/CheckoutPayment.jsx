import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function CheckoutPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tourId = params.get("tourId") || "";
  const [method, setMethod] = useState("vnpay");
  const [promo, setPromo] = useState("");
  const [info, setInfo] = useState(null);
  const [tour, setTour] = useState(null);
  const [applying, setApplying] = useState(false);
  const [promoMsg, setPromoMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("checkout_info");
    if (saved) setInfo(JSON.parse(saved));
    (async () => {
      try {
        if (tourId) {
          const res = await api.get(`/tours/${tourId}`);
          setTour(res.data);
        }
      } catch {}
    })();
  }, []);

  // Auto-apply combo promotion when combo is selected
  useEffect(() => {
    const autoApplyComboPromo = async () => {
      // Only auto-apply if combo is selected and no promo is already applied
      if (!(info?.selectedHotel || info?.selectedFlight)) return;
      if (promo.trim()) return; // Don't override if user already entered a promo
      
      const savedPromo = localStorage.getItem("checkout_promo");
      if (savedPromo) {
        try {
          const promoData = JSON.parse(savedPromo);
          if (promoData.code) return; // Already has a promo applied
        } catch {}
      }

      if (!originalPrice || originalPrice <= 0) return;

      try {
        const serviceType = getServiceType();
        
        // Fetch available promotions for this service type
        const promotionsRes = await api.get(`/promotions?service_type=${serviceType}&active=true&limit=50`);
        const promotions = promotionsRes.data?.promotions || promotionsRes.data || [];
        
        // Find the first valid combo promotion
        for (const promotion of promotions) {
          if (!promotion.code) continue;
          
          // Skip if not a combo promotion (only apply combo-specific promotions)
          if (promotion.service_type && 
              !["tour_hotel", "tour_flight", "hotel_flight", "all"].includes(promotion.service_type)) {
            continue;
          }
          
          try {
            const checkRes = await api.post(`/promotions/check`, {
              code: promotion.code,
              amount: originalPrice,
              service_type: serviceType
            });
            
            if (checkRes.data.valid) {
              // Auto-apply this promotion
              localStorage.setItem("checkout_promo", JSON.stringify({
                code: promotion.code,
                discountAmount: checkRes.data.discount_amount,
                finalAmount: originalPrice - checkRes.data.discount_amount,
                promotion: checkRes.data.promotion
              }));
              setPromo(promotion.code);
              setPromoMsg(`✅ Đã tự động áp dụng mã khuyến mãi combo: ${promotion.code}`);
              break; // Only apply the first valid one
            }
          } catch (e) {
            // Continue to next promotion
            continue;
          }
        }
      } catch (error) {
        console.error("Error auto-applying combo promotion:", error);
        // Silently fail - user can still manually enter promo code
      }
    };

    // Only run when info is loaded and combo is selected
    if (info && (info.selectedHotel || info.selectedFlight) && tour && originalPrice > 0) {
      autoApplyComboPromo();
    }
  }, [info, tour, originalPrice]);

  // Calculate total price including combo
  const tourPrice = tour && info ? (Number(tour.price) * Number(info.people || 1)) : 0;
  const hotelPrice = info?.selectedHotel ? (Number(info.selectedHotel.price_per_night) * 1) : 0; // Assuming 1 night, can be adjusted
  const flightPrice = info?.selectedFlight ? (Number(info.selectedFlight.economy_price || info.selectedFlight.business_price || info.selectedFlight.first_class_price) * Number(info.people || 1)) : 0;
  const originalPrice = tourPrice + hotelPrice + flightPrice;

  // Determine service_type for promotion check
  const getServiceType = () => {
    if (info?.selectedHotel && info?.selectedFlight) {
      return "all"; // All services
    } else if (info?.selectedHotel) {
      return "tour_hotel"; // Tour + Hotel combo
    } else if (info?.selectedFlight) {
      return "tour_flight"; // Tour + Flight combo
    }
    return "tour"; // Only tour
  };

  const applyPromo = async () => {
    if (!promo.trim() || !originalPrice) return;
    setApplying(true);
    setPromoMsg("");
    try {
      const serviceType = getServiceType();
      const res = await api.post(`/promotions/check`, {
        code: promo.trim().toUpperCase(),
        amount: originalPrice,
        service_type: serviceType
      });
      
      if (res.data.valid) {
        localStorage.setItem("checkout_promo", JSON.stringify({
          code: promo.trim().toUpperCase(),
          discountAmount: res.data.discount_amount,
          finalAmount: originalPrice - res.data.discount_amount,
          promotion: res.data.promotion
        }));
        setPromoMsg("Áp dụng thành công");
      } else {
        localStorage.removeItem("checkout_promo");
        setPromoMsg(res.data.message || "Mã không hợp lệ");
      }
    } catch (e) {
      localStorage.removeItem("checkout_promo");
      setPromoMsg(e.response?.data?.message || "Mã không hợp lệ");
    } finally {
      setApplying(false);
    }
  };

  const handleNext = () => {
    localStorage.setItem("checkout_payment", JSON.stringify({ method, promo }));
    navigate(`/checkout/confirm?tourId=${encodeURIComponent(tourId)}`);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>💳 Bước 2/3: Thanh toán</h1>
      <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>Thông tin</div>
        <div style={{ fontSize: 14 }}>{info?.fullName} • {info?.email} • {info?.phone}</div>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ display: "block", marginBottom: 12, fontWeight: 600 }}>Phương thức thanh toán</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div
              onClick={() => setMethod("vnpay")}
              style={{
                border: method === "vnpay" ? "2px solid #0E7490" : "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 16,
                cursor: "pointer",
                background: method === "vnpay" ? "#f0f9ff" : "#fff",
                textAlign: "center",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>🏦</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>VNPay</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Thẻ ngân hàng</div>
            </div>
            <div
              onClick={() => setMethod("momo")}
              style={{
                border: method === "momo" ? "2px solid #0E7490" : "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 16,
                cursor: "pointer",
                background: method === "momo" ? "#f0f9ff" : "#fff",
                textAlign: "center",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>💜</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>MoMo</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Ví điện tử</div>
            </div>
            <div
              onClick={() => setMethod("cash")}
              style={{
                border: method === "cash" ? "2px solid #0E7490" : "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 16,
                cursor: "pointer",
                background: method === "cash" ? "#f0f9ff" : "#fff",
                textAlign: "center",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>💵</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Tiền mặt</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Thanh toán sau</div>
            </div>
          </div>
        </div>
        <div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Mã khuyến mãi (tuỳ chọn)" value={promo} onChange={e=>setPromo(e.target.value.toUpperCase())} />
            <button disabled={applying || !promo.trim()} onClick={applyPromo} style={{ background: "#0E7490", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6 }}>
              {applying ? "Đang áp dụng..." : "Áp dụng"}
            </button>
          </div>
          {!!promoMsg && (
            <div style={{ marginTop: 8, fontSize: 12, color: promoMsg.includes("thành công") ? "#16a34a" : "#ef4444" }}>{promoMsg}</div>
          )}
        </div>
      </div>
      {/* Combo Booking Summary */}
      {(info?.selectedHotel || info?.selectedFlight) && (
        <div style={{ marginTop: 12, background: "#f0f9ff", padding: 16, borderRadius: 8, fontSize: 14, border: "1px solid #bae6fd" }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: "#0E7490", fontSize: "16px" }}>📦 Đơn hàng Combo</div>
          
          {/* Tour Details */}
          <div style={{ marginBottom: 12, padding: 12, background: "#fff", borderRadius: 6 }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>Tour</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: 8 }}>{info?.tour?.name || "Tour đã chọn"}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, color: "#1e293b", paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
              <span>Tổng tour:</span>
              <span>{Number(tourPrice).toLocaleString()} ₫</span>
            </div>
          </div>

          {/* Hotel Details */}
          {info?.selectedHotel && (
            <div style={{ marginBottom: 12, padding: 12, background: "#fff", borderRadius: 6 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>Khách sạn</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: 8 }}>{info.selectedHotel.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, color: "#1e293b", paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
                <span>Tổng khách sạn:</span>
                <span>{Number(hotelPrice).toLocaleString()} ₫</span>
              </div>
            </div>
          )}

          {/* Flight Details */}
          {info?.selectedFlight && (
            <div style={{ marginBottom: 12, padding: 12, background: "#fff", borderRadius: 6 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>Chuyến bay</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: 8 }}>{info.selectedFlight.flight_number} - {info.selectedFlight.airline}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, color: "#1e293b", paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
                <span>Tổng chuyến bay:</span>
                <span>{Number(flightPrice).toLocaleString()} ₫</span>
              </div>
            </div>
          )}

          {/* Total */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "2px solid #bae6fd", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "16px", color: "#0E7490" }}>
            <span>Tổng cộng:</span>
            <span style={{ fontSize: "20px" }}>{Number(originalPrice).toLocaleString()} ₫</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#15803d", background: "#dcfce7", padding: 8, borderRadius: 4 }}>
            💡 Bạn có thể áp dụng mã khuyến mãi combo để giảm giá!
          </div>
        </div>
      )}

      {originalPrice > 0 && !(info?.selectedHotel || info?.selectedFlight) && (
        <div style={{ marginTop: 12, background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Tạm tính:</span>
            <span>{Number(originalPrice).toLocaleString()} ₫</span>
          </div>
        </div>
      )}

      {/* Promotion discount display */}
      {(() => {
        const savedPromo = localStorage.getItem("checkout_promo");
        if (savedPromo) {
          try {
            const promoData = JSON.parse(savedPromo);
            if (promoData.discountAmount > 0) {
              return (
                <div style={{ marginTop: 12, background: "#dcfce7", padding: 12, borderRadius: 8, fontSize: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>Giảm giá ({promoData.code}):</span>
                    <span style={{ color: "#16a34a" }}>-{Number(promoData.discountAmount).toLocaleString()} ₫</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, marginTop: 8, paddingTop: 8, borderTop: "1px solid #86efac" }}>
                    <span>Thành tiền:</span>
                    <span style={{ color: "#0E7490" }}>{Number(promoData.finalAmount).toLocaleString()} ₫</span>
                  </div>
                </div>
              );
            }
          } catch (e) {}
        }
        return null;
      })()}
      <div style={{ marginTop: 16 }}>
        <button onClick={handleNext} style={{ background: "#0E7490", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 6 }}>Tiếp tục</button>
      </div>
    </div>
  );
}


