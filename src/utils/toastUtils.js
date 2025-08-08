// src/utils/toastUtils.js
import { toast } from 'react-toastify';
import React from 'react';
import CustomToast from './CustomToast';

export const showSuccessToast = (message, options = {}) =>
  toast(<CustomToast message={message} type="success" />, { ...customToastConfig, ...options });

export const showErrorToast = (message, options = {}) =>
  toast(<CustomToast message={message} type="error" />, { ...customToastConfig, ...options });

export const showInfoToast = (message, options = {}) =>
  toast(<CustomToast message={message} type="info" />, { ...customToastConfig, ...options });

export const showWarningToast = (message, options = {}) =>
  toast(<CustomToast message={message} type="warning" />, { ...customToastConfig, ...options });

export const showLoadingToast = (message) => toast.loading(message);

export const dismissToast = (id) => toast.dismiss(id);

export const customToastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// General custom toast
export const showCustomToast = (message, type = 'info', options = {}) => {
  const config = { ...customToastConfig, ...options };
  return toast(<CustomToast message={message} type={type} />, config);
};

// Promise-based toast
export const showPromiseToast = (promise, messages) => {
  return toast.promise(promise, {
    pending: messages.pending || 'Loading...',
    success: {
      render({ data }) {
        return <CustomToast message={messages.success || "Success!"} type="success" />;
      },
    },
    error: {
      render({ data }) {
        return <CustomToast message={messages.error || "Something went wrong!"} type="error" />;
      },
    },
  });
};
