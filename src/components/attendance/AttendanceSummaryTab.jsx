// src/components/AttendanceSummaryTab.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Select,
  MenuItem, FormControl, InputLabel, InputAdornment, Chip,
  CircularProgress, Skeleton, Grid, Card, CardContent,
  Stack, Button, Drawer, Divider, LinearProgress, Avatar,
  IconButton, Alert, Tooltip, Badge,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WorkIcon from '@mui/icons-material/Work';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { attendanceCycleAPI, attendanceAPI } from '../../Services/attendanceService';
import ToastService from '../../Services/toastService';

// Shared design tokens (matching AttendanceGridTab)
const T = {
  bg: '#f8f9fc',
  surface: '#ffffff',
  surfaceAlt: '#f4f5f9',
  border: '#e6e8f0',
  borderStrong: '#cdd0de',
  textPrimary: '#1a1d2e',
  textSecondary: '#6b7080',
  textDisabled: '#a8adb8',
  accent: '#5b6af0',
  accentLight: '#eef0ff',
  accentHover: '#4452e0',
  green: '#0d9f6e',
  greenLight: '#e8faf3',
  red: '#e53e3e',
  redLight: '#fff5f5',
  amber: '#d97706',
  amberLight: '#fffbeb',
  purple: '#7c3aed',
  purpleLight: '#f5f3ff',
  teal: '#0891b2',
  tealLight: '#ecfeff',
};

const ROWS_OPTIONS = [10, 20, 50];

function useDebounce(value, delay = 350) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

// ─── Pagination bar ──────────────────────────────────────────────────────────
function PaginationBar({ page, totalPages, totalRows, rowsPerPage, onPageChange, onRowsPerPageChange }) {
  const start = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end = Math.min(page * rowsPerPage, totalRows);
  const delta = 2;
  const lo = Math.max(1, page - delta);
  const hi = Math.min(totalPages, page + delta);
  const nums = [];
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
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, px: 2, py: 1.5, borderTop: `1px solid ${T.border}`, bgcolor: T.surfaceAlt }}>
      <Typography variant="caption" sx={{ color: T.textSecondary, fontSize: '12px' }}>
        {totalRows === 0 ? 'No results' : `${start}–${end} of ${totalRows} employees`}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
        <Typography variant="caption" sx={{ color: T.textSecondary, fontSize: '12px' }}>Rows:</Typography>
        <FormControl size="small">
          <Select value={rowsPerPage} onChange={e => onRowsPerPageChange(Number(e.target.value))}
            sx={{ height: 32, fontSize: '12px', '& .MuiOutlinedInput-notchedOutline': { borderColor: T.border, borderRadius: '7px' } }}>
            {ROWS_OPTIONS.map(n => <MenuItem key={n} value={n} sx={{ fontSize: '12px' }}>{n}</MenuItem>)}
          </Select>
        </FormControl>
        {[
          { icon: <FirstPageIcon sx={{ fontSize: 16 }} />, fn: () => onPageChange(1), disabled: page === 1 },
          { icon: <ChevronLeftIcon sx={{ fontSize: 16 }} />, fn: () => onPageChange(page - 1), disabled: page === 1 },
        ].map((b, i) => <Button key={i} variant="outlined" sx={base} disabled={b.disabled} onClick={b.fn}>{b.icon}</Button>)}
        {lo > 1 && <><Button variant="outlined" sx={base} onClick={() => onPageChange(1)}>1</Button>{lo > 2 && <Typography sx={{ fontSize: '12px', color: T.textDisabled }}>…</Typography>}</>}
        {nums.map(p => <Button key={p} variant="outlined" sx={p === page ? active : base} onClick={() => onPageChange(p)}>{p}</Button>)}
        {hi < totalPages && (<>{hi < totalPages - 1 && <Typography sx={{ fontSize: '12px', color: T.textDisabled }}>…</Typography>}<Button variant="outlined" sx={base} onClick={() => onPageChange(totalPages)}>{totalPages}</Button></>)}
        {[
          { icon: <ChevronRightIcon sx={{ fontSize: 16 }} />, fn: () => onPageChange(page + 1), disabled: page >= totalPages },
          { icon: <LastPageIcon sx={{ fontSize: 16 }} />, fn: () => onPageChange(totalPages), disabled: page >= totalPages },
        ].map((b, i) => <Button key={i} variant="outlined" sx={base} disabled={b.disabled} onClick={b.fn}>{b.icon}</Button>)}
      </Stack>
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AttendanceSummaryTab = () => {
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [bulkData, setBulkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const fetchCycles = useCallback(async () => {
    setLoadingCycles(true);
    try {
      const { data } = await attendanceCycleAPI.getAllCycles();
      const list = Array.isArray(data) ? data : [];
      setCycles(list);
      const now = new Date();
      const monthName = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
      const year = now.getFullYear();
      const auto = list.find(c => c.attendanceMonth === monthName && c.attendanceYear === year) ||
        list.find(c => c.status === 'OPEN') || list[0] || null;
      setSelectedCycle(auto);
    } catch (error) {
      const msg = 'Failed to load cycles';
      setError(msg);
      ToastService.error(msg);
    } finally {
      setLoadingCycles(false);
    }
  }, []);

  const fetchBulkData = useCallback(async () => {
    if (!selectedCycle) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await attendanceCycleAPI.getCycleById(`${selectedCycle.cycleId}/bulk`);
      setBulkData(data);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load summary data';
      setError(msg);
      ToastService.error(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedCycle?.cycleId]);

  useEffect(() => { fetchCycles(); }, [fetchCycles]);
  useEffect(() => { if (selectedCycle?.cycleId) { setPage(1); fetchBulkData(); } }, [selectedCycle?.cycleId]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const allEmployees = bulkData?.employees ?? [];

  const filtered = useMemo(() => {
    if (!debouncedSearch) return allEmployees;
    const q = debouncedSearch.toLowerCase();
    return allEmployees.filter(e =>
      (e.employeeName || '').toLowerCase().includes(q) ||
      (e.employeeId || '').toLowerCase().includes(q) ||
      (e.designation || '').toLowerCase().includes(q) ||
      (e.department || '').toLowerCase().includes(q) ||
      (e.reportingManager || '').toLowerCase().includes(q)
    );
  }, [allEmployees, debouncedSearch]);

  const totalEmployees = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEmployees / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const headerCells = [
    '#', 'Employee', 'Designation', 'Reporting Manager', 'PF', 'ESI', 'Probation',
    'Present', 'Week Off', 'Holidays', 'CL', 'SL', 'SP', 'LOP', 'Total Leaves', 'Pay Days', 'Att %',
  ];

  return (
    <Box sx={{ bgcolor: T.bg, p: 2 }}>     
      {/* Toolbar */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, mb: 2, borderColor: T.border }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 235 }}>
            <InputLabel sx={{ fontSize: '13px' }}>Attendance Cycle</InputLabel>
            <Select
              label="Attendance Cycle"
              value={selectedCycle?.cycleId || ''}
              onChange={e => {
                const c = cycles.find(x => x.cycleId === e.target.value);
                setSelectedCycle(c || null);
              }}
              disabled={loadingCycles}
              sx={{ fontSize: '13px' }}
            >
              {cycles.map(c => (
                <MenuItem key={c.cycleId} value={c.cycleId} sx={{ fontSize: '13px' }}>
                  {c.attendanceMonth} {c.attendanceYear}
                  <Chip label={c.status} size="small" sx={{
                    ml: 1, height: 16, fontSize: '9px',
                    bgcolor: c.status === 'OPEN' ? T.greenLight : '#f4f4f5',
                    color: c.status === 'OPEN' ? T.green : T.textSecondary,
                  }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Search by name, ID, designation, dept or manager…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: T.textDisabled }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 2, '& .MuiInputBase-input': { fontSize: '13px' } }}
          />

          {bulkData && (
            <Chip label={`${bulkData.startDate} → ${bulkData.endDate}`} size="small"
              sx={{ height: 28, fontSize: '11px', bgcolor: T.accentLight, color: T.accent, fontWeight: 600 }} />
          )}
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: T.border }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <TableHead>
              <TableRow>
                {headerCells.map((h, i) => (
                  <TableCell key={h} align={i <= 3 ? (i === 0 ? 'center' : 'left') : 'center'} sx={{
                    bgcolor: T.surfaceAlt, py: 1, px: i === 1 ? 1.5 : 0.75,
                    borderRight: i < headerCells.length - 1 ? `1px solid ${T.border}` : 'none',
                    whiteSpace: 'nowrap',
                    ...(i === 0 ? { width: 48, minWidth: 48 } : {}),
                    ...(i === 1 ? { minWidth: 200 } : {}),
                    ...(i === 2 ? { minWidth: 140 } : {}),
                    ...(i === 3 ? { minWidth: 150 } : {}),
                    ...(i >= 4 && i <= 6 ? { minWidth: 60 } : {}),
                  }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '10px' }}>
                      {h}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {headerCells.map((_, j) => (
                      <TableCell key={j} align="center" sx={{ py: 1.5 }}>
                        <Skeleton variant="text" width={j <= 3 ? (j === 1 ? 140 : 60) : 36} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headerCells.length} align="center" sx={{ py: 8 }}>
                    <WorkIcon sx={{ fontSize: 48, color: T.textDisabled, mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color={T.textDisabled}>
                      {allEmployees.length === 0 ? 'No employees found.' : `No match for "${debouncedSearch}".`}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((emp, idx) => {
                  const rowBg = idx % 2 === 0 ? T.surface : T.surfaceAlt;
                  const sNo = (safePage - 1) * rowsPerPage + idx + 1;
                  const s = emp.summary || {};
                  const pct = s.attendancePercentage ?? 0;
                  const pctColor = pct >= 90 ? T.green : pct >= 75 ? T.amber : T.red;

                  return (
                    <TableRow
                      key={emp.employeeId}
                      sx={{
                        bgcolor: rowBg,
                        '&:hover': { bgcolor: T.accentLight },
                        transition: 'background 0.1s',
                      }}
                    >
                      {/* # */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontFamily="monospace" sx={{ fontSize: '11px', color: T.textDisabled }}>{sNo}</Typography>
                      </TableCell>

                      {/* Employee */}
                      <TableCell sx={{ py: 1, px: 1.5, borderRight: `1px solid ${T.border}` }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 28, height: 28, fontSize: '11px', fontWeight: 700, bgcolor: `${T.accent}22`, color: T.accent, flexShrink: 0 }}>
                            {(emp.employeeName || '?').slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={700} noWrap sx={{ fontSize: '12px', lineHeight: 1.3, color: T.textPrimary }}>
                              {emp.employeeName}
                            </Typography>
                            <Typography fontFamily="monospace" noWrap sx={{ fontSize: '10px', color: T.textDisabled }}>
                              {emp.employeeId}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Designation */}
                      <TableCell sx={{ py: 1, px: 1.5, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontWeight={600} noWrap sx={{ fontSize: '12px', color: T.textPrimary }}>
                          {emp.designation || '—'}
                        </Typography>
                        {emp.department && (
                          <Typography noWrap sx={{ fontSize: '10px', color: T.textDisabled }}>
                            {emp.department}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Reporting Manager */}
                      <TableCell sx={{ py: 1, px: 1.5, borderRight: `1px solid ${T.border}` }}>
                        <Typography noWrap sx={{ fontSize: '12px', color: T.textSecondary }}>
                          {emp.reportingManager || '—'}
                        </Typography>
                      </TableCell>

                      {/* PF */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontWeight={600} sx={{ 
                          fontSize: '11px', 
                          color: emp.hasPF ? T.green : T.textDisabled,
                        }}>
                          {emp.hasPF ? 'Yes' : 'No'}
                        </Typography>
                      </TableCell>

                      {/* ESI */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontWeight={600} sx={{ 
                          fontSize: '11px', 
                          color: emp.hasESI ? T.teal : T.textDisabled,
                        }}>
                          {emp.hasESI ? 'Yes' : 'No'}
                        </Typography>
                      </TableCell>

                      {/* Probation */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontWeight={600} sx={{ 
                          fontSize: '11px', 
                          color: emp.isOnProbation ? T.amber : T.textDisabled,
                        }}>
                          {emp.isOnProbation ? 'Yes' : 'No'}
                        </Typography>
                      </TableCell>

                      {/* Present */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontFamily="monospace" fontWeight={700} sx={{ fontSize: '12px', color: T.green }}>
                          {s.totalWorkedDays ?? 0}
                        </Typography>
                      </TableCell>

                      {/* Week Off */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontFamily="monospace" fontWeight={600} sx={{ fontSize: '12px', color: T.textSecondary }}>
                          {s.totalWeekOffs ?? 0}
                        </Typography>
                      </TableCell>

                      {/* Holidays */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontFamily="monospace" fontWeight={600} sx={{ fontSize: '12px', color: T.amber }}>
                          {s.totalPublicHolidays ?? 0}
                        </Typography>
                      </TableCell>

                      {/* CL */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontFamily="monospace" fontWeight={600} sx={{ fontSize: '12px', color: (s.casualLeaves ?? 0) > 0 ? '#be123c' : T.textDisabled }}>
                          {s.casualLeaves ?? 0}
                        </Typography>
                      </TableCell>

                      {/* SL */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontFamily="monospace" fontWeight={600} sx={{ fontSize: '12px', color: (s.sickLeaves ?? 0) > 0 ? '#c2410c' : T.textDisabled }}>
                          {s.sickLeaves ?? 0}
                        </Typography>
                      </TableCell>

                      {/* SP */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontFamily="monospace" fontWeight={600} sx={{ 
                          fontSize: '12px', 
                          color: (s.specialLeaves ?? 0) > 0 ? '#8b5cf6' : T.textDisabled 
                        }}>
                          {s.specialLeaves ?? 0}
                        </Typography>
                      </TableCell>

                      {/* LOP */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontFamily="monospace" fontWeight={600} sx={{ fontSize: '12px', color: (s.lossOfPayLeaves ?? 0) > 0 ? T.red : T.textDisabled }}>
                          {s.lossOfPayLeaves ?? 0}
                        </Typography>
                      </TableCell>

                      {/* Total Leaves */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontFamily="monospace" fontWeight={700} sx={{ fontSize: '12px', color: (s.totalLeavesTaken ?? 0) > 0 ? T.amber : T.textDisabled }}>
                          {s.totalLeavesTaken ?? 0}
                        </Typography>
                      </TableCell>

                      {/* Pay Days */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontFamily="monospace" fontWeight={700} sx={{ fontSize: '12px', color: T.accent }}>
                          {s.totalPayDays ?? 0}
                        </Typography>
                      </TableCell>

                      {/* Att % */}
                      <TableCell align="center" sx={{ py: 1, px: 1 }}>
                        <Stack alignItems="center" spacing={0.5}>
                          <Typography fontFamily="monospace" fontWeight={800} sx={{ fontSize: '12px', color: pctColor }}>
                            {pct}%
                          </Typography>
                          <Box sx={{ width: 50, height: 3, borderRadius: 2, bgcolor: `${pctColor}22`, overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${Math.min(pct, 100)}%`, bgcolor: pctColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
                          </Box>
                        </Stack>
                      </TableCell>
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
    </Box>
  );
};

export default AttendanceSummaryTab;