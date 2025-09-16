import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import DynamicFormUltra from "../FormContainer/DynamicFormUltra";
import { fetchEmployeesUs } from "../../redux/usEmployees";

const EditJobRequirement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { jobId } = useParams(); // Get jobId from URL params

  // Get employees and current user from Redux
  const { employees = [], loadingEmployees } = useSelector(
    (state) => state.usEmployees
  );
  const { userName, userId } = useSelector((state) => state.auth);

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Transform employees for multiselect
  const employeeOptions = employees.map((emp) => ({
    label: emp.employeeName,
    value: emp.employeeId,
  }));

  useEffect(() => {
    dispatch(fetchEmployeesUs("TEAMLEAD"));
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchRequirementData();
    }
  }, [jobId, employees]);

  // Fetch existing requirement data
  const fetchRequirementData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://mymulya.com/api/us/requirements/requirement-id/${jobId}`
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Transform assignedUserIds to match the multiselect format
        let assignedUsersArray = [];
        if (data.assignedUserIds) {
          // Split the comma-separated string and convert to numbers if needed
          const userIds = data.assignedUserIds.split(",").map(id => {
            // Handle both string and number IDs
            const trimmedId = id.toString().trim();
            // Try to convert to number if it's a numeric string
            const numericId = !isNaN(trimmedId) ? parseInt(trimmedId) : trimmedId;
            return numericId;
          });
          
          // Filter to only include IDs that exist in employeeOptions
          assignedUsersArray = userIds.filter(id => 
            employeeOptions.some(emp => emp.value === id)
          );
        }
        
        // Alternative approach: if you have assignedUsers array in the response
        // You can also try using data.assignedUsers if it exists
        if (data.assignedUsers && Array.isArray(data.assignedUsers)) {
          assignedUsersArray = data.assignedUsers.map(user => user.userId || user.employeeId);
        }
        
        // Transform the API data to match form structure
        const formData = {
          clientName: data.clientName || "",
          jobTitle: data.jobTitle || "",
          jobMode: data.jobMode || "",
          visaType: data.visaType || "",
          location: data.location || "",
          jobType: data.jobType || "",
          noOfPositions: data.noOfPositions || 1,
          assignedBy: data.assignedBy || userName || "",
          experienceRequired: data.experienceRequired || "",
          relevantExperience: data.relevantExperience || "",
          qualification: data.qualification || "",
          noticePeriod: data.noticePeriod || "",
          salaryPackage: data.salaryPackage || "",
          status: data.status || "Open",
          assignedUsers: assignedUsersArray, // Use the processed array
          jobDescription: data.jobDescription || "",
          // Note: jobDescriptionFile will be handled separately if needed
        };
        
        console.log("Form data with assigned users:", formData.assignedUsers);
        console.log("Available employee options:", employeeOptions);
        
        setInitialData(formData);
      } else {
        showErrorToast("Failed to load requirement data");
        navigate("/dashboard/us-requirements");
      }
    } catch (error) {
      console.error("Error fetching requirement:", error);
      showErrorToast("Failed to load requirement data");
      navigate("/dashboard/us-requirements");
    } finally {
      setLoading(false);
    }
  };

  // Form configuration (same as CreateJobRequirement)
  const formConfig = [
    {
      section: "Job Details",
      fields: [
        {
          name: "clientName",
          label: "Client Name",
          type: "text",
          required: true,
          icon: "BusinessCenter",
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
          label: "Update Job Description File",
          type: "file",
          accept: ".pdf,.doc,.docx,.txt",
          maxSize: 5,
          helperText:
            "Upload new job description file (.pdf, .doc, .docx, .txt) - Max 5MB",
        },
      ],
    },
  ];

  // Handle form submission for editing
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

      if (values.jobDescriptionFile) {
        formData.append(
          "jobDescriptionFile",
          values.jobDescriptionFile,
          values.jobDescriptionFile.name
        );
      } else {
        formData.append("jobDescription", values.jobDescription?.trim() || "");
      }

      // Use the same endpoint but with PUT method and jobId as parameter
      const response = await axios.post(
        `https://mymulya.com/api/us/requirements/post-requirement/${jobId}?userId=${userId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response?.data?.success) {
        showSuccessToast("Requirement updated successfully!");
        navigate(`/dashboard/us-requirements`);
      } else {
        showErrorToast(
          response?.data?.message || "Failed to update requirement"
        );
      }
    } catch (error) {
      console.error("Error updating requirement:", error);
      showErrorToast(
        error.response?.data?.message || "Failed to update requirement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/dashboard/us-requirements/${jobId}`);
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

  if (loading || loadingEmployees) {
    return <div>Loading requirement data...</div>;
  }

  return (
    <DynamicFormUltra
      config={formConfig}
      onSubmit={handleSubmit}
      title="Edit Job Requirement"
      initialValues={initialData}
      onCancel={handleCancel}
      submitButtonText="Update Requirement"
      validate={validateForm}
    />
  );
};

export default EditJobRequirement;