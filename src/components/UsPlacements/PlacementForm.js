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
  Autocomplete,
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
import { createUsPlacement, updateUsPlacement } from "../../redux/placementSlice";
import CryptoJS from "crypto-js";
import httpService from "../../Services/httpService";

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
  holdRate: Yup.number().typeError("Hold rate must be a number").nullable(),
  employmentType: Yup.string().required("Employment type is required"),
  status: Yup.string().required("Status is required"),
  referal: Yup.string().nullable(),
  projectIn: Yup.string().nullable(),
  visa: Yup.string().nullable(),
  projectInC2cSubVendorName: Yup.string().nullable(),
});

// Component for Employee Autocomplete field
const EmployeeAutocomplete = ({ 
  id, 
  label, 
  options, 
  loading, 
  value, 
  onChange, 
  error, 
  helperText,
  placeholder 
}) => {
  const [inputValue, setInputValue] = useState("");

  return (
    <Autocomplete
      id={id}
      options={options}
      loading={loading}
      value={options.find(opt => opt.value === value) || null}
      getOptionLabel={(option) => option.label || ""}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      onChange={(event, newValue) => {
        onChange(newValue ? newValue.value : "");
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth
          label={label}
          error={error}
          helperText={helperText}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={loading ? "Loading employees..." : "No employees found"}
      filterOptions={(options, { inputValue: filterValue }) => {
        const searchLower = filterValue.toLowerCase();
        return options.filter(option => 
          option.label.toLowerCase().includes(searchLower) ||
          (option.email && option.email.toLowerCase().includes(searchLower)) ||
          (option.id && option.id.toLowerCase().includes(searchLower))
        );
      }}
    />
  );
};

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
  
  const { userId, encryptionKey } = useSelector((state) => state.auth);
  const decryptionKey = atob(encryptionKey);
  const FINANCIAL_SECRET_KEY = decryptionKey;

  // State for internal employees dropdown
  const [internalEmployees, setInternalEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Company names for Project In dropdown
  const companyNames = [
    { value: "Adroit", label: "Adroit" },
    { value: "Dataquad", label: "Dataquad" },
    { value: "Cignaltech", label: "Cignaltech" },
    { value: "Aivion", label: "Aivion" },
    { value: "Trism", label: "Trism" },
  ];

  const encryptFinancialValue = (value) => {
    if (!value) return value;
    try {
      const stringValue = value.toString();
      return CryptoJS.AES.encrypt(stringValue, FINANCIAL_SECRET_KEY).toString();
    } catch (error) {
      console.error("Encryption failed:", error);
      return value;
    }
  };

  const decryptFinancialValue = (encryptedValue) => {
    if (!encryptedValue) return encryptedValue;
    try {
      if (!isNaN(parseFloat(encryptedValue))) {
        return encryptedValue;
      }
      
      const bytes = CryptoJS.AES.decrypt(encryptedValue, FINANCIAL_SECRET_KEY);
      const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedValue || encryptedValue;
    } catch (error) {
      console.error("Decryption failed:", error);
      return encryptedValue;
    }
  };

  // Fetch all employees with entity US
  useEffect(() => {
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await httpService.get("/users/employee?entity=US");

      if (response.data && Array.isArray(response.data)) {
        const employees = response.data
          .filter(emp => emp.userName && emp.userName.trim() !== "")
          .map(emp => ({
            value: emp.userName,
            label: emp.userName,
            id: emp.employeeId,
            email: emp.email,
            designation: emp.designation,
            roles: emp.roles,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setInternalEmployees(employees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error?.response?.data || error.message);
      setInternalEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  fetchEmployees();
}, []);

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
    },
    {
      id: "endDate",
      label: "End Date",
      type: "date",
      grid: { xs: 12, sm: 6 },
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
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
      },
    },
    {
      id: "payRate",
      label: "Pay Rate",
      required: true,
      grid: { xs: 12, sm: 6 },
      helperText: "Enter total pay rate",
      inputProps: {
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
      },
    },
    {
      id: "grossProfit",
      label: "Gross Profit",
      grid: { xs: 6 },
      helperText: "Bill Rate - Pay Rate",
      readOnly: true,
      inputProps: {
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
      },
    },
    {
      id: "holdRate",
      label: "Hold Rate",
      grid: { xs: 12, sm: 6 },
      helperText: "Enter hold rate",
      inputProps: {
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
      },
    },
    {
      id: "referal",
      label: "Referral",
      grid: { xs: 12, sm: 6 },
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
        { value: "special project", label: "special project" },
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
    {
      id: "projectIn",
      label: "Company",
      grid: { xs: 12, sm: 6 },
      select: true,
      options: companyNames,
    },
    {
      id: "visa",
      label: "Visa",
      grid: { xs: 12, sm: 6 },
      select: true,
      options: [
        { value: "H1B", label: "H1B" },
        { value: "Green Card", label: "Green Card" },
        { value: "Citizen", label: "Citizen" },
        { value: "H4-EAD", label: "H4-EAD" },
        { value: "GC-EAD", label: "GC-EAD" },
        { value: "L1", label: "L1" },
        { value: "O1", label: "O1" },
        { value: "F1", label: "F1" },
        { value: "TN", label: "TN" },
        { value: "Other", label: "Other" },
      ],
    },
    {
      id: "projectInC2cSubVendorName",
      label: "Project In/C2C Sub-Vendor Name",
      grid: { xs: 12, sm: 6 },
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
    if (value === null || value === undefined || value === "") return "";

    const valueStr = value.toString().replace(/,/g, "");
    const hasDecimal = valueStr.includes(".");
    const [integerPart, ...decimalParts] = valueStr.split(".");
    const formattedInteger = integerPart
      .replace(/\D/g, "")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const decimalPart = decimalParts.join("").replace(/\D/g, "");

    return hasDecimal ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };

  const parseNumberFromFormatted = (formattedValue) => {
    if (formattedValue === null || formattedValue === undefined || formattedValue === "") return "";

    const cleanedValue = formattedValue.toString().replace(/,/g, "").replace(/[^\d.]/g, "");
    const [integerPart, ...decimalParts] = cleanedValue.split(".");

    return decimalParts.length ? `${integerPart}.${decimalParts.join("")}` : integerPart;
  };

  // Prepare initial values with decryption for financial fields
  const getInitialFormValues = () => {
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
      holdRate: initialValues.holdRate || "",
      employmentType: initialValues.employmentType || "",
      recruiterName: initialValues.recruiterName || "",
      sales: initialValues.sales || "",
      status: initialValues.status || "",
      referal: initialValues.referal || "",
      projectIn: initialValues.projectIn || "",
      visa: initialValues.visa || "",
      projectInC2cSubVendorName: initialValues.projectInC2cSubVendorName || "",
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
        
        const grossProfit = Number((billRate - payRate).toFixed(2));

        const encryptedBillRate = encryptFinancialValue(billRate);
        const encryptedPayRate = encryptFinancialValue(payRate);
        const encryptedGrossProfit = encryptFinancialValue(grossProfit);

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
          dispatch(updateUsPlacement({
            id: initialValues.id,
            placementData: payload,
          }));
        } else {
          dispatch(createUsPlacement(payload));
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
    const billRate = parseFloat(parseNumberFromFormatted(formik.values.billRate)) || 0;
    const payRate = parseFloat(parseNumberFromFormatted(formik.values.payRate)) || 0;
    
    if (billRate > 0 && payRate > 0) {
      const grossProfit = Number((billRate - payRate).toFixed(2));
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
      loading = false,
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
              : formik.values[id] || ""
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
          disabled={loading}
          InputProps={{
            ...inputProps,
            readOnly: readOnly,
          }}
          InputLabelProps={{
            shrink: type === "date" ? true : undefined,
          }}
        >
          {select && options.length > 0 ? (
            options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))
          ) : select && loading ? (
            <MenuItem disabled>Loading employees...</MenuItem>
          ) : select ? (
            <MenuItem disabled>No options available</MenuItem>
          ) : null}
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
          
          {/* Recruiter Field - Using Autocomplete with search */}
          <Grid item xs={12} sm={6}>
            <EmployeeAutocomplete
              id="recruiterName"
              label="Recruiter"
              options={internalEmployees}
              loading={loadingEmployees}
              value={formik.values.recruiterName}
              onChange={(newValue) => {
                formik.setFieldValue("recruiterName", newValue);
              }}
              error={formik.touched.recruiterName && Boolean(formik.errors.recruiterName)}
              helperText={
                formik.touched.recruiterName && formik.errors.recruiterName
                  ? formik.errors.recruiterName
                  : ""
              }
              placeholder="Search for a recruiter..."
            />
          </Grid>

          {/* Sales Field - Using Autocomplete with search */}
          <Grid item xs={12} sm={6}>
            <EmployeeAutocomplete
              id="sales"
              label="Sales"
              options={internalEmployees}
              loading={loadingEmployees}
              value={formik.values.sales}
              onChange={(newValue) => {
                formik.setFieldValue("sales", newValue);
              }}
              error={formik.touched.sales && Boolean(formik.errors.sales)}
              helperText={
                formik.touched.sales && formik.errors.sales
                  ? formik.errors.sales
                  : ""
              }
              placeholder="Search for a sales person..."
            />
          </Grid>

          {/* Status Message and Remarks */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="statusMessage"
              name="statusMessage"
              label="Status Message"
              value={formik.values.statusMessage || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.statusMessage && Boolean(formik.errors.statusMessage)}
              helperText={formik.touched.statusMessage && formik.errors.statusMessage}
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              id="remarks"
              name="remarks"
              label="Remarks"
              value={formik.values.remarks || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.remarks && Boolean(formik.errors.remarks)}
              helperText={formik.touched.remarks && formik.errors.remarks}
              multiline
              rows={3}
            />
          </Grid>

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