// src/components/AttendanceForIndUs/AttendanceSummary.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Paper,
  Typography,
  useTheme,
  Chip,
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
} from "@mui/material";
import {
  RefreshCw,
  Loader2,
  Search,
  X,
  Download,
} from "lucide-react";

// Import Redux actions and selectors
import {
  fetchAttendanceData,
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
  selectSnackbar,
} from "../../redux/attendanceSlice";

// ============================================================
// MAIN ATTENDANCE SUMMARY COMPONENT
// ============================================================

const AttendanceSummary = () => {
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

  const currentDate = new Date();

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
  // EXPORT FUNCTION
  // ============================================================

  const handleExport = async () => {
    try {
      const XLSX = await import("xlsx");
      
      const headers = [
        'Employee ID', 'Employee Name', 'PF', 'ESI', 'Reporting Manager', 
        'Designation', 'Joining Date', 'Probation',
        'Total Days', 'Working Days', 'Weekend Days', 'Present Days', 
        'Leaves', 'Casual Leaves', 'Paid Days', 'Attendance Rate (%)'
      ];
      
      const dataRows = filteredData.map((row) => {
        const presentRate = row.totalWorkingDays > 0 
          ? Math.round((row.totalPresentDays / row.totalWorkingDays) * 100) 
          : 0;
        
        return [
          row.employeeId,
          row.employeeName,
          row.pf,
          row.esi,
          row.reportingManager || '',
          row.designation,
          row.joiningDate,
          row.probation || '',
          row.totalDaysInMonth,
          row.totalWorkingDays,
          row.totalWeekendDays,
          row.totalPresentDays,
          row.totalLeaves,
          row.casualLeaves,
          row.totalPaidDays,
          presentRate,
        ];
      });
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Summary");
      XLSX.writeFile(wb, `attendance_summary_${selectedMonth}_${selectedYear}.xlsx`);
      
      dispatch(setSnackbar({
        open: true,
        message: "Summary exported successfully",
        severity: "success",
      }));
    } catch (error) {
      console.error("Export failed:", error);
      dispatch(setSnackbar({
        open: true,
        message: "Failed to export summary",
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
            Attendance Summary
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

      {/* Summary Table - Only Summary Columns */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: '70vh', overflowX: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {/* Employee ID - Now first column */}
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

                {/* Employee Name */}
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

                {/* PF */}
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

                {/* ESI */}
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

                {/* Reporting Manager */}
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

                {/* Designation */}
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

                {/* Joining Date */}
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

                {/* Probation */}
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

                {/* Total Days */}
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
                    minWidth: 90,
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
                    minWidth: 90,
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
                    minWidth: 80,
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
                    minWidth: 70,
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
                    minWidth: 90,
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
                    minWidth: 80,
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

                {/* Attendance Rate */}
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
                    active={orderBy === 'attendanceRate'}
                    direction={orderBy === 'attendanceRate' ? order : 'asc'}
                    onClick={() => handleSort('attendanceRate')}
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
                    Attendance %
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={16} align="center" sx={{ py: 5 }}>
                    <Loader2 size={32} className="animate-spin" />
                    <Typography variant="body2" sx={{ mt: 1 }}>Loading attendance summary...</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="textSecondary">No records found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => {
                  const presentRate = row.totalWorkingDays > 0 
                    ? Math.round((row.totalPresentDays / row.totalWorkingDays) * 100) 
                    : 0;
                  
                  const getRateColor = (rate) => {
                    if (rate >= 90) return '#4CAF50';
                    if (rate >= 75) return '#FFA726';
                    if (rate >= 60) return '#EF5350';
                    return '#C62828';
                  };

                  return (
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
                        }}
                      >
                        <Typography variant="body2" fontWeight={500}>
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

                      {/* Attendance Rate */}
                      <TableCell sx={{ padding: '8px 8px' }}>
                        <Chip
                          label={`${presentRate}%`}
                          size="small"
                          sx={{
                            backgroundColor: alpha(getRateColor(presentRate), 0.1),
                            color: getRateColor(presentRate),
                            fontWeight: 700,
                            minWidth: 50,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
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

export default AttendanceSummary;