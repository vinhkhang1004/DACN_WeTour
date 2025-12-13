import React, { useEffect, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [customTours, setCustomTours] = useState([]);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [flightBookings, setFlightBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);
  const [selectedFlightBooking, setSelectedFlightBooking] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all, tours, hotels, flights
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const fetchData = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Fetch regular bookings
    api
      .get("/bookings/my", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setBookings(res.data || []))
      .catch((err) => console.error("Error fetching bookings:", err));

    // Fetch custom tours (approved và paid)
    api
      .get("/custom-tours/my-tours", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        // Hiển thị các tour đã được approve hoặc đã thanh toán
        const approvedTours = (res.data || []).filter(tour => 
          tour.status === "approved" || tour.status === "paid" || tour.status === "completed"
        );
        setCustomTours(approvedTours);
      })
      .catch((err) => console.error("Error fetching custom tours:", err));

    // Fetch hotel bookings
    api
      .get("/hotels/bookings/my", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        console.log("Hotel bookings fetched:", res.data);
        console.log("Number of hotel bookings:", res.data?.length || 0);
        if (res.data && res.data.length > 0) {
          res.data.forEach((booking, index) => {
            console.log(`  Booking ${index + 1}:`, {
              id: booking.id,
              user_id: booking.user_id,
              guest_email: booking.guest_email,
              hotel: booking.Hotel?.name,
              hotel_id: booking.hotel_id,
              check_in_date: booking.check_in_date,
              check_out_date: booking.check_out_date,
              adults: booking.adults,
              children: booking.children,
              rooms: booking.rooms,
              total_price: booking.total_price,
              status: booking.status,
              Hotel: booking.Hotel
            });
          });
        }
        setHotelBookings(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching hotel bookings:", err);
        console.error("Error response:", err.response?.data);
        console.error("Error status:", err.response?.status);
        setHotelBookings([]);
      });

    // Fetch flight bookings
    api
      .get("/flights/bookings/my", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        console.log("Flight bookings fetched:", res.data);
        console.log("Number of flight bookings:", res.data?.length || 0);
        const bookingsData = res.data || [];
        console.log("Setting flightBookings state with:", bookingsData);
        
        if (bookingsData.length > 0) {
          bookingsData.forEach((booking, index) => {
            console.log(`  Flight booking ${index + 1}:`, {
              id: booking.id,
              booking_code: booking.booking_code,
              user_id: booking.user_id,
              guest_email: booking.guest_email,
              flight_id: booking.flight_id,
              return_flight_id: booking.return_flight_id,
              passenger_count: booking.passenger_count,
              class_type: booking.class_type,
              total_price: booking.total_price,
              status: booking.status,
              payment_status: booking.payment_status,
              OutboundFlight: booking.OutboundFlight,
              ReturnFlight: booking.ReturnFlight
            });
          });
        }
        
        setFlightBookings(bookingsData);
        console.log("Flight bookings state set to:", bookingsData);
      })
      .catch((err) => {
        console.error("Error fetching flight bookings:", err);
        console.error("Error response:", err.response?.data);
        console.error("Error status:", err.response?.status);
        console.error("Full error:", err);
        setFlightBookings([]);
      })
      .finally(() => {
        console.log("Flight bookings fetch completed");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    
    // Listen for focus event to refresh data when user returns to page
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [location.pathname]); // Refresh when navigating to this page

  const cancelBooking = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy tour này không?")) return;
    const token = localStorage.getItem("token");
    try {
      await api.put(`/bookings/cancel/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
      );
      alert("Đã hủy tour thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi hủy tour");
    }
  };

  const handleCustomTourPayment = (tour) => {
    setSelectedTour(tour);
    setShowPaymentModal(true);
  };

  const processPayment = async (method) => {
    const token = localStorage.getItem("token");
    
    // Handle flight booking payment
    if (selectedFlightBooking) {
      setProcessing(true);
      try {
        if (method === "vnpay") {
          const response = await api.post(
            "/flight-payments/vnpay/create",
            { flight_booking_id: selectedFlightBooking.id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data.paymentUrl) {
            window.location.href = response.data.paymentUrl;
          } else {
            alert("Không thể tạo link thanh toán VNPay");
            setProcessing(false);
          }
        } else if (method === "momo") {
          const response = await api.post(
            "/flight-payments/momo/create",
            { flight_booking_id: selectedFlightBooking.id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data.paymentUrl) {
            window.location.href = response.data.paymentUrl;
          } else {
            alert("Không thể tạo link thanh toán MoMo");
            setProcessing(false);
          }
        } else if (method === "cash") {
          if (!window.confirm(`Xác nhận thanh toán tiền mặt cho đặt vé này?\nSố tiền: ${Number(selectedFlightBooking.total_price).toLocaleString()}₫`)) {
            setProcessing(false);
            return;
          }
          
          const response = await api.post(
            "/flight-payments/cash",
            { flight_booking_id: selectedFlightBooking.id },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setShowPaymentModal(false);
          const bookingId = selectedFlightBooking.id;
          setSelectedFlightBooking(null);
          setProcessing(false);
          
          // Navigate directly to confirmation page
          window.location.href = `/flights/booking/${bookingId}/confirm`;
        }
      } catch (error) {
        console.error("Error processing flight payment:", error);
        alert("Có lỗi xảy ra: " + (error.response?.data?.message || error.message));
        setProcessing(false);
      }
      return;
    }
    
    // Handle custom tour payment
    if (!selectedTour) return;
    
    setProcessing(true);
    try {
      if (method === "vnpay") {
        const response = await api.post(
          "/custom-tours/payment/vnpay/create",
          { custom_tour_id: selectedTour.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        } else {
          alert("Không thể tạo link thanh toán VNPay");
          setProcessing(false);
        }
      } else if (method === "momo") {
        const response = await api.post(
          "/custom-tours/payment/momo/create",
          { custom_tour_id: selectedTour.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        } else {
          alert("Không thể tạo link thanh toán MoMo");
          setProcessing(false);
        }
      } else if (method === "cash") {
        if (!window.confirm(`Xác nhận thanh toán tiền mặt cho tour này?\nSố tiền: ${Number(selectedTour.estimated_cost).toLocaleString()}₫`)) {
          setProcessing(false);
          return;
        }
        
        const response = await api.post(
          "/custom-tours/payment/cash",
          { custom_tour_id: selectedTour.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        alert("Đã xác nhận thanh toán tiền mặt! Bạn sẽ thanh toán khi nhận tour.");
        setShowPaymentModal(false);
        setSelectedTour(null);
        
        // Refresh danh sách
        const customToursRes = await api.get("/custom-tours/my-tours", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const approvedTours = (customToursRes.data || []).filter(tour => 
          tour.status === "approved" || tour.status === "paid" || tour.status === "completed"
        );
        setCustomTours(approvedTours);
        setProcessing(false);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Có lỗi xảy ra: " + (error.response?.data?.message || error.message));
      setProcessing(false);
    }
  };

  if (!user)
    return <p style={{ textAlign: "center" }}>🔒 Vui lòng đăng nhập để xem lịch sử đặt tour.</p>;

  if (loading) return <p style={{ textAlign: "center" }}>Đang tải lịch sử đặt tour...</p>;

  const allTours = [
    ...bookings.map(b => ({ ...b, type: "regular" })),
    ...customTours.map(ct => ({ ...ct, type: "custom" }))
  ].sort((a, b) => {
    // Sắp xếp theo ngày tạo (mới nhất trước)
    const dateA = new Date(a.created_at || a.booking_date || 0);
    const dateB = new Date(b.created_at || b.booking_date || 0);
    return dateB - dateA;
  });

  const calculateNights = (checkIn, checkOut) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span style={{ color: "#d97706" }}>Chờ xác nhận</span>;
      case "confirmed":
        return <span style={{ color: "#059669" }}>Đã xác nhận</span>;
      case "completed":
        return <span style={{ color: "#0ea5e9" }}>Hoàn thành</span>;
      case "cancelled":
        return <span style={{ color: "#ef4444" }}>Đã hủy</span>;
      default:
        return <span style={{ color: "#64748b" }}>{status}</span>;
    }
  };

  // Map hotel bookings với type để dễ xử lý
  const mappedHotelBookings = hotelBookings.map((hb, index) => {
    console.log(`Mapping hotel booking ${index + 1}:`, {
      id: hb.id,
      type: "hotel",
      check_in_date: hb.check_in_date,
      check_out_date: hb.check_out_date,
      adults: hb.adults,
      children: hb.children,
      rooms: hb.rooms,
      total_price: hb.total_price,
      status: hb.status,
      Hotel: hb.Hotel,
      hotel_id: hb.hotel_id
    });
    
    return { 
      ...hb, 
      type: "hotel",
      // Đảm bảo có đầy đủ thông tin
      check_in_date: hb.check_in_date,
      check_out_date: hb.check_out_date,
      adults: hb.adults || 1,
      children: hb.children || 0,
      rooms: hb.rooms || 1,
      total_price: hb.total_price,
      status: hb.status || "pending"
    };
  });

  // Map flight bookings với type để dễ xử lý
  const mappedFlightBookings = flightBookings.map((fb, index) => {
    console.log(`Mapping flight booking ${index + 1}:`, {
      id: fb.id,
      type: "flight",
      booking_code: fb.booking_code,
      OutboundFlight: fb.OutboundFlight,
      ReturnFlight: fb.ReturnFlight,
      passenger_count: fb.passenger_count,
      class_type: fb.class_type,
      total_price: fb.total_price,
      status: fb.status,
      payment_status: fb.payment_status
    });
    
    return {
      ...fb,
      type: "flight"
    };
  });

  const filteredItems = activeTab === "tours" 
    ? allTours 
    : activeTab === "hotels" 
    ? mappedHotelBookings 
    : activeTab === "flights"
    ? mappedFlightBookings
    : [...allTours, ...mappedHotelBookings, ...mappedFlightBookings];

  const sortedItems = filteredItems.sort((a, b) => {
    const dateA = new Date(a.created_at || a.booking_date || a.check_in_date || 0);
    const dateB = new Date(b.created_at || b.booking_date || b.check_in_date || 0);
    return dateB - dateA;
  });

  // Debug logging
  console.log("BookingHistory Debug:", {
    activeTab,
    flightBookingsCount: flightBookings.length,
    flightBookings: flightBookings,
    mappedFlightBookingsCount: mappedFlightBookings.length,
    mappedFlightBookings: mappedFlightBookings,
    filteredItemsCount: filteredItems.length,
    filteredItems: filteredItems,
    sortedItemsCount: sortedItems.length,
    sortedItems: sortedItems,
    flightBookingsInSorted: sortedItems.filter(item => item.type === "flight").length
  });

  // Không return sớm, luôn hiển thị tabs để người dùng có thể chuyển đổi

  return (
    <div style={{ maxWidth: 1200, margin: "auto", padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Lịch sử đặt của bạn</h2>
      
      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "2px solid #e5e7eb" }}>
        <button
          onClick={() => setActiveTab("all")}
          style={{
            padding: "12px 24px",
            background: activeTab === "all" ? "#0E7490" : "transparent",
            color: activeTab === "all" ? "#fff" : "#64748b",
            border: "none",
            borderBottom: activeTab === "all" ? "2px solid #0E7490" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 600,
            marginBottom: "-2px",
            transition: "all 0.2s"
          }}
        >
          Tất cả ({allTours.length + hotelBookings.length + flightBookings.length})
        </button>
        <button
          onClick={() => setActiveTab("tours")}
          style={{
            padding: "12px 24px",
            background: activeTab === "tours" ? "#0E7490" : "transparent",
            color: activeTab === "tours" ? "#fff" : "#64748b",
            border: "none",
            borderBottom: activeTab === "tours" ? "2px solid #0E7490" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 600,
            marginBottom: "-2px",
            transition: "all 0.2s"
          }}
        >
          Tour ({allTours.length})
        </button>
        <button
          onClick={() => setActiveTab("hotels")}
          style={{
            padding: "12px 24px",
            background: activeTab === "hotels" ? "#0E7490" : "transparent",
            color: activeTab === "hotels" ? "#fff" : "#64748b",
            border: "none",
            borderBottom: activeTab === "hotels" ? "2px solid #0E7490" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 600,
            marginBottom: "-2px",
            transition: "all 0.2s"
          }}
        >
          Khách sạn ({hotelBookings.length})
        </button>
        <button
          onClick={() => setActiveTab("flights")}
          style={{
            padding: "12px 24px",
            background: activeTab === "flights" ? "#0E7490" : "transparent",
            color: activeTab === "flights" ? "#fff" : "#64748b",
            border: "none",
            borderBottom: activeTab === "flights" ? "2px solid #0E7490" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 600,
            marginBottom: "-2px",
            transition: "all 0.2s"
          }}
        >
          Chuyến bay ({flightBookings.length})
        </button>
      </div>
      
      {sortedItems.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <p style={{ fontSize: "16px", color: "#64748b" }}>
            {activeTab === "hotels" 
              ? "Bạn chưa có đặt phòng khách sạn nào." 
              : activeTab === "tours"
              ? "Bạn chưa có đặt tour nào."
              : activeTab === "flights"
              ? "Bạn chưa có đặt vé máy bay nào."
              : "Bạn chưa có đặt nào."}
          </p>
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 10,
            fontSize: 15,
            background: "#fff",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}
        >
        <thead>
          <tr style={{ background: "#0E7490", color: "#fff" }}>
            <th style={{ padding: 12, textAlign: "left" }}>Loại</th>
            <th style={{ padding: 12, textAlign: "left" }}>Tên / Điểm đến</th>
            <th style={{ padding: 12, textAlign: "left" }}>Ngày</th>
            <th style={{ padding: 12, textAlign: "left" }}>Số người / Phòng</th>
            <th style={{ padding: 12, textAlign: "left" }}>Tổng tiền</th>
            <th style={{ padding: 12, textAlign: "left" }}>Trạng thái</th>
            <th style={{ padding: 12, textAlign: "left" }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => {
            const isCustom = item.type === "custom";
            const isHotel = item.type === "hotel";
            const isRegular = item.type === "regular";
            const isFlight = item.type === "flight";
            
            let tourName, startDate, peopleCount, totalPrice, status, endDate;
            
            if (isFlight) {
              // Flight booking
              const outboundFlight = item.OutboundFlight;
              const returnFlight = item.ReturnFlight;
              
              console.log("Processing flight booking item:", {
                item,
                outboundFlight,
                returnFlight,
                hasOutbound: !!outboundFlight,
                hasReturn: !!returnFlight
              });
              
              tourName = outboundFlight 
                ? `${outboundFlight.airline || "N/A"} ${outboundFlight.flight_number || ""}`
                : "Chuyến bay";
              startDate = outboundFlight?.departure_date;
              endDate = returnFlight ? returnFlight.arrival_date : (outboundFlight?.arrival_date);
              peopleCount = `${item.passenger_count || 1} hành khách • ${item.class_type === "economy" ? "Phổ thông" : item.class_type === "business" ? "Thương gia" : item.class_type === "first" ? "Hạng nhất" : item.class_type || "Phổ thông"}`;
              totalPrice = parseFloat(item.total_price) || 0;
              status = item.status || "pending";
            } else if (isHotel) {
              // Hotel booking
              tourName = item.Hotel?.name || item.hotel_name || "Khách sạn";
              startDate = item.check_in_date;
              endDate = item.check_out_date;
              const adults = parseInt(item.adults) || 1;
              const children = parseInt(item.children) || 0;
              const rooms = parseInt(item.rooms) || 1;
              const nights = startDate && endDate ? calculateNights(startDate, endDate) : 0;
              peopleCount = `${adults} người lớn${children > 0 ? `, ${children} trẻ em` : ""} • ${rooms} phòng${nights > 0 ? ` • ${nights} đêm` : ""}`;
              totalPrice = parseFloat(item.total_price) || 0;
              status = item.status || "pending";
            } else if (isCustom) {
              tourName = item.destination;
              startDate = item.start_date;
              endDate = item.end_date;
              peopleCount = `${item.adults} người lớn, ${item.children} trẻ em`;
              totalPrice = item.estimated_cost;
              status = item.status;
            } else {
              tourName = item.Tour?.name;
              startDate = item.booking_date;
              peopleCount = `${item.people_count} người`;
              totalPrice = item.total_price;
              status = item.status;
            }
            
            return (
              <tr key={`${item.type}-${item.id}`} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 12 }}>
                  {isFlight ? (
                    <span style={{ 
                      background: "#f59e0b", 
                      color: "#fff", 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "12px",
                      fontWeight: 600
                    }}>
                      Chuyến bay
                    </span>
                  ) : isHotel ? (
                    <span style={{ 
                      background: "#8b5cf6", 
                      color: "#fff", 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "12px",
                      fontWeight: 600
                    }}>
                      Khách sạn
                    </span>
                  ) : isCustom ? (
                    <span style={{ 
                      background: "#10b981", 
                      color: "#fff", 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "12px",
                      fontWeight: 600
                    }}>
                      Tự thiết kế
                    </span>
                  ) : (
                    <span style={{ 
                      background: "#0E7490", 
                      color: "#fff", 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "12px",
                      fontWeight: 600
                    }}>
                      Tour có sẵn
                    </span>
                  )}
                </td>
                <td style={{ padding: 12, fontWeight: 500 }}>
                  {tourName}
                  {isCustom && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      {item.tour_type}
                    </div>
                  )}
                  {isHotel && item.Hotel?.location && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      {item.Hotel.location}
                    </div>
                  )}
                  {isFlight && item.OutboundFlight && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      {item.OutboundFlight.origin} → {item.OutboundFlight.destination}
                      {item.ReturnFlight && ` • Khứ hồi`}
                    </div>
                  )}
                  {isFlight && item.booking_code && (
                    <div style={{ fontSize: "11px", color: "#0E7490", marginTop: "2px", fontWeight: 600 }}>
                      Mã: {item.booking_code}
                    </div>
                  )}
                </td>
                <td style={{ padding: 12 }}>
                  {isFlight ? (
                    <>
                      {startDate ? (
                        <>
                          <div>Khởi hành: {(() => {
                            try {
                              const date = new Date(startDate);
                              return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                            } catch (e) {
                              return startDate;
                            }
                          })()}</div>
                          {endDate && (
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              Đến: {(() => {
                                try {
                                  const date = new Date(endDate);
                                  return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                } catch (e) {
                                  return endDate;
                                }
                              })()}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: "#ef4444" }}>Chưa có ngày</span>
                      )}
                    </>
                  ) : isHotel ? (
                    <>
                      {startDate ? (
                        <>
                          <div>Nhận: {startDate ? (() => {
                            try {
                              return new Date(startDate).toLocaleDateString('vi-VN');
                            } catch (e) {
                              return startDate;
                            }
                          })() : "N/A"}</div>
                          {endDate && (
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              Trả: {(() => {
                                try {
                                  return new Date(endDate).toLocaleDateString('vi-VN');
                                } catch (e) {
                                  return endDate;
                                }
                              })()}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: "#ef4444" }}>Chưa có ngày</span>
                      )}
                    </>
                  ) : (
                    <>
                      {startDate ? (
                        <>
                          {(() => {
                            try {
                              return new Date(startDate).toLocaleDateString('vi-VN');
                            } catch (e) {
                              return startDate;
                            }
                          })()}
                          {endDate && (
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              - {(() => {
                                try {
                                  return new Date(endDate).toLocaleDateString('vi-VN');
                                } catch (e) {
                                  return endDate;
                                }
                              })()}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: "#ef4444" }}>Chưa có ngày</span>
                      )}
                    </>
                  )}
                </td>
                <td style={{ padding: 12 }}>{peopleCount}</td>
                <td style={{ padding: 12, fontWeight: 600, color: "#0E7490" }}>
                  {Number(totalPrice).toLocaleString()} ₫
                </td>
                <td style={{ padding: 12 }}>
                  {getStatusBadge(status)}
                </td>
                <td style={{ padding: 12 }}>
                  {isFlight && (
                    <>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                        {item.payment_status === "paid" ? (
                          <span style={{ color: "#059669" }}>Đã thanh toán</span>
                        ) : item.payment_status === "pending" ? (
                          <span style={{ color: "#d97706" }}>Chưa thanh toán</span>
                        ) : (
                          <span style={{ color: "#64748b" }}>{item.payment_status}</span>
                        )}
                      </div>
                      {item.payment_status === "pending" && (
                        <button
                          onClick={() => {
                            setSelectedFlightBooking(item);
                            setShowPaymentModal(true);
                          }}
                          style={{
                            background: "#0E7490",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 500
                          }}
                        >
                          Thanh toán
                        </button>
                      )}
                    </>
                  )}
                  {isRegular && status === "pending" && (
                    <button
                      onClick={() => cancelBooking(item.id)}
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      Hủy tour
                    </button>
                  )}
                  {isCustom && status === "approved" && (
                    <button
                      onClick={() => handleCustomTourPayment(item)}
                      style={{
                        background: "#0E7490",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 500
                      }}
                    >
                      Thanh toán
                    </button>
                  )}
                  {isCustom && status === "paid" && (
                    <span style={{ color: "#059669", fontSize: "14px" }}>
                      Đã thanh toán
                    </span>
                  )}
                  {isCustom && status === "completed" && (
                    <span style={{ color: "#0ea5e9", fontSize: "14px" }}>
                      Hoàn thành
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      )}

      {/* Payment Modal */}
      {(showPaymentModal && selectedTour) || (showPaymentModal && selectedFlightBooking) ? (
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
          onClick={() => !processing && setShowPaymentModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: "90%",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: "20px", fontWeight: 600 }}>
              Chọn phương thức thanh toán
            </h3>
            
            {selectedFlightBooking ? (
              <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                <div style={{ fontSize: "14px", color: "#64748b", marginBottom: 4 }}>Đặt vé máy bay</div>
                <div style={{ fontSize: "16px", fontWeight: 600 }}>
                  {selectedFlightBooking.OutboundFlight 
                    ? `${selectedFlightBooking.OutboundFlight.airline} ${selectedFlightBooking.OutboundFlight.flight_number}`
                    : "Chuyến bay"}
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#0E7490", marginTop: 8 }}>
                  {Number(selectedFlightBooking.total_price).toLocaleString()} ₫
                </div>
              </div>
            ) : selectedTour ? (
              <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                <div style={{ fontSize: "14px", color: "#64748b", marginBottom: 4 }}>Tour tự thiết kế</div>
                <div style={{ fontSize: "16px", fontWeight: 600 }}>{selectedTour.destination}</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#0E7490", marginTop: 8 }}>
                  {Number(selectedTour.estimated_cost).toLocaleString()} ₫
                </div>
              </div>
            ) : null}

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
                  setShowPaymentModal(false);
                  setSelectedTour(null);
                  setSelectedFlightBooking(null);
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
                Hủy
              </button>
            </div>

            {processing && (
              <div style={{ marginTop: 16, textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                Đang xử lý...
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
