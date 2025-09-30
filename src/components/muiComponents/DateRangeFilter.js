import React, { useEffect, useState } from "react";
import { Stack, IconButton, Tooltip, MenuItem, TextField } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import ToastService from "../../Services/toastService";
import {
  filterBenchListByDateRange,
  setFilteredDataRequested,
} from "../../redux/benchSlice";
import {
  filterRequirementsByDateRange,
  filterRequirementsByRecruiter,
} from "../../redux/requirementSlice";
import {
  filterInterviewsByDateRange,
  filterInterviewsByRecruiter,
  filterInterviewsByTeamLead,
  clearRecruiterFilter,
} from "../../redux/interviewSlice";
import { filterUsersByDateRange } from "../../redux/employeesSlice";
import {
  filterSubmissionsByDateRange,
  filterSubmissionssByRecruiter,
  filterSubmissionsByTeamlead,
} from "../../redux/submissionSlice";
import { filterClientsByDateRange } from "../../redux/clientsSlice";
import { filterPlacementByDateRange } from "../../redux/placementSlice";
import { filterDashBoardCountByDateRange } from "../../redux/dashboardSlice";
import {
  filterTeamMetricsByDateRange,
  clearFilters,
} from "../../redux/teamMetricsSlice";
import {
  filterInProgressDataByDateRange,
  clearFilterData,
} from "../../redux/inProgressSlice";

const componentToActionMap = {
  BenchList: filterBenchListByDateRange,
  Requirement: filterRequirementsByDateRange,
  Interviews: filterInterviewsByDateRange,
  Users: filterUsersByDateRange,
  Submissions: filterSubmissionsByDateRange,
  SubmissionsForTeamLead: filterSubmissionsByTeamlead,
  AssignedList: filterRequirementsByRecruiter,
  RecruiterSubmission: filterSubmissionssByRecruiter,
  InterviewsForRecruiter: filterInterviewsByRecruiter,
  dashboard: filterDashBoardCountByDateRange,
  InterviewsForTeamLead: filterInterviewsByTeamLead,
  Clients: filterClientsByDateRange,
  placements: filterPlacementByDateRange,
  allSubmissions: filterSubmissionsByDateRange,
  allInterviews: filterInterviewsByDateRange,
  TeamMetrics: filterTeamMetricsByDateRange,
  InProgress: filterInProgressDataByDateRange,
};

const componentToClearActionsMap = {
  TeamMetrics: clearFilters,
  InProgress: clearFilterData,
};

const DateRangeFilter = ({
  component,
  labelPrefix = "",
  onDateChange,
  onClearFilter,
}) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentYear = dayjs().year();
  const currentMonth = dayjs().month() + 1;
  const currentDay = dayjs().date();

  // Generate years from 1900 to current year + 2 (like date of birth selector)
  const startYear = 2020;
  const endYear = currentYear + 0;
  const yearOptions = [
    "All",
    ...Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i),
  ];

  // Initialize from URL or leave empty (no default selection)
  const [selectedYear, setSelectedYear] = useState(() => {
    const urlYear = searchParams.get("year");
    return urlYear ? (urlYear === "All" ? "All" : parseInt(urlYear)) : null;
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const urlMonth = searchParams.get("month");
    return urlMonth ? parseInt(urlMonth) : null;
  });

  const [selectedDay, setSelectedDay] = useState(() => {
    const urlDay = searchParams.get("day");
    return urlDay ? parseInt(urlDay) : null;
  });

  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Generate day options based on selected year and month
  const getDayOptions = () => {
    if (selectedYear === "All" || !selectedYear || !selectedMonth) {
      return [];
    }

    const daysInMonth = dayjs(`${selectedYear}-${selectedMonth}`).daysInMonth();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const dayOptions = getDayOptions();

  // Calculate start and end dates - handles full year when only year is selected
  let startDate = null;
  let endDate = null;

  if (selectedYear) {
    if (selectedYear === "All") {
      startDate = dayjs(`${currentYear}-01-01`);
      endDate = dayjs();
    } else if (selectedMonth && selectedDay) {
      // Specific day selected
      const dateStr = `${selectedYear}-${selectedMonth
        .toString()
        .padStart(2, "0")}-${selectedDay.toString().padStart(2, "0")}`;
      startDate = dayjs(dateStr).startOf("day");
      endDate = dayjs(dateStr).endOf("day");
    } else if (selectedMonth) {
      // Only month selected, filter entire month
      startDate = dayjs(
        `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-01`
      );
      endDate = startDate.endOf("month");
    } else {
      // Only year selected - fetch entire year
      startDate = dayjs(`${selectedYear}-01-01`).startOf("year");
      endDate = dayjs(`${selectedYear}-12-31`).endOf("year");
    }
  }

  const updateUrlParams = (year, month, day) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (year === "All") {
      newSearchParams.set("year", "All");
      newSearchParams.delete("month");
      newSearchParams.delete("day");

      const start = dayjs(`${currentYear}-01-01`);
      const end = dayjs();
      newSearchParams.set("startDate", start.format("YYYY-MM-DD"));
      newSearchParams.set("endDate", end.format("YYYY-MM-DD"));
    } else if (year && month && day) {
      // Specific day selected
      newSearchParams.set("year", year);
      newSearchParams.set("month", month);
      newSearchParams.set("day", day);
      const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      const start = dayjs(dateStr).startOf("day");
      const end = dayjs(dateStr).endOf("day");
      newSearchParams.set("startDate", start.format("YYYY-MM-DD"));
      newSearchParams.set("endDate", end.format("YYYY-MM-DD"));
    } else if (year && month) {
      // Only month selected
      newSearchParams.set("year", year);
      newSearchParams.set("month", month);
      newSearchParams.delete("day");
      const start = dayjs(`${year}-${month.toString().padStart(2, "0")}-01`);
      newSearchParams.set("startDate", start.format("YYYY-MM-DD"));
      newSearchParams.set("endDate", start.endOf("month").format("YYYY-MM-DD"));
    } else if (year) {
      // Only year selected - set full year range
      newSearchParams.set("year", year);
      newSearchParams.delete("month");
      newSearchParams.delete("day");
      const start = dayjs(`${year}-01-01`).startOf("year");
      const end = dayjs(`${year}-12-31`).endOf("year");
      newSearchParams.set("startDate", start.format("YYYY-MM-DD"));
      newSearchParams.set("endDate", end.format("YYYY-MM-DD"));
    } else {
      newSearchParams.delete("year");
      newSearchParams.delete("month");
      newSearchParams.delete("day");
      newSearchParams.delete("startDate");
      newSearchParams.delete("endDate");
    }

    setSearchParams(newSearchParams, { replace: true });
  };

  const handleYearChange = (event) => {
    const year = event.target.value;

    // Reset state before changing year
    setSelectedMonth(null);
    setSelectedDay(null);
    setSelectedYear(year);

    if (year === "All") {
      updateUrlParams("All", null, null);
    } else {
      // When year changes, update URL with just the year (will fetch full year)
      updateUrlParams(year, null, null);
    }
  };

  const handleMonthChange = (event) => {
    const month = event.target.value;

    // Reset day when month changes
    setSelectedDay(null);
    setSelectedMonth(month);
    updateUrlParams(selectedYear, month, null);
  };

  const handleDayChange = (event) => {
    const day = event.target.value;
    setSelectedDay(day);
    updateUrlParams(selectedYear, selectedMonth, day);
  };

  const handleClearFilter = () => {
    // Reset all selections
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);

    // Clear URL params
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("year");
    newSearchParams.delete("month");
    newSearchParams.delete("day");
    newSearchParams.delete("startDate");
    newSearchParams.delete("endDate");
    setSearchParams(newSearchParams, { replace: true });

    dispatch(setFilteredDataRequested(false));

    const clearAction = componentToClearActionsMap[component];
    if (clearAction) dispatch(clearAction());

    if (onClearFilter) onClearFilter();
    if (component === "InterviewsForRecruiter")
      dispatch(clearRecruiterFilter());

    // Pass null to indicate no filter
    if (onDateChange) {
      onDateChange(null, null);
    }
  };

  useEffect(() => {
    // Apply filters when dates are selected
    if (startDate && endDate) {
      const formattedStart = startDate.format("YYYY-MM-DD");
      const formattedEnd = endDate.format("YYYY-MM-DD");

      dispatch(setFilteredDataRequested(true));

      const actionCreator = componentToActionMap[component];
      if (actionCreator) {
        dispatch(
          actionCreator({ startDate: formattedStart, endDate: formattedEnd })
        )
          .then(() => {
            if (onDateChange) {
              onDateChange(formattedStart, formattedEnd);
            }
          })
          .catch((error) => {
            ToastService.error(`Error applying date filter: ${error.message}`);
          });
      } else {
        console.warn(`No action mapped for component: ${component}`);
      }
    }
    // When no dates selected, don't apply any filter
    else if (!selectedYear && !selectedMonth && !selectedDay) {
      dispatch(setFilteredDataRequested(false));
      if (onDateChange) {
        onDateChange(null, null);
      }
    }
  }, [
    selectedYear,
    selectedMonth,
    selectedDay,
    component,
    dispatch,
    onDateChange,
  ]);

  // Sync with URL
  useEffect(() => {
    const urlYear = searchParams.get("year");
    const urlMonth = searchParams.get("month");
    const urlDay = searchParams.get("day");

    if (urlYear) {
      setSelectedYear(urlYear === "All" ? "All" : parseInt(urlYear));
      setSelectedMonth(urlMonth ? parseInt(urlMonth) : null);
      setSelectedDay(urlDay ? parseInt(urlDay) : null);
    }
  }, [searchParams]);

  // Validate and reset day if it's invalid for the current month/year
  useEffect(() => {
    if (
      selectedYear !== "All" &&
      selectedYear &&
      selectedMonth &&
      selectedDay
    ) {
      const maxDays = dayjs(`${selectedYear}-${selectedMonth}`).daysInMonth();
      if (selectedDay > maxDays) {
        setSelectedDay(null);
        updateUrlParams(selectedYear, selectedMonth, null);
      }
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      sx={{ flexWrap: "wrap" }}
    >
      <TextField
        select
        label="Year"
        value={selectedYear || ""}
        onChange={handleYearChange}
        size="small"
        sx={{ minWidth: 140 }}
        SelectProps={{
          MenuProps: {
            PaperProps: {
              sx: {
                maxHeight: 300, // Increased height to accommodate more years
              },
            },
          },
        }}
      >
        {yearOptions.map((year) => (
          <MenuItem key={year} value={year}>
            {year === "All" ? "All (Current Year)" : year}
          </MenuItem>
        ))}
      </TextField>

      {selectedYear !== "All" && selectedYear && (
        <TextField
          select
          label="Month"
          value={selectedMonth || ""}
          onChange={handleMonthChange}
          size="small"
          sx={{ minWidth: 140 }}
          disabled={!selectedYear || selectedYear === "All"}
        >
          {monthOptions.map((month) => (
            <MenuItem key={month.value} value={month.value}>
              {month.label}
            </MenuItem>
          ))}
        </TextField>
      )}

      {selectedYear !== "All" && selectedYear && selectedMonth && (
        <TextField
          select
          label="Day"
          value={selectedDay || ""}
          onChange={handleDayChange}
          size="small"
          sx={{ minWidth: 100 }}
          disabled={!selectedYear || selectedYear === "All" || !selectedMonth}
          SelectProps={{
            MenuProps: {
              PaperProps: {
                sx: {
                  maxHeight: 200,
                },
              },
            },
          }}
        >
          {dayOptions.map((day) => (
            <MenuItem key={day} value={day}>
              {day}
            </MenuItem>
          ))}
        </TextField>
      )}

      {(selectedYear || selectedMonth || selectedDay) && (
        <Tooltip title="Clear Filter">
          <IconButton onClick={handleClearFilter} size="small" sx={{ mt: 3 }}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

export default DateRangeFilter;