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
import {
  handleEmployeeNameClick,
  getCurrentUserRole,
  clearPrepopulatedEmployeeData
} from './navigationHelpers';
import { useSelector } from 'react-redux';
import httpService from '../../Services/httpService';

// Main TimeSheetsForAdmin Component
const TimeSheetsForAdmin = () => {
  return (
    <Routes>
      <Route path="/" element={<TimesheetList />} />
      <Route path="/employee/:userId" element={<EmployeeTimesheetDetailWrapper />} />
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
  // const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  // const [selectedYear, setSelectedYear] = useState(dayjs().year());
  // Around line 56-58, modify the state initialization
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Check if there's a saved month in sessionStorage
    const savedMonth = sessionStorage.getItem('timesheetsAdmin_selectedMonth');
    return savedMonth !== null ? parseInt(savedMonth) : dayjs().month();
  });

  const [selectedYear, setSelectedYear] = useState(() => {
    // Check if there's a saved year in sessionStorage
    const savedYear = sessionStorage.getItem('timesheetsAdmin_selectedYear');
    return savedYear !== null ? parseInt(savedYear) : dayjs().year();
  });
  const theme = useTheme();
  const navigate = useNavigate();

  const { role } = useSelector((state) => state.auth);

  // Check if we should restore month/year from navigation state
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.selectedMonth !== undefined) {
        setSelectedMonth(event.state.selectedMonth);
      }
      if (event.state?.selectedYear !== undefined) {
        setSelectedYear(event.state.selectedYear);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  // Persist selected month and year to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('timesheetsAdmin_selectedMonth', selectedMonth.toString());
    sessionStorage.setItem('timesheetsAdmin_selectedYear', selectedYear.toString());
  }, [selectedMonth, selectedYear]);

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
      console.log('Fetching timesheet data with URL:', url);
      const response = await httpService.get(url);

      const rows = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      console.log('Received timesheet data:', rows.length, 'rows');
      setTotalTimesheetData(rows);
    } catch (err) {
      console.error('Error fetching timesheet data:', err);
      setError('Failed to fetch timesheet data');
      ToastService.error('Failed to fetch timesheet data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  //  Fetch data whenever month/year changes
  useEffect(() => {
    fetchTimesheetData(monthStart, monthEnd);
  }, [selectedMonth, selectedYear]);

  const handleMonthChange = (event) => {
    const newMonth = event.target.value;
    console.log('Month changed to:', newMonth);
    setSelectedMonth(newMonth);
  };

  const handleYearChange = (event) => {
    const newYear = event.target.value;
    console.log('Year changed to:', newYear);
    setSelectedYear(newYear);
  };

  const handleEmployeeClick = (row) => {
    try {
      console.log('Employee click handler called with:', { row, role, selectedMonth, selectedYear });

      if (!handleEmployeeNameClick) {
        console.error('handleEmployeeNameClick is not available');
        ToastService.error('Navigation function is not available');
        return;
      }

      if (role === 'ACCOUNTS' || role === 'SUPERADMIN' || role === 'ADMIN') {
        // Save the current month and year before navigation
        sessionStorage.setItem('timesheetsAdmin_selectedMonth', selectedMonth.toString());
        sessionStorage.setItem('timesheetsAdmin_selectedYear', selectedYear.toString());

        handleEmployeeNameClick(row, navigate, role, selectedMonth, selectedYear);
      } else {
        console.warn('User role does not have permission to view employee details:', role);
        ToastService.warning('You do not have permission to view employee details');
      }
    } catch (error) {
      console.error('Error in employee click handler:', error);
      ToastService.error('Failed to navigate to employee details');
    }
  };
  const Month = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  // ✅ Generate years dynamically (last 5 → next 1)
  const currentYear = dayjs().year();
  const Years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  const columns = [
    // Updated employeeName column to use safe navigation handler
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
              cursor: (role === 'ACCOUNTS' || role === 'SUPERADMIN' || role === 'ADMIN') ? 'pointer' : 'default',
              color: (role === 'ACCOUNTS' || role === 'SUPERADMIN' || role === 'ADMIN') ? 'primary.main' : 'text.primary',
              textDecoration: (role === 'ACCOUNTS' || role === 'SUPERADMIN' || role === 'ADMIN') ? 'underline' : 'none',
              '&:hover': (role === 'ACCOUNTS' || role === 'SUPERADMIN' || role === 'ADMIN') ? {
                color: 'primary.dark'
              } : {}
            }}
            onClick={() => handleEmployeeClick(row)}
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
      key: 'totalMonthWorkingDays',
      label: 'Total Days (Month)',
      render: row => (
        <Chip

          label={`${row?.totalMonthWorkingDays} days`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.info.light,
            backgroundColor: alpha(theme.palette.info.light, 0.1),
            color: theme.palette.info.dark,
            fontWeight: 600
          }}
        />
      ),
      width: 140
    },
    {
      key: 'weekendDays',
      label: 'Weekend Days (Month)',
      render: row => (
        <Chip

          label={`${row?.weekendDays} days`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.primary.light,
            backgroundColor: alpha(theme.palette.primary.light, 0.1),
            color: theme.palette.primary.dark,
            fontWeight: 600
          }}
        />
      ),
      width: 140
    },
    {
      key: 'lastWorkedDays',
      label: 'Working Days',
      render: row => (
        <Chip
          label={`${row?.lastWorkedDays} days`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.success.light,
            backgroundColor: alpha(theme.palette.success.light, 0.1),
            color: theme.palette.success.dark,
            fontWeight: 600
          }}
        />
      ),
      width: 140
    },

    {
      key: 'totalWorkingDays',
      label: 'Worked Days',
      render: row => (
        <Chip
          label={`${row?.totalWorkingDays} days`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.info.dark,
            backgroundColor: alpha(theme.palette.info.dark, 0.1),
            color: 'info.dark',
            fontWeight: 600
          }}
        />
      ),
      width: 120
    },
    {
      key: 'publicHolidays',
      label: 'Public Holidays',
      render: row => (
        <Chip
          label={row?.publicHolidays}
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
              {(role === 'SUPERADMIN' || role === 'ADMIN') && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    // Clear any navigation state before going to create mode
                    clearPrepopulatedEmployeeData();
                    sessionStorage.removeItem('prepopulatedEmployee');
                    sessionStorage.removeItem('selectedEmployeeData');

                    // Navigate with explicit state to ensure create mode
                    navigate('/dashboard/timesheets/create', {
                      state: {
                        forceCreateMode: true,
                        from: '/dashboard/timesheetsForAdmins',
                        timestamp: Date.now()
                      },
                      replace: true // Use replace to avoid adding to history stack
                    });
                  }}
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
              )}
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