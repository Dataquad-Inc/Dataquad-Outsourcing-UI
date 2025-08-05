import React from "react";
import DynamicFormUltra from "../../components/FormContainer/DynamicFormUltra";
import {
  showSuccessToast,
  showErrorToast,
  showLoadingToast,
  dismissToast,
} from "../../utils/toastUtils";
import hotListUserSections from "./hotListUserSections";
import axios from "axios";



const CREATE_URL = "http://192.168.0.115:8092/hotlist/addConsultant";

const CreateHotListUser = ({
  initialValues = {},
  onCancel,
  onSuccess,
}) => {
const handleSubmit = async (values, formikHelpers) => {
  const { setSubmitting, resetForm } = formikHelpers || {};
  const toastId = showLoadingToast("Creating HotList User...");

  try {
    // Build optional query params
    const params = new URLSearchParams();
    if (values.candidateName) params.append("candidateName", values.candidateName);
    if (values.source) params.append("source", values.source);
    const urlWithParams = `${CREATE_URL}${params.toString() ? `?${params.toString()}` : ""}`;

    // Build FormData
    const formData = new FormData();

    // Append non-file fields
    Object.entries(values).forEach(([key, val]) => {
      if (val === undefined || val === null) return;
      if (key === "resumes" || key === "documents") return;

      if (typeof val === "object" && !(val instanceof File) && !(val instanceof Blob)) {
        formData.append(key, JSON.stringify(val));
      } else {
        formData.append(key, String(val));
      }
    });

    // Helper to append multiple files
    const appendFiles = (fieldName, fileInput) => {
      if (!fileInput) return;
      if (fileInput instanceof File) {
        formData.append(fieldName, fileInput);
      } else if (fileInput instanceof FileList) {
        Array.from(fileInput).forEach(f => formData.append(fieldName, f));
      } else if (Array.isArray(fileInput)) {
        fileInput.forEach(f => {
          if (f instanceof File) formData.append(fieldName, f);
        });
      }
    };

    // Append resumes and documents (backend expects "resumes" and "documents")
    appendFiles("resumes", values.resumes);
    appendFiles("documents", values.documents);

    // Optional debug
    for (let [key, value] of formData.entries()) {
      console.log("formData", key, value);
    }

    // Send with axios
    const response = await axios.post(urlWithParams, formData, {
      // Do NOT set Content-Type; axios sets multipart boundary automatically
    });

    const result = response.data;
    dismissToast(toastId);

    if (!result || !result.success) {
      throw new Error(result?.message || "Creation failed");
    }

    showSuccessToast(result.message || "User created successfully!");

    if (typeof resetForm === "function") {
      resetForm();
    }
    if (typeof onSuccess === "function") {
      onSuccess(result.data, "create");
    }
  } catch (error) {
    dismissToast(toastId);
    showErrorToast(error?.message || "Something went wrong!");
    console.error("Creation Error:", error);
  } finally {
    if (typeof setSubmitting === "function") {
      setSubmitting(false);
    }
  }
};



  return (
    <DynamicFormUltra
      config={hotListUserSections} // minimal / placeholder config; replace if needed
      onSubmit={handleSubmit}
      title="Create a Hotlist Profile"
      initialValues={initialValues}
      onCancel={onCancel}
      submitButtonText="Submit consultant"
    />
  );
};

export default CreateHotListUser;
