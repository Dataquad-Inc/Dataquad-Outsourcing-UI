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

// ============================================================
// HOLIDAY STATUS OPTIONS (for the popup)
// Includes LL and SP in addition to the dashboard statuses
// ============================================================

const HOLIDAY_STATUS_OPTIONS = [
  { code: "P",   label: "Present",            color: "#4CAF50" },
  { code: "WFH", label: "Work From Home",     color: "#FF9800" },
  { code: "HD",  label: "Half Day",           color: "#AB47BC" },
  { code: "L",   label: "Leave",              color: "#EF5350" },
  { code: "PH",  label: "Public Holiday",     color: "#42A5F5" },
  { code: "WO",  label: "Week Off",           color: "#FFA726" },
  { code: "LOP", label: "Loss of Pay",        color: "#EF5350" },
  { code: "LL",  label: "Leave Type LL",      color: "#EF5350" },
  { code: "SP",  label: "Special Permission", color: "#26C6DA" },
  { code: "",    label: "Not Marked",         color: "#E0E0E0" },
];

// ============================================================
// FIXED MAPPING FOR PAYLOAD
// Exactly matches the spec:
//   attendanceValue = 1.0 for all except HD (0.5)
//   remarks use the lowercase-style strings from the spec
// ============================================================

const HOLIDAY_EDIT_MAP = {
  P:   { attendanceValue: 1.0, remarks: "Present" },
  WFH: { attendanceValue: 1.0, remarks: "Work from home" },
  HD:  { attendanceValue: 0.5, remarks: "Half day" },
  L:   { attendanceValue: 1.0, remarks: "Leave" },
  PH:  { attendanceValue: 1.0, remarks: "Public holiday" },
  WO:  { attendanceValue: 1.0, remarks: "Week off" },
  LOP: { attendanceValue: 1.0, remarks: "Loss of pay" },
  LL:  { attendanceValue: 1.0, remarks: "Leave type LL" },
  SP:  { attendanceValue: 1.0, remarks: "Special permission" },
};

// ============================================================
// SINGLE DATE EDIT DIALOG
// ============================================================

const HolidayEditDialog = ({ open, onClose, dateStr, currentStatus, onSave }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || "");
  const configuring = useSelector(selectConfiguring);

  useEffect(() => {
    setSelectedStatus(currentStatus || "");
  }, [currentStatus, open]);

  const handleSave = async () => {
    await onSave(dateStr, selectedStatus);
    onClose();
  };

  if (!dateStr) return null;

  const formatDisplayDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      weekday: "short",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Edit Holiday Status
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {formatDisplayDate(dateStr)}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={1} sx={{ mt: 1 }}>
          {HOLIDAY_STATUS_OPTIONS.map((option) => {
            const isSelected = selectedStatus === option.code;
            return (
              <Paper
                key={option.code || "none"}
                elevation={0}
                onClick={() => setSelectedStatus(option.code)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: isSelected
                    ? `2px solid ${option.color}`
                    : "1px solid #E8E8E8",
                  backgroundColor: isSelected
                    ? alpha(option.color, 0.08)
                    : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  "&:hover": {
                    backgroundColor: isSelected
                      ? alpha(option.color, 0.12)
                      : "#F5F5F5",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "4px",
                    backgroundColor: option.color,
                    opacity: option.code === "" ? 0.3 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {option.code || "—"}
                </Box>
                <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                  {option.label}
                </Typography>
                {isSelected && (
                  <CheckCircle
                    size={16}
                    style={{ color: option.color, marginLeft: "auto" }}
                  />
                )}
              </Paper>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: "#666" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={configuring || selectedStatus === currentStatus}
          startIcon={
            configuring ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Save size={16} />
            )
          }
          sx={{
            backgroundColor: "#0F7C82",
            "&:hover": { backgroundColor: "#0A5E63" },
            "&.Mui-disabled": { backgroundColor: alpha("#0F7C82", 0.5) },
          }}
        >
          {configuring ? "Saving..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================
// MAIN HOLIDAY TAB
// ============================================================

const HolidayTab = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

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

  // Map of dateStr -> attendanceStatus for this dialog session
  const [dateStatusMap, setDateStatusMap] = useState({});

  // Single-date edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDate, setEditingDate] = useState(null);

  // ============================================================
  // FETCH HOLIDAYS
  // ============================================================
  useEffect(() => {
    dispatch(
      fetchHolidays({
        month: selectedMonth,
        year: selectedYear,
        entity: entity,
      })
    );
  }, [dispatch, selectedMonth, selectedYear, entity]);

  // ============================================================
  // OPEN / CLOSE CONFIG DIALOG
  // ============================================================
  const handleOpenConfigDialog = () => {
    const map = {};
    holidays.forEach((h) => {
      const d = h.date || h.attendanceDate;
      if (!d) return;
      map[d] = h.attendanceStatus || h.status || "PH";
    });
    setDateStatusMap(map);
    dispatch(setConfigData({ month: selectedMonth, year: selectedYear }));
    dispatch(openConfigDialog());
  };

  const handleCloseConfigDialog = () => {
    if (configuring) return;
    dispatch(closeConfigDialog());
    setEditDialogOpen(false);
    setEditingDate(null);
  };

  // Legacy toggle (used only in Configure Month / setup mode)
  const toggleDate = (dateStr) => {
    setDateStatusMap((prev) => {
      const next = { ...prev };
      if (next[dateStr]) {
        delete next[dateStr];
      } else {
        next[dateStr] = "PH";
      }
      return next;
    });
  };

  // ============================================================
  // CELL CLICK
  // - Setup mode  (isConfigured === false) → legacy toggle
  // - Edit mode   (isConfigured === true)  → open popup
  // ============================================================
  const handleCellClick = (dateStr) => {
    if (configuring) return;

    if (!isConfigured) {
      // Setup mode → old behavior
      toggleDate(dateStr);
      return;
    }

    // Edit mode → popup
    setEditingDate(dateStr);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditingDate(null);
  };

  const handleSaveDateStatus = (dateStr, status) => {
    setDateStatusMap((prev) => {
      const next = { ...prev };
      if (!status) {
        delete next[dateStr];
      } else {
        next[dateStr] = status;
      }
      return next;
    });
  };

  // ============================================================
  // SAVE CONFIGURATION
  // - publicHolidays = ONLY dates whose status is "PH"
  // - attendanceEdits = ALL selected dates with fixed mapping
  // - POST path (setup): sends both — server ignores extras
  // - PUT path (edit):  sends both — server uses attendanceEdits
  // ============================================================
  const handleSaveConfiguration = async () => {
    const sortedDates = Object.keys(dateStatusMap).sort();

    const publicHolidays = sortedDates.filter(
      (date) => dateStatusMap[date] === "PH"
    );

    const attendanceEdits = sortedDates.map((date) => {
      const status = dateStatusMap[date];
      const mapped = HOLIDAY_EDIT_MAP[status] || {
        attendanceValue: 1.0,
        remarks: status,
      };
      return {
        date,
        attendanceStatus: status,
        attendanceValue: mapped.attendanceValue,
        remarks: mapped.remarks,
      };
    });

    const payload = {
      month: selectedMonth,
      year: selectedYear,
      publicHolidays,
      entity,
      attendanceEdits,
    };

    const result = isConfigured
      ? await dispatch(updateAttendanceMonth(payload))
      : await dispatch(setupAttendanceMonth(payload));

    if (result.payload?.success) {
      dispatch(closeConfigDialog());
      await dispatch(
        fetchHolidays({
          month: selectedMonth,
          year: selectedYear,
          entity: entity,
        })
      );

      dispatch(
        setSnackbar({
          open: true,
          message: isConfigured
            ? "Configuration updated successfully!"
            : "Month configured successfully!",
          severity: "success",
        })
      );
    }
  };

  // ============================================================
  // DELETE CONFIG
  // ============================================================
  const handleDeleteConfiguration = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete the attendance configuration for ${getMonthName(
          selectedMonth
        )} ${selectedYear}? This will remove all holidays.`
      )
    ) {
      const result = await dispatch(
        deleteAttendanceMonth({
          month: selectedMonth,
          year: selectedYear,
          entity: entity,
        })
      );

      if (result.payload?.success) {
        await dispatch(
          fetchHolidays({
            month: selectedMonth,
            year: selectedYear,
            entity: entity,
          })
        );
        dispatch(
          setSnackbar({
            open: true,
            message: "Configuration deleted successfully!",
            severity: "success",
          })
        );
      }
    }
  };

  // ============================================================
  // MONTH / YEAR
  // ============================================================
  const handleMonthChange = (event) => {
    dispatch(setSelectedMonth(parseInt(event.target.value)));
    setDateStatusMap({});
  };

  const handleYearChange = (event) => {
    dispatch(setSelectedYear(parseInt(event.target.value)));
    setDateStatusMap({});
  };

  const handleRefresh = () => {
    dispatch(
      fetchHolidays({
        month: selectedMonth,
        year: selectedYear,
        entity: entity,
      })
    );
  };

  // ============================================================
  // DATE HELPERS
  // ============================================================
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDayName = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
    });
  };

  const getMonthName = (month) => {
    return new Date(2026, month - 1).toLocaleString("default", {
      month: "long",
    });
  };

  const toDateStr = (year, month, day) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getAttendanceCycleRange = (month, year) => {
    let startMonth = month - 1;
    let startYear = year;
    if (startMonth < 1) {
      startMonth = 12;
      startYear = year - 1;
    }
    return {
      startDate: new Date(startYear, startMonth - 1, 26),
      endDate: new Date(year, month - 1, 25),
    };
  };

  const isDateInAttendanceCycle = (date, month, year) => {
    const { startDate, endDate } = getAttendanceCycleRange(month, year);
    const checkDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate >= startDate && checkDate <= endDate;
  };

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

  const getAttendanceCycleCalendar = (month, year) => {
    const cycleDates = getAttendanceCycleDates(month, year);
    const calendar = [];
    let week = [];
    const firstDayOfWeek = cycleDates[0].getDay();
    for (let i = 0; i < firstDayOfWeek; i++) week.push(null);
    cycleDates.forEach((date) => {
      week.push(date);
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    });
    while (week.length > 0 && week.length < 7) week.push(null);
    if (week.length > 0) calendar.push(week);
    return calendar;
  };

  const calendarWeeks = getAttendanceCycleCalendar(selectedMonth, selectedYear);
  const sortedSelectedDates = Object.keys(dateStatusMap).sort();
  const { startDate, endDate } = getAttendanceCycleRange(
    selectedMonth,
    selectedYear
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Box sx={{ p: 2, maxWidth: 1400, margin: "0 auto" }}>
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => dispatch(clearSnackbar())}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        TransitionComponent={Grow}
        sx={{ top: "80px !important", right: "50px !important" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => dispatch(clearSnackbar())}
          icon={
            snackbar.severity === "success" ? (
              <CheckCircle size={20} />
            ) : snackbar.severity === "error" ? (
              <AlertCircle size={20} />
            ) : undefined
          }
          variant="filled"
          sx={{ borderRadius: 2, boxShadow: theme.shadows[8] }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Hero */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.05
          )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
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
                  <Typography variant="h6" fontWeight="700">
                    Holiday Management
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Attendance Cycle:{" "}
                    {formatDate(
                      toDateStr(
                        startDate.getFullYear(),
                        startDate.getMonth() + 1,
                        startDate.getDate()
                      )
                    )}{" "}
                    -{" "}
                    {formatDate(
                      toDateStr(
                        endDate.getFullYear(),
                        endDate.getMonth() + 1,
                        endDate.getDate()
                      )
                    )}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box display="flex" gap={0.5}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ fontSize: "0.8rem" }}>Month</InputLabel>
                    <Select
                      value={selectedMonth}
                      onChange={handleMonthChange}
                      label="Month"
                      disabled={loading || configuring}
                      sx={{ borderRadius: 2, fontSize: "0.8rem", height: 36 }}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <MenuItem key={m} value={m} sx={{ fontSize: "0.8rem" }}>
                          {getMonthName(m)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 90 }}>
                    <InputLabel sx={{ fontSize: "0.8rem" }}>Year</InputLabel>
                    <Select
                      value={selectedYear}
                      onChange={handleYearChange}
                      label="Year"
                      disabled={loading || configuring}
                      sx={{ borderRadius: 2, fontSize: "0.8rem", height: 36 }}
                    >
                      {[2024, 2025, 2026, 2027, 2028].map((y) => (
                        <MenuItem key={y} value={y} sx={{ fontSize: "0.8rem" }}>
                          {y}
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
                      border: `1px solid ${alpha(
                        theme.palette.primary.main,
                        0.2
                      )}`,
                      width: 36,
                      height: 36,
                      "&:hover": {
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.05
                        ),
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={18} />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                  </IconButton>
                </Box>

                <Button
                  variant="contained"
                  startIcon={
                    isConfigured ? <Edit2 size={16} /> : <Calendar size={16} />
                  }
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
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  {isConfigured ? "Edit Configuration" : "Configure Month"}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Trash2 size={16} />}
                  onClick={handleDeleteConfiguration}
                  disabled={loading || configuring || !isConfigured}
                  size="medium"
                  sx={{
                    borderRadius: 2,
                    py: 0.6,
                    px: 2.5,
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  Delete Config
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Error */}
      {error && (
        <Fade in={!!error}>
          <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
            {error}
          </Alert>
        </Fade>
      )}

      {/* Status banner */}
      {!isConfigured ? (
        <Alert
          severity="info"
          sx={{ mb: 1.5, borderRadius: 2, py: 0.5 }}
          icon={<AlertCircle size={16} />}
        >
          <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
            This attendance cycle is not configured yet. Click{" "}
            <strong>"Configure Month"</strong> to set up attendance and add
            holidays.
          </Typography>
        </Alert>
      ) : (
        <Alert
          severity="success"
          sx={{ mb: 1.5, borderRadius: 2, py: 0.5 }}
          icon={<CheckCircle size={16} />}
        >
          <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
            This attendance cycle is configured with{" "}
            <strong>{holidays.length}</strong> public holiday(s). Click{" "}
            <strong>"Edit Configuration"</strong> to add or remove holidays.
          </Typography>
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Zoom in key={`stats-${selectedMonth}-${selectedYear}`}>
            <Card
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.05
                )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                      Total Holidays
                    </Typography>
                    <Typography variant="h5" fontWeight="700" color="primary.main">
                      {holidays.length}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      width: 36,
                      height: 36,
                    }}
                  >
                    <Calendar size={18} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Zoom in key={`status-${selectedMonth}-${selectedYear}`}>
            <Card
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.success.main,
                  0.05
                )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
              }}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                      Status
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      color={isConfigured ? "success.main" : "warning.main"}
                    >
                      {isConfigured ? "Configured ✓" : "Not Configured"}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: isConfigured
                        ? theme.palette.success.main
                        : theme.palette.warning.main,
                      width: 36,
                      height: 36,
                    }}
                  >
                    {isConfigured ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Zoom in key={`cycle-${selectedMonth}-${selectedYear}`}>
            <Card
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.info.main,
                  0.05
                )} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              }}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                      Cycle Period
                    </Typography>
                    <Typography variant="caption" fontWeight="600" display="block">
                      {formatDate(
                        toDateStr(
                          startDate.getFullYear(),
                          startDate.getMonth() + 1,
                          startDate.getDate()
                        )
                      )}{" "}
                      -{" "}
                      {formatDate(
                        toDateStr(
                          endDate.getFullYear(),
                          endDate.getMonth() + 1,
                          endDate.getDate()
                        )
                      )}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main,
                      width: 36,
                      height: 36,
                    }}
                  >
                    <Clock size={18} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {/* Holiday list */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          overflow: "hidden",
          maxHeight: 300,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            <TableRow>
              <TableCell sx={{ py: 1 }}>
                <Typography fontWeight="600" color="text.secondary" variant="caption">
                  <Hash size={14} style={{ verticalAlign: "middle" }} /> #
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 1 }}>
                <Typography fontWeight="600" color="text.secondary" variant="caption">
                  <Calendar size={14} style={{ verticalAlign: "middle" }} /> Date
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 1 }}>
                <Typography fontWeight="600" color="text.secondary" variant="caption">
                  <Clock size={14} style={{ verticalAlign: "middle" }} /> Day
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
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
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              holidays.map((holiday, index) => (
                <Grow in key={holiday.id || `${holiday.date}-${index}`}>
                  <TableRow hover>
                    <TableCell>
                      <Chip label={index + 1} size="small" sx={{ height: 22 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontWeight="500">
                        {formatDate(holiday.date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getDayName(holiday.date)}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22 }}
                      />
                    </TableCell>
                  </TableRow>
                </Grow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ============================================================
          CONFIGURE / EDIT DIALOG
          ============================================================ */}
      <Dialog
        open={configOpen}
        onClose={handleCloseConfigDialog}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
        PaperProps={{
          sx: { borderRadius: 2, boxShadow: theme.shadows[20], maxWidth: 580 },
        }}
      >
        <DialogTitle sx={{ p: 2.5, pb: 1.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  width: 40,
                  height: 40,
                }}
              >
                {isConfigured ? <Edit2 size={20} /> : <Calendar size={20} />}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="600" sx={{ fontSize: "1.1rem" }}>
                  {isConfigured ? "Edit Configuration" : "Configure Month"}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                  Cycle:{" "}
                  {formatDate(
                    toDateStr(
                      startDate.getFullYear(),
                      startDate.getMonth() + 1,
                      startDate.getDate()
                    )
                  )}{" "}
                  -{" "}
                  {formatDate(
                    toDateStr(
                      endDate.getFullYear(),
                      endDate.getMonth() + 1,
                      endDate.getDate()
                    )
                  )}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseConfigDialog} disabled={configuring} size="small">
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5, pt: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Alert
              severity={isConfigured ? "info" : "warning"}
              sx={{ borderRadius: 2, py: 0.5 }}
              icon={<AlertCircle size={16} />}
            >
              <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                {isConfigured
                  ? "Tap a date to select its status."
                  : "Tap a date to mark as holiday, tap again to remove."}{" "}
                Currently <strong>{sortedSelectedDates.length}</strong> date(s) selected.
              </Typography>
            </Alert>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                overflow: "auto",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
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
                    sx={{ fontSize: "0.65rem" }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
                {calendarWeeks.map((week, weekIndex) => (
                  <Box
                    key={weekIndex}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
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
                      const status = dateStatusMap[dateStr];
                      const isSelected = !!status;
                      const isInCycle = isDateInAttendanceCycle(
                        dateStr,
                        selectedMonth,
                        selectedYear
                      );
                      const statusOption = HOLIDAY_STATUS_OPTIONS.find(
                        (o) => o.code === status
                      );
                      const statusColor = statusOption
                        ? statusOption.color
                        : theme.palette.primary.main;

                      return (
                        <Box
                          key={dateStr}
                          onClick={() =>
                            !configuring && isInCycle && handleCellClick(dateStr)
                          }
                          sx={{
                            width: 38,
                            height: 38,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "4px",
                            cursor:
                              configuring || !isInCycle ? "default" : "pointer",
                            userSelect: "none",
                            fontSize: "10px",
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected
                              ? theme.palette.getContrastText(statusColor)
                              : !isInCycle
                              ? theme.palette.text.disabled
                              : theme.palette.text.primary,
                            bgcolor: isSelected
                              ? statusColor
                              : !isInCycle
                              ? alpha(theme.palette.text.disabled, 0.05)
                              : "transparent",
                            border: `1px solid ${
                              isSelected
                                ? statusColor
                                : !isInCycle
                                ? alpha(theme.palette.text.disabled, 0.1)
                                : alpha(theme.palette.text.primary, 0.08)
                            }`,
                            opacity: !isInCycle ? 0.5 : 1,
                            margin: "0 auto",
                            "&:hover":
                              configuring || !isInCycle
                                ? {}
                                : {
                                    bgcolor: isSelected
                                      ? statusColor
                                      : alpha(theme.palette.primary.main, 0.08),
                                    transform: "scale(1.1)",
                                    boxShadow: `0 0 0 2px ${
                                      isSelected
                                        ? statusColor
                                        : theme.palette.primary.light
                                    }, 0 4px 12px rgba(0,0,0,0.15)`,
                                  },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontSize: "10px", fontWeight: "inherit", lineHeight: 1 }}
                          >
                            {day}
                          </Typography>
                          {isSelected && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "6.5px",
                                fontWeight: 700,
                                lineHeight: 1,
                                mt: 0.2,
                                color: "inherit",
                              }}
                            >
                              {status}
                            </Typography>
                          )}
                          {!isSelected && month !== selectedMonth && (
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "5.5px", opacity: 0.7, lineHeight: 1, mt: 0.2 }}
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

            <Box>
              <Typography
                variant="subtitle2"
                fontWeight="600"
                gutterBottom
                sx={{ fontSize: "0.8rem" }}
              >
                Dates to be saved:
              </Typography>
              {sortedSelectedDates.length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {sortedSelectedDates.map((dateStr) => {
                    const status = dateStatusMap[dateStr];
                    const option = HOLIDAY_STATUS_OPTIONS.find(
                      (o) => o.code === status
                    );
                    const color = option ? option.color : "#42A5F5";
                    return (
                      <Chip
                        key={dateStr}
                        label={
                          isConfigured
                            ? `${formatDate(dateStr)} · ${status}`
                            : formatDate(dateStr)
                        }
                        size="small"
                        onDelete={configuring ? undefined : () => toggleDate(dateStr)}
                        onClick={
                          configuring || !isConfigured
                            ? undefined
                            : () => handleCellClick(dateStr)
                        }
                        sx={{
                          borderRadius: 1.5,
                          bgcolor: alpha(color, 0.1),
                          color: color,
                          border: `1px solid ${alpha(color, 0.3)}`,
                          fontWeight: "600",
                          height: 24,
                          "& .MuiChip-label": { fontSize: "0.65rem", px: 1 },
                          "& .MuiChip-deleteIcon": {
                            color: alpha(color, 0.7),
                            fontSize: 14,
                            "&:hover": { color: color },
                          },
                          cursor: isConfigured && !configuring ? "pointer" : "default",
                        }}
                      />
                    );
                  })}
                </Box>
              ) : (
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ fontSize: "0.75rem", py: 0.3 }}
                >
                  No dates selected yet — tap dates on the calendar above.
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
            sx={{ borderRadius: 2, px: 2.5, py: 0.6, fontSize: "0.8rem", fontWeight: 500 }}
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
              fontSize: "0.8rem",
              fontWeight: 500,
            }}
          >
            {configuring
              ? isConfigured
                ? "Updating..."
                : "Configuring..."
              : isConfigured
              ? "Update Configuration"
              : "Save Configuration"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Single date edit dialog — only used in edit mode */}
      <HolidayEditDialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        dateStr={editingDate}
        currentStatus={editingDate ? dateStatusMap[editingDate] || "" : ""}
        onSave={handleSaveDateStatus}
      />
    </Box>
  );
};

export default HolidayTab;