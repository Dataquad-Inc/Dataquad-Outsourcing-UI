import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import * as Yup from "yup";
import {
  Box,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
  Grid,
  Paper,
  FormLabel,
  InputAdornment,
  Button,
  IconButton,
  Skeleton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import "react-toastify/dist/ReactToastify.css";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import { fetchAllClients } from "../../redux/clientsSlice";
import { fetchEmployees } from "../../redux/employeesSlice";
import DynamicForm from "../FormContainer/DynamicForm";
import EditIcon from "@mui/icons-material/Edit";

const EditRequirement = ({ requirementData, onClose }) => {
  const dispatch = useDispatch();
  const [descriptionType, setDescriptionType] = useState("text");
  const [submitting, setSubmitting] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Get client and employee data from Redux store
  const { list: clients, loading: clientsLoading } = useSelector(
    (state) => state.clients
  );
  const { employeesList, fetchStatus: employeesLoading } = useSelector(
    (state) => state.employee
  );

  // Fetch clients and employees data when component mounts
  useEffect(() => {
    dispatch(fetchAllClients());
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Process requirement data to create initial values
  useEffect(() => {
    if (requirementData) {
      // Determine if there's a job description file
      const hasJobDescriptionFile =
        requirementData.jobDescriptionFile ||
        requirementData.jobDescriptionBlob;

      // Set description type based on what's available
      setDescriptionType(
        requirementData.jobDescription
          ? "text"
          : hasJobDescriptionFile
          ? "file"
          : "text"
      );

      // Process recruiter IDs and Names from the requirement data
      let recruiterIds = [];
      let recruiterNames = [];
      
      // Handle recruiterIds
      if (Array.isArray(requirementData.recruiterIds)) {
        recruiterIds = requirementData.recruiterIds;
      } else if (typeof requirementData.recruiterIds === "string") {
        try {
          recruiterIds = JSON.parse(requirementData.recruiterIds);
        } catch (e) {
          console.error("Failed to parse recruiter IDs", e);
        }
      }
      
      // Handle recruiterName
      if (Array.isArray(requirementData.recruiterName)) {
        recruiterNames = requirementData.recruiterName;
      } else if (typeof requirementData.recruiterName === "string") {
        try {
          recruiterNames = JSON.parse(requirementData.recruiterName);
        } catch (e) {
          console.error("Failed to parse recruiter names", e);
        }
      }

      // Extract numeric values from strings
      const extractNumber = (str) => {
        if (!str) return "";
        const match = str.match(/(\d+(\.\d+)?)/);
        return match ? match[1] : "";
      };

      // Set initial values for the form
      setInitialValues({
        jobId: requirementData.jobId || "",
        jobTitle: requirementData.jobTitle || "",
        clientName: requirementData.clientName || "",
        jobType: requirementData.jobType || "Full-Time",
        location: requirementData.location || "",
        jobMode: requirementData.jobMode || "Onsite",
        experienceRequired:
          extractNumber(requirementData.experienceRequired) || 0,
        relevantExperience:
          extractNumber(requirementData.relevantExperience) || 0,
        qualification: requirementData.qualification || "",
        recruiterIds: recruiterIds || [],
        recruiterName: recruiterNames || [],
        salaryPackage: extractNumber(requirementData.salaryPackage) || "",
        noOfPositions: requirementData.noOfPositions || 1,
        status: requirementData.status || "In Progress",
        assignedBy: requirementData.assignedBy || "",
        // Set assignedTo to the name directly for display
        assignedTo: requirementData.assignedBy || "",
        jobDescription: requirementData.jobDescription || "",
        noticePeriod: requirementData.noticePeriod || "",
      });
      
      setIsLoading(false);
    }
  }, [requirementData]);

  const handleDescriptionChange = (event) => {
    setDescriptionType(event.target.value);
  };

  // Format client options for the dropdown
  const clientOptions =
    clients?.flatMap((client) => {
      const parent = {
        label: client.clientName,
        value: client.clientName,
      };

      const children =
        client.supportingCustomers?.map((customer) => ({
          label: `${client.clientName} - ${customer}`,
          value: `${client.clientName}__${customer}`, // Combine both for uniqueness
        })) || [];

      return [parent, ...children];
    }) || [];

  // Format employee/recruiter options for the dropdown - only showing active recruiters
  const recruiterOptions =
    employeesList
      ?.filter(
        (emp) =>
          (emp.roles === "TEAMLEAD" || emp.roles === "EMPLOYEE") &&
          emp.status === "ACTIVE"
      )
      ?.map((emp) => ({
        label: `${emp.userName} (${emp.employeeId})`,
        value: emp.employeeId,
        name: emp.userName
      })) || [];

   const teamleadOptions = 
      employeesList
      ?.filter((emp)=>(emp.roles==="TEAMLEAD" || emp.roles==="BDM" || emp.roles ==="SUPERADMIN") && 
      emp.status==="ACTIVE"
    ) 
      ?.map((emp)=>({
        label: `${emp.userName} (${emp.employeeId})`,
        value: emp.userName, // Use name as value for display
        name: emp.userName,
        employeeId: emp.employeeId // Keep ID for reference if needed
      })) || [];  

  const fieldGridProps = { xs: 12, sm: 6, md: 6, lg: 4, xl: 4, xxl: 3 };

  // Validation schemas
  const experienceValidation = Yup.number()
    .min(0, "Must be positive")
    .max(50, "Maximum 50 years")
    .required("Required");

  const baseFields = [
    {
      name: "jobId",
      label: "Job ID",
      type: "text",
      disabled: true,
      gridProps: fieldGridProps,
    },
    {
      name: "clientName",
      label: "Client Name",
      type: "select",
      required: true,
      options: clientsLoading
        ? [{ label: "Loading...", value: "" }]
        : clientOptions,
      validation: Yup.string().required("Client Name is required"),
      gridProps: fieldGridProps,
      disabled:true,
    },
    {
      name: "jobTitle",
      label: "Job Title",
      type: "text",
      required: true,
      validation: Yup.string().required("Job Title is required"),
      gridProps: fieldGridProps,
    },
    {
      name: "jobType",
      label: "Job Type",
      type: "select",
      required: true,
      options: [
        { label: "Full-Time", value: "Full-Time" },
        { label: "Part-Time", value: "Part-Time" },
        { label: "Contract", value: "Contract" },
      ],
      gridProps: fieldGridProps,
    },
    {
      name: "location",
      label: "Job Location",
      type: "text",
      required: true,
      gridProps: fieldGridProps,
    },
    {
      name: "jobMode",
      label: "Job Mode",
      type: "select",
      required: true,
      options: [
        { label: "Onsite", value: "Onsite" },
        { label: "Remote", value: "Remote" },
        { label: "Hybrid", value: "Hybrid" },
      ],
      gridProps: fieldGridProps,
    },
    {
      name: "experienceRequired",
      label: "Experience Required (in years)",
      type: "number",
      required: true,
      validation: experienceValidation,
      gridProps: fieldGridProps,
    },
    {
      name: "relevantExperience",
      label: "Relevant Experience (in years)",
      type: "number",
      validation: Yup.number().min(0).max(50),
      gridProps: fieldGridProps,
    },
    {
      name: "noticePeriod",
      label: "Notice Period",
      type: "select",
      options: [
        { label: "Immediate", value: "Immediate" },
        { label: "15 Days", value: "15 Days" },
        { label: "30 Days", value: "30 Days" },
        { label: "60 Days", value: "60 Days" },
        { label: "90 Days", value: "90 Days" },
      ],
      validation: Yup.string().required("Notice Period is required"),
      gridProps: fieldGridProps,
    },
    {
      name: "qualification",
      label: "Qualification",
      type: "text",
      gridProps: fieldGridProps,
    },
    {
      name: "assignedTo",
      label: "Assigned To (Team Lead)",
      type: "select",
      options: teamleadOptions,
      gridProps: fieldGridProps,
    },
    {
      name: "recruiterIds",
      label: "Assigned Recruiters",
      type: "multiselect",
      options: recruiterOptions,
      getOptionLabel: (option) => {
        const recruiter = recruiterOptions.find(r => r.value === option);
        return recruiter ? recruiter.name : option;
      },
      validation: Yup.array().min(1, "At least one recruiter is required"),
      gridProps: fieldGridProps,
    },
    {
      name: "salaryPackage",
      label: "Salary Package (LPA)",
      type: "number",
      InputProps: {
        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
      },
      validation: Yup.number().min(0, "Must be positive"),
      gridProps: fieldGridProps,
    },
    {
      name: "noOfPositions",
      label: "Number of Positions",
      type: "number",
      required: true,
      validation: Yup.number()
        .min(1, "At least 1 position required")
        .required("Required"),
      gridProps: fieldGridProps,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "IN-PROGRESS", value: "In Progress" },
        { label: "SUBMITTED", value: "Submitted" },
        { label: "HOLD", value: "Hold" },
        { label: "CLOSED", value: "Closed" },
      ],
      gridProps: fieldGridProps,
    },
  ];

  // Generate additional fields based on description type
  const getAdditionalFields = () => {
    if (descriptionType === "text") {
      return [
        {
          name: "jobDescription",
          label: "Job Description",
          type: "textarea",
          rows: 6,
          placeholder: "Enter detailed job description...",
          gridProps: { xs: 12 },
          validation: Yup.string().required("Job Description is required"),
        },
      ];
    } else {
      return [
        {
          name: "jobDescriptionFile",
          label: "Job Description File",
          type: "file",
          accept: ".pdf,.doc,.docx",
          gridProps: { xs: 12 },
          helperText: "Upload PDF, DOC, or DOCX file (Max size: 5MB)",
          validation: Yup.mixed()
            .test(
              "fileSize",
              "File too large (max 5MB)",
              (value) => !value || value.size <= 5 * 1024 * 1024
            )
            .test(
              "fileType",
              "Unsupported file format",
              (value) =>
                !value ||
                [
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ].includes(value.type)
            ),
        },
      ];
    }
  };

  // Combine base fields with additional fields
  const formFields = [...baseFields, ...getAdditionalFields()];

  // Validation schema
  const validationSchema = Yup.object().shape(
    formFields.reduce((schema, field) => {
      if (field.validation) {
        schema[field.name] = field.validation;
      }
      return schema;
    }, {})
  );

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setSubmitting(true);

    // Show loading toast
    const toastId = ToastService.loading("Updating requirement...");

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add all form fields to FormData
      Object.keys(values).forEach((key) => {
        if (key === "recruiterIds") {
          // Handle array of recruiters
          formData.append(key, JSON.stringify(values[key]));
          // Also add recruiter names based on selected IDs
          const selectedRecruiters = values[key].map(id => {
            const recruiter = recruiterOptions.find(r => r.value === id);
            return recruiter ? recruiter.name : id;
          });
          formData.append("recruiterName", JSON.stringify(selectedRecruiters));
        } else if (key === "jobDescription" && values[key]) {
          // Only append file if it exists
          formData.append(key, values[key]);
        } else if (key === "assignedTo") {
          // assignedTo is already the name, append it directly
          formData.append(key, values[key]);
        } else if (key !== "recruiterName") { // Skip recruiterName as we handle it above
          // Add other fields
          formData.append(key, values[key]);
        }
      });
      
      // Append description type
      formData.append("descriptionType", descriptionType);

      // Make PUT request to update the requirement
      const jobId = values.jobId;
      formData.delete("jobId");
      let response;
      response = await httpService.put(
        `/requirements/updateRequirement/${jobId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          }
        }
      );

      if (response.data.success) {
        // Update loading toast to success
        ToastService.update(toastId, "Requirement updated successfully!", "success");
        onClose(); // Close the drawer
      } else {
        // Update loading toast to error
        ToastService.update(
          toastId,
          response.data.message || "Failed to update requirement",
          "error"
        );
      }
    } catch (error) {
      console.error("Update error:", error);
      // Update loading toast to error
      ToastService.update(
        toastId,
        error.response?.data?.message || "Failed to update requirement",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading skeleton when data is being fetched
  const renderLoadingSkeleton = () => (
    <Box sx={{ width: "100%" }}>
      <Skeleton variant="text" height={60} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={80} sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        {Array(9).fill(0).map((_, index) => (
          <Grid item key={index} xs={12} sm={6} md={4}>
            <Skeleton variant="rectangular" height={80} />
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Skeleton variant="rectangular" width={100} height={40} />
          <Skeleton variant="rectangular" width={100} height={40} />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: 3, height: "100%", overflowY: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <EditIcon sx={{ mr: 1, color: "#1976d2" }} />
          Edit Requirement
        </Typography>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(244, 67, 54, 0.1)', // Light red background on hover
              color: '#f44336', // Red color on hover
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: "#f5f5f5" }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Job Description Format</FormLabel>
          <RadioGroup
            row
            value={descriptionType}
            onChange={handleDescriptionChange}
            name="descriptionType"
          >
            <FormControlLabel
              value="text"
              control={<Radio />}
              label="Text Description"
            />
            <FormControlLabel
              value="file"
              control={<Radio />}
              label="Upload File"
            />
          </RadioGroup>
        </FormControl>
      </Paper>

      {isLoading ? (
        renderLoadingSkeleton()
      ) : Object.keys(initialValues).length > 0 ? (
        <DynamicForm
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          fields={formFields}
          submitButtonText="Update Requirement"
          cancelButtonText="Cancel"
          onCancel={onClose}
          loading={submitting}
          gridSpacing={2}
          onClose={onClose}
          columnSpacing={3}
          gridContainerProps={{ alignItems: "stretch" }}
        />
      ) : (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">
            No requirement data available
          </Typography>
          <Button 
            variant="outlined" 
            onClick={onClose}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default EditRequirement;