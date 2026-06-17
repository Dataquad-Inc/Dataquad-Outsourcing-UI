import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Chip, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography, Select,
  MenuItem, FormControl, InputLabel, InputAdornment, Tooltip, Grid,
  Stack, Button, useMediaQuery, useTheme, CircularProgress, Skeleton,
  Alert, Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import WorkIcon from '@mui/icons-material/Work';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// ─── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:8083/users';

// ─── Constants ─────────────────────────────────────────────────────────────────
const ATTENDANCE_STATES = {
  P:   { label: 'Present',        color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
  WFH: { label: 'Work From Home', color: '#3730a3', bg: '#eef2ff', border: '#c7d2fe' },
  WO:  { label: 'Week Off',       color: '#52525b', bg: '#f4f4f5', border: '#d4d4d8' },
  CL:  { label: 'Casual Leave',   color: '#be123c', bg: '#fff1f2', border: '#fecdd3' },
  SL:  { label: 'Sick Leave',     color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  PL:  { label: 'Paid Leave',     color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  LOP: { label: 'Loss of Pay',    color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  OD:  { label: 'On Duty',        color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  HD:  { label: 'Half Day',       color: '#7e22ce', bg: '#fdf4ff', border: '#e9d5ff' },
  H:   { label: 'Holiday',        color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  A:   { label: 'Absent',         color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  '':  { label: 'Unmarked',       color: '#d1d5db', bg: 'transparent', border: '#d1d5db' },
};

// Statuses that can be cycled through when clicking a working day cell
const CYCLE_ORDER = ['P', 'WFH', 'CL', 'SL', 'PL', 'OD', 'HD', 'LOP', 'A', ''];
const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: '#f5f4f0',
  surface: '#ffffff',
  surfaceAlt: '#faf9f7',
  border: '#e8e6e0',
  borderStrong: '#d0cdc8',
  textPrimary: '#18181b',
  textSecondary: '#71717a',
  textDisabled: '#a1a1aa',
  accent: '#6366f1',
  accentLight: '#eef2ff',
  accentHover: '#4f46e5',
  green: '#059669',
  greenLight: '#ecfdf5',
  red: '#dc2626',
  redLight: '#fef2f2',
  amber: '#d97706',
  amberLight: '#fffbeb',
};

// ─── StatChip ──────────────────────────────────────────────────────────────────
function StatChip({ code, size = 'sm' }) {
  const s = ATTENDANCE_STATES[code] ?? ATTENDANCE_STATES[''];
  const isSmall = size === 'sm';
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: isSmall ? 28 : 40, height: isSmall ? 20 : 26,
      px: isSmall ? 0.5 : 1, borderRadius: '4px',
      fontSize: isSmall ? '9px' : '11px', fontWeight: 700,
      letterSpacing: '0.02em', fontFamily: 'monospace',
      cursor: 'pointer', userSelect: 'none',
      transition: 'opacity 0.15s',
      '&:hover': { opacity: 0.72 },
      bgcolor: s.bg, color: s.color,
      border: `1px ${code === '' ? 'dashed' : 'solid'} ${s.border}`,
    }}>
      {code || '·'}
    </Box>
  );
}

// ─── KpiCard ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, accentColor, loading }) {
  return (
    <Card variant="outlined" sx={{
      borderRadius: 2, height: '100%', borderColor: T.border,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.2s, transform 0.2s',
      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' },
    }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Typography variant="caption" fontWeight={700} color={T.textSecondary}
            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '10px', lineHeight: 1.4 }}>
            {label}
          </Typography>
          <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: accentColor ? `${accentColor}18` : T.accentLight }}>
            {icon}
          </Box>
        </Stack>
        {loading ? (
          <Skeleton variant="text" width={80} height={44} />
        ) : (
          <Stack spacing={0.25}>
            <Typography fontWeight={800} lineHeight={1}
              sx={{ fontSize: '2rem', color: accentColor || T.textPrimary }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" sx={{ color: T.textDisabled, fontSize: '11px' }}>
                {sub}
              </Typography>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

// ─── PaginationBar ─────────────────────────────────────────────────────────────
function PaginationBar({ page, totalPages, totalRows, rowsPerPage, onPageChange, onRowsPerPageChange }) {
  const start = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end = Math.min(page * rowsPerPage, totalRows);
  const delta = 2;
  const rangeStart = Math.max(1, page - delta);
  const rangeEnd = Math.min(totalPages, page + delta);
  const pageNums = [];
  for (let i = rangeStart; i <= rangeEnd; i++) pageNums.push(i);

  const btnSx = {
    minWidth: 32, height: 32, px: 0.75, fontSize: '12px', fontWeight: 600,
    borderRadius: '7px', border: '1px solid', borderColor: T.border,
    color: T.textPrimary, bgcolor: T.surface, textTransform: 'none',
    '&:hover': { bgcolor: T.accentLight, borderColor: '#a5b4fc', color: T.accent },
    '&.Mui-disabled': { opacity: 0.35 },
  };
  const activeSx = { ...btnSx, bgcolor: T.accent, borderColor: T.accent, color: '#fff', '&:hover': { bgcolor: T.accentHover } };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, px: 2, py: 1.5, borderTop: `1px solid ${T.border}`, bgcolor: T.surfaceAlt }}>
      <Typography variant="caption" color={T.textSecondary} sx={{ fontSize: '12px' }}>
        {totalRows === 0 ? 'No results' : `${start}–${end} of ${totalRows} employees`}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
        <Typography variant="caption" color={T.textSecondary} sx={{ fontSize: '12px' }}>Rows:</Typography>
        <FormControl size="small">
          <Select value={rowsPerPage} onChange={e => onRowsPerPageChange(Number(e.target.value))}
            sx={{ height: 32, fontSize: '12px', '& .MuiOutlinedInput-notchedOutline': { borderColor: T.border, borderRadius: '7px' } }}>
            {ROWS_PER_PAGE_OPTIONS.map(n => <MenuItem key={n} value={n} sx={{ fontSize: '12px' }}>{n}</MenuItem>)}
          </Select>
        </FormControl>
        {[
          { icon: <FirstPageIcon sx={{ fontSize: 16 }} />, action: () => onPageChange(1), disabled: page === 1 },
          { icon: <ChevronLeftIcon sx={{ fontSize: 16 }} />, action: () => onPageChange(page - 1), disabled: page === 1 },
        ].map((b, i) => <Button key={i} variant="outlined" sx={btnSx} disabled={b.disabled} onClick={b.action}>{b.icon}</Button>)}
        {rangeStart > 1 && <><Button variant="outlined" sx={btnSx} onClick={() => onPageChange(1)}>1</Button>{rangeStart > 2 && <Typography sx={{ fontSize: '12px', color: T.textDisabled }}>…</Typography>}</>}
        {pageNums.map(p => <Button key={p} variant="outlined" sx={p === page ? activeSx : btnSx} onClick={() => onPageChange(p)}>{p}</Button>)}
        {rangeEnd < totalPages && (
          <>
            {rangeEnd < totalPages - 1 && <Typography sx={{ fontSize: '12px', color: T.textDisabled }}>…</Typography>}
            <Button variant="outlined" sx={btnSx} onClick={() => onPageChange(totalPages)}>{totalPages}</Button>
          </>
        )}
        {[
          { icon: <ChevronRightIcon sx={{ fontSize: 16 }} />, action: () => onPageChange(page + 1), disabled: page >= totalPages },
          { icon: <LastPageIcon sx={{ fontSize: 16 }} />, action: () => onPageChange(totalPages), disabled: page >= totalPages },
        ].map((b, i) => <Button key={i} variant="outlined" sx={btnSx} disabled={b.disabled} onClick={b.action}>{b.icon}</Button>)}
      </Stack>
    </Box>
  );
}

// ─── RowSkeleton ───────────────────────────────────────────────────────────────
function RowSkeleton({ dayCount, CELL_W, W0, W1, W2 }) {
  return (
    <TableRow>
      <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3, bgcolor: T.surfaceAlt, width: W0 }}><Skeleton variant="text" width={20} /></TableCell>
      <TableCell sx={{ position: 'sticky', left: W0, zIndex: 3, bgcolor: T.surfaceAlt, width: W1 }}><Skeleton variant="text" width={120} /><Skeleton variant="text" width={80} /></TableCell>
      <TableCell sx={{ position: 'sticky', left: W0 + W1, zIndex: 3, bgcolor: T.surfaceAlt, width: W2 }}><Skeleton variant="text" width={100} /></TableCell>
      {Array.from({ length: dayCount }).map((_, i) => (
        <TableCell key={i} align="center" sx={{ p: 0, width: CELL_W }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44 }}>
            <Skeleton variant="rectangular" width={26} height={18} sx={{ borderRadius: '4px' }} />
          </Box>
        </TableCell>
      ))}
      {Array(8).fill(0).map((_, i) => <TableCell key={`s${i}`} align="center" sx={{ px: 0.5 }}><Skeleton variant="text" width={30} /></TableCell>)}
    </TableRow>
  );
}

// ─── Attendance Grid ───────────────────────────────────────────────────────────
function AttendanceGrid({ snackbar: showSnackbar }) {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [gridData, setGridData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localEdits, setLocalEdits] = useState({});
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [loadingCycles, setLoadingCycles] = useState(false);

  // ── Fetch all attendance cycles ─────────────────────────────────────────────
  const fetchCycles = useCallback(async () => {
    setLoadingCycles(true);
    try {
      const res = await fetch(`${BASE_URL}/attendance-cycles`);
      if (!res.ok) throw new Error(`Failed to fetch cycles (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setCycles(list);

      // Auto-select the most recent OPEN cycle, or just the first one
      const now = new Date();
      const monthName = now.toLocaleString('en-US', { month: 'long' });
      const year = now.getFullYear();
      const current = list.find(c =>
        c.attendanceMonth === monthName && c.attendanceYear === year
      ) || list.find(c => c.status === 'OPEN') || list[0] || null;
      setSelectedCycle(current);
    } catch (e) {
      showSnackbar(e.message, 'error');
    } finally {
      setLoadingCycles(false);
    }
  }, []);

  // ── Fetch attendance grid for selected cycle ────────────────────────────────
  const fetchGrid = useCallback(async () => {
    if (!selectedCycle) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        month: selectedCycle.attendanceMonth,
        year: String(selectedCycle.attendanceYear),
      });

      const res = await fetch(`${BASE_URL}/employee-attendance/all/monthly?${params}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Server error ${res.status}`);
      }
      const data = await res.json();  // Array<EmployeeMonthlyAttendanceResponseDto>
      const employees = Array.isArray(data) ? data : [];

      // ── Build day metadata from the first employee's attendance map ──────────
      // Keys are ISO strings "2025-06-01" because we fixed the DTO
      const rawKeys = employees.length > 0
        ? Object.keys(employees[0].attendance || {}).sort()
        : [];

      const dayMetas = rawKeys.map(dateStr => {
        const d = new Date(dateStr + 'T00:00:00'); // force local parse, not UTC
        const dow = d.getDay(); // 0=Sun, 6=Sat
        const isWeekend = dow === 0 || dow === 6;
        // H comes from the backend (injected by EmployeeAttendanceService)
        const isHoliday = employees.length > 0
          && (employees[0].attendance[dateStr] === 'H');
        return {
          date: dateStr,
          dayNumber: d.getDate(),
          dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
          shortDay: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 2),
          isWeekend,
          isHoliday,
          isLocked: isWeekend || isHoliday,
        };
      });

      // Client-side search filter
      const filtered = debouncedSearch
        ? employees.filter(e =>
            (e.employeeName || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (e.employeeId  || '').toLowerCase().includes(debouncedSearch.toLowerCase())
          )
        : employees;

      // Client-side pagination
      const totalElements = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalElements / rowsPerPage));
      const safePageNow = Math.min(page, totalPages);
      const pageSlice = filtered.slice((safePageNow - 1) * rowsPerPage, safePageNow * rowsPerPage);

      setGridData({
        allEmployees: filtered,
        employees: pageSlice,
        dayMetas,
        totalElements,
        totalPages,
        totalDaysInCycle: selectedCycle.totalDaysInCycle,
        startDate: selectedCycle.startDate,
        endDate: selectedCycle.endDate,
      });
      setLocalEdits({});
    } catch (e) {
      setError(e.message);
      showSnackbar(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCycle, debouncedSearch, page, rowsPerPage]);

  useEffect(() => { fetchCycles(); }, [fetchCycles]);
  useEffect(() => { if (selectedCycle) fetchGrid(); }, [fetchGrid]);
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedCycle]);

  // ── Cell click: cycle attendance status ────────────────────────────────────
  async function handleCellClick(emp, dm) {
    if (dm.isHoliday) { showSnackbar('Holiday — cannot modify', 'warning'); return; }
    if (dm.isWeekend) { showSnackbar('Weekend — cannot modify', 'warning'); return; }
    if (selectedCycle?.status !== 'OPEN') {
      showSnackbar(`Cycle is ${selectedCycle?.status} — cannot edit`, 'warning');
      return;
    }

    const editKey = `${emp.employeeId}_${dm.date}`;
    const cur = localEdits[editKey] ?? emp.attendance[dm.date] ?? '';
    const next = CYCLE_ORDER[(CYCLE_ORDER.indexOf(cur) + 1) % CYCLE_ORDER.length];

    // Optimistic update
    setLocalEdits(prev => ({ ...prev, [editKey]: next }));

    try {
      const body = {
        employeeId: emp.employeeId,
        cycleId: selectedCycle.cycleId,
        attendanceDate: dm.date,
        attendanceStatus: next || 'A',   // never send blank to backend
        remarks: '',
      };

      const res = await fetch(`${BASE_URL}/employee-attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Save failed (${res.status})`);
      }

      const label = next ? ATTENDANCE_STATES[next]?.label : 'Cleared';
      showSnackbar(`Marked as ${label}`, 'success');
      // Refresh so summary numbers update too
      fetchGrid();

    } catch (e) {
      // Roll back optimistic update
      setLocalEdits(prev => {
        const s = { ...prev };
        delete s[editKey];
        return s;
      });
      showSnackbar(`Failed: ${e.message}`, 'error');
    }
  }

  // ── CSV export ──────────────────────────────────────────────────────────────
  function exportCSV() {
    const emps = gridData?.allEmployees ?? [];
    const dms  = gridData?.dayMetas ?? [];
    let csv = 'S.No,Employee ID,Employee Name,Designation,PF,ESI,';
    dms.forEach(d => { csv += `${d.date},`; });
    csv += 'Present,Absent,CL,SL,PL,WFH,LOP\n';
    emps.forEach((emp, i) => {
      csv += `${i + 1},"${emp.employeeId}","${emp.employeeName || ''}","${emp.designation || ''}","${emp.isHavingPF ? 'YES' : 'NO'}","${emp.isHavingESI ? 'YES' : 'NO'}",`;
      dms.forEach(d => {
        const st = localEdits[`${emp.employeeId}_${d.date}`] ?? emp.attendance[d.date] ?? '';
        csv += `"${st}",`;
      });
      const s = emp.summary || {};
      csv += `${s.presentDays || 0},${s.absentDays || 0},${s.casualLeaves || 0},${s.sickLeaves || 0},${s.paidLeaves || 0},${s.workFromHomeDays || 0},${s.lopDays || 0}\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `attendance_${selectedCycle?.attendanceMonth}_${selectedCycle?.attendanceYear}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showSnackbar('CSV exported', 'success');
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const dayMetas       = gridData?.dayMetas ?? [];
  const employees      = gridData?.employees ?? [];
  const totalPages     = gridData?.totalPages ?? 1;
  const totalEmployees = gridData?.totalElements ?? 0;
  const totalWorkingDays = useMemo(
    () => dayMetas.filter(d => !d.isLocked).length,
    [dayMetas]
  );
  const holidayCount = useMemo(
    () => dayMetas.filter(d => d.isHoliday).length,
    [dayMetas]
  );

  const W0 = 52, W1 = 180, W2 = 160, CELL_W = 44, CELL_H = 44;
  const sticky = { position: 'sticky', zIndex: 3, bgcolor: 'background.paper' };
  const col0 = { ...sticky, left: 0, width: W0, minWidth: W0, maxWidth: W0, borderRight: `1px solid ${T.border}` };
  const col1 = { ...sticky, left: W0, width: W1, minWidth: W1, maxWidth: W1, borderRight: `1px solid ${T.border}` };
  const col2 = { ...sticky, left: W0 + W1, width: W2, minWidth: W2, maxWidth: W2, borderRight: `2px solid ${T.borderStrong}` };

  return (
    <Box>
      {/* ── KPI cards ── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <KpiCard label="Total Employees" value={totalEmployees} sub="Active this cycle" loading={loading}
            icon={<GroupIcon sx={{ fontSize: 18, color: T.accent }} />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Working Days" value={totalWorkingDays} sub="Excl. weekends & holidays" loading={loading}
            accentColor={T.green} icon={<WorkIcon sx={{ fontSize: 18, color: T.green }} />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Holidays" value={holidayCount} sub="In this cycle" loading={loading}
            accentColor={T.amber} icon={<CalendarMonthIcon sx={{ fontSize: 18, color: T.amber }} />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard label="Cycle Days" value={gridData?.totalDaysInCycle || '—'} sub="Total duration" loading={loading}
            icon={<EditCalendarIcon sx={{ fontSize: 18, color: T.accent }} />} />
        </Grid>
      </Grid>

      {/* ── Toolbar ── */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, mb: 2, borderColor: T.border }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel sx={{ fontSize: '12px' }}>Attendance Cycle</InputLabel>
            <Select
              label="Attendance Cycle"
              value={selectedCycle?.cycleId || ''}
              onChange={e => {
                const c = cycles.find(x => x.cycleId === e.target.value);
                setSelectedCycle(c || null);
                setPage(1);
              }}
              disabled={loadingCycles}
              sx={{ fontSize: '12px' }}
            >
              {cycles.map(c => (
                <MenuItem key={c.cycleId} value={c.cycleId} sx={{ fontSize: '12px' }}>
                  {c.attendanceMonth} {c.attendanceYear}
                  <Chip
                    label={c.status}
                    size="small"
                    sx={{
                      ml: 1, height: 16, fontSize: '9px',
                      bgcolor: c.status === 'OPEN' ? T.greenLight : '#f4f4f5',
                      color: c.status === 'OPEN' ? T.green : T.textSecondary,
                    }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField size="small" placeholder="Search by name or ID…" value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: T.textDisabled }} /></InputAdornment>,
              endAdornment: loading && searchInput
                ? <InputAdornment position="end"><CircularProgress size={14} /></InputAdornment>
                : null,
            }}
            sx={{ flex: 2, '& .MuiInputBase-input': { fontSize: '13px' } }}
          />

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={fetchGrid} disabled={loading}
              sx={{ textTransform: 'none', fontSize: '12px', height: 40, borderColor: T.border, color: T.textPrimary, '&:hover': { borderColor: '#a5b4fc', bgcolor: T.accentLight } }}>
              {loading ? <CircularProgress size={14} /> : 'Refresh'}
            </Button>
            <Button variant="outlined" size="small" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCSV} disabled={!employees.length}
              sx={{ textTransform: 'none', fontSize: '12px', height: 40, borderColor: T.border, color: T.textPrimary, '&:hover': { borderColor: '#a5b4fc', bgcolor: T.accentLight } }}>
              CSV
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* ── Legend ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2, px: 1.5, py: 1, bgcolor: '#f0ede8', borderRadius: 1.5, border: `1px solid ${T.border}` }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '10px' }}>Legend:</Typography>
        {['P','WFH','CL','SL','PL','OD','HD','LOP','A','H','WO',''].map(code => (
          <Stack key={code} direction="row" alignItems="center" spacing={0.5}>
            <StatChip code={code} />
            <Typography variant="caption" sx={{ color: T.textSecondary, fontSize: '10px' }}>{ATTENDANCE_STATES[code]?.label}</Typography>
          </Stack>
        ))}
        {selectedCycle && (
          <Chip
            label={`${selectedCycle.startDate} → ${selectedCycle.endDate}`}
            size="small"
            sx={{ height: 22, fontSize: '10px', bgcolor: T.accentLight, color: T.accent, fontWeight: 600, ml: 'auto' }}
          />
        )}
      </Box>

      {/* ── Table ── */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: T.border }}>
        <TableContainer sx={{ overflowX: 'auto', maxHeight: 'calc(100vh - 440px)' }}>
          <Table stickyHeader size="small" sx={{
            borderCollapse: 'separate', borderSpacing: 0,
            minWidth: W0 + W1 + W2 + (dayMetas.length || 31) * CELL_W + 500,
          }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ ...col0, bgcolor: T.surfaceAlt, zIndex: 5, py: 1 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, fontSize: '10px' }}>#</Typography>
                </TableCell>
                <TableCell sx={{ ...col1, bgcolor: T.surfaceAlt, zIndex: 5, py: 1, px: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '10px' }}>Employee</Typography>
                </TableCell>
                <TableCell sx={{ ...col2, bgcolor: T.surfaceAlt, zIndex: 5, py: 1, px: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '10px' }}>Designation</Typography>
                </TableCell>

                {/* Day columns */}
                {dayMetas.map(dm => {
                  let bgCol = T.surfaceAlt, textCol = T.textPrimary;
                  if (dm.isHoliday)      { bgCol = '#fffbeb'; textCol = T.amber; }
                  else if (dm.isWeekend) { bgCol = '#eef2ff'; textCol = T.accent; }
                  return (
                    <TableCell key={dm.date} align="center"
                      sx={{ width: CELL_W, minWidth: CELL_W, maxWidth: CELL_W, p: 0, bgcolor: bgCol, borderRight: `1px solid ${T.border}`, zIndex: 4 }}>
                      <Tooltip title={`${dm.date}${dm.isHoliday ? ' — Holiday' : dm.isWeekend ? ' — Weekend' : ''}`} arrow placement="top">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.75 }}>
                          <Typography fontWeight={700} sx={{ fontSize: '11px', color: textCol, lineHeight: 1.2 }}>{dm.dayNumber}</Typography>
                          <Typography sx={{ fontSize: '8px', color: textCol, fontWeight: dm.isLocked ? 600 : 400 }}>{dm.shortDay}</Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                  );
                })}

                {/* Summary columns */}
                {['Present','Absent','CL','SL','PL','WFH','LOP','%'].map(h => (
                  <TableCell key={h} align="center"
                    sx={{ minWidth: 52, bgcolor: T.surfaceAlt, borderLeft: `1px solid ${T.border}`, py: 1, px: 0.5, zIndex: 4 }}>
                    <Typography variant="caption" fontWeight={700}
                      sx={{ color: T.textSecondary, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                Array.from({ length: rowsPerPage }).map((_, i) => (
                  <RowSkeleton key={i} dayCount={dayMetas.length || 31} CELL_W={CELL_W} W0={W0} W1={W1} W2={W2} />
                ))
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={dayMetas.length + 11} align="center" sx={{ py: 8 }}>
                    <CalendarMonthIcon sx={{ fontSize: 48, color: T.textDisabled, mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color={T.textDisabled}>
                      No attendance records found for this cycle.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp, idx) => {
                  const rowBg = idx % 2 === 0 ? T.surface : T.surfaceAlt;
                  const sNo = (page - 1) * rowsPerPage + idx + 1;
                  const summary = emp.summary || {};

                  return (
                    <TableRow key={emp.employeeId} sx={{ bgcolor: rowBg, '&:hover': { bgcolor: '#f0f4ff' } }}>
                      <TableCell align="center" sx={{ ...col0, bgcolor: rowBg, py: 0, px: 0.5 }}>
                        <Typography fontFamily="monospace" sx={{ fontSize: '11px', color: T.textDisabled }}>{sNo}</Typography>
                      </TableCell>
                      <TableCell sx={{ ...col1, bgcolor: rowBg, py: 1, px: 1.5 }}>
                        <Typography fontWeight={700} noWrap sx={{ fontSize: '13px', lineHeight: 1.3 }}>{emp.employeeName}</Typography>
                        <Typography fontFamily="monospace" noWrap sx={{ fontSize: '10px', color: T.textDisabled, mt: 0.25 }}>{emp.employeeId}</Typography>
                        <Stack direction="row" spacing={0.5} mt={0.25}>
                          {emp.isHavingPF  && <Chip label="PF"  size="small" sx={{ height: 14, fontSize: '8px', bgcolor: T.greenLight,  color: T.green  }} />}
                          {emp.isHavingESI && <Chip label="ESI" size="small" sx={{ height: 14, fontSize: '8px', bgcolor: T.accentLight, color: T.accent }} />}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ ...col2, bgcolor: rowBg, py: 1, px: 1.5 }}>
                        <Typography fontWeight={600} noWrap sx={{ fontSize: '12px', lineHeight: 1.3 }}>{emp.designation || '—'}</Typography>
                        {emp.reportingManager && (
                          <Typography noWrap sx={{ fontSize: '10px', color: T.textDisabled, mt: 0.25 }}>↑ {emp.reportingManager}</Typography>
                        )}
                        {emp.isInProbationPeriod && (
                          <Chip label="Probation" size="small"
                            sx={{ height: 14, fontSize: '8px', mt: 0.25, bgcolor: '#fef9c3', color: '#854d0e' }} />
                        )}
                      </TableCell>

                      {/* Day cells */}
                      {dayMetas.map(dm => {
                        // Priority: local optimistic edit > server value
                        const editKey = `${emp.employeeId}_${dm.date}`;
                        const status = localEdits[editKey] ?? emp.attendance[dm.date] ?? '';

                        let bgColor = rowBg;
                        if (dm.isHoliday)      bgColor = idx % 2 === 0 ? '#fff8e7' : '#fffbeb';
                        else if (dm.isWeekend) bgColor = idx % 2 === 0 ? '#f3f2ff' : '#eef2ff';

                        const tooltipText = dm.isLocked
                          ? (dm.isHoliday ? 'Holiday' : 'Weekend')
                          : `${ATTENDANCE_STATES[status]?.label || 'Unmarked'} — click to change`;

                        return (
                          <TableCell key={dm.date} align="center"
                            onClick={() => handleCellClick(emp, dm)}
                            sx={{
                              p: 0,
                              cursor: dm.isLocked ? 'default' : 'pointer',
                              bgcolor: bgColor,
                              borderRight: `1px solid ${T.border}`,
                              opacity: dm.isHoliday ? 0.85 : 1,
                              '&:hover': {
                                bgcolor: dm.isLocked ? bgColor : '#dbeafe',
                              },
                              transition: 'background-color 0.12s ease',
                            }}>
                            <Tooltip title={tooltipText} arrow placement="top">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: CELL_H, width: CELL_W }}>
                                <StatChip code={status} />
                              </Box>
                            </Tooltip>
                          </TableCell>
                        );
                      })}

                      {/* Summary cells */}
                      {[
                        { val: summary.presentDays,      color: T.green },
                        { val: summary.absentDays,       color: (summary.absentDays ?? 0) > 0 ? T.red : T.textDisabled },
                        { val: summary.casualLeaves,     color: (summary.casualLeaves ?? 0) > 0 ? T.amber : T.textDisabled },
                        { val: summary.sickLeaves,       color: (summary.sickLeaves ?? 0) > 0 ? '#c2410c' : T.textDisabled },
                        { val: summary.paidLeaves,       color: T.green },
                        { val: summary.workFromHomeDays, color: T.accent },
                        { val: summary.lopDays,          color: (summary.lopDays ?? 0) > 0 ? T.red : T.textDisabled },
                        {
                          val: summary.attendancePercentage != null
                            ? `${summary.attendancePercentage}%` : '—',
                          color: (summary.attendancePercentage ?? 0) >= 80 ? T.green : T.red,
                        },
                      ].map((s, i) => (
                        <TableCell key={i} align="center"
                          sx={{ borderLeft: i === 0 ? `1px solid ${T.border}` : undefined, px: 0.5, py: 1 }}>
                          <Typography fontFamily="monospace" fontWeight={700}
                            sx={{ fontSize: '11px', color: s.color }}>
                            {s.val ?? 0}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <PaginationBar
          page={page}
          totalPages={Math.max(totalPages, 1)}
          totalRows={totalEmployees}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1); }}
        />
      </Paper>
    </Box>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────────
export default function AttendanceList() {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  return (
    <Box sx={{ bgcolor: T.bg, minHeight: '100vh', boxSizing: 'border-box' }}>
      

      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <AttendanceGrid snackbar={showSnackbar} />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}