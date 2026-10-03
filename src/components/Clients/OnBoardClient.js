import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  Switch,
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
  Percent,
  Save,
  RestartAlt,
  Phone,
  Cancel,
  Assignment,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { fetchEmployees } from "../../redux/employeesSlice";

// ─── Indian States + UT list ──────────────────────────────────────────────────
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
  // Special
  "Others",
];

// ─── Invoice helpers ──────────────────────────────────────────────────────────
// The Switch in the UI works with a boolean, but the backend expects "Yes"/"No".

// Converts whatever the backend / form holds ("Yes", "No", true, false, "true",
// null, undefined) into a real boolean for the Switch.
const normalizeInvoice = (val) => {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const v = val.trim().toLowerCase();
    return v === "yes" || v === "true";
  }
  return false;
};

// Converts the boolean form value into the "Yes" / "No" payload value.
const invoiceToYesNo = (val) => (normalizeInvoice(val) ? "Yes" : "No");

// ─── Supporting customer helpers ──────────────────────────────────────────────
// Backend shape:  { clientName: "KPMG", netPay: 50000 }
// Form shape:     { clientName: "KPMG", netPay: 50000 }   (same keys)
//
// Incoming data (edit mode) is normalised so that:
//   - { clientName, netPay }       -> used as is
//   - { clientName, netPayment }   -> legacy key, mapped to netPay
//   - plain string                 -> { clientName: string, netPay: "" }
const normalizeSupportingCustomers = (val) =>
  Array.isArray(val)
    ? val.map((item) =>
        item && typeof item === "object"
          ? {
              clientName: item.clientName ?? "",
              netPay: item.netPay ?? item.netPayment ?? "",
            }
          : { clientName: item ?? "", netPay: "" }
      )
    : [];

// Builds the payload shape expected by the backend:
//   [{ clientName: "KPMG", netPay: 50000 }, ...]
// Rows that are completely empty are dropped; netPay becomes a number or null.
const buildSupportingCustomersPayload = (list) =>
  (Array.isArray(list) ? list : [])
    .map((item) => {
      const clientName =
        typeof item?.clientName === "string" ? item.clientName.trim() : "";
      const rawPay = item?.netPay;
      const hasPay =
        rawPay !== "" &&
        rawPay !== null &&
        rawPay !== undefined &&
        !Number.isNaN(Number(rawPay));
      return {
        clientName,
        netPay: hasPay ? Number(rawPay) : null,
      };
    })
    .filter((item) => item.clientName !== "" || item.netPay !== null);

// ─── GSTIN validation helpers ─────────────────────────────────────────────────
const GSTIN_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Valid state / UT codes (01–38, plus 97 = Other Territory, 99 = Centre Jurisdiction)
const VALID_GST_STATE_CODES = new Set([
  ...Array.from({ length: 38 }, (_, i) => String(i + 1).padStart(2, "0")),
  "97",
  "99",
]);

// Structure: 2 digits | PAN (5 letters, 4 digits, 1 letter) | entity code (1-9 / A-Z) | 'Z' | checksum
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// 4th character of the PAN = holder type (P = Person, C = Company, F = Firm, ...)
const VALID_PAN_HOLDER_TYPES = "PCHFATBLJG";

// Modified Luhn Mod-36: computes the expected 15th character from the first 14
const getGstinChecksumChar = (first14) => {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const value = GSTIN_CHARSET.indexOf(first14[i]);
    const product = value * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GSTIN_CHARSET[(36 - (sum % 36)) % 36];
};

const gstinSchema = Yup.string()
  .nullable()
  .transform((value) =>
    typeof value === "string" ? value.trim().toUpperCase() || null : value
  )
  .test("gstin-length", "GSTIN must be exactly 15 characters", (value) =>
    !value ? true : value.length === 15
  )
  .test(
    "gstin-format",
    "Invalid GSTIN format (e.g. 29AAAAA1111A1Z1)",
    (value) => (!value || value.length !== 15 ? true : GSTIN_REGEX.test(value))
  )
  .test(
    "gstin-state",
    "Invalid state code (first 2 digits)",
    (value) =>
      !value || !GSTIN_REGEX.test(value)
        ? true
        : VALID_GST_STATE_CODES.has(value.slice(0, 2))
  )
  .test(
    "gstin-pan",
    "GSTIN contains an invalid PAN (characters 3–12)",
    (value) =>
      !value || !GSTIN_REGEX.test(value)
        ? true
        : VALID_PAN_HOLDER_TYPES.includes(value[5]) // 4th char of PAN = 6th char of GSTIN
  )
  .test(
    "gstin-checksum",
    "Invalid GSTIN (checksum digit does not match)",
    (value) =>
      !value || !GSTIN_REGEX.test(value)
        ? true
        : getGstinChecksumChar(value.slice(0, 14)) === value[14]
  );

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
  const dispatch = useDispatch();
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState(initialData?.currency || "INR");
  const { userName } = useSelector((state) => state.auth);
  const [onBoardedByName, setOnBoardedBy] = useState(
    initialData?.onBoardedBy || userName
  );

  // ── Location: track whether "Others" is selected ──────────────────────────
  const [locationSelection, setLocationSelection] = useState(() => {
    if (!initialData?.location) return "";
    return INDIAN_STATES.includes(initialData.location)
      ? initialData.location
      : "Others";
  });
  const [customLocation, setCustomLocation] = useState(() => {
    if (!initialData?.location) return "";
    return INDIAN_STATES.includes(initialData.location)
      ? ""
      : initialData.location;
  });

  const { employeesList: employees = [], fetchStatus } = useSelector(
    (state) => state.employee || {}
  );
  const employeesLoading = fetchStatus === "loading";

  const bdmEmployees = employees.filter(
    (emp) => emp.roles && emp.roles.toUpperCase() === "BDM"
  );

  // Reporting Manager dropdown: BDMs + Super Admins.
  // Role text is normalized (letters only, uppercase) so "SUPERADMIN",
  // "SUPER_ADMIN", "Super Admin" etc. all match.
  const normalizeRole = (role) =>
    String(role || "")
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase();

  const reportingManagerEmployees = employees.filter((emp) => {
    const role = normalizeRole(emp.roles);
    return role === "BDM" || role === "SUPERADMIN" || role === "TEAMLEAD";
  });

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  useEffect(() => {
    if (initialData) {
      setCurrency(initialData.currency || "INR");
      setOnBoardedBy(
        initialData.onBoardedBy || initialData.bdmName || userName || ""
      );

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

      // Sync location state when initialData changes
      if (initialData.location) {
        if (INDIAN_STATES.includes(initialData.location)) {
          setLocationSelection(initialData.location);
          setCustomLocation("");
        } else {
          setLocationSelection("Others");
          setCustomLocation(initialData.location);
        }
      }
    }
  }, [initialData, isEdit, userName]);

  const formFields = [
    {
      section: "Basic Information",
      fields: [
        {
          name: "vendorName",
          label: "Vendor Name",
          required: true,
          type: "text",
          grid: { xs: 12, sm: 6, md: 4 },
          icon: <Business color="primary" />,
        },
        {
          name: "positionType",
          label: "Position Type",
          type: "select",
          grid: { xs: 12, sm: 6, md: 4 },
          icon: <WorkOutline color="primary" />,
          options: [
            { value: "Full-Time", label: "Full-Time" },
            { value: "Part-Time", label: "Part-Time" },
            { value: "Contract", label: "Contract" },
            { value: "Internship", label: "Internship" },
            { value: "Hybrid", label: "Hybrid" },
          ],
        },
        {
          name: "assignedTo",
          label: "Assigned To (BDM)",
          type: "select",
          grid: { xs: 12, sm: 6, md: 4 },
          icon: <Assignment color="primary" />,
          options: bdmEmployees.length
            ? bdmEmployees.map((emp) => ({
                value: emp.userName,
                label: `${emp.userName}`,
              }))
            : [{ value: "", label: "No BDMs Available" }],
        },
        {
          name: "vendorWebsiteUrl",
          label: "Vendor Website URL",
          type: "url",
          placeholder: "https://",
          grid: { xs: 12, sm: 6, md: 4 },
          icon: <Language color="primary" />,
        },
        {
          name: "vendorLinkedInUrl",
          label: "Vendor LinkedIn URL",
          type: "url",
          placeholder: "https://linkedin.com/company/",
          grid: { xs: 12, sm: 6, md: 4 },
          icon: <LinkedIn color="primary" />,
        },
        {
          name: "accountManager",
          label: "Account Manager",
          type: "select",
          grid: { xs: 12, sm: 6, md: 4 },
          icon: <Person color="primary" />,
          options: reportingManagerEmployees.length
            ? reportingManagerEmployees.map((emp) => ({
                value: emp.userName,
                label: `${emp.userName}`,
              }))
            : [{ value: "", label: "No Managers Available" }],
        },
        {
          name: "vendorAddress",
          label: "Vendor Address",
          type: "text",
          placeholder: "Enter complete address",
          grid: { xs: 12, md: 8 },
          icon: <LocationOn color="primary" />,
        },
        // ── location field is rendered separately below ──
      ],
    },
    {
      section: "Payment Information",
      fields: [
        {
          name: "currency",
          label: "Entity",
          type: "select",
          grid: { xs: 12, sm: 6, md: 3 },
          icon: <AttachMoney color="primary" />,
          options: [
            { value: "INR", label: "Rupee (INR)" },
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
          grid: { xs: 12, sm: 6, md: 3 },
          endAdornment: <InputAdornment position="end">Days</InputAdornment>,
        },
        {
          name: "gst",
          label: "GST",
          type: "text",
          placeholder: "e.g. 29AAAAA1111A1Z1",
          grid: { xs: 12, sm: 6, md: 3 },
          conditional: () => currency === "INR",
          uppercase: true, // force uppercase + 15-char limit while typing
          maxLength: 15,
        },
      ],
    },
  ];

  const contactFields = [
    {
      name: "clientSpocName",
      label: "Contact Name",
      icon: <Person color="primary" />,
    },
    {
      name: "clientSpocEmailid",
      label: "Contact Email",
      icon: <Email color="primary" />,
    },
    {
      name: "clientSpocMobileNumber",
      label: "Contact Mobile",
      icon: <Phone color="primary" />,
    },
    {
      name: "clientSpocLinkedin",
      label: "Contact LinkedIn",
      placeholder: "https://linkedin.com/in/",
      icon: <LinkedIn color="primary" />,
    },
  ];

  const feedBack = [
    {
      name: "feedBack",
      label: "FeedBack",
      type: "textarea",
      grid: { xs: 12 },
    },
  ];

  const validationSchema = Yup.object().shape({
    // Top-level client name (shown in both create and edit mode).
    // To make it mandatory use:
    //   Yup.string().trim().required("Client name is required")
    clientName: Yup.string().nullable(),
    vendorName: Yup.string()
      .required("Vendor name is required")
      .max(50, "Vendor name must be at most 50 characters"),
    vendorAddress: Yup.string()
      .nullable()
      .max(250, "Vendor address must be at most 250 characters"),
    location: Yup.string().nullable(),
    positionType: Yup.string().nullable(),
    assignedTo: Yup.string().nullable(),
    reportingManager: Yup.string().nullable(),
    paymentType: Yup.string().nullable(),
    invoice: Yup.boolean().nullable(), // form state stays boolean; converted to "Yes"/"No" on submit
    netPayment: Yup.number()
      .positive("Must be a positive number")
      .nullable()
      .transform((value, originalValue) =>
        originalValue === "" ? null : value
      ),
    // GSTIN is only applicable (and shown) for INR; skip validation otherwise
    gst: Yup.string()
      .nullable()
      .when("currency", {
        is: "INR",
        then: () => gstinSchema,
        otherwise: (schema) => schema.nullable(),
      }),
    // Each supporting customer: { clientName (required), netPay }
    supportingCustomers: Yup.array().of(
      Yup.object().shape({
        clientName: Yup.string().trim().required("Client name is required"),
        netPay: Yup.number()
          .typeError("Must be a number")
          .positive("Must be a positive number")
          .nullable()
          .transform((value, originalValue) =>
            originalValue === "" || originalValue === null ? null : value
          ),
      })
    ),
    vendorWebsiteUrl: Yup.string()
      .url("Must be a valid URL")
      .nullable()
      .transform((value) => (value === "" ? null : value)),
    vendorLinkedInUrl: Yup.string()
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

  const defaultInitialValues = {
    clientName: "",
    vendorName: "",
    vendorAddress: "",
    location: "",
    positionType: "",
    assignedTo: "",
    reportingManager: "",
    netPayment: "",
    onBoardedBy: onBoardedByName,
    gst: "",
    supportingCustomers: [],
    vendorWebsiteUrl: "",
    vendorLinkedInUrl: "",
    clientSpocName: [""],
    clientSpocEmailid: [""],
    clientSpocMobileNumber: [""],
    clientSpocLinkedin: [""],
    supportingDocuments: [],
    currency: "INR",
    feedBack: "",
    invoice: false,
  };

  const normalizeArray = (val, fallback = [""]) =>
    Array.isArray(val) && val.length > 0 ? val : fallback;

  const formInitialValues = useMemo(() => {
    if (!initialData) {
      return {
        ...defaultInitialValues,
        onBoardedBy: onBoardedByName,
      };
    }

    // Map API response fields to form fields
    const base = {
      // Top-level client (outside supportingCustomers) — editable
      clientName: initialData.clientName || "",
      // vendorName: API may send vendorName OR clientName
      vendorName: initialData.vendorName || initialData.clientName || "",
      vendorAddress:
        initialData.vendorAddress || initialData.clientAddress || "",
      location: initialData.location || "",
      positionType: initialData.positionType || "",
      assignedTo: initialData.assignedTo || "",
      reportingManager: initialData.reportingManager || "",
      netPayment: initialData.netPayment ?? "",
      onBoardedBy: initialData.onBoardedBy || onBoardedByName,
      gst: initialData.gst || "",
      vendorWebsiteUrl:
        initialData.vendorWebsiteUrl || initialData.clientWebsiteUrl || "",
      vendorLinkedInUrl:
        initialData.vendorLinkedInUrl || initialData.clientLinkedInUrl || "",
      currency: initialData.currency || "INR",
      feedBack: initialData.feedBack || "",
      invoice: normalizeInvoice(initialData.invoice),

      // Contact persons (SPOC) — these are arrays
      clientSpocName: normalizeArray(initialData.clientSpocName),
      clientSpocEmailid: normalizeArray(initialData.clientSpocEmailid),
      clientSpocMobileNumber: normalizeArray(
        initialData.clientSpocMobileNumber
      ),
      clientSpocLinkedin: normalizeArray(initialData.clientSpocLinkedin),

      // Supporting customers — separate from the top-level client
      supportingCustomers: normalizeSupportingCustomers(
        initialData.supportingCustomers
      ),

      supportingDocuments: initialData.supportingDocuments || [],
    };

    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

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

  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      const clientData = {
        ...values,
        currency,
        onBoardedBy: onBoardedByName,
        invoice: invoiceToYesNo(values.invoice), // "Yes" / "No" in payload
        // Send a trimmed, uppercase GSTIN (matches what was validated)
        gst:
          typeof values.gst === "string"
            ? values.gst.trim().toUpperCase()
            : values.gst,
        // Payload shape: [{ clientName: "KPMG", netPay: 50000 }, ...]
        supportingCustomers: buildSupportingCustomersPayload(
          values.supportingCustomers
        ),
      };

      if (isEdit) {
        clientData.supportingDocuments = files
          .filter((file) => file.isExisting)
          .map((file) => file.name);
      }

      formData.append("dto", JSON.stringify(clientData));

      files
        .filter((file) => !file.isExisting)
        .forEach((file) => {
          formData.append("supportingDocuments", file);
        });

      await onSubmit(formData, isEdit);

      if (!isEdit) {
        resetForm();
        setFiles([]);
        setLocationSelection("");
        setCustomLocation("");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      showToast(error.message || "Failed to submit form", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addContactPerson = (values, setFieldValue) => {
    contactFields.forEach((field) => {
      setFieldValue(field.name, [...values[field.name], ""]);
    });
    showToast("New contact person added", "info");
  };

  const removeContactPerson = (index, values, setFieldValue) => {
    if (values.clientSpocName.length > 1) {
      contactFields.forEach((field) => {
        const newArray = [...values[field.name]];
        newArray.splice(index, 1);
        setFieldValue(field.name, newArray);
      });
      showToast("Contact person removed", "info");
    }
  };

  const renderFormField = (field, values, errors, touched, setFieldValue) => {
    if (field.conditional && !field.conditional()) {
      return null;
    }

    if (field.type === "select") {
      return (
        <Grid item {...field.grid} key={field.name}>
          <FormControl
            fullWidth
            error={touched[field.name] && Boolean(errors[field.name])}
          >
            <InputLabel id={`${field.name}-label`}>{field.label}</InputLabel>
            <Select
              labelId={`${field.name}-label`}
              id={field.name}
              name={field.name}
              label={field.label}
              value={values[field.name] || ""}
              onChange={(e) => {
                if (field.customHandler) {
                  field.customHandler(e, setFieldValue);
                } else {
                  setFieldValue(field.name, e.target.value);
                }
              }}
              disabled={field.loading}
              startAdornment={
                field.icon && (
                  <InputAdornment position="start">{field.icon}</InputAdornment>
                )
              }
            >
              <MenuItem value="" disabled>
                {field.loading ? "Loading..." : `Select ${field.label}`}
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
      <Grid item {...field.grid} key={field.name}>
        <Field name={field.name}>
          {({ field: formikField, meta }) => (
            <TextField
              {...formikField}
              onChange={(e) => {
                if (field.uppercase) {
                  setFieldValue(field.name, e.target.value.toUpperCase());
                } else {
                  formikField.onChange(e);
                }
              }}
              fullWidth
              label={field.label}
              placeholder={field.placeholder || ""}
              required={field.required}
              type={field.type || "text"}
              error={meta.touched && Boolean(meta.error)}
              helperText={meta.touched && meta.error}
              inputProps={
                field.maxLength ? { maxLength: field.maxLength } : undefined
              }
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

  // ── Location field renderer ────────────────────────────────────────────────
  const renderLocationField = (values, errors, touched, setFieldValue) => (
    <React.Fragment>
      {/* State dropdown */}
      <Grid item xs={12} sm={6} md={4}>
        <FormControl fullWidth>
          <InputLabel id="location-label">Location (State)</InputLabel>
          <Select
            labelId="location-label"
            id="location-select"
            value={locationSelection}
            label="Location (State)"
            onChange={(e) => {
              const selected = e.target.value;
              setLocationSelection(selected);

              if (selected !== "Others") {
                setCustomLocation("");
                setFieldValue("location", selected);
              } else {
                // Clear the formik value until user types custom
                setFieldValue("location", "");
              }
            }}
            startAdornment={
              <InputAdornment position="start">
                <LocationOn color="primary" />
              </InputAdornment>
            }
            MenuProps={{
              PaperProps: {
                style: { maxHeight: 300 },
              },
            }}
          >
            <MenuItem value="" disabled>
              Select State / UT
            </MenuItem>
            {INDIAN_STATES.map((state) => (
              <MenuItem key={state} value={state}>
                {state}
              </MenuItem>
            ))}
          </Select>
          {touched.location && errors.location && (
            <Typography variant="caption" color="error">
              {errors.location}
            </Typography>
          )}
        </FormControl>
      </Grid>

      {/* Custom location input — shown only when "Others" is selected */}
      {locationSelection === "Others" && (
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Custom Location"
            placeholder="Enter your location"
            value={customLocation}
            onChange={(e) => {
              setCustomLocation(e.target.value);
              setFieldValue("location", e.target.value);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOn color="secondary" />
                </InputAdornment>
              ),
            }}
            helperText="Please specify your location"
          />
        </Grid>
      )}
    </React.Fragment>
  );

  // ── Invoice toggle renderer (highlighted, shown at the right end of the
  //    Basic Information header) ─────────────────────────────────────────────
  const renderInvoiceToggle = (values, setFieldValue) => {
    const isOn = Boolean(values.invoice);
    return (
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{
          ml: { xs: 0, sm: 4 }, // gap between the section title and the toggle
          px: 3,
          py: 1,
          border: "2px solid",
          borderColor: isOn ? "success.main" : "primary.main",
          borderRadius: 3,
          bgcolor: isOn ? "rgba(46, 125, 50, 0.10)" : "rgba(26, 35, 126, 0.07)",
          boxShadow: isOn
            ? "0 0 0 4px rgba(46, 125, 50, 0.15)"
            : "0 0 0 4px rgba(26, 35, 126, 0.12)",
          transition: "all 0.25s ease",
        }}
      >
        <Typography
          variant="subtitle1"
          color={isOn ? "success.main" : "primary"}
          sx={{ fontWeight: 700, letterSpacing: 0.5 }}
        >
          Invoice
        </Typography>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography
            variant="body2"
            color={!isOn ? "text.primary" : "text.disabled"}
            sx={{ fontWeight: !isOn ? 700 : 400 }}
          >
            No
          </Typography>
          <Switch
            color={isOn ? "success" : "primary"}
            checked={isOn}
            onChange={(e) => setFieldValue("invoice", e.target.checked)}
            inputProps={{ "aria-label": "Invoice toggle" }}
            sx={{ transform: "scale(1.25)", mx: 0.5 }}
          />
          <Typography
            variant="body2"
            color={isOn ? "success.main" : "text.disabled"}
            sx={{ fontWeight: isOn ? 700 : 400 }}
          >
            Yes
          </Typography>
        </Stack>
      </Stack>
    );
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
                      {section.section === "Basic Information" ? (
                        // Title on the left, Invoice toggle at the right end
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 2,
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="h6"
                            color="primary"
                            sx={{ fontWeight: 500 }}
                          >
                            {section.section}
                          </Typography>
                          {renderInvoiceToggle(values, setFieldValue)}
                        </Box>
                      ) : (
                        <Typography
                          variant="h6"
                          color="primary"
                          sx={{ mb: 1, fontWeight: 500 }}
                        >
                          {section.section}
                        </Typography>
                      )}
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

                    {/* Inject location dropdown after Basic Information section */}
                    {section.section === "Basic Information" &&
                      renderLocationField(values, errors, touched, setFieldValue)}
                  </React.Fragment>
                ))}

                {/* Supporting Customers */}
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

                {/* Main client (top-level clientName) — shown in both create
                    and edit mode, editable and placed ABOVE the Add Client
                    button */}
                <Grid item xs={12} sm={4} md={3}>
                  <Field name="clientName">
                    {({ field, meta }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ""}
                        fullWidth
                        label="Client Name"
                        placeholder="Enter client name"
                        error={meta.touched && Boolean(meta.error)}
                        helperText={meta.touched && meta.error}
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Business color="primary" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  </Field>
                </Grid>

                <Grid item xs={12}>
                  <FieldArray name="supportingCustomers">
                    {({ push, remove }) => (
                      <Box>
                        {/* Add Client button — ABOVE the rows */}
                        <Button
                          startIcon={<AddCircleOutline />}
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            push({ clientName: "", netPay: "" });
                            showToast("New client field added", "info");
                          }}
                          sx={{ mb: 2 }}
                        >
                          Add Client
                        </Button>

                        {/* Rows render BELOW the button */}
                        {values.supportingCustomers &&
                        values.supportingCustomers.length > 0 ? (
                          <Paper
                            variant="outlined"
                            sx={{ p: 2, mb: 2, borderRadius: 2 }}
                          >
                            <Grid container spacing={2}>
                              {values.supportingCustomers.map(
                                (customer, index) => (
                                  <Grid item xs={12} md={6} key={index}>
                                    <Box sx={{ display: "flex", gap: 1 }}>
                                      {/* Client {index+1} — required */}
                                      <Field
                                        name={`supportingCustomers.${index}.clientName`}
                                      >
                                        {({ field, meta }) => (
                                          <TextField
                                            {...field}
                                            value={field.value ?? ""}
                                            fullWidth
                                            required
                                            label={`Client ${index + 1}`}
                                            placeholder={`Client ${index + 1}`}
                                            error={
                                              meta.touched &&
                                              Boolean(meta.error)
                                            }
                                            helperText={
                                              meta.touched && meta.error
                                            }
                                            variant="outlined"
                                            size="medium"
                                            InputLabelProps={{ shrink: true }}
                                          />
                                        )}
                                      </Field>
                                      {/* Net Payment {index+1} — stored as netPay */}
                                      <Field
                                        name={`supportingCustomers.${index}.netPay`}
                                      >
                                        {({ field, meta }) => (
                                          <TextField
                                            {...field}
                                            value={field.value ?? ""}
                                            fullWidth
                                            type="number"
                                            label={`Net Payment ${index + 1}`}
                                            placeholder={`Net Payment ${
                                              index + 1
                                            }`}
                                            error={
                                              meta.touched &&
                                              Boolean(meta.error)
                                            }
                                            helperText={
                                              meta.touched && meta.error
                                            }
                                            variant="outlined"
                                            size="medium"
                                            InputLabelProps={{ shrink: true }}
                                          />
                                        )}
                                      </Field>
                                      <IconButton
                                        color="error"
                                        onClick={() => {
                                          remove(index);
                                          showToast("Client removed", "info");
                                        }}
                                        sx={{
                                          border: "1px solid",
                                          borderColor: "divider",
                                          borderRadius: 2,
                                          alignSelf: "flex-start",
                                          height: 56,
                                          width: 56,
                                        }}
                                      >
                                        <RemoveCircleOutline />
                                      </IconButton>
                                    </Box>
                                  </Grid>
                                )
                              )}
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
                      </Box>
                    )}
                  </FieldArray>
                </Grid>

                {/* Contact Information */}
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
                    <Person sx={{ mr: 1 }} /> Contact Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-start",
                      mt: 2,
                      mb: 3,
                    }}
                  >
                    <Button
                      startIcon={<AddCircleOutline />}
                      variant="outlined"
                      color="primary"
                      onClick={() => addContactPerson(values, setFieldValue)}
                    >
                      Add Contact Person
                    </Button>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  {values.clientSpocName.map((_, index) => (
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2, mb: 2 }}
                      key={index}
                    >
                      <Grid container spacing={2}>
                        {contactFields.map((field) => (
                          <Grid item xs={12} sm={6} md={3} key={field.name}>
                            <Field name={`${field.name}.${index}`}>
                              {({ field: formikField, meta }) => (
                                <TextField
                                  {...formikField}
                                  fullWidth
                                  label={field.label}
                                  placeholder={field.placeholder || ""}
                                  error={meta.touched && Boolean(meta.error)}
                                  helperText={meta.touched && meta.error}
                                  InputProps={{
                                    startAdornment: field.icon && (
                                      <InputAdornment position="start">
                                        {field.icon}
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              )}
                            </Field>
                          </Grid>
                        ))}
                        <Grid
                          item
                          xs={12}
                          sx={{ display: "flex", justifyContent: "flex-end" }}
                        >
                          <IconButton
                            color="error"
                            onClick={() =>
                              removeContactPerson(index, values, setFieldValue)
                            }
                            disabled={values.clientSpocName.length === 1}
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                            }}
                          >
                            <RemoveCircleOutline />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Grid>

                {/* Supporting Documents */}
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
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      bgcolor: "rgba(0, 0, 0, 0.01)",
                    }}
                  >
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

                    <Box
                      sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}
                    >
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
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontStyle: "italic" }}
                        >
                          {isEdit
                            ? "No documents available. Upload new documents."
                            : "No files selected. Please upload at least one supporting document."}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Feedback — edit mode only */}
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
                      {feedBack.map((field) => (
                        <Field name={field.name} key={field.name}>
                          {({ field: formikField, meta }) => (
                            <TextField
                              {...formikField}
                              fullWidth
                              multiline
                              rows={4}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              error={meta.touched && Boolean(meta.error)}
                              helperText={meta.touched && meta.error}
                              variant="outlined"
                              InputLabelProps={{ shrink: true }}
                            />
                          )}
                        </Field>
                      ))}
                    </Grid>
                  </React.Fragment>
                )}

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }} />
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems="center"
                    justifyContent="flex-end"
                  >
                    {onCancel && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={onCancel}
                        startIcon={<Cancel />}
                        size="large"
                        sx={{ px: 4 }}
                      >
                        Cancel
                      </Button>
                    )}

                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        resetForm();
                        if (!isEdit) {
                          setFiles([]);
                          setLocationSelection("");
                          setCustomLocation("");
                        }
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