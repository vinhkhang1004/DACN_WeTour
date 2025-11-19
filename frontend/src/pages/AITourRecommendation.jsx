import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export default function AITourRecommendation() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  
  const [formData, setFormData] = useState({
    preferences: "",
    budget: "",
    duration: "",
    destination: "",
    interests: "",
    travelStyle: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert("Vui lòng đăng nhập để sử dụng tính năng này");
      navigate("/login");
      return;
    }

    // Validate at least one field
    const hasData = Object.values(formData).some(val => val.trim() !== "");
    if (!hasData) {
      alert("Vui lòng điền ít nhất một thông tin để nhận gợi ý");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.post("/ai/recommend", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRecommendations(response.data);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      preferences: "",
      budget: "",
      duration: "",
      destination: "",
      interests: "",
      travelStyle: ""
    });
    setRecommendations(null);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "40px auto", padding: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: "#0E7490", marginBottom: 12 }}>
          🤖 AI Gợi ý Tour
        </h1>
        <p style={{ fontSize: 18, color: "#64748b" }}>
          Cho chúng tôi biết sở thích của bạn, AI sẽ tìm tour phù hợp nhất!
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 40 }}>
        {/* Form */}
        <div style={{ background: "#fff", padding: 32, borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: "#1e293b" }}>
            Thông tin của bạn
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                Điểm đến mong muốn
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="Ví dụ: Hà Nội, Sapa, Đà Lạt..."
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 16,
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                Ngân sách (VNĐ)
              </label>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="Ví dụ: 5 triệu, 10 triệu..."
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 16,
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                Thời gian (số ngày)
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Ví dụ: 3 ngày, 5 ngày..."
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 16,
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                Sở thích du lịch
              </label>
              <input
                type="text"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                placeholder="Ví dụ: Tham quan, Ẩm thực, Nghỉ dưỡng, Mạo hiểm..."
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 16,
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                Phong cách du lịch
              </label>
              <select
                value={formData.travelStyle}
                onChange={(e) => setFormData({ ...formData, travelStyle: e.target.value })}
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 16,
                  boxSizing: "border-box",
                  background: "#fff"
                }}
              >
                <option value="">Chọn phong cách...</option>
                <option value="Tiết kiệm">Tiết kiệm</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Cao cấp">Cao cấp</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#1e293b" }}>
                Ưu tiên/Sở thích khác
              </label>
              <textarea
                rows={3}
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                placeholder="Mô tả thêm về sở thích, yêu cầu đặc biệt của bạn..."
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box",
                  fontFamily: "inherit"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  background: loading ? "#94a3b8" : "#0E7490",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s"
                }}
              >
                {loading ? "⏳ Đang phân tích..." : "🤖 Nhận gợi ý AI"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: "14px 24px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                🔄 Đặt lại
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div style={{ background: "#fff", padding: 32, borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: "#1e293b" }}>
            Kết quả gợi ý
          </h2>

          {!recommendations && !loading && (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              <p style={{ fontSize: 16 }}>Điền thông tin và nhấn "Nhận gợi ý AI" để bắt đầu</p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
              <p style={{ fontSize: 16, color: "#64748b" }}>AI đang phân tích và tìm tour phù hợp...</p>
            </div>
          )}

          {recommendations && (
            <div>
              {recommendations.aiPowered && (
                <div style={{ 
                  background: "#dbeafe", 
                  padding: 12, 
                  borderRadius: 8, 
                  marginBottom: 20,
                  fontSize: 14,
                  color: "#1e40af"
                }}>
                  ✨ Được tạo bởi AI
                </div>
              )}

              {recommendations.reasoning && (
                <div style={{ 
                  background: "#f8fafc", 
                  padding: 16, 
                  borderRadius: 8, 
                  marginBottom: 24,
                  fontSize: 14,
                  color: "#475569",
                  lineHeight: 1.6
                }}>
                  <strong style={{ color: "#1e293b" }}>💡 Lý do gợi ý:</strong>
                  <p style={{ marginTop: 8, marginBottom: 0 }}>{recommendations.reasoning}</p>
                </div>
              )}

              {recommendations.tours && recommendations.tours.length > 0 ? (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "#1e293b" }}>
                    Tour được gợi ý ({recommendations.tours.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {recommendations.tours.map((tour) => (
                      <div
                        key={tour.id}
                        onClick={() => navigate(`/tour/${tour.id}`)}
                        style={{
                          padding: 16,
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#0E7490";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(14, 116, 144, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e5e7eb";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#1e293b" }}>
                          {tour.name}
                        </h4>
                        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
                          📍 {tour.destination} • ⏱️ {tour.duration} ngày
                        </p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: "#0E7490", margin: 0 }}>
                          {new Intl.NumberFormat("vi-VN").format(tour.price)} VNĐ
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                  <p>Không tìm thấy tour phù hợp. Vui lòng thử điều chỉnh tiêu chí.</p>
                </div>
              )}

              {recommendations.suggestions && (
                <div style={{ 
                  marginTop: 24,
                  padding: 16,
                  background: "#fef3c7",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#92400e"
                }}>
                  <strong>💬 Gợi ý bổ sung:</strong>
                  <p style={{ marginTop: 8, marginBottom: 0 }}>{recommendations.suggestions}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

