import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ToastService from "../Services/toastService";

const ToastNotification = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      closeOnClick
      pauseOnHover
      draggable
    />
  );
};

// Prefer ToastService directly; this helper remains for existing imports.
export const showToast = (message, type = "success") => {
  if (type === "success") return ToastService.success(message);
  if (type === "error") return ToastService.error(message);
  if (type === "warning") return ToastService.warning(message);
  return ToastService.info(message);
};

export default ToastNotification;
