import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function TourDetail() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [people, setPeople] = useState(1);
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
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
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tourRes = await api.get(`/tours/${id}`);
        setTour(tourRes.data);
        
        const reviewsRes = await api.get(`/reviews/tour/${id}`);
        setReviews(reviewsRes.data || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
      alert(error.response?.data?.message || "Mã khuyến mãi không hợp lệ");
    } finally {
      setCheckingPromotion(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      alert("Bạn cần đăng nhập trước khi đặt tour!");
      navigate("/login");
      return;
    }

    if (!date) {
      alert("Vui lòng chọn ngày khởi hành");
      return;
    }

    if (people < 1) {
      alert("Số người phải lớn hơn 0");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const bookingData = {
        tour_id: id,
        people_count: people,
        booking_date: date,
        payment_method: paymentMethod,
      };

      if (promotion && promotion.promotion) {
        bookingData.promotion_code = promotion.promotion.code;
      }

      const response = await api.post(
        "/bookings",
        bookingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("🎉 Đặt tour thành công! Vui lòng kiểm tra email để xác nhận.");
      navigate("/my-bookings");
    } catch (e) {
      alert("Lỗi đặt tour: " + (e.response?.data?.message || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      alert("Bạn cần đăng nhập để đánh giá");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/reviews",
        { tour_id: id, rating: reviewRating, comment: reviewComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Cảm ơn bạn đã đánh giá!");
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
      
      // Refresh reviews
      const reviewsRes = await api.get(`/reviews/tour/${id}`);
      setReviews(reviewsRes.data || []);
    } catch (e) {
      alert("Lỗi: " + (e.response?.data?.message || e.message));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 24, color: "#0E7490" }}>🔄</div>
        <p style={{ marginTop: 16, color: "#64748b" }}>Đang tải chi tiết tour...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p style={{ fontSize: "18px", color: "#ef4444" }}>Không tìm thấy tour</p>
      </div>
    );
  }

  const originalPrice = tour.price * people;
  const totalPrice = promotion && promotion.finalAmount ? promotion.finalAmount : originalPrice;
  const discountAmount = promotion ? promotion.discountAmount : 0;
  const minDate = new Date().toISOString().split("T")[0];

  // Mock gallery images - in real app, this would come from tour data
  const galleryImages = [
    tour.image || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "auto", padding: "20px" }}>
      {/* Image Gallery */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            position: "relative",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <img
            src={galleryImages[currentImageIndex]}
            alt={tour.name}
            style={{
              width: "100%",
              height: 400,
              objectFit: "cover",
              cursor: "pointer",
            }}
            onClick={() => setShowImageModal(true)}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/1000x400?text=Tour+Image";
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            {currentImageIndex + 1} / {galleryImages.length}
          </div>
        </div>

        {/* Thumbnail Gallery */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "8px",
          }}
        >
          {galleryImages.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${tour.name} ${index + 1}`}
              style={{
                width: 80,
                height: 60,
                objectFit: "cover",
                borderRadius: "6px",
                cursor: "pointer",
                border: currentImageIndex === index ? "3px solid #0E7490" : "2px solid transparent",
                opacity: currentImageIndex === index ? 1 : 0.7,
                transition: "all 0.2s",
              }}
              onClick={() => setCurrentImageIndex(index)}
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/80x60?text=Image";
              }}
            />
          ))}
        </div>
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
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowImageModal(false)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[currentImageIndex]}
              alt={tour.name}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
            <button
              onClick={() => setShowImageModal(false)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "rgba(255,255,255,0.2)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                cursor: "pointer",
                fontSize: "20px",
              }}
            >
              ×
            </button>
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                  style={{
                    position: "absolute",
                    left: "-60px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                  style={{
                    position: "absolute",
                    right: "-60px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Main Content */}
        <div>
          {/* Title & Rating */}
          <div style={{ marginBottom: "20px" }}>
            <h1 style={{ margin: "0 0 12px", fontSize: "32px", color: "#1e293b" }}>
              {tour.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
              {tour.averageRating > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>
                    {renderStars(Math.round(tour.averageRating))}
                  </span>
                  <span style={{ fontWeight: 600, color: "#64748b" }}>
                    {tour.averageRating} ({tour.reviewCount} đánh giá)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tour Info */}
          <div
            style={{
              background: "#f8fafc",
              padding: "24px",
              borderRadius: "12px",
              marginBottom: "24px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#1e293b", fontSize: "20px" }}>
              📋 Thông tin tour
            </h3>
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontWeight: 600, minWidth: "140px", color: "#374151" }}>📍 Địa điểm:</span>
                <span style={{ fontSize: "16px" }}>{tour.destination}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontWeight: 600, minWidth: "140px", color: "#374151" }}>⏱️ Thời gian:</span>
                <span style={{ fontSize: "16px" }}>{tour.duration}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontWeight: 600, minWidth: "140px", color: "#374151" }}>👥 Số người:</span>
                <span style={{ fontSize: "16px" }}>Tối đa 20 người</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontWeight: 600, minWidth: "140px", color: "#374151" }}>🚌 Phương tiện:</span>
                <span style={{ fontSize: "16px" }}>Xe du lịch 45 chỗ</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontWeight: 600, minWidth: "140px", color: "#374151" }}>🏨 Nơi ở:</span>
                <span style={{ fontSize: "16px" }}>Khách sạn 3-4 sao</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontWeight: 600, minWidth: "140px", color: "#374151" }}>💰 Giá:</span>
                <span style={{ fontSize: "24px", fontWeight: 700, color: "#0ea5e9" }}>
                  {Number(tour.price).toLocaleString()} ₫ / người
                </span>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              marginBottom: "24px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#1e293b", fontSize: "20px" }}>
              ✨ Điểm nổi bật
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🏛️</span>
                <span>Tham quan di tích lịch sử</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🍽️</span>
                <span>Thưởng thức ẩm thực địa phương</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>📸</span>
                <span>Chụp ảnh check-in đẹp</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🎁</span>
                <span>Mua sắm quà lưu niệm</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ marginBottom: "12px", color: "#1e293b" }}>📝 Mô tả</h3>
            <p style={{ lineHeight: "1.8", color: "#475569", fontSize: "16px" }}>
              {tour.description || "Không có mô tả."}
            </p>
          </div>

          {/* Reviews Section */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#1e293b" }}>
                💬 Đánh giá ({reviews.length})
              </h3>
              {user && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  style={{
                    padding: "8px 16px",
                    background: showReviewForm ? "#ef4444" : "#0E7490",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  {showReviewForm ? "Hủy" : "Viết đánh giá"}
                </button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && user && (
              <div
                style={{
                  background: "#f8fafc",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                    Đánh giá (1-5 sao):
                  </label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    style={{
                      padding: "8px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "16px",
                    }}
                  >
                    <option value={5}>5 sao - Xuất sắc</option>
                    <option value={4}>4 sao - Tốt</option>
                    <option value={3}>3 sao - Bình thường</option>
                    <option value={2}>2 sao - Tệ</option>
                    <option value={1}>1 sao - Rất tệ</option>
                  </select>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                    Nhận xét:
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  style={{
                    padding: "10px 20px",
                    background: "#0E7490",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <p style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
                Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá tour này!
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      background: "#fff",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div>
                        <strong style={{ color: "#1e293b" }}>
                          {review.User?.name || "Người dùng ẩn danh"}
                        </strong>
                        <span style={{ marginLeft: "12px", color: "#64748b", fontSize: "14px" }}>
                          {new Date(review.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div style={{ fontSize: "18px" }}>{renderStars(review.rating)}</div>
                    </div>
                    {review.comment && (
                      <p style={{ margin: 0, color: "#475569", lineHeight: "1.6" }}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Card */}
        <div>
          <div
            style={{
              background: "#fff",
              border: "2px solid #e5e7eb",
              borderRadius: "16px",
              padding: "28px",
              position: "sticky",
              top: "20px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <h3 style={{ margin: "0 0 8px", color: "#1e293b", fontSize: "24px" }}>
                🧾 Đặt tour ngay
              </h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                Đảm bảo chỗ ngồi tốt nhất
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
                  Ngày khởi hành:
                </label>
                <input
                  type="date"
                  value={date}
                  min={minDate}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
                  Số người:
                </label>
                <input
                  type="number"
                  min="1"
                  value={people}
                  onChange={(e) => setPeople(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
                  Phương thức thanh toán:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#fff",
                  }}
                >
                  <option value="cash">💰 Tiền mặt</option>
                  <option value="momo">💳 MoMo</option>
                  <option value="vnpay">🏦 VNPay</option>
                </select>
              </div>

              {/* Promotion Code */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
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
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={checkPromotion}
                    disabled={checkingPromotion || !promotionCode.trim()}
                    style={{
                      padding: "10px 16px",
                      background: checkingPromotion || !promotionCode.trim() ? "#94a3b8" : "#f59e0b",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: checkingPromotion || !promotionCode.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    {checkingPromotion ? "⏳" : "✓"}
                  </button>
                </div>
                {promotion && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "12px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
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

              <div
                style={{
                  padding: "20px",
                  background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                  borderRadius: "12px",
                  border: "1px solid #bae6fd",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "16px" }}>
                  <span style={{ color: "#374151" }}>Giá / người:</span>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>{Number(tour.price).toLocaleString()} ₫</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "16px" }}>
                  <span style={{ color: "#374151" }}>Số người:</span>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>{people}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "16px" }}>
                  <span style={{ color: "#374151" }}>Tổng tạm tính:</span>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>{Number(originalPrice).toLocaleString()} ₫</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "16px" }}>
                    <span style={{ color: "#16a34a" }}>Giảm giá:</span>
                    <span style={{ fontWeight: 600, color: "#16a34a" }}>-{Number(discountAmount).toLocaleString()} ₫</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", color: "#64748b" }}>
                  <span>Phí dịch vụ:</span>
                  <span>Miễn phí</span>
                </div>
                <hr style={{ border: "none", borderTop: "2px solid #bae6fd", margin: "16px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "24px", fontWeight: 700, color: "#0ea5e9" }}>
                  <span>Tổng cộng:</span>
                  <span>{Number(totalPrice).toLocaleString()} ₫</span>
                </div>
                <div style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "#64748b" }}>
                  * Giá đã bao gồm thuế và phí dịch vụ
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={submitting || !user || !date}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  background: user && date ? "linear-gradient(135deg, #0E7490 0%, #0891b2 100%)" : "#94a3b8",
                  color: "#fff",
                  border: "none",
                  padding: "16px",
                  borderRadius: "12px",
                  cursor: submitting || !user || !date ? "not-allowed" : "pointer",
                  fontSize: "18px",
                  fontWeight: 700,
                  transition: "all 0.3s ease",
                  boxShadow: user && date ? "0 4px 16px rgba(14, 116, 144, 0.3)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (user && date && !submitting) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(14, 116, 144, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (user && date && !submitting) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 16px rgba(14, 116, 144, 0.3)";
                  }
                }}
              >
                {!user
                  ? "🔐 Đăng nhập để đặt tour"
                  : submitting
                  ? "⏳ Đang xử lý..."
                  : "🎯 Đặt tour ngay"}
              </button>

              {/* Additional Info */}
              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>🛡️</span>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>Bảo đảm hoàn tiền 100%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>📞</span>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>Hỗ trợ 24/7: 1900-xxxx</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
