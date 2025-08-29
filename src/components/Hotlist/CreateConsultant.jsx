import React, { useEffect, useState } from "react";
import DynamicFormUltra from "../../components/FormContainer/DynamicFormUltra";
import SimpleDocumentsDisplay from "./SimpleDocumentsDisplay";
import { useFormik } from "formik"; // Import useFormik
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import getHotListUserSections from "./hotListUserSections";
import {
  Box,
  Alert,
  Typography,
  Paper,
  Stack,
  Button,
  Collapse,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployeesUs, fetchTeamMembers } from "../../redux/usEmployees";
import {
  createConsultant,
  updateConsultant,
  clearCreateError,
  clearUpdateError,
  selectIsCreating,
  selectIsUpdating,
  selectCreateError,
  selectUpdateError,
} from "../../redux/hotlist";
import { useNavigate } from "react-router-dom";

const CreateHotListUser = ({
  initialValues = {},
  onCancel,
  onSuccess,
  onClose,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDocuments, setShowDocuments] = useState(true);
  const [selectedTeamleadId, setSelectedTeamleadId] = useState(
    initialValues.teamleadId || initialValues.teamLeadId || ""
  );
  

  // State to store predefined options for edit mode
  const [predefinedRecruiters, setPredefinedRecruiters] = useState([]);
  const [predefinedSalesExecutives, setPredefinedSalesExecutives] = useState(
    []
  );

  // Selectors
  const employees = useSelector((state) => state.usEmployees.employees);
  const { role, userId } = useSelector((state) => state.auth);


  // Hotlist specific selectors
  const isCreating = useSelector(selectIsCreating);
  const isUpdating = useSelector(selectIsUpdating);
  const createError = useSelector(selectCreateError);
  const updateError = useSelector(selectUpdateError);
  const recruiters = useSelector((state) => state.usEmployees.recruiters);
  const salesExecutives = useSelector(
    (state) => state.usEmployees.salesExecutives
  );

  const isEditMode = Boolean(initialValues?.consultantId);
  const isSubmitting = isCreating || isUpdating;
  const currentError = isEditMode ? updateError : createError;

  const formTitle = isEditMode
    ? "Edit Hotlist Profile"
    : "Create a Hotlist Profile";
  const submitButtonText = isEditMode
    ? "Update Consultant"
    : "Submit Consultant";

  // When teamleadId changes, fetch recruiters & sales executives
  useEffect(() => {
    dispatch(fetchEmployeesUs("TEAMLEAD"));

    if (selectedTeamleadId) {
      dispatch(fetchTeamMembers(selectedTeamleadId));
    }
  }, [userId, dispatch, selectedTeamleadId]);

  // Handle predefined values for edit mode
  useEffect(() => {
    if (isEditMode && initialValues) {
      // Create predefined options for recruiter if recruiterId exists
      if (initialValues.recruiterId && initialValues.recruiterName) {
        setPredefinedRecruiters([
          {
            userId: initialValues.recruiterId,
            userName: initialValues.recruiterName,
          },
        ]);
      }

      // Create predefined options for sales executive if salesExecutiveId exists
      if (initialValues.salesExecutiveId && initialValues.salesExecutive) {
        setPredefinedSalesExecutives([
          {
            userId: initialValues.salesExecutiveId,
            userName: initialValues.salesExecutive,
          },
        ]);
      }
    }
  }, [isEditMode, initialValues]);

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

  // Enhanced cancel handler
  const handleCancel = () => {
    if (typeof onCancel === "function") {
      onCancel();
    }

    if (typeof onClose === "function") {
      onClose();
    }

    if (isEditMode) {
      dispatch(clearUpdateError());
    } else {
      dispatch(clearCreateError());
    }
  };

  const handleTeamleadChange = (teamLeadId) => {
    setSelectedTeamleadId(teamLeadId);
    // Clear predefined values when team lead changes (only in edit mode)
    if (isEditMode) {
      setPredefinedRecruiters([]);
      setPredefinedSalesExecutives([]);
    }
  };

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
          recruiterId: cleanValues.recruiterId,
        };

        // Remove file fields from JSON payload if they exist
        delete updatePayload.resumes;
        delete updatePayload.documents;

        console.log("Update payload (JSON):", updatePayload);

        result = await dispatch(
          updateConsultant({
            consultantId: cleanValues.consultantId,
            consultantDto: updatePayload,
            isAssignAll: values.isAssignAll ?? false, // send from form values or default
          })
        ).unwrap();
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

  // Enhanced form initial values with better preservation of consultantId
  const formInitialValues = {
    ...initialValues,
    // Explicitly preserve consultantId if it exists
    ...(initialValues?.consultantId && {
      consultantId: initialValues.consultantId,
    }),
    teamLeadId: selectedTeamleadId || initialValues.teamLeadId,
  };

  // Get the effective recruiters and sales executives for the form
  const effectiveRecruiters =
    isEditMode && predefinedRecruiters.length > 0
      ? predefinedRecruiters
      : recruiters;

  const effectiveSalesExecutives =
    isEditMode && predefinedSalesExecutives.length > 0
      ? predefinedSalesExecutives
      : salesExecutives;

  return (
    <Box>
      {/* Show existing documents in edit mode */}
      {isEditMode && formInitialValues?.consultantId && (
        <Box mb={3}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Typography variant="h6" color="primary">
              📄 Existing Documents & Resumes
            </Typography>
            <Button
              size="small"
              onClick={() => setShowDocuments(!showDocuments)}
              variant="outlined"
            >
              {showDocuments ? "Hide" : "Show"} Documents
            </Button>
          </Stack>

          <Collapse in={showDocuments}>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Review and manage uploaded documents for this consultant:
              </Typography>

              <SimpleDocumentsDisplay
                consultantId={formInitialValues.consultantId}
              />
            </Box>
          </Collapse>
        </Box>
      )}

      {/* Main Form */}
      <DynamicFormUltra
        config={getHotListUserSections(
          employees,
          effectiveRecruiters,
          effectiveSalesExecutives,
          handleTeamleadChange,
          isEditMode
        )}
        onSubmit={handleSubmit}
        title={formTitle}
        initialValues={formInitialValues}
        onCancel={handleCancel}
        submitButtonText={submitButtonText}
        enableReinitialize={true}
        isSubmitting={isSubmitting}
        showCancelButton={true}
      />
    </Box>
  );
};

export default CreateHotListUser;
