import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function FlightDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [flight, setFlight] = useState(null);
  const [returnFlight, setReturnFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passengers, setPassengers] = useState(searchParams.get("passengers") || "1");
  const [classType, setClassType] = useState(searchParams.get("class") || "economy");
  const returnDate = searchParams.get("return_date");
  
  // Combo booking states
  const [suggestedTours, setSuggestedTours] = useState([]);
  const [suggestedHotels, setSuggestedHotels] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showTourSuggestions, setShowTourSuggestions] = useState(false);
  const [showHotelSuggestions, setShowHotelSuggestions] = useState(false);

  useEffect(() => {
    fetchFlight();
  }, [id]);

  const fetchFlight = async () => {
    try {
      const response = await api.get(`/flights/${id}`);
      setFlight(response.data);
      
      if (returnDate) {
        // Try to find return flight
        const returnRes = await api.get(`/flights?destination=${response.data.origin_code}&origin=${response.data.destination_code}&departure_date=${returnDate}`);
        if (returnRes.data.flights && returnRes.data.flights.length > 0) {
          setReturnFlight(returnRes.data.flights[0]);
        }
      }
      
      // Fetch suggested tours and hotels for combo
      if (response.data?.destination) {
        fetchComboSuggestions(response.data.destination);
      }
    } catch (error) {
      console.error("Error fetching flight:", error);
      alert("Không tìm thấy chuyến bay");
      navigate("/flights");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch combo suggestions
  const fetchComboSuggestions = async (destination) => {
    if (!destination) return;
    
    setLoadingSuggestions(true);
    try {
      // Extract city name from destination (e.g., "Vũng Tàu" from "Vũng Tàu (VTG)")
      const destinationCity = destination.replace(/\s*\([A-Z]{3}\)\s*/, '').trim();
      
      // Fetch tours in the same location
      try {
        const tourRes = await api.get(`/tours?destination=${encodeURIComponent(destinationCity)}&limit=5`);
        const tours = tourRes.data?.tours || tourRes.data || [];
        setSuggestedTours(tours);
        console.log(`Found ${tours.length} tours for ${destinationCity}`);
      } catch (tourError) {
        console.error("Error fetching tours:", tourError);
        setSuggestedTours([]);
      }
      
      // Fetch hotels in the same location
      try {
        const hotelRes = await api.get(`/hotels?location=${encodeURIComponent(destinationCity)}&limit=5`);
        const hotels = hotelRes.data.hotels || hotelRes.data || [];
        setSuggestedHotels(hotels);
        console.log(`Found ${hotels.length} hotels for ${destinationCity}`);
      } catch (hotelError) {
        console.error("Error fetching hotels:", hotelError);
        setSuggestedHotels([]);
      }
    } catch (error) {
      console.error("Error fetching combo suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { 
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
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

  const calculateTotal = () => {
    if (!flight) return 0;
    const basePrice = getPrice(flight) * parseInt(passengers.split(" ")[0] || 1);
    const returnPrice = returnFlight ? getPrice(returnFlight) * parseInt(passengers.split(" ")[0] || 1) : 0;
    return basePrice + returnPrice;
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 20px" }}>Đang tải...</div>;
  }

  if (!flight) {
    return <div style={{ textAlign: "center", padding: "60px 20px" }}>Không tìm thấy chuyến bay</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: "24px", fontSize: "14px", color: "#64748b" }}>
          <span>Trang chủ / </span>
          <span>Tìm chuyến bay / </span>
          <span style={{ color: "#1e293b", fontWeight: 600 }}>Chi tiết chuyến bay</span>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "32px", color: "#1e293b" }}>
          Chi tiết chuyến bay
        </h1>

        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          {/* Left - Flight Details */}
          <div style={{ flex: 2, minWidth: "600px" }}>
            {/* Outbound Flight */}
            <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ width: "60px", height: "60px", background: "#0E7490", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "24px", fontWeight: 700 }}>
                  {flight.airline.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>
                    {flight.airline}
                  </div>
                  <div style={{ fontSize: "14px", color: "#64748b" }}>
                    {flight.flight_number} | {classType === "economy" ? "Phổ thông" : classType === "business" ? "Thương gia" : "Hạng nhất"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "20px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    {formatTime(flight.departure_date)}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 600, color: "#0E7490", marginBottom: "4px" }}>
                    {flight.origin_code}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {flight.origin_airport}
                  </div>
                </div>

                <div style={{ flex: 1, textAlign: "center", position: "relative" }}>
                  <div style={{ height: "2px", background: "#e5e7eb", position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      background: "#fff",
                      padding: "4px 8px",
                      fontSize: "12px",
                      color: "#64748b"
                    }}>
                      {formatDuration(flight.duration)}
                    </div>
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
                    {flight.flight_type === "direct" ? "Bay thẳng" : "Có quá cảnh"}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    {formatTime(flight.arrival_date)}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 600, color: "#0E7490", marginBottom: "4px" }}>
                    {flight.destination_code}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {flight.destination_airport}
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: "16px", borderTop: "1px solid #e5e7eb", fontSize: "14px", color: "#64748b" }}>
                {formatDate(flight.departure_date)}
              </div>
            </div>

            {/* Return Flight */}
            {returnFlight && (
              <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#1e293b" }}>
                  Chuyến về
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ width: "60px", height: "60px", background: "#0E7490", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "24px", fontWeight: 700 }}>
                    {returnFlight.airline.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>
                      {returnFlight.airline}
                    </div>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>
                      {returnFlight.flight_number} | {classType === "economy" ? "Phổ thông" : classType === "business" ? "Thương gia" : "Hạng nhất"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                      {formatTime(returnFlight.departure_date)}
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 600, color: "#0E7490" }}>
                      {returnFlight.origin_code}
                    </div>
                  </div>

                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ height: "2px", background: "#e5e7eb" }}></div>
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
                      {formatDuration(returnFlight.duration)} • {returnFlight.flight_type === "direct" ? "Bay thẳng" : "Có quá cảnh"}
                    </div>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                      {formatTime(returnFlight.arrival_date)}
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 600, color: "#0E7490" }}>
                      {returnFlight.destination_code}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "#1e293b" }}>
                Chi tiết hành lý
              </h3>
              <div style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.8" }}>
                <div>Hành lý xách tay: {flight.baggage_carry_on || "7kg"} mỗi hành khách</div>
                <div>Hành lý ký gửi: {flight.baggage_checked || "23kg"} mỗi hành khách</div>
                <div style={{ marginTop: "8px", fontStyle: "italic" }}>
                  Có thể mua thêm hành lý ở các bước sau.
                </div>
              </div>
            </div>
          </div>

          {/* Right - Price Summary */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "sticky", top: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px", color: "#1e293b" }}>
                Tóm tắt giá vé
              </h3>

              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#64748b" }}>
                  <span>Giá vé cơ bản (x{passengers.split(" ")[0] || 1} Người lớn)</span>
                  <span>{Number(getPrice(flight) * parseInt(passengers.split(" ")[0] || 1)).toLocaleString()}₫</span>
                </div>
                {returnFlight && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#64748b" }}>
                    <span>Chuyến về (x{passengers.split(" ")[0] || 1} Người lớn)</span>
                    <span>{Number(getPrice(returnFlight) * parseInt(passengers.split(" ")[0] || 1)).toLocaleString()}₫</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#64748b" }}>
                  <span>Thuế và phí</span>
                  <span>{Number(calculateTotal() * 0.2).toLocaleString()}₫</span>
                </div>
              </div>

              <div style={{ 
                paddingTop: "16px", 
                borderTop: "2px solid #e5e7eb", 
                marginTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>Tổng cộng</span>
                <span style={{ fontSize: "24px", fontWeight: 700, color: "#0E7490" }}>
                  {Number(calculateTotal() * 1.2).toLocaleString()}₫
                </span>
              </div>

              <button
                onClick={() => {
                  // Save selected combo items to localStorage
                  if (selectedTour || selectedHotel) {
                    const comboData = {
                      selectedTour: selectedTour ? {
                        id: selectedTour.id,
                        name: selectedTour.name,
                        destination: selectedTour.destination,
                        price: selectedTour.price
                      } : null,
                      selectedHotel: selectedHotel ? {
                        id: selectedHotel.id,
                        name: selectedHotel.name,
                        location: selectedHotel.location,
                        price_per_night: selectedHotel.price_per_night
                      } : null,
                      flightId: id
                    };
                    localStorage.setItem("flight_combo", JSON.stringify(comboData));
                  }
                  navigate(`/flights/${id}/book?passengers=${passengers}&class=${classType}${returnDate ? `&return_date=${returnDate}&return_flight_id=${returnFlight?.id}` : ''}`);
                }}
                style={{
                  width: "100%",
                  background: "#0E7490",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "14px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: "20px"
                }}
              >
                Tiếp tục
              </button>
            </div>
          </div>

          {/* Combo Booking Suggestions - Main Content Section */}
          {flight?.destination && (
            <div style={{ 
              marginTop: "40px", 
              padding: "24px", 
              background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", 
              borderRadius: "16px", 
              border: "2px solid #0E7490",
              boxShadow: "0 4px 12px rgba(14, 116, 144, 0.15)"
            }}>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎁</div>
                <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px", color: "#0E7490" }}>
                  Gợi ý Combo - Tiết kiệm hơn với mã khuyến mãi combo!
                </h2>
                <p style={{ fontSize: "16px", color: "#64748b", margin: 0 }}>
                  Thêm tour hoặc khách sạn cùng địa điểm để được áp dụng mã khuyến mãi combo
                </p>
              </div>

              {loadingSuggestions && (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "16px" }}>
                  Đang tải gợi ý...
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                {/* Tour Suggestions */}
                {!loadingSuggestions && suggestedTours.length > 0 && (
                  <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", margin: 0 }}>🎯 Tour tại {flight?.destination}</h3>
                      <button
                        type="button"
                        onClick={() => setShowTourSuggestions(!showTourSuggestions)}
                        style={{
                          background: "#0E7490",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 500
                        }}
                      >
                        {showTourSuggestions ? "Ẩn" : "Xem"}
                      </button>
                    </div>
                    {showTourSuggestions && (
                      <div style={{ display: "grid", gap: "12px" }}>
                        {suggestedTours.slice(0, 3).map((tour) => (
                          <div
                            key={tour.id}
                            onClick={() => {
                              if (selectedTour?.id === tour.id) {
                                setSelectedTour(null);
                              } else {
                                setSelectedTour(tour);
                              }
                            }}
                            style={{
                              padding: "16px",
                              background: selectedTour?.id === tour.id ? "#e0f2fe" : "#f8fafc",
                              border: selectedTour?.id === tour.id ? "2px solid #0E7490" : "1px solid #e5e7eb",
                              borderRadius: "8px",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "4px", color: "#1e293b" }}>{tour.name}</div>
                            <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>{tour.destination}</div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ color: "#0E7490", fontSize: "16px", fontWeight: 600 }}>
                                {Number(tour.price).toLocaleString()} ₫
                              </div>
                              {selectedTour?.id === tour.id && (
                                <div style={{ color: "#0E7490", fontSize: "20px" }}>✓</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Hotel Suggestions */}
                {!loadingSuggestions && suggestedHotels.length > 0 && (
                  <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", margin: 0 }}>🏨 Khách sạn tại {flight?.destination}</h3>
                      <button
                        type="button"
                        onClick={() => setShowHotelSuggestions(!showHotelSuggestions)}
                        style={{
                          background: "#0E7490",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 500
                        }}
                      >
                        {showHotelSuggestions ? "Ẩn" : "Xem"}
                      </button>
                    </div>
                    {showHotelSuggestions && (
                      <div style={{ display: "grid", gap: "12px" }}>
                        {suggestedHotels.slice(0, 3).map((hotel) => (
                          <div
                            key={hotel.id}
                            onClick={() => {
                              if (selectedHotel?.id === hotel.id) {
                                setSelectedHotel(null);
                              } else {
                                setSelectedHotel(hotel);
                              }
                            }}
                            style={{
                              padding: "16px",
                              background: selectedHotel?.id === hotel.id ? "#e0f2fe" : "#f8fafc",
                              border: selectedHotel?.id === hotel.id ? "2px solid #0E7490" : "1px solid #e5e7eb",
                              borderRadius: "8px",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "4px", color: "#1e293b" }}>{hotel.name}</div>
                            <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>{hotel.location}</div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ color: "#0E7490", fontSize: "16px", fontWeight: 600 }}>
                                {Number(hotel.price_per_night).toLocaleString()} ₫/đêm
                              </div>
                              {selectedHotel?.id === hotel.id && (
                                <div style={{ color: "#0E7490", fontSize: "20px" }}>✓</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {(selectedTour || selectedHotel) && (
                <div style={{ 
                  marginTop: "20px", 
                  padding: "16px", 
                  background: "#dcfce7", 
                  borderRadius: "12px", 
                  fontSize: "16px", 
                  color: "#166534",
                  textAlign: "center",
                  fontWeight: 600
                }}>
                  ✓ Đã chọn: {selectedTour && "Tour"} {selectedTour && selectedHotel && " + "} {selectedHotel && "Khách sạn"}
                  <br />
                  <span style={{ fontSize: "14px", color: "#15803d", fontWeight: 400 }}>
                    Bạn sẽ được áp dụng mã khuyến mãi combo khi thanh toán
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


