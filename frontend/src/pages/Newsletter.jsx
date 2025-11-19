import React, { useState } from "react";
import api from "../services/api";

export default function Newsletter() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/newsletter/subscribe", formData);
      setMessage("Đăng ký nhận tin thành công! Cảm ơn bạn đã quan tâm.");
      setIsSuccess(true);
      setFormData({ name: "", email: "" });
    } catch (error) {
      setMessage(error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/newsletter/unsubscribe", { email: formData.email });
      setMessage("Hủy đăng ký thành công!");
      setIsSuccess(true);
      setFormData({ name: "", email: "" });
    } catch (error) {
      setMessage(error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px" }}>
      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
          color: "#fff",
          padding: "60px 40px",
          textAlign: "center",
          borderRadius: "16px",
          marginBottom: "40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30px",
            left: "-30px",
            width: "150px",
            height: "150px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "36px", margin: "0 0 16px", fontWeight: 700 }}>
            📧 Newsletter
          </h1>
          <p style={{ fontSize: "18px", margin: 0, opacity: 0.95 }}>
            Nhận thông tin về tour mới nhất và ưu đãi đặc biệt
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <div
        style={{
          background: "#f8fafc",
          padding: "32px",
          borderRadius: "16px",
          marginBottom: "32px",
          border: "1px solid #e2e8f0",
        }}
      >
        <h2 style={{ margin: "0 0 20px", color: "#1e293b", fontSize: "24px" }}>
          🎁 Lợi ích khi đăng ký
        </h2>
        <div style={{ display: "grid", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "20px" }}>🔔</span>
            <span>Thông báo tour mới nhất và hot deals</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "20px" }}>💰</span>
            <span>Mã giảm giá độc quyền cho thành viên</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "20px" }}>📱</span>
            <span>Tips du lịch và kinh nghiệm hữu ích</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "20px" }}>🎯</span>
            <span>Ưu tiên đặt tour trong mùa cao điểm</span>
          </div>
        </div>
      </div>

      {/* Subscribe Form */}
      <div
        style={{
          background: "#fff",
          padding: "32px",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
        }}
      >
        <h2 style={{ margin: "0 0 24px", color: "#1e293b", fontSize: "24px" }}>
          Đăng ký nhận tin
        </h2>

        {message && (
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "20px",
              background: isSuccess ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
              color: isSuccess ? "#166534" : "#dc2626",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginBottom: "24px" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
              Họ và tên *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#0E7490"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#0E7490"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              background: loading ? "#94a3b8" : "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "18px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(14, 116, 144, 0.3)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(14, 116, 144, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(14, 116, 144, 0.3)";
              }
            }}
          >
            {loading ? "⏳ Đang xử lý..." : "📧 Đăng ký nhận tin"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span style={{ color: "#64748b" }}>hoặc</span>
        </div>

        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            background: loading ? "#f1f5f9" : "#fff",
            color: loading ? "#94a3b8" : "#ef4444",
            border: "2px solid #ef4444",
            borderRadius: "10px",
            fontSize: "18px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.background = "#ef4444";
              e.target.style.color = "#fff";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.background = "#fff";
              e.target.style.color = "#ef4444";
            }
          }}
        >
          {loading ? "⏳ Đang xử lý..." : "❌ Hủy đăng ký"}
        </button>
      </div>

      {/* Privacy Notice */}
      <div
        style={{
          background: "#f0f9ff",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #bae6fd",
          marginTop: "24px",
        }}
      >
        <h3 style={{ margin: "0 0 12px", color: "#0c4a6e", fontSize: "16px" }}>
          🔒 Cam kết bảo mật
        </h3>
        <p style={{ margin: 0, color: "#0369a1", fontSize: "14px", lineHeight: "1.6" }}>
          Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Email chỉ được sử dụng để gửi thông tin về tour du lịch và không được chia sẻ với bên thứ ba. Bạn có thể hủy đăng ký bất kỳ lúc nào.
        </p>
      </div>
    </div>
  );
}