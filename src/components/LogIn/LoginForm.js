import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginAsync } from "../../redux/authSlice";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from "@mui/icons-material";
import MuiTextField from "../muiComponents/MuiTextField";
import MuiButton from "../muiComponents/MuiButton";


const LoginForm = ({ onSwitchView }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  // const handleSubmit = async (values, { setSubmitting }) => {
  //   setError(null);
  //   try {
  //     const resultAction = await dispatch(loginAsync(values));

  //     if (loginAsync.fulfilled.match(resultAction)) {
  //       navigate("/dashboard");
  //     } else {
  //       setError(
  //         resultAction.payload || resultAction.error.message || "Login failed"
  //       );
  //     }
  //   } catch (err) {
  //     setError(err.message || "Login failed");
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };
const handleSubmit = async (values, { setSubmitting }) => {
  setError(null);
  try {
    const resultAction = await dispatch(loginAsync(values));

    if (loginAsync.fulfilled.match(resultAction)) {
      // Get role from Redux or localStorage
      const { role } = resultAction.payload || {};
      const localUser = JSON.parse(localStorage.getItem("user"));
      const userRole = role || localUser?.role;

      if (userRole === "EXTERNALEMPLOYEE") {
        navigate("/dashboard/timesheets");
      } else {
        navigate("/dashboard");
      }
    } else {
      setError(
        resultAction.payload || resultAction.error.message || "Login failed"
      );
    }
  } catch (err) {
    setError(err.message || "Login failed");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
        maxWidth: "400px",
        mx: "auto",
        p: { xs: 2.5, sm: 3 },
        borderRadius: "12px",
        bgcolor: "#ffffff",
      }}
    >
      <Box display="flex" flexDirection="column" alignItems="center" mb={2.5}>
        <LoginIcon
          sx={{
            fontSize: 40,
            color: theme.palette.primary.main,
            mb: 1.5,
          }}
        />
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Sign in to continue to your dashboard
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2.5,
            borderRadius: "8px",
            "& .MuiAlert-message": { fontSize: "0.9rem" },
          }}
        >
          {error}
        </Alert>
      )}

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, handleChange, values, errors, touched }) => (
          <Form>
            <Stack spacing={2.5}>
              <MuiTextField
                label="Email Address"
                name="email"
                value={values.email}
                onChange={handleChange}
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
                disabled={isSubmitting}
                fullWidth
                placeholder="your.email@example.com"
                autoComplete="email"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                  },
                }}
              />

              <MuiTextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={handleChange}
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
                disabled={isSubmitting}
                fullWidth
                autoComplete="current-password"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: theme.palette.action.active }}
                        aria-label={
                          showPassword ? "hide password" : "show password"
                        }
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mt={2}
              >
                <Link
                  component="button"
                  type="button"
                  onClick={() => onSwitchView("forgotPassword")}
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    textDecoration: "underline",
                  }}
                >
                  Forgot password?
                </Link>

                <MuiButton
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    py: 1.25,
                    px: 3,
                    borderRadius: "8px",
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1rem",
                    boxShadow: 2,
                    "&:hover": {
                      boxShadow: 4,
                    },
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Sign In"
                  )}
                </MuiButton>
              </Box>
            </Stack>

            <Divider
              sx={{ my: 3, color: "text.disabled", fontSize: "0.85rem" }}
            >
              OR
            </Divider>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center", // Optional: use this if you want vertical centering too
              }}
            >
              <MuiButton
                variant="outlined"
                onClick={() => onSwitchView("register")}
                sx={{
                  py: 1.25,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 500,
                  maxWidth: 200,
                }}
              >
                Create New Account
              </MuiButton>
            </Box>
          </Form>
        )}
      </Formik>
    </Paper>
  );
};

export default LoginForm;
