import React, { useState, useEffect } from 'react';
import api from "../services/api";

export default function NotificationCenter({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Try load from API; fallback to localStorage if fails
      (async () => {
        try {
          const res = await api.get("/notifications/me");
          const data = (res.data || []).map(n => ({
            id: n.id,
            type: n.type || 'info',
            title: n.title,
            message: n.message,
            timestamp: new Date(n.created_at),
            read: !!n.is_read,
          }));
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
        } catch (err) {
          // Silently fail if 401 (unauthorized) - notifications API doesn't require auth
          // This is not a critical error, just means user is not logged in or token expired
          if (err.response?.status === 401) {
            // Don't show error, just use empty notifications
            // Don't clear token here - let critical APIs handle that
            setNotifications([]);
            setUnreadCount(0);
            return;
          }
          // Fallback to localStorage for other errors
          const saved = localStorage.getItem(`notifications_${user.id}`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setNotifications(parsed);
              setUnreadCount(parsed.filter(n => !n.read).length);
            } catch (e) {
              // Invalid data, ignore
            }
          }
        }
      })();
    }
  }, [user]);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      timestamp: new Date(),
      read: false
    };
    
    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    setUnreadCount(prev => prev + 1);
    
    if (user) {
      // Best-effort local cache
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
    }
  };

  const markAsRead = (notificationId) => {
    const updated = notifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    if (user) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
      // Fire-and-forget API update
      api.put(`/notifications/${notificationId}/read`).catch(() => {});
    }
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    
    if (user) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
      api.put(`/notifications/read-all`).catch(() => {});
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    
    if (user) {
      localStorage.removeItem(`notifications_${user.id}`);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      booking: '📋',
      promotion: '🎁',
      reminder: '⏰',
      update: '🔄',
      success: '✅',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || '📢';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Thông báo</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Xóa tất cả
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">🔔</div>
                <p>Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for using notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const showSuccess = (message) => {
    addNotification({
      type: 'success',
      title: 'Thành công',
      message
    });
  };

  const showError = (message) => {
    addNotification({
      type: 'error',
      title: 'Lỗi',
      message
    });
  };

  const showWarning = (message) => {
    addNotification({
      type: 'warning',
      title: 'Cảnh báo',
      message
    });
  };

  const showInfo = (message) => {
    addNotification({
      type: 'info',
      title: 'Thông tin',
      message
    });
  };

  return {
    notifications,
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
