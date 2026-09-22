import React, { useState, useEffect, useMemo } from 'react';
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
  Visibility,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import ToastService from '../../Services/toastService';
import {
  handleEmployeeNameClick,
  getCurrentUserRole,
  clearPrepopulatedEmployeeData
} from './navigationHelpers';
import { useDispatch, useSelector } from 'react-redux';
import httpService from '../../Services/httpService';
import { inactiveExternalUsers, activeExternalUsers } from '../../redux/employeesSlice';
import { fetchPlacements } from '../../redux/placementSlice'

// ---------------------------------------------------------------------------
// Helper: normalize ANY API response shape into a plain array.
// This is the actual fix for "totalTimesheetData.filter is not a function".
// Previously the code only handled `response.data` being an array or
// `response.data.data` being an array. If the backend ever returns something
// like { data: { timesheets: [...] } }, { success, data: {...} }, or an
// error object, `rows` ended up being a non-array value, which then crashed
// `.filter()` on the next render (especially noticeable during hot reloads,
// since the stale non-array value could stick around in state).
// ---------------------------------------------------------------------------
const normalizeTimesheetRows = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }
  // Paginated shape actually returned by /timesheet/monthly-timesheets:
  // { success, message, data: { content: [...], page, size, totalElements, totalPages }, error, timestamp }
  if (Array.isArray(responseData?.data?.content)) {
    return responseData.data.content;
  }
  if (Array.isArray(responseData?.content)) {
    return responseData.content;
  }
  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }
  if (Array.isArray(responseData?.data?.timesheets)) {
    return responseData.data.timesheets;
  }
  if (Array.isArray(responseData?.timesheets)) {
    return responseData.timesheets;
  }
  if (Array.isArray(responseData?.data?.data)) {
    return responseData.data.data;
  }

  console.warn(
    'fetchTimesheetData: unexpected response shape, expected an array of timesheets. Defaulting to []. Received:',
    responseData
  );
  return [];
};

// Pull out pagination metadata (page, totalPages) from whichever shape the
// API returned, so fetchTimesheetData can page through all results instead
// of silently only using page 0.
const extractPageInfo = (responseData) => {
  const paged = responseData?.data && typeof responseData.data === 'object' && 'totalPages' in responseData.data
    ? responseData.data
    : (responseData && typeof responseData === 'object' && 'totalPages' in responseData ? responseData : null);

  if (!paged) return null;

  return {
    page: paged.page ?? 0,
    totalPages: paged.totalPages ?? 1,
    totalElements: paged.totalElements ?? null
  };
};

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
  const { externalActive } = useSelector((state) => state.employee);
  const { placements } = useSelector((state) => state.placement);

  const dispatch = useDispatch();

  // Fetch active external users
  useEffect(() => {
    dispatch(activeExternalUsers());
    dispatch(fetchPlacements());
  }, []);

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

  // Guard placements too — it comes from redux and could theoretically be
  // undefined/null on the very first render before the fetch resolves.
  const safePlacements = Array.isArray(placements) ? placements : [];

  const vendorMap = useMemo(() => {
    const map = {};
    safePlacements.forEach(p => {
      if (p.candidateFullName) {
        map[p.candidateFullName.toLowerCase().trim()] = p.vendorName || '—';
      }
    });
    return map;
  }, [safePlacements]);

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
      // Request a large page size up front. Most backends built on Spring's
      // Pageable respect ?size=..., so this alone often gets everything in
      // one call. We still fall back to walking pages below in case size is
      // capped server-side and totalPages > 1 comes back anyway.
      const baseUrl = `/timesheet/monthly-timesheets?monthStart=${start}&monthEnd=${end}`;
      const firstResponse = await httpService.get(`${baseUrl}&page=0&size=500`);

      let rows = normalizeTimesheetRows(firstResponse?.data);
      const pageInfo = extractPageInfo(firstResponse?.data);

      // If the server capped page size and there's more than one page left,
      // fetch the remaining pages and merge them in.
      if (pageInfo && pageInfo.totalPages > 1) {
        const remainingPageRequests = [];
        for (let p = 1; p < pageInfo.totalPages; p++) {
          remainingPageRequests.push(httpService.get(`${baseUrl}&page=${p}&size=500`));
        }
        const remainingResponses = await Promise.all(remainingPageRequests);
        remainingResponses.forEach(res => {
          rows = rows.concat(normalizeTimesheetRows(res?.data));
        });
      }

      setTotalTimesheetData(rows);
    } catch (err) {
      console.error('Error fetching timesheet data:', err);
      setError('Failed to fetch timesheet data');
      setTotalTimesheetData([]); // never leave state in a non-array shape
      ToastService.error('Failed to fetch timesheet data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data whenever month/year changes
  useEffect(() => {
    fetchTimesheetData(monthStart, monthEnd);
  }, [selectedMonth, selectedYear]);

  // Safe array to feed into filtering / length checks below, no matter what
  // ended up in state.
  const safeTotalTimesheetData = Array.isArray(totalTimesheetData) ? totalTimesheetData : [];

  // Filter timesheet data to only include active external users
  const filteredTimesheetData = useMemo(() => {
    if (!Array.isArray(externalActive) || externalActive.length === 0) {
      return [];
    }

    // Create a Set of active employee names for faster lookup
    const activeEmployeeNames = new Set(
      externalActive
        .filter(emp => emp.status === 'ACTIVE') // Filter by ACTIVE status
        .map(emp => emp.userName?.toLowerCase().trim()) // Normalize names for comparison
    );

    // Filter timesheet data to only include employees whose names are in the active set
    return safeTotalTimesheetData.filter(row => {
      const employeeName = row.employeeName?.toLowerCase().trim();
      return activeEmployeeNames.has(employeeName);
    });
  }, [safeTotalTimesheetData, externalActive]);

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const handleEmployeeClick = (row) => {
    try {
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
      label: 'Vendor',
      key: 'vendor',
      render: row => {
        const vendor = vendorMap[row.employeeName?.toLowerCase().trim()] || '—';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2">{vendor}</Typography>
          </Box>
        );
      },
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
          {externalActive && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
              Showing {filteredTimesheetData.length} active employees out of {safeTotalTimesheetData.length} total
            </Typography>
          )}
        </Box>
      </Box>

      {/* Controls Section */}
      <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<DashboardIcon />}
                  onClick={() => navigate(`/dashboard/timesheetsForAdmins/dashboard?year=${selectedYear}`)}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Dashboard
                </Button>
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
              </Box>
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

      {/* Warning when no active users found */}
      {!loading && safeTotalTimesheetData.length > 0 && filteredTimesheetData.length === 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3, borderRadius: 2 }}
        >
          No active employees found for the selected month. The timesheet data may contain only inactive employees.
        </Alert>
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
              data={filteredTimesheetData} // Use filtered data instead of totalTimesheetData
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