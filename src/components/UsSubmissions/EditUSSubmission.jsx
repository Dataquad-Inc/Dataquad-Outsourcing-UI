import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import { fetchRecruiters } from "../../redux/usEmployees";
import { Box, Typography, Chip, IconButton } from "@mui/material";
import { Description, Delete, Visibility, Download } from "@mui/icons-material";

const getUSSubmissionFieldsConfig = (employees = [], existingResume = null) => {
  const recruiterOptions = employees.map((emp) => ({
    label: emp.employeeName || emp.name,
    value: emp.employeeId,
  }));

  return [
    {
      section: "Personal Details",
      fields: [
        {
          name: "candidateName",
          label: "Candidate Name",
          type: "text",
          required: true,
          placeholder: "Enter candidate full name",
          icon: "Person",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "candidateEmail",
          label: "Candidate Email",
          type: "email",
          required: true,
          placeholder: "Enter candidate email",
          icon: "Email",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "mobileNumber",
          label: "Mobile Number",
          type: "phone",
          required: true,
          placeholder: "Enter mobile number",
          icon: "Phone",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "dob",
          label: "Date of Birth",
          type: "date",
          icon: "CalendarToday",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "sslNumber",
          label: "SSN / SSL Number",
          type: "text",
          placeholder: "Enter SSN or SSL number",
          icon: "Security",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "currentLocation",
          label: "Current Location",
          type: "text",
          placeholder: "Enter current location",
          icon: "LocationOn",
          gridSize: { xs: 12, sm: 6 },
        },
      ],
    },

    {
      section: "Job & Recruiter Details",
      fields: [
        {
          name: "jobId",
          label: "Job ID",
          type: "text",
          required: true,
          disabled: true,
          icon: "Badge",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "recruiterId",
          label: "Recruiter ID",
          type: "select",
          required: true,
          options: recruiterOptions,
          placeholder: "Select recruiter",
          searchable: true,
          icon: "SupervisorAccount",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "recruiterName",
          label: "Recruiter Name",
          type: "text",
          placeholder: "Enter recruiter name",
          icon: "Person",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "visaType",
          label: "Visa Type",
          type: "select",
          required: true,
          options: [
            { label: "H1B", value: "H1B" },
            { label: "OPT", value: "OPT" },
            { label: "H4 EAD", value: "H4 EAD" },
            { label: "Green Card", value: "Green Card" },
            { label: "Citizen", value: "Citizen" },
            { label: "Other", value: "Other" },
          ],
          placeholder: "Select visa type",
          icon: "VerifiedUser",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "employmentType",
          label: "Employment Type",
          type: "select",
          options: [
            { value: "Full-time", label: "Full-time" },
            { value: "Part-time", label: "Part-time" },
            { value: "Contract", label: "Contract" },
            { value: "C2C", label: "C2C" },
            { value: "W2", label: "W2" },
          ],
          placeholder: "Select employment type",
          icon: "BusinessCenter",
          gridSize: { xs: 12, sm: 6 },
        },
      ],
    },

    {
      section: "Experience & Skills",
      fields: [
        {
          name: "totalExperience",
          label: "Total Experience (Years)",
          type: "number",
          step: "0.1",
          placeholder: "e.g., 5.5",
          icon: "Timeline",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "relevantExperience",
          label: "Relevant Experience (Years)",
          type: "number",
          step: "0.1",
          placeholder: "e.g., 4.0",
          icon: "CompareArrows",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "qualification",
          label: "Qualification",
          type: "text",
          placeholder: "e.g., Masters in Computer Science",
          icon: "School",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "requiredTechnologiesRating",
          label: "Technical Skills Rating (1 - 5)",
          type: "number",
          min: 1,
          max: 5,
          step: "0.1",
          placeholder: "Rate from 1 to 5",
          icon: "Code",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "communicationSkillsRating",
          label: "Communication Rating",
          type: "select",
          options: [
            { value: "Poor", label: "Poor" },
            { value: "Average", label: "Average" },
            { value: "Good", label: "Good" },
            { value: "Excellent", label: "Excellent" },
          ],
          placeholder: "Select communication rating",
          icon: "Comment",
          gridSize: { xs: 12, sm: 6 },
        },
      ],
    },

    {
      section: "Compensation & Notice",
      fields: [
        {
          name: "currentCTC",
          label: "Current CTC",
          type: "text",
          placeholder: "e.g., 10 LPA or $80,000",
          icon: "AttachMoney",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "expectedCTC",
          label: "Expected CTC",
          type: "text",
          placeholder: "e.g., 15 LPA or $100,000",
          icon: "RequestQuote",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "billRate",
          label: "Bill Rate",
          type: "text",
          placeholder: "e.g., $80/hr",
          icon: "AttachMoney",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "noticePeriod",
          label: "Notice Period",
          type: "text",
          placeholder: "e.g., 30 days or 2 weeks",
          icon: "Schedule",
          gridSize: { xs: 12, sm: 6 },
        },
      ],
    },

    {
      section: "Additional Info",
      fields: [
        {
          name: "relocation",
          label: "Willing to Relocate?",
          type: "checkbox",
          icon: "TravelExplore",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "overallFeedback",
          label: "Overall Feedback",
          type: "textarea",
          rows: 4,
          placeholder:
            "Enter overall feedback about candidate's skills, experience, and suitability for the role...",
          icon: "Comment",
          gridSize: { xs: 12 },
        },
      ],
    },

    {
      section: "Resume",
      fields: [
        {
          name: "existingResume",
          label: "Current Resume",
          type: "custom",
          render: () => (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Resume
              </Typography>
              {existingResume ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    backgroundColor: "background.paper",
                  }}
                >
                  <Description color="primary" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {existingResume.fileName || "resume.pdf"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Uploaded on {existingResume.uploadDate || "previous date"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={existingResume.onView}
                      title="View Resume"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={existingResume.onDownload}
                      title="Download Resume"
                    >
                      <Download fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={existingResume.onRemove}
                      title="Remove Resume"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ) : (
                <Chip
                  label="No resume uploaded"
                  variant="outlined"
                  color="default"
                />
              )}
            </Box>
          ),
          gridSize: { xs: 12 },
        },
        {
          name: "resume",
          label: "Update Resume",
          type: "file",
          required: false,
          multiple: false,
          accept: ".pdf,.doc,.docx",
          maxSize: 5,
          icon: "Description",
          helperText:
            "Upload new resume to replace the current one (PDF/DOC/DOCX, max 5MB) - Optional",
          gridSize: { xs: 12 },
        },
      ],
    },
  ];
};

const EditUSSubmission = ({
  formTitle = "Edit Submission",
  submitButtonText = "Update Submission",
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { submissionId } = useParams();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existingResume, setExistingResume] = useState(null);
  const [resumeRemoved, setResumeRemoved] = useState(false);

  const { recruiters = [] } = useSelector((state) => state.usEmployees);
  const { userId } = useSelector((state) => state.auth);

  // Fetch submission data including resume info
  useEffect(() => {
    const fetchSubmissionData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://mymulya.com/api/us/requirements/get-submission-by-id/${submissionId}`
        );

        if (response.data) {
          setInitialData(response.data);

          // Check if resume exists for this submission
          try {
            const resumeResponse = await axios.head(
              `https://mymulya.com/api/us/requirements/download-resume/${submissionId}`
            );

            if (resumeResponse.status === 200) {
              setExistingResume({
                fileName: `resume_${
                  response.data.candidateName || "candidate"
                }.pdf`,
                uploadDate: new Date().toLocaleDateString(), // You might want to get this from your API
                onView: () =>
                  handleViewResume(submissionId, response.data.candidateName),
                onDownload: () =>
                  handleDownloadResume(
                    submissionId,
                    response.data.candidateName
                  ),
                onRemove: () => handleRemoveResume(),
              });
            }
          } catch (resumeError) {
            console.log("No resume found for this submission");
            setExistingResume(null);
          }
        }
      } catch (error) {
        console.error("Error fetching submission data:", error);
        showErrorToast("Failed to load submission data");
        navigate("/dashboard/us-submissions");
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) {
      fetchSubmissionData();
    }
  }, [submissionId, navigate]);

  // Resume handlers
  const handleViewResume = async (submissionId, candidateName) => {
    try {
      const response = await fetch(
        `https://mymulya.com/api/us/requirements/download-resume/${submissionId}`,
        { method: "GET", headers: { Accept: "application/pdf" } }
      );

      if (!response.ok) throw new Error("Failed to load resume");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Open in new tab
      window.open(url, "_blank");

      // Clean up URL after some time
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Error loading resume:", error);
      showErrorToast("Failed to load resume");
    }
  };

  const handleDownloadResume = async (submissionId, candidateName) => {
    try {
      const response = await fetch(
        `https://mymulya.com/api/us/requirements/download-resume/${submissionId}`,
        { method: "GET", headers: { Accept: "application/pdf" } }
      );

      if (!response.ok) throw new Error("Failed to download resume");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Resume-${candidateName}-${submissionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up URL
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Error downloading resume:", error);
      showErrorToast("Failed to download resume");
    }
  };

  const handleRemoveResume = () => {
    setExistingResume(null);
    setResumeRemoved(true);
    showSuccessToast("Resume will be removed on update");
  };

  // Memoize form config with existing resume data
  const formConfig = useMemo(
    () => getUSSubmissionFieldsConfig(recruiters, existingResume),
    [recruiters, existingResume]
  );

  const initialValues = useMemo(() => {
    if (!initialData) {
      return {
        candidateName: "",
        candidateEmail: "",
        mobileNumber: "",
        dob: "",
        visaType: "",
        jobId: "",
        recruiterId: "",
        recruiterName: "",
        totalExperience: "",
        relevantExperience: "",
        qualification: "",
        requiredTechnologiesRating: "",
        communicationSkillsRating: "",
        relocation: false,
        expectedCTC: "",
        currentCTC: "",
        billRate: "",
        noticePeriod: "",
        currentLocation: "",
        overallFeedback: "",
        employmentType: "",
        sslNumber: "",
        resume: null,
      };
    }

    return {
      candidateName: initialData.candidateName || "",
      candidateEmail: initialData.candidateEmail || "",
      mobileNumber: initialData.mobileNumber || "",
      dob: initialData.dob || "",
      visaType: initialData.visaType || "",
      jobId: initialData.jobId || "",
      recruiterId: initialData.recruiterId || "",
      recruiterName: initialData.recruiterName || "",
      totalExperience: initialData.totalExperience || "",
      relevantExperience: initialData.relevantExperience || "",
      qualification: initialData.qualification || "",
      requiredTechnologiesRating: initialData.requiredTechnologiesRating || "",
      communicationSkillsRating: initialData.communicationSkillsRating || "",
      relocation: Boolean(initialData.relocation),
      expectedCTC: initialData.expectedCTC || "",
      currentCTC: initialData.currentCTC || "",
      billRate: initialData.billRate || "",
      noticePeriod: initialData.noticePeriod || "",
      currentLocation: initialData.currentLocation || "",
      overallFeedback: initialData.overallFeedback || "",
      employmentType: initialData.employmentType || "",
      sslNumber: initialData.sslNumber || "",
      resume: null,
    };
  }, [initialData]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (!submissionId) {
        showErrorToast("Submission ID is required");
        return;
      }
      if (!userId) {
        showErrorToast("User ID is required");
        return;
      }
      if (
        !values.candidateName ||
        !values.candidateEmail ||
        !values.mobileNumber
      ) {
        showErrorToast("Please fill all required fields");
        return;
      }

      // Create submission DTO
      const submissionDTO = {
        candidateName: values.candidateName?.trim() || "",
        candidateEmail: values.candidateEmail?.trim() || "",
        mobileNumber: values.mobileNumber?.trim() || "",
        dob: values.dob || null,
        visaType: values.visaType || "",
        jobId: values.jobId?.trim() || "",
        recruiterId: values.recruiterId || "",
        recruiterName: values.recruiterName?.trim() || "",
        totalExperience: values.totalExperience
          ? parseFloat(values.totalExperience)
          : null,
        relevantExperience: values.relevantExperience
          ? parseFloat(values.relevantExperience)
          : null,
        qualification: values.qualification?.trim() || "",
        requiredTechnologiesRating: values.requiredTechnologiesRating
          ? parseFloat(values.requiredTechnologiesRating)
          : null,
        communicationSkillsRating: values.communicationSkillsRating || "",
        relocation: Boolean(values.relocation),
        expectedCTC: values.expectedCTC?.trim() || "",
        currentCTC: values.currentCTC?.trim() || "",
        billRate: values.billRate?.trim() || "",
        noticePeriod: values.noticePeriod?.trim() || "",
        currentLocation: values.currentLocation?.trim() || "",
        overallFeedback: values.overallFeedback?.trim() || "",
        employmentType: values.employmentType || "",
        sslNumber: values.sslNumber?.trim() || "",
        removeResume: resumeRemoved && !values.resume, // Flag to remove resume
      };

      // Clean up empty values
      const cleanDTO = Object.fromEntries(
        Object.entries(submissionDTO).filter(([_, value]) => {
          if (value === null || value === undefined) return false;
          if (typeof value === "string" && value.trim() === "") return false;
          return true;
        })
      );

      const formData = new FormData();

      // Append DTO as Blob
      const dtoBlob = new Blob([JSON.stringify(cleanDTO)], {
        type: "application/json",
      });
      formData.append("dto", dtoBlob);

      // Append resume file only if provided
      if (values.resume) {
        const resumeFile =
          values.resume instanceof FileList ? values.resume[0] : values.resume;
        if (resumeFile) {
          formData.append("resume", resumeFile);
        }
      }

      console.log("Updating submission:", {
        dto: cleanDTO,
        resume: values.resume ? "New resume provided" : "No resume update",
        removeResume: resumeRemoved,
        userId: userId,
      });

      const response = await axios.put(
        `https://mymulya.com/api/us/requirements/update-submission/${submissionId}/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      if (response.data) {
        showSuccessToast(
          response.data.message || "Submission updated successfully!"
        );
        resetForm();
        navigate("/dashboard/us-submissions", {
          state: { refresh: true, success: true },
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      // Error handling remains the same as before
      // ... (keep your existing error handling code)
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/us-submissions");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        Loading submission data...
      </div>
    );
  }

  return (
    <DynamicFormUltra
      config={formConfig}
      title={formTitle}
      submitButtonText={submitButtonText}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      gridConfig={{ xs: 12, sm: 6, md: 4 }}
      enableReinitialize
    />
  );
};

export default EditUSSubmission;
