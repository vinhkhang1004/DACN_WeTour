import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function FlightBooking() {
  const { showError, showWarning, showSuccess } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  
  const [flight, setFlight] = useState(null);
  const [returnFlight, setReturnFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Thông tin hành khách, 2: Dịch vụ bổ sung, 3: Xác nhận, 4: Thanh toán
  const [booking, setBooking] = useState(null);
  
  const [passengerCount, setPassengerCount] = useState(parseInt(searchParams.get("passengers")?.split(" ")[0] || "1"));
  const [classType, setClassType] = useState(searchParams.get("class") || "economy");
  const returnFlightId = searchParams.get("return_flight_id");
  
  const [passengers, setPassengers] = useState([{
    salutation: "Ông",
    last_name: "",
    first_name: "",
    date_of_birth: ""
  }]);
  
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [promotionCode, setPromotionCode] = useState("");
  const [notes, setNotes] = useState("");
  
  // Combo booking states
  const [selectedTour, setSelectedTour] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  
  // Step 2: Additional services states
  const [selectedSeats, setSelectedSeats] = useState({}); // { passengerIndex: seatNumber }
  const [selectedReturnSeats, setSelectedReturnSeats] = useState({});
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [occupiedReturnSeats, setOccupiedReturnSeats] = useState([]);
  const [additionalBaggage, setAdditionalBaggage] = useState({}); // { passengerIndex: { weight: number, price: number } }
  const [loadingSeats, setLoadingSeats] = useState(false);

  useEffect(() => {
    fetchFlight();
    
    // Auto-fill user information
    if (user) {
      setContactEmail(user.email || "");
      setContactPhone(user.phone || "");
      
      // Auto-fill passenger information from user name
      if (user.name) {
        const nameParts = user.name.trim().split(/\s+/);
        if (nameParts.length > 0) {
          // Last part is usually first name, rest is last name
          const firstName = nameParts[nameParts.length - 1];
          const lastName = nameParts.slice(0, -1).join(" ");
          
          setPassengers([{
            salutation: "Ông",
            last_name: lastName.toUpperCase() || "",
            first_name: firstName.toUpperCase() || "",
            date_of_birth: ""
          }]);
        }
      }
      
      // Try to fetch full user data from API for more complete info
      const fetchUserData = async () => {
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const response = await api.get("/users/me", {
              headers: { Authorization: `Bearer ${token}` }
            });
            const userData = response.data;
            
            // Update contact info
            if (userData.email) setContactEmail(userData.email);
            if (userData.phone) setContactPhone(userData.phone);
            
            // Update passenger info if name is available
            if (userData.name) {
              const nameParts = userData.name.trim().split(/\s+/);
              if (nameParts.length > 0) {
                const firstName = nameParts[nameParts.length - 1];
                const lastName = nameParts.slice(0, -1).join(" ");
                
                setPassengers([{
                  salutation: "Ông",
                  last_name: lastName.toUpperCase() || "",
                  first_name: firstName.toUpperCase() || "",
                  date_of_birth: userData.date_of_birth || ""
                }]);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
      
      fetchUserData();
    }
    
    // Load combo selections from localStorage
    const comboData = localStorage.getItem("flight_combo");
    if (comboData) {
      try {
        const combo = JSON.parse(comboData);
        if (combo.flightId === id) {
          setSelectedTour(combo.selectedTour);
          setSelectedHotel(combo.selectedHotel);
        }
      } catch (e) {
        console.error("Error parsing flight combo data:", e);
      }
    }
  }, [id, user]);

  const fetchFlight = async () => {
    try {
      const response = await api.get(`/flights/${id}`);
      setFlight(response.data);
      
      if (returnFlightId) {
        const returnRes = await api.get(`/flights/${returnFlightId}`);
        setReturnFlight(returnRes.data);
      }
    } catch (error) {
      console.error("Error fetching flight:", error);
      showError("Không tìm thấy chuyến bay");
      navigate("/flights");
    } finally {
      setLoading(false);
    }
  };

  const addPassenger = () => {
    setPassengers([...passengers, {
      salutation: "Ông",
      last_name: "",
      first_name: "",
      date_of_birth: ""
    }]);
  };

  const removePassenger = (index) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const calculateTotal = () => {
    if (!flight) return 0;
    const priceField = `${classType}_price`;
    const basePrice = (flight[priceField] || flight.economy_price || 0) * passengerCount;
    const returnPrice = returnFlight ? (returnFlight[priceField] || returnFlight.economy_price || 0) * passengerCount : 0;
    const flightTotal = (basePrice + returnPrice) * 1.2; // Include taxes
    
    // Add combo prices
    const tourPrice = selectedTour ? (Number(selectedTour.price) * passengerCount) : 0;
    const hotelPrice = selectedHotel ? (Number(selectedHotel.price_per_night) * 1) : 0; // Assuming 1 night
    
    // Add additional services (baggage)
    const additionalServicesTotal = calculateAdditionalServicesTotal();
    
    // Add seat upgrade fee (if selecting first class seats)
    const seatUpgradeFee = calculateSeatUpgradeFee();
    
    return flightTotal + tourPrice + hotelPrice + additionalServicesTotal + seatUpgradeFee;
  };
  
  const calculateAdditionalServicesTotal = () => {
    let total = 0;
    // Baggage fees
    Object.values(additionalBaggage).forEach(bag => {
      if (bag && bag.price) {
        total += bag.price;
      }
    });
    return total;
  };
  
  // Auto-apply combo promotion when combo is selected
  useEffect(() => {
    const autoApplyComboPromo = async () => {
      // Only auto-apply if combo is selected and no promo is already applied
      if (!(selectedTour || selectedHotel)) return;
      if (promotionCode.trim()) return; // Don't override if user already entered a promo

      const total = calculateTotal();
      if (!total || total <= 0) return;

      try {
        // Determine service_type
        let serviceType = "flight";
        if (selectedTour && selectedHotel) {
          serviceType = "all";
        } else if (selectedTour) {
          serviceType = "tour_flight";
        } else if (selectedHotel) {
          serviceType = "hotel_flight";
        }
        
        // Fetch available promotions for this service type
        const promotionsRes = await api.get(`/promotions?service_type=${serviceType}&active=true&limit=50`);
        const promotions = promotionsRes.data?.promotions || promotionsRes.data || [];
        
        // Find the first valid combo promotion
        for (const promo of promotions) {
          if (!promo.code) continue;
          
          // Skip if not a combo promotion
          if (promo.service_type && 
              !["tour_flight", "hotel_flight", "all"].includes(promo.service_type)) {
            continue;
          }
          
          try {
            const checkRes = await api.post(`/promotions/check`, {
              code: promo.code,
              amount: total,
              service_type: serviceType
            });
            
            if (checkRes.data.valid) {
              // Auto-apply this promotion
              setPromotionCode(promo.code);
              break; // Only apply the first valid one
            }
          } catch (e) {
            // Continue to next promotion
            continue;
          }
        }
      } catch (error) {
        console.error("Error auto-applying combo promotion:", error);
        // Silently fail - user can still manually enter promo code
      }
    };

    // Only run when combo is selected and flight is loaded
    if ((selectedTour || selectedHotel) && flight && calculateTotal() > 0) {
      autoApplyComboPromo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTour, selectedHotel, flight]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passengers
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.last_name || !p.first_name || !p.date_of_birth) {
        showWarning(`Vui lòng điền đầy đủ thông tin cho hành khách ${i + 1}`);
        return;
      }
    }

    if (!contactEmail || !contactPhone) {
      showWarning("Vui lòng điền đầy đủ thông tin liên hệ");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const passengerInfo = passengers.map(p => ({
        salutation: p.salutation,
        full_name: `${p.last_name} ${p.first_name}`.trim(),
        last_name: p.last_name,
        first_name: p.first_name,
        date_of_birth: p.date_of_birth
      }));

      const response = await api.post(
        `/flights/${id}/book`,
        {
          return_flight_id: returnFlightId || null,
          passengers: passengerCount,
          class_type: classType,
          passenger_info: passengerInfo,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          promotion_code: promotionCode || null,
          notes: notes || null
        },
        { headers }
      );

      // Move to step 2 (Additional Services) instead of payment
      setCurrentStep(2);
    } catch (error) {
      console.error("Error booking flight:", error);
      showError(error.response?.data?.message || "Có lỗi xảy ra khi đặt vé");
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch occupied seats when entering step 2
  useEffect(() => {
    if (currentStep === 2 && flight) {
      fetchOccupiedSeats();
    }
  }, [currentStep, flight, id]);

  const fetchOccupiedSeats = async () => {
    setLoadingSeats(true);
    try {
      const response = await api.get(`/flights/${id}/seats`);
      setOccupiedSeats(response.data.occupied_seats || []);
      if (returnFlightId) {
        const returnResponse = await api.get(`/flights/${returnFlightId}/seats`);
        setOccupiedReturnSeats(returnResponse.data.occupied_seats || []);
      }
    } catch (error) {
      console.error("Error fetching occupied seats:", error);
    } finally {
      setLoadingSeats(false);
    }
  };

  // Handle step 2 submission (Additional Services)
  const handleAdditionalServicesSubmit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const passengerInfo = passengers.map(p => ({
        salutation: p.salutation,
        full_name: `${p.last_name} ${p.first_name}`.trim(),
        last_name: p.last_name,
        first_name: p.first_name,
        date_of_birth: p.date_of_birth
      }));

      // Prepare additional services
      const additionalServices = {
        seats: Object.values(selectedSeats).filter(s => s),
        return_seats: returnFlightId ? Object.values(selectedReturnSeats).filter(s => s) : null,
        baggage: additionalBaggage
      };

      const response = await api.post(
        `/flights/${id}/book`,
        {
          return_flight_id: returnFlightId || null,
          passengers: passengerCount,
          class_type: classType,
          passenger_info: passengerInfo,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          promotion_code: promotionCode || null,
          additional_services: additionalServices,
          notes: notes || null
        },
        { headers }
      );

      if (response.data.booking) {
        setBooking(response.data.booking);
        setCurrentStep(3); // Move to confirmation step
      } else {
        showSuccess("Đặt vé thành công!");
        navigate("/flights");
      }
    } catch (error) {
      console.error("Error booking flight:", error);
      showError(error.response?.data?.message || "Có lỗi xảy ra khi đặt vé");
    } finally {
      setSubmitting(false);
    }
  };

  const processPayment = async (method) => {
    if (!booking) return;
    
    setProcessing(true);
    const token = localStorage.getItem("token");
    
    if (!token) {
      showWarning("Vui lòng đăng nhập để thanh toán");
      setProcessing(false);
      return;
    }
    
    try {
      if (method === "vnpay") {
        const response = await api.post(
          "/flights/payment/vnpay/create",
          { flight_booking_id: booking.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        } else {
          showError("Không thể tạo link thanh toán VNPay");
          setProcessing(false);
        }
      } else if (method === "momo") {
        const response = await api.post(
          "/flights/payment/momo/create",
          { flight_booking_id: booking.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        } else {
          showError("Không thể tạo link thanh toán MoMo");
          setProcessing(false);
        }
      } else if (method === "cash") {
        if (!window.confirm(`Xác nhận thanh toán tiền mặt cho đặt vé này?\nSố tiền: ${Number(booking.total_price).toLocaleString()}₫`)) {
          setProcessing(false);
          return;
        }
        
        const response = await api.post(
          "/flights/payment/cash",
          { flight_booking_id: booking.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setProcessing(false);
        // Navigate directly to confirmation page
        navigate(`/flights/booking/${booking.id}/confirm`);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      showError("Có lỗi xảy ra: " + (error.response?.data?.message || error.message));
      setProcessing(false);
    }
  };

  // Generate seat map (typical airplane layout: 3-3 or 2-4-2 configuration)
  // First class: rows 1-10, Economy: rows 11-30
  const generateSeatMap = (isReturn = false) => {
    const firstClassRows = 10; // Hàng 1-10: Hạng nhất
    const economyRows = 20; // Hàng 11-30: Phổ thông
    const totalRows = firstClassRows + economyRows;
    const occupied = isReturn ? occupiedReturnSeats : occupiedSeats;
    const selected = isReturn ? selectedReturnSeats : selectedSeats;
    
    const seats = [];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F']; // 6 seats per row (3-3 configuration)
    
    for (let row = 1; row <= totalRows; row++) {
      const rowSeats = [];
      const isFirstClass = row <= firstClassRows;
      letters.forEach((letter, idx) => {
        const seatNumber = `${row}${letter}`;
        const isOccupied = occupied.includes(seatNumber);
        const passengerIndex = Object.keys(selected).find(idx => selected[idx] === seatNumber);
        const isSelected = passengerIndex !== undefined;
        
        rowSeats.push({
          number: seatNumber,
          letter,
          row,
          isOccupied,
          isSelected,
          isFirstClass,
          passengerIndex: passengerIndex ? parseInt(passengerIndex) : null
        });
      });
      seats.push(rowSeats);
    }
    
    return seats;
  };

  // Calculate upgrade fee for first class seats
  const calculateSeatUpgradeFee = () => {
    if (!flight) return 0;
    
    let upgradeFee = 0;
    const economyPrice = parseFloat(flight.economy_price || 0);
    const firstClassPrice = parseFloat(flight.first_class_price || 0);
    
    if (firstClassPrice > economyPrice) {
      // Check selected seats for first class
      Object.values(selectedSeats).forEach(seatNumber => {
        if (seatNumber) {
          const row = parseInt(seatNumber.match(/\d+/)?.[0] || "0");
          if (row >= 1 && row <= 10) {
            // This is a first class seat, add upgrade fee
            upgradeFee += (firstClassPrice - economyPrice);
          }
        }
      });
      
      // Check return flight seats if exists
      if (returnFlight) {
        const returnEconomyPrice = parseFloat(returnFlight.economy_price || 0);
        const returnFirstClassPrice = parseFloat(returnFlight.first_class_price || 0);
        if (returnFirstClassPrice > returnEconomyPrice) {
          Object.values(selectedReturnSeats).forEach(seatNumber => {
            if (seatNumber) {
              const row = parseInt(seatNumber.match(/\d+/)?.[0] || "0");
              if (row >= 1 && row <= 10) {
                upgradeFee += (returnFirstClassPrice - returnEconomyPrice);
              }
            }
          });
        }
      }
    }
    
    return upgradeFee;
  };

  const handleSeatClick = (seatNumber, passengerIndex, isReturn = false) => {
    // Check if this is a first class seat
    const row = parseInt(seatNumber.match(/\d+/)?.[0] || "0");
    const isFirstClassSeat = row >= 1 && row <= 10;
    
    if (isReturn) {
      const newSeats = { ...selectedReturnSeats };
      // If seat already selected by this passenger, deselect it
      if (newSeats[passengerIndex] === seatNumber) {
        delete newSeats[passengerIndex];
      } else {
        // Check if seat is occupied
        if (occupiedReturnSeats.includes(seatNumber)) {
          showWarning("Ghế này đã được chọn bởi hành khách khác");
          return;
        }
        // Check if another passenger already selected this seat
        const existingPassenger = Object.keys(newSeats).find(idx => newSeats[idx] === seatNumber);
        if (existingPassenger) {
          showWarning("Ghế này đã được chọn bởi hành khách khác trong đơn của bạn");
          return;
        }
        
        // Warn about first class upgrade fee
        if (isFirstClassSeat && returnFlight) {
          const economyPrice = parseFloat(returnFlight.economy_price || 0);
          const firstClassPrice = parseFloat(returnFlight.first_class_price || 0);
          const upgradeFee = firstClassPrice - economyPrice;
          if (upgradeFee > 0) {
            if (!window.confirm(`Bạn đang chọn ghế khoang hạng nhất. Phí nâng hạng: ${upgradeFee.toLocaleString()}₫\n\nBạn có muốn tiếp tục?`)) {
              return;
            }
          }
        }
        
        newSeats[passengerIndex] = seatNumber;
      }
      setSelectedReturnSeats(newSeats);
    } else {
      const newSeats = { ...selectedSeats };
      // If seat already selected by this passenger, deselect it
      if (newSeats[passengerIndex] === seatNumber) {
        delete newSeats[passengerIndex];
      } else {
        // Check if seat is occupied
        if (occupiedSeats.includes(seatNumber)) {
          showWarning("Ghế này đã được chọn bởi hành khách khác");
          return;
        }
        // Check if another passenger already selected this seat
        const existingPassenger = Object.keys(newSeats).find(idx => newSeats[idx] === seatNumber);
        if (existingPassenger) {
          showWarning("Ghế này đã được chọn bởi hành khách khác trong đơn của bạn");
          return;
        }
        
        // Warn about first class upgrade fee
        if (isFirstClassSeat && flight) {
          const economyPrice = parseFloat(flight.economy_price || 0);
          const firstClassPrice = parseFloat(flight.first_class_price || 0);
          const upgradeFee = firstClassPrice - economyPrice;
          if (upgradeFee > 0) {
            if (!window.confirm(`Bạn đang chọn ghế khoang hạng nhất. Phí nâng hạng: ${upgradeFee.toLocaleString()}₫\n\nBạn có muốn tiếp tục?`)) {
              return;
            }
          }
        }
        
        newSeats[passengerIndex] = seatNumber;
      }
      setSelectedSeats(newSeats);
    }
  };

  const handleBaggageChange = (passengerIndex, weight, price) => {
    setAdditionalBaggage({
      ...additionalBaggage,
      [passengerIndex]: { weight, price }
    });
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
        {/* Progress Indicator */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            <div style={{ textAlign: "center", flex: 1, maxWidth: "150px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: currentStep >= 1 ? "#0E7490" : "#e5e7eb",
                color: currentStep >= 1 ? "#fff" : "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                margin: "0 auto 8px"
              }}>
                1
              </div>
              <div style={{ fontSize: "14px", fontWeight: currentStep >= 1 ? 600 : 400, color: currentStep >= 1 ? "#0E7490" : "#64748b" }}>
                Thông tin hành khách
              </div>
            </div>
            <div style={{ textAlign: "center", flex: 1, maxWidth: "150px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: currentStep >= 2 ? "#0E7490" : "#e5e7eb",
                color: currentStep >= 2 ? "#fff" : "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                margin: "0 auto 8px"
              }}>
                2
              </div>
              <div style={{ fontSize: "14px", fontWeight: currentStep >= 2 ? 600 : 400, color: currentStep >= 2 ? "#0E7490" : "#64748b" }}>
                Dịch vụ bổ sung
              </div>
            </div>
            <div style={{ textAlign: "center", flex: 1, maxWidth: "150px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: currentStep >= 3 ? "#0E7490" : "#e5e7eb",
                color: currentStep >= 3 ? "#fff" : "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                margin: "0 auto 8px"
              }}>
                3
              </div>
              <div style={{ fontSize: "14px", fontWeight: currentStep >= 3 ? 600 : 400, color: currentStep >= 3 ? "#0E7490" : "#64748b" }}>
                Xác nhận
              </div>
            </div>
            <div style={{ textAlign: "center", flex: 1, maxWidth: "150px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: currentStep >= 4 ? "#0E7490" : "#e5e7eb",
                color: currentStep >= 4 ? "#fff" : "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                margin: "0 auto 8px"
              }}>
                4
              </div>
              <div style={{ fontSize: "14px", fontWeight: currentStep >= 4 ? 600 : 400, color: currentStep >= 4 ? "#0E7490" : "#64748b" }}>
                Thanh toán
              </div>
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "32px", color: "#1e293b" }}>
          {currentStep === 2 ? "Dịch vụ bổ sung" : currentStep === 3 ? "Xác nhận" : currentStep === 4 ? "Thanh toán" : "Hoàn tất đặt vé của bạn"}
        </h1>

        {currentStep === 2 ? (
          <>
            {/* Step 2: Additional Services */}
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: "600px" }}>
                {/* Seat Selection */}
                <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", color: "#1e293b" }}>
                    Chọn ghế ngồi
                  </h2>
                  
                  {loadingSeats ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>Đang tải thông tin ghế...</div>
                  ) : (
                    <>
                      {/* Outbound Flight Seats */}
                      <div style={{ marginBottom: "32px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#1e293b" }}>
                          Chuyến đi: {flight.airline} {flight.flight_number}
                        </h3>
                        
                        {/* Seat Map Legend */}
                        <div style={{ display: "flex", gap: "16px", marginBottom: "16px", fontSize: "12px", flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "24px", height: "24px", background: "#e5e7eb", border: "1px solid #cbd5e1", borderRadius: "4px" }}></div>
                            <span>Trống</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "24px", height: "24px", background: "#0E7490", border: "1px solid #0E7490", borderRadius: "4px" }}></div>
                            <span>Đã chọn</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "24px", height: "24px", background: "#ef4444", border: "1px solid #dc2626", borderRadius: "4px" }}></div>
                            <span>Đã có người</span>
                          </div>
                        </div>

                        {/* Seat Map */}
                        <div style={{ overflowX: "auto", marginBottom: "16px" }}>
                          <div style={{ minWidth: "600px" }}>
                            {/* Header row */}
                            <div style={{ display: "flex", gap: "4px", marginBottom: "8px", paddingLeft: "40px" }}>
                              {['A', 'B', 'C', 'D', 'E', 'F'].map(letter => (
                                <div key={letter} style={{ width: "32px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                                  {letter}
                                </div>
                              ))}
                            </div>
                            
                            {/* First Class Section */}
                            <div style={{ marginBottom: "16px" }}>
                              <div style={{ 
                                background: "#fef3c7", 
                                padding: "8px 12px", 
                                borderRadius: "6px", 
                                marginBottom: "8px",
                                border: "1px solid #fbbf24",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#92400e"
                              }}>
                                ✨ Khoang Hạng Nhất (Hàng 1-10)
                                {flight.first_class_price && (
                                  <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 400 }}>
                                    - Phí nâng hạng: {(parseFloat(flight.first_class_price) - parseFloat(flight.economy_price)).toLocaleString()}₫/ghế
                                  </span>
                                )}
                              </div>
                              
                              {/* First Class Seat rows */}
                              {generateSeatMap(false).slice(0, 10).map((rowSeats, idx) => (
                                <div key={idx} style={{ display: "flex", gap: "4px", marginBottom: "4px", alignItems: "center" }}>
                                  <div style={{ width: "32px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#64748b", paddingRight: "8px" }}>
                                    {rowSeats[0].row}
                                  </div>
                                  {rowSeats.map((seat) => {
                                    const passengerIdx = Object.keys(selectedSeats).find(idx => selectedSeats[idx] === seat.number);
                                    return (
                                      <button
                                        key={seat.number}
                                        type="button"
                                        onClick={() => {
                                          const passengerWithoutSeat = passengers.findIndex((_, idx) => !selectedSeats[idx]);
                                          const targetPassenger = passengerWithoutSeat >= 0 ? passengerWithoutSeat : 0;
                                          handleSeatClick(seat.number, targetPassenger, false);
                                        }}
                                        disabled={seat.isOccupied}
                                        style={{
                                          width: "32px",
                                          height: "32px",
                                          background: seat.isOccupied ? "#ef4444" : seat.isSelected ? "#0E7490" : "#fef3c7",
                                          border: seat.isOccupied ? "1px solid #dc2626" : seat.isSelected ? "1px solid #0E7490" : "1px solid #fbbf24",
                                          borderRadius: "4px",
                                          cursor: seat.isOccupied ? "not-allowed" : "pointer",
                                          fontSize: "10px",
                                          color: seat.isOccupied ? "#fff" : seat.isSelected ? "#fff" : "#92400e",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center"
                                        }}
                                        title={seat.isOccupied ? "Ghế đã được chọn" : passengerIdx !== undefined ? `Ghế của hành khách ${parseInt(passengerIdx) + 1}` : seat.number}
                                      >
                                        {seat.letter}
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                            
                            {/* Divider */}
                            <div style={{ 
                              height: "2px", 
                              background: "#e5e7eb", 
                              margin: "16px 0",
                              position: "relative"
                            }}>
                              <div style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: "translate(-50%, -50%)",
                                background: "#f8fafc",
                                padding: "0 12px",
                                fontSize: "11px",
                                color: "#64748b",
                                fontWeight: 600
                              }}>
                                Lối đi
                              </div>
                            </div>
                            
                            {/* Economy Section */}
                            <div>
                              <div style={{ 
                                background: "#f0f9ff", 
                                padding: "8px 12px", 
                                borderRadius: "6px", 
                                marginBottom: "8px",
                                border: "1px solid #0E7490",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#0E7490"
                              }}>
                                💺 Khoang Phổ Thông (Hàng 11-30)
                              </div>
                              
                              {/* Economy Seat rows */}
                              {generateSeatMap(false).slice(10).map((rowSeats, idx) => (
                                <div key={idx + 10} style={{ display: "flex", gap: "4px", marginBottom: "4px", alignItems: "center" }}>
                                  <div style={{ width: "32px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#64748b", paddingRight: "8px" }}>
                                    {rowSeats[0].row}
                                  </div>
                                  {rowSeats.map((seat) => {
                                    const passengerIdx = Object.keys(selectedSeats).find(idx => selectedSeats[idx] === seat.number);
                                    return (
                                      <button
                                        key={seat.number}
                                        type="button"
                                        onClick={() => {
                                          const passengerWithoutSeat = passengers.findIndex((_, idx) => !selectedSeats[idx]);
                                          const targetPassenger = passengerWithoutSeat >= 0 ? passengerWithoutSeat : 0;
                                          handleSeatClick(seat.number, targetPassenger, false);
                                        }}
                                        disabled={seat.isOccupied}
                                        style={{
                                          width: "32px",
                                          height: "32px",
                                          background: seat.isOccupied ? "#ef4444" : seat.isSelected ? "#0E7490" : "#e5e7eb",
                                          border: seat.isOccupied ? "1px solid #dc2626" : seat.isSelected ? "1px solid #0E7490" : "1px solid #cbd5e1",
                                          borderRadius: "4px",
                                          cursor: seat.isOccupied ? "not-allowed" : "pointer",
                                          fontSize: "10px",
                                          color: seat.isOccupied ? "#fff" : seat.isSelected ? "#fff" : "#1e293b",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center"
                                        }}
                                        title={seat.isOccupied ? "Ghế đã được chọn" : passengerIdx !== undefined ? `Ghế của hành khách ${parseInt(passengerIdx) + 1}` : seat.number}
                                      >
                                        {seat.letter}
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Passenger seat assignments */}
                        {passengers.map((passenger, index) => (
                          <div key={index} style={{ marginBottom: "12px", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                              {passenger.last_name} {passenger.first_name}
                            </div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <span style={{ fontSize: "12px", color: "#64748b" }}>Ghế:</span>
                              <select
                                value={selectedSeats[index] || ""}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleSeatClick(e.target.value, index, false);
                                  } else {
                                    const newSeats = { ...selectedSeats };
                                    delete newSeats[index];
                                    setSelectedSeats(newSeats);
                                  }
                                }}
                                style={{
                                  padding: "6px 12px",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "6px",
                                  fontSize: "14px",
                                  minWidth: "100px"
                                }}
                              >
                                <option value="">Chọn ghế</option>
                                {generateSeatMap(false).flat().filter(s => !s.isOccupied && (!s.isSelected || s.passengerIndex === index)).map(seat => (
                                  <option key={seat.number} value={seat.number}>{seat.number}</option>
                                ))}
                              </select>
                              {selectedSeats[index] && (
                                <span style={{ fontSize: "12px", color: "#0E7490", fontWeight: 600 }}>
                                  ✓ {selectedSeats[index]}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Return Flight Seats */}
                      {returnFlight && (
                        <div style={{ marginTop: "32px", paddingTop: "32px", borderTop: "1px solid #e5e7eb" }}>
                          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#1e293b" }}>
                            Chuyến về: {returnFlight.airline} {returnFlight.flight_number}
                          </h3>
                          
                          {passengers.map((passenger, index) => (
                            <div key={index} style={{ marginBottom: "12px", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                                {passenger.last_name} {passenger.first_name}
                              </div>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>Ghế:</span>
                                <select
                                  value={selectedReturnSeats[index] || ""}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleSeatClick(e.target.value, index, true);
                                    } else {
                                      const newSeats = { ...selectedReturnSeats };
                                      delete newSeats[index];
                                      setSelectedReturnSeats(newSeats);
                                    }
                                  }}
                                  style={{
                                    padding: "6px 12px",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    minWidth: "100px"
                                  }}
                                >
                                  <option value="">Chọn ghế</option>
                                  {generateSeatMap(true).flat().filter(s => !s.isOccupied && (!s.isSelected || s.passengerIndex === index)).map(seat => (
                                    <option key={seat.number} value={seat.number}>{seat.number}</option>
                                  ))}
                                </select>
                                {selectedReturnSeats[index] && (
                                  <span style={{ fontSize: "12px", color: "#0E7490", fontWeight: 600 }}>
                                    ✓ {selectedReturnSeats[index]}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Additional Baggage */}
                <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", color: "#1e293b" }}>
                    Hành lý ký gửi bổ sung
                  </h2>
                  
                  <div style={{ marginBottom: "16px", padding: "12px", background: "#f0f9ff", borderRadius: "8px", fontSize: "14px", color: "#64748b" }}>
                    Hành lý mặc định: {flight.baggage_carry_on || "7kg"} xách tay, {flight.baggage_checked || "23kg"} ký gửi
                  </div>

                  {passengers.map((passenger, index) => (
                    <div key={index} style={{ marginBottom: "20px", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#1e293b" }}>
                        {passenger.last_name} {passenger.first_name}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                        {[
                          { weight: 5, price: 200000, label: "+5kg" },
                          { weight: 10, price: 350000, label: "+10kg" },
                          { weight: 15, price: 500000, label: "+15kg" }
                        ].map((option) => (
                          <button
                            key={option.weight}
                            type="button"
                            onClick={() => {
                              const current = additionalBaggage[index];
                              if (current && current.weight === option.weight) {
                                // Deselect if already selected
                                const newBaggage = { ...additionalBaggage };
                                delete newBaggage[index];
                                setAdditionalBaggage(newBaggage);
                              } else {
                                handleBaggageChange(index, option.weight, option.price);
                              }
                            }}
                            style={{
                              padding: "12px",
                              border: additionalBaggage[index]?.weight === option.weight ? "2px solid #0E7490" : "1px solid #e5e7eb",
                              borderRadius: "8px",
                              background: additionalBaggage[index]?.weight === option.weight ? "#f0f9ff" : "#fff",
                              cursor: "pointer",
                              textAlign: "center",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                              {option.label}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {option.price.toLocaleString()}₫
                            </div>
                          </button>
                        ))}
                      </div>
                      {additionalBaggage[index] && (
                        <div style={{ marginTop: "8px", fontSize: "12px", color: "#0E7490", fontWeight: 600 }}>
                          ✓ Đã chọn: +{additionalBaggage[index].weight}kg ({additionalBaggage[index].price.toLocaleString()}₫)
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    style={{
                      padding: "12px 24px",
                      background: "#f8fafc",
                      color: "#1e293b",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleAdditionalServicesSubmit}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: "12px 24px",
                      background: submitting ? "#94a3b8" : "#0E7490",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: submitting ? "not-allowed" : "pointer"
                    }}
                  >
                    {submitting ? "Đang xử lý..." : "Tiếp tục"}
                  </button>
                </div>
              </div>

              {/* Right - Summary */}
              <div style={{ flex: 1, minWidth: "300px" }}>
                <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "sticky", top: "20px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px", color: "#1e293b" }}>
                    Tóm tắt
                  </h3>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>Chuyến bay:</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                      {Number(calculateTotal() - calculateAdditionalServicesTotal()).toLocaleString()}₫
                    </div>
                  </div>

                  {(calculateAdditionalServicesTotal() > 0 || calculateSeatUpgradeFee() > 0) && (
                    <div style={{ marginBottom: "16px", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>Dịch vụ bổ sung:</div>
                      
                      {calculateSeatUpgradeFee() > 0 && (
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                          Phí nâng hạng ghế hạng nhất: {calculateSeatUpgradeFee().toLocaleString()}₫
                        </div>
                      )}
                      
                      {Object.entries(additionalBaggage).map(([idx, bag]) => (
                        <div key={idx} style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                          +{bag.weight}kg: {bag.price.toLocaleString()}₫
                        </div>
                      ))}
                      <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginTop: "8px" }}>
                        {(calculateAdditionalServicesTotal() + calculateSeatUpgradeFee()).toLocaleString()}₫
                      </div>
                    </div>
                  )}

                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    paddingTop: "12px",
                    borderTop: "2px solid #e5e7eb",
                    marginTop: "12px"
                  }}>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>Tổng cộng</span>
                    <span style={{ fontSize: "24px", fontWeight: 700, color: "#0E7490" }}>
                      {Number(calculateTotal()).toLocaleString()}₫
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : currentStep === 3 && booking ? (
          <>
            {/* Step 3: Confirmation */}
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <div style={{ background: "#fff", borderRadius: "12px", padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <div style={{ 
                    width: "80px", 
                    height: "80px", 
                    background: "#dcfce7", 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    fontSize: "40px"
                  }}>
                    ✓
                  </div>
                  <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                    Đặt vé thành công!
                  </h2>
                  <p style={{ fontSize: "14px", color: "#64748b" }}>
                    Mã đặt vé: <strong style={{ color: "#0E7490" }}>{booking.booking_code}</strong>
                  </p>
                </div>

                <div style={{ marginBottom: "24px", padding: "16px", background: "#f0f9ff", borderRadius: "8px" }}>
                  <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "4px" }}>Tổng tiền:</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "#0E7490" }}>
                    {Number(booking.total_price).toLocaleString()} ₫
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setCurrentStep(2)}
                    style={{
                      padding: "12px 24px",
                      background: "#f8fafc",
                      color: "#1e293b",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}
                    style={{
                      padding: "12px 24px",
                      background: "#0E7490",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Thanh toán
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : currentStep === 4 && booking ? (
          <>
          {/* Payment Step */}
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ background: "#fff", borderRadius: "12px", padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px", color: "#1e293b" }}>
                Chọn phương thức thanh toán
              </h2>
              
              <div style={{ marginBottom: "24px", padding: "16px", background: "#f0f9ff", borderRadius: "8px" }}>
                <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "4px" }}>Mã đặt vé:</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#0E7490" }}>{booking.booking_code}</div>
                <div style={{ fontSize: "14px", color: "#64748b", marginTop: "8px" }}>Tổng tiền:</div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0E7490", marginTop: "4px" }}>
                  {Number(booking.total_price).toLocaleString()} ₫
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <button
                  onClick={() => processPayment("vnpay")}
                  disabled={processing}
                  style={{
                    border: "2px solid #0E7490",
                    borderRadius: 8,
                    padding: 20,
                    cursor: processing ? "not-allowed" : "pointer",
                    background: "#f0f9ff",
                    textAlign: "center",
                    transition: "all 0.2s",
                    opacity: processing ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !processing && (e.currentTarget.style.background = "#e0f2fe")}
                  onMouseLeave={(e) => !processing && (e.currentTarget.style.background = "#f0f9ff")}
                >
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>VNPay</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Thẻ ngân hàng</div>
                </button>
                
                <button
                  onClick={() => processPayment("momo")}
                  disabled={processing}
                  style={{
                    border: "2px solid #0E7490",
                    borderRadius: 8,
                    padding: 20,
                    cursor: processing ? "not-allowed" : "pointer",
                    background: "#f0f9ff",
                    textAlign: "center",
                    transition: "all 0.2s",
                    opacity: processing ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !processing && (e.currentTarget.style.background = "#e0f2fe")}
                  onMouseLeave={(e) => !processing && (e.currentTarget.style.background = "#f0f9ff")}
                >
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>MoMo</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Ví điện tử</div>
                </button>
                
                <button
                  onClick={() => processPayment("cash")}
                  disabled={processing}
                  style={{
                    border: "2px solid #0E7490",
                    borderRadius: 8,
                    padding: 20,
                    cursor: processing ? "not-allowed" : "pointer",
                    background: "#f0f9ff",
                    textAlign: "center",
                    transition: "all 0.2s",
                    opacity: processing ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !processing && (e.currentTarget.style.background = "#e0f2fe")}
                  onMouseLeave={(e) => !processing && (e.currentTarget.style.background = "#f0f9ff")}
                >
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Tiền mặt</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Thanh toán sau</div>
                </button>
              </div>

              {processing && (
                <div style={{ textAlign: "center", color: "#64748b", fontSize: "14px", marginTop: "16px" }}>
                  Đang xử lý...
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button
                  onClick={() => setCurrentStep(1)}
                  disabled={processing}
                  style={{
                    background: "#f8fafc",
                    color: "#1e293b",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    padding: "10px 20px",
                    cursor: processing ? "not-allowed" : "pointer",
                    opacity: processing ? 0.6 : 1
                  }}
                >
                  Quay lại
                </button>
              </div>
            </div>
          </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {/* Left - Forms */}
            <div style={{ flex: 2, minWidth: "600px" }}>
              <form onSubmit={handleSubmit}>
              {/* Passenger Information */}
              <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", color: "#1e293b" }}>
                  Thông tin hành khách
                </h2>

                {passengers.map((passenger, index) => (
                  <div key={index} style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: index < passengers.length - 1 ? "1px solid #e5e7eb" : "none" }}>
                    <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#1e293b" }}>
                      Hành khách {index + 1} {index === 0 ? "(Người lớn)" : ""}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                          Danh xưng
                        </label>
                        <select
                          value={passenger.salutation}
                          onChange={(e) => updatePassenger(index, "salutation", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            fontSize: "14px"
                          }}
                        >
                          <option value="Ông">Ông</option>
                          <option value="Bà">Bà</option>
                          <option value="Cô">Cô</option>
                          <option value="Anh">Anh</option>
                          <option value="Chị">Chị</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                          Họ và tên đệm
                        </label>
                        <input
                          type="text"
                          value={passenger.last_name}
                          onChange={(e) => updatePassenger(index, "last_name", e.target.value.toUpperCase())}
                          placeholder="VD: NGUYEN VAN"
                          required
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            fontSize: "14px"
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                          Tên
                        </label>
                        <input
                          type="text"
                          value={passenger.first_name}
                          onChange={(e) => updatePassenger(index, "first_name", e.target.value.toUpperCase())}
                          placeholder="VD: A"
                          required
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            fontSize: "14px"
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ maxWidth: "200px" }}>
                      <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        value={passenger.date_of_birth}
                        onChange={(e) => updatePassenger(index, "date_of_birth", e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          fontSize: "14px"
                        }}
                      />
                    </div>

                    {passengers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePassenger(index)}
                        style={{
                          marginTop: "12px",
                          padding: "6px 12px",
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        Xóa hành khách
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPassenger}
                  style={{
                    padding: "10px 20px",
                    background: "#f0f9ff",
                    color: "#0E7490",
                    border: "1px solid #0E7490",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  + Thêm hành khách
                </button>
              </div>

              {/* Contact Information */}
              <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", color: "#1e293b" }}>
                  Thông tin liên hệ
                </h2>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+84 123 456 789"
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  />
                </div>
              </div>

              {/* Combo Booking Summary */}
              {(selectedTour || selectedHotel) && (
                <div style={{ background: "#f0f9ff", borderRadius: "12px", padding: "20px", marginBottom: "24px", border: "1px solid #bae6fd" }}>
                  <div style={{ fontWeight: 600, marginBottom: 12, color: "#0E7490", fontSize: "16px" }}>
                    📦 Đơn hàng Combo
                  </div>
                  {selectedTour && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "14px", color: "#64748b" }}>
                      <span>Tour ({selectedTour.name}):</span>
                      <span>{Number(selectedTour.price * passengerCount).toLocaleString()} ₫</span>
                    </div>
                  )}
                  {selectedHotel && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "14px", color: "#64748b" }}>
                      <span>Khách sạn ({selectedHotel.name}):</span>
                      <span>{Number(selectedHotel.price_per_night).toLocaleString()} ₫</span>
                    </div>
                  )}
                  {promotionCode && (
                    <div style={{ marginTop: 12, padding: 8, background: "#dcfce7", borderRadius: 6, fontSize: "12px", color: "#166534" }}>
                      ✅ Mã khuyến mãi combo đã được tự động áp dụng: {promotionCode}
                    </div>
                  )}
                </div>
              )}

              {/* Promotion Code */}
              <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                  Mã khuyến mãi (tùy chọn)
                </label>
                <input
                  type="text"
                  value={promotionCode}
                  onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                  placeholder={(selectedTour || selectedHotel) && promotionCode ? "Mã combo đã được áp dụng tự động" : "Nhập mã khuyến mãi"}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    background: (selectedTour || selectedHotel) && promotionCode ? "#dcfce7" : "#fff"
                  }}
                  disabled={(selectedTour || selectedHotel) && promotionCode ? true : false}
                />
                {(selectedTour || selectedHotel) && promotionCode && (
                  <div style={{ marginTop: 8, fontSize: "12px", color: "#166534" }}>
                    ✅ Đã tự động áp dụng mã khuyến mãi combo: {promotionCode}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  style={{
                    padding: "12px 24px",
                    background: "#f8fafc",
                    color: "#1e293b",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "12px 24px",
                    background: submitting ? "#94a3b8" : "#0E7490",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer"
                  }}
                >
                  {submitting ? "Đang xử lý..." : "Tiếp tục"}
                </button>
              </div>
            </form>
          </div>

          {/* Right - Flight Summary */}
          <div style={{ flex: 1, minWidth: "300px" }}>
            <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "sticky", top: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px", color: "#1e293b" }}>
                Tóm tắt chuyến bay
              </h3>

              <div style={{ marginBottom: "20px", textAlign: "center" }}>
                <div style={{ 
                  width: "80px", 
                  height: "80px", 
                  background: "#0E7490", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  color: "#fff",
                  fontSize: "24px",
                  fontWeight: 700
                }}>
                  {flight.airline.charAt(0)}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                  {flight.airline}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {flight.flight_number}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
                      {new Date(flight.departure_date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>
                      {flight.origin_code}
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", fontSize: "12px", color: "#64748b" }}>
                    {Math.floor(flight.duration / 60)}h {flight.duration % 60}m • {flight.flight_type === "direct" ? "Bay thẳng" : "Có quá cảnh"}
                  </div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
                      {new Date(flight.arrival_date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>
                      {flight.destination_code}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", textAlign: "center" }}>
                  {new Date(flight.departure_date).toLocaleDateString("vi-VN", { 
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </div>
              </div>

              {returnFlight && (
                <div style={{ marginBottom: "20px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", color: "#1e293b" }}>
                    Chuyến về
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                        {new Date(returnFlight.departure_date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {returnFlight.origin_code}
                      </div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center", fontSize: "11px", color: "#64748b" }}>
                      {Math.floor(returnFlight.duration / 60)}h {returnFlight.duration % 60}m
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                        {new Date(returnFlight.arrival_date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {returnFlight.destination_code}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
                {/* Flight Price */}
                <div style={{ marginBottom: selectedTour || selectedHotel ? "16px" : "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
                    Chuyến bay
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#64748b" }}>
                    <span>Giá vé người lớn (x{passengerCount})</span>
                    <span>{Number((flight[`${classType}_price`] || flight.economy_price) * passengerCount).toLocaleString()}₫</span>
                  </div>
                  {returnFlight && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#64748b" }}>
                      <span>Chuyến về (x{passengerCount})</span>
                      <span>{Number((returnFlight[`${classType}_price`] || returnFlight.economy_price) * passengerCount).toLocaleString()}₫</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#64748b" }}>
                    <span>Thuế và phí</span>
                    <span>{Number(((flight[`${classType}_price`] || flight.economy_price) * passengerCount + (returnFlight ? (returnFlight[`${classType}_price`] || returnFlight.economy_price) * passengerCount : 0)) * 0.2).toLocaleString()}₫</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, color: "#1e293b", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
                    <span>Tổng chuyến bay:</span>
                    <span>{Number(((flight[`${classType}_price`] || flight.economy_price) * passengerCount + (returnFlight ? (returnFlight[`${classType}_price`] || returnFlight.economy_price) * passengerCount : 0)) * 1.2).toLocaleString()}₫</span>
                  </div>
                </div>

                {/* Combo Items */}
                {selectedTour && (
                  <div style={{ marginBottom: "16px", padding: "12px", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#0E7490", marginBottom: "8px" }}>
                      Tour
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#64748b", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px" }}>{selectedTour.name}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, color: "#1e293b", paddingTop: "8px", borderTop: "1px solid #bae6fd" }}>
                      <span>Tổng tour:</span>
                      <span>{Number(selectedTour.price * passengerCount).toLocaleString()}₫</span>
                    </div>
                  </div>
                )}

                {selectedHotel && (
                  <div style={{ marginBottom: "16px", padding: "12px", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#0E7490", marginBottom: "8px" }}>
                      Khách sạn
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#64748b", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px" }}>{selectedHotel.name}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, color: "#1e293b", paddingTop: "8px", borderTop: "1px solid #bae6fd" }}>
                      <span>Tổng khách sạn:</span>
                      <span>{Number(selectedHotel.price_per_night).toLocaleString()}₫</span>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  paddingTop: "12px",
                  borderTop: "2px solid #e5e7eb",
                  marginTop: "12px"
                }}>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>Tổng cộng</span>
                  <span style={{ fontSize: "24px", fontWeight: 700, color: "#0E7490" }}>
                    {Number(calculateTotal()).toLocaleString()}₫
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}

