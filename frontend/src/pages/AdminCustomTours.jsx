import React, { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminCustomTours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminNotes, setAdminNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchTours();
  }, [statusFilter, currentPage]);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      const response = await api.get(`/admin/custom-tours?${params}`, { headers });
      setTours(response.data.tours || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching custom tours:", error);
      alert("Lỗi khi tải danh sách tour: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchTourDetail = async (id) => {
    try {
      const response = await api.get(`/admin/custom-tours/${id}`, { headers });
      setSelectedTour(response.data);
      setAdminNotes(response.data.admin_notes || "");
    } catch (error) {
      console.error("Error fetching tour detail:", error);
      alert("Lỗi khi tải chi tiết tour");
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xác nhận tour này?")) return;
    
    try {
      await api.put(`/admin/custom-tours/${id}/approve`, { admin_notes: adminNotes }, { headers });
      alert("Đã xác nhận tour thành công!");
      fetchTours();
      setSelectedTour(null);
    } catch (error) {
      console.error("Error approving tour:", error);
      alert("Lỗi khi xác nhận tour: " + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn từ chối tour này?")) return;
    
    try {
      await api.put(`/admin/custom-tours/${id}/reject`, { admin_notes: adminNotes }, { headers });
      alert("Đã từ chối tour");
      fetchTours();
      setSelectedTour(null);
    } catch (error) {
      console.error("Error rejecting tour:", error);
      alert("Lỗi khi từ chối tour: " + (error.response?.data?.message || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: "#fef3c7", color: "#92400e" },
      approved: { background: "#d1fae5", color: "#065f46" },
      rejected: { background: "#fee2e2", color: "#991b1b" },
      completed: { background: "#dbeafe", color: "#1e40af" }
    };
    const labels = {
      pending: "Chờ xác nhận",
      approved: "Đã xác nhận",
      rejected: "Đã từ chối",
      completed: "Hoàn thành"
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        ...style
      }}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading && tours.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", margin: 0, fontWeight: 700, color: "#1e293b" }}>
          Quản Lý Tour Tự Thiết Kế
        </h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px"
            }}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="approved">Đã xác nhận</option>
            <option value="rejected">Đã từ chối</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px" }}>
        {/* Tour List */}
        <div style={{ flex: 1 }}>
          <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                    ID
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                    Điểm đến
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                    Khách hàng
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                    Ngày đi
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                    Chi phí
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                    Trạng thái
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {tours.map((tour) => (
                  <tr key={tour.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>
                      #{tour.id}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#1e293b", fontWeight: 500 }}>
                      {tour.destination}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>
                      {tour.User ? tour.User.name : tour.guest_name || "Khách"}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#64748b" }}>
                      {new Date(tour.start_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#0E7490", fontWeight: 600 }}>
                      {Number(tour.estimated_cost).toLocaleString()}₫
                    </td>
                    <td style={{ padding: "12px" }}>
                      {getStatusBadge(tour.status)}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button
                        onClick={() => fetchTourDetail(tour.id)}
                        style={{
                          padding: "6px 12px",
                          border: "none",
                          borderRadius: "6px",
                          background: "#0E7490",
                          color: "#fff",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {tours.length === 0 && (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Không có tour nào
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: "16px", display: "flex", justifyContent: "center", gap: "8px" }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    background: currentPage === 1 ? "#f3f4f6" : "#fff",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer"
                  }}
                >
                  Trước
                </button>
                <span style={{ padding: "8px 12px", color: "#64748b" }}>
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    background: currentPage === totalPages ? "#f3f4f6" : "#fff",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                  }}
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tour Detail Sidebar */}
        {selectedTour && (
          <div style={{ width: "500px", flexShrink: 0 }}>
            <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "sticky", top: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", margin: 0, fontWeight: 700, color: "#1e293b" }}>
                  Chi tiết Tour #{selectedTour.id}
                </h2>
                <button
                  onClick={() => setSelectedTour(null)}
                  style={{
                    padding: "4px 8px",
                    border: "none",
                    background: "transparent",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "#64748b"
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "#374151" }}>Điểm đến:</strong>
                <p style={{ margin: "4px 0", color: "#64748b" }}>{selectedTour.destination}</p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "#374151" }}>Thời gian:</strong>
                <p style={{ margin: "4px 0", color: "#64748b" }}>
                  {new Date(selectedTour.start_date).toLocaleDateString('vi-VN')} - {new Date(selectedTour.end_date).toLocaleDateString('vi-VN')}
                </p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "#374151" }}>Số người:</strong>
                <p style={{ margin: "4px 0", color: "#64748b" }}>
                  {selectedTour.adults} người lớn, {selectedTour.children} trẻ em
                </p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "#374151" }}>Loại hình:</strong>
                <p style={{ margin: "4px 0", color: "#64748b" }}>{selectedTour.tour_type}</p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "#374151" }}>Chi phí ước tính:</strong>
                <p style={{ margin: "4px 0", color: "#0E7490", fontWeight: 600, fontSize: "18px" }}>
                  {Number(selectedTour.estimated_cost).toLocaleString()}₫
                </p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "#374151" }}>Tổng thời gian:</strong>
                <p style={{ margin: "4px 0", color: "#64748b" }}>
                  {Number(selectedTour.total_hours).toFixed(1)} giờ
                </p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <strong style={{ color: "#374151" }}>Khách hàng:</strong>
                <p style={{ margin: "4px 0", color: "#64748b" }}>
                  {selectedTour.User ? (
                    <>
                      {selectedTour.User.name} ({selectedTour.User.email})
                    </>
                  ) : (
                    <>
                      {selectedTour.guest_name}<br />
                      {selectedTour.guest_email}<br />
                      {selectedTour.guest_phone}
                    </>
                  )}
                </p>
              </div>

              {/* Activities by Day */}
              <div style={{ marginBottom: "20px" }}>
                <strong style={{ color: "#374151", display: "block", marginBottom: "12px" }}>Lịch trình:</strong>
                {[1, 2, 3, 4, 5, 6, 7].map(day => {
                  const dayActs = (selectedTour.Activities || []).filter(a => a.day_number === day);
                  if (dayActs.length === 0) return null;
                  
                  return (
                    <div key={day} style={{ marginBottom: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                      <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>
                        Ngày {day}
                      </h4>
                      {dayActs.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: "8px", padding: "8px", background: "#fff", borderRadius: "6px" }}>
                          <div style={{ fontSize: "14px", fontWeight: 500, color: "#1e293b" }}>
                            {item.Activity?.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {item.Activity?.duration_hours} giờ
                            {item.Activity?.price_per_person > 0 && (
                              <> • {Number(item.Activity.price_per_person).toLocaleString()}₫/người</>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Admin Notes */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500, color: "#374151" }}>
                  Ghi chú của admin:
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical"
                  }}
                  placeholder="Nhập ghi chú..."
                />
              </div>

              {/* Action Buttons */}
              {selectedTour.status === "pending" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleApprove(selectedTour.id)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#10b981",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    ✓ Xác nhận
                  </button>
                  <button
                    onClick={() => handleReject(selectedTour.id)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    ✕ Từ chối
                  </button>
                </div>
              )}

              {selectedTour.status !== "pending" && (
                <div style={{ padding: "12px", background: "#f3f4f6", borderRadius: "8px", textAlign: "center", color: "#64748b" }}>
                  Tour đã được {selectedTour.status === "approved" ? "xác nhận" : "từ chối"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


