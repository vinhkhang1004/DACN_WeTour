import React, { useState, useEffect } from 'react';
import { setToastInstance } from '../utils/toast';

// Toast context để quản lý toasts toàn cục
const ToastContext = React.createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration
    };

    setToasts(prev => [...prev, newToast]);

    // Tự động xóa sau duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration) => showToast(message, 'success', duration);
  const showError = (message, duration) => showToast(message, 'error', duration);
  const showWarning = (message, duration) => showToast(message, 'warning', duration);
  const showInfo = (message, duration) => showToast(message, 'info', duration);

  // Set instance để có thể dùng từ bất kỳ đâu
  useEffect(() => {
    const instance = {
      showSuccess: (msg, dur) => showToast(msg, 'success', dur),
      showError: (msg, dur) => showToast(msg, 'error', dur),
      showWarning: (msg, dur) => showToast(msg, 'warning', dur),
      showInfo: (msg, dur) => showToast(msg, 'info', dur),
    };
    setToastInstance(instance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast Container Component
function ToastContainer({ toasts, removeToast }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
        maxWidth: '400px',
        width: '100%'
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// Individual Toast Item
function ToastItem({ toast, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getToastStyles = () => {
    const baseStyles = {
      position: 'relative',
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
      minWidth: '320px',
      maxWidth: '400px',
      pointerEvents: 'auto',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(400px)',
      opacity: isVisible && !isExiting ? 1 : 0,
      backdropFilter: 'blur(10px)',
    };

    const typeStyles = {
      success: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#fff',
        borderLeft: '4px solid #34d399',
      },
      error: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#fff',
        borderLeft: '4px solid #f87171',
      },
      warning: {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: '#fff',
        borderLeft: '4px solid #fbbf24',
      },
      info: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: '#fff',
        borderLeft: '4px solid #60a5fa',
      },
    };

    return { ...baseStyles, ...typeStyles[toast.type] };
  };

  const getIcon = () => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[toast.type] || 'ℹ';
  };

  return (
    <div
      style={getToastStyles()}
      onClick={handleClose}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(0) scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isVisible && !isExiting ? 'translateX(0) scale(1)' : 'translateX(400px)';
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          flexShrink: 0,
          marginTop: '2px',
        }}
      >
        {getIcon()}
      </div>

      {/* Message */}
      <div style={{ flex: 1, lineHeight: '1.5' }}>
        <div style={{ fontSize: '15px', fontWeight: 500, wordBreak: 'break-word' }}>
          {toast.message}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '16px',
          lineHeight: 1,
          flexShrink: 0,
          transition: 'all 0.2s',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.transform = 'rotate(90deg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.transform = 'rotate(0deg)';
        }}
      >
        ×
      </button>

      {/* Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'rgba(255, 255, 255, 0.6)',
            width: '100%',
            animation: `shrink ${toast.duration}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

// Hook để sử dụng toast
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Fallback nếu không có provider
    return {
      showToast: (message, type) => {
        // Fallback to alert nếu không có provider
        alert(message);
      },
      showSuccess: (message) => alert(message),
      showError: (message) => alert(message),
      showWarning: (message) => alert(message),
      showInfo: (message) => alert(message),
    };
  }
  return context;
}

export default ToastProvider;
