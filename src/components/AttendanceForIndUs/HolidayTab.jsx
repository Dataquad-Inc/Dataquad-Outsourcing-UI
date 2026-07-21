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
  TextField,
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
  Plus,
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
  Sparkles,
} from "lucide-react";

// Import from single attendance slice
import {
  fetchHolidays,
  setupAttendanceMonth,
  updateAttendanceMonth,
  deleteAttendanceMonth,
  deleteHoliday,
  openHolidayForm,
  closeHolidayForm,
  setHolidayFormData,
  openConfigDialog,
  closeConfigDialog,
  setConfigData,
  addHolidayLocal,
  deleteHolidayLocal,
  setSelectedMonth,
  setSelectedYear,
  clearSnackbar,
  setSnackbar,
  selectHolidays,
  selectLoading,
  selectError,
  selectHolidayFormOpen,
  selectHolidayFormData,
  selectConfigOpen,
  selectConfigData,
  selectIsConfigured,
  selectConfiguring,
  selectDeletingHoliday,
  selectSelectedMonth,
  selectSelectedYear,
  selectSnackbar,
  selectEntity,
} from "../../redux/attendanceSlice";

const HolidayTab = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Redux state from single slice
  const holidays = useSelector(selectHolidays);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const holidayFormOpen = useSelector(selectHolidayFormOpen);
  const holidayFormData = useSelector(selectHolidayFormData);
  const configOpen = useSelector(selectConfigOpen);
  const configData = useSelector(selectConfigData);
  const isConfigured = useSelector(selectIsConfigured);
  const configuring = useSelector(selectConfiguring);
  const deletingHoliday = useSelector(selectDeletingHoliday);
  const selectedMonth = useSelector(selectSelectedMonth);
  const selectedYear = useSelector(selectSelectedYear);
  const snackbar = useSelector(selectSnackbar);
  const entity = useSelector(selectEntity);

  // State for hover effects
  const [hoveredRow, setHoveredRow] = useState(null);
  
  // State to track if there are any pending local changes
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // Track dialog mode: 'configure' or 'edit'
  const [dialogMode, setDialogMode] = useState('configure');

  // ============================================================
  // FETCH HOLIDAYS ON MOUNT AND MONTH/YEAR CHANGE
  // ============================================================

  useEffect(() => {
    dispatch(fetchHolidays({ month: selectedMonth, year: selectedYear, entity: entity }));
  }, [dispatch, selectedMonth, selectedYear, entity]);

  // Reset local changes flag when month/year changes or configuration status changes
  useEffect(() => {
    setHasLocalChanges(false);
  }, [selectedMonth, selectedYear, isConfigured]);

  // ============================================================
  // HOLIDAY CRUD OPERATIONS
  // ============================================================

  const handleAddHoliday = () => {
    if (!holidayFormData.date) {
      dispatch(setSnackbar({
        open: true,
        message: 'Please select a holiday date',
        severity: 'error',
      }));
      return;
    }

    const existingHoliday = holidays.find(h => h.date === holidayFormData.date);
    if (existingHoliday) {
      dispatch(setSnackbar({
        open: true,
        message: 'A holiday already exists for this date',
        severity: 'warning',
      }));
      return;
    }

    const newHoliday = {
      id: `local-${Date.now()}`,
      date: holidayFormData.date,
    };

    dispatch(addHolidayLocal(newHoliday));
    dispatch(closeHolidayForm());
    setHasLocalChanges(true);
    
    dispatch(setSnackbar({
      open: true,
      message: 'Holiday added successfully! Click "Configure Month" or "Edit Configuration" to save changes.',
      severity: 'success',
    }));
  };

  const handleDeleteHoliday = (holidayId, date) => {
    // Check if it's a local (unsaved) holiday
    if (String(holidayId).startsWith('local-')) {
      // Remove locally
      dispatch(deleteHolidayLocal(holidayId));
      setHasLocalChanges(true);
      dispatch(setSnackbar({
        open: true,
        message: 'Holiday removed locally. Click "Configure Month" or "Edit Configuration" to save changes.',
        severity: 'info',
      }));
      return;
    }

    // Confirm deletion for saved holidays
    if (window.confirm(`Are you sure you want to delete this holiday (${date})?`)) {
      dispatch(deleteHoliday({ 
        month: selectedMonth, 
        year: selectedYear, 
        entity: entity,
        date: date 
      })).then((result) => {
        if (result.payload?.success) {
          // Refetch holidays to get the updated list
          dispatch(fetchHolidays({ month: selectedMonth, year: selectedYear, entity: entity }));
        }
      });
    }
  };

  const handleOpenHolidayForm = () => {
    dispatch(setHolidayFormData({ date: '' }));
    dispatch(openHolidayForm());
  };

  const handleCloseHolidayForm = () => {
    dispatch(closeHolidayForm());
  };

  // ============================================================
  // CONFIGURE / EDIT ATTENDANCE MONTH - SEPARATE HANDLERS
  // ============================================================

  // Open Configure Dialog
  const handleOpenConfigureDialog = () => {
    setDialogMode('configure');
    dispatch(setConfigData({ 
      month: selectedMonth, 
      year: selectedYear 
    }));
    dispatch(openConfigDialog());
  };

  // Open Edit Configuration Dialog
  const handleOpenEditDialog = () => {
    setDialogMode('edit');
    dispatch(setConfigData({ 
      month: selectedMonth, 
      year: selectedYear 
    }));
    dispatch(openConfigDialog());
  };

  // Handle Configure/Edit Save
  const handleSaveConfiguration = async () => {
    // Get the current holidays (including local ones)
    const publicHolidays = holidays.map(h => h.date);
    
    const payload = {
      month: configData.month,
      year: configData.year,
      publicHolidays: publicHolidays,
      entity: entity,
    };

    let result;
    
    // Check mode to determine which action to dispatch
    if (dialogMode === 'edit') {
      // If in edit mode, use update
      result = await dispatch(updateAttendanceMonth(payload));
    } else {
      // Otherwise, use setup (configure)
      result = await dispatch(setupAttendanceMonth(payload));
    }

    if (result.payload?.success) {
      dispatch(closeConfigDialog());
      setHasLocalChanges(false);
      setDialogMode('configure'); // Reset mode
      // Refetch to get the latest data from backend
      dispatch(fetchHolidays({ month: selectedMonth, year: selectedYear, entity: entity }));
      
      dispatch(setSnackbar({
        open: true,
        message: dialogMode === 'edit' 
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
        setHasLocalChanges(false);
        setDialogMode('configure'); // Reset mode
      }
    }
  };

  // ============================================================
  // HANDLE MONTH/YEAR CHANGE
  // ============================================================

  const handleMonthChange = (event) => {
    const newMonth = parseInt(event.target.value);
    dispatch(setSelectedMonth(newMonth));
    dispatch(setConfigData({ month: newMonth }));
  };

  const handleYearChange = (event) => {
    const newYear = parseInt(event.target.value);
    dispatch(setSelectedYear(newYear));
    dispatch(setConfigData({ year: newYear }));
  };

  const handleRefresh = () => {
    dispatch(fetchHolidays({ month: selectedMonth, year: selectedYear, entity: entity }));
    setHasLocalChanges(false);
  };

  // ============================================================
  // FORMAT DATE
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

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Box sx={{ p: 4, maxWidth: 1400, margin: '0 auto' }}>
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

      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
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
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    width: 56,
                    height: 56,
                  }}
                >
                  <CalendarDays size={28} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="700" color="text.primary">
                    Holiday Management
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Manage public holidays for {getMonthName(selectedMonth)} {selectedYear}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box display="flex" gap={1}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={selectedMonth}
                      onChange={handleMonthChange}
                      label="Month"
                      disabled={loading || configuring}
                      sx={{ borderRadius: 2 }}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <MenuItem key={month} value={month}>
                          {getMonthName(month)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 110 }}>
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={selectedYear}
                      onChange={handleYearChange}
                      label="Year"
                      disabled={loading || configuring}
                      sx={{ borderRadius: 2 }}
                    >
                      {[2024, 2025, 2026, 2027, 2028].map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <IconButton
                    onClick={handleRefresh}
                    disabled={loading || configuring}
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={20} /> : <RefreshCw size={18} />}
                  </IconButton>
                </Box>

                {/* ALL BUTTONS RENDERED SEPARATELY - NO CONDITIONS */}
                {/* Configure Month Button - Always visible */}
                <Button
                  variant="contained"
                  startIcon={<Calendar size={18} />}
                  onClick={handleOpenConfigureDialog}
                  disabled={loading || configuring}
                  sx={{
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: theme.shadows[4],
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  Configure Month
                </Button>

                {/* Edit Configuration Button - Always visible */}
                <Button
                  variant="contained"
                  startIcon={<Edit2 size={18} />}
                  onClick={handleOpenEditDialog}
                  disabled={loading || configuring}
                  sx={{
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                    boxShadow: theme.shadows[4],
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  Edit Configuration
                </Button>

                {/* Delete Config Button - Always visible */}
                <Button
                  variant="outlined"
                  startIcon={<Trash2 size={18} />}
                  onClick={handleDeleteConfiguration}
                  disabled={loading || configuring}
                  sx={{
                    borderRadius: 2,
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                    '&:hover': {
                      borderColor: theme.palette.error.dark,
                      backgroundColor: alpha(theme.palette.error.main, 0.05),
                    },
                  }}
                >
                  Delete Config
                </Button>

                {/* Add Holiday Button - Always visible */}
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={handleOpenHolidayForm}
                  disabled={loading || configuring}
                  sx={{
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                    boxShadow: theme.shadows[4],
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  Add Holiday
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
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
              mb: 3, 
              borderRadius: 2,
              boxShadow: theme.shadows[2],
            }}
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Configuration Status Banner */}
      {!isConfigured ? (
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: 2 }}
          icon={<AlertCircle size={18} />}
        >
          This month is not configured yet. Add holidays and click <strong>"Configure Month"</strong> to set up the attendance for {getMonthName(selectedMonth)} {selectedYear}.
          {holidays.length > 0 && ` You have ${holidays.length} holiday(s) that will be applied.`}
          {hasLocalChanges && (
            <span style={{ display: 'block', marginTop: '8px' }}>
              <Chip
                label="Unsaved Changes"
                size="small"
                color="warning"
                sx={{ fontWeight: 'bold' }}
              />
              {' Click "Configure Month" to save your changes.'}
            </span>
          )}
        </Alert>
      ) : (
        <Alert
          severity="success"
          sx={{ mb: 3, borderRadius: 2 }}
          icon={<CheckCircle size={18} />}
        >
          This month is configured. You can add or remove holidays and click <strong>"Edit Configuration"</strong> to update the attendance settings.
          {hasLocalChanges && (
            <span style={{ display: 'block', marginTop: '8px' }}>
              <Chip
                label="Unsaved Changes"
                size="small"
                color="warning"
                sx={{ fontWeight: 'bold' }}
              />
              {' Click "Edit Configuration" to save your changes.'}
            </span>
          )}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in style={{ transitionDelay: '100ms' }}>
            <Card
              sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="500">
                      Total Holidays
                    </Typography>
                    <Typography variant="h3" fontWeight="700" color="primary.main">
                      {holidays.length}
                    </Typography>
                    {hasLocalChanges && (
                      <Chip
                        label="Unsaved"
                        size="small"
                        color="warning"
                        sx={{ mt: 0.5, height: 20, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                    <Calendar size={24} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in style={{ transitionDelay: '200ms' }}>
            <Card
              sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="500">
                      Status
                    </Typography>
                    <Typography variant="h6" fontWeight="600" color={isConfigured ? 'success.main' : 'warning.main'}>
                      {isConfigured ? 'Configured ✓' : 'Not Configured'}
                    </Typography>
                    {isConfigured && hasLocalChanges && (
                      <Chip
                        label="Pending Save"
                        size="small"
                        color="warning"
                        sx={{ mt: 0.5, height: 20, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: isConfigured ? theme.palette.success.main : theme.palette.warning.main }}>
                    {isConfigured ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in style={{ transitionDelay: '300ms' }}>
            <Card
              sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="500">
                      Month
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {getMonthName(selectedMonth)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
                    <Clock size={24} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in style={{ transitionDelay: '400ms' }}>
            <Card
              sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="500">
                      Year
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {selectedYear}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main }}>
                    <Hash size={24} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {/* Holiday Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            <TableRow>
              <TableCell sx={{ py: 2 }}>
                <Typography fontWeight="600" color="text.secondary" display="flex" alignItems="center" gap={1}>
                  <Hash size={16} /> #
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 2 }}>
                <Typography fontWeight="600" color="text.secondary" display="flex" alignItems="center" gap={1}>
                  <Calendar size={16} /> Date
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 2 }}>
                <Typography fontWeight="600" color="text.secondary" display="flex" alignItems="center" gap={1}>
                  <Clock size={16} /> Day
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ py: 2 }}>
                <Typography fontWeight="600" color="text.secondary">
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={40} />
                  <Typography color="text.secondary" sx={{ mt: 2 }}>
                    Loading holidays...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : holidays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <CalendarDays size={48} color={theme.palette.text.secondary} opacity={0.3} />
                    <Typography color="text.secondary" variant="h6" fontWeight="500">
                      No holidays found
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Click "Add Holiday" to add a new holiday, then click "Configure Month" to save
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              holidays.map((holiday, index) => {
                const isLocal = String(holiday.id).startsWith('local-');
                const isDeleting = deletingHoliday;
                return (
                  <Grow
                    in
                    key={holiday.id || index}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <TableRow
                      hover
                      onMouseEnter={() => setHoveredRow(index)}
                      onMouseLeave={() => setHoveredRow(null)}
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
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.primary.main, 0.06),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Calendar size={18} color={theme.palette.primary.main} />
                          </Box>
                          <Typography variant="body2" fontWeight="500">
                            {formatDate(holiday.date)}
                          </Typography>
                          {isLocal && (
                            <Chip
                              label="Unsaved"
                              size="small"
                              color="warning"
                              sx={{ height: 20, fontSize: '0.6rem' }}
                            />
                          )}
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
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleDeleteHoliday(holiday.id, holiday.date)}
                          disabled={isDeleting}
                          sx={{
                            color: theme.palette.error.main,
                            transition: 'all 0.2s',
                            opacity: (hoveredRow === index) ? 1 : 0.6,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.08),
                              transform: 'scale(1.1)',
                            },
                            '&.Mui-disabled': {
                              opacity: 0.3,
                            },
                          }}
                        >
                          {isDeleting ? <CircularProgress size={18} /> : <Trash2 size={18} />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </Grow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Holiday Form Dialog */}
      <Dialog
        open={holidayFormOpen}
        onClose={handleCloseHolidayForm}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.shadows[20],
          },
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                <Plus size={20} />
              </Avatar>
              <Typography variant="h6" fontWeight="600">
                Add New Holiday
              </Typography>
            </Box>
            <IconButton onClick={handleCloseHolidayForm} size="small">
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert
              severity="info"
              sx={{ borderRadius: 2 }}
              icon={<Sparkles size={18} />}
            >
              Select a date to mark as a public holiday for {getMonthName(selectedMonth)} {selectedYear}
            </Alert>

            <TextField
              fullWidth
              type="date"
              label="Holiday Date"
              InputLabelProps={{ shrink: true }}
              value={holidayFormData.date || ''}
              onChange={(e) => dispatch(setHolidayFormData({ date: e.target.value }))}
              required
              inputProps={{
                min: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
                max: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              helperText={`Select a date within ${getMonthName(selectedMonth)} ${selectedYear}`}
            />

            {holidayFormData.date && (
              <Fade in={!!holidayFormData.date}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <CheckCircle size={20} color={theme.palette.success.main} />
                    <Typography variant="body2" color="text.secondary">
                      You are adding <strong>{formatDate(holidayFormData.date)}</strong> ({getDayName(holidayFormData.date)}) as a public holiday
                    </Typography>
                  </Box>
                </Paper>
              </Fade>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleCloseHolidayForm}
            sx={{
              borderRadius: 2,
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddHoliday}
            variant="contained"
            disabled={!holidayFormData.date}
            startIcon={<CheckCircle size={18} />}
            sx={{
              borderRadius: 2,
              px: 4,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: theme.shadows[4],
              '&:hover': {
                boxShadow: theme.shadows[8],
                transform: 'translateY(-2px)',
              },
              '&.Mui-disabled': {
                bgcolor: alpha(theme.palette.primary.main, 0.3),
              },
              transition: 'all 0.2s',
            }}
          >
            Add Holiday
          </Button>
        </DialogActions>
      </Dialog>

      {/* Configuration Dialog - Updated with mode-based rendering */}
      <Dialog
        open={configOpen}
        onClose={() => !configuring && dispatch(closeConfigDialog())}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.shadows[20],
          },
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                {dialogMode === 'edit' ? <Edit2 size={20} /> : <Calendar size={20} />}
              </Avatar>
              <Typography variant="h6" fontWeight="600">
                {dialogMode === 'edit' ? 'Edit Configuration' : 'Configure Month'}
              </Typography>
            </Box>
            <IconButton
              onClick={() => !configuring && dispatch(closeConfigDialog())}
              disabled={configuring}
              size="small"
            >
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert
              severity={dialogMode === 'edit' ? 'info' : 'warning'}
              sx={{ borderRadius: 2 }}
            >
              {dialogMode === 'edit'
                ? `This will update the attendance configuration for ${getMonthName(configData.month)} ${configData.year} with ${holidays.length} public holiday(s).`
                : `This will configure the attendance for ${getMonthName(configData.month)} ${configData.year} with ${holidays.length} public holiday(s).`
              }
              {holidays.length === 0 && dialogMode === 'configure' && (
                <span style={{ display: 'block', marginTop: '8px' }}>
                  <strong>Note:</strong> You can configure the month even without any holidays.
                </span>
              )}
              {hasLocalChanges && (
                <span style={{ display: 'block', marginTop: '8px' }}>
                  <Chip
                    label="Unsaved Changes"
                    size="small"
                    color="warning"
                    sx={{ fontWeight: 'bold' }}
                  />
                  {' Click Save to apply your changes.'}
                </span>
              )}
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={configData.month}
                    onChange={(e) =>
                      dispatch(setConfigData({ month: parseInt(e.target.value) }))
                    }
                    label="Month"
                    disabled={configuring}
                    sx={{ borderRadius: 2 }}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <MenuItem key={month} value={month}>
                        {getMonthName(month)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={configData.year}
                    onChange={(e) =>
                      dispatch(setConfigData({ year: parseInt(e.target.value) }))
                    }
                    label="Year"
                    disabled={configuring}
                    sx={{ borderRadius: 2 }}
                  >
                    {[2024, 2025, 2026, 2027, 2028].map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            <Box>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Public Holidays to be applied:
              </Typography>
              {holidays.length > 0 ? (
                <Stack spacing={1.5}>
                  {holidays.map((holiday, index) => {
                    const isLocal = String(holiday.id).startsWith('local-');
                    return (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: isLocal ? alpha(theme.palette.warning.main, 0.08) : alpha(theme.palette.primary.main, 0.04),
                          border: `1px solid ${isLocal ? alpha(theme.palette.warning.main, 0.2) : alpha(theme.palette.primary.main, 0.08)}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <CheckCircle size={16} color={isLocal ? theme.palette.warning.main : theme.palette.success.main} />
                        <Typography variant="body2">
                          <strong>{formatDate(holiday.date)}</strong>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            ({getDayName(holiday.date)})
                          </Typography>
                          {isLocal && (
                            <Chip
                              label="Unsaved"
                              size="small"
                              color="warning"
                              sx={{ ml: 1, height: 20, fontSize: '0.6rem' }}
                            />
                          )}
                        </Typography>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Typography color="text.secondary" variant="body2" sx={{ py: 2, textAlign: 'center' }}>
                  No holidays to apply. Click "Add Holiday" to add holidays, then save configuration.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => dispatch(closeConfigDialog())}
            disabled={configuring}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveConfiguration}
            variant="contained"
            disabled={configuring}
            startIcon={configuring ? <CircularProgress size={20} /> : <Save size={18} />}
            sx={{
              borderRadius: 2,
              px: 4,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: theme.shadows[4],
              '&:hover': {
                boxShadow: theme.shadows[8],
                transform: 'translateY(-2px)',
              },
              '&.Mui-disabled': {
                bgcolor: alpha(theme.palette.primary.main, 0.3),
              },
              transition: 'all 0.2s',
            }}
          >
            {configuring
              ? (dialogMode === 'edit' ? 'Updating...' : 'Configuring...')
              : (dialogMode === 'edit' ? 'Update Configuration' : 'Save Configuration')
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HolidayTab;