// ToastService.js
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Track recent toasts to prevent duplicates
const recentToasts = new Map();
const DUPLICATE_THRESHOLD = 1000; // milliseconds

/**
 * Check if a toast with the same message was shown recently
 */
const isDuplicate = (message, type) => {
  const key = `${type}-${message}`;
  const lastShown = recentToasts.get(key);
  const now = Date.now();
  
  if (lastShown && (now - lastShown) < DUPLICATE_THRESHOLD) {
    return true;
  }
  
  recentToasts.set(key, now);
  
  // Clean up old entries
  if (recentToasts.size > 50) {
    const entriesToDelete = [];
    recentToasts.forEach((timestamp, key) => {
      if (now - timestamp > DUPLICATE_THRESHOLD) {
        entriesToDelete.push(key);
      }
    });
    entriesToDelete.forEach(key => recentToasts.delete(key));
  }
  
  return false;
};

const defaultOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

const ToastService = {
  success: (message, options = {}) => {
    if (!isDuplicate(message, 'success')) {
      toast.success(message, { ...defaultOptions, ...options });
    }
  },

  error: (message, options = {}) => {
    if (!isDuplicate(message, 'error')) {
      toast.error(message, { 
        ...defaultOptions, 
        ...options,
        autoClose: options.autoClose || 5000
      });
    }
  },

  info: (message, options = {}) => {
    if (!isDuplicate(message, 'info')) {
      toast.info(message, { ...defaultOptions, ...options });
    }
  },

  warning: (message, options = {}) => {
    if (!isDuplicate(message, 'warning')) {
      toast.warning(message, { ...defaultOptions, ...options });
    }
  },

  loading: (message = "Loading...", options = {}) => {
    // Loading toasts should always show (for update pattern)
    return toast.loading(message, { 
      ...defaultOptions, 
      ...options,
      autoClose: false
    });
  },

  update: (toastId, message, type = 'success', options = {}) => {
    toast.update(toastId, {
      render: message,
      type: type,
      isLoading: false,
      ...defaultOptions,
      ...options,
      autoClose: options.autoClose || 3000
    });
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  },

  custom: (component, options = {}) => {
    toast(component, { ...defaultOptions, ...options });
  }
};

export default ToastService;