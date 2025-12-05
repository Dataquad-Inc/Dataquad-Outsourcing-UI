import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Typography,
  Paper,
  Stack,
  Avatar,
  CircularProgress,
  Divider,
  Alert,
  Grid,
  IconButton,
  Tooltip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import {
  ArrowBack,
  LocationOn,
  Work,
  Schedule,
  AttachMoney,
  School,
  Business,
  Edit,
  FileDownload,
  Person,
  Visibility,
} from "@mui/icons-material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils";

const RequirementProfile = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://mymulya.com/api/us/requirements/v2/get-requirement/${jobId}`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setJobData(data.data);
        } else {
          setError("Job details not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load job details.");
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [jobId]);

  const handleDownloadJD = async () => {
    try {
      setDownloadLoading(true);
      const res = await fetch(
        `https://mymulya.com/api/us/requirements/v2/download-jd/${jobId}`,
        { headers: { Accept: "application/pdf" } }
      );
      if (!res.ok) throw new Error("Failed to download JD");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `JD-${jobId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Failed to download job description.");
    } finally {
      setDownloadLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "success";
      case "closed":
        return "error";
      case "in progress":
        return "warning";
      default:
        return "default";
    }
  };

  const handleBack = () => navigate(-1);
  const handleEdit = () => navigate(`/dashboard/us-requirements/edit/${jobId}`);

  // Open delete confirmation dialog
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  // Confirm and execute delete
  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      const response = await axios.delete(
        `https://mymulya.com/api/us/requirements/v2/delete-requirement/${jobId}`
      );
      showSuccessToast("Requirement deleted successfully");
      setDeleteDialogOpen(false);
      // Navigate back to the main requirements list
      navigate("/dashboard/us-requirements");
      return response.data;
    } catch (error) {
      console.error("Error deleting requirement:", error);
      showErrorToast(
        error.response?.data?.message || "Failed to delete requirement"
      );
    } finally {
      setDeleting(false);
    }
  };

  // Reusable InfoRow component
  const InfoRow = ({ icon: Icon, label, value, fullWidth = false }) => (
    <Grid item xs={12} sm={fullWidth ? 12 : 6}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Icon sx={{ color: "primary.main", fontSize: 20 }} />
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Grid>
  );

  if (loading)
    return (
      <Container
        maxWidth="lg"
        sx={{
          py: 5,
          display: "flex",
          justifyContent: "center",
          minHeight: "400px",
          alignItems: "center",
        }}
      >
        <CircularProgress size={60} />
      </Container>
    );

  if (error || !jobData)
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "No job data found."}
        </Alert>
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
      </Container>
    );

  return (
    <Container sx={{ py: 2 }}>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this requirement? This action cannot be undone.
            <br />
            <strong>Job Title:</strong> {jobData.jobTitle}
            <br />
            <strong>Client:</strong> {jobData.clientName}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteForeverIcon />}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Header with Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Jobs
        </Button>
      </Box>

      {/* Single Unified Card */}
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
        {/* Header Section with Gradient Background */}
        <Box
          sx={{
            p: 4,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {jobData.jobTitle}
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {jobData.clientName}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  • {jobData.jobType}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LocationOn sx={{ fontSize: 18 }} />
                  <Typography variant="body1">{jobData.location}</Typography>
                </Stack>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={jobData.status.toUpperCase()}
                color={getStatusColor(jobData.status)}
                sx={{ fontWeight: "bold", color: "white" }}
              />
              <Stack direction="row" spacing={1}>
                <Tooltip title="Edit Job">
                  <IconButton sx={{ color: "white" }} onClick={handleEdit}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Job">
                  <IconButton sx={{ color: "white" }} onClick={handleDeleteClick}>
                    <DeleteForeverIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        {/* Content Section */}
        <Box sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* Left Column - Job Details */}
            <Grid item xs={12} lg={8}>
              {/* Job Information Grid */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Job Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  <InfoRow
                    icon={Work}
                    label="Experience Required"
                    value={`${jobData.experienceRequired} years`}
                  />
                  <InfoRow
                    icon={Work}
                    label="Relevant Experience"
                    value={`${jobData.relevantExperience} years`}
                  />
                  <InfoRow
                    icon={Schedule}
                    label="Notice Period"
                    value={`${jobData.noticePeriod} days`}
                  />
                  <InfoRow
                    icon={AttachMoney}
                    label="Package"
                    value={`${jobData.salaryPackage} LPA`}
                  />
                  <InfoRow
                    icon={Business}
                    label="Positions Available"
                    value={jobData.noOfPositions}
                  />
                  <InfoRow
                    icon={Visibility}
                    label="Job Mode"
                    value={jobData.jobMode}
                  />
                  <InfoRow
                    icon={School}
                    label="Qualification"
                    value={jobData.qualification}
                    fullWidth
                  />
                  <InfoRow
                    icon={Work}
                    label="Visa Type"
                    value={jobData.visaType}
                  />
                  <InfoRow
                    icon={Person}
                    label="Assigned By"
                    value={jobData.assignedBy}
                  />
                </Grid>
              </Box>

              {/* Job Description */}
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    Job Description
                  </Typography>
                  {/* Only show download button if jobDescription is null */}
                  {!jobData.jobDescription && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={
                        downloadLoading ? (
                          <CircularProgress size={16} />
                        ) : (
                          <FileDownload />
                        )
                      }
                      onClick={handleDownloadJD}
                      disabled={downloadLoading}
                    >
                      {downloadLoading ? "Downloading..." : "Download JD"}
                    </Button>
                  )}
                </Stack>
                <Divider sx={{ mb: 3 }} />

                {jobData.jobDescription ? (
                  <Box
                    sx={{
                      bgcolor: "grey.50",
                      p: 3,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ whiteSpace: "pre-line", lineHeight: 1.6 }}
                    >
                      {jobData.jobDescription}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      bgcolor: "grey.50",
                      borderRadius: 2,
                      border: "2px dashed",
                      borderColor: "grey.300",
                    }}
                  >
                    <FileDownload
                      sx={{ fontSize: 50, color: "text.secondary", mb: 2 }}
                    />
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      color="text.secondary"
                    >
                      Job Description Not Available
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleDownloadJD}
                      disabled={downloadLoading}
                      startIcon={
                        downloadLoading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <FileDownload />
                        )
                      }
                    >
                      {downloadLoading ? "Downloading..." : "Download JD"}
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Right Column - Assigned Team & Actions */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ bgcolor: "grey.50", p: 3, borderRadius: 2 }}>
                {/* Assigned Team Section */}
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Assigned Team
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {jobData.assignedUsers?.length ? (
                  <Stack spacing={2} sx={{ mb: 3 }}>
                    {jobData.assignedUsers.map((user) => (
                      <Stack
                        key={user.userId}
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{
                          p: 2,
                          bgcolor: "white",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "grey.200",
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 40,
                            height: 40,
                          }}
                        >
                          {user.userName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {user.userName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Team Member
                          </Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    py={2}
                    sx={{ mb: 3 }}
                  >
                    No team members assigned
                  </Typography>
                )}

                {/* Actions Section */}
                <Box
                  sx={{
                    pt: 3,
                    borderTop: "1px solid",
                    borderColor: "grey.300",
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Actions
                  </Typography>
                  <Stack spacing={2}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Edit />}
                      onClick={handleEdit}
                    >
                      Edit Job
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      color="error"
                      startIcon={<DeleteForeverIcon />}
                      onClick={handleDeleteClick}
                    >
                      Delete Job
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default RequirementProfile;