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
  Badge,
} from "@mui/material";
import {
  Edit,
  Visibility,
  Delete,
  Add,
  Close,
  PersonAdd,
  HowToRegRounded,
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

const PlacementsList = () => {
  const dispatch = useDispatch();
  const { placements, loading, selectedPlacement } = useSelector(
    (state) => state.placement
  );
  const { userId, encryptionKey } = useSelector((state) => state.auth);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [placementToDelete, setPlacementToDelete] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const decoded = atob(encryptionKey);
  const FINANCIAL_SECRET_KEY = decoded;

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

  // Process placements data to decrypt financial fields
  const processedPlacements = React.useMemo(() => {
    // Check if placements is an array before calling map
    if (!Array.isArray(placements)) {
      console.error("placements is not an array:", placements);
      return [];
    }

    return placements.map((placement) => {
      const decryptedBillRate = decryptFinancialValue(placement.billRate);
      const decryptedPayRate = decryptFinancialValue(placement.payRate);
      const calculatedGrossProfit = decryptedBillRate - decryptedPayRate;

      return {
        ...placement,
        _originalBillRate: placement.billRate,
        _originalPayRate: placement.payRate,
        _originalGrossProfit: placement.grossProfit,
        billRate: decryptedBillRate,
        payRate: decryptedPayRate,
        grossProfit: calculatedGrossProfit,
      };
    });
  }, [placements]);

  useEffect(() => {
    dispatch(fetchPlacements());
  }, [dispatch]);

  const handleOpenDrawer = (placement = null) => {
    if (placement) {
      const originalPlacement = {
        ...placement,
        billRate: placement._originalBillRate || placement.billRate,
        payRate: placement._originalPayRate || placement.payRate,
        grossProfit: placement._originalGrossProfit || placement.grossProfit,
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

  const handleRegisterUser = async (id) => {
    setIsLoading(true);
    try {
      const response = await httpService.post(`/candidate/${id}/create-user`);

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
        error.response?.data?.message ||
          "Failed to send Link. Please try again."
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

  // Always show financial data without OTP verification
  const renderFinancialField = (row, fieldName) => {
    const value = row[fieldName];
    if (typeof value === "number" && !isNaN(value)) {
      return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    }
    return value
      ? `₹${parseFloat(value).toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })}`
      : "-";
  };

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
        key: "isRegister",
        label: "Register",
        sortable: true,
        filterable: true,
        width: 100,
        render: (row) => {
          const isFullyActive = row.login === true && row.isRegister === true;
          const isRegisteredOnly =
            row.isRegister === true && row.login !== true;

          let iconColor = "green"; // default green
          if (isFullyActive || isRegisteredOnly) {
            iconColor = "blue"; // blue if registered (whether logged in or not)
          }

          return (
            <Tooltip title="Register">
              <span>
                <IconButton
                  disabled={!row.isRegister} // disable if not registered
                  onClick={() => handleRegisterUser(row.id)}
                >
                  {row.isRegister ? (
                    <HowToRegRounded sx={{ color: iconColor }} />
                  ) : (
                    <PersonAdd sx={{ color: "green" }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          );
        },
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
        render: (row) => renderFinancialField(row, "billRate"),
      },
      {
        key: "payRate",
        label: "Pay Rate",
        type: "text",
        sortable: true,
        filterable: true,
        width: 130,
        render: (row) => renderFinancialField(row, "payRate"),
      },
      {
        key: "grossProfit",
        label: "Gross Profit",
        type: "text",
        sortable: true,
        filterable: true,
        width: 130,
        render: (row) => renderFinancialField(row, "grossProfit"),
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
        type: "select",
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
