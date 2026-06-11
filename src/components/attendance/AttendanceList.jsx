import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Chip, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography, Select,
  MenuItem, FormControl, InputLabel, InputAdornment, Tooltip, Grid,
  Stack, Button, useMediaQuery, useTheme, Dialog, DialogTitle,
  DialogContent, DialogActions, Checkbox, FormGroup, FormControlLabel,
  IconButton, Alert, Snackbar, CircularProgress, Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import WeekendIcon from '@mui/icons-material/Weekend';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
import WorkIcon from '@mui/icons-material/Work';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RefreshIcon from '@mui/icons-material/Refresh';

// ─── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:8083/user/attendance';

// ─── Constants ─────────────────────────────────────────────────────────────────
const ATTENDANCE_STATES = {
  P:   { label: 'Present',        sx: { bgcolor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' } },
  WFH: { label: 'Work From Home', sx: { bgcolor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' } },
  WO:  { label: 'Week Off',       sx: { bgcolor: '#f4f4f5', color: '#52525b', border: '1px solid #d4d4d8' } },
  CL:  { label: 'Casual Leave',   sx: { bgcolor: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' } },
  SL:  { label: 'Sick Leave',     sx: { bgcolor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' } },
  PL:  { label: 'Paid Leave',     sx: { bgcolor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' } },
  LOP: { label: 'Loss of Pay',    sx: { bgcolor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
  OD:  { label: 'On Duty',        sx: { bgcolor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' } },
  HD:  { label: 'Half Day',       sx: { bgcolor: '#fdf4ff', color: '#7e22ce', border: '1px solid #e9d5ff' } },
  H:   { label: 'Holiday',        sx: { bgcolor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' } },
  A:   { label: 'Absent',         sx: { bgcolor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' } },
  '':  { label: 'Unmarked',       sx: { bgcolor: 'transparent', color: '#d1d5db', border: '1px dashed #d1d5db' } },
};

// Cycle order — '' means "clear/delete the record"
const CYCLE_ORDER = ['P', 'WFH', 'CL', 'SL', 'PL', 'OD', 'HD', 'LOP', 'A', ''];

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const SPRING_MONTHS = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
];

// ─── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function getAvailableYears() {
  const y = new Date().getFullYear();
  const years = [];
  for (let i = y - 5; i <= y + 1; i++) years.push(i);
  return years;
}

// ─── StatChip ──────────────────────────────────────────────────────────────────
function StatChip({ code }) {
  const state = ATTENDANCE_STATES[code] ?? ATTENDANCE_STATES[''];
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 28, height: 20, px: 0.5, borderRadius: '4px',
      fontSize: '9px', fontWeight: 700, letterSpacing: '0.02em',
      fontFamily: 'monospace', cursor: 'pointer', userSelect: 'none',
      transition: 'opacity 0.15s', '&:hover': { opacity: 0.72 }, ...state.sx,
    }}>
      {code || '·'}
    </Box>
  );
}

// ─── KpiCard ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, badge, sub, accentColor, loading }) {
  return (
    <Card variant="outlined" sx={{
      borderRadius: 2, height: '100%', borderColor: '#e8e6e0',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: '0 4px 12px 0 rgba(0,0,0,0.08)' },
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            textTransform="uppercase" letterSpacing={0.7}
            sx={{ fontSize: { xs: '9px', sm: '10px' }, lineHeight: 1.4 }}>
            {label}
          </Typography>
          <Chip label={badge} size="small" sx={{
            height: 18, fontSize: '9px', fontWeight: 600, borderRadius: 1,
            bgcolor: '#f0ede8', color: '#6b6760', border: '1px solid #e0ddd8',
            flexShrink: 0, ml: 1,
          }} />
        </Stack>
        {loading ? (
          <Skeleton variant="text" width={60} height={40} />
        ) : (
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" flexWrap="wrap" gap={0.5}>
            <Typography fontWeight={800} color={accentColor || 'text.primary'} lineHeight={1}
              sx={{ fontSize: { xs: '1.6rem', sm: '1.875rem' } }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.disabled" fontWeight={500}
              sx={{ fontSize: { xs: '10px', sm: '11px' } }}>
              {sub}
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

// ─── PaginationBar ─────────────────────────────────────────────────────────────
function PaginationBar({ page, totalPages, totalRows, rowsPerPage, onPageChange, onRowsPerPageChange }) {
  const start = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end   = Math.min(page * rowsPerPage, totalRows);

  const delta = 2;
  const rangeStart = Math.max(1, page - delta);
  const rangeEnd   = Math.min(totalPages, page + delta);
  const pageNums   = [];
  for (let i = rangeStart; i <= rangeEnd; i++) pageNums.push(i);

  const btnSx = {
    minWidth: 30, height: 30, px: 0.75, fontSize: '12px', fontWeight: 600,
    borderRadius: '6px', border: '1px solid', borderColor: '#e0ddd8',
    color: '#3f3f46', bgcolor: '#fff', textTransform: 'none',
    '&:hover': { bgcolor: '#eef2ff', borderColor: '#a5b4fc', color: '#4f46e5' },
    '&.Mui-disabled': { opacity: 0.4 },
  };
  const activeBtnSx = {
    ...btnSx, bgcolor: '#6366f1', borderColor: '#6366f1', color: '#fff',
    '&:hover': { bgcolor: '#4f46e5', borderColor: '#4f46e5', color: '#fff' },
  };

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 1, px: { xs: 1.5, sm: 2 }, py: 1.25,
      borderTop: '1px solid #e8e6e0', bgcolor: '#f8f7f4',
    }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
        {totalRows === 0 ? 'No results' : `Showing ${start}–${end} of ${totalRows} employees`}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>Rows:</Typography>
        <FormControl size="small">
          <Select value={rowsPerPage} onChange={e => onRowsPerPageChange(Number(e.target.value))}
            sx={{
              height: 30, fontSize: '12px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0ddd8', borderRadius: '6px' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#a5b4fc' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
            }}>
            {ROWS_PER_PAGE_OPTIONS.map(n => (
              <MenuItem key={n} value={n} sx={{ fontSize: '12px' }}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" sx={btnSx} disabled={page === 1} onClick={() => onPageChange(1)}>
          <FirstPageIcon sx={{ fontSize: 16 }} />
        </Button>
        <Button variant="outlined" sx={btnSx} disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeftIcon sx={{ fontSize: 16 }} />
        </Button>
        {rangeStart > 1 && (
          <>
            <Button variant="outlined" sx={btnSx} onClick={() => onPageChange(1)}>1</Button>
            {rangeStart > 2 && <Typography sx={{ fontSize: '12px', color: 'text.disabled', px: 0.5 }}>…</Typography>}
          </>
        )}
        {pageNums.map(p => (
          <Button key={p} variant="outlined" sx={p === page ? activeBtnSx : btnSx} onClick={() => onPageChange(p)}>
            {p}
          </Button>
        ))}
        {rangeEnd < totalPages && (
          <>
            {rangeEnd < totalPages - 1 && <Typography sx={{ fontSize: '12px', color: 'text.disabled', px: 0.5 }}>…</Typography>}
            <Button variant="outlined" sx={btnSx} onClick={() => onPageChange(totalPages)}>{totalPages}</Button>
          </>
        )}
        <Button variant="outlined" sx={btnSx} disabled={page === totalPages || totalPages === 0} onClick={() => onPageChange(page + 1)}>
          <ChevronRightIcon sx={{ fontSize: 16 }} />
        </Button>
        <Button variant="outlined" sx={btnSx} disabled={page === totalPages || totalPages === 0} onClick={() => onPageChange(totalPages)}>
          <LastPageIcon sx={{ fontSize: 16 }} />
        </Button>
      </Stack>
    </Box>
  );
}

// ─── SettingsDialog ────────────────────────────────────────────────────────────
function SettingsDialog({ open, onClose, weekendDays, setWeekendDays, publicHolidays, setPublicHolidays, dayMetas, onSave }) {
  const [tempWeekendDays, setTempWeekendDays] = useState(weekendDays);
  const [tempPublicHolidays, setTempPublicHolidays] = useState(publicHolidays);
  const [selectedHolidayDate, setSelectedHolidayDate] = useState('');
  const [selectedHolidayName, setSelectedHolidayName] = useState('');

  useEffect(() => {
    if (open) {
      setTempWeekendDays(weekendDays);
      setTempPublicHolidays(publicHolidays);
    }
  }, [open, weekendDays, publicHolidays]);

  const weekdays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  const handleWeekendToggle = (day) => {
    setTempWeekendDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const addPublicHoliday = () => {
    if (selectedHolidayDate && selectedHolidayName) {
      setTempPublicHolidays(prev => [...prev, { date: selectedHolidayDate, name: selectedHolidayName }]);
      setSelectedHolidayDate('');
      setSelectedHolidayName('');
    }
  };

  const removePublicHoliday = (date) => {
    setTempPublicHolidays(prev => prev.filter(h => h.date !== date));
  };

  const handleSave = () => {
    setWeekendDays(tempWeekendDays);
    setPublicHolidays(tempPublicHolidays);
    onSave();
    onClose();
  };

  const totalWeekendCount = dayMetas.filter(d =>
    tempWeekendDays.includes(d.dayOfWeek.charAt(0) + d.dayOfWeek.slice(1).toLowerCase())
  ).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Attendance Settings</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              <WeekendIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
              Weekend Days
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Select which days are considered weekends (automatic WO)
            </Typography>
            <FormGroup row sx={{ mt: 1 }}>
              {weekdays.map(day => (
                <FormControlLabel key={day}
                  control={<Checkbox checked={tempWeekendDays.includes(day)} onChange={() => handleWeekendToggle(day)} size="small" />}
                  label={day} sx={{ mr: 2 }} />
              ))}
            </FormGroup>
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              <HolidayVillageIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
              Public Holidays (Frontend override)
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              These augment holidays from the server. Use the backend holiday API for permanent records.
            </Typography>
            <Stack direction="row" spacing={2} alignItems="flex-end" sx={{ mt: 2, mb: 2 }}>
              <TextField type="date" label="Holiday Date" value={selectedHolidayDate}
                onChange={e => setSelectedHolidayDate(e.target.value)}
                size="small" InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
              <TextField label="Holiday Name" value={selectedHolidayName}
                onChange={e => setSelectedHolidayName(e.target.value)}
                size="small" placeholder="e.g., Republic Day" sx={{ flex: 1 }} />
              <Button variant="contained" onClick={addPublicHoliday}
                disabled={!selectedHolidayDate || !selectedHolidayName}>
                Add
              </Button>
            </Stack>
            {tempPublicHolidays.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                <Stack spacing={1}>
                  {tempPublicHolidays.map((h, idx) => (
                    <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2"><strong>{h.date}</strong> — {h.name}</Typography>
                      <IconButton size="small" onClick={() => removePublicHoliday(h.date)} color="error">
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            )}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              <WorkIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
              Working Days Summary
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f7f4' }}>
              <Stack spacing={1}>
                <Typography variant="body2"><strong>Total Days in Cycle:</strong> {dayMetas.length}</Typography>
                <Typography variant="body2"><strong>Weekend Days:</strong> {totalWeekendCount}</Typography>
                <Typography variant="body2"><strong>Server Holidays:</strong> {dayMetas.filter(d => d.holiday).length}</Typography>
                <Typography variant="body2" color="primary.main">
                  <strong>Total Working Days:</strong>{' '}
                  {dayMetas.length - totalWeekendCount - dayMetas.filter(d => d.holiday).length}
                </Typography>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#6366f1' }}>Save Settings</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── RowSkeleton ───────────────────────────────────────────────────────────────
function RowSkeleton({ dayCount, isMobile, CELL_W, W0, W1, W2 }) {
  return (
    <TableRow>
      <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3, bgcolor: '#fafafa', width: W0 }}>
        <Skeleton variant="text" width={20} />
      </TableCell>
      <TableCell sx={{ position: 'sticky', left: W0, zIndex: 3, bgcolor: '#fafafa', width: W1 }}>
        <Skeleton variant="text" width={120} />
        <Skeleton variant="text" width={80} />
      </TableCell>
      <TableCell sx={{ position: 'sticky', left: W0 + W1, zIndex: 3, bgcolor: '#fafafa', width: W2 }}>
        <Skeleton variant="text" width={100} />
      </TableCell>
      {Array.from({ length: dayCount }).map((_, i) => (
        <TableCell key={i} align="center" sx={{ p: 0, width: CELL_W }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: isMobile ? 36 : 44 }}>
            <Skeleton variant="rectangular" width={24} height={18} sx={{ borderRadius: '4px' }} />
          </Box>
        </TableCell>
      ))}
      {[...Array(8)].map((_, i) => (
        <TableCell key={`stat-${i}`} align="center" sx={{ px: 0.5 }}>
          <Skeleton variant="text" width={30} />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV(rows, dayMetas) {
  let csv = 'S.No,Employee ID,Employee Name,Designation,PF,ESI,';
  dayMetas.forEach(d => { csv += `${d.date} (Day ${d.dayNumber}),`; });
  csv += 'Present,Absent,Paid Days,CL,SL,PL,WFH,LOP,OD,HD\n';
  rows.forEach((emp, idx) => {
    csv += `${idx + 1},"${emp.employeeId}","${emp.employeeName}","${emp.designation || ''}","${emp.pf ? 'YES' : 'NO'}","${emp.esi ? 'YES' : 'NO'}",`;
    dayMetas.forEach(d => { csv += `"${emp.attendanceGrid[String(d.dayNumber)] || ''}",`; });
    csv += `${emp.presentDays ?? 0},${emp.absentDays ?? 0},${emp.paidDays ?? 0},${emp.casualLeaves ?? 0},${emp.sickLeaves ?? 0},${emp.paidLeaves ?? 0},${emp.wfhDays ?? 0},${emp.lopDays ?? 0},${emp.odDays ?? 0},${emp.halfDays ?? 0}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `attendance_${dayMetas[0]?.date}_to_${dayMetas[dayMetas.length - 1]?.date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AttendanceList() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const now = new Date();
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-based

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ✅ FIX 1: gridData holds the full AttendanceGridResponse object
  const [gridData, setGridData] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // Local optimistic edits: "employeeId_dayNumber" -> status string
  const [localEdits, setLocalEdits] = useState({});

  const [settingsOpen, setSettingsOpen]     = useState(false);
  const [weekendDays, setWeekendDays]       = useState(['Saturday', 'Sunday']);
  const [extraHolidays, setExtraHolidays]   = useState([]);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const availableYears = useMemo(() => getAvailableYears(), []);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchGrid = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const springMonth = SPRING_MONTHS[selectedMonth];
      const params = new URLSearchParams({
        month: springMonth,
        year:  String(selectedYear),
        page:  String(page - 1),   // backend is 0-based
        size:  String(rowsPerPage),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const res = await fetch(`${BASE_URL}/grid?${params.toString()}`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || `Server error ${res.status}`);
      }
      const json = await res.json();
      // ✅ FIX 1: json.data IS the AttendanceGridResponse — assign it directly
      setGridData(json.data ?? json);
      setLocalEdits({});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, page, rowsPerPage, debouncedSearch]);

  useEffect(() => { fetchGrid(); }, [fetchGrid]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedYear, selectedMonth]);

  // ── Derived dayMetas (server + frontend weekend/holiday overlay) ──────────────
  const dayMetas = useMemo(() => {
    if (!gridData?.dayMetas) return [];
    return gridData.dayMetas.map(dm => {
      const friendlyDay = dm.dayOfWeek.charAt(0) + dm.dayOfWeek.slice(1).toLowerCase();
      const isExtraHoliday = extraHolidays.some(h => h.date === dm.date);
      const isFrontendWeekend = weekendDays.includes(friendlyDay);
      return {
        ...dm,
        isWeekend: dm.weekend || isFrontendWeekend,
        isHoliday: dm.holiday || isExtraHoliday,
        holidayName: dm.holidayName || (isExtraHoliday ? extraHolidays.find(h => h.date === dm.date)?.name : null),
      };
    });
  }, [gridData, weekendDays, extraHolidays]);

  // ── Effective cell status ────────────────────────────────────────────────────
  function effectiveStatus(emp, dayMeta) {
    const key = `${emp.employeeId}_${dayMeta.dayNumber}`;
    if (localEdits[key] !== undefined) return localEdits[key];
    const fromGrid = emp.attendanceGrid?.[String(dayMeta.dayNumber)] || '';
    if (!fromGrid) {
      if (dayMeta.isHoliday) return 'H';
      if (dayMeta.isWeekend) return 'WO';
    }
    return fromGrid;
  }

  // ── Cell click ───────────────────────────────────────────────────────────────
  async function handleCellClick(emp, dayMeta) {
    // ✅ FIX 2: Block both holidays AND weekends from being edited
    if (dayMeta.isHoliday) {
      setSnackbar({ open: true, message: `Cannot modify holiday: ${dayMeta.holidayName || 'Public Holiday'}`, severity: 'warning' });
      return;
    }
    if (dayMeta.isWeekend) {
      setSnackbar({ open: true, message: 'Cannot modify weekend days', severity: 'warning' });
      return;
    }

    const key = `${emp.employeeId}_${dayMeta.dayNumber}`;
    const cur = effectiveStatus(emp, dayMeta);
    const idx  = CYCLE_ORDER.indexOf(cur);
    const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];

    // Optimistic update
    setLocalEdits(prev => ({ ...prev, [key]: next }));

    try {
      if (next === '') {
        // ✅ FIX 3: '' means "clear" — call DELETE, not POST with empty status
        const res = await fetch(
          `${BASE_URL}/delete?employeeId=${encodeURIComponent(emp.employeeId)}&date=${dayMeta.date}`,
          { method: 'DELETE' }
        );
        if (!res.ok) throw new Error('Delete failed');
      } else {
        const res = await fetch(`${BASE_URL}/mark`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId:     emp.employeeId,
            attendanceDate: dayMeta.date,
            status:         next,
          }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          // If record already exists, update instead
          if (res.status === 409 || res.status === 400) {
            const upRes = await fetch(`${BASE_URL}/update`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                employeeId:     emp.employeeId,
                attendanceDate: dayMeta.date,
                status:         next,
              }),
            });
            if (!upRes.ok) throw new Error('Update failed');
          } else {
            throw new Error(errBody?.message || 'Save failed');
          }
        }
      }
    } catch (e) {
      // ✅ Rollback on failure
      setLocalEdits(prev => ({ ...prev, [key]: cur }));
      setSnackbar({ open: true, message: `Failed to save: ${e.message}`, severity: 'error' });
    }
  }

  // ── KPI ──────────────────────────────────────────────────────────────────────
  const totalEmployees = gridData?.totalElements ?? 0;
  const totalWorkingDays = useMemo(
    () => dayMetas.filter(d => !d.isWeekend && !d.isHoliday).length,
    [dayMetas]
  );

  // ── Table sizing ─────────────────────────────────────────────────────────────
  const W0 = isMobile ? 40  : 52;
  const W1 = isMobile ? 140 : 180;
  const W2 = isMobile ? 130 : 160;
  const CELL_W = isMobile ? 36 : 44;
  const CELL_H = isMobile ? 36 : 44;

  const stickyBase = { position: 'sticky', zIndex: 3, bgcolor: 'background.paper' };
  const col0 = { ...stickyBase, left: 0,       width: W0, minWidth: W0, maxWidth: W0, borderRight: '1px solid', borderColor: 'divider' };
  const col1 = { ...stickyBase, left: W0,      width: W1, minWidth: W1, maxWidth: W1, borderRight: '1px solid', borderColor: 'divider' };
  const col2 = { ...stickyBase, left: W0 + W1, width: W2, minWidth: W2, maxWidth: W2, borderRight: '2px solid', borderColor: 'divider' };

  const WEEKEND_HEAD_BG  = '#eef2ff';
  const WEEKEND_EVEN_BG  = '#f3f2ff';
  const WEEKEND_ODD_BG   = '#eef2ff';
  const WEEKEND_HOVER_BG = '#ddd6fe';
  const WEEKEND_COLOR    = '#4f46e5';
  const HOLIDAY_HEAD_BG  = '#fffbeb';
  const HOLIDAY_EVEN_BG  = '#fff8e7';
  const HOLIDAY_ODD_BG   = '#fffbeb';
  const HOLIDAY_COLOR    = '#b45309';
  const headBg           = '#f8f7f4';

  const employees  = gridData?.employees ?? [];
  const totalPages = gridData?.totalPages ?? 1;
  const cycleLabel = gridData
    ? `Cycle: ${gridData.startDate} → ${gridData.endDate} (${gridData.totalDaysInCycle} days)`
    : '';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: '#f5f4f0', minHeight: '100vh', p: { xs: 1.5, sm: 2, md: 3 }, boxSizing: 'border-box' }}>

      {/* KPI Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} mb={{ xs: 2, sm: 3 }}>
        {[
          { label: 'Total Employees', value: totalEmployees,                         badge: 'In Cycle',                               sub: 'Registered this cycle',      accentColor: '#18181b' },
          { label: 'Working Days',    value: totalWorkingDays,                        badge: `${MONTH_NAMES[selectedMonth]} ${selectedYear}`, sub: 'Excl. weekends & holidays', accentColor: '#0d6641' },
          { label: 'Cycle Days',      value: gridData?.totalDaysInCycle ?? '—',       badge: 'Full Cycle',                             sub: '26th to 25th',               accentColor: '#18181b' },
          { label: 'Page',            value: `${page} / ${Math.max(totalPages, 1)}`,  badge: `${rowsPerPage}/page`,                    sub: `${totalEmployees} total`,    accentColor: '#18181b' },
        ].map(card => (
          <Grid item xs={6} sm={6} md={3} key={card.label}>
            <KpiCard {...card} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* Filter Bar */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 }, borderColor: '#e8e6e0' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            size="small" placeholder="Search by employee name…"
            value={searchInput} onChange={e => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
              endAdornment: loading && searchInput ? (
                <InputAdornment position="end"><CircularProgress size={14} /></InputAdornment>
              ) : null,
            }}
            sx={{
              flex: 2, minWidth: { sm: 200 },
              '& .MuiInputBase-input': { fontSize: '13px' },
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: '#a5b4fc' },
                '&.Mui-focused fieldset': { borderColor: '#6366f1' },
              },
            }}
          />
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel sx={{ fontSize: '12px' }}>Year</InputLabel>
              <Select label="Year" value={selectedYear}
                onChange={e => { setSelectedYear(Number(e.target.value)); setPage(1); }}
                sx={{ fontSize: '12px' }}>
                {availableYears.map(y => <MenuItem key={y} value={y} sx={{ fontSize: '12px' }}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: '12px' }}>Month</InputLabel>
              <Select label="Month" value={selectedMonth}
                onChange={e => { setSelectedMonth(Number(e.target.value)); setPage(1); }}
                sx={{ fontSize: '12px' }}>
                {MONTH_NAMES.map((m, i) => <MenuItem key={i} value={i} sx={{ fontSize: '12px' }}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" startIcon={<RefreshIcon />}
              onClick={fetchGrid} disabled={loading}
              sx={{ whiteSpace: 'nowrap', textTransform: 'none', fontSize: '12px', height: 40, borderColor: '#e0ddd8', color: '#3f3f46', '&:hover': { borderColor: '#a5b4fc', bgcolor: '#eef2ff', color: '#4f46e5' } }}>
              {loading ? <CircularProgress size={14} /> : 'Refresh'}
            </Button>
            <Button variant="outlined" size="small" startIcon={<SettingsIcon />}
              onClick={() => setSettingsOpen(true)}
              sx={{ whiteSpace: 'nowrap', textTransform: 'none', fontSize: '12px', height: 40, borderColor: '#e0ddd8', color: '#3f3f46', '&:hover': { borderColor: '#a5b4fc', bgcolor: '#eef2ff', color: '#4f46e5' } }}>
              Settings
            </Button>
            <Button variant="outlined" size="small"
              startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: '16px !important' }} />}
              onClick={() => exportCSV(employees, dayMetas)}
              disabled={employees.length === 0}
              sx={{ whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 600, fontSize: '12px', height: 40, borderColor: '#e0ddd8', color: '#3f3f46', '&:hover': { borderColor: '#a5b4fc', bgcolor: '#eef2ff', color: '#4f46e5' } }}>
              {isMobile ? 'CSV' : 'Export CSV'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Error Banner */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}. Check that the backend is running and the cycle exists for {MONTH_NAMES[selectedMonth]} {selectedYear}.
        </Alert>
      )}

      {/* Legend */}
      <Box sx={{
        display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 1.5 }, alignItems: 'center',
        mb: { xs: 1.5, sm: 2 }, px: { xs: 0.5, sm: 1 }, py: { xs: 1, sm: 0.75 },
        bgcolor: '#f0ede8', borderRadius: 1.5, border: '1px solid #e8e6e0',
      }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          textTransform="uppercase" letterSpacing={0.7} sx={{ fontSize: '10px' }}>
          Legend:
        </Typography>
        {['P','WFH','CL','SL','PL','OD','HD','LOP','A','H','WO',''].map(code => (
          <Stack key={code} direction="row" alignItems="center" spacing={0.75}>
            <StatChip code={code} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
              {ATTENDANCE_STATES[code]?.label}
            </Typography>
          </Stack>
        ))}
        {cycleLabel && (
          <Chip label={cycleLabel} size="small"
            sx={{ height: 24, fontSize: '10px', bgcolor: '#e0e7ff', color: '#4f46e5', fontWeight: 600, ml: 'auto' }} />
        )}
      </Box>

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: '#e8e6e0', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
        <TableContainer sx={{
          width: '100%', overflowX: 'auto', overflowY: 'auto',
          maxHeight: { xs: 'calc(100vh - 420px)', sm: 'calc(100vh - 400px)' },
          WebkitOverflowScrolling: 'touch',
        }}>
          <Table stickyHeader size="small" sx={{
            borderCollapse: 'separate', borderSpacing: 0,
            minWidth: W0 + W1 + W2 + (dayMetas.length || 31) * CELL_W + 450,
          }}>

            {/* ── HEAD ── */}
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ ...col0, bgcolor: headBg, zIndex: 5, py: 1, px: 0.5 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: '10px' }}>SNo</Typography>
                </TableCell>
                <TableCell sx={{ ...col1, bgcolor: headBg, zIndex: 5, py: 1, px: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary"
                    textTransform="uppercase" letterSpacing={0.5} sx={{ fontSize: '10px' }}>
                    Employee
                  </Typography>
                </TableCell>
                <TableCell sx={{ ...col2, bgcolor: headBg, zIndex: 5, py: 1, px: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary"
                    textTransform="uppercase" letterSpacing={0.5} sx={{ fontSize: '10px' }}>
                    Designation
                  </Typography>
                </TableCell>

                {dayMetas.map(dm => {
                  const shortDay = dm.dayOfWeek.charAt(0) + dm.dayOfWeek.slice(1, 2).toLowerCase();
                  const dmDate   = new Date(dm.date);
                  const isNextMonth = dmDate.getMonth() !== selectedMonth;
                  const nextMonthLabel = isNextMonth ? MONTH_NAMES[dmDate.getMonth()].slice(0, 3) : '';

                  let bgColor = headBg;
                  let headerColor = 'text.primary';
                  let headerIcon = null;
                  if (dm.isHoliday) {
                    bgColor = HOLIDAY_HEAD_BG; headerColor = HOLIDAY_COLOR;
                    headerIcon = <HolidayVillageIcon sx={{ fontSize: isMobile ? 8 : 10, color: HOLIDAY_COLOR }} />;
                  } else if (dm.isWeekend) {
                    bgColor = WEEKEND_HEAD_BG; headerColor = WEEKEND_COLOR;
                    headerIcon = <WeekendIcon sx={{ fontSize: isMobile ? 8 : 10, color: WEEKEND_COLOR }} />;
                  }

                  return (
                    <TableCell key={dm.dayNumber} align="center"
                      sx={{ width: CELL_W, minWidth: CELL_W, maxWidth: CELL_W, p: 0, bgcolor: bgColor, borderRight: '1px solid', borderColor: 'divider', zIndex: 4 }}>
                      <Tooltip title={`${dm.date} — ${dm.isHoliday ? dm.holidayName : (dm.isWeekend ? 'Weekend' : 'Working Day')}`} arrow placement="top">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.75 }}>
                          <Typography fontWeight={700} lineHeight={1.2} color={headerColor} sx={{ fontSize: isMobile ? '9px' : '11px' }}>
                            {dm.dayNumber}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.25 }}>
                            {headerIcon}
                            <Typography sx={{ fontSize: '8px', color: headerColor, lineHeight: 1.2, fontWeight: dm.isHoliday || dm.isWeekend ? 600 : 400 }}>
                              {shortDay}
                            </Typography>
                          </Box>
                          {isNextMonth && (
                            <Typography sx={{ fontSize: '7px', color: 'text.disabled', mt: 0.25 }}>
                              {nextMonthLabel}
                            </Typography>
                          )}
                        </Box>
                      </Tooltip>
                    </TableCell>
                  );
                })}

                {/* Summary column headers */}
                {[
                  { lbl: 'Present', w: isMobile ? 52 : 64 },
                  { lbl: 'Absent',  w: isMobile ? 52 : 64 },
                  { lbl: 'Paid',    w: isMobile ? 44 : 56 },
                  { lbl: 'CL',      w: isMobile ? 40 : 50 },
                  { lbl: 'SL',      w: isMobile ? 40 : 50 },
                  { lbl: 'PL',      w: isMobile ? 40 : 50 },
                  { lbl: 'WFH',     w: isMobile ? 44 : 56 },
                  { lbl: 'LOP',     w: isMobile ? 44 : 56 },
                ].map(({ lbl, w }) => (
                  <TableCell key={lbl} align="center"
                    sx={{ width: w, minWidth: w, bgcolor: headBg, borderLeft: '1px solid', borderColor: 'divider', py: 1, px: 0.5, zIndex: 4 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary"
                      textTransform="uppercase" letterSpacing={0.4} sx={{ fontSize: '9px' }}>
                      {lbl}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            {/* ── BODY ── */}
            <TableBody>
              {loading ? (
                Array.from({ length: rowsPerPage }).map((_, i) => (
                  <RowSkeleton key={i} dayCount={dayMetas.length || 31}
                    isMobile={isMobile} CELL_W={CELL_W} W0={W0} W1={W1} W2={W2} />
                ))
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={dayMetas.length + 11} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.disabled">
                      {error
                        ? 'Could not load data. Try refreshing.'
                        : `No attendance records found for ${MONTH_NAMES[selectedMonth]} ${selectedYear}${searchInput ? ` matching "${searchInput}"` : ''}. Mark attendance first.`
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp, idx) => {
                  const rowBase = idx % 2 === 0 ? 'background.paper' : '#faf9f7';
                  const sNo = (page - 1) * rowsPerPage + idx + 1;

                  return (
                    <TableRow key={emp.employeeId}
                      sx={{ bgcolor: rowBase, '&:hover': { bgcolor: '#f0f4ff' } }}>

                      {/* S.No */}
                      <TableCell align="center" sx={{ ...col0, bgcolor: rowBase, py: 0, px: 0.5 }}>
                        <Typography fontFamily="monospace" color="text.disabled"
                          sx={{ fontSize: isMobile ? '9px' : '11px' }}>
                          {sNo}
                        </Typography>
                      </TableCell>

                      {/* Employee */}
                      <TableCell sx={{ ...col1, bgcolor: rowBase, py: 1, px: 1.5 }}>
                        <Typography fontWeight={700} noWrap
                          sx={{ maxWidth: W1 - 20, fontSize: isMobile ? '11px' : '13px', lineHeight: 1.3 }}>
                          {emp.employeeName}
                        </Typography>
                        <Typography fontFamily="monospace" color="text.disabled" display="block" noWrap
                          sx={{ fontSize: isMobile ? '9px' : '10px', mt: 0.25 }}>
                          {emp.employeeId}
                        </Typography>
                        <Typography color="text.disabled" display="block" noWrap
                          sx={{ fontSize: isMobile ? '8px' : '9px', mt: 0.25 }}>
                          PF: {emp.pf ? 'YES' : 'NO'} | ESI: {emp.esi ? 'YES' : 'NO'}
                        </Typography>
                      </TableCell>

                      {/* Designation */}
                      <TableCell sx={{ ...col2, bgcolor: rowBase, py: 1, px: 1.5 }}>
                        <Typography fontWeight={600} noWrap
                          sx={{ maxWidth: W2 - 16, fontSize: isMobile ? '11px' : '12px', lineHeight: 1.3 }}>
                          {emp.designation || '—'}
                        </Typography>
                        {emp.reportingManager && (
                          <Typography color="text.disabled" display="block" noWrap
                            sx={{ fontSize: isMobile ? '9px' : '10px', mt: 0.25, maxWidth: W2 - 16 }}>
                            Mgr: {emp.reportingManager}
                          </Typography>
                        )}
                        {emp.probation && emp.probation !== 'No' && (
                          <Chip label="Probation" size="small"
                            sx={{ height: 16, fontSize: '8px', mt: 0.25, bgcolor: '#fef9c3', color: '#854d0e' }} />
                        )}
                      </TableCell>

                      {/* Attendance cells */}
                      {dayMetas.map(dm => {
                        const status = effectiveStatus(emp, dm);
                        // ✅ FIX 2: weekends are also non-clickable
                        const isLocked = dm.isHoliday || dm.isWeekend;

                        let bgColor;
                        if (dm.isHoliday)      bgColor = idx % 2 === 0 ? HOLIDAY_EVEN_BG : HOLIDAY_ODD_BG;
                        else if (dm.isWeekend) bgColor = idx % 2 === 0 ? WEEKEND_EVEN_BG : WEEKEND_ODD_BG;
                        else                   bgColor = rowBase;

                        return (
                          <TableCell key={dm.dayNumber} align="center"
                            onClick={() => !isLocked && handleCellClick(emp, dm)}
                            sx={{
                              p: 0,
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                              bgcolor: bgColor,
                              borderRight: '1px solid', borderColor: 'divider',
                              '&:hover': {
                                bgcolor: isLocked
                                  ? bgColor
                                  : '#dbeafe',
                              },
                              transition: 'background-color 0.15s ease',
                              opacity: dm.isHoliday ? 0.85 : 1,
                            }}>
                            <Tooltip
                              title={
                                dm.isHoliday
                                  ? `Public Holiday: ${dm.holidayName}`
                                  : dm.isWeekend
                                    ? 'Weekend (WO) — read only'
                                    : `Click to cycle · Current: ${ATTENDANCE_STATES[status]?.label || 'Unmarked'}`
                              }
                              arrow placement="top">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: CELL_H, width: CELL_W }}>
                                <StatChip code={status} />
                              </Box>
                            </Tooltip>
                          </TableCell>
                        );
                      })}

                      {/* Summary columns */}
                      <TableCell align="center" sx={{ borderLeft: '1px solid', borderColor: 'divider', px: 0.5, py: 1 }}>
                        <Typography fontFamily="monospace" fontWeight={700}
                          sx={{ fontSize: isMobile ? '10px' : '11px', color: '#065f46' }}>
                          {(emp.presentDays ?? 0).toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ px: 0.5, py: 1 }}>
                        <Typography fontFamily="monospace" fontWeight={700}
                          sx={{ fontSize: isMobile ? '10px' : '11px', color: (emp.absentDays ?? 0) > 0 ? '#dc2626' : 'text.disabled' }}>
                          {(emp.absentDays ?? 0).toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ px: 0.5, py: 1 }}>
                        <Typography fontFamily="monospace" fontWeight={700} color="text.primary"
                          sx={{ fontSize: isMobile ? '10px' : '11px' }}>
                          {(emp.paidDays ?? 0).toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ px: 0.5, py: 1 }}>
                        <Typography fontFamily="monospace" fontWeight={700}
                          sx={{ fontSize: isMobile ? '10px' : '11px', color: (emp.casualLeaves ?? 0) > 0 ? '#b45309' : 'text.disabled' }}>
                          {emp.casualLeaves ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ px: 0.5, py: 1 }}>
                        <Typography fontFamily="monospace" fontWeight={700}
                          sx={{ fontSize: isMobile ? '10px' : '11px', color: (emp.sickLeaves ?? 0) > 0 ? '#c2410c' : 'text.disabled' }}>
                          {emp.sickLeaves ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ px: 0.5, py: 1 }}>
                        <Typography fontFamily="monospace" fontWeight={700}
                          sx={{ fontSize: isMobile ? '10px' : '11px', color: '#15803d' }}>
                          {emp.paidLeaves ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ px: 0.5, py: 1 }}>
                        <Typography fontFamily="monospace" fontWeight={700}
                          sx={{ fontSize: isMobile ? '10px' : '11px', color: WEEKEND_COLOR }}>
                          {emp.wfhDays ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ px: 0.5, py: 1 }}>
                        <Typography fontFamily="monospace" fontWeight={700}
                          sx={{ fontSize: isMobile ? '10px' : '11px', color: (emp.lopDays ?? 0) > 0 ? '#991b1b' : 'text.disabled' }}>
                          {emp.lopDays ?? 0}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <PaginationBar
          page={page} totalPages={Math.max(totalPages, 1)} totalRows={totalEmployees}
          rowsPerPage={rowsPerPage}
          onPageChange={p => setPage(p)}
          onRowsPerPageChange={n => { setRowsPerPage(n); setPage(1); }}
        />
      </Paper>

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen} onClose={() => setSettingsOpen(false)}
        weekendDays={weekendDays} setWeekendDays={setWeekendDays}
        publicHolidays={extraHolidays} setPublicHolidays={setExtraHolidays}
        dayMetas={dayMetas}
        onSave={() => setSnackbar({ open: true, message: 'Settings saved!', severity: 'success' })}
      />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {isMobile && (
        <Typography variant="caption" color="text.disabled"
          sx={{ display: 'block', textAlign: 'center', mt: 1.5, fontStyle: 'italic', fontSize: '10px' }}>
          ← Scroll horizontally → · Tap any working-day cell to change attendance status
        </Typography>
      )}
    </Box>
  );
}