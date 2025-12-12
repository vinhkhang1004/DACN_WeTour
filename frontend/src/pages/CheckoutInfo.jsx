import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function CheckoutInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tourId = params.get("tourId") || "";
  const { user } = useContext(AuthContext);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState(1);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Combo booking states
  const [suggestedHotels, setSuggestedHotels] = useState([]);
  const [suggestedFlights, setSuggestedFlights] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showHotelSuggestions, setShowHotelSuggestions] = useState(false);
  const [showFlightSuggestions, setShowFlightSuggestions] = useState(false);

  useEffect(() => {
    const fetchTour = async () => {
      if (!tourId) return;
      try {
        const res = await api.get(`/tours/${tourId}`);
        setTour(res.data);
        
        // Parse available_dates from JSON
        let availableDates = [];
        if (res.data.available_dates) {
          try {
            availableDates = JSON.parse(res.data.available_dates);
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
        
        // Set first available date as default if available
        if (availableDates.length > 0) {
          setDate(availableDates[0]);
        } else if (res.data.departure_date) {
          // Fallback to departure_date for backward compatibility
          const departureDate = new Date(res.data.departure_date);
          departureDate.setHours(0, 0, 0, 0);
          if (departureDate >= today) {
          setDate(departureDate.toISOString().split('T')[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching tour:", error);
        alert("Không thể tải thông tin tour");
        navigate("/tours");
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId, navigate]);

  // Fetch suggested hotels and flights based on tour destination
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!tour?.destination) {
        console.log("No tour destination found");
        return;
      }
      
      console.log("Fetching suggestions for destination:", tour.destination);
      setLoadingSuggestions(true);
      try {
        // Fetch hotels in the same location - try multiple search strategies
        try {
          const hotelRes = await api.get(`/hotels?location=${encodeURIComponent(tour.destination)}&limit=10`);
          console.log("Hotels response:", hotelRes.data);
          const hotels = hotelRes.data.hotels || hotelRes.data || [];
          setSuggestedHotels(hotels);
          console.log(`Found ${hotels.length} hotels`);
        } catch (hotelError) {
          console.error("Error fetching hotels:", hotelError);
          setSuggestedHotels([]);
        }
        
        // Fetch flights to the destination
        // Try to match destination with flight destination format
        // Extract city name from destination (e.g., "Vũng Tàu" from "Vũng Tàu, Bà Rịa - Vũng Tàu")
        const destinationCity = tour.destination.split(',')[0].trim();
        const majorCities = ["Hà Nội (HAN)", "TP. Hồ Chí Minh (SGN)", "Đà Nẵng (DAD)", "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng"];
        
        try {
          const flightPromises = majorCities.map(city => 
            api.get(`/flights?origin=${encodeURIComponent(city)}&destination=${encodeURIComponent(destinationCity)}&limit=5`)
              .catch((err) => {
                console.log(`No flights found from ${city} to ${destinationCity}`);
                return { data: { flights: [] } };
              })
          );
          const flightResults = await Promise.all(flightPromises);
          const allFlights = flightResults.flatMap(res => res.data.flights || []);
          // Remove duplicates and limit to 5
          const uniqueFlights = Array.from(new Map(allFlights.map(f => [f.id, f])).values()).slice(0, 5);
          setSuggestedFlights(uniqueFlights);
          console.log(`Found ${uniqueFlights.length} flights`);
        } catch (flightError) {
          console.error("Error fetching flights:", flightError);
          setSuggestedFlights([]);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    
    if (tour?.destination) {
      fetchSuggestions();
    }
  }, [tour?.destination]);

  const handleNext = () => {
    if (!fullName || !email || !phone || !date) {
      return alert("Vui lòng điền đủ thông tin");
    }
    
    // Validate people count
    if (people <= 0) {
      return alert("Số người phải lớn hơn 0");
    }
    
    if (tour?.max_people && people > tour.max_people) {
      return alert(`Số người tối đa cho tour này là ${tour.max_people} người`);
    }
    
    // Validate date with available_dates
    let availableDates = [];
    if (tour?.available_dates) {
      try {
        availableDates = JSON.parse(tour.available_dates);
        if (!Array.isArray(availableDates)) availableDates = [];
      } catch {
        availableDates = [];
      }
    }
    
    if (availableDates.length > 0) {
      const selectedDateStr = date;
      if (!availableDates.includes(selectedDateStr)) {
        return alert("Vui lòng chọn một trong các ngày khởi hành đã được chọn sẵn");
      }
    } else if (tour?.departure_date) {
      // Fallback validation for backward compatibility
      const departureDate = new Date(tour.departure_date);
      const selectedDate = new Date(date);
      departureDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate.getTime() !== departureDate.getTime()) {
        return alert(`Ngày đi phải là ${departureDate.toLocaleDateString('vi-VN')}`);
      }
    }
    
    const payload = { 
      fullName, 
      email, 
      phone, 
      people, 
      date, 
      notes, 
      tourId,
      // Combo booking data
      selectedHotel: selectedHotel ? {
        id: selectedHotel.id,
        name: selectedHotel.name,
        price_per_night: selectedHotel.price_per_night
      } : null,
      selectedFlight: selectedFlight ? {
        id: selectedFlight.id,
        flight_number: selectedFlight.flight_number,
        origin: selectedFlight.origin,
        destination: selectedFlight.destination,
        economy_price: selectedFlight.economy_price,
        business_price: selectedFlight.business_price,
        first_class_price: selectedFlight.first_class_price
      } : null
    };
    localStorage.setItem("checkout_info", JSON.stringify(payload));
    navigate(`/checkout/payment?tourId=${encodeURIComponent(tourId)}`);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 20, textAlign: "center" }}>
        <p>Đang tải thông tin tour...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 20, textAlign: "center" }}>
        <p>Không tìm thấy tour</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>🧾 Bước 1/3: Thông tin đặt tour</h1>
      
      {/* Tour Info */}
      {tour && (
        <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{tour.name}</div>
          <div style={{ fontSize: 14, color: "#64748b" }}>
            {tour.destination} • {tour.duration}
          </div>
          {(() => {
            let availableDates = [];
            if (tour?.available_dates) {
              try {
                availableDates = JSON.parse(tour.available_dates);
                if (!Array.isArray(availableDates)) availableDates = [];
              } catch {
                availableDates = [];
              }
            }
            
            if (availableDates.length > 0) {
              return (
                <div style={{ fontSize: 14, color: "#0E7490", marginTop: 4 }}>
                  Các ngày khởi hành: {availableDates.map(d => new Date(d).toLocaleDateString('vi-VN')).join(', ')}
                </div>
              );
            } else if (tour?.departure_date) {
              return (
                <div style={{ fontSize: 14, color: "#0E7490", marginTop: 4 }}>
                  Ngày đi: {new Date(tour.departure_date).toLocaleDateString('vi-VN')}
                </div>
              );
            }
            return null;
          })()}
          {tour.max_people && (
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
              Số người tối đa: {tour.max_people}
            </div>
          )}
        </div>
      )}
      
      <div style={{ display: "grid", gap: 12 }}>
        <input 
          placeholder="Họ và tên *" 
          value={fullName} 
          onChange={e=>setFullName(e.target.value)}
          style={{ padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "16px" }}
        />
        <input 
          placeholder="Email *" 
          type="email" 
          value={email} 
          onChange={e=>setEmail(e.target.value)}
          style={{ padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "16px" }}
        />
        <input 
          placeholder="Số điện thoại *" 
          value={phone} 
          onChange={e=>setPhone(e.target.value)}
          style={{ padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "16px" }}
        />
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Ngày khởi hành *</label>
          {(() => {
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
            
            if (availableDates.length > 0) {
              // Show dropdown if admin has selected dates
              return (
                <div>
                  <select
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    style={{ 
                      padding: "12px", 
                      border: "1px solid #e5e7eb", 
                      borderRadius: "8px", 
                      fontSize: "16px",
                      width: "100%",
                      boxSizing: "border-box",
                      background: "#fff"
                    }}
                  >
                    <option value="">-- Chọn ngày khởi hành --</option>
                    {availableDates.map((d, idx) => (
                      <option key={idx} value={d}>
                        {new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Vui lòng chọn một trong các ngày đã được chọn sẵn
                  </div>
                </div>
              );
            } else if (tour?.departure_date) {
              // Fallback: show disabled input for backward compatibility
              return (
                <div>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e=>setDate(e.target.value)}
                    disabled
                    style={{ 
                      padding: "12px", 
                      border: "1px solid #e5e7eb", 
                      borderRadius: "8px", 
                      fontSize: "16px",
                      width: "100%",
                      boxSizing: "border-box",
                      background: "#f1f5f9"
                    }}
                  />
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Ngày đi đã được cố định cho tour này
                  </div>
                </div>
              );
            } else {
              // No dates set, allow free selection
              return (
                <input 
                  type="date" 
                  value={date} 
                  onChange={e=>setDate(e.target.value)}
                  required
                  style={{ 
                    padding: "12px", 
                    border: "1px solid #e5e7eb", 
                    borderRadius: "8px", 
                    fontSize: "16px",
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#fff"
                  }}
                />
              );
            }
          })()}
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Số người *</label>
          <input 
            type="number" 
            min={1} 
            max={tour?.max_people || undefined}
            value={people} 
            onChange={e=>setPeople(Number(e.target.value)||1)}
            style={{ padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "16px", width: "100%", boxSizing: "border-box" }}
          />
          {tour?.max_people && (
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Tối đa {tour.max_people} người
            </div>
          )}
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Ghi chú (tùy chọn)</label>
          <textarea 
            placeholder="Nhập ghi chú của bạn (ví dụ: yêu cầu đặc biệt, dị ứng thức ăn, v.v.)" 
            value={notes} 
            onChange={e=>setNotes(e.target.value)}
            rows={4}
            style={{ 
              padding: "12px", 
              border: "1px solid #e5e7eb", 
              borderRadius: "8px", 
              fontSize: "16px", 
              width: "100%", 
              boxSizing: "border-box",
              resize: "vertical",
              fontFamily: "inherit"
            }}
          />
        </div>
      </div>

      {/* Combo Booking Suggestions - Always show if tour has destination */}
      {tour?.destination && (
        <div style={{ marginTop: 24, padding: 16, background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: "#0E7490" }}>
            🎁 Gợi ý Combo - Tiết kiệm hơn với mã khuyến mãi combo!
          </div>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
            Thêm khách sạn hoặc chuyến bay cùng địa điểm để được áp dụng mã khuyến mãi combo
          </div>

          {loadingSuggestions && (
            <div style={{ padding: 12, textAlign: "center", color: "#64748b" }}>
              Đang tải gợi ý...
            </div>
          )}

          {/* Hotel Suggestions */}
          {!loadingSuggestions && suggestedHotels.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>🏨 Khách sạn tại {tour?.destination}</div>
                <button
                  onClick={() => setShowHotelSuggestions(!showHotelSuggestions)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0E7490",
                    cursor: "pointer",
                    fontSize: 12,
                    textDecoration: "underline"
                  }}
                >
                  {showHotelSuggestions ? "Ẩn" : "Xem"}
                </button>
              </div>
              {showHotelSuggestions && (
                <div style={{ display: "grid", gap: 8 }}>
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
                        padding: 12,
                        background: selectedHotel?.id === hotel.id ? "#e0f2fe" : "#fff",
                        border: selectedHotel?.id === hotel.id ? "2px solid #0E7490" : "1px solid #e5e7eb",
                        borderRadius: 8,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{hotel.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{hotel.location}</div>
                        <div style={{ fontSize: 14, color: "#0E7490", marginTop: 4 }}>
                          {Number(hotel.price_per_night).toLocaleString()} ₫/đêm
                        </div>
                      </div>
                      {selectedHotel?.id === hotel.id && (
                        <div style={{ color: "#0E7490", fontSize: 20 }}>✓</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* Flight Suggestions */}
        {!loadingSuggestions && (
          suggestedFlights.length > 0 ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>✈️ Chuyến bay đến {tour?.destination}</div>
                <button
                  onClick={() => setShowFlightSuggestions(!showFlightSuggestions)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0E7490",
                    cursor: "pointer",
                    fontSize: 12,
                    textDecoration: "underline"
                  }}
                >
                  {showFlightSuggestions ? "Ẩn" : "Xem"}
                </button>
              </div>
              {showFlightSuggestions && (
                <div style={{ display: "grid", gap: 8 }}>
                  {suggestedFlights.slice(0, 3).map((flight) => (
                    <div
                      key={flight.id}
                      onClick={() => {
                        if (selectedFlight?.id === flight.id) {
                          setSelectedFlight(null);
                        } else {
                          setSelectedFlight(flight);
                        }
                      }}
                      style={{
                        padding: 12,
                        background: selectedFlight?.id === flight.id ? "#e0f2fe" : "#fff",
                        border: selectedFlight?.id === flight.id ? "2px solid #0E7490" : "1px solid #e5e7eb",
                        borderRadius: 8,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {flight.airline} {flight.flight_number}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {flight.origin} → {flight.destination}
                        </div>
                        <div style={{ fontSize: 14, color: "#0E7490", marginTop: 4 }}>
                          {Number(flight.economy_price || flight.business_price || flight.first_class_price).toLocaleString()} ₫
                        </div>
                      </div>
                      {selectedFlight?.id === flight.id && (
                        <div style={{ color: "#0E7490", fontSize: 20 }}>✓</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 12, background: "#fff", borderRadius: 6, fontSize: 13, color: "#64748b", textAlign: "center" }}>
              Không tìm thấy chuyến bay đến {tour?.destination}
            </div>
          )
        )}

          {(selectedHotel || selectedFlight) && (
            <div style={{ marginTop: 12, padding: 12, background: "#dcfce7", borderRadius: 6, fontSize: 13, color: "#166534" }}>
              ✓ Đã chọn: {selectedHotel && "Khách sạn"} {selectedHotel && selectedFlight && " + "} {selectedFlight && "Chuyến bay"}
              <br />
              <span style={{ fontSize: 12, color: "#15803d" }}>
                Bạn sẽ được áp dụng mã khuyến mãi combo ở bước thanh toán
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button 
          onClick={() => navigate(`/tours/${tourId}`)}
          style={{ 
            background: "#fff", 
            color: "#64748b", 
            border: "1px solid #e5e7eb", 
            padding: "10px 16px", 
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          Quay lại
        </button>
        <button 
          onClick={handleNext} 
          style={{ 
            background: "#0E7490", 
            color: "#fff", 
            border: "none", 
            padding: "10px 16px", 
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}


