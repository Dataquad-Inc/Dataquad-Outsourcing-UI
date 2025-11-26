import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  useTheme,
  Paper,
  InputAdornment,
  Chip,
  Select,
  OutlinedInput,
  FormControl,
  InputLabel,
  FormHelperText,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  ListSubheader,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import SearchIcon from "@mui/icons-material/Search";

// ICON IMPORTS
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import SchoolIcon from "@mui/icons-material/School";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GroupIcon from "@mui/icons-material/Group";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import AdjustIcon from "@mui/icons-material/Adjust";
import PublicIcon from "@mui/icons-material/Public";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import GavelIcon from "@mui/icons-material/Gavel";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import CodeIcon from "@mui/icons-material/Code";
import TimelineIcon from "@mui/icons-material/Timeline";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import EventIcon from "@mui/icons-material/Event";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import CommentIcon from "@mui/icons-material/Comment";
import WcIcon from "@mui/icons-material/Wc";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import BadgeIcon from "@mui/icons-material/Badge";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import DialpadIcon from "@mui/icons-material/Dialpad";
import ClearIcon from "@mui/icons-material/Clear";

// Custom Button Component (simplified version)
const CustomButton = ({ children, loading, ...props }) => (
  <Button disabled={loading} {...props}>
    {children}
  </Button>
);

// Custom Phone Input Component (simplified version)
const countryCodes = [
  { code: "+1", label: "USA", maxLength: 10, format: [3, 3, 4] },
  { code: "+91", label: "IND", maxLength: 10, format: [4, 3, 3] },
  { code: "+86", label: "CHN", maxLength: 11, format: [3, 4, 4] },
  { code: "+62", label: "IDN", maxLength: 10, format: [4, 3, 3] },
  { code: "+55", label: "BRA", maxLength: 11, format: [2, 5, 4] },
  { code: "+92", label: "PAK", maxLength: 10, format: [3, 3, 4] },
  { code: "+880", label: "BGD", maxLength: 10, format: [3, 3, 4] },
  { code: "+234", label: "NGA", maxLength: 10, format: [3, 3, 4] },
  { code: "+44", label: "UK", maxLength: 10, format: [5, 3, 2] },
  { code: "+81", label: "JPN", maxLength: 10, format: [3, 3, 4] },
];

const formatNumber = (digits, pattern) => {
  let result = "";
  let idx = 0;

  for (let len of pattern) {
    if (idx >= digits.length) break;
    if (result) result += " ";
    result += digits.slice(idx, idx + len);
    idx += len;
  }

  return result;
};

const PhoneInput = ({
  label = "Phone Number",
  name = "phone",
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  countryCode,
  setCountryCode,
  ...props
}) => {
  const showClear = value && !disabled;

  const selectedCountry = countryCodes.find((c) => c.code === countryCode);
  const maxLength = selectedCountry?.maxLength || 15;
  const formatPattern = selectedCountry?.format || [3, 3, 4];

  const handleClear = () => {
    const syntheticEvent = {
      target: {
        name,
        value: "",
      },
    };
    onChange(syntheticEvent);
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const trimmed = raw.slice(0, maxLength);
    const formatted = formatNumber(trimmed, formatPattern);

    const syntheticEvent = {
      target: {
        name: e.target.name,
        value: formatted,
      },
    };
    onChange(syntheticEvent);
  };

  return (
    <TextField
      label={label}
      name={name}
      type="tel"
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      error={!!error}
      helperText={error || helperText}
      required={required}
      disabled={disabled}
      fullWidth
      variant="outlined"
      inputProps={{ maxLength: 20 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <PhoneIcon sx={{ mr: 1 }} />
            <Select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              variant="standard"
              disableUnderline
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 150,
                    overflowY: "auto",
                    // Custom scrollbar
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "#f1f1f1",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "#4C585B",
                      borderRadius: "4px",
                    },
                  },
                },
              }}
              sx={{
                width: 70,
              }}
            >
              {countryCodes.map((item) => (
                <MenuItem key={item.code} value={item.code}>
                  {item.code}
                </MenuItem>
              ))}
            </Select>
          </InputAdornment>
        ),
        endAdornment: showClear ? (
          <InputAdornment position="end">
            <IconButton onClick={handleClear} size="small">
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      {...props}
    />
  );
};

// Searchable Select Component
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  onBlur,
  label,
  name,
  error,
  helperText,
  icon,
  required = false,
  placeholder = "Search and select...",
}) => {
  const theme = useTheme();
  const [searchText, setSearchText] = useState("");

  // Filter options based on search text
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <FormControl fullWidth error={Boolean(error)}>
      <Autocomplete
        options={filteredOptions}
        value={selectedOption}
        onChange={(event, newValue) => {
          const syntheticEvent = {
            target: {
              name,
              value: newValue ? newValue.value : "",
            },
          };
          onChange(syntheticEvent);
        }}
        onBlur={onBlur}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value?.value}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            name={name}
            required={required}
            error={Boolean(error)}
            helperText={error || helperText}
            InputProps={{
              ...params.InputProps,
              startAdornment: icon ? (
                <InputAdornment position="start">{icon}</InputAdornment>
              ) : null,
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Typography variant="body2">{option.label}</Typography>
          </Box>
        )}
        noOptionsText="No options found"
        placeholder={placeholder}
        clearOnBlur
        selectOnFocus
        handleHomeEndKeys
        sx={{
          "& .MuiAutocomplete-popupIndicator": {
            color: theme.palette.text.secondary,
          },
        }}
      />
    </FormControl>
  );
};

// Searchable Multi-Select Component
const SearchableMultiSelect = ({
  options = [],
  value = [],
  onChange,
  onBlur,
  label,
  name,
  error,
  helperText,
  icon,
  required = false,
  placeholder = "Search and select multiple...",
}) => {
  const theme = useTheme();

  // filter options to match the values
  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <FormControl fullWidth error={Boolean(error)}>
      <Autocomplete
        multiple
        options={options}
        value={selectedOptions}
        onChange={(event, newValue) => {
          const selectedValues = newValue.map((option) => option.value);
          const syntheticEvent = {
            target: {
              name,
              value: selectedValues,
            },
          };
          onChange(syntheticEvent);
        }}
        onBlur={onBlur}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, val) => option.value === val.value}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            name={name}
            required={required}
            error={Boolean(error)}
            helperText={error || helperText}
            InputProps={{
              ...params.InputProps,
              startAdornment: icon ? (
                <InputAdornment position="start">{icon}</InputAdornment>
              ) : null,
            }}
          />
        )}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              variant="outlined"
              label={option.label}
              size="small"
              {...getTagProps({ index })}
              key={option.value}
            />
          ))
        }
        renderOption={(props, option, { selected }) => (
          <Box component="li" {...props}>
            <Checkbox
              checked={selected}
              style={{ marginRight: 8 }}
              color="primary"
              size="small"
            />
            <Typography variant="body2">{option.label}</Typography>
          </Box>
        )}
        noOptionsText="No options found"
        placeholder={placeholder}
        clearOnBlur
        selectOnFocus
        handleHomeEndKeys
        sx={{
          "& .MuiAutocomplete-popupIndicator": {
            color: theme.palette.text.secondary,
          },
        }}
      />

      {/* Show selected options below */}
      {selectedOptions.length > 0 && (
        <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
          {selectedOptions.map((opt) => (
            <Chip key={opt.value} label={opt.label} color="primary" />
          ))}
        </Box>
      )}
    </FormControl>
  );
};


// ICON MAP
const iconMap = {
  id: <DialpadIcon />,
  Lock: <LockIcon />,
  Person: <PersonIcon />,
  Email: <EmailIcon />,
  AlternateEmail: <AlternateEmailIcon />,
  School: <SchoolIcon />,
  LocationOn: <LocationOnIcon />,
  Phone: <PhoneIcon />,
  Smartphone: <SmartphoneIcon />,
  PhoneAndroid: <PhoneAndroidIcon />,
  LinkedIn: <LinkedInIcon />,
  Group: <GroupIcon />,
  PersonSearch: <PersonSearchIcon />,
  SupervisorAccount: <SupervisorAccountIcon />,
  BusinessCenter: <BusinessCenterIcon />,
  Adjust: <AdjustIcon />,
  Public: <PublicIcon />,
  TravelExplore: <TravelExploreIcon />,
  VerifiedUser: <VerifiedUserIcon />,
  Gavel: <GavelIcon />,
  CompareArrows: <CompareArrowsIcon />,
  Code: <CodeIcon />,
  Timeline: <TimelineIcon />,
  CalendarToday: <CalendarTodayIcon />,
  EditCalendar: <EditCalendarIcon />,
  Event: <EventIcon />,
  AttachMoney: <AttachMoneyIcon />,
  RequestQuote: <RequestQuoteIcon />,
  Comment: <CommentIcon />,
  Wc: <WcIcon />,
  CalendarMonth: <CalendarMonthIcon />,
  EventAvailable: <EventAvailableIcon />,
  Badge: <BadgeIcon />,
  AssignmentInd: <AssignmentIndIcon />,
  ToggleOn: <ToggleOnIcon />,
  UploadFile: <UploadFileIcon />,
  AttachFile: <AttachFileIcon />,
  CheckBox: <CheckBoxIcon />,
  CheckBoxOutlineBlank: <CheckBoxOutlineBlankIcon />,
  RadioButtonChecked: <RadioButtonCheckedIcon />,
  RadioButtonUnchecked: <RadioButtonUncheckedIcon />,
  Search: <SearchIcon />,
};

// File type icon helper
const getFileIcon = (fileName) => {
  const extension = fileName?.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return <PictureAsPdfIcon color="error" />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return <ImageIcon color="primary" />;
    case "doc":
    case "docx":
      return <DescriptionIcon color="info" />;
    default:
      return <InsertDriveFileIcon />;
  }
};

const DynamicFormUltra = ({
  config,
  onSubmit,
  title,
  initialValues = {},
  onCancel,
  submitButtonText = "Submit",
}) => {
  const theme = useTheme();

  // State for managing country codes for phone fields
  const [countryCodes, setCountryCodes] = useState({});

  const generatedInitialValues = {};
  const validationSchema = {};

  const allFields = config.flatMap((section) => section.fields);

  // Process all initial values, not just config fields
  Object.keys(initialValues).forEach((key) => {
    generatedInitialValues[key] = initialValues[key];
  });

 allFields.forEach((field) => {
  if (initialValues[field.name] !== undefined) {
    generatedInitialValues[field.name] = field.multiple
      ? [...initialValues[field.name]]
      : initialValues[field.name];
  } else {
    if (field.type === "multiselect") {
      generatedInitialValues[field.name] = [];
    } else if (field.type === "file") {
      generatedInitialValues[field.name] = field.multiple ? [] : null;
    } else if (field.type === "checkbox") {
      generatedInitialValues[field.name] = field.defaultChecked || false;
    } else if (field.type === "checkbox-group" || field.type === "radio") {
      generatedInitialValues[field.name] = "";
    } else {
      generatedInitialValues[field.name] = field.multiple ? [""] : "";
    }
  }

    // Initialize country code for phone fields
    if (field.type === "phone") {
      if (!countryCodes[field.name]) {
        setCountryCodes((prev) => ({
          ...prev,
          [field.name]: "+1",
        }));
      }
    }

    // Validation schema setup
    if (field.required && field.type !== "file") { // Add this condition
    if (field.type === "multiselect") {
      validationSchema[field.name] = Yup.array()
        .min(1, "At least one option must be selected")
        .required("Required");
    } else if (field.type === "checkbox") {
      validationSchema[field.name] = Yup.boolean()
        .oneOf([true], "This field must be checked")
        .required("Required");
    } else if (field.type === "checkbox-group") {
      validationSchema[field.name] = Yup.array()
        .min(1, "At least one option must be selected")
        .required("Required");
    } else if (field.type === "radio") {
      validationSchema[field.name] = Yup.string().required(
        "Please select an option"
      );
    } else {
      validationSchema[field.name] = field.multiple
        ? Yup.array().of(Yup.string().required("Required"))
        : Yup.string().required("Required");
    }
  }

    // Add email validation
    if (field.type === "email") {
      const baseValidation = Yup.string().email("Invalid email format");
      validationSchema[field.name] = field.required
        ? baseValidation.required("Required")
        : baseValidation;
    }

    // Add password validation
    if (field.type === "password") {
      const baseValidation = Yup.string()
        .min(8, "Password must be at least 8 characters")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        );
      validationSchema[field.name] = field.required
        ? baseValidation.required("Required")
        : baseValidation;
    }

    // Add phone validation
    if (field.type === "phone") {
      const baseValidation = Yup.string().min(
        10,
        "Phone number must be at least 10 digits"
      );
      validationSchema[field.name] = field.required
        ? baseValidation.required("Required")
        : baseValidation;
    }

    // Add file size validation
    // if (field.type === "file" && field.maxSize) {
    //   const maxSizeInBytes = field.maxSize * 1024 * 1024;
    //   if (field.multiple) {
    //     validationSchema[field.name] = Yup.array().of(
    //       Yup.mixed().test(
    //         "fileSize",
    //         `File size must be less than ${field.maxSize}MB`,
    //         (value) => !value || value.size <= maxSizeInBytes
    //       )
    //     );
    //   } else {
    //     validationSchema[field.name] = Yup.mixed().test(
    //       "fileSize",
    //       `File size must be less than ${field.maxSize}MB`,
    //       (value) => !value || value.size <= maxSizeInBytes
    //     );
    //   }
    // }
  });

  const formik = useFormik({
    initialValues: generatedInitialValues,
    validationSchema: Yup.object(validationSchema),
    onSubmit: (values, formikHelpers) => {
      const formData = new FormData();

      // Process ALL form values, not just config fields
      Object.entries(values).forEach(([key, val]) => {
        // Skip file fields - handle them separately
        const field = allFields.find((f) => f.name === key);

        if (field?.type === "file") {
          return; // Handle files separately below
        }

        // Phone fields: prepend country code if present
        if (field?.type === "phone" && val) {
          const countryCode = countryCodes[key] || "+1";
          const phoneNumber = String(val).replace(/\s/g, "");
          formData.append(key, `${countryCode} ${phoneNumber}`);
          return;
        }

        // Handle other values
        if (val !== undefined && val !== null && val !== "") {
          if (typeof val === "object") {
            formData.append(key, JSON.stringify(val));
          } else {
            formData.append(key, String(val));
          }
        }
      });

      // Handle file fields separately
      allFields.forEach((field) => {
        if (field.type !== "file") return;

        const val = values[field.name];
        if (!val) return;

        const appendFiles = (input) => {
          if (input instanceof File) {
            formData.append(field.name, input);
          } else if (input instanceof FileList) {
            Array.from(input).forEach((f) => formData.append(field.name, f));
          } else if (Array.isArray(input)) {
            input.forEach((f) => {
              if (f instanceof File) formData.append(field.name, f);
            });
          }
        };

        appendFiles(val);
      });

      // Pass the form values directly to onSubmit (not formData)
      onSubmit(values, formikHelpers);
    },
    enableReinitialize: true,
  });

  const handleAddMore = (name) => {
    formik.setFieldValue(name, [...formik.values[name], ""]);
  };

  const handleRemove = (name, index) => {
    const list = [...formik.values[name]];
    list.splice(index, 1);
    formik.setFieldValue(name, list);
  };

  const handleCountryCodeChange = (fieldName, newCountryCode) => {
    setCountryCodes((prev) => ({
      ...prev,
      [fieldName]: newCountryCode,
    }));
  };

  const handleFileRemove = (fieldName, fileIndex = null) => {
    const field = allFields.find((f) => f.name === fieldName);
    if (field?.multiple && fileIndex !== null) {
      const currentFiles = [...formik.values[fieldName]];
      currentFiles.splice(fileIndex, 1);
      formik.setFieldValue(fieldName, currentFiles);
    } else {
      formik.setFieldValue(fieldName, field?.multiple ? [] : null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderFileUpload = (field, fieldName, value, error) => {
    const isMultiple = field.multiple;
    const hasFiles = isMultiple ? value && value.length > 0 : value;

    return (
      <Box>
        {/* File Input */}
        <input
          id={fieldName}
          name={fieldName}
          type="file"
          multiple={isMultiple}
          onChange={(event) => {
            const files = event.currentTarget.files;
            if (files && files.length > 0) {
              formik.setFieldValue(
                field.name,
                isMultiple ? Array.from(files) : files[0]
              );
            }
          }}
          onBlur={formik.handleBlur}
          accept={field.accept || "*"}
          style={{ display: "none" }}
        />

        {/* Upload Button */}
        <label htmlFor={fieldName}>
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
            sx={{
              mb: 2,
              borderStyle: "dashed",
              borderWidth: 2,
              py: 2,
              px: 3,
              width: "100%",
              minHeight: 80,
              backgroundColor: theme.palette.action.hover,
              "&:hover": {
                backgroundColor: theme.palette.action.selected,
              },
            }}
          >
            <Box textAlign="center">
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {field.multiple ? "Upload Documents" : "Upload Document"}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Click to browse files
              </Typography>
            </Box>
          </Button>
        </label>

        {/* File Info */}
        <Box sx={{ mb: 2 }}>
          {field.accept && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <Typography variant="caption">
                <strong>Accepted formats:</strong> {field.accept}
              </Typography>
            </Alert>
          )}
          {field.maxSize && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              <Typography variant="caption">
                <strong>Max size:</strong> {field.maxSize}MB per file
              </Typography>
            </Alert>
          )}
        </Box>

        {/* File Preview */}
        {hasFiles && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              {isMultiple ? "Selected Documents:" : "Selected Document:"}
            </Typography>

            {isMultiple ? (
              <Grid container spacing={2}>
                {value?.map((file, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardContent
                        sx={{
                          p: 2,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box display="flex" alignItems="center" mb={1}>
                          {getFileIcon(file?.name)}
                          <Typography
                            variant="body2"
                            sx={{
                              ml: 1,
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                            }}
                          >
                            {file?.name}
                          </Typography>
                        </Box>

                        {file?.size && (
                          <Typography variant="caption" color="textSecondary">
                            {formatFileSize(file.size)}
                          </Typography>
                        )}

                        <Box mt={1} display="flex" justifyContent="flex-end">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleFileRemove(field.name, idx)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      flex={1}
                      minWidth={0}
                    >
                      {getFileIcon(value?.name)}
                      <Box ml={1} sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {value?.name}
                        </Typography>
                        {value?.size && (
                          <Typography variant="caption" color="textSecondary">
                            {formatFileSize(value.size)}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleFileRemove(field.name)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            <Typography variant="caption">{error}</Typography>
          </Alert>
        )}

        {/* Helper Text */}
        {field.helperText && !error && (
          <FormHelperText sx={{ mt: 1, mx: 0 }}>
            {field.helperText}
          </FormHelperText>
        )}
      </Box>
    );
  };

  const renderField = (field, value, index = null) => {
    const fieldName = index !== null ? `${field.name}[${index}]` : field.name;
    const icon = field.icon ? iconMap[field.icon] : null;
    const inputProps = icon
      ? {
          startAdornment: (
            <InputAdornment position="start">{icon}</InputAdornment>
          ),
        }
      : {};

    const getError = () => {
      if (field.multiple && index !== null) {
        return formik.touched[field.name] && formik.errors[field.name]?.[index];
      }
      return formik.touched[field.name] && formik.errors[field.name];
    };

    const error = getError();

    switch (field.type) {
      case "text":
      case "link":
      case "number":
      case "email":
        return (
          <TextField
            fullWidth
            name={fieldName}
            label={field.label}
            type={
              field.type === "link"
                ? "url"
                : field.type === "email"
                ? "email"
                : field.type === "number"
                ? "number"
                : "text"  
            }
            value={value}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(error)}
            helperText={error || field.helperText}
            InputProps={inputProps}
          />
        );

      case "password":
        return (
          <TextField
            fullWidth
            name={fieldName}
            label={field.label}
            type="password"
            value={value}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(error)}
            helperText={error || field.helperText}
            InputProps={inputProps}
            autoComplete="new-password"
          />
        );

      case "phone":
        return (
          <PhoneInput
            label={field.label}
            name={fieldName}
            value={value}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={error}
            helperText={field.helperText}
            required={field.required}
            countryCode={countryCodes[field.name] || "+91"}
            setCountryCode={(newCode) =>
              handleCountryCodeChange(field.name, newCode)
            }
          />
        );

      case "textarea":
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            name={fieldName}
            label={field.label}
            value={value}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(error)}
            helperText={error || field.helperText}
            InputProps={inputProps}
            sx={{ gridColumn: "1 / -1" }}
          />
        );

      case "date":
        return (
          <TextField
            fullWidth
            name={fieldName}
            label={field.label}
            type="date"
            value={value || ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            InputLabelProps={{ shrink: true }}
            error={Boolean(error)}
            helperText={error || field.helperText}
            InputProps={inputProps}
          />
        );

      case "select":
        // Check if field has searchable property or has many options (>10)
        if (field.searchable || (field.options && field.options.length > 10)) {
          return (
            <SearchableSelect
              options={field.options || []}
              value={value}
              onChange={(e) => {
                formik.handleChange(e);
                if (field.onChange) {
                  field.onChange(e.target.value);
                }
              }}
              onBlur={formik.handleBlur}
              label={field.label}
              name={field.name}
              error={error}
              helperText={field.helperText}
              icon={icon}
              required={field.required}
              placeholder={field.placeholder || "Search and select..."}
            />
          );
        }
        
        // Regular select for fields with fewer options
        return (
          <TextField
            fullWidth
            select
            name={field.name}
            label={field.label}
            value={value}
            onChange={(e) => {
              formik.handleChange(e);
              if (field.onChange) {
                field.onChange(e.target.value);
              }
            }}
            onBlur={formik.handleBlur}
            error={Boolean(error)}
            helperText={error || field.helperText}
            InputProps={inputProps}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: {
                    maxHeight: 240,
                    overflowY: "auto",
                  },
                },
              },
            }}
          >
            {field.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        );

      case "file":
        return renderFileUpload(field, fieldName, value, error);

      case "hidden":
        return (
          <input
            type="hidden"
            name={fieldName}
            value={value || ""}
            onChange={formik.handleChange}
          />
        );

      case "multiselect":
        return (
          <SearchableMultiSelect
            options={field.options || []}
            value={value || []}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            label={field.label}
            name={field.name}
            error={error}
            helperText={field.helperText}
            icon={icon}
            required={field.required}
            placeholder={field.placeholder || "Search and select multiple..."}
          />
        );

      case "checkbox":
        return (
          <Box
            sx={{
              p: 2,
              border: error
                ? `1px solid ${theme.palette.error.main}`
                : `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  name={fieldName}
                  checked={Boolean(value)}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  color="primary"
                  icon={
                    field.icon ? (
                      iconMap[field.icon]
                    ) : (
                      <CheckBoxOutlineBlankIcon />
                    )
                  }
                  checkedIcon={
                    field.checkedIcon ? (
                      iconMap[field.checkedIcon]
                    ) : (
                      <CheckBoxIcon />
                    )
                  }
                />
              }
              label={
                <Typography
                  variant="body2"
                  color={error ? "error" : "textPrimary"}
                >
                  {field.label}
                  {field.required && " *"}
                </Typography>
              }
            />
            {error && (
              <FormHelperText error sx={{ ml: 0, mt: 1 }}>
                {error}
              </FormHelperText>
            )}
            {field.helperText && !error && (
              <FormHelperText sx={{ ml: 0, mt: 1 }}>
                {field.helperText}
              </FormHelperText>
            )}
          </Box>
        );

      case "checkbox-group":
        return (
          <FormControl
            component="fieldset"
            error={Boolean(error)}
            sx={{ width: "100%" }}
          >
            <FormLabel component="legend">{field.label}</FormLabel>
            <FormGroup>
              {field.options?.map((option) => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      name={fieldName}
                      value={option.value}
                      checked={
                        Array.isArray(value)
                          ? value.includes(option.value)
                          : false
                      }
                      onChange={(e) => {
                        const newValue = Array.isArray(value) ? [...value] : [];
                        if (e.target.checked) {
                          newValue.push(e.target.value);
                        } else {
                          const index = newValue.indexOf(e.target.value);
                          if (index > -1) {
                            newValue.splice(index, 1);
                          }
                        }
                        formik.setFieldValue(field.name, newValue);
                      }}
                      onBlur={formik.handleBlur}
                    />
                  }
                  label={option.label}
                />
              ))}
            </FormGroup>
            {error && <FormHelperText>{error}</FormHelperText>}
            {field.helperText && !error && (
              <FormHelperText>{field.helperText}</FormHelperText>
            )}
          </FormControl>
        );

      case "radio":
        return (
          <FormControl
            component="fieldset"
            error={Boolean(error)}
            sx={{ width: "100%" }}
          >
            <FormLabel component="legend">{field.label}</FormLabel>
            <RadioGroup
              name={fieldName}
              value={value || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              {field.options?.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={
                    <Radio
                      icon={
                        field.icon ? (
                          iconMap[field.icon]
                        ) : (
                          <RadioButtonUncheckedIcon />
                        )
                      }
                      checkedIcon={
                        field.checkedIcon ? (
                          iconMap[field.checkedIcon]
                        ) : (
                          <RadioButtonCheckedIcon />
                        )
                      }
                    />
                  }
                  label={option.label}
                />
              ))}
            </RadioGroup>
            {error && <FormHelperText>{error}</FormHelperText>}
            {field.helperText && !error && (
              <FormHelperText>{field.helperText}</FormHelperText>
            )}
          </FormControl>
        );

      default:
        return null;
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 4 },
        mx: "auto",
        my: 1,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            fontWeight: 400,
            color: theme.palette.primary.main,
            borderLeft: `6px solid ${theme.palette.primary.main}`,
            pl: 2,
            py: 1,
            backgroundColor: theme.palette.background.default,
            borderRadius: 1,
            letterSpacing: 0.5,
            fontSize: { xs: "1.5rem", sm: "2rem" },
          }}
        >
          {title}
        </Typography>

        {config.map((section, sectionIndex) => (
          <Box key={section.section || sectionIndex} sx={{ mb: 2 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: theme.palette.text.primary,
                display: "flex",
                alignItems: "center",
              }}
            >
              {section.section}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
              {section.fields.map((field) => (
                <Grid
                  item
                  xs={12}
                  sm={
                    field.type === "file" ||
                    field.type === "checkbox-group" ||
                    field.type === "radio" ||
                    field.type === "textarea"
                      ? 12
                      : 6
                  }
                  md={
                    field.type === "file" ||
                    field.type === "textarea" ||
                    field.type === "checkbox-group" ||
                    field.type === "radio"
                      ? 12
                      : 6
                  }
                  key={field.name}
                >
                  {field.multiple &&
                  field.type !== "file" &&
                  field.type !== "checkbox-group" &&
                  field.type !== "radio" ? (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2 }}>
                        {field.label}
                      </Typography>
                      {formik.values[field.name]?.map((val, idx) => (
                        <Box
                          key={`${field.name}-${idx}`}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 2,
                          }}
                        >
                          {renderField(field, val, idx)}
                          <IconButton
                            color="error"
                            onClick={() => handleRemove(field.name, idx)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <CustomButton
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddMore(field.name)}
                      >
                        Add More {field.label}
                      </CustomButton>
                    </Box>
                  ) : (
                    renderField(field, formik.values[field.name])
                  )}
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        <Divider sx={{ my: 4 }} />

        <Box
          display="flex"
          justifyContent="flex-end"
          gap={2}
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            "& > *": { minWidth: { xs: "100%", sm: "auto" } },
          }}
        >
          {onCancel && (
            <CustomButton variant="outlined" color="primary" onClick={onCancel}>
              Cancel
            </CustomButton>
          )}

          <CustomButton
            variant="outlined"
            color="primary"
            onClick={() => formik.resetForm()}
            disabled={formik.isSubmitting}
          >
            Reset Form
          </CustomButton>

          <CustomButton
            type="submit"
            variant="contained"
            color="primary"
            loading={formik.isSubmitting}
            disabled={formik.isSubmitting}
          >
            {submitButtonText}
          </CustomButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default DynamicFormUltra;