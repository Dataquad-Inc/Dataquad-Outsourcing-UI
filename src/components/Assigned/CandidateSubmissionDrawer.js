import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
} from "@mui/material";
import httpService from "../../Services/httpService";
import MuiTextField from "../muiComponents/MuiTextField";
import MuiButton from "../muiComponents/MuiButton";
import MuiSelect from "../muiComponents/MuiSelect";
import * as Yup from "yup";
import { useFormik } from "formik";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { showToast } from "../../utils/ToastNotification";

const CandidateSubmissionDrawer = ({
  onClose,
  userId,
  jobId,
  employeeEmail,
  candidateData,
  mode,
  refreshData,
  clientName
}) => {
  const [loading, setLoading] = useState(false);
  const [errorResponse, setErrorResponse] = useState(null);

  // Define base validation schema
  const getValidationSchema = () => {
    const baseSchema = {
      fullName: Yup.string().required("Full Name is required"),
      candidateEmailId: Yup.string()
        .email("Invalid email address")
        .matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          "Please enter a valid email address in lowercase"
        )
        .required("Email is required"),
      contactNumber: Yup.string()
        .matches(/^(\+?\d{10}|\+?\d{12}|\+?\d{15})$/, "Contact number must be 10, 12, or 15 digits")
        .required("Contact number is required"),
      currentOrganization: Yup.string()
        .max(30, "Organization name cannot be more than 30 characters")
        .required("Current Organization is required"),
      qualification: Yup.string().required("Qualification is required"),
      totalExperience: Yup.number()
        .min(0, "Total experience cannot be negative")
        .max(50, "Total experience cannot be more than 50 years")
        .required("Total experience is required"),
      relevantExperience: Yup.number()
        .min(0, "Relevant experience cannot be negative")
        .max(50, "Relevant experience cannot be more than 50 years")
        .required("Relevant experience is required")
        .test(
          "is-relevant-not-more-than-total",
          "Relevant experience cannot be more than total experience",
          function (value) {
            const { totalExperience } = this.parent;
            return value <= totalExperience;
          }
        ),
      currentCTC: Yup.mixed()
        .test("is-valid-ctc", "Please enter a valid CTC value in LPA", (value) => {
          if (!value) return false;
          const stringValue = String(value).trim();
          if (/^\d+(\.\d{1,2})?$/.test(stringValue)) return true;
          if (/^\d+(\.\d{1,2})?\s*LPA$/.test(stringValue)) return true;
          return false;
        })
        .required("Current CTC is required"),
      expectedCTC: Yup.mixed()
        .test("is-valid-ctc", "Please enter a valid CTC value in LPA", (value) => {
          if (!value) return false;
          const stringValue = String(value).trim();
          if (/^\d+(\.\d{1,2})?$/.test(stringValue)) return true;
          if (/^\d+(\.\d{1,2})?\s*LPA$/.test(stringValue)) return true;
          return false;
        })
        .required("Expected CTC is required"),
      noticePeriod: Yup.string().required("Notice Period is required"),
      currentLocation: Yup.string()
        .max(18, "Location cannot be more than 18 characters")
        .matches(/^[A-Za-z\s]+$/, "Location can only contain letters and spaces")
        .required("Current Location is required"),
      preferredLocation: Yup.string()
        .max(18, "Location cannot be more than 18 characters")
        .matches(/^[A-Za-z\s]+$/, "Location can only contain letters and spaces")
        .required("Preferred Location is required"),
      skills: Yup.string().required("Skills are required"),
      communicationSkills: Yup.number()
        .min(1, "Rating must be between 1 and 5")
        .max(5, "Rating must be between 1 and 5")
        .required("Communication Skills rating is required"),
      requiredTechnologiesRating: Yup.number()
        .min(1, "Rating must be between 1 and 5")
        .max(5, "Rating must be between 1 and 5")
        .required("Technology Skills rating is required"),
      overallFeedback: Yup.string()
        .max(100, "Feedback cannot be more than 100 characters")
        .required("Overall feedback is required"),
      resumeFile: Yup.mixed().nullable(),
    };

    if (mode === "edit") {
      return Yup.object().shape({
        ...baseSchema,
        status: Yup.string().required("Status is required")
      });
    }
    return Yup.object().shape(baseSchema);
  };

  const initialValues =
    mode === "edit" && candidateData
      ? {
          fullName: candidateData.fullName || "",
          candidateEmailId: candidateData.candidateEmailId || "",
          contactNumber: candidateData.contactNumber || "",
          currentOrganization: candidateData.currentOrganization || "",
          qualification: candidateData.qualification || "",
          totalExperience: candidateData.totalExperience || "",
          relevantExperience: candidateData.relevantExperience || "",
          currentCTC: candidateData.currentCTC || "",
          expectedCTC: candidateData.expectedCTC || "",
          noticePeriod: candidateData.noticePeriod || "",
          currentLocation: candidateData.currentLocation || "",
          preferredLocation: candidateData.preferredLocation || "",
          skills: candidateData.skills || "",
          resumeFile: null,
          communicationSkills: candidateData.communicationSkills || "",
          requiredTechnologiesRating:
            candidateData.requiredTechnologiesRating || "",
          overallFeedback: candidateData.overallFeedback || "",
          userEmail: candidateData.userEmail || "",
          userId: candidateData.userId || "",
          jobId: candidateData.jobId || "",
          clientName: candidateData.clientName || "",
          status: candidateData.status || ""
        }
      : {
          userId: userId || "",
          jobId: jobId || "",
          fullName: "",
          candidateEmailId: "",
          contactNumber: "",
          currentOrganization: "",
          qualification: "",
          totalExperience: "",
          relevantExperience: "",
          currentCTC: "",
          expectedCTC: "",
          noticePeriod: "",
          currentLocation: "",
          preferredLocation: "",
          skills: "",
          resumeFile: null,
          communicationSkills: "",
          requiredTechnologiesRating: "",
          overallFeedback: "",
          userEmail: employeeEmail || "",
          clientName: clientName || "",
          status: ""
        };

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: getValidationSchema(),
    enableReinitialize: true,
    onSubmit: async (values) => {
      setLoading(true);
      setErrorResponse(null);
      try {
        const form = new FormData();
        Object.keys(values).forEach((key) => {
          if (key !== "resumeFile" && values[key] !== null && values[key] !== undefined) {
            form.append(key, values[key].toString());
          }
        });
        if (values.resumeFile) {
          form.append("resumeFile", values.resumeFile);
        }

        let response;
        if (mode === "edit" && candidateData) {
          response = await httpService.put(
            `/candidate/editSubmission/${candidateData.submissionId}`,
            form,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
        } else {
          response = await httpService.post(
            "/candidate/candidatesubmissions",
            form,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
        }

        if (response.data && response.data.status === "Success") {
          showToast(
            response.data.message ||
              `Candidate profile ${
                mode === "edit" ? "updated" : "submitted"
              } successfully.`
          );
          if (refreshData) {
            refreshData();
          }
        }
        onClose();
      } catch (error) {
        console.error("Error submitting/updating candidate:", error);
        setErrorResponse({
          message:
            error.response?.data?.error?.errorMessage ||
            `Failed to ${
              mode === "edit" ? "update" : "submit"
            } candidate data. Please try again.`,
        });

        showToast(
          error.response?.data?.error?.errorMessage ||
            `Failed to ${
              mode === "edit" ? "update" : "submit"
            } candidate data. Please try again.`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (mode !== "edit") {
      formik.setFieldValue("userId", userId || "");
      formik.setFieldValue("jobId", jobId || "");
    }
  }, [userId, jobId, mode]);

const isFieldDisabled = (fieldName) => {
  // These fields are always disabled in edit mode
  const editModeDisabledFields = ["fullName", "candidateEmailId", "contactNumber", "userEmail"];
  
  // userEmail is always disabled (in both add and edit modes)
  if (fieldName === "userEmail") return true;
  
  // Other fields are disabled only in edit mode
  return mode === "edit" && editModeDisabledFields.includes(fieldName);
};

  

  const fields = [
    { name: "fullName", label: "Full Name", type: "text"},
    { name: "candidateEmailId", label: "Email", type: "email" },
    { name: "contactNumber", label: "Contact Number", type: "text" },
    { name: "currentOrganization", label: "Current Organization", type: "text" },
    { name: "qualification", label: "Qualification", type: "text" },
    { name: "totalExperience", label: "Total Experience", type: "number" },
    { name: "relevantExperience", label: "Relevant Experience", type: "number" },
    { name: "currentCTC", label: "Current CTC", type: "text" },
    { name: "expectedCTC", label: "Expected CTC", type: "text" },
    {
      name: "noticePeriod",
      label: "Notice Period",
      type: "select",
      options: [
        { value: "Immediate", label: "Immediate" },
        { value: "15 Days", label: "15 Days" },
        { value: "30 Days", label: "30 Days" },
        { value: "45 Days", label: "45 Days" },
        { value: "60 Days", label: "60 Days" },
        { value: "90 Days", label: "90 Days" },
      ],
    },
    { name: "currentLocation", label: "Current Location", type: "text" },
    { name: "preferredLocation", label: "Preferred Location", type: "text" },
    { name: "skills", label: "Skills", type: "text" },
    { name: "communicationSkills", label: "Communication Skills", type: "number" },
    {
      name: "requiredTechnologiesRating",
      label: "Technologies Rating",
      type: "number",
    },
    { name: "overallFeedback", label: "Overall Feedback", type: "text",disabled:true },
    { name: "userEmail", label: "User Email", type: "text", InputProps: { readOnly: true },disabled:true},
    ...(mode === "edit" ? [{
      name: "status", 
      label: "Status",
      type: "select",
      options: [
        {
          value: "PROCESSED FOR INTERVIEW", 
          label: "PROCESSED FOR INTERVIEW",
          style: { color: "#10b981" }
        },
        {
          value: "SCREEN REJECT", 
          label: "SCREEN REJECT",
          style: { color: "#ef4444" }
        },
        {
          value: "MOVED TO INTERVIEW", 
          label: "MOVED TO INTERVIEW",
          style: { color: "#3b82f6" }
        },
        {
          value: "DUPLICATE", 
          label: "DUPLICATE",
          style: { color: "#f59e0b" }
        },
        {
          value: "CLIENT REJECT", 
          label: "CLIENT REJECT",
          style: { color: "#dc2626" }
        }
      ]
    }] : [])
  ];

  return (
    <Box
      sx={{
        width: { xs: "90vw", sm: 400, md: 600 },
        p: 2,
        height: "100%",
        mt: 3,
        overflowY: "auto",
      }}
    >
      <Typography variant="h6">
        {mode === "edit" ? "Edit Candidate" : "Submit Candidate"}
      </Typography>
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          {fields.map((field) => (
            <Grid item xs={12} sm={6} key={field.name}>
              {field.type === "select" ? (
                <MuiSelect
                  label={field.label}
                  name={field.name}
                  value={formik.values[field.name]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  options={field.options}
                  error={
                    formik.touched[field.name] &&
                    Boolean(formik.errors[field.name])
                  }
                  helperText={
                    formik.touched[field.name] && formik.errors[field.name]
                  }
                  fullWidth
                  disabled={isFieldDisabled(field.name)}
                />
              ) : (
                <MuiTextField
                  label={field.label}
                  name={field.name}
                  type={field.type}
                  value={formik.values[field.name]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched[field.name] &&
                    Boolean(formik.errors[field.name])
                  }
                  helperText={
                    formik.touched[field.name] && formik.errors[field.name]
                  }
                  fullWidth
                  disabled={isFieldDisabled(field.name)}
                />
              )}
            </Grid>
          ))}
          <Grid item xs={12}>
            <Typography
              component="span"
              sx={{
                cursor: "pointer",
                color: "primary.main",
                textDecoration: "underline",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
              onClick={() => document.getElementById("resumeUpload").click()}
            >
              <CloudUploadIcon fontSize="small" />
              Upload Resume
            </Typography>
            <input
              id="resumeUpload"
              type="file"
              style={{ display: "none" }}
              onChange={(e) =>
                formik.setFieldValue("resumeFile", e.target.files[0])
              }
              onBlur={formik.handleBlur}
            />
            {formik.values.resumeFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {formik.values.resumeFile.name}
              </Typography>
            )}
            {formik.touched.resumeFile && formik.errors.resumeFile && (
              <Typography color="error">{formik.errors.resumeFile}</Typography>
            )}
            {errorResponse?.message && (
              <Typography color="error">{errorResponse.message}</Typography>
            )}
          </Grid>

          <Grid
            item
            xs={12}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 2,
            }}
          >
            <MuiButton onClick={onClose} variant="outlined">
              Cancel
            </MuiButton>
            <MuiButton
              type="submit"
              variant="contained"
              disabled={loading || formik.isSubmitting}
            >
              {loading || formik.isSubmitting ? (
                <CircularProgress size={24} />
              ) : (
                mode === "edit"
                  ? "Update Candidate"
                  : "Submit Candidate"
              )}
            </MuiButton>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default CandidateSubmissionDrawer;