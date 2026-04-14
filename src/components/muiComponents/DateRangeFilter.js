import React, { useEffect, useState, useRef } from "react";
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
  filterInterviewsByCoordinator,
  filterInterviewsByTeamLead,
  clearRecruiterFilter,
} from "../../redux/interviewSlice";
import { filterUsersByDateRange } from "../../redux/employeesSlice";
import {
  filterSubmissionsByDateRange,
  filterSubmissionsByRecruiter,
  filterSubmissionsByTeamLead,
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
  AdminSubmissions: filterSubmissionsByDateRange,
  SubmissionsForTeamLead: filterSubmissionsByTeamLead,
  AssignedList: filterRequirementsByRecruiter,
  RecruiterSubmission: filterSubmissionsByRecruiter,
  InterviewsForRecruiter: filterInterviewsByRecruiter,
  InterviewsForCoordinator: filterInterviewsByCoordinator,
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
  teamLeadId = null,
}) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentYear = dayjs().year();
  const currentMonth = dayjs().month() + 1;
  const currentDay = dayjs().date();

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

  // Calculate start and end dates
  let startDate = null;
  let endDate = null;

  if (selectedYear) {
    if (selectedYear === "All") {
      startDate = dayjs(`${currentYear}-01-01`);
      endDate = dayjs();
    } else if (selectedMonth && selectedDay) {
      const dateStr = `${selectedYear}-${selectedMonth
        .toString()
        .padStart(2, "0")}-${selectedDay.toString().padStart(2, "0")}`;
      startDate = dayjs(dateStr).startOf("day");
      endDate = dayjs(dateStr).endOf("day");
    } else if (selectedMonth) {
      startDate = dayjs(
        `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-01`,
      );
      endDate = startDate.endOf("month");
    } else {
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
      newSearchParams.set(
        "startDate",
        dayjs(`${currentYear}-01-01`).format("YYYY-MM-DD"),
      );
      newSearchParams.set("endDate", dayjs().format("YYYY-MM-DD"));
    } else if (year && month && day) {
      newSearchParams.set("year", year);
      newSearchParams.set("month", month);
      newSearchParams.set("day", day);
      const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      newSearchParams.set(
        "startDate",
        dayjs(dateStr).startOf("day").format("YYYY-MM-DD"),
      );
      newSearchParams.set(
        "endDate",
        dayjs(dateStr).endOf("day").format("YYYY-MM-DD"),
      );
    } else if (year && month) {
      newSearchParams.set("year", year);
      newSearchParams.set("month", month);
      newSearchParams.delete("day");
      const start = dayjs(`${year}-${month.toString().padStart(2, "0")}-01`);
      newSearchParams.set("startDate", start.format("YYYY-MM-DD"));
      newSearchParams.set("endDate", start.endOf("month").format("YYYY-MM-DD"));
    } else if (year) {
      newSearchParams.set("year", year);
      newSearchParams.delete("month");
      newSearchParams.delete("day");
      newSearchParams.set(
        "startDate",
        dayjs(`${year}-01-01`).startOf("year").format("YYYY-MM-DD"),
      );
      newSearchParams.set(
        "endDate",
        dayjs(`${year}-12-31`).endOf("year").format("YYYY-MM-DD"),
      );
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
    setSelectedMonth(null);
    setSelectedDay(null);
    setSelectedYear(year);

    if (year === "All") {
      updateUrlParams("All", null, null);
    } else {
      updateUrlParams(year, null, null);
    }
  };

  const handleMonthChange = (event) => {
    const month = event.target.value;
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
    console.log("Clearing filter...");

    // Clear URL params first
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("year");
    newSearchParams.delete("month");
    newSearchParams.delete("day");
    newSearchParams.delete("startDate");
    newSearchParams.delete("endDate");
    setSearchParams(newSearchParams, { replace: true });

    // Call onDateChange FIRST with null values
    if (onDateChange) {
      console.log("Calling onDateChange with null, null");
      onDateChange(null, null);
    }

    // Call onClearFilter if provided
    if (onClearFilter) {
      onClearFilter();
    }

    // Reset local state AFTER calling callbacks
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);

    // Legacy behavior for components without onDateChange
    if (!onDateChange) {
      dispatch(setFilteredDataRequested(false));
      const clearAction = componentToClearActionsMap[component];
      if (clearAction) dispatch(clearAction());

      if (component === "InterviewsForRecruiter") {
        dispatch(clearRecruiterFilter());
      }
    }
  };

  // Effect to handle date changes
  useEffect(() => {
    // Skip if nothing is selected
    if (!selectedYear && !selectedMonth && !selectedDay) {
      console.log("No date selected, skipping effect");
      return;
    }

    if (startDate && endDate) {
      const formattedStart = startDate.format("YYYY-MM-DD");
      const formattedEnd = endDate.format("YYYY-MM-DD");
      console.log("Date selected:", formattedStart, "to", formattedEnd);

      // New pattern with onDateChange callback
      if (onDateChange) {
        console.log("Calling onDateChange with dates");
        onDateChange(formattedStart, formattedEnd);
      }
      // Legacy pattern without onDateChange
      else {
        console.log("Using legacy dispatch");
        dispatch(setFilteredDataRequested(true));
        const actionCreator = componentToActionMap[component];

        if (actionCreator) {
          const payload = {
            startDate: formattedStart,
            endDate: formattedEnd,
          };

          if (component === "InterviewsForTeamLead" && teamLeadId) {
            payload.teamLeadId = teamLeadId;
          }

          dispatch(actionCreator(payload)).catch((error) => {
            ToastService.error(`Error applying date filter: ${error.message}`);
          });
        }
      }
    }
  }, [
    selectedYear,
    selectedMonth,
    selectedDay,
    component,
    dispatch,
    onDateChange,
    teamLeadId,
  ]);

  // Sync with URL on mount
  useEffect(() => {
    const urlYear = searchParams.get("year");
    const urlMonth = searchParams.get("month");
    const urlDay = searchParams.get("day");

    console.log("URL params on mount:", { urlYear, urlMonth, urlDay });

    if (urlYear) {
      setSelectedYear(urlYear === "All" ? "All" : parseInt(urlYear));
      setSelectedMonth(urlMonth ? parseInt(urlMonth) : null);
      setSelectedDay(urlDay ? parseInt(urlDay) : null);
    }
  }, []); // Empty dependency array - only run on mount

  // Validate day selection
  useEffect(() => {
    if (
      selectedYear !== "All" &&
      selectedYear &&
      selectedMonth &&
      selectedDay
    ) {
      const maxDays = dayjs(`${selectedYear}-${selectedMonth}`).daysInMonth();
      if (selectedDay > maxDays) {
        console.log("Invalid day, resetting...");
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
              sx: { maxHeight: 300 },
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
                sx: { maxHeight: 200 },
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
