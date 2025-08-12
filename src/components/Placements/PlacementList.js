import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Chip,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material";
import {
  Edit,
  Visibility,
  Delete,
  Add,
  Close,
  LockOpen,
  PersonAdd,
  HowToRegRounded
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../muiComponents/DataTabel";
import PlacementForm from "./PlacementForm";
import PlacementCard from "./PlacementCard";
import ConfirmDialog from "../muiComponents/ConfirmDialog";
import {
  fetchPlacements,
  deletePlacement,
  setSelectedPlacement,
  resetPlacementState,
} from "../../redux/placementSlice";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import CryptoJS from "crypto-js";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import { render } from "@testing-library/react";
import axios from "axios";


const PlacementsList = () => {
  const dispatch = useDispatch();
  const {
    placements,
    loading,
    selectedPlacement,
  } = useSelector((state) => state.placement);
  const { userId, encryptionKey } = useSelector((state) => state.auth);

  console.log("encryption from backend", encryptionKey);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [placementToDelete, setPlacementToDelete] = useState(null);
  const [users, setUsers]=useState([])

  // OTP related state
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isGlobalVerification, setIsGlobalVerification] = useState(false);

  const [exportCallback, setExportCallback] = useState(null);


  const handleRequestExportVerification = (callback) => {
    setExportCallback(() => callback);
    handleOpenOtpDialog(null, true); // Open global verification
  };

  const decoded = atob(encryptionKey);

  const FINANCIAL_SECRET_KEY = decoded
  const VERIFICATION_TIMEOUT = 5 * 60 * 1000; // 2 minutes in milliseconds


  const decryptFinancialValue = (encryptedValue) => {
    if (!encryptedValue) return 0;
    try {
      if (!isNaN(parseFloat(encryptedValue))) {
        return parseFloat(encryptedValue);
      }

      const bytes = CryptoJS.AES.decrypt(encryptedValue, FINANCIAL_SECRET_KEY);
      const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
      return parseFloat(decryptedValue) || 0;
    } catch (error) {
      console.error("Decryption failed:", error);
      return 0;
    }
  };

  // Initialize verification state
  const initializeVerificationState = () => {
    const savedState = localStorage.getItem('verificationState');
    if (!savedState) {
      return {
        global: { verified: false, timestamp: null },
        records: {}
      };
    }

    try {
      const parsed = JSON.parse(savedState);
      const now = Date.now();
      let needsUpdate = false;

      // Check if global verification has expired
      if (parsed.global?.verified && parsed.global?.timestamp &&
        now - parsed.global.timestamp > VERIFICATION_TIMEOUT) {
        parsed.global = { verified: false, timestamp: null };
        needsUpdate = true;
      }

      // Clean expired record verifications
      const cleanRecords = {};
      if (parsed.records) {
        Object.keys(parsed.records).forEach(id => {
          const record = parsed.records[id];
          if (record?.timestamp && now - record.timestamp <= VERIFICATION_TIMEOUT) {
            cleanRecords[id] = record;
          } else {
            needsUpdate = true;
          }
        });
      }
      parsed.records = cleanRecords;

      // Update localStorage if any changes were made
      if (needsUpdate) {
        localStorage.setItem('verificationState', JSON.stringify(parsed));
      }

      return parsed;
    } catch (error) {
      console.error('Error parsing verification state:', error);
      return {
        global: { verified: false, timestamp: null },
        records: {}
      };
    }
  };

  const [verificationState, setVerificationState] = useState(initializeVerificationState);

  // Timer references for cleanup
  const globalTimerRef = useRef(null);
  const recordTimersRef = useRef({});

  // Process placements data to decrypt financial fields
  const processedPlacements = React.useMemo(() => {
    return placements.map(placement => {
      const decryptedBillRate = decryptFinancialValue(placement.billRate);
      const decryptedPayRate = decryptFinancialValue(placement.payRate);
      const calculatedGrossProfit = decryptFinancialValue(decryptedBillRate - decryptedPayRate);

      return {
        ...placement,
        _originalBillRate: placement.billRate,
        _originalPayRate: placement.payRate,
        _originalGrossProfit: placement.grossProfit,
        billRate: decryptedBillRate,
        payRate: decryptedPayRate,
        grossProfit: calculatedGrossProfit
      };
    });
  }, [placements]);

  // Function to clear verification and update state
  const clearVerification = useCallback((type, recordId = null) => {
    setVerificationState(prev => {
      const newState = { ...prev };

      if (type === 'global') {
        newState.global = { verified: false, timestamp: null };
        console.log('Global verification cleared');
        ToastService.info("Global verification has expired. Please verify again to view financial data.");
      } else if (type === 'record' && recordId) {
        const updatedRecords = { ...prev.records };
        delete updatedRecords[recordId];
        newState.records = updatedRecords;
        console.log(`Record ${recordId} verification cleared`);
      }

      localStorage.setItem('verificationState', JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Function to set up verification timers
  const setupVerificationTimers = useCallback(() => {
    const now = Date.now();

    // Clear existing timers first
    if (globalTimerRef.current) {
      clearTimeout(globalTimerRef.current);
      globalTimerRef.current = null;
    }

    Object.keys(recordTimersRef.current).forEach(id => {
      if (recordTimersRef.current[id]) {
        clearTimeout(recordTimersRef.current[id]);
        delete recordTimersRef.current[id];
      }
    });

    // Set global timer if verification is active
    if (verificationState.global?.verified && verificationState.global?.timestamp) {
      const timeLeft = VERIFICATION_TIMEOUT - (now - verificationState.global.timestamp);
      if (timeLeft > 0) {
        console.log(`Setting global timer for ${Math.round(timeLeft / 1000)} seconds`);
        globalTimerRef.current = setTimeout(() => {
          clearVerification('global');
        }, timeLeft);
      } else {
        // Already expired, clear immediately
        clearVerification('global');
      }
    }

    // Set individual record timers
    if (verificationState.records) {
      Object.keys(verificationState.records).forEach(id => {
        const record = verificationState.records[id];
        if (record?.timestamp) {
          const timeLeft = VERIFICATION_TIMEOUT - (now - record.timestamp);
          if (timeLeft > 0) {
            console.log(`Setting record timer for ${id} - ${Math.round(timeLeft / 1000)} seconds`);
            recordTimersRef.current[id] = setTimeout(() => {
              clearVerification('record', id);
            }, timeLeft);
          } else {
            // Already expired, clear immediately
            clearVerification('record', id);
          }
        }
      });
    }
  }, [verificationState, clearVerification]);

  // Set up timers whenever verification state changes
  useEffect(() => {
    setupVerificationTimers();

    // Cleanup function
    return () => {
      if (globalTimerRef.current) {
        clearTimeout(globalTimerRef.current);
        globalTimerRef.current = null;
      }
      Object.keys(recordTimersRef.current).forEach(id => {
        if (recordTimersRef.current[id]) {
          clearTimeout(recordTimersRef.current[id]);
          delete recordTimersRef.current[id];
        }
      });
    };
  }, [setupVerificationTimers]);

  // Cleanup timers on component unmount
  useEffect(() => {
    return () => {
      if (globalTimerRef.current) {
        clearTimeout(globalTimerRef.current);
      }
      Object.keys(recordTimersRef.current).forEach(id => {
        if (recordTimersRef.current[id]) {
          clearTimeout(recordTimersRef.current[id]);
        }
      });
    };
  }, []);

  useEffect(() => {
    dispatch(fetchPlacements());
  }, [dispatch]);

  const handleOpenDrawer = (placement = null) => {
    if (placement) {
      const originalPlacement = {
        ...placement,
        billRate: placement._originalBillRate || placement.billRate,
        payRate: placement._originalPayRate || placement.payRate,
        grossProfit: placement._originalGrossProfit || placement.grossProfit
      };
      dispatch(setSelectedPlacement(originalPlacement));
    } else {
      dispatch(setSelectedPlacement(null));
    }
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    dispatch(resetPlacementState());
  };

  const handleOpenDetailsDialog = (row) => {
    dispatch(setSelectedPlacement(row));
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    dispatch(setSelectedPlacement(null));
  };

  const handleOpenDeleteDialog = (row) => {
    setPlacementToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPlacementToDelete(null);
  };

  const handleDelete = () => {
    if (placementToDelete) {
      dispatch(deletePlacement(placementToDelete.id));
      handleCloseDeleteDialog();
    }
  };

  const handleOpenOtpDialog = (row = null, isGlobal = false) => {
    setCurrentRecord(row);
    setIsGlobalVerification(isGlobal);
    setOtpGenerated(false);
    setEnteredOtp("");
    setOtpError("");
    setOtpDialogOpen(true);
  };

  const handleCloseOtpDialog = () => {
    setOtpDialogOpen(false);
    setCurrentRecord(null);
    setIsGlobalVerification(false);
    setOtpGenerated(false);
    setEnteredOtp("");
    setOtpError("");
  };

  const handleRegisterUser = async (id) => {
  setIsLoading(true);
  try {
    const response = await httpService.post(
      `/candidate/${id}/create-user`
    );

    if (response.status === 200) {
      ToastService.success("Link has been sent to email.");

      // ✅ Update the table so icon disables
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === id ? { ...user, isRegistered: true } : user
        )
      );
    } else {
      ToastService.error(response.data?.message || "Failed to send Link.");
    }
  } catch (error) {
    ToastService.error(
      error.response?.data?.message || "Failed to send Link. Please try again."
    );
  } finally {
    setIsLoading(false);
  }
};


  const handleGenerateOtp = async () => {
    setIsLoading(true);
    try {
      const payload = {
        userId: userId,
        placementId: currentRecord?.id || null,
        newPlacement: false
      };
      const response = await httpService.post(`/candidate/generateOtp`, payload);

      if (response.data) {
        ToastService.success("OTP has been sent to your email.");
        setOtpGenerated(true);
      } else {
        ToastService.error(response.data.message || "Failed to send OTP.");
      }
    } catch (error) {
      ToastService.error(
        error.response?.data?.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    setOtpError("");

    try {
      const payload = {
        placementId: currentRecord?.id || null,
        userId: userId,
        otp: enteredOtp,
      };

      const response = await httpService.post("/candidate/verifyOtp", payload);

      if (response.data) {
        const now = Date.now();

        setVerificationState(prev => {
          const newState = { ...prev };

          if (isGlobalVerification) {
            newState.global = { verified: true, timestamp: now };
            console.log('Global verification set at:', new Date(now));
          } else {
            newState.records = {
              ...prev.records,
              [currentRecord.id]: { verified: true, timestamp: now }
            };
            console.log(`Record ${currentRecord.id} verification set at:`, new Date(now));
          }

          if (exportCallback) {
            exportCallback();
            setExportCallback(null);
          }

          localStorage.setItem('verificationState', JSON.stringify(newState));
          return newState;
        });

        setOtpDialogOpen(false);
        ToastService.success("OTP verified successfully! Access will expire in 5 minutes.");
      } else {
        setOtpError(response.data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setOtpError(
        error.response?.data?.message || "OTP verification failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getColor = (status) => {
    switch (status) {
      case "Active":
        return "success";
      case "On Hold":
        return "warning";
      case "Completed":
        return "info";
      case "Terminated":
        return "error";
      case "Cancelled":
        return "default";
      default:
        return "primary";
    }
  };

  const getColorForEmployeement = (type) => {
    switch (type) {
      case "W2":
        return "primary";
      case "C2C":
        return "secondary";
      case "Full-time":
        return "success";
      case "Part-time":
        return "warning";
      case "Contract":
        return "info";
      case "Contract-to-hire":
        return "error";
      default:
        return "default";
    }
  };

  const renderSensitiveField = useCallback((row, fieldName) => {
    const isGlobalVerified = verificationState.global?.verified;
    const isRecordVerified = verificationState.records?.[row.id]?.verified;

    if (isGlobalVerified || isRecordVerified) {
      const value = row[fieldName];
      if (typeof value === 'number' && !isNaN(value)) {
        return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
      }
      return value ? `₹${parseFloat(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "-";
    } else {
      return (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          ***
        </Typography>
      );
    }
  }, [verificationState]);

  const generateColumns = () => {
    return [
      {
        key: "id",
        label: "Placement ID",
        type: "text",
        sortable: true,
        filterable: true,
        width: 100,
      },
     {
  key: 'isRegister',
  label: "Register",
  sortable: true,
  filterable: true,
  width: 100,
  render: (row) => (
    <Tooltip title="Register">
      <span>
        <IconButton
          disabled={row.isRegister === true} // disable if already registered
          onClick={() => handleRegisterUser(row.id)}
        >
          {row.isRegister
            ? <HowToRegRounded sx={{ color: 'green' }} />
            : <PersonAdd sx={{ color: '#9e9e9e' }} />}
        </IconButton>
      </span>
    </Tooltip>
  )
},


      {
        key: "candidateFullName",
        label: "Consultant Name",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        key: "candidateEmailId",
        label: "Email",
        type: "text",
        sortable: true,
        filterable: true,
        width: 200,
      },
      {
        key: "candidateContactNo",
        label: "Phone",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        key: "technology",
        label: "Technology",
        type: "select",
        sortable: true,
        filterable: true,
        width: 130,
      },
      { key: "sales", label: "Sales", width: 130 },
      { key: "recruiterName", label: "Recruiter", width: 130 },
      {
        key: "clientName",
        label: "Client",
        type: "select",
        sortable: true,
        filterable: true,
        width: 130,
      },
      {
        key: "vendorName",
        label: "Vendor",
        type: "select",
        sortable: true,
        filterable: true,
        width: 130,
      },
      {
        key: "startDate",
        label: "Start Date",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        key: "endDate",
        label: "End Date",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        key: "billRate",
        label: "Bill Rate",
        type: "text",
        sortable: true,
        filterable: true,
        width: 130,
        render: (row) => renderSensitiveField(row, "billRate"),
      },
      {
        key: "payRate",
        label: "Pay Rate",
        type: "text",
        sortable: true,
        filterable: true,
        width: 130,
        render: (row) => renderSensitiveField(row, "payRate"),
      },
      {
        key: "grossProfit",
        label: "Gross Profit",
        type: "text",
        sortable: true,
        filterable: true,
        width: 130,
        render: (row) => renderSensitiveField(row, "grossProfit"),
      },
      {
        key: "employmentType",
        label: "Employment Type",
        type: "select",
        sortable: true,
        filterable: true,
        width: 150,
        render: (row) => {
          const type = row.employmentType;
          return (
            <Chip
              label={type}
              color={getColorForEmployeement(type)}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          );
        },
      },
      {
        key: "status",
        label: "Status",
        width: 120,
        sortable: true,
        filterable: true,
        render: (row) => {
          const status = row.status;
          return (
            <Chip
              label={status}
              color={getColor(status)}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          );
        },
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        filterable: false,
        width: 150,
        align: "center",
        render: (row) => (
          <Box
            sx={{ display: "flex", justifyContent: "center", gap: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip title="View">
              <IconButton
                color="info"
                size="small"
                onClick={() => handleOpenDetailsDialog(row)}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                color="primary"
                size="small"
                onClick={() => handleOpenDrawer(row)}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                color="error"
                size="small"
                onClick={() => handleOpenDeleteDialog(row)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ];
  };

  const getDeleteConfirmationContent = () => {
    if (!placementToDelete) return "This action cannot be undone.";

    return (
      <>
        Are you sure you want to delete this placement? This action cannot be
        undone.
        <Typography variant="body2">
          <strong>ID:</strong> {placementToDelete.id}
        </Typography>
        <Typography variant="body2">
          <strong>Consultant:</strong> {placementToDelete.candidateFullName}
        </Typography>
      </>
    );
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          flexWrap: "wrap",
          mb: 3,
          justifyContent: "space-between",
          p: 2,
          backgroundColor: "#f9f9f9",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h6" color="primary">
          Placement Management
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ ml: "auto" }}
        >
          <DateRangeFilter component="placements" />
          <Button
            variant="contained"
            color="secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenOtpDialog(null, true);
            }}
            startIcon={<LockOpen />}
            sx={{
              bgcolor: verificationState.global?.verified ? 'success.main' : 'secondary.main',
              '&:hover': {
                bgcolor: verificationState.global?.verified ? 'success.dark' : 'secondary.dark'
              }
            }}
          >
            {verificationState.global?.verified ? 'OTP Verified' : 'Verify OTP'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDrawer()}
          >
            Add Placement
          </Button>
        </Stack>
      </Stack>

      <DataTable
        data={processedPlacements}
        columns={generateColumns()}
        pageLimit={20}
        title=""
        refreshData={() => {
          // Clear all timers when refreshing
          if (globalTimerRef.current) {
            clearTimeout(globalTimerRef.current);
            globalTimerRef.current = null;
          }
          Object.keys(recordTimersRef.current).forEach(id => {
            if (recordTimersRef.current[id]) {
              clearTimeout(recordTimersRef.current[id]);
              delete recordTimersRef.current[id];
            }
          });

          localStorage.removeItem('verificationState');
          setVerificationState({
            global: { verified: false, timestamp: null },
            records: {}
          });
          dispatch(fetchPlacements());
        }}
        isRefreshing={loading}
        enableSelection={false}
        defaultSortColumn="id"
        defaultSortDirection="desc"
        noDataMessage={
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Records Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No placement records found.
            </Typography>
          </Box>
        }
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
        uniqueId="id"
        enableFinancialValidation={true}
        isFinancialVerified={verificationState.global?.verified}
        onRequestOtpVerification={handleRequestExportVerification}
      />

      {/* Form Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: "80%", md: "50%" },
            maxWidth: "800px",
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              borderBottom: "1px solid #eee",
              pb: 2,
            }}
          >
            <Typography variant="h5" component="h2">
              {selectedPlacement ? "Edit Placement" : "Add New Placement"}
            </Typography>
            <IconButton
              onClick={handleCloseDrawer}
              aria-label="close"
              sx={{
                color: (theme) => theme.palette.grey[500],
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.action.hover,
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: "auto" }}>
            <PlacementForm
              initialValues={selectedPlacement || {}}
              onCancel={handleCloseDrawer}
              isEdit={!!selectedPlacement}
            />
          </Box>
        </Box>
      </Drawer>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #eee",
            pb: 2,
          }}
        >
          <Typography variant="h5">Placement Details</Typography>
          <IconButton
            onClick={handleCloseDetailsDialog}
            aria-label="close"
            sx={{
              color: (theme) => theme.palette.grey[500],
              "&:hover": {
                backgroundColor: (theme) => theme.palette.action.hover,
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          {selectedPlacement && <PlacementCard data={selectedPlacement} />}
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid #eee", py: 2, px: 3 }}>
          <Button onClick={handleCloseDetailsDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog
        open={otpDialogOpen}
        onClose={handleCloseOtpDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: "400px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #eee",
            pb: 2,
          }}
        >
          <Typography variant="h6">
            {isGlobalVerification ? "Global Access Verification" : "Verify Access"}
          </Typography>
          <IconButton
            onClick={handleCloseOtpDialog}
            aria-label="close"
            sx={{
              color: (theme) => theme.palette.grey[500],
              "&:hover": {
                backgroundColor: (theme) => theme.palette.action.hover,
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 3 }}>
            {isGlobalVerification
              ? "To view all sensitive financial information across all records, please generate and verify an OTP."
              : "To view sensitive financial information, please generate and verify an OTP."
            }
          </Typography>

          {otpGenerated ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                An OTP has been sent to your registered device. Please enter it below:
              </Typography>
              <TextField
                fullWidth
                label="Enter OTP"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                error={!!otpError}
                helperText={otpError}
                margin="normal"
                inputProps={{ maxLength: 6 }}
                placeholder="6-digit OTP"
              />
            </Box>
          ) : (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Click the button below to generate a one-time password.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid #eee", py: 2, px: 3 }}>
          {otpGenerated ? (
            <Button
              onClick={handleVerifyOtp}
              color="primary"
              variant="contained"
              disabled={isLoading || enteredOtp.length !== 6}
            >
              {isLoading ? <CircularProgress size={24} /> : "Verify OTP"}
            </Button>
          ) : (
            <Button
              onClick={handleGenerateOtp}
              color="primary"
              variant="contained"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : "Generate OTP"}
            </Button>
          )}
          <Button onClick={handleCloseOtpDialog} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Confirm Deletion"
        content={getDeleteConfirmationContent()}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default PlacementsList;