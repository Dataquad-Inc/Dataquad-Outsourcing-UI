import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import httpService from "../../Services/httpService";
import { showToast } from "../../utils/ToastNotification";

const emptyForm = {
  userName: "",
  email: "",
  phoneNumber: "",
  personalemail: "",
  dob: "",
  gender: "",
  currentAddress: "",
  permanentAddress: "",
  pan: "",
  adhar: "",
  emergencyContactNumber: "",
  password: "",
  confirmPassword: "",
};

const OnboardingPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const validate = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await httpService.get(`/users/onboarding/validate/${token}`);
        const data = response?.data?.data || response?.data || {};
        setForm((prev) => ({
          ...prev,
          userName: data.userName || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          personalemail: data.personalemail || data.email || "",
          dob: data.dob || "",
          gender: data.gender || "",
          currentAddress: data.currentAddress || "",
          permanentAddress: data.permanentAddress || "",
          pan: data.pan || "",
          adhar: data.adhar || "",
        }));
        setRemarks(data.onboardingRemarks || "");
      } catch (err) {
        setError(err?.response?.data?.message || "Invalid or expired invitation link");
      } finally {
        setLoading(false);
      }
    };
    if (token) validate();
  }, [token]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.password || form.password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    if (form.password !== form.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    const body = new FormData();
    body.append("password", form.password);
    body.append("userName", form.userName || "");
    body.append("phoneNumber", form.phoneNumber || "");
    body.append("personalemail", form.personalemail || "");
    body.append("dob", form.dob || "");
    body.append("gender", form.gender || "");
    body.append("currentAddress", form.currentAddress || "");
    body.append("permanentAddress", form.permanentAddress || "");
    body.append("pan", form.pan || "");
    body.append("adhar", form.adhar || "");
    body.append("emergencyContactNumber", form.emergencyContactNumber || "");

    Array.from(documents).forEach((file, index) => {
      body.append("documents", file);
      body.append("documentTypes", file.name?.includes("aadhar") || file.name?.includes("adhar")
        ? "AADHAR"
        : file.name?.toLowerCase().includes("pan")
        ? "PAN"
        : `DOCUMENT_${index + 1}`);
    });

    setSubmitting(true);
    try {
      await httpService.post(`/users/onboarding/complete/${token}`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      showToast("Onboarding submitted. HR will review your details.", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to submit onboarding", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Thank you
          </Typography>
          <Typography>
            Your onboarding details were submitted successfully. HR will review and may contact you if additional information is needed.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #e8f1ff 0%, #f7f9fc 45%, #eef6f3 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 2 }}>
          <Typography variant="h4" color="primary" fontWeight={700} gutterBottom>
            MyMulya Onboarding
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Complete your registration, fill in your details, and upload the required documents.
          </Typography>

          {remarks ? (
            <Alert severity="warning" sx={{ mb: 3 }}>
              HR remarks: {remarks}
            </Alert>
          ) : null}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Full name" fullWidth required value={form.userName} onChange={handleChange("userName")} />
                <TextField label="Email" fullWidth disabled value={form.email} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Phone number" fullWidth required value={form.phoneNumber} onChange={handleChange("phoneNumber")} />
                <TextField label="Personal email" fullWidth value={form.personalemail} onChange={handleChange("personalemail")} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Date of birth" fullWidth value={form.dob} onChange={handleChange("dob")} placeholder="YYYY-MM-DD" />
                <TextField select label="Gender" fullWidth value={form.gender} onChange={handleChange("gender")}>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Stack>
              <TextField label="Current address" fullWidth multiline minRows={2} value={form.currentAddress} onChange={handleChange("currentAddress")} />
              <TextField label="Permanent address" fullWidth multiline minRows={2} value={form.permanentAddress} onChange={handleChange("permanentAddress")} />
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="PAN" fullWidth value={form.pan} onChange={handleChange("pan")} />
                <TextField label="Aadhar" fullWidth value={form.adhar} onChange={handleChange("adhar")} />
              </Stack>
              <TextField
                label="Emergency contact"
                fullWidth
                value={form.emergencyContactNumber}
                onChange={handleChange("emergencyContactNumber")}
              />
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Create password"
                  type="password"
                  fullWidth
                  required
                  value={form.password}
                  onChange={handleChange("password")}
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  fullWidth
                  required
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                />
              </Stack>
              <Button variant="outlined" component="label">
                Upload documents (PAN / Aadhar / others)
                <input
                  hidden
                  type="file"
                  multiple
                  onChange={(e) => setDocuments(e.target.files || [])}
                />
              </Button>
              {documents?.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {documents.length} file(s) selected
                </Typography>
              )}
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? <CircularProgress size={22} color="inherit" /> : "Submit onboarding"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default OnboardingPage;
