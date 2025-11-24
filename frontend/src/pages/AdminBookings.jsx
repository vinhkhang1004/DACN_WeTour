import React, { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/bookings", { headers });
      setBookings(res.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      alert("Không thể tải danh sách đặt tour!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id, status) => {
    let actionText = "";
    if (status === "paid") actionText = "duyệt";
    else if (status === "cancelled") actionText = "hủy";
    else if (status === "completed") actionText = "hoàn thành";
    else actionText = "cập nhật";

    if (!window.confirm(`Xác nhận ${actionText} đơn này?`))
      return;

    try {
      await api.put(`/admin/bookings/status/${id}`, { status }, { headers });
      alert(`✅ Đã ${actionText} đơn thành công!`);
      fetchBookings();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span style={{padding: "4px 12px", background: "#fef3c7", color: "#92400e", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>Chờ xác nhận</span>;
      case "paid":
        return <span style={{padding: "4px 12px", background: "#dbeafe", color: "#1e40af", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>Đã thanh toán</span>;
      case "approved":
        return <span style={{padding: "4px 12px", background: "#d1fae5", color: "#065f46", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>Đã duyệt</span>;
      case "completed":
        return <span style={{padding: "4px 12px", background: "#cffafe", color: "#155e75", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>Hoàn thành</span>;
      case "cancelled":
        return <span style={{padding: "4px 12px", background: "#fee2e2", color: "#991b1b", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>Đã hủy</span>;
      default:
        return <span style={{padding: "4px 12px", background: "#f3f4f6", color: "#374151", borderRadius: "12px", fontSize: "14px", fontWeight: 600}}>{status}</span>;
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Đang tải danh sách đặt tour..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🧾 Quản lý Đặt Tour</h1>
              <p className="text-gray-600 mt-1">Quản lý và xử lý đơn đặt tour</p>
            </div>
            <button
              onClick={fetchBookings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🔄 Làm mới
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số người</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      Chưa có đơn đặt tour nào
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{b.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {b.user_id ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">{b.User?.name || "N/A"}</div>
                            <div className="text-sm text-gray-500">{b.User?.email || ""}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {b.guest_name || "Khách chưa đăng nhập"}
                              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Guest</span>
                            </div>
                            <div className="text-sm text-gray-500">{b.guest_email || ""}</div>
                            <div className="text-xs text-gray-400">{b.guest_phone || ""}</div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{b.Tour?.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{b.Tour?.destination || ""}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(b.booking_date).toLocaleDateString("vi-VN")}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.people_count} người</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{Number(b.total_price).toLocaleString()} ₫</div>
                        {b.discount_amount > 0 && (
                          <div className="text-xs text-green-600">Đã giảm {Number(b.discount_amount).toLocaleString()} ₫</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        {b.notes ? (
                          <div className="truncate" title={b.notes}>
                            {b.notes.length > 50 ? `${b.notes.substring(0, 50)}...` : b.notes}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Không có</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(b.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {b.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateStatus(b.id, "paid")}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                            >
                              ✅ Duyệt
                            </button>
                            <button
                              onClick={() => updateStatus(b.id, "cancelled")}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
                            >
                              ❌ Hủy
                            </button>
                          </div>
                        )}
                        {b.status === "paid" && (
                          <button
                            onClick={() => updateStatus(b.id, "completed")}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                          >
                            ✓ Hoàn thành
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
