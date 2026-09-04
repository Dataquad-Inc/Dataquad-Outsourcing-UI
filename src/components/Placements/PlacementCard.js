import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Grid,
  Avatar,
  Chip,
  Paper,
  useTheme,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Link,
  Snackbar,
} from "@mui/material";
import {
  Person,
  Email,
  Phone,
  Business,
  Store,
  PermIdentity,
  Paid,
  CalendarToday,
  WorkOutline,
  Visibility,
  VerifiedUser,
  Security,
  Send,
  CheckCircle,
} from "@mui/icons-material";
import httpService from "../../Services/httpService";
import { useSelector } from "react-redux";

const InfoItem = ({ icon: Icon, label, value }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
      <Icon color="action" fontSize="small" />
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
        {label}:
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
        {value}
      </Typography>
    </Box>
  );
};

const FinancialCard = ({ label, value, color }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        textAlign: "center",
        bgcolor: theme.palette.background.default,
        borderRadius: 2,
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: theme.palette.text.secondary, mb: 1 }}
      >
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: "bold", color }}>
        {value}
      </Typography>
    </Paper>
  );
};

const PlacementCard = ({ data }) => {
  const theme = useTheme();
  const [isFinancialValidated, setIsFinancialValidated] = useState(false);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [inputOtp, setInputOtp] = useState("");
  const [isOtpGenerated, setIsOtpGenerated] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const{userId}=useSelector((state)=>state.auth)

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "success";
      case "completed":
        return "info";
      case "pending":
        return "warning";
      case "terminated":
        return "error";
      default:
        return "default";
    }
  };

  const formatCurrency = (val) =>
    val
      ? `₹ ${parseFloat(val).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })}`
      : "₹ 0";

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "CN";

  const handleValidateFinancials = () => {
    setIsOtpDialogOpen(true);
  };

  const generateOtp = async () => {
    setIsLoading(true);
    try {
      const payload={
        userId:userId,
        placementId:null,
        newPlacement: false
      }
      const response = await httpService.post('/candidate/generateOtp',payload);

      if (response.data) {
        setIsOtpGenerated(true);
        setSnackbarMessage("OTP sent successfully! Check your registered mobile/email.");
        setSnackbarOpen(true);
      } else {
        const error = await response.json();
        setSnackbarMessage(error.message || "Failed to send OTP. Please try again.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage("Network error. Please check your connection and try again.");
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!inputOtp || inputOtp.length !== 6) {
      setSnackbarMessage("Please enter a valid 6-digit OTP.");
      setSnackbarOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const payload={
       placementId:null,
       userId:userId,
       otp:inputOtp
      }
      const response = await httpService.post('/candidate/verifyOtp', payload);

      if (response.data) {
        setIsFinancialValidated(true);
        setIsOtpDialogOpen(false);
        setSnackbarMessage("OTP verified successfully! Financial data unlocked.");
        setSnackbarOpen(true);
        // Reset OTP state
        // setIsOtpGenerated(false);
      } else {
        const error = await response.json();
        setSnackbarMessage(error.message || "Invalid OTP. Please try again.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage("Network error. Please check your connection and try again.");
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsOtpDialogOpen(false);
    setInputOtp("");
    setIsOtpGenerated(false);
  };

  return (
    <Card
      elevation={0}
      sx={{ width: "100%", borderRadius: 2, background: "transparent" }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          backgroundColor: "#E0F2F1", // Soft teal
          color: theme.palette.text.primary,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderRadius: "16px 16px 0 0",
        }}
      >
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            width: 56,
            height: 56,
            fontSize: "1.25rem",
            fontWeight: "bold",
          }}
        >
          {getInitials(data.consultantName)}
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            {data.consultantName}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            ID: {data.id} • {data.technology}
          </Typography>
        </Box>
        <Box sx={{ ml: "auto" }}>
          <Chip
            label={data.status || "Unknown"}
            color={getStatusColor(data.status)}
            sx={{ fontWeight: "bold" }}
          />
        </Box>
      </Box>

      {/* Content */}
      <Paper elevation={1} sx={{ borderRadius: "0 0 16px 16px" }}>
        <CardContent sx={{ p: 3 }}>
          {/* Consultant Info */}
          <Section title="CONSULTANT INFO" icon={Person}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InfoItem
                  icon={Email}
                  label="Email"
                  value={data.consultantEmail}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoItem icon={Phone} label="Phone" value={data.phone} />
              </Grid>
            </Grid>
          </Section>

          <Divider sx={{ my: 3 }} />

          {/* Placement Info */}
          <Section title="PLACEMENT DETAILS" icon={Business}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InfoItem icon={Business} label="Client" value={data.client} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoItem icon={Store} label="Vendor" value={data.vendorName} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoItem
                  icon={PermIdentity}
                  label="Recruiter"
                  value={data.recruiter}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoItem
                  icon={PermIdentity}
                  label="Sales"
                  value={data.sales}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoItem
                  icon={CalendarToday}
                  label="Start Date"
                  value={data.startDate}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoItem
                  icon={CalendarToday}
                  label="End Date"
                  value={data.endDate || "Ongoing"}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoItem
                  icon={WorkOutline}
                  label="Employment Type"
                  value={data.employmentType}
                />
              </Grid>
            </Grid>
          </Section>

          <Divider sx={{ my: 3 }} />

          {/* Financial Info - Show validation link or financial details */}
          {!isFinancialValidated ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Alert 
                severity="info" 
                sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
                icon={<Paid />}
              >
                Financial information requires OTP validation to view
              </Alert>
              <Link
                component="button"
                variant="body1"
                onClick={handleValidateFinancials}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  justifyContent: "center",
                  textDecoration: "none",
                  color: theme.palette.primary.main,
                  fontWeight: "bold",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                <Security fontSize="small" />
                Validate Financial Data
              </Link>
            </Box>
          ) : (
            <Section title="FINANCIAL DETAILS" icon={VerifiedUser}>
              <Alert 
                severity="success" 
                sx={{ mb: 3 }}
                icon={<VerifiedUser />}
              >
                Financial data validated and verified
              </Alert>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <FinancialCard
                    label="Bill Rate"
                    value={formatCurrency(data.billRate)}
                    color={theme.palette.success.main}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FinancialCard
                    label="Pay Rate"
                    value={formatCurrency(data.payRate)}
                    color={theme.palette.info.main}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FinancialCard
                    label="Gross Profit"
                    value={formatCurrency(data.grossProfit)}
                    color={theme.palette.primary.main}
                  />
                </Grid>
              </Grid>
            </Section>
          )}
        </CardContent>
      </Paper>

      {/* OTP Validation Dialog */}
      <Dialog 
        open={isOtpDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 1,
          pb: 1
        }}>
          <Security color="primary" />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Financial Data Validation
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Generate and verify OTP to access financial information
          </Alert>
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={generateOtp}
              startIcon={<Send />}
              disabled={isOtpGenerated || isLoading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              {isLoading ? "Sending..." : isOtpGenerated ? "OTP Sent" : "Generate OTP"}
            </Button>
            
            <TextField
              label="Enter OTP"
              variant="outlined"
              fullWidth
              value={inputOtp}
              onChange={(e) => setInputOtp(e.target.value)}
              // disabled={!isOtpGenerated}
              placeholder="Enter 6-digit OTP"
              inputProps={{ maxLength: 6 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                }
              }}
            />
            
            {isOtpGenerated && (
              <Alert severity="success" sx={{ mt: 1 }}>
                OTP sent successfully! Please check your registered mobile number or email.
              </Alert>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={verifyOtp}
            // disabled={!isOtpGenerated || inputOtp.length !== 6 || isLoading}
            startIcon={<CheckCircle />}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: "bold",
            }}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarMessage.includes('Invalid') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
};

const Section = ({ title, icon: Icon, children }) => {
  const theme = useTheme();
  return (
    <Box mb={3}>
      <Typography
        variant="subtitle1"
        sx={{
          mb: 2,
          fontWeight: "bold",
          color: theme.palette.text.secondary,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Icon fontSize="small" /> {title}
      </Typography>
      {children}
    </Box>
  );
};

export default PlacementCard;