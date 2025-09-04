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

  // Add "All" option + 10 year range
  const yearOptions = [
    "All",
    ...Array.from({ length: 10 }, (_, i) => currentYear - 5 + i),
  ];

  // Initialize from URL or fallback to current year/month
  const [selectedYear, setSelectedYear] = useState(() => {
    const urlYear = searchParams.get("year");
    return urlYear
      ? urlYear === "All"
        ? "All"
        : parseInt(urlYear)
      : currentYear;
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const urlMonth = searchParams.get("month");
    return urlMonth ? parseInt(urlMonth) : currentMonth;
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

  // Calculate start and end dates
  let startDate = null;
  let endDate = null;

  if (selectedYear) {
    if (selectedYear === "All") {
      startDate = dayjs(`${currentYear}-01-01`);
      endDate = dayjs();
    } else if (selectedMonth) {
      startDate = dayjs(
        `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-01`
      );
      endDate = startDate.endOf("month");
    }
  }

  const updateUrlParams = (year, month) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (year === "All") {
      newSearchParams.set("year", "All");
      newSearchParams.delete("month");

      const start = dayjs(`${currentYear}-01-01`);
      const end = dayjs();
      newSearchParams.set("startDate", start.format("YYYY-MM-DD"));
      newSearchParams.set("endDate", end.format("YYYY-MM-DD"));
    } else if (year && month) {
      newSearchParams.set("year", year);
      newSearchParams.set("month", month);
      const start = dayjs(`${year}-${month.toString().padStart(2, "0")}-01`);
      newSearchParams.set("startDate", start.format("YYYY-MM-DD"));
      newSearchParams.set("endDate", start.endOf("month").format("YYYY-MM-DD"));
    } else {
      newSearchParams.delete("year");
      newSearchParams.delete("month");
      newSearchParams.delete("startDate");
      newSearchParams.delete("endDate");
    }

    setSearchParams(newSearchParams, { replace: true });
  };

  const handleYearChange = (event) => {
    const year = event.target.value;
    setSelectedYear(year);

    if (year === "All") {
      setSelectedMonth(null);
      updateUrlParams("All", null);
    } else {
      updateUrlParams(year, selectedMonth);
    }
  };

  const handleMonthChange = (event) => {
    const month = event.target.value;
    setSelectedMonth(month);
    updateUrlParams(selectedYear, month);
  };

  const handleClearFilter = () => {
    const now = dayjs();
    const resetYear = currentYear;
    const resetMonth = currentMonth;

    setSelectedYear(resetYear);
    setSelectedMonth(resetMonth);

    updateUrlParams(resetYear, resetMonth);

    dispatch(setFilteredDataRequested(false));

    const clearAction = componentToClearActionsMap[component];
    if (clearAction) dispatch(clearAction());

    if (onClearFilter) onClearFilter();
    if (component === "InterviewsForRecruiter")
      dispatch(clearRecruiterFilter());

    if (onDateChange) {
      const start = now.startOf("month").format("YYYY-MM-DD");
      const end = now.endOf("month").format("YYYY-MM-DD");
      onDateChange(start, end);
    }
  };

  useEffect(() => {
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
  }, [selectedYear, selectedMonth, component, dispatch, onDateChange]);

  // Sync with URL
  useEffect(() => {
    const urlYear = searchParams.get("year");
    const urlMonth = searchParams.get("month");

    if (urlYear) {
      setSelectedYear(urlYear === "All" ? "All" : parseInt(urlYear));
      setSelectedMonth(urlMonth ? parseInt(urlMonth) : null);
    }
  }, [searchParams]);

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
      >
        {yearOptions.map((year) => (
          <MenuItem key={year} value={year}>
            {year === "All" ? "All (Current Year)" : year}
          </MenuItem>
        ))}
      </TextField>

      {selectedYear !== "All" && (
        <TextField
          select
          label="Month"
          value={selectedMonth || ""}
          onChange={handleMonthChange}
          size="small"
          sx={{ minWidth: 140 }}
        >
          {monthOptions.map((month) => (
            <MenuItem key={month.value} value={month.value}>
              {month.label}
            </MenuItem>
          ))}
        </TextField>
      )}

      {(selectedYear || selectedMonth) && (
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
