import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function FlightSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Search form
  const [origin, setOrigin] = useState(searchParams.get("origin") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [departureDate, setDepartureDate] = useState(searchParams.get("departure_date") || "");
  const [returnDate, setReturnDate] = useState(searchParams.get("return_date") || "");
  const [passengerCount, setPassengerCount] = useState(parseInt(searchParams.get("passengers")) || 1);
  const [tripType, setTripType] = useState(searchParams.get("trip_type") || "one-way"); // one-way or round-trip
  
  // Filters
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [classType, setClassType] = useState("economy");
  const [flightType, setFlightType] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [sortBy, setSortBy] = useState("price");
  
  const [availableAirlines, setAvailableAirlines] = useState([]);

  useEffect(() => {
    // Auto search if there are search params from URL
    const urlOrigin = searchParams.get("origin");
    const urlDestination = searchParams.get("destination");
    const urlDate = searchParams.get("departure_date");
    
    if (urlOrigin || urlDestination || urlDate) {
      setOrigin(urlOrigin || "");
      setDestination(urlDestination || "");
      setDepartureDate(urlDate || "");
      // Auto search with URL params
      setTimeout(() => {
        handleSearch();
      }, 100);
    } else {
      // Auto-load all flights when page first loads (no search params)
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Note: Removed auto-search on filter change to prevent infinite loops

  const handleSearch = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validation - Cho phép tìm kiếm không có điều kiện để xem tất cả chuyến bay
    // if (!origin && !destination && !departureDate) {
    //   alert("Vui lòng nhập ít nhất một thông tin tìm kiếm (điểm đi, điểm đến hoặc ngày đi)");
    //   return;
    // }

    console.log("handleSearch called with:", { origin, destination, departureDate, passengerCount, classType });
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (origin) params.append("origin", origin);
      if (destination) params.append("destination", destination);
      if (departureDate) params.append("departure_date", departureDate);
      if (passengerCount) params.append("passengers", passengerCount);
      if (classType) params.append("class_type", classType);

      if (returnDate && tripType === "round-trip") {
        params.append("return_date", returnDate);
      }

      if (selectedAirlines.length > 0) {
        // Support multiple airlines
        selectedAirlines.forEach(airline => {
          params.append("airline", airline);
        });
      }

      if (flightType) {
        params.append("flight_type", flightType);
      }

      if (priceRange[0] > 0) params.append("min_price", priceRange[0]);
      if (priceRange[1] < 10000000) params.append("max_price", priceRange[1]);

      params.append("sort_by", sortBy);

      const url = `/flights?${params.toString()}`;
      console.log("Searching flights with URL:", url);
      const response = await api.get(url);
      console.log("Flight search response:", response.data);
      console.log("Flights array:", response.data.flights);
      console.log("Total flights:", response.data.total);
      
      const flightsData = response.data.flights || [];
      const totalCount = response.data.total || flightsData.length;
      
      console.log("Setting flights:", flightsData);
      console.log("Setting total:", totalCount);
      
      setFlights(flightsData);
      setTotal(totalCount);

      // Extract unique airlines
      const airlines = [...new Set(flightsData.map(f => f.airline))];
      console.log("Available airlines:", airlines);
      setAvailableAirlines(airlines);
    } catch (error) {
      console.error("Error searching flights:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);
      
      setFlights([]);
      setTotal(0);
      
      // Show more detailed error message
      if (error.response?.status === 500) {
        alert("Lỗi server khi tìm kiếm chuyến bay. Vui lòng thử lại sau.");
      } else if (error.response?.status === 404) {
        alert("Không tìm thấy API. Vui lòng kiểm tra kết nối server.");
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        alert("Không thể kết nối đến server. Vui lòng kiểm tra backend server có đang chạy không.");
      } else {
        alert("Có lỗi xảy ra khi tìm kiếm chuyến bay: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getPrice = (flight) => {
    const priceField = `${classType}_price`;
    return flight[priceField] || flight.economy_price || 0;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Hero Section */}
      <div style={{ 
        background: "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)", 
        padding: "60px 20px 40px",
        color: "#fff"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "12px", color: "#fff" }}>
            Đặt vé máy bay giá rẻ
          </h1>
          <p style={{ fontSize: "18px", marginBottom: "32px", opacity: 0.9 }}>
            Tìm kiếm và so sánh các chuyến bay tốt nhất cho hành trình của bạn.
          </p>
          
          {/* Search Form */}
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
          }}>
            {/* Trip Type */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <button
                onClick={() => setTripType("one-way")}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  background: tripType === "one-way" ? "#0E7490" : "#f1f5f9",
                  color: tripType === "one-way" ? "#fff" : "#1e293b",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Một chiều
              </button>
              <button
                onClick={() => setTripType("round-trip")}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  background: tripType === "round-trip" ? "#0E7490" : "#f1f5f9",
                  color: tripType === "round-trip" ? "#fff" : "#1e293b",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Khứ hồi
              </button>
            </div>

            <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                  Điểm đi
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(e);
                    }
                  }}
                  placeholder="Hà Nội (HAN)"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px"
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                  Điểm đến
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch(e);
                    }
                  }}
                  placeholder="TP. Hồ Chí Minh (SGN)"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px"
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                  Ngày đi
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px"
                  }}
                />
              </div>
              {tripType === "round-trip" && (
                <div style={{ flex: 1, minWidth: "150px" }}>
                  <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                    Ngày về
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={departureDate || new Date().toISOString().split('T')[0]}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px"
                    }}
                  />
                </div>
              )}
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                  Hành khách
                </label>
                <select
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    background: "#fff",
                    cursor: "pointer"
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'hành khách' : 'hành khách'}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                onClick={(e) => {
                  // Ensure search is triggered on click
                  if (!loading) {
                    handleSearch(e);
                  }
                }}
                style={{
                  background: loading ? "#94a3b8" : "#0E7490",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  alignSelf: "flex-end"
                }}
              >
                {loading ? "Đang tìm..." : "Tìm chuyến bay"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px", display: "flex", gap: "24px" }}>
          {/* Left Sidebar - Filters */}
          <div style={{ width: "280px", flexShrink: 0 }}>
            <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px", color: "#1e293b" }}>Bộ lọc</h3>

              {/* Airlines */}
              {availableAirlines.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "block", color: "#1e293b" }}>
                    Hãng hàng không
                  </label>
                  {availableAirlines.map((airline) => (
                    <label key={airline} style={{ display: "flex", alignItems: "center", marginBottom: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedAirlines.includes(airline)}
                        onChange={() => {
                          if (selectedAirlines.includes(airline)) {
                            setSelectedAirlines(selectedAirlines.filter(a => a !== airline));
                          } else {
                            setSelectedAirlines([...selectedAirlines, airline]);
                          }
                        }}
                        style={{ marginRight: "8px" }}
                      />
                      <span style={{ fontSize: "14px", color: "#1e293b" }}>{airline}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Class Type */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "block", color: "#1e293b" }}>
                  Hạng vé
                </label>
                <label style={{ display: "flex", alignItems: "center", marginBottom: "8px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="class"
                    checked={classType === "economy"}
                    onChange={() => setClassType("economy")}
                    style={{ marginRight: "8px" }}
                  />
                  <span style={{ fontSize: "14px", color: "#1e293b" }}>Phổ thông</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", marginBottom: "8px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="class"
                    checked={classType === "business"}
                    onChange={() => setClassType("business")}
                    style={{ marginRight: "8px" }}
                  />
                  <span style={{ fontSize: "14px", color: "#1e293b" }}>Thương gia</span>
                </label>
              </div>

              {/* Flight Type */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "block", color: "#1e293b" }}>
                  Loại chuyến bay
                </label>
                <label style={{ display: "flex", alignItems: "center", marginBottom: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={flightType === "direct"}
                    onChange={() => setFlightType(flightType === "direct" ? "" : "direct")}
                    style={{ marginRight: "8px" }}
                  />
                  <span style={{ fontSize: "14px", color: "#1e293b" }}>Bay thẳng</span>
                </label>
              </div>

              {/* Price Range */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", display: "block", color: "#1e293b" }}>
                  Khoảng giá
                </label>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                  <span>{Number(priceRange[0]).toLocaleString()}₫</span>
                  <span>{Number(priceRange[1]).toLocaleString()}₫+</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000000"
                  step="100000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  style={{ width: "100%" }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleSearch()}
                style={{
                  width: "100%",
                  background: "#0E7490",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>

          {/* Right Content - Flight Results */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                Tìm thấy {total} chuyến bay phù hợp
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "#64748b" }}>Sắp xếp theo:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    handleSearch();
                  }}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  <option value="price">Giá thấp nhất</option>
                  <option value="duration">Thời gian ngắn nhất</option>
                  <option value="departure">Giờ khởi hành sớm nhất</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Đang tải...</div>
            ) : flights.length === 0 ? (
              <div style={{ 
                textAlign: "center", 
                padding: "60px 40px", 
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>✈️</div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
                  {origin || destination || departureDate 
                    ? "Không tìm thấy chuyến bay nào" 
                    : "Vui lòng nhập thông tin tìm kiếm"}
                </div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>
                  {origin || destination || departureDate
                    ? "Hãy thử thay đổi điều kiện tìm kiếm hoặc chọn ngày khác"
                    : "Nhập điểm đi, điểm đến và ngày đi để tìm chuyến bay"}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {flights.map((flight) => (
                  <div
                    key={flight.id}
                    style={{
                      background: "#fff",
                      borderRadius: "12px",
                      padding: "20px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <div style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b" }}>
                          {flight.airline}
                        </div>
                        <div style={{ fontSize: "14px", color: "#64748b" }}>
                          {flight.flight_number}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                        <div>
                          <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>
                            {formatTime(flight.departure_date)}
                          </div>
                          <div style={{ fontSize: "14px", color: "#64748b" }}>
                            {flight.origin_code}
                          </div>
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                            {formatDuration(flight.duration)}
                          </div>
                          <div style={{ 
                            height: "2px", 
                            background: "#e5e7eb", 
                            position: "relative",
                            marginBottom: "4px"
                          }}>
                            <div style={{
                              position: "absolute",
                              left: "50%",
                              top: "50%",
                              transform: "translate(-50%, -50%)",
                              background: "#fff",
                              padding: "0 8px",
                              fontSize: "12px",
                              color: "#64748b"
                            }}>
                              {flight.flight_type === "direct" ? "Bay thẳng" : "Có quá cảnh"}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>
                            {formatTime(flight.arrival_date)}
                          </div>
                          <div style={{ fontSize: "14px", color: "#64748b" }}>
                            {flight.destination_code}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", marginLeft: "24px" }}>
                      <div style={{ fontSize: "24px", fontWeight: 700, color: "#0E7490", marginBottom: "8px" }}>
                        {Number(getPrice(flight)).toLocaleString()}₫
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                        /khách
                      </div>
                      <button
                        onClick={() => navigate(`/flights/${flight.id}?passengers=${passengerCount}&class=${classType}${returnDate ? `&return_date=${returnDate}` : ''}${tripType === "round-trip" ? `&trip_type=round-trip` : ''}`)}
                        style={{
                          background: "#0E7490",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 20px",
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Chọn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

