import React, { useEffect, useState, useContext } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function TourList() {
  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [toursPerPage] = useState(12);
  const [wishlist, setWishlist] = useState([]);
  const [comparisonTours, setComparisonTours] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [availableDestinations, setAvailableDestinations] = useState([]);
  const [stats, setStats] = useState({ total: 0, minPrice: 0, maxPrice: 0 });
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    api
      .get("/tours")
      .then((res) => {
        const toursData = res.data || [];
        setTours(toursData);
        setFilteredTours(toursData);
        
        // Extract unique destinations
        const destinations = [...new Set(toursData.map(tour => tour.destination))];
        setAvailableDestinations(destinations);
        
        // Calculate stats
        if (toursData.length > 0) {
          const prices = toursData.map(tour => tour.price);
          setStats({
            total: toursData.length,
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices)
          });
        }
        
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load search parameters from URL
  useEffect(() => {
    const search = searchParams.get('search');
    const destination = searchParams.get('destination');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    
    if (search) setSearchTerm(search);
    if (destination) setSelectedDestination(destination);
    if (minPrice) setPriceRange(prev => ({ ...prev, min: minPrice }));
    if (maxPrice) setPriceRange(prev => ({ ...prev, max: maxPrice }));
  }, [searchParams]);

  // Load wishlist from localStorage
  useEffect(() => {
    if (user) {
      const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    }
  }, [user]);

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

  // Filter and sort tours
  useEffect(() => {
    let filtered = [...tours];

    // Filter by search term - chỉ tìm trong tên tour và điểm đến, không tìm trong description
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((tour) => {
        const tourNameLower = tour.name.toLowerCase();
        const tourDestLower = tour.destination?.toLowerCase() || "";
        
        // Chỉ tìm trong tên tour và điểm đến, không tìm trong description
        return tourNameLower.includes(searchLower) || tourDestLower.includes(searchLower);
      });
    }

    // Filter by destination
    if (selectedDestination) {
      filtered = filtered.filter((tour) => tour.destination === selectedDestination);
    }

    // Filter by price range
    if (priceRange.min) {
      filtered = filtered.filter((tour) => tour.price >= Number(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter((tour) => tour.price <= Number(priceRange.max));
    }

    // Filter by duration
    if (selectedDuration) {
      const [min, max] = selectedDuration.split('-').map(Number);
      filtered = filtered.filter((tour) => {
        const duration = parseInt(tour.duration);
        if (max) {
          return duration >= min && duration <= max;
        } else {
          return duration >= min;
        }
      });
    }

    // Filter by rating
    if (selectedRating) {
      const minRating = Number(selectedRating);
      filtered = filtered.filter((tour) => {
        return (tour.averageRating || 0) >= minRating;
      });
    }

    // Sort tours - ưu tiên tour có tên khớp khi search
    filtered.sort((a, b) => {
      // Nếu có searchTerm, ưu tiên tour có tên khớp trước
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase().trim();
        const aNameMatch = a.name.toLowerCase().includes(searchLower);
        const bNameMatch = b.name.toLowerCase().includes(searchLower);
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
      }
      
      // Sau đó sort theo sortBy/sortOrder
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "rating":
          aValue = a.averageRating || 0;
          bValue = b.averageRating || 0;
          break;
        case "duration":
          aValue = parseInt(a.duration) || 0;
          bValue = parseInt(b.duration) || 0;
          break;
        case "popularity":
          aValue = a.views || 0;
          bValue = b.views || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTours(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedDestination, priceRange, selectedDuration, selectedRating, tours, sortBy, sortOrder]);

  const toggleWishlist = (tour) => {
    if (!user) {
      alert("Bạn cần đăng nhập để thêm vào danh sách yêu thích");
      return;
    }

    const isInWishlist = wishlist.some(item => item.id === tour.id);
    let newWishlist;
    
    if (isInWishlist) {
      newWishlist = wishlist.filter(item => item.id !== tour.id);
    } else {
      newWishlist = [...wishlist, tour];
    }
    
    setWishlist(newWishlist);
    localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(newWishlist));
  };

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

  // Get unique destinations
  const destinations = [...new Set(tours.map((tour) => tour.destination))];

  // Pagination
  const indexOfLastTour = currentPage * toursPerPage;
  const indexOfFirstTour = indexOfLastTour - toursPerPage;
  const currentTours = filteredTours.slice(indexOfFirstTour, indexOfLastTour);
  const totalPages = Math.ceil(filteredTours.length / toursPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
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
      {/* Search and Filter Section */}
      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, color: "#1e293b" }}>
            🔍 Tìm kiếm Tour
          </h2>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: "14px" }}>Sắp xếp theo:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              style={{
                padding: "8px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "14px",
                background: "#fff",
              }}
            >
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
              <option value="rating-desc">Đánh giá cao nhất</option>
              <option value="duration-asc">Thời gian ngắn nhất</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          {/* Search Input */}
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
              Tìm kiếm theo tên:
            </label>
            <input
              type="text"
              placeholder="Nhập tên tour..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Destination Filter */}
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
              Địa điểm:
            </label>
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                background: "#fff",
              }}
            >
              <option value="">Tất cả địa điểm</option>
              {destinations.map((dest) => (
                <option key={dest} value={dest}>
                  {dest}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
              Giá từ (₫):
            </label>
            <input
              type="number"
              placeholder="Giá tối thiểu"
              value={priceRange.min}
              onChange={(e) =>
                setPriceRange({ ...priceRange, min: e.target.value })
              }
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
              Đến (₫):
            </label>
            <input
              type="number"
              placeholder="Giá tối đa"
              value={priceRange.max}
              onChange={(e) =>
                setPriceRange({ ...priceRange, max: e.target.value })
              }
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || selectedDestination || priceRange.min || priceRange.max) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedDestination("");
              setPriceRange({ min: "", max: "" });
            }}
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
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Comparison Status */}
      {comparisonTours.length > 0 && (
        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #0ea5e9",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "16px",
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
            <Link
              to="/compare"
              style={{
                padding: "8px 16px",
                background: "#0E7490",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Xem so sánh →
            </Link>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div style={{ marginBottom: "16px", color: "#64748b" }}>
        Tìm thấy <strong>{filteredTours.length}</strong> tour
        {(searchTerm || selectedDestination || priceRange.min || priceRange.max) &&
          ` (trong tổng số ${tours.length} tour)`}
      </div>

      {/* Tours Grid */}
      {filteredTours.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: "16px" }}>🔍</div>
          <p style={{ fontSize: "18px", color: "#64748b" }}>
            Không tìm thấy tour nào phù hợp với bộ lọc của bạn.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
              marginBottom: "32px",
            }}
          >
            {currentTours.map((tour) => {
            const isInWishlist = wishlist.some(item => item.id === tour.id);
            const isInComparison = comparisonTours.some(item => item.id === tour.id);
            const canAddToComparison = comparisonTours.length < 3 && !isInComparison;
            
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
                  cursor: "pointer",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
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
                        e.target.src =
                          "https://via.placeholder.com/400x250?text=Tour+Image";
                      }}
                    />
                    <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "8px" }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToComparison(tour);
                        }}
                        disabled={!canAddToComparison}
                        style={{
                          background: canAddToComparison ? "rgba(14, 116, 144, 0.9)" : "rgba(156, 163, 175, 0.9)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          cursor: canAddToComparison ? "pointer" : "not-allowed",
                          fontSize: "12px",
                          fontWeight: 500,
                          opacity: canAddToComparison ? 1 : 0.6,
                        }}
                      >
                        {isInComparison ? "✓ Đã chọn" : canAddToComparison ? "So sánh" : "Đã đủ 3"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(tour);
                        }}
                        style={{
                          background: isInWishlist ? "rgba(239, 68, 68, 0.9)" : "rgba(0,0,0,0.6)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.1)";
                          e.currentTarget.style.background = isInWishlist ? "rgba(239, 68, 68, 1)" : "rgba(0,0,0,0.8)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.background = isInWishlist ? "rgba(239, 68, 68, 0.9)" : "rgba(0,0,0,0.6)";
                        }}
                      >
                        {isInWishlist ? "❤️" : "🤍"}
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: "16px" }}>
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
            );
          })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                marginTop: "32px",
              }}
            >
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  background: currentPage === 1 ? "#f8fafc" : "#fff",
                  color: currentPage === 1 ? "#94a3b8" : "#374151",
                  borderRadius: "6px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                ← Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current page
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                        background: page === currentPage ? "#0E7490" : "#fff",
                        color: page === currentPage ? "#fff" : "#374151",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: page === currentPage ? 600 : 400,
                      }}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} style={{ color: "#94a3b8" }}>...</span>;
                }
                return null;
              })}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  background: currentPage === totalPages ? "#f8fafc" : "#fff",
                  color: currentPage === totalPages ? "#94a3b8" : "#374151",
                  borderRadius: "6px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                Sau →
              </button>
            </div>
          )}

          {/* Page Info */}
          <div style={{ textAlign: "center", marginTop: "16px", color: "#64748b", fontSize: "14px" }}>
            Hiển thị {indexOfFirstTour + 1}-{Math.min(indexOfLastTour, filteredTours.length)} trong tổng số {filteredTours.length} tour
          </div>
        </>
      )}
    </div>
  );
}