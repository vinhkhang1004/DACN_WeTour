import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function TourComparison() {
  const [tours, setTours] = useState([]);
  const [comparisonTours, setComparisonTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api
      .get("/tours")
      .then((res) => {
        const toursData = res.data || [];
        setTours(toursData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load comparison tours from localStorage
  useEffect(() => {
    const savedComparison = localStorage.getItem("comparisonTours");
    if (savedComparison) {
      setComparisonTours(JSON.parse(savedComparison));
    }
  }, []);

  // Save comparison tours to localStorage
  useEffect(() => {
    localStorage.setItem("comparisonTours", JSON.stringify(comparisonTours));
  }, [comparisonTours]);

  const addToComparison = (tour) => {
    if (comparisonTours.length >= 3) {
      alert("Bạn chỉ có thể so sánh tối đa 3 tour cùng lúc");
      return;
    }

    if (comparisonTours.some(t => t.id === tour.id)) {
      alert("Tour này đã có trong danh sách so sánh");
      return;
    }

    setComparisonTours([...comparisonTours, tour]);
  };

  const removeFromComparison = (tourId) => {
    setComparisonTours(comparisonTours.filter(tour => tour.id !== tourId));
  };

  const clearComparison = () => {
    setComparisonTours([]);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 24, color: "#0E7490" }}>🔄</div>
        <p style={{ marginTop: 16, color: "#64748b" }}>Đang tải danh sách tour...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: "#1e293b", marginBottom: "8px" }}>
          🔍 So sánh Tour
        </h1>
        <p style={{ color: "#64748b", margin: 0 }}>
          Chọn tối đa 3 tour để so sánh chi tiết
        </p>
      </div>

      {/* Comparison Status */}
      {comparisonTours.length > 0 && (
        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #0ea5e9",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, color: "#0c4a6e" }}>
                Đã chọn {comparisonTours.length}/3 tour để so sánh
              </h3>
              <p style={{ margin: "4px 0 0", color: "#0369a1", fontSize: "14px" }}>
                {comparisonTours.map(tour => tour.name).join(", ")}
              </p>
            </div>
            <button
              onClick={clearComparison}
              style={{
                padding: "8px 16px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {comparisonTours.length > 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            overflow: "hidden",
            marginBottom: "32px",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                    Tiêu chí
                  </th>
                  {comparisonTours.map((tour) => (
                    <th
                      key={tour.id}
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        borderBottom: "1px solid #e5e7eb",
                        minWidth: "250px",
                        position: "relative",
                      }}
                    >
                      <button
                        onClick={() => removeFromComparison(tour.id)}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          background: "none",
                          border: "none",
                          fontSize: "18px",
                          cursor: "pointer",
                          color: "#ef4444",
                        }}
                      >
                        ✕
                      </button>
                      <div>
                        <img
                          src={tour.image || "https://via.placeholder.com/200x120?text=Tour+Image"}
                          alt={tour.name}
                          style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            marginBottom: "8px",
                          }}
                        />
                        <h4 style={{ margin: "0 0 8px", fontSize: "16px", color: "#1e293b" }}>
                          {tour.name}
                        </h4>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "12px 16px", fontWeight: 600, background: "#f8fafc" }}>
                    Địa điểm
                  </td>
                  {comparisonTours.map((tour) => (
                    <td key={tour.id} style={{ padding: "12px 16px", textAlign: "center" }}>
                      📍 {tour.destination}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", fontWeight: 600, background: "#f8fafc" }}>
                    Thời gian
                  </td>
                  {comparisonTours.map((tour) => (
                    <td key={tour.id} style={{ padding: "12px 16px", textAlign: "center" }}>
                      ⏱️ {tour.duration}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", fontWeight: 600, background: "#f8fafc" }}>
                    Giá
                  </td>
                  {comparisonTours.map((tour) => (
                    <td key={tour.id} style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{ color: "#0ea5e9", fontWeight: 700, fontSize: "18px" }}>
                        {Number(tour.price).toLocaleString()} ₫
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", fontWeight: 600, background: "#f8fafc" }}>
                    Mô tả
                  </td>
                  {comparisonTours.map((tour) => (
                    <td key={tour.id} style={{ padding: "12px 16px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                        {tour.description || "Chưa có mô tả"}
                      </p>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", fontWeight: 600, background: "#f8fafc" }}>
                    Hành động
                  </td>
                  {comparisonTours.map((tour) => (
                    <td key={tour.id} style={{ padding: "12px 16px", textAlign: "center" }}>
                      <Link
                        to={`/tour/${tour.id}`}
                        style={{
                          display: "inline-block",
                          padding: "8px 16px",
                          background: "#0E7490",
                          color: "#fff",
                          textDecoration: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tours List */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          padding: "24px",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "20px", color: "#1e293b" }}>
          Danh sách Tour
        </h2>

        {tours.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: 48, marginBottom: "16px" }}>📋</div>
            <p style={{ color: "#64748b" }}>Chưa có tour nào</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {tours.map((tour) => {
              const isInComparison = comparisonTours.some(t => t.id === tour.id);
              const canAdd = comparisonTours.length < 3 && !isInComparison;

              return (
                <div
                  key={tour.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    transition: "all 0.3s ease",
                    position: "relative",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      src={tour.image || "https://via.placeholder.com/400x200?text=Tour+Image"}
                      alt={tour.name}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <button
                      onClick={() => addToComparison(tour)}
                      disabled={!canAdd}
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: canAdd ? "#0E7490" : "#9ca3af",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        cursor: canAdd ? "pointer" : "not-allowed",
                        fontSize: "14px",
                        fontWeight: 500,
                        opacity: canAdd ? 1 : 0.6,
                      }}
                    >
                      {isInComparison ? "✓ Đã chọn" : canAdd ? "+ So sánh" : "Đã đủ 3 tour"}
                    </button>
                  </div>
                  <div style={{ padding: "16px" }}>
                    <h3
                      style={{
                        margin: "0 0 8px",
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      {tour.name}
                    </h3>
                    <p
                      style={{
                        margin: "0 0 8px",
                        color: "#64748b",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      📍 {tour.destination}
                    </p>
                    <p
                      style={{
                        margin: "0 0 8px",
                        color: "#64748b",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      ⏱️ {tour.duration}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "12px",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          color: "#0ea5e9",
                          fontWeight: 700,
                          fontSize: "18px",
                        }}
                      >
                        {Number(tour.price).toLocaleString()} ₫
                      </p>
                      <Link
                        to={`/tour/${tour.id}`}
                        style={{
                          padding: "6px 12px",
                          background: "#f1f5f9",
                          color: "#0E7490",
                          textDecoration: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      >
                        Xem chi tiết →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



