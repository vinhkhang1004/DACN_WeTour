import React, { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_amount: "0",
    max_discount: "",
    valid_from: "",
    valid_to: "",
    category: "all",
    service_type: "all", // all, tour, hotel, flight
    image: "",
    is_active: true,
    usage_limit: ""
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/promotions", { params: { limit: 100, showAll: true } });
      setPromotions(response.data.promotions || response.data || []);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      alert("Không thể tải danh sách khuyến mãi!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        title: formData.title,
        description: formData.description || "",
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_amount: parseFloat(formData.min_amount || 0),
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to,
        category: formData.category || "all",
        service_type: formData.service_type || "all",
        image: formData.image || "",
        is_active: formData.is_active === "true" || formData.is_active === true,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
      };

      console.log("Submitting promotion data:", data);

      if (editingPromo) {
        await api.put(`/promotions/${editingPromo.id}`, data, { headers });
        alert("✅ Cập nhật mã khuyến mãi thành công!");
      } else {
        await api.post("/promotions", data, { headers });
        alert("✅ Tạo mã khuyến mãi thành công!");
      }

      setShowForm(false);
      setEditingPromo(null);
      setFormData({
        title: "",
        description: "",
        code: "",
        discount_type: "percentage",
        discount_value: "",
        min_amount: "0",
        max_discount: "",
        valid_from: "",
        valid_to: "",
        category: "all",
        service_type: "all",
        image: "",
        is_active: true,
        usage_limit: ""
      });
      fetchPromotions();
    } catch (error) {
      console.error("Error saving promotion:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra khi lưu mã khuyến mãi!");
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      ...promo,
      service_type: promo.service_type || "all",
      is_active: promo.is_active ? "true" : "false"
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa mã khuyến mãi này?")) return;
    try {
      await api.delete(`/promotions/${id}`, { headers });
      alert("✅ Xóa mã khuyến mãi thành công!");
      fetchPromotions();
    } catch (error) {
      console.error("Error deleting promotion:", error);
      alert("Có lỗi xảy ra khi xóa mã khuyến mãi!");
    }
  };

  const getStatusBadge = (promo) => {
    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validTo = new Date(promo.valid_to);

    if (!promo.is_active) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Đã tắt</span>;
    }

    if (now < validFrom) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Chưa bắt đầu</span>;
    }

    if (now > validTo) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Hết hạn</span>;
    }

    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Đang hoạt động</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Đang tải danh sách khuyến mãi..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎁 Quản lý Mã khuyến mãi</h1>
              <p className="text-gray-600 mt-1">Tạo và quản lý các mã giảm giá, ưu đãi</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingPromo(null);
                setFormData({
                  title: "",
                  description: "",
                  code: "",
                  discount_type: "percentage",
                  discount_value: "",
                  min_amount: "0",
                  max_discount: "",
                  valid_from: "",
                  valid_to: "",
                  category: "all",
                  service_type: "all",
                  image: "",
                  is_active: true,
                  usage_limit: ""
                });
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ➕ Tạo mã mới
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Promotions Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã/Tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Áp dụng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sử dụng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      Chưa có mã khuyến mãi nào
                    </td>
                  </tr>
                ) : (
                  promotions.map((promo) => (
                    <tr key={promo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-blue-600">
                              {promo.code}
                            </div>
                            <div className="text-sm text-gray-900">{promo.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {promo.discount_type === "percentage" ? (
                            <span className="font-medium text-green-600">
                              -{promo.discount_value}%
                            </span>
                          ) : (
                            <span className="font-medium text-green-600">
                              -{formatCurrency(promo.discount_value)}
                            </span>
                          )}
                        </div>
                        {promo.max_discount && promo.discount_type === "percentage" && (
                          <div className="text-xs text-gray-500">
                            Tối đa {formatCurrency(promo.max_discount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Đơn tối thiểu: {formatCurrency(promo.min_amount)}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {promo.service_type === "all" ? "Tất cả dịch vụ" : 
                           promo.service_type === "tour" ? "Tour du lịch" :
                           promo.service_type === "hotel" ? "Khách sạn" :
                           promo.service_type === "flight" ? "Chuyến bay" :
                           promo.service_type === "tour_hotel" ? "Combo: Tour + Khách sạn" :
                           promo.service_type === "tour_flight" ? "Combo: Tour + Chuyến bay" :
                           promo.service_type === "hotel_flight" ? "Combo: Khách sạn + Chuyến bay" : "Tất cả"}
                        </div>
                        <div className="text-xs text-gray-400 capitalize mt-1">
                          {promo.category === "all" ? "Tất cả" : promo.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{new Date(promo.valid_from).toLocaleDateString("vi-VN")}</div>
                        <div className="text-gray-500">→ {new Date(promo.valid_to).toLocaleDateString("vi-VN")}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(promo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {promo.usage_count || 0} / {promo.usage_limit || "∞"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(promo)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingPromo ? "✏️ Chỉnh sửa mã khuyến mãi" : "➕ Tạo mã khuyến mãi mới"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên khuyến mãi *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mã khuyến mãi *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VÍ DỤ: GIAMGIA50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại giảm giá *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (₫)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá trị giảm giá * 
                    <span className="text-xs text-gray-500 ml-2">
                      ({formData.discount_type === "percentage" ? "%" : "VND"})
                    </span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {formData.discount_type === "percentage" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giảm tối đa (₫)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({...formData, max_discount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Không giới hạn"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đơn tối thiểu (₫)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({...formData, min_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giới hạn sử dụng</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Không giới hạn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Áp dụng cho *</label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="all">Tất cả dịch vụ</option>
                    <option value="tour">Tour du lịch</option>
                    <option value="hotel">Khách sạn</option>
                    <option value="flight">Chuyến bay</option>
                    <option value="tour_hotel">Combo: Tour + Khách sạn</option>
                    <option value="tour_flight">Combo: Tour + Chuyến bay</option>
                    <option value="hotel_flight">Combo: Khách sạn + Chuyến bay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tất cả</option>
                    <option value="domestic">Trong nước</option>
                    <option value="international">Quốc tế</option>
                    <option value="combo">Combo</option>
                    <option value="early">Đặt sớm</option>
                    <option value="special">Đặc biệt</option>
                    <option value="flash">Flash sale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <select
                    value={formData.is_active ? "true" : "false"}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === "true"})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Kích hoạt</option>
                    <option value="false">Tắt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    required
                    value={formData.valid_from}
                    onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc *</label>
                  <input
                    type="date"
                    required
                    value={formData.valid_to}
                    onChange={(e) => setFormData({...formData, valid_to: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh banner (URL)</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPromo(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPromo ? "Cập nhật" : "Tạo mã"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

