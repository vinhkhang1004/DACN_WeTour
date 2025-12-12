import React, { useEffect, useState, useContext } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import SearchAutosuggest from "../components/SearchAutosuggest";
import { matchesSearch, normalizeSearchTerm } from "../utils/vietnameseUtils";

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
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedDepartureDate, setSelectedDepartureDate] = useState("");
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

    // Filter by search term - hỗ trợ tìm kiếm không dấu
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((tour) => {
        // Tìm kiếm có dấu (case-insensitive)
        const nameMatch = tour.name.toLowerCase().includes(searchLower);
        const destMatch = tour.destination?.toLowerCase().includes(searchLower) || false;
        
        // Tìm kiếm không dấu
        const nameMatchNoAccent = matchesSearch(tour.name, searchTerm);
        const destMatchNoAccent = matchesSearch(tour.destination || "", searchTerm);
        
        return nameMatch || destMatch || nameMatchNoAccent || destMatchNoAccent;
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
      if (selectedDuration === "7+") {
        filtered = filtered.filter((tour) => {
          const duration = parseInt(tour.duration) || 0;
          return duration >= 7;
        });
      } else {
        const [min, max] = selectedDuration.split('-').map(Number);
        filtered = filtered.filter((tour) => {
          const duration = parseInt(tour.duration) || 0;
          return duration >= min && duration <= max;
        });
      }
    }

    // Filter by rating
    if (selectedRating) {
      const minRating = Number(selectedRating);
      filtered = filtered.filter((tour) => {
        return (tour.averageRating || 0) >= minRating;
      });
    }

    // Filter by departure date
    if (selectedDepartureDate) {
      const selectedDate = new Date(selectedDepartureDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter((tour) => {
        // Check departure_date
        if (tour.departure_date) {
          const departureDate = new Date(tour.departure_date);
          departureDate.setHours(0, 0, 0, 0);
          if (departureDate.getTime() === selectedDate.getTime()) {
            return true;
          }
        }
        
        // Check available_dates
        if (tour.available_dates) {
          try {
            const availableDates = typeof tour.available_dates === 'string' 
              ? JSON.parse(tour.available_dates) 
              : tour.available_dates;
            
            if (Array.isArray(availableDates)) {
              return availableDates.some(dateStr => {
                const date = new Date(dateStr);
                date.setHours(0, 0, 0, 0);
                return date.getTime() === selectedDate.getTime();
              });
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        return false;
      });
    }

    // Filter by tour type/category
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((tour) => {
        const tourCategory = (tour.category || "").trim();
        const tourCategories = tour.categories ? (typeof tour.categories === 'string' ? tour.categories.split(',').map(c => c.trim()) : tour.categories) : [];
        const relatedCategories = tour.Categories ? tour.Categories.map(c => c.name) : [];
        
        // Check if tour category matches any selected type
        return selectedTypes.some(selectedType => {
          const selectedLower = selectedType.toLowerCase().trim();
          
          // Check tour.category field
          if (tourCategory.toLowerCase() === selectedLower) return true;
          
          // Check tour.categories (comma-separated string)
          if (tourCategories.length > 0) {
            if (tourCategories.some(cat => cat.toLowerCase().trim() === selectedLower)) return true;
          }
          
          // Check related Categories from database
          if (relatedCategories.length > 0) {
            if (relatedCategories.some(cat => cat.toLowerCase().trim() === selectedLower)) return true;
          }
          
          // Partial match for flexibility (case-insensitive)
          const categoryLower = tourCategory.toLowerCase();
          if (selectedType === "Nghỉ dưỡng" && (categoryLower.includes("nghỉ") || categoryLower.includes("dưỡng"))) return true;
          if (selectedType === "Khám phá" && (categoryLower.includes("khám") || categoryLower.includes("phá"))) return true;
          if (selectedType === "Mạo hiểm" && (categoryLower.includes("mạo") || categoryLower.includes("hiểm"))) return true;
          if (selectedType === "Văn hóa" && (categoryLower.includes("văn") || categoryLower.includes("hóa") || categoryLower.includes("van") || categoryLower.includes("hoa"))) return true;
          if (selectedType === "Thư giãn" && (categoryLower.includes("thư") || categoryLower.includes("giãn") || categoryLower.includes("thu") || categoryLower.includes("gian"))) return true;
          
          // Check in related categories with partial match
          if (relatedCategories.length > 0) {
            for (const cat of relatedCategories) {
              const catLower = cat.toLowerCase();
              if (selectedType === "Nghỉ dưỡng" && (catLower.includes("nghỉ") || catLower.includes("dưỡng"))) return true;
              if (selectedType === "Khám phá" && (catLower.includes("khám") || catLower.includes("phá"))) return true;
              if (selectedType === "Mạo hiểm" && (catLower.includes("mạo") || catLower.includes("hiểm"))) return true;
            }
          }
          
          return false;
        });
      });
    }

    // Sort tours
    filtered.sort((a, b) => {
      // Sort by popularity (default) - by rating and review count
      if (sortBy === "popularity") {
        const aRating = a.averageRating || 0;
        const bRating = b.averageRating || 0;
        const aReviews = a.reviewCount || 0;
        const bReviews = b.reviewCount || 0;
        
        // Sort by rating first, then by review count
        if (bRating !== aRating) {
          return bRating - aRating;
        }
        return bReviews - aReviews;
      }
      
      // Nếu có searchTerm, ưu tiên tour có tên khớp trước (cả có dấu và không dấu)
      if (searchTerm && sortBy !== "popularity") {
        const searchLower = searchTerm.toLowerCase().trim();
        const aNameMatch = a.name.toLowerCase().includes(searchLower) || matchesSearch(a.name, searchTerm);
        const bNameMatch = b.name.toLowerCase().includes(searchLower) || matchesSearch(b.name, searchTerm);
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
      }
      
      // Sau đó sort theo sortBy/sortOrder (nếu không phải popularity)
      if (sortBy === "popularity") {
        // Already sorted above
        return 0;
      }
      
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
  }, [searchTerm, selectedDestination, priceRange, selectedDuration, selectedRating, selectedTypes, selectedDepartureDate, tours, sortBy, sortOrder]);

  const [showNotification, setShowNotification] = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setShowNotification({ type, message });
    setTimeout(() => {
      setShowNotification({ type: "", message: "" });
    }, 3000);
  };

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
      showToast("info", `Đã xóa "${tour.name}" khỏi wishlist`);
    } else {
      const newWishlist = [...wishlist, tour];
      setWishlist(newWishlist);
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(newWishlist));
      showToast("success", `Đã thêm "${tour.name}" vào wishlist`);
    }
  };

  const toggleComparison = (tour) => {
    const isInComparison = comparisonTours.some((item) => item.id === tour.id);
    if (isInComparison) {
      setComparisonTours(comparisonTours.filter((item) => item.id !== tour.id));
      showToast("info", `Đã xóa "${tour.name}" khỏi so sánh`);
    } else if (comparisonTours.length < 3) {
      setComparisonTours([...comparisonTours, tour]);
      showToast("success", `Đã thêm "${tour.name}" vào so sánh`);
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
    setSelectedTypes([]);
    setSelectedDepartureDate("");
    setSortBy("name");
    setSortOrder("asc");
  };

  const toggleTypeFilter = (type) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
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

  const TourCard = ({ tour, viewMode = "grid" }) => {
    const navigate = useNavigate();
    
    // Use useEffect to hide any elements containing only "0"
    React.useEffect(() => {
      const cardElement = document.querySelector(`[data-tour-card-id="${tour.id}"]`);
      if (cardElement) {
        // Find all text nodes and hide those containing only "0"
        const walker = document.createTreeWalker(
          cardElement,
          NodeFilter.SHOW_TEXT,
          null
        );
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.trim() === "0" && node.textContent.trim().length === 1) {
            const parent = node.parentElement;
            if (parent && parent.children.length === 0) {
              parent.style.display = "none";
            } else {
              node.textContent = "";
            }
          }
        }
        
        // Also hide any elements with only "0" as text content
        const allElements = cardElement.querySelectorAll("*");
        allElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text === "0" && el.children.length === 0 && !el.querySelector("*")) {
            el.style.display = "none";
          }
        });
      }
    }, [tour.id]);

    return (
    <div
      data-tour-card-id={tour.id}
      onClick={() => navigate(`/tour/${tour.id}`)}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        transition: "all 0.3s ease",
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: viewMode === "list" ? "row" : "column",
        width: viewMode === "list" ? "100%" : "auto",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
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
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: `1px solid ${wishlist.some(item => item.id === tour.id) ? "rgba(239, 68, 68, 0.5)" : "rgba(255, 255, 255, 0.3)"}`,
            background: wishlist.some(item => item.id === tour.id) ? "rgba(239, 68, 68, 0.8)" : "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(239, 68, 68, 0.9)";
            e.target.style.borderColor = "rgba(239, 68, 68, 0.7)";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            if (!wishlist.some(item => item.id === tour.id)) {
              e.target.style.background = "rgba(255, 255, 255, 0.2)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
            }
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
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: `1px solid ${comparisonTours.some(item => item.id === tour.id) ? "rgba(14, 116, 144, 0.5)" : "rgba(255, 255, 255, 0.3)"}`,
            background: comparisonTours.some(item => item.id === tour.id) ? "rgba(14, 116, 144, 0.8)" : "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(14, 116, 144, 0.9)";
            e.target.style.borderColor = "rgba(14, 116, 144, 0.7)";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            if (!comparisonTours.some(item => item.id === tour.id)) {
              e.target.style.background = "rgba(255, 255, 255, 0.2)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
            }
            e.target.style.transform = "scale(1)";
          }}
        >
          ⚖️
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, flexDirection: viewMode === "list" ? "row" : "column" }}>
        <div style={{ position: "relative", width: viewMode === "list" ? "300px" : "100%", flexShrink: 0 }}>
          <img
            src={tour.image || "https://via.placeholder.com/400x250?text=Tour+Image"}
            alt={tour.name}
            style={{
              width: "100%",
              height: viewMode === "list" ? "200px" : "200px",
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

          {/* Recent bookings in last 24h - Only show if > 0 */}
          {Number(recentCounts[tour.id] || 0) > 0 && (
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
              {Number(recentCounts[tour.id])} khách đặt/24h
            </div>
          )}

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

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1, gap: "12px" }}>
          <div>
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
            
            {/* Rating */}
            {tour.averageRating && (tour.reviewCount || 0) > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                <span style={{ color: "#fbbf24", fontSize: "16px" }}>⭐</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                  {tour.averageRating.toFixed(1)}
                </span>
                <span style={{ fontSize: "14px", color: "#64748b" }}>
                  ({tour.reviewCount} đánh giá)
                </span>
              </div>
            )}
            
            {/* Description */}
            <p
              style={{
                margin: "0 0 16px",
                color: "#64748b",
                fontSize: "14px",
                lineHeight: "1.5",
                display: "-webkit-box",
                WebkitLineClamp: viewMode === "list" ? 3 : 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {(() => {
                let desc = tour.description || `${tour.duration}, từ ${tour.destination || "Hà Nội"}`;
                // Remove "Ngày 0" and standalone "0"s more aggressively
                desc = desc
                  .replace(/Ngày\s*0[:\s]+/gi, '') // Remove "Ngày 0:"
                  .replace(/^\s*0\s*$/gm, '') // Remove lines with just "0"
                  .replace(/^\s*0\s+/gm, '') // Remove "0" at start of lines
                  .replace(/\s+0\s*$/gm, '') // Remove "0" at end of lines
                  .replace(/\s+0\s+/g, ' ') // Remove standalone "0" between words
                  .replace(/^0\s+/g, '') // Remove "0" at start of string
                  .replace(/\s+0$/g, '') // Remove "0" at end of string
                  .replace(/\b0\b/g, '') // Remove any standalone "0" word
                  .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
                  .trim();
                return desc;
              })()}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "auto",
              paddingTop: "12px",
              borderTop: "1px solid #e5e7eb"
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
              Giá từ {new Intl.NumberFormat("vi-VN").format(tour.price)}₫
            </div>
            <Link
              to={`/tour/${tour.id}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#0ea5e9",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "background 0.2s",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#0284c7";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#0ea5e9";
              }}
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
    );
  };

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
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Global CSS to hide standalone "0" elements */}
      <style>{`
        [data-tour-card-id] * {
          position: relative;
        }
        [data-tour-card-id] *:not(script):not(style):not(img):not(svg):not(input):not(button):not(select) {
          font-size: inherit;
        }
        [data-tour-card-id] *:not(script):not(style):not(img):not(svg):not(input):not(button):not(select):empty {
          display: none !important;
        }
      `}</style>
      {/* Toast Notification */}
      {showNotification.message && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: showNotification.type === "success" ? "#10b981" : "#3b82f6",
            color: "#fff",
            padding: "16px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "15px",
            fontWeight: 500,
            animation: "slideIn 0.3s ease-out",
            maxWidth: "400px"
          }}
        >
          <span style={{ fontSize: "20px" }}>
            {showNotification.type === "success" ? "✅" : "ℹ️"}
          </span>
          <span>{showNotification.message}</span>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 20px" }}>
        {/* Header with Background Image */}
        <div 
          style={{ 
            position: "relative",
            textAlign: "center", 
            marginBottom: "40px",
            borderRadius: "16px",
            overflow: "hidden",
            minHeight: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        >
          {/* Overlay for better text readability */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(14, 116, 144, 0.85) 0%, rgba(15, 118, 110, 0.75) 100%)",
            zIndex: 1
          }} />
          
          {/* Content */}
          <div style={{ position: "relative", zIndex: 2, padding: "60px 20px" }}>
            <h1 style={{ 
              fontSize: "42px", 
              margin: "0 0 16px", 
              fontWeight: 700, 
              color: "#fff",
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
              lineHeight: "1.2"
            }}>
              Khám phá Tour Du Lịch Ước Mơ Của Bạn
            </h1>
            <p style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.95)",
              margin: 0,
              textShadow: "0 1px 5px rgba(0,0,0,0.2)"
            }}>
              Tìm kiếm và đặt chỗ cho chuyến đi trong mơ của bạn
            </p>
          </div>
        </div>

        {/* Results Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "24px",
          gap: "16px",
          flexWrap: "wrap"
        }}>
          <div style={{ fontSize: "16px", color: "#64748b" }}>
            Tìm thấy {filteredTours.length} tour phù hợp
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* View Mode Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#f1f5f9", borderRadius: "8px", padding: "4px" }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "6px",
                  background: viewMode === "grid" ? "#0E7490" : "transparent",
                  color: viewMode === "grid" ? "#fff" : "#64748b",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>⊞</span>
                <span>Lưới</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "6px",
                  background: viewMode === "list" ? "#0E7490" : "transparent",
                  color: viewMode === "list" ? "#fff" : "#64748b",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>☰</span>
                <span>Danh sách</span>
              </button>
            </div>
            <span style={{ fontSize: "14px", color: "#64748b" }}>Sắp xếp theo:</span>
            <select
              value={sortBy === "popularity" ? "popularity" : `${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "popularity") {
                  setSortBy("popularity");
                } else {
                  const [newSortBy, newSortOrder] = value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder || "asc");
                }
              }}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                background: "#fff",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="popularity">Phổ biến nhất</option>
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
              <option value="rating-desc">Đánh giá cao nhất</option>
              <option value="duration-asc">Thời gian ngắn nhất</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: "24px", marginBottom: "32px" }}>
          {/* Filters Sidebar */}
          <div
            style={{
              width: "280px",
              minWidth: "280px",
              maxWidth: "280px",
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              height: "fit-content",
              position: "sticky",
              top: "20px",
              boxSizing: "border-box",
              overflow: "hidden"
            }}
          >
            <h4 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
              🔍 Bộ lọc tìm kiếm
            </h4>

            {/* Search Input - Điểm đến hoặc tên tour */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151", fontSize: "14px" }}>
                Điểm đến hoặc tên tour
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nhập điểm đến"
                  style={{
                    width: "100%",
                    padding: "12px 40px 12px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#fff",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <span style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "18px",
                  color: "#64748b",
                  cursor: "pointer"
                }}>
                  🔍
                </span>
              </div>
            </div>

            {/* Price Range */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151", fontSize: "14px" }}>
                Ngân sách
              </label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="number"
                  placeholder="Từ"
                  value={priceRange.min || ""}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    minWidth: 0, // Allow flex item to shrink
                    width: "100%"
                  }}
                />
                <input
                  type="number"
                  placeholder="Đến"
                  value={priceRange.max || ""}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    minWidth: 0, // Allow flex item to shrink
                    width: "100%"
                  }}
                />
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                fontSize: "11px", 
                color: "#64748b",
                gap: "4px",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <span style={{ 
                  fontSize: "11px", 
                  color: "#64748b",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "50%",
                  flex: "1 1 0"
                }}>
                  {stats.minPrice ? Number(stats.minPrice).toLocaleString() : "1.000.000"}₫
                </span>
                <span style={{ 
                  fontSize: "11px", 
                  color: "#64748b",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "50%",
                  flex: "1 1 0",
                  textAlign: "right"
                }}>
                  {stats.maxPrice ? Number(stats.maxPrice).toLocaleString() : "10.000.000"}₫
                </span>
              </div>
            </div>

            {/* Duration Filter */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: 500, color: "#374151", fontSize: "14px" }}>
                Thời lượng tour
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#0E7490" }}
                    checked={selectedDuration === "1-3"}
                    onChange={() => setSelectedDuration(selectedDuration === "1-3" ? "" : "1-3")}
                  />
                  <span style={{ color: "#374151" }}>1-3 ngày</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#0E7490" }}
                    checked={selectedDuration === "4-6"}
                    onChange={() => setSelectedDuration(selectedDuration === "4-6" ? "" : "4-6")}
                  />
                  <span style={{ color: "#374151" }}>4-6 ngày</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#0E7490" }}
                    checked={selectedDuration === "7+"}
                    onChange={() => setSelectedDuration(selectedDuration === "7+" ? "" : "7+")}
                  />
                  <span style={{ color: "#374151" }}>7+ ngày</span>
                </label>
              </div>
            </div>

            {/* Departure Date Filter */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151", fontSize: "14px" }}>
                Ngày khởi hành
              </label>
              <input
                type="date"
                value={selectedDepartureDate}
                onChange={(e) => setSelectedDepartureDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  background: "#fff",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Active Filters Count */}
            <div
              style={{
                background: "#e0f2fe",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "center",
                color: "#0E7490",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Hiển thị {filteredTours.length} / {tours.length} tour
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1 }}>
            {/* Tours Grid */}
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
                  display: viewMode === "list" ? "flex" : "grid",
                  flexDirection: viewMode === "list" ? "column" : "row",
                  gridTemplateColumns: viewMode === "grid" ? "repeat(2, 1fr)" : "none",
                  gap: "24px",
                }}
              >
                {currentTours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} viewMode={viewMode} />
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

