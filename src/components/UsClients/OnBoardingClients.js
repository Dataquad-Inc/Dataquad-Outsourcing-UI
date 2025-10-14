import React, { useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

// Material-UI imports
import {
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  IconButton,
  InputAdornment,
  Stack,
  Divider,
  CircularProgress,
  ThemeProvider,
  createTheme,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";

import {
  AddCircleOutline,
  RemoveCircleOutline,
  Business,
  LocationOn,
  WorkOutline,
  AttachMoney,
  Language,
  LinkedIn,
  Person,
  Email,
  AttachFile,
  People,
  Save,
  RestartAlt,
  Phone,
  Cancel,
  Assignment,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import httpService from "../../Services/httpService";

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: { main: "#1a237e" },
    secondary: { main: "#0d47a1" },
    background: { default: "#f8f9fa" },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 8px 16px 0 rgba(0,0,0,0.1)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": { borderRadius: 8 },
        },
      },
    },
  },
});

const ClientForm = ({
  initialData = null,
  onSubmit,
  isEdit = false,
  onCancel,
  showToast = toast,
}) => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState(initialData?.currency || "USD");
  const { userName } = useSelector((state) => state.auth);
  const [onBoardedByName, setOnBoardedBy] = useState(
    initialData?.onBoardedBy || userName
  );

  const { employeesList: employees = [] } = useSelector(
    (state) => state.employee || {}
  );

  useEffect(() => {
    if (initialData) {
      setCurrency(initialData.currency || "INR");
      setOnBoardedBy(initialData.onBoardedBy || "");

      // Initialize files if editing and supportingDocuments are available
      if (
        isEdit &&
        initialData.supportingDocuments &&
        Array.isArray(initialData.supportingDocuments)
      ) {
        setFiles(
          initialData.supportingDocuments.map((docName) => ({
            name: docName,
            isExisting: true,
          }))
        );
      }
    }
  }, [initialData, isEdit]);

  const formFields = [
    {
      section: "Basic Information",
      fields: [
        {
          name: "clientName",
          label: "Client Name",
          required: true,
          type: "text",
          xs: 12, sm: 6, md: 4,
          icon: <Business color="primary" />,
        },
        {
          name: "positionType",
          label: "Position Type",
          type: "select",
          xs: 12, sm: 6, md: 4,
          icon: <WorkOutline color="primary" />,
          options: [
            { value: "Full-Time", label: "Full-Time" },
            { value: "Part-Time", label: "Part-Time" },
            { value: "Contract", label: "Contract" },
            { value: "Internship", label: "Internship" },
          ],
        },
        // {
        //   name: "assignedTo",
        //   label: "Assigned To",
        //   type: "text",
        //   xs: 12, sm: 6, md: 4,
        //   icon: <Assignment color="primary" />,
        // },
        {
          name: "clientWebsiteUrl",
          label: "Client Website URL",
          type: "url",
          placeholder: "https://",
          xs: 12, sm: 6, md: 4,
          icon: <Language color="primary" />,
        },
        {
          name: "clientLinkedInUrl",
          label: "Client LinkedIn URL",
          type: "url",
          placeholder: "https://linkedin.com/company/",
          xs: 12, sm: 6, md: 4,
          icon: <LinkedIn color="primary" />,
        },
        {
          name: "clientAddress",
          label: "Client Address",
          type: "text",
          placeholder: "Enter complete address",
          xs: 12, md: 8,
          icon: <LocationOn color="primary" />,
        },
      ],
    },
    {
  section: "Payment Information",
  fields: [
    {
      name: "currency",
      label: "Currency",
      type: "select",
      xs: 12, sm: 6, md: 3,
      icon: <AttachMoney color="primary" />,
      defaultValue: "USD", // Add this line
      options: [
        // { value: "INR", label: "Rupee (INR)" },
        { value: "USD", label: "Dollar (USD)" },
      ],
      customHandler: (e, setFieldValue) => {
        setCurrency(e.target.value);
        setFieldValue("currency", e.target.value);
      },
    },
    {
      name: "netPayment",
      label: "Net Payment",
      type: "number",
      placeholder: "0",
      xs: 12, sm: 6, md: 3,
      endAdornment: <InputAdornment position="end">Days</InputAdornment>,
    },
  ],
},
  ];

  const validationSchema = Yup.object().shape({
    clientName: Yup.string()
      .required("Client name is required")
      .max(50, "Client name must be at most 50 characters"),
    clientAddress: Yup.string()
      .nullable()
      .max(250, "Client address must be at most 250 characters"),
    positionType: Yup.string().nullable(),
    assignedTo: Yup.string().nullable(),
    netPayment: Yup.number()
      .positive("Must be a positive number")
      .nullable()
      .transform((value, originalValue) =>
        originalValue === "" ? null : value
      ),
    supportingCustomers: Yup.array().of(
      Yup.object().shape({
        customerName: Yup.string().nullable(),
        netPayment: Yup.number()
          .min(0, "Net Payment cannot be negative")
          .nullable()
          .transform((value, originalValue) => originalValue === "" ? null : value)
      })
    ),
    clientWebsiteUrl: Yup.string()
      .url("Must be a valid URL")
      .nullable()
      .transform((value) => (value === "" ? null : value)),
    clientLinkedInUrl: Yup.string()
      .url("Must be a valid URL")
      .nullable()
      .transform((value) => (value === "" ? null : value)),
    clientSpocName: Yup.array().of(Yup.string().nullable()),
    clientSpocEmailid: Yup.array().of(
      Yup.string().email("Invalid email format").nullable()
    ),
    clientSpocMobileNumber: Yup.array().of(
      Yup.string()
        .matches(
          /^[0-9]{10}$|^[0-9]{15}$/,
          "Phone number must be either 10 or 15 digits"
        )
        .nullable()
    ),
    clientSpocLinkedin: Yup.array().of(
      Yup.string()
        .url("Must be a valid LinkedIn URL")
        .nullable()
        .transform((value) => (value === "" ? null : value))
    ),
    supportingDocuments: Yup.array().of(Yup.string().nullable()).nullable(),
    onBoardedBy: Yup.string().nullable(),
    feedBack: Yup.string()
      .nullable()
      .max(1000, "Feedback must be at most 1000 characters")
      .transform((value) => (value === "" ? null : value)),
  });

  // Set default initial values
  const defaultInitialValues = {
    clientName: "",
    clientAddress: "",
    positionType: "",
    assignedTo: "",
    netPayment: "",
    onBoardedBy: onBoardedByName,
    supportingCustomers: [],
    clientWebsiteUrl: "",
    clientLinkedInUrl: "",
    clientSpocName: [""],
    clientSpocEmailid: [""],
    clientSpocMobileNumber: [""],
    clientSpocLinkedin: [""],
    supportingDocuments: [],
    currency: "USD",
    feedBack: ""
  };

  // Merge with initialData if available and ensure proper structure
  const getFormInitialValues = () => {
    if (!initialData) return defaultInitialValues;

    // Create a deep copy to avoid mutation
    const mergedValues = { ...defaultInitialValues, ...initialData };

    // Ensure arrays are properly initialized
    const ensureArray = (field, defaultValue = [""]) => {
      if (!Array.isArray(mergedValues[field]) || mergedValues[field].length === 0) {
        mergedValues[field] = defaultValue;
      }
    };

    ensureArray('clientSpocName');
    ensureArray('clientSpocEmailid');
    ensureArray('clientSpocMobileNumber');
    ensureArray('clientSpocLinkedin');
    
    if (!Array.isArray(mergedValues.supportingCustomers)) {
      mergedValues.supportingCustomers = [];
    }

    // Convert simple string array to object array if needed
    if (mergedValues.supportingCustomers.length > 0 && 
        typeof mergedValues.supportingCustomers[0] === 'string') {
      mergedValues.supportingCustomers = mergedValues.supportingCustomers.map(customer => ({
        customerName: customer,
        netPayment: ""
      }));
    }

    return mergedValues;
  };

  const formInitialValues = getFormInitialValues();

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) {
      showToast("No file selected", "warning");
      return;
    }

    // Check total file size (max 10MB)
    const currentSize = files.reduce(
      (sum, file) => sum + (file.isExisting ? 0 : file.size),
      0
    );
    const newFilesSize = selectedFiles.reduce(
      (sum, file) => sum + file.size,
      0
    );

    if (currentSize + newFilesSize > 10 * 1024 * 1024) {
      showToast("Total file size exceeds 10MB limit", "error");
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    showToast(
      `${selectedFiles.length} file(s) selected successfully!`,
      "success"
    );
  };

  const removeFile = (indexToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
    showToast("File removed", "info");
  };

  // API call function - Create Client
  const createClient = async (formData) => {
    try {
      const response = await httpService.post(`/api/us/requirements/client/addClient`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error("Create client API call failed:", error);
      throw new Error(error.response?.data?.message || "Failed to create client");
    }
  };

  // Update client function (for edit mode)
  const updateClient = async (formData, clientId) => {
    try {
      const response = await httpService.put(`/api/us/requirements/client/${clientId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error("Update client API call failed:", error);
      throw new Error(error.response?.data?.message || "Failed to update client");
    }
  };

  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);

    try {
      // Create a FormData object for file upload
      const formData = new FormData();

      // Prepare the client data according to API structure
      const clientData = {
        clientName: values.clientName,
        clientAddress: values.clientAddress,
        positionType: values.positionType,
        netPayment: values.netPayment ? Number(values.netPayment) : 0,
        supportingCustomers: values.supportingCustomers.map(customer => ({
          customerName: customer.customerName,
          netPayment: customer.netPayment ? Number(customer.netPayment) : 0
        })),
        clientWebsiteUrl: values.clientWebsiteUrl || "",
        clientLinkedInUrl: values.clientLinkedInUrl || "",
        supportingDocuments: [],
        onBoardedBy: onBoardedByName,
        assignedTo: values.assignedTo,
        status: values.status || "ACTIVE",
        feedBack: values.feedBack || "",
        numberOfRequirements: values.numberOfRequirements || 0,
        currency: currency,
        // Contact information arrays
        clientSpocName: values.clientSpocName.filter(name => name && name.trim() !== ""),
        clientSpocEmailid: values.clientSpocEmailid.filter(email => email && email.trim() !== ""),
        clientSpocMobileNumber: values.clientSpocMobileNumber.filter(mobile => mobile && mobile.trim() !== ""),
        clientSpocLinkedin: values.clientSpocLinkedin.filter(linkedin => linkedin && linkedin.trim() !== ""),
      };

      // Add existing supporting document filenames if we're editing
      if (isEdit) {
        clientData.supportingDocuments = files
          .filter((file) => file.isExisting)
          .map((file) => file.name);
      }

      // Append the JSON object as a string with the correct field name
      formData.append("dto", JSON.stringify(clientData));

      // Append new files only (not the existing ones which we only have names for)
      files
        .filter((file) => !file.isExisting)
        .forEach((file) => {
          formData.append("supportingDocuments", file);
        });

      let result;
      
      if (isEdit && initialData?.id) {
        result = await updateClient(formData, initialData.id);
        showToast("Client updated successfully!", "success");
      } else {
        result = await createClient(formData);
        showToast("Client created successfully!", "success");
      }

      // If parent component provided custom onSubmit handler, call it
      if (onSubmit) {
        await onSubmit(values, isEdit, result);
      }

      if (!isEdit) {
        resetForm();
        setFiles([]);
        navigate('/dashboard/us-clients');
      }

      return result;

    } catch (error) {
      console.error("Form submission error:", error);
      showToast(error.message || "Failed to submit form", "error");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const addContactPerson = (values, setFieldValue) => {
    const fields = ['clientSpocName', 'clientSpocEmailid', 'clientSpocMobileNumber', 'clientSpocLinkedin'];
    fields.forEach((field) => {
      setFieldValue(field, [...values[field], ""]);
    });
    showToast("New contact person added", "info");
  };

  const removeContactPerson = (index, values, setFieldValue) => {
    if (values.clientSpocName.length > 1) {
      const fields = ['clientSpocName', 'clientSpocEmailid', 'clientSpocMobileNumber', 'clientSpocLinkedin'];
      fields.forEach((field) => {
        const newArray = [...values[field]];
        newArray.splice(index, 1);
        setFieldValue(field, newArray);
      });
      showToast("Contact person removed", "info");
    }
  };

  const renderFormField = (field, values, errors, touched, setFieldValue) => {
    if (field.type === "select") {
      return (
        <Grid item xs={field.xs} sm={field.sm} md={field.md} key={field.name}>
          <FormControl
            fullWidth
            error={touched[field.name] && Boolean(errors[field.name])}
          >
            <InputLabel id={`${field.name}-label`}>{field.label}</InputLabel>
            <Select
              labelId={`${field.name}-label`}
              id={field.name}
              name={field.name}
              value={values[field.name] || ""}
              onChange={(e) => {
                if (field.customHandler) {
                  field.customHandler(e, setFieldValue);
                } else {
                  setFieldValue(field.name, e.target.value);
                }
              }}
              startAdornment={
                field.icon && (
                  <InputAdornment position="start">{field.icon}</InputAdornment>
                )
              }
            >
              <MenuItem value="">
                <em>Select {field.label}</em>
              </MenuItem>
              {field.options &&
                field.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
            </Select>
            {touched[field.name] && errors[field.name] && (
              <Typography variant="caption" color="error">
                {errors[field.name]}
              </Typography>
            )}
          </FormControl>
        </Grid>
      );
    }

    return (
      <Grid item xs={field.xs} sm={field.sm} md={field.md} key={field.name}>
        <Field name={field.name}>
          {({ field: formikField, meta }) => (
            <TextField
              {...formikField}
              fullWidth
              label={field.label}
              placeholder={field.placeholder || ""}
              required={field.required}
              type={field.type || "text"}
              error={meta.touched && Boolean(meta.error)}
              helperText={meta.touched && meta.error}
              InputProps={{
                startAdornment: field.icon && (
                  <InputAdornment position="start">{field.icon}</InputAdornment>
                ),
                endAdornment: field.endAdornment,
              }}
            />
          )}
        </Field>
      </Grid>
    );
  };

  const handleCancel = () => {
    if (isEdit && onCancel) {
      onCancel();
    } else {
      navigate('/dashboard/us-clients');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 2 }}>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        <Formik
          initialValues={formInitialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, resetForm, setFieldValue }) => (
            <Form>
              <Grid container spacing={3}>
                {formFields.map((section, sectionIndex) => (
                  <React.Fragment key={`section-${sectionIndex}`}>
                    <Grid item xs={12}>
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{ mb: 1, fontWeight: 500 }}
                      >
                        {section.section}
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                    </Grid>
                    {section.fields.map((field) =>
                      renderFormField(
                        field,
                        values,
                        errors,
                        touched,
                        setFieldValue
                      )
                    )}
                  </React.Fragment>
                ))}

                {/* Contact Persons Section */}
                {/* <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{
                      mt: 1,
                      mb: 1,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <People sx={{ mr: 1 }} /> Contact Persons
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid> */}

                {/* {values.clientSpocName.map((_, index) => (
                  <React.Fragment key={index}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Field name={`clientSpocName.${index}`}>
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Contact Name"
                            placeholder="Enter contact name"
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Person color="primary" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Field name={`clientSpocEmailid.${index}`}>
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Contact Email"
                            type="email"
                            placeholder="email@example.com"
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Email color="primary" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Field name={`clientSpocMobileNumber.${index}`}>
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Contact Mobile"
                            placeholder="Enter 10 or 15 digit number"
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Phone color="primary" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <Field name={`clientSpocLinkedin.${index}`}>
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="LinkedIn URL"
                            placeholder="https://linkedin.com/in/"
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LinkedIn color="primary" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      </Field>
                    </Grid>

                    <Grid item xs={12} sm={6} md={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        {values.clientSpocName.length > 1 && (
                          <IconButton
                            color="error"
                            onClick={() => removeContactPerson(index, values, setFieldValue)}
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                            }}
                          >
                            <RemoveCircleOutline />
                          </IconButton>
                        )}
                      </Box>
                    </Grid>
                  </React.Fragment>
                ))} */}
{/* 
                <Grid item xs={12}>
                  <Button
                    startIcon={<AddCircleOutline />}
                    variant="outlined"
                    color="primary"
                    onClick={() => addContactPerson(values, setFieldValue)}
                    sx={{ mt: 1 }}
                  >
                    Add Contact Person
                  </Button>
                </Grid> */}

                {/* Supporting Customers Section */}
                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{
                      mt: 1,
                      mb: 1,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <People sx={{ mr: 1 }} /> Supporting Customers
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <FieldArray name="supportingCustomers">
                    {({ push, remove }) => (
                      <Box>
                        {values.supportingCustomers && values.supportingCustomers.length > 0 ? (
                          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                            <Grid container spacing={2}>
                              {values.supportingCustomers.map((customer, index) => (
                                <React.Fragment key={index}>
                                  <Grid item xs={12} sm={6} md={4}>
                                    <Field name={`supportingCustomers.${index}.customerName`}>
                                      {({ field, meta }) => (
                                        <TextField
                                          {...field}
                                          fullWidth
                                          label={`Customer ${index + 1} Name`}
                                          placeholder="Enter customer name"
                                          error={meta.touched && Boolean(meta.error)}
                                          helperText={meta.touched && meta.error}
                                        />
                                      )}
                                    </Field>
                                  </Grid>
                                  
                                  <Grid item xs={12} sm={4} md={3}>
                                    <Field name={`supportingCustomers.${index}.netPayment`}>
                                      {({ field, meta }) => (
                                        <TextField
                                          {...field}
                                          fullWidth
                                          label="Net Payment"
                                          type="number"
                                          placeholder="0"
                                          error={meta.touched && Boolean(meta.error)}
                                          helperText={meta.touched && meta.error}
                                          InputProps={{
                                            endAdornment: (
                                              <InputAdornment position="end">
                                                Days
                                              </InputAdornment>
                                            ),
                                          }}
                                        />
                                      )}
                                    </Field>
                                  </Grid>

                                  <Grid item xs={12} sm={2} md={2}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                                      <IconButton
                                        color="error"
                                        onClick={() => {
                                          remove(index);
                                          showToast("Customer removed", "info");
                                        }}
                                        sx={{
                                          border: "1px solid",
                                          borderColor: "divider",
                                          borderRadius: 2,
                                        }}
                                      >
                                        <RemoveCircleOutline />
                                      </IconButton>
                                    </Box>
                                  </Grid>
                                </React.Fragment>
                              ))}
                            </Grid>
                          </Paper>
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2, fontStyle: "italic" }}
                          >
                            No supporting customers added
                          </Typography>
                        )}
                        <Button
                          startIcon={<AddCircleOutline />}
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            push({ customerName: "", netPayment: "" });
                            showToast("New customer field added", "info");
                          }}
                          sx={{ mt: 1 }}
                        >
                          Add Customer
                        </Button>
                      </Box>
                    )}
                  </FieldArray>
                </Grid>

                {/* Supporting Documents Section */}
                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{
                      mt: 1,
                      mb: 1,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <AttachFile sx={{ mr: 1 }} /> Supporting Documents
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>

                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: "rgba(0, 0, 0, 0.01)" }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AttachFile />}
                      size="large"
                      sx={{ mb: 2 }}
                    >
                      Upload Files
                      <input
                        type="file"
                        hidden
                        multiple
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </Button>

                    <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {files.length > 0 ? (
                        files.map((file, index) => (
                          <Chip
                            key={index}
                            label={file.name}
                            onDelete={() => removeFile(index)}
                            color={file.isExisting ? "secondary" : "primary"}
                            variant="outlined"
                            sx={{ py: 0.5 }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                          {isEdit
                            ? "No documents available. Upload new documents."
                            : "No files selected. Please upload supporting documents."}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Feedback Section (Edit Mode Only) */}
                {isEdit && (
                  <React.Fragment>
                    <Grid item xs={12}>
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{
                          mt: 1,
                          mb: 1,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Assignment sx={{ mr: 1 }} /> Feedback
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                    </Grid>

                    <Grid item xs={12}>
                      <Field name="feedBack">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            multiline
                            rows={4}
                            label="Feedback"
                            placeholder="Enter feedback about this client"
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      </Field>
                    </Grid>
                  </React.Fragment>
                )}

                {/* Form Actions */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }} />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCancel}
                      startIcon={<Cancel />}
                      size="large"
                      sx={{ px: 4 }}
                    >
                      Cancel
                    </Button>

                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        resetForm();
                        if (!isEdit) setFiles([]);
                        showToast("Form has been reset", "info");
                      }}
                      startIcon={<RestartAlt />}
                      size="large"
                      sx={{ px: 4 }}
                    >
                      Reset Form
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                      startIcon={
                        isSubmitting ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <Save />
                        )
                      }
                      size="large"
                      sx={{ px: 4 }}
                    >
                      {isSubmitting
                        ? "Submitting..."
                        : isEdit
                        ? "Update Client"
                        : "Add Client"}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Box>
    </ThemeProvider>
  );
};

export default ClientForm;