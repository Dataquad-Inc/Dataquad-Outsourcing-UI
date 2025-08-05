// src/utils/toastUtils.js
import { toast } from 'react-toastify';

export const showSuccessToast = (message) => toast.success(message);
export const showErrorToast = (message) => toast.error(message);
export const showInfoToast = (message) => toast.info(message);
export const showWarningToast = (message) => toast.warning(message);
export const showLoadingToast = (message) => toast.loading(message);
export const dismissToast = (id) => toast.dismiss(id);

// Custom toast configurations
export const customToastConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Toast with custom options
export const showCustomToast = (message, type = 'info', options = {}) => {
  const config = { ...customToastConfig, ...options };
  
  switch (type) {
    case 'success':
      return toast.success(message, config);
    case 'error':
      return toast.error(message, config);
    case 'warning':
      return toast.warning(message, config);
    case 'info':
      return toast.info(message, config);
    default:
      return toast(message, config);
  }
};

// Promise-based toast for async operations
export const showPromiseToast = (promise, messages) => {
  return toast.promise(promise, {
    pending: messages.pending || 'Loading...',
    success: messages.success || 'Success!',
    error: messages.error || 'Something went wrong!',
  });
};