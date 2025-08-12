import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Snackbar,
  Alert,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const Timesheets = () => {
  // State management
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'DAILY',
    date: new Date().toISOString().split('T')[0],
    entries: [{ project: '', hours: 0, description: '' }]
  });

 const{userId}=useSelector((state)=>state.auth)
  // Sample data for testing UI
  const sampleTimesheets = [
    {
      id: 1,
      userId: 'user123',
      employeeType: 'CONTRACT',
      timesheetType: 'Weekly',
      entries: [
        { project: 'Project Alpha', hours: 8, description: 'Frontend development' },
        { project: 'Project Beta', hours: 2, description: 'Code review' }
      ],
      timesheetDate: '2025-08-12',
      percentageOfTarget: 95
    },
    {
      id: 2,
      userId: 'user123',
      employeeType: 'FULL_TIME',
      timesheetType: 'Weekly',
      entries: [
        { project: 'Project Gamma', hours: 6, description: 'Backend API development' },
        { project: 'Project Alpha', hours: 3, description: 'Testing and debugging' }
      ],
      timesheetDate: '2025-08-11',
      percentageOfTarget: 87
    }
  ];

  useEffect(() => {
    fetchTimesheets();
  }, []);

  // API Functions with sample JSON data
  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      // Using sample data for demo
      let response=await axios.get(`http://192.168.0.182:7071/timesheet/getTimesheetsByUserId `,{
    params: { userId }
  });

      return response.data
    //   setTimeout(() => {
    //     setTimesheets(sampleTimesheets);
    //     setLoading(false);
    //   }, 1000);

    } catch (error) {
      showAlert('Failed to fetch timesheets', 'error');
      setLoading(false);
    }
  };

const submitTimesheet = async (data) => {
  
  try {
    const response = await axios.post('http://192.168.0.182:7071/timesheet/submit',data);
    
    showAlert('Timesheet submitted successfully', 'success');
    fetchTimesheets();
    handleCloseDialog();
    
    return response.data;
  } catch (error) {
    console.error('Error submitting timesheet:', error);
    showAlert('Failed to submit timesheet', 'error');
    throw error;
  }
};
 
const updateTimesheet = async (id, data) => {
  try {
    const response = await axios.put(`http://192.168.0.182:7071/timesheet/updateTimesheet/${id}`, data);
    
    showAlert('Timesheet updated successfully', 'success');
    fetchTimesheets();
    handleCloseDialog();
    
    return response.data;
  } catch (error) {
    console.error('Error updating timesheet:', error);
    showAlert('Failed to update timesheet', 'error');
    throw error;
  }
};

const deleteTimesheet = async (id) => {
  try {
    const response = await axios.delete(`http://192.168.0.182:7071/timesheet/deleteTimesheet/${id}`);
    
    showAlert('Timesheet deleted successfully', 'success');
    fetchTimesheets();
    
    return response.data;
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    showAlert('Failed to delete timesheet', 'error');
    throw error;
  }
};

  // Helper functions
  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, show: false });
  };

  const handleOpenDialog = (mode, timesheet = null) => {
    setDialogMode(mode);
    setSelectedTimesheet(timesheet);
    
    if (mode === 'edit' && timesheet) {
      setFormData({
        type: timesheet.timesheetType,
        date: timesheet.timesheetDate,
        entries: [...timesheet.entries]
      });
    } else {
      setFormData({
        type: 'DAILY',
        date: new Date().toISOString().split('T')[0],
        entries: [{ project: '', hours: 0, description: '' }]
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTimesheet(null);
  };

  const handleFormSubmit = () => {
    if (dialogMode === 'create') {
      submitTimesheet(formData);
    } else {
      updateTimesheet(selectedTimesheet.id, formData);
    }
  };

  const handleAddEntry = () => {
    setFormData({
      ...formData,
      entries: [...formData.entries, { project: '', hours: 0, description: '' }]
    });
  };

  const handleRemoveEntry = (index) => {
    const newEntries = formData.entries.filter((_, i) => i !== index);
    setFormData({ ...formData, entries: newEntries });
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...formData.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setFormData({ ...formData, entries: newEntries });
  };

  const getTotalHours = (entries) => {
    return entries.reduce((total, entry) => total + entry.hours, 0);
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {/* Alert */}
      <Snackbar
        open={alert.show}
        autoHideDuration={5000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.type}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" color="primary">
          Timesheet Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          New Timesheet
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" component="div" color="primary">
                {timesheets.length}
              </Typography>
              <Typography color="text.secondary">
                Total Timesheets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
  <Card>
    <CardContent sx={{ textAlign: 'center' }}>
      <Typography variant="h3" component="div" color="primary">
        {timesheets.reduce((total, timesheet) => 
          total + getTotalHours(timesheet.entries), 0)}h
      </Typography>
      <Typography color="text.secondary">
        Total Hours This Month
      </Typography>
    </CardContent>
  </Card>
</Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" component="div" color="primary">
                {timesheets.length > 0 
                  ? Math.round(timesheets.reduce((sum, t) => sum + t.percentageOfTarget, 0) / timesheets.length)
                  : 0}%
              </Typography>
              <Typography color="text.secondary">
                Average Target %
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" component="div" color="primary">
                {new Set(timesheets.flatMap(t => t.entries.map(e => e.project))).size}
              </Typography>
              <Typography color="text.secondary">
                Active Projects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Projects</TableCell>
              <TableCell>Total Hours</TableCell>
              <TableCell>Target %</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timesheets.map((timesheet) => (
              <TableRow key={timesheet.id}>
                <TableCell>{timesheet.timesheetDate}</TableCell>
                <TableCell>
                  <Chip label={timesheet.timesheetType} color="primary" size="small" />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {timesheet.entries.map((entry, index) => (
                      <Chip
                        key={index}
                        label={`${entry.project} (${entry.hours}h)`}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">{getTotalHours(timesheet.entries)}h</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: '60px' }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(timesheet.percentageOfTarget, 100)}
                        color={getPercentageColor(timesheet.percentageOfTarget)}
                      />
                    </Box>
                    <Typography>{timesheet.percentageOfTarget}%</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog('edit', timesheet)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => deleteTimesheet(timesheet.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Create New Timesheet' : 'Edit Timesheet'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="DAILY">Daily</MenuItem>
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  {/* <MenuItem value="MONTHLY">Monthly</MenuItem> */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Time Entries</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddEntry}
            >
              Add Entry
            </Button>
          </Box>

          {formData.entries.map((entry, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Project"
                    value={entry.project}
                    onChange={(e) => handleEntryChange(index, 'project', e.target.value)}
                    placeholder="Project name"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Hours"
                    type="text"
                    value={entry.hours}
                    onChange={(e) => handleEntryChange(index, 'hours', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    value={entry.description}
                    onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                    placeholder="Work description"
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveEntry(index)}
                    disabled={formData.entries.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          ))}

          <Paper sx={{ p: 2, mt: 3, textAlign: 'center', bgcolor: 'primary.light' }}>
            <Typography variant="h6">
              Total Hours: {getTotalHours(formData.entries)}h
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
          >
            {dialogMode === 'create' ? 'Submit' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Timesheets;