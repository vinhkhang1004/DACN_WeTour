import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import DatePicker from "../components/DatePicker";
import { useToast } from "../components/Toast";

export default function HotelBooking() {
  const { showError, showWarning } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Booking form - Check if values come from URL params
  const hasCheckInFromURL = !!searchParams.get("check_in");
  const hasCheckOutFromURL = !!searchParams.get("check_out");
  const hasAdultsFromURL = !!searchParams.get("adults");
  const hasChildrenFromURL = !!searchParams.get("children");
  const hasRoomsFromURL = !!searchParams.get("rooms");
  const hasRoomIdFromURL = !!searchParams.get("room_id");
  
  const [checkIn, setCheckIn] = useState(searchParams.get("check_in") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("check_out") || "");
  const [checkInDisplay, setCheckInDisplay] = useState("");
  const [checkOutDisplay, setCheckOutDisplay] = useState("");
  const [adults, setAdults] = useState(parseInt(searchParams.get("adults")) || 2);
  const [children, setChildren] = useState(parseInt(searchParams.get("children")) || 0);
  const [rooms, setRooms] = useState(parseInt(searchParams.get("rooms")) || 1);
  const [selectedRoomId, setSelectedRoomId] = useState(searchParams.get("room_id") || "");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [notes, setNotes] = useState("");

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
  
  // Guest info (if not logged in or user missing info)
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  
  // Promotion
  const [promotionCode, setPromotionCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promotionError, setPromotionError] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  
  // Combo booking states
  const [selectedTour, setSelectedTour] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);

  // Initialize guest info from user if logged in
  useEffect(() => {
    // Load combo selections from localStorage
    const comboData = localStorage.getItem("hotel_combo");
    if (comboData) {
      try {
        const combo = JSON.parse(comboData);
        if (combo.hotelId === id) {
          setSelectedTour(combo.selectedTour);
          setSelectedFlight(combo.selectedFlight);
        }
      } catch (e) {
        console.error("Error parsing hotel combo data:", e);
      }
    }
    
    if (user) {
      // Always use user data from context, but also try to fetch latest from API
      setGuestName(user.name || "");
      setGuestEmail(user.email || "");
      setGuestPhone(user.phone || "");
      
      // Fetch latest user data to ensure we have phone and address
      const fetchUserData = async () => {
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const response = await api.get("/users/me", {
              headers: { Authorization: `Bearer ${token}` }
            });
            const userData = response.data;
            // Update form fields with latest data
            if (userData.name) setGuestName(userData.name);
            if (userData.email) setGuestEmail(userData.email);
            if (userData.phone) setGuestPhone(userData.phone);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to context user data
        }
      };
      
      fetchUserData();
    } else {
      // Clear fields if user logs out
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
    }
  }, [user]);

  useEffect(() => {
    fetchHotel();
  }, [id]);

  // Initialize display values from URL params or state
  useEffect(() => {
    if (checkIn) {
      setCheckInDisplay(formatDateToVN(checkIn));
    }
    if (checkOut) {
      setCheckOutDisplay(formatDateToVN(checkOut));
    }
  }, [checkIn, checkOut]);

  // Tự động điều chỉnh số người khi selectedRoom thay đổi
  useEffect(() => {
    if (selectedRoom && selectedRoom.max_guests) {
      const totalPeople = adults + children;
      if (totalPeople > selectedRoom.max_guests) {
        // Nếu tổng số người vượt quá max_guests, điều chỉnh
        const maxAdults = Math.max(1, selectedRoom.max_guests - children);
        if (adults > maxAdults) {
          setAdults(maxAdults);
        }
        const maxChildren = Math.max(0, selectedRoom.max_guests - adults);
        if (children > maxChildren) {
          setChildren(maxChildren);
        }
      }
    }
  }, [selectedRoom]);

  const fetchHotel = async () => {
    try {
      const response = await api.get(`/hotels/${id}`);
      setHotel(response.data);
      
      // Set selected room if room_id is in URL params
      if (selectedRoomId && response.data.Rooms) {
        const room = response.data.Rooms.find(r => r.id === parseInt(selectedRoomId));
        if (room) {
          setSelectedRoom(room);
        }
      }
    } catch (error) {
      console.error("Error fetching hotel:", error);
      showError("Không tìm thấy khách sạn");
      navigate("/hotels");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!hotel || !checkIn || !checkOut) return 0;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    if (nights <= 0) return 0;
    
    // Use room price if room is selected, otherwise use hotel price_per_night
    const pricePerNight = selectedRoom 
      ? parseFloat(selectedRoom.price_per_night || 0)
      : parseFloat(hotel.price_per_night || 0);
    
    const basePrice = pricePerNight * nights * rooms;
    return basePrice - discountAmount;
  };
  
  const applyPromotion = async () => {
    if (!promotionCode.trim()) {
      setPromotionError("Vui lòng nhập mã khuyến mãi");
      return;
    }
    
    if (!hotel || !checkIn || !checkOut) {
      setPromotionError("Vui lòng chọn ngày nhận và trả phòng trước");
      return;
    }
    
    setPromotionError("");
    
    // Calculate base price (before discount)
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
      setPromotionError("Ngày trả phòng phải sau ngày nhận phòng");
      return;
    }
    // Use room price if room is selected, otherwise use hotel price_per_night
    const pricePerNight = selectedRoom 
      ? parseFloat(selectedRoom.price_per_night || 0)
      : parseFloat(hotel.price_per_night || 0);
    const baseTotal = pricePerNight * nights * rooms;
    
    try {
      const response = await api.post("/promotions/check", {
        code: promotionCode.toUpperCase(),
        amount: baseTotal,
        category: "hotel"
      });
      
      if (response.data.valid) {
        setDiscountAmount(response.data.discount_amount || 0);
        setAppliedPromotion(response.data.promotion);
        setPromotionError("");
      } else {
        setPromotionError(response.data.message || "Mã khuyến mãi không hợp lệ");
        setDiscountAmount(0);
        setAppliedPromotion(null);
      }
    } catch (error) {
      setPromotionError(error.response?.data?.message || "Mã khuyến mãi không hợp lệ");
      setDiscountAmount(0);
      setAppliedPromotion(null);
    }
  };
  
  const removePromotion = () => {
    setPromotionCode("");
    setDiscountAmount(0);
    setAppliedPromotion(null);
    setPromotionError("");
  };

  const processPayment = async (method) => {
    if (!selectedBooking) return;
    
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
          "/hotels/payment/vnpay/create",
          { hotel_booking_id: selectedBooking.id },
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
          "/hotels/payment/momo/create",
          { hotel_booking_id: selectedBooking.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        } else {
          showError("Không thể tạo link thanh toán MoMo");
          setProcessing(false);
        }
      } else if (method === "cash") {
        if (!window.confirm(`Xác nhận thanh toán tiền mặt cho đặt phòng này?\nSố tiền: ${Number(selectedBooking.total_price).toLocaleString()}₫`)) {
          setProcessing(false);
          return;
        }
        
        const response = await api.post(
          "/hotels/payment/cash",
          { hotel_booking_id: selectedBooking.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setShowPaymentModal(false);
        const bookingId = selectedBooking.id;
        setSelectedBooking(null);
        setProcessing(false);
        
        // Navigate directly to confirmation page
        navigate(`/hotel/booking/${bookingId}/confirm`);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      showError("Có lỗi xảy ra: " + (error.response?.data?.message || error.message));
      setProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra đã chọn phòng chưa
    if (!selectedRoomId || !selectedRoom) {
      showWarning("Vui lòng chọn loại phòng mà bạn muốn");
      return;
    }
    
    if (!checkIn || !checkOut) {
      showWarning("Vui lòng chọn ngày nhận và trả phòng");
      return;
    }

    // Validate contact information
    // If user is logged in, use user info but allow override if missing
    const contactName = user ? (guestName || user.name || "") : guestName;
    const contactEmail = user ? (guestEmail || user.email || "") : guestEmail;
    const contactPhone = user ? (guestPhone || user.phone || "") : guestPhone;

    if (!contactName || !contactEmail || !contactPhone) {
      showWarning("Vui lòng cung cấp thông tin liên hệ (tên, email, số điện thoại)");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Prepare booking data
      const bookingData = {
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults,
        children,
        rooms,
        notes
      };
      
      // Add room_id if a room is selected
      if (selectedRoomId) {
        bookingData.room_id = selectedRoomId;
      }

      // If user is logged in but missing info, send guest info as fallback
      // Backend will use user_id if token is valid, otherwise use guest info
      if (!user) {
        bookingData.guest_name = contactName;
        bookingData.guest_email = contactEmail;
        bookingData.guest_phone = contactPhone;
      } else {
        // Even if user is logged in, send contact info if user data might be incomplete
        // This ensures booking works even if token decode fails or user data is missing
        bookingData.guest_name = contactName;
        bookingData.guest_email = contactEmail;
        bookingData.guest_phone = contactPhone;
      }

      // Add promotion code to booking data
      if (promotionCode && appliedPromotion) {
        bookingData.promotion_code = promotionCode;
      }
      
      const response = await api.post(
        `/hotels/${id}/book`,
        bookingData,
        { headers }
      );

      console.log("Booking response:", response.data);
      
      // Lưu booking ID và hiển thị modal thanh toán
      if (response.data.booking) {
        setSelectedBooking(response.data.booking);
        setShowPaymentModal(true);
      } else {
        // Navigate to confirmation page
        setTimeout(() => {
          navigate(`/hotel/booking/${response.data.booking.id}/confirm`);
        }, 500);
      }
    } catch (error) {
      console.error("Error booking hotel:", error);
      showError("Có lỗi xảy ra: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "40px" }}>Đang tải...</div>;
  }

  if (!hotel) {
    return null;
  }

  const total = calculateTotal();
  
  // Calculate nights for display
  const nights = checkIn && checkOut ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) : 0;
  const amenities = hotel.amenities ? (typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities) : hotel.amenities) : [];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "32px", color: "#1e293b" }}>
        Đặt phòng khách sạn
      </h1>

      <div style={{ display: "flex", gap: "32px" }}>
        {/* Left: Hotel Info */}
        <div style={{ flex: 1 }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px", color: "#1e293b" }}>
              {hotel.name}
            </h2>
            
            {hotel.image && (
              <img
                src={hotel.image}
                alt={hotel.name}
                style={{
                  width: "100%",
                  height: "300px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginBottom: "16px"
                }}
              />
            )}

            <div style={{ marginBottom: "16px" }}>
              {hotel.star_rating > 0 && (
                <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                  {[...Array(parseInt(hotel.star_rating) || 0)].map((_, i) => (
                    <span key={i} style={{ color: "#fbbf24", fontSize: "20px" }}>★</span>
                  ))}
                </div>
              )}
              <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 8px 0" }}>
                {hotel.address || hotel.location}
              </p>
              {hotel.user_score > 0 && (
                <div style={{
                  display: "inline-block",
                  background: "#0E7490",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "16px"
                }}>
                  {hotel.user_score}★
                </div>
              )}
            </div>

            {hotel.description && (
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "16px" }}>
                {hotel.description}
              </p>
            )}

            {amenities.length > 0 && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "#1e293b" }}>
                  Tiện nghi
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        background: "#f8fafc",
                        padding: "6px 12px",
                        borderRadius: "6px"
                      }}
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Room Details Section */}
          {selectedRoom && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: "#1e293b" }}>
                Thông tin phòng đã chọn
              </h2>
              
              <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
                {/* Room Image */}
                {selectedRoom.image && (
                  <div>
                    <img
                      src={selectedRoom.image}
                      alt={selectedRoom.name}
                      style={{
                        width: "100%",
                        height: "400px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }}
                    />
                  </div>
                )}
                
                {/* Room Info */}
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "#1e293b" }}>
                    {selectedRoom.name}
                  </h3>
                  
                  {selectedRoom.description && (
                    <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "20px" }}>
                      {selectedRoom.description}
                    </p>
                  )}
                  
                  {/* Room Specifications - List Format */}
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "#1e293b" }}>
                      Thông tin phòng
                    </h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      <li style={{ fontSize: "14px", color: "#475569", marginBottom: "8px", paddingLeft: "0" }}>
                        <strong>Số khách:</strong> {selectedRoom.max_guests} khách
                      </li>
                      {selectedRoom.bed_type && (
                        <li style={{ fontSize: "14px", color: "#475569", marginBottom: "8px", paddingLeft: "0" }}>
                          <strong>Loại giường:</strong> {selectedRoom.bed_type}
                        </li>
                      )}
                      <li style={{ fontSize: "14px", color: "#475569", marginBottom: "8px", paddingLeft: "0" }}>
                        <strong>Giá mỗi đêm:</strong> <span style={{ fontWeight: 600, color: "#0E7490" }}>
                          {Number(selectedRoom.price_per_night || 0).toLocaleString()}₫
                        </span>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Room Features - List Format */}
                  {selectedRoom.features && (() => {
                    let features = [];
                    try {
                      features = typeof selectedRoom.features === 'string' 
                        ? JSON.parse(selectedRoom.features) 
                        : selectedRoom.features;
                      if (!Array.isArray(features)) features = [];
                    } catch (e) {
                      console.error("Error parsing room features:", e);
                      features = [];
                    }
                    
                    if (features.length > 0) {
                      return (
                        <div>
                          <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "#1e293b" }}>
                            Tiện nghi phòng
                          </h4>
                          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {features.map((feature, idx) => (
                              <li 
                                key={idx}
                                style={{
                                  fontSize: "14px",
                                  color: "#475569",
                                  marginBottom: "8px",
                                  paddingLeft: "0"
                                }}
                              >
                                • {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking Form */}
        <div style={{ width: "400px", flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px", color: "#1e293b" }}>
              Thông tin đặt phòng
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                  Ngày nhận phòng {hasCheckInFromURL && <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>(Đã chọn)</span>}
                </label>
                <DatePicker
                  value={checkIn}
                  onChange={(value) => {
                    setCheckIn(value);
                    setCheckInDisplay(formatDateToVN(value));
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  placeholder="dd/mm/yyyy"
                  style={{ padding: "10px" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                  Ngày trả phòng {hasCheckOutFromURL && <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>(Đã chọn)</span>}
                </label>
                <DatePicker
                  value={checkOut}
                  onChange={(value) => {
                    setCheckOut(value);
                    setCheckOutDisplay(formatDateToVN(value));
                  }}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  placeholder="dd/mm/yyyy"
                  style={{ padding: "10px" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                  Số người lớn {hasAdultsFromURL && <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>(Đã chọn)</span>}
                  {selectedRoom && (
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 400, marginLeft: "8px" }}>
                      (Tối đa: {selectedRoom.max_guests} người/phòng)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedRoom ? selectedRoom.max_guests : undefined}
                  value={adults}
                  onChange={(e) => {
                    const maxGuests = selectedRoom ? selectedRoom.max_guests : 100;
                    const newAdults = parseInt(e.target.value) || 1;
                    const totalPeople = newAdults + children;
                    
                    if (totalPeople <= maxGuests) {
                      setAdults(newAdults);
                    } else {
                      // Giới hạn đến số tối đa cho phép
                      const maxAdults = Math.max(1, maxGuests - children);
                      setAdults(maxAdults);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#fff",
                    color: "#1e293b",
                    cursor: "text"
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                  Số trẻ em {hasChildrenFromURL && <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>(Đã chọn)</span>}
                  {selectedRoom && (
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 400, marginLeft: "8px" }}>
                      (Tối đa: {selectedRoom.max_guests} người/phòng)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedRoom ? selectedRoom.max_guests : undefined}
                  value={children}
                  onChange={(e) => {
                    const maxGuests = selectedRoom ? selectedRoom.max_guests : 100;
                    const newChildren = parseInt(e.target.value) || 0;
                    const totalPeople = adults + newChildren;
                    
                    if (totalPeople <= maxGuests) {
                      setChildren(newChildren);
                    } else {
                      // Giới hạn đến số tối đa cho phép
                      const maxChildren = Math.max(0, maxGuests - adults);
                      setChildren(maxChildren);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#fff",
                    color: "#1e293b",
                    cursor: "text"
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                  Số phòng {hasRoomsFromURL && <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>(Đã chọn)</span>}
                </label>
                <input
                  type="number"
                  min="1"
                  value={rooms}
                  onChange={(e) => setRooms(parseInt(e.target.value) || 1)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#fff",
                    color: "#1e293b",
                    cursor: "text"
                  }}
                />
              </div>

              {/* Room Type Selection */}
              {hotel?.Rooms && hotel.Rooms.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                    Loại phòng {hasRoomIdFromURL && <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 400 }}>(Đã chọn)</span>}
                  </label>
                  {hasRoomIdFromURL ? (
                    <div style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      background: "#f8fafc",
                      color: "#64748b",
                      cursor: "not-allowed"
                    }}>
                      {selectedRoom 
                        ? `${selectedRoom.name} - ${Number(selectedRoom.price_per_night || 0).toLocaleString()}₫/đêm`
                        : "Đang tải..."}
                    </div>
                  ) : (
                    <select
                      value={selectedRoomId || ""}
                      onChange={(e) => {
                        const roomId = e.target.value;
                        setSelectedRoomId(roomId);
                        if (roomId) {
                          const room = hotel.Rooms.find(r => r.id === parseInt(roomId));
                          setSelectedRoom(room || null);
                        } else {
                          setSelectedRoom(null);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px",
                        background: "#fff",
                        cursor: "pointer"
                      }}
                    >
                      <option value="">Chọn loại phòng (tùy chọn)</option>
                      {hotel.Rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} - {Number(room.price_per_night || 0).toLocaleString()}₫/đêm
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedRoom && (
                    <div style={{ 
                      marginTop: "8px", 
                      padding: "12px", 
                      background: "#f0f9ff", 
                      borderRadius: "8px",
                      border: "1px solid #bae6fd"
                    }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#0E7490", marginBottom: "4px" }}>
                        {selectedRoom.name}
                      </div>
                      {selectedRoom.description && (
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                          {selectedRoom.description}
                        </div>
                      )}
                      <div style={{ fontSize: "12px", color: "#475569" }}>
                        {selectedRoom.max_guests} khách • {selectedRoom.bed_type || "1 giường"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Information */}
              <div style={{ marginBottom: "20px", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", color: "#1e293b" }}>
                  Thông tin liên hệ {user && "(từ tài khoản của bạn)"}
                </h4>
                
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                    Họ tên *
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    placeholder={user ? user.name || "Nhập họ tên" : "Nhập họ tên"}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                    placeholder={user ? user.email || "Nhập email" : "Nhập email"}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                    placeholder={user ? (user.phone || "Nhập số điện thoại") : "Nhập số điện thoại"}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Combo Booking Summary */}
              {(selectedTour || selectedFlight) && (
                <div style={{ background: "#f0f9ff", borderRadius: "12px", padding: "20px", marginBottom: "20px", border: "1px solid #bae6fd" }}>
                  <div style={{ fontWeight: 600, marginBottom: 12, color: "#0E7490", fontSize: "16px" }}>
                    📦 Đơn hàng Combo
                  </div>
                  {selectedTour && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "14px", color: "#64748b" }}>
                      <span>Tour ({selectedTour.name}):</span>
                      <span>{Number(selectedTour.price * (adults + children)).toLocaleString()} ₫</span>
                    </div>
                  )}
                  {selectedFlight && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "14px", color: "#64748b" }}>
                      <span>Chuyến bay ({selectedFlight.flight_number}):</span>
                      <span>{Number((selectedFlight.economy_price || selectedFlight.business_price || selectedFlight.first_class_price) * (adults + children)).toLocaleString()} ₫</span>
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
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                  Mã khuyến mãi (tùy chọn)
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={promotionCode}
                    onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                    placeholder={(selectedTour || selectedFlight) && promotionCode ? "Mã combo đã được áp dụng tự động" : "Nhập mã khuyến mãi"}
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: promotionError ? "1px solid #ef4444" : "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      background: (selectedTour || selectedFlight) && promotionCode ? "#dcfce7" : "#fff"
                    }}
                    disabled={(selectedTour || selectedFlight) && promotionCode ? true : false}
                  />
                  {!appliedPromotion ? (
                    <button
                      type="button"
                      onClick={applyPromotion}
                      style={{
                        padding: "10px 20px",
                        background: "#0E7490",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Áp dụng
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={removePromotion}
                      style={{
                        padding: "10px 20px",
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Xóa
                    </button>
                  )}
                </div>
                {promotionError && (
                  <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                    {promotionError}
                  </div>
                )}
                {appliedPromotion && (
                  <div style={{ color: "#10b981", fontSize: "12px", marginTop: "4px" }}>
                    Đã áp dụng mã: {appliedPromotion.title} - Giảm {discountAmount.toLocaleString()}₫
                  </div>
                )}
              </div>

              {/* Price Summary */}
              {nights > 0 && (
                <div style={{
                  background: "#f8fafc",
                  padding: "20px",
                  borderRadius: "8px",
                  marginBottom: "24px"
                }}>
                  {/* Hotel Price */}
                  <div style={{ marginBottom: (selectedTour || selectedFlight) ? "16px" : "8px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", marginBottom: "8px" }}>
                      Khách sạn
                    </div>
                    {selectedRoom && (
                      <div style={{ 
                        marginBottom: "8px", 
                        padding: "8px", 
                        background: "#f0f9ff", 
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: "#0E7490"
                      }}>
                        Loại phòng: {selectedRoom.name}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Giá/đêm:</span>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>
                        {selectedRoom 
                          ? Number(selectedRoom.price_per_night || 0).toLocaleString()
                          : Number(hotel.price_per_night || 0).toLocaleString()}₫
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Số đêm:</span>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>{nights} đêm</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Số phòng:</span>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>{rooms} phòng</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, color: "#1e293b", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
                      <span>Tổng khách sạn:</span>
                      <span>
                        {(() => {
                          const pricePerNight = selectedRoom 
                            ? parseFloat(selectedRoom.price_per_night || 0)
                            : parseFloat(hotel.price_per_night || 0);
                          return Number(pricePerNight * nights * rooms).toLocaleString();
                        })()}₫
                      </span>
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
                        <span>{Number(selectedTour.price * (adults + children)).toLocaleString()}₫</span>
                      </div>
                    </div>
                  )}

                  {selectedFlight && (
                    <div style={{ marginBottom: "16px", padding: "12px", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#0E7490", marginBottom: "8px" }}>
                        Chuyến bay
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#64748b", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px" }}>{selectedFlight.flight_number}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 600, color: "#1e293b", paddingTop: "8px", borderTop: "1px solid #bae6fd" }}>
                        <span>Tổng chuyến bay:</span>
                        <span>{Number((selectedFlight.economy_price || selectedFlight.business_price || selectedFlight.first_class_price) * (adults + children)).toLocaleString()}₫</span>
                      </div>
                    </div>
                  )}

                  {/* Discount */}
                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", padding: "12px", background: "#dcfce7", borderRadius: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#166534" }}>Giảm giá:</span>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#10b981" }}>
                        -{Number(discountAmount).toLocaleString()}₫
                      </span>
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
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>Tổng tiền:</span>
                    <span style={{ fontSize: "24px", fontWeight: 700, color: "#0E7490" }}>
                      {Number(total).toLocaleString()}₫
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || nights <= 0}
                style={{
                  width: "100%",
                  background: nights > 0 ? "#0E7490" : "#94a3b8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "14px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: nights > 0 ? "pointer" : "not-allowed"
                }}
              >
                {submitting ? "Đang xử lý..." : "Đặt phòng ngay"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedBooking && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !processing) {
              setShowPaymentModal(false);
              setSelectedBooking(null);
            }
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#1e293b" }}>
              Chọn phương thức thanh toán
            </h3>
            
            <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ fontSize: "14px", color: "#64748b", marginBottom: 4 }}>Đặt phòng khách sạn</div>
              <div style={{ fontSize: "16px", fontWeight: 600 }}>{hotel?.name}</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#0E7490", marginTop: 8 }}>
                {Number(selectedBooking.total_price).toLocaleString()} ₫
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => processPayment("vnpay")}
                disabled={processing}
                style={{
                  border: "2px solid #0E7490",
                  borderRadius: 8,
                  padding: 16,
                  cursor: processing ? "not-allowed" : "pointer",
                  background: "#f0f9ff",
                  textAlign: "center",
                  transition: "all 0.2s",
                  opacity: processing ? 0.6 : 1
                }}
                onMouseEnter={(e) => !processing && (e.currentTarget.style.background = "#e0f2fe")}
                onMouseLeave={(e) => !processing && (e.currentTarget.style.background = "#f0f9ff")}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>VNPay</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Thẻ ngân hàng</div>
              </button>
              
              <button
                onClick={() => processPayment("momo")}
                disabled={processing}
                style={{
                  border: "2px solid #0E7490",
                  borderRadius: 8,
                  padding: 16,
                  cursor: processing ? "not-allowed" : "pointer",
                  background: "#f0f9ff",
                  textAlign: "center",
                  transition: "all 0.2s",
                  opacity: processing ? 0.6 : 1
                }}
                onMouseEnter={(e) => !processing && (e.currentTarget.style.background = "#e0f2fe")}
                onMouseLeave={(e) => !processing && (e.currentTarget.style.background = "#f0f9ff")}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>MoMo</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Ví điện tử</div>
              </button>
              
              <button
                onClick={() => processPayment("cash")}
                disabled={processing}
                style={{
                  border: "2px solid #0E7490",
                  borderRadius: 8,
                  padding: 16,
                  cursor: processing ? "not-allowed" : "pointer",
                  background: "#f0f9ff",
                  textAlign: "center",
                  transition: "all 0.2s",
                  opacity: processing ? 0.6 : 1
                }}
                onMouseEnter={(e) => !processing && (e.currentTarget.style.background = "#e0f2fe")}
                onMouseLeave={(e) => !processing && (e.currentTarget.style.background = "#f0f9ff")}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>Tiền mặt</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Thanh toán sau</div>
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                onClick={() => {
                  if (!processing && selectedBooking) {
                    const bookingId = selectedBooking.id;
                    setShowPaymentModal(false);
                    setSelectedBooking(null);
                    // Navigate directly to confirmation page
                    navigate(`/hotel/booking/${bookingId}/confirm`);
                  }
                }}
                disabled={processing}
                style={{
                  background: "#f8fafc",
                  color: "#1e293b",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: "8px 16px",
                  cursor: processing ? "not-allowed" : "pointer",
                  opacity: processing ? 0.6 : 1
                }}
              >
                Thanh toán sau
              </button>
            </div>

            {processing && (
              <div style={{ marginTop: 16, textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                Đang xử lý...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

