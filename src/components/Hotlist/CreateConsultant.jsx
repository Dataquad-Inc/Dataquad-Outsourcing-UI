import React, { useEffect, useMemo, useState } from "react";
import DynamicFormUltra from "../../components/FormContainer/DynamicFormUltra";
import SimpleDocumentsDisplay from "./SimpleDocumentsDisplay";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import getHotListUserSections from "./hotListUserSections";
import { Box, Typography, Stack, Button, Collapse } from "@mui/material";
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

  const [predefinedRecruiters, setPredefinedRecruiters] = useState([]);
  const [predefinedSalesExecutives, setPredefinedSalesExecutives] = useState(
    []
  );

  const employees = useSelector((state) => state.usEmployees.employees);
  const { role, userId } = useSelector((state) => state.auth);

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

  // Fetch team leads and team members
  useEffect(() => {
    dispatch(fetchEmployeesUs("TEAMLEAD"));
    if (selectedTeamleadId) {
      dispatch(fetchTeamMembers(selectedTeamleadId));
    }
  }, [userId, dispatch, selectedTeamleadId]);

  // Predefined values for edit mode
  useEffect(() => {
    if (isEditMode && initialValues) {
      if (initialValues.recruiterId && initialValues.recruiterName) {
        setPredefinedRecruiters([
          {
            userId: initialValues.recruiterId,
            userName: initialValues.recruiterName,
          },
        ]);
      }
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

  // Clear errors
  useEffect(() => {
    if (isEditMode) {
      dispatch(clearUpdateError());
    } else {
      dispatch(clearCreateError());
    }
  }, [dispatch, isEditMode]);

  // Show error toasts
  useEffect(() => {
    if (currentError) {
      showErrorToast(currentError);
    }
  }, [currentError]);

  const handleCancel = () => {
    if (typeof onCancel === "function") onCancel();
    if (typeof onClose === "function") onClose();

    if (isEditMode) {
      dispatch(clearUpdateError());
    } else {
      dispatch(clearCreateError());
    }
  };

  const handleTeamleadChange = (teamLeadId) => {
    setSelectedTeamleadId(teamLeadId);
    if (isEditMode) {
      setPredefinedRecruiters([]);
      setPredefinedSalesExecutives([]);
    }
  };

  // ---------- FormData Builder ----------

  // Robustly normalizes any shape a file field might hand us
  // (File, FileList, real Array, or an array-like / plain object such as
  // {0: File, 1: File, length: 2}) down to a flat array of File instances.
  // Anything that isn't an actual File instance (e.g. leftover document
  // metadata like `{}` from the server) is filtered out here so it can
  // never leak into the multipart payload as a bogus part.
  const normalizeToFileArray = (fileInput) => {
    if (!fileInput) return [];

    if (fileInput instanceof File) {
      return [fileInput];
    }

    if (fileInput instanceof FileList) {
      return Array.from(fileInput);
    }

    if (Array.isArray(fileInput)) {
      return fileInput.filter((f) => f instanceof File);
    }

    if (typeof fileInput === "object") {
      return Object.values(fileInput).filter((f) => f instanceof File);
    }

    return [];
  };

  const appendFiles = (formData, fieldName, fileInput) => {
    const files = normalizeToFileArray(fileInput);
    files.forEach((f) => formData.append(fieldName, f, f.name));
    return files.length;
  };

  const buildFormData = (values) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, val]) => {
      // Skip empty, files (handled separately), and server-managed fields
      if (val === undefined || val === null) return;
      if (key === "resumes" || key === "documents") return;
      if (key === "consultantId") return; // goes in URL path, not body
      if (key === "teamleadName") return;
      if (key === "recruiterName") return;
      if (key === "consultantAddedTimeStamp") return;
      if (key === "updatedTimeStamp") return;
      if (key === "isAssignAll") return; // sent as query param

      // For @ModelAttribute binding:
      // - Primitives (string/number/boolean) → plain string
      // - Complex objects/arrays → JSON string (backend should parse)
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

    // Append files LAST with exact field names backend expects
    const resumeCount = appendFiles(formData, "resumes", values.resumes);
    const documentCount = appendFiles(formData, "documents", values.documents);

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log(
        `[FormData] Attached ${resumeCount} resume(s), ${documentCount} document(s)`
      );
    }

    return formData;
  };

  const handleSubmit = async (values, formikHelpers) => {
    const { setSubmitting, resetForm } = formikHelpers || {};

    const consultantId = values.consultantId;

    if (isEditMode && !consultantId) {
      showErrorToast("Missing consultant ID for update operation");
      if (setSubmitting) setSubmitting(false);
      return;
    }

    try {
      const formData = buildFormData(values);

      // Debug: verify FormData contents
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-restricted-syntax
        for (const pair of formData.entries()) {
          // eslint-disable-next-line no-console
          console.log("[FormData]", pair[0], pair[1]);
        }
      }

      let result;

      if (isEditMode) {
        result = await dispatch(
          updateConsultant({
            consultantId,
            consultantDto: formData,
            isAssignAll: values.isAssignAll ?? false,
          })
        ).unwrap();
      } else {
        result = await dispatch(
          createConsultant({
            formData,
            candidateName: values.candidateName,
            source: values.source,
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
      // Error toast already handled by currentError effect
      // eslint-disable-next-line no-console
      console.error(`${isEditMode ? "Update" : "Create"} Error:`, error);
    } finally {
      if (typeof setSubmitting === "function") {
        setSubmitting(false);
      }
    }
  };

  // Memoized so this object only gets a new identity when values that
  // should actually trigger a form reinitialize change (initialValues
  // itself, or the selected team lead). DynamicFormUltra runs with
  // enableReinitialize: true, so an unstable object reference here would
  // reset the whole form — including a resume the user already picked —
  // on every unrelated re-render of this component.
  //
  // `resumes` / `documents` are also stripped out here: those keys, when
  // present on initialValues, hold existing-document METADATA returned by
  // the API (shown separately via SimpleDocumentsDisplay below), never
  // real File objects. The file fields must always start empty so
  // DynamicFormUltra only ever populates them with freshly selected Files.
  const formInitialValues = useMemo(() => {
    const {
      resumes: _existingResumes,
      documents: _existingDocuments,
      ...restInitialValues
    } = initialValues;

    return {
      ...restInitialValues,
      ...(initialValues?.consultantId && {
        consultantId: initialValues.consultantId,
      }),
      teamLeadId: selectedTeamleadId || initialValues.teamLeadId,
    };
  }, [initialValues, selectedTeamleadId]);

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