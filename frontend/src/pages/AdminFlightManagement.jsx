import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function AdminFlightManagement() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    airline: "",
    flight_number: "",
    origin: "",
    origin_code: "",
    origin_airport: "",
    destination: "",
    destination_code: "",
    destination_airport: "",
    departure_date: "",
    arrival_date: "",
    duration: "",
    flight_type: "direct",
    aircraft_type: "",
    economy_price: 0,
    business_price: "",
    first_class_price: "",
    available_seats_economy: 0,
    available_seats_business: 0,
    available_seats_first: 0,
    baggage_carry_on: "7kg",
    baggage_checked: "23kg",
    status: "scheduled"
  });

  useEffect(() => {
    fetchFlights();
  }, [search]);

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      
      const response = await api.get(`/admin/flights?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlights(response.data.flights || []);
    } catch (error) {
      console.error("Error fetching flights:", error);
      alert("Không thể tải danh sách chuyến bay");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFlight(null);
    setFormData({
      airline: "",
      flight_number: "",
      origin: "",
      origin_code: "",
      origin_airport: "",
      destination: "",
      destination_code: "",
      destination_airport: "",
      departure_date: "",
      arrival_date: "",
      duration: "",
      flight_type: "direct",
      aircraft_type: "",
      economy_price: 0,
      business_price: "",
      first_class_price: "",
      available_seats_economy: 0,
      available_seats_business: 0,
      available_seats_first: 0,
      baggage_carry_on: "7kg",
      baggage_checked: "23kg",
      status: "scheduled"
    });
    setShowForm(true);
  };

  const handleEdit = (flight) => {
    setEditingFlight(flight);
    setFormData({
      airline: flight.airline || "",
      flight_number: flight.flight_number || "",
      origin: flight.origin || "",
      origin_code: flight.origin_code || "",
      origin_airport: flight.origin_airport || "",
      destination: flight.destination || "",
      destination_code: flight.destination_code || "",
      destination_airport: flight.destination_airport || "",
      departure_date: flight.departure_date ? new Date(flight.departure_date).toISOString().slice(0, 16) : "",
      arrival_date: flight.arrival_date ? new Date(flight.arrival_date).toISOString().slice(0, 16) : "",
      duration: flight.duration || "",
      flight_type: flight.flight_type || "direct",
      aircraft_type: flight.aircraft_type || "",
      economy_price: parseFloat(flight.economy_price) || 0,
      business_price: flight.business_price ? parseFloat(flight.business_price) : "",
      first_class_price: flight.first_class_price ? parseFloat(flight.first_class_price) : "",
      available_seats_economy: flight.available_seats_economy || 0,
      available_seats_business: flight.available_seats_business || 0,
      available_seats_first: flight.available_seats_first || 0,
      baggage_carry_on: flight.baggage_carry_on || "7kg",
      baggage_checked: flight.baggage_checked || "23kg",
      status: flight.status || "scheduled"
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa chuyến bay này?")) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/admin/flights/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Xóa chuyến bay thành công!");
      fetchFlights();
    } catch (error) {
      alert(error.response?.data?.message || "Không thể xóa chuyến bay");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const data = {
        ...formData,
        economy_price: parseFloat(formData.economy_price) || 0,
        business_price: formData.business_price ? parseFloat(formData.business_price) : null,
        first_class_price: formData.first_class_price ? parseFloat(formData.first_class_price) : null,
        available_seats_economy: parseInt(formData.available_seats_economy) || 0,
        available_seats_business: parseInt(formData.available_seats_business) || 0,
        available_seats_first: parseInt(formData.available_seats_first) || 0,
        duration: formData.duration ? parseInt(formData.duration) : null
      };

      if (editingFlight) {
        await api.put(`/admin/flights/${editingFlight.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Cập nhật chuyến bay thành công!");
      } else {
        await api.post("/admin/flights", data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Tạo chuyến bay thành công!");
      }
      setShowForm(false);
      fetchFlights();
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      scheduled: { label: "Đã lên lịch", color: "#0ea5e9", bg: "#dbeafe" },
      delayed: { label: "Hoãn", color: "#f59e0b", bg: "#fef3c7" },
      cancelled: { label: "Đã hủy", color: "#ef4444", bg: "#fee2e2" },
      completed: { label: "Hoàn thành", color: "#10b981", bg: "#d1fae5" }
    };
    const statusInfo = statusMap[status] || { label: status, color: "#64748b", bg: "#f3f4f6" };
    return (
      <span style={{
        padding: "4px 12px",
        background: statusInfo.bg,
        color: statusInfo.color,
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: 600
      }}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Đang tải...</div>;
  }

  return (
    <div style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px", color: "#1e293b" }}>
            Quản lý Chuyến bay
          </h1>
          <p style={{ color: "#64748b" }}>Quản lý và chỉnh sửa thông tin chuyến bay</p>
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
          + Thêm chuyến bay
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm chuyến bay (hãng bay, số hiệu, điểm đi/đến)..."
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

      {/* Flights Table */}
      <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Hãng bay</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Số hiệu</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Tuyến bay</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Ngày giờ</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Giá</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Ghế trống</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Trạng thái</th>
              <th style={{ padding: "16px", textAlign: "center", fontWeight: 600, color: "#1e293b" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {flights.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                  Không có chuyến bay nào
                </td>
              </tr>
            ) : (
              flights.map((flight) => (
                <tr key={flight.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px" }}>{flight.airline}</td>
                  <td style={{ padding: "16px", fontWeight: 600 }}>{flight.flight_number}</td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: 600 }}>
                      {flight.origin} ({flight.origin_code}) → {flight.destination} ({flight.destination_code})
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      {flight.flight_type === "direct" ? "Bay thẳng" : flight.flight_type === "connecting" ? "Có nối chuyến" : "Có quá cảnh"}
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div>{formatDateTime(flight.departure_date)}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {flight.duration} phút
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: 600, color: "#0E7490" }}>
                      {Number(flight.economy_price).toLocaleString()}₫
                    </div>
                    {flight.business_price && (
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Business: {Number(flight.business_price).toLocaleString()}₫
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div>Phổ thông: {flight.available_seats_economy}</div>
                    {flight.available_seats_business > 0 && (
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Thương gia: {flight.available_seats_business}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "16px" }}>
                    {getStatusBadge(flight.status)}
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button
                        onClick={() => handleEdit(flight)}
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
                        onClick={() => handleDelete(flight.id)}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
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
            zIndex: 1000,
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
              {editingFlight ? "Chỉnh sửa chuyến bay" : "Thêm chuyến bay mới"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Hãng bay *
                  </label>
                  <input
                    type="text"
                    value={formData.airline}
                    onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
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
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Số hiệu chuyến bay *
                  </label>
                  <input
                    type="text"
                    value={formData.flight_number}
                    onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Điểm đi *
                  </label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    required
                    placeholder="Hà Nội"
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
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Mã sân bay đi *
                  </label>
                  <input
                    type="text"
                    value={formData.origin_code}
                    onChange={(e) => setFormData({ ...formData, origin_code: e.target.value.toUpperCase() })}
                    required
                    placeholder="HAN"
                    maxLength={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "14px",
                      textTransform: "uppercase"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Tên sân bay đi *
                  </label>
                  <input
                    type="text"
                    value={formData.origin_airport}
                    onChange={(e) => setFormData({ ...formData, origin_airport: e.target.value })}
                    required
                    placeholder="Sân bay Nội Bài"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Điểm đến *
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    required
                    placeholder="TP. Hồ Chí Minh"
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
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Mã sân bay đến *
                  </label>
                  <input
                    type="text"
                    value={formData.destination_code}
                    onChange={(e) => setFormData({ ...formData, destination_code: e.target.value.toUpperCase() })}
                    required
                    placeholder="SGN"
                    maxLength={3}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "14px",
                      textTransform: "uppercase"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Tên sân bay đến *
                  </label>
                  <input
                    type="text"
                    value={formData.destination_airport}
                    onChange={(e) => setFormData({ ...formData, destination_airport: e.target.value })}
                    required
                    placeholder="Sân bay Tân Sơn Nhất"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Ngày giờ khởi hành *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.departure_date}
                    onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
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
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Ngày giờ đến *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.arrival_date}
                    onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Thời gian bay (phút)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="Tự động tính"
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
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Loại chuyến bay
                  </label>
                  <select
                    value={formData.flight_type}
                    onChange={(e) => setFormData({ ...formData, flight_type: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  >
                    <option value="direct">Bay thẳng</option>
                    <option value="connecting">Có nối chuyến</option>
                    <option value="layover">Có quá cảnh</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Loại máy bay
                  </label>
                  <input
                    type="text"
                    value={formData.aircraft_type}
                    onChange={(e) => setFormData({ ...formData, aircraft_type: e.target.value })}
                    placeholder="Ví dụ: Boeing 787"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Giá phổ thông (₫) *
                  </label>
                  <input
                    type="number"
                    value={formData.economy_price}
                    onChange={(e) => setFormData({ ...formData, economy_price: e.target.value })}
                    required
                    min="0"
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
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Giá thương gia (₫)
                  </label>
                  <input
                    type="number"
                    value={formData.business_price}
                    onChange={(e) => setFormData({ ...formData, business_price: e.target.value })}
                    min="0"
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
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Giá hạng nhất (₫)
                  </label>
                  <input
                    type="number"
                    value={formData.first_class_price}
                    onChange={(e) => setFormData({ ...formData, first_class_price: e.target.value })}
                    min="0"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Ghế phổ thông trống
                  </label>
                  <input
                    type="number"
                    value={formData.available_seats_economy}
                    onChange={(e) => setFormData({ ...formData, available_seats_economy: e.target.value })}
                    min="0"
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
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Ghế thương gia trống
                  </label>
                  <input
                    type="number"
                    value={formData.available_seats_business}
                    onChange={(e) => setFormData({ ...formData, available_seats_business: e.target.value })}
                    min="0"
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
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Ghế hạng nhất trống
                  </label>
                  <input
                    type="number"
                    value={formData.available_seats_first}
                    onChange={(e) => setFormData({ ...formData, available_seats_first: e.target.value })}
                    min="0"
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Hành lý xách tay
                  </label>
                  <input
                    type="text"
                    value={formData.baggage_carry_on}
                    onChange={(e) => setFormData({ ...formData, baggage_carry_on: e.target.value })}
                    placeholder="7kg"
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
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#1e293b" }}>
                    Hành lý ký gửi
                  </label>
                  <input
                    type="text"
                    value={formData.baggage_checked}
                    onChange={(e) => setFormData({ ...formData, baggage_checked: e.target.value })}
                    placeholder="23kg"
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
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  >
                    <option value="scheduled">Đã lên lịch</option>
                    <option value="delayed">Hoãn</option>
                    <option value="cancelled">Đã hủy</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    background: "#f8fafc",
                    color: "#1e293b",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
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
                    borderRadius: "6px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {editingFlight ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}








