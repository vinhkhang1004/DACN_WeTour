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
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDestination, setSearchDestination] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchPeople, setSearchPeople] = useState(1);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [stats, setStats] = useState({ totalTours: 0, totalUsers: 0, totalBookings: 0 });
  const [availableDates, setAvailableDates] = useState([]);
  const [availableDestinations, setAvailableDestinations] = useState([]);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [toursRes, statsRes] = await Promise.all([
          api.get("/tours"),
          api.get("/stats/public")
        ]);
        
        const tours = toursRes.data || [];
        setFeaturedTours(tours.slice(0, 6));
        setStats(statsRes.data || { totalTours: 0, totalUsers: 0, totalBookings: 0 });
        
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
        
        // Sort dates and set
        const sortedDates = Array.from(allDates).sort();
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
          .sort((a, b) => b.tours - a.tours)
          .slice(0, 6);
        
        setDestinations(destList);
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

  return (
    <div>
      <Helmet>
        <title>Du lịch giá tốt | Khám phá tour nổi bật</title>
        <meta name="description" content="Đặt tour du lịch giá tốt, nhiều khuyến mãi, trải nghiệm an toàn và chất lượng." />
        <meta property="og:title" content="Du lịch giá tốt | Khám phá tour nổi bật" />
        <meta property="og:description" content="Đặt tour du lịch giá tốt, nhiều khuyến mãi, trải nghiệm an toàn và chất lượng." />
      </Helmet>
      {/* Hero Section with Search */}
      <div
        style={{
          background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)",
          color: "#fff",
          padding: "60px 20px 80px",
          textAlign: "center",
          borderRadius: "0 0 24px 24px",
          marginBottom: "60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "300px",
            height: "300px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-50px",
            left: "-50px",
            width: "200px",
            height: "200px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "48px", margin: "0 0 20px", fontWeight: 700 }}>
            🌴 Khám phá thế giới cùng chúng tôi
          </h1>
          <p style={{ fontSize: "20px", margin: "0 0 40px", opacity: 0.95 }}>
            Trải nghiệm những chuyến du lịch tuyệt vời với giá cả hợp lý
          </p>

          {/* Search Bar */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "32px",
              margin: "0 auto 40px",
              maxWidth: "1000px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ color: "#1e293b", margin: "0 0 24px", fontSize: "22px", fontWeight: 600 }}>
              🔍 Tìm kiếm tour du lịch
            </h3>
            <form onSubmit={handleSearch}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontSize: "14px", fontWeight: 600 }}>
                    Tên tour hoặc địa điểm
                  </label>
                  <SearchAutosuggest
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSelect={(item)=>{
                      setSearchTerm(item.name);
                      navigate(`/tour/${item.id}`);
                    }}
                  />
                </div>

                <div style={{ position: "relative", zIndex: 1 }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontSize: "14px", fontWeight: 600 }}>
                    Điểm đến
                  </label>
                  <select
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "15px",
                      color: "#1e293b",
                      background: "#fff",
                      outline: "none",
                      transition: "all 0.2s",
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: "40px",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0E7490";
                      e.target.style.boxShadow = "0 0 0 3px rgba(14, 116, 144, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <option value="">Tất cả điểm đến</option>
                    {availableDestinations.map((dest, idx) => (
                      <option key={idx} value={dest}>
                        {dest}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ position: "relative", zIndex: 1 }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontSize: "14px", fontWeight: 600 }}>
                    Ngày khởi hành
                  </label>
                  {availableDates.length > 0 ? (
                    <select
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        paddingRight: "40px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "15px",
                        color: "#1e293b",
                        background: "#fff",
                        outline: "none",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        appearance: "none",
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#0E7490";
                        e.target.style.boxShadow = "0 0 0 3px rgba(14, 116, 144, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <option value="">Chọn ngày khởi hành</option>
                      {availableDates.map((date, idx) => (
                        <option key={idx} value={date}>
                          {new Date(date).toLocaleDateString('vi-VN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "15px",
                        color: "#1e293b",
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#0E7490";
                        e.target.style.boxShadow = "0 0 0 3px rgba(14, 116, 144, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  )}
                </div>

                <div style={{ position: "relative", zIndex: 1 }}>
                  <label style={{ display: "block", marginBottom: "8px", color: "#475569", fontSize: "14px", fontWeight: 600 }}>
                    Số người
                  </label>
                  <select
                    value={searchPeople}
                    onChange={(e) => setSearchPeople(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      paddingRight: "40px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "15px",
                      color: "#1e293b",
                      background: "#fff",
                      outline: "none",
                      transition: "all 0.2s",
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0E7490";
                      e.target.style.boxShadow = "0 0 0 3px rgba(14, 116, 144, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.boxShadow = "none";
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

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  type="submit"
                  style={{
                    flex: "1 1 auto",
                    minWidth: "200px",
                    padding: "14px 24px",
                    background: "#0E7490",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(14, 116, 144, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#0891b2";
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 6px 16px rgba(14, 116, 144, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#0E7490";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 12px rgba(14, 116, 144, 0.3)";
                  }}
                >
                  🔍 Tìm kiếm tour
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/tours")}
                  style={{
                    padding: "14px 24px",
                    background: "#fff",
                    color: "#0E7490",
                    border: "2px solid #0E7490",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#0E7490";
                    e.target.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#fff";
                    e.target.style.color = "#0E7490";
                  }}
                >
                  Xem tất cả tour →
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/promotions")}
                  style={{
                    padding: "14px 24px",
                    background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 6px 16px rgba(245, 158, 11, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.3)";
                  }}
                >
                  🎁 Xem khuyến mãi
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: "0 20px", marginBottom: "60px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "32px", margin: "0 0 12px", color: "#1e293b" }}>
            🌟 Tại sao chọn chúng tôi?
          </h2>
          <p style={{ fontSize: "18px", color: "#64748b" }}>
            Những lý do khiến hàng triệu khách hàng tin tưởng
          </p>
        </div>
        
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "32px 24px",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              border: "1px solid #f1f5f9",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "20px" }}>✈️</div>
            <h3 style={{ margin: "0 0 12px", color: "#1e293b", fontSize: "20px", fontWeight: 600 }}>Tour chất lượng cao</h3>
            <p style={{ margin: 0, color: "#64748b", lineHeight: "1.6" }}>
              Được lựa chọn kỹ lưỡng với nhiều điểm đến hấp dẫn và dịch vụ chuyên nghiệp
            </p>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "32px 24px",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              border: "1px solid #f1f5f9",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "20px" }}>💰</div>
            <h3 style={{ margin: "0 0 12px", color: "#1e293b", fontSize: "20px", fontWeight: 600 }}>Giá tốt nhất thị trường</h3>
            <p style={{ margin: 0, color: "#64748b", lineHeight: "1.6" }}>
              Cam kết giá cả cạnh tranh, minh bạch và không phát sinh chi phí ẩn
            </p>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "32px 24px",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              border: "1px solid #f1f5f9",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "20px" }}>🛡️</div>
            <h3 style={{ margin: "0 0 12px", color: "#1e293b", fontSize: "20px", fontWeight: 600 }}>An toàn tuyệt đối</h3>
            <p style={{ margin: 0, color: "#64748b", lineHeight: "1.6" }}>
              Đảm bảo an toàn và hỗ trợ 24/7 trong suốt hành trình du lịch
            </p>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "32px 24px",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              border: "1px solid #f1f5f9",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "20px" }}>⭐</div>
            <h3 style={{ margin: "0 0 12px", color: "#1e293b", fontSize: "20px", fontWeight: 600 }}>Đánh giá cao</h3>
            <p style={{ margin: 0, color: "#64748b", lineHeight: "1.6" }}>
              Hơn 50,000+ khách hàng hài lòng với điểm đánh giá trung bình 4.8/5
            </p>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "32px 24px",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              border: "1px solid #f1f5f9",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "20px" }}>🔄</div>
            <h3 style={{ margin: "0 0 12px", color: "#1e293b", fontSize: "20px", fontWeight: 600 }}>Hỗ trợ linh hoạt</h3>
            <p style={{ margin: 0, color: "#64748b", lineHeight: "1.6" }}>
              Đổi ngày miễn phí, hủy tour linh hoạt và bảo hiểm du lịch toàn diện
            </p>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "32px 24px",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              border: "1px solid #f1f5f9",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "20px" }}>📱</div>
            <h3 style={{ margin: "0 0 12px", color: "#1e293b", fontSize: "20px", fontWeight: 600 }}>Đặt tour dễ dàng</h3>
            <p style={{ margin: 0, color: "#64748b", lineHeight: "1.6" }}>
              Giao diện thân thiện, thanh toán an toàn và xác nhận tức thì
            </p>
          </div>
        </div>
      </div>

      {/* Promotions Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
          color: "#fff",
          padding: "40px 20px",
          margin: "0 20px 60px",
          borderRadius: "16px",
          textAlign: "center",
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
          <h2 style={{ fontSize: "32px", margin: "0 0 12px", fontWeight: 700 }}>
            🎉 Khuyến mãi đặc biệt tháng 12
          </h2>
          <p style={{ fontSize: "18px", margin: "0 0 24px", opacity: 0.95 }}>
            Giảm đến 50% cho các tour nước ngoài - Chỉ còn 100 suất!
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/promotions"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "#fff",
                color: "#f59e0b",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "16px",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
            >
              Xem tất cả khuyến mãi
            </Link>
            <div
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                border: "2px solid #fff",
              }}
            >
              Mã: FLASH50
            </div>
          </div>
        </div>
      </div>

      {/* Popular Destinations */}
      <div style={{ padding: "0 20px", marginBottom: "60px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "32px", margin: "0 0 12px", color: "#1e293b" }}>
            🗺️ Điểm đến phổ biến
          </h2>
          <p style={{ fontSize: "18px", color: "#64748b" }}>
            Khám phá những địa điểm du lịch được yêu thích nhất
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          {destinations.length > 0 ? destinations.map((destination, index) => (
            <Link
              key={index}
              to={`/tours?destination=${encodeURIComponent(destination.name)}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  position: "relative",
                  borderRadius: "12px",
                  overflow: "hidden",
                  height: "200px",
                  background: `linear-gradient(45deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2)), url(${destination.image || "https://via.placeholder.com/400x300?text=" + encodeURIComponent(destination.name)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                    padding: "20px 16px 16px",
                    color: "#fff",
                  }}
                >
                  <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 600 }}>
                    {destination.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
                    {destination.tours} tour
                  </p>
                </div>
              </div>
            </Link>
          )) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#64748b" }}>
              Chưa có dữ liệu điểm đến
            </div>
          )}
        </div>
      </div>

      {/* Featured Tours */}
      <div style={{ padding: "0 20px", marginBottom: "60px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "32px", margin: "0 0 12px", color: "#1e293b" }}>
            🌟 Tour nổi bật
          </h2>
          <p style={{ fontSize: "18px", color: "#64748b" }}>
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
              gap: "24px",
            }}
          >
            {featuredTours.map((tour) => (
              <Link
                key={tour.id}
                to={`/tour/${tour.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
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
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link
            to="/tours"
            style={{
              display: "inline-block",
              padding: "14px 28px",
              background: "#0E7490",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 600,
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(14, 116, 144, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0891b2";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(14, 116, 144, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0E7490";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(14, 116, 144, 0.3)";
            }}
          >
            Xem tất cả tour →
          </Link>
        </div>
      </div>

      {/* Statistics Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          color: "#fff",
          padding: "60px 20px",
          borderRadius: "24px",
          margin: "0 20px 60px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "32px", margin: "0 0 40px", color: "#fff" }}>
          📊 Thành tựu của chúng tôi
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "32px",
          }}
        >
          <div>
            <div style={{ fontSize: "48px", fontWeight: 700, color: "#0ea5e9", marginBottom: "8px" }}>
              {stats.totalUsers.toLocaleString()}+
            </div>
            <p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>Khách hàng hài lòng</p>
          </div>
          <div>
            <div style={{ fontSize: "48px", fontWeight: 700, color: "#0ea5e9", marginBottom: "8px" }}>
              {stats.totalTours.toLocaleString()}+
            </div>
            <p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>Tour du lịch</p>
          </div>
          <div>
            <div style={{ fontSize: "48px", fontWeight: 700, color: "#0ea5e9", marginBottom: "8px" }}>
              {stats.totalBookings.toLocaleString()}+
            </div>
            <p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>Đơn đặt tour</p>
          </div>
          <div>
            <div style={{ fontSize: "48px", fontWeight: 700, color: "#0ea5e9", marginBottom: "8px" }}>
              4.8/5
            </div>
            <p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>Đánh giá trung bình</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          padding: "60px 20px",
          borderRadius: "24px",
          textAlign: "center",
          margin: "0 20px 60px",
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
            background: "rgba(14, 116, 144, 0.1)",
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
            background: "rgba(14, 116, 144, 0.1)",
            borderRadius: "50%",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "32px", margin: "0 0 16px", color: "#1e293b" }}>
            Sẵn sàng cho chuyến đi của bạn?
          </h2>
          <p style={{ fontSize: "18px", color: "#64748b", marginBottom: "32px" }}>
            Đăng ký ngay để nhận thông tin về các tour mới nhất và ưu đãi đặc biệt
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/register"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                background: "#0E7490",
                color: "#fff",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "16px",
                fontWeight: 600,
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(14, 116, 144, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0891b2";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(14, 116, 144, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0E7490";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(14, 116, 144, 0.3)";
              }}
            >
              Đăng ký ngay →
            </Link>
            <Link
              to="/newsletter"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                background: "rgba(14, 116, 144, 0.1)",
                color: "#0E7490",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "16px",
                fontWeight: 600,
                border: "2px solid #0E7490",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0E7490";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(14, 116, 144, 0.1)";
                e.currentTarget.style.color = "#0E7490";
              }}
            >
              📧 Nhận newsletter
            </Link>
          </div>
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

