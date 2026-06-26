// src/components/attendance/DayStatusEditor.jsx
// Renders a single-day status picker inside the drawer.
// Only ONE day can be in edit mode at a time — enforced by the parent.

import React from 'react';
import {
  Box, Typography, Stack, Divider, Chip, Tooltip,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

// ─── Design tokens (same as grid) ─────────────────────────────────────────────
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
};

export const STATUS = {
  P:   { label: 'Present',        color: '#065f46', bg: '#ecfdf5',  border: '#a7f3d0' },
  WFH: { label: 'Work From Home', color: T.accent,  bg: T.accentLight, border: '#c7d2fe' },
  WO:  { label: 'Week Off',       color: '#52525b', bg: '#f4f4f5',  border: '#d4d4d8' },
  PH:  { label: 'Public Holiday', color: T.amber,   bg: T.amberLight, border: '#fde68a' },
  CL:  { label: 'Casual Leave',   color: '#be123c', bg: '#fff1f2',  border: '#fecdd3' },
  SL:  { label: 'Sick Leave',     color: '#c2410c', bg: '#fff7ed',  border: '#fed7aa' },
  SP:  { label: 'Special Leave',  color: '#8b5cf6', bg: '#f5f3ff',  border: '#ddd6fe' },
  LOP: { label: 'Loss of Pay',    color: '#991b1b', bg: '#fef2f2',  border: '#fecaca' },
  HD:  { label: 'Half Day',       color: T.purple,  bg: T.purpleLight, border: '#ddd6fe' },
  '':  { label: 'Unmarked',       color: '#9ca3af', bg: 'transparent', border: '#d1d5db' },
};

// Statuses the user can choose from (WO / PH are system-locked)
export const EDITABLE_STATUSES = ['P', 'WFH', 'CL', 'SL', 'SP', 'HD', 'LOP', 'WO',''];

// ─── StatusChip ───────────────────────────────────────────────────────────────
export function StatusChip({ code, size = 'sm' }) {
  const s  = STATUS[code] ?? STATUS[''];
  const sz = size === 'lg'
    ? { minWidth: 44, height: 28, px: 1,   fontSize: '12px' }
    : { minWidth: 30, height: 22, px: 0.5, fontSize: '10px' };
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '5px', fontWeight: 700, letterSpacing: '0.03em',
      fontFamily: 'monospace', userSelect: 'none',
      bgcolor: s.bg, color: s.color,
      border: `1px ${code === '' ? 'dashed' : 'solid'} ${s.border}`,
      ...sz,
    }}>
      {code || '·'}
    </Box>
  );
}

// ─── DayCard — one day tile in the calendar strip ────────────────────────────
function DayCard({ dm, currentStatus, isSelected, isPendingChange, onClick, cycleReadOnly }) {
  const locked = currentStatus === 'PH';
  const s      = STATUS[currentStatus] ?? STATUS[''];

  return (
    <Tooltip
      title={
        locked
          ? (dm.lockReason || currentStatus)
          : cycleReadOnly
          ? 'Cycle is read-only'
          : `${dm.date} — click to edit`
      }
      arrow
      placement="top"
    >
      <Box
        onClick={() => {
          if (locked || cycleReadOnly) return;
          onClick(dm);
        }}
        sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          py: 0.75, px: 0.25, borderRadius: '8px', gap: 0.25,
          cursor: locked || cycleReadOnly ? 'default' : 'pointer',
          border: '2px solid',
          borderColor: isSelected
            ? T.accent
            : isPendingChange
            ? T.amber
            : locked
            ? T.border
            : T.border,
          bgcolor: isSelected
            ? T.accentLight
            : isPendingChange
            ? '#fffbeb'
            : locked
            ? (currentStatus === 'PH' ? T.amberLight : '#f4f4f5')
            : T.surface,
          boxShadow: isSelected ? `0 0 0 3px ${T.accentLight}` : 'none',
          transition: 'all 0.12s',
          '&:hover': locked || cycleReadOnly ? {} : {
            borderColor: isSelected ? T.accentHover : T.accent,
            bgcolor: isSelected ? T.accentLight : '#f0f2ff',
            transform: 'scale(1.05)',
          },
          position: 'relative',
          minWidth: 46,
        }}
      >
        {/* Pending-change dot */}
        {isPendingChange && (
          <Box sx={{
            position: 'absolute', top: 3, right: 3,
            width: 6, height: 6, borderRadius: '50%',
            bgcolor: T.amber,
          }} />
        )}

        {locked && (
          <LockOutlinedIcon sx={{ position: 'absolute', top: 3, left: 3, fontSize: 9, color: T.textDisabled }} />
        )}

        <Typography sx={{ fontSize: '10px', fontWeight: 700, color: locked ? T.textDisabled : T.textSecondary, lineHeight: 1 }}>
          {dm.shortDay}
        </Typography>
        <Typography sx={{ fontSize: '15px', fontWeight: 800, color: locked ? T.textDisabled : T.textPrimary, lineHeight: 1.1 }}>
          {dm.dayNumber}
        </Typography>
        <StatusChip code={currentStatus} />
      </Box>
    </Tooltip>
  );
}

// ─── StatusOption — one button in the status picker ──────────────────────────
function StatusOption({ code, isActive, onClick }) {
  const s = STATUS[code] ?? STATUS[''];
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        px: 1.5, py: 0.85, borderRadius: '8px', cursor: 'pointer',
        border: `1.5px solid ${isActive ? s.color : T.border}`,
        bgcolor: isActive ? s.bg : T.surface,
        color: isActive ? s.color : T.textSecondary,
        fontWeight: isActive ? 700 : 500,
        fontSize: '12px', fontFamily: 'system-ui',
        transition: 'all 0.13s',
        '&:hover': { borderColor: s.color, bgcolor: s.bg, color: s.color },
        boxShadow: isActive ? `0 0 0 2px ${s.border}` : 'none',
        userSelect: 'none',
      }}
    >
      <StatusChip code={code} size="lg" />
      <Box>
        <Typography sx={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, lineHeight: 1.2, color: 'inherit' }}>
          {code === '' ? 'Unmarked' : s.label}
        </Typography>
        {code !== '' && (
          <Typography sx={{ fontSize: '10px', fontFamily: 'monospace', color: isActive ? s.color : T.textDisabled, lineHeight: 1 }}>
            {code}
          </Typography>
        )}
      </Box>
      {isActive && (
        <Box sx={{ ml: 'auto', width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
      )}
    </Box>
  );
}

// ─── DayStatusEditor (exported) ───────────────────────────────────────────────
/**
 * Props
 * ─────
 * dayMetas        DayMeta[]           all days in the cycle
 * emp             Employee object     for resolving current status
 * drawerEdit      { date, status } | null   the single pending edit
 * selectedDate    string | null       currently selected day (ISO date)
 * cycleReadOnly   boolean
 * onSelectDay     (dm) => void        parent sets selectedDate
 * onStatusPick    (date, status) => void   parent records the edit
 */
const DayStatusEditor = ({
  dayMetas,
  emp,
  drawerEdit,
  selectedDate,
  cycleReadOnly,
  onSelectDay,
  onStatusPick,
}) => {
  // ── Build week rows for the calendar strip ────────────────────────────────
  const weeks = React.useMemo(() => {
    if (!dayMetas.length) return [];
    const result = [];
    let week = [];
    dayMetas.forEach((dm, i) => {
      week.push(dm);
      const isLast = i === dayMetas.length - 1;
      const d      = new Date(dm.date + 'T00:00:00Z');
      const iso    = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
      if (iso === 7 || isLast) { result.push(week); week = []; }
    });
    return result;
  }, [dayMetas]);

  // ── Resolve a day's current displayed status ──────────────────────────────
  const getStatus = (dm) => {
    if (!emp) return '';
    // Pending edit for this day (single-day only)
    if (drawerEdit && drawerEdit.date === dm.date) return drawerEdit.status;
    const db = emp.attendance?.[dm.date];
    if (db !== undefined && db !== null && db !== '') return db;
    return dm.defaultStatus ?? '';
  };

  const selectedDm   = selectedDate ? dayMetas.find(dm => dm.date === selectedDate) : null;
  const selectedStatus = selectedDm ? getStatus(selectedDm) : null;
  const isLocked     = (dm) => { const st = getStatus(dm); return st === 'WO' || st === 'PH'; };

  return (
    <Box>
      {/* ── Calendar strip ─────────────────────────────────────────────── */}
      <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
        <Typography sx={{
          fontSize: '10px', fontWeight: 700, color: T.textSecondary,
          textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1,
        }}>
          {cycleReadOnly ? 'Attendance days (read-only)' : 'Select a day to edit its status'}
        </Typography>

        <Stack spacing={0.5}>
          {weeks.map((week, wi) => (
            <Box
              key={wi}
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${week.length}, 1fr)`,
                gap: 0.5,
              }}
            >
              {week.map(dm => (
                <DayCard
                  key={dm.date}
                  dm={dm}
                  currentStatus={getStatus(dm)}
                  isSelected={selectedDate === dm.date}
                  isPendingChange={drawerEdit?.date === dm.date}
                  cycleReadOnly={cycleReadOnly}
                  onClick={onSelectDay}
                />
              ))}
            </Box>
          ))}
        </Stack>
      </Box>

      {/* ── Status picker — shown only when a day is selected ────────────── */}
      {selectedDm && !cycleReadOnly && (
        <>
          <Divider sx={{ mx: 2, mt: 1.5, mb: 0 }} />
          <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
            {/* Selected day header */}
            <Stack direction="row" alignItems="center" spacing={1} mb={1.25}>
              <Box sx={{
                px: 1.25, py: 0.4, borderRadius: '6px',
                bgcolor: T.accentLight, color: T.accent,
                fontSize: '12px', fontWeight: 700, fontFamily: 'monospace',
              }}>
                {selectedDm.dayNumber} {selectedDm.shortDay}
              </Box>
              <Typography sx={{ fontSize: '11px', color: T.textDisabled }}>
                {selectedDm.date}
              </Typography>
              {drawerEdit?.date === selectedDate && (
                <Chip
                  label="unsaved"
                  size="small"
                  sx={{ height: 18, fontSize: '9px', bgcolor: T.amberLight, color: T.amber, fontWeight: 700 }}
                />
              )}
            </Stack>

            <Typography sx={{
              fontSize: '10px', fontWeight: 700, color: T.textSecondary,
              textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75,
            }}>
              Set status
            </Typography>

            <Stack spacing={0.5}>
              {EDITABLE_STATUSES.map(code => (
                <StatusOption
                  key={code}
                  code={code}
                  isActive={selectedStatus === code}
                  onClick={() => onStatusPick(selectedDm.date, code)}
                />
              ))}
            </Stack>
          </Box>
        </>
      )}

      {/* ── Prompt when nothing is selected ─────────────────────────────── */}
      {!selectedDm && !cycleReadOnly && (
        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Typography sx={{ fontSize: '11px', color: T.textDisabled, fontStyle: 'italic' }}>
            Tap any unlocked day above to change its status.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DayStatusEditor;