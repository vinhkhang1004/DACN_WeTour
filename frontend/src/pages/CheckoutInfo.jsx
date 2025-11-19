import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function CheckoutInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tourId = params.get("tourId") || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState(1);
  const [date, setDate] = useState("");
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);

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
        
        // Set first available date as default if available
        if (availableDates.length > 0) {
          setDate(availableDates[0]);
        } else if (res.data.departure_date) {
          // Fallback to departure_date for backward compatibility
          const departureDate = new Date(res.data.departure_date);
          setDate(departureDate.toISOString().split('T')[0]);
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
    
    const payload = { fullName, email, phone, people, date, tourId };
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
            
            if (availableDates.length > 0) {
              // Show dropdown if admin has selected dates
              return (
                <>
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
                </>
              );
            } else if (tour?.departure_date) {
              // Fallback: show disabled input for backward compatibility
              return (
                <>
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
                </>
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
      </div>
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


