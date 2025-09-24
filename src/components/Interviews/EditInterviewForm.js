import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  IconButton,
  Divider,
  Card,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import DynamicForm from "../FormContainer/DynamicForm";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { Check } from "lucide-react";
import httpService from "../../Services/httpService";
import { formatDateTime } from "../../utils/dateformate";

const EditInterviewForm = ({ 
  data, 
  onClose, 
  onSuccess, 
  showCoordinatorFields = true, 
  showStatusAndLevel = true 
}) => {
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { userId, email, userName, role } = useSelector((state) => state.auth);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [interviewResponse, setInterviewResponse] = useState(null);
  const [coordinators, setCoordinators] = useState([]);

  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        const res = await httpService.get(
          "/users/employee?excludeRoleName=EMPLOYEE"
        );
        setCoordinators(
          res.data.map((emp) => ({
            value: emp.employeeId,
            label: emp.userName,
          }))
        );
      } catch (err) {
        console.error("Error fetching coordinators:", err);
      }
    };

    fetchCoordinators();
  }, []);

  const getInitialValues = () => {
    if (!data) return {};

    return {
      candidateId: data.candidateId || "",
      clientEmail: data.clientEmail || [],
      clientName: data.clientName || "",
      duration: data.duration || 30,
      externalInterviewDetails: data.externalInterviewDetails || "",
      fullName: data.fullName || data.candidateFullName || "",
      interviewLevel: data.interviewLevel,
      interviewId: data.interviewId,
      interviewStatus: data.latestInterviewStatus || "SCHEDULED",
      internalFeedback: data.internalFeedback || "",
      jobId: data.jobId || "",
      skipNotification: data.skipNotification || false,
      userId: data.userId || userId || "",
      userEmail: data.email || email || "",
      zoomLink: data.zoomLink || "",
      candidateEmailId: data.emailId || data.candidateEmailId || "",
      contactNumber: data.contactNumber || data.candidateContactNo || "",
      coordinator: data.coordinator || userName,
      assignedTo: data.assignedTo || userId || "",
      comments: data.comments || "",
    };
  };

  const getFormFields = (values) => {
    const commonGridProps = { xs: 12, md: 6, lg: 6, xl: 4 };

    // Status options for all views
    const statusOptions = [
      { value: "SCHEDULED", label: "Scheduled" },
      { value: "RESCHEDULED", label: "Rescheduled" },
      { value: "REJECTED", label: "Rejected" },
      { value: "CANCELLED", label: "Cancelled" },
      { value: "NO_SHOW", label: "No Show / Not Attended" },
      { value: "SELECTED", label: "Selected" },
      { value: "PLACED", label: "Placed" },
      { value: "FEEDBACK_PENDING", label: "Feedback-Pending" },
    ];

    const fields = [
      {
        name: "sectionStatus",
        type: "section",
        label: "Update Interview Status",
        gridProps: { xs: 12 },
      },
    ];

    // Always show status and level fields if showStatusAndLevel is true
    if (showStatusAndLevel) {
      fields.push(
        {
          name: "interviewStatus",
          label: "Interview Status",
          type: "select",
          required: true,
          options: statusOptions,
          gridProps: commonGridProps,
        },
        {
          name: "interviewLevel",
          label: "Interview Level",
          type: "select",
          required: true,
          disabled:data.interviewStatus !== 'SELECTED',
         
          options: [
            { value: "INTERNAL", label: "INTERNAL" },
            { value: "EXTERNAL", label: "EXTERNAL" },
            { value: "EXTERNAL-L1", label: "EXTERNAL-L1" },
            { value: "EXTERNAL-L2", label: "EXTERNAL-L2" },
            { value: "FINAL", label: "FINAL" },
          ],
          gridProps: commonGridProps,
        }
      );
    }

    // Only show coordinator fields if showCoordinatorFields is true
    if (showCoordinatorFields) {
      fields.push(
        {
          name: "assignedTo",
          label: "Coordinator",
          type: "select",
          disabled: role === "SUPERADMIN" || role === "BDM" || role === "TEAMLEAD" || role === "COORDINATOR",
          options: coordinators,
          required: false,
          gridProps: commonGridProps,
        },
        {
          name: "internalFeedback",
          label: "Coordinator Feedback",
          type: "textarea",
          placeholder: "Feedback/comments from the coordinator...",
          gridProps: { xs: 12 },
          rows: 3,
        }
      );
    }

    fields.push({
      name: "skipNotification",
      label: "Skip Email Notification",
      type: "checkbox",
      description: "Check this box to skip sending email notifications",
      gridProps: { xs: 12 },
    });

    return fields;
  };

  const validationSchema = () => {
    return Yup.object().shape({
      interviewStatus: Yup.string()
        .required("Interview status is required")
        .oneOf(
          [
            "SCHEDULED",
            "RESCHEDULED",
            "REJECTED",
            "CANCELLED",
            "NO_SHOW",
            "SELECTED",
            "PLACED",
            "FEEDBACK_PENDING",
          ],
          "Invalid interview status"
        ),
      externalInterviewDetails: Yup.string().nullable(),
      skipNotification: Yup.boolean(),
    });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setSubmitting(true);

      const payload = {
        interviewId: data.interviewId,
        candidateId: data.candidateId,
        jobId: data.jobId,
        userId: data.userId,
        userEmail: data.userEmail,
        interviewLevel: values.interviewLevel,
        interviewStatus: values.interviewStatus,
        internalFeedBack: values.internalFeedback,
        externalInterviewDetails: values.externalInterviewDetails,
        skipNotification: values.skipNotification,
        assignedTo: values.assignedTo,
        comments: values.comments,
        clientName: values.clientName,
      };

      const baseUrl = showCoordinatorFields
        ? `/candidate/updateInterviewByCoordinator/${userId}/${data.interviewId}`
        : `/candidate/interview-update/${data.userId || userId}/${data.candidateId}/${data.jobId}`;

      const responseData = await httpService.put(baseUrl, payload);
      setInterviewResponse(responseData);
      setSubmissionSuccess(true);
      setNotification({
        open: true,
        message: "Interview updated successfully",
        severity: "success",
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose(true);
      }, 2000);
    } catch (error) {
      console.error("Error updating interview:", error);
      setNotification({
        open: true,
        message: `Error updating interview: ${error.message || "Unknown error"}`,
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const SuccessMessage = () => {
    if (!submissionSuccess || !interviewResponse) return null;

    return (
      <Alert icon={<Check />} severity="success" sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          Interview updated for{" "}
          <strong>Candidate ID:</strong> {interviewResponse.candidateId}{" "}
          successfully.
        </Typography>
      </Alert>
    );
  };

  const initialValues = getInitialValues();

  return (
    <Box sx={{ width: "100%", p: { xs: 2, sm: 3 }, bgcolor: "#f9fafc" }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={600} color="primary">
          Update Interview Status
        </Typography>
        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>

      <Card elevation={2} sx={{ borderRadius: 3, mb: 3, p: 3 }}>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          color="text.primary"
          gutterBottom
        >
          Candidate Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Table>
          <TableBody>
            <TableRow sx={{ bgcolor: "grey.100" }}>
              <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                Name
              </TableCell>
              <TableCell>{data.candidateFullName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                Email
              </TableCell>
              <TableCell>{data.candidateEmailId}</TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: "grey.100" }}>
              <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                Job ID
              </TableCell>
              <TableCell>{data.jobId}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                Client
              </TableCell>
              <TableCell>{data.clientName}</TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: "grey.100" }}>
              <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                Interview Level
              </TableCell>
              <TableCell>{data.interviewLevel}</TableCell>
            </TableRow>
            {data.interviewDateTime && (
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "primary.main" }}>
                  Scheduled
                </TableCell>
                <TableCell>{formatDateTime(data.interviewDateTime)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <SuccessMessage />

      <Card elevation={2} sx={{ borderRadius: 3, p: 3 }}>
        <DynamicForm
          fields={getFormFields(initialValues)}
          initialValues={initialValues}
          validationSchema={validationSchema()}
          onSubmit={handleSubmit}
          submitButtonText="Update"
          cancelButtonText="Cancel"
          onCancel={onClose}
        />
      </Card>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditInterviewForm;