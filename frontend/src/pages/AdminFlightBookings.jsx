import React, { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminFlightBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchBookings();
  }, [search, statusFilter, paymentStatusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (paymentStatusFilter) params.append("payment_status", paymentStatusFilter);
      
      const res = await api.get(`/admin/flights/bookings?${params.toString()}`, { headers });
      setBookings(res.data.bookings || []);
    } catch (error) {
      console.error("Error fetching flight bookings:", error);
      alert("Không thể tải danh sách đặt vé!");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, paymentStatus) => {
    const statusNames = {
      pending: "chờ xác nhận",
      confirmed: "xác nhận",
      cancelled: "hủy",
      completed: "hoàn thành"
    };
    
    const paymentStatusNames = {
      pending: "chưa thanh toán",
      paid: "đã thanh toán",
      refunded: "đã hoàn tiền"
    };
    
    let message = "";
    if (status) {
      message = `Xác nhận ${statusNames[status] || status} đơn này?`;
    }
    if (paymentStatus) {
      message = `Xác nhận ${paymentStatusNames[paymentStatus] || paymentStatus} cho đơn này?`;
    }
    
    if (!window.confirm(message || "Xác nhận cập nhật trạng thái?"))
      return;

    try {
      const updateData = {};
      if (status) updateData.status = status;
      if (paymentStatus) updateData.payment_status = paymentStatus;
      
      await api.put(`/admin/flights/bookings/${id}/status`, updateData, { headers });
      alert(`✅ Đã cập nhật trạng thái thành công!`);
      fetchBookings();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đặt vé này? Hành động này không thể hoàn tác."))
      return;

    try {
      await api.delete(`/admin/flights/bookings/${id}`, { headers });
      alert("✅ Đã xóa đặt vé thành công!");
      fetchBookings();
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Có lỗi xảy ra khi xóa đặt vé!");
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

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span style={{padding: "4px 12px", background: "#fef3c7", color: "#92400e", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>Chưa thanh toán</span>;
      case "paid":
        return <span style={{padding: "4px 12px", background: "#d1fae5", color: "#065f46", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>Đã thanh toán</span>;
      case "refunded":
        return <span style={{padding: "4px 12px", background: "#fee2e2", color: "#991b1b", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>Đã hoàn tiền</span>;
      default:
        return <span style={{padding: "4px 12px", background: "#f3f4f6", color: "#374151", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>{status}</span>;
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

  const viewDetails = async (booking) => {
    try {
      const res = await api.get(`/admin/flights/bookings/${booking.id}`, { headers });
      setSelectedBooking(res.data);
      setShowDetail(true);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      alert("Không thể tải chi tiết đặt vé!");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px", color: "#1e293b" }}>
          Quản lý Đặt vé Máy bay
        </h1>
        <p style={{ color: "#64748b" }}>Xem và quản lý tất cả đặt vé máy bay</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Tìm kiếm (mã đặt vé, tên, email, số điện thoại)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: "300px",
            padding: "12px 16px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "16px"
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "12px 16px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "16px",
            background: "#fff"
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          style={{
            padding: "12px 16px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "16px",
            background: "#fff"
          }}
        >
          <option value="">Tất cả thanh toán</option>
          <option value="pending">Chưa thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="refunded">Đã hoàn tiền</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Mã đặt vé</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Khách hàng</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Chuyến bay</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Hành khách</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Tổng tiền</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Trạng thái</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1e293b" }}>Thanh toán</th>
              <th style={{ padding: "16px", textAlign: "center", fontWeight: 600, color: "#1e293b" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                  Không có đặt vé nào
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const outboundFlight = booking.OutboundFlight;
                const returnFlight = booking.ReturnFlight;
                const passengers = booking.passengers ? (typeof booking.passengers === 'string' ? JSON.parse(booking.passengers) : booking.passengers) : [];
                
                return (
                  <tr key={booking.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px", fontWeight: 600, color: "#0E7490" }}>
                      {booking.booking_code}
                    </td>
                    <td style={{ padding: "16px" }}>
                      {booking.User ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{booking.User.name}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{booking.User.email}</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600 }}>{booking.guest_name || "Khách"}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{booking.guest_email}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>
                      {outboundFlight && (
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {outboundFlight.airline} {outboundFlight.flight_number}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {outboundFlight.origin} → {outboundFlight.destination}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {formatDateTime(outboundFlight.departure_date)}
                          </div>
                          {returnFlight && (
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                              Khứ hồi: {returnFlight.airline} {returnFlight.flight_number}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div>{booking.passenger_count} người</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {booking.class_type === "economy" ? "Phổ thông" : booking.class_type === "business" ? "Thương gia" : "Hạng nhất"}
                      </div>
                    </td>
                    <td style={{ padding: "16px", fontWeight: 600, color: "#0E7490" }}>
                      {Number(booking.total_price).toLocaleString()}₫
                      {booking.discount_amount > 0 && (
                        <div style={{ fontSize: "12px", color: "#10b981" }}>
                          Giảm: {Number(booking.discount_amount).toLocaleString()}₫
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>
                      {getStatusBadge(booking.status)}
                    </td>
                    <td style={{ padding: "16px" }}>
                      {getPaymentStatusBadge(booking.payment_status)}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                          onClick={() => viewDetails(booking)}
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
                          Chi tiết
                        </button>
                        {booking.status !== "confirmed" && (
                          <button
                            onClick={() => updateStatus(booking.id, "confirmed", null)}
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
                            Xác nhận
                          </button>
                        )}
                        {booking.payment_status !== "paid" && (
                          <button
                            onClick={() => updateStatus(booking.id, null, "paid")}
                            style={{
                              background: "#3b82f6",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              fontSize: "14px",
                              cursor: "pointer"
                            }}
                          >
                            Đã trả
                          </button>
                        )}
                        {booking.status !== "cancelled" && (
                          <button
                            onClick={() => updateStatus(booking.id, "cancelled", null)}
                            style={{
                              background: "#f59e0b",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              fontSize: "14px",
                              cursor: "pointer"
                            }}
                          >
                            Hủy
                          </button>
                        )}
                        <button
                          onClick={() => deleteBooking(booking.id)}
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

      {/* Detail Modal */}
      {showDetail && selectedBooking && (
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
          onClick={() => setShowDetail(false)}
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
                Chi tiết đặt vé #{selectedBooking.booking_code}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                style={{
                  background: "#f8fafc",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: "18px"
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
              {/* Customer Info */}
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#1e293b" }}>
                  Thông tin khách hàng
                </h3>
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                  {selectedBooking.User ? (
                    <>
                      <div style={{ marginBottom: "8px" }}>
                        <strong>Tên:</strong> {selectedBooking.User.name}
                      </div>
                      <div style={{ marginBottom: "8px" }}>
                        <strong>Email:</strong> {selectedBooking.User.email}
                      </div>
                      <div style={{ marginBottom: "8px" }}>
                        <strong>Số điện thoại:</strong> {selectedBooking.User.phone || "N/A"}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom: "8px" }}>
                        <strong>Tên:</strong> {selectedBooking.guest_name || "N/A"}
                      </div>
                      <div style={{ marginBottom: "8px" }}>
                        <strong>Email:</strong> {selectedBooking.guest_email || "N/A"}
                      </div>
                      <div style={{ marginBottom: "8px" }}>
                        <strong>Số điện thoại:</strong> {selectedBooking.guest_phone || "N/A"}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Flight Info */}
              {selectedBooking.OutboundFlight && (
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#1e293b" }}>
                    Chuyến bay đi
                  </h3>
                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Hãng bay:</strong> {selectedBooking.OutboundFlight.airline}
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Số hiệu:</strong> {selectedBooking.OutboundFlight.flight_number}
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Tuyến:</strong> {selectedBooking.OutboundFlight.origin} ({selectedBooking.OutboundFlight.origin_code}) → {selectedBooking.OutboundFlight.destination} ({selectedBooking.OutboundFlight.destination_code})
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Khởi hành:</strong> {formatDateTime(selectedBooking.OutboundFlight.departure_date)}
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Đến nơi:</strong> {formatDateTime(selectedBooking.OutboundFlight.arrival_date)}
                    </div>
                    <div>
                      <strong>Thời gian bay:</strong> {selectedBooking.OutboundFlight.duration} phút
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking.ReturnFlight && (
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#1e293b" }}>
                    Chuyến bay về
                  </h3>
                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Hãng bay:</strong> {selectedBooking.ReturnFlight.airline}
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Số hiệu:</strong> {selectedBooking.ReturnFlight.flight_number}
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Tuyến:</strong> {selectedBooking.ReturnFlight.origin} ({selectedBooking.ReturnFlight.origin_code}) → {selectedBooking.ReturnFlight.destination} ({selectedBooking.ReturnFlight.destination_code})
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Khởi hành:</strong> {formatDateTime(selectedBooking.ReturnFlight.departure_date)}
                    </div>
                    <div>
                      <strong>Đến nơi:</strong> {formatDateTime(selectedBooking.ReturnFlight.arrival_date)}
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Details */}
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#1e293b" }}>
                  Chi tiết đặt vé
                </h3>
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Số hành khách:</strong> {selectedBooking.passenger_count}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Hạng ghế:</strong> {selectedBooking.class_type === "economy" ? "Phổ thông" : selectedBooking.class_type === "business" ? "Thương gia" : "Hạng nhất"}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Tổng tiền:</strong> {Number(selectedBooking.total_price).toLocaleString()}₫
                  </div>
                  {selectedBooking.discount_amount > 0 && (
                    <div style={{ marginBottom: "8px", color: "#10b981" }}>
                      <strong>Giảm giá:</strong> {Number(selectedBooking.discount_amount).toLocaleString()}₫
                    </div>
                  )}
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Trạng thái:</strong> {getStatusBadge(selectedBooking.status)}
                  </div>
                  <div>
                    <strong>Thanh toán:</strong> {getPaymentStatusBadge(selectedBooking.payment_status)}
                  </div>
                  {selectedBooking.notes && (
                    <div style={{ marginTop: "12px", padding: "12px", background: "#fff", borderRadius: "6px" }}>
                      <strong>Ghi chú:</strong> {selectedBooking.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Passengers */}
              {selectedBooking.passengers && (
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#1e293b" }}>
                    Danh sách hành khách
                  </h3>
                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                    {(() => {
                      const passengers = typeof selectedBooking.passengers === 'string' 
                        ? JSON.parse(selectedBooking.passengers) 
                        : selectedBooking.passengers;
                      return passengers.map((p, idx) => (
                        <div key={idx} style={{ marginBottom: "12px", padding: "12px", background: "#fff", borderRadius: "6px" }}>
                          <div><strong>Hành khách {idx + 1}:</strong> {p.full_name}</div>
                          {p.date_of_birth && <div>Ngày sinh: {p.date_of_birth}</div>}
                          {p.passport_number && <div>Số hộ chiếu: {p.passport_number}</div>}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







