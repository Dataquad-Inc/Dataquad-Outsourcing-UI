// EmployeeAttendanceDialog.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Paper,
  alpha,
  useTheme,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import {
  X,
  Calendar,
  Edit2,
  Save,
  CheckCircle,
  Loader2,
} from "lucide-react";

// ============================================================
// CONSTANTS - FIXED
// ============================================================

const ATTENDANCE_STATUS_OPTIONS = [
  { code: "P", label: "Present", color: "#4CAF50", attendanceValue: 1.0, remarks: "Present" },
  { code: "WFH", label: "Work From Home", color: "#42A5F5", attendanceValue: 1.0, remarks: "Work From Home" },
  { code: "HD", label: "Half Day", color: "#AB47BC", attendanceValue: 0.5, remarks: "Half Day" },
  { code: "L", label: "Leave", color: "#EF5350", attendanceValue: 0.0, remarks: "Leave" },
  { code: "LOP", label: "Loss of Pay", color: "#EF5350", attendanceValue: 0.0, remarks: "Loss of Pay" },
  { code: "WO", label: "Week Off", color: "#FFA726", attendanceValue: 0.0, remarks: "Week Off" },
  { code: "PH", label: "Public Holiday", color: "#42A5F5", attendanceValue: 0.0, remarks: "Public Holiday" },
  { code: "", label: "Not Marked", color: "#E0E0E0", attendanceValue: 0.0, remarks: "" },
];

const ATTENDANCE_STATUS_COLORS = {
  P: "#4CAF50",
  WO: "#FFA726",
  WFH: "#42A5F5",
  L: "#EF5350",
  PH: "#42A5F5",
  HD: "#AB47BC",
  SP: "#26C6DA",
  LOP: "#EF5350",
  "": "#E0E0E0",
};

const ATTENDANCE_STATUS_LABELS = {
  P: "Present",
  WO: "Weekend/Off",
  WFH: "Work From Home",
  L: "Leave",
  PH: "Public Holiday",
  HD: "Half Day",
  SP: "Special Permission",
  LOP: "Loss of Pay",
  "": "Not Marked",
};

const DAY_ORDER = ["26","27","28","29","30","31","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25"];

const getMonth = (day) => {
  return parseInt(day) >= 26 ? 'Jun' : 'Jul';
};

const getFullDate = (day, year) => {
  const monthIndex = parseInt(day) >= 26 ? 5 : 6;
  return new Date(year, monthIndex, parseInt(day));
};

// ============================================================
// DAY CELL COMPONENT
// ============================================================

const DayCell = ({ day, status, onEdit, year, isToday }) => {
  const theme = useTheme();
  const color = ATTENDANCE_STATUS_COLORS[status] || "#E0E0E0";
  const label = ATTENDANCE_STATUS_LABELS[status] || "Not Marked";
  const dateObj = getFullDate(day, year);
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const isWeekend = [0, 6].includes(dateObj.getDay());

  const handleClick = () => {
    if (onEdit) {
      onEdit(day, status);
    }
  };

  return (
    <Tooltip title={`${dayOfWeek}, ${day} ${getMonth(day)}: ${label} (Click to edit)`} arrow placement="top">
      <Paper
        onClick={handleClick}
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 2,
          border: isToday ? `2px solid ${theme.palette.primary.main}` : `1px solid ${alpha(color, 0.2)}`,
          backgroundColor: status ? alpha(color, 0.1) : '#F8F9FA',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          minWidth: 65,
          minHeight: 65,
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: `0 4px 16px ${alpha(color, 0.25)}`,
            borderColor: color,
            backgroundColor: status ? alpha(color, 0.2) : '#F0F0F0',
          },
          position: 'relative',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '10px',
            color: isWeekend ? '#EF5350' : '#666',
            fontWeight: isToday ? 700 : 400,
          }}
        >
          {day}
        </Typography>
        
        <Typography
          variant="body2"
          sx={{
            fontSize: '14px',
            fontWeight: isToday ? 700 : 500,
            color: status ? color : '#999',
          }}
        >
          {dayOfWeek}
        </Typography>

        {status ? (
          <Chip
            label={status}
            size="small"
            sx={{
              height: 20,
              fontSize: '9px',
              fontWeight: 700,
              backgroundColor: alpha(color, 0.2),
              color: color,
              '& .MuiChip-label': {
                px: 0.5,
              },
            }}
          />
        ) : (
          <Box
            sx={{
              width: 20,
              height: 2,
              borderRadius: 1,
              backgroundColor: '#E0E0E0',
            }}
          />
        )}

        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            opacity: 0,
            transition: 'opacity 0.2s ease',
            '.MuiPaper-root:hover &': {
              opacity: 1,
            },
          }}
        >
          <Edit2 size={12} style={{ color: '#999' }} />
        </Box>

        {isWeekend && (
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              left: 2,
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#FFA726',
            }}
          />
        )}
      </Paper>
    </Tooltip>
  );
};

// ============================================================
// EDIT STATUS DIALOG (Inner) - FIXED
// ============================================================

const EditStatusDialog = ({ open, onClose, day, currentStatus, onSave }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || "");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    setSelectedStatus(currentStatus || "");
  }, [currentStatus]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(selectedStatus);
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setLoading(false);
    }
  };

 
const dateObj = getFullDate(day, 2026);
const formattedDate = dateObj.toLocaleDateString('en-IN', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric'
});

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: alpha('#0F7C82', 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Edit2 size={18} style={{ color: '#0F7C82' }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Edit Attendance
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formattedDate}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Select attendance status for <strong>Day {day}</strong>
        </Typography>

        <Box display="flex" flexDirection="column" gap={1}>
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
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                    {option.label}
                  </Typography>
                </Box>
                {isSelected && (
                  <CheckCircle size={16} style={{ color: option.color }} />
                )}
              </Paper>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Button 
          onClick={onClose}
          sx={{ color: '#666' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || selectedStatus === currentStatus}
          startIcon={loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          sx={{
            backgroundColor: '#0F7C82',
            '&:hover': { backgroundColor: '#0A5E63' },
            '&.Mui-disabled': { backgroundColor: alpha('#0F7C82', 0.5) },
          }}
        >
          {loading ? 'Saving...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================
// MAIN EMPLOYEE ATTENDANCE DIALOG
// ============================================================

const EmployeeAttendanceDialog = ({ 
  open, 
  onClose, 
  employee, 
  year = 2026,
  onSave,
}) => {
  const theme = useTheme();
  const [selectedDay, setSelectedDay] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  if (!employee) return null;

  const handleDayEdit = (day, status) => {
    setSelectedDay(day);
    setCurrentStatus(status || "");
    setEditDialogOpen(true);
  };

  const handleSaveStatus = async (newStatus) => {
    try {
      await onSave(employee.employeeId, selectedDay, newStatus);
      setSnackbar({
        open: true,
        message: `Attendance updated for Day ${selectedDay}`,
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to update attendance",
        severity: "error",
      });
    }
  };

  // Calculate statistics for this employee
  const totalPresent = employee.totalPresentDays || 0;
  const totalLeaves = employee.totalLeaves || 0;
  const totalPaid = employee.totalPaidDays || 0;
  const totalWorking = employee.totalWorkingDays || 0;
  const attendancePercentage = totalWorking > 0 ? (totalPresent / totalWorking) * 100 : 0;

  return (
    <>
      {/* Main Dialog */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ 
              bgcolor: '#0F7C82', 
              width: 50, 
              height: 50,
              fontSize: 20,
              fontWeight: 600,
            }}>
              {employee.employeeName?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {employee.employeeName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {employee.employeeId} • {employee.designation}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Joined: {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }) : 'N/A'}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={onClose} size="small">
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>

          <Divider sx={{ mb: 3 }} />

          {/* Calendar Grid */}
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Attendance Calendar - 26 Jun to 25 Jul {year}
              </Typography>
              <Chip
                label={`${Object.values(employee.attendanceGrid || {}).filter(s => s && s !== 'WO').length} marked days`}
                size="small"
                sx={{ backgroundColor: alpha('#0F7C82', 0.1), color: '#0F7C82' }}
              />
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1.5}>
              {DAY_ORDER.map((day) => {
                const status = employee.attendanceGrid?.[day] || "";
                const dateObj = getFullDate(day, year);
                const today = new Date();
                const isToday = dateObj.getDate() === today.getDate() && 
                               dateObj.getMonth() === today.getMonth() &&
                               dateObj.getFullYear() === today.getFullYear();

                return (
                  <DayCell
                    key={day}
                    day={day}
                    status={status}
                    year={year}
                    isToday={isToday}
                    onEdit={handleDayEdit}
                  />
                );
              })}
            </Box>
          </Box>

          {/* Legend */}
          <Paper sx={{ p: 2, mt: 3, backgroundColor: '#F8F9FA' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>
              Status Legend
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1.5} mt={1}>
              {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                <Box key={option.code} display="flex" alignItems="center" gap={0.5}>
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '2px',
                      backgroundColor: option.color,
                      opacity: option.code === '' ? 0.3 : 1,
                    }}
                  />
                  <Typography variant="caption" sx={{ fontSize: '9px', color: '#666' }}>
                    {option.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ 
          p: 2, 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          justifyContent: 'space-between',
        }}>
          <Typography variant="caption" color="textSecondary">
            Click on any date to edit attendance
          </Typography>
          <Button onClick={onClose} variant="outlined" sx={{ borderColor: '#E0E0E0' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Status Dialog (Inner) */}
      <EditStatusDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        day={selectedDay}
        currentStatus={currentStatus}
        onSave={handleSaveStatus}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EmployeeAttendanceDialog;