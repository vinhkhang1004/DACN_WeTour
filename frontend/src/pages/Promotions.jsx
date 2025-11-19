import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { id: "all", name: "Tất cả", icon: "🎯" },
    { id: "domestic", name: "Trong nước", icon: "🏔️" },
    { id: "international", name: "Quốc tế", icon: "✈️" },
    { id: "combo", name: "Combo", icon: "🎁" },
    { id: "early", name: "Early Bird", icon: "🐦" },
    { id: "special", name: "Đặc biệt", icon: "⭐" },
    { id: "flash", name: "Flash Sale", icon: "⚡" },
  ];

  useEffect(() => {
    fetchPromotions();
  }, [selectedCategory, searchTerm]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await api.get(`/promotions?${params.toString()}`);
      setPromotions(response.data.promotions || []);
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getDiscountText = (promotion) => {
    if (promotion.discount_type === "percentage") {
      return `Giảm ${promotion.discount_value}%`;
    } else {
      return `Giảm ${Number(promotion.discount_value).toLocaleString()} ₫`;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      domestic: "#10b981",
      international: "#3b82f6",
      combo: "#f59e0b",
      early: "#8b5cf6",
      special: "#ef4444",
      flash: "#f97316",
    };
    return colors[category] || "#6b7280";
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 24, color: "#0E7490" }}>🔄</div>
        <p style={{ marginTop: 16, color: "#64748b" }}>Đang tải khuyến mãi...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
          color: "#fff",
          padding: "80px 20px",
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
          <h1 style={{ fontSize: "48px", margin: "0 0 20px", fontWeight: 700 }}>
            🎁 Khuyến mãi & Ưu đãi
          </h1>
          <p style={{ fontSize: "20px", margin: 0, opacity: 0.95 }}>
            Tiết kiệm tối đa với các chương trình khuyến mãi hấp dẫn
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div
        style={{
          background: "#fff",
          padding: "28px",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          marginBottom: "30px",
          border: "1px solid #f1f5f9",
        }}
      >
        <h2 style={{ margin: "0 0 20px", color: "#1e293b", fontSize: "20px" }}>
          🔍 Tìm kiếm khuyến mãi
        </h2>
        
        <div style={{ display: "flex", gap: "20px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
              Tìm kiếm:
            </label>
            <input
              type="text"
              placeholder="Nhập tên hoặc mã khuyến mãi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#f59e0b"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "16px", fontWeight: 500, color: "#374151" }}>
            Danh mục:
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: "12px 16px",
                  background: selectedCategory === category.id ? "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)" : "#f8fafc",
                  color: selectedCategory === category.id ? "#fff" : "#475569",
                  border: selectedCategory === category.id ? "none" : "2px solid #e2e8f0",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.3s ease",
                  boxShadow: selectedCategory === category.id ? "0 4px 12px rgba(245, 158, 11, 0.3)" : "0 2px 4px rgba(0,0,0,0.05)",
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category.id) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                    e.target.style.borderColor = "#f59e0b";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category.id) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                    e.target.style.borderColor = "#e2e8f0";
                  }
                }}
              >
                <span style={{ fontSize: "16px" }}>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ marginBottom: "20px", color: "#64748b" }}>
        Tìm thấy <strong style={{ color: "#f59e0b" }}>{promotions.length}</strong> khuyến mãi
        {selectedCategory !== "all" && ` trong danh mục "${categories.find(c => c.id === selectedCategory)?.name}"`}
      </div>

      {/* Promotions Grid */}
      {promotions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: "16px" }}>🔍</div>
          <p style={{ fontSize: "18px", color: "#64748b" }}>
            Không tìm thấy khuyến mãi nào phù hợp.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "28px",
          }}
        >
          {promotions.map((promotion) => (
            <div
              key={promotion.id}
              style={{
                background: "#fff",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                border: "1px solid #e2e8f0",
                transition: "all 0.3s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
              }}
            >
              {/* Category Badge */}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: getCategoryColor(promotion.category),
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  zIndex: 1,
                }}
              >
                {categories.find(c => c.id === promotion.category)?.icon} {categories.find(c => c.id === promotion.category)?.name}
              </div>

              {/* Image */}
              <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
                <img
                  src={promotion.image || "https://via.placeholder.com/400x200?text=Promotion"}
                  alt={promotion.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x200?text=Promotion";
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    left: "16px",
                    background: "rgba(0,0,0,0.8)",
                    color: "#fff",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "18px",
                    fontWeight: 700,
                  }}
                >
                  {getDiscountText(promotion)}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: "24px" }}>
                <h3
                  style={{
                    margin: "0 0 12px",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#1e293b",
                    lineHeight: "1.3",
                  }}
                >
                  {promotion.title}
                </h3>

                {promotion.description && (
                  <p
                    style={{
                      margin: "0 0 16px",
                      color: "#64748b",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {promotion.description}
                  </p>
                )}

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "16px" }}>🏷️</span>
                    <span style={{ fontWeight: 600, color: "#374151" }}>Mã: {promotion.code}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "16px" }}>💰</span>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>
                      Đơn tối thiểu: {Number(promotion.min_amount).toLocaleString()} ₫
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px" }}>📅</span>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>
                      {formatDate(promotion.valid_from)} - {formatDate(promotion.valid_to)}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "16px",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div>
                    <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: "12px" }}>
                      Còn lại
                    </p>
                    <p style={{ margin: 0, color: "#f59e0b", fontSize: "16px", fontWeight: 600 }}>
                      {promotion.usage_limit ? 
                        `${promotion.usage_limit - promotion.usage_count} lượt` : 
                        "Không giới hạn"
                      }
                    </p>
                  </div>
                  <Link
                    to="/tours"
                    style={{
                      padding: "10px 20px",
                      background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
                      color: "#fff",
                      textDecoration: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 2px 8px rgba(245, 158, 11, 0.3)";
                    }}
                  >
                    Sử dụng ngay →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}