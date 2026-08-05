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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  TablePagination,
  TextField,
  InputAdornment,
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
  AccountCircle,
  CalendarToday,
  Business,
  ListAlt,
  EventNote,
  Refresh,
  Search,
  VideoCall,
  OpenInNew,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Documents from "./Documents";
import { useSelector } from "react-redux";
import { hotlistAPI } from "../../utils/api";

const ConsultantProfile = () => {
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [rtrs, setRtrs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loadingRtrs, setLoadingRtrs] = useState(false);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  
  // Pagination states for RTRs
  const [rtrPagination, setRtrPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });
  
  // Pagination states for Interviews
  const [interviewPagination, setInterviewPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRtrs, setFilteredRtrs] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);

  const { role } = useSelector((state) => state.auth);

  const navigate = useNavigate();
  const theme = useTheme();
  const { consultantId } = useParams();

  useEffect(() => {
    fetchConsultantDetails();
  }, [consultantId]);

  useEffect(() => {
    if (consultant) {
      fetchRtrs();
      fetchInterviews();
    }
  }, [consultant]);

  useEffect(() => {
    // Filter RTRs based on search term
    if (searchTerm.trim() === "") {
      setFilteredRtrs(rtrs);
    } else {
      const filtered = rtrs.filter((rtr) =>
        rtr.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rtr.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rtr.rtrId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rtr.rtrStatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rtr.salesExecutive?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rtr.vendorCompany?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRtrs(filtered);
    }
  }, [searchTerm, rtrs]);

  useEffect(() => {
    // Filter Interviews based on search term
    if (searchTerm.trim() === "") {
      setFilteredInterviews(interviews);
    } else {
      const filtered = interviews.filter((interview) =>
        interview.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.interviewStatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.interviewId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.interviewLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.salesExecutive?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.interviewerEmailId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInterviews(filtered);
    }
  }, [searchTerm, interviews]);

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

  const fetchRtrs = async (page = rtrPagination.page, size = rtrPagination.size) => {
    setLoadingRtrs(true);
    try {
      const response = await hotlistAPI.getConsultantRtr(consultantId, {
        page: page,
        size: size,
      });
      
      if (response.data) {
        const rtrData = response.data.content || [];
        setRtrs(rtrData);
        setFilteredRtrs(rtrData);
        setRtrPagination({
          page: response.data.currentPage || 0,
          size: response.data.size || 10,
          totalElements: response.data.totalElements || 0,
          totalPages: response.data.totalPages || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching RTRs:", err);
      // Mock data for demonstration
      const mockRtrs = [
        {
          rtrId: "RTR005787",
          consultantId: "CONS00923",
          consultantName: "candidate2",
          technology: "",
          clientId: "CLIENT002",
          clientName: "TEKSystems",
          ratePart: "80",
          rtrStatus: "SUBMITTED",
          salesExecutiveId: "ADRTUS5000",
          salesExecutive: "TestSalesExecutive2",
          vendorName: "testvendor2",
          vendorEmailId: "vani@gmail.com",
          vendorMobileNumber: "234 567 8765",
          vendorCompany: "testvendor2",
          vendorLinkedIn: "https://linkedin.com/in/testvendor",
          implementationPartner: "",
          comments: "",
          createdAt: "2026-07-30T10:03:22.516567",
          createdBy: "ADRTUS5001",
          createdByName: "TestSalesExcutive1"
        },
      ];
      setRtrs(mockRtrs);
      setFilteredRtrs(mockRtrs);
      setRtrPagination({
        page: 0,
        size: 10,
        totalElements: mockRtrs.length,
        totalPages: 1,
      });
    } finally {
      setLoadingRtrs(false);
    }
  };

  const fetchInterviews = async (page = interviewPagination.page, size = interviewPagination.size) => {
    setLoadingInterviews(true);
    try {
      const response = await hotlistAPI.getConstultantInterviews(consultantId, {
        page: page,
        size: size,
      });
      
      if (response.data) {
        const interviewData = response.data.content || [];
        setInterviews(interviewData);
        setFilteredInterviews(interviewData);
        setInterviewPagination({
          page: response.data.currentPage || 0,
          size: response.data.size || 10,
          totalElements: response.data.totalElements || 0,
          totalPages: response.data.totalPages || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching interviews:", err);
      // Mock data for demonstration
      const mockInterviews = [
        {
          interviewId: "INTER000868",
          rtrId: "RTR005787",
          consultantId: "CONS00923",
          consultantName: "candidate2",
          consultantEmailId: null,
          technology: "",
          clientId: "CLIENT002",
          remarks: "",
          clientName: "TEKSystems",
          salesExecutiveId: "ADRTUS5000",
          salesExecutive: "TestSalesExecutive2",
          interviewLevel: "Technical Assessment (Test)",
          interviewStatus: "SCHEDULED",
          interviewDateTime: "2026-07-30T18:30:00",
          interviewerEmailId: "vanni1903@gmail.com",
          zoomLink: "https://zoom.us/j/123456789",
          duration: 0,
          isPlaced: null,
          createdBy: "TestSalesExcutive1"
        },
      ];
      setInterviews(mockInterviews);
      setFilteredInterviews(mockInterviews);
      setInterviewPagination({
        page: 0,
        size: 10,
        totalElements: mockInterviews.length,
        totalPages: 1,
      });
    } finally {
      setLoadingInterviews(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchTerm("");
  };

  const handleRtrPageChange = (event, newPage) => {
    const updatedPagination = { ...rtrPagination, page: newPage };
    setRtrPagination(updatedPagination);
    fetchRtrs(newPage, rtrPagination.size);
  };

  const handleRtrRowsPerPageChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    const updatedPagination = { ...rtrPagination, size: newSize, page: 0 };
    setRtrPagination(updatedPagination);
    fetchRtrs(0, newSize);
  };

  const handleInterviewPageChange = (event, newPage) => {
    const updatedPagination = { ...interviewPagination, page: newPage };
    setInterviewPagination(updatedPagination);
    fetchInterviews(newPage, interviewPagination.size);
  };

  const handleInterviewRowsPerPageChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    const updatedPagination = { ...interviewPagination, size: newSize, page: 0 };
    setInterviewPagination(updatedPagination);
    fetchInterviews(0, newSize);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRefresh = () => {
    if (tabValue === 1) {
      fetchRtrs(rtrPagination.page, rtrPagination.size);
    } else if (tabValue === 2) {
      fetchInterviews(interviewPagination.page, interviewPagination.size);
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

  const getRtrStatusColor = (status) => {
    const colors = {
      SUBMITTED: "primary",
      IN_PROGRESS: "warning",
      REJECTED: "error",
      ACCEPTED: "success",
      ON_HOLD: "info",
    };
    return colors[status] || "default";
  };

  const getInterviewStatusColor = (status) => {
    const colors = {
      SCHEDULED: "primary",
      IN_PROGRESS: "warning",
      COMPLETED: "success",
      REJECTED: "error",
      SELECTED: "success",
      ON_HOLD: "info",
      CANCELLED: "error",
    };
    return colors[status] || "default";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-");

    const date = new Date(Date.UTC(year, month - 1, day));

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const handleLinkedInClick = (linkedInUrl) => {
    if (linkedInUrl && linkedInUrl !== "N/A" && linkedInUrl.trim() !== "") {
      // Check if URL already has http or https
      let url = linkedInUrl;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderRTRsTable = () => {
    const displayedRtrs = filteredRtrs;

    return (
      <Box>
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="h6" fontWeight="bold">
            RTRs ({rtrPagination.totalElements})
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search RTRs..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ width: { xs: "100%", sm: 200 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loadingRtrs ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : displayedRtrs.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No RTRs found</Typography>
          </Paper>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
              <Table sx={{ minWidth: 2000 }}>
                <TableHead sx={{ bgcolor: "grey.50" }}>
                  <TableRow>
                    <TableCell sx={{ minWidth: 140, fontWeight: 'bold' }}>RTR ID</TableCell>
                    <TableCell sx={{ minWidth: 180, fontWeight: 'bold' }}>Consultant</TableCell>
                    <TableCell sx={{ minWidth: 180, fontWeight: 'bold' }}>Technology</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Client</TableCell>
                    <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>Rate</TableCell>
                    <TableCell sx={{ minWidth: 160, fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Sales Executive</TableCell>
                    <TableCell sx={{ minWidth: 180, fontWeight: 'bold' }}>Vendor Name</TableCell>
                    <TableCell sx={{ minWidth: 220, fontWeight: 'bold' }}>Vendor Email</TableCell>
                    <TableCell sx={{ minWidth: 180, fontWeight: 'bold' }}>Vendor Mobile</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Vendor Company</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Vendor LinkedIn</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Implementation Partner</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Created At</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Created By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedRtrs.map((rtr) => (
                    <TableRow key={rtr.rtrId} hover>
                      <TableCell sx={{ minWidth: 140 }}>
                        <Typography variant="body2" fontWeight="500" sx={{ wordBreak: 'break-word' }}>
                          {rtr.rtrId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {rtr.consultantName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {rtr.technology || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {rtr.clientName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {rtr.clientId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Typography variant="body2" fontWeight="500">
                          ${rtr.ratePart}/hr
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Chip
                          label={rtr.rtrStatus}
                          color={getRtrStatusColor(rtr.rtrStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {rtr.salesExecutive}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {rtr.vendorName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {rtr.vendorEmailId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {rtr.vendorMobileNumber}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {rtr.vendorCompany}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        {rtr.vendorLinkedIn && rtr.vendorLinkedIn !== "N/A" && rtr.vendorLinkedIn.trim() !== "" ? (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<LinkedIn />}
                            endIcon={<OpenInNew fontSize="small" />}
                            onClick={() => handleLinkedInClick(rtr.vendorLinkedIn)}
                            sx={{
                              textTransform: 'none',
                              borderColor: '#0a66c2',
                              color: '#0a66c2',
                              '&:hover': {
                                borderColor: '#0a66c2',
                                backgroundColor: 'rgba(10, 102, 194, 0.04)',
                              },
                              whiteSpace: 'nowrap',
                              minWidth: '140px'
                            }}
                          >
                            View LinkedIn
                          </Button>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {rtr.implementationPartner || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {formatDateTime(rtr.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {rtr.createdByName || rtr.createdBy}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={rtrPagination.totalElements}
              page={rtrPagination.page}
              onPageChange={handleRtrPageChange}
              rowsPerPage={rtrPagination.size}
              onRowsPerPageChange={handleRtrRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Box>
    );
  };

  const renderInterviewsTable = () => {
    const displayedInterviews = filteredInterviews;

    return (
      <Box>
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="h6" fontWeight="bold">
            Interviews ({interviewPagination.totalElements})
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search Interviews..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ width: { xs: "100%", sm: 200 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loadingInterviews ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : displayedInterviews.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No interviews found</Typography>
          </Paper>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
              <Table sx={{ minWidth: 2400 }}>
                <TableHead sx={{ bgcolor: "grey.50" }}>
                  <TableRow>
                    <TableCell sx={{ minWidth: 160, fontWeight: 'bold' }}>Interview ID</TableCell>
                    <TableCell sx={{ minWidth: 140, fontWeight: 'bold' }}>RTR ID</TableCell>
                    <TableCell sx={{ minWidth: 180, fontWeight: 'bold' }}>Consultant</TableCell>
                    <TableCell sx={{ minWidth: 220, fontWeight: 'bold' }}>Consultant Email</TableCell>
                    <TableCell sx={{ minWidth: 180, fontWeight: 'bold' }}>Technology</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Client</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Sales Executive</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Interview Level</TableCell>
                    <TableCell sx={{ minWidth: 160, fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ minWidth: 220, fontWeight: 'bold' }}>Date & Time</TableCell>
                    <TableCell sx={{ minWidth: 220, fontWeight: 'bold' }}>Interviewer Email</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Zoom Meeting</TableCell>
                    <TableCell sx={{ minWidth: 140, fontWeight: 'bold' }}>Duration</TableCell>
                    <TableCell sx={{ minWidth: 140, fontWeight: 'bold' }}>Is Placed</TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Created By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedInterviews.map((interview) => (
                    <TableRow key={interview.interviewId} hover>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Typography variant="body2" fontWeight="500" sx={{ wordBreak: 'break-word' }}>
                          {interview.interviewId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {interview.rtrId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {interview.consultantName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {interview.consultantEmailId || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {interview.technology || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {interview.clientName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {interview.clientId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {interview.salesExecutive}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {interview.interviewLevel}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Chip
                          label={interview.interviewStatus}
                          color={getInterviewStatusColor(interview.interviewStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {formatDateTime(interview.interviewDateTime)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {interview.interviewerEmailId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        {interview.zoomLink ? (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<VideoCall />}
                            href={interview.zoomLink}
                            target="_blank"
                            sx={{
                              textTransform: 'none',
                              backgroundColor: '#0b5c8e',
                              '&:hover': {
                                backgroundColor: '#0a4a73',
                              },
                              whiteSpace: 'nowrap',
                              minWidth: '140px'
                            }}
                          >
                            Join Meeting
                          </Button>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No meeting
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <Typography variant="body2">
                          {interview.duration || 0} min
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 140 }}>
                        <Typography variant="body2">
                          {interview.isPlaced !== null && interview.isPlaced !== undefined 
                            ? (interview.isPlaced ? 'Yes' : 'No') 
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {interview.createdBy}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={interviewPagination.totalElements}
              page={interviewPagination.page}
              onPageChange={handleInterviewPageChange}
              rowsPerPage={interviewPagination.size}
              onRowsPerPageChange={handleInterviewRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Box>
    );
  };

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
              Quick Overview            </Typography>
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

        {/* Tabs Section */}
        <Card
          elevation={0}
          sx={{
            mb: 4,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                mb: 3,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                },
              }}
            >
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Person />
                    <span>Profile Details</span>
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ListAlt />
                    <span>RTRs ({rtrPagination.totalElements || 0})</span>
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EventNote />
                    <span>Interviews ({interviewPagination.totalElements || 0})</span>
                  </Stack>
                }
              />
            </Tabs>

            {/* Tab Panels */}
            {tabValue === 0 && (
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
                              label={`Relocation: ${consultant.relocation === "Yes"
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
            )}

            {tabValue === 1 && (
              <Box>{renderRTRsTable()}</Box>
            )}

            {tabValue === 2 && (
              <Box>{renderInterviewsTable()}</Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ConsultantProfile;