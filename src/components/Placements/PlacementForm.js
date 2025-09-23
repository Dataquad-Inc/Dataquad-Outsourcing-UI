import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import {
  Typography,
  Paper,
  Box,
  Alert,
  TextField,
  Grid,
  Button,
  MenuItem,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircleOutline as SuccessIcon,
  ErrorOutline as ErrorIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import { useFormik } from "formik";
import * as Yup from "yup";
import { createPlacement, updatePlacement } from "../../redux/placementSlice";
import CryptoJS from "crypto-js";

const SuccessAlert = styled(Alert)(({ theme }) => ({
  borderLeft: `4px solid ${theme.palette.success.main}`,
  backgroundColor: `${theme.palette.success.light}20`,
  "& .MuiAlert-icon": {
    color: theme.palette.success.main,
  },
}));

const ErrorAlert = styled(Alert)(({ theme }) => ({
  borderLeft: `4px solid ${theme.palette.error.main}`,
  backgroundColor: `${theme.palette.error.light}20`,
  "& .MuiAlert-icon": {
    color: theme.palette.error.main,
  },
}));

// Validation schema using Yup
const validationSchema = Yup.object().shape({
  candidateFullName: Yup.string().required("Consultant name is required"),
  candidateEmailId: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  candidateContactNo: Yup.string()
    .matches(/^(\+?\d{10}|\+?\d{12}|\+?\d{15})$/, "Contact number must be 10, 12, or 15 digits")
    .required("Phone number is required"),
  technology: Yup.string().required("Technology is required"),
  clientName: Yup.string().required("Client name is required"),
  vendorName: Yup.string().required("Vendor name is required"),
  startDate: Yup.date().required("Start date is required"),
  endDate: Yup.date().nullable(),
  billRate: Yup.number()
    .typeError("Bill rate must be a number")
    .positive("Bill rate must be positive")
    .required("Bill rate is required"),
  payRate: Yup.number()
    .typeError("Pay rate must be a number")
    .positive("Pay rate must be positive")
    .required("Pay rate is required"),
  employmentType: Yup.string().required("Employment type is required"),
  status: Yup.string().required("Status is required"),
});

const PlacementForm = ({
  initialValues = {},
  onCancel,
  isEdit = false,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.placement);
  const [submitStatus, setSubmitStatus] = useState({
    isSubmitting: false,
    success: null,
    error: null,
    response: null,
  });
  
  const {userId, encryptionKey} = useSelector((state) => state.auth);
  const decryptionKey = atob(encryptionKey);
  const FINANCIAL_SECRET_KEY = decryptionKey; 

  const encryptFinancialValue = (value) => {
    if (!value) return value;
    try {
      const stringValue = value.toString();
      return CryptoJS.AES.encrypt(stringValue, FINANCIAL_SECRET_KEY).toString();
    } catch (error) {
      console.error("Encryption failed:", error);
      return value; // Return original value if encryption fails
    }
  };

  const decryptFinancialValue = (encryptedValue) => {
    if (!encryptedValue) return encryptedValue;
    try {
      // Check if the value is already decrypted (for backward compatibility)
      if (!isNaN(parseFloat(encryptedValue))) {
        return encryptedValue; // Already a number, return as is
      }
      
      const bytes = CryptoJS.AES.decrypt(encryptedValue, FINANCIAL_SECRET_KEY);
      const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedValue || encryptedValue; // Return original if decryption fails
    } catch (error) {
      console.error("Decryption failed:", error);
      return encryptedValue; // Return original value if decryption fails
    }
  };

  // Form field configurations organized in arrays for better maintainability
  const consultantFields = [
    {
      id: "candidateFullName",
      label: "Consultant Name",
      required: true,
      grid: { xs: 12, sm: 6 },
      helperText: "Enter consultant's full name",
    },
    {
      id: "candidateEmailId",
      label: "Email",
      type: "email",
      required: true,
      grid: { xs: 12, sm: 6 },
      helperText: "Example: name@example.com",
    },
    {
      id: "candidateContactNo",
      label: "Phone",
      required: true,
      grid: { xs: 12, sm: 6 },
      inputProps: { maxLength: 10 },
      helperText: "10 digits only",
    },
    {
      id: "technology",
      label: "Technology",
      required: true,
      grid: { xs: 12, sm: 6 },
    },
  ];

  const clientFields = [
    {
      id: "clientName",
      label: "Client",
      required: true,
      grid: { xs: 12, sm: 6 },
    },
    {
      id: "vendorName",
      label: "Vendor Name",
      required: true,
      grid: { xs: 12, sm: 6 },
    },
  ];

  const dateFields = [
    {
      id: "startDate",
      label: "Start Date",
      required: true,
      type: "date",
      grid: { xs: 12, sm: 6 },
      render: (row) => formatDateForDisplay(row.startDate),
    },
    {
      id: "endDate",
      label: "End Date",
      type: "date",
      grid: { xs: 12, sm: 6 },
      render: (row) => formatDateForDisplay(row.endDate),
    },
  ];

  const financialFields = [
    {
      id: "billRate",
      label: "Bill Rate",
      required: true,
      grid: { xs: 12, sm: 6 },
      helperText: "Enter total bill rate",
      inputProps: {
        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
      },
    },
    {
      id: "payRate",
      label: "Pay Rate",
      required: true,
      grid: { xs: 12, sm: 6 },
      helperText: "Enter total pay rate",
      inputProps: {
        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
      },
    },
    {
      id: "grossProfit",
      label: "Gross Profit",
      grid: { xs: 6 },
      helperText: "Bill Rate - Pay Rate",
      readOnly: true,
      inputProps: {
        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
      },
    },
  ];

  const employmentFields = [
    {
      id: "employmentType",
      label: "Employment Type",
      required: true,
      grid: { xs: 12, sm: 6 },
      select: true,
      options: [
        { value: "W2", label: "W2" },
        { value: "C2C", label: "C2C" },
        { value: "Full-time", label: "Full-time" },
        { value: "Part-time", label: "Part-time" },
        { value: "Contract", label: "Contract" },
        { value: "Contract-to-hire", label: "Contract-to-hire" },
      ],
    },
    {
      id: "status",
      label: "Status",
      required: true,
      grid: { xs: 12, sm: 6 },
      select: true,
      options: [
        { value: "Active", label: "Active" },
        { value: "InActive", label: "InActive" },
        { value: "On Hold", label: "On Hold" },
        { value: "Completed", label: "Completed" },
        { value: "Terminated", label: "Terminated" },
        { value: "Cancelled", label: "Cancelled" },
        { value: "BackOut", label: "BackOut" },
      ],
    },
  ];

  const internalFields = [
    {
      id: "recruiterName",
      label: "Recruiter",
      grid: { xs: 12, sm: 6 },
    },
    {
      id: "sales",
      label: "Sales",
      grid: { xs: 12, sm: 6 },
    },
    {
      id: "statusMessage",
      label: "Status Message",
      grid: { xs: 12 },
    },
    {
      id: "remarks",
      label: "Remarks",
      grid: { xs: 12 },
      multiline: true,
      rows: 3,
    },
  ];

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "";
    try {
      let date;
      
      if (dayjs.isDayjs(dateStr)) {
        date = dateStr;
      } else {
        date = dayjs.utc(dateStr);
      }
      
      if (!date.isValid()) {
        console.warn("Invalid date for display:", dateStr);
        return "";
      }
      
      return date.format("MM/DD/YYYY");
    } catch (error) {
      console.error("Error formatting date for display:", error, dateStr);
      return "";
    }
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    try {
      let date;
      
      if (dayjs.isDayjs(dateStr)) {
        date = dateStr;
      } else {
        date = dayjs(dateStr);
      }
      
      if (!date.isValid()) {
        console.warn("Invalid date for input:", dateStr);
        return "";
      }
      
      return date.format("YYYY-MM-DD");
    } catch (error) {
      console.error("Error formatting date for input:", error, dateStr);
      return "";
    }
  };

  const formatDateForSubmission = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = dayjs(dateStr);
      if (!date.isValid()) {
        console.warn("Invalid date for submission:", dateStr);
        return null;
      }
      
      return date.format("YYYY-MM-DD");
    } catch (error) {
      console.error("Error formatting date for submission:", error, dateStr);
      return null;
    }
  };

  const formatNumberWithCommas = (value) => {
    if (!value) return "";
    const numStr = value.toString().replace(/\D/g, "");
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseNumberFromFormatted = (formattedValue) => {
    if (!formattedValue) return "";
    return formattedValue.replace(/,/g, "");
  };

  // Prepare initial values with decryption for financial fields
  const getInitialFormValues = () => {
    // Decrypt financial values if they exist
    const decryptedBillRate = initialValues.billRate ? decryptFinancialValue(initialValues.billRate) : "";
    const decryptedPayRate = initialValues.payRate ? decryptFinancialValue(initialValues.payRate) : "";
    const decryptedGrossProfit = initialValues.grossProfit ? decryptFinancialValue(initialValues.grossProfit) : "";
    
    return {
      candidateFullName: initialValues.candidateFullName || "",
      candidateEmailId: initialValues.candidateEmailId || "",
      candidateContactNo: initialValues.candidateContactNo || "",
      technology: initialValues.technology || "",
      clientName: initialValues.clientName || "",
      vendorName: initialValues.vendorName || "",
      startDate: formatDateForInput(initialValues.startDate) || "",
      endDate: formatDateForInput(initialValues.endDate) || "",
      billRate: decryptedBillRate,
      payRate: decryptedPayRate,
      grossProfit: decryptedGrossProfit,
      employmentType: initialValues.employmentType || "",
      recruiterName: initialValues.recruiterName || "",
      sales: initialValues.sales || "",
      status: initialValues.status || "",
      statusMessage: initialValues.statusMessage || "",
      remarks: initialValues.remarks || "",
    };
  };

  const initialFormValues = React.useMemo(() => getInitialFormValues(), [isEdit, initialValues]);

  // Setup formik
  const formik = useFormik({
    initialValues: initialFormValues,
    validationSchema: validationSchema,
    enableReinitialize: isEdit,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitStatus({
        isSubmitting: true,
        success: null,
        error: null,
        response: null,
      });

      try {
        // Parse and convert values
        const billRate = parseFloat(parseNumberFromFormatted(values.billRate)) || 0;
        const payRate = parseFloat(parseNumberFromFormatted(values.payRate)) || 0;
        
        if(payRate > billRate){
          setSubmitStatus({
            isSubmitting: false,
            success: false,
            error: "Pay rate cannot be greater than bill rate",
            response: null,
          });
          return;
        }
        
        const grossProfit = billRate - payRate;

        // Encrypt financial data before sending to backend
        const encryptedBillRate = encryptFinancialValue(Math.round(billRate));
        const encryptedPayRate = encryptFinancialValue(Math.round(payRate));
        const encryptedGrossProfit = encryptFinancialValue(grossProfit);

        // Prepare the payload with encrypted financial data
        const payload = {
          ...values,
          startDate: formatDateForSubmission(values.startDate),
          endDate: formatDateForSubmission(values.endDate),
          billRate: encryptedBillRate,
          payRate: encryptedPayRate,
          grossProfit: encryptedGrossProfit,
          currency: "INR",
        };

        if (isEdit) {
          dispatch(updatePlacement({
            id: initialValues.id,
            placementData: payload,
          }));
        } else {
          dispatch(createPlacement(payload)); 
        }

        setSubmitStatus({
          isSubmitting: false,
          success: true,
          error: null,
          response: {
            message: `Placement ${isEdit ? "updated" : "created"} successfully!`,
            payload,
          },
        });

        setTimeout(() => {
          onCancel();
        }, 1000);
      } catch (error) {
        setSubmitStatus({
          isSubmitting: false,
          success: false,
          error: error.message || `Failed to ${isEdit ? "update" : "create"} placement. Please try again.`,
          response: null,
        });
      } finally {
        setSubmitting(false);
      }
    }
  });

  // Update gross profit when bill rate or pay rate changes
  useEffect(() => {
    const billRate = parseFloat(formik.values.billRate) || 0;
    const payRate = parseFloat(formik.values.payRate) || 0;
    
    if (billRate > 0 && payRate > 0) {
      const grossProfit = Math.round(billRate - payRate);
      formik.setFieldValue('grossProfit', grossProfit.toString());
    }
  }, [formik.values.billRate, formik.values.payRate]);

  // Update submit status based on Redux state
  useEffect(() => {
    if (success) {
      setSubmitStatus({
        isSubmitting: false,
        success: true,
        error: null,
        response: {
          message: `Placement ${isEdit ? 'updated' : 'created'} successfully!`,
        },
      });
      
      setTimeout(() => {
        onCancel(); 
      }, 1000);
    }
    
    if (error) {
      setSubmitStatus({
        isSubmitting: false,
        success: false,
        error: error,
        response: null,
      });
    }
  }, [success, error, isEdit, onCancel]);

  // Function to render text fields
  const renderTextField = (field) => {
    const {
      id,
      label,
      type = "text",
      required = false,
      grid,
      helperText = "",
      select = false,
      options = [],
      multiline = false,
      rows = 1,
      inputProps = {},
      readOnly = false,
    } = field;

    return (
      <Grid item {...grid} key={id}>
        <TextField
          fullWidth
          id={id}
          name={id}
          label={`${label}${required ? ' *' : ''}`}
          type={type}
          value={
            id === "billRate" || id === "payRate" || id === "grossProfit"
              ? formatNumberWithCommas(formik.values[id])
              : formik.values[id]
          }
          onChange={(e) => {
            if (id === "billRate" || id === "payRate") {
              const rawValue = parseNumberFromFormatted(e.target.value);
              formik.setFieldValue(id, rawValue);
            } else {
              formik.handleChange(e);
            }
          }}
          onBlur={formik.handleBlur}
          error={formik.touched[id] && Boolean(formik.errors[id])}
          helperText={
            formik.touched[id] && formik.errors[id]
              ? formik.errors[id]
              : helperText
          }
          required={required}
          select={select}
          multiline={multiline}
          rows={rows}
          InputProps={{
            ...inputProps,
            readOnly: readOnly,
          }}
          InputLabelProps={{
            shrink: type === "date" ? true : undefined,
          }}
        >
          {select &&
            options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
        </TextField>
      </Grid>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        {isEdit ? 'Edit Placement' : 'Create New Placement'}
      </Typography>

      {/* Status messages */}
      {submitStatus.error && (
        <ErrorAlert severity="error" sx={{ mb: 2 }}>
          {submitStatus.error}
        </ErrorAlert>
      )}
      {submitStatus.success && (
        <SuccessAlert severity="success" sx={{ mb: 2 }}>
          {submitStatus.response?.message}
        </SuccessAlert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          {/* Consultant Information */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, fontWeight: "medium" }}
            >
              Consultant Information
            </Typography>
          </Grid>
          {consultantFields.map((field) =>
            renderTextField(field)
          )}

          {/* Client Information */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, fontWeight: "medium" }}
            >
              Client Information
            </Typography>
          </Grid>
          {clientFields.map((field) =>
            renderTextField(field)
          )}

          {/* Date Information */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, fontWeight: "medium" }}
            >
              Date Information
            </Typography>
          </Grid>
          {dateFields.map((field) =>
            renderTextField(field)
          )}

          {/* Financial Information Section Header */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "medium" }}
            >
              Financial Information (INR)
            </Typography>
          </Grid>

          {/* Financial Information Fields */}
          {financialFields.map((field) =>
            renderTextField(field)
          )}

          {/* Employment Information */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, fontWeight: "medium" }}
            >
              Employment Information
            </Typography>
          </Grid>
          {employmentFields.map((field) =>
            renderTextField(field)
          )}

          {/* Internal Information */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1, fontWeight: "medium" }}
            >
              Internal Information
            </Typography>
          </Grid>
          {internalFields.map((field) =>
            renderTextField(field)
          )}

          {/* Form Actions */}
          <Grid
            item
            xs={12}
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2
            }}
          >
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={onCancel}
              disabled={loading || formik.isSubmitting}
            >
              Close
            </Button>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={loading || formik.isSubmitting}
            >
              {loading || formik.isSubmitting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEdit ? 'Update Placement' : 'Create Placement'
              )}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default PlacementForm;