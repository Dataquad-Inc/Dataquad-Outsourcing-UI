// src/components/AttendanceSummaryTab.jsx
// Server-side pagination + search (name / ID / designation / dept / reporting manager)

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Select,
  MenuItem, FormControl, InputLabel, InputAdornment, Chip,
  CircularProgress, Skeleton, Stack, Button, Avatar, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WorkIcon from '@mui/icons-material/Work';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { attendanceCycleAPI } from '../../Services/attendanceService';
import ToastService from '../../Services/toastService';

// ─── Design tokens ────────────────────────────────────────────────────────────
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
  amber: '#d97706',
  amberLight: '#fffbeb',
  teal: '#0891b2',
};

const ROWS_OPTIONS = [10, 20, 50];

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

// ─── PaginationBar ────────────────────────────────────────────────────────────
function PaginationBar({ page, totalPages, totalRows, rowsPerPage, onPageChange, onRowsPerPageChange }) {
  const start = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end   = Math.min(page * rowsPerPage, totalRows);
  const delta = 2;
  const lo    = Math.max(1, page - delta);
  const hi    = Math.min(totalPages, page + delta);
  const nums  = [];
  for (let i = lo; i <= hi; i++) nums.push(i);

  const base = {
    minWidth: 32, height: 32, px: 0.75, fontSize: '12px', fontWeight: 600,
    borderRadius: '7px', border: '1px solid', borderColor: T.border,
    color: T.textPrimary, bgcolor: T.surface, textTransform: 'none',
    '&:hover': { bgcolor: T.accentLight, borderColor: '#a5b4fc', color: T.accent },
    '&.Mui-disabled': { opacity: 0.35 },
  };
  const activeStyle = {
    ...base,
    bgcolor: T.accent, borderColor: T.accent, color: '#fff',
    '&:hover': { bgcolor: T.accentHover },
  };

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
            sx={{
              height: 32, fontSize: '12px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: T.border, borderRadius: '7px' },
            }}
          >
            {ROWS_OPTIONS.map(n => (
              <MenuItem key={n} value={n} sx={{ fontSize: '12px' }}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* First / Prev */}
        {[
          { icon: <FirstPageIcon sx={{ fontSize: 16 }} />, fn: () => onPageChange(1),        disabled: page === 1 },
          { icon: <ChevronLeftIcon sx={{ fontSize: 16 }} />, fn: () => onPageChange(page - 1), disabled: page === 1 },
        ].map((b, i) => (
          <Button key={i} variant="outlined" sx={base} disabled={b.disabled} onClick={b.fn}>{b.icon}</Button>
        ))}

        {/* Leading ellipsis */}
        {lo > 1 && (
          <>
            <Button variant="outlined" sx={base} onClick={() => onPageChange(1)}>1</Button>
            {lo > 2 && <Typography sx={{ fontSize: '12px', color: T.textDisabled }}>…</Typography>}
          </>
        )}

        {/* Page numbers */}
        {nums.map(p => (
          <Button key={p} variant="outlined" sx={p === page ? activeStyle : base} onClick={() => onPageChange(p)}>
            {p}
          </Button>
        ))}

        {/* Trailing ellipsis */}
        {hi < totalPages && (
          <>
            {hi < totalPages - 1 && <Typography sx={{ fontSize: '12px', color: T.textDisabled }}>…</Typography>}
            <Button variant="outlined" sx={base} onClick={() => onPageChange(totalPages)}>{totalPages}</Button>
          </>
        )}

        {/* Next / Last */}
        {[
          { icon: <ChevronRightIcon sx={{ fontSize: 16 }} />, fn: () => onPageChange(page + 1),      disabled: page >= totalPages },
          { icon: <LastPageIcon sx={{ fontSize: 16 }} />,     fn: () => onPageChange(totalPages),    disabled: page >= totalPages },
        ].map((b, i) => (
          <Button key={i} variant="outlined" sx={base} disabled={b.disabled} onClick={b.fn}>{b.icon}</Button>
        ))}
      </Stack>
    </Box>
  );
}

// ─── Table header cells ───────────────────────────────────────────────────────
const HEADER_CELLS = [
  { label: '#',                align: 'center', width: 48 },
  { label: 'Employee',        align: 'left',   minWidth: 200 },
  { label: 'Designation',     align: 'left',   minWidth: 140 },
  { label: 'Reporting Manager', align: 'left', minWidth: 150 },
  { label: 'PF',              align: 'center', minWidth: 60 },
  { label: 'ESI',             align: 'center', minWidth: 60 },
  { label: 'Probation',       align: 'center', minWidth: 60 },
  { label: 'Present',         align: 'center' },
  { label: 'Week Off',        align: 'center' },
  { label: 'Holidays',        align: 'center' },
  { label: 'CL',              align: 'center' },
  { label: 'SL',              align: 'center' },
  { label: 'SP',              align: 'center' },
  { label: 'LOP',             align: 'center' },
  { label: 'Total Leaves',    align: 'center' },
  { label: 'Pay Days',        align: 'center' },
  { label: 'Att %',           align: 'center' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const AttendanceSummaryTab = () => {
  // ── Cycles ────────────────────────────────────────────────────────────────
  const [cycles, setCycles]               = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [loadingCycles, setLoadingCycles] = useState(false);

  // ── Server-side page data ─────────────────────────────────────────────────
  const [pageData, setPageData]   = useState(null);   // one API page response
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // ── Pagination (1-based UI, 0-based for API) ──────────────────────────────
  const [page, setPage]               = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch               = useDebounce(searchInput, 400);

  // ── Fetch all cycles ──────────────────────────────────────────────────────
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
      const msg = 'Failed to load cycles';
      setError(msg);
      ToastService.error(msg);
    } finally {
      setLoadingCycles(false);
    }
  }, []);

  // ── Fetch one page from the bulk endpoint ─────────────────────────────────
  // Uses the same /cycles/{id}/bulk?page=&size=&search= that AttendanceGridTab uses.
  // The summary data (totalWorkedDays, leaves, payDays, etc.) is always present
  // in each EmployeeAttendanceRow.summary — we only read that here; we ignore
  // the per-day attendance map entirely.
  const fetchPage = useCallback(async (apiPage, search, rpp, cycleId) => {
    if (!cycleId) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: apiPage,
        size: rpp,
        ...(search ? { search } : {}),
      }).toString();

      const { data } = await attendanceCycleAPI.getCycleById(`${cycleId}/bulk?${qs}`);
      setPageData(data);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load summary data';
      setError(msg);
      ToastService.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => { fetchCycles(); }, [fetchCycles]);

  // ── Re-fetch on cycle / page / search / rowsPerPage change ───────────────
  useEffect(() => {
    if (selectedCycle?.cycleId) {
      fetchPage(page - 1, debouncedSearch || null, rowsPerPage, selectedCycle.cycleId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCycle?.cycleId, page, debouncedSearch, rowsPerPage]);

  // ── Reset to page 1 when search changes ──────────────────────────────────
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // ── When cycle changes ────────────────────────────────────────────────────
  const handleCycleChange = (cycleId) => {
    const c = cycles.find(x => x.cycleId === cycleId);
    setSelectedCycle(c || null);
    setPage(1);
    setSearchInput('');
  };

  // ── Pagination values from server ─────────────────────────────────────────
  const employees    = pageData?.employees   ?? [];
  const totalEmployees = pageData?.totalEmployees ?? 0;
  const totalPages   = Math.max(1, pageData?.totalPages ?? 1);
  const safePage     = Math.min(page, totalPages);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: T.bg, p: 2 }}>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, mb: 2, borderColor: T.border }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>

          {/* Cycle selector */}
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
                    label={c.status}
                    size="small"
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

          {/* Search */}
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
              endAdornment: loading && searchInput ? (
                <InputAdornment position="end">
                  <CircularProgress size={14} />
                </InputAdornment>
              ) : null,
            }}
            sx={{ flex: 2, '& .MuiInputBase-input': { fontSize: '13px' } }}
          />

          {/* Date range chip */}
          {pageData && (
            <Chip
              label={`${pageData.startDate} → ${pageData.endDate}`}
              size="small"
              sx={{
                height: 28, fontSize: '11px',
                bgcolor: T.accentLight, color: T.accent, fontWeight: 600,
              }}
            />
          )}

          {/* Employee count chip */}
          {pageData && (
            <Chip
              label={`${totalEmployees} employee${totalEmployees !== 1 ? 's' : ''}${debouncedSearch ? ' (filtered)' : ''}`}
              size="small"
              sx={{
                height: 28, fontSize: '11px',
                bgcolor: T.greenLight, color: T.green, fontWeight: 600,
              }}
            />
          )}
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* ── Summary Table ─────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: T.border }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>

            {/* ── Head ──────────────────────────────────────────────────── */}
            <TableHead>
              <TableRow>
                {HEADER_CELLS.map((h, i) => (
                  <TableCell
                    key={h.label}
                    align={h.align}
                    sx={{
                      bgcolor: T.surfaceAlt, py: 1,
                      px: i === 1 ? 1.5 : 0.75,
                      borderRight: i < HEADER_CELLS.length - 1 ? `1px solid ${T.border}` : 'none',
                      whiteSpace: 'nowrap',
                      ...(h.width    ? { width: h.width, minWidth: h.width } : {}),
                      ...(h.minWidth ? { minWidth: h.minWidth }              : {}),
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{
                        color: T.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontSize: '10px',
                      }}
                    >
                      {h.label}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            {/* ── Body ──────────────────────────────────────────────────── */}
            <TableBody>
              {loading ? (
                // Skeleton rows
                Array.from({ length: rowsPerPage < 8 ? rowsPerPage : 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {HEADER_CELLS.map((_, j) => (
                      <TableCell key={j} align="center" sx={{ py: 1.5, borderRight: j < HEADER_CELLS.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                        <Skeleton variant="text" width={j === 1 ? 140 : j <= 3 ? 80 : 36} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={HEADER_CELLS.length} align="center" sx={{ py: 8 }}>
                    <WorkIcon sx={{ fontSize: 48, color: T.textDisabled, mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color={T.textDisabled}>
                      {debouncedSearch
                        ? `No employees match "${debouncedSearch}".`
                        : 'No employees found for this cycle.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp, idx) => {
                  const rowBg   = idx % 2 === 0 ? T.surface : T.surfaceAlt;
                  const sNo     = (safePage - 1) * rowsPerPage + idx + 1;
                  const s       = emp.summary || {};
                  const pct     = s.attendancePercentage ?? 0;
                  const pctColor = pct >= 90 ? T.green : pct >= 75 ? T.amber : T.red;

                  return (
                    <TableRow
                      key={emp.employeeId}
                      sx={{ bgcolor: rowBg, '&:hover': { bgcolor: T.accentLight }, transition: 'background 0.1s' }}
                    >
                      {/* # */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontFamily="monospace" sx={{ fontSize: '11px', color: T.textDisabled }}>
                          {sNo}
                        </Typography>
                      </TableCell>

                      {/* Employee */}
                      <TableCell sx={{ py: 1, px: 1.5, borderRight: `1px solid ${T.border}` }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{
                            width: 28, height: 28, fontSize: '11px', fontWeight: 700,
                            bgcolor: `${T.accent}22`, color: T.accent, flexShrink: 0,
                          }}>
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
                        <Typography fontWeight={600} sx={{ fontSize: '11px', color: emp.hasPF ? T.green : T.textDisabled }}>
                          {emp.hasPF ? 'Yes' : 'No'}
                        </Typography>
                      </TableCell>

                      {/* ESI */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontWeight={600} sx={{ fontSize: '11px', color: emp.hasESI ? T.teal : T.textDisabled }}>
                          {emp.hasESI ? 'Yes' : 'No'}
                        </Typography>
                      </TableCell>

                      {/* Probation */}
                      <TableCell align="center" sx={{ py: 1, px: 0.75, borderRight: `1px solid ${T.border}` }}>
                        <Typography fontWeight={600} sx={{ fontSize: '11px', color: emp.isOnProbation ? T.amber : T.textDisabled }}>
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
                        <Typography fontFamily="monospace" fontWeight={600} sx={{ fontSize: '12px', color: (s.specialLeaves ?? 0) > 0 ? '#8b5cf6' : T.textDisabled }}>
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
                          <Box sx={{
                            width: 50, height: 3, borderRadius: 2,
                            bgcolor: `${pctColor}22`, overflow: 'hidden',
                          }}>
                            <Box sx={{
                              height: '100%', width: `${Math.min(pct, 100)}%`,
                              bgcolor: pctColor, borderRadius: 2,
                              transition: 'width 0.4s ease',
                            }} />
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