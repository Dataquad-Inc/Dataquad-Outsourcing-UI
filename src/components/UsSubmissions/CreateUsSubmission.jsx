import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import { fetchRecruiters } from "../../redux/usEmployees";

const getUSSubmissionFieldsConfig = (
  employees = [],
  jobBillRate,
  jobPayRate
) => {
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
          label: "SSN Number",
          type: "text",
          placeholder: "Enter SSN number",
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
      section: "Job & Visa Details",
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
          name: "visaType",
          label: "Visa Type",
          type: "select",
          required: true,
          options: [
            { value: "H1B", label: "H1B" },
            { value: "OPT", label: "OPT" },
            { value: "STEM_OPT", label: "STEM OPT" },
            { value: "OPT_EAD", label: "OPT EAD" },
            { value: "H4_EAD", label: "H4 EAD" },
            { value: "GC_EAD", label: "GC EAD" },
            { value: "CPT", label: "CPT" },
            { value: "GC", label: "Green Card" },
            { value: "Citizen", label: "Citizen" },
            { value: "Other", label: "Other" },
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
          name: "billRate",
          label: "Bill Rate",
          type: "text",
          required: true,
          disabled: true,
          placeholder: "e.g., $80/hr",
          icon: "AttachMoney",
          gridSize: { xs: 12, sm: 6 },
        },
        {
          name: "payRate",
          label: "Pay Rate",
          type: "text",
          required: true,
          disabled: true,
          placeholder: "e.g., $60/hr",
          icon: "Paid",
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
        {
          name: "confirmRTR",
          label: "RTR Confirmation",
          type: "text",
          required: true,
          placeholder: "RTR Confirmation",
          icon: "Verified",
          gridSize: { xs: 12 },
          helperText: "RTR Confirmation",
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
          name: "resume",
          label: "Upload Resume",
          type: "file",
          required: true,
          multiple: false,
          accept: ".pdf,.doc,.docx",
          maxSize: 5,
          icon: "Description",
          helperText: "Upload candidate resume (PDF/DOC/DOCX, max 5MB)",
          gridSize: { xs: 12 },
        },
      ],
    },

    {
      section: "Supporting Documents",
      fields: [
        {
          name: "documents",
          label: "Upload Supporting Documents",
          type: "file",
          required: false,
          multiple: true,
          accept: ".pdf,.jpg,.png,.doc,.docx",
          maxSize: 25,
          icon: "AttachFile",
          helperText: "Upload additional documents (max 25MB total)",
          gridSize: { xs: 12 },
        },
      ],
    },
  ];
};

const CreateUSSubmission = ({
  formTitle = "Create Submission",
  submitButtonText = "Submit Candidate",
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract values passed from navigation state
  const {
    job,
    jobId,
    userId: redirectedUserId,
    billRate: jobBillRate,
    payRate: jobPayRate,
  } = location?.state || {};

  const { recruiters = [], loading: recruitersLoading } = useSelector(
    (state) => state.usEmployees
  );

  const { userId, userName } = useSelector((state) => state.auth);

  // Fetch recruiters for dropdown (removed but keeping for future use if needed)
  useEffect(() => {
    dispatch(fetchRecruiters("RECRUITER"));
  }, [dispatch]);

  // Memoize form config to prevent unnecessary re-renders
  const formConfig = useMemo(
    () => getUSSubmissionFieldsConfig(recruiters, jobBillRate, jobPayRate),
    [recruiters, jobBillRate, jobPayRate]
  );

  const initialValues = useMemo(
    () => ({
      candidateName: "",
      candidateEmail: "",
      mobileNumber: "",
      dob: "",
      visaType: "",
      jobId: jobId || "",
      totalExperience: "",
      relevantExperience: "",
      qualification: "",
      requiredTechnologiesRating: "",
      communicationSkillsRating: "",
      relocation: false,
      billRate: jobBillRate || "", // Pre-populated from job
      payRate: jobPayRate || "", // Pre-populated from job
      noticePeriod: "",
      currentLocation: "",
      overallFeedback: "",
      employmentType: "",
      sslNumber: "",
      confirmRTR: "", // Text field - empty string
      resume: null,
      documents: [],
    }),
    [jobId, jobBillRate, jobPayRate]
  );

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Validation
      if (!jobId) {
        showErrorToast("Job ID is required");
        return;
      }
      if (!userId) {
        showErrorToast("User ID is required");
        return;
      }
      if (!values.resume) {
        showErrorToast("Resume upload is required!");
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

      // Validate RTR confirmation text
      if (!values.confirmRTR) {
        showErrorToast(
          "Please type 'CONFIRM RTR' to confirm the candidate has signed the Right to Represent form"
        );
        return;
      }

      // Create submission DTO matching backend structure
      const submissionDTO = {
        candidateName: values.candidateName?.trim() || "",
        candidateEmail: values.candidateEmail?.trim() || "",
        dob: values.dob || null,
        mobileNumber: values.mobileNumber?.trim() || "",
        recruiterId: userId,
        recruiterName: userName,
        jobId: values.jobId?.trim() || "",
        visaType: values.visaType || "",
        billRate: values.billRate?.trim() || "",
        payRate: values.payRate ? parseFloat(values.payRate) : null,
        confirmRTR: values.confirmRTR?.trim() || "",
        noticePeriod: values.noticePeriod?.trim() || "",
        currentLocation: values.currentLocation?.trim() || "",
        totalExperience: values.totalExperience
          ? parseFloat(values.totalExperience)
          : null,
        relevantExperience: values.relevantExperience
          ? parseFloat(values.relevantExperience)
          : null,
        qualification: values.qualification?.trim() || "",
        communicationSkillsRating: values.communicationSkillsRating || "",
        requiredTechnologiesRating: values.requiredTechnologiesRating
          ? parseFloat(values.requiredTechnologiesRating)
          : null,
        overallFeedback: values.overallFeedback?.trim() || "",
        relocation: Boolean(values.relocation),
        employmentType: values.employmentType || "",
        sslNumber: values.sslNumber?.trim() || "",
      };

      // Clean up empty values
      const cleanDTO = Object.fromEntries(
        Object.entries(submissionDTO).filter(([_, value]) => {
          if (value === null || value === undefined) return false;
          if (typeof value === "string" && value.trim() === "") return false;
          if (typeof value === "number" && isNaN(value)) return false;
          if (typeof value === "boolean") return true; // Keep boolean values
          return true;
        })
      );

      const formData = new FormData();

      // Append DTO as Binary/Blob (as requested)
      const dtoBlob = new Blob([JSON.stringify(cleanDTO)], {
        type: "application/json",
      });
      formData.append("dto", dtoBlob);

      // Append resume file
      const resumeFile =
        values.resume instanceof FileList ? values.resume[0] : values.resume;
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      // Append supporting documents if any
      if (values.documents && values.documents.length > 0) {
        if (values.documents instanceof FileList) {
          Array.from(values.documents).forEach((file) => {
            formData.append("documents", file);
          });
        } else if (Array.isArray(values.documents)) {
          values.documents.forEach((file) => {
            if (file) {
              formData.append("documents", file);
            }
          });
        } else if (values.documents instanceof File) {
          formData.append("documents", values.documents);
        }
      }

      // Debug: Log FormData entries
      console.log("FormData entries:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      console.log("Submitting candidate:", {
        dto: cleanDTO,
        resume: resumeFile?.name,
        userId: userId,
        recruiter: {
          id: userId,
          name: userName,
        },
        endpoint: `https://mymulya.com/api/us/requirements/create-submission/${userId}`,
      });

      const response = await axios.post(
        `https://mymulya.com/api/us/requirements/create-submission/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log(`Upload progress: ${percentCompleted}%`);
            }
          },
        }
      );

      if (response.data) {
        showSuccessToast(
          response.data.message || "Candidate submitted successfully!"
        );
        resetForm();
        navigate("/dashboard/us-submissions", {
          state: { refresh: true, success: true },
        });
      }
    } catch (error) {
      console.error("Submission error:", error);

      // Enhanced error logging
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        request: error.request,
      });

      // Enhanced error handling
      if (error.code === "NETWORK_ERROR" || error.message.includes("Network")) {
        showErrorToast("Network error - please check your connection");
      } else if (error.response?.status === 400) {
        const serverMessage = error.response.data?.message;
        showErrorToast(
          serverMessage || "Bad request - please check all required fields"
        );
      } else if (error.response?.status === 413) {
        showErrorToast(
          "File too large - please upload a smaller file (max 5MB for resume, 25MB total for documents)"
        );
      } else if (error.response?.status === 415) {
        showErrorToast(
          "Unsupported file type - please upload PDF, DOC, DOCX, JPG, or PNG"
        );
      } else if (error.response?.status === 500) {
        showErrorToast("Server error - please try again later");
      } else if (error.response?.data) {
        // Try to extract more detailed error info
        const errorData = error.response.data;
        const errorMessage =
          errorData.message ||
          errorData.error ||
          errorData.details ||
          "Submission failed. Please try again.";
        showErrorToast(errorMessage);
      } else {
        showErrorToast("Submission failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/us-submissions");
  };

  return (
    <>
      <DynamicFormUltra
        config={formConfig}
        title={formTitle}
        submitButtonText={submitButtonText}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        gridConfig={{ xs: 12, sm: 6, md: 4 }}
      />
    </>
  );
};

export default CreateUSSubmission;
