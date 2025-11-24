import React, { useEffect, useState, useContext } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import SearchAutosuggest from "../components/SearchAutosuggest";

export default function TourListEnhanced() {
  const [tours, setTours] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentCounts, setRecentCounts] = useState({});
  const [hasTourPromo, setHasTourPromo] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [toursPerPage] = useState(12);
  const [wishlist, setWishlist] = useState([]);
  const [comparisonTours, setComparisonTours] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [availableDestinations, setAvailableDestinations] = useState([]);
  const [stats, setStats] = useState({ total: 0, minPrice: 0, maxPrice: 0 });
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  // Helper function to check if tour has valid dates
  const hasValidDates = (tour) => {
    let availableDates = [];
    if (tour?.available_dates) {
      try {
        availableDates = JSON.parse(tour.available_dates);
        if (!Array.isArray(availableDates)) availableDates = [];
      } catch {
        availableDates = [];
      }
    }
    
    // Lọc bỏ các ngày đã qua
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    availableDates = availableDates.filter(d => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date >= today;
    });
    
    if (availableDates.length > 0) return true;
    
    // Check departure_date
    if (tour?.departure_date) {
      const departureDate = new Date(tour.departure_date);
      departureDate.setHours(0, 0, 0, 0);
      return departureDate >= today;
    }
    
    // Nếu không có available_dates và departure_date, cho phép chọn tự do
    return true;
  };

  useEffect(() => {
    // Load tours and recent booking stats in parallel
    Promise.all([
      api.get("/tours"),
      api.get("/tours/stats/recent-bookings").catch(() => ({ data: {} })),
      api.get("/promotions", { params: { category: "tour", limit: 1 } }).catch(() => ({ data: { promotions: [] } })),
    ])
      .then(([toursRes, recentRes, promosRes]) => {
        const toursData = toursRes.data || [];
        setTours(toursData);
        setFilteredTours(toursData);
        setRecentCounts(recentRes.data || {});
        const promoList = (promosRes.data && promosRes.data.promotions) || [];
        setHasTourPromo(promoList.length > 0);
        
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
    setCurrentPage(1);
  }, [searchTerm, selectedDestination, priceRange, selectedDuration, selectedRating, tours, sortBy, sortOrder]);

  const toggleWishlist = (tour) => {
    if (!user) {
      alert("Bạn cần đăng nhập để thêm vào danh sách yêu thích");
      return;
    }

    const isInWishlist = wishlist.some((item) => item.id === tour.id);
    if (isInWishlist) {
      const newWishlist = wishlist.filter((item) => item.id !== tour.id);
      setWishlist(newWishlist);
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(newWishlist));
    } else {
      const newWishlist = [...wishlist, tour];
      setWishlist(newWishlist);
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(newWishlist));
    }
  };

  const toggleComparison = (tour) => {
    const isInComparison = comparisonTours.some((item) => item.id === tour.id);
    if (isInComparison) {
      setComparisonTours(comparisonTours.filter((item) => item.id !== tour.id));
    } else if (comparisonTours.length < 3) {
      setComparisonTours([...comparisonTours, tour]);
    } else {
      alert("Bạn chỉ có thể so sánh tối đa 3 tour");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDestination("");
    setPriceRange({ min: "", max: "" });
    setSelectedDuration("");
    setSelectedRating("");
    setSortBy("name");
    setSortOrder("asc");
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (selectedDestination) params.append('destination', selectedDestination);
    if (priceRange.min) params.append('minPrice', priceRange.min);
    if (priceRange.max) params.append('maxPrice', priceRange.max);
    setSearchParams(params);
  };

  useEffect(() => {
    updateURL();
  }, [searchTerm, selectedDestination, priceRange]);

  // Pagination
  const indexOfLastTour = currentPage * toursPerPage;
  const indexOfFirstTour = indexOfLastTour - toursPerPage;
  const currentTours = filteredTours.slice(indexOfFirstTour, indexOfLastTour);
  const totalPages = Math.ceil(filteredTours.length / toursPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} style={{ color: "#fbbf24" }}>★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" style={{ color: "#fbbf24" }}>☆</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} style={{ color: "#d1d5db" }}>☆</span>);
    }
    
    return stars;
  };

  const TourCard = ({ tour }) => (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        cursor: "pointer",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
    >
      {/* Wishlist & Comparison Buttons */}
      <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 2, display: "flex", gap: "8px" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(tour);
          }}
          style={{
            background: wishlist.some(item => item.id === tour.id) ? "#ef4444" : "rgba(255,255,255,0.9)",
            color: wishlist.some(item => item.id === tour.id) ? "#fff" : "#374151",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
          }}
        >
          {wishlist.some(item => item.id === tour.id) ? "❤️" : "🤍"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleComparison(tour);
          }}
          style={{
            background: comparisonTours.some(item => item.id === tour.id) ? "#0E7490" : "rgba(255,255,255,0.9)",
            color: comparisonTours.some(item => item.id === tour.id) ? "#fff" : "#374151",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
          }}
        >
          ⚖️
        </button>
      </div>

      <Link to={`/tour/${tour.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ position: "relative" }}>
          <img
            src={tour.image || "https://via.placeholder.com/400x250?text=Tour+Image"}
            alt={tour.name}
            style={{
              width: "100%",
              height: "220px",
              objectFit: "cover",
              display: "block",
            }}
            loading="lazy"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/400x250?text=Tour+Image";
            }}
          />
          
          {/* Rating Badge */}
          {tour.averageRating && (
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                background: "rgba(0,0,0,0.8)",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ⭐ {tour.averageRating.toFixed(1)}
            </div>
          )}

          {/* Recent bookings in last 24h */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              background: "rgba(255,255,255,0.95)",
              color: "#111827",
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              boxShadow: "0 1px 6px rgba(0,0,0,0.15)",
            }}
          >
            {Number(recentCounts[tour.id] || 0)} khách đặt/24h
          </div>

          {/* Promo Badge */}
          {hasTourPromo && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                background: "#f97316",
                color: "#fff",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 700,
                boxShadow: "0 1px 6px rgba(0,0,0,0.15)",
              }}
            >
              Ưu đãi
            </div>
          )}

          {/* Price Badge */}
          <div
            style={{
              position: "absolute",
              top: hasTourPromo ? "48px" : "12px",
              left: "12px",
              background: "#0E7490",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {Number(tour.price).toLocaleString()} ₫
          </div>

          {/* No Dates Badge */}
          {!hasValidDates(tour) && (
            <div
              style={{
                position: "absolute",
                top: hasTourPromo ? "48px" : "12px",
                right: "12px",
                background: "#ef4444",
                color: "#fff",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 700,
                boxShadow: "0 1px 6px rgba(0,0,0,0.15)",
              }}
            >
              ⚠️ Chưa có ngày
            </div>
          )}
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

          {tour.description && (
            <p
              style={{
                margin: "0 0 12px",
                color: "#64748b",
                fontSize: "14px",
                lineHeight: "1.5",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {tour.description}
            </p>
          )}

          {/* Rating Stars */}
          {tour.averageRating && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {renderStars(tour.averageRating)}
                <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "4px" }}>
                  ({tour.reviewCount || 0} đánh giá)
                </span>
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  padding: "6px 12px",
                  background: "#f0f9ff",
                  color: "#0E7490",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                Xem chi tiết →
              </span>
            </div>
            
            {tour.views && (
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                👁️ {tour.views} lượt xem
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, color: "#0E7490", marginBottom: "20px" }}>🔄</div>
        <h2 style={{ color: "#1e293b", marginBottom: "8px" }}>Đang tải tour...</h2>
        <p style={{ color: "#64748b" }}>Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
          color: "#fff",
          padding: "40px 20px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "36px", margin: "0 0 12px", fontWeight: 700 }}>
          🎯 Khám phá các tour du lịch
        </h1>
        <p style={{ fontSize: "18px", margin: "0 0 24px", opacity: 0.95 }}>
          Tìm kiếm và so sánh {stats.total} tour du lịch tuyệt vời
        </p>
        
        {/* Quick Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>{stats.total}</div>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Tour</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>
              {Number(stats.minPrice).toLocaleString()}
            </div>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Giá thấp nhất</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>
              {Number(stats.maxPrice).toLocaleString()}
            </div>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Giá cao nhất</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "flex", gap: "24px", marginBottom: "32px" }}>
          {/* Filters Sidebar */}
          <div
            style={{
              width: "300px",
              background: "#fff",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              height: "fit-content",
              position: "sticky",
              top: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#1e293b" }}>
                🔍 Bộ lọc
              </h3>
              <button
                onClick={clearFilters}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0E7490",
                  fontSize: "14px",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Xóa tất cả
              </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                Tìm kiếm
              </label>
              <div>
                <div style={{ marginBottom: 8 }}>
                  <SearchAutosuggest
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSelect={(item)=>{
                      setSearchTerm(item.name);
                      setSelectedDestination("");
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Destination Filter */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                Điểm đến
              </label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "#fff",
                  outline: "none",
                }}
              >
                <option value="">Tất cả điểm đến</option>
                {availableDestinations.map((dest) => (
                  <option key={dest} value={dest}>{dest}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                Khoảng giá (₫)
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="number"
                  placeholder="Từ"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                <input
                  type="number"
                  placeholder="Đến"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Duration Filter */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                Thời gian
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "#fff",
                  outline: "none",
                }}
              >
                <option value="">Tất cả thời gian</option>
                <option value="1-2">1-2 ngày</option>
                <option value="3-5">3-5 ngày</option>
                <option value="6-10">6-10 ngày</option>
                <option value="11">11+ ngày</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                Đánh giá tối thiểu
              </label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "#fff",
                  outline: "none",
                }}
              >
                <option value="">Tất cả đánh giá</option>
                <option value="4">4+ sao</option>
                <option value="3">3+ sao</option>
                <option value="2">2+ sao</option>
              </select>
            </div>

            {/* Active Filters Count */}
            {filteredTours.length !== tours.length && (
              <div
                style={{
                  background: "#f0f9ff",
                  border: "1px solid #0ea5e9",
                  borderRadius: "8px",
                  padding: "12px",
                  textAlign: "center",
                  color: "#0E7490",
                  fontSize: "14px",
                }}
              >
                Hiển thị {filteredTours.length} / {tours.length} tour
              </div>
            )}
          </div>

          {/* Main Content */}
          <div style={{ flex: 1 }}>
            {/* Toolbar */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#1e293b" }}>
                  {filteredTours.length} tour được tìm thấy
                </h2>
                
                {/* Sort Options */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ fontSize: "14px", color: "#64748b" }}>Sắp xếp:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      background: "#fff",
                      outline: "none",
                    }}
                  >
                    <option value="name">Tên A-Z</option>
                    <option value="price">Giá</option>
                    <option value="rating">Đánh giá</option>
                    <option value="duration">Thời gian</option>
                    <option value="popularity">Phổ biến</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    style={{
                      background: "none",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      padding: "8px",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setViewMode("grid")}
                  style={{
                    background: viewMode === "grid" ? "#0E7490" : "#f3f4f6",
                    color: viewMode === "grid" ? "#fff" : "#374151",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ⊞ Lưới
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  style={{
                    background: viewMode === "list" ? "#0E7490" : "#f3f4f6",
                    color: viewMode === "list" ? "#fff" : "#374151",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ☰ Danh sách
                </button>
              </div>
            </div>

            {/* Tours Grid/List */}
            {filteredTours.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: "16px" }}>🔍</div>
                <h3 style={{ margin: "0 0 8px", color: "#1e293b" }}>Không tìm thấy tour nào</h3>
                <p style={{ margin: "0 0 24px", color: "#64748b" }}>
                  Hãy thử điều chỉnh bộ lọc để tìm thấy tour phù hợp
                </p>
                <button
                  onClick={clearFilters}
                  style={{
                    background: "#0E7490",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: viewMode === "grid" ? "grid" : "flex",
                  gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(320px, 1fr))" : "1fr",
                  flexDirection: viewMode === "list" ? "column" : "row",
                  gap: "24px",
                }}
              >
                {currentTours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "40px",
                  padding: "20px",
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    background: currentPage === 1 ? "#f3f4f6" : "#fff",
                    color: currentPage === 1 ? "#9ca3af" : "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "14px",
                  }}
                >
                  ← Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    style={{
                      background: currentPage === number ? "#0E7490" : "#fff",
                      color: currentPage === number ? "#fff" : "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: "14px",
                      minWidth: "40px",
                    }}
                  >
                    {number}
                  </button>
                ))}

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    background: currentPage === totalPages ? "#f3f4f6" : "#fff",
                    color: currentPage === totalPages ? "#9ca3af" : "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "14px",
                  }}
                >
                  Sau →
                </button>
              </div>
            )}

            {/* Comparison Bar */}
            {comparisonTours.length > 0 && (
              <div
                style={{
                  position: "fixed",
                  bottom: "20px",
                  right: "20px",
                  background: "#0E7490",
                  color: "#fff",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  zIndex: 1000,
                }}
              >
                <span style={{ fontSize: "14px" }}>
                  {comparisonTours.length} tour được chọn
                </span>
                <Link
                  to="/compare"
                  style={{
                    background: "#fff",
                    color: "#0E7490",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  So sánh ngay →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

