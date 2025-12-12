import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { Helmet } from "react-helmet-async";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import TourMap from "../components/TourMap";
import { useToast } from "../components/Toast";

export default function TourDetailEnhanced() {
  const { showError } = useToast();
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [people, setPeople] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageTransition, setImageTransition] = useState(false);
  const [thumbnailScrollIndex, setThumbnailScrollIndex] = useState(0);
  const [promotionCode, setPromotionCode] = useState("");
  const [promotion, setPromotion] = useState(null);
  const [checkingPromotion, setCheckingPromotion] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [comparisonTours, setComparisonTours] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [relatedTours, setRelatedTours] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [hasValidDates, setHasValidDates] = useState(true);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [expandedDays, setExpandedDays] = useState(new Set([0])); // Expand first day by default
  
  // Combo booking states
  const [suggestedHotels, setSuggestedHotels] = useState([]);
  const [suggestedFlights, setSuggestedFlights] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showHotelSuggestions, setShowHotelSuggestions] = useState(false);
  const [showFlightSuggestions, setShowFlightSuggestions] = useState(false);
  const [hotelRooms, setHotelRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tourRes = await api.get(`/tours/${id}`);
        setTour(tourRes.data);
        
        // Parse available_dates and set default date
        console.log('Tour data loaded:', tourRes.data);
        console.log('Available dates raw:', tourRes.data.available_dates);
        
        let availableDates = [];
        if (tourRes.data.available_dates) {
          try {
            availableDates = JSON.parse(tourRes.data.available_dates);
            if (!Array.isArray(availableDates)) availableDates = [];
            console.log('Parsed available dates:', availableDates);
          } catch (e) {
            console.error('Error parsing available_dates:', e);
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
        
        // Kiểm tra có ngày hợp lệ không
        let hasValid = false;
        if (availableDates.length > 0) {
          hasValid = true;
          setDate(availableDates[0]);
          console.log('Set default date:', availableDates[0]);
        } else if (tourRes.data.departure_date) {
          // Fallback to departure_date for backward compatibility
          const departureDate = new Date(tourRes.data.departure_date);
          departureDate.setHours(0, 0, 0, 0);
          if (departureDate >= today) {
            hasValid = true;
          setDate(departureDate.toISOString().split('T')[0]);
          console.log('Set departure_date:', departureDate.toISOString().split('T')[0]);
        } else {
            console.log('Departure date has passed - no valid dates');
            hasValid = false;
          }
        } else {
          // Nếu không có available_dates và không có departure_date, cho phép chọn tự do
          hasValid = true;
          console.log('No dates set - allowing free date picker');
        }
        setHasValidDates(hasValid);
        
        try {
          const reviewsRes = await api.get(`/reviews/tour/${id}`);
          setReviews(reviewsRes.data || []);
        } catch (err) {
          // Silently fail if 401 or other errors for reviews
          if (err.response?.status !== 401) {
            console.error("Error fetching reviews:", err);
          }
        }
        

        // Fetch related tours
        try {
          const relatedRes = await api.get(`/tours?destination=${encodeURIComponent(tourRes.data.destination)}&limit=4`);
          setRelatedTours(relatedRes.data?.filter(t => t.id !== parseInt(id)) || []);
        } catch (err) {
          // Silently fail for related tours
          console.error("Error fetching related tours:", err);
        }
        
        setLoading(false);  
      } catch (err) {
        console.error("Error fetching tour:", err);
        if (err.response?.status === 404) {
          // Tour not found
        } else if (err.response?.status === 401) {
          // Token issue - already handled by interceptor
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Load wishlist and comparison from localStorage
  useEffect(() => {
    if (user) {
      const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
      
      // Auto-fill guest information from user
      setGuestName(user.name || "");
      setGuestEmail(user.email || "");
      setGuestPhone(user.phone || "");
      
      // Try to fetch full user data from API for more complete info
      const fetchUserData = async () => {
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const response = await api.get("/users/me", {
              headers: { Authorization: `Bearer ${token}` }
            });
            const userData = response.data;
            
            if (userData.name) setGuestName(userData.name);
            if (userData.email) setGuestEmail(userData.email);
            if (userData.phone) setGuestPhone(userData.phone);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
      
      fetchUserData();
    }
    
    const savedComparison = localStorage.getItem("comparisonTours");
    if (savedComparison) {
      setComparisonTours(JSON.parse(savedComparison));
    }
  }, [user]);

  // Fetch hotel rooms when a hotel is selected
  useEffect(() => {
    const fetchHotelRooms = async () => {
      if (!selectedHotel || !selectedHotel.id) {
        setHotelRooms([]);
        return;
      }

      setLoadingRooms(true);
      try {
        // Request tất cả phòng (cả available và unavailable) để hiển thị trạng thái đầy đủ
        const response = await api.get(`/hotels/${selectedHotel.id}?include_all_rooms=true`);
        console.log("Hotel rooms response:", response.data);
        if (response.data && response.data.Rooms) {
          const rooms = Array.isArray(response.data.Rooms) ? response.data.Rooms : [];
          console.log(`Fetched ${rooms.length} rooms:`, rooms.map(r => ({ id: r.id, name: r.name, status: r.status })));
          setHotelRooms(rooms);
        } else {
          console.log("No rooms found in response");
          setHotelRooms([]);
        }
      } catch (error) {
        console.error("Error fetching hotel rooms:", error);
        setHotelRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchHotelRooms();

    // Auto-refresh room status every 30 seconds to reflect admin changes
    const refreshInterval = setInterval(() => {
      if (selectedHotel && selectedHotel.id) {
        fetchHotelRooms();
      }
    }, 30000); // Refresh every 30 seconds

    // Refresh when tab becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedHotel && selectedHotel.id) {
        fetchHotelRooms();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedHotel]);

  const totalPeople = adults + children;
  // Tính giá: người lớn = giá gốc, trẻ em = 70% giá gốc
  const childrenPrice = tour ? tour.price * 0.7 : 0;
  const originalPrice = tour ? (tour.price * adults + childrenPrice * children) : 0;
  // Add combo prices
  const hotelPrice = selectedHotel ? selectedHotel.price_per_night : 0;
  const flightPrice = selectedFlight ? (selectedFlight.economy_price || selectedFlight.business_price || selectedFlight.first_class_price) * totalPeople : 0;
  const comboTotal = originalPrice + hotelPrice + flightPrice;
  const totalPrice = promotion && promotion.finalAmount ? promotion.finalAmount : comboTotal;
  const discountAmount = promotion ? promotion.discountAmount : 0;

  // Auto-apply combo promotion when combo is selected
  useEffect(() => {
    const autoApplyComboPromo = async () => {
      // Only auto-apply if combo is selected and no promo is already applied
      if (!(selectedHotel || selectedFlight)) return;
      if (promotionCode.trim()) return; // Don't override if user already entered a promo
      if (promotion) return; // Already has a promo applied

      if (!totalPrice || totalPrice <= 0) return;

      try {
        // Determine service_type
        let serviceType = "tour";
        if (selectedHotel && selectedFlight) {
          serviceType = "all";
        } else if (selectedHotel) {
          serviceType = "tour_hotel";
        } else if (selectedFlight) {
          serviceType = "tour_flight";
        }
        
        // Fetch available promotions for this service type
        const promotionsRes = await api.get(`/promotions?service_type=${serviceType}&active=true&limit=50`);
        const promotions = promotionsRes.data?.promotions || promotionsRes.data || [];
        
        // Find the first valid combo promotion
        for (const promo of promotions) {
          if (!promo.code) continue;
          
          // Skip if not a combo promotion
          if (promo.service_type && 
              !["tour_hotel", "tour_flight", "hotel_flight", "all"].includes(promo.service_type)) {
            continue;
          }
          
          try {
            const checkRes = await api.post(`/promotions/check`, {
              code: promo.code,
              amount: totalPrice,
              service_type: serviceType
            });
            
            if (checkRes.data.valid) {
              // Auto-apply this promotion
              setPromotionCode(promo.code);
              setPromotion({
                promotion: checkRes.data.promotion,
                discountAmount: checkRes.data.discount_amount,
                finalAmount: checkRes.data.final_amount
              });
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

    // Only run when combo is selected and price is calculated
    if ((selectedHotel || selectedFlight) && totalPrice > 0 && tour) {
      autoApplyComboPromo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotel, selectedFlight, totalPrice]);

  const checkPromotion = async () => {
    if (!promotionCode.trim()) {
      setPromotion(null);
      return;
    }

    setCheckingPromotion(true);
    try {
      // Determine service_type for combo
      let serviceType = "tour";
      if (selectedHotel && selectedFlight) {
        serviceType = "all";
      } else if (selectedHotel) {
        serviceType = "tour_hotel";
      } else if (selectedFlight) {
        serviceType = "tour_flight";
      }
      
      const response = await api.post(`/promotions/check`, {
        code: promotionCode.trim().toUpperCase(),
        amount: totalPrice,
        service_type: serviceType
      });
      
      if (response.data.valid) {
        setPromotion({
          promotion: response.data.promotion,
          discountAmount: response.data.discount_amount,
          finalAmount: response.data.final_amount
        });
      } else {
        setPromotion(null);
        showError(response.data.message || "Mã khuyến mãi không hợp lệ");
      }
    } catch (error) {
      setPromotion(null);
      // Don't show alert for 401 - token issue
      if (error.response?.status !== 401) {
        showError(error.response?.data?.message || "Mã khuyến mãi không hợp lệ");
      }
    } finally {
      setCheckingPromotion(false);
    }
  };

  const [showNotification, setShowNotification] = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setShowNotification({ type, message });
    setTimeout(() => {
      setShowNotification({ type: "", message: "" });
    }, 3000);
  };

  const toggleWishlist = () => {
    if (!user) {
      alert("Bạn cần đăng nhập để thêm vào danh sách yêu thích");
      return;
    }

    const isInWishlist = wishlist.some((item) => item.id === tour.id);
    if (isInWishlist) {
      const newWishlist = wishlist.filter((item) => item.id !== tour.id);
      setWishlist(newWishlist);
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(newWishlist));
      showToast("info", "Đã xóa khỏi wishlist");
    } else {
      const tourWithType = { ...tour, type: "tour" };
      const newWishlist = [...wishlist, tourWithType];
      setWishlist(newWishlist);
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(newWishlist));
      showToast("success", "Đã thêm vào wishlist");
    }
  };

  const toggleComparison = () => {
    const isInComparison = comparisonTours.some((item) => item.id === tour.id);
    if (isInComparison) {
      setComparisonTours(comparisonTours.filter((item) => item.id !== tour.id));
      showToast("info", "Đã xóa khỏi so sánh");
    } else if (comparisonTours.length < 3) {
      setComparisonTours([...comparisonTours, tour]);
      localStorage.setItem("comparisonTours", JSON.stringify([...comparisonTours, tour]));
      showToast("success", "Đã thêm vào so sánh");
    } else {
      alert("Bạn chỉ có thể so sánh tối đa 3 tour");
    }
  };

  const handleBooking = async () => {
    // Nếu chưa đăng nhập, hiển thị form guest
    if (!user) {
      if (!showGuestForm) {
        setShowGuestForm(true);
      return;
    }
      // Validate guest form
      if (!guestName || !guestPhone || !guestEmail) {
        alert("Vui lòng điền đầy đủ thông tin: Họ tên, Số điện thoại và Email");
      return;
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestEmail)) {
        alert("Email không hợp lệ");
        return;
      }
    }

    if (!date) {
      alert("Vui lòng chọn ngày khởi hành");
      return;
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
        alert("Vui lòng chọn một trong các ngày khởi hành đã được chọn sẵn");
        return;
      }
    } else if (tour?.departure_date) {
      // Fallback validation for backward compatibility
      const departureDate = new Date(tour.departure_date);
      const selectedDate = new Date(date);
      departureDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate.getTime() !== departureDate.getTime()) {
        alert(`Ngày đi phải là ${departureDate.toLocaleDateString('vi-VN')}`);
        return;
      }
    }

    if (totalPeople < 1) {
      alert("Số người phải lớn hơn 0");
      return;
    }

    setSubmitting(true);
    let bookingId = null;
    try {
      
      // Prepare notes with adults/children info (store as JSON at the end)
      let bookingNotes = notes || "";
      const peopleInfo = { adults, children };
      const peopleInfoJson = JSON.stringify(peopleInfo);
      
      // Store people info in notes with a marker
      if (bookingNotes) {
        bookingNotes = `${bookingNotes}\n__PEOPLE_INFO__:${peopleInfoJson}`;
      } else {
        bookingNotes = `__PEOPLE_INFO__:${peopleInfoJson}`;
      }

      const bookingData = {
        tour_id: parseInt(id),
        people_count: parseInt(totalPeople),
        booking_date: date,
        payment_method: paymentMethod === "cash" ? null : paymentMethod,
        notes: bookingNotes,
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

      if (promotion && promotion.promotion) {
        bookingData.promotion_code = promotion.promotion.code;
      }

      // Thêm thông tin guest nếu chưa đăng nhập
      if (!user) {
        bookingData.guest_name = guestName;
        bookingData.guest_phone = guestPhone;
        bookingData.guest_email = guestEmail;
      }

      // Gọi API khác nhau cho user và guest
      const endpoint = user ? "/bookings" : "/bookings/guest";
      const response = await api.post(endpoint, bookingData);
      bookingId = response.data.booking.id;
      
      if (!bookingId) {
        throw new Error("Không nhận được booking ID từ server");
      }
      
      // Handle payment based on method
      if (paymentMethod === "cash") {
        // Redirect to confirmation page
        navigate(`/tour/booking/${bookingId}/confirm`);
      } else if (paymentMethod === "vnpay") {
        // Create VNPay payment URL
        const paymentRes = await api.post("/payments/vnpay/create", {
          booking_id: bookingId,
        });
        // Redirect to VNPay
        if (paymentRes.data?.paymentUrl) {
          window.location.href = paymentRes.data.paymentUrl;
        } else {
          throw new Error("Không thể tạo link thanh toán VNPay");
        }
      } else if (paymentMethod === "momo") {
        // Create MoMo payment URL
        const paymentRes = await api.post("/payments/momo/create", {
          booking_id: bookingId,
        });
        // Redirect to MoMo
        if (paymentRes.data?.paymentUrl) {
          window.location.href = paymentRes.data.paymentUrl;
        } else {
          throw new Error("Không thể tạo link thanh toán MoMo");
        }
      }
    } catch (e) {
      console.error("Booking error:", e);
      setSubmitting(false); // Always reset submitting state
      
      // Handle 401 (Unauthorized) - token expired or invalid
      if (e.response?.status === 401) {
        const errorMsg = e.response?.data?.message || "⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        // Clear invalid token
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert(errorMsg);
        navigate("/login");
        return;
      }
      
      // Handle 403 (Forbidden) - no permission
      if (e.response?.status === 403) {
        const errorMsg = e.response?.data?.message || "⚠️ Bạn không có quyền thực hiện thao tác này.";
        alert(errorMsg);
        // If it's a payment creation error, the booking was created but payment failed
        // Redirect to confirmation page anyway
        if (bookingId) {
          setTimeout(() => {
            navigate(`/tour/booking/${bookingId}/confirm`);
          }, 2000);
        }
        return;
      }
      
      // Handle other errors
      const errorMessage = e.response?.data?.message || e.message || "Có lỗi xảy ra khi đặt tour";
      alert(errorMessage);
    }
  };

  const submitReview = async () => {
    if (!user) {
      alert("Bạn cần đăng nhập để đánh giá");
      return;
    }

    if (!reviewComment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/reviews",
        {
          tour_id: id,
          rating: reviewRating,
          comment: reviewComment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh reviews
      const reviewsRes = await api.get(`/reviews/tour/${id}`);
      setReviews(reviewsRes.data || []);
      
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
      alert("Cảm ơn bạn đã đánh giá!");
    } catch (e) {
      alert(e.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá");
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} style={{ color: "#fbbf24" }}>★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" style={{ color: "#fbbf24" }}>☆</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} style={{ color: "#d1d5db" }}>☆</span>);
    }
    
    return stars;
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, color: "#0E7490", marginBottom: "20px" }}>🔄</div>
        <h2 style={{ color: "#1e293b", marginBottom: "8px" }}>Đang tải thông tin tour...</h2>
        <p style={{ color: "#64748b" }}>Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, color: "#ef4444", marginBottom: "20px" }}>❌</div>
        <h2 style={{ color: "#1e293b", marginBottom: "8px" }}>Không tìm thấy tour</h2>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>Tour này có thể đã bị xóa hoặc không tồn tại</p>
        <button
          onClick={() => navigate("/tours")}
          style={{
            background: "#0E7490",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          Xem tất cả tour
        </button>
      </div>
    );
  }

  const images = tour.images ? tour.images.split(',').map(img => img.trim()) : [tour.image || "https://via.placeholder.com/800x500?text=Tour+Image"];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <Helmet>
        <title>{tour.name} | Đặt tour giá tốt</title>
        <meta name="description" content={tour.description?.slice(0, 150) || "Tour du lịch hấp dẫn."} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: tour.name,
          description: tour.description,
          brand: { "@type": "Brand", name: "Travel" },
          offers: {
            "@type": "Offer",
            price: tour.price,
            priceCurrency: "VND",
            availability: "https://schema.org/InStock"
          },
          aggregateRating: reviews.length ? {
            "@type": "AggregateRating",
            ratingValue: calculateAverageRating().toFixed(1),
            reviewCount: reviews.length
          } : undefined
        })}</script>
      </Helmet>
      {/* Breadcrumbs */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
          <Link to="/" style={{ color: "#64748b", textDecoration: "none" }}>Trang chủ</Link>
          <span>/</span>
          <Link to="/tours" style={{ color: "#64748b", textDecoration: "none" }}>Tour</Link>
          <span>/</span>
          <span style={{ color: "#1e293b" }}>{tour.destination || tour.name}</span>
        </div>
      </div>

      {/* Image Gallery Section - Layout: Large image left, thumbnails right */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          {/* Main Image - Left (Large) with Overlay */}
          <div 
            style={{ 
              position: "relative",
              flex: 1,
              aspectRatio: "4/3",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#e5e7eb",
              cursor: "pointer"
            }}
            onClick={() => setShowImageModal(true)}
          >
            <img
              key={currentImageIndex}
              src={images[currentImageIndex]}
              alt={`${tour.name} - Image ${currentImageIndex + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "opacity 0.5s ease-in-out, transform 0.5s ease-in-out",
                opacity: imageTransition ? 0 : 1,
                transform: "scale(1)"
              }}
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/800x500?text=Tour+Image";
              }}
              onLoad={() => {
                setImageTransition(false);
              }}
              onMouseEnter={(e) => {
                if (!imageTransition) {
                  e.target.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!imageTransition) {
                  e.target.style.transform = "scale(1)";
                }
              }}
            />
            
            {/* Gradient Overlay */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "50%",
              background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
              zIndex: 1,
              pointerEvents: "none"
            }} />
            
            {/* Tour Title and Buttons Overlay */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "24px",
              zIndex: 2,
              pointerEvents: "auto"
            }}>
              {/* Tour Title */}
              <h1 style={{ 
                fontSize: "32px", 
                margin: "0 0 16px", 
                fontWeight: 700, 
                color: "#fff",
                textShadow: "0 2px 8px rgba(0,0,0,0.5)"
              }}>
                {tour.name}
              </h1>
              
              {/* Location */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                marginBottom: "0",
                color: "#fff",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)"
              }}>
                <span style={{ fontSize: "18px" }}>📍</span>
                <span style={{ fontSize: "16px" }}>{tour.destination}</span>
              </div>
            </div>
            
            {/* Top Right Icons */}
            <div style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              display: "flex",
              gap: "12px",
              zIndex: 3
            }}>
              {/* Share Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (navigator.share) {
                    navigator.share({
                      title: tour.name,
                      text: tour.description?.slice(0, 100),
                      url: window.location.href
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    showToast("success", "Đã sao chép link");
                  }
                }}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(10px)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontSize: "20px"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.3)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.2)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                }}
              >
                🔗
              </button>
              {/* Wishlist Icon Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist();
                }}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: `1px solid ${wishlist.some(item => item.id === tour.id) ? "rgba(239, 68, 68, 0.5)" : "rgba(255, 255, 255, 0.3)"}`,
                  background: wishlist.some(item => item.id === tour.id) ? "rgba(239, 68, 68, 0.8)" : "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(10px)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontSize: "20px",
                  visibility: "visible",
                  opacity: 1,
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(239, 68, 68, 0.9)";
                  e.target.style.borderColor = "rgba(239, 68, 68, 0.7)";
                }}
                onMouseLeave={(e) => {
                  if (!wishlist.some(item => item.id === tour.id)) {
                    e.target.style.background = "rgba(255, 255, 255, 0.2)";
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                  }
                }}
              >
                {wishlist.some(item => item.id === tour.id) ? "❤️" : "🤍"}
              </button>
              {/* Comparison Icon Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleComparison();
                }}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: `1px solid ${comparisonTours.some(item => item.id === tour.id) ? "rgba(14, 116, 144, 0.5)" : "rgba(255, 255, 255, 0.3)"}`,
                  background: comparisonTours.some(item => item.id === tour.id) ? "rgba(14, 116, 144, 0.8)" : "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(10px)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontSize: "20px",
                  visibility: "visible",
                  opacity: 1,
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(14, 116, 144, 0.9)";
                  e.target.style.borderColor = "rgba(14, 116, 144, 0.7)";
                }}
                onMouseLeave={(e) => {
                  if (!comparisonTours.some(item => item.id === tour.id)) {
                    e.target.style.background = "rgba(255, 255, 255, 0.2)";
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                  }
                }}
              >
                ⚖️
              </button>
            </div>
            
            {/* View All Photos Button */}
            {images.length > 5 && (
              <div style={{
                position: "absolute",
                bottom: "20px",
                right: "20px",
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(10px)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                zIndex: 2
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(true);
              }}>
                Xem tất cả ảnh
              </div>
            )}
          </div>

          {/* Thumbnail Gallery - Right (2 rows, 5 images) with infinite scrolling */}
          {images.length > 1 && (
            <div style={{
              position: "relative",
              width: "200px",
              height: "600px",
              overflow: "hidden"
            }}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                transform: `translateY(-${thumbnailScrollIndex * 132}px)`,
                transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
              }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (idx !== currentImageIndex) {
                        setImageTransition(true);
                        setTimeout(() => {
                          setCurrentImageIndex(idx);
                          // Auto-scroll thumbnails to keep selected in view
                          if (images.length > 5) {
                            if (idx < thumbnailScrollIndex) {
                              setThumbnailScrollIndex(Math.max(0, idx));
                            } else if (idx >= thumbnailScrollIndex + 5) {
                              setThumbnailScrollIndex(Math.min(images.length - 5, idx - 4));
                            }
                          }
                        }, 250);
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "120px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: currentImageIndex === idx ? "3px solid #0E7490" : "2px solid #e5e7eb",
                      cursor: "pointer",
                      background: "transparent",
                      padding: 0,
                      transition: "all 0.3s ease-in-out",
                      transform: currentImageIndex === idx ? "scale(1.02)" : "scale(1)"
                    }}
                    onMouseEnter={(e) => {
                      if (currentImageIndex !== idx) {
                        e.target.style.borderColor = "#0E7490";
                        e.target.style.opacity = "0.9";
                        e.target.style.transform = "scale(1.02)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentImageIndex !== idx) {
                        e.target.style.borderColor = "#e5e7eb";
                        e.target.style.opacity = "1";
                        e.target.style.transform = "scale(1)";
                      }
                    }}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s ease-in-out"
                      }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/200x120?text=Image";
                      }}
                    />
                  </button>
                ))}
              </div>
              {/* Scroll indicators for infinite scrolling */}
              {images.length > 5 && (
                <>
                  {thumbnailScrollIndex > 0 && (
                    <button
                      onClick={() => setThumbnailScrollIndex(Math.max(0, thumbnailScrollIndex - 1))}
                      style={{
                        position: "absolute",
                        top: "0",
                        left: "0",
                        right: "0",
                        height: "30px",
                        background: "linear-gradient(to bottom, rgba(255,255,255,0.9), transparent)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        color: "#0E7490",
                        zIndex: 1
                      }}
                    >
                      ↑
                    </button>
                  )}
                  {thumbnailScrollIndex < images.length - 5 && (
                    <button
                      onClick={() => setThumbnailScrollIndex(Math.min(images.length - 5, thumbnailScrollIndex + 1))}
                      style={{
                        position: "absolute",
                        bottom: "0",
                        left: "0",
                        right: "0",
                        height: "30px",
                        background: "linear-gradient(to top, rgba(255,255,255,0.9), transparent)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        color: "#0E7490",
                        zIndex: 1
                      }}
                    >
                      ↓
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

        {/* Tour Rating and Info */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
            {reviews.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {renderStars(calculateAverageRating())}
                </div>
                <span style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937" }}>
                  {calculateAverageRating().toFixed(1)}/5
                </span>
                <span style={{ color: "#64748b", fontSize: "16px" }}>
                  ({reviews.length} đánh giá)
                </span>
              </div>
            )}
          </div>

          {/* Toast Notification */}
          {showNotification.message && (
            <div
              style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                background: showNotification.type === "success" ? "#10b981" : "#3b82f6",
                color: "#fff",
                padding: "16px 24px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 10000,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "15px",
                fontWeight: 500,
                animation: "slideIn 0.3s ease-out"
              }}
            >
              <span style={{ fontSize: "20px" }}>
                {showNotification.type === "success" ? "✅" : "ℹ️"}
              </span>
              <span>{showNotification.message}</span>
            </div>
          )}

          {/* Tổng quan về chuyến đi - 3 Cards */}
          <div style={{ 
            background: "#fff", 
            padding: "24px", 
            borderRadius: "12px", 
            marginBottom: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h3 style={{ fontSize: "20px", margin: "0 0 20px", fontWeight: 600, color: "#1e293b" }}>
              Tổng quan về chuyến đi
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              <div style={{ 
                padding: "16px", 
                background: "#f8fafc", 
                borderRadius: "8px",
                border: "1px solid #e5e7eb"
              }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🕐</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                  Thời lượng
                </div>
                <div style={{ fontSize: "16px", color: "#64748b" }}>
                  {tour.duration || "5 ngày"}
                </div>
              </div>
              <div style={{ 
                padding: "16px", 
                background: "#f8fafc", 
                borderRadius: "8px",
                border: "1px solid #e5e7eb"
              }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>👥</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                  Quy mô nhóm
                </div>
                <div style={{ fontSize: "16px", color: "#64748b" }}>
                  Tối đa {tour?.max_people || tour?.maxPeople || "không giới hạn"} người
                </div>
              </div>
              <div style={{ 
                padding: "16px", 
                background: "#f8fafc", 
                borderRadius: "8px",
                border: "1px solid #e5e7eb"
              }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🌐</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                  Ngôn ngữ
                </div>
                <div style={{ fontSize: "16px", color: "#64748b" }}>
                  Tiếng Việt
                </div>
              </div>
            </div>
            
            {/* Description */}
            <p style={{ 
              fontSize: "16px", 
              margin: "20px 0 0", 
              color: "#64748b", 
              lineHeight: "1.6" 
            }}>
              {(() => {
                const desc = tour.description?.split('\n')[0] || "Trải nghiệm vẻ đẹp hùng vĩ của Di sản Thiên nhiên Thế giới UNESCO cùng chuyến du thuyền đẳng cấp. Khám phá các hang động kỳ vĩ, chèo thuyền kayak trên vịnh, thưởng thức hải sản tươi ngon và ngắm hoàng hôn tuyệt đẹp.";
                return desc
                  .replace(/Ngày\s*0[:\s]+/gi, '')
                  .replace(/\b0\s*$/gm, '') // Remove standalone "0" at end of lines
                  .replace(/^\s*0\s*$/gm, '') // Remove lines with just "0"
                  .replace(/\s+0\s+/g, ' ') // Remove standalone "0" between words
                  .trim();
              })()}
            </p>
          </div>
        </div>

      {/* Main Content Section */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        <div style={{ display: "flex", gap: "40px" }}>
          {/* Main Content */}
          <div style={{ flex: 2 }}>
            {/* Tabs */}
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e5e7eb" }}>
                {[
                  { id: "overview", label: "Tổng quan", icon: "📋" },
                  { id: "itinerary", label: "Lịch trình", icon: "🗓️" },
                  { id: "included", label: "Bao gồm", icon: "✅" },
                  { id: "reviews", label: "Đánh giá", icon: "⭐" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "12px 20px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: 500,
                      color: activeTab === tab.id ? "#0E7490" : "#64748b",
                      borderBottom: activeTab === tab.id ? "2px solid #0E7490" : "2px solid transparent",
                      transition: "all 0.2s",
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div style={{ background: "#fff", borderRadius: "12px", padding: "32px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              {activeTab === "overview" && (() => {
                // Extract overview description (remove itinerary days from description)
                const getOverviewDescription = (description) => {
                  if (!description) return "Tour này sẽ mang đến cho bạn những trải nghiệm tuyệt vời...";
                  
                  // Remove "Ngày 0" and any standalone "0" from description
                  let cleaned = description
                    .replace(/Ngày\s*0[:\s]+/gi, '')
                    .replace(/\b0\s*$/gm, '') // Remove standalone "0" at end of lines
                    .replace(/^\s*0\s*$/gm, '') // Remove lines with just "0"
                    .replace(/\s+0\s+/g, ' ') // Remove standalone "0" between words
                    .trim();
                  
                  // Find where itinerary starts (first "Ngày X:" where X > 0) and cut it off
                  const firstDayMatch = cleaned.match(/Ngày\s*[1-9]\d*:/);
                  if (firstDayMatch && firstDayMatch.index > 0) {
                    return cleaned.substring(0, firstDayMatch.index).trim();
                  }
                  
                  // If no itinerary found, return cleaned description
                  return cleaned;
                };

                const overviewText = getOverviewDescription(tour.description);

                return (
                  <div>
                    <h3 style={{ fontSize: "24px", margin: "0 0 20px", color: "#1e293b" }}>
                      Tổng quan về chuyến đi
                    </h3>
                    <p style={{ fontSize: "16px", lineHeight: "1.6", color: "#64748b", marginBottom: "24px", whiteSpace: "pre-wrap" }}>
                      {overviewText}
                    </p>

                    {/* Highlights */}
                    {tour.highlights && (
                      <div style={{ marginBottom: "24px" }}>
                        <h4 style={{ fontSize: "18px", margin: "0 0 12px", color: "#1e293b" }}>Điểm nổi bật</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                          {tour.highlights.split('\n').filter(h => h.trim()).map((highlight, index) => (
                            <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ color: "#10b981" }}>✓</span>
                              <span style={{ fontSize: "14px", color: "#64748b" }}>{highlight.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Google Map */}
                    <div style={{ marginBottom: "24px" }}>
                      <h4 style={{ fontSize: "18px", margin: "0 0 12px", color: "#1e293b" }}>📍 Vị trí</h4>
                      <TourMap
                        latitude={tour.latitude}
                        longitude={tour.longitude}
                        destination={tour.destination}
                        tourName={tour.name}
                      />
                    </div>
                  </div>
                );
              })()}

              {activeTab === "itinerary" && (() => {
                // Parse itinerary from JSON or description
                const getItineraryDays = () => {
                  // First try to parse from itinerary field (JSON)
                  if (tour.itinerary) {
                    try {
                      const parsed = JSON.parse(tour.itinerary);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        // Sort by day number and map to display format, filter out invalid days (0 or negative)
                        return parsed
                          .filter(item => item.day && item.day > 0)
                          .sort((a, b) => (a.day || 0) - (b.day || 0))
                          .map(item => ({
                            day: `Ngày ${item.day}`,
                            title: item.title || "",
                            description: item.description || ""
                          }));
                      }
                    } catch (e) {
                      // If not JSON, continue to parse from description
                    }
                  }
                  
                  // Fallback: Parse from description
                  if (tour.description) {
                    // Remove "Ngày 0" and standalone "0" from description first
                    let cleanedDescription = tour.description
                      .replace(/Ngày\s*0[:\s]+/gi, '')
                      .replace(/\b0\s*$/gm, '') // Remove standalone "0" at end of lines
                      .replace(/^\s*0\s*$/gm, '') // Remove lines with just "0"
                      .replace(/\s+0\s+/g, ' ') // Remove standalone "0" between words
                      .trim();
                    
                    // Improved regex to match all days including Ngày 1 (but not Ngày 0)
                    const dayRegex = /Ngày\s*(\d+)[:\s]+([\s\S]*?)(?=Ngày\s*\d+[:\s]|$)/g;
                    const days = [];
                    let match;
                    const dayMap = new Map();
                    
                    // Reset regex lastIndex
                    dayRegex.lastIndex = 0;
                    
                    while ((match = dayRegex.exec(cleanedDescription)) !== null) {
                      const dayNumber = parseInt(match[1]);
                      const dayContent = match[2].trim();
                      
                      // Only process if dayNumber is valid (> 0) and has content
                      if (dayNumber > 0 && dayContent) {
                        // Extract title (first sentence or first 50 chars) and full description
                        const sentences = dayContent.split(/[.!?。！？]/).filter(s => s.trim());
                        const title = sentences[0]?.trim() || dayContent.substring(0, 50);
                        const dayDescription = dayContent;
                        
                        dayMap.set(dayNumber, {
                          day: dayNumber,
                          dayLabel: `Ngày ${dayNumber}`,
                          title: title.length > 80 ? title.substring(0, 80) + "..." : title,
                          description: dayDescription
                        });
                      }
                    }
                    
                    if (dayMap.size > 0) {
                      // Sort by day number and return
                      return Array.from(dayMap.values())
                        .sort((a, b) => a.day - b.day)
                        .map(item => ({
                          day: item.dayLabel,
                          title: item.title,
                          description: item.description
                        }));
                    }
                  }
                  
                  // Default fallback - return empty array if no itinerary found
                  return [];
                };

                const itineraryDays = getItineraryDays();

                return (
                  <div>
                    <h3 style={{ fontSize: "24px", margin: "0 0 20px", color: "#1e293b" }}>
                      Lịch trình chi tiết
                    </h3>
                    {itineraryDays.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {itineraryDays.map((item, index) => {
                          const isExpanded = expandedDays.has(index);
                          return (
                            <div 
                              key={index} 
                              style={{ 
                                border: "1px solid #e5e7eb", 
                                borderRadius: "8px",
                                overflow: "hidden",
                                background: "#fff",
                                transition: "all 0.3s ease-in-out",
                                marginBottom: "8px"
                              }}
                            >
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedDays);
                                  if (isExpanded) {
                                    newExpanded.delete(index);
                                  } else {
                                    newExpanded.add(index);
                                  }
                                  setExpandedDays(newExpanded);
                                }}
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "16px 20px",
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  transition: "background 0.2s ease-in-out"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#f8fafc";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <div style={{ display: "flex", gap: "16px", alignItems: "center", flex: 1 }}>
                                  <div style={{ minWidth: "100px", fontWeight: 600, color: "#0E7490", fontSize: "16px" }}>
                                    {item.day}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    {item.title && (
                                      <h4 style={{ margin: 0, fontSize: "16px", color: "#1e293b", fontWeight: 600 }}>
                                        {item.title}
                                      </h4>
                                    )}
                                  </div>
                                </div>
                                <div style={{ 
                                  fontSize: "20px", 
                                  color: "#64748b",
                                  transition: "transform 0.3s ease-in-out, color 0.2s ease-in-out",
                                  transform: isExpanded ? "rotate(0deg)" : "rotate(0deg)"
                                }}>
                                  {isExpanded ? "−" : "+"}
                                </div>
                              </button>
                              <div
                                style={{
                                  maxHeight: isExpanded ? "1000px" : "0",
                                  overflow: "hidden",
                                  transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out, border-top 0.3s ease-in-out",
                                  opacity: isExpanded ? 1 : 0,
                                  padding: isExpanded ? "0 20px 16px 20px" : "0 20px",
                                  borderTop: isExpanded ? "1px solid #e5e7eb" : "1px solid transparent"
                                }}
                              >
                                <div style={{ 
                                  paddingLeft: "116px", 
                                  paddingTop: "12px",
                                  transition: "opacity 0.3s ease-in-out 0.1s",
                                  opacity: isExpanded ? 1 : 0
                                }}>
                                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: "16px", color: "#64748b" }}>Chưa có thông tin lịch trình chi tiết.</p>
                    )}
                  </div>
                );
              })()}

              {activeTab === "included" && (
                <div>
                  <h3 style={{ fontSize: "24px", margin: "0 0 20px", color: "#1e293b" }}>
                    Chi tiết giá tour
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                    <div>
                      <h4 style={{ fontSize: "18px", margin: "0 0 12px", color: "#1e293b", fontWeight: 600 }}>Bao gồm</h4>
                      {tour?.includes ? (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {tour.includes.split('\n').filter(item => item.trim()).map((item, index) => (
                            <li key={index} style={{ padding: "8px 0", fontSize: "14px", color: "#64748b", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <span style={{ color: "#10b981", fontSize: "16px" }}>•</span>
                              <span style={{ flex: 1 }}>{item.trim()}</span>
                          </li>
                        ))}
                      </ul>
                      ) : (
                        <p style={{ color: "#64748b", fontStyle: "italic" }}>Chưa có thông tin dịch vụ bao gồm.</p>
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "18px", margin: "0 0 12px", color: "#1e293b", fontWeight: 600 }}>Không bao gồm</h4>
                      {tour?.excludes ? (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {tour.excludes.split('\n').filter(item => item.trim()).map((item, index) => (
                            <li key={index} style={{ padding: "8px 0", fontSize: "14px", color: "#64748b", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <span style={{ color: "#ef4444", fontSize: "16px" }}>•</span>
                              <span style={{ flex: 1 }}>{item.trim()}</span>
                          </li>
                        ))}
                      </ul>
                      ) : (
                        <p style={{ color: "#64748b", fontStyle: "italic" }}>Chưa có thông tin dịch vụ không bao gồm.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "24px", margin: 0, color: "#1e293b" }}>
                      Đánh giá từ khách hàng
                    </h3>
                    {user && (
                      <button
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        style={{
                          background: "#0E7490",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 20px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        Viết đánh giá
                      </button>
                    )}
                  </div>

                  {/* Review Form */}
                  {showReviewForm && (
                    <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "8px", marginBottom: "24px" }}>
                      <h4 style={{ margin: "0 0 16px", fontSize: "16px", color: "#1e293b" }}>Viết đánh giá của bạn</h4>
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                          Đánh giá:
                        </label>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewRating(star)}
                              style={{
                                background: "none",
                                border: "none",
                                fontSize: "24px",
                                cursor: "pointer",
                                color: star <= reviewRating ? "#fbbf24" : "#d1d5db",
                              }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                          Nhận xét:
                        </label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Chia sẻ trải nghiệm của bạn..."
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            resize: "vertical",
                            minHeight: "100px",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={submitReview}
                          style={{
                            background: "#0E7490",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 20px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        >
                          Gửi đánh giá
                        </button>
                        <button
                          onClick={() => setShowReviewForm(false)}
                          style={{
                            background: "#f3f4f6",
                            color: "#374151",
                            border: "none",
                            borderRadius: "8px",
                            padding: "10px 20px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  {reviews.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
                      <p>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá tour này!</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {reviews.map((review) => (
                        <div key={review.id} style={{ padding: "20px", background: "#f8fafc", borderRadius: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <div>
                              <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                                {review.user?.name || "Khách hàng"}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {renderStars(review.rating)}
                                <span style={{ fontSize: "14px", color: "#64748b" }}>
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
                            {review.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div style={{ width: "350px" }}>
            {/* Booking Card */}
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
                position: "sticky",
                top: "20px",
              }}
            >
              {/* Price Display */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
                  Giá từ
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "32px", fontWeight: 700, color: "#f97316" }}>
                    {Number(tour.price).toLocaleString()}₫
                  </span>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>
                    /khách
                  </span>
                </div>
              </div>

              {/* Departure Date - Will be rendered below based on available dates */}

              {/* Number of Guests */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ 
                  display: "block",
                  fontSize: "14px", 
                  fontWeight: 500, 
                  color: "#374151",
                  marginBottom: "16px"
                }}>
                  Số lượng khách
                </label>

                {/* Adults Selection */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontWeight: 500, color: "#374151", fontSize: "14px" }}>
                      Người lớn
                    </label>
                    <span style={{ fontSize: "14px", color: "#64748b" }}>
                      {Number(tour.price).toLocaleString()}₫
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (adults > 0) {
                          const newAdults = adults - 1;
                          setAdults(newAdults);
                          setPeople(newAdults + children);
                        }
                      }}
                      disabled={adults === 0}
                      style={{
                        width: "36px",
                        height: "36px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        background: adults === 0 ? "#f3f4f6" : "#fff",
                        color: adults === 0 ? "#9ca3af" : "#374151",
                        cursor: adults === 0 ? "not-allowed" : "pointer",
                        fontSize: "18px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (adults > 0) {
                          e.target.style.borderColor = "#f97316";
                          e.target.style.color = "#f97316";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (adults > 0) {
                          e.target.style.borderColor = "#d1d5db";
                          e.target.style.color = "#374151";
                        }
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={tour?.max_people || tour?.maxPeople || 100}
                      value={adults}
                      onChange={(e) => {
                        const maxPeople = tour?.max_people || tour?.maxPeople || 100;
                        const value = Math.max(0, Math.min(maxPeople, Number(e.target.value) || 0));
                        const totalPeople = value + children;
                        if (totalPeople <= maxPeople) {
                          setAdults(value);
                          setPeople(totalPeople);
                        } else {
                          // If total exceeds max, set adults to max minus children
                          const maxAdults = Math.max(0, maxPeople - children);
                          setAdults(maxAdults);
                          setPeople(maxPeople);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "16px",
                        textAlign: "center",
                        background: "#fff",
                        outline: "none",
                        fontWeight: 500,
                        transition: "border-color 0.2s"
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#f97316";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const maxPeople = tour?.max_people || tour?.maxPeople || 100;
                        const totalPeople = adults + children;
                        if (totalPeople < maxPeople) {
                          const newAdults = adults + 1;
                          if (newAdults + children <= maxPeople) {
                            setAdults(newAdults);
                            setPeople(newAdults + children);
                          }
                        }
                      }}
                      disabled={adults + children >= (tour?.max_people || tour?.maxPeople || 100)}
                      style={{
                        width: "36px",
                        height: "36px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
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
                        e.target.style.borderColor = "#f97316";
                        e.target.style.color = "#f97316";
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

                {/* Children Selection */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontWeight: 500, color: "#374151", fontSize: "14px" }}>
                      Trẻ em (5-11t)
                    </label>
                    <span style={{ fontSize: "14px", color: "#64748b" }}>
                      {Number(childrenPrice).toLocaleString()}₫
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (children > 0) {
                          setChildren(children - 1);
                          setPeople(adults + (children - 1));
                        }
                      }}
                      disabled={children === 0}
                      style={{
                        width: "36px",
                        height: "36px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        background: children === 0 ? "#f3f4f6" : "#fff",
                        color: children === 0 ? "#9ca3af" : "#374151",
                        cursor: children === 0 ? "not-allowed" : "pointer",
                        fontSize: "18px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (children > 0) {
                          e.target.style.borderColor = "#f97316";
                          e.target.style.color = "#f97316";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (children > 0) {
                          e.target.style.borderColor = "#d1d5db";
                          e.target.style.color = "#374151";
                        }
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={tour?.max_people || tour?.maxPeople || 100}
                      value={children}
                      onChange={(e) => {
                        const maxPeople = tour?.max_people || tour?.maxPeople || 100;
                        const value = Math.max(0, Math.min(maxPeople, Number(e.target.value) || 0));
                        const totalPeople = adults + value;
                        if (totalPeople <= maxPeople) {
                          setChildren(value);
                          setPeople(totalPeople);
                        } else {
                          // If total exceeds max, set children to max minus adults
                          const maxChildren = Math.max(0, maxPeople - adults);
                          setChildren(maxChildren);
                          setPeople(maxPeople);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: "10px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "16px",
                        textAlign: "center",
                        background: "#fff",
                        outline: "none",
                        fontWeight: 500,
                        transition: "border-color 0.2s"
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#f97316";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#d1d5db";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const maxPeople = tour?.max_people || tour?.maxPeople || 100;
                        const totalPeople = adults + children;
                        if (totalPeople < maxPeople) {
                          const newChildren = children + 1;
                          if (adults + newChildren <= maxPeople) {
                            setChildren(newChildren);
                            setPeople(adults + newChildren);
                          }
                        }
                      }}
                      disabled={adults + children >= (tour?.max_people || tour?.maxPeople || 100)}
                      style={{
                        width: "36px",
                        height: "36px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        background: adults + children >= (tour?.max_people || tour?.maxPeople || 100) ? "#f3f4f6" : "#fff",
                        color: adults + children >= (tour?.max_people || tour?.maxPeople || 100) ? "#9ca3af" : "#374151",
                        cursor: adults + children >= (tour?.max_people || tour?.maxPeople || 100) ? "not-allowed" : "pointer",
                        fontSize: "18px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (adults + children < (tour?.max_people || tour?.maxPeople || 100)) {
                          e.target.style.borderColor = "#f97316";
                          e.target.style.color = "#f97316";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (adults + children < (tour?.max_people || tour?.maxPeople || 100)) {
                          e.target.style.borderColor = "#d1d5db";
                          e.target.style.color = "#374151";
                        }
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Departure Date */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ 
                  display: "block",
                  fontSize: "14px", 
                  fontWeight: 500, 
                  color: "#374151",
                  marginBottom: "8px"
                }}>
                  Ngày khởi hành
                </label>
                {(() => {
                  let availableDates = [];
                  console.log('Rendering date picker, tour.available_dates:', tour?.available_dates);
                  
                  if (tour?.available_dates) {
                    try {
                      availableDates = JSON.parse(tour.available_dates);
                      if (!Array.isArray(availableDates)) availableDates = [];
                      console.log('Sidebar - Parsed available dates:', availableDates);
                    } catch (e) {
                      console.error('Sidebar - Error parsing available_dates:', e);
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
                  
                  console.log('Sidebar - Available dates length (after filter):', availableDates.length);
                  
                  if (availableDates.length > 0) {
                    console.log('Showing dropdown with dates:', availableDates);
                    // Show dropdown if admin has selected dates
                    return (
                      <div style={{ position: "relative" }}>
                        <span style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "18px",
                          color: "#64748b",
                          zIndex: 1,
                          pointerEvents: "none"
                        }}>
                          📅
                        </span>
                        <select
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          required
                          style={{
                            width: "100%",
                            padding: "12px 40px 12px 40px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            background: "#fff",
                            outline: "none",
                            boxSizing: "border-box",
                            appearance: "none",
                            WebkitAppearance: "none",
                            MozAppearance: "none",
                            transition: "border-color 0.2s"
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#f97316";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d1d5db";
                          }}
                        >
                          <option value="">-- Chọn ngày khởi hành --</option>
                          {availableDates.map((d, idx) => (
                            <option key={idx} value={d}>
                              {new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </option>
                          ))}
                        </select>
                        <span style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "18px",
                          color: "#64748b",
                          pointerEvents: "none"
                        }}>
                          📅
                        </span>
                      </div>
                    );
                  } else if (availableDates.length === 0 && tour?.available_dates) {
                    // Không có ngày hợp lệ - hiển thị thông báo
                    return (
                      <div style={{
                        padding: "12px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        color: "#dc2626",
                        fontSize: "14px",
                        textAlign: "center"
                      }}>
                        ⚠️ Chưa có ngày khởi hành
                      </div>
                    );
                  } else if (tour?.departure_date) {
                    // Fallback: show disabled input for backward compatibility
                    return (
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        disabled
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                          background: "#f1f5f9",
                          outline: "none",
                        }}
                      />
                    );
                  } else {
                    // No dates set, allow free selection
                    return (
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                    );
                  }
                })()}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                  Phương thức thanh toán:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#fff",
                    outline: "none",
                  }}
                >
                  <option value="cash">💰 Tiền mặt</option>
                  <option value="vnpay">🏦 VNPay</option>
                  <option value="momo">💜 MoMo</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                  Ghi chú (tùy chọn):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú của bạn (ví dụ: yêu cầu đặc biệt, dị ứng thức ăn, v.v.)"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "vertical",
                    outline: "none",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              {/* Promotion Code */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                  Mã khuyến mãi (tùy chọn):
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Nhập mã khuyến mãi..."
                    value={promotionCode}
                    onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      padding: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={checkPromotion}
                    disabled={checkingPromotion || !promotionCode.trim()}
                    style={{
                      background: checkingPromotion ? "#9ca3af" : "#0E7490",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      cursor: checkingPromotion ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {checkingPromotion ? "⏳" : "✓"}
                  </button>
                </div>
                {promotion && (
                  <div style={{ marginTop: "12px", padding: "12px", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #0ea5e9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ color: "#166534", fontWeight: 600 }}>✅ Mã hợp lệ</span>
                    </div>
                    <div style={{ color: "#166534" }}>
                      <div>🎁 {promotion.promotion.title}</div>
                      <div>💰 Giảm: {Number(promotion.discountAmount).toLocaleString()} ₫</div>
                      <div>💵 Còn lại: {Number(promotion.finalAmount).toLocaleString()} ₫</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Guest Form (chỉ hiển thị khi chưa đăng nhập) */}
              {!user && showGuestForm && (
                <div style={{ 
                  marginBottom: "20px", 
                  padding: "20px", 
                  background: "#f8fafc", 
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0"
                }}>
                  <h4 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                    Thông tin liên hệ
                  </h4>
                  <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#64748b" }}>
                    WeTour sẽ liên hệ tư vấn cho bạn ngay khi nhận được yêu cầu. Vui lòng cung cấp các thông tin dưới đây.
                  </p>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#374151" }}>
                      Họ và Tên <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Nhập họ và tên"
                      required
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#374151" }}>
                      Số điện thoại <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="Nhập số điện thoại"
                      required
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#374151" }}>
                      Email <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Nhập email để nhận thông báo"
                      required
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Hotel Rooms Display - Show when hotel is selected */}
              {selectedHotel && (
                <div style={{ marginBottom: "20px", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", margin: 0 }}>
                      🏨 Phòng khách sạn: {selectedHotel.name}
                    </h4>
                    <button
                      onClick={async () => {
                        if (!selectedHotel?.id) return;
                        setLoadingRooms(true);
                        try {
                          // Request tất cả phòng (cả available và unavailable) để hiển thị trạng thái đầy đủ
                          const response = await api.get(`/hotels/${selectedHotel.id}?include_all_rooms=true`);
                          if (response.data && response.data.Rooms) {
                            setHotelRooms(response.data.Rooms || []);
                          } else {
                            setHotelRooms([]);
                          }
                        } catch (error) {
                          console.error("Error fetching hotel rooms:", error);
                        } finally {
                          setLoadingRooms(false);
                        }
                      }}
                      disabled={loadingRooms}
                      style={{
                        background: loadingRooms ? "#e5e7eb" : "#fff",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        cursor: loadingRooms ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        color: loadingRooms ? "#9ca3af" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (!loadingRooms) {
                          e.target.style.background = "#f3f4f6";
                          e.target.style.borderColor = "#9ca3af";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loadingRooms) {
                          e.target.style.background = "#fff";
                          e.target.style.borderColor = "#d1d5db";
                        }
                      }}
                      title="Làm mới danh sách phòng"
                    >
                      {loadingRooms ? "⏳" : "🔄"}
                    </button>
                  </div>
                  {loadingRooms && hotelRooms.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "12px", color: "#64748b" }}>Đang tải thông tin phòng...</div>
                  ) : hotelRooms.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {/* Sắp xếp: phòng available trước, unavailable sau */}
                      {[...hotelRooms].sort((a, b) => {
                        if (a.status === "available" && b.status !== "available") return -1;
                        if (a.status !== "available" && b.status === "available") return 1;
                        return 0;
                      }).map((room) => (
                        <div
                          key={room.id}
                          style={{
                            padding: "12px",
                            background: room.status === "available" ? "#fff" : "#f9fafb",
                            borderRadius: "6px",
                            border: room.status === "available" ? "1px solid #e5e7eb" : "1px solid #e5e7eb",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "8px",
                            opacity: room.status === "available" ? 1 : 0.75
                          }}
                        >
                          <div style={{ flex: 1, minWidth: "200px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                              <span style={{ 
                                fontSize: "14px", 
                                fontWeight: 600, 
                                color: room.status === "available" ? "#1e293b" : "#64748b"
                              }}>
                                {room.name}
                              </span>
                              {/* Quantity Badge - Chỉ hiển thị số phòng còn lại */}
                              {room.quantity !== undefined && room.quantity !== null && (
                                <span style={{
                                  background: room.quantity > 3 ? "#dbeafe" : room.quantity > 0 ? "#fef3c7" : "#fee2e2",
                                  color: room.quantity > 3 ? "#1e40af" : room.quantity > 0 ? "#92400e" : "#991b1b",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 600
                                }}>
                                  {room.quantity > 0 ? `Còn ${room.quantity} phòng` : "Hết phòng"}
                                </span>
                              )}
                            </div>
                            {room.description && (
                              <div style={{ 
                                fontSize: "12px", 
                                color: room.status === "available" ? "#64748b" : "#94a3b8", 
                                marginTop: "4px" 
                              }}>
                                {room.description.length > 60 ? `${room.description.substring(0, 60)}...` : room.description}
                              </div>
                            )}
                            <div style={{ 
                              fontSize: "12px", 
                              color: room.status === "available" ? "#64748b" : "#94a3b8", 
                              marginTop: "4px" 
                            }}>
                              {room.max_guests} khách • {room.bed_type || "1 giường"}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ 
                              fontSize: "16px", 
                              fontWeight: 700, 
                              color: room.status === "available" ? "#0E7490" : "#94a3b8"
                            }}>
                              {Number(room.price_per_night || 0).toLocaleString()}₫
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>/đêm</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "12px", color: "#64748b", fontSize: "13px" }}>
                      Khách sạn này hiện chưa có phòng nào
                    </div>
                  )}
                </div>
              )}

              {/* Price Breakdown */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px", marginBottom: "20px" }}>
                {/* Tour Price Summary */}
                {adults > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#64748b" }}>
                    <span>Người lớn (x{adults})</span>
                    <span>{Number(tour.price * adults).toLocaleString()}₫</span>
                  </div>
                )}
                {children > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "#64748b" }}>
                    <span>Trẻ em (x{children})</span>
                    <span>{Number(childrenPrice * children).toLocaleString()}₫</span>
                  </div>
                )}


                {/* Discount */}
                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", padding: "12px", background: "#dcfce7", borderRadius: "8px" }}>
                    <span style={{ color: "#16a34a" }}>Giảm giá:</span>
                    <span style={{ fontWeight: 600, color: "#16a34a" }}>-{Number(discountAmount).toLocaleString()} ₫</span>
                  </div>
                )}

                {/* Total */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: 700, color: "#1e293b", marginTop: "12px", paddingTop: "12px", borderTop: "2px solid #e5e7eb" }}>
                  <span>Tổng cộng</span>
                  <span style={{ color: "#0E7490" }}>{Number(totalPrice).toLocaleString()}₫</span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={submitting || !date || totalPeople < 1 || !hasValidDates || (!user && showGuestForm && (!guestName || !guestPhone || !guestEmail))}
                style={{
                  width: "100%",
                  background: (submitting || !date || totalPeople < 1 || !hasValidDates || (!user && showGuestForm && (!guestName || !guestPhone || !guestEmail))) ? "#9ca3af" : "#f97316",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "14px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: (submitting || !date || totalPeople < 1 || !hasValidDates || (!user && showGuestForm && (!guestName || !guestPhone || !guestEmail))) ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  marginBottom: "12px",
                }}
                onMouseEnter={(e) => {
                  if (!submitting && !(submitting || !date || totalPeople < 1 || !hasValidDates || (!user && showGuestForm && (!guestName || !guestPhone || !guestEmail)))) {
                    e.target.style.background = "#ea580c";
                    e.target.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.target.style.background = (submitting || !date || totalPeople < 1 || !hasValidDates || (!user && showGuestForm && (!guestName || !guestPhone || !guestEmail))) ? "#9ca3af" : "#f97316";
                    e.target.style.transform = "translateY(0)";
                  }
                }}
              >
                {!hasValidDates 
                  ? "⚠️ Chưa có ngày khởi hành"
                  : submitting 
                    ? "Đang xử lý..." 
                    : !user && !showGuestForm
                    ? "Gửi yêu cầu"
                    : "Đặt Tour Ngay"}
              </button>

            </div>

          </div>
        </div>

        {/* Related Tours */}
        {relatedTours.length > 0 && (
          <div style={{ marginTop: "60px" }}>
            <h2 style={{ fontSize: "28px", margin: "0 0 24px", color: "#1e293b", textAlign: "center" }}>
              🎯 Tour liên quan
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {relatedTours.map((relatedTour) => (
                <div
                  key={relatedTour.id}
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
                  onClick={() => navigate(`/tour/${relatedTour.id}`)}
                >
                  <img
                    src={relatedTour.image || "https://via.placeholder.com/400x250?text=Tour+Image"}
                    alt={relatedTour.name}
                    style={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400x250?text=Tour+Image";
                    }}
                  />
                  <div style={{ padding: "16px" }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                      {relatedTour.name}
                    </h3>
                    <p style={{ margin: "0 0 8px", color: "#64748b", fontSize: "14px" }}>
                      📍 {relatedTour.destination}
                    </p>
                    <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: "14px" }}>
                      ⏱️ {relatedTour.duration}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "18px", fontWeight: 700, color: "#0ea5e9" }}>
                        {Number(relatedTour.price).toLocaleString()} ₫
                      </span>
                      <span style={{ fontSize: "12px", color: "#0E7490", fontWeight: 500 }}>
                        Xem chi tiết →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowImageModal(false)}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img
              src={images[currentImageIndex]}
              alt={tour.name}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
            <button
              onClick={() => setShowImageModal(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                cursor: "pointer",
                fontSize: "20px",
              }}
            >
              ✕
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1);
                  }}
                  style={{
                    position: "absolute",
                    left: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                >
                  ←
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0);
                  }}
                  style={{
                    position: "absolute",
                    right: "20px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                >
                  →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

