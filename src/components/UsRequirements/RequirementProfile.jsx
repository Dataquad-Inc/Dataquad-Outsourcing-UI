import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  Typography,
  Paper,
  Stack,
  Avatar,
  CircularProgress,
  Divider,
  Alert,
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
} from "@mui/icons-material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useParams, useNavigate } from "react-router-dom";

const RequirementProfile = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://mymulya.com/api/us/requirements/requirement-id/${jobId}`
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
        `https://mymulya.com/api/us/requirements/download-jd/${jobId}`,
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
  const handleEdit = () => console.log("Edit job");
  const handleDelete = () => console.log("Delete job");

  if (loading)
    return (
      <Box
        sx={{
          p: 5,
          display: "flex",
          justifyContent: "center",
          minHeight: "400px",
          alignItems: "center",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );

  if (error || !jobData)
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
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
      </Box>
    );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1200px", mx: "auto" }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBack}
        sx={{
          mb: 3,
          color: "primary.main",
          "&:hover": { bgcolor: "primary.50" },
        }}
      >
        Back to Jobs
      </Button>

      {/* Hero Header */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {jobData.jobTitle}
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.85 }}>
              {jobData.clientName} • {jobData.jobType} • {jobData.location}
            </Typography>
          </Box>
          <Chip
            label={jobData.status.toUpperCase()}
            color={getStatusColor(jobData.status)}
            sx={{ fontWeight: "bold", fontSize: "0.9rem", py: 1, px: 2 }}
          />
        </Stack>
      </Paper>

      <Grid container spacing={4}>
        {/* Left Section */}
        <Grid item xs={12} md={8}>
          {/* Job Info Card */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Job Details
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              {[
                {
                  icon: LocationOn,
                  label: "Location",
                  value: `${jobData.location} (${jobData.jobMode})`,
                },
                {
                  icon: Work,
                  label: "Experience Required",
                  value: `${jobData.experienceRequired} yrs`,
                },
                {
                  icon: Work,
                  label: "Relevant Experience",
                  value: `${jobData.relevantExperience} yrs`,
                },
                {
                  icon: Schedule,
                  label: "Notice Period",
                  value: `${jobData.noticePeriod} days`,
                },
                {
                  icon: School,
                  label: "Qualification",
                  value: jobData.qualification,
                },
                {
                  icon: AttachMoney,
                  label: "Package",
                  value: `${jobData.salaryPackage} LPA`,
                },
                {
                  icon: Business,
                  label: "Positions Available",
                  value: jobData.noOfPositions,
                },
                { icon: Work, label: "Visa Type", value: jobData.visaType },
                { icon: Work, label: "Assigned By", value: jobData.assignedBy },
              ].map((item, index) => (
                <Grid key={index} item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <item.icon sx={{ color: "primary.main" }} />
                    <Typography>
                      <strong>{item.label}:</strong> {item.value}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Job Description Card */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Job Description
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {jobData.jobDescription ? (
              <Typography whiteSpace="pre-line">
                {jobData.jobDescription}
              </Typography>
            ) : (
              <Box textAlign="center" py={4}>
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
          </Paper>
        </Grid>

        {/* Right Section */}
        <Grid item xs={12} md={4}>
          {/* Assigned Team */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Assigned Team
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {jobData.assignedUsers?.length ? (
              <Stack spacing={2}>
                {jobData.assignedUsers.map((user) => (
                  <Stack
                    key={user.userId}
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 1.5, bgcolor: "grey.50", borderRadius: 2 }}
                  >
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      {user.userName[0]}
                    </Avatar>
                    <Typography>{user.userName}</Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography textAlign="center" color="text.secondary">
                No users assigned
              </Typography>
            )}
          </Paper>

          {/* Actions */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
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
                onClick={handleDelete}
              >
                Delete Job
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RequirementProfile;
