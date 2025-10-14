import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import { fetchRecruiters } from "../../redux/usEmployees";
import { usClientsAPI } from "../../utils/api";

const CreateJobRequirement = ({
  formTitle = "Post New Requirement",
  formInitialValues = {},
  submitButtonText = "Create Requirement",
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Local state for clients instead of Redux
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState(null);

  // Get employees and current user from Redux
  const { recruiters = [], loadingEmployees } = useSelector(
    (state) => state.usEmployees
  );
  const { userName, userId } = useSelector((state) => state.auth);

  // Fetch clients directly in component
  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      setClientsError(null);
      const response = await usClientsAPI.getAllClients();

      setClients(response.data);
    } catch (error) {
      const errorMessage = error.message || "Something went wrong";
      setClientsError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoadingClients(false);
    }
  };

  // Transform employees for multiselect
  const employeeOptions = recruiters.map((emp) => ({
    label: emp.employeeName,
    value: emp.employeeId,
  }));

  const clientOptions = clients.map((client) => ({
    label: client.clientName,
    value: client.clientName,
  }));

  useEffect(() => {
    dispatch(fetchRecruiters("RECRUITER"));
    fetchClients();
  }, [dispatch]);

  // Default form values
  const defaultInitialValues = {
    clientName: "",
    jobTitle: "",
    jobMode: "",
    visaType: "",
    location: "",
    jobType: "",
    noOfPositions: 1,
    experienceRequired: "",
    relevantExperience: "",
    qualification: "",
    noticePeriod: "",
    salaryPackage: "",
    status: "Open",
    assignedUsers: [],
    jobDescriptionType: "text",
    jobDescription: "",
    jobDescriptionFile: null,
    ...formInitialValues,
  };

  // Form configuration
  const formConfig = [
    {
      section: "Job Details",
      fields: [
        {
          name: "clientName",
          label: "Client Name",
          type: "select",
          options: clientOptions,
          helperText: "Select client",
          icon: "BusinessCenter",
          loading: loadingClients,
          error: clientsError,
        },
        {
          name: "jobTitle",
          label: "Job Title",
          type: "text",
          required: true,
          icon: "AssignmentInd",
        },
        {
          name: "jobMode",
          label: "Job Mode",
          type: "select",
          required: true,
          options: [
            { value: "Remote", label: "Remote" },
            { value: "Onsite", label: "Onsite" },
            { value: "Hybrid", label: "Hybrid" },
          ],
          icon: "Public",
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
          searchable: true,
          icon: "VerifiedUser",
        },
        {
          name: "location",
          label: "Job Location",
          type: "text",
          required: true,
          icon: "LocationOn",
        },
        {
          name: "jobType",
          label: "Employment Type",
          type: "select",
          required: true,
          options: [
            { value: "FullTime", label: "Full Time" },
            { value: "PartTime", label: "Part Time" },
            { value: "Contract", label: "Contract" },
          ],
          icon: "BusinessCenter",
        },
        {
          name: "noOfPositions",
          label: "Number of Positions",
          type: "number",
          required: true,
          icon: "Group",
        },
        {
          name: "assignedBy",
          label: "Assigned By",
          type: "text",
          disabled: true,
          helperText: "This field is automatically populated with your name",
          icon: "Person",
        },
      ],
    },
    {
      section: "Requirements",
      fields: [
        {
          name: "experienceRequired",
          label: "Experience Required",
          type: "text",
          required: true,
          icon: "Timeline",
        },
        {
          name: "relevantExperience",
          label: "Relevant Experience",
          type: "text",
          helperText: "Specific experience relevant to this role",
          icon: "CompareArrows",
        },
        {
          name: "qualification",
          label: "Minimum Qualification",
          type: "text",
          helperText: "Educational or professional qualifications required",
          icon: "School",
        },
        {
          name: "noticePeriod",
          label: "Notice Period",
          type: "text",
          helperText:
            "Candidate's expected notice period (e.g., 2 weeks, 1 month)",
          icon: "CalendarToday",
        },
        {
          name: "salaryPackage",
          label: "Salary Package",
          type: "text",
          helperText: "Expected salary range or package for this position",
          icon: "AttachMoney",
        },
      ],
    },
    {
      section: "Status & Assignment",
      fields: [
        {
          name: "status",
          label: "Job Status",
          type: "select",
          required: true,
          options: [
            { value: "OPEN", label: "Open" },
            { value: "CLOSED", label: "Closed" },
            { value: "ON HOLD", label: "On Hold" },
          ],
          icon: "ToggleOn",
        },
        {
          name: "assignedUsers",
          label: "Assign to Users",
          type: "multiselect",
          options: employeeOptions,
          helperText: "Select team members to assign this requirement to",
          icon: "SupervisorAccount",
        },
      ],
    },
    {
      section: "Job Description",
      fields: [
        {
          name: "jobDescription",
          label: "Job Description",
          type: "textarea",
          helperText: "Minimum 50 characters required",
        },
        {
          name: "jobDescriptionFile",
          label: "Job Description File",
          type: "file",
          accept: ".pdf,.doc,.docx,.txt",
          maxSize: 5,
          helperText:
            "Upload job description file (.pdf, .doc, .docx, .txt) - Max 5MB",
        },
      ],
    },
  ];

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const apiPayload = {
        jobTitle: values.jobTitle,
        clientName: values.clientName,
        jobType: values.jobType,
        location: values.location,
        jobMode: values.jobMode,
        experienceRequired: values.experienceRequired,
        noticePeriod: values.noticePeriod || "",
        relevantExperience: values.relevantExperience || "",
        qualification: values.qualification || "",
        salaryPackage: values.salaryPackage || "",
        noOfPositions: parseInt(values.noOfPositions) || 1,
        status: values.status || "Open",
        visaType: values.visaType || "",
        assignedBy: userId,
        userIds: (values.assignedUsers || []).join(","),
      };

      // Use FormData
      const formData = new FormData();

      Object.keys(apiPayload).forEach((key) => {
        formData.append(key, apiPayload[key]);
      });

      if (values.jobDescriptionType === "file" && values.jobDescriptionFile) {
        formData.append(
          "jobDescriptionFile",
          values.jobDescriptionFile,
          values.jobDescriptionFile.name
        );
      } else {
        formData.append("jobDescription", values.jobDescription?.trim() || "");
      }

      const response = await axios.post(
        `https://mymulya.com/api/us/requirements/post-requirement/${userId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response?.data?.success) {
        showSuccessToast("Requirement created successfully!");
        resetForm();
        navigate("/dashboard/us-requirements");
      } else {
        showErrorToast(
          response?.data?.message || "Failed to create requirement"
        );
      }
    } catch (error) {
      console.error("Error creating requirement:", error);
      showErrorToast(
        error.response?.data?.message || "Failed to create requirement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/us-requirements");
  };

  // Custom validation function
  const validateForm = (values) => {
    const errors = {};

    // Basic field validations
    if (!values.clientName) errors.clientName = "Client name is required";
    if (!values.jobTitle) errors.jobTitle = "Job title is required";
    if (!values.jobMode) errors.jobMode = "Job mode is required";
    if (!values.visaType) errors.visaType = "Visa type is required";
    if (!values.location) errors.location = "Location is required";
    if (!values.jobType) errors.jobType = "Employment type is required";
    if (!values.noOfPositions)
      errors.noOfPositions = "Number of positions is required";
    if (!values.experienceRequired)
      errors.experienceRequired = "Experience required is required";
    if (!values.status) errors.status = "Status is required";

    return errors;
  };

  return (
    <DynamicFormUltra
      config={formConfig}
      onSubmit={handleSubmit}
      title={formTitle}
      initialValues={defaultInitialValues}
      onCancel={handleCancel}
      submitButtonText={submitButtonText}
      validate={validateForm}
    />
  );
};

export default CreateJobRequirement;
