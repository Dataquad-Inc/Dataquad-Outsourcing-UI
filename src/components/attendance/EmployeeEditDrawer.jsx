// src/components/attendance/EmployeeEditDrawer.jsx
// Drawer shell that wraps DayStatusEditor.
// Enforces single-day editing: only one day is selected + one pending edit at a time.

import React from 'react';
import {
  Box, Typography, Stack, Chip, Alert, Divider,
  IconButton, Button, Drawer, CircularProgress,
} from '@mui/material';
import SaveIcon   from '@mui/icons-material/Save';
import CloseIcon  from '@mui/icons-material/Close';
import UndoIcon   from '@mui/icons-material/Undo';
import PersonIcon from '@mui/icons-material/Person';

import DayStatusEditor from './DayStatusEditor';

const DRAWER_WIDTH = 440;

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:           '#f8f9fc',
  surface:      '#ffffff',
  surfaceAlt:   '#f4f5f9',
  border:       '#e6e8f0',
  borderStrong: '#cdd0de',
  textPrimary:  '#1a1d2e',
  textSecondary:'#6b7080',
  textDisabled: '#a8adb8',
  accent:       '#5b6af0',
  accentLight:  '#eef0ff',
  accentHover:  '#4452e0',
  green:        '#0d9f6e',
  greenLight:   '#e8faf3',
  red:          '#e53e3e',
  amber:        '#d97706',
  amberLight:   '#fffbeb',
  purple:       '#7c3aed',
  purpleLight:  '#f5f3ff',
};

/**
 * Props
 * ─────
 * open          boolean
 * emp           Employee | null
 * dayMetas      DayMeta[]
 * drawerEdit    { date: string, status: string } | null   single pending edit
 * selectedDate  string | null                             the active day in the picker
 * cycleStatus   string | undefined
 * isSaving      boolean
 * onClose       () => void
 * onSelectDay   (dm: DayMeta) => void
 * onStatusPick  (date: string, status: string) => void
 * onSave        () => void
 * onReset       () => void
 */
const EmployeeEditDrawer = ({
  open,
  emp,
  dayMetas,
  drawerEdit,
  selectedDate,
  cycleStatus,
  isSaving,
  onClose,
  onSelectDay,
  onStatusPick,
  onSave,
  onReset,
}) => {
  const cycleReadOnly = cycleStatus && cycleStatus !== 'OPEN';
  const hasPendingEdit = drawerEdit !== null;

  if (!emp) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: DRAWER_WIDTH,
          bgcolor: T.bg,
          borderLeft: `1px solid ${T.border}`,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(26,29,46,0.22)' } } }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box sx={{
        px: 2.5, py: 2,
        bgcolor: T.surface,
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'flex-start', gap: 1.5,
        flexShrink: 0,
      }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '10px',
          bgcolor: T.accentLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <PersonIcon sx={{ color: T.accent, fontSize: 22 }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={700} noWrap sx={{ fontSize: '14px', color: T.textPrimary }}>
            {emp.employeeName}
          </Typography>
          <Typography fontFamily="monospace" sx={{ fontSize: '11px', color: T.textDisabled }}>
            {emp.employeeId}
          </Typography>
          <Stack direction="row" spacing={0.5} mt={0.4} flexWrap="wrap">
            {emp.designation && (
              <Chip label={emp.designation} size="small"
                sx={{ height: 16, fontSize: '9px', bgcolor: T.accentLight, color: T.accent }} />
            )}
            {emp.department && (
              <Chip label={emp.department} size="small"
                sx={{ height: 16, fontSize: '9px', bgcolor: T.surfaceAlt, color: T.textSecondary }} />
            )}
            {cycleReadOnly && (
              <Chip label={`Cycle ${cycleStatus}`} size="small"
                sx={{ height: 16, fontSize: '9px', bgcolor: '#fef2f2', color: T.red }} />
            )}
          </Stack>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: T.textSecondary, mt: -0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Read-only warning ─────────────────────────────────────────── */}
      {cycleReadOnly && (
        <Alert severity="warning" sx={{ mx: 2, mt: 1.5, py: 0.5, fontSize: '12px', flexShrink: 0 }}>
          This cycle is <strong>{cycleStatus}</strong> — statuses are read-only.
        </Alert>
      )}

      {/* ── Instruction banner ────────────────────────────────────────── */}
      {!cycleReadOnly && (
        <Box sx={{
          mx: 2, mt: 1.5, px: 1.5, py: 1,
          bgcolor: T.accentLight, borderRadius: '8px', border: `1px solid #c7d2fe`,
          flexShrink: 0,
        }}>
          <Typography sx={{ fontSize: '11px', color: T.accent, fontWeight: 600 }}>
            Select a day → choose a status → Save.
          </Typography>
          <Typography sx={{ fontSize: '10px', color: T.textDisabled, mt: 0.25 }}>
            Only one day can be edited at a time. Selecting a new day discards the previous unsaved pick.
          </Typography>
        </Box>
      )}

      <Divider sx={{ mx: 2, mt: 1.5 }} />

      {/* ── Day status editor (scrollable area) ───────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <DayStatusEditor
          dayMetas={dayMetas}
          emp={emp}
          drawerEdit={drawerEdit}
          selectedDate={selectedDate}
          cycleReadOnly={cycleReadOnly}
          onSelectDay={onSelectDay}
          onStatusPick={onStatusPick}
        />
      </Box>

      <Divider />

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <Box sx={{
        px: 2.5, py: 1.75,
        bgcolor: T.surface,
        borderTop: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 1,
        flexShrink: 0,
      }}>
        {/* Pending edit badge */}
        {hasPendingEdit && (
          <Chip
            label={`1 unsaved change`}
            size="small"
            sx={{
              height: 24, fontSize: '11px',
              bgcolor: T.amberLight, color: T.amber, fontWeight: 700,
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 }, '50%': { opacity: 0.5 }, '100%': { opacity: 1 },
              },
            }}
          />
        )}

        <Box sx={{ flex: 1 }} />

        {/* Reset — only shown when there's something to reset */}
        {hasPendingEdit && (
          <Button
            variant="outlined" size="small"
            startIcon={<UndoIcon fontSize="small" />}
            onClick={onReset}
            disabled={isSaving}
            sx={{
              textTransform: 'none', fontSize: '12px', height: 36,
              borderColor: T.border, color: T.textSecondary,
              '&:hover': { borderColor: T.borderStrong, bgcolor: T.surfaceAlt },
            }}
          >
            Reset
          </Button>
        )}

        <Button
          variant="outlined" size="small"
          onClick={onClose}
          disabled={isSaving}
          sx={{
            textTransform: 'none', fontSize: '12px', height: 36,
            borderColor: T.border, color: T.textSecondary,
            '&:hover': { borderColor: T.borderStrong, bgcolor: T.surfaceAlt },
          }}
        >
          Close
        </Button>

        {!cycleReadOnly && (
          <Button
            variant="contained" size="small"
            startIcon={isSaving
              ? <CircularProgress size={14} color="inherit" />
              : <SaveIcon />
            }
            onClick={onSave}
            disabled={isSaving || !hasPendingEdit}
            sx={{
              textTransform: 'none', fontSize: '12px', height: 36, minWidth: 90,
              bgcolor: T.accent,
              '&:hover': { bgcolor: T.accentHover },
              '&.Mui-disabled': { bgcolor: T.accent, opacity: 0.45 },
            }}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        )}
      </Box>
    </Drawer>
  );
};

export default EmployeeEditDrawer;