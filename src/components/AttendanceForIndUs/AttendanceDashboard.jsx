// src/components/AttendanceForIndUs/AttendanceDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Grid,
  Paper,
  Typography,
  useTheme,
  Chip,
  Tooltip,
  Alert,
  Snackbar,
  Button,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  InputAdornment,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  RefreshCw,
  Loader2,
  Search,
  X,
  Download,
  Save,
  CheckCircle,
  Send,
  Check,
  XCircle,
} from "lucide-react";

// Import Redux actions and selectors from single slice
import {
  fetchAttendanceData,
  updateAttendanceDay,
  submitWeeklyAttendance,
  approveWeeklyAttendance,
  rejectWeeklyAttendance,
  setSelectedMonth,
  setSelectedYear,
  setEntity,
  setPage,
  setRowsPerPage,
  setSearch,
  setOrderBy,
  setOrder,
  clearSnackbar,
  setSnackbar,
  openWeeklyDialog,
  closeWeeklyDialog,
  selectAttendanceData,
  selectLoading,
  selectError,
  selectSelectedMonth,
  selectSelectedYear,
  selectEntity,
  selectPage,
  selectRowsPerPage,
  selectSearch,
  selectOrderBy,
  selectOrder,
  selectUpdateLoading,
  selectSnackbar,
  selectWeeklyLoading,
  selectWeeklyDialogOpen,
  selectSelectedWeekNumber,
} from "../../redux/attendanceSlice";

// Import EmployeeAttendanceDialog
import EmployeeAttendanceDialog from "./EmployeeAttendanceDialog";

// ============================================================
// CONSTANTS - Updated with WFH option
// ============================================================

const ATTENDANCE_STATUS_OPTIONS = [
  { code: "P", label: "Present", color: "#4CAF50", attendanceValue: 1.0, remarks: "Present" },
  { code: "HD", label: "Half Day", color: "#AB47BC", attendanceValue: 0.5, remarks: "Half Day" },
  { code: "WFH", label: "Work From Home", color: "#FF9800", attendanceValue: 1.0, remarks: "Work From Home" },
  { code: "L", label: "Leave", color: "#EF5350", attendanceValue: 0.0, remarks: "Leave" },
  { code: "LOP", label: "Loss of Pay", color: "#EF5350", attendanceValue: 0.0, remarks: "Loss of Pay" },
  { code: "WO", label: "Week Off", color: "#FFA726", attendanceValue: 0.0, remarks: "Week Off" },
  { code: "PH", label: "Public Holiday", color: "#42A5F5", attendanceValue: 0.0, remarks: "Public Holiday" },
  { code: "", label: "Not Marked", color: "#E0E0E0", attendanceValue: 0.0, remarks: "" },
];

const ATTENDANCE_STATUS_COLORS = {
  P: "#4CAF50",
  WO: "#FFA726",
  L: "#EF5350",
  PH: "#42A5F5",
  HD: "#AB47BC",
  SP: "#26C6DA",
  LOP: "#EF5350",
  WFH: "#FF9800",
  "": "#E0E0E0",
};

const ATTENDANCE_STATUS_LABELS = {
  P: "Present",
  WO: "Weekend/Off",
  L: "Leave",
  PH: "Public Holiday",
  HD: "Half Day",
  SP: "Special Permission",
  LOP: "Loss of Pay",
  WFH: "Work From Home",
  "": "Not Marked",
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Get the correct month for a day
// Days 26-31 belong to the previous month, days 1-25 belong to the selected month
const getDisplayMonth = (day, selectedMonth) => {
  const dayNum = parseInt(day);
  if (dayNum >= 26) {
    // For days 26-31, they belong to the previous month
    return selectedMonth === 1 ? 12 : selectedMonth - 1;
  } else {
    // For days 1-25, they belong to the selected month
    return selectedMonth;
  }
};

// Get month name
const getMonthName = (month, year) => {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
};

const getAttendanceValue = (status) => {
  const option = ATTENDANCE_STATUS_OPTIONS.find(opt => opt.code === status);
  return option ? option.attendanceValue : 0.0;
};

const getAttendanceRemarks = (status) => {
  const option = ATTENDANCE_STATUS_OPTIONS.find(opt => opt.code === status);
  return option ? option.remarks : "";
};

// Get days in a month
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

// Generate dynamic day order based on month and year
const getDayOrder = (month, year) => {
  // Get days in the selected month (for days 1-25)
  const daysInSelectedMonth = getDaysInMonth(year, month);
  
  // Get days in the previous month (for days 26-31)
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevMonthYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
  
  // Build day order: 26 to last day of previous month, then 1 to 25 of selected month
  const dayOrder = [];
  
  // Add days 26 to last day of previous month
  for (let day = 26; day <= daysInPrevMonth; day++) {
    dayOrder.push(String(day));
  }
  
  // Add days 1 to 25 of selected month
  for (let day = 1; day <= Math.min(25, daysInSelectedMonth); day++) {
    dayOrder.push(String(day));
  }
  
  return dayOrder;
};

// ============================================================
// DATE HEADER CELL - UPDATED
// ============================================================

const DateHeaderCell = ({ day, year, month }) => {
  const monthIndex = month - 1; // Convert to 0-based index
  const dateObj = new Date(year, monthIndex, parseInt(day));
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const isWeekend = [0, 6].includes(dateObj.getDay());
  
  return (
    <Box sx={{ textAlign: 'center', minWidth: 45 }}>
      <Typography 
        variant="caption" 
        sx={{ 
          display: 'block',
          fontSize: '10px', 
          fontWeight: 600,
          color: isWeekend ? '#FF6B6B' : '#fff',
        }}
      >
        {day}
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ 
          display: 'block',
          fontSize: '8px', 
          color: 'rgba(255,255,255,0.7)',
          fontWeight: isWeekend ? 600 : 400,
        }}
      >
        {dayOfWeek}
      </Typography>
    </Box>
  );
};

// ============================================================
// ATTENDANCE CELL
// ============================================================

const AttendanceCell = ({ status, day, employee, onCellClick }) => {
  const color = ATTENDANCE_STATUS_COLORS[status] || "#E0E0E0";
  const label = ATTENDANCE_STATUS_LABELS[status] || "Not Marked";
  const isWeekend = status === 'WO';
  
  const handleClick = () => {
    if (onCellClick && employee) {
      onCellClick(employee, day, status);
    }
  };
  
  return (
    <Tooltip title={`${employee?.employeeName || 'Employee'} - Day ${day}: ${label} (Click to edit)`} arrow placement="top">
      <Box
        onClick={handleClick}
        sx={{
          width: 34,
          height: 34,
          borderRadius: "4px",
          backgroundColor: status ? alpha(color, 0.15) : 'transparent',
          border: status ? `2px solid ${color}` : '1px solid #E8E8E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          margin: '0 auto',
          '&:hover': {
            transform: 'scale(1.15)',
            boxShadow: `0 0 0 2px ${color}, 0 4px 12px rgba(0,0,0,0.15)`,
            backgroundColor: status ? alpha(color, 0.25) : '#F5F5F5',
          },
          position: 'relative',
        }}
      >
        {status ? (
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '10px', 
              fontWeight: 700,
              color: color,
            }}
          >
            {status}
          </Typography>
        ) : (
          <Box 
            sx={{ 
              width: 4, 
              height: 4, 
              borderRadius: '50%', 
              bgcolor: '#E0E0E0',
            }} 
          />
        )}
        {isWeekend && (
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#FFA726',
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

// ============================================================
// SIMPLE EDIT DIALOG FOR SINGLE DAY - Updated with WFH
// ============================================================

const SimpleEditDialog = ({ open, onClose, employee, day, currentStatus, onSave }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || "");
  const saving = useSelector(selectUpdateLoading);

  useEffect(() => {
    setSelectedStatus(currentStatus || "");
  }, [currentStatus]);

  const handleSave = async () => {
    if (!employee) return;
    await onSave(employee.employeeId, day, selectedStatus);
    onClose();
  };

  if (!employee) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Edit Attendance
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {employee.employeeName} - Day {day}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={1} sx={{ mt: 1 }}>
          {ATTENDANCE_STATUS_OPTIONS.map((option) => {
            const isSelected = selectedStatus === option.code;
            return (
              <Paper
                key={option.code}
                elevation={0}
                onClick={() => setSelectedStatus(option.code)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: isSelected ? `2px solid ${option.color}` : '1px solid #E8E8E8',
                  backgroundColor: isSelected ? alpha(option.color, 0.08) : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '&:hover': {
                    backgroundColor: isSelected ? alpha(option.color, 0.12) : '#F5F5F5',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '4px',
                    backgroundColor: option.color,
                    opacity: option.code === '' ? 0.3 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {option.code || '—'}
                </Box>
                <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                  {option.label}
                </Typography>
                {isSelected && (
                  <CheckCircle size={16} style={{ color: option.color, marginLeft: 'auto' }} />
                )}
              </Paper>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#666' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || selectedStatus === currentStatus}
          startIcon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          sx={{
            backgroundColor: '#0F7C82',
            '&:hover': { backgroundColor: '#0A5E63' },
            '&.Mui-disabled': { backgroundColor: alpha('#0F7C82', 0.5) },
          }}
        >
          {saving ? 'Saving...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================
// WEEKLY ACTION DIALOG
// ============================================================

const WeeklyActionDialog = ({ 
  open, 
  onClose, 
  weekNumber, 
  month, 
  year,
  onAction 
}) => {
  const dispatch = useDispatch();
  const weeklyLoading = useSelector(selectWeeklyLoading);
  const [actionType, setActionType] = useState(null);

  const handleAction = async (type) => {
    setActionType(type);
    await onAction(type, weekNumber);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Weekly Attendance Action
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Select an action for Week {weekNumber} of {month}/{year}
          </Alert>

          <Stack spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Send size={18} />}
              onClick={() => handleAction('submit')}
              disabled={weeklyLoading}
              sx={{ 
                justifyContent: 'flex-start',
                py: 1.5,
                borderColor: '#1976d2',
                color: '#1976d2',
                '&:hover': {
                  borderColor: '#1565c0',
                  backgroundColor: alpha('#1976d2', 0.05),
                }
              }}
            >
              <Box>
                <Typography variant="subtitle2">Submit</Typography>
                <Typography variant="caption" color="textSecondary">
                  Submit weekly attendance for approval
                </Typography>
              </Box>
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Check size={18} />}
              onClick={() => handleAction('approve')}
              disabled={weeklyLoading}
              sx={{ 
                justifyContent: 'flex-start',
                py: 1.5,
                borderColor: '#4CAF50',
                color: '#4CAF50',
                '&:hover': {
                  borderColor: '#388E3C',
                  backgroundColor: alpha('#4CAF50', 0.05),
                }
              }}
            >
              <Box>
                <Typography variant="subtitle2">Approve</Typography>
                <Typography variant="caption" color="textSecondary">
                  Approve submitted weekly attendance
                </Typography>
              </Box>
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<XCircle size={18} />}
              onClick={() => handleAction('reject')}
              disabled={weeklyLoading}
              sx={{ 
                justifyContent: 'flex-start',
                py: 1.5,
                borderColor: '#EF5350',
                color: '#EF5350',
                '&:hover': {
                  borderColor: '#C62828',
                  backgroundColor: alpha('#EF5350', 0.05),
                }
              }}
            >
              <Box>
                <Typography variant="subtitle2">Reject</Typography>
                <Typography variant="caption" color="textSecondary">
                  Reject submitted weekly attendance
                </Typography>
              </Box>
            </Button>
          </Stack>

          {weeklyLoading && (
            <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 1 }}>
                Processing {actionType}...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={weeklyLoading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================
// MAIN ATTENDANCE DASHBOARD
// ============================================================

const AttendanceDashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // Get entity from auth slice
  const { entity: authEntity } = useSelector((state) => state.auth);

  // Redux state from attendance slice
  const attendanceData = useSelector(selectAttendanceData);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const selectedMonth = useSelector(selectSelectedMonth);
  const selectedYear = useSelector(selectSelectedYear);
  const entity = useSelector(selectEntity);
  const page = useSelector(selectPage);
  const rowsPerPage = useSelector(selectRowsPerPage);
  const search = useSelector(selectSearch);
  const orderBy = useSelector(selectOrderBy);
  const order = useSelector(selectOrder);
  const snackbar = useSelector(selectSnackbar);
  const weeklyDialogOpen = useSelector(selectWeeklyDialogOpen);
  const selectedWeekNumber = useSelector(selectSelectedWeekNumber);

  // Local state for dialogs
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [selectedEmployeeForDialog, setSelectedEmployeeForDialog] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("");

  const currentDate = new Date();

  // Generate dynamic day order based on selected month and year
  const DAY_ORDER = useMemo(() => {
    return getDayOrder(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  // ============================================================
  // SYNC ENTITY FROM AUTH
  // ============================================================

  useEffect(() => {
    if (authEntity) {
      dispatch(setEntity(authEntity));
    }
  }, [authEntity, dispatch]);

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchData = useCallback(() => {
    dispatch(fetchAttendanceData({ month: selectedMonth, year: selectedYear, entity }));
  }, [dispatch, selectedMonth, selectedYear, entity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleMonthChange = (event) => {
    dispatch(setSelectedMonth(parseInt(event.target.value)));
  };

  const handleYearChange = (event) => {
    dispatch(setSelectedYear(parseInt(event.target.value)));
  };

  const handleSearchChange = (event) => {
    dispatch(setSearch(event.target.value));
  };

  const handleSearchClear = () => {
    dispatch(setSearch(""));
  };

  const handlePageChange = (_, newPage) => {
    dispatch(setPage(newPage));
  };

  const handleRowsPerPageChange = (event) => {
    dispatch(setRowsPerPage(parseInt(event.target.value, 10)));
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    dispatch(setOrder(isAsc ? 'desc' : 'asc'));
    dispatch(setOrderBy(property));
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployeeForDialog(employee);
    setEmployeeDialogOpen(true);
  };

  const handleEmployeeDialogClose = () => {
    setEmployeeDialogOpen(false);
    setSelectedEmployeeForDialog(null);
  };

  const handleCellClick = (employee, day, status) => {
    if (employee) {
      setSelectedEmployee(employee);
      setSelectedDay(day);
      setCurrentStatus(status || "");
      setDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedEmployee(null);
    setSelectedDay(null);
    setCurrentStatus("");
  };

  const handleSaveAttendance = async (employeeId, day, status) => {
    await dispatch(updateAttendanceDay({
      employeeId,
      day,
      selectedMonth,
      selectedYear,
      status,
      getAttendanceValue,
      getAttendanceRemarks,
      entity,
    }));
  };

  // ============================================================
  // WEEKLY ATTENDANCE HANDLERS
  // ============================================================

  const handleOpenWeeklyDialog = () => {
    const weekNumber = Math.ceil((new Date().getDate()) / 7);
    dispatch(openWeeklyDialog(weekNumber));
  };

  const handleWeeklyAction = async (actionType, weekNumber) => {
    let result;
    const payload = {
      month: selectedMonth,
      year: selectedYear,
      weekNumber: weekNumber,
      entity: entity,
    };

    switch (actionType) {
      case 'submit':
        result = await dispatch(submitWeeklyAttendance(payload));
        break;
      case 'approve':
        result = await dispatch(approveWeeklyAttendance(payload));
        break;
      case 'reject':
        result = await dispatch(rejectWeeklyAttendance(payload));
        break;
      default:
        return;
    }

    if (result.payload?.success) {
      fetchData();
    }
  };

  const handleCloseWeeklyDialog = () => {
    dispatch(closeWeeklyDialog());
  };

  // ============================================================
  // SORTING AND FILTERING
  // ============================================================

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };

  const descendingComparator = (a, b, orderBy) => {
    const aValue = getNestedValue(a, orderBy);
    const bValue = getNestedValue(b, orderBy);

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return aValue - bValue;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue, undefined, { numeric: true });
    }

    return String(aValue).localeCompare(String(bValue));
  };

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const filteredData = useMemo(() => {
    if (!search) return attendanceData;
    
    const searchLower = search.toLowerCase();
    return attendanceData.filter((item) => 
      item.employeeId?.toLowerCase().includes(searchLower) ||
      item.employeeName?.toLowerCase().includes(searchLower) ||
      item.designation?.toLowerCase().includes(searchLower)
    );
  }, [attendanceData, search]);

  const sortedData = useMemo(() => {
    const comparator = getComparator(order, orderBy);
    return [...filteredData].sort(comparator);
  }, [filteredData, order, orderBy]);

  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ============================================================
  // EXPORT FUNCTION - UPDATED with dynamic day order
  // ============================================================

  const handleExport = async () => {
    try {
      const XLSX = await import("xlsx");
      
      const headers = [
        'Employee ID', 'Employee Name', 'PF', 'ESI', 'Reporting Manager', 
        'Designation', 'Joining Date', 'Probation',
        ...DAY_ORDER.map(day => {
          const displayMonth = getDisplayMonth(day, selectedMonth);
          const monthName = getMonthName(displayMonth, selectedYear);
          return `${day} ${monthName}`;
        }),
        'Total Days', 'Working Days', 'Weekend Days', 'Present Days', 
        'Leaves', 'Casual Leaves', 'Paid Days'
      ];
      
      const dataRows = filteredData.map((row) => {
        const rowData = [
          row.employeeId,
          row.employeeName,
          row.pf,
          row.esi,
          row.reportingManager || '',
          row.designation,
          row.joiningDate,
          row.probation || '',
        ];
        
        DAY_ORDER.forEach((day) => {
          rowData.push(row.attendanceGrid?.[day] || '');
        });
        
        rowData.push(
          row.totalDaysInMonth,
          row.totalWorkingDays,
          row.totalWeekendDays,
          row.totalPresentDays,
          row.totalLeaves,
          row.casualLeaves,
          row.totalPaidDays
        );
        
        return rowData;
      });
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, `attendance_${selectedMonth}_${selectedYear}.xlsx`);
      
      dispatch(setSnackbar({
        open: true,
        message: "Report exported successfully",
        severity: "success",
      }));
    } catch (error) {
      console.error("Export failed:", error);
      dispatch(setSnackbar({
        open: true,
        message: "Failed to export report",
        severity: "error",
      }));
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => dispatch(clearSnackbar())}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          zIndex: 9999,
          top: '80px !important',
          right: '24px !important',
        }}
      >
        <Alert
          onClose={() => dispatch(clearSnackbar())}
          severity={snackbar.severity}
          sx={{ 
            width: "100%",
            minWidth: "300px",
            maxWidth: "450px",
            boxShadow: theme.shadows[8],
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: '24px',
            },
            marginBottom: '8px',
          }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialogs */}
      <EmployeeAttendanceDialog
        open={employeeDialogOpen}
        onClose={handleEmployeeDialogClose}
        employee={selectedEmployeeForDialog}
        year={selectedYear}
        onSave={handleSaveAttendance}
      />

      <SimpleEditDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        employee={selectedEmployee}
        day={selectedDay}
        currentStatus={currentStatus}
        onSave={handleSaveAttendance}
      />

      <WeeklyActionDialog
        open={weeklyDialogOpen}
        onClose={handleCloseWeeklyDialog}
        weekNumber={selectedWeekNumber}
        month={selectedMonth}
        year={selectedYear}
        onAction={handleWeeklyAction}
      />

      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
            Attendance Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {new Date().toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Box>
        
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Month</InputLabel>
            <Select
              value={selectedMonth}
              onChange={handleMonthChange}
              label="Month"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <MenuItem key={month} value={month}>
                  {new Date(2000, month - 1, 1).toLocaleString("default", { month: "long" })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              label="Year"
            >
              {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            onClick={handleRefresh}
            disabled={loading}
            sx={{ 
              backgroundColor: '#0F7C82',
              '&:hover': { backgroundColor: '#0A5E63' }
            }}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={handleExport}
            sx={{ 
              borderColor: '#0F7C82',
              color: '#0F7C82',
              '&:hover': { 
                borderColor: '#0A5E63',
                backgroundColor: alpha('#0F7C82', 0.05)
              }
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Legend */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#F8F9FA' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#333' }}>
          Attendance Status Legend (Click on any date cell to edit)
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          {Object.entries(ATTENDANCE_STATUS_LABELS).map(([key, label]) => (
            <Box key={key} display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "2px",
                  backgroundColor: ATTENDANCE_STATUS_COLORS[key] || "#E0E0E0",
                  opacity: key === "" ? 0.3 : 1,
                  border: key !== "" ? `2px solid ${ATTENDANCE_STATUS_COLORS[key]}` : '1px solid #E8E8E8',
                }}
              />
              <Typography variant="caption" sx={{ fontSize: "11px", color: '#555' }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search by Employee ID, Name, or Designation..."
          value={search}
          onChange={handleSearchChange}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleSearchClear}>
                  <X size={18} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Attendance Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: '70vh', overflowX: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {/* Column 1: Employee ID - Now first column */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    position: 'sticky',
                    left: 0,
                    zIndex: 3,
                    minWidth: 100,
                    padding: '10px 8px',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'employeeId'}
                    direction={orderBy === 'employeeId' ? order : 'asc'}
                    onClick={() => handleSort('employeeId')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Employee ID
                  </TableSortLabel>
                </TableCell>

                {/* Column 2: Employee Name */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    position: 'sticky',
                    left: 100,
                    zIndex: 3,
                    minWidth: 180,
                    padding: '10px 8px',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'employeeName'}
                    direction={orderBy === 'employeeName' ? order : 'asc'}
                    onClick={() => handleSort('employeeName')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Employee Name
                  </TableSortLabel>
                </TableCell>

                {/* Column 3: PF */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 50,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'pf'}
                    direction={orderBy === 'pf' ? order : 'asc'}
                    onClick={() => handleSort('pf')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    PF
                  </TableSortLabel>
                </TableCell>

                {/* Column 4: ESI */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 50,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'esi'}
                    direction={orderBy === 'esi' ? order : 'asc'}
                    onClick={() => handleSort('esi')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    ESI
                  </TableSortLabel>
                </TableCell>

                {/* Column 5: Reporting Manager */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 130,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'reportingManager'}
                    direction={orderBy === 'reportingManager' ? order : 'asc'}
                    onClick={() => handleSort('reportingManager')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Reporting Manager
                  </TableSortLabel>
                </TableCell>

                {/* Column 6: Designation */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 130,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'designation'}
                    direction={orderBy === 'designation' ? order : 'asc'}
                    onClick={() => handleSort('designation')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Designation
                  </TableSortLabel>
                </TableCell>

                {/* Column 7: Joining Date */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 100,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'joiningDate'}
                    direction={orderBy === 'joiningDate' ? order : 'asc'}
                    onClick={() => handleSort('joiningDate')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Joining Date
                  </TableSortLabel>
                </TableCell>

                {/* Column 8: Probation */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 80,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'probation'}
                    direction={orderBy === 'probation' ? order : 'asc'}
                    onClick={() => handleSort('probation')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Probation
                  </TableSortLabel>
                </TableCell>

                {/* Columns 9+: Attendance Days - DYNAMIC */}
                {DAY_ORDER.map((day) => {
                  const displayMonth = getDisplayMonth(day, selectedMonth);
                  
                  return (
                    <TableCell 
                      key={day} 
                      sx={{ 
                        bgcolor: '#0F7C82', 
                        color: '#FFFFFF',
                        fontWeight: 700,
                        minWidth: 55,
                        padding: '4px 2px',
                        textAlign: 'center',
                      }}
                    >
                      <TableSortLabel
                        active={orderBy === `attendanceGrid.${day}`}
                        direction={orderBy === `attendanceGrid.${day}` ? order : 'asc'}
                        onClick={() => handleSort(`attendanceGrid.${day}`)}
                        sx={{
                          color: '#FFFFFF !important',
                          '& .MuiTableSortLabel-icon': {
                            color: '#FFFFFF !important',
                          },
                          '&:hover': {
                            color: '#FFFFFF !important',
                          },
                        }}
                      >
                        <DateHeaderCell day={day} year={selectedYear} month={displayMonth} />
                      </TableSortLabel>
                    </TableCell>
                  );
                })}

                {/* Total Days */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 70,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'totalDaysInMonth'}
                    direction={orderBy === 'totalDaysInMonth' ? order : 'asc'}
                    onClick={() => handleSort('totalDaysInMonth')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Total Days
                  </TableSortLabel>
                </TableCell>

                {/* Working Days */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 80,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'totalWorkingDays'}
                    direction={orderBy === 'totalWorkingDays' ? order : 'asc'}
                    onClick={() => handleSort('totalWorkingDays')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Working Days
                  </TableSortLabel>
                </TableCell>

                {/* Weekend Days */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 80,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'totalWeekendDays'}
                    direction={orderBy === 'totalWeekendDays' ? order : 'asc'}
                    onClick={() => handleSort('totalWeekendDays')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Weekend Days
                  </TableSortLabel>
                </TableCell>

                {/* Present */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 70,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'totalPresentDays'}
                    direction={orderBy === 'totalPresentDays' ? order : 'asc'}
                    onClick={() => handleSort('totalPresentDays')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Present
                  </TableSortLabel>
                </TableCell>

                {/* Leaves */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 60,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'totalLeaves'}
                    direction={orderBy === 'totalLeaves' ? order : 'asc'}
                    onClick={() => handleSort('totalLeaves')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Leaves
                  </TableSortLabel>
                </TableCell>

                {/* Casual Leaves */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 80,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'casualLeaves'}
                    direction={orderBy === 'casualLeaves' ? order : 'asc'}
                    onClick={() => handleSort('casualLeaves')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Casual Leaves
                  </TableSortLabel>
                </TableCell>

                {/* Paid Days */}
                <TableCell 
                  sx={{ 
                    bgcolor: '#0F7C82', 
                    color: '#FFFFFF',
                    fontWeight: 700,
                    minWidth: 70,
                    padding: '10px 8px',
                  }}
                >
                  <TableSortLabel
                    active={orderBy === 'totalPaidDays'}
                    direction={orderBy === 'totalPaidDays' ? order : 'asc'}
                    onClick={() => handleSort('totalPaidDays')}
                    sx={{
                      color: '#FFFFFF !important',
                      '& .MuiTableSortLabel-icon': {
                        color: '#FFFFFF !important',
                      },
                      '&:hover': {
                        color: '#FFFFFF !important',
                      },
                    }}
                  >
                    Paid Days
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8 + DAY_ORDER.length + 7} align="center" sx={{ py: 5 }}>
                    <Loader2 size={32} className="animate-spin" />
                    <Typography variant="body2" sx={{ mt: 1 }}>Loading attendance data...</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8 + DAY_ORDER.length + 7} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="textSecondary">No records found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow key={row.employeeId} hover>
                    {/* Employee ID - Now first column */}
                    <TableCell 
                      sx={{ 
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        padding: '8px 8px',
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {row.employeeId}
                      </Typography>
                    </TableCell>

                    {/* Employee Name */}
                    <TableCell 
                      sx={{ 
                        position: 'sticky',
                        left: 100,
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        padding: '8px 8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleEmployeeClick(row)}
                    >
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        sx={{
                          color: '#0F7C82',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {row.employeeName}
                      </Typography>
                    </TableCell>

                    {/* PF */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Chip
                        label={row.pf}
                        size="small"
                        sx={{
                          backgroundColor: row.pf === 'YES' ? alpha('#4CAF50', 0.1) : alpha('#EF5350', 0.1),
                          color: row.pf === 'YES' ? '#4CAF50' : '#EF5350',
                          fontWeight: 600,
                          minWidth: 40,
                        }}
                      />
                    </TableCell>

                    {/* ESI */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Chip
                        label={row.esi}
                        size="small"
                        sx={{
                          backgroundColor: row.esi === 'YES' ? alpha('#4CAF50', 0.1) : alpha('#EF5350', 0.1),
                          color: row.esi === 'YES' ? '#4CAF50' : '#EF5350',
                          fontWeight: 600,
                          minWidth: 40,
                        }}
                      />
                    </TableCell>

                    {/* Reporting Manager */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Typography variant="body2">{row.reportingManager || '—'}</Typography>
                    </TableCell>

                    {/* Designation */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Typography variant="body2">{row.designation}</Typography>
                    </TableCell>

                    {/* Joining Date */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Typography variant="body2">
                        {row.joiningDate ? new Date(row.joiningDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : '—'}
                      </Typography>
                    </TableCell>

                    {/* Probation */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Typography variant="body2">{row.probation || '—'}</Typography>
                    </TableCell>

                    {/* Attendance Days - DYNAMIC */}
                    {DAY_ORDER.map((day) => (
                      <TableCell key={day} sx={{ padding: '2px 2px', textAlign: 'center' }}>
                        <AttendanceCell 
                          status={row.attendanceGrid?.[day] || ''} 
                          day={day}
                          employee={row}
                          onCellClick={handleCellClick}
                        />
                      </TableCell>
                    ))}

                    {/* Total Days */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Typography variant="body2" fontWeight={500}>{row.totalDaysInMonth}</Typography>
                    </TableCell>

                    {/* Working Days */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Typography variant="body2">{row.totalWorkingDays}</Typography>
                    </TableCell>

                    {/* Weekend Days */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Typography variant="body2">{row.totalWeekendDays}</Typography>
                    </TableCell>

                    {/* Present */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Chip
                        label={row.totalPresentDays}
                        size="small"
                        sx={{
                          backgroundColor: alpha('#4CAF50', 0.1),
                          color: '#4CAF50',
                          fontWeight: 600,
                          minWidth: 40,
                        }}
                      />
                    </TableCell>

                    {/* Leaves */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Chip
                        label={row.totalLeaves}
                        size="small"
                        sx={{
                          backgroundColor: alpha('#EF5350', 0.1),
                          color: '#EF5350',
                          fontWeight: 600,
                          minWidth: 40,
                        }}
                      />
                    </TableCell>

                    {/* Casual Leaves */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Chip
                        label={row.casualLeaves}
                        size="small"
                        sx={{
                          backgroundColor: alpha('#FFA726', 0.1),
                          color: '#FFA726',
                          fontWeight: 600,
                          minWidth: 40,
                        }}
                      />
                    </TableCell>

                    {/* Paid Days */}
                    <TableCell sx={{ padding: '8px 8px' }}>
                      <Chip
                        label={row.totalPaidDays}
                        size="small"
                        sx={{
                          backgroundColor: alpha('#42A5F5', 0.1),
                          color: '#42A5F5',
                          fontWeight: 600,
                          minWidth: 40,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[20, 40, 80, 100]}
          sx={{
            borderTop: '1px solid #E0E0E0',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              color: '#666',
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default AttendanceDashboard;