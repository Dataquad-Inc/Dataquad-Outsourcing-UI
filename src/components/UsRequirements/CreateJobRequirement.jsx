import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form } from "formik";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Typography,
  Paper,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Chip,
  OutlinedInput,
} from "@mui/material";
import { fetchAllEmployeesUs } from "../../redux/usEmployees";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreateJobRequirement = ({
  formTitle = "Post New Requirement",
  formInitialValues = {},
  submitButtonText = "Create Requirement",
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobDescriptionType, setJobDescriptionType] = useState("text");

  // Get employees and current user from Redux
  const { employees = [], loadingEmployees } = useSelector(
    (state) => state.usEmployees
  );
  const { userName, userId } = useSelector((state) => state.auth);

  // Fetch employees on component mount
  useEffect(() => {
    dispatch(fetchAllEmployeesUs("SALESEXECUTIVE"));
  }, [dispatch]);

  // Transform employees for multiselect
  const employeeOptions = employees.map((emp) => ({
    label: emp.employeeName || emp.name || emp.email,
    value: emp.employeeId,
  }));

  // Default form values
  const defaultInitialValues = {
    clientName: "",
    jobTitle: "",
    jobMode: "",
    visaType: "",
    location: "",
    jobType: "",
    noOfPositions: 1,
    assignedBy: userName || "",
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

  // Validation function
  const validateForm = (values) => {
    const errors = {};
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
    if (!values.jobDescriptionType)
      errors.jobDescriptionType = "Please select job description type";

    if (values.jobDescriptionType === "text") {
      if (!values.jobDescription || values.jobDescription.trim().length === 0) {
        errors.jobDescription = "Job description is required";
      } else if (values.jobDescription.trim().length < 50) {
        errors.jobDescription =
          "Job description should be at least 50 characters long";
      }
    } else if (values.jobDescriptionType === "file") {
      if (!values.jobDescriptionFile) {
        errors.jobDescriptionFile = "Job description file is required";
      } else {
        const file = values.jobDescriptionFile;
        const allowedTypes = [".pdf", ".doc", ".docx", ".txt"];
        const fileExtension = "." + file.name.split(".").pop().toLowerCase();

        if (!allowedTypes.includes(fileExtension)) {
          errors.jobDescriptionFile =
            "Please upload a valid file type (.pdf, .doc, .docx, .txt)";
        }

        if (file.size > 5 * 1024 * 1024) {
          errors.jobDescriptionFile = "File size should be less than 5MB";
        }
      }
    }
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsSubmitting(true);
      setSubmitting(true);

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
        userIds: values.assignedUsers || [],
      };

      let response;

      if (values.jobDescriptionType === "file" && values.jobDescriptionFile) {
        const formData = new FormData();
        Object.keys(apiPayload).forEach((key) => {
          if (key === "userIds") {
            apiPayload[key].forEach((id) => {
              formData.append("userIds", id);
            });
          } else {
            formData.append(key, apiPayload[key]);
          }
        });

        formData.append(
          "jobDescriptionFile",
          values.jobDescriptionFile,
          values.jobDescriptionFile.name
        );

        response = await axios.post(
          `http://localhost:8090/api/us/requirements/post-requirement/${userId}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        const textPayload = {
          ...apiPayload,
          jobDescription: values.jobDescription?.trim() || "",
        };

        response = await axios.post(
          `http://localhost:8090/api/us/requirements/post-requirement/${userId}`,
          textPayload
        );
      }

      if (response?.data?.success) {
        showSuccessToast("Requirement created successfully!");
        resetForm();
        navigate("/requirements");
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
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/requirements");
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 1200, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        {formTitle}
      </Typography>

      <Formik
        initialValues={defaultInitialValues}
        validate={validateForm}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({
          values,
          errors,
          touched,
          setFieldValue,
          handleChange,
          handleBlur,
        }) => (
          <Form>
            <Grid container spacing={3}>
              {/* Job Details Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Job Details
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="clientName"
                  label="Client Name *"
                  value={values.clientName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.clientName && errors.clientName}
                  helperText={touched.clientName && errors.clientName}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="jobTitle"
                  label="Job Title *"
                  value={values.jobTitle}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.jobTitle && errors.jobTitle}
                  helperText={touched.jobTitle && errors.jobTitle}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  error={touched.jobMode && errors.jobMode}
                >
                  <InputLabel>Job Mode *</InputLabel>
                  <Select
                    name="jobMode"
                    value={values.jobMode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    label="Job Mode *"
                  >
                    <MenuItem value="Remote">Remote</MenuItem>
                    <MenuItem value="Onsite">Onsite</MenuItem>
                    <MenuItem value="Hybrid">Hybrid</MenuItem>
                  </Select>
                  {touched.jobMode && errors.jobMode && (
                    <FormHelperText>{errors.jobMode}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  error={touched.visaType && errors.visaType}
                >
                  <InputLabel>Visa Type *</InputLabel>
                  <Select
                    name="visaType"
                    value={values.visaType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    label="Visa Type *"
                  >
                    <MenuItem value="H1B">H1B</MenuItem>
                    <MenuItem value="OPT">OPT</MenuItem>
                    <MenuItem value="STEM_OPT">STEM OPT</MenuItem>
                    <MenuItem value="OPT_EAD">OPT EAD</MenuItem>
                    <MenuItem value="H4_EAD">H4 EAD</MenuItem>
                    <MenuItem value="GC_EAD">GC EAD</MenuItem>
                    <MenuItem value="CPT">CPT</MenuItem>
                    <MenuItem value="GC">Green Card</MenuItem>
                    <MenuItem value="Citizen">Citizen</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                  {touched.visaType && errors.visaType && (
                    <FormHelperText>{errors.visaType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="location"
                  label="Job Location *"
                  value={values.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.location && errors.location}
                  helperText={touched.location && errors.location}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  error={touched.jobType && errors.jobType}
                >
                  <InputLabel>Employment Type *</InputLabel>
                  <Select
                    name="jobType"
                    value={values.jobType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    label="Employment Type *"
                  >
                    <MenuItem value="FullTime">Full Time</MenuItem>
                    <MenuItem value="PartTime">Part Time</MenuItem>
                    <MenuItem value="Contract">Contract</MenuItem>
                    <MenuItem value="Internship">Internship</MenuItem>
                  </Select>
                  {touched.jobType && errors.jobType && (
                    <FormHelperText>{errors.jobType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="noOfPositions"
                  label="Number of Positions *"
                  type="number"
                  value={values.noOfPositions}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.noOfPositions && errors.noOfPositions}
                  helperText={touched.noOfPositions && errors.noOfPositions}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="assignedBy"
                  label="Assigned By"
                  value={values.assignedBy}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled
                />
              </Grid>

              {/* Requirements Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Requirements
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="experienceRequired"
                  label="Experience Required *"
                  value={values.experienceRequired}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={
                    touched.experienceRequired && errors.experienceRequired
                  }
                  helperText={
                    touched.experienceRequired && errors.experienceRequired
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="relevantExperience"
                  label="Relevant Experience"
                  value={values.relevantExperience}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="qualification"
                  label="Minimum Qualification"
                  value={values.qualification}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="noticePeriod"
                  label="Notice Period"
                  value={values.noticePeriod}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="salaryPackage"
                  label="Salary Package"
                  value={values.salaryPackage}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </Grid>

              {/* Status & Assignment Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Status & Assignment
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={touched.status && errors.status}>
                  <InputLabel>Job Status *</InputLabel>
                  <Select
                    name="status"
                    value={values.status}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    label="Job Status *"
                  >
                    <MenuItem value="Open">Open</MenuItem>
                    <MenuItem value="Closed">Closed</MenuItem>
                    <MenuItem value="OnHold">On Hold</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                  {touched.status && errors.status && (
                    <FormHelperText>{errors.status}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Assign to Users</InputLabel>
                  <Select
                    multiple
                    name="assignedUsers"
                    value={values.assignedUsers}
                    onChange={(e) =>
                      setFieldValue("assignedUsers", e.target.value)
                    }
                    input={<OutlinedInput label="Assign to Users" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => {
                          const emp = employeeOptions.find(
                            (emp) => emp.value === value
                          );
                          return (
                            <Chip
                              key={value}
                              label={emp?.label || value}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {employeeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Job Description Section with Conditional Rendering */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Job Description
                </Typography>
              </Grid>

              {/* Radio Button for Job Description Type */}
              <Grid item xs={12}>
                <FormControl
                  component="fieldset"
                  error={
                    touched.jobDescriptionType && errors.jobDescriptionType
                  }
                >
                  <FormLabel component="legend">
                    How would you like to provide the job description? *
                  </FormLabel>
                  <RadioGroup
                    name="jobDescriptionType"
                    value={values.jobDescriptionType}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setFieldValue("jobDescriptionType", newValue);
                      setJobDescriptionType(newValue);

                      // Clear opposite field when switching
                      if (newValue === "text") {
                        setFieldValue("jobDescriptionFile", null);
                      } else {
                        setFieldValue("jobDescription", "");
                      }
                    }}
                    row
                  >
                    <FormControlLabel
                      value="text"
                      control={<Radio />}
                      label="Enter as Text"
                    />
                    <FormControlLabel
                      value="file"
                      control={<Radio />}
                      label="Upload File"
                    />
                  </RadioGroup>
                  {touched.jobDescriptionType && errors.jobDescriptionType && (
                    <FormHelperText>{errors.jobDescriptionType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Conditional Text Area - Only show when "text" is selected */}
              {values.jobDescriptionType === "text" && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    name="jobDescription"
                    label="Job Description *"
                    placeholder="Enter detailed job description, requirements, and responsibilities..."
                    value={values.jobDescription}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.jobDescription && errors.jobDescription}
                    helperText={touched.jobDescription && errors.jobDescription}
                  />
                </Grid>
              )}

              {/* Conditional File Upload - Only show when "file" is selected */}
              {values.jobDescriptionType === "file" && (
                <Grid item xs={12}>
                  <Box>
                    <input
                      id="jobDescriptionFile"
                      name="jobDescriptionFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      style={{ display: "none" }}
                      onChange={(event) => {
                        const file = event.target.files[0];
                        setFieldValue("jobDescriptionFile", file);
                      }}
                    />
                    <label htmlFor="jobDescriptionFile">
                      <Button
                        variant="outlined"
                        component="span"
                        fullWidth
                        sx={{ mb: 1, p: 2, height: 56 }}
                      >
                        {values.jobDescriptionFile
                          ? values.jobDescriptionFile.name
                          : "Choose Job Description File *"}
                      </Button>
                    </label>

                    {values.jobDescriptionFile && (
                      <Typography variant="body2" color="textSecondary">
                        File: {values.jobDescriptionFile.name} (
                        {(values.jobDescriptionFile.size / 1024).toFixed(2)} KB)
                      </Typography>
                    )}

                    {touched.jobDescriptionFile &&
                      errors.jobDescriptionFile && (
                        <Typography
                          color="error"
                          variant="caption"
                          display="block"
                          sx={{ mt: 1 }}
                        >
                          {errors.jobDescriptionFile}
                        </Typography>
                      )}

                    <FormHelperText>
                      Upload job description file (.pdf, .doc, .docx, .txt)
                    </FormHelperText>
                  </Box>
                </Grid>
              )}

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "flex-end",
                    mt: 3,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting || loadingEmployees}
                  >
                    {isSubmitting ? "Creating..." : submitButtonText}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </Paper>
  );
};

export default CreateJobRequirement;
