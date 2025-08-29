import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import DataTable from '../muiComponents/DataTabel';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Button,
  Grid,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Fade,
  IconButton,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  AccessTime,
  CalendarToday,
  Add,
  Person,
  Business,
  Edit,
  Visibility
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import ToastService from '../../Services/toastService';
import { handleEmployeeNameClick,getCurrentUserRole  } from './navigationHelpers';
import { useSelector } from 'react-redux';
import httpService from '../../Services/httpService';

// Main TimeSheetsForAdmin Component
const TimeSheetsForAdmin = () => {
  return (
    <Routes>
      <Route path="/" element={<TimesheetList />} />
      <Route path="/employee/:userId/:employeeName" element={<EmployeeTimesheetDetailWrapper />} />
    </Routes>
  );
};

// Wrapper to import the separate EmployeeTimesheetDetail component
const EmployeeTimesheetDetailWrapper = () => {
  const EmployeeTimesheetDetail = React.lazy(() => import('./EmployeeTimesheetDetail'));
  
  return (
    <React.Suspense fallback={
      <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={50} thickness={4} />
      </Box>
    }>
      <EmployeeTimesheetDetail />
    </React.Suspense>
  );
};

// Timesheet List Component
const TimesheetList = () => {
  const [totalTimesheetData, setTotalTimesheetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const theme = useTheme();
  const navigate = useNavigate();

  const { role } = useSelector((state) => state.auth);

  // ✅ Always compute based on state
  const monthStart = dayjs(`${selectedYear}-${selectedMonth + 1}-01`)
    .startOf('month')
    .format('YYYY-MM-DD');
  const monthEnd = dayjs(`${selectedYear}-${selectedMonth + 1}-01`)
    .endOf('month')
    .format('YYYY-MM-DD');

  const fetchTimesheetData = async (start, end) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/timesheet/monthly-timesheets?monthStart=${start}&monthEnd=${end}`;
      const response = await httpService.get(url);

      const rows = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setTotalTimesheetData(rows);
    } catch (err) {
      console.error('Error fetching timesheet data:', err);
      setError('Failed to fetch timesheet data');
      ToastService.error('Failed to fetch timesheet data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch data whenever month/year changes
  useEffect(() => {
    fetchTimesheetData(monthStart, monthEnd);
  }, [selectedMonth, selectedYear]);

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const Month = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  // ✅ Generate years dynamically (last 5 → next 1)
  const currentYear = dayjs().year();
  const Years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  const columns = [
 {
      key: 'employeeName',
      label: 'Employee Name',
      render: row => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography
            variant="body2"
            fontWeight={500}
            sx={{
              cursor: 'pointer',
              color: 'primary.main',
              textDecoration: 'underline',
              '&:hover': {
                color: 'primary.dark'
              }
            }}
            onClick={() => handleEmployeeNameClick(row, navigate, role)}
          >
            {row?.employeeName}
          </Typography>
        </Box>
      ),
      width: 150
    },
    {
      key: 'employeeType',
      label: 'Employee Type',
      render: row => (
        <Chip
          label={row?.employeeType}
          size="small"
          variant="outlined"
          sx={{ 
            borderColor: theme.palette.primary.light,
            backgroundColor: alpha(theme.palette.primary.light, 0.1)
          }}
        />
      ),
      width: 140
    },
    {
      key: 'clientName',
      label: 'Client',
      render: row => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business sx={{ fontSize: 18, color: 'info.main' }} />
          <Typography variant="body2">
            {row?.clientName}
          </Typography>
        </Box>
      ),
      width: 140
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: row => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2">
            {row?.startDate}
          </Typography>
        </Box>
      ),
      width: 140
    },
    { 
      key: 'week1Hours', 
      label: 'Week 1', 
      render: row => (
        <Chip 
          label={`${row?.week1Hours}h`} 
          size="small" 
          variant="outlined"
          sx={{ 
            borderColor: theme.palette.info.light,
            backgroundColor: alpha(theme.palette.info.light, 0.1)
          }}
        />
      ), 
      width: 100 
    },
    { 
      key: 'week2Hours', 
      label: 'Week 2', 
      render: row => (
        <Chip 
          label={`${row?.week2Hours}h`} 
          size="small" 
          variant="outlined"
          sx={{ 
            borderColor: theme.palette.info.light,
            backgroundColor: alpha(theme.palette.info.light, 0.1)
          }}
        />
      ), 
      width: 100 
    },
    { 
      key: 'week3Hours', 
      label: 'Week 3', 
      render: row => (
        <Chip 
          label={`${row?.week3Hours}h`} 
          size="small" 
          variant="outlined"
          sx={{ 
            borderColor: theme.palette.info.light,
            backgroundColor: alpha(theme.palette.info.light, 0.1)
          }}
        />
      ), 
      width: 100 
    },
    { 
      key: 'week4Hours', 
      label: 'Week 4', 
      render: row => (
        <Chip 
          label={`${row?.week4Hours}h`} 
          size="small" 
          variant="outlined"
          sx={{ 
            borderColor: theme.palette.info.light,
            backgroundColor: alpha(theme.palette.info.light, 0.1)
          }}
        />
      ), 
      width: 100 
    },
    { 
      key: 'week5Hours', 
      label: 'Week 5', 
      render: row => (
        <Chip 
          label={`${row?.week5Hours}h`} 
          size="small" 
          variant="outlined"
          sx={{ 
            borderColor: theme.palette.info.light,
            backgroundColor: alpha(theme.palette.info.light, 0.1)
          }}
        />
      ), 
      width: 100 
    },
    {
      key: 'totalWorkingHours',
      label: 'Total Hours',
      render: row => (
        <Chip
          icon={<AccessTime />}
          label={`${row?.totalWorkingHours}h`}
          variant="filled"
          size="small"
          color="primary"
        />
      ),
      width: 120
    },
    {
      key: 'totalWorkingDays',
      label: 'Working Days',
      render: row => (
        <Chip
          label={`${row?.totalWorkingDays} days`}
          size="small"
          variant="outlined"
          sx={{ 
            borderColor: theme.palette.success.light,
            backgroundColor: alpha(theme.palette.success.light, 0.1),
            color: 'success.dark',
            fontWeight: 600
          }}
        />
      ),
      width: 120
    },
    {
      key: 'totalLeavesEntitled',
      label: 'Leaves Available',
      render: row => (
        <Chip
          label={row?.availableLeaves}
          size="small"
          variant="outlined"
          sx={{ 
            borderColor: theme.palette.warning.light,
            backgroundColor: alpha(theme.palette.warning.light, 0.1),
            color: 'warning.dark',
            fontWeight: 500
          }}
        />
      ),
      width: 120
    },
    {
      key: 'takenLeaves',
      label: 'Leaves Spent',
      render: row => (
        <Chip
          label={row?.takenLeaves}
          size="small"
          variant="outlined"
          sx={{ 
            borderColor: theme.palette.error.light,
            backgroundColor: alpha(theme.palette.error.light, 0.1),
            color: 'error.dark',
            fontWeight: 500
          }}
        />
      ),
      width: 120
    },
    {
      key: 'leaveBalance',
      label: 'Leave Balance',
      render: row => (
        <Chip
          label={row?.leaveBalance}
          size="small"
          variant="outlined"
          sx={{ 
            borderColor: theme.palette.success.light,
            backgroundColor: alpha(theme.palette.success.light, 0.1),
            color: 'success.dark',
            fontWeight: 500
          }}
        />
      ),
      width: 120
    },
    {
      key: 'status',
      label: 'Status',
      render: row => {
        const statusColor = row?.status === 'Approved' ? 'success' : 
                           row?.status === 'Pending' ? 'warning' : 
                           row?.status === 'Rejected' ? 'error' : 'default';
        return (
          <Chip
            label={row?.status}
            size="small"
            color={statusColor}
            variant={statusColor === 'default' ? 'outlined' : 'filled'}
          />
        );
      },
      width: 120
    },
    // {
    //   key: 'action',
    //   label: 'Actions',
    //   render: row => (
    //     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    //       <Tooltip title="View">
    //         <IconButton
    //           color="info"
    //           size="small"
    //           sx={{ 
    //             backgroundColor: alpha(theme.palette.info.main, 0.1),
    //             '&:hover': {
    //               backgroundColor: alpha(theme.palette.info.main, 0.2)
    //             }
    //           }}
    //         >
    //           <Visibility fontSize="small" />
    //         </IconButton>
    //       </Tooltip>
    //       <Tooltip title="Edit">
    //         <IconButton
    //           color="primary"
    //           size="small"
    //           sx={{ 
    //             backgroundColor: alpha(theme.palette.primary.main, 0.1),
    //             '&:hover': {
    //               backgroundColor: alpha(theme.palette.primary.main, 0.2)
    //             }
    //           }}
    //         >
    //           <Edit fontSize="small" />
    //         </IconButton>
    //       </Tooltip>
    //     </Box>
    //   ),
    //   width: 100
    // }
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AccessTime sx={{ color: 'primary.main', fontSize: 32 }} />
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'primary.dark' }}>
            Timesheet Management
          </Typography>
        </Box>
      </Box>

      {/* Controls Section */}
      <Card elevation={2} sx={{ mb: 3, borderRadius: 3, }}>
        <CardContent sx={{ pb: 2 }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ color: 'primary.main', fontSize: 24 }} />
                  <Typography variant="h6" color="primary.main">
                    {Month[selectedMonth]} {selectedYear}
                  </Typography>
                </Box>

                {/* Year Dropdown ✅ */}
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="year-select-label">Year</InputLabel>
                  <Select
                    labelId="year-select-label"
                    value={selectedYear}
                    onChange={handleYearChange}
                    label="Year"
                    sx={{ borderRadius: 2, backgroundColor: 'white' }}
                  >
                    {Years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Month Dropdown */}
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="month-select-label">Month</InputLabel>
                  <Select
                    labelId="month-select-label"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    label="Month"
                    sx={{ borderRadius: 2, backgroundColor: 'white' }}
                  >
                    {Month.map((month, index) => (
                      <MenuItem key={index} value={index}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            <Grid item>
              <Button
                variant="contained"
                startIcon={<Add />}
               onClick={() => navigate('/dashboard/timesheets/create')}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Add Timesheet
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Fade in={!!error}>
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              boxShadow: 1
            }} 
            variant="filled"
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Data Table Section */}
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          '& .MuiCardContent-root:last-child': { pb: 0 }
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflow: 'auto' }}>
            <DataTable
              title="Timesheets"
              data={totalTimesheetData}
              columns={columns}
              enableSelection={false}
              refreshData={() => { fetchTimesheetData(monthStart, monthEnd) }}
              loading={loading}
              sx={{
                '& .MuiTableCell-head': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  fontWeight: 600,
                  color: 'primary.dark'
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TimeSheetsForAdmin;