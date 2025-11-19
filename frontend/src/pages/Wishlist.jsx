import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  // Load wishlist from localStorage
  useEffect(() => {
    if (user) {
      const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    }
    setLoading(false);
  }, [user]);

  // Save wishlist to localStorage
  useEffect(() => {
    if (user && wishlist.length >= 0) {
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  const addToWishlist = (tour) => {
    if (!user) {
      alert("Bạn cần đăng nhập để thêm vào danh sách yêu thích");
      return;
    }

    const isAlreadyInWishlist = wishlist.some(item => item.id === tour.id);
    if (isAlreadyInWishlist) {
      alert("Tour này đã có trong danh sách yêu thích");
      return;
    }

    setWishlist([...wishlist, tour]);
    alert("Đã thêm vào danh sách yêu thích!");
  };

  const removeFromWishlist = (tourId) => {
    setWishlist(wishlist.filter(item => item.id !== tourId));
  };

  const clearWishlist = () => {
    if (window.confirm("Bạn có chắc muốn xóa tất cả khỏi danh sách yêu thích?")) {
      setWishlist([]);
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: "20px" }}>🔒</div>
        <h2 style={{ marginBottom: "16px", color: "#1e293b" }}>
          Đăng nhập để xem danh sách yêu thích
        </h2>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>
          Bạn cần đăng nhập để lưu và quản lý danh sách tour yêu thích
        </p>
        <Link
          to="/login"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "#0E7490",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: 600,
          }}
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 24, color: "#0E7490" }}>🔄</div>
        <p style={{ marginTop: 16, color: "#64748b" }}>Đang tải danh sách yêu thích...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
          color: "#fff",
          padding: "60px 20px",
          textAlign: "center",
          borderRadius: "12px",
          marginBottom: "40px",
        }}
      >
        <h1 style={{ fontSize: "48px", margin: "0 0 20px", fontWeight: 700 }}>
          Danh sách yêu thích
        </h1>
        <p style={{ fontSize: "20px", margin: 0, opacity: 0.95 }}>
          Những tour bạn đã lưu để khám phá sau
        </p>
      </div>

      {/* Actions */}
      {wishlist.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#1e293b" }}>
              {wishlist.length} tour yêu thích
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b" }}>
              Quản lý danh sách tour của bạn
            </p>
          </div>
          <button
            onClick={clearWishlist}
            style={{
              padding: "10px 20px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Xóa tất cả
          </button>
        </div>
      )}

      {/* Wishlist Items */}
      {wishlist.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: "20px" }}>💝</div>
          <h3 style={{ marginBottom: "12px", color: "#1e293b" }}>
            Danh sách yêu thích trống
          </h3>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>
            Hãy khám phá và thêm những tour yêu thích vào danh sách
          </p>
          <Link
            to="/tours"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "#0E7490",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            Khám phá tour ngay
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {wishlist.map((tour) => (
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
              <Link
                to={`/tour/${tour.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{ position: "relative" }}>
                  <img
                    src={tour.image || "https://via.placeholder.com/400x250?text=Tour+Image"}
                    alt={tour.name}
                    style={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400x250?text=Tour+Image";
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFromWishlist(tour.id);
                    }}
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "rgba(239, 68, 68, 0.9)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 1)";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.9)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    ❤️
                  </button>
                </div>
                <div style={{ padding: "20px" }}>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#1e293b",
                      lineHeight: "1.4",
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
                      margin: "0 0 12px",
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
                    <span
                      style={{
                        padding: "6px 12px",
                        background: "#0E7490",
                        color: "#fff",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      Xem chi tiết →
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



