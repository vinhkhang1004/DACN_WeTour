// Utility để hiển thị toast từ bất kỳ đâu
// Sử dụng singleton pattern để có thể gọi từ bất kỳ đâu

let toastInstance = null;

export const setToastInstance = (instance) => {
  toastInstance = instance;
};

export const toast = {
  success: (message, duration) => {
    if (toastInstance) {
      toastInstance.showSuccess(message, duration);
    } else {
      // Fallback nếu chưa có instance
      console.log('✅', message);
    }
  },
  error: (message, duration) => {
    if (toastInstance) {
      toastInstance.showError(message, duration);
    } else {
      console.error('❌', message);
    }
  },
  warning: (message, duration) => {
    if (toastInstance) {
      toastInstance.showWarning(message, duration);
    } else {
      console.warn('⚠️', message);
    }
  },
  info: (message, duration) => {
    if (toastInstance) {
      toastInstance.showInfo(message, duration);
    } else {
      console.info('ℹ️', message);
    }
  },
};

// Export default để dễ import
export default toast;

