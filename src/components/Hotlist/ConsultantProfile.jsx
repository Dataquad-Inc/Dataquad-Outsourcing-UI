import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Divider,
  Button,
  Badge,
  Paper,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ArrowBack,
  Email,
  Phone,
  LocationOn,
  LinkedIn,
  AttachMoney,
  Person,
  Star,
  WorkOutline,
  AccountCircle,
  CalendarToday,
  Business,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Documents from "./Documents";
import { useSelector } from "react-redux";
import { hotlistAPI } from "../../utils/api";

const ConsultantProfile = () => {
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { role } = useSelector((state) => state.auth);

  const navigate = useNavigate();
  const theme = useTheme();
  const { consultantId } = useParams();

  useEffect(() => {
    fetchConsultantDetails();
  }, [consultantId]);

  const fetchConsultantDetails = async () => {
    setLoading(true);
    try {
      const response = await hotlistAPI.getConsultantById(consultantId);

      if (response.data) {
        setConsultant(response.data);
      } else {
        setError(
          response.error?.errorMessage || "Failed to fetch consultant details"
        );
      }
    } catch (err) {
      setError(err.message);
      // Mock data for demonstration
      setConsultant({
        consultantId: consultantId,
        name: "Sarah Johnson",
        technology: "React.js • Node.js • TypeScript",
        experience: 8,
        status: "available",
        grade: "B",
        remoteOnsite: "Remote",
        emailId: "sarah.johnson@email.com",
        marketingContact: "+1 (555) 123-4567",
        personalContact: "+1 (555) 987-6543",
        location: "San Francisco, CA",
        linkedInUrl: "https://linkedin.com/in/sarahjohnson",
        billRate: 95,
        recruiterName: "John Doe",
        recruiterId: "REC-001",
        teamleadName: "Mike Wilson",
        teamleadId: "TL-001",
        salesExecutive: "Lisa Chen",
        payroll: "W2",
        marketingStartDate: "2024-07-01",
        originalDOB: "1990-03-15",
        editedDOB: "1990-03-15",
        marketingVisa: "H1B",
        actualVisa: "H1B",
        passport: "Yes",
        relocation: "Yes",
        reference: "TechCorp Solutions",
        remarks:
          "Excellent performer with strong leadership skills. Consistently delivers high-quality work on time.",
        consultantAddedTimeStamp: "2024-07-01T10:30:00Z",
        updatedTimeStamp: "2024-08-10T15:45:00Z",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackTo = () => {
    if (role === "SUPERADMIN") {
      navigate("/dashboard/hotlist/master");
    } else {
      navigate("/dashboard/hotlist/consultants");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: "success",
      busy: "warning",
      "on project": "info",
      inactive: "error",
    };
    return colors[status?.toLowerCase()] || "default";
  };

  const getGradeColor = (grade) => {
    const colors = {
      A: "success",
      B: "warning",
      C: "error",
    };
    return colors[grade] || "default";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const InfoCard = ({ icon, title, value, subtitle }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: theme.shadows[4],
          transform: "translateY(-2px)",
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          sx={{
            p: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            borderRadius: 2,
            color: "primary.main",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error && !consultant) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackTo}
          variant="outlined"
        >
          Back to Consultants
        </Button>
      </Box>
    );
  }

  if (!consultant) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No consultant found with ID: {consultantId}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackTo}
          variant="outlined"
          sx={{ mt: 2 }}
        >
          Back to Consultants
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", p: { xs: 1, md: 1 } }}>
      <Box sx={{ maxWidth: "1400px", mx: "auto" }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackTo}
            sx={{
              mb: 1,
              color: "text.secondary",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            Back to Consultants
          </Button>
        </Box>

        {/* Profile Header */}
        <Card
          elevation={0}
          sx={{
            mb: 4,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            overflow: "visible",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              {/* Avatar + Basic Info */}
              <Grid item xs={12} md={8}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    badgeContent={
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          bgcolor:
                            consultant.status === "available"
                              ? "success.main"
                              : consultant.status === "busy"
                              ? "warning.main"
                              : "info.main",
                          border: "2px solid white",
                        }}
                      />
                    }
                  >
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: "primary.main",
                        fontWeight: "bold",
                        fontSize: "1.25rem",
                      }}
                    >
                      {consultant.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </Badge>

                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {consultant.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {consultant.technology}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {consultant.experience} Years | ID:{" "}
                      {consultant.consultantId}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              {/* Status + Rate */}
              <Grid item xs={12} md={4}>
                <Stack
                  spacing={1}
                  alignItems={{ xs: "flex-start", md: "flex-end" }}
                >
                  <Chip
                    label={consultant.status}
                    color={getStatusColor(consultant.status)}
                    size="small"
                  />
                  <Chip
                    icon={<Star />}
                    label={`Grade ${consultant.grade}`}
                    color={getGradeColor(consultant.grade)}
                    size="small"
                    variant="outlined"
                  />
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color="primary"
                  >
                    ${consultant.billRate}/hr
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Quick Overview
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard
              icon={<Email />}
              title="Email Address"
              value={consultant.emailId}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard
              icon={<Phone />}
              title="Marketing Contact"
              value={consultant.marketingContact}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard
              icon={<LocationOn />}
              title="Location"
              value={consultant.location}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <InfoCard
              icon={<AttachMoney />}
              title="Bill Rate"
              value={`$${consultant.billRate}/hr`}
              subtitle={consultant.payroll}
            />
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {/* Contact & Personal Details */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                  <AccountCircle sx={{ mr: 1, verticalAlign: "middle" }} />
                  Contact & Personal Details
                </Typography>

                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Personal Contact
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {consultant.personalContact}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      LinkedIn Profile
                    </Typography>
                    <Button
                      startIcon={<LinkedIn />}
                      href={consultant.linkedInUrl}
                      target="_blank"
                      variant="outlined"
                      size="small"
                    >
                      View Profile
                    </Button>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Date of Birth
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={`Original: ${formatDate(
                          consultant.originalDOB
                        )}`}
                        size="small"
                        variant="outlined"
                      />
                      {consultant.editedDOB !== consultant.originalDOB && (
                        <Chip
                          label={`Edited: ${formatDate(consultant.editedDOB)}`}
                          size="small"
                          color="warning"
                        />
                      )}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Visa Status
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={`Marketing: ${consultant.marketingVisa}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Actual: ${consultant.actualVisa}`}
                        size="small"
                        color="primary"
                      />
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Availability
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={`Passport: ${consultant.passport}`}
                        size="small"
                        color={
                          consultant.passport === "Yes" ? "success" : "default"
                        }
                      />
                      <Chip
                        label={`Relocation: ${
                          consultant.relocation === "Yes"
                            ? "Available"
                            : "Not Available"
                        }`}
                        size="small"
                        color={
                          consultant.relocation === "Yes"
                            ? "success"
                            : "default"
                        }
                      />
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Professional Details */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                  <Business sx={{ mr: 1, verticalAlign: "middle" }} />
                  Professional Details
                </Typography>

                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Team Information
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>Recruiter:</strong> {consultant.recruiterName} (
                        {consultant.recruiterId})
                      </Typography>
                      <Typography variant="body2">
                        <strong>Team Lead:</strong> {consultant.teamleadName} (
                        {consultant.teamleadId})
                      </Typography>
                      <Typography variant="body2">
                        <strong>Sales Executive:</strong>{" "}
                        {consultant.salesExecutive}
                      </Typography>
                    </Stack>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Reference
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {consultant.reference}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Marketing Start Date
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CalendarToday fontSize="small" color="action" />
                      <Typography variant="body1" fontWeight="500">
                        {formatDate(consultant.marketingStartDate)}
                      </Typography>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Record Timestamps
                    </Typography>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Added: {formatDate(consultant.consultantAddedTimeStamp)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Updated: {formatDate(consultant.updatedTimeStamp)}
                      </Typography>
                    </Stack>
                  </Box>

                  {consultant.remarks && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Remarks
                      </Typography>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="body2">
                          {consultant.remarks}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Documents Section */}
          <Grid item xs={12}>
            <Documents consultantId={consultantId} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ConsultantProfile;
