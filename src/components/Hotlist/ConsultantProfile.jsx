import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Paper,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import {
  Email,
  Phone,
  LocationOn,
  Work,
  CalendarToday,
  AttachMoney,
  Language,
  School,
  Business,
  Person,
  Schedule,
  Assignment,
  VideoCall,
  Assessment,
  TrendingUp,
  CheckCircle,
  Cancel,
  Pending,
  Edit,
  Visibility,
} from "@mui/icons-material";
import { hotlistAPI } from "../../utils/api";

const ConsultantProfile = () => {
  const { consultantId } = useParams();
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  // Mock data for interviews and rate confirmations
  const [interviews] = useState([
    {
      id: 1,
      clientName: "TechCorp Inc",
      position: "Senior React Developer",
      date: "2024-07-28",
      time: "2:00 PM",
      type: "Technical",
      status: "Completed",
      result: "Selected",
      feedback: "Strong technical knowledge, excellent problem-solving skills",
      interviewerName: "Jane Doe",
      round: "Final Round",
      duration: "60 mins",
    },
    {
      id: 2,
      clientName: "InnovateSoft",
      position: "Full Stack Engineer",
      date: "2024-07-25",
      time: "10:30 AM",
      type: "HR + Technical",
      status: "Completed",
      result: "Rejected",
      feedback:
        "Good technical skills but looking for more experience in microservices",
      interviewerName: "Robert Chen",
      round: "Second Round",
      duration: "45 mins",
    },
    {
      id: 3,
      clientName: "DataFlow Solutions",
      position: "Frontend Developer",
      date: "2024-08-05",
      time: "3:30 PM",
      type: "Technical",
      status: "Scheduled",
      result: "Pending",
      feedback: "",
      interviewerName: "Lisa Anderson",
      round: "First Round",
      duration: "30 mins",
    },
    {
      id: 4,
      clientName: "CloudTech Systems",
      position: "React Specialist",
      date: "2024-08-10",
      time: "11:00 AM",
      type: "Client Interview",
      status: "Scheduled",
      result: "Pending",
      feedback: "",
      interviewerName: "Mark Johnson",
      round: "Initial Screening",
      duration: "30 mins",
    },
  ]);

  const [rateConfirmations] = useState([
    {
      id: 1,
      clientName: "TechCorp Inc",
      position: "Senior React Developer",
      proposedRate: 85,
      negotiatedRate: 90,
      status: "Confirmed",
      confirmedBy: "David Brown",
      confirmedDate: "2024-07-29",
      projectDuration: "6 months",
      startDate: "2024-08-15",
      notes: "Rate increased due to excellent interview performance",
    },
    {
      id: 2,
      clientName: "StartupXYZ",
      position: "Full Stack Developer",
      proposedRate: 80,
      negotiatedRate: 80,
      status: "Pending",
      confirmedBy: "",
      confirmedDate: "",
      projectDuration: "12 months",
      startDate: "2024-08-20",
      notes: "Waiting for client approval",
    },
    {
      id: 3,
      clientName: "Enterprise Corp",
      position: "React Specialist",
      proposedRate: 95,
      negotiatedRate: 85,
      status: "Negotiating",
      confirmedBy: "",
      confirmedDate: "",
      projectDuration: "3 months",
      startDate: "2024-09-01",
      notes: "Client requested rate reduction, under discussion",
    },
    {
      id: 4,
      clientName: "DataFlow Solutions",
      position: "Frontend Developer",
      proposedRate: 75,
      negotiatedRate: 0,
      status: "Rejected",
      confirmedBy: "",
      confirmedDate: "",
      projectDuration: "4 months",
      startDate: "",
      notes: "Budget constraints, client went with another candidate",
    },
  ]);

  useEffect(() => {
    const fetchConsultantDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await hotlistAPI.getConsultantById(consultantId);

        if (response.data) {
          setConsultant(response.data);
        } else {
          throw new Error(response.data?.message || "Unknown error occurred");
        }
      } catch (err) {
        console.error("Error fetching consultant:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load consultant details. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    if (consultantId) {
      fetchConsultantDetails();
    } else {
      setError("No consultant ID provided");
      setLoading(false);
    }
  }, [consultantId]);

  const getStatusColor = (status) => {
    const statusColors = {
      busy: "warning",
      available: "success",
      "on project": "info",
      inactive: "error",
    };
    return statusColors[status?.toLowerCase()] || "default";
  };

  const getGradeColor = (grade) => {
    const gradeColors = {
      A: "success",
      B: "warning",
      C: "error",
    };
    return gradeColors[grade] || "default";
  };

  const getInterviewStatusColor = (status) => {
    const colors = {
      Completed: "success",
      Scheduled: "info",
      Cancelled: "error",
    };
    return colors[status] || "default";
  };

  const getInterviewResultColor = (result) => {
    const colors = {
      Selected: "success",
      Rejected: "error",
      Pending: "warning",
    };
    return colors[result] || "default";
  };

  const getRateStatusColor = (status) => {
    const colors = {
      Confirmed: "success",
      Pending: "warning",
      Negotiating: "info",
      Rejected: "error",
    };
    return colors[status] || "default";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  const handleBackTo = () => {
    navigate("/dashboard/hotlist/consultants");
  };

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading consultant details...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!consultant) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">No consultant data found.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "primary.main",
                  fontSize: "2rem",
                  fontWeight: "bold",
                }}
              >
                {consultant.name?.charAt(0)?.toUpperCase() || "C"}
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {consultant.name || "Unknown"}
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {consultant.technology || "Technology not specified"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {consultant.consultantId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Experience: {consultant.experience} years
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                alignItems: "flex-end",
              }}
            >
              <Chip
                label={consultant.status || "Unknown"}
                color={getStatusColor(consultant.status)}
                variant="filled"
              />
              <Chip
                label={`Grade ${consultant.grade || "N/A"}`}
                color={getGradeColor(consultant.grade)}
                variant="outlined"
              />
              <Chip
                label={consultant.remoteOnsite || "Not specified"}
                color="info"
                variant="outlined"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<Person />} label="Profile Details" iconPosition="start" />
          <Tab
            icon={<VideoCall />}
            label={`Interviews (${interviews.length})`}
            iconPosition="start"
          />
          <Tab
            icon={<AttachMoney />}
            label={`Rate Confirmations (${rateConfirmations.length})`}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Contact Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Person color="primary" />
                  Contact Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Email color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email"
                      secondary={consultant.emailId || "Not provided"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Phone color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Marketing Contact"
                      secondary={consultant.marketingContact || "Not provided"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Phone color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Personal Contact"
                      secondary={consultant.personalContact || "Not provided"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Location"
                      secondary={consultant.location || "Not provided"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Language color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="LinkedIn"
                      secondary={
                        consultant.linkedInUrl ? (
                          <a
                            href={consultant.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#1976d2" }}
                          >
                            View Profile
                          </a>
                        ) : (
                          "Not provided"
                        )
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Professional Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Work color="primary" />
                  Professional Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Business color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Reference"
                      secondary={consultant.reference || "Not provided"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Person color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Recruiter"
                      secondary={`${consultant.recruiterName || "Unknown"} (${
                        consultant.recruiterId || "N/A"
                      })`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Person color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Team Lead"
                      secondary={`${consultant.teamleadName || "Unknown"} (${
                        consultant.teamleadId || "N/A"
                      })`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Person color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sales Executive"
                      secondary={consultant.salesExecutive || "Not assigned"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AttachMoney color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Bill Rate"
                      secondary={
                        consultant.billRate
                          ? `$${consultant.billRate}/hr`
                          : "Not specified"
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Assignment color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Payroll"
                      secondary={consultant.payroll || "Not specified"}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <School color="primary" />
                  Additional Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarToday color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Original DOB"
                      secondary={formatDate(consultant.originalDOB)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarToday color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Edited DOB"
                      secondary={formatDate(consultant.editedDOB)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Language color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Marketing Visa"
                      secondary={consultant.marketingVisa || "Not specified"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Language color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Actual Visa"
                      secondary={consultant.actualVisa || "Not specified"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Passport Available"
                      secondary={consultant.passport === "Yes" ? "Yes" : "No"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Relocation"
                      secondary={
                        consultant.relocation === "Yes"
                          ? "Available"
                          : "Not available"
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Timeline Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Schedule color="primary" />
                  Timeline & Status
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarToday color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Marketing Start Date"
                      secondary={formatDate(consultant.marketingStartDate)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Added Timestamp"
                      secondary={formatDateTime(
                        consultant.consultantAddedTimeStamp
                      )}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Updated"
                      secondary={formatDateTime(consultant.updatedTimeStamp)}
                    />
                  </ListItem>
                </List>

                {consultant.remarks && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Remarks:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography variant="body2">
                        {consultant.remarks}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Interviews Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <VideoCall color="primary" />
              Interview History [dummy Data]
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client & Position</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Type & Round</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Interviewer</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interviews.map((interview) => (
                    <TableRow key={interview.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {interview.clientName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {interview.position}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(interview.date)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {interview.time} ({interview.duration})
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {interview.type}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {interview.round}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={interview.status}
                          color={getInterviewStatusColor(interview.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={interview.result}
                          color={getInterviewResultColor(interview.result)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {interview.interviewerName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Rate Confirmations Tab */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <TrendingUp color="primary" />
              Rate Confirmation History [dummy data]
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client & Position</TableCell>
                    <TableCell>Rates ($/hr)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Project Details</TableCell>
                    <TableCell>Confirmed By</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rateConfirmations.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {rate.clientName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {rate.position}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Proposed: ${rate.proposedRate}
                        </Typography>
                        {rate.negotiatedRate > 0 && (
                          <Typography variant="body2" color="primary">
                            Negotiated: ${rate.negotiatedRate}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rate.status}
                          color={getRateStatusColor(rate.status)}
                          size="small"
                        />
                        {rate.confirmedDate && (
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(rate.confirmedDate)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Duration: {rate.projectDuration}
                        </Typography>
                        {rate.startDate && (
                          <Typography variant="body2" color="text.secondary">
                            Start: {formatDate(rate.startDate)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {rate.confirmedBy || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {rate.notes || "No notes"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
         
        </Card>
       
      )}
      <Box sx={{display:"flex" ,justifyContent:"flex-end"}}>
         <Button onClick={handleBackTo} variant="contained">
            Back to consultants
          </Button>
      </Box>
    </Container>
  );
};

export default ConsultantProfile;
