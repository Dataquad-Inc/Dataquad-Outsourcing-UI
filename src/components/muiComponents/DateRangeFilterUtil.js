import React, { useState, useEffect, useCallback } from "react";
import { Stack, IconButton, Tooltip, TextField } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import dayjs from "dayjs";

const DateRangeFilterUtil = ({ onDateChange, onClearFilter }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Trigger API when both dates are selected
  useEffect(() => {
    if (startDate && endDate && onDateChange) {
      onDateChange(
        dayjs(startDate).format("YYYY-MM-DD"),
        dayjs(endDate).format("YYYY-MM-DD"),
      );
    }
  }, [startDate, endDate]);

  const handleStartDateChange = useCallback((e) => {
    setStartDate(e.target.value);
  }, []);

  const handleEndDateChange = useCallback((e) => {
    setEndDate(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setStartDate("");
    setEndDate("");
    if (onClearFilter) onClearFilter();
  }, [onClearFilter]);

  const hasSelection = Boolean(startDate || endDate);

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {/* Start Date */}
      <TextField
        type="date"
        label="From Date"
        value={startDate}
        onChange={handleStartDateChange}
        size="small"
        InputLabelProps={{ shrink: true }}
      />

      {/* End Date */}
      <TextField
        type="date"
        label="To Date"
        value={endDate}
        onChange={handleEndDateChange}
        size="small"
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: startDate }} // prevent selecting before start date
      />

      {hasSelection && (
        <Tooltip title="Clear Filter">
          <IconButton onClick={handleClear} size="small">
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

export default DateRangeFilterUtil;
