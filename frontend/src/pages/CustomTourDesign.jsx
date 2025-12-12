import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CustomTourDesign() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Form state
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [tourType, setTourType] = useState("Nghỉ dưỡng");
  const [budget, setBudget] = useState(5000000);
  
  // Activities state
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [aiActivities, setAiActivities] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Itinerary state
  const [days, setDays] = useState([1]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [dayActivities, setDayActivities] = useState({}); // { day: [activities] }
  
  // Summary state
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  
  // Guest info (nếu chưa đăng nhập)
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [savedTourId, setSavedTourId] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, selectedCategory, searchTerm, destination, aiActivities]);

  useEffect(() => {
    calculateSummary();
  }, [dayActivities, adults, children]);

  const fetchActivities = async (locationFilter = null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (locationFilter) {
        params.append("location", locationFilter);
      }
      const url = `/custom-tours/activities${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await api.get(url);
      setActivities(response.data || []);
      setFilteredActivities(response.data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  // Parse location từ destination (ví dụ: "Đà Nẵng, Việt Nam" -> "Đà Nẵng")
  const parseLocationFromDestination = (dest) => {
    if (!dest) return null;
    // Loại bỏ dấu phẩy và các từ như "Việt Nam", "Vietnam", etc.
    const cleaned = dest.trim();
    // Tách theo dấu phẩy, lấy phần đầu
    const parts = cleaned.split(",");
    if (parts.length > 0) {
      return parts[0].trim();
    }
    return cleaned;
  };

  // Fetch AI activities khi destination thay đổi
  const fetchAiActivities = async () => {
    if (!destination) {
      setAiActivities([]);
      return;
    }

    try {
      setLoadingAi(true);
      const response = await api.post("/custom-tours/activities/ai-suggest", {
        destination,
        tourType,
        budget,
        adults,
        children
      });
      
      if (response.data && response.data.activities) {
        setAiActivities(response.data.activities || []);
      }
    } catch (error) {
      console.error("Error fetching AI activities:", error);
      setAiActivities([]);
    } finally {
      setLoadingAi(false);
    }
  };

  // Fetch activities khi destination thay đổi (với debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (destination) {
        const location = parseLocationFromDestination(destination);
        if (location) {
          fetchActivities(location);
          // Gọi AI để gợi ý activities
          fetchAiActivities();
        } else {
          fetchActivities();
          setAiActivities([]);
        }
      } else {
        fetchActivities();
        setAiActivities([]);
      }
    }, 800); // Debounce 800ms để tránh gọi quá nhiều

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, tourType, budget]);

  const filterActivities = () => {
    let filtered = [...activities];
    
    // Kết hợp với AI activities (nếu có)
    const allActivities = [...filtered];
    if (aiActivities.length > 0) {
      // Thêm AI activities vào đầu danh sách
      aiActivities.forEach(aiAct => {
        // Kiểm tra xem đã có trong database chưa (tránh duplicate)
        const exists = allActivities.some(act => 
          act.name.toLowerCase() === aiAct.name.toLowerCase() && 
          act.location === aiAct.location
        );
        if (!exists) {
          allActivities.unshift({ ...aiAct, isAiGenerated: true });
        }
      });
    }
    
    filtered = allActivities;
    
    // Filter theo category
    if (selectedCategory) {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }
    
    // Filter theo search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(term) ||
        (a.description && a.description.toLowerCase().includes(term)) ||
        (a.location && a.location.toLowerCase().includes(term))
      );
    }
    
    // Nếu có destination, ưu tiên hiển thị activities ở location đó
    if (destination) {
      const location = parseLocationFromDestination(destination);
      if (location) {
        // Sắp xếp: AI activities và activities ở location trùng khớp lên đầu
        filtered = filtered.sort((a, b) => {
          const aIsAi = a.isAiGenerated ? 1 : 0;
          const bIsAi = b.isAiGenerated ? 1 : 0;
          if (aIsAi && !bIsAi) return -1;
          if (!aIsAi && bIsAi) return 1;
          
          const aMatch = a.location && a.location.toLowerCase().includes(location.toLowerCase());
          const bMatch = b.location && b.location.toLowerCase().includes(location.toLowerCase());
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return 0;
        });
      }
    }
    
    setFilteredActivities(filtered);
  };

  const calculateSummary = () => {
    let cost = 0;
    let hours = 0;
    
    Object.values(dayActivities).forEach(dayActs => {
      dayActs.forEach(item => {
        let activity = null;
        
        // Nếu là AI activity, dùng activity_data
        if (item.activity_data && item.activity_data.isAiGenerated) {
          activity = item.activity_data;
        } else if (item.activity_id) {
          // Tìm trong activities từ database
          activity = activities.find(a => a.id === item.activity_id);
        }
        
        if (activity) {
          hours += parseFloat(activity.duration_hours || 0);
          const price = parseFloat(activity.price_per_person || 0);
          // Tính giá: người lớn = giá gốc, trẻ em = 70% giá gốc
          cost += price * adults + price * 0.7 * children;
        }
      });
    });
    
    setEstimatedCost(Math.round(cost));
    setTotalHours(parseFloat(hours.toFixed(1)));
  };

  const handleAddDay = () => {
    const newDay = Math.max(...days) + 1;
    setDays([...days, newDay]);
    setSelectedDay(newDay);
  };

  const handleAddActivity = (activity) => {
    const currentDayActs = dayActivities[selectedDay] || [];
    const newActivity = {
      activity_id: activity.id || null, // null nếu là AI activity
      day_number: selectedDay,
      order_index: currentDayActs.length,
      start_time: null,
      notes: "",
      // Lưu thông tin activity đầy đủ cho AI activities
      activity_data: activity.isAiGenerated ? {
        name: activity.name,
        description: activity.description,
        category: activity.category,
        duration_hours: activity.duration_hours,
        price_per_person: activity.price_per_person,
        location: activity.location,
        isAiGenerated: true
      } : null
    };
    
    setDayActivities({
      ...dayActivities,
      [selectedDay]: [...currentDayActs, newActivity]
    });
  };

  const handleRemoveActivity = (day, index) => {
    const dayActs = [...(dayActivities[day] || [])];
    dayActs.splice(index, 1);
    setDayActivities({
      ...dayActivities,
      [day]: dayActs
    });
  };

  const handleSaveDraft = async () => {
    if (!destination || !startDate || !endDate) {
      alert("Vui lòng điền đầy đủ thông tin: Điểm đến, Ngày đi, Ngày về");
      return;
    }
    
    if (!user && (!guestName || !guestEmail || !guestPhone)) {
      alert("Vui lòng điền thông tin liên hệ");
      return;
    }
    
    try {
      setSaving(true);
      const allActivities = [];
      Object.keys(dayActivities).forEach(day => {
        dayActivities[day].forEach((act, idx) => {
          allActivities.push({
            ...act,
            order_index: idx
          });
        });
      });
      
      const payload = {
        destination,
        start_date: startDate,
        end_date: endDate,
        adults,
        children,
        tour_type: tourType,
        budget,
        activities: allActivities,
        guest_name: user ? null : guestName,
        guest_email: user ? null : guestEmail,
        guest_phone: user ? null : guestPhone
      };
      
      let response;
      const token = localStorage.getItem("token");
      
      if (savedTourId) {
        // Update existing tour - cần token (interceptor sẽ tự động thêm)
        if (!token) {
          alert("Vui lòng đăng nhập để cập nhật tour đã lưu");
          setSaving(false);
          return;
        }
        response = await api.put(`/custom-tours/${savedTourId}`, payload);
      } else {
        // Create new tour - interceptor sẽ tự động thêm token nếu có
        response = await api.post("/custom-tours", payload);
        if (response.data && response.data.id) {
          setSavedTourId(response.data.id);
        }
      }
      
      alert("Đã lưu nháp thành công!");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Có lỗi xảy ra khi lưu nháp: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!destination || !startDate || !endDate) {
      alert("Vui lòng điền đầy đủ thông tin: Điểm đến, Ngày đi, Ngày về");
      return;
    }
    
    if (!user && (!guestName || !guestEmail || !guestPhone)) {
      alert("Vui lòng điền thông tin liên hệ");
      return;
    }
    
    const allActivities = [];
    Object.keys(dayActivities).forEach(day => {
      dayActivities[day].forEach((act, idx) => {
        allActivities.push({
          ...act,
          order_index: idx
        });
      });
    });
    
    if (allActivities.length === 0) {
      alert("Vui lòng thêm ít nhất một hoạt động vào lịch trình");
      return;
    }
    
    try {
      setSaving(true);
      const payload = {
        destination,
        start_date: startDate,
        end_date: endDate,
        adults,
        children,
        tour_type: tourType,
        budget,
        activities: allActivities,
        guest_name: user ? null : guestName,
        guest_email: user ? null : guestEmail,
        guest_phone: user ? null : guestPhone
      };
      
      // Interceptor sẽ tự động thêm token nếu có
      const response = await api.post("/custom-tours", payload);
      
      alert("Đã gửi yêu cầu thiết kế tour! Admin sẽ xem xét và liên hệ với bạn sớm nhất.");
      navigate("/");
    } catch (error) {
      console.error("Error submitting tour:", error);
      alert("Có lỗi xảy ra: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // Calculate number of days
  const numberOfDays = startDate && endDate ? 
    Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1 : 1;

  useEffect(() => {
    if (numberOfDays > 0 && numberOfDays !== days.length) {
      const newDays = Array.from({ length: numberOfDays }, (_, i) => i + 1);
      setDays(newDays);
      if (selectedDay > numberOfDays) {
        setSelectedDay(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfDays]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Header */}
      <div style={{ background: "#fff", padding: "20px 0", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px" }}>
          <h1 style={{ fontSize: "32px", margin: "0 0 8px", fontWeight: 700, color: "#1e293b" }}>
            Tự Thiết Kế Hành Trình Của Riêng Bạn
          </h1>
          <p style={{ fontSize: "16px", margin: 0, color: "#64748b" }}>
            Tạo một tour du lịch cá nhân hóa bằng cách chọn điểm đến, hoạt động, thời gian, và ngân sách của bạn.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px", display: "flex", gap: "24px" }}>
        {/* Left Sidebar */}
        <div style={{ width: "320px", flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "18px", margin: "0 0 20px", fontWeight: 600, color: "#1e293b" }}>
              Lên Kế Hoạch Cho Chuyến Đi
            </h3>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151", fontSize: "14px" }}>
                Bạn muốn đi đâu?
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="VD: Đà Nẵng, Việt Nam"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151", fontSize: "14px" }}>
                Ngày đi, ngày về
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split("T")[0]}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151", fontSize: "14px" }}>
                Số hành khách
              </label>
              <input
                type="number"
                min="1"
                value={adults}
                onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="Người lớn"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  marginBottom: "8px",
                  outline: "none"
                }}
              />
              <input
                type="number"
                min="0"
                value={children}
                onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Trẻ em"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151", fontSize: "14px" }}>
                Loại hình tour
              </label>
              <select
                value={tourType}
                onChange={(e) => setTourType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none"
                }}
              >
                <option value="Nghỉ dưỡng">Nghỉ dưỡng</option>
                <option value="Khám phá">Khám phá</option>
                <option value="Mạo hiểm">Mạo hiểm</option>
                <option value="Văn hóa">Văn hóa</option>
                <option value="Ẩm thực">Ẩm thực</option>
              </select>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151", fontSize: "14px" }}>
                Ngân sách dự kiến
              </label>
              <input
                type="range"
                min="1000000"
                max="50000000"
                step="1000000"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value))}
                style={{ width: "100%", marginBottom: "8px" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                <span>1.000.000₫</span>
                <span style={{ fontWeight: 600, color: "#0E7490" }}>
                  {budget.toLocaleString()}₫
                </span>
                <span>50.000.000₫+</span>
              </div>
            </div>

            {!user && (
              <div style={{ marginBottom: "20px", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
                <h4 style={{ fontSize: "14px", margin: "0 0 12px", fontWeight: 600, color: "#1e293b" }}>
                  Thông tin liên hệ
                </h4>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Họ và tên *"
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    marginBottom: "8px",
                    outline: "none"
                  }}
                />
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Email *"
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    marginBottom: "8px",
                    outline: "none"
                  }}
                />
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Số điện thoại *"
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>
            )}

            <button
              onClick={handleSaveDraft}
              disabled={saving}
              style={{
                width: "100%",
                background: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: saving ? "not-allowed" : "pointer",
                marginBottom: "12px"
              }}
            >
              {saving ? "Đang lưu..." : "Bắt đầu tạo lịch trình"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {/* Activity Search */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm hoạt động (VD: Ăn uống, Tham quan...)"
                  style={{
                    width: "100%",
                    padding: "12px 40px 12px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>
                  🔍
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["Ăn uống", "Tham quan", "Mua sắm", "Giải trí"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                  style={{
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    background: selectedCategory === cat ? "#0E7490" : "#f3f4f6",
                    color: selectedCategory === cat ? "#fff" : "#374151",
                    transition: "all 0.2s"
                  }}
                >
                  {cat === "Ăn uống" && "🍴 "}
                  {cat === "Tham quan" && "🏛️ "}
                  {cat === "Mua sắm" && "🛍️ "}
                  {cat === "Giải trí" && "🎮 "}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Cards */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <h3 style={{ fontSize: "18px", margin: 0, fontWeight: 600, color: "#1e293b" }}>
                Gợi ý hoạt động
              </h3>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                {loadingAi && (
                  <span style={{ fontSize: "14px", color: "#64748b", fontStyle: "italic" }}>
                    🤖 AI đang tạo gợi ý...
                  </span>
                )}
                {aiActivities.length > 0 && !loadingAi && (
                  <span style={{ fontSize: "14px", color: "#10b981", fontWeight: 500 }}>
                    ✨ {aiActivities.length} gợi ý từ AI
                  </span>
                )}
                {destination && (
                  <span style={{ fontSize: "14px", color: "#0E7490", fontWeight: 500 }}>
                    📍 {parseLocationFromDestination(destination) || destination}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {filteredActivities.map((activity, index) => (
                <div
                  key={activity.id || `ai-${index}`}
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: activity.isAiGenerated ? "0 2px 8px rgba(16, 185, 129, 0.2)" : "0 2px 8px rgba(0,0,0,0.1)",
                    border: activity.isAiGenerated ? "2px solid #10b981" : "none",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  onClick={() => handleAddActivity(activity)}
                >
                  {activity.isAiGenerated && (
                    <div style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "#10b981",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: 600,
                      zIndex: 10
                    }}>
                      ✨ AI
                    </div>
                  )}
                  <img
                    src={activity.image || "https://via.placeholder.com/400x250?text=Activity"}
                    alt={activity.name}
                    style={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover"
                    }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400x250?text=Activity";
                    }}
                  />
                  <div style={{ padding: "16px" }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                      {activity.name}
                    </h4>
                    <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
                      {activity.description?.substring(0, 100) || "Hoạt động du lịch thú vị"}
                      {activity.description && activity.description.length > 100 && "..."}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          ⏱️ {activity.duration_hours} giờ
                        </span>
                        {activity.location && (
                          <span style={{ fontSize: "12px", color: "#64748b" }}>
                            📍 {activity.location}
                          </span>
                        )}
                      </div>
                      {activity.price_per_person > 0 ? (
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#0E7490" }}>
                          {Number(activity.price_per_person).toLocaleString()}₫
                        </span>
                      ) : (
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#10b981" }}>
                          Miễn phí
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Itinerary Builder */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "18px", margin: "0 0 20px", fontWeight: 600, color: "#1e293b" }}>
              Xây Dựng Lịch Trình Chi Tiết
            </h3>

            {/* Day Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {days.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    background: selectedDay === day ? "#0E7490" : "#f3f4f6",
                    color: selectedDay === day ? "#fff" : "#374151",
                    transition: "all 0.2s"
                  }}
                >
                  Ngày {day}
                </button>
              ))}
              <button
                onClick={handleAddDay}
                style={{
                  padding: "10px 16px",
                  border: "1px dashed #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  background: "transparent",
                  color: "#64748b"
                }}
              >
                +
              </button>
            </div>

            {/* Drop Zone */}
            <div
              style={{
                minHeight: "300px",
                padding: "24px",
                border: "2px dashed #d1d5db",
                borderRadius: "12px",
                background: "#f8fafc"
              }}
            >
              {(dayActivities[selectedDay] || []).length === 0 ? (
                <div style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
                  <p style={{ fontSize: "16px", margin: 0 }}>
                    Kéo và thả hoạt động vào đây để xây dựng lịch trình cho Ngày {selectedDay}
                  </p>
                  <p style={{ fontSize: "14px", margin: "8px 0 0", color: "#9ca3af" }}>
                    Hoặc click vào hoạt động ở trên để thêm vào
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {(dayActivities[selectedDay] || []).map((item, index) => {
                    // Lấy activity từ activity_data (AI) hoặc tìm trong activities (database)
                    let activity = null;
                    if (item.activity_data && item.activity_data.isAiGenerated) {
                      activity = item.activity_data;
                    } else if (item.activity_id) {
                      activity = activities.find(a => a.id === item.activity_id);
                    }
                    if (!activity) return null;
                    
                    return (
                      <div
                        key={index}
                        style={{
                          background: "#fff",
                          borderRadius: "8px",
                          padding: "16px",
                          border: "1px solid #e5e7eb",
                          display: "flex",
                          gap: "16px",
                          alignItems: "center"
                        }}
                      >
                        <img
                          src={activity.image || "https://via.placeholder.com/100x100"}
                          alt={activity.name}
                          style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "cover",
                            borderRadius: "8px"
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                            {activity.name}
                          </h4>
                          <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#64748b" }}>
                            {activity.duration_hours} giờ
                          </p>
                          {activity.price_per_person > 0 && (
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0E7490" }}>
                              {Number(activity.price_per_person).toLocaleString()}₫/người
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveActivity(selectedDay, index)}
                          style={{
                            padding: "8px 12px",
                            border: "none",
                            borderRadius: "6px",
                            background: "#ef4444",
                            color: "#fff",
                            fontSize: "14px",
                            cursor: "pointer"
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Summary */}
      <div style={{ 
        position: "fixed", 
        bottom: 0, 
        left: 0, 
        right: 0, 
        background: "#fff", 
        padding: "16px 20px",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
        zIndex: 100
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "14px", color: "#64748b" }}>Chi phí ước tính: </span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#0E7490" }}>
                {estimatedCost.toLocaleString()}₫
              </span>
            </div>
            <div>
              <span style={{ fontSize: "14px", color: "#64748b" }}>Tổng thời gian: </span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#0E7490" }}>
                {totalHours.toFixed(1)} giờ
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              style={{
                padding: "12px 24px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                background: "#fff",
                color: "#374151",
                fontSize: "14px",
                fontWeight: 500,
                cursor: saving ? "not-allowed" : "pointer"
              }}
            >
              {saving ? "Đang lưu..." : "Lưu Nháp"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: "12px 24px",
                border: "none",
                borderRadius: "8px",
                background: "#0E7490",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer"
              }}
            >
              {saving ? "Đang gửi..." : "Xem lại & Đặt tour"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

