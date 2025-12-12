import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import DatePicker from "../components/DatePicker";

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Booking widget
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkInDisplay, setCheckInDisplay] = useState("");
  const [checkOutDisplay, setCheckOutDisplay] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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
  
  // Combo booking states
  const [suggestedTours, setSuggestedTours] = useState([]);
  const [suggestedFlights, setSuggestedFlights] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showTourSuggestions, setShowTourSuggestions] = useState(false);
  const [showFlightSuggestions, setShowFlightSuggestions] = useState(false);
  const [showRoomDetailModal, setShowRoomDetailModal] = useState(false);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null); // Phòng đã chọn để đặt
  const [roomSortBy, setRoomSortBy] = useState("price_low"); // "price_low", "price_high", "name"

  useEffect(() => {
    fetchHotel();
    fetchReviews();
    if (user) {
      fetchUserReview();
    }
  }, [id, user]);

  const fetchHotel = async () => {
    try {
      // Fetch tất cả phòng (cả available và unavailable) để hiển thị đầy đủ
      const response = await api.get(`/hotels/${id}?include_all_rooms=true`);
      console.log(`[HotelDetail] Fetched hotel data:`, response.data);
      console.log(`[HotelDetail] Total rooms received:`, response.data?.Rooms?.length || 0);
      if (response.data?.Rooms) {
        console.log(`[HotelDetail] Room statuses:`, response.data.Rooms.map(r => ({ 
          id: r.id, 
          name: r.name, 
          status: r.status 
        })));
      }
      setHotel(response.data);
      
      // Cập nhật reviewCount và averageRating từ hotel data nếu có
      if (response.data.reviewCount !== undefined) {
        setReviewCount(response.data.reviewCount);
      }
      if (response.data.averageRating !== undefined) {
        setAverageRating(parseFloat(response.data.averageRating || 0));
      }
      
      // Set default dates (tomorrow and 3 days later)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const checkOutDate = new Date(tomorrow);
      checkOutDate.setDate(checkOutDate.getDate() + 3);
      
      const checkInISO = tomorrow.toISOString().split('T')[0];
      const checkOutISO = checkOutDate.toISOString().split('T')[0];
      
      setCheckIn(checkInISO);
      setCheckOut(checkOutISO);
      setCheckInDisplay(formatDateToVN(checkInISO));
      setCheckOutDisplay(formatDateToVN(checkOutISO));
      
      // Fetch suggested tours and flights for combo
      if (response.data?.location) {
        fetchComboSuggestions(response.data.location);
      }
    } catch (error) {
      console.error("Error fetching hotel:", error);
      alert("Không tìm thấy khách sạn");
      navigate("/hotels");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch combo suggestions
  const fetchComboSuggestions = async (location) => {
    if (!location) return;
    
    setLoadingSuggestions(true);
    try {
      // Fetch tours in the same location
      try {
        const tourRes = await api.get(`/tours?destination=${encodeURIComponent(location)}&limit=5`);
        const tours = tourRes.data?.tours || tourRes.data || [];
        setSuggestedTours(tours);
        console.log(`Found ${tours.length} tours for ${location}`);
      } catch (tourError) {
        console.error("Error fetching tours:", tourError);
        setSuggestedTours([]);
      }
      
      // Fetch flights to the location
      const locationCity = location.split(',')[0].trim();
      const majorCities = ["Hà Nội (HAN)", "TP. Hồ Chí Minh (SGN)", "Đà Nẵng (DAD)", "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng"];
      
      try {
        const flightPromises = majorCities.map(city => 
          api.get(`/flights?origin=${encodeURIComponent(city)}&destination=${encodeURIComponent(locationCity)}&limit=3`)
            .catch(() => ({ data: { flights: [] } }))
        );
        const flightResults = await Promise.all(flightPromises);
        const allFlights = flightResults.flatMap(res => res.data.flights || []);
        const uniqueFlights = Array.from(new Map(allFlights.map(f => [f.id, f])).values()).slice(0, 5);
        setSuggestedFlights(uniqueFlights);
        console.log(`Found ${uniqueFlights.length} flights to ${locationCity}`);
      } catch (flightError) {
        console.error("Error fetching flights:", flightError);
        setSuggestedFlights([]);
      }
    } catch (error) {
      console.error("Error fetching combo suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/hotel-reviews/hotel/${id}`);
      setReviews(response.data.reviews || []);
      setReviewCount(response.data.total || 0);
      setAverageRating(parseFloat(response.data.averageRating || 0));
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchUserReview = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/hotel-reviews/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserReview(response.data);
    } catch (error) {
      // User chưa đánh giá
      setUserReview(null);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      if (window.confirm("Bạn cần đăng nhập để đánh giá. Bạn có muốn đăng nhập không?")) {
        navigate("/login");
      }
      return;
    }

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem("token");
      const endpoint = userReview 
        ? `/hotel-reviews/${userReview.id}`
        : "/hotel-reviews";
      
      const method = userReview ? "put" : "post";
      
      await api[method](
        endpoint,
        {
          hotel_id: id,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert(userReview ? "Cập nhật đánh giá thành công!" : "Đánh giá thành công!");
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: "" });
      await fetchReviews();
      await fetchHotel(); // Cập nhật lại hotel data để đồng bộ reviewCount và averageRating
      if (user) {
        await fetchUserReview();
      }
      fetchUserReview();
      fetchHotel(); // Refresh để cập nhật user_score
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/hotel-reviews/${userReview.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Xóa đánh giá thành công!");
      setUserReview(null);
      await fetchReviews();
      await fetchHotel(); // Cập nhật lại hotel data để đồng bộ reviewCount và averageRating
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleSave = () => {
    setSaved(!saved);
    // TODO: Implement save to wishlist
  };

  const handleCheckAvailability = () => {
    // Kiểm tra đã chọn phòng chưa
    if (!selectedRoom) {
      alert("Vui lòng chọn loại phòng mà bạn muốn");
      return;
    }
    
    // Save selected combo items to localStorage
    if (selectedTour || selectedFlight) {
      const comboData = {
        selectedTour: selectedTour ? {
          id: selectedTour.id,
          name: selectedTour.name,
          destination: selectedTour.destination,
          price: selectedTour.price
        } : null,
        selectedFlight: selectedFlight ? {
          id: selectedFlight.id,
          flight_number: selectedFlight.flight_number,
          origin: selectedFlight.origin,
          destination: selectedFlight.destination,
          economy_price: selectedFlight.economy_price,
          business_price: selectedFlight.business_price,
          first_class_price: selectedFlight.first_class_price
        } : null,
        hotelId: id
      };
      localStorage.setItem("hotel_combo", JSON.stringify(comboData));
    }
    navigate(`/hotels/${id}/book?check_in=${checkIn}&check_out=${checkOut}&adults=${adults}&children=${children}&rooms=${rooms}&room_id=${selectedRoom.id}`);
  };

  const handleSelectRoom = (roomId) => {
    // Tìm và lưu phòng đã chọn
    if (hotel && hotel.Rooms) {
      const room = hotel.Rooms.find(r => r.id === roomId);
      if (room) {
        setSelectedRoom(room);
      }
    }
    navigate(`/hotels/${id}/book?check_in=${checkIn}&check_out=${checkOut}&adults=${adults}&children=${children}&rooms=${rooms}&room_id=${roomId}`);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "40px" }}>Đang tải...</div>;
  }

  if (!hotel) {
    return null;
  }

  // Safely parse images
  let images = [];
  try {
    if (hotel.images) {
      images = typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images;
      if (!Array.isArray(images)) images = [];
    }
  } catch (e) {
    console.error("Error parsing images:", e);
    images = [];
  }
  const allImages = [hotel.image, ...images].filter(Boolean);
  
  // Safely parse amenities
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
  const hotelRooms = hotel.Rooms || [];
  console.log(`[HotelDetail Render] Total rooms to display: ${hotelRooms.length}`, 
    hotelRooms.map(r => ({ id: r.id, name: r.name, status: r.status })));
  
  // Sort rooms based on selected sort option
  // Luôn sắp xếp: available trước, unavailable sau, sau đó mới sắp xếp theo option
  const sortedRooms = [...hotelRooms].sort((a, b) => {
    // Ưu tiên: available trước, unavailable sau
    if (a.status === "available" && b.status !== "available") return -1;
    if (a.status !== "available" && b.status === "available") return 1;
    
    // Nếu cùng status, sắp xếp theo option đã chọn
    const priceA = parseFloat(a.price_per_night || 0);
    const priceB = parseFloat(b.price_per_night || 0);
    
    switch (roomSortBy) {
      case "price_low":
        return priceA - priceB;
      case "price_high":
        return priceB - priceA;
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      default:
        return priceA - priceB;
    }
  });
  
  // Get minimum price from hotelRooms or hotel price_per_night (đồng nhất với trang danh sách)
  const minPrice = hotelRooms.length > 0 
    ? Math.min(...hotelRooms.map(r => parseFloat(r.price_per_night) || 0).filter(p => p > 0))
    : (parseFloat(hotel.price_per_night || hotel.price || 0));
  
  // Fallback to 0 if minPrice is NaN or invalid
  const safeMinPrice = isNaN(minPrice) || minPrice <= 0 ? 0 : minPrice;

  // Get room type badge color
  const getRoomTypeBadge = (roomName) => {
    const name = roomName.toLowerCase();
    if (name.includes("standard") || name.includes("superior")) {
      return { text: "Tiêu chuẩn", color: "#64748b", bg: "#f1f5f9" };
    } else if (name.includes("deluxe")) {
      return { text: "Cao cấp", color: "#0E7490", bg: "#e0f2fe" };
    } else if (name.includes("suite") || name.includes("presidential")) {
      return { text: "Suite", color: "#f97316", bg: "#fff7ed" };
    } else if (name.includes("executive")) {
      return { text: "Executive", color: "#7c3aed", bg: "#f3e8ff" };
    }
    return null;
  };

  const amenityIcons = {
    "Wi-Fi miễn phí": "📶",
    "Bể bơi": "🏊",
    "Bể bơi ngoài trời": "🏊",
    "Trung tâm thể dục": "💪",
    "Gym": "💪",
    "Nhà hàng": "🍽️",
    "Nhà hàng & Bar": "🍽️",
    "Bãi đỗ xe": "🅿️",
    "Bãi đỗ xe miễn phí": "🅿️",
    "Spa": "💆",
    "Dịch vụ Spa": "💆"
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      {/* Breadcrumbs */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>
          <Link to="/" style={{ color: "#0E7490", textDecoration: "none" }}>Trang chủ</Link>
          <span>/</span>
          <Link to="/hotels" style={{ color: "#0E7490", textDecoration: "none" }}>Khách sạn</Link>
          <span>/</span>
          <span style={{ color: "#1e293b" }}>{hotel.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Image Gallery */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px", height: "500px" }}>
          {/* Main Image */}
          <div style={{ flex: 2, borderRadius: "12px", overflow: "hidden", cursor: "pointer" }} onClick={() => setShowImageModal(true)}>
            <img
              src={allImages[selectedImage] || hotel.image || "https://via.placeholder.com/800x500"}
              alt={hotel.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          </div>
          
          {/* Thumbnail Images - 2x2 Grid */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {allImages.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(idx)}
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  cursor: "pointer",
                  border: selectedImage === idx ? "3px solid #0E7490" : "3px solid transparent",
                  position: "relative",
                  height: "100%"
                }}
              >
                <img
                  src={img}
                  alt={`${hotel.name} ${idx + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              </div>
            ))}
            {allImages.length > 4 && (
              <div
                onClick={() => setShowImageModal(true)}
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative",
                  background: `url('${allImages[4]}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  height: "100%"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "16px"
                  }}
                >
                  +{allImages.length - 4} ảnh
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "32px" }}>
          {/* Left Content */}
          <div style={{ flex: 2 }}>
            {/* Hotel Info */}
            <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "12px", color: "#1e293b" }}>
                  {hotel.name}
                </h1>
                
                {/* Rating Stars */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  {(() => {
                    const starCount = hotel?.star_rating ? parseInt(hotel.star_rating) : 0;
                    return starCount > 0 ? (
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[...Array(starCount)].map((_, i) => (
                          <span key={i} style={{ color: "#f97316", fontSize: "24px" }}>★</span>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Address */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontSize: "16px", color: "#64748b" }}>
                  <span>📍</span>
                  <span>{hotel.address || hotel.location}</span>
                </div>
              </div>

              {/* Overall Score Box */}
              {(averageRating > 0 || (hotel?.user_score && parseFloat(hotel.user_score) > 0)) && (
                <div style={{
                  background: "#0E7490",
                  color: "#fff",
                  borderRadius: "12px",
                  padding: "24px",
                  textAlign: "center",
                  minWidth: "120px",
                  boxShadow: "0 4px 12px rgba(14, 116, 144, 0.3)"
                }}>
                  <div style={{ fontSize: "36px", fontWeight: 700, marginBottom: "8px" }}>
                    {averageRating > 0 
                      ? parseFloat(averageRating).toFixed(1) 
                      : (hotel?.user_score ? parseFloat(hotel.user_score).toFixed(1) : "0.0")}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                    Tuyệt vời
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.9 }}>
                    Dựa trên {reviewCount > 0 ? Number(reviewCount).toLocaleString() : 0} đánh giá
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "32px", borderBottom: "2px solid #e5e7eb" }}>
              {["overview", "amenities", "location", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "12px 24px",
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === tab ? "3px solid #0E7490" : "3px solid transparent",
                    color: activeTab === tab ? "#0E7490" : "#64748b",
                    fontSize: "16px",
                    fontWeight: activeTab === tab ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    marginBottom: "-2px"
                  }}
                >
                  {tab === "overview" && "Tổng quan"}
                  {tab === "amenities" && "Tiện nghi"}
                  {tab === "location" && "Vị trí"}
                  {tab === "reviews" && "Đánh giá"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <>
                {/* Hotel Description */}
                <div style={{ marginBottom: "32px" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px", color: "#1e293b" }}>
                    Mô tả khách sạn
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#475569" }}>
                    {hotel.description || `${hotel.name} tọa lạc tại ${hotel.location}, mang đến cho du khách trải nghiệm nghỉ dưỡng tuyệt vời với dịch vụ chuyên nghiệp và tiện nghi hiện đại.`}
                  </p>
                </div>

                {/* Featured Amenities */}
                {amenities.length > 0 && (
                  <div style={{ marginBottom: "32px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "20px", color: "#1e293b" }}>
                      Tiện nghi nổi bật
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
                      {amenities.slice(0, 8).map((amenity, idx) => (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "32px" }}>{amenityIcons[amenity] || "✓"}</span>
                          <span style={{ fontSize: "14px", color: "#475569", textAlign: "center" }}>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "amenities" && (
              <div style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "20px", color: "#1e293b" }}>
                  Tiện nghi & Dịch vụ
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                  {amenities.map((amenity, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "24px" }}>{amenityIcons[amenity] || "✓"}</span>
                      <span style={{ fontSize: "16px", color: "#475569" }}>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "location" && (
              <div style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "20px", color: "#1e293b" }}>
                  Vị trí
                </h2>
                <div style={{ fontSize: "16px", color: "#475569", marginBottom: "16px" }}>
                  <strong>Địa chỉ:</strong> {hotel.address || hotel.location}
                </div>
                {hotel.latitude && hotel.longitude && (
                  <div style={{ width: "100%", height: "400px", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dS6FG4QmuUxUqc&q=${hotel.latitude},${hotel.longitude}`}
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}

            {/* Room Selection - Only show in overview tab */}
            {activeTab === "overview" && hotelRooms.length > 0 && (
              <div style={{ marginTop: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b" }}>
                    Chọn phòng của bạn ({hotelRooms.length} loại phòng)
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", color: "#64748b" }}>Sắp xếp:</span>
                    <select
                      value={roomSortBy}
                      onChange={(e) => setRoomSortBy(e.target.value)}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                        cursor: "pointer",
                        background: "#fff"
                      }}
                    >
                      <option value="price_low">Giá: Thấp → Cao</option>
                      <option value="price_high">Giá: Cao → Thấp</option>
                      <option value="name">Tên A-Z</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {sortedRooms.map((room) => {
                    // Safely parse room features
                    let features = [];
                    try {
                      if (room.features) {
                        features = typeof room.features === 'string' ? JSON.parse(room.features) : room.features;
                        if (!Array.isArray(features)) features = [];
                      }
                    } catch (e) {
                      console.error("Error parsing room features:", e);
                      features = [];
                    }
                    
                    return (
                      <div
                        key={room.id}
                        style={{
                          display: "flex",
                          gap: "20px",
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          padding: "20px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                        }}
                      >
                        {room.image && (
                          <img
                            src={room.image}
                            alt={room.name}
                            style={{
                              width: "280px",
                              height: "200px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              flexShrink: 0
                            }}
                          />
                        )}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                                {room.name}
                              </h3>
                              {/* Quantity Badge - Chỉ hiển thị số phòng còn lại */}
                              {room.quantity !== undefined && room.quantity !== null && (
                                <span style={{
                                  background: room.quantity > 3 ? "#dbeafe" : room.quantity > 0 ? "#fef3c7" : "#fee2e2",
                                  color: room.quantity > 3 ? "#1e40af" : room.quantity > 0 ? "#92400e" : "#991b1b",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 600
                                }}>
                                  {room.quantity > 0 ? `Còn ${room.quantity} phòng` : "Hết phòng"}
                                </span>
                              )}
                              {getRoomTypeBadge(room.name) && (
                                <span style={{
                                  background: getRoomTypeBadge(room.name).bg,
                                  color: getRoomTypeBadge(room.name).color,
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 600
                                }}>
                                  {getRoomTypeBadge(room.name).text}
                                </span>
                              )}
                            </div>
                            {room.description && (
                              <p style={{ fontSize: "14px", color: "#475569", marginBottom: "12px", lineHeight: "1.6" }}>
                                {room.description}
                              </p>
                            )}
                            <div style={{ marginBottom: "12px", fontSize: "14px", color: "#64748b", lineHeight: "1.8" }}>
                              <div style={{ marginBottom: "8px" }}>
                                <strong>{room.max_guests}</strong> khách • {room.bed_type || "1 giường"}
                                {room.size || room.area ? ` • ${room.size || room.area}` : ""}
                              </div>
                              {features.length > 0 && (
                                <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                  {features.map((feature, idx) => (
                                    <span key={idx} style={{
                                      background: "#f1f5f9",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      fontSize: "12px",
                                      color: "#475569"
                                    }}>
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", gap: "12px", flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0E7490" }}>
                                {Number(room.price_per_night || 0).toLocaleString()}₫
                              </div>
                              <div style={{ fontSize: "14px", color: "#64748b" }}>/đêm</div>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={() => {
                                  setSelectedRoomDetail(room);
                                  setShowRoomDetailModal(true);
                                }}
                                style={{
                                  background: "#fff",
                                  color: "#0E7490",
                                  border: "1px solid #0E7490",
                                  borderRadius: "8px",
                                  padding: "12px 20px",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = "#f0f9ff";
                                  e.target.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = "#fff";
                                  e.target.style.transform = "translateY(0)";
                                }}
                              >
                                Xem chi tiết
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRoom(room);
                                  handleSelectRoom(room.id);
                                }}
                                style={{
                                  background: "#f97316",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "8px",
                                  padding: "12px 24px",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = "#ea580c";
                                  e.target.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = "#f97316";
                                  e.target.style.transform = "translateY(0)";
                                }}
                              >
                                Chọn phòng
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Combo Booking Suggestions - Main Content Section */}
            {hotel?.location && (
              <div style={{ 
                marginTop: "48px", 
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
                    Thêm tour hoặc chuyến bay cùng địa điểm để được áp dụng mã khuyến mãi combo
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
                        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", margin: 0 }}>🎯 Tour tại {hotel?.location}</h3>
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

                  {/* Flight Suggestions */}
                  {!loadingSuggestions && suggestedFlights.length > 0 && (
                    <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", margin: 0 }}>✈️ Chuyến bay đến {hotel?.location}</h3>
                        <button
                          type="button"
                          onClick={() => setShowFlightSuggestions(!showFlightSuggestions)}
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
                          {showFlightSuggestions ? "Ẩn" : "Xem"}
                        </button>
                      </div>
                      {showFlightSuggestions && (
                        <div style={{ display: "grid", gap: "12px" }}>
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
                                padding: "16px",
                                background: selectedFlight?.id === flight.id ? "#e0f2fe" : "#f8fafc",
                                border: selectedFlight?.id === flight.id ? "2px solid #0E7490" : "1px solid #e5e7eb",
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "4px", color: "#1e293b" }}>
                                {flight.airline} {flight.flight_number}
                              </div>
                              <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>
                                {flight.origin} → {flight.destination}
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ color: "#0E7490", fontSize: "16px", fontWeight: 600 }}>
                                  {Number(flight.economy_price || flight.business_price || flight.first_class_price).toLocaleString()} ₫
                                </div>
                                {selectedFlight?.id === flight.id && (
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

                {(selectedTour || selectedFlight) && (
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
                    ✓ Đã chọn: {selectedTour && "Tour"} {selectedTour && selectedFlight && " + "} {selectedFlight && "Chuyến bay"}
                    <br />
                    <span style={{ fontSize: "14px", color: "#15803d", fontWeight: 400 }}>
                      Bạn sẽ được áp dụng mã khuyến mãi combo khi thanh toán
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Section - Only show in reviews tab */}
            {activeTab === "reviews" && (
              <div style={{ marginTop: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b" }}>
                    Đánh giá ({reviewCount})
                  </h2>
                {user && !userReview && (
                  <button
                    onClick={() => setShowReviewForm(true)}
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
                    Viết đánh giá
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && user && (
                <div style={{
                  background: "#f8fafc",
                  padding: "24px",
                  borderRadius: "12px",
                  marginBottom: "24px",
                  border: "1px solid #e5e7eb"
                }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "#1e293b" }}>
                    {userReview ? "Sửa đánh giá của bạn" : "Viết đánh giá"}
                  </h3>
                  <form onSubmit={handleSubmitReview}>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                        Đánh giá *
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "32px",
                              color: star <= reviewForm.rating ? "#fbbf24" : "#e5e7eb",
                              padding: 0
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                        Nhận xét
                      </label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        rows="4"
                        placeholder="Chia sẻ trải nghiệm của bạn về khách sạn này..."
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          fontSize: "14px",
                          resize: "vertical"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        style={{
                          background: "#0E7490",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 20px",
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: submittingReview ? "not-allowed" : "pointer",
                          opacity: submittingReview ? 0.6 : 1
                        }}
                      >
                        {submittingReview ? "Đang gửi..." : userReview ? "Cập nhật" : "Gửi đánh giá"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowReviewForm(false);
                          if (userReview) {
                            setReviewForm({ rating: userReview.rating, comment: userReview.comment || "" });
                          } else {
                            setReviewForm({ rating: 5, comment: "" });
                          }
                        }}
                        style={{
                          background: "#f8fafc",
                          color: "#1e293b",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "10px 20px",
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* User's Review */}
              {userReview && !showReviewForm && (
                <div style={{
                  background: "#f0f9ff",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "24px",
                  border: "1px solid #bae6fd"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                        Đánh giá của bạn
                      </div>
                      <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i} style={{ color: i < userReview.rating ? "#fbbf24" : "#e5e7eb", fontSize: "16px" }}>
                            ★
                          </span>
                        ))}
                      </div>
                      {userReview.comment && (
                        <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                          {userReview.comment}
                        </p>
                      )}
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
                        {new Date(userReview.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => {
                          setReviewForm({ rating: userReview.rating, comment: userReview.comment || "" });
                          setShowReviewForm(true);
                        }}
                        style={{
                          background: "#0E7490",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={handleDeleteReview}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      style={{
                        padding: "20px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        background: "#fff"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                            {review.User?.name || "Người dùng"}
                          </div>
                          <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                            {[...Array(5)].map((_, i) => (
                              <span key={i} style={{ color: i < review.rating ? "#fbbf24" : "#e5e7eb", fontSize: "16px" }}>
                                ★
                              </span>
                            ))}
                          </div>
                          {review.comment && (
                            <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                              {review.comment}
                            </p>
                          )}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          {new Date(review.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                  Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá khách sạn này!
                </div>
              )}
            </div>
            )}

          </div>

          {/* Right Sidebar - Booking Widget */}
          <div style={{ width: "380px", flexShrink: 0 }}>
            <div style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              position: "sticky",
              top: "20px"
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "16px" }}>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                  Giá mỗi đêm từ
                </span>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#0E7490" }}>
                  {Number(safeMinPrice).toLocaleString()}₫
                </span>
              </div>

              {/* Special Offer Button */}
              {hotelRooms.length > 0 && hotelRooms.length <= 3 && (
                <button
                  style={{
                    width: "100%",
                    background: "#e0f2fe",
                    color: "#0E7490",
                    border: "1px solid #bae6fd",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "24px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#bae6fd";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#e0f2fe";
                  }}
                >
                  Giá tốt nhất! Chỉ còn {hotelRooms.length} phòng trống.
                </button>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                  Nhận phòng
                </label>
                <DatePicker
                  value={checkIn}
                  onChange={(value) => {
                    setCheckIn(value);
                    setCheckInDisplay(formatDateToVN(value));
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  placeholder="dd/mm/yyyy"
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                  Trả phòng
                </label>
                <DatePicker
                  value={checkOut}
                  onChange={(value) => {
                    setCheckOut(value);
                    setCheckOutDisplay(formatDateToVN(value));
                  }}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  placeholder="dd/mm/yyyy"
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: "#1e293b" }}>
                  Khách
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "18px", zIndex: 1 }}>👤</span>
                  <input
                    type="text"
                    value={`${adults} người lớn${children > 0 ? `, ${children} trẻ em` : ""}`}
                    readOnly
                    onClick={() => setShowGuestModal(true)}
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  />
                </div>
                
                {/* Guest Selection Modal */}
                {showGuestModal && (
                  <>
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
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        borderRadius: "12px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                        padding: "24px",
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
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleCheckAvailability}
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
                  transition: "all 0.2s",
                  marginBottom: "12px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#0891b2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0E7490";
                }}
              >
                Đặt ngay
              </button>

              <div style={{ fontSize: "12px", color: "#64748b", textAlign: "center", lineHeight: "1.5" }}>
                Bạn sẽ không bị trừ tiền cho đến khi nhận phòng.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Detail Modal */}
      {showRoomDetailModal && selectedRoomDetail && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflowY: "auto"
          }}
          onClick={() => setShowRoomDetailModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowRoomDetailModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "rgba(255, 255, 255, 0.9)",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                fontSize: "24px",
                fontWeight: 700,
                color: "#1e293b",
                cursor: "pointer",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#fff";
                e.target.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.9)";
                e.target.style.transform = "scale(1)";
              }}
            >
              ×
            </button>

            {/* Room Image */}
            {selectedRoomDetail.image && (
              <div style={{ width: "100%", height: "400px", position: "relative" }}>
                <img
                  src={selectedRoomDetail.image}
                  alt={selectedRoomDetail.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderTopLeftRadius: "16px",
                    borderTopRightRadius: "16px"
                  }}
                />
              </div>
            )}

            {/* Room Content */}
            <div style={{ padding: "32px" }}>
              {/* Room Name */}
              <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "16px", color: "#1e293b" }}>
                {selectedRoomDetail.name}
              </h2>

              {/* Room Description */}
              {selectedRoomDetail.description && (
                <div style={{ 
                  background: "#f8fafc", 
                  padding: "16px", 
                  borderRadius: "8px", 
                  marginBottom: "24px",
                  border: "1px solid #e5e7eb"
                }}>
                  <p style={{ fontSize: "15px", color: "#475569", lineHeight: "1.7", margin: 0 }}>
                    {selectedRoomDetail.description}
                  </p>
                </div>
              )}

              {/* Room Details */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "#1e293b" }}>
                  Chi tiết phòng
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Sức chứa</div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b" }}>
                      Phòng tối đa {selectedRoomDetail.max_guests} người lớn
                    </div>
                  </div>
                  {selectedRoomDetail.bed_type && (
                    <div>
                      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Loại giường</div>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b" }}>
                        {selectedRoomDetail.bed_type}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Giá mỗi đêm</div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#0E7490" }}>
                      {Number(selectedRoomDetail.price_per_night || 0).toLocaleString()}₫
                    </div>
                  </div>
                  {(selectedRoomDetail.size || selectedRoomDetail.area) && (
                    <div>
                      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Diện tích</div>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b" }}>
                        {selectedRoomDetail.size || selectedRoomDetail.area}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Room Features */}
              {selectedRoomDetail.features && (() => {
                let features = [];
                try {
                  features = typeof selectedRoomDetail.features === 'string' 
                    ? JSON.parse(selectedRoomDetail.features) 
                    : selectedRoomDetail.features;
                  if (!Array.isArray(features)) features = [];
                } catch (e) {
                  console.error("Error parsing room features:", e);
                  features = [];
                }
                
                if (features.length > 0) {
                  return (
                    <div style={{ marginBottom: "24px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "#1e293b" }}>
                        Tiện nghi phòng
                      </h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                        {features.map((feature, idx) => (
                          <div key={idx} style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "8px",
                            fontSize: "14px",
                            color: "#475569"
                          }}>
                            <span style={{ color: "#0E7490", fontSize: "16px" }}>✓</span>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                <button
                  onClick={() => {
                    setShowRoomDetailModal(false);
                    // Set selectedRoom trước khi navigate
                    setSelectedRoom(selectedRoomDetail);
                    handleSelectRoom(selectedRoomDetail.id);
                  }}
                  style={{
                    flex: 1,
                    background: "#f97316",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "14px 24px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#ea580c";
                    e.target.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#f97316";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  Chọn phòng này
                </button>
                <button
                  onClick={() => setShowRoomDetailModal(false)}
                  style={{
                    background: "#fff",
                    color: "#64748b",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "14px 24px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#fff";
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

