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

const CREATE_URL = "https://mymulya.com/hotlist/addConsultant";
const UPDATE_URL = "https://mymulya.com/hotlist/updateConsultant"; // Add your update endpoint

const CreateHotListUser = ({
  initialValues = {},
  onCancel,
  onSuccess,
}) => {
  const isEditMode = Boolean(initialValues.consultantId);
  const formTitle = isEditMode ? "Edit Hotlist Profile" : "Create a Hotlist Profile";
  const submitButtonText = isEditMode ? "Update Consultant" : "Submit Consultant";

  const handleSubmit = async (values, formikHelpers) => {
    const { setSubmitting, resetForm } = formikHelpers || {};
    const actionText = isEditMode ? "Updating" : "Creating";
    const toastId = showLoadingToast(`${actionText} HotList User...`);

    try {
      let response;
      
      if (isEditMode) {
        // Handle update logic
        const updateUrl = `${UPDATE_URL}/${values.consultantId}`;
        
        // Build FormData for update
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

        // Append resumes and documents
        appendFiles("resumes", values.resumes);
        appendFiles("documents", values.documents);

        response = await axios.put(updateUrl, formData);
      } else {
        // Handle create logic (existing logic)
        const params = new URLSearchParams();
        if (values.candidateName) params.append("candidateName", values.candidateName);
        if (values.source) params.append("source", values.source);
        const urlWithParams = `${CREATE_URL}${params.toString() ? `?${params.toString()}` : ""}`;

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

        appendFiles("resumes", values.resumes);
        appendFiles("documents", values.documents);

        response = await axios.post(urlWithParams, formData);
      }

      const result = response.data;
      dismissToast(toastId);

      if (!result || !result.success) {
        throw new Error(result?.message || `${actionText} failed`);
      }

      const successMessage = isEditMode 
        ? (result.message || "User updated successfully!")
        : (result.message || "User created successfully!");
      
      showSuccessToast(successMessage);

      if (typeof resetForm === "function") {
        resetForm();
      }
      if (typeof onSuccess === "function") {
        onSuccess(result.data, isEditMode ? "update" : "create");
      }
    } catch (error) {
      dismissToast(toastId);
      showErrorToast(error?.message || "Something went wrong!");
      console.error(`${actionText} Error:`, error);
    } finally {
      if (typeof setSubmitting === "function") {
        setSubmitting(false);
      }
    }
  };

  return (
    <DynamicFormUltra
      config={hotListUserSections}
      onSubmit={handleSubmit}
      title={formTitle}
      initialValues={initialValues}
      onCancel={onCancel}
      submitButtonText={submitButtonText}
      enableReinitialize={true} // Important for edit mode
    />
  );
};

export default CreateHotListUser;