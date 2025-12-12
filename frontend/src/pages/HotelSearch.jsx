import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import DatePicker from "../components/DatePicker";

export default function HotelSearch() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  
  // Search filters
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkInDisplay, setCheckInDisplay] = useState("");
  const [checkOutDisplay, setCheckOutDisplay] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [sortBy, setSortBy] = useState("popular");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"

  // Helper functions for date formatting
  const formatDateToVN = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDateFromVN = (dateString) => {
    if (!dateString) return "";
    // Remove any non-digit characters except /
    const cleaned = dateString.replace(/[^\d/]/g, '');
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      // Validate date
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return `${year}-${month}-${day}`;
      }
    }
    return "";
  };
  
  // Sidebar filters
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [selectedStars, setSelectedStars] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  useEffect(() => {
    fetchHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortBy, priceRange[0], priceRange[1], selectedStars.length, selectedTypes.length, selectedAreas.length, selectedAmenities.length, location]);

  // Initialize display values from state
  useEffect(() => {
    if (checkIn) {
      setCheckInDisplay(formatDateToVN(checkIn));
    }
    if (checkOut) {
      setCheckOutDisplay(formatDateToVN(checkOut));
    }
  }, [checkIn, checkOut]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 9,
        sort_by: sortBy
      });

      if (location) params.append("location", location);
      if (priceRange[0] > 0) params.append("min_price", priceRange[0]);
      if (priceRange[1] < 10000000) params.append("max_price", priceRange[1]);
      if (selectedStars.length > 0) params.append("star_rating", selectedStars[0]);
      if (selectedTypes.length > 0) params.append("types", selectedTypes.join(","));
      // Filter by areas - search in address field
      if (selectedAreas.length > 0) {
        // For now, we'll filter by location/address containing the area name
        // Backend will need to handle this or we filter on frontend
        params.append("areas", selectedAreas.join(","));
      }
      if (selectedAmenities.length > 0) params.append("amenities", selectedAmenities.join(","));

      const response = await api.get(`/hotels?${params.toString()}`);
      setHotels(response.data.hotels || []);
      setTotal(response.data.total || 0);
      setError(null);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      setError(error.message || "Có lỗi xảy ra khi tải dữ liệu");
      setHotels([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchHotels();
  };

  const handleBookHotel = (hotelId) => {
    if (!user) {
      if (window.confirm("Bạn cần đăng nhập để đặt phòng. Bạn có muốn đăng nhập không?")) {
        navigate("/login");
      }
      return;
    }
    navigate(`/hotels/${hotelId}/book?check_in=${checkIn}&check_out=${checkOut}&adults=${adults}&children=${children}&rooms=${rooms}`);
  };

  const toggleStarRating = (stars) => {
    if (selectedStars.includes(stars)) {
      setSelectedStars([]);
    } else {
      setSelectedStars([stars]);
    }
  };

  const toggleFilter = (filterArray, setFilterArray, value) => {
    if (filterArray.includes(value)) {
      setFilterArray(filterArray.filter(item => item !== value));
    } else {
      setFilterArray([...filterArray, value]);
    }
  };

  const clearFilters = () => {
    setPriceRange([0, 10000000]);
    setSelectedStars([]);
    setSelectedTypes([]);
    setSelectedAreas([]);
    setSelectedAmenities([]);
    fetchHotels();
  };

  const hotelTypes = ["Khách sạn", "Khu nghỉ dưỡng", "Căn hộ", "Nhà nghỉ dưỡng"];
  
  // Mapping thành phố và các khu vực tương ứng
  const cityAreasMap = {
    "Hà Nội": ["Quận Hoàn Kiếm", "Quận Ba Đình", "Quận Tây Hồ", "Quận Hai Bà Trưng", "Quận Đống Đa", "Quận Cầu Giấy", "Quận Thanh Xuân"],
    "Hồ Chí Minh": ["Quận 1", "Quận 3", "Quận 5", "Quận 7", "Quận Bình Thạnh", "Quận Tân Bình", "Quận Phú Nhuận"],
    "Đà Nẵng": ["Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà", "Quận Ngũ Hành Sơn", "Quận Liên Chiểu"],
    "Hội An": ["Phố cổ Hội An", "Cẩm An", "Cẩm Châu", "Cẩm Nam", "Cẩm Hà"],
    "Nha Trang": ["Phường Vĩnh Hải", "Phường Vĩnh Phước", "Phường Vĩnh Nguyên", "Phường Phước Hải", "Phường Lộc Thọ"],
    "Huế": ["Phường Phú Hội", "Phường Phú Nhuận", "Phường Vĩnh Ninh", "Phường Thuận Hòa", "Phường Thuận Lộc"],
    "Phú Quốc": ["Dương Đông", "An Thới", "Cửa Cạn", "Gành Dầu", "Hàm Ninh"],
    "Vũng Tàu": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường Thắng Nhì"],
    "Đà Lạt": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12"],
    "Sapa": ["Thị trấn Sapa", "Xã San Sả Hồ", "Xã Bản Hồ", "Xã Tả Phìn", "Xã Tả Van"]
  };

  // Lấy danh sách khu vực dựa trên thành phố được chọn
  const getAvailableAreas = () => {
    if (!location) return [];
    
    // Tìm thành phố khớp với location (không phân biệt hoa thường)
    const cityKey = Object.keys(cityAreasMap).find(
      city => location.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(location.toLowerCase())
    );
    
    return cityKey ? cityAreasMap[cityKey] : [];
  };

  const [availableAreas, setAvailableAreas] = useState([]);
  
  // Cập nhật danh sách khu vực khi location thay đổi
  useEffect(() => {
    const areas = getAvailableAreas();
    setAvailableAreas(areas);
    // Xóa các khu vực đã chọn nếu không còn trong danh sách mới
    if (areas.length > 0) {
      setSelectedAreas(prev => prev.filter(area => areas.includes(area)));
    } else {
      setSelectedAreas([]);
    }
  }, [location]);

  const amenitiesList = ["Wi-Fi miễn phí", "Hồ bơi", "Bãi đỗ xe", "Nhà hàng"];

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Ensure component always renders something
  if (!loading && hotels.length === 0 && total === 0) {
    // This means no hotels found, but we should still show the UI
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Search Bar Header */}
      <div style={{ 
        background: "#fff", 
        padding: "40px 20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: "16px", alignItems: "flex-start" }}>
          {/* Điểm đến */}
          <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
            <label style={{ 
              display: "block", 
              fontSize: "12px", 
              fontWeight: 500, 
              color: "#64748b", 
              marginBottom: "6px"
            }}>
              Điểm đến
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#7c3aed", fontSize: "20px", zIndex: 1 }}>🔍</span>
              <input
                type="text"
                placeholder="Nhập điểm đến"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 14px 14px 44px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "15px",
                  outline: "none",
                  transition: "all 0.2s",
                  background: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  minHeight: "48px",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#0E7490";
                  e.target.style.boxShadow = "0 4px 8px rgba(14, 116, 144, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                }}
              />
            </div>
          </div>

          {/* Ngày nhận phòng */}
          <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
            <label style={{ 
              display: "block", 
              fontSize: "12px", 
              fontWeight: 500, 
              color: "#64748b", 
              marginBottom: "6px"
            }}>
              Ngày nhận phòng
            </label>
            <DatePicker
              value={checkIn}
              onChange={(value) => {
                setCheckIn(value);
                setCheckInDisplay(formatDateToVN(value));
              }}
              min={today}
              placeholder="dd/mm/yyyy"
              style={{
                padding: "14px 14px 14px 44px",
                borderRadius: "10px",
                fontSize: "15px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                minHeight: "48px",
                boxSizing: "border-box",
                margin: 0
              }}
            />
          </div>

          {/* Ngày trả phòng */}
          <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
            <label style={{ 
              display: "block", 
              fontSize: "12px", 
              fontWeight: 500, 
              color: "#64748b", 
              marginBottom: "6px"
            }}>
              Ngày trả phòng
            </label>
            <DatePicker
              value={checkOut}
              onChange={(value) => {
                setCheckOut(value);
                setCheckOutDisplay(formatDateToVN(value));
              }}
              min={checkIn || today}
              placeholder="dd/mm/yyyy"
              style={{
                padding: "14px 14px 14px 44px",
                borderRadius: "10px",
                fontSize: "15px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                minHeight: "48px",
                boxSizing: "border-box",
                margin: 0
              }}
            />
          </div>

          {/* Khách và phòng */}
          <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
            <label style={{ 
              display: "block", 
              fontSize: "12px", 
              fontWeight: 500, 
              color: "#64748b", 
              marginBottom: "6px"
            }}>
              Khách và phòng
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#7c3aed", fontSize: "20px", zIndex: 1 }}>👤</span>
              <input
                type="text"
                value={(() => {
                  let text = `${rooms} Phòng`;
                  if (adults > 0) {
                    text += `, ${adults} người lớn`;
                  }
                  if (children > 0) {
                    text += `, ${children} trẻ em`;
                  }
                  return text;
                })()}
                readOnly
                onClick={() => setShowGuestModal(true)}
                placeholder="Chọn số phòng và khách"
                style={{
                  width: "100%",
                  padding: "14px 14px 14px 44px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  fontSize: "14px",
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.2s",
                  background: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  minHeight: "48px",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#0E7490";
                  e.target.style.boxShadow = "0 4px 8px rgba(14, 116, 144, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                }}
              />
            </div>
            
            {/* Guest/Room Selection Modal */}
            {showGuestModal && (
              <>
                {/* Backdrop */}
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 998
                  }}
                  onClick={() => setShowGuestModal(false)}
                />
                {/* Modal */}
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    padding: "24px",
                    minWidth: "320px",
                    zIndex: 999,
                    border: "1px solid #e5e7eb"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Phòng */}
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "12px" }}>
                      Phòng
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button
                        type="button"
                        onClick={() => setRooms(Math.max(1, rooms - 1))}
                        disabled={rooms <= 1}
                        style={{
                          width: "36px",
                          height: "36px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          background: rooms <= 1 ? "#f3f4f6" : "#fff",
                          color: rooms <= 1 ? "#9ca3af" : "#374151",
                          cursor: rooms <= 1 ? "not-allowed" : "pointer",
                          fontSize: "18px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (rooms > 1) {
                            e.target.style.borderColor = "#0E7490";
                            e.target.style.color = "#0E7490";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (rooms > 1) {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.color = "#374151";
                          }
                        }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", minWidth: "40px", textAlign: "center" }}>
                        {rooms}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRooms(rooms + 1)}
                        style={{
                          width: "36px",
                          height: "36px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          background: "#fff",
                          color: "#374151",
                          cursor: "pointer",
                          fontSize: "18px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = "#0E7490";
                          e.target.style.color = "#0E7490";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = "#d1d5db";
                          e.target.style.color = "#374151";
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Người Lớn */}
                  <div style={{ marginBottom: "24px" }}>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                      Người Lớn
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
                      Từ 17 tuổi
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button
                        type="button"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        disabled={adults <= 1}
                        style={{
                          width: "36px",
                          height: "36px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          background: adults <= 1 ? "#f3f4f6" : "#fff",
                          color: adults <= 1 ? "#9ca3af" : "#374151",
                          cursor: adults <= 1 ? "not-allowed" : "pointer",
                          fontSize: "18px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (adults > 1) {
                            e.target.style.borderColor = "#0E7490";
                            e.target.style.color = "#0E7490";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (adults > 1) {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.color = "#374151";
                          }
                        }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", minWidth: "40px", textAlign: "center" }}>
                        {adults}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAdults(adults + 1)}
                        style={{
                          width: "36px",
                          height: "36px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          background: "#fff",
                          color: "#374151",
                          cursor: "pointer",
                          fontSize: "18px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = "#0E7490";
                          e.target.style.color = "#0E7490";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = "#d1d5db";
                          e.target.style.color = "#374151";
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Trẻ em */}
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                      Trẻ em
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
                      Từ 0 - 16 tuổi
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button
                        type="button"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        disabled={children <= 0}
                        style={{
                          width: "36px",
                          height: "36px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          background: children <= 0 ? "#f3f4f6" : "#fff",
                          color: children <= 0 ? "#9ca3af" : "#374151",
                          cursor: children <= 0 ? "not-allowed" : "pointer",
                          fontSize: "18px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (children > 0) {
                            e.target.style.borderColor = "#0E7490";
                            e.target.style.color = "#0E7490";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (children > 0) {
                            e.target.style.borderColor = "#d1d5db";
                            e.target.style.color = "#374151";
                          }
                        }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", minWidth: "40px", textAlign: "center" }}>
                        {children}
                      </span>
                      <button
                        type="button"
                        onClick={() => setChildren(children + 1)}
                        style={{
                          width: "36px",
                          height: "36px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          background: "#fff",
                          color: "#374151",
                          cursor: "pointer",
                          fontSize: "18px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = "#0E7490";
                          e.target.style.color = "#0E7490";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = "#d1d5db";
                          e.target.style.color = "#374151";
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tìm kiếm Button */}
          <button
            onClick={handleSearch}
            style={{
              background: "#14b8a6",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "14px 36px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              boxShadow: "0 4px 8px rgba(20, 184, 166, 0.3)",
              alignSelf: "flex-end"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#0d9488";
              e.target.style.boxShadow = "0 6px 12px rgba(20, 184, 166, 0.4)";
              e.target.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#14b8a6";
              e.target.style.boxShadow = "0 4px 8px rgba(20, 184, 166, 0.3)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px", display: "flex", gap: "24px" }}>
        {/* Left Sidebar - Filters */}
        <div style={{ width: "280px", flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px", color: "#1e293b" }}>Bộ lọc</h3>

            {/* Giá mỗi đêm */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "block", color: "#1e293b" }}>
                Giá mỗi đêm
              </label>
              <div style={{ position: "relative", marginBottom: "8px" }}>
                <input
                  type="range"
                  min="0"
                  max="10000000"
                  step="100000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  style={{ 
                    width: "100%",
                    height: "6px",
                    borderRadius: "3px",
                    background: `linear-gradient(to right, #0E7490 0%, #0E7490 ${(priceRange[1] / 10000000) * 100}%, #e5e7eb ${(priceRange[1] / 10000000) * 100}%, #e5e7eb 100%)`,
                    outline: "none",
                    WebkitAppearance: "none"
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                <span>0₫</span>
                <span>{Number(priceRange[1]).toLocaleString()}₫+</span>
              </div>
            </div>

            {/* Xếp hạng sao */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "block", color: "#1e293b" }}>
                Xếp hạng sao
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => toggleStarRating(stars)}
                    style={{
                      padding: "8px 12px",
                      border: `1px solid ${selectedStars.includes(stars) ? "#0E7490" : "#d1d5db"}`,
                      borderRadius: "6px",
                      background: selectedStars.includes(stars) ? "#0E7490" : "#fff",
                      color: selectedStars.includes(stars) ? "#fff" : "#1e293b",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {stars}★
                  </button>
                ))}
              </div>
            </div>

            {/* Loại hình nơi ở */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "block", color: "#1e293b" }}>
                Loại hình nơi ở
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {hotelTypes.map((type) => (
                  <label key={type} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleFilter(selectedTypes, setSelectedTypes, type)}
                      style={{ width: "18px", height: "18px", marginRight: "10px", cursor: "pointer", accentColor: "#0E7490" }}
                    />
                    <span style={{ fontSize: "14px", color: "#374151" }}>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Khu vực */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "block", color: "#1e293b" }}>
                Khu vực
              </label>
              {availableAreas.length === 0 ? (
                <div style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic", padding: "8px 0" }}>
                  {location ? "Nhập tên thành phố để xem các khu vực" : "Vui lòng nhập thành phố trước"}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "200px", overflowY: "auto" }}>
                  {availableAreas.map((area) => (
                    <label key={area} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedAreas.includes(area)}
                        onChange={() => toggleFilter(selectedAreas, setSelectedAreas, area)}
                        style={{ width: "18px", height: "18px", marginRight: "10px", cursor: "pointer", accentColor: "#0E7490" }}
                      />
                      <span style={{ fontSize: "14px", color: "#374151" }}>{area}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Tiện nghi phổ biến */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "block", color: "#1e293b" }}>
                Tiện nghi phổ biến
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {amenitiesList.map((amenity) => (
                  <label key={amenity} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleFilter(selectedAmenities, setSelectedAmenities, amenity)}
                      style={{ width: "18px", height: "18px", marginRight: "10px", cursor: "pointer", accentColor: "#0E7490" }}
                    />
                    <span style={{ fontSize: "14px", color: "#374151" }}>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Hotel Listings */}
        <div style={{ flex: 1 }}>
          {/* Results Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", margin: 0 }}>
              Tìm thấy {total} khách sạn{location ? ` tại ${location}` : ""}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "#64748b" }}>Sắp xếp theo:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="popular">Mức độ phổ biến</option>
                <option value="price_low">Giá thấp đến cao</option>
                <option value="price_high">Giá cao đến thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ 
              textAlign: "center", 
              padding: "20px", 
              background: "#fef2f2", 
              border: "1px solid #fecaca",
              borderRadius: "8px",
              marginBottom: "24px",
              color: "#dc2626" 
            }}>
              {error}
            </div>
          )}

          {/* Hotel Cards Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Đang tải...</div>
          ) : hotels.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
              {error ? "Không thể tải dữ liệu" : "Không tìm thấy khách sạn nào"}
            </div>
          ) : (
            <div style={{ 
              display: viewMode === "grid" ? "grid" : "flex",
              gridTemplateColumns: viewMode === "grid" ? "repeat(3, 1fr)" : "none",
              flexDirection: viewMode === "list" ? "column" : "row",
              gap: "20px"
            }}>
              {hotels.map((hotel) => {
                let amenities = [];
                try {
                  if (hotel.amenities) {
                    amenities = typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities) : hotel.amenities;
                    if (!Array.isArray(amenities)) amenities = [];
                  }
                } catch (e) {
                  console.error("Error parsing amenities:", e);
                  amenities = [];
                }
                const starRating = hotel.star_rating || 0;
                // Ensure displayRating is always a number
                let displayRating = 0;
                if (hotel.averageRating) {
                  displayRating = typeof hotel.averageRating === 'number' ? hotel.averageRating : parseFloat(hotel.averageRating) || 0;
                } else if (hotel.user_score) {
                  displayRating = typeof hotel.user_score === 'number' ? hotel.user_score : parseFloat(hotel.user_score) || 0;
                }
                const reviewCount = hotel.reviewCount || 0;
                
                // Tính giá phòng thấp nhất từ Rooms nếu có
                let minRoomPrice = hotel.price_per_night || hotel.price || 0;
                if (hotel.Rooms && Array.isArray(hotel.Rooms) && hotel.Rooms.length > 0) {
                  const roomPrices = hotel.Rooms
                    .map(room => parseFloat(room.price_per_night) || 0)
                    .filter(price => price > 0);
                  if (roomPrices.length > 0) {
                    minRoomPrice = Math.min(...roomPrices);
                  }
                }
                
                return (
                  <div
                    key={hotel.id}
                    onClick={() => navigate(`/hotels/${hotel.id}`)}
                    style={{
                      background: "#fff",
                      borderRadius: "12px",
                      overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      flexDirection: viewMode === "list" ? "row" : "column"
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
                    {/* Hotel Image */}
                    <div style={{ 
                      position: "relative", 
                      width: viewMode === "list" ? "300px" : "100%", 
                      height: viewMode === "list" ? "100%" : "200px", 
                      minHeight: viewMode === "list" ? "200px" : "auto",
                      overflow: "hidden",
                      flexShrink: 0
                    }}>
                      <img
                        src={hotel.image || "https://via.placeholder.com/400x200"}
                        alt={hotel.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                      />
                      {/* Badge */}
                      {hotel.promotion && (
                        <div style={{
                          position: "absolute",
                          top: "12px",
                          left: "12px",
                          background: "#f97316",
                          color: "#fff",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}>
                          Ưu đãi đặc biệt
                        </div>
                      )}
                    </div>

                    {/* Hotel Info */}
                    <div style={{ 
                      padding: viewMode === "list" ? "20px" : "16px", 
                      flex: 1, 
                      display: "flex", 
                      flexDirection: "column",
                      justifyContent: viewMode === "list" ? "space-between" : "flex-start"
                    }}>
                      <div>
                        {/* Rating */}
                        {displayRating > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                            <span style={{ color: "#fbbf24", fontSize: "16px" }}>★</span>
                            <span style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                              {typeof displayRating === 'number' ? displayRating.toFixed(1) : parseFloat(displayRating || 0).toFixed(1)}
                            </span>
                            {reviewCount > 0 && (
                              <span style={{ fontSize: "14px", color: "#64748b" }}>
                                ({reviewCount} đánh giá)
                              </span>
                            )}
                          </div>
                        )}

                        {/* Hotel Name */}
                        <h3 style={{ 
                          fontSize: viewMode === "list" ? "20px" : "18px", 
                          fontWeight: 700, 
                          margin: "0 0 8px 0", 
                          color: "#1e293b",
                          lineHeight: "1.3"
                        }}>
                          {hotel.name}
                        </h3>

                        {/* Location */}
                        <p style={{ 
                          fontSize: "14px", 
                          color: "#64748b", 
                          margin: "0 0 12px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <span>•</span>
                          {hotel.address || hotel.location || "Chưa có địa chỉ"}
                        </p>

                        {/* Description for list view */}
                        {viewMode === "list" && hotel.description && (
                          <p style={{
                            fontSize: "14px",
                            color: "#64748b",
                            margin: "0 0 12px 0",
                            lineHeight: "1.5",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}>
                            {hotel.description}
                          </p>
                        )}
                      </div>

                      {/* Price and Button Container */}
                      <div style={{ 
                        marginTop: "auto", 
                        display: "flex", 
                        alignItems: viewMode === "list" ? "center" : "flex-start",
                        justifyContent: viewMode === "list" ? "space-between" : "flex-start",
                        flexDirection: viewMode === "list" ? "row" : "column",
                        gap: viewMode === "list" ? "16px" : "0"
                      }}>
                        {/* Price */}
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px", flex: viewMode === "list" ? "0 0 auto" : "1" }}>
                          <span style={{ fontSize: viewMode === "list" ? "14px" : "16px", fontWeight: 600, color: "#1e293b" }}>
                            Giá mỗi đêm từ
                          </span>
                          <span style={{ fontSize: viewMode === "list" ? "20px" : "18px", fontWeight: 700, color: "#0E7490" }}>
                            {Number(minRoomPrice).toLocaleString()}₫
                          </span>
                        </div>

                        {/* View Details Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/hotels/${hotel.id}`);
                          }}
                          style={{
                            marginTop: viewMode === "list" ? "0" : "12px",
                            background: "#0ea5e9",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: viewMode === "list" ? "12px 24px" : "10px 16px",
                            fontSize: "14px",
                            fontWeight: 500,
                            cursor: "pointer",
                            width: viewMode === "list" ? "auto" : "100%",
                            transition: "background 0.2s",
                            whiteSpace: "nowrap"
                          }}
                          onMouseEnter={(e) => e.target.style.background = "#0284c7"}
                          onMouseLeave={(e) => e.target.style.background = "#0ea5e9"}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {total > 9 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "32px" }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: currentPage === 1 ? "#f8fafc" : "#fff",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  color: currentPage === 1 ? "#94a3b8" : "#1e293b"
                }}
              >
                &lt;
              </button>
              {[...Array(Math.ceil(total / 9))].slice(0, 10).map((_, i) => {
                const page = i + 1;
                if (page > 1 && page < Math.ceil(total / 9) && Math.abs(page - currentPage) > 2) {
                  if (page === Math.ceil(total / 9) - 1) return null;
                  return <span key={page} style={{ padding: "8px", color: "#64748b" }}>...</span>;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      background: currentPage === page ? "#0E7490" : "#fff",
                      color: currentPage === page ? "#fff" : "#1e293b",
                      cursor: "pointer",
                      fontWeight: currentPage === page ? 600 : 400
                    }}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(total / 9), currentPage + 1))}
                disabled={currentPage >= Math.ceil(total / 9)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: currentPage >= Math.ceil(total / 9) ? "#f8fafc" : "#fff",
                  cursor: currentPage >= Math.ceil(total / 9) ? "not-allowed" : "pointer",
                  color: currentPage >= Math.ceil(total / 9) ? "#94a3b8" : "#1e293b"
                }}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
