// Fix for the recruiter multiselect field

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
} from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import httpService from "../../../Services/httpService";
import { fetchAllClients } from "../../../redux/clientsSlice";
import { fetchEmployees } from "../../../redux/employeesSlice";
import DynamicForm from "../../FormContainer/DynamicForm";
import ComponentTitle from "../../../utils/ComponentTitle";
import WorkIcon from "@mui/icons-material/Work";
import { qualifications } from "../../../utils/qualifications";


const PostRequirement = ({onClose}) => {
  const dispatch = useDispatch();
  const [descriptionType, setDescriptionType] = useState("text");
  const [submitting, setSubmitting] = useState(false);

  // Get client and employee data from Redux store
  const { list: clients, loading: clientsLoading } = useSelector(
    (state) => state.clients
  );
  const { employeesList, fetchStatus: employeesLoading } = useSelector(
    (state) => state.employee
  );
  const { userId, userName } = useSelector((state) => state.auth);

  // Fetch clients and employees data when component mounts
  useEffect(() => {
    dispatch(fetchAllClients());
    dispatch(fetchEmployees());
  }, [dispatch]);

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
          emp.status === "ACTIVE" || emp.employeeId === userId 
      )
      ?.map((emp) => ({
        label: `${emp.userName} (${emp.employeeId})`,
        value: emp.employeeId,
      })) || [];

  const teamleadOptions=
  employeesList?.filter(
       (emp)=>(emp.roles === "TEAMLEAD" || emp.roles=="BDM" || emp.roles==="SUPERADMIN") &&
       emp.status === "ACTIVE"
  )
  ?.map((emp)=>({
    label:`${emp.userName} (${emp.employeeId})`,
    value:emp.employeeId,
  })) || []    

  // Find current user's full name from employee list
  const currentUser = employeesList?.find((emp) => emp.employeeId === userId);
  const assignedByName = currentUser?.userName || userName || userId || "";

  const fieldGridProps = { xs: 12, sm: 6, md: 6, lg: 4, xl: 4, xxl: 3 };

  // Validation schemas
  const experienceValidation = Yup.number()
    .min(0, "Must be positive")
    .max(50, "Maximum 50 years")
    .required("Required");

  const initialValues = {
    jobTitle: "",
    clientName: "",
    jobType: "Full-Time",
    location: "",
    jobMode: "Onsite",
    experienceRequired: 0,
    relevantExperience: 0,
    qualification: "",
    recruiters: [],
    salaryPackage: "",
    noOfPositions: 1,
    status: "In Progress",
    assignedBy: assignedByName,
    assignedTo:"",
    jobDescription: "",
    jobDescriptionFile: null,
    noticePeriod: "",
  };

  const baseFields = [
    {
      name: "clientName",
      label: "Client Name",
      type: "select",
      required: true,
      options: clientOptions,
      validation: Yup.string().required("Client Name is required"),
      gridProps: fieldGridProps,
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
      validation: Yup.string().required("Notice period is required"),
      gridProps: fieldGridProps,
    },

    {
      name: "qualification",
      label: "Qualification",
      type: "select",
      options: [
        ...qualifications
      ],
      validation: Yup.string().required("Qualification is required"),
      gridProps: fieldGridProps,
    },

    {
      name: "salaryPackage",
      label: "Salary Package (LPA)",
      type: "number",
      validation: Yup.number().min(0),
      gridProps: fieldGridProps,
      InputProps: {
        endAdornment: <InputAdornment position="end">LPA</InputAdornment>,
      },
    },
    {
      name: "noOfPositions",
      label: "No. of Positions",
      type: "number",
      required: true,
      validation: Yup.number().min(1).required("Required"),
      gridProps: fieldGridProps,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "In Progress", value: "In Progress" },
        { label: "On Hold", value: "On Hold" },
        { label: "Closed", value: "Closed" },
      ],
      gridProps: fieldGridProps,
    },
    {
      name: "assignedBy",
      label: "Assigned By",
      type: "text",
      required: true,
      disabled: true,
      initialValue: assignedByName,
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
      name: "recruiters",
      label: "Recruiters",
      type: "multiselect",
      required: true,
      options: recruiterOptions,
      validation: Yup.array()
        .min(1, "At least one recruiter must be assigned")
        .required("Required"),
      gridProps: fieldGridProps,
      helperText: "Select talent acquisition specialists to assign this job",

      SelectProps: {
        multiple: true,
        renderValue: (selected) => {
          if (!selected || selected.length === 0) return "Select recruiters";
          if (selected.length <= 2) {
            return selected
              .map((id) => {
                const recruiter = recruiterOptions.find((r) => r.value === id );
                return recruiter?.label.split(" (")[0] || id;
              })
              .join(", ");
          }
          return `${selected.length} recruiters selected`;
        },
      },
    },
  ];

  const descriptionField =
    descriptionType === "text"
      ? {
          name: "jobDescription",
          label: "Job Description",
          type: "textarea",
          required: true,
          validation: Yup.string()
            .min(10, "Minimum 10 characters required")
            .required("Job Description is required"),
          gridProps: { xs: 12 ,md:6 },
          rows: 4,
        }
      : {
          name: "jobDescriptionFile",
          label: "Job Description File",
          type: "file",
          required: true,
          accept: ".pdf,.doc,.docx",
          validation: Yup.mixed()
            .required("File is required")
            .test(
              "fileFormat",
              "Unsupported Format (PDF or Word only)",
              (value) =>
                !value ||
                [
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ].includes(value.type)
            ),
          gridProps: { xs: 12 },
        };

  const handleSubmit = async (values, { resetForm, setFieldError }) => {
    // No need to separately validate recruiters as we've added the validation in the field definition

    setSubmitting(true);
    const formData = new FormData();

    // Basic fields with null checks
    formData.append("jobTitle", values.jobTitle || "");
    formData.append("clientName", values.clientName || "");
    formData.append("location", values.location || "");
    formData.append(
      "experienceRequired",
      `${values.experienceRequired || 0} years`
    );
    formData.append(
      "relevantExperience",
      `${values.relevantExperience || 0} years`
    );
    formData.append("qualification", values.qualification || "");

    // Better salary handling
    const salary = values.salaryPackage ? Number(values.salaryPackage) : 0;
    formData.append("salaryPackage", `${salary} LPA`);

    formData.append("noOfPositions", Number(values.noOfPositions) || 1);
    formData.append("jobType", values.jobType || "");
    formData.append("jobMode", values.jobMode || "");
    formData.append("noticePeriod", values.noticePeriod || "");
    formData.append("status", values.status || "In Progress");
    formData.append("assignedBy", values.assignedBy || assignedByName);
   
   const selectedTL = employeesList.find(emp => emp.employeeId === values.assignedTo);
   formData.append("assignedTo", selectedTL?.userName || values.assignedTo || "");


    // Safer recruiter data handling
    if (values.recruiters && values.recruiters.length > 0) {
      const selectedRecruiters = employeesList.filter((emp) =>
        values.recruiters.includes(emp.employeeId)
      );

      if (selectedRecruiters.length > 0) {
        const recruiterIds = selectedRecruiters.map((rec) => rec.employeeId);
        const recruiterNames = selectedRecruiters.map((rec) => rec.userName);

        formData.append("recruiterIds", JSON.stringify(recruiterIds));
        formData.append("recruiterName", JSON.stringify(recruiterNames));
      } else {
        formData.append("recruiterIds", JSON.stringify([]));
        formData.append("recruiterName", JSON.stringify([]));
      }
    } else {
      formData.append("recruiterIds", JSON.stringify([]));
      formData.append("recruiterName", JSON.stringify([]));
    }

    // Description type
    if (descriptionType === "text") {
      formData.append("jobDescription", values.jobDescription || "");
    } else if (descriptionType === "file" && values.jobDescriptionFile) {
      formData.append("jobDescriptionFile", values.jobDescriptionFile);
    }

    try {
      const response = await httpService.post(
        "/requirements/assignJob",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success(
          `Job Created Successfully! Job Title: ${
            response.data.data.jobTitle
          }, Job ID: ${response.data.data.jobId}. ${
            response.data.data.successMessage || ""
          }`
        );
        resetForm();
        setDescriptionType("text");
        onClose?.();
      } else {
        toast.error(`${response.data.message} - ${response.data.error || ""}`);
      }
    } catch (error) {
      console.error("API Error:", error);
      toast.error(
        error.response?.data?.message || "Failed to post job requirement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%", p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <ComponentTitle title="Post Job Requirement" icon={<WorkIcon />} />

        <Grid container spacing={3}>
          {/* Description Type Selector */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel
                component="legend"
                sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}
              >
                Job Description Type
              </FormLabel>
              <RadioGroup
                row
                value={descriptionType}
                onChange={handleDescriptionChange}
                sx={{
                  gap: 2,
                  px: 1,
                  py: 0.5,
                  border: "1px solid #ccc",
                  borderRadius: 2,
                  backgroundColor: "#f9f9f9",
                }}
              >
                <FormControlLabel
                  value="text"
                  control={<Radio size="small" />}
                  label="Text"
                  sx={{
                    "& .MuiFormControlLabel-label": {
                      fontWeight: 500,
                    },
                  }}
                />
                <FormControlLabel
                  value="file"
                  control={<Radio size="small" />}
                  label="File Upload"
                  sx={{
                    "& .MuiFormControlLabel-label": {
                      fontWeight: 500,
                    },
                  }}
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Dynamic Form */}
          <Grid item xs={12}>
            <DynamicForm
              initialValues={initialValues}
              fields={[...baseFields, descriptionField]}
              onSubmit={handleSubmit}
              onCancel={onClose}
              submitButtonText="Post Job"
              enableReinitialize={true}
              buttonConfig={{
                showSubmit: true,
                showReset: true,
                submitLabel: "Post Requirement",
                resetLabel: "Reset Form",
                submitColor: "primary",
                resetColor: "error",
                submitVariant: "contained",
                resetVariant: "outlined",
                submitSx: {
                  width: { xs: "100%", sm: "200px" },
                  height: "42px",
                  borderRadius: "8px",
                  fontWeight: 600,
                },
                resetSx: {
                  width: { xs: "100%", sm: "120px" },
                  height: "42px",
                  borderRadius: "8px",
                  ml: { xs: 0, sm: 2 },
                  mt: { xs: 2, sm: 0 },
                },
                submitDisabled: submitting,
              }}
              gridContainerProps={{
                spacing: 2,
                sx: { mt: 1 },
              }}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PostRequirement;