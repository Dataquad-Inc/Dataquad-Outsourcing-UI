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
import axios from "axios";

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
  const [removedFiles, setRemovedFiles] = useState([]);
  const [removedFileIds, setRemovedFileIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState(initialData?.currency || "USD");
  const { userName, userId } = useSelector((state) => state.auth);
  const [onBoardedByName, setOnBoardedBy] = useState(
    initialData?.onBoardedByName || userName
  );

  useEffect(() => {
    if (initialData) {
      setCurrency(initialData.currency || "USD");
      setOnBoardedBy(initialData.onBoardedByName || "");

      // Initialize files if editing and supportingDocuments are available
      if (
        isEdit &&
        initialData.supportingDocuments &&
        Array.isArray(initialData.supportingDocuments)
      ) {
        const initialFiles = initialData.supportingDocuments.map((doc, index) => {
          if (typeof doc === 'string') {
            return {
              id: index,
              name: doc,
              isExisting: true,
              originalName: doc
            };
          } else if (typeof doc === 'object' && doc !== null) {
            return {
              id: doc.id || doc.docId || index,
              name: doc.fileName || doc.name || 'Unknown Document',
              isExisting: true,
              originalData: doc,
              originalName: doc.fileName || doc.name || 'Unknown Document'
            };
          }
          return {
            name: String(doc),
            isExisting: true,
            originalName: String(doc)
          };
        });
        
        setFiles(initialFiles.filter(Boolean));
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
          defaultValue: "USD",
          options: [
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
      .min(2, "Client name must be at least 2 characters")
      .max(50, "Client name must be at most 50 characters"),

    clientAddress: Yup.string()
      .nullable()
      .max(250, "Client address must be at most 250 characters"),

    positionType: Yup.string()
      .nullable()
      .oneOf(["Full-Time", "Part-Time", "Contract", "Internship", ""], "Invalid position type"),

    currency: Yup.string()
      .required("Currency is required")
      .oneOf(["USD", "INR"], "Invalid currency"),

    netPayment: Yup.number()
      .typeError("Net payment must be a number")
      .min(0, "Net payment cannot be negative")
      .nullable(),

    clientWebsiteUrl: Yup.string()
      .url("Must be a valid URL")
      .nullable(),

    clientLinkedInUrl: Yup.string()
      .url("Must be a valid URL")
      .nullable(),

    supportingCustomers: Yup.array()
      .of(
        Yup.object().shape({
          customerName: Yup.string()
            .nullable()
            .max(100, "Customer name must be at most 100 characters"),
          netPayment: Yup.number()
            .typeError("Net payment must be a number")
            .min(0, "Net payment cannot be negative")
            .nullable(),
        })
      ),
      

    status: Yup.string()
      .nullable()
      .oneOf(["ACTIVE", "INACTIVE", "PENDING", ""], "Invalid status"),

    numberOfRequirements: Yup.number()
      .typeError("Number of requirements must be a number")
      .min(0, "Number of requirements cannot be negative")
      .nullable(),
  });

  const defaultInitialValues = {
    clientName: "",
    clientAddress: "",
    positionType: "",
    netPayment: "",
    onBoardedByName: onBoardedByName,
    supportingCustomers: [],
    clientWebsiteUrl: "",
    clientLinkedInUrl: "",
    supportingDocuments: [],
    currency: "USD",
    feedBack: "",
    status: "ACTIVE",
    numberOfRequirements: 0
  };

  const getFormInitialValues = () => {
    console.log('=== GET FORM INITIAL VALUES ===');
    console.log('initialData:', initialData);
    
    if (!initialData) {
      console.log('No initialData, using defaults');
      return defaultInitialValues;
    }

    const safeValue = (value, defaultVal = "") => {
      if (value === null || value === undefined) return defaultVal;
      if (typeof value === 'object') {
        console.warn('Found object in safeValue:', value);
        if (value.fileName) {
          return value.fileName;
        }
        return value.value || value.amount || value.days || value.name || value.text || String(defaultVal);
      }
      return value;
    };

    const mergedValues = {
      clientName: safeValue(initialData.clientName, ""),
      clientAddress: safeValue(initialData.clientAddress, ""),
      positionType: safeValue(initialData.positionType, ""),
      netPayment: safeValue(initialData.netPayment, ""),
      onBoardedByName: safeValue(initialData.onBoardedByName, onBoardedByName),
      clientWebsiteUrl: safeValue(initialData.clientWebsiteUrl, ""),
      clientLinkedInUrl: safeValue(initialData.clientLinkedInUrl, ""),
      currency: safeValue(initialData.currency, "USD"),
      feedBack: safeValue(initialData.feedBack, ""),
      status: safeValue(initialData.status, "ACTIVE"),
      numberOfRequirements: safeValue(initialData.numberOfRequirements, 0),
      supportingCustomers: []
    };

    if (initialData.supportingCustomers) {
      if (Array.isArray(initialData.supportingCustomers)) {
        mergedValues.supportingCustomers = initialData.supportingCustomers.map((customer, idx) => {
          console.log(`Processing customer ${idx}:`, customer);
          
          if (typeof customer === 'string') {
            return {
              customerName: customer,
              netPayment: ""
            };
          }
          
          if (typeof customer === 'object' && customer !== null) {
            const processedCustomer = {
              customerName: safeValue(customer.customerName, ""),
              netPayment: safeValue(customer.netPayment, "")
            };
            
            console.log(`Processed customer ${idx}:`, processedCustomer);
            return processedCustomer;
          }
          
          return {
            customerName: "",
            netPayment: ""
          };
        });
      }
    }

    console.log('Final merged values:', mergedValues);
    console.log('=== END GET FORM INITIAL VALUES ===');
    
    return mergedValues;
  };

  const formInitialValues = getFormInitialValues();

 const handleFileChange = (event) => {
  const selectedFiles = Array.from(event.target.files);
  if (selectedFiles.length === 0) {
    showToast("No file selected", "warning");
    return;
  }

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

  // Store the actual File objects with metadata
  const filesWithMetadata = selectedFiles.map(file => ({
    ...file,
    name: file.name,
    size: file.size,
    type: file.type,
    isExisting: false,
    originalFile: file // Store the actual File object
  }));

  setFiles((prevFiles) => [...prevFiles, ...filesWithMetadata]);
  showToast(
    `${selectedFiles.length} file(s) selected successfully!`,
    "success"
  );
};

  const removeFile = (indexToRemove) => {
    const fileToRemove = files[indexToRemove];
    
    // Track removed existing files with their IDs
    if (fileToRemove.isExisting && fileToRemove.id) {
      setRemovedFileIds(prev => [...prev, fileToRemove.id]);
      showToast("File marked for removal", "info");
    } else {
      showToast("File removed", "info");
    }
    
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

 // FIXED: Use FormData with multipart/form-data
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
    
    if (error.response?.data) {
      throw new Error(error.response.data.message || JSON.stringify(error.response.data));
    }
    throw new Error(error.message || "Failed to create client");
  }
};

const updateClient = async (clientId, clientData, filesToUpload = []) => {
  try {
    const formData = new FormData();
    
    // Append the client data as JSON
    formData.append("dto", JSON.stringify(clientData));
    
    // REMOVED: File appending logic - no files in this payload
    
    console.log('FormData entries for client update:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value instanceof File ? `${value.name} (File)` : value);
    }

    const response = await httpService.put(
      `/api/us/requirements/client/${clientId}`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Update client API call failed:", error);
    
    if (error.response?.data) {
      throw new Error(error.response.data.message || JSON.stringify(error.response.data));
    }
    throw new Error(error.message || "Failed to update client");
  }
};

const updateClientDocuments = async (clientId, deleteDocIds = [], remainingFiles = []) => {
  try {
    const formData = new FormData();
    
    // CRITICAL: Send files that should REMAIN after deletion
    // For example: if you have files with IDs [1, 2] and delete ID 2, send file with ID 1
    if (remainingFiles.length >= 0) {
      remainingFiles.forEach((file) => {
        // For existing files, we need to send their metadata or reference
        // Check if it's a File object (newly uploaded) or existing file reference
        if (file instanceof File) {
          formData.append("files", file);
        } else if (file.originalFile instanceof File) {
          formData.append("files", file.originalFile);
        } else if (file.isExisting) {
          // For existing files, create a reference blob or send file info
          // This depends on your backend expectations
          // Option 1: Send file ID/name as blob
          const fileBlob = new Blob([JSON.stringify({ id: file.id, name: file.name })], { type: 'application/json' });
          formData.append("files", fileBlob, file.name);
        }
      });
    } else {
      // Append an empty blob when no files to satisfy backend requirement
      formData.append("files", new Blob(), "");
    }

    const deleteDocIdsParam = deleteDocIds.join(',');
    
    console.log(`Calling document update API for client: ${clientId}`);
    console.log(`Deleting document IDs: ${deleteDocIdsParam}`);
    console.log(`Remaining files to keep: ${remainingFiles.length}`);
    console.log('Remaining files:', remainingFiles);
    
    console.log('FormData entries for document update:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value instanceof File ? `${value.name} (File)` : value instanceof Blob ? 'Blob' : value);
    }

    const response = await httpService.put(
      `/api/us/requirements/clients/updateDocuments/${clientId}?deleteDocIds=${deleteDocIdsParam}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Update client documents API call failed:", error);
    
    if (error.response?.data) {
      throw new Error(error.response.data.message || JSON.stringify(error.response.data));
    }
    throw new Error(error.message || "Failed to update client documents");
  }
};

// Updated handleSubmit - only this part needs change
const handleSubmit = async (values, { resetForm }) => {
  setIsSubmitting(true);

  try {
    let result;
    
    if (isEdit && initialData && initialData.clientId) {
      // EDIT MODE
      const clientData = {
        clientName: values.clientName,
        clientAddress: values.clientAddress || "",
        positionType: values.positionType || "Full-Time",
        netPayment: values.netPayment ? Number(values.netPayment) : 0,
        supportingCustomers: values.supportingCustomers.map(customer => ({
          customerName: customer.customerName || "",
          netPayment: customer.netPayment ? Number(customer.netPayment) : 0
        })),
        clientWebsiteUrl: values.clientWebsiteUrl || "",
        clientLinkedInUrl: values.clientLinkedInUrl || "",
        onBoardedById: userId,
        onBoardedByName: userName,
        status: values.status || "ACTIVE",
        feedBack: values.feedBack || "",
        numberOfRequirements: values.numberOfRequirements || 0,
        currency: currency || "USD",
      };

      console.log("Updating client data:", JSON.stringify(clientData, null, 2));
      
      console.log("Calling UPDATE API for client ID:", initialData.clientId);
      
      // Update client WITHOUT files
      result = await updateClient(initialData.clientId, clientData);
      
      // FIXED: Handle document updates if files were removed OR if we need to update documents
      if (removedFileIds.length > 0 || files.length > 0) {
        console.log("Handling document updates...");
        console.log("Removed file IDs:", removedFileIds);
        console.log("Current files state:", files);
        
        // CRITICAL FIX: Get REMAINING EXISTING files (files that should stay)
        // Filter out: 1) Files that were marked for removal, 2) New files (they'll be uploaded via updateClientDocuments)
        const remainingExistingFiles = files.filter(
          (file) => file.isExisting && !removedFileIds.includes(file.id)
        );
        
        // Get new files to upload
        const newFilesToUpload = files.filter((file) => !file.isExisting);
        
        console.log("Remaining existing files to keep:", remainingExistingFiles);
        console.log("New files to upload:", newFilesToUpload);
        
        // Combine remaining existing files and new files
        const allFilesForDocumentUpdate = [...remainingExistingFiles, ...newFilesToUpload];
        
        // Call document update API with files that should REMAIN and new files to upload
        const documentsResult = await updateClientDocuments(
          initialData.clientId, 
          removedFileIds,           // IDs to delete (e.g., [2])
          allFilesForDocumentUpdate // All files that should exist after update
        );
        
        console.log("Documents update result:", documentsResult);
      }
      
      showToast("Client updated successfully!", "success");
      
    } else {
      // CREATE MODE - unchanged
      const formData = new FormData();
      const clientData = {
        clientName: values.clientName,
        clientAddress: values.clientAddress || "",
        positionType: values.positionType || "Full-Time",
        netPayment: values.netPayment ? Number(values.netPayment) : 0,
        supportingCustomers: values.supportingCustomers.map(customer => ({
          customerName: customer.customerName || "",
          netPayment: customer.netPayment ? Number(customer.netPayment) : 0
        })),
        clientWebsiteUrl: values.clientWebsiteUrl || "",
        clientLinkedInUrl: values.clientLinkedInUrl || "",
        onBoardedById: userId,
        onBoardedByName: userName,
        status: values.status || "ACTIVE",
        feedBack: values.feedBack || "",
        numberOfRequirements: values.numberOfRequirements || 0,
        currency: currency || "USD",
      };

      console.log("Creating new client:", JSON.stringify(clientData, null, 2));
      
      formData.append("dto", JSON.stringify(clientData));
      
      files.forEach((file) => {
        if (file instanceof File) {
          formData.append("supportingDocuments", file);
        } else if (file.originalFile instanceof File) {
          formData.append("supportingDocuments", file.originalFile);
        }
      });

      console.log("Calling CREATE API");
      result = await createClient(formData);
      showToast("Client created successfully!", "success");
    }

    // Reset states
    setRemovedFileIds([]);
    setRemovedFiles([]);

    if (!isEdit) {
      resetForm();
      setFiles([]);
      navigate('/dashboard/us-clients');
    }

    if (onSubmit) {
      onSubmit(values, isEdit, result);
    }

    return result;

  } catch (error) {
    console.error("Form submission error:", error);
    
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    
    showToast(error.message || "Failed to submit form", "error");
    throw error;
  } finally {
    setIsSubmitting(false);
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
    setRemovedFileIds([]);
    setRemovedFiles([]);
    
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

                {/* Status Field for Edit Mode */}
                {isEdit && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Field name="status">
                      {({ field, meta }) => (
                        <FormControl fullWidth error={meta.touched && Boolean(meta.error)}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            {...field}
                            label="Status"
                            startAdornment={
                              <InputAdornment position="start">
                                <WorkOutline color="primary" />
                              </InputAdornment>
                            }
                          >
                            <MenuItem value="ACTIVE">Active</MenuItem>
                            <MenuItem value="INACTIVE">Inactive</MenuItem>
                            <MenuItem value="PENDING">Pending</MenuItem>
                          </Select>
                          {meta.touched && meta.error && (
                            <Typography variant="caption" color="error">
                              {meta.error}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    </Field>
                  </Grid>
                )}


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
                    
                    {/* Show removed file IDs for debugging */}
                    {removedFileIds.length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Files marked for deletion: {removedFileIds.join(', ')}
                      </Typography>
                    )}
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
                        setRemovedFileIds([]);
                        setRemovedFiles([]);
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