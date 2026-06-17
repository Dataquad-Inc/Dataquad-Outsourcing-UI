// src/components/HolidayTab.jsx
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
  TextField,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { holidayAPI } from '../../Services/attendanceService';

const HolidayTab = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({
    holidayName: '',
    holidayDate: '',
    holidayType: 'NATIONAL',
    description: '',
    isOptional: false,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const response = await holidayAPI.getAllHolidays();
      setHolidays(response.data);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (holiday = null) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setFormData({
        holidayName: holiday.holidayName,
        holidayDate: holiday.holidayDate,
        holidayType: holiday.holidayType,
        description: holiday.description || '',
        isOptional: holiday.isOptional || false,
      });
    } else {
      setEditingHoliday(null);
      setFormData({
        holidayName: '',
        holidayDate: '',
        holidayType: 'NATIONAL',
        description: '',
        isOptional: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingHoliday(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingHoliday) {
        await holidayAPI.updateHoliday(editingHoliday.holidayId, formData);
        setSnackbar({ open: true, message: 'Holiday updated successfully', severity: 'success' });
      } else {
        await holidayAPI.createHoliday(formData);
        setSnackbar({ open: true, message: 'Holiday created successfully', severity: 'success' });
      }
      fetchHolidays();
      handleCloseDialog();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Error saving holiday', severity: 'error' });
    }
  };

  const handleDelete = async (holidayId) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        await holidayAPI.deleteHoliday(holidayId);
        setSnackbar({ open: true, message: 'Holiday deleted successfully', severity: 'success' });
        fetchHolidays();
      } catch (error) {
        setSnackbar({ open: true, message: 'Error deleting holiday', severity: 'error' });
      }
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'NATIONAL':
        return { color: '#d32f2f', label: 'National' };
      case 'FESTIVAL':
        return { color: '#ed6c02', label: 'Festival' };
      case 'COMPANY':
        return { color: '#2e7d32', label: 'Company' };
      default:
        return { color: '#9e9e9e', label: type };
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Holiday Calendar</Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => handleOpenDialog()}
        >
          Add Holiday
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Holiday Name</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Optional</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : holidays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">No holidays found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              holidays.map((holiday) => {
                const typeColor = getTypeColor(holiday.holidayType);
                return (
                  <TableRow key={holiday.holidayId} hover>
                    <TableCell>{holiday.holidayName}</TableCell>
                    <TableCell>{holiday.holidayDate}</TableCell>
                    <TableCell>
                      <Chip
                        label={typeColor.label}
                        size="small"
                        sx={{ bgcolor: typeColor.color, color: '#fff' }}
                      />
                    </TableCell>
                    <TableCell>{holiday.description || '-'}</TableCell>
                    <TableCell>{holiday.isOptional ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpenDialog(holiday)} title="Edit">
                        <Edit2 size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(holiday.holidayId)} title="Delete">
                        <Trash2 size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Holiday Name"
              value={formData.holidayName}
              onChange={(e) => setFormData({ ...formData, holidayName: e.target.value })}
              required
            />
            <TextField
              fullWidth
              type="date"
              label="Holiday Date"
              InputLabelProps={{ shrink: true }}
              value={formData.holidayDate}
              onChange={(e) => setFormData({ ...formData, holidayDate: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Holiday Type</InputLabel>
              <Select
                value={formData.holidayType}
                onChange={(e) => setFormData({ ...formData, holidayType: e.target.value })}
                label="Holiday Type"
              >
                <MenuItem value="NATIONAL">National</MenuItem>
                <MenuItem value="FESTIVAL">Festival</MenuItem>
                <MenuItem value="COMPANY">Company</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingHoliday ? 'Update' : 'Add'}
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

export default HolidayTab;