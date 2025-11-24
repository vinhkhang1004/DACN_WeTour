import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { Helmet } from "react-helmet-async";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import TourMap from "../components/TourMap";

export default function TourDetailEnhanced() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [people, setPeople] = useState(1);
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
    }
    
    const savedComparison = localStorage.getItem("comparisonTours");
    if (savedComparison) {
      setComparisonTours(JSON.parse(savedComparison));
    }
  }, [user]);

  const checkPromotion = async () => {
    if (!promotionCode.trim()) {
      setPromotion(null);
      return;
    }

    setCheckingPromotion(true);
    try {
      const response = await api.get(`/promotions/code/${promotionCode}?totalAmount=${totalPrice}`);
      setPromotion(response.data);
    } catch (error) {
      setPromotion(null);
      // Don't show alert for 401 - token issue
      if (error.response?.status !== 401) {
        alert(error.response?.data?.message || "Mã khuyến mãi không hợp lệ");
      }
    } finally {
      setCheckingPromotion(false);
    }
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
    } else {
      const newWishlist = [...wishlist, tour];
      setWishlist(newWishlist);
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(newWishlist));
    }
  };

  const toggleComparison = () => {
    const isInComparison = comparisonTours.some((item) => item.id === tour.id);
    if (isInComparison) {
      setComparisonTours(comparisonTours.filter((item) => item.id !== tour.id));
    } else if (comparisonTours.length < 3) {
      setComparisonTours([...comparisonTours, tour]);
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

    if (people < 1) {
      alert("Số người phải lớn hơn 0");
      return;
    }

    setSubmitting(true);
    let bookingId = null;
    try {
      
      const bookingData = {
        tour_id: parseInt(id),
        people_count: parseInt(people),
        booking_date: date,
        payment_method: paymentMethod === "cash" ? null : paymentMethod,
        notes: notes || null,
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
        if (user) {
          alert("🎉 Đặt tour thành công! Bạn sẽ thanh toán khi nhận tour.");
          navigate("/my-bookings");
        } else {
          alert("🎉 Đặt tour thành công! Chúng tôi sẽ liên hệ với bạn qua email để xác nhận.");
          // Reset form
          setShowGuestForm(false);
          setGuestName("");
          setGuestPhone("");
          setGuestEmail("");
          setDate("");
          setPeople(1);
          setNotes("");
        }
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
        // User can still view their booking
        if (bookingId) {
          setTimeout(() => {
            navigate("/my-bookings");
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

  const originalPrice = tour ? tour.price * people : 0;
  const totalPrice = promotion && promotion.finalAmount ? promotion.finalAmount : originalPrice;
  const discountAmount = promotion ? promotion.discountAmount : 0;

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
      {/* Image Gallery Section */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        <div style={{ position: "relative", marginBottom: "20px" }}>
          {/* Main Image */}
          <div 
            style={{ 
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#e5e7eb",
              cursor: "pointer"
            }}
            onClick={() => setShowImageModal(true)}
          >
            <img
              src={images[currentImageIndex]}
              alt={`${tour.name} - Image ${currentImageIndex + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.3s"
              }}
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/800x500?text=Tour+Image";
              }}
              onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
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
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "24px",
                    transition: "background 0.3s"
                  }}
                  onMouseEnter={(e) => e.target.style.background = "rgba(0,0,0,0.7)"}
                  onMouseLeave={(e) => e.target.style.background = "rgba(0,0,0,0.5)"}
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
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
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "24px",
                    transition: "background 0.3s"
                  }}
                  onMouseEnter={(e) => e.target.style.background = "rgba(0,0,0,0.7)"}
                  onMouseLeave={(e) => e.target.style.background = "rgba(0,0,0,0.5)"}
                >
                  ›
                </button>
              </>
            )}
            
            {/* Image Counter */}
            {images.length > 1 && (
              <div style={{
                position: "absolute",
                bottom: "20px",
                right: "20px",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "14px",
                fontWeight: 600
              }}>
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div style={{
              display: "flex",
              gap: "12px",
              marginTop: "12px",
              overflowX: "auto",
              paddingBottom: "8px",
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 transparent"
            }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  style={{
                    minWidth: "120px",
                    height: "90px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: currentImageIndex === idx ? "3px solid #3b82f6" : "3px solid transparent",
                    cursor: "pointer",
                    background: "transparent",
                    padding: 0,
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = "0.8"}
                  onMouseLeave={(e) => e.target.style.opacity = "1"}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/120x90?text=Image";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tour Info Below Gallery */}
        <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "32px", margin: "0 0 16px", fontWeight: 700, color: "#1f2937" }}>
            {tour.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b" }}>
              <span style={{ fontSize: "20px" }}>📍</span>
              <span>{tour.destination}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b" }}>
              <span style={{ fontSize: "20px" }}>⏱️</span>
              <span>{tour.duration}</span>
            </div>
            {tour.maxPeople && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b" }}>
                <span style={{ fontSize: "20px" }}>👥</span>
                <span>Tối đa {tour.maxPeople} người</span>
              </div>
            )}
          </div>
          
          {/* Rating */}
          {reviews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {renderStars(calculateAverageRating())}
              </div>
              <span style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937" }}>
                {calculateAverageRating().toFixed(1)}
              </span>
              <span style={{ color: "#64748b" }}>
                ({reviews.length} đánh giá)
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={toggleWishlist}
              style={{
                background: wishlist.some(item => item.id === tour.id) ? "#ef4444" : "#f3f4f6",
                color: wishlist.some(item => item.id === tour.id) ? "#fff" : "#374151",
                border: "none",
                borderRadius: "8px",
                padding: "12px 20px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = wishlist.some(item => item.id === tour.id) ? "#dc2626" : "#e5e7eb";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = wishlist.some(item => item.id === tour.id) ? "#ef4444" : "#f3f4f6";
              }}
            >
              {wishlist.some(item => item.id === tour.id) ? "❤️" : "🤍"} 
              {wishlist.some(item => item.id === tour.id) ? "Đã yêu thích" : "Yêu thích"}
            </button>
            
            <button
              onClick={toggleComparison}
              style={{
                background: comparisonTours.some(item => item.id === tour.id) ? "#0E7490" : "#f3f4f6",
                color: comparisonTours.some(item => item.id === tour.id) ? "#fff" : "#374151",
                border: "none",
                borderRadius: "8px",
                padding: "12px 20px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = comparisonTours.some(item => item.id === tour.id) ? "#0891b2" : "#e5e7eb";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = comparisonTours.some(item => item.id === tour.id) ? "#0E7490" : "#f3f4f6";
              }}
            >
              ⚖️ So sánh
            </button>
          </div>
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
                  
                  // Find where itinerary starts (first "Ngày X:") and cut it off
                  const firstDayMatch = description.match(/Ngày\s*\d+:/);
                  if (firstDayMatch && firstDayMatch.index > 0) {
                    return description.substring(0, firstDayMatch.index).trim();
                  }
                  
                  // If no itinerary found, return full description
                  return description;
                };

                const overviewText = getOverviewDescription(tour.description);

                return (
                  <div>
                    <h3 style={{ fontSize: "24px", margin: "0 0 20px", color: "#1e293b" }}>
                      Giới thiệu về {tour.destination || "địa điểm"}
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
                        // Sort by day number and map to display format
                        return parsed
                          .sort((a, b) => (a.day || 0) - (b.day || 0))
                          .map(item => ({
                            day: `Ngày ${item.day || 1}`,
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
                    // Improved regex to match all days including Ngày 1
                    const dayRegex = /Ngày\s*(\d+)[:\s]+([\s\S]*?)(?=Ngày\s*\d+[:\s]|$)/g;
                    const days = [];
                    let match;
                    const dayMap = new Map();
                    
                    // Reset regex lastIndex
                    dayRegex.lastIndex = 0;
                    
                    while ((match = dayRegex.exec(tour.description)) !== null) {
                      const dayNumber = parseInt(match[1]);
                      const dayContent = match[2].trim();
                      
                      if (dayContent) {
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
                  
                  // Default fallback
                  return [
                    { day: "Ngày 1", title: "Khởi hành", description: "Tập trung tại điểm hẹn, khởi hành đi điểm đến đầu tiên" },
                    { day: "Ngày 2", title: "Tham quan chính", description: "Tham quan các điểm du lịch nổi tiếng, chụp ảnh lưu niệm" },
                    { day: "Ngày 3", title: "Trải nghiệm địa phương", description: "Tham gia các hoạt động văn hóa, thưởng thức ẩm thực địa phương" },
                  ];
                };

                const itineraryDays = getItineraryDays();

                return (
                  <div>
                    <h3 style={{ fontSize: "24px", margin: "0 0 20px", color: "#1e293b" }}>
                      Lịch trình chi tiết
                    </h3>
                    {itineraryDays.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {itineraryDays.map((item, index) => (
                          <div key={index} style={{ display: "flex", gap: "16px", padding: "20px", background: "#f8fafc", borderRadius: "8px" }}>
                            <div style={{ minWidth: "80px", textAlign: "center" }}>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "#0E7490", marginBottom: "4px" }}>
                                {item.day}
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              {item.title && (
                                <h4 style={{ margin: "0 0 8px", fontSize: "16px", color: "#1e293b", fontWeight: 600 }}>
                                  {item.title}
                                </h4>
                              )}
                              <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
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
                    Dịch vụ bao gồm
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                    <div>
                      <h4 style={{ fontSize: "18px", margin: "0 0 12px", color: "#1e293b" }}>✅ Bao gồm</h4>
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
                      <h4 style={{ fontSize: "18px", margin: "0 0 12px", color: "#1e293b" }}>❌ Không bao gồm</h4>
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
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                marginBottom: "24px",
                position: "sticky",
                top: "20px",
              }}
            >
              <h3 style={{ fontSize: "20px", margin: "0 0 20px", color: "#1e293b" }}>
                Đặt tour
              </h3>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                  Số người:
                </label>
                <select
                  value={people}
                  onChange={(e) => setPeople(Number(e.target.value))}
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
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>{num} người</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                  Ngày khởi hành:
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
                      <select
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
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
                        <option value="">-- Chọn ngày khởi hành --</option>
                        {availableDates.map((d, idx) => (
                          <option key={idx} value={d}>
                            {new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </option>
                        ))}
                      </select>
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

              {/* Price Breakdown */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "16px" }}>
                  <span>Giá gốc ({people} người):</span>
                  <span>{Number(originalPrice).toLocaleString()} ₫</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "16px" }}>
                    <span style={{ color: "#16a34a" }}>Giảm giá:</span>
                    <span style={{ fontWeight: 600, color: "#16a34a" }}>-{Number(discountAmount).toLocaleString()} ₫</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "24px", fontWeight: 700, color: "#0ea5e9" }}>
                  <span>Tổng cộng:</span>
                  <span>{Number(totalPrice).toLocaleString()} ₫</span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={submitting || !date || people < 1 || !hasValidDates || (!user && showGuestForm && (!guestName || !guestPhone || !guestEmail))}
                style={{
                  width: "100%",
                  background: (submitting || !date || people < 1 || !hasValidDates || (!user && showGuestForm && (!guestName || !guestPhone || !guestEmail))) ? "#9ca3af" : "#0E7490",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "14px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: (submitting || !date || people < 1 || !hasValidDates || (!user && showGuestForm && (!guestName || !guestPhone || !guestEmail))) ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!submitting && !(submitting || !date || people < 1 || !hasValidDates || (!user && showGuestForm && (!guestName || !guestPhone || !guestEmail)))) {
                    e.target.style.background = "#0891b2";
                    e.target.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.target.style.background = (submitting || !date || people < 1 || !hasValidDates || (!user && showGuestForm && (!guestName || !guestPhone || !guestEmail))) ? "#9ca3af" : "#0E7490";
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
                    : "Đặt tour ngay"}
              </button>
            </div>

            {/* Contact Info */}
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <h3 style={{ fontSize: "18px", margin: "0 0 16px", color: "#1e293b" }}>
                📞 Liên hệ hỗ trợ
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>📞</span>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>1900 1234</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>📧</span>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>support@travel.com</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>💬</span>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>Chat trực tuyến 24/7</span>
                </div>
              </div>
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

