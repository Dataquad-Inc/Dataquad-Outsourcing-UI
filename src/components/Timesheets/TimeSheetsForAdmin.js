import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useNavigate } from 'react-router-dom';
import DataTablePaginated from '../muiComponents/DataTablePaginated';
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
  alpha,
  useTheme
} from '@mui/material';
import {
  AccessTime,
  CalendarToday,
  Add,
  Person,
  Business,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import ToastService from '../../Services/toastService';
import {
  handleEmployeeNameClick,
  clearPrepopulatedEmployeeData
} from './navigationHelpers';
import httpService from '../../Services/httpService';
import { activeExternalUsers } from '../../redux/employeesSlice';
import { fetchPlacements } from '../../redux/placementSlice';
import {
  fetchMonthlyTimesheets,
  resetMonthlyTimesheets,
  setPage,
  setRowsPerPage,
  setMonthRange
} from '../../redux/timesheetSlice';
import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const normalizeName = (name) =>
  String(name || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\./g, '');

// ---------------------------------------------------------------------------
// ROOT
// ---------------------------------------------------------------------------
const TimeSheetsForAdmin = () => (
  <Routes>
    <Route path="/" element={<TimesheetList />} />
    <Route
      path="/employee/:userId"
      element={<EmployeeTimesheetDetailWrapper />}
    />
  </Routes>
);

const EmployeeTimesheetDetailWrapper = () => {
  const EmployeeTimesheetDetail = React.lazy(() =>
    import('./EmployeeTimesheetDetail')
  );
  return (
    <React.Suspense
      fallback={
        <Box
          sx={{
            p: 3,
            backgroundColor: '#f8fafc',
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <CircularProgress size={50} thickness={4} />
        </Box>
      }
    >
      <EmployeeTimesheetDetail />
    </React.Suspense>
  );
};

// ---------------------------------------------------------------------------
// TimesheetList
// ---------------------------------------------------------------------------
const DEFAULT_ROWS_PER_PAGE = 20;

const TimesheetList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  // ---- Redux state ----
  const {
    monthlyTimesheets = [],
    monthlyLoading,
    monthlyError,
    pagination
  } = useSelector((state) => state.timesheet);

  const { currentPage, rowsPerPage, totalCount, totalPages } = pagination;

  const role = useSelector((s) => s.auth?.role);
  const externalActive = useSelector((s) => s.employee?.externalActive);
  const placements = useSelector((s) => s.placement?.placements);

  // ---- Month / year (local UI state, persisted) ----
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = sessionStorage.getItem('timesheetsAdmin_selectedMonth');
    return saved !== null ? parseInt(saved, 10) : dayjs().month();
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = sessionStorage.getItem('timesheetsAdmin_selectedYear');
    return saved !== null ? parseInt(saved, 10) : dayjs().year();
  });

  // ---- Refs ----
  // We keep a SINGLE source of truth for "what request we last dispatched".
  // When currentPage/rowsPerPage/monthStart/monthEnd change, the effect compares
  // the current tuple against this ref, and dispatches only if they differ.
  const isInitialMount = useRef(true);
  const lastDispatchedParamsRef = useRef(null);

  // ---- Month range ----
  const { monthStart, monthEnd } = useMemo(() => {
    const base = dayjs(`${selectedYear}-${selectedMonth + 1}-01`);
    return {
      monthStart: base.startOf('month').format('YYYY-MM-DD'),
      monthEnd: base.endOf('month').format('YYYY-MM-DD')
    };
  }, [selectedMonth, selectedYear]);

  // ---- Persist month/year ----
  useEffect(() => {
    sessionStorage.setItem(
      'timesheetsAdmin_selectedMonth',
      String(selectedMonth)
    );
    sessionStorage.setItem(
      'timesheetsAdmin_selectedYear',
      String(selectedYear)
    );
  }, [selectedMonth, selectedYear]);

  // ---- Dispatch employees/placements once ----
  useEffect(() => {
    if (!Array.isArray(externalActive) || externalActive.length === 0) {
      dispatch(activeExternalUsers());
    }
    if (!Array.isArray(placements) || placements.length === 0) {
      dispatch(fetchPlacements());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // THE ONLY EFFECT THAT FETCHES.
  //
  // It runs whenever (page, rowsPerPage, monthStart, monthEnd) change.
  // It compares the current tuple against lastDispatchedParamsRef; if they
  // differ, it dispatches a fresh thunk and records the tuple.
  //
  // This is exactly the InProgress pattern: no isFetchingRef, no isMonthChangeRef,
  // no isInitialMount short-circuit for subsequent changes — just one comparison.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const params = {
      page: currentPage,
      size: rowsPerPage,
      monthStart,
      monthEnd
    };
    const key = JSON.stringify(params);

    if (lastDispatchedParamsRef.current === key) {
      // Already dispatched for this exact tuple → skip
      return;
    }
    lastDispatchedParamsRef.current = key;

    // eslint-disable-next-line no-console
    console.log('[timesheets] dispatch fetchMonthlyTimesheets', params);

    dispatch(fetchMonthlyTimesheets(params));
  }, [currentPage, rowsPerPage, monthStart, monthEnd, dispatch]);

  // -------------------------------------------------------------------------
  // Reset pagination when month/year changes.
  // We reset via slice action, and clear lastDispatched so the effect above
  // will fire again with the new month + page 0.
  // -------------------------------------------------------------------------
  const prevMonthRef = useRef({ monthStart, monthEnd });
  useEffect(() => {
    if (
      prevMonthRef.current.monthStart === monthStart &&
      prevMonthRef.current.monthEnd === monthEnd
    ) {
      return;
    }
    prevMonthRef.current = { monthStart, monthEnd };

    // Reset monthly list, page to 0, totalCount to 0
    dispatch(resetMonthlyTimesheets());
    dispatch(setMonthRange({ monthStart, monthEnd }));

    // Force the fetch effect to fire even if page/size unchanged
    lastDispatchedParamsRef.current = null;
  }, [monthStart, monthEnd, dispatch]);

  // Mark initial mount complete AFTER first effect cycle
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  // -------------------------------------------------------------------------
  // Handlers — just dispatch; the effect does the fetching
  // -------------------------------------------------------------------------
  const handleChangePage = useCallback(
    (newPage) => {
      dispatch(setPage(newPage));
    },
    [dispatch]
  );

  const handleChangeRowsPerPage = useCallback(
    (newRowsPerPage) => {
      dispatch(setRowsPerPage(newRowsPerPage));
    },
    [dispatch]
  );

  const handleRefresh = useCallback(() => {
    // Reset current page to 0, clear totalCount, and force refetch
    dispatch(resetMonthlyTimesheets());
    dispatch(setPage(0));
    lastDispatchedParamsRef.current = null;
    // The effect above will fire because lastDispatched is null.
  }, [dispatch]);

  // ---- Export ----
  const handleExportData = useCallback(
    async (format, meta) => {
      try {
        const visibleColumns = (meta?.allColumns || []).filter(
          (col) => col.visible !== false && col.key !== 'actions'
        );
        if (visibleColumns.length === 0) {
          ToastService.warning('No columns to export');
          return;
        }

        ToastService.info('Preparing export...');
        const allRows = [];

        // Walk every page at size=100
        const first = await httpService.get(
          `/timesheet/monthly-timesheets?monthStart=${monthStart}&monthEnd=${monthEnd}&page=0&size=100`
        );
        const firstBody = first?.data !== undefined ? first.data : first;
        const firstPaged = firstBody?.data?.content
          ? firstBody.data
          : firstBody;
        allRows.push(...(firstPaged?.content || []));
        const discoveredTotalPages = firstPaged?.totalPages ?? 1;

        for (let p = 1; p < discoveredTotalPages; p++) {
          // eslint-disable-next-line no-await-in-loop
          const resp = await httpService.get(
            `/timesheet/monthly-timesheets?monthStart=${monthStart}&monthEnd=${monthEnd}&page=${p}&size=100`
          );
          const body = resp?.data !== undefined ? resp.data : resp;
          const paged = body?.data?.content ? body.data : body;
          allRows.push(...(paged?.content || []));
        }

        const headers = visibleColumns.map((c) => c.label);
        const exportRows = allRows.map((row) => {
          const obj = {};
          visibleColumns.forEach((c) => {
            const raw = row[c.key];
            obj[c.label] = raw === null || raw === undefined ? '' : raw;
          });
          return obj;
        });

        const fileName = `Timesheets_${monthStart}_to_${monthEnd}`;

        if (format === 'csv') {
          const headerRow = headers.join(',');
          const dataRows = exportRows.map((r) =>
            headers
              .map((h) => {
                const v = r[h];
                return typeof v === 'string'
                  ? `"${v.replace(/"/g, '""')}"`
                  : v;
              })
              .join(',')
          );
          const csvContent = [headerRow, ...dataRows].join('\n');
          const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;'
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(exportRows, {
            header: headers
          });
          XLSX.utils.book_append_sheet(wb, ws, 'Timesheets');
          XLSX.writeFile(wb, `${fileName}.xlsx`);
        }
        ToastService.success(`Exported ${exportRows.length} records`);
      } catch (err) {
        console.error('Export failed:', err);
        ToastService.error('Export failed');
      }
    },
    [monthStart, monthEnd]
  );

  const handleMonthChange = (e) => setSelectedMonth(e.target.value);
  const handleYearChange = (e) => setSelectedYear(e.target.value);

  const handleEmployeeClick = (row) => {
    try {
      if (!handleEmployeeNameClick) {
        ToastService.error('Navigation function is not available');
        return;
      }
      if (
        role === 'ACCOUNTS' ||
        role === 'SUPERADMIN' ||
        role === 'ADMIN'
      ) {
        sessionStorage.setItem(
          'timesheetsAdmin_selectedMonth',
          String(selectedMonth)
        );
        sessionStorage.setItem(
          'timesheetsAdmin_selectedYear',
          String(selectedYear)
        );
        handleEmployeeNameClick(
          row,
          navigate,
          role,
          selectedMonth,
          selectedYear
        );
      } else {
        ToastService.warning(
          'You do not have permission to view employee details'
        );
      }
    } catch (err) {
      console.error('Error in employee click handler:', err);
      ToastService.error('Failed to navigate to employee details');
    }
  };

  const vendorMap = useMemo(() => {
    const map = {};
    (Array.isArray(placements) ? placements : []).forEach((p) => {
      if (p?.candidateFullName) {
        map[normalizeName(p.candidateFullName)] = p.vendorName || '—';
      }
    });
    return map;
  }, [placements]);

  const Month = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC'
  ];
  const currentYear = dayjs().year();
  const Years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  const columns = [
    {
      key: 'employeeName',
      label: 'Employee Name',
      width: 180,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography
            variant="body2"
            fontWeight={500}
            sx={{
              cursor:
                role === 'ACCOUNTS' ||
                role === 'SUPERADMIN' ||
                role === 'ADMIN'
                  ? 'pointer'
                  : 'default',
              color:
                role === 'ACCOUNTS' ||
                role === 'SUPERADMIN' ||
                role === 'ADMIN'
                  ? 'primary.main'
                  : 'text.primary',
              textDecoration:
                role === 'ACCOUNTS' ||
                role === 'SUPERADMIN' ||
                role === 'ADMIN'
                  ? 'underline'
                  : 'none',
              '&:hover':
                role === 'ACCOUNTS' ||
                role === 'SUPERADMIN' ||
                role === 'ADMIN'
                  ? { color: 'primary.dark' }
                  : {}
            }}
            onClick={() => handleEmployeeClick(row)}
          >
            {row?.employeeName}
          </Typography>
        </Box>
      )
    },
    {
      key: 'employeeType',
      label: 'Employee Type',
      width: 140,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Chip
          label={row?.employeeType || '—'}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.primary.light,
            backgroundColor: alpha(theme.palette.primary.light, 0.1)
          }}
        />
      )
    },
    {
      key: 'clientName',
      label: 'Client',
      width: 160,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business sx={{ fontSize: 18, color: 'info.main' }} />
          <Typography variant="body2">
            {row?.clientName || '—'}
          </Typography>
        </Box>
      )
    },
    {
      key: 'vendor',
      label: 'Vendor',
      width: 160,
      sortable: false,
      filterable: false,
      render: (row) => {
        const vendor =
          vendorMap[normalizeName(row?.employeeName)] || '—';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2">{vendor}</Typography>
          </Box>
        );
      }
    },
    {
      key: 'startDate',
      label: 'Start Date',
      width: 130,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday
            sx={{ fontSize: 16, color: 'text.secondary' }}
          />
          <Typography variant="body2">
            {row?.startDate || '—'}
          </Typography>
        </Box>
      )
    },
    ...[1, 2, 3, 4, 5].map((w) => ({
      key: `week${w}Hours`,
      label: `Week ${w}`,
      width: 90,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Chip
          label={`${row?.[`week${w}Hours`] ?? 0}h`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.info.light,
            backgroundColor: alpha(theme.palette.info.light, 0.1)
          }}
        />
      )
    })),
    {
      key: 'totalWorkingHours',
      label: 'Total Hours',
      width: 120,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Chip
          icon={<AccessTime />}
          label={`${row?.totalWorkingHours ?? 0}h`}
          variant="filled"
          size="small"
          color="primary"
        />
      )
    },
    {
      key: 'totalMonthWorkingDays',
      label: 'Total Days (Month)',
      width: 150,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Chip
          label={`${row?.totalMonthWorkingDays ?? 0} days`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.info.light,
            backgroundColor: alpha(theme.palette.info.light, 0.1),
            color: theme.palette.info.dark,
            fontWeight: 600
          }}
        />
      )
    },
    {
      key: 'weekendDays',
      label: 'Weekend Days',
      width: 130,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Chip
          label={`${row?.weekendDays ?? 0} days`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.primary.light,
            backgroundColor: alpha(theme.palette.primary.light, 0.1),
            color: theme.palette.primary.dark,
            fontWeight: 600
          }}
        />
      )
    },
    {
      key: 'lastWorkedDays',
      label: 'Working Days',
      width: 130,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Chip
          label={`${row?.lastWorkedDays ?? 0} days`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.success.light,
            backgroundColor: alpha(theme.palette.success.light, 0.1),
            color: theme.palette.success.dark,
            fontWeight: 600
          }}
        />
      )
    },
    {
      key: 'totalWorkingDays',
      label: 'Worked Days',
      width: 120,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Chip
          label={`${row?.totalWorkingDays ?? 0} days`}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.info.dark,
            backgroundColor: alpha(theme.palette.info.dark, 0.1),
            color: 'info.dark',
            fontWeight: 600
          }}
        />
      )
    },
    {
      key: 'publicHolidays',
      label: 'Public Holidays',
      width: 130,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Chip
          label={row?.publicHolidays ?? 0}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.warning.light,
            backgroundColor: alpha(theme.palette.warning.light, 0.1),
            color: 'warning.dark',
            fontWeight: 500
          }}
        />
      )
    },
    {
      key: 'availableLeaves',
      label: 'Leaves Available',
      width: 130,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Chip
          label={row?.availableLeaves ?? 0}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.warning.light,
            backgroundColor: alpha(theme.palette.warning.light, 0.1),
            color: 'warning.dark',
            fontWeight: 500
          }}
        />
      )
    },
    {
      key: 'takenLeaves',
      label: 'Leaves Spent',
      width: 120,
      sortable: false,
      filterable: false,
      render: (row) => (
        <Chip
          label={row?.takenLeaves ?? 0}
          size="small"
          variant="outlined"
          sx={{
            borderColor: theme.palette.error.light,
            backgroundColor: alpha(theme.palette.error.light, 0.1),
            color: 'error.dark',
            fontWeight: 500
          }}
        />
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: 140,
      sortable: false,
      filterable: false,
      render: (row) => {
        const statusMap = {
          Approved: 'success',
          PENDING_APPROVAL: 'warning',
          Pending: 'warning',
          Rejected: 'error',
          DRAFT: 'info',
          NO_TIMESHEET: 'default'
        };
        const color = statusMap[row?.status] || 'default';
        return (
          <Chip
            label={String(row?.status || '').replace(/_/g, ' ')}
            size="small"
            color={color}
            variant={color === 'default' ? 'outlined' : 'filled'}
          />
        );
      }
    }
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AccessTime sx={{ color: 'primary.main', fontSize: 32 }} />
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, color: 'primary.dark' }}
          >
            Timesheet Management
          </Typography>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {totalCount > 0
              ? `${totalCount} timesheet${
                  totalCount === 1 ? '' : 's'
                } for ${Month[selectedMonth]} ${selectedYear} — page ${
                  currentPage + 1
                } of ${totalPages}`
              : `No timesheets for ${Month[selectedMonth]} ${selectedYear}`}
          </Typography>
        </Box>
      </Box>

      <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Grid item>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap'
                }}
              >
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <CalendarToday
                    sx={{ color: 'primary.main', fontSize: 24 }}
                  />
                  <Typography variant="h6" color="primary.main">
                    {Month[selectedMonth]} {selectedYear}
                  </Typography>
                </Box>

                <FormControl
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 120 }}
                >
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

                <FormControl
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 120 }}
                >
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
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  flexWrap: 'wrap'
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<DashboardIcon />}
                  onClick={() =>
                    navigate(
                      `/dashboard/timesheetsForAdmins/dashboard?year=${selectedYear}`
                    )
                  }
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
                      clearPrepopulatedEmployeeData();
                      sessionStorage.removeItem('prepopulatedEmployee');
                      sessionStorage.removeItem('selectedEmployeeData');
                      navigate('/dashboard/timesheets/create', {
                        state: {
                          forceCreateMode: true,
                          from: '/dashboard/timesheetsForAdmins',
                          timestamp: Date.now()
                        },
                        replace: true
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

      {monthlyError && (
        <Fade in={!!monthlyError}>
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}
            variant="filled"
          >
            {typeof monthlyError === 'string'
              ? monthlyError
              : 'Failed to fetch timesheet data'}
          </Alert>
        </Fade>
      )}

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
            <DataTablePaginated
              title="Timesheets"
              data={monthlyTimesheets}
              columns={columns}
              loading={monthlyLoading}
              // ---- Server-side pagination ----
              serverSide={true}
              page={currentPage}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              defaultRowsPerPage={DEFAULT_ROWS_PER_PAGE}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              // ---- Selection off ----
              enableSelection={false}
              checkboxRequired={false}
              // ---- Refresh ----
              refreshData={handleRefresh}
              // ---- Export ----
              enableExport={true}
              onExportData={handleExportData}
              // ---- Unique row id ----
              uniqueId="employeeId"
              // ---- Styling ----
              primaryColor={theme.palette.primary.main}
              customStyles={{
                headerBackground: theme.palette.primary.main
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TimeSheetsForAdmin;