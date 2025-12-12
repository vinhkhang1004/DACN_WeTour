import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [filteredWishlist, setFilteredWishlist] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const itemsPerPage = 8;

  // Load wishlist from localStorage
  useEffect(() => {
    if (user) {
      const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        setWishlist(parsed);
      }
    }
    setLoading(false);
  }, [user]);

  // Filter wishlist based on active filter
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredWishlist(wishlist.filter(item => item.type !== "flight"));
    } else {
      setFilteredWishlist(wishlist.filter(item => item.type === activeFilter));
    }
    setCurrentPage(1); // Reset to first page when filter changes
  }, [wishlist, activeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredWishlist.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredWishlist.slice(startIndex, endIndex);

  const removeFromWishlist = (itemId) => {
    const newWishlist = wishlist.filter(item => item.id !== itemId);
    setWishlist(newWishlist);
    if (user) {
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(newWishlist));
    }
  };

  const formatPrice = (price, type) => {
    if (!price) return "Liên hệ";
    const formatted = Number(price).toLocaleString('vi-VN');
    if (type === "hotel") {
      return `Từ ${formatted} VND/đêm`;
    } else if (type === "tour") {
      return `Từ ${formatted} VNĐ/người`;
    } else {
      return `Từ ${formatted} VND`;
    }
  };

  const getItemLink = (item) => {
    if (item.type === "hotel") {
      return `/hotel/${item.id}`;
    } else if (item.type === "tour") {
      return `/tour/${item.id}`;
    } else if (item.type === "experience") {
      return `/experience/${item.id}`;
    }
    return "#";
  };

  const getItemButtonText = (item) => {
    if (item.type === "hotel" || item.type === "experience") {
      return "Xem chi tiết";
    }
    return "Xem chi tiết";
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: "20px" }}>🔒</div>
        <h2 style={{ marginBottom: "16px", color: "#1e293b" }}>
          Đăng nhập để xem danh sách yêu thích
        </h2>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>
          Bạn cần đăng nhập để lưu và quản lý danh sách yêu thích
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
    <div style={{ padding: "40px 20px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ 
          fontSize: "40px", 
          fontWeight: 700, 
          marginBottom: "12px", 
          color: "#1e293b" 
        }}>
          Wishlist của tôi
        </h1>
        <p style={{ 
          fontSize: "16px", 
          color: "#64748b",
          lineHeight: "1.6"
        }}>
          Tất cả những nơi bạn đã lưu. Hãy biến chuyến đi tiếp theo thành hiện thực!
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        marginBottom: "32px",
        borderBottom: "2px solid #e5e7eb",
        paddingBottom: "16px"
      }}>
        {[
          { id: "all", label: "Tất cả" },
          { id: "hotel", label: "Khách sạn" },
          { id: "experience", label: "Trải nghiệm" },
          { id: "tour", label: "Tour" }
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "none",
              borderBottom: activeFilter === filter.id ? "3px solid #0E7490" : "3px solid transparent",
              color: activeFilter === filter.id ? "#0E7490" : "#64748b",
              fontWeight: activeFilter === filter.id ? 600 : 500,
              fontSize: "15px",
              cursor: "pointer",
              transition: "all 0.2s",
              marginBottom: "-16px",
              paddingBottom: "13px"
            }}
            onMouseEnter={(e) => {
              if (activeFilter !== filter.id) {
                e.target.style.color = "#0E7490";
              }
            }}
            onMouseLeave={(e) => {
              if (activeFilter !== filter.id) {
                e.target.style.color = "#64748b";
              }
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Wishlist Items Grid */}
      {filteredWishlist.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "80px 20px",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontSize: 64, marginBottom: "20px" }}>💝</div>
          <h3 style={{ marginBottom: "12px", color: "#1e293b" }}>
            Danh sách yêu thích trống
          </h3>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>
            {activeFilter === "all" 
              ? "Hãy khám phá và thêm những nơi yêu thích vào danh sách"
              : `Chưa có ${activeFilter === "hotel" ? "khách sạn" : activeFilter === "tour" ? "tour" : "trải nghiệm"} nào trong danh sách yêu thích`}
          </p>
          <Link
            to={activeFilter === "hotel" ? "/hotels" : activeFilter === "tour" ? "/tours" : "/"}
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
            Khám phá ngay
          </Link>
        </div>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
            marginBottom: "40px"
          }}>
            {currentItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
              >
                {/* Image */}
                <div style={{ position: "relative", width: "100%", height: "200px", overflow: "hidden" }}>
                  <img
                    src={item.image || "https://via.placeholder.com/400x250?text=Image"}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block"
                    }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400x250?text=Image";
                    }}
                  />
                  {/* Heart Icon */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFromWishlist(item.id);
                    }}
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "24px",
                      padding: "4px",
                      transition: "transform 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    ❤️
                  </button>
                </div>

                {/* Content */}
                <div style={{ padding: "20px" }}>
                  <h3 style={{
                    margin: "0 0 8px",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1e293b",
                    lineHeight: "1.4",
                    minHeight: "50px"
                  }}>
                    {item.name}
                  </h3>
                  
                  {item.destination && (
                    <p style={{
                      margin: "0 0 8px",
                      color: "#64748b",
                      fontSize: "14px"
                    }}>
                      {item.destination}
                    </p>
                  )}
                  
                  {item.description && (
                    <p style={{
                      margin: "0 0 12px",
                      color: "#64748b",
                      fontSize: "14px",
                      lineHeight: "1.5"
                    }}>
                      {item.description}
                    </p>
                  )}

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid #e5e7eb"
                  }}>
                    <p style={{
                      margin: 0,
                      color: "#0E7490",
                      fontWeight: 600,
                      fontSize: "16px"
                    }}>
                      {formatPrice(item.price, item.type)}
                    </p>
                    <Link
                      to={getItemLink(item)}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      style={{
                        padding: "8px 16px",
                        background: "#0E7490",
                        color: "#fff",
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: 500,
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "#0891b2";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "#0E7490";
                      }}
                    >
                      {getItemButtonText(item)}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              marginTop: "40px"
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 12px",
                  background: currentPage === 1 ? "#f1f5f9" : "#fff",
                  color: currentPage === 1 ? "#94a3b8" : "#1e293b",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "14px"
                }}
              >
                ←
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: "8px 12px",
                    minWidth: "40px",
                    background: currentPage === page ? "#0E7490" : "#fff",
                    color: currentPage === page ? "#fff" : "#1e293b",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: currentPage === page ? 600 : 400,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== page) {
                      e.target.style.background = "#f1f5f9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== page) {
                      e.target.style.background = "#fff";
                    }
                  }}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 12px",
                  background: currentPage === totalPages ? "#f1f5f9" : "#fff",
                  color: currentPage === totalPages ? "#94a3b8" : "#1e293b",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "14px"
                }}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
