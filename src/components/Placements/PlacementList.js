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
  CardHeader,
  Avatar,
  Divider,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
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
  People,
  AttachMoney,
  Person,
  ExpandMore,
  ExpandLess,
  FilterAlt,
  Dashboard,
  ArrowBack,
  Email,
  Phone,
  Work,
  LocationOn,
  Home,
  NavigateNext,
  CheckCircle,
  Cancel,
  Lock,
  LockOpen,
  AttachFile,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

import DataTable from "../muiComponents/DataTabel";
import PlacementForm from "./PlacementForm";
import PlacementCard from "./PlacementCard";
import ConfirmDialog from "../muiComponents/ConfirmDialog";
import LockConfirmDialog from "../muiComponents/LockConfirmDialog";
import DocumentManager from "./DocumentManager"; // Import the new component
import {
  fetchPlacements,
  deletePlacement,
  setSelectedPlacement,
  resetPlacementState,
  lockPlacement,
} from "../../redux/placementSlice";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import CryptoJS from "crypto-js";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import ExportButton from "../../utils/ExportButton";

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

// Dashboard Card component with click handler
const DashboardCard = ({ title, count, icon, color, subtitle, onClick, isActive = false }) => {
  return (
    <Card 
      onClick={onClick}
      sx={{ 
        height: '100%',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
          borderColor: color,
        },
        border: `2px solid ${isActive ? color : 'transparent'}`,
        backgroundColor: isActive ? `${color}10` : 'white',
        position: 'relative',
        '&::after': isActive ? {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 20px 20px 0',
          borderColor: `transparent ${color} transparent transparent`,
        } : {},
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, mr: 2 }}>
            {icon}
          </Avatar>
          <Typography 
            variant="subtitle1" 
            fontWeight="bold" 
            noWrap
            sx={{ 
              flex: 1,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {count}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle || 'Placements'}
        </Typography>
        <Typography
          variant="caption"
          color="primary"
          sx={{ 
            mt: 1.5, 
            display: "block", 
            opacity: 0.75,
            fontWeight: 500,
          }}
        >
          Click to view candidates →
        </Typography>
      </CardContent>
    </Card>
  );
};

// ─── Candidate Table Page Component ────────────────────────────────────────
const CandidateTablePage = ({ 
  title, 
  placements, 
  type,
  categoryName,
  onBack,
  tableStatusFilter,
  onTableStatusFilterChange,
}) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('candidateFullName');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState(tableStatusFilter || 'active');

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "success";
      case "On Hold": return "warning";
      case "Completed": return "info";
      case "Terminated": return "error";
      case "Cancelled": return "default";
      default: return "primary";
    }
  };

  const getEmploymentColor = (type) => {
    switch (type) {
      case "W2": return "primary";
      case "c2c": return "primary";
      case "Full-time": return "success";
      case "Part-time": return "warning";
      case "Contract": return "info";
      case "Contract-to-hire": return "error";
      default: return "default";
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setStatusFilter(newFilter);
      setPage(0);
      if (onTableStatusFilterChange) {
        onTableStatusFilterChange(newFilter);
      }
    }
  };

  // Filter placements by search and status
  const filteredPlacements = React.useMemo(() => {
    let filtered = [...placements];
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(p => 
        p.candidateFullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.candidateEmailId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.technology?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sales?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.recruiterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vendorName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter - Toggle buttons for Active/Inactive
    if (statusFilter === 'active') {
      filtered = filtered.filter(p => p.status === 'Active');
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(p => p.status !== 'Active');
    }
    
    return filtered;
  }, [placements, searchQuery, statusFilter]);

  // Sort placements
  const sortedPlacements = React.useMemo(() => {
    const comparator = (a, b) => {
      if (a[orderBy] < b[orderBy]) {
        return order === 'asc' ? -1 : 1;
      }
      if (a[orderBy] > b[orderBy]) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    };
    return [...filteredPlacements].sort(comparator);
  }, [filteredPlacements, order, orderBy]);

  // Paginate placements
  const paginatedPlacements = sortedPlacements.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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

  // Get status counts
  const getStatusCounts = React.useMemo(() => {
    const counts = {
      active: placements.filter(p => p.status === 'Active').length,
      inactive: placements.filter(p => p.status !== 'Active').length,
    };
    return counts;
  }, [placements]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs 
        separator={<NavigateNext fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={onBack}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          {title}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        pb: 2,
        borderBottom: '1px solid #eee'
      }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredPlacements.length} {filteredPlacements.length === 1 ? 'Placement' : 'Placements'} for this {type}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={onBack}
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Toggle Buttons - Only Active and Inactive */}
      <Box sx={{ 
        mb: 2, 
        p: 1.5, 
        backgroundColor: '#f5f5f5', 
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2
      }}>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={handleStatusFilterChange}
          aria-label="status filter"
          size="medium"
          sx={{
            '& .MuiToggleButton-root': {
              px: 4,
              py: 1.5,
              borderRadius: 2,
              minWidth: 120,
              '&.Mui-selected': {
                fontWeight: 'bold',
              },
            },
            '& .MuiToggleButtonGroup-grouped': {
              border: '1px solid rgba(0, 0, 0, 0.12)',
              '&:not(:first-of-type)': {
                borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
              },
            },
          }}
        >
          <ToggleButton 
            value="active" 
            aria-label="active"
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#2e7d32',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1b5e20',
                },
              },
            }}
          >
            <CheckCircle sx={{ mr: 1, fontSize: 20 }} />
            Active ({getStatusCounts.active})
          </ToggleButton>
          <ToggleButton 
            value="inactive" 
            aria-label="inactive"
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#d32f2f',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#c62828',
                },
              },
            }}
          >
            <Cancel sx={{ mr: 1, fontSize: 20 }} />
            Inactive ({getStatusCounts.inactive})
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search candidates by name, email, technology, sales, recruiter, client, or vendor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery("")}>
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'background.paper',
            }
          }}
        />
      </Box>

      {/* Table */}
      {filteredPlacements.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {searchQuery 
              ? 'No placements found matching your search.' 
              : `No ${statusFilter} placements found for this category.`}
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'candidateFullName'}
                      direction={orderBy === 'candidateFullName' ? order : 'asc'}
                      onClick={() => handleRequestSort('candidateFullName')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Consultant
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'candidateEmailId'}
                      direction={orderBy === 'candidateEmailId' ? order : 'asc'}
                      onClick={() => handleRequestSort('candidateEmailId')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Email
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'candidateContactNo'}
                      direction={orderBy === 'candidateContactNo' ? order : 'asc'}
                      onClick={() => handleRequestSort('candidateContactNo')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Phone
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'technology'}
                      direction={orderBy === 'technology' ? order : 'asc'}
                      onClick={() => handleRequestSort('technology')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Technology
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'sales'}
                      direction={orderBy === 'sales' ? order : 'asc'}
                      onClick={() => handleRequestSort('sales')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Sales
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'recruiterName'}
                      direction={orderBy === 'recruiterName' ? order : 'asc'}
                      onClick={() => handleRequestSort('recruiterName')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Recruiter
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'teamLead'}
                      direction={orderBy === 'teamLead' ? order : 'asc'}
                      onClick={() => handleRequestSort('teamLead')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Team Lead
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'clientName'}
                      direction={orderBy === 'clientName' ? order : 'asc'}
                      onClick={() => handleRequestSort('clientName')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Client
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'vendorName'}
                      direction={orderBy === 'vendorName' ? order : 'asc'}
                      onClick={() => handleRequestSort('vendorName')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Vendor
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'company'}
                      direction={orderBy === 'company' ? order : 'asc'}
                      onClick={() => handleRequestSort('company')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Company
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'startDate'}
                      direction={orderBy === 'startDate' ? order : 'asc'}
                      onClick={() => handleRequestSort('startDate')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Start Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'endDate'}
                      direction={orderBy === 'endDate' ? order : 'asc'}
                      onClick={() => handleRequestSort('endDate')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      End Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'currency'}
                      direction={orderBy === 'currency' ? order : 'asc'}
                      onClick={() => handleRequestSort('currency')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Currency
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'ratePeriod'}
                      direction={orderBy === 'ratePeriod' ? order : 'asc'}
                      onClick={() => handleRequestSort('ratePeriod')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Rate Period
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'billRate'}
                      direction={orderBy === 'billRate' ? order : 'asc'}
                      onClick={() => handleRequestSort('billRate')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Bill Rate
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'payRate'}
                      direction={orderBy === 'payRate' ? order : 'asc'}
                      onClick={() => handleRequestSort('payRate')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Pay Rate
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'employmentType'}
                      direction={orderBy === 'employmentType' ? order : 'asc'}
                      onClick={() => handleRequestSort('employmentType')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Employment Type
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => handleRequestSort('status')}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPlacements.map((placement, index) => (
                  <TableRow 
                    key={placement.id || index}
                    hover
                    sx={{
                      '&:nth-of-type(odd)': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.75rem' }}>
                        {placement.candidateFullName || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {placement.candidateEmailId || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {placement.candidateContactNo || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Chip
                        label={placement.technology || 'N/A'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: '20px' }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {placement.sales || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {placement.recruiterName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {placement.teamLead || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {placement.clientName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {placement.vendorName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {placement.company || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {placement.startDate || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {placement.endDate || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {placement.currency || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {placement.ratePeriod || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" fontWeight="medium" color="primary" sx={{ fontSize: '0.75rem' }}>
                        {renderFinancialField(placement, 'billRate')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="body2" fontWeight="medium" color="success.main" sx={{ fontSize: '0.75rem' }}>
                        {renderFinancialField(placement, 'payRate')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Chip
                        label={placement.employmentType || 'N/A'}
                        color={getEmploymentColor(placement.employmentType)}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: '20px' }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>
                      <Chip
                        label={placement.status || 'N/A'}
                        color={getStatusColor(placement.status)}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: '20px' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredPlacements.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiTablePagination-select': {
                fontSize: '0.75rem',
              }
            }}
          />
        </Paper>
      )}
    </Box>
  );
};

const PlacementsList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { placements, loading, selectedPlacement } = useSelector(
    (state) => state.placement
  );
  const { userId, encryptionKey, role } = useSelector((state) => state.auth);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [placementToDelete, setPlacementToDelete] = useState(null);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [placementToLock, setPlacementToLock] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Document Manager states
  const [documentManagerOpen, setDocumentManagerOpen] = useState(false);
  const [selectedPlacementForDocs, setSelectedPlacementForDocs] = useState(null);

  // Filter states
  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredPlacements, setFilteredPlacements] = useState([]);

  // Dashboard states
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardTabValue, setDashboardTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardData, setDashboardData] = useState({
    clients: [],
    vendors: [],
    sales: [],
    recruiters: []
  });

  // Page state for candidate list
  const [showCandidatePage, setShowCandidatePage] = useState(false);
  const [candidatePageData, setCandidatePageData] = useState({
    title: '',
    placements: [],
    type: '',
    categoryName: '',
    statusFilter: 'active'
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

  // Extract dashboard data from placements
  useEffect(() => {
    if (processedPlacements.length > 0) {
      // Extract unique clients
      const clientMap = new Map();
      processedPlacements.forEach(p => {
        if (p.clientName) {
          const key = p.clientName.trim();
          if (!clientMap.has(key)) {
            clientMap.set(key, { name: key, count: 0, placements: [] });
          }
          clientMap.get(key).count += 1;
          clientMap.get(key).placements.push(p);
        }
      });

      // Extract unique vendors
      const vendorMap = new Map();
      processedPlacements.forEach(p => {
        if (p.vendorName) {
          const key = p.vendorName.trim();
          if (!vendorMap.has(key)) {
            vendorMap.set(key, { name: key, count: 0, placements: [] });
          }
          vendorMap.get(key).count += 1;
          vendorMap.get(key).placements.push(p);
        }
      });

      // Extract unique sales persons
      const salesMap = new Map();
      processedPlacements.forEach(p => {
        if (p.sales) {
          const key = p.sales.trim();
          if (!salesMap.has(key)) {
            salesMap.set(key, { name: key, count: 0, placements: [] });
          }
          salesMap.get(key).count += 1;
          salesMap.get(key).placements.push(p);
        }
      });

      // Extract unique recruiters
      const recruiterMap = new Map();
      processedPlacements.forEach(p => {
        if (p.recruiterName) {
          const key = p.recruiterName.trim();
          if (!recruiterMap.has(key)) {
            recruiterMap.set(key, { name: key, count: 0, placements: [] });
          }
          recruiterMap.get(key).count += 1;
          recruiterMap.get(key).placements.push(p);
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

  // Filter placements based on active filter
  useEffect(() => {
    let filtered = [...processedPlacements];

    // Apply status/type filter
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
            placement.employmentType !== "Full-time"
        );
        break;
      case "fulltime":
        filtered = processedPlacements.filter(
          (placement) => placement.employmentType === "Full-time"
        );
        break;
      case "Pending":
        filtered = processedPlacements.filter(
          (placement) => placement.status === "Pending"
        );
        break;
      default:
        filtered = processedPlacements;
        break;
    }

    setFilteredPlacements(filtered);
  }, [processedPlacements, activeFilter]);

  useEffect(() => {
    dispatch(fetchPlacements());
  }, [dispatch]);

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
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
      case "Pending":
        return processedPlacements.filter(
          (placement) => placement.status === "Pending"
        ).length;
      default:
        return processedPlacements.length;
    }
  };

  const handleDashboardTabChange = (event, newValue) => {
    setDashboardTabValue(newValue);
    setSearchQuery("");
  };

  const toggleDashboard = () => {
    setShowDashboard(!showDashboard);
    if (showCandidatePage) {
      setShowCandidatePage(false);
    }
  };

  // Handle card click - navigate to candidate page
  const handleCardClick = (item, type, index) => {
    setCandidatePageData({
      title: `${item.name}`,
      placements: item.placements || [],
      type: type,
      categoryName: item.name,
      statusFilter: 'active'
    });
    setShowCandidatePage(true);
    setShowDashboard(false);
  };

  // Handle back from candidate page
  const handleBackToDashboard = () => {
    setShowCandidatePage(false);
    setShowDashboard(true);
    setCandidatePageData({
      title: '',
      placements: [],
      type: '',
      categoryName: '',
      statusFilter: 'active'
    });
  };

  // Handle status filter change from candidate page
  const handleTableStatusFilterChange = (filterValue) => {
    setCandidatePageData(prev => ({
      ...prev,
      statusFilter: filterValue
    }));
  };

  // Document Manager handlers
  const handleOpenDocumentManager = (placement) => {
    setSelectedPlacementForDocs(placement);
    setDocumentManagerOpen(true);
  };

  const handleCloseDocumentManager = () => {
    setDocumentManagerOpen(false);
    setSelectedPlacementForDocs(null);
  };

  // Helper function to get filter params for export
  const getExportFilterParams = () => {
    const params = {};
    if (activeFilter === "active") {
      params.status = "active";
    } else if (activeFilter === "inactive") {
      params.status = "inactive";
    } else if (activeFilter === "fulltime") {
      params.employmentType = "Full-time";
    }
    return params;
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
      dispatch(deletePlacement(placementToDelete.id));
      handleCloseDeleteDialog();
    }
  };

  const handleOpenLockDialog = (row) => {
    setPlacementToLock(row);
    setLockDialogOpen(true);
  };

  const handleCloseLockDialog = () => {
    setLockDialogOpen(false);
    setPlacementToLock(null);
  };

  const handleLock = () => {
    if (placementToLock) {
      dispatch(lockPlacement(placementToLock.id));
      handleCloseLockDialog();
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
        await dispatch(fetchPlacements());
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
        render: (row) => (
          <Tooltip title="Register">
            <span>
              <IconButton
                disabled={row.isRegister === true}
                onClick={() => handleRegisterUser(row.id)}
              >
                {row.login ? (
                  <HowToRegRounded sx={{ color: "blue" }} />
                ) : row.isRegister ? (
                  <HowToRegRounded sx={{ color: "green" }} />
                ) : (
                  <PersonAdd sx={{ color: "#9e9e9e" }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        ),
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
      { key: "teamLead", label: "Team Lead", width: 130 },
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
        key: "company",
        label: "Company",
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
        key: "currency",
        label: "Currency",
        type: "select",
        sortable: true,
        filterable: true,
        width: 100,
      },
      {
        key: "ratePeriod",
        label: "Rate Period",
        type: "select",
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
      // NEW: PO Column
      {
        key: "PO",
        label: "PO",
        sortable: false,
        filterable: false,
        width: 100,
        align: "center",
        render: (row) => (
          <Tooltip title="Manage PO">
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleOpenDocumentManager(row)}
            >
              <AttachFile fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
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
            {role === 'SUPERADMIN' && (
              <Tooltip title={row.lock ? "Locked" : "Lock Placement"}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => !row.lock && handleOpenLockDialog(row)}
                    disabled={row.lock}
                    sx={{ color: row.lock ? 'warning.main' : 'text.secondary' }}
                  >
                    {row.lock ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
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

  const getExportUrl = () => {
    const baseUrl = "/candidate/placement/placements-list";
    const filterParams = getExportFilterParams();
    
    if (Object.keys(filterParams).length === 0) {
      return baseUrl;
    }
    
    const queryParams = new URLSearchParams(filterParams).toString();
    return `${baseUrl}?${queryParams}`;
  };

  const getExportFileName = () => {
    let name = "placements";
    if (activeFilter !== "all") {
      name += `_${activeFilter}`;
    }
    return name;
  };

  const getDashboardCardColor = (index) => {
    const colors = [
      "#1976d2", "#2e7d32", "#ed6c02", "#9c27b0",
      "#d32f2f", "#00838f", "#4a148c", "#bf360c",
      "#1a237e", "#004d40", "#4e342e", "#3e2723"
    ];
    return colors[index % colors.length];
  };

  // If showing candidate page, render it instead of dashboard
  if (showCandidatePage) {
    return (
      <CandidateTablePage
        title={candidatePageData.title}
        placements={candidatePageData.placements}
        type={candidatePageData.type}
        categoryName={candidatePageData.categoryName}
        onBack={handleBackToDashboard}
        tableStatusFilter={candidatePageData.statusFilter}
        onTableStatusFilterChange={handleTableStatusFilterChange}
      />
    );
  }

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

          <ExportButton
            apiUrl={getExportUrl()}
            fileName={getExportFileName()}
          />

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
            <FilterList
              fontSize="small"
              sx={{ mr: 0.5, verticalAlign: "middle" }}
            />
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
              variant={getFilterButtonColor("Pending")}
              color="warning"
              onClick={() => handleFilterChange("Pending")}
              sx={{ minWidth: 110 }}
            >
              Pending ({getFilterCount("Pending")})
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
        </Stack>

        {/* Filter Description */}
        <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: "wrap" }}>
          {activeFilter !== "all" && (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              {activeFilter === "active" &&
                "Showing active placements (excludes full-time employment)"}
              {activeFilter === "inactive" &&
                "Showing inactive placements (excludes full-time employment)"}
              {activeFilter === "fulltime" &&
                "Showing all full-time placements (active and inactive)"}
              {activeFilter === "Pending" &&
                "Showing all pending placements"}
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Conditionally render either Dashboard or Table */}
      {showDashboard ? (
        // Dashboard Panel - Full width, no empty space
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
              placeholder={`Search ${['clients', 'vendors', 'sales', 'recruiters'][dashboardTabValue]}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
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
                  item.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.name}>
                    <DashboardCard
                      title={item.name}
                      count={item.count}
                      icon={<Business />}
                      color={getDashboardCardColor(index)}
                      subtitle="Placements"
                      onClick={() => handleCardClick(item, 'client', index)}
                    />
                  </Grid>
                ))}
              {dashboardData.clients.filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
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
                  item.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.name}>
                    <DashboardCard
                      title={item.name}
                      count={item.count}
                      icon={<Business />}
                      color={getDashboardCardColor(index)}
                      subtitle="Placements"
                      onClick={() => handleCardClick(item, 'vendor', index)}
                    />
                  </Grid>
                ))}
              {dashboardData.vendors.filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
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
                  item.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.name}>
                    <DashboardCard
                      title={item.name}
                      count={item.count}
                      icon={<AttachMoney />}
                      color={getDashboardCardColor(index)}
                      subtitle="Placements"
                      onClick={() => handleCardClick(item, 'sales', index)}
                    />
                  </Grid>
                ))}
              {dashboardData.sales.filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
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
                  item.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.name}>
                    <DashboardCard
                      title={item.name}
                      count={item.count}
                      icon={<Person />}
                      color={getDashboardCardColor(index)}
                      subtitle="Placements"
                      onClick={() => handleCardClick(item, 'recruiter', index)}
                    />
                  </Grid>
                ))}
              {dashboardData.recruiters.filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        // Data Table - Only shown when dashboard is hidden
        <DataTable
          data={filteredPlacements}
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
                {activeFilter === "all"
                  ? "No placement records found."
                  : `No ${activeFilter === "fulltime" ? "full-time" : activeFilter} placement records found.`}
              </Typography>
              {activeFilter !== "all" && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => handleFilterChange("all")}
                  sx={{ mt: 1 }}
                >
                  View All Placements
                </Button>
              )}
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

      {/* Lock Confirmation Dialog */}
      <LockConfirmDialog
        open={lockDialogOpen}
        title="Lock Placement"
        content={
          <>
            Are you sure you want to lock this placement? Once locked, you cannot edit this record.
            {placementToLock && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Consultant:</strong> {placementToLock.candidateFullName}
              </Typography>
            )}
          </>
        }
        onClose={handleCloseLockDialog}
        onConfirm={handleLock}
      />

      {/* Document Manager Dialog */}
      <DocumentManager
        open={documentManagerOpen}
        onClose={handleCloseDocumentManager}
        placementId={selectedPlacementForDocs?.id}
        placementName={selectedPlacementForDocs?.candidateFullName || selectedPlacementForDocs?.id}
      />
    </>
  );
};

export default PlacementsList;