import React, { useState } from 'react';

export default function AdvancedSearch({ onSearch, onClose }) {
  const [filters, setFilters] = useState({
    searchTerm: '',
    destination: '',
    minPrice: '',
    maxPrice: '',
    duration: '',
    rating: '',
    category: '',
    startDate: '',
    endDate: '',
    people: 1,
    features: []
  });

  const categories = [
    { id: 'adventure', name: 'Du lịch mạo hiểm', icon: '🏔️' },
    { id: 'cultural', name: 'Văn hóa', icon: '🏛️' },
    { id: 'beach', name: 'Biển đảo', icon: '🏖️' },
    { id: 'mountain', name: 'Núi rừng', icon: '⛰️' },
    { id: 'city', name: 'Thành phố', icon: '🏙️' },
    { id: 'nature', name: 'Thiên nhiên', icon: '🌿' }
  ];

  const features = [
    { id: 'wifi', name: 'WiFi miễn phí', icon: '📶' },
    { id: 'breakfast', name: 'Bữa sáng', icon: '🍳' },
    { id: 'guide', name: 'Hướng dẫn viên', icon: '👨‍🏫' },
    { id: 'transport', name: 'Vận chuyển', icon: '🚌' },
    { id: 'hotel', name: 'Khách sạn', icon: '🏨' },
    { id: 'insurance', name: 'Bảo hiểm', icon: '🛡️' }
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFeatureToggle = (featureId) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(id => id !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      destination: '',
      minPrice: '',
      maxPrice: '',
      duration: '',
      rating: '',
      category: '',
      startDate: '',
      endDate: '',
      people: 1,
      features: []
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">🔍 Tìm kiếm nâng cao</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ khóa tìm kiếm
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Tên tour, địa điểm, mô tả..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Destination and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Điểm đến
              </label>
              <input
                type="text"
                value={filters.destination}
                onChange={(e) => handleFilterChange('destination', e.target.value)}
                placeholder="Nhập điểm đến..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại hình du lịch
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả loại hình</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khoảng giá (VNĐ)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="Giá tối thiểu"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="Giá tối đa"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Duration and Rating */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian
              </label>
              <select
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả thời gian</option>
                <option value="1">1 ngày</option>
                <option value="2-3">2-3 ngày</option>
                <option value="4-7">4-7 ngày</option>
                <option value="8-14">8-14 ngày</option>
                <option value="15+">15+ ngày</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đánh giá tối thiểu
              </label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả đánh giá</option>
                <option value="4">4+ sao</option>
                <option value="3">3+ sao</option>
                <option value="2">2+ sao</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày khởi hành từ
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày khởi hành đến
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={filters.startDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* People Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số người
            </label>
            <select
              value={filters.people}
              onChange={(e) => handleFilterChange('people', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <option key={num} value={num}>{num} người</option>
              ))}
            </select>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiện ích bao gồm
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {features.map(feature => (
                <label
                  key={feature.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    filters.features.includes(feature.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={filters.features.includes(feature.id)}
                    onChange={() => handleFeatureToggle(feature.id)}
                    className="sr-only"
                  />
                  <span className="text-lg mr-2">{feature.icon}</span>
                  <span className="text-sm font-medium">{feature.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={resetFilters}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            🔄 Đặt lại
          </button>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🔍 Tìm kiếm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


