import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import AdvancedSearch from "../components/AdvancedSearch";
import SearchAutosuggest from "../components/SearchAutosuggest";
import NotificationCenter, { useNotifications } from "../components/NotificationCenter";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Homepage() {
  const [featuredTours, setFeaturedTours] = useState([]);
  const [allTours, setAllTours] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [allDestinations, setAllDestinations] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [allPromotions, setAllPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDestination, setSearchDestination] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchPeople, setSearchPeople] = useState(1);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [stats, setStats] = useState({ totalTours: 0, totalUsers: 0, totalBookings: 0 });
  const [availableDates, setAvailableDates] = useState([]);
  const [availableDestinations, setAvailableDestinations] = useState([]);
  
  // Carousel states - mỗi phần hiển thị 4 mục
  const [promoStartIndex, setPromoStartIndex] = useState(0);
  const [tourStartIndex, setTourStartIndex] = useState(0);
  const [destStartIndex, setDestStartIndex] = useState(0);
  const [isPromoTransitioning, setIsPromoTransitioning] = useState(false);
  const [isTourTransitioning, setIsTourTransitioning] = useState(false);
  const [isDestTransitioning, setIsDestTransitioning] = useState(false);
  
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching data from API...");
        console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api");
        const [toursRes, statsRes, promotionsRes] = await Promise.all([
          api.get("/tours"),
          api.get("/stats/public"),
          // Lấy tất cả promotions có is_active = true, không filter theo ngày để hiển thị cả promotions sắp tới
          api.get("/promotions", { params: { showAll: true, limit: 100 } }).catch(() => ({ data: { promotions: [] } }))
        ]);
        
        const tours = toursRes.data || [];
        console.log("Tours received:", tours.length);
        setAllTours(tours);
        setStats(statsRes.data || { totalTours: 0, totalUsers: 0, totalBookings: 0 });
        
        // Set all promotions - chỉ lấy những cái is_active = true
        const promoData = promotionsRes.data?.promotions || promotionsRes.data || [];
        // Filter chỉ lấy promotions active (backend có thể trả về cả inactive nếu showAll=true)
        const activePromos = Array.isArray(promoData) 
          ? promoData.filter(p => p.is_active === true || p.is_active === 1)
          : [];
        setAllPromotions(activePromos);
        
        console.log("Promotions loaded:", activePromos.length, activePromos);
        console.log("Total tours:", tours.length);
        console.log("Stats:", statsRes.data);
        
        // Extract all available dates from all tours
        const allDates = new Set();
        tours.forEach(tour => {
          if (tour.available_dates) {
            try {
              const dates = JSON.parse(tour.available_dates);
              if (Array.isArray(dates)) {
                dates.forEach(date => {
                  if (date && date.trim() !== "") {
                    allDates.add(date);
                  }
                });
              }
            } catch {
              // Ignore parse errors
            }
          } else if (tour.departure_date) {
            // Fallback to departure_date for backward compatibility
            const dateStr = new Date(tour.departure_date).toISOString().split('T')[0];
            allDates.add(dateStr);
          }
        });
        
        // Lọc bỏ các ngày đã qua
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const filteredDates = Array.from(allDates).filter(d => {
          const date = new Date(d);
          date.setHours(0, 0, 0, 0);
          return date >= today;
        });
        
        // Sort dates and set
        const sortedDates = filteredDates.sort();
        setAvailableDates(sortedDates);
        
        // Extract unique destinations from tours
        const uniqueDestinations = [...new Set(tours.map(tour => tour.destination).filter(Boolean))].sort();
        setAvailableDestinations(uniqueDestinations);
        
        // Count tours by destination
        const destMap = {};
        tours.forEach(tour => {
          if (destMap[tour.destination]) {
            destMap[tour.destination] += 1;
          } else {
            destMap[tour.destination] = 1;
          }
        });
        
        // Get first tour image for each destination
        const destWithImages = {};
        tours.forEach(tour => {
          if (!destWithImages[tour.destination] && tour.image) {
            destWithImages[tour.destination] = tour.image;
          }
        });
        
        // Convert to array
        const destList = Object.entries(destMap)
          .map(([name, count]) => ({ name, tours: count, image: destWithImages[name] }))
          .sort((a, b) => b.tours - a.tours);
        
        setAllDestinations(destList);
        
        // Khởi tạo sẽ được set trong useEffect carousel cho mỗi phần
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response) {
          console.error("API Error:", error.response.status, error.response.data);
          showError(`Lỗi tải dữ liệu: ${error.response.data?.message || error.message}`);
        } else if (error.request) {
          console.error("Network Error:", error.request);
          showError("Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa.");
        } else {
          showError(`Lỗi: ${error.message}`);
        }
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Auto-scroll carousel cho promotions (chuyển slide mỗi 5 giây với fade effect)
  useEffect(() => {
    if (allPromotions.length === 0) {
      setPromotions([]);
      return;
    }
    
    if (allPromotions.length <= 4) {
      // Nếu <= 4 mục, chỉ hiển thị tất cả
      setPromotions(allPromotions);
      return;
    }
    
    // Khởi tạo 4 mục đầu tiên
    setPromotions(allPromotions.slice(0, 4));
    
    const interval = setInterval(() => {
      setIsPromoTransitioning(true);
      
      // Fade out
      setTimeout(() => {
        setPromoStartIndex((prev) => {
          const nextIndex = (prev + 4) % allPromotions.length;
          // Lấy 4 mục tiếp theo, nếu hết thì quay lại đầu
          const nextPromos = [];
          for (let i = 0; i < 4; i++) {
            const index = (nextIndex + i) % allPromotions.length;
            nextPromos.push(allPromotions[index]);
          }
          setPromotions(nextPromos);
          setIsPromoTransitioning(false);
          return nextIndex;
        });
      }, 300); // Fade out trong 300ms
    }, 5000); // Chuyển slide mỗi 5 giây

    return () => clearInterval(interval);
  }, [allPromotions]);

  // Auto-scroll carousel cho tours (chuyển slide mỗi 5 giây với fade effect)
  useEffect(() => {
    if (allTours.length <= 4) {
      // Nếu <= 4 mục, chỉ hiển thị tất cả
      setFeaturedTours(allTours);
      return;
    }
    
    // Khởi tạo 4 mục đầu tiên
    setFeaturedTours(allTours.slice(0, 4));
    
    const interval = setInterval(() => {
      setIsTourTransitioning(true);
      
      // Fade out
      setTimeout(() => {
        setTourStartIndex((prev) => {
          const nextIndex = (prev + 4) % allTours.length;
          // Lấy 4 mục tiếp theo, nếu hết thì quay lại đầu
          const nextTours = [];
          for (let i = 0; i < 4; i++) {
            const index = (nextIndex + i) % allTours.length;
            nextTours.push(allTours[index]);
          }
          setFeaturedTours(nextTours);
          setIsTourTransitioning(false);
          return nextIndex;
        });
      }, 300); // Fade out trong 300ms
    }, 5000); // Chuyển slide mỗi 5 giây

    return () => clearInterval(interval);
  }, [allTours]);

  // Auto-scroll carousel cho destinations (chuyển slide mỗi 5 giây với fade effect)
  useEffect(() => {
    if (allDestinations.length <= 4) {
      // Nếu <= 4 mục, chỉ hiển thị tất cả
      setDestinations(allDestinations);
      return;
    }
    
    // Khởi tạo 4 mục đầu tiên
    setDestinations(allDestinations.slice(0, 4));
    
    const interval = setInterval(() => {
      setIsDestTransitioning(true);
      
      // Fade out
      setTimeout(() => {
        setDestStartIndex((prev) => {
          const nextIndex = (prev + 4) % allDestinations.length;
          // Lấy 4 mục tiếp theo, nếu hết thì quay lại đầu
          const nextDests = [];
          for (let i = 0; i < 4; i++) {
            const index = (nextIndex + i) % allDestinations.length;
            nextDests.push(allDestinations[index]);
          }
          setDestinations(nextDests);
          setIsDestTransitioning(false);
          return nextIndex;
        });
      }, 300); // Fade out trong 300ms
    }, 5000); // Chuyển slide mỗi 5 giây

    return () => clearInterval(interval);
  }, [allDestinations]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (searchDestination) params.append('destination', searchDestination);
    if (searchDate) params.append('date', searchDate);
    if (searchPeople > 1) params.append('people', searchPeople);
    
    navigate(`/tours?${params.toString()}`);
  };

  const handleAdvancedSearch = (filters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 0) {
        params.append(key, value);
      }
    });
    
    navigate(`/tours?${params.toString()}`);
    setShowAdvancedSearch(false);
  };

  const formatPrice = (price) => {
    return Number(price).toLocaleString('vi-VN') + 'đ';
  };

  const getDiscountText = (promotion) => {
    if (promotion.discount_type === "percentage") {
      return `Giảm ${promotion.discount_value}%`;
    } else {
      return `Giảm ${Number(promotion.discount_value).toLocaleString()} ₫`;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <Helmet>
        <title>Du lịch giá tốt | Khám phá tour nổi bật</title>
        <meta name="description" content="Đặt tour du lịch giá tốt, nhiều khuyến mãi, trải nghiệm an toàn và chất lượng." />
        <meta property="og:title" content="Du lịch giá tốt | Khám phá tour nổi bật" />
        <meta property="og:description" content="Đặt tour du lịch giá tốt, nhiều khuyến mãi, trải nghiệm an toàn và chất lượng." />
      </Helmet>
      <style>
        {`
          .homepage-search-autosuggest input {
            height: 48px !important;
            padding: 12px 16px !important;
            border: 1px solid #d1d5db !important;
            border-radius: 8px !important;
            font-size: 15px !important;
            box-shadow: none !important;
          }
          .homepage-search-autosuggest input:focus {
            border-color: #005A9C !important;
            box-shadow: 0 0 0 3px rgba(0, 90, 156, 0.1) !important;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeInSlide {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .carousel-item {
            animation: fadeInSlide 0.5s ease-out;
          }
          .carousel-item-transitioning {
            opacity: 0;
            transform: translateX(-20px);
            transition: opacity 0.3s ease-out, transform 0.3s ease-out;
          }
          @media (min-width: 1280px) {
            .promotions-grid,
            .tours-grid,
            .destinations-grid {
              grid-template-columns: repeat(4, 1fr) !important;
            }
          }
          @media (max-width: 1279px) and (min-width: 968px) {
            .promotions-grid,
            .tours-grid,
            .destinations-grid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
          @media (max-width: 967px) and (min-width: 640px) {
            .promotions-grid,
            .tours-grid,
            .destinations-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 639px) {
            .promotions-grid,
            .tours-grid,
            .destinations-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      {/* Hero Section */}
      <div
        style={{
          position: "relative",
          minHeight: "650px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBUcdQ017l2SdLQpIwS2-z-JI1dCQeni8pNKwBg1pQqVg5syEiFs4ti6EQy5yN44zNPoObsLZ5gL23g59_JYEm092ZEMkijUvz7e7gcjKdVa9AB7lth2aairXGZo2NVCqwuTOlpKwzmCYbsTR8penTi3CCIO3BCxvgjo4ckimVMyvXDhVELv-lYd4ineAel1MKk0LX6oTrDisXrg8eaNs6SCKlmiNOKPgIZa7KCw8tqZ7g470xmKEAuWhlB7yOeTmHt9XNiiORFOGw")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "100px 20px 80px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1
            style={{
              color: "#fff",
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: "-0.033em",
              margin: "0 0 20px",
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            Khám phá những chân trời mới
          </h1>
          <h2
            style={{
              color: "rgba(255, 255, 255, 0.95)",
              fontSize: "clamp(1.125rem, 2.5vw, 1.25rem)",
              fontWeight: 400,
              lineHeight: 1.6,
              margin: "0 0 48px",
              textShadow: "0 1px 5px rgba(0,0,0,0.2)",
            }}
          >
            Hành trình của bạn bắt đầu tại đây. Tìm kiếm các tour du lịch và gói dịch vụ tốt nhất.
          </h2>
        </div>

        {/* Search Form */}
        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            padding: "12px",
            background: "rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            marginTop: "0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <form onSubmit={handleSearch}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "8px",
                background: "#fff",
                borderRadius: "8px",
                padding: "16px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Destination Search */}
              <div style={{ position: "relative", gridColumn: "span 2" }}>
                <label
                  style={{
                    position: "absolute",
                    top: "-8px",
                    left: "12px",
                    fontSize: "12px",
                    color: "#005A9C",
                    background: "#fff",
                    padding: "0 4px",
                    zIndex: 1,
                  }}
                  htmlFor="destination"
                >
                  Điểm đến
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center", height: "100%" }}>
                  <span style={{ position: "absolute", left: "12px", color: "#9ca3af", fontSize: "20px", zIndex: 2 }}>
                    📍
                  </span>
                  <div style={{ width: "100%", paddingLeft: "40px" }} className="homepage-search-autosuggest">
                    <SearchAutosuggest
                      value={searchTerm}
                      onChange={setSearchTerm}
                      onSelect={(item) => {
                        setSearchTerm(item.name);
                        navigate(`/tour/${item.id}`);
                      }}
                      placeholder="Bạn muốn đi đâu?"
                    />
                  </div>
                </div>
              </div>

              {/* Date Select */}
              <div style={{ position: "relative" }}>
                <label
                  style={{
                    position: "absolute",
                    top: "-8px",
                    left: "12px",
                    fontSize: "12px",
                    color: "#005A9C",
                    background: "#fff",
                    padding: "0 4px",
                  }}
                  htmlFor="dates"
                >
                  Ngày
                </label>
                <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                  <span style={{ position: "absolute", left: "12px", color: "#9ca3af", fontSize: "20px", zIndex: 1 }}>
                    📅
                  </span>
                  <input
                    id="dates"
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    placeholder="Chọn ngày"
                    style={{
                      width: "100%",
                      height: "48px",
                      paddingLeft: "40px",
                      paddingRight: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "15px",
                      color: "#1e293b",
                      background: "#fff",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  />
                </div>
              </div>

              {/* Guests Select */}
              <div style={{ position: "relative" }}>
                <label
                  style={{
                    position: "absolute",
                    top: "-8px",
                    left: "12px",
                    fontSize: "12px",
                    color: "#005A9C",
                    background: "#fff",
                    padding: "0 4px",
                  }}
                  htmlFor="guests"
                >
                  Số lượng khách
                </label>
                <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                  <span style={{ position: "absolute", left: "12px", color: "#9ca3af", fontSize: "20px" }}>
                    👥
                  </span>
                  <select
                    id="guests"
                    value={searchPeople}
                    onChange={(e) => setSearchPeople(Number(e.target.value))}
                    style={{
                      width: "100%",
                      height: "48px",
                      paddingLeft: "40px",
                      paddingRight: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "15px",
                      color: "#1e293b",
                      background: "#fff",
                      outline: "none",
                      cursor: "pointer",
                      appearance: "none",
                    }}
                  >
                    <option value={1}>1 người</option>
                    <option value={2}>2 người</option>
                    <option value={3}>3 người</option>
                    <option value={4}>4 người</option>
                    <option value={5}>5+ người</option>
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <button
                type="submit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  height: "48px",
                  background: "#005A9C",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#004080";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#005A9C";
                }}
              >
                <span>🔍</span>
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Promotions Section */}
      <div style={{ padding: "80px 20px", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2
            style={{
              color: "#333333",
              fontSize: "36px",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.015em",
              marginBottom: "12px",
            }}
          >
            Ưu đãi không thể bỏ lỡ
          </h2>
          <p style={{ color: "#6b7280", fontSize: "18px", margin: 0 }}>
            Những ưu đãi đặc biệt dành riêng cho bạn
          </p>
        </div>
        {promotions.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "32px",
              paddingBottom: "16px",
            }}
            className="promotions-grid"
          >
            {promotions.map((promo, index) => (
              <div
                key={`${promo.id || index}-${promoStartIndex}`}
                className={`carousel-item ${isPromoTransitioning ? 'carousel-item-transitioning' : ''}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0",
                  borderRadius: "16px",
                  background: "#fff",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  overflow: "hidden",
                  transition: "transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease",
                  cursor: "pointer",
                  opacity: isPromoTransitioning ? 0 : 1,
                  height: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                }}
                onClick={() => navigate("/promotions")}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundImage: promo.image
                      ? `url(${promo.image})`
                      : `url("https://lh3.googleusercontent.com/aida-public/AB6AXuArXk9njj3HoiAfhIaMNw6VAI0kWB2fEFQBMe7YM_23S0286lToZsFgVEmaYxZyLp7KIH3lZOLFZwk8PhQmvLeLICKlApLrHaw1DqY7w2z9iJvFVos-SG1lOILcJ5qQPfsOJ4csbevSk-RwqKEY7ezAdw8ap9OfTyv5--OPv56Ri--sYhYN6CSbn5HwCTGOZYKGm5FrzkmrskUlLJAhfspizamgdnRvuggFrzTl6g0GQuzerPCguf55bCLMiFnQ8QgvgJfe4h6HyWE")`,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", padding: "20px", gap: "16px" }}>
                  <div>
                    <p
                      style={{
                        color: "#333333",
                        fontSize: "18px",
                        fontWeight: 700,
                        lineHeight: 1.5,
                        margin: "0 0 8px",
                      }}
                    >
                      {promo.title || getDiscountText(promo)}
                    </p>
                    <p
                      style={{
                        color: "#6b7280",
                        fontSize: "14px",
                        fontWeight: 400,
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {promo.description || "Khám phá những điểm đến tuyệt vời với ưu đãi đặc biệt."}
                    </p>
                  </div>
                  <button
                    style={{
                      display: "flex",
                      minWidth: "84px",
                      maxWidth: "480px",
                      cursor: "pointer",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      borderRadius: "8px",
                      height: "40px",
                      padding: "0 16px",
                      background: "rgba(0, 90, 156, 0.2)",
                      color: "#005A9C",
                      fontSize: "14px",
                      fontWeight: 700,
                      letterSpacing: "0.015em",
                      border: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "rgba(0, 90, 156, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "rgba(0, 90, 156, 0.2)";
                    }}
                  >
                    Xem ưu đãi
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
            <p style={{ fontSize: "18px", marginBottom: "16px" }}>Chưa có ưu đãi nào</p>
            <Link
              to="/promotions"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "#005A9C",
                color: "#fff",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "16px",
                fontWeight: 600,
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#004080";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#005A9C";
              }}
            >
              Xem tất cả ưu đãi
            </Link>
          </div>
        )}
      </div>

      {/* Featured Tours Section */}
      <div id="tours-section" style={{ padding: "80px 20px", maxWidth: "1280px", margin: "0 auto", background: "#f9fafb" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2
            style={{
              color: "#333333",
              fontSize: "36px",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.015em",
              marginBottom: "12px",
            }}
          >
            Tour nổi bật
          </h2>
          <p style={{ color: "#6b7280", fontSize: "18px", margin: 0 }}>
            Những tour được yêu thích nhất trong tháng này
          </p>
        </div>
        {loading ? (
          <LoadingSpinner size="large" text="Đang tải tour nổi bật..." />
        ) : featuredTours.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontSize: "18px", color: "#64748b" }}>Chưa có tour nào</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "32px",
              marginBottom: "0",
            }}
            className="tours-grid"
          >
            {featuredTours.map((tour) => (
              <Link
                key={`${tour.id}-${tourStartIndex}`}
                to={`/tour/${tour.id}`}
                className={`carousel-item ${isTourTransitioning ? 'carousel-item-transitioning' : ''}`}
                style={{ 
                  textDecoration: "none", 
                  color: "inherit",
                  opacity: isTourTransitioning ? 0 : 1,
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "16px",
                    background: "#fff",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    height: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      alt={tour.name}
                      src={tour.image || "https://via.placeholder.com/400x250?text=Tour+Image"}
                      style={{
                        height: "224px",
                        width: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x250?text=Tour+Image";
                      }}
                    />
                    {tour.is_featured && (
                      <div
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          background: "#FF7F50",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "4px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        HOT
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#333333",
                        lineHeight: 1.2,
                        margin: "0 0 8px",
                      }}
                    >
                      {tour.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        margin: "0 0 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>📍</span>
                      {tour.destination}
                    </p>
                    <div style={{ marginTop: "auto", display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <p
                        style={{
                          fontSize: "18px",
                          fontWeight: 800,
                          color: "#005A9C",
                          margin: 0,
                        }}
                      >
                        {formatPrice(tour.price)}
                      </p>
                      <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>/ người</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Popular Destinations Section */}
      <div id="destinations-section" style={{ padding: "80px 20px", background: "#ffffff", width: "100%" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2
              style={{
                color: "#333333",
                fontSize: "36px",
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-0.015em",
                marginBottom: "12px",
              }}
            >
              Địa điểm nổi bật
            </h2>
            <p style={{ color: "#6b7280", fontSize: "18px", margin: 0 }}>
              Khám phá những địa điểm du lịch được yêu thích nhất
            </p>
          </div>
          {destinations.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "32px",
                marginBottom: "0",
              }}
              className="destinations-grid"
            >
              {destinations.map((destination, index) => (
                <Link
                  key={`${destination.name}-${destStartIndex}`}
                  to={`/tours?destination=${encodeURIComponent(destination.name)}`}
                  className={`carousel-item ${isDestTransitioning ? 'carousel-item-transitioning' : ''}`}
                  style={{ 
                    textDecoration: "none", 
                    color: "inherit",
                    opacity: isDestTransitioning ? 0 : 1,
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                  }}
                >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "16px",
                        background: "#fff",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        height: "100%",
                      }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-8px)";
                      e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <img
                        alt={destination.name}
                        src={destination.image || `https://via.placeholder.com/400x300?text=${encodeURIComponent(destination.name)}`}
                        style={{
                          height: "224px",
                          width: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(destination.name)}`;
                        }}
                      />
                    </div>
                    <div style={{ padding: "16px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#333333",
                          lineHeight: 1.2,
                          margin: "0 0 8px",
                        }}
                      >
                        {destination.name}
                      </h3>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          margin: 0,
                          flex: 1,
                        }}
                      >
                        {destination.tours} tour du lịch
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              Chưa có dữ liệu điểm đến
            </div>
          )}
        </div>
      </div>

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <AdvancedSearch
          onSearch={handleAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
        />
      )}
    </div>
  );
}
