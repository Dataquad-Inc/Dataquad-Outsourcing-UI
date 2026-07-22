// src/components/AttendanceForIndUs/HolidayTab.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Divider,
  Fade,
  Grow,
  Zoom,
  useTheme,
  alpha,
  Avatar,
} from "@mui/material";
import {
  Calendar,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Edit2,
  CalendarDays,
  Clock,
  Hash,
} from "lucide-react";

// Import from single attendance slice
import {
  fetchHolidays,
  setupAttendanceMonth,
  updateAttendanceMonth,
  deleteAttendanceMonth,
  openConfigDialog,
  closeConfigDialog,
  setConfigData,
  setSelectedMonth,
  setSelectedYear,
  clearSnackbar,
  setSnackbar,
  selectHolidays,
  selectLoading,
  selectError,
  selectConfigOpen,
  selectConfigData,
  selectIsConfigured,
  selectConfiguring,
  selectSelectedMonth,
  selectSelectedYear,
  selectSnackbar,
  selectEntity,
} from "../../redux/attendanceSlice";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const HolidayTab = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Redux state from single slice
  const holidays = useSelector(selectHolidays);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const configOpen = useSelector(selectConfigOpen);
  const configData = useSelector(selectConfigData);
  const isConfigured = useSelector(selectIsConfigured);
  const configuring = useSelector(selectConfiguring);
  const selectedMonth = useSelector(selectSelectedMonth);
  const selectedYear = useSelector(selectSelectedYear);
  const snackbar = useSelector(selectSnackbar);
  const entity = useSelector(selectEntity);

  // Dates the user has picked/unpicked on the calendar for THIS dialog session.
  // Seeded from the GET-fetched `holidays` list whenever the dialog opens.
  const [selectedDates, setSelectedDates] = useState(new Set());

  // ============================================================
  // FETCH HOLIDAYS ON MOUNT AND MONTH/YEAR CHANGE
  // ============================================================

  useEffect(() => {
    dispatch(fetchHolidays({ month: selectedMonth, year: selectedYear, entity: entity }));
  }, [dispatch, selectedMonth, selectedYear, entity]);

  // ============================================================
  // CONFIGURE / EDIT ATTENDANCE MONTH — SINGLE BUTTON, SINGLE DIALOG
  // ============================================================

  const handleOpenConfigDialog = () => {
    // Seed the calendar with whatever is already saved for this month/year
    setSelectedDates(new Set(holidays.map((h) => h.date)));
    dispatch(setConfigData({ month: selectedMonth, year: selectedYear }));
    dispatch(openConfigDialog());
  };

  const handleCloseConfigDialog = () => {
    if (configuring) return;
    dispatch(closeConfigDialog());
  };

  const toggleDate = (dateStr) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  const handleSaveConfiguration = async () => {
    const publicHolidays = Array.from(selectedDates).sort();

    const payload = {
      month: selectedMonth,
      year: selectedYear,
      publicHolidays,
      entity,
    };

    // Use isConfigured to determine POST vs PUT
    const result = isConfigured
      ? await dispatch(updateAttendanceMonth(payload))
      : await dispatch(setupAttendanceMonth(payload));

    if (result.payload?.success) {
      dispatch(closeConfigDialog());
      dispatch(fetchHolidays({ month: selectedMonth, year: selectedYear, entity: entity }));

      dispatch(setSnackbar({
        open: true,
        message: isConfigured
          ? 'Configuration updated successfully!'
          : 'Month configured successfully!',
        severity: 'success',
      }));
    }
  };

  // ============================================================
  // DELETE ATTENDANCE MONTH CONFIGURATION
  // ============================================================

  const handleDeleteConfiguration = async () => {
    if (window.confirm(`Are you sure you want to delete the attendance configuration for ${getMonthName(selectedMonth)} ${selectedYear}? This will remove all holidays.`)) {
      const result = await dispatch(deleteAttendanceMonth({
        month: selectedMonth,
        year: selectedYear,
        entity: entity,
      }));

      if (result.payload?.success) {
        dispatch(fetchHolidays({ month: selectedMonth, year: selectedYear, entity: entity }));
      }
    }
  };

  // ============================================================
  // HANDLE MONTH/YEAR CHANGE (outside the dialog)
  // ============================================================

  const handleMonthChange = (event) => {
    const newMonth = parseInt(event.target.value);
    dispatch(setSelectedMonth(newMonth));
  };

  const handleYearChange = (event) => {
    const newYear = parseInt(event.target.value);
    dispatch(setSelectedYear(newYear));
  };

  const handleRefresh = () => {
    dispatch(fetchHolidays({ month: selectedMonth, year: selectedYear, entity: entity }));
  };

  // ============================================================
  // DATE HELPERS WITH ATTENDANCE CYCLE (26th to 25th)
  // ============================================================

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDayName = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getMonthName = (month) => {
    return new Date(2026, month - 1).toLocaleString('default', { month: 'long' });
  };

  /**
   * Convert date to string format YYYY-MM-DD
   * Ensures proper date formatting for the attendance cycle
   */
  const toDateStr = (year, month, day) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  /**
   * Get the attendance cycle range for a given month/year
   * Attendance cycle: 26th of previous month to 25th of current month
   * For example, July 2026 cycle: June 26, 2026 to July 25, 2026
   */
  const getAttendanceCycleRange = (month, year) => {
    // Start date: 26th of previous month
    let startMonth = month - 1;
    let startYear = year;
    if (startMonth < 1) {
      startMonth = 12;
      startYear = year - 1;
    }
    const startDate = new Date(startYear, startMonth - 1, 26);
    
    // End date: 25th of current month
    const endDate = new Date(year, month - 1, 25);
    
    return { startDate, endDate };
  };

  /**
   * Check if a date falls within the attendance cycle
   */
  const isDateInAttendanceCycle = (date, month, year) => {
    const { startDate, endDate } = getAttendanceCycleRange(month, year);
    const checkDate = new Date(date);
    
    // Reset time to compare dates only
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate >= startDate && checkDate <= endDate;
  };

  /**
   * Get all dates in the attendance cycle (26th previous month to 25th current month)
   */
  const getAttendanceCycleDates = (month, year) => {
    const { startDate, endDate } = getAttendanceCycleRange(month, year);
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  /**
   * Build calendar grid for the attendance cycle
   * Shows dates from 26th of previous month to 25th of current month
   * Arranged in a weekly grid starting from Sunday
   */
  const getAttendanceCycleCalendar = (month, year) => {
    const cycleDates = getAttendanceCycleDates(month, year);
    const calendar = [];
    let week = [];
    
    // Get the first day of the week for the first date
    const firstDate = cycleDates[0];
    const firstDayOfWeek = firstDate.getDay(); // 0 = Sunday
    
    // Add padding for days before the first date
    for (let i = 0; i < firstDayOfWeek; i++) {
      week.push(null);
    }
    
    // Add all cycle dates
    cycleDates.forEach((date) => {
      week.push(date);
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    });
    
    // Add padding for remaining days in the last week
    while (week.length > 0 && week.length < 7) {
      week.push(null);
    }
    if (week.length > 0) {
      calendar.push(week);
    }
    
    return calendar;
  };

  const calendarWeeks = getAttendanceCycleCalendar(selectedMonth, selectedYear);
  const sortedSelectedDates = Array.from(selectedDates).sort();

  // Get cycle range for display
  const { startDate, endDate } = getAttendanceCycleRange(selectedMonth, selectedYear);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Box sx={{ p: 2, maxWidth: 1400, margin: '0 auto' }}>
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => dispatch(clearSnackbar())}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Grow}
        sx={{
          top: '80px !important',
          right: '50px !important',
        }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => dispatch(clearSnackbar())}
          icon={
            snackbar.severity === 'success' ? (
              <CheckCircle size={20} />
            ) : snackbar.severity === 'error' ? (
              <AlertCircle size={20} />
            ) : undefined
          }
          variant="filled"
          sx={{
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Hero Section - Reduced padding */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    width: 44,
                    height: 44,
                  }}
                >
                  <CalendarDays size={22} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary">
                    Holiday Management
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Attendance Cycle: {formatDate(toDateStr(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()))} - {formatDate(toDateStr(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate()))}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box display="flex" gap={0.5}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ fontSize: '0.8rem' }}>Month</InputLabel>
                    <Select
                      value={selectedMonth}
                      onChange={handleMonthChange}
                      label="Month"
                      disabled={loading || configuring}
                      sx={{ borderRadius: 2, fontSize: '0.8rem', height: 36 }}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <MenuItem key={month} value={month} sx={{ fontSize: '0.8rem' }}>
                          {getMonthName(month)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 90 }}>
                    <InputLabel sx={{ fontSize: '0.8rem' }}>Year</InputLabel>
                    <Select
                      value={selectedYear}
                      onChange={handleYearChange}
                      label="Year"
                      disabled={loading || configuring}
                      sx={{ borderRadius: 2, fontSize: '0.8rem', height: 36 }}
                    >
                      {[2024, 2025, 2026, 2027, 2028].map((year) => (
                        <MenuItem key={year} value={year} sx={{ fontSize: '0.8rem' }}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <IconButton
                    onClick={handleRefresh}
                    disabled={loading || configuring}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      width: 36,
                      height: 36,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={18} /> : <RefreshCw size={16} />}
                  </IconButton>
                </Box>

                <Button
                  variant="contained"
                  startIcon={isConfigured ? <Edit2 size={16} /> : <Calendar size={16} />}
                  onClick={handleOpenConfigDialog}
                  disabled={loading || configuring}
                  size="medium"
                  sx={{
                    borderRadius: 2,
                    py: 0.6,
                    px: 2.5,
                    background: isConfigured
                      ? `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`
                      : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: theme.shadows[1],
                    '&:hover': {
                      boxShadow: theme.shadows[3],
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                >
                  {isConfigured ? 'Edit Configuration' : 'Configure Month'}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Trash2 size={16} />}
                  onClick={handleDeleteConfiguration}
                  // disabled={loading || configuring || !isConfigured}
                  size="medium"
                  sx={{
                    borderRadius: 2,
                    py: 0.6,
                    px: 2.5,
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                    '&:hover': {
                      borderColor: theme.palette.error.dark,
                      backgroundColor: alpha(theme.palette.error.main, 0.05),
                    },
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                >
                  Delete Config
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.03)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      </Paper>

      {/* Error Display */}
      {error && (
        <Fade in={!!error}>
          <Alert
            severity="error"
            sx={{
              mb: 1.5,
              borderRadius: 2,
              boxShadow: theme.shadows[1],
            }}
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Configuration Status Banner - Compact */}
      {!isConfigured ? (
        <Alert
          severity="info"
          sx={{ mb: 1.5, borderRadius: 2, py: 0.5 }}
          icon={<AlertCircle size={16} />}
        >
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            This attendance cycle is not configured yet. Click <strong>"Configure Month"</strong> to set up attendance and add holidays.
          </Typography>
        </Alert>
      ) : (
        <Alert
          severity="success"
          sx={{ mb: 1.5, borderRadius: 2, py: 0.5 }}
          icon={<CheckCircle size={16} />}
        >
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            This attendance cycle is configured with <strong>{holidays.length}</strong> public holiday(s). Click <strong>"Edit Configuration"</strong> to add or remove holidays.
          </Typography>
        </Alert>
      )}

      {/* Stats Cards - Compact */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Zoom in style={{ transitionDelay: '100ms' }}>
            <Card
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="500" sx={{ fontSize: '0.7rem' }}>
                      Total Holidays
                    </Typography>
                    <Typography variant="h5" fontWeight="700" color="primary.main">
                      {holidays.length}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, width: 36, height: 36 }}>
                    <Calendar size={18} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Zoom in style={{ transitionDelay: '200ms' }}>
            <Card
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="500" sx={{ fontSize: '0.7rem' }}>
                      Status
                    </Typography>
                    <Typography variant="body2" fontWeight="600" color={isConfigured ? 'success.main' : 'warning.main'}>
                      {isConfigured ? 'Configured ✓' : 'Not Configured'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: isConfigured ? theme.palette.success.main : theme.palette.warning.main, width: 36, height: 36 }}>
                    {isConfigured ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Zoom in style={{ transitionDelay: '300ms' }}>
            <Card
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="500" sx={{ fontSize: '0.7rem' }}>
                      Cycle Period
                    </Typography>
                    <Typography variant="caption" fontWeight="600" display="block">
                      {formatDate(toDateStr(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()))} - {formatDate(toDateStr(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate()))}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, width: 36, height: 36 }}>
                    <Clock size={18} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {/* Holiday List - Compact */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          overflow: 'hidden',
          maxHeight: 300,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            <TableRow>
              <TableCell sx={{ py: 1 }}>
                <Typography fontWeight="600" color="text.secondary" display="flex" alignItems="center" gap={1} variant="caption">
                  <Hash size={14} /> #
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 1 }}>
                <Typography fontWeight="600" color="text.secondary" display="flex" alignItems="center" gap={1} variant="caption">
                  <Calendar size={14} /> Date
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 1 }}>
                <Typography fontWeight="600" color="text.secondary" display="flex" alignItems="center" gap={1} variant="caption">
                  <Clock size={14} /> Day
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                  <Typography color="text.secondary" variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Loading holidays...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : holidays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                    <CalendarDays size={32} color={theme.palette.text.secondary} opacity={0.3} />
                    <Typography color="text.secondary" variant="body2" fontWeight="500">
                      No holidays found
                    </Typography>
                    {isConfigured ? (
                      <Typography color="text.secondary" variant="caption">
                        Click "Edit Configuration" to add public holidays
                      </Typography>
                    ) : (
                      <Typography color="text.secondary" variant="caption">
                        Click "Configure Month" to set up attendance and add holidays
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              holidays.map((holiday, index) => (
                <Grow
                  in
                  key={holiday.id || index}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <TableRow
                    hover
                    sx={{
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={index + 1}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: theme.palette.primary.main,
                          fontWeight: '600',
                          height: 22,
                          '& .MuiChip-label': { fontSize: '0.65rem', px: 1 },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            p: 0.3,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.primary.main, 0.06),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Calendar size={14} color={theme.palette.primary.main} />
                        </Box>
                        <Typography variant="caption" fontWeight="500">
                          {formatDate(holiday.date)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getDayName(holiday.date)}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderRadius: 1.5,
                          borderColor: alpha(theme.palette.text.primary, 0.15),
                          color: theme.palette.text.secondary,
                          fontWeight: '500',
                          height: 22,
                          '& .MuiChip-label': { fontSize: '0.65rem', px: 1 },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                </Grow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Configure / Edit Dialog - Optimized size */}
      <Dialog
        open={configOpen}
        onClose={handleCloseConfigDialog}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[20],
            maxWidth: 580,
          },
        }}
      >
        <DialogTitle sx={{ p: 2.5, pb: 1.5 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, width: 40, height: 40 }}>
                {isConfigured ? <Edit2 size={20} /> : <Calendar size={20} />}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.1rem' }}>
                  {isConfigured ? 'Edit Configuration' : 'Configure Month'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Cycle: {formatDate(toDateStr(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()))} - {formatDate(toDateStr(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate()))}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseConfigDialog} disabled={configuring} size="small">
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5, pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Alert severity={isConfigured ? 'info' : 'warning'} sx={{ borderRadius: 2, py: 0.5 }} icon={<AlertCircle size={16} />}>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                Tap a date to mark as holiday, tap again to remove.
                {' '}Currently <strong>{sortedSelectedDates.length}</strong> date(s) selected.
              </Typography>
            </Alert>

            {/* Calendar grid with optimized size */}
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                overflow: 'auto',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 0.3,
                  mb: 0.4,
                }}
              >
                {DAY_LABELS.map((label) => (
                  <Typography
                    key={label}
                    variant="caption"
                    align="center"
                    fontWeight="600"
                    color="text.secondary"
                    sx={{ fontSize: '0.65rem' }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.3,
                }}
              >
                {calendarWeeks.map((week, weekIndex) => (
                  <Box
                    key={weekIndex}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: 0.3,
                    }}
                  >
                    {week.map((date, dayIndex) => {
                      if (date === null) {
                        return <Box key={`blank-${weekIndex}-${dayIndex}`} />;
                      }
                      
                      const year = date.getFullYear();
                      const month = date.getMonth() + 1;
                      const day = date.getDate();
                      const dateStr = toDateStr(year, month, day);
                      const isSelected = selectedDates.has(dateStr);
                      const isInCycle = isDateInAttendanceCycle(dateStr, selectedMonth, selectedYear);
                      
                      return (
                        <Box
                          key={dateStr}
                          onClick={() => !configuring && isInCycle && toggleDate(dateStr)}
                          sx={{
                            width: 38,
                            height: 38,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            cursor: configuring || !isInCycle ? 'default' : 'pointer',
                            userSelect: 'none',
                            fontSize: '10px',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected 
                              ? theme.palette.primary.contrastText 
                              : !isInCycle 
                                ? theme.palette.text.disabled 
                                : theme.palette.text.primary,
                            bgcolor: isSelected 
                              ? theme.palette.primary.main 
                              : !isInCycle 
                                ? alpha(theme.palette.text.disabled, 0.05)
                                : 'transparent',
                            border: `1px solid ${isSelected 
                              ? theme.palette.primary.main 
                              : !isInCycle 
                                ? alpha(theme.palette.text.disabled, 0.1)
                                : alpha(theme.palette.text.primary, 0.08)}`,
                            transition: 'all 0.15s',
                            opacity: !isInCycle ? 0.5 : 1,
                            margin: '0 auto',
                            '&:hover': configuring || !isInCycle ? {} : {
                              bgcolor: isSelected ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.08),
                              transform: 'scale(1.1)',
                              boxShadow: `0 0 0 2px ${isSelected ? theme.palette.primary.main : theme.palette.primary.light}, 0 4px 12px rgba(0,0,0,0.15)`,
                            },
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '10px', 
                              fontWeight: 'inherit',
                              lineHeight: 1,
                            }}
                          >
                            {day}
                          </Typography>
                          {month !== selectedMonth && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '5.5px', 
                                opacity: 0.7, 
                                lineHeight: 1,
                                mt: 0.2,
                              }}
                            >
                              {getMonthName(month).slice(0, 3)}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Paper>

            <Divider sx={{ my: 0.3 }} />

            {/* Selected dates summary */}
            <Box>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ fontSize: '0.8rem' }}>
                Public holidays to be saved:
              </Typography>
              {sortedSelectedDates.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {sortedSelectedDates.map((dateStr) => (
                    <Chip
                      key={dateStr}
                      label={`${formatDate(dateStr)} · ${getDayName(dateStr).slice(0, 3)}`}
                      size="small"
                      onDelete={configuring ? undefined : () => toggleDate(dateStr)}
                      sx={{
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: theme.palette.primary.main,
                        fontWeight: '500',
                        height: 24,
                        '& .MuiChip-label': { fontSize: '0.65rem', px: 1 },
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" variant="body2" sx={{ fontSize: '0.75rem', py: 0.3 }}>
                  No dates selected yet — tap dates on the calendar above to add holidays.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
          <Button
            onClick={handleCloseConfigDialog}
            disabled={configuring}
            size="medium"
            sx={{ 
              borderRadius: 2, 
              px: 2.5, 
              py: 0.6,
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveConfiguration}
            variant="contained"
            disabled={configuring}
            size="medium"
            startIcon={configuring ? <CircularProgress size={18} /> : <Save size={18} />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 0.6,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: theme.shadows[2],
              '&:hover': {
                boxShadow: theme.shadows[4],
                transform: 'translateY(-1px)',
              },
              '&.Mui-disabled': {
                bgcolor: alpha(theme.palette.primary.main, 0.3),
              },
              transition: 'all 0.2s',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            {configuring
              ? (isConfigured ? 'Updating...' : 'Configuring...')
              : (isConfigured ? 'Update Configuration' : 'Save Configuration')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HolidayTab;