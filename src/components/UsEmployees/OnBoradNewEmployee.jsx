import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  Stack,
  Divider,
  Paper,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Person,
  Email,
  Phone,
  Work,
  CalendarToday,
  Badge,
  Visibility,
  VisibilityOff,
  Save,
  Clear,
} from "@mui/icons-material";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import { useNavigate } from "react-router-dom";

const OnBoardNewEmployee = () => {
  const [formData, setFormData] = useState({
    userId: "",
    userName: "",
    password: "",
    confirmPassword: "",
    email: "",
    personalemail: "",
    phoneNumber: "",
    dob: "",
    gender: "",
    joiningDate: "",
    designation: "",
    roles: ["RECRUITER"],
    status: "ACTIVE",
    entity: "US",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const BASE_URL = "https://mymulya.com";

  // Role options
  const roleOptions = [
    { value: "TEAMLEAD", label: "Team Lead" },
    { value: "RECRUITER", label: "Recruiter" },
    { value: "SALESEXECUTIVE", label: "Sales Executive" },
    { value: "ADMIN", label: "Admin" },
    { value: "SUPERADMIN", label: "Super Admin" },
  ];

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ];

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
  ];

  const handleInputChange = (field) => (event) => {
    let value = event.target.value;

    // Always trim spaces at start and end
    value = value.trim();

    setFormData((prev) => ({
      ...prev,
      [field]: field === "roles" ? [value] : value,
    }));

    // Instant field validation with trimmed value
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateField = (field, value) => {
    let error = "";

    switch (field) {
      case "userId":
        if (!value.trim()) {
          error = "Employee ID is required";
        } else if (!/^ADRTUS\d{2,4}$/.test(value.trim())) {
          error = "Employee ID must start with ADRTUS followed by 2–4 digits";
        }
        break;

      case "userName":
        if (!value.trim()) error = "Full name is required";
        break;

      case "email":
        if (!value.trim()) {
          error = "Work email is required";
        } else if (!/^[^\s@]+@adroitinnovative\.com$/i.test(value)) {
          error = "Work email must be in the format xyz@adroitinnovative.com";
        }
        break;

      case "personalemail":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid personal email address";
        }
        break;

      case "password":
        if (!value) {
          error = "Password is required";
        } else if (
          !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(
            value
          )
        ) {
          error =
            "Password must be at least 8 characters, include a letter, a number, and a special character";
        }
        break;

      case "confirmPassword":
        if (!value) {
          error = "Confirm password is required";
        } else if (value !== formData.password) {
          error = "Passwords do not match";
        }
        break;

      case "phoneNumber":
        if (!value.trim()) {
          error = "Phone number is required";
        } else if (!/^[0-9]{10}$/.test(value.replace(/\D/g, ""))) {
          error = "Please enter a valid 10-digit phone number";
        }
        break;

      case "designation":
        if (!value.trim()) error = "Designation is required";
        break;

      case "joiningDate":
        if (!value) error = "Joining date is required";
        break;

      default:
        break;
    }

    return error;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    try {
      // Prepare payload
      const payload = {
        ...formData,
        phoneNumber: formData.phoneNumber.replace(/\D/g, ""), // Clean phone number
      };

      const response = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create employee");
      }

      const result = await response.json();
      showSuccessToast(result.message || "Employee created successfully!");
      handleReset();
      navigate("/dashboard/us-employees/employeeslist");
    } catch (error) {
      console.error("Error creating employee:", error);
      showErrorToast(error.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      userId: "",
      userName: "",
      password: "",
      confirmPassword: "",
      email: "",
      personalemail: "",
      phoneNumber: "",
      dob: "",
      gender: "",
      joiningDate: "",
      designation: "",
      roles: ["RECRUITER"],
      status: "ACTIVE",
      entity: "US",
    });
    setErrors({});
  };

  return (
    <Box sx={{ mx: "auto" }}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Box textAlign="center">
            <Typography
              variant="h4"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              Onboard New Employee
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Fill in the details to create a new employee account
            </Typography>
          </Box>

          <Divider />

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Personal Information Section */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="text.primary"
                  gutterBottom
                >
                  Personal Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  value={formData.userId}
                  onChange={handleInputChange("userId")}
                  error={!!errors.userId}
                  helperText={errors.userId}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Badge color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.userName}
                  onChange={handleInputChange("userName")}
                  error={!!errors.userName}
                  helperText={errors.userName}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date of Birth"
                  value={formData.dob}
                  onChange={handleInputChange("dob")}
                  error={!!errors.dob}
                  helperText={errors.dob}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Gender"
                  value={formData.gender}
                  onChange={handleInputChange("gender")}
                  error={!!errors.gender}
                  helperText={errors.gender}
                >
                  {genderOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Contact Information */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="text.primary"
                  gutterBottom
                  sx={{ mt: 2 }}
                >
                  Contact Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="email"
                  label="Work Email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="email"
                  label="Personal Email"
                  value={formData.personalemail}
                  onChange={handleInputChange("personalemail")}
                  error={!!errors.personalemail}
                  helperText={errors.personalemail}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="secondary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange("phoneNumber")}
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Professional Information */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="text.primary"
                  gutterBottom
                  sx={{ mt: 2 }}
                >
                  Professional Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Designation"
                  value={formData.designation}
                  onChange={handleInputChange("designation")}
                  error={!!errors.designation}
                  helperText={errors.designation}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Work color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Joining Date"
                  value={formData.joiningDate}
                  onChange={handleInputChange("joiningDate")}
                  error={!!errors.joiningDate}
                  helperText={errors.joiningDate}
                  required
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Role"
                  value={formData.roles[0] || "EMPLOYEE"}
                  onChange={handleInputChange("roles")}
                  required
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={formData.status}
                  onChange={handleInputChange("status")}
                  required
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Account Security */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color="text.primary"
                  gutterBottom
                  sx={{ mt: 2 }}
                >
                  Account Security
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  error={!!errors.password}
                  helperText={errors.password}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type={showConfirmPassword ? "text" : "password"}
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          edge="end"
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={handleReset}
                    disabled={loading}
                    size="large"
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={loading}
                    size="large"
                    sx={{ minWidth: 150 }}
                  >
                    {loading ? "Creating..." : "Create Employee"}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default OnBoardNewEmployee;
