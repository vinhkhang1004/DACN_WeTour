import React from 'react';

export default function LoadingSpinner({ size = 'medium', text = 'Đang tải...' }) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-300 border-t-blue-600`}></div>
      {text && <p className="mt-4 text-gray-600 text-sm">{text}</p>}
    </div>
  );
}


