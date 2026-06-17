// src/components/AttendanceCycleTab.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { Plus, Edit2, Lock, Calendar } from 'lucide-react';
import { attendanceCycleAPI } from '../../Services/attendanceService';

const AttendanceCycleTab = () => {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  
  // Helper function to get default dates (26th of last month to 25th of current month)
  const getDefaultDates = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // End date: 25th of current month
    const endDate = new Date(currentYear, currentMonth, 25);
    
    // Start date: 26th of last month
    // If current month is January (0), go to December of previous year
    let startMonth = currentMonth - 1;
    let startYear = currentYear;
    if (startMonth < 0) {
      startMonth = 11; // December
      startYear = currentYear - 1;
    }
    const startDate = new Date(startYear, startMonth, 26);
    
    // Format dates as YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };
  };

  const [formData, setFormData] = useState({
    attendanceMonth: '',
    attendanceYear: new Date().getFullYear(),
    startDate: '',
    endDate: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // New state for close confirmation dialog
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [cycleToClose, setCycleToClose] = useState(null);

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const response = await attendanceCycleAPI.getAllCycles();
      // Fix: Ensure cycles is always an array
      const cyclesData = Array.isArray(response.data) ? response.data : [];
      setCycles(cyclesData);
    } catch (error) {
      console.error('Error fetching cycles:', error);
      setCycles([]); // Set empty array on error
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Error fetching cycles', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cycle = null) => {
    if (cycle) {
      setEditingCycle(cycle);
      setFormData({
        attendanceMonth: cycle.attendanceMonth || '',
        attendanceYear: cycle.attendanceYear || new Date().getFullYear(),
        startDate: cycle.startDate || '',
        endDate: cycle.endDate || '',
      });
    } else {
      setEditingCycle(null);
      const defaultDates = getDefaultDates();
      // Set attendance month to current month name
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const currentMonth = new Date().getMonth();
      
      setFormData({
        attendanceMonth: monthNames[currentMonth],
        attendanceYear: new Date().getFullYear(),
        startDate: defaultDates.startDate,
        endDate: defaultDates.endDate,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCycle(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingCycle) {
        await attendanceCycleAPI.updateCycle(editingCycle.cycleId, formData);
        setSnackbar({ open: true, message: 'Cycle updated successfully', severity: 'success' });
      } else {
        await attendanceCycleAPI.createCycle(formData);
        setSnackbar({ open: true, message: 'Cycle created successfully', severity: 'success' });
      }
      fetchCycles();
      handleCloseDialog();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Error saving cycle', 
        severity: 'error' 
      });
    }
  };

  // Open close confirmation dialog
  const handleOpenCloseDialog = (cycleId) => {
    const cycle = cycles.find(c => c.cycleId === cycleId);
    setCycleToClose(cycle);
    setCloseDialogOpen(true);
  };

  // Handle actual close action
  const handleConfirmClose = async () => {
    if (!cycleToClose) return;
    
    try {
      await attendanceCycleAPI.closeCycle(cycleToClose.cycleId);
      setSnackbar({ 
        open: true, 
        message: `Cycle ${cycleToClose.attendanceMonth} ${cycleToClose.attendanceYear} closed successfully`, 
        severity: 'success' 
      });
      fetchCycles();
      setCloseDialogOpen(false);
      setCycleToClose(null);
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Error closing cycle', 
        severity: 'error' 
      });
    }
  };

  // Cancel close action
  const handleCancelClose = () => {
    setCloseDialogOpen(false);
    setCycleToClose(null);
  };

  const handleGenerateAttendance = async (cycleId) => {
    try {
      await attendanceCycleAPI.generateMonthlyAttendance(cycleId);
      setSnackbar({ open: true, message: 'Attendance generation started', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error generating attendance', severity: 'error' });
    }
  };

  const getStatusChip = (status) => {
    if (status === 'OPEN') {
      return <Chip label="OPEN" size="small" color="success" />;
    }
    return <Chip label="CLOSED" size="small" color="default" />;
  };

  // Get month name for display
  const getMonthName = (month) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[parseInt(month) - 1] || month;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Attendance Cycles</Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => handleOpenDialog()}
        >
          Create Cycle
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Month/Year</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Total Days</TableCell>
              <TableCell>Working Days</TableCell>
              <TableCell>Week Offs</TableCell>
              <TableCell>Holidays</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : cycles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No cycles found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              cycles.map((cycle) => (
                <TableRow key={cycle.cycleId} hover>
                  <TableCell>{cycle.attendanceMonth} {cycle.attendanceYear}</TableCell>
                  <TableCell>{cycle.startDate}</TableCell>
                  <TableCell>{cycle.endDate}</TableCell>
                  <TableCell>{cycle.totalDaysInCycle}</TableCell>
                  <TableCell>{cycle.totalWorkingDays}</TableCell>
                  <TableCell>{cycle.totalWeekOffs}</TableCell>
                  <TableCell>{cycle.totalPublicHolidays}</TableCell>
                  <TableCell>{getStatusChip(cycle.status)}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(cycle)}
                      disabled={cycle.status === 'CLOSED'}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenCloseDialog(cycle.cycleId)}
                      disabled={cycle.status === 'CLOSED'}
                      title="Close Cycle"
                    >
                      <Lock size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleGenerateAttendance(cycle.cycleId)}
                      title="Generate Attendance"
                    >
                      <Calendar size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCycle ? 'Edit Cycle' : 'Create New Cycle'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Month"
                value={formData.attendanceMonth}
                onChange={(e) => setFormData({ ...formData, attendanceMonth: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Year"
                value={formData.attendanceYear}
                onChange={(e) => setFormData({ ...formData, attendanceYear: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCycle ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Cycle Confirmation Dialog */}
      <Dialog
        open={closeDialogOpen}
        onClose={handleCancelClose}
        aria-labelledby="close-cycle-dialog-title"
        aria-describedby="close-cycle-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="close-cycle-dialog-title" sx={{ bgcolor: '#fff3e0', color: '#e65100' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Lock size={24} />
            Close Attendance Cycle
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="close-cycle-dialog-description" component="div">
            <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
              Are you sure you want to close the attendance cycle for{' '}
              <strong>
                {cycleToClose ? `${getMonthName(cycleToClose.attendanceMonth)} ${cycleToClose.attendanceYear}` : ''}
              </strong>
              ?
            </Typography>
            
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              bgcolor: '#fff8e1', 
              borderRadius: 1,
              border: '1px solid #ffcc02'
            }}>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                ⚠️ What happens when you close a cycle:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>
                  <Typography variant="body2">
                    <strong>Finalizes</strong> all attendance records for this period
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>Prevents</strong> any further modifications or edits to attendance entries
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>Locks</strong> the cycle for any future updates or changes
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    <strong>Marks</strong> the cycle as completed and ready for reporting
                  </Typography>
                </li>
              </ul>
            </Box>

            <Box sx={{ mt: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1, border: '1px solid #ffcdd2' }}>
              <Typography variant="body2" color="error">
                <strong>Note:</strong> This action cannot be undone. Once closed, the cycle cannot be reopened or edited.
              </Typography>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleCancelClose}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmClose} 
            variant="contained" 
            color="warning"
            startIcon={<Lock size={18} />}
          >
            Yes, Close Cycle
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceCycleTab;