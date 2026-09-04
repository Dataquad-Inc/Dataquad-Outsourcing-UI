// src/utils/toastUtils.js
// Compatibility facade — prefer ToastService for new code.
import ToastService from "../Services/toastService";

export const showSuccessToast = (message, options = {}) =>
  ToastService.success(message, options);

export const showErrorToast = (message, options = {}) =>
  ToastService.error(message, options);

export const showInfoToast = (message, options = {}) =>
  ToastService.info(message, options);

export const showWarningToast = (message, options = {}) =>
  ToastService.warning?.(message, options) || ToastService.info(message, options);

export const showLoadingToast = (message) => ToastService.loading(message);

export const dismissToast = (id) => ToastService.dismiss(id);

export const customToastConfig = {
  position: "top-right",
  autoClose: 2000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

export const showCustomToast = (message, type = "info", options = {}) => {
  if (type === "success") return ToastService.success(message, options);
  if (type === "error") return ToastService.error(message, options);
  if (type === "warning") return showWarningToast(message, options);
  return ToastService.info(message, options);
};

export const showPromiseToast = (promise, messages) => {
  const toastId = ToastService.loading(messages.pending || "Loading...");
  return promise
    .then((data) => {
      ToastService.update?.(toastId, messages.success || "Success!", "success") ||
        ToastService.success(messages.success || "Success!");
      ToastService.dismiss(toastId);
      return data;
    })
    .catch((err) => {
      ToastService.update?.(toastId, messages.error || "Something went wrong!", "error") ||
        ToastService.error(messages.error || "Something went wrong!");
      ToastService.dismiss(toastId);
      throw err;
    });
};
