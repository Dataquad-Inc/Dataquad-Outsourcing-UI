import React, { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  Popover,
  Button,
  Typography,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import { Clear, CalendarToday } from "@mui/icons-material";
import { getDateRange } from "../../utils/dateUtils";

/**
 * Enhanced Date Range Filter Component with Quick Presets
 * @param {Object} props
 * @param {Object} props.value - { from: Date|string, to: Date|string }
 * @param {Function} props.onChange - Callback with { from, to }
 * @param {string} props.label - Label for the filter
 * @param {boolean} props.disabled - Disable the component
 * @param {string} props.size - Size of the component ("small" | "medium")
 * @param {boolean} props.showPresets - Show quick preset buttons
 */
const DateRangeFilter = ({
  value = { from: null, to: null },
  onChange,
  label = "Date Range",
  disabled = false,
  size = "small",
  showPresets = true,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [tempFrom, setTempFrom] = useState(value?.from || "");
  const [tempTo, setTempTo] = useState(value?.to || "");

  const open = Boolean(anchorEl);

  // Quick preset options
  const presets = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last7days" },
    { label: "Last 30 Days", value: "last30days" },
    { label: "This Month", value: "month" },
    { label: "Last 90 Days", value: "last90days" },
  ];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setTempFrom(value?.from || "");
    setTempTo(value?.to || "");
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleApply = () => {
    if (tempFrom || tempTo) {
      onChange({
        from: tempFrom || null,
        to: tempTo || null,
      });
    }
    handleClose();
  };

  const handleClear = () => {
    setTempFrom("");
    setTempTo("");
    onChange({ from: null, to: null });
    handleClose();
  };

  const handleClearDirect = (e) => {
    e.stopPropagation();
    setTempFrom("");
    setTempTo("");
    onChange({ from: null, to: null });
  };

  const handlePresetClick = (presetValue) => {
    const range = getDateRange(presetValue);
    setTempFrom(range.from);
    setTempTo(range.to);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const hasValue = value?.from || value?.to;
  const displayText = hasValue
    ? `${formatDisplayDate(value.from)} - ${formatDisplayDate(value.to)}`
    : "";

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          border: "1px solid",
          borderColor: hasValue ? "primary.main" : "divider",
          borderRadius: 1,
          padding: size === "small" ? "4px 8px" : "8px 12px",
          cursor: disabled ? "not-allowed" : "pointer",
          backgroundColor: disabled ? "action.disabledBackground" : "background.paper",
          "&:hover": {
            borderColor: disabled ? "divider" : "primary.main",
            backgroundColor: disabled ? "action.disabledBackground" : "action.hover",
          },
          minWidth: "220px",
          position: "relative",
        }}
        onClick={disabled ? undefined : handleClick}
      >
        <CalendarToday
          sx={{
            fontSize: size === "small" ? 16 : 20,
            color: hasValue ? "primary.main" : "action.active",
          }}
        />
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            color: hasValue ? "text.primary" : "text.secondary",
            fontSize: size === "small" ? "0.875rem" : "1rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {displayText || label}
        </Typography>
        {hasValue && !disabled && (
          <IconButton
            size="small"
            onClick={handleClearDirect}
            sx={{ padding: 0.5 }}
          >
            <Clear sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: 2,
              minWidth: 360,
            },
          },
        }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle2" fontWeight={600}>
            Select Date Range
          </Typography>

          {/* Quick Presets */}
          {showPresets && (
            <>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: "block" }}
                >
                  Quick Select
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {presets.map((preset) => (
                    <Chip
                      key={preset.value}
                      label={preset.label}
                      size="small"
                      onClick={() => handlePresetClick(preset.value)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "primary.light",
                          color: "primary.contrastText",
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
              <Divider />
            </>
          )}

          {/* Custom Date Selection */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              Custom Range
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="From Date"
                type="date"
                value={tempFrom}
                onChange={(e) => setTempFrom(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  max: tempTo || undefined,
                }}
              />

              <TextField
                label="To Date"
                type="date"
                value={tempTo}
                onChange={(e) => setTempTo(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: tempFrom || undefined,
                }}
              />
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button size="small" onClick={handleClear} color="inherit">
              Clear
            </Button>
            <Button
              size="small"
              onClick={handleClose}
              variant="outlined"
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              size="small"
              onClick={handleApply}
              variant="contained"
              disabled={!tempFrom && !tempTo}
            >
              Apply
            </Button>
          </Box>
        </Stack>
      </Popover>
    </>
  );
};

export default DateRangeFilter;