// src/components/AttendanceGridTab.jsx
// Server-side pagination + search (name / ID / reporting manager) via API.
// Employee edit drawer — click a row to open, then select ONE day at a time to edit.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Select,
  MenuItem, FormControl, InputLabel, InputAdornment, Chip, Alert,
  Snackbar, CircularProgress, Skeleton,
  Stack, Button, Tooltip,
  Badge,
} from '@mui/material';
import SearchIcon               from '@mui/icons-material/Search';
import RefreshIcon              from '@mui/icons-material/Refresh';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import CalendarMonthIcon        from '@mui/icons-material/CalendarMonth';
import FirstPageIcon            from '@mui/icons-material/FirstPage';
import LastPageIcon             from '@mui/icons-material/LastPage';
import ChevronLeftIcon          from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon         from '@mui/icons-material/ChevronRight';
import EditIcon                 from '@mui/icons-material/Edit';

import { attendanceCycleAPI, attendanceAPI } from '../../Services/attendanceService';
import ToastService from '../../Services/toastService';

// Sub-components
import EmployeeEditDrawer       from './EmployeeEditDrawer';
import { StatusChip, STATUS }   from './DayStatusEditor';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:            '#f8f9fc',
  surface:       '#ffffff',
  surfaceAlt:    '#f4f5f9',
  border:        '#e6e8f0',
  borderStrong:  '#cdd0de',
  textPrimary:   '#1a1d2e',
  textSecondary: '#6b7080',
  textDisabled:  '#a8adb8',
  accent:        '#5b6af0',
  accentLight:   '#eef0ff',
  accentHover:   '#4452e0',
  green:         '#0d9f6e',
  greenLight:    '#e8faf3',
  red:           '#e53e3e',
  redLight:      '#fff5f5',
  amber:         '#d97706',
  amberLight:    '#fffbeb',
  purple:        '#7c3aed',
  purpleLight:   '#f5f3ff',
  teal:          '#0891b2',
  tealLight:     '#ecfeff',
};

const ROWS_OPTIONS      = [10, 20, 50];
const EMPLOYEES_TO_SKIP = ['ADRTIN001', 'ADRTIN002'];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

function getCurrentUserId() {
  try {
    const stored = JSON.parse(localStorage.getItem('authUser'));
    return stored?.userId || 'SYSTEM_ADMIN';
  } catch { return 'SYSTEM_ADMIN'; }
}

// ─── RowSkeleton ───────────────────────────────────────────────────────────────
function RowSkeleton({ dayCount, W0, W1, W2, SUMMARY_W, CELL_W }) {
  return (
    <TableRow>
      <TableCell sx={{ position: 'sticky', left: 0,      zIndex: 3, bgcolor: T.surfaceAlt, width: W0 }}>
        <Skeleton variant="text" width={18} />
      </TableCell>
      <TableCell sx={{ position: 'sticky', left: W0,     zIndex: 3, bgcolor: T.surfaceAlt, width: W1 }}>
        <Skeleton variant="text" width={110} />
        <Skeleton variant="text" width={70} />
      </TableCell>
      <TableCell sx={{ position: 'sticky', left: W0 + W1, zIndex: 3, bgcolor: T.surfaceAlt, width: W2 }}>
        <Skeleton variant="text" width={95} />
      </TableCell>
      {Array(8).fill(0).map((_, i) => (
        <TableCell key={`sum-${i}`} align="center" sx={{ px: 0.5, width: SUMMARY_W }}>
          <Skeleton variant="text" width={28} />
        </TableCell>
      ))}
      {Array.from({ length: dayCount }).map((_, i) => (
        <TableCell key={i} align="center" sx={{ p: 0, width: CELL_W }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44 }}>
            <Skeleton variant="rectangular" width={26} height={18} sx={{ borderRadius: '4px' }} />
          </Box>
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── PaginationBar ─────────────────────────────────────────────────────────────
function PaginationBar({ page, totalPages, totalRows, rowsPerPage, onPageChange, onRowsPerPageChange }) {
  const start = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end   = Math.min(page * rowsPerPage, totalRows);
  const delta = 2, lo = Math.max(1, page - delta), hi = Math.min(totalPages, page + delta);
  const nums  = [];
  for (let i = lo; i <= hi; i++) nums.push(i);

  const base = {
    minWidth: 32, height: 32, px: 0.75, fontSize: '12px', fontWeight: 600,
    borderRadius: '7px', border: '1px solid', borderColor: T.border,
    color: T.textPrimary, bgcolor: T.surface, textTransform: 'none',
    '&:hover': { bgcolor: T.accentLight, borderColor: '#a5b4fc', color: T.accent },
    '&.Mui-disabled': { opacity: 0.35 },
  };
  const active = { ...base, bgcolor: T.accent, borderColor: T.accent, color: '#fff', '&:hover': { bgcolor: T.accentHover } };

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 1, px: 2, py: 1.5,
      borderTop: `1px solid ${T.border}`, bgcolor: T.surfaceAlt,
    }}>
      <Typography variant="caption" sx={{ color: T.textSecondary, fontSize: '12px' }}>
        {totalRows === 0 ? 'No results' : `${start}–${end} of ${totalRows} employees`}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
        <Typography variant="caption" sx={{ color: T.textSecondary, fontSize: '12px' }}>Rows:</Typography>
        <FormControl size="small">
          <Select
            value={rowsPerPage}
            onChange={e => onRowsPerPageChange(Number(e.target.value))}
            sx={{ height: 32, fontSize: '12px', '& .MuiOutlinedInput-notchedOutline': { borderColor: T.border, borderRadius: '7px' } }}
          >
            {ROWS_OPTIONS.map(n => <MenuItem key={n} value={n} sx={{ fontSize: '12px' }}>{n}</MenuItem>)}
          </Select>
        </FormControl>
        {[
          { icon: <FirstPageIcon sx={{ fontSize: 16 }} />,   fn: () => onPageChange(1),         disabled: page === 1 },
          { icon: <ChevronLeftIcon sx={{ fontSize: 16 }} />, fn: () => onPageChange(page - 1),  disabled: page === 1 },
        ].map((b, i) => (
          <Button key={i} variant="outlined" sx={base} disabled={b.disabled} onClick={b.fn}>{b.icon}</Button>
        ))}
        {lo > 1 && (
          <>
            <Button variant="outlined" sx={base} onClick={() => onPageChange(1)}>1</Button>
            {lo > 2 && <Typography sx={{ fontSize: '12px', color: T.textDisabled }}>…</Typography>}
          </>
        )}
        {nums.map(p => (
          <Button key={p} variant="outlined" sx={p === page ? active : base} onClick={() => onPageChange(p)}>{p}</Button>
        ))}
        {hi < totalPages && (
          <>
            {hi < totalPages - 1 && <Typography sx={{ fontSize: '12px', color: T.textDisabled }}>…</Typography>}
            <Button variant="outlined" sx={base} onClick={() => onPageChange(totalPages)}>{totalPages}</Button>
          </>
        )}
        {[
          { icon: <ChevronRightIcon sx={{ fontSize: 16 }} />, fn: () => onPageChange(page + 1),   disabled: page >= totalPages },
          { icon: <LastPageIcon sx={{ fontSize: 16 }} />,     fn: () => onPageChange(totalPages), disabled: page >= totalPages },
        ].map((b, i) => (
          <Button key={i} variant="outlined" sx={base} disabled={b.disabled} onClick={b.fn}>{b.icon}</Button>
        ))}
      </Stack>
    </Box>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
const AttendanceGridTab = () => {

  // ── Cycle state ──────────────────────────────────────────────────────────
  const [cycles, setCycles]               = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [loadingCycles, setLoadingCycles] = useState(false);

  // ── Server-side page data ────────────────────────────────────────────────
  const [bulkData, setBulkData]           = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  // ── Pagination ───────────────────────────────────────────────────────────
  const [page, setPage]                   = useState(1);
  const [rowsPerPage, setRowsPerPage]     = useState(10);

  // ── Search ───────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput]     = useState('');
  const debouncedSearch                   = useDebounce(searchInput, 2200);

  // ── Drawer state ─────────────────────────────────────────────────────────
  const [drawerEmp, setDrawerEmp]         = useState(null);
  const [drawerOpen, setDrawerOpen]       = useState(false);

  /**
   * Single-day edit model:
   *   drawerEdit  = { date: 'YYYY-MM-DD', status: 'P' | 'WFH' | … } | null
   *   selectedDate = the date whose picker is open (= drawerEdit?.date, or null)
   *
   * Selecting a different day always clears the previous pending edit first.
   */
  const [drawerEdit, setDrawerEdit]       = useState(null);   // { date, status }
  const [selectedDate, setSelectedDate]   = useState(null);   // string | null
  const [isSaving, setIsSaving]           = useState(false);

  // ── Snackbar ─────────────────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ── Layout constants ─────────────────────────────────────────────────────
  const W0 = 48, W1 = 190, W2 = 155, SUMMARY_W = 65, CELL_W = 44, CELL_H = 44;
  const stickyBase = { position: 'sticky', zIndex: 3 };
  const col0 = { ...stickyBase, left: 0,       width: W0, minWidth: W0, maxWidth: W0,  borderRight: `1px solid ${T.border}` };
  const col1 = { ...stickyBase, left: W0,      width: W1, minWidth: W1, maxWidth: W1,  borderRight: `1px solid ${T.border}` };
  const col2 = { ...stickyBase, left: W0 + W1, width: W2, minWidth: W2, maxWidth: W2,  borderRight: `2px solid ${T.borderStrong}` };

  // ── Fetch cycle list ─────────────────────────────────────────────────────
  const fetchCycles = useCallback(async () => {
    setLoadingCycles(true);
    try {
      const { data } = await attendanceCycleAPI.getAllCycles();
      const list = Array.isArray(data) ? data : [];
      setCycles(list);
      const now       = new Date();
      const monthName = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
      const year      = now.getFullYear();
      const auto =
        list.find(c => c.attendanceMonth === monthName && c.attendanceYear === year) ||
        list.find(c => c.status === 'OPEN') ||
        list[0] || null;
      setSelectedCycle(auto);
    } catch {
      ToastService.error('Failed to load cycles');
      showSnackbar('Failed to load cycles', 'error');
    } finally {
      setLoadingCycles(false);
    }
  }, []);

  // ── Core data fetch ──────────────────────────────────────────────────────
  const fetchBulkData = useCallback(async (apiPage, search, rpp, cycleId) => {
    if (!cycleId) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: apiPage, size: rpp,
        ...(search ? { search } : {}),
      }).toString();
      const { data } = await attendanceCycleAPI.getCycleById(`${cycleId}/bulk?${qs}`);
      const employees = (data.employees || []).filter(
        emp => !EMPLOYEES_TO_SKIP.includes(emp.employeeId)
      );
      setBulkData({ ...data, employees });
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Failed to load attendance';
      setError(msg);
      ToastService.error(msg);
      showSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => { fetchCycles(); }, [fetchCycles]);

  // ── Re-fetch on filter / page changes ────────────────────────────────────
  useEffect(() => {
    if (selectedCycle?.cycleId) {
      fetchBulkData(page - 1, debouncedSearch || null, rowsPerPage, selectedCycle.cycleId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCycle?.cycleId, page, debouncedSearch, rowsPerPage]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // ── Cycle change ─────────────────────────────────────────────────────────
  const handleCycleChange = (cycleId) => {
    const c = cycles.find(x => x.cycleId === cycleId);
    setSelectedCycle(c || null);
    setPage(1);
    setSearchInput('');
    closeDrawer();
  };

  // ── Day metadata ─────────────────────────────────────────────────────────
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const dayMetas = useMemo(() => {
    if (!bulkData?.startDate || !bulkData?.endDate) return [];
    const holidaySet     = new Set(bulkData.holidayDates || []);
    const weekOffSet     = new Set(bulkData.weekOffDays  || []);
    const holidayNameMap = bulkData.holidayNames || {};
    const metas = [];
    const [sy, sm, sd] = bulkData.startDate.split('-').map(Number);
    const [ey, em, ed] = bulkData.endDate.split('-').map(Number);
    const cur = new Date(Date.UTC(sy, sm - 1, sd));
    const end = new Date(Date.UTC(ey, em - 1, ed));
    while (cur <= end) {
      const dateStr = formatDate(cur);
      const jsDow   = cur.getUTCDay();
      const isoDow  = jsDow === 0 ? 7 : jsDow;
      const isHoliday = holidaySet.has(dateStr);
      const isWeekend = weekOffSet.has(isoDow);
      metas.push({
        date: dateStr,
        dayNumber:     cur.getUTCDate(),
        shortDay:      cur.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).slice(0, 2).toUpperCase(),
        fullDay:       cur.toLocaleDateString('en-US', { weekday: 'long',  timeZone: 'UTC' }),
        isWeekend, isHoliday,
        defaultStatus: isHoliday ? 'PH' : isWeekend ? 'WO' : null,
        lockReason:    isHoliday
          ? `Public Holiday: ${holidayNameMap[dateStr] || 'Holiday'}`
          : isWeekend ? 'Week Off' : null,
      });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return metas;
  }, [bulkData?.startDate, bulkData?.endDate, bulkData?.holidayDates, bulkData?.weekOffDays]);

  // ── Derived pagination ────────────────────────────────────────────────────
  const totalEmployees = bulkData?.totalEmployees ?? 0;
  const totalPages     = Math.max(1, bulkData?.totalPages ?? 1);
  const safePage       = Math.min(page, totalPages);
  const pageEmployees  = bulkData?.employees ?? [];

  // ── Grid display status (read-only — no local edits in the grid) ──────────
  const getGridStatus = (emp, dm) => {
    const db = emp.attendance?.[dm.date];
    if (db !== undefined && db !== null && db !== '') return db;
    return dm.defaultStatus ?? '';
  };

  // ── Drawer open / close ───────────────────────────────────────────────────
  const openDrawer = (emp) => {
    setDrawerEdit(null);
    setSelectedDate(null);
    setDrawerEmp(emp);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerEdit(null);
    setSelectedDate(null);
    setTimeout(() => setDrawerEmp(null), 300);
  };

  // ── Drawer: user selects a day ────────────────────────────────────────────
  // Selecting a new day discards any unsaved pending edit for the previous day.
  const handleSelectDay = (dm) => {
    if (selectedDate === dm.date) {
      // Clicking the same day toggles it off
      setSelectedDate(null);
      setDrawerEdit(null);
      return;
    }
    // Switch to a new day — discard previous unsaved edit
    setDrawerEdit(null);
    setSelectedDate(dm.date);
  };

  // ── Drawer: user picks a status for the selected day ──────────────────────
  const handleStatusPick = (date, status) => {
    setDrawerEdit({ date, status });
  };

  // ── Drawer: reset ─────────────────────────────────────────────────────────
  const handleDrawerReset = () => {
    setDrawerEdit(null);
    // keep selectedDate so the picker stays open
  };

  // ── Drawer: save (single record) ─────────────────────────────────────────
  const handleDrawerSave = async () => {
    if (!drawerEdit) return;
    setIsSaving(true);
    try {
      await attendanceAPI.updateAttendance({
        employeeId:     drawerEmp.employeeId,
        attendanceDate: drawerEdit.date,
        status:         drawerEdit.status || 'P',
        remarks:        '',
        updatedBy:      getCurrentUserId(),
      });

      ToastService.success('Attendance saved');
      showSnackbar('Attendance saved', 'success');

      // Clear pending edit + deselect day
      setDrawerEdit(null);
      setSelectedDate(null);

      // Refresh grid
      if (selectedCycle?.cycleId) {
        await fetchBulkData(safePage - 1, debouncedSearch || null, rowsPerPage, selectedCycle.cycleId);
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to save attendance';
      ToastService.error(msg);
      showSnackbar(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── CSV export ────────────────────────────────────────────────────────────
  const exportCSV = async () => {
    ToastService.info('Preparing CSV…');
    try {
      const qs = new URLSearchParams({
        page: 0, size: 5000,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }).toString();
      const { data } = await attendanceCycleAPI.getCycleById(
        `${selectedCycle.cycleId}/bulk?${qs}`
      );
      const allEmps = (data.employees || []).filter(
        emp => !EMPLOYEES_TO_SKIP.includes(emp.employeeId)
      );
      const header = [
        'S.No', 'Employee ID', 'Employee Name', 'Designation', 'Dept',
        'PF', 'ESI', 'Probation',
        'Present', 'Leaves', 'CL', 'SL', 'SP', 'LOP', 'Pay Days', 'Att %',
        ...dayMetas.map(d => d.date),
      ].join(',');
      const csvRows = allEmps.map((emp, i) => {
        const s    = emp.summary || {};
        const days = dayMetas.map(dm => {
          const dbVal = emp.attendance?.[dm.date];
          const val   = (dbVal !== undefined && dbVal !== null && dbVal !== '')
            ? dbVal : dm.defaultStatus ?? '';
          return `"${val}"`;
        });
        return [
          i + 1, `"${emp.employeeId}"`, `"${emp.employeeName || ''}"`,
          `"${emp.designation || ''}"`, `"${emp.department || ''}"`,
          emp.hasPF ? 'YES' : 'NO', emp.hasESI ? 'YES' : 'NO',
          emp.isOnProbation ? 'YES' : 'NO',
          s.totalWorkedDays ?? 0, s.totalLeavesTaken ?? 0,
          s.casualLeaves ?? 0, s.sickLeaves ?? 0,
          s.specialLeaves ?? 0, s.lossOfPayLeaves ?? 0,
          s.totalPayDays ?? 0, s.attendancePercentage ?? 0,
          ...days,
        ].join(',');
      });
      const csv = [header, ...csvRows].join('\n');
      const a   = document.createElement('a');
      a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = `attendance_${data.attendanceMonth}_${data.attendanceYear}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      ToastService.success('CSV exported');
      showSnackbar('CSV exported', 'success');
    } catch (e) {
      const msg = e?.response?.data?.message || 'CSV export failed';
      ToastService.error(msg);
      showSnackbar(msg, 'error');
    }
  };

  // ── Refresh ───────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    closeDrawer();
    fetchBulkData(safePage - 1, debouncedSearch || null, rowsPerPage, selectedCycle?.cycleId);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: T.bg }}>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, mb: 1.5, borderColor: T.border }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>

          <FormControl size="small" sx={{ minWidth: 235 }}>
            <InputLabel sx={{ fontSize: '13px' }}>Attendance Cycle</InputLabel>
            <Select
              label="Attendance Cycle"
              value={selectedCycle?.cycleId || ''}
              onChange={e => handleCycleChange(e.target.value)}
              disabled={loadingCycles}
              sx={{ fontSize: '13px' }}
            >
              {cycles.map(c => (
                <MenuItem key={c.cycleId} value={c.cycleId} sx={{ fontSize: '13px' }}>
                  {c.attendanceMonth} {c.attendanceYear}
                  <Chip
                    label={c.status} size="small"
                    sx={{
                      ml: 1, height: 16, fontSize: '9px',
                      bgcolor: c.status === 'OPEN' ? T.greenLight : '#f4f4f5',
                      color:   c.status === 'OPEN' ? T.green      : T.textSecondary,
                    }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Search by name, ID or reporting manager…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: T.textDisabled }} />
                </InputAdornment>
              ),
              endAdornment: loading && searchInput ? (
                <InputAdornment position="end"><CircularProgress size={14} /></InputAdornment>
              ) : null,
            }}
            sx={{ flex: 2, '& .MuiInputBase-input': { fontSize: '13px' } }}
          />

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined" size="small"
              startIcon={loading ? <CircularProgress size={13} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading || isSaving}
              sx={{
                textTransform: 'none', fontSize: '12px', height: 40,
                borderColor: T.border, color: T.textPrimary,
                '&:hover': { borderColor: '#a5b4fc', bgcolor: T.accentLight },
              }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined" size="small"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={exportCSV}
              disabled={!bulkData || totalEmployees === 0 || isSaving}
              sx={{
                textTransform: 'none', fontSize: '12px', height: 40,
                borderColor: T.border, color: T.textPrimary,
                '&:hover': { borderColor: '#a5b4fc', bgcolor: T.accentLight },
              }}
            >
              CSV
            </Button>
          </Stack>
        </Stack>

        {/* Cycle info chips */}
        {bulkData && (
          <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
            <Chip
              label={`${bulkData.startDate} → ${bulkData.endDate}`}
              size="small"
              sx={{ height: 22, fontSize: '10px', bgcolor: T.accentLight, color: T.accent, fontWeight: 600 }}
            />
            <Chip
              label={`${totalEmployees} employee${totalEmployees !== 1 ? 's' : ''}${debouncedSearch ? ' (filtered)' : ''}`}
              size="small"
              sx={{ height: 22, fontSize: '10px', bgcolor: T.greenLight, color: T.green, fontWeight: 600 }}
            />
            {(bulkData.weekOffDays || []).map(d => {
              const names = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              return (
                <Chip key={d} label={`${names[d]} off`} size="small"
                  sx={{ height: 22, fontSize: '10px', bgcolor: '#f1f2ff', color: T.accent }} />
              );
            })}
            {(bulkData.holidayDates || []).map(date => (
              <Chip key={date} label={`🎉 ${date} – ${bulkData.holidayNames?.[date] || 'Holiday'}`}
                size="small"
                sx={{ height: 22, fontSize: '10px', bgcolor: T.amberLight, color: T.amber, fontWeight: 600 }} />
            ))}
          </Stack>
        )}
      </Paper>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center',
        mb: 2, px: 1.5, py: 1,
        bgcolor: T.surfaceAlt, borderRadius: 1.5, border: `1px solid ${T.border}`,
      }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '10px' }}>
          Legend:
        </Typography>
        {['P', 'WFH', 'CL', 'SL', 'SP', 'HD', 'LOP', 'WO', 'PH', ''].map(code => (
          <Stack key={code} direction="row" alignItems="center" spacing={0.5}>
            <StatusChip code={code} />
            <Typography variant="caption" sx={{ color: T.textSecondary, fontSize: '10px' }}>
              {STATUS[code]?.label}
            </Typography>
          </Stack>
        ))}
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" sx={{
          color: T.accent, fontSize: '10px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 0.4,
        }}>
          <EditIcon sx={{ fontSize: 11 }} /> Click any row → select a day → save
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* ── Attendance grid ───────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: T.border }}>
        <TableContainer sx={{ overflowX: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
          <Table
            stickyHeader size="small"
            sx={{
              borderCollapse: 'separate', borderSpacing: 0,
              minWidth: W0 + W1 + W2 + (dayMetas.length || 31) * CELL_W + (8 * SUMMARY_W) + 100,
            }}
          >
            {/* ── Head ── */}
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ ...col0, bgcolor: T.surfaceAlt, zIndex: 5, py: 1 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, fontSize: '10px' }}>#</Typography>
                </TableCell>
                <TableCell sx={{ ...col1, bgcolor: T.surfaceAlt, zIndex: 5, py: 1, px: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '10px' }}>
                    Employee
                  </Typography>
                </TableCell>
                <TableCell sx={{ ...col2, bgcolor: T.surfaceAlt, zIndex: 5, py: 1, px: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '10px' }}>
                    Designation & Dept
                  </Typography>
                </TableCell>
                {['Present', 'Leaves', 'CL', 'SL', 'SP', 'LOP', 'Pay Days', 'Att %'].map(h => (
                  <TableCell key={h} align="center" sx={{
                    width: SUMMARY_W, minWidth: SUMMARY_W,
                    bgcolor: T.surfaceAlt, borderRight: `1px solid ${T.border}`,
                    py: 1, px: 0.5, zIndex: 4,
                  }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </Typography>
                  </TableCell>
                ))}
                {dayMetas.map(dm => {
                  let bgCol = T.surfaceAlt, textCol = T.textPrimary;
                  if (dm.isHoliday)      { bgCol = T.amberLight;  textCol = T.amber;  }
                  else if (dm.isWeekend) { bgCol = T.accentLight; textCol = T.accent; }
                  return (
                    <TableCell key={dm.date} align="center" sx={{
                      width: CELL_W, minWidth: CELL_W, maxWidth: CELL_W, p: 0,
                      bgcolor: bgCol, borderRight: `1px solid ${T.border}`, zIndex: 4,
                    }}>
                      <Tooltip title={dm.lockReason || `${dm.date} — ${dm.fullDay}`} arrow placement="top">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.75 }}>
                          <Typography fontWeight={700} sx={{ fontSize: '11px', color: textCol, lineHeight: 1.2 }}>
                            {dm.dayNumber}
                          </Typography>
                          <Typography sx={{ fontSize: '8px', color: textCol, fontWeight: dm.isWeekend || dm.isHoliday ? 600 : 400 }}>
                            {dm.shortDay}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            {/* ── Body ── */}
            <TableBody>
              {loading ? (
                Array.from({ length: rowsPerPage }).map((_, i) => (
                  <RowSkeleton key={i} dayCount={dayMetas.length || 31}
                    W0={W0} W1={W1} W2={W2} SUMMARY_W={SUMMARY_W} CELL_W={CELL_W} />
                ))
              ) : pageEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={dayMetas.length + 11} align="center" sx={{ py: 8 }}>
                    <CalendarMonthIcon sx={{ fontSize: 48, color: T.textDisabled, mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color={T.textDisabled}>
                      {debouncedSearch
                        ? `No employees match "${debouncedSearch}".`
                        : 'No employees found for this cycle.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pageEmployees.map((emp, idx) => {
                  const isSelected = drawerOpen && drawerEmp?.employeeId === emp.employeeId;
                  const rowBg      = isSelected
                    ? T.accentLight
                    : idx % 2 === 0 ? T.surface : T.surfaceAlt;
                  const sNo        = (safePage - 1) * rowsPerPage + idx + 1;
                  const s          = emp.summary || {};

                  return (
                    <TableRow
                      key={emp.employeeId}
                      onClick={() => openDrawer(emp)}
                      sx={{
                        bgcolor: rowBg, cursor: 'pointer',
                        outline: isSelected ? `2px solid ${T.accent}` : 'none',
                        outlineOffset: '-2px',
                        '&:hover': { bgcolor: isSelected ? T.accentLight : '#eef0ff' },
                        transition: 'background 0.1s, outline 0.1s',
                      }}
                    >
                      {/* # */}
                      <TableCell align="center" sx={{ ...col0, bgcolor: rowBg, py: 0, px: 0.5 }}>
                        <Typography fontFamily="monospace" sx={{ fontSize: '11px', color: T.textDisabled }}>{sNo}</Typography>
                      </TableCell>

                      {/* Employee info */}
                      <TableCell sx={{ ...col1, bgcolor: rowBg, py: 1, px: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Box>
                            <Typography fontWeight={700} noWrap sx={{ fontSize: '13px', lineHeight: 1.3, color: isSelected ? T.accent : T.textPrimary }}>
                              {emp.employeeName}
                            </Typography>
                            <Typography fontFamily="monospace" noWrap sx={{ fontSize: '10px', color: T.textDisabled, mt: 0.25 }}>
                              {emp.employeeId}
                            </Typography>
                            <Stack direction="row" spacing={0.5} mt={0.25}>
                              {emp.hasPF         && <Chip label="PF"        size="small" sx={{ height: 14, fontSize: '8px', bgcolor: T.greenLight,  color: T.green }} />}
                              {emp.hasESI        && <Chip label="ESI"       size="small" sx={{ height: 14, fontSize: '8px', bgcolor: T.accentLight, color: T.accent }} />}
                              {emp.isOnProbation && <Chip label="Probation" size="small" sx={{ height: 14, fontSize: '8px', bgcolor: '#fef9c3',     color: '#854d0e' }} />}
                            </Stack>
                          </Box>
                          {isSelected && (
                            <EditIcon sx={{ fontSize: 13, color: T.accent, flexShrink: 0, ml: 'auto' }} />
                          )}
                        </Stack>
                      </TableCell>

                      {/* Designation & Dept */}
                      <TableCell sx={{ ...col2, bgcolor: rowBg, py: 1, px: 1.5 }}>
                        <Typography fontWeight={600} noWrap sx={{ fontSize: '12px', lineHeight: 1.3 }}>
                          {emp.designation || '—'}
                        </Typography>
                        {emp.department && (
                          <Typography noWrap sx={{ fontSize: '10px', color: T.textDisabled, mt: 0.25 }}>
                            {emp.department}
                          </Typography>
                        )}
                        {emp.reportingManager && (
                          <Typography noWrap sx={{ fontSize: '10px', color: T.textDisabled }}>
                            ↑ {emp.reportingManager}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Summary values */}
                      {[
                        { val: s.totalWorkedDays,  color: T.green },
                        { val: s.totalLeavesTaken, color: (s.totalLeavesTaken ?? 0) > 0 ? T.amber   : T.textDisabled },
                        { val: s.casualLeaves,     color: (s.casualLeaves     ?? 0) > 0 ? '#be123c' : T.textDisabled },
                        { val: s.sickLeaves,       color: (s.sickLeaves       ?? 0) > 0 ? '#c2410c' : T.textDisabled },
                        { val: s.specialLeaves,    color: (s.specialLeaves    ?? 0) > 0 ? '#8b5cf6' : T.textDisabled },
                        { val: s.lossOfPayLeaves,  color: (s.lossOfPayLeaves  ?? 0) > 0 ? T.red     : T.textDisabled },
                        { val: s.totalPayDays,     color: T.accent },
                        {
                          val:   s.attendancePercentage != null ? `${s.attendancePercentage}%` : '—',
                          color: (s.attendancePercentage ?? 0) >= 80 ? T.green : T.red,
                        },
                      ].map((cell, i) => (
                        <TableCell key={i} align="center" sx={{ px: 0.5, py: 1, width: SUMMARY_W, borderRight: `1px solid ${T.border}` }}>
                          <Typography fontFamily="monospace" fontWeight={700} sx={{ fontSize: '11px', color: cell.color }}>
                            {cell.val ?? 0}
                          </Typography>
                        </TableCell>
                      ))}

                      {/* Day cells — read-only in grid */}
                      {dayMetas.map(dm => {
                        const status = getGridStatus(emp, dm);
                        let bgColor  = rowBg;
                        if (status === 'LOP')       bgColor = idx % 2 === 0 ? '#fff5f5' : '#fef2f2';
                        else if (dm.isHoliday)      bgColor = idx % 2 === 0 ? '#fff9e6' : T.amberLight;
                        else if (dm.isWeekend)      bgColor = idx % 2 === 0 ? '#f1f2ff' : T.accentLight;

                        return (
                          <TableCell
                            key={dm.date} align="center"
                            sx={{ p: 0, bgcolor: bgColor, borderRight: `1px solid ${T.border}` }}
                          >
                            <Tooltip title={`${STATUS[status]?.label || 'Unmarked'} — click row to edit`} arrow placement="top">
                              <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                height: CELL_H, width: CELL_W,
                              }}>
                                <StatusChip code={status} />
                              </Box>
                            </Tooltip>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <PaginationBar
          page={safePage}
          totalPages={totalPages}
          totalRows={totalEmployees}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1); }}
        />
      </Paper>

      {/* ── Employee Edit Drawer ──────────────────────────────────────────── */}
      <EmployeeEditDrawer
        open={drawerOpen}
        emp={drawerEmp}
        dayMetas={dayMetas}
        drawerEdit={drawerEdit}
        selectedDate={selectedDate}
        cycleStatus={bulkData?.cycleStatus}
        isSaving={isSaving}
        onClose={closeDrawer}
        onSelectDay={handleSelectDay}
        onStatusPick={handleStatusPick}
        onSave={handleDrawerSave}
        onReset={handleDrawerReset}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceGridTab;