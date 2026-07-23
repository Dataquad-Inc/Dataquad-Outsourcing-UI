import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  Fade,
  Chip,
} from "@mui/material";
import { PersonAdd, CheckCircle, Error } from "@mui/icons-material";
import DynamicForm from "../FormContainer/DynamicForm";
import EmailVerificationDialog from "../LogIn/EmailVerificationDialog";
import { showToast } from "../../utils/ToastNotification";

const UserForm = ({
  initialValues = {},
  onSubmit,
  isEditMode = false,
  loading = false,
}) => {
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(!!initialValues.email);

  // Form validation schema
  const getValidationSchema = () => {
    const baseSchema = {
      userName: Yup.string()
        .matches(
          /^[a-zA-Z\s]+$/,
          "User Name must contain only alphabetic characters and spaces"
        )
        .max(20, "User Name must not exceed 20 characters")
        .required("User Name is required"),

      email: Yup.string()
        .email("Please enter a valid email")
        .matches(
          /^[a-z0-9._%+-]+@dataqinc\.com$/,
          "Please enter a valid email (example@dataqinc.com)"
        )
        .required("Email is required"),

      personalemail: Yup.string()
        .email("Please enter a valid email")
        .nullable(),

      phoneNumber: Yup.string()
        .matches(/^\d{10}$/, "Phone number must be exactly 10 digits")
        .nullable(),

      designation: Yup.string()
        .matches(
          /^[A-Za-z\s]+$/,
          "Designation should only contain letters and spaces"
        )
        .required("Designation is required"),

      gender: Yup.string()
        .oneOf(["Male", "Female"], "Please select a valid gender")
        .required("Gender is required"),

      roles: Yup.string().required("Role is required"),

      status: isEditMode
        ? Yup.string().required("Status is required")
        : Yup.string(),
    };

    // Add date validations only for new user registration
    if (!isEditMode) {
      baseSchema.dob = Yup.date()
        .max(
          new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
          "Age must be at least 18 years"
        )
        .required("Date of birth is required")
        .typeError("Please enter a valid date (YYYY-MM-DD)");

      baseSchema.joiningDate = Yup.date()
        .max(new Date(), "Joining date cannot be in the future")
        .required("Joining date is required")
        .typeError("Please enter a valid date (YYYY-MM-DD)");
    }

    // Add registration-specific validations
    if (!isEditMode) {
      baseSchema.userId = Yup.string()
        .matches(
          /^DQIND\d{2,4}$/,
          "User ID must start with 'DQIND' followed by 2 to 4 digits"
        )
        .required("User ID is required");

      baseSchema.password = Yup.string()
        .matches(
          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Password must be at least 8 characters and include uppercase, lowercase, digit, and special character"
        )
        .required("Password is required");

      baseSchema.confirmPassword = Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Please confirm your password");

      // For registration, we need email verification
      baseSchema.email = baseSchema.email.test(
        "is-verified",
        "Company email must be verified",
        () => !emailToVerify || isEmailVerified
      );
    }

    return baseSchema;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  // Generate form fields based on mode (edit or create)
  const getFormFields = () => {
    const baseFields = [
      {
        name: "userName",
        label: "User Name",
        type: "text",
        required: true,
        gridProps: { xs: 12, sm: 6 },
        sx: { mb: 2 },
        helperText: "Only alphabetic characters and spaces",
      },
      {
        name: "email",
        type: "email",
        label: "Company Email",
        required: true,
        disabled: isEditMode, // Email cannot be changed in edit mode
        gridProps: { xs: 12, sm: 6 },
        sx: { mb: 2 },
        helperText: "Example: name@dataqinc.com",
        ...(!isEditMode && {
          endAdornment: (
            <Tooltip
              title={isEmailVerified ? "Email Verified" : "Verify Email"}
            >
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  const emailInput = document.querySelector(
                    'input[name="email"]',
                  );
                  const email = emailInput?.value;
                  if (email && email.match(/^[a-z0-9._%+-]+@dataqinc\.com$/)) {
                    setEmailToVerify(email);
                    setShowVerificationDialog(true);
                  } else {
                    showToast(
                      "Please enter a valid company email first",
                      "error",
                    );
                  }
                }}
                color={isEmailVerified ? "success" : "primary"}
                size="small"
              >
                {isEmailVerified ? <CheckCircle /> : <PersonAdd />}
              </IconButton>
            </Tooltip>
          ),
        }),
      },
      {
        name: "roles",
        type: "select",
        label: "Role",
        required: true,
        gridProps: { xs: 12, sm: 6 },
        sx: { mb: 2 },
        options: [
          { value: "EMPLOYEE", label: "Employee" },
          { value: "ADMIN", label: "Admin" },
          { value: "SUPERADMIN", label: "Super Admin" },
          { value: "HRMS", label: "HRMS" },
          { value: "TEAMLEAD", label: "Team Lead" },
          { value: "BDM", label: "BDM" },
          { value: "PARTNER", label: "Partner" },
          { value: "INVOICE", label: "Invoice" },
          { value: "FINANCE", label: "Finance" }, // Added Finance
          { value: "COORDINATOR", label: "Coordinator" },
          {value:"SUPERACCOUNTS", label:"Super Accounts"},
        ],
      },
      {
        name: "designation",
        type: "text",
        label: "Designation",
        required: true,
        gridProps: { xs: 12, sm: 6 },
        sx: { mb: 2 },
        helperText: "e.g. Software Engineer, Project Manager",
      },
      {
        name: "gender",
        type: "select",
        label: "Gender",
        required: true,
        gridProps: { xs: 12, sm: 6 },
        sx: { mb: 2 },
        options: [
          { value: "Male", label: "Male" },
          { value: "Female", label: "Female" },
        ],
      },
      {
        name: "phoneNumber",
        type: "tel",
        label: "Phone Number",
        gridProps: { xs: 12, sm: 6 },
        sx: { mb: 2 },
        helperText: "10 digits only, no spaces or hyphens",
      },
      {
        name: "personalemail",
        type: "email",
        label: "Personal Email",
        gridProps: { xs: 12, sm: 6 },
        sx: { mb: 2 },
      },
    ];

    // Add date fields only for new user creation
    if (!isEditMode) {
      baseFields.push(
        {
          name: "dob",
          type: "date",
          label: "Date of Birth",
          required: true,
          gridProps: { xs: 12, sm: 6 },
          sx: { mb: 2 },
          InputLabelProps: { shrink: true },
          helperText: "Format: YYYY-MM-DD (Must be 18+ years old)",
        },
        {
          name: "joiningDate",
          type: "date",
          label: "Joining Date",
          required: true,
          gridProps: { xs: 12, sm: 6 },
          sx: { mb: 2 },
          InputLabelProps: { shrink: true },
          helperText: "Format: YYYY-MM-DD (Cannot be in the future)",
        }
      );
    } else {
      // For edit mode, show DOB and joining date as read-only info
      baseFields.push(
        {
          name: "status",
          type: "select",
          label: "Status",
          required: true,
          gridProps: { xs: 12, sm: 6 },
          sx: { mb: 2 },
          options: [
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ],
        }
      );
    }

    // Add registration-specific fields
    if (!isEditMode) {
      baseFields.unshift({
        name: "userId",
        label: "User ID",
        type: "text",
        required: true,
        gridProps: { xs: 12, sm: 6 },
        sx: { mb: 2 },
        helperText: "Format: DQIND followed by 2-4 digits (e.g. DQIND123)",
      });

      // Add password fields for new user
      baseFields.push(
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
          gridProps: { xs: 12, sm: 6 },
          sx: { mb: 2 },
          helperText: "Min 8 chars with uppercase, lowercase, digit & special char",
        },
        {
          name: "confirmPassword",
          label: "Confirm Password",
          type: "password",
          required: true,
          gridProps: { xs: 12, sm: 6 },
          sx: { mb: 2 },
          helperText: "Re-enter your password",
        }
      );
    } else {
      // Add employeeId for edit mode (disabled)
      baseFields.unshift({
        name: "employeeId",
        type: "text",
        label: "Employee ID",
        gridProps: { xs: 12, sm: 6 },
        disabled: true,
        sx: { mb: 2 },
      });
    }

    return baseFields;
  };

  const handleVerificationSuccess = () => {
    setIsEmailVerified(true);
    showToast("Email verified successfully!", "success");
  };

  const handleFormSubmit = (values, actions) => {
    // For registration, ensure email is verified
    if (!isEditMode && !isEmailVerified) {
      showToast("Please verify your company email before submitting", "error");
      actions.setSubmitting(false);
      return;
    }

    // Prepare final values
    const finalValues = { ...values };

    // Format roles to always be an array for API consistency
    if (!Array.isArray(finalValues.roles)) {
      finalValues.roles = [finalValues.roles];
    }

    // For registration, add default values
    if (!isEditMode) {
      finalValues.status = "ACTIVE";
    }

    // Call the parent's onSubmit handler
    onSubmit(finalValues, actions);
  };

  // Format dates for readability
  const formatReadableDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      {isEditMode && initialValues && (
        <Box sx={{ mb: 4 }}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              backgroundColor: "#f8f9fa",
              borderRadius: 2,
              mb: 3,
              border: "1px solid #e0e0e0"
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Employee ID
                  </Typography>
                  <Typography variant="h6" fontWeight="500">{initialValues.employeeId}</Typography>
                </Box>
              </Grid>
              {initialValues.status && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Current Status
                  </Typography>
                  <Chip
                    label={initialValues.status}
                    color={initialValues.status === "ACTIVE" ? "success" : "error"}
                    size="medium"
                    variant="outlined"
                  />
                </Grid>
              )}
              
              {/* Display date fields as read-only info for edit mode */}
              {initialValues.joiningDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Joining Date
                  </Typography>
                  <Typography variant="body1">{formatReadableDate(initialValues.joiningDate)}</Typography>
                </Grid>
              )}
              {initialValues.dob && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Date of Birth
                  </Typography>
                  <Typography variant="body1">{formatReadableDate(initialValues.dob)}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ mb: 3, color: "#00796b", fontWeight: 500 }}>
            {isEditMode ? "Update User Information" : "Enter User Information"}
          </Typography>
        </Box>
      )}

      {!isEditMode && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "#00796b", fontWeight: 500 }}>
            Register New Employee
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please fill in all required fields marked with an asterisk (*).
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Box>
      )}

      <DynamicForm
        fields={getFormFields()}
        initialValues={isEditMode ? initialValues : {
          joiningDate: formatDate(new Date()),
          status: "ACTIVE"
        }}
        onSubmit={handleFormSubmit}
        editMode={isEditMode}
        validationSchema={Yup.object().shape(getValidationSchema())}
        elevation={0}
        maxWidth="100%"
        spacing={2}
        buttonConfig={{
          submitLabel: isEditMode ? "Update User" : "Register User",
          resetLabel: isEditMode ? "Revert Changes" : "Reset",
          submitVariant: "contained",
          submitColor: "primary",
          resetVariant: "outlined",
          resetColor: "secondary",
          buttonAlignment: "flex-end",
          loading: loading,
          submitSx: {
            mt: 3,
            minWidth: "150px",
            height: "45px",
            borderRadius: 1,
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          },
          resetSx: {
            color: "#757575",
            borderColor: "#bdbdbd",
            borderRadius: 1,
            textTransform: "none",
            "&:hover": {
              borderColor: "#757575",
              backgroundColor: "#f5f5f5",
            },
            mr: 2,
            mt: 3,
            minWidth: "150px",
            height: "45px",
          },
        }}
      />

      {!isEditMode && (
        <EmailVerificationDialog
          open={showVerificationDialog}
          onClose={() => setShowVerificationDialog(false)}
          email={emailToVerify}
          onVerificationSuccess={handleVerificationSuccess}
        />
      )}
    </>
  );
};

export default UserForm;
