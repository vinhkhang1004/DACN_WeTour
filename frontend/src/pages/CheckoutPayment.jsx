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

  const originalPrice = tour && info ? (Number(tour.price) * Number(info.people || 1)) : 0;

  const applyPromo = async () => {
    if (!promo.trim() || !originalPrice) return;
    setApplying(true);
    setPromoMsg("");
    try {
      const res = await api.get(`/promotions/code/${promo}?totalAmount=${originalPrice}`);
      localStorage.setItem("checkout_promo", JSON.stringify(res.data));
      setPromoMsg("Áp dụng thành công");
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
              <div style={{ fontSize: 24, marginBottom: 8 }}>💰</div>
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
      {originalPrice > 0 && (
        <div style={{ marginTop: 12, background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Tạm tính:</span>
            <span>{Number(originalPrice).toLocaleString()} ₫</span>
          </div>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <button onClick={handleNext} style={{ background: "#0E7490", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 6 }}>Tiếp tục</button>
      </div>
    </div>
  );
}


