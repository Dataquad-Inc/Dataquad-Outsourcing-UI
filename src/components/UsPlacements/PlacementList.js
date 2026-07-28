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
  ButtonGroup,
  Tab,
  Tabs,
  Card,
  CardContent,
  Avatar,
  Divider,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  Collapse,
} from "@mui/material";
import {
  Edit,
  Visibility,
  Delete,
  Add,
  Close,
  PersonAdd,
  HowToRegRounded,
  FilterList,
  Clear,
  Search,
  Business,
  AttachMoney,
  Person,
  ExpandLess,
  Dashboard,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";

import CustomDataTable from "../../ui-lib/CustomDataTable";
import PlacementForm from "./PlacementForm";
import PlacementCard from "./PlacementCard";
import ConfirmDialog from "../muiComponents/ConfirmDialog";
import {
  fetchUsPlacements,
  fetchUsPlacementCounts,
  deleteUsPlacement,
  setSelectedPlacement,
  resetPlacementState,
} from "../../redux/placementSlice";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import CryptoJS from "crypto-js";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";

// Tab panel component
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

// Dashboard Card component
const DashboardCard = ({ title, count, icon, color, subtitle }) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
        },
        borderLeft: `4px solid ${color}`,
        backgroundColor: 'white',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, mr: 2 }}>
            {icon}
          </Avatar>
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {count}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle || 'Placements'}
        </Typography>
      </CardContent>
    </Card>
  );
};

const PlacementsList = () => {
  const dispatch = useDispatch();
  const {
    usPlacements,
    usPlacementsPagination,
    usPlacementCounts,
    loading,
    selectedPlacement,
  } = useSelector(
    (state) => state.placement
  );

  console.log("Placements data from Redux:", usPlacements);  

  const { userId, encryptionKey } = useSelector((state) => state.auth);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [placementToDelete, setPlacementToDelete] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter states
  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredPlacements, setFilteredPlacements] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [keyword, setSearch] = useState("");
  const [tableFilters, setTableFilters] = useState({});

  // Dashboard states
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardTabValue, setDashboardTabValue] = useState(0);
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState("");
  const [dashboardData, setDashboardData] = useState({
    clients: [],
    vendors: [],
    sales: [],
    recruiters: []
  });

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
    if (!Array.isArray(usPlacements)) {
      console.error("usPlacements is not an array:", usPlacements);
      return [];
    }

    return usPlacements.map((placement) => {
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
  }, [usPlacements]);

  // Extract dashboard data from placements
  useEffect(() => {
    if (processedPlacements.length > 0) {
      // Extract unique clients
      const clientMap = new Map();
      processedPlacements.forEach(p => {
        if (p.clientName) {
          const key = p.clientName.trim();
          if (!clientMap.has(key)) {
            clientMap.set(key, { name: key, count: 0 });
          }
          clientMap.get(key).count += 1;
        }
      });

      // Extract unique vendors
      const vendorMap = new Map();
      processedPlacements.forEach(p => {
        if (p.vendorName) {
          const key = p.vendorName.trim();
          if (!vendorMap.has(key)) {
            vendorMap.set(key, { name: key, count: 0 });
          }
          vendorMap.get(key).count += 1;
        }
      });

      // Extract unique sales persons
      const salesMap = new Map();
      processedPlacements.forEach(p => {
        if (p.sales) {
          const key = p.sales.trim();
          if (!salesMap.has(key)) {
            salesMap.set(key, { name: key, count: 0 });
          }
          salesMap.get(key).count += 1;
        }
      });

      // Extract unique recruiters
      const recruiterMap = new Map();
      processedPlacements.forEach(p => {
        if (p.recruiterName) {
          const key = p.recruiterName.trim();
          if (!recruiterMap.has(key)) {
            recruiterMap.set(key, { name: key, count: 0 });
          }
          recruiterMap.get(key).count += 1;
        }
      });

      setDashboardData({
        clients: Array.from(clientMap.values()).sort((a, b) => b.count - a.count),
        vendors: Array.from(vendorMap.values()).sort((a, b) => b.count - a.count),
        sales: Array.from(salesMap.values()).sort((a, b) => b.count - a.count),
        recruiters: Array.from(recruiterMap.values()).sort((a, b) => b.count - a.count)
      });
    }
  }, [processedPlacements]);

  // Filter placements based on active filter - LOCAL FILTERING
  useEffect(() => {
    let filtered = [...processedPlacements];

    switch (activeFilter) {
      case "active":
        filtered = processedPlacements.filter(
          (placement) =>
            placement.status === "Active" &&
            placement.employmentType !== "Full-time"
        );
        break;
      case "inactive":
        filtered = processedPlacements.filter(
          (placement) =>
            placement.status !== "Active" &&
            placement.employmentType !== "Full-time" && placement.status !== "Pending"
        );
        break;
      case "fulltime":
        filtered = processedPlacements.filter(
          (placement) => placement.employmentType === "Full-time"
        );
        break;
      case "pending":
        filtered = processedPlacements.filter(
          (placement) =>
            String(placement.status || "").toLowerCase() === "pending" &&
            placement.employmentType !== "Full-time"
        );
        break;
      default:
        filtered = processedPlacements;
        break;
    }

    setFilteredPlacements(filtered);
  }, [processedPlacements, activeFilter]);

  // Fetch all placements once when component mounts
  useEffect(() => {
    dispatch(fetchUsPlacements({ page: 0, size: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchUsPlacementCounts());
  }, [dispatch]);

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    setPage(0);
    setSearch("");
    setTableFilters({});
  };

  const getFilterButtonColor = (filterType) => {
    return activeFilter === filterType ? "contained" : "outlined";
  };

  const getFilterCount = (filterType) => {
    switch (filterType) {
      case "active":
        return processedPlacements.filter(
          (placement) =>
            placement.status === "Active" &&
            placement.employmentType !== "Full-time"
        ).length;
      case "inactive":
        return processedPlacements.filter(
          (placement) =>
            placement.status !== "Active" &&
            placement.employmentType !== "Full-time"
        ).length;
      case "fulltime":
        return processedPlacements.filter(
          (placement) => placement.employmentType === "Full-time"
        ).length;
      case "pending":
        return processedPlacements.filter(
          (placement) =>
            String(placement.status || "").toLowerCase() === "pending" &&
            placement.employmentType !== "Full-time"
        ).length;
      default:
        return processedPlacements.length;
    }
  };

  const handleDashboardTabChange = (event, newValue) => {
    setDashboardTabValue(newValue);
    setDashboardSearchQuery("");
  };

  const toggleDashboard = () => {
    setShowDashboard(!showDashboard);
  };

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
      dispatch(deleteUsPlacement(placementToDelete.id));
      handleCloseDeleteDialog();
      setTimeout(() => {
        dispatch(fetchUsPlacements({ page: 0, size: 1000 }));
        dispatch(fetchUsPlacementCounts());
      }, 500);
    }
  };

  const handleRegisterUser = async (id) => {
    setIsLoading(true);

    try {
      ToastService.loading("Sending Link...", {
        toastId: "sendLink",
        autoClose: false,
      });

      const response = await httpService.post(`/candidate/${id}/create-user`);

      if (response.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === id ? { ...user, isRegistered: true } : user
          )
        );

        ToastService.dismiss("sendLink");
        ToastService.success("Link has been sent to email.", {
          autoClose: 4000,
        });
        dispatch(fetchUsPlacements({ page: 0, size: 1000 }));
      }
    } catch (error) {
      ToastService.dismiss("sendLink");
      ToastService.error(
        error?.response?.data?.message ||
        "Failed to send Link. Please try again.",
        { autoClose: 4000 }
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
      case "c2c":
        return "primary";
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

  const renderFinancialField = (row, fieldName) => {
    const value = row[fieldName];
    if (typeof value === "number" && !isNaN(value)) {
      return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    }
    return value
      ? `$${parseFloat(value).toLocaleString("en-US", {
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
        label: "Contact No",
        type: "text",
        sortable: true,
        filterable: true,
        width: 140,
        render: (row) =>
          row.candidateContactNo || row.contactNumber || row.mobileNumber || "-",
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
        key: "projectIn",
        label: "Project In",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        key: "visa",
        label: "Visa",
        type: "text",
        sortable: true,
        filterable: true,
        width: 100,
      },
      {
        key: "projectInC2cSubVendorName",
        label: "Project In/C2C Sub-Vendor Name",
        type: "text",
        sortable: true,
        filterable: true,
        width: 180,
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
        key: "holdRate",
        label: "Hold Rate",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
        render: (row) => renderFinancialField(row, "holdRate"),
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
        key: "referal",
        label: "Referral",
        type: "text",
        sortable: true,
        filterable: true,
        width: 120,
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

  const customTableColumns = React.useMemo(
    () =>
      generateColumns().map((column) => ({
        ...column,
        id: column.key,
        filterType: column.type === "select" ? "select" : "text",
        applyFilter: column.filterable === true,
        render: column.render ? (_value, row) => column.render(row) : undefined,
      })),
    []
  );

  // Apply search and table filters to filtered placements
  const tableFilteredPlacements = React.useMemo(() => {
    let result = [...filteredPlacements];

    if (keyword.trim()) {
      const query = keyword.trim().toLowerCase();
      result = result.filter((placement) =>
        customTableColumns.some((column) => {
          if (column.id === "actions") return false;
          const value = placement[column.id];
          return value !== null &&
            value !== undefined &&
            String(value).toLowerCase().includes(query);
        })
      );
    }

    Object.entries(tableFilters).forEach(([field, filter]) => {
      const value = filter?.value;
      if (value === "" || value === null || value === undefined) return;

      result = result.filter((placement) => {
        const rowValue = placement[field];
        if (rowValue === null || rowValue === undefined) return false;
        return String(rowValue)
          .toLowerCase()
          .includes(String(value).toLowerCase());
      });
    });

    return result;
  }, [filteredPlacements, keyword, tableFilters, customTableColumns]);

  const totalPlacements = tableFilteredPlacements.length;

  useEffect(() => {
    const totalPages = Math.ceil(totalPlacements / rowsPerPage);
    if (page > 0 && page >= totalPages) {
      setPage(0);
    }
  }, [totalPlacements, rowsPerPage, page]);

  const handlePageChange = (_event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleSearchClear = () => {
    setSearch("");
    setPage(0);
  };

  const handleTableFiltersChange = (newFilters) => {
    setTableFilters(newFilters);
    setPage(0);
  };

  const paginatedData = React.useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return tableFilteredPlacements.slice(start, end);
  }, [tableFilteredPlacements, page, rowsPerPage]);

  const getDashboardCardColor = (index) => {
    const colors = [
      "#1976d2", "#2e7d32", "#ed6c02", "#9c27b0",
      "#d32f2f", "#00838f", "#4a148c", "#bf360c",
      "#1a237e", "#004d40", "#4e342e", "#3e2723"
    ];
    return colors[index % colors.length];
  };

  const getDashboardTabLabel = (index) => {
    const labels = ['clients', 'vendors', 'sales', 'recruiters'];
    return labels[index] || '';
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
          US Placement Management
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

      {/* Filter Buttons */}
      <Box
        sx={{
          mb: 2,
          p: 2,
          backgroundColor: "#ffffff",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ flexWrap: "wrap", gap: 1 }}
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
            <FilterList fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />
            Filter by:
          </Typography>

          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={getFilterButtonColor("all")}
              onClick={() => handleFilterChange("all")}
              sx={{ minWidth: 80 }}
            >
              All ({getFilterCount("all")})
            </Button>

            <Button
              variant={getFilterButtonColor("active")}
              color="success"
              onClick={() => handleFilterChange("active")}
              sx={{ minWidth: 100 }}
            >
              Active ({getFilterCount("active")})
            </Button>

            <Button
              variant={getFilterButtonColor("inactive")}
              color="warning"
              onClick={() => handleFilterChange("inactive")}
              sx={{ minWidth: 110 }}
            >
              Inactive ({getFilterCount("inactive")})
            </Button>

            <Button
              variant={getFilterButtonColor("fulltime")}
              color="info"
              onClick={() => handleFilterChange("fulltime")}
              sx={{ minWidth: 110 }}
            >
              Full-time ({getFilterCount("fulltime")})
            </Button>

            <Button
              variant={getFilterButtonColor("pending")}
              color="warning"
              onClick={() => handleFilterChange("pending")}
              sx={{ minWidth: 100 }}
            >
              Pending ({getFilterCount("pending")})
            </Button>
          </ButtonGroup>

          {/* Dashboard Button */}
          <Button
            variant="outlined"
            color="inherit"
            size="medium"
            startIcon={showDashboard ? <ExpandLess sx={{ color: '#000' }} /> : <Dashboard sx={{ color: '#000' }} />}
            onClick={toggleDashboard}
            sx={{ 
              ml: 1,
              fontWeight: 'bold',
              color: '#000000',
              borderColor: '#000000',
              '&:hover': {
                borderColor: '#000000',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              '& .MuiButton-startIcon': {
                color: '#000000',
              }
            }}
          >
            {showDashboard ? "Hide" : "Dashboard"}
          </Button>

          {activeFilter !== "all" && (
            <Button
              variant="text"
              size="small"
              startIcon={<Clear />}
              onClick={() => handleFilterChange("all")}
              sx={{ color: "text.secondary" }}
            >
              Clear Filter
            </Button>
          )}
        </Stack>

        {/* Filter Description */}
        {activeFilter !== "all" && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, fontStyle: "italic" }}
          >
            {activeFilter === "active" &&
              "Showing active placements (excludes full-time employment)"
            }
            {activeFilter === "inactive" &&
              "Showing inactive placements (excludes full-time employment)"
            }
            {activeFilter === "fulltime" &&
              "Showing all full-time placements (active and inactive)"
            }
            {activeFilter === "pending" &&
              "Showing pending placements (excludes full-time employment)"
            }
          </Typography>
        )}
      </Box>

      {/* Conditionally render either Dashboard or Table */}
      {showDashboard ? (
        // Dashboard Panel
        <Paper sx={{ p: 0, borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
        
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={dashboardTabValue} 
              onChange={handleDashboardTabChange}
              aria-label="dashboard tabs"
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  fontWeight: 'bold',
                  py: 1,
                }
              }}
            >
              <Tab 
                icon={<Business />} 
                label={`Clients (${dashboardData.clients.length})`} 
                iconPosition="start"
              />
              <Tab 
                icon={<Business />} 
                label={`Vendors (${dashboardData.vendors.length})`} 
                iconPosition="start"
              />
              <Tab 
                icon={<AttachMoney />} 
                label={`Sales (${dashboardData.sales.length})`} 
                iconPosition="start"
              />
              <Tab 
                icon={<Person />} 
                label={`Recruiters (${dashboardData.recruiters.length})`} 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Search input for filtering cards */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={`Search ${getDashboardTabLabel(dashboardTabValue)}...`}
              value={dashboardSearchQuery}
              onChange={(e) => setDashboardSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: dashboardSearchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setDashboardSearchQuery("")}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Dashboard Cards */}
          <TabPanel value={dashboardTabValue} index={0}>
            <Grid container spacing={2}>
              {dashboardData.clients
                .filter(item => 
                  item.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase())
                )
                .map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.name}>
                    <DashboardCard
                      title={item.name}
                      count={item.count}
                      icon={<Business />}
                      color={getDashboardCardColor(index)}
                      subtitle="Placements"
                    />
                  </Grid>
                ))}
              {dashboardData.clients.filter(item => 
                item.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase())
              ).length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No clients found matching your search.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={dashboardTabValue} index={1}>
            <Grid container spacing={2}>
              {dashboardData.vendors
                .filter(item => 
                  item.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase())
                )
                .map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.name}>
                    <DashboardCard
                      title={item.name}
                      count={item.count}
                      icon={<Business />}
                      color={getDashboardCardColor(index)}
                      subtitle="Placements"
                    />
                  </Grid>
                ))}
              {dashboardData.vendors.filter(item => 
                item.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase())
              ).length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No vendors found matching your search.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={dashboardTabValue} index={2}>
            <Grid container spacing={2}>
              {dashboardData.sales
                .filter(item => 
                  item.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase())
                )
                .map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.name}>
                    <DashboardCard
                      title={item.name}
                      count={item.count}
                      icon={<AttachMoney />}
                      color={getDashboardCardColor(index)}
                      subtitle="Placements"
                    />
                  </Grid>
                ))}
              {dashboardData.sales.filter(item => 
                item.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase())
              ).length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No sales persons found matching your search.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={dashboardTabValue} index={3}>
            <Grid container spacing={2}>
              {dashboardData.recruiters
                .filter(item => 
                  item.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase())
                )
                .map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.name}>
                    <DashboardCard
                      title={item.name}
                      count={item.count}
                      icon={<Person />}
                      color={getDashboardCardColor(index)}
                      subtitle="Placements"
                    />
                  </Grid>
                ))}
              {dashboardData.recruiters.filter(item => 
                item.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase())
              ).length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No recruiters found matching your search.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </TabPanel>
        </Paper>
      ) : (
        // Data Table
        <CustomDataTable
          rows={paginatedData}
          columns={customTableColumns}
          total={totalPlacements}
          page={page}
          rowsPerPage={rowsPerPage}
          search={keyword}
          title=""
          loading={loading}
          filters={tableFilters}
          filterStorageKey="us_placements_filters"
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onSearchChange={handleSearchChange}
          onSearchClear={handleSearchClear}
          onRefresh={() => {
            dispatch(fetchUsPlacements({ page: 0, size: 1000 }));
            dispatch(fetchUsPlacementCounts());
          }}
          onFiltersChange={handleTableFiltersChange}
        />
      )}

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