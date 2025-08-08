import React, { useEffect } from "react";
import DynamicFormUltra from "../../components/FormContainer/DynamicFormUltra";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import getHotListUserSections from "./hotListUserSections";
import { Box } from "@mui/material";

import { useDispatch, useSelector } from "react-redux";
import { fetchEmployeesUs } from "../../redux/usEmployees";
import {
  createConsultant,
  updateConsultant,
  clearCreateError,
  clearUpdateError,
  selectIsCreating,
  selectIsUpdating,
  selectCreateError,
  selectUpdateError,
} from "../../redux/hotlist"; // Adjust path as needed
import { useNavigate } from "react-router-dom";

const CreateHotListUser = ({ initialValues = {}, onCancel, onSuccess }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Selectors
  const employees = useSelector((state) => state.usEmployees.employees);
  const { role, userId } = useSelector((state) => state.auth);

  // Hotlist specific selectors
  const isCreating = useSelector(selectIsCreating);
  const isUpdating = useSelector(selectIsUpdating);
  const createError = useSelector(selectCreateError);
  const updateError = useSelector(selectUpdateError);

  const isEditMode = Boolean(initialValues.consultantId);
  const isSubmitting = isCreating || isUpdating;
  const currentError = isEditMode ? updateError : createError;

  const formTitle = isEditMode
    ? "Edit Hotlist Profile"
    : "Create a Hotlist Profile";
  const submitButtonText = isEditMode
    ? "Update Consultant"
    : "Submit Consultant";

  // Clear errors on mount and when switching modes
  useEffect(() => {
    if (isEditMode) {
      dispatch(clearUpdateError());
    } else {
      dispatch(clearCreateError());
    }
  }, [dispatch, isEditMode]);

  // Handle error display
  useEffect(() => {
    if (currentError) {
      showErrorToast(currentError);
    }
  }, [currentError]);

  const handleSubmit = async (values, formikHelpers) => {
    console.log("from component - values:", values);
    console.log("from component - consultantId:", values.consultantId);

    const { setSubmitting, resetForm } = formikHelpers || {};

    // Remove unwanted fields globally for both create & update
    const {
      teamleadName,
      recruiterName,
      consultantAddedTimeStamp,
      updatedTimeStamp,
      ...cleanValues
    } = values;

    // Validate consultantId for edit mode
    if (isEditMode && !cleanValues.consultantId) {
      console.error("Missing consultantId for update operation");
      showErrorToast("Missing consultant ID for update operation");
      if (setSubmitting) setSubmitting(false);
      return;
    }

    try {
      let result;

      if (isEditMode) {
        // UPDATE: Send JSON data (no FormData)
        console.log("Updating consultant with ID:", cleanValues.consultantId);

        const updatePayload = {
          ...cleanValues,
          recruiterId: userId, // Include recruiterId in JSON
        };

        // Remove file fields from JSON payload if they exist
        delete updatePayload.resumes;
        delete updatePayload.documents;

        console.log("Update payload (JSON):", updatePayload);

        result = await dispatch(
          updateConsultant({
            consultantId: cleanValues.consultantId,
            consultantDto: updatePayload,
          })
        ).unwrap();

        navigate("/dashboard/hotlist/consultants");
      } else {
        // CREATE: Send FormData (for file uploads)
        console.log("Creating new consultant");

        const appendFiles = (formData, fieldName, fileInput) => {
          if (!fileInput) return;
          if (fileInput instanceof File) {
            formData.append(fieldName, fileInput);
          } else if (fileInput instanceof FileList) {
            Array.from(fileInput).forEach((f) => formData.append(fieldName, f));
          } else if (Array.isArray(fileInput)) {
            fileInput.forEach((f) => {
              if (f instanceof File) formData.append(fieldName, f);
            });
          }
        };

        const createFormData = () => {
          const formData = new FormData();
          formData.append("recruiterId", userId);

          Object.entries(cleanValues).forEach(([key, val]) => {
            if (val === undefined || val === null) return;
            if (key === "resumes" || key === "documents") return;

            if (
              typeof val === "object" &&
              !(val instanceof File) &&
              !(val instanceof Blob)
            ) {
              formData.append(key, JSON.stringify(val));
            } else {
              formData.append(key, String(val));
            }
          });

          appendFiles(formData, "resumes", cleanValues.resumes);
          appendFiles(formData, "documents", cleanValues.documents);

          return formData;
        };

        const formData = createFormData();

        result = await dispatch(
          createConsultant({
            formData,
            candidateName: cleanValues.candidateName,
            source: cleanValues.source,
          })
        ).unwrap();

        navigate("/dashboard/hotlist/consultants");
      }

      const successMessage = isEditMode
        ? result.message || "User updated successfully!"
        : `User created successfully: ${result.data?.name || "Consultant"}`;

      showSuccessToast(successMessage);

      if (typeof resetForm === "function") resetForm();
      if (typeof onSuccess === "function") {
        onSuccess(result.data, isEditMode ? "update" : "create");
      }
    } catch (error) {
      console.error(`${isEditMode ? "Update" : "Create"} Error:`, error);
    } finally {
      if (typeof setSubmitting === "function") {
        setSubmitting(false);
      }
    }
  };

  useEffect(() => {
    dispatch(fetchEmployeesUs(role));
  }, [role, dispatch]);

  // Ensure consultantId is preserved in form initial values
  const formInitialValues = {
    ...initialValues,
    // Explicitly preserve consultantId if it exists
    ...(initialValues.consultantId && {
      consultantId: initialValues.consultantId,
    }),
  };

  return (
    <Box>
      <DynamicFormUltra
        config={getHotListUserSections(employees)} // Pass employees data here
        onSubmit={handleSubmit}
        title={formTitle}
        initialValues={formInitialValues} // Use the enhanced initial values
        onCancel={onCancel}
        submitButtonText={submitButtonText}
        enableReinitialize={true} // Important for edit mode
        isSubmitting={isSubmitting} // Pass loading state to form
      />
    </Box>
  );
};

export default CreateHotListUser;
