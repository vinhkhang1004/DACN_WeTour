import React, { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminHotelBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [hotelFilter, setHotelFilter] = useState("");
  const [hotels, setHotels] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchBookings();
    fetchHotels();
  }, [search, statusFilter, hotelFilter]);

  const fetchHotels = async () => {
    try {
      const res = await api.get("/admin/hotels", { headers });
      setHotels(res.data.hotels || []);
    } catch (error) {
      console.error("Error fetching hotels:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (hotelFilter) params.append("hotel_id", hotelFilter);
      
      const res = await api.get(`/admin/hotels/bookings?${params.toString()}`, { headers });
      setBookings(res.data.bookings || []);
    } catch (error) {
      console.error("Error fetching hotel bookings:", error);
      alert("Không thể tải danh sách đặt phòng!");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const statusNames = {
      pending: "chờ xác nhận",
      confirmed: "xác nhận",
      cancelled: "hủy",
      completed: "hoàn thành"
    };
    
    if (!window.confirm(`Xác nhận ${statusNames[status] || status} đơn này?`))
      return;

    try {
      await api.put(`/admin/hotels/bookings/${id}/status`, { status }, { headers });
      alert(`✅ Đã cập nhật trạng thái thành công!`);
      fetchBookings();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đặt phòng này? Hành động này không thể hoàn tác."))
      return;

    try {
      await api.delete(`/admin/hotels/bookings/${id}`, { headers });
      alert("✅ Đã xóa đặt phòng thành công!");
      fetchBookings();
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Có lỗi xảy ra khi xóa đặt phòng!");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span style={{padding: "4px 12px", background: "#fef3c7", color: "#92400e", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>Chờ xác nhận</span>;
      case "confirmed":
        return <span style={{padding: "4px 12px", background: "#dbeafe", color: "#1e40af", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>Đã xác nhận</span>;
      case "completed":
        return <span style={{padding: "4px 12px", background: "#cffafe", color: "#155e75", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>Hoàn thành</span>;
      case "cancelled":
        return <span style={{padding: "4px 12px", background: "#fee2e2", color: "#991b1b", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>Đã hủy</span>;
      default:
        return <span style={{padding: "4px 12px", background: "#f3f4f6", color: "#374151", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>{status}</span>;
    }
  };

  const calculateNights = (checkIn, checkOut) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Đang tải danh sách đặt phòng..." />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "24px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", margin: "0 0 8px 0" }}>
                🏨 Quản lý Đặt Phòng Khách Sạn
              </h1>
              <p style={{ color: "#64748b", margin: 0 }}>Quản lý và xử lý đơn đặt phòng khách sạn</p>
            </div>
            <button
              onClick={fetchBookings}
              style={{
                padding: "10px 20px",
                background: "#0E7490",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.background = "#0891b2"}
              onMouseLeave={(e) => e.target.style.background = "#0E7490"}
            >
              🔄 Làm mới
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <input
              type="text"
              placeholder="🔍 Tìm kiếm (tên, email, SĐT, khách sạn)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "10px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none"
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "10px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <select
              value={hotelFilter}
              onChange={(e) => setHotelFilter(e.target.value)}
              style={{
                padding: "10px 16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="">Tất cả khách sạn</option>
              {hotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bookings Table */}
        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>ID</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Khách hàng</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Khách sạn</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Ngày nhận/trả</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Số đêm</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Số người/Phòng</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Tổng tiền</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Trạng thái</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                      Chưa có đơn đặt phòng nào
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    const nights = calculateNights(b.check_in_date, b.check_out_date);
                    return (
                      <tr key={b.id} style={{ borderTop: "1px solid #e5e7eb" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "16px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>#{b.id}</td>
                        <td style={{ padding: "16px" }}>
                          {b.user_id ? (
                            <>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                                {b.User?.name || "N/A"}
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748b" }}>{b.User?.email || ""}</div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                                {b.guest_name || "Khách chưa đăng nhập"}
                                <span style={{ marginLeft: "8px", padding: "2px 8px", background: "#fef3c7", color: "#92400e", borderRadius: "4px", fontSize: "10px" }}>Guest</span>
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748b" }}>{b.guest_email || ""}</div>
                              <div style={{ fontSize: "12px", color: "#64748b" }}>{b.guest_phone || ""}</div>
                            </>
                          )}
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                            {b.Hotel?.name || "N/A"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{b.Hotel?.location || ""}</div>
                        </td>
                        <td style={{ padding: "16px", fontSize: "14px", color: "#1e293b" }}>
                          <div>📅 {new Date(b.check_in_date).toLocaleDateString("vi-VN")}</div>
                          <div>📅 {new Date(b.check_out_date).toLocaleDateString("vi-VN")}</div>
                        </td>
                        <td style={{ padding: "16px", fontSize: "14px", color: "#1e293b", textAlign: "center" }}>
                          {nights} đêm
                        </td>
                        <td style={{ padding: "16px", fontSize: "14px", color: "#1e293b" }}>
                          <div>{b.adults} người lớn</div>
                          {b.children > 0 && <div>{b.children} trẻ em</div>}
                          <div style={{ marginTop: "4px", fontWeight: 600 }}>{b.rooms} phòng</div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0E7490" }}>
                            {Number(b.total_price).toLocaleString()}₫
                          </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          {getStatusBadge(b.status)}
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {b.status === "pending" && (
                              <>
                                <button
                                  onClick={() => updateStatus(b.id, "confirmed")}
                                  style={{
                                    padding: "6px 12px",
                                    background: "#0E7490",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = "#0891b2"}
                                  onMouseLeave={(e) => e.target.style.background = "#0E7490"}
                                >
                                  ✅ Xác nhận
                                </button>
                                <button
                                  onClick={() => updateStatus(b.id, "cancelled")}
                                  style={{
                                    padding: "6px 12px",
                                    background: "#ef4444",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = "#dc2626"}
                                  onMouseLeave={(e) => e.target.style.background = "#ef4444"}
                                >
                                  ❌ Hủy
                                </button>
                              </>
                            )}
                            {b.status === "confirmed" && (
                              <button
                                onClick={() => updateStatus(b.id, "completed")}
                                style={{
                                  padding: "6px 12px",
                                  background: "#10b981",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => e.target.style.background = "#059669"}
                                onMouseLeave={(e) => e.target.style.background = "#10b981"}
                              >
                                ✓ Hoàn thành
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setShowDetail(true);
                              }}
                              style={{
                                padding: "6px 12px",
                                background: "#f3f4f6",
                                color: "#1e293b",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = "#e5e7eb";
                                e.target.style.borderColor = "#d1d5db";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = "#f3f4f6";
                                e.target.style.borderColor = "#e5e7eb";
                              }}
                            >
                              👁️ Chi tiết
                            </button>
                            <button
                              onClick={() => deleteBooking(b.id)}
                              style={{
                                padding: "6px 12px",
                                background: "#fee2e2",
                                color: "#991b1b",
                                border: "1px solid #fecaca",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = "#fecaca";
                                e.target.style.borderColor = "#fca5a5";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = "#fee2e2";
                                e.target.style.borderColor = "#fecaca";
                              }}
                            >
                              🗑️ Xóa
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
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedBooking && (
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
            zIndex: 1000,
            padding: "20px"
          }}
          onClick={() => setShowDetail(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                Chi tiết đặt phòng #{selectedBooking.id}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#64748b"
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>Khách hàng</h3>
                {selectedBooking.user_id ? (
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>{selectedBooking.User?.name || "N/A"}</div>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>{selectedBooking.User?.email || ""}</div>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>{selectedBooking.User?.phone || ""}</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>{selectedBooking.guest_name || "N/A"}</div>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>{selectedBooking.guest_email || ""}</div>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>{selectedBooking.guest_phone || ""}</div>
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>Khách sạn</h3>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>{selectedBooking.Hotel?.name || "N/A"}</div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>{selectedBooking.Hotel?.location || ""}</div>
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>Thông tin đặt phòng</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Ngày nhận phòng</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                      {new Date(selectedBooking.check_in_date).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Ngày trả phòng</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                      {new Date(selectedBooking.check_out_date).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Số đêm</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                      {calculateNights(selectedBooking.check_in_date, selectedBooking.check_out_date)} đêm
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Số phòng</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{selectedBooking.rooms} phòng</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Người lớn</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{selectedBooking.adults} người</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Trẻ em</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{selectedBooking.children} người</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>Tổng tiền</h3>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0E7490" }}>
                  {Number(selectedBooking.total_price).toLocaleString()}₫
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>Ghi chú</h3>
                  <div style={{ fontSize: "14px", color: "#1e293b", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                    {selectedBooking.notes}
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>Trạng thái</h3>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#64748b", marginBottom: "8px" }}>Thời gian</h3>
                <div style={{ fontSize: "14px", color: "#1e293b" }}>
                  Tạo lúc: {new Date(selectedBooking.created_at).toLocaleString("vi-VN")}
                </div>
                {selectedBooking.updated_at !== selectedBooking.created_at && (
                  <div style={{ fontSize: "14px", color: "#1e293b" }}>
                    Cập nhật: {new Date(selectedBooking.updated_at).toLocaleString("vi-VN")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}









