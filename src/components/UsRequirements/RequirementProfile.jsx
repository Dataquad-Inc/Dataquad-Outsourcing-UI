import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
  Paper,
  Stack,
  Avatar,
  IconButton,
} from "@mui/material";
import {
  ArrowBack,
  LocationOn,
  Work,
  Person,
  Schedule,
  AttachMoney,
  CalendarToday,
  Business,
  School,
  Star,
  Edit,
  BookmarkBorder,
} from "@mui/icons-material";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useNavigate, useParams } from "react-router-dom";

const RequirementProfile = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  // Mock data - in real app, this would come from API/props
const jobData = {
  id: 12,
  jobId: "JOB-012",
  clientName: "Microsoft Corporation",
  jobTitle: "Frontend Engineer (React.js)",
  jobMode: "Hybrid",
  location: "Redmond, WA",
  employmentType: "FullTime",
  noOfPositions: 3,
  skills: "React.js, TypeScript, Redux, Material-UI, REST APIs, Git",
  experience: 5,
  relevantExperience: 4,
  qualification: "Bachelor’s in Computer Science or related field",
  noticePeriod: 30,
  salaryPackage: 135000, // Annual in USD
  payrollType: "W2",
  status: "Open",
  jobPostedDate: "2025-08-15",
  jobClosingDate: "2025-09-30",
  jdFile: "frontend_engineer_ms.pdf",
  jobDescription:
    "We are seeking a Frontend Engineer to join our Microsoft Teams product group. The ideal candidate has strong experience in React.js, TypeScript, and modern UI frameworks. You will work closely with designers, backend engineers, and product managers to deliver highly scalable and performant UI features.",
  notes: "Prior experience with large-scale SaaS products is preferred.",
  assignedBy: "Sarah Johnson",
};


  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "open":
        return "success";
      case "closed":
        return "error";
      case "on hold":
        return "warning";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const skillsArray = jobData.skills.split(", ");

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <IconButton
            onClick={() => navigate("/dashboard/us-requirements")}
            sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {jobData.jobTitle}
          </Typography>
          <Chip
            label={jobData.status}
            color={getStatusColor(jobData.status)}
            variant="filled"
            sx={{ ml: "auto" }}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={3} sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Business color="action" />
            <Typography variant="h6" color="text.secondary">
              {jobData.clientName}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocationOn color="action" />
            <Typography variant="body1" color="text.secondary">
              {jobData.location} • {jobData.jobMode}
            </Typography>
          </Stack>
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<Edit />}>
            Edit Job
          </Button>
          <Button variant="outlined" startIcon={<DeleteForeverIcon />}>
            Delete
          </Button>
         
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Job Overview Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Job Overview
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 2 }}
                  >
                    <Work color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Employment Type
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {jobData.employmentType}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={6}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 2 }}
                  >
                    <Person color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        No. of Positions
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {jobData.noOfPositions}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={6}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 2 }}
                  >
                    <AttachMoney color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Salary Package
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(jobData.salaryPackage)} (
                        {jobData.payrollType})
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={6}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 2 }}
                  >
                    <Schedule color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Notice Period
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {jobData.noticePeriod} days
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Job Description Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Job Description
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" paragraph>
                {jobData.jobDescription}
              </Typography>

              {jobData.notes && (
                <Paper sx={{ p: 2, bgcolor: "info.light", mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="info.dark"
                    gutterBottom
                  >
                    Additional Notes:
                  </Typography>
                  <Typography variant="body2" color="info.dark">
                    {jobData.notes}
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* Skills & Requirements Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Skills & Requirements
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Required Skills:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {skillsArray.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill.trim()}
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Stack>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Star color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Experience
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {jobData.experience} years
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Star color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Relevant Experience
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {jobData.relevantExperience} years
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <School color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Qualification
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {jobData.qualification}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Job Details Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Job Details
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Job ID
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {jobData.jobId}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Posted Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(jobData.jobPostedDate)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Closing Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(jobData.jobClosingDate)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Assigned By
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      sx={{ width: 24, height: 24, bgcolor: "primary.main" }}
                    >
                      {jobData.assignedBy
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </Avatar>
                    <Typography variant="body1" fontWeight="medium">
                      {jobData.assignedBy}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Button variant="outlined" fullWidth>
                  View Applications
                </Button>
                <Button variant="outlined" fullWidth>
                  Download JD
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RequirementProfile;
