import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { useToast } from '../components/Toast';

export default function TourComparisonEnhanced() {
  const { showError, showSuccess, showWarning } = useToast();
  const [comparisonTours, setComparisonTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  // Get description for Excel (full version)
  const getDescriptionForExcel = (tour) => {
    if (!tour.description) return 'Không có thông tin';
    return tour.description;
  };

  // Get includes as string for Excel
  const getIncludesString = (tour) => {
    const includes = getIncludes(tour);
    if (includes.length === 0) return 'Không có thông tin';
    return includes.join(', ');
  };

  // Get rating text for Excel
  const getRatingText = (tour) => {
    const rating = tour.averageRating || 0;
    const reviewCount = tour.reviewCount || 0;
    return `${rating.toFixed(1)}/5 (${reviewCount} đánh giá)`;
  };

  const saveComparison = () => {
    if (comparisonTours.length === 0) {
      showWarning('Chưa có tour nào để xuất!');
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = [];

      // Header row
      const headerRow = ['Tiêu chí'];
      comparisonTours.forEach(tour => {
        headerRow.push(tour.name);
      });
      excelData.push(headerRow);

      // Giá (Price)
      const priceRow = ['Giá'];
      comparisonTours.forEach(tour => {
        priceRow.push(`${Number(tour.price).toLocaleString('vi-VN')}₫/người`);
      });
      excelData.push(priceRow);

      // Thời lượng (Duration)
      const durationRow = ['Thời lượng'];
      comparisonTours.forEach(tour => {
        durationRow.push(formatDuration(tour.duration));
      });
      excelData.push(durationRow);

      // Lịch trình chính (Main Itinerary)
      const itineraryRow = ['Lịch trình chính'];
      comparisonTours.forEach(tour => {
        itineraryRow.push(getMainItinerary(tour));
      });
      excelData.push(itineraryRow);

      // Bao gồm (Included)
      const includesRow = ['Bao gồm'];
      comparisonTours.forEach(tour => {
        includesRow.push(getIncludesString(tour));
      });
      excelData.push(includesRow);

      // Mô tả (Description)
      const descriptionRow = ['Mô tả'];
      comparisonTours.forEach(tour => {
        descriptionRow.push(getDescriptionForExcel(tour));
      });
      excelData.push(descriptionRow);

      // Đánh giá (Rating)
      const ratingRow = ['Đánh giá'];
      comparisonTours.forEach(tour => {
        ratingRow.push(getRatingText(tour));
      });
      excelData.push(ratingRow);

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Tiêu chí column
        ...comparisonTours.map(() => ({ wch: 50 })) // Tour columns
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'So sánh Tour');

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `So_sanh_tour_${dateStr}.xlsx`;

      // Write and download file
      XLSX.writeFile(wb, filename);
      
      showSuccess('Đã xuất file Excel thành công!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showError('Có lỗi xảy ra khi xuất file Excel!');
    }
  };

  const getRatingStars = (rating) => {
    const numRating = rating || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5 && numRating % 1 < 1;
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400 text-lg">
            ★
          </span>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <span key={i} className="text-yellow-400 text-lg">
            ★
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-gray-300 text-lg">
            ★
          </span>
        );
      }
    }
    return stars;
  };

  // Parse itinerary to get main itinerary points
  const getMainItinerary = (tour) => {
    if (!tour.itinerary) return 'Không có thông tin';
    
    try {
      const itineraryData = JSON.parse(tour.itinerary);
      if (Array.isArray(itineraryData) && itineraryData.length > 0) {
        // Get all itinerary items and join them
        return itineraryData.map(item => item.title || item.description).filter(Boolean).join(', ');
      }
    } catch (e) {
      // If not JSON, try to extract from text
      return tour.itinerary.split('\n').filter(line => line.trim()).join(', ').substring(0, 150);
    }
    return 'Không có thông tin';
  };

  // Parse includes to get list
  const getIncludes = (tour) => {
    if (!tour.includes) return [];
    
    // Try to split by newlines or commas
    if (tour.includes.includes('\n')) {
      return tour.includes.split('\n').filter(item => item.trim());
    }
    if (tour.includes.includes(',')) {
      return tour.includes.split(',').map(item => item.trim()).filter(Boolean);
    }
    return [tour.includes];
  };

  // Get description
  const getDescription = (tour) => {
    if (!tour.description) return 'Không có thông tin';
    // Limit description length for comparison table
    const maxLength = 200;
    if (tour.description.length > maxLength) {
      return tour.description.substring(0, maxLength) + '...';
    }
    return tour.description;
  };

  // Format duration
  const formatDuration = (duration) => {
    if (!duration) return 'Không có thông tin';
    return duration;
  };

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
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="text-6xl mb-6">⚖️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              So sánh các Tour du lịch
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

  // Create array with max 3 slots
  const maxSlots = 3;
  const tourSlots = [...comparisonTours];
  while (tourSlots.length < maxSlots) {
    tourSlots.push(null);
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            So sánh các Tour du lịch
          </h1>
          <p className="text-gray-700 text-lg">
            Chọn tối đa 3 tour để xem chi tiết và tìm ra chuyến đi hoàn hảo cho bạn.
          </p>
        </div>

        {/* Tour Selection Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Chọn tour để so sánh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tourSlots.map((tour, index) => (
              <div key={tour?.id || `empty-${index}`} className="w-full">
                {tour ? (
                  <div className="relative group w-full">
                    <div className="relative h-64 rounded-lg overflow-hidden shadow-md w-full">
                      <img
                        src={tour.image || 'https://via.placeholder.com/400x250?text=Tour+Image'}
                        alt={tour.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg mb-1">{tour.name}</h3>
                        <p className="text-white font-semibold">
                          Từ {Number(tour.price).toLocaleString('vi-VN')}₫
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromComparison(tour.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa tour"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    to="/tours"
                    className="block h-64 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center cursor-pointer w-full"
                  >
                    <div className="text-blue-500 text-5xl mb-3">+</div>
                    <p className="text-gray-600 font-medium">Thêm tour để so sánh</p>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={saveComparison}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-gray-700 font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 2v10h8V6H6z" />
              </svg>
              Lưu bảng so sánh
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-48" />
                  {tourSlots.map((_, index) => (
                    <col key={`col-${index}`} className="w-1/3" />
                  ))}
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-r border-gray-200">
                      Tiêu chí
                    </th>
                    {tourSlots.map((tour, index) => (
                      <th
                        key={tour?.id || `empty-header-${index}`}
                        className="px-6 py-4 text-center text-sm font-semibold text-gray-900"
                      >
                        {tour ? tour.name : 'Chọn tour...'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Giá (Price) */}
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900 border-r border-gray-200">
                      Giá
                    </td>
                    {tourSlots.map((tour, index) => (
                      <td key={tour?.id || `empty-price-${index}`} className="px-6 py-4 text-center">
                        {tour ? (
                          <p className="text-blue-600 font-bold text-lg">
                            {Number(tour.price).toLocaleString('vi-VN')}₫/người
                          </p>
                        ) : null}
                      </td>
                    ))}
                  </tr>

                  {/* Thời lượng (Duration) */}
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900 border-r border-gray-200">
                      Thời lượng
                    </td>
                    {tourSlots.map((tour, index) => (
                      <td key={tour?.id || `empty-duration-${index}`} className="px-6 py-4 text-center text-gray-700">
                        {tour ? formatDuration(tour.duration) : null}
                      </td>
                    ))}
                  </tr>

                  {/* Lịch trình chính (Main Itinerary) */}
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900 border-r border-gray-200">
                      Lịch trình chính
                    </td>
                    {tourSlots.map((tour, index) => (
                      <td key={tour?.id || `empty-itinerary-${index}`} className="px-6 py-4 text-center text-gray-700">
                        {tour ? getMainItinerary(tour) : null}
                      </td>
                    ))}
                  </tr>

                  {/* Bao gồm (Included) */}
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900 border-r border-gray-200 align-top">
                      Bao gồm
                    </td>
                    {tourSlots.map((tour, index) => (
                      <td key={tour?.id || `empty-includes-${index}`} className="px-6 py-4 align-top">
                        {tour ? (
                          getIncludes(tour).length > 0 ? (
                            <div className="flex flex-wrap gap-2 justify-center items-center">
                              {getIncludes(tour).map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm"
                                >
                                  {item.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-gray-500 text-sm">Không có thông tin</p>
                          )
                        ) : null}
                      </td>
                    ))}
                  </tr>

                  {/* Mô tả (Description) */}
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900 border-r border-gray-200 align-top">
                      Mô tả
                    </td>
                    {tourSlots.map((tour, index) => (
                      <td key={tour?.id || `empty-description-${index}`} className="px-6 py-4 text-left text-gray-700 align-top">
                        {tour ? (
                          <p className="text-sm leading-relaxed">
                            {getDescription(tour)}
                          </p>
                        ) : null}
                      </td>
                    ))}
                  </tr>

                  {/* Đánh giá (Rating) */}
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900 border-r border-gray-200">
                      Đánh giá
                    </td>
                    {tourSlots.map((tour, index) => (
                      <td key={tour?.id || `empty-rating-${index}`} className="px-6 py-4 text-center">
                        {tour ? (
                          <>
                            <div className="flex items-center justify-center gap-1 mb-2">
                              {getRatingStars(tour.averageRating || 0)}
                            </div>
                            <span className="text-sm text-gray-600">
                              ({tour.reviewCount || 0} đánh giá)
                            </span>
                          </>
                        ) : null}
                      </td>
                    ))}
                  </tr>

                  {/* Action Buttons */}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 border-r border-gray-200"></td>
                    {tourSlots.map((tour, index) => (
                      <td key={tour?.id || `empty-action-${index}`} className="px-6 py-4 text-center">
                        {tour ? (
                          <Link
                            to={`/tour/${tour.id}`}
                            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            Xem chi tiết
                          </Link>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
