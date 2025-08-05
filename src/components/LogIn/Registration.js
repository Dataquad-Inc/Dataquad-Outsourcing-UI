import React, { useState } from "react";
import * as Yup from "yup";
import { Box, Typography, Paper, IconButton, Tooltip } from "@mui/material";
import httpService from "../../Services/httpService";
import { showToast } from "../../utils/ToastNotification";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import DynamicForm from "../FormContainer/DynamicForm";
import ComponentTitle from "../../utils/ComponentTitle";
import EmailVerificationDialog from "./EmailVerificationDialog";

const Registration = ({ onSwitchView }) => {
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [formValues, setFormValues] = useState(null);
  const [emailToVerify, setEmailToVerify] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const fields = [
    {
      name: "entity",
      label: "Entity ",
      type: "select",
      required: true,
      options: [
        { label: "IN", value: "IN" },
        { label: "US", value: "US" },
      ],
    },
    {
      name: "userId",
      label: "User ID",
      type: "text",
      required: true,
      validation: Yup.string()
        .test(
          "entity-based-validation",
          "Invalid User ID format for selected entity",
          function (value) {
            const { entity } = this.parent;

            if (entity === "IN") {
              return /^ADRTIN\d{2,4}$/.test(value);
            } else if (entity === "US") {
              return /^ADRTUS\d{2,4}$/.test(value);
            }

            return false;
          }
        )
        .required("User ID is required"),
      gridProps: { xs: 12, sm: 6, md: 6, lg: 5, xl: 4, xxl: 3 },
      watchFields: ["entity"], // This will re-validate when entity changes
    },
    {
      name: "userName",
      label: "User Name",
      type: "text",
      required: true,
      validation: Yup.string()
        .matches(
          /^[a-zA-Z\s]+$/,
          "User Name must contain only alphabetic characters and spaces"
        )
        .max(20, "User Name must not exceed 20 characters")
        .required("User Name is required"),
      gridProps: { xs: 12, sm: 6, md: 6, lg: 7, xl: 4, xxl: 3 },
    },
    {
      name: "email",
      label: "Company Email",
      type: "email",
      required: true,
      validation: Yup.string()
        .lowercase()
        .email("Please enter a valid email")
        .matches(
          /^[a-z0-9._%+-]+@(dataqinc\.com|adroitinnovative\.com)$/,
          "Please enter a valid corporate email (example@dataqinc.com or example@adroitinnovative.com)"
        )
        .required("Email is required")
        .test(
          "is-verified",
          "Company email must be verified",
          () => !emailToVerify || isEmailVerified
        ),
      endAdornment: (
        <Tooltip title={isEmailVerified ? "Email Verified" : "Verify Email"}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              const emailInput = document.querySelector('input[name="email"]');
              const email = emailInput?.value;
              if (
                email &&
                /^[a-z0-9._%+-]+@(dataqinc\.com|adroitinnovative\.com)$/.test(
                  email.toLowerCase()
                )
              ) {
                setEmailToVerify(email.toLowerCase());
                setShowVerificationDialog(true);
              } else {
                showToast("Please enter a valid company email first", "error");
              }
            }}
            color={isEmailVerified ? "success" : "primary"}
          >
            <PersonAddIcon />
          </IconButton>
        </Tooltip>
      ),
      gridProps: { xs: 12, sm: 6, md: 6, lg: 6, xl: 4, xxl: 3 },
    },
    {
      name: "personalemail",
      label: "Personal Email",
      type: "email",
      required: true,
      validation: Yup.string()
        .email("Please enter a valid email")
        .required("Personal email is required"),
      gridProps: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6, xxl: 6 },
    },
    {
      name: "phoneNumber",
      label: "Phone Number",
      type: "text",
      required: true,
      validation: Yup.string()
        .matches(/^\d{10}$/, "Phone number must be exactly 10 digits")
        .required("Phone number is required"),
      gridProps: { xs: 12, sm: 6, md: 6, lg: 4, xl: 6, xxl: 6 },
    },

    {
      name: "designation",
      label: "Designation",
      type: "text",
      required: true,
      validation: Yup.string()
        .matches(
          /^[A-Za-z\s]+$/,
          "Designation should only contain letters and spaces"
        )
        .required("Designation is required"),
      gridProps: { xs: 12, sm: 6, md: 12, lg: 4, xl: 4, xxl: 3 },
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      required: true,
      options: [
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
      ],
      validation: Yup.string().required("Please select a gender"),
      gridProps: { xs: 12, sm: 6, md: 6, lg: 4, xl: 3, xxl: 2 },
    },
    {
      name: "dob",
      label: "Date of Birth",
      type: "date",
      required: true,
      validation: Yup.date()
        .max(
          new Date(new Date().setFullYear(new Date().getFullYear() - 20)),
          "Age must be at least 20 years"
        )
        .required("Date of birth is required"),
      gridProps: { xs: 12, sm: 6, md: 6, lg: 4, xl: 3, xxl: 2 },
    },
    {
      name: "joiningDate",
      label: "Joining Date",
      type: "date",
      required: true,
      validation: Yup.date()
        .min(Yup.ref("dob"), "Joining date must be after date of birth")
        .test(
          "within-range",
          "Joining date must be within one month before or after today's date",
          function (value) {
            if (!value) return true;

            const currentDate = new Date();
            const oneMonthBefore = new Date(currentDate);
            oneMonthBefore.setMonth(currentDate.getMonth() - 1);

            const oneMonthAfter = new Date(currentDate);
            oneMonthAfter.setMonth(currentDate.getMonth() + 1);

            return value >= oneMonthBefore && value <= oneMonthAfter;
          }
        )
        .required("Joining date is required"),
      gridProps: { xs: 12, sm: 6, md: 6, lg: 4, xl: 3, xxl: 2 },
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      required: true,
      validation: Yup.string()
        .matches(
          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Password must be at least 8 characters and include uppercase, lowercase, digit, and special character"
        )
        .required("Password is required"),
      gridProps: { xs: 12, sm: 6, md: 6, lg: 4, xl: 4, xxl: 3 },
    },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      required: true,
      validation: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Please confirm your password"),
      gridProps: { xs: 12, sm: 6, md: 6, lg: 4, xl: 4, xxl: 3 },
    },
  ];

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    if (!isEmailVerified) {
      showToast("Please verify your company email before submitting", "error");
      setSubmitting(false);
      return;
    }

    try {
      setFormValues(values);

      const userData = {
        ...values,
        roles: ["EMPLOYEE"],
      };

      const response = await httpService.post("/users/register", userData);

      if (response.data.success) {
        showToast("Employee registered successfully!", "success");
        resetForm();
        setIsEmailVerified(false);
        if (onSwitchView) {
          setTimeout(() => onSwitchView("login"), 2000);
        }
      } else {
        showToast(response.data.message || "Registration failed", "error");
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to register employee",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerificationSuccess = () => {
    setIsEmailVerified(true);
    showToast("Email verified successfully!", "success");
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        {onSwitchView && (
          <Tooltip title="Back to Sign In">
            <IconButton
              onClick={() => onSwitchView("login")}
              size="small"
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        )}
        <ComponentTitle
          title="Employee Registration"
          icon={<PersonAddIcon />}
        />
      </Box>

      <DynamicForm
        fields={fields}
        onSubmit={handleSubmit}
        elevation={0}
        maxWidth="100%"
        spacing={2}
        dense={false}
        buttonConfig={{
          showSubmit: true,
          showReset: true,
          submitLabel: "Register",
          resetLabel: "Reset",
          submitColor: "primary",
          resetColor: "inherit",
          submitVariant: "contained",
          resetVariant: "outlined",
          submitSx: { width: "120px", height: "40px", borderRadius: "8px" },
          resetSx: {
            width: "100px",
            height: "40px",
            borderRadius: "8px",
            borderColor: "grey",
            color: "grey",
            "&:hover": {
              borderColor: "primary.main",
              color: "primary.main",
              backgroundColor: "transparent",
            },
          },
          buttonContainerProps: {
            sx: {
              mt: 3,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            },
          },
        }}
      />

      <EmailVerificationDialog
        open={showVerificationDialog}
        onClose={() => setShowVerificationDialog(false)}
        email={emailToVerify}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </>
  );
};

export default Registration;
