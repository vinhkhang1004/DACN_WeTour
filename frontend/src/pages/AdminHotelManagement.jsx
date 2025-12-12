import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function AdminHotelManagement() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showRoomDetail, setShowRoomDetail] = useState(false);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");

  // Common amenities list
  const commonAmenities = [
    "Wi-Fi miễn phí",
    "Bể bơi",
    "Bãi đỗ xe",
    "Gần bãi biển",
    "Nhà hàng",
    "Gym",
    "Spa",
    "Massage",
    "Bar",
    "Lễ tân 24/7",
    "Dịch vụ phòng",
    "Thang máy",
    "Điều hòa",
    "Tủ lạnh",
    "TV",
    "Ban công",
    "Khu vực BBQ",
    "Sân vườn",
    "Quầy bar",
    "Dịch vụ giặt ủi",
    "Dịch vụ đưa đón sân bay",
    "Trung tâm thể dục",
    "Khu vui chơi trẻ em",
    "Hồ bơi ngoài trời",
    "Hồ bơi trong nhà",
    "Bãi tắm nắng",
    "Khu vực xông hơi",
    "Phòng họp",
    "Dịch vụ tour",
    "Dịch vụ đặt xe"
  ];

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    address: "",
    price_per_night: 0,
    image: "",
    images: "",
    description: "",
    amenities: [],
    latitude: "",
    longitude: "",
    total_rooms: 0,
    status: "active"
  });

  // Custom amenity input
  const [customAmenity, setCustomAmenity] = useState("");

  // Room form state
  const [roomFormData, setRoomFormData] = useState({
    name: "",
    description: "",
    max_guests: 2,
    max_children: 0,
    bed_type: "",
    price_per_night: 0,
    images: [],
    features: "",
    status: "available",
    quantity: 1
  });
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    fetchHotels();
  }, [search]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      
      const response = await api.get(`/admin/hotels?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHotels(response.data.hotels || []);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      alert("Không thể tải danh sách khách sạn");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingHotel(null);
    setCustomAmenity("");
    setFormData({
      name: "",
      location: "",
      address: "",
      price_per_night: 0,
      image: "",
      images: "",
      description: "",
      amenities: [],
      latitude: "",
      longitude: "",
      total_rooms: 0,
      status: "active"
    });
    setShowForm(true);
  };

  const handleEdit = (hotel) => {
    setEditingHotel(hotel);
    setCustomAmenity("");
    // Parse amenities to array
    let amenitiesArray = [];
    if (hotel.amenities) {
      if (typeof hotel.amenities === 'string') {
        try {
          amenitiesArray = JSON.parse(hotel.amenities);
        } catch (e) {
          // If not JSON, treat as comma-separated
          amenitiesArray = hotel.amenities.split(',').map(s => s.trim()).filter(s => s);
        }
      } else if (Array.isArray(hotel.amenities)) {
        amenitiesArray = hotel.amenities;
      }
    }
    
    setFormData({
      name: hotel.name || "",
      location: hotel.location || "",
      address: hotel.address || "",
      price_per_night: parseFloat(hotel.price_per_night) || 0,
      image: hotel.image || "",
      images: hotel.images ? (typeof hotel.images === 'string' ? hotel.images : JSON.stringify(hotel.images)) : "",
      description: hotel.description || "",
      amenities: amenitiesArray,
      latitude: hotel.latitude || "",
      longitude: hotel.longitude || "",
      total_rooms: hotel.total_rooms || 0,
      status: hotel.status || "active"
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa khách sạn này?")) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/admin/hotels/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Xóa khách sạn thành công!");
      fetchHotels();
    } catch (error) {
      alert(error.response?.data?.message || "Không thể xóa khách sạn");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const data = {
        ...formData,
        price_per_night: parseFloat(formData.price_per_night) || 0,
        total_rooms: parseInt(formData.total_rooms) || 0,
        images: formData.images ? (formData.images.startsWith('[') ? JSON.parse(formData.images) : formData.images.split(',').map(s => s.trim())) : null,
        amenities: Array.isArray(formData.amenities) ? formData.amenities : []
      };

      if (editingHotel) {
        await api.put(`/admin/hotels/${editingHotel.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Cập nhật khách sạn thành công!");
      } else {
        await api.post("/admin/hotels", data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Tạo khách sạn thành công!");
      }
      setShowForm(false);
      fetchHotels();
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleManageRooms = (hotel) => {
    setSelectedHotel(hotel);
    setShowRoomForm(true);
    fetchRooms(hotel.id);
  };

  const fetchRooms = async (hotelId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/admin/hotels/${hotelId}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedHotel(prev => ({ ...prev, Rooms: response.data }));
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const handleCreateRoom = () => {
    setEditingRoom(null);
    setNewImageUrl("");
    setRoomFormData({
      name: "",
      description: "",
      max_guests: 2,
      max_children: 0,
      bed_type: "",
      price_per_night: 0,
      images: [],
      features: "",
      status: "available",
      quantity: 1
    });
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setNewImageUrl("");
    // Parse images - có thể là single image hoặc images array
    let imagesArray = [];
    if (room.images) {
      try {
        imagesArray = typeof room.images === 'string' ? JSON.parse(room.images) : room.images;
        if (!Array.isArray(imagesArray)) imagesArray = [];
      } catch (e) {
        imagesArray = [];
      }
    } else if (room.image) {
      // Nếu có image cũ (single), chuyển thành array
      imagesArray = [room.image];
    }
    
    setRoomFormData({
      name: room.name || "",
      description: room.description || "",
      max_guests: room.max_guests || 2,
      max_children: room.max_children || 0,
      bed_type: room.bed_type || "",
      price_per_night: parseFloat(room.price_per_night) || 0,
      images: imagesArray,
      features: room.features ? (typeof room.features === 'string' ? room.features : JSON.stringify(room.features)) : "",
      status: room.status || "available",
      quantity: room.quantity !== undefined && room.quantity !== null ? parseInt(room.quantity) : 1
    });
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Bạn có chắc muốn xóa phòng này?")) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/admin/hotels/${selectedHotel.id}/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Xóa phòng thành công!");
      fetchRooms(selectedHotel.id);
      if (selectedRoomDetail?.id === roomId) {
        setShowRoomDetail(false);
        setSelectedRoomDetail(null);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể xóa phòng");
    }
  };

  const handleViewRoomDetail = (room) => {
    setSelectedRoomDetail(room);
    setTempDescription(room.description || "");
    setEditingDescription(false);
    setShowRoomDetail(true);
  };

  const handleSaveDescription = async () => {
    if (!selectedRoomDetail) return;

    try {
      const token = localStorage.getItem("token");
      await api.put(`/admin/hotels/${selectedHotel.id}/rooms/${selectedRoomDetail.id}`, {
        ...selectedRoomDetail,
        description: tempDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Cập nhật mô tả thành công!");
      setEditingDescription(false);
      fetchRooms(selectedHotel.id);
      // Cập nhật selectedRoomDetail với mô tả mới
      setSelectedRoomDetail({ ...selectedRoomDetail, description: tempDescription });
    } catch (error) {
      alert(error.response?.data?.message || "Không thể cập nhật mô tả");
    }
  };

  const handleSubmitRoom = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const data = {
        ...roomFormData,
        max_guests: parseInt(roomFormData.max_guests) || 2,
        max_children: parseInt(roomFormData.max_children) || 0,
        price_per_night: parseFloat(roomFormData.price_per_night) || 0,
        quantity: parseInt(roomFormData.quantity) || 1,
        images: Array.isArray(roomFormData.images) ? roomFormData.images : [],
        features: roomFormData.features ? (roomFormData.features.startsWith('[') ? JSON.parse(roomFormData.features) : roomFormData.features.split(',').map(s => s.trim())) : null
      };

      if (editingRoom) {
        const response = await api.put(`/admin/hotels/${selectedHotel.id}/rooms/${editingRoom.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Cập nhật phòng thành công!");
        
        // Cập nhật ngay room trong state với dữ liệu từ response
        if (response.data && response.data.room) {
          setSelectedHotel(prev => {
            if (!prev || !prev.Rooms) return prev;
            const updatedRooms = prev.Rooms.map(r => 
              r.id === editingRoom.id ? { ...response.data.room, quantity: response.data.room.quantity !== undefined ? response.data.room.quantity : r.quantity } : r
            );
            return { ...prev, Rooms: updatedRooms };
          });
        } else {
          // Fallback: fetch lại danh sách phòng
          fetchRooms(selectedHotel.id);
        }
      } else {
        await api.post(`/admin/hotels/${selectedHotel.id}/rooms`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Tạo phòng thành công!");
        fetchRooms(selectedHotel.id);
      }
      setEditingRoom(null);
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Đang tải...</div>;
  }

  return (
    <div style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px", color: "#1e293b" }}>
            Quản lý Khách sạn
          </h1>
          <p style={{ color: "#64748b" }}>Quản lý và chỉnh sửa thông tin khách sạn</p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            background: "#0E7490",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          + Thêm khách sạn
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm khách sạn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "12px 16px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "16px"
          }}
        />
      </div>

      {/* Hotels Table */}
      <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Tên khách sạn</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Địa điểm</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Xếp hạng</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Giá/đêm</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Các loại phòng</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Trạng thái</th>
              <th style={{ padding: "16px", textAlign: "center", fontWeight: 600, color: "#1e293b" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {hotels.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                  Chưa có khách sạn nào
                </td>
              </tr>
            ) : (
              hotels.map((hotel) => {
                // Tính giá phòng thấp nhất từ Rooms nếu có
                let minRoomPrice = hotel.price_per_night || 0;
                if (hotel.Rooms && Array.isArray(hotel.Rooms) && hotel.Rooms.length > 0) {
                  const roomPrices = hotel.Rooms
                    .map(room => parseFloat(room.price_per_night) || 0)
                    .filter(price => price > 0);
                  if (roomPrices.length > 0) {
                    minRoomPrice = Math.min(...roomPrices);
                  }
                }
                
                return (
                <tr key={hotel.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{hotel.name}</div>
                    {hotel.address && (
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        {hotel.address}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "16px", color: "#475569" }}>{hotel.location}</td>
                  <td style={{ padding: "16px" }}>
                    {hotel.star_rating > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {[...Array(hotel.star_rating)].map((_, i) => (
                          <span key={i} style={{ color: "#fbbf24" }}>★</span>
                        ))}
                      </div>
                    )}
                    {hotel.user_score > 0 && (
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        {hotel.user_score} điểm
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "16px", color: "#0E7490", fontWeight: 600 }}>
                    {Number(minRoomPrice).toLocaleString()}₫
                  </td>
                  <td style={{ padding: "16px", color: "#475569" }}>
                    {hotel.Rooms && hotel.Rooms.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {hotel.Rooms.map((room, index) => (
                          <div 
                            key={room.id || index}
                            style={{
                              padding: "6px 10px",
                              background: "#f0f9ff",
                              borderRadius: "6px",
                              fontSize: "13px",
                              border: "1px solid #e0f2fe"
                            }}
                          >
                            <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "2px" }}>
                              {room.name || `Phòng ${index + 1}`}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {Number(room.price_per_night || 0).toLocaleString()}₫/đêm
                              {room.max_guests && ` • ${room.max_guests} người`}
                              {room.bed_type && ` • ${room.bed_type}`}
                            </div>
                          </div>
                        ))}
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontStyle: "italic" }}>
                          Tổng: {hotel.Rooms.length} phòng
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Chưa có phòng</span>
                    )}
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: hotel.status === "active" ? "#dcfce7" : "#fee2e2",
                        color: hotel.status === "active" ? "#166534" : "#991b1b"
                      }}
                    >
                      {hotel.status === "active" ? "Hoạt động" : "Ngừng hoạt động"}
                    </span>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button
                        onClick={() => handleEdit(hotel)}
                        style={{
                          background: "#0E7490",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "14px",
                          cursor: "pointer"
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleManageRooms(hotel)}
                        style={{
                          background: "#10b981",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "14px",
                          cursor: "pointer"
                        }}
                      >
                        Phòng
                      </button>
                      <button
                        onClick={() => handleDelete(hotel.id)}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "14px",
                          cursor: "pointer"
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Hotel Form Modal */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px"
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px", color: "#1e293b" }}>
              {editingHotel ? "Sửa khách sạn" : "Thêm khách sạn mới"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Tên khách sạn *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Địa điểm *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Giá/đêm (₫) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price_per_night}
                    onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Ảnh chính (URL)
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Ảnh khác (JSON array hoặc comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    placeholder='["url1", "url2"] hoặc url1, url2'
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Tiện nghi
                  </label>
                  <div style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    background: "#fff"
                  }}>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "12px"
                    }}>
                      {commonAmenities.map((amenity) => (
                        <label
                          key={amenity}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "6px",
                            transition: "background 0.2s",
                            userSelect: "none"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f0f9ff"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(amenity)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  amenities: [...formData.amenities, amenity]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  amenities: formData.amenities.filter(a => a !== amenity)
                                });
                              }
                            }}
                            style={{
                              width: "18px",
                              height: "18px",
                              cursor: "pointer",
                              accentColor: "#0E7490"
                            }}
                          />
                          <span style={{ fontSize: "14px", color: "#1e293b" }}>{amenity}</span>
                        </label>
                      ))}
                    </div>
                    {formData.amenities.length > 0 && (
                      <div style={{
                        marginTop: "16px",
                        paddingTop: "16px",
                        borderTop: "1px solid #e5e7eb"
                      }}>
                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                          Đã chọn ({formData.amenities.length}):
                        </div>
                        <div style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px"
                        }}>
                          {formData.amenities.map((amenity) => (
                            <span
                              key={amenity}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                background: "#e0f2fe",
                                color: "#0E7490",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: 500
                              }}
                            >
                              {amenity}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    amenities: formData.amenities.filter(a => a !== amenity)
                                  });
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#0E7490",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                  lineHeight: 1,
                                  padding: 0,
                                  marginLeft: "4px"
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Custom amenity input */}
                    <div style={{
                      marginTop: "16px",
                      paddingTop: "16px",
                      borderTop: "1px solid #e5e7eb"
                    }}>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>
                        Thêm tiện nghi tùy chỉnh:
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          value={customAmenity}
                          onChange={(e) => setCustomAmenity(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (customAmenity.trim() && !formData.amenities.includes(customAmenity.trim())) {
                                setFormData({
                                  ...formData,
                                  amenities: [...formData.amenities, customAmenity.trim()]
                                });
                                setCustomAmenity("");
                              }
                            }
                          }}
                          placeholder="Nhập tiện nghi mới..."
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            fontSize: "14px"
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customAmenity.trim() && !formData.amenities.includes(customAmenity.trim())) {
                              setFormData({
                                ...formData,
                                amenities: [...formData.amenities, customAmenity.trim()]
                              });
                              setCustomAmenity("");
                            }
                          }}
                          disabled={!customAmenity.trim() || formData.amenities.includes(customAmenity.trim())}
                          style={{
                            padding: "8px 16px",
                            background: customAmenity.trim() && !formData.amenities.includes(customAmenity.trim()) ? "#0E7490" : "#94a3b8",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: customAmenity.trim() && !formData.amenities.includes(customAmenity.trim()) ? "pointer" : "not-allowed"
                          }}
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Ngừng hoạt động</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
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

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
                <button
                  type="submit"
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
                  {editingHotel ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Management Modal */}
      {showRoomForm && selectedHotel && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px"
          }}
          onClick={() => {
            setShowRoomForm(false);
            setSelectedHotel(null);
            setEditingRoom(null);
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "1000px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b" }}>
                Quản lý phòng - {selectedHotel.name}
              </h2>
              <button
                onClick={() => {
                  setShowRoomForm(false);
                  setSelectedHotel(null);
                  setEditingRoom(null);
                }}
                style={{
                  background: "#f8fafc",
                  color: "#1e293b",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                Đóng
              </button>
            </div>

            {/* Room Form */}
            <div style={{ marginBottom: "24px", padding: "20px", background: "#f8fafc", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "#1e293b" }}>
                {editingRoom ? "Sửa phòng" : "Thêm phòng mới"}
              </h3>
              <form onSubmit={handleSubmitRoom}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                      Tên phòng *
                    </label>
                    <input
                      type="text"
                      value={roomFormData.name}
                      onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                      Giá/đêm (₫) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={roomFormData.price_per_night}
                      onChange={(e) => setRoomFormData({ ...roomFormData, price_per_night: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                      Số người lớn tối đa
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={roomFormData.max_guests}
                      onChange={(e) => setRoomFormData({ ...roomFormData, max_guests: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                      Số trẻ em tối đa
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={roomFormData.max_children}
                      onChange={(e) => setRoomFormData({ ...roomFormData, max_children: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                      Loại giường
                    </label>
                    <input
                      type="text"
                      value={roomFormData.bed_type}
                      onChange={(e) => setRoomFormData({ ...roomFormData, bed_type: e.target.value })}
                      placeholder="VD: 1 giường đôi, 1 giường King"
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                      Trạng thái
                    </label>
                    <select
                      value={roomFormData.status}
                      onChange={(e) => setRoomFormData({ ...roomFormData, status: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px"
                      }}
                    >
                      <option value="available">Còn phòng</option>
                      <option value="unavailable">Hết phòng</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                      Số lượng phòng *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={roomFormData.quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 0;
                        setRoomFormData({ 
                          ...roomFormData, 
                          quantity: qty,
                          // Tự động cập nhật status dựa trên quantity
                          status: qty <= 0 ? "unavailable" : (roomFormData.status === "unavailable" && qty > 0 ? "available" : roomFormData.status)
                        });
                      }}
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px"
                      }}
                    />
                    <small style={{ color: "#64748b", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      Khi số lượng = 0, trạng thái sẽ tự động chuyển sang "Hết phòng"
                    </small>
                  </div>
                </div>

                {/* Images Section */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Ảnh phòng (URL) - Có thể thêm nhiều ảnh
                  </label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Nhập URL ảnh..."
                      style={{
                        flex: 1,
                        padding: "10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "14px"
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newImageUrl.trim()) {
                          e.preventDefault();
                          setRoomFormData({
                            ...roomFormData,
                            images: [...roomFormData.images, newImageUrl.trim()]
                          });
                          setNewImageUrl("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newImageUrl.trim()) {
                          setRoomFormData({
                            ...roomFormData,
                            images: [...roomFormData.images, newImageUrl.trim()]
                          });
                          setNewImageUrl("");
                        }
                      }}
                      style={{
                        padding: "10px 20px",
                        background: "#0E7490",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      Thêm ảnh
                    </button>
                  </div>
                  {roomFormData.images.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                      {roomFormData.images.map((img, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px",
                            background: "#f8fafc",
                            borderRadius: "6px",
                            border: "1px solid #e5e7eb"
                          }}
                        >
                          <img
                            src={img}
                            alt={`Room image ${index + 1}`}
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "cover",
                              borderRadius: "4px"
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                          <div style={{ flex: 1, fontSize: "12px", color: "#64748b", wordBreak: "break-all" }}>
                            {img}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setRoomFormData({
                                ...roomFormData,
                                images: roomFormData.images.filter((_, i) => i !== index)
                              });
                            }}
                            style={{
                              padding: "6px 12px",
                              background: "#ef4444",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              cursor: "pointer"
                            }}
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Mô tả
                  </label>
                  <textarea
                    value={roomFormData.description}
                    onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })}
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

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Tiện nghi (JSON array hoặc comma-separated)
                  </label>
                  <input
                    type="text"
                    value={roomFormData.features}
                    onChange={(e) => setRoomFormData({ ...roomFormData, features: e.target.value })}
                    placeholder='["Wi-Fi", "TV"] hoặc Wi-Fi, TV'
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  {editingRoom && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRoom(null);
                        handleCreateRoom();
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
                      Hủy sửa
                    </button>
                  )}
                  <button
                    type="submit"
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
                    {editingRoom ? "Cập nhật" : "Thêm phòng"}
                  </button>
                </div>
              </form>
            </div>

            {/* Rooms List */}
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "#1e293b" }}>
                Danh sách phòng ({selectedHotel.Rooms?.length || 0})
              </h3>
              {selectedHotel.Rooms && selectedHotel.Rooms.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {selectedHotel.Rooms.map((room) => (
                    <div
                      key={room.id}
                      style={{
                        display: "flex",
                        gap: "16px",
                        padding: "16px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        background: editingRoom?.id === room.id ? "#f0f9ff" : "#fff"
                      }}
                    >
                      {(() => {
                        // Lấy ảnh đầu tiên từ images array hoặc image single
                        let roomImage = null;
                        if (room.images) {
                          try {
                            const imagesArray = typeof room.images === 'string' ? JSON.parse(room.images) : room.images;
                            if (Array.isArray(imagesArray) && imagesArray.length > 0) {
                              roomImage = imagesArray[0];
                            }
                          } catch (e) {
                            // Ignore parse error
                          }
                        }
                        if (!roomImage && room.image) {
                          roomImage = room.image;
                        }
                        return roomImage ? (
                          <img
                            src={roomImage}
                            alt={room.name}
                            style={{
                              width: "120px",
                              height: "80px",
                              objectFit: "cover",
                              borderRadius: "8px"
                            }}
                          />
                        ) : null;
                      })()}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                          {room.name}
                        </div>
                        <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
                          {room.max_guests} người lớn{room.max_children > 0 ? `, ${room.max_children} trẻ em` : ""} • {room.bed_type || "N/A"}
                        </div>
                        {room.description && (
                          <div style={{ fontSize: "12px", color: "#475569", marginBottom: "8px" }}>
                            {room.description}
                          </div>
                        )}
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "#0E7490" }}>
                          {Number(room.price_per_night).toLocaleString()}₫/đêm
                        </div>
                        <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
                          <span style={{ fontWeight: 600, color: room.quantity > 0 ? "#059669" : "#dc2626" }}>
                            Số lượng: {room.quantity !== undefined && room.quantity !== null ? room.quantity : 1}
                          </span>
                          {room.quantity > 0 && (
                            <span style={{ marginLeft: "8px", color: "#059669" }}>
                              ({room.status === "available" ? "Còn phòng" : "Hết phòng"})
                            </span>
                          )}
                          {room.quantity <= 0 && (
                            <span style={{ marginLeft: "8px", color: "#dc2626" }}>
                              (Hết phòng)
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", flexDirection: "column" }}>
                        <button
                          onClick={() => handleViewRoomDetail(room)}
                          style={{
                            background: "#8b5cf6",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "14px",
                            cursor: "pointer",
                            width: "100%"
                          }}
                        >
                          Chi tiết
                        </button>
                        <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                          <button
                            onClick={() => handleEditRoom(room)}
                            style={{
                              background: "#0E7490",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              fontSize: "14px",
                              cursor: "pointer",
                              flex: 1
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            style={{
                              background: "#ef4444",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              fontSize: "14px",
                              cursor: "pointer",
                              flex: 1
                            }}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                  Chưa có phòng nào
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Room Detail Modal */}
      {showRoomDetail && selectedRoomDetail && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2001,
            padding: "20px"
          }}
          onClick={() => {
            setShowRoomDetail(false);
            setSelectedRoomDetail(null);
            setEditingDescription(false);
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b" }}>
                Chi tiết phòng - {selectedRoomDetail.name}
              </h2>
              <button
                onClick={() => {
                  setShowRoomDetail(false);
                  setSelectedRoomDetail(null);
                  setEditingDescription(false);
                }}
                style={{
                  background: "#f8fafc",
                  color: "#1e293b",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                Đóng
              </button>
            </div>

            {/* Room Images */}
            {(() => {
              // Lấy images từ images array hoặc image single
              let roomImages = [];
              if (selectedRoomDetail.images) {
                try {
                  roomImages = typeof selectedRoomDetail.images === 'string' 
                    ? JSON.parse(selectedRoomDetail.images) 
                    : selectedRoomDetail.images;
                  if (!Array.isArray(roomImages)) roomImages = [];
                } catch (e) {
                  roomImages = [];
                }
              }
              if (roomImages.length === 0 && selectedRoomDetail.image) {
                roomImages = [selectedRoomDetail.image];
              }
              
              return roomImages.length > 0 ? (
                <div style={{ marginBottom: "24px" }}>
                  {roomImages.length === 1 ? (
                    <img
                      src={roomImages[0]}
                      alt={selectedRoomDetail.name}
                      style={{
                        width: "100%",
                        height: "300px",
                        objectFit: "cover",
                        borderRadius: "8px"
                      }}
                    />
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                      {roomImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${selectedRoomDetail.name} - Ảnh ${idx + 1}`}
                          style={{
                            width: "100%",
                            height: "200px",
                            objectFit: "cover",
                            borderRadius: "8px"
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : null;
            })()}

            {/* Room Info */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Sức chứa</div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b" }}>
                    {selectedRoomDetail.max_guests || "N/A"} người lớn{selectedRoomDetail.max_children > 0 ? `, ${selectedRoomDetail.max_children} trẻ em` : ""}
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
                <div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Trạng thái</div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: selectedRoomDetail.status === "available" ? "#166534" : "#991b1b" }}>
                    {selectedRoomDetail.status === "available" ? "Còn phòng" : "Hết phòng"}
                  </div>
                </div>
              </div>
            </div>

            {/* Room Description - Editable */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b" }}>Mô tả phòng</h3>
                {!editingDescription ? (
                  <button
                    onClick={() => {
                      setEditingDescription(true);
                      setTempDescription(selectedRoomDetail.description || "");
                    }}
                    style={{
                      background: "#0E7490",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    Chỉnh sửa
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={handleSaveDescription}
                      style={{
                        background: "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "14px",
                        cursor: "pointer"
                      }}
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => {
                        setEditingDescription(false);
                        setTempDescription(selectedRoomDetail.description || "");
                      }}
                      style={{
                        background: "#f8fafc",
                        color: "#1e293b",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "14px",
                        cursor: "pointer"
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
              {editingDescription ? (
                <textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  rows="6"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #0E7490",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  placeholder="Nhập mô tả phòng..."
                />
              ) : (
                <div style={{
                  background: "#f8fafc",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  minHeight: "100px"
                }}>
                  {selectedRoomDetail.description ? (
                    <p style={{ fontSize: "15px", color: "#475569", lineHeight: "1.7", margin: 0, whiteSpace: "pre-wrap" }}>
                      {selectedRoomDetail.description}
                    </p>
                  ) : (
                    <p style={{ fontSize: "14px", color: "#94a3b8", fontStyle: "italic", margin: 0 }}>
                      Chưa có mô tả. Nhấn "Chỉnh sửa" để thêm mô tả.
                    </p>
                  )}
                </div>
              )}
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
                features = [];
              }
              return features.length > 0 ? (
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#1e293b" }}>Tiện nghi</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {features.map((feature, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "6px 12px",
                          background: "#e0f2fe",
                          color: "#0E7490",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 500
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

