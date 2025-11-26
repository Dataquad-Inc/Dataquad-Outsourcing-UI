import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import { fetchRecruiters } from "../../redux/usEmployees";

const getUSSubmissionFieldsConfig = (employees = []) => {
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
    jobTitle,
    clientName,
  } = location?.state || {};

  const { recruiters = [], loading: recruitersLoading } = useSelector(
    (state) => state.usEmployees
  );
  const { userId: loggedUserId } = useSelector((state) => state.auth);

  // Final userId priority: navigation state -> redux auth
  const finalUserId = redirectedUserId || loggedUserId;

  // Fetch recruiters for dropdown
  useEffect(() => {
    dispatch(fetchRecruiters("RECRUITER"));
  }, [dispatch]);

  // Memoize form config to prevent unnecessary re-renders
  const formConfig = useMemo(
    () => getUSSubmissionFieldsConfig(recruiters),
    [recruiters]
  );

  const initialValues = useMemo(
    () => ({
      candidateName: "",
      candidateEmail: "",
      mobileNumber: "",
      dob: "",
      visaType: "",
      jobId: jobId || "",
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
    }),
    [jobId]
  );

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Validation
      if (!jobId) {
        showErrorToast("Job ID is required");
        return;
      }
      if (!finalUserId) {
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

      // Create submission DTO matching backend structure
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
        requiredTechnologiesRating: values.requiredTechnologiesRating,

        communicationSkillsRating: values.communicationSkillsRating,
        relocation: Boolean(values.relocation),
        expectedCTC: values.expectedCTC?.trim() || "",
        currentCTC: values.currentCTC?.trim() || "",
        billRate: values.billRate?.trim() || "",
        noticePeriod: values.noticePeriod?.trim() || "",
        currentLocation: values.currentLocation?.trim() || "",
        overallFeedback: values.overallFeedback?.trim() || "",
        employmentType: values.employmentType || "",
        sslNumber: values.sslNumber?.trim() || "",
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

      // Append resume file
      const resumeFile =
        values.resume instanceof FileList ? values.resume[0] : values.resume;
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      console.log("Submitting candidate:", {
        dto: cleanDTO,
        resume: resumeFile?.name,
        userId: finalUserId,
      });

      const response = await axios.post(
        `https://mymulya.com/api/us/requirements/create-submission/${finalUserId}`,
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
          response.data.message || "Candidate submitted successfully!"
        );
        resetForm();
        navigate("/dashboard/us-submissions", {
          state: { refresh: true, success: true },
        });
      }
    } catch (error) {
      console.error("Submission error:", error);

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
          "File too large - please upload a smaller file (max 5MB)"
        );
      } else if (error.response?.status === 415) {
        showErrorToast(
          "Unsupported file type - please upload PDF, DOC, or DOCX"
        );
      } else if (error.response?.status === 500) {
        showErrorToast("Server error - please try again later");
      } else if (error.response?.data) {
        showErrorToast(
          error.response.data.message || "Submission failed. Please try again."
        );
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
