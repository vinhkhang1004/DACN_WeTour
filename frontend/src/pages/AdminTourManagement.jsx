import React, { useEffect, useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminTourManagement() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [toursPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    destination: "",
    price: "",
    duration: "",
    departure_date: "",
    available_dates: [],
    description: "",
    image: "",
    images: [],
    max_people: "",
    category: "",
    categories: [],
    includes: "",
    excludes: "",
    itinerary: "",
    itinerary_days: [{ day: 1, title: "", description: "" }],
    highlights: "",
    latitude: "",
    longitude: ""
  });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchTours();
  }, [searchTerm, sortBy, sortOrder, currentPage]);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        sort: sortBy,
        order: sortOrder,
        page: currentPage,
        limit: toursPerPage
      });

      const response = await api.get(`/admin/tours?${params}`, { headers });
      setTours(response.data);
    } catch (error) {
      console.error("Error fetching tours:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate available_dates
    const validDates = (formData.available_dates || []).filter(d => d && d.trim() !== "");
    console.log('Available dates:', formData.available_dates);
    console.log('Valid dates:', validDates);
    
    if (validDates.length === 0) {
      alert("Vui lòng thêm ít nhất một ngày khởi hành cho tour");
      return;
    }
    
    try {
      // Luôn sử dụng itinerary_days để tạo JSON, bỏ qua formData.itinerary cũ
      const itineraryJson = JSON.stringify(formData.itinerary_days || []);
      
      const payload = {
        name: formData.name,
        destination: formData.destination,
        price: formData.price,
        duration: formData.duration,
        departure_date: formData.departure_date || null,
        available_dates: JSON.stringify(validDates),
        description: formData.description || "",
        image: formData.image || "",
        images: (formData.images || []).join(','),
        max_people: formData.max_people || null,
        category: formData.category || "",
        categories: (formData.categories || []).join(','),
        includes: formData.includes || "",
        excludes: formData.excludes || "",
        itinerary: itineraryJson,
        highlights: formData.highlights || "",
        latitude: formData.latitude || null,
        longitude: formData.longitude || null
      };
      
      console.log('Payload being sent:', payload);
      
      let response;
      if (editingTour) {
        response = await api.put(`/admin/tours/${editingTour.id}`, payload, { headers });
        console.log('Update response:', response.data);
        alert("Cập nhật tour thành công!");
      } else {
        response = await api.post("/admin/tours", payload, { headers });
        console.log('Create response:', response.data);
        alert("Thêm tour mới thành công!");
      }
      
      // Close form and reset
      setShowForm(false);
      setEditingTour(null);
      setFormData({
        name: "",
        destination: "",
        price: "",
        duration: "",
        departure_date: "",
        available_dates: [],
        description: "",
        image: "",
        images: [],
        max_people: "",
        category: "",
        categories: [],
        includes: "",
        excludes: "",
        itinerary: "",
        itinerary_days: [{ day: 1, title: "", description: "" }],
        highlights: "",
        latitude: "",
        longitude: ""
      });
      
      // Reload tours to show updated data
      console.log('Reloading tours...');
      await fetchTours();
      console.log('Tours reloaded');
    } catch (error) {
      console.error("Error saving tour:", error);
      alert("Có lỗi xảy ra khi lưu tour!");
    }
  };

  const handleEdit = (tour) => {
    setEditingTour(tour);
    console.log('Editing tour:', tour);
    console.log('Tour available_dates raw:', tour.available_dates);
    
    // Parse available_dates from JSON or use empty array
    let availableDates = [];
    if (tour.available_dates) {
      try {
        availableDates = JSON.parse(tour.available_dates);
        if (!Array.isArray(availableDates)) availableDates = [];
        console.log('Parsed available_dates:', availableDates);
      } catch (e) {
        console.error('Error parsing available_dates:', e);
        availableDates = [];
      }
    }
    
    setFormData({
      name: tour.name || "",
      destination: tour.destination || "",
      price: tour.price || "",
      duration: tour.duration || "",
      departure_date: tour.departure_date ? tour.departure_date.split('T')[0] : "",
      available_dates: availableDates,
      description: tour.description || "",
      image: tour.image || "",
      images: tour.images ? String(tour.images).split(',').map(s=>s.trim()).filter(Boolean) : [],
      max_people: tour.max_people || "",
      category: tour.category || "",
      categories: tour.categories ? String(tour.categories).split(',').map(s=>s.trim()).filter(Boolean) : [],
      includes: tour.includes || "",
      excludes: tour.excludes || "",
      itinerary: tour.itinerary || "",
      itinerary_days: (()=>{ try { const j = JSON.parse(tour.itinerary); return Array.isArray(j)? j : [{ day:1, title:"", description:""}]; } catch { return [{ day:1, title:"", description:""}]; } })(),
      highlights: tour.highlights || "",
      latitude: tour.latitude || "",
      longitude: tour.longitude || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa tour này?")) return;
    
    try {
      await api.delete(`/admin/tours/${id}`, { headers });
      alert("Xóa tour thành công!");
      fetchTours();
    } catch (error) {
      console.error("Error deleting tour:", error);
      alert("Có lỗi xảy ra khi xóa tour!");
    }
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };


  if (loading) {
    return <LoadingSpinner size="large" text="Đang tải danh sách tour..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎯 Quản lý Tour nâng cao</h1>
              <p className="text-gray-600 mt-1">Quản lý toàn diện các tour du lịch</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ➕ Thêm tour mới
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tên tour, địa điểm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp theo</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at">Ngày tạo</option>
                <option value="name">Tên tour</option>
                <option value="price">Giá</option>
                <option value="views">Lượt xem</option>
                <option value="bookings">Số đặt tour</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Giảm dần</option>
                <option value="asc">Tăng dần</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tours Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày khởi hành
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thống kê
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={tour.image || "https://via.placeholder.com/60x45?text=Tour"}
                          alt={tour.name}
                          className="w-15 h-11 object-cover rounded-lg mr-4"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tour.name}</div>
                          <div className="text-sm text-gray-500">{tour.destination}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tour.duration}</div>
                      <div className="text-sm text-gray-500">{tour.max_people} người</div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        let availableDates = [];
                        if (tour.available_dates) {
                          try {
                            availableDates = JSON.parse(tour.available_dates);
                            if (!Array.isArray(availableDates)) availableDates = [];
                          } catch {
                            availableDates = [];
                          }
                        }
                        
                        if (availableDates.length > 0) {
                          return (
                            <div className="text-sm">
                              {availableDates.slice(0, 2).map((date, idx) => (
                                <div key={idx} className="text-gray-900">
                                  📅 {new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </div>
                              ))}
                              {availableDates.length > 2 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  +{availableDates.length - 2} ngày khác
                                </div>
                              )}
                            </div>
                          );
                        } else if (tour.departure_date) {
                          return (
                            <div className="text-sm text-gray-900">
                              📅 {new Date(tour.departure_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </div>
                          );
                        } else {
                          return <div className="text-xs text-gray-400">Chưa đặt ngày</div>;
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(tour.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>👁️ {tour.views || 0} lượt xem</div>
                      <div>📋 {tour.bookings_count || 0} đặt tour</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(tour)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(tour.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-700">
            Hiển thị {((currentPage - 1) * toursPerPage) + 1} đến {Math.min(currentPage * toursPerPage, tours.length)} của {tours.length} tour
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Trước
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={tours.length < toursPerPage}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Tiếp
            </button>
          </div>
        </div>
      </div>

      {/* Tour Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingTour ? "✏️ Chỉnh sửa tour" : "➕ Thêm tour mới"}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên tour *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa điểm *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá (VND) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian tour *</label>
                  <input
                    type="text"
                    required
                    placeholder="3 ngày 2 đêm"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Các ngày tour khởi hành *</label>
                  <div className="space-y-2">
                    {(formData.available_dates || []).map((date, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => {
                            const newDates = [...formData.available_dates];
                            newDates[idx] = e.target.value;
                            setFormData({...formData, available_dates: newDates});
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newDates = formData.available_dates.filter((_, i) => i !== idx);
                            setFormData({...formData, available_dates: newDates});
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Before add date:', formData.available_dates);
                        // Thêm ngày mặc định là ngày mai
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        const defaultDate = tomorrow.toISOString().split('T')[0];
                        const newDates = [...(formData.available_dates || []), defaultDate];
                        console.log('After add date:', newDates);
                        setFormData({...formData, available_dates: newDates});
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      + Thêm ngày
                    </button>
                    {(!formData.available_dates || formData.available_dates.length === 0) && (
                      <p className="text-sm text-red-600">Vui lòng thêm ít nhất một ngày khởi hành</p>
                    )}
                    {formData.available_dates && formData.available_dates.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        Tổng: {formData.available_dates.filter(d => d && d.trim() !== "").length} ngày
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số người tối đa</label>
                  <input
                    type="number"
                    value={formData.max_people}
                    onChange={(e) => setFormData({...formData, max_people: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
                
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thêm nhiều danh mục (tags)</label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {(formData.categories||[]).map((c, idx)=>(
                      <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {c}
                        <button type="button" className="text-blue-700" onClick={()=>{
                          const arr = [...formData.categories];
                          arr.splice(idx,1);
                          setFormData({...formData, categories: arr});
                        }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input id="catInput" placeholder="Nhập danh mục rồi nhấn Thêm" className="flex-1 px-3 py-2 border border-gray-300 rounded" />
                    <button type="button" className="px-3 py-2 border rounded" onClick={()=>{
                      const inp = document.getElementById('catInput');
                      const v = (inp.value||'').trim();
                      if(!v) return;
                      setFormData({...formData, categories: [ ...(formData.categories||[]), v ]});
                      inp.value='';
                    }}>Thêm</button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.image || ''}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bộ sưu tập ảnh (phân cách bằng dấu phẩy)</label>
                  <input
                    type="url"
                    placeholder="URL ảnh..."
                    onBlur={(e) => {
                      const v = (e.target.value||'').trim();
                      if(!v) return;
                      const url = v.includes(',') ? v : v;
                      const arr = url.split(',').map(s => s.trim()).filter(Boolean);
                      setFormData({...formData, images: arr});
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ✅ Bao gồm
                    <span className="text-xs text-gray-500 ml-2">(Mỗi dòng là một mục)</span>
                  </label>
                  <textarea
                    rows={6}
                    value={formData.includes}
                    onChange={(e) => setFormData({...formData, includes: e.target.value})}
                    placeholder="Vé tham quan các điểm du lịch&#10;Xe đưa đón sân bay&#10;Hướng dẫn viên tiếng Việt&#10;Bảo hiểm du lịch&#10;Nước uống trên xe&#10;Phí dịch vụ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ❌ Không bao gồm
                    <span className="text-xs text-gray-500 ml-2">(Mỗi dòng là một mục)</span>
                  </label>
                  <textarea
                    rows={6}
                    value={formData.excludes}
                    onChange={(e) => setFormData({...formData, excludes: e.target.value})}
                    placeholder="Chi phí cá nhân&#10;Đồ uống có cồn&#10;Tiền tip cho hướng dẫn viên&#10;Chi phí phát sinh ngoài chương trình&#10;Bảo hiểm cá nhân bổ sung"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lịch trình theo ngày</label>
                <div className="space-y-3">
                  {(formData.itinerary_days||[]).map((d, idx)=>(
                    <div key={idx} className="border rounded p-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 items-center">
                        <input type="number" min={1} value={d.day} onChange={(e)=>{
                          const arr=[...formData.itinerary_days]; arr[idx]={...arr[idx], day: Number(e.target.value)||1}; setFormData({...formData, itinerary_days: arr});
                        }} className="px-2 py-1 border rounded" />
                        <input placeholder="Tiêu đề" value={d.title} onChange={(e)=>{
                          const arr=[...formData.itinerary_days]; arr[idx]={...arr[idx], title: e.target.value}; setFormData({...formData, itinerary_days: arr});
                        }} className="md:col-span-3 px-2 py-1 border rounded" />
                      </div>
                      <textarea rows={3} placeholder="Mô tả" value={d.description} onChange={(e)=>{
                        const arr=[...formData.itinerary_days]; arr[idx]={...arr[idx], description: e.target.value}; setFormData({...formData, itinerary_days: arr});
                      }} className="w-full px-2 py-1 border rounded"></textarea>
                      <div className="flex justify-end mt-2">
                        <button type="button" className="text-red-600" onClick={()=>{
                          const arr=[...formData.itinerary_days]; arr.splice(idx,1); setFormData({...formData, itinerary_days: arr.length?arr:[{day:1,title:"",description:""}]});
                        }}>Xoá ngày</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="px-3 py-1 border rounded" onClick={()=>{
                    setFormData({...formData, itinerary_days:[...(formData.itinerary_days||[]), { day:(formData.itinerary_days?.length||0)+1, title:"", description:"" }]});
                  }}>+ Thêm ngày</button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Điểm nổi bật</label>
                <textarea
                  rows={3}
                  value={formData.highlights}
                  onChange={(e) => setFormData({...formData, highlights: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📍 Vị trí trên bản đồ</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Latitude (Vĩ độ)</label>
                    <input
                      type="number"
                      step="0.00000001"
                      placeholder="21.0285"
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Longitude (Kinh độ)</label>
                    <input
                      type="number"
                      step="0.00000001"
                      placeholder="105.8542"
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>💡 Cách lấy tọa độ:</p>
                  <ol className="list-decimal ml-5 mt-1 space-y-1">
                    <li>Mở Google Maps: <a href="https://www.google.com/maps" target="_blank" className="text-blue-600 hover:underline">https://www.google.com/maps</a></li>
                    <li>Tìm kiếm địa điểm (ví dụ: "Hà Nội")</li>
                    <li>Click chuột phải vào vị trí → Chọn tọa độ đầu tiên (sẽ copy vào clipboard)</li>
                    <li>Dán vào ô Latitude, sau dấu phẩy là Longitude</li>
                  </ol>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTour(null);
                    setFormData({
                      name: "",
                      destination: "",
                      price: "",
                      duration: "",
                      departure_date: "",
                      available_dates: [],
                      description: "",
                      image: "",
                      images: [],
                      max_people: "",
                      category: "",
                      categories: [],
                      includes: "",
                      excludes: "",
                      itinerary: "",
                      itinerary_days: [{ day: 1, title: "", description: "" }],
                      highlights: "",
                      latitude: "",
                      longitude: ""
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTour ? "Cập nhật tour" : "Thêm tour"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
