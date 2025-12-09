import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import { fetchRecruiters, fetchEmployeesUs } from "../../redux/usEmployees";
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
  const {
    recruiters = [],
    employees = [],
    loadingEmployees,
  } = useSelector((state) => state.usEmployees);
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

  const teamLeadOptions = employees.map((emp) => ({
    label: emp.employeeName,
    value: emp.employeeId,
  }));

  const clientOptions = clients.map((client) => ({
    label: client.clientName,
    value: client.clientName,
  }));

  useEffect(() => {
    dispatch(fetchRecruiters("RECRUITER"));
    dispatch(fetchEmployeesUs("TEAMLEAD"));
    fetchClients();
  }, [dispatch]);

  // Default form values
  const defaultInitialValues = {
    clientName: "",
    jobTitle: "",
    jobMode: "",
    visaType: [],
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
    teamLeadIds: [],
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
          type: "multiselect",
          required: false,
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
          name: "billRate",
          label: "Bill Rate",
          type: "text",
          helperText:
            "Amount charged to the client per hour/day for this resource",
          icon: "AttachMoney",
        },
        {
          name: "payRate",
          label: "Pay Rate",
          type: "text",
          helperText: "Amount paid to the employee (CTC or hourly/daily rate)",
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
        {
          name: "teamsLeadIds",
          label: "Assign to Teamleads",
          type: "multiselect",
          options: teamLeadOptions,
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
      const formData = new FormData();

      // Attach text fields
      formData.append("jobTitle", values.jobTitle);
      formData.append("clientId", values.clientId);
      formData.append("clientName", values.clientName);
      formData.append("jobType", values.jobType);
      formData.append("location", values.location);
      formData.append("jobMode", values.jobMode);
      formData.append("experienceRequired", values.experienceRequired);
      formData.append("relevantExperience", values.relevantExperience || "");
      formData.append("noticePeriod", values.noticePeriod || "");
      formData.append("qualification", values.qualification || "");
      formData.append("salaryPackage", values.salaryPackage || "");
      formData.append("billRate", values.billRate || "");
      formData.append("payRate", values.payRate || "");
      formData.append("noOfPositions", parseInt(values.noOfPositions) || 1);
      formData.append("visaType", (values.visaType || []).join(","));
      formData.append("remarks", values.remarks || "");

      // formData.append(
      //   "visaType",
      //   (values.visaType || []).join(",")
      // );

      // Convert array → comma string
      formData.append("assignedUsers", (values.assignedUsers || []).join(","));

      formData.append("teamsLeadIds", (values.teamsLeadIds || []).join(","));

      // Handle job description (file or text)
      formData.append("jobDescription", values.jobDescription?.trim() || "");

      // Always send JD file if selected
      if (values.jobDescriptionFile instanceof File) {
        formData.append(
          "jobDescriptionFile",
          values.jobDescriptionFile,
          values.jobDescriptionFile.name
        );
      }

      // API call
      const response = await axios.post(
        `https://mymulya.com/api/us/requirements/v2/post-requirement/${userId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Success
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
