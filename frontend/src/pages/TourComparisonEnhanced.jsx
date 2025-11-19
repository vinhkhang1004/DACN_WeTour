import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function TourComparisonEnhanced() {
  const [comparisonTours, setComparisonTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedComparison = localStorage.getItem('comparisonTours');
    if (savedComparison) {
      const tours = JSON.parse(savedComparison);
      setComparisonTours(tours);
    }
    setLoading(false);
  }, []);

  const removeFromComparison = (tourId) => {
    const newComparison = comparisonTours.filter(tour => tour.id !== tourId);
    setComparisonTours(newComparison);
    localStorage.setItem('comparisonTours', JSON.stringify(newComparison));
  };

  const clearComparison = () => {
    setComparisonTours([]);
    localStorage.removeItem('comparisonTours');
  };

  const getRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-lg ${
            i <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const getFeatureIcon = (feature) => {
    const icons = {
      wifi: '📶',
      breakfast: '🍳',
      guide: '👨‍🏫',
      transport: '🚌',
      hotel: '🏨',
      insurance: '🛡️',
      meals: '🍽️',
      entrance: '🎫'
    };
    return icons[feature] || '✓';
  };

  const features = [
    { key: 'wifi', name: 'WiFi miễn phí' },
    { key: 'breakfast', name: 'Bữa sáng' },
    { key: 'guide', name: 'Hướng dẫn viên' },
    { key: 'transport', name: 'Vận chuyển' },
    { key: 'hotel', name: 'Khách sạn' },
    { key: 'insurance', name: 'Bảo hiểm' },
    { key: 'meals', name: 'Bữa ăn' },
    { key: 'entrance', name: 'Vé tham quan' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (comparisonTours.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="text-6xl mb-6">⚖️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              So sánh tour
            </h1>
            <p className="text-gray-600 mb-8">
              Bạn chưa có tour nào để so sánh. Hãy thêm ít nhất 2 tour để bắt đầu so sánh.
            </p>
            <Link
              to="/tours"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Khám phá tour ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              So sánh {comparisonTours.length} tour
            </h1>
            <button
              onClick={clearComparison}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              🗑️ Xóa tất cả
            </button>
          </div>
          <p className="text-gray-600">
            So sánh chi tiết các tour để đưa ra lựa chọn tốt nhất
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-48">
                    Tiêu chí
                  </th>
                  {comparisonTours.map((tour) => (
                    <th key={tour.id} className="px-6 py-4 text-center w-80">
                      <div className="relative">
                        <button
                          onClick={() => removeFromComparison(tour.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                        <div className="space-y-3">
                          <img
                            src={tour.image || 'https://via.placeholder.com/300x200?text=Tour+Image'}
                            alt={tour.name}
                            className="w-full h-32 object-cover rounded-lg"
                            loading="lazy"
                          />
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {tour.name}
                          </h3>
                          <p className="text-blue-600 font-bold text-lg">
                            {Number(tour.price).toLocaleString()} ₫
                          </p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Basic Info */}
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Điểm đến</td>
                  {comparisonTours.map((tour) => (
                    <td key={tour.id} className="px-6 py-4 text-center text-gray-700">
                      📍 {tour.destination}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Thời gian</td>
                  {comparisonTours.map((tour) => (
                    <td key={tour.id} className="px-6 py-4 text-center text-gray-700">
                      ⏱️ {tour.duration}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Số người tối đa</td>
                  {comparisonTours.map((tour) => (
                    <td key={tour.id} className="px-6 py-4 text-center text-gray-700">
                      👥 {tour.maxPeople || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Đánh giá</td>
                  {comparisonTours.map((tour) => (
                    <td key={tour.id} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-1">
                        {getRatingStars(tour.averageRating || 0)}
                        <span className="ml-2 text-sm text-gray-600">
                          ({tour.reviewCount || 0})
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Features */}
                {features.map((feature) => (
                  <tr key={feature.key}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {getFeatureIcon(feature.key)} {feature.name}
                    </td>
                    {comparisonTours.map((tour) => (
                      <td key={tour.id} className="px-6 py-4 text-center">
                        <span className={`text-lg ${
                          tour.features?.includes(feature.key) ? 'text-green-500' : 'text-gray-300'
                        }`}>
                          {tour.features?.includes(feature.key) ? '✓' : '✗'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Description */}
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Mô tả</td>
                  {comparisonTours.map((tour) => (
                    <td key={tour.id} className="px-6 py-4 text-center text-gray-700 text-sm">
                      {tour.description?.substring(0, 100) || 'Không có mô tả'}...
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Hành động</td>
                  {comparisonTours.map((tour) => (
                    <td key={tour.id} className="px-6 py-4 text-center">
                      <Link
                        to={`/tour/${tour.id}`}
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-3">💰 Giá tốt nhất</h3>
            {(() => {
              const cheapest = comparisonTours.reduce((min, tour) => 
                tour.price < min.price ? tour : min
              );
              return (
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {Number(cheapest.price).toLocaleString()} ₫
                  </p>
                  <p className="text-sm text-gray-600">{cheapest.name}</p>
                </div>
              );
            })()}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-3">⭐ Đánh giá cao nhất</h3>
            {(() => {
              const highestRated = comparisonTours.reduce((max, tour) => 
                (tour.averageRating || 0) > (max.averageRating || 0) ? tour : max
              );
              return (
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {highestRated.averageRating?.toFixed(1) || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">{highestRated.name}</p>
                </div>
              );
            })()}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-3">⏱️ Thời gian ngắn nhất</h3>
            {(() => {
              const shortest = comparisonTours.reduce((min, tour) => {
                const minDuration = parseInt(tour.duration) || 999;
                const currentDuration = parseInt(min.duration) || 999;
                return minDuration < currentDuration ? tour : min;
              });
              return (
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {shortest.duration}
                  </p>
                  <p className="text-sm text-gray-600">{shortest.name}</p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
