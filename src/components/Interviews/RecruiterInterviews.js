import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  IconButton,
  Typography,
  Button,
  Link,
  Tooltip,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Skeleton,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../../utils/dateformate";
import { API_BASE_URL } from "../../Services/httpService";
import DataTablePaginated from "../muiComponents/DataTablePaginated";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { getStatusChip, getInterviewLevelChip } from "../../utils/statusUtils";
import ConfirmDialog from "../muiComponents/ConfirmDialog";
import MoveToBench from "./MoveToBench";
import DownloadResume from "../../utils/DownloadResume";
import InternalFeedbackCell from "./FeedBack";
import {
  clearRecruiterFilter,
  filterInterviewsByRecruiter,
} from "../../redux/interviewSlice";
import InterviewFormWrapper from "./InterviewFormWrapper";

const processInterviewData = (interviews) => {
  if (!Array.isArray(interviews)) return [];
  return interviews.map((interview) => ({
    ...interview,
    interviewId:
      interview.interviewId || `${interview.candidateId}_${interview.jobId}`,
    interviewStatus: interview.latestInterviewStatus,
    candidateFullName:
      interview.candidateFullName ||
      interview.candidateEmailId?.split("@")[0] ||
      "Unknown Candidate",
  }));
};

const RecruiterInterviews = () => {
  const dispatch = useDispatch();
  const { userId, role } = useSelector((state) => state.auth);
  const {
    filterInterviewsForRecruiter,
    filterInterviewsForRecruiterTotalCount,
    isRecruiterFilterActive,
  } = useSelector((state) => state.interview);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // Date filter state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Data state
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    interview: null,
  });
  const [editDrawer, setEditDrawer] = useState({
    open: false,
    data: null,
  });
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [moveToBenchLoading, setMoveToBenchLoading] = useState(false);
  
  const navigate = useNavigate();

  // Refs for preventing duplicate requests
  const initialLoadDone = useRef(false);
  const isFetching = useRef(false);
  const currentFetchId = useRef(0);

  // Derived: is date range active?
  const isDateFiltered = !!(startDate && endDate);

  const fetchInterviews = useCallback(async (pageNo, size, search, forceFetch = false) => {
    if (isFetching.current && !forceFetch) return;

    const fetchId = ++currentFetchId.current;
    isFetching.current = true;

    try {
      setLoading(true);
      let url = `/candidate/interviews/interviewsByUserId/${userId}?page=${pageNo}&size=${size}`;
      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      
      const response = await httpService.get(url);
      const responseData = response.data;
      
      if (fetchId === currentFetchId.current) {
        setInterviews(processInterviewData(responseData.content));
        setTotalCount(responseData.totalElements);
        setError(null);
      }
    } catch (err) {
      if (fetchId === currentFetchId.current) {
        setError("Failed to fetch interview data");
        console.error("Error fetching interviews:", err);
        ToastService.error("Failed to load interviews");
      }
    } finally {
      if (fetchId === currentFetchId.current) {
        setLoading(false);
        isFetching.current = false;
      }
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchInterviews(0, 10, "");
      initialLoadDone.current = true;
    };
    loadInitialData();
  }, [fetchInterviews]);

  // Standard paginated fetch (skips when date filter is active)
  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (isDateFiltered) return;

    const timeoutId = setTimeout(() => {
      fetchInterviews(page, rowsPerPage, searchText);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [page, rowsPerPage, searchText, fetchInterviews, isDateFiltered]);

  // Date-range filtered fetch with pagination + search
  useEffect(() => {
    if (!startDate || !endDate) return;

    dispatch(
      filterInterviewsByRecruiter({
        startDate,
        endDate,
        page,
        size: rowsPerPage,
        ...(searchText && { search: searchText }),
      })
    );
  }, [startDate, endDate, page, rowsPerPage, searchText, dispatch]);

  // Reset to page 0 when date range changes
  useEffect(() => {
    setPage(0);
  }, [startDate, endDate]);

  const handlePageChange = useCallback((newPage, newRowsPerPage) => {
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
    }
    setPage(newPage);
  }, [rowsPerPage]);

  const handleRowsPerPageChange = useCallback((newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  const handleSearchChange = useCallback((searchValue, newPage, newRowsPerPage) => {
    setSearchText(searchValue);
    setPage(newPage || 0);
    if (newRowsPerPage) {
      setRowsPerPage(newRowsPerPage);
    }
  }, []);

  const handleDateChange = useCallback((start, end) => {
    setStartDate(start);
    setEndDate(end);
    setPage(0);
  }, []);

  const handleClearDateFilter = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setPage(0);
    dispatch(clearRecruiterFilter());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    if (isDateFiltered) {
      dispatch(
        filterInterviewsByRecruiter({
          startDate,
          endDate,
          page,
          size: rowsPerPage,
          ...(searchText && { search: searchText }),
        })
      );
      return;
    }
    fetchInterviews(page, rowsPerPage, searchText, true);
  }, [isDateFiltered, startDate, endDate, page, rowsPerPage, searchText, dispatch, fetchInterviews]);

  const handleBenchSuccess = (row) => {
    setInterviews((prevInterviews) =>
      prevInterviews.filter((item) => item.interviewId !== row.interviewId)
    );
    if (isDateFiltered) {
      handleRefresh();
    }
  };

  const filterInterviewsByLevel = (interviewsList) => {
    if (levelFilter === "ALL") return interviewsList;

    return interviewsList.filter((interview) => {
      if (levelFilter === "INTERNAL")
        return interview.interviewLevel === "INTERNAL";
      if (levelFilter === "EXTERNAL")
        return interview.interviewLevel !== "INTERNAL";
      if (levelFilter === "EXTERNAL L1") 
        return interview.interviewLevel === "L1";
      if (levelFilter === "EXTERNAL L2") 
        return interview.interviewLevel === "L2";
      if (levelFilter === "EXTERNAL L3") 
        return interview.interviewLevel === "L3";
      return false;
    });
  };

  const handleLevelFilterChange = (event, newFilter) => {
    if (newFilter !== null) setLevelFilter(newFilter);
  };

  const handleJobIdClick = (jobId) => {
    navigate(`/dashboard/requirements/job-details/${jobId}`, {
      state: { from: "/dashboard/recruiter-interviews" }
    });
  };

  const handleEdit = (row, isReschedule = false, isScheduleJoining = false) => {
    let formType = "edit";

    if (isReschedule) {
      formType = "reschedule";
    } else if (isScheduleJoining) {
      formType = "schedule";
    }

    setEditDrawer({
      open: true,
      data: {
        ...row,
        formType,
        isReschedule,
        isScheduleJoining,
        fromView: "recruiter",
        isCoordinatorView: false,
      },
    });
  };

  const handleCloseEditDrawer = () => {
    setEditDrawer({ open: false, data: null });
  };

  const handleInterviewUpdated = () => {
    handleRefresh();
    handleCloseEditDrawer();
  };

  const handleDelete = async (row) => {
    setConfirmDialog({ open: true, interview: row });
  };

  const handleConfirmDelete = async () => {
    const interview = confirmDialog.interview;
    if (!interview) return;

    try {
      const toastId = ToastService.loading("Deleting interview...");
      let deleteEndpoint;
      if (interview.candidateId && interview.jobId) {
        deleteEndpoint = `/candidate/deleteinterview/${interview.candidateId}/${interview.jobId}`;
      } else {
        deleteEndpoint = `/interview/${interview.interviewId}`;
      }

      await httpService.delete(deleteEndpoint);
      handleRefresh();
      ToastService.update(toastId, "Interview deleted successfully", "success");
    } catch (error) {
      ToastService.error("Failed to delete interview");
      console.error("Error deleting interview:", error);
    } finally {
      setConfirmDialog({ open: false, interview: null });
    }
  };

  const getTableColumns = () => {
    const baseColumns = [
      {
        key: "jobId",
        label: "Job ID",
        width: 180,
        render: (row) => (
          <Link
            component="button"
            variant="body2"
            onClick={() => handleJobIdClick(row.jobId)}
            sx={{
              textDecoration: "none",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {row.jobId}
          </Link>
        ),
        sortable: true,
        filterable: true,
      },
      {
        key: "technology",
        label: "Technologies",
        width: 180,
        sortable: true,
        render: (row) => row.technology,
        filterable: true,
      },
      {
        key: "candidateFullName",
        label: "Candidate",
        width: 180,
        render: (row) => (
          <Box>
            <Typography>{row.candidateFullName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.candidateEmailId}
            </Typography>
          </Box>
        ),
      },
      { key: "clientName", label: "Client", width: 150 },
      {
        key: "interviewLevel",
        label: "Level",
        width: 120,
        render: (row) => getInterviewLevelChip(row.interviewLevel),
      },
      {
        key: "latestInterviewStatus",
        label: "Status",
        width: 140,
        render: (row) => getStatusChip(row.latestInterviewStatus, row, dispatch),
      },
      {
        key: "interviewDateTime",
        label: "Interview Date & Time",
        width: 200,
        render: (row) => formatDateTime(row.interviewDateTime),
      },
      { key: "duration", label: "Duration (min)", width: 120, align: "center" },
      {
        key: "zoomLink",
        label: "Meeting",
        width: 120,
        render: (row) =>
          row.zoomLink ? (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<VideoCallIcon />}
              href={row.zoomLink}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ px: 1, py: 0.5 }}
            >
              Join
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No link
            </Typography>
          ),
      },
      {
        key: "internalFeedback",
        label: "Internal Feedback",
        width: 120,
        render: (row) => (
          <InternalFeedbackCell
            value={row.internalFeedback}
            loading={loading}
            isCoordinator={false}
            candidateName={row.candidateFullName}
            type="feedback"
          />
        ),
      },
      {
        key: "moveToBench",
        label: "Move to Bench",
        sortable: false,
        filterable: false,
        width: 130,
        align: "center",
        render: (row) => (
          <MoveToBench
            row={row}
            onSuccess={handleBenchSuccess}
            isLoading={moveToBenchLoading}
          />
        ),
      },
      {
        key: "actions",
        label: "Actions",
        width: 200,
        render: (row) => {
          const status = row.latestInterviewStatus?.toUpperCase();
          const showReschedule = ["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(status);
          const showScheduleJoining = status === "SELECTED";

          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Edit">
                <IconButton
                  onClick={() => handleEdit(row)}
                  color="primary"
                  size="small"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete">
                <IconButton
                  onClick={() => handleDelete(row)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <DownloadResume
                candidate={row}
                getDownloadUrl={(candidate, format) =>
                  `${API_BASE_URL}/candidate/download-resume/${candidate.candidateId}/${candidate.jobId}?format=${format}`
                }
              />

              {showReschedule && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleEdit(row, true)}
                  sx={{ px: 1, py: 0.5 }}
                >
                  Reschedule
                </Button>
              )}

              {showScheduleJoining && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleEdit(row, false, true)}
                  sx={{ px: 1, py: 0.5 }}
                >
                  Schedule Joining
                </Button>
              )}
            </Box>
          );
        },
      },
    ];

    return baseColumns;
  };

  // Get display data based on filters
  const getDisplayData = () => {
    if (isDateFiltered && isRecruiterFilterActive) {
      return filterInterviewsByLevel(processInterviewData(filterInterviewsForRecruiter));
    }
    return filterInterviewsByLevel(interviews);
  };

  const getTotalCount = () => {
    if (isDateFiltered && isRecruiterFilterActive) {
      return filterInterviewsForRecruiterTotalCount;
    }
    return totalCount;
  };

  const processedData = getDisplayData();
  const displayTotalCount = getTotalCount();

  return (
    <Box sx={{ p: 1 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          flexWrap: "wrap",
          mb: 3,
          justifyContent: "space-between",
          p: 2,
          backgroundColor: "#f9f9f9",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6" color="primary">
            My Scheduled Interviews
          </Typography>
        </Box>
        <DateRangeFilter 
          component="InterviewsForRecruiter"
          onDateChange={handleDateChange}
          onClearFilter={handleClearDateFilter}
        />
      </Stack>

      <Box sx={{ mb: 2, display: "flex", justifyContent: "start" }}>
        <ToggleButtonGroup
          value={levelFilter}
          exclusive
          onChange={handleLevelFilterChange}
          aria-label="interview level filter"
          sx={{
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 1,
            "& .MuiToggleButton-root": {
              px: 2,
              py: 1,
              borderRadius: 1,
              border: "1px solid rgba(25, 118, 210, 0.5)",
              "&.Mui-selected": {
                backgroundColor: "#1976d2",
                color: "white",
                "&:hover": {
                  backgroundColor: "#1565c0",
                },
              },
              "&:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.08)",
              },
            },
          }}
        >
          <ToggleButton value="ALL" aria-label="all interviews">
            ALL
          </ToggleButton>
          <ToggleButton value="INTERNAL" aria-label="internal interviews">
            INTERNAL
          </ToggleButton>
          <ToggleButton value="EXTERNAL" aria-label="external interviews">
            EXTERNAL
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading && !interviews.length && !isDateFiltered ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress sx={{ color: "#1976d2" }} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography color="error">{error}</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{
              mt: 2,
              color: "#1976d2",
              borderColor: "#1976d2",
              "&:hover": { borderColor: "#1565c0", backgroundColor: "#e3f2fd" },
            }}
          >
            Retry
          </Button>
        </Box>
      ) : (
        <DataTablePaginated
          data={processedData}
          columns={getTableColumns()}
          title="My Interviews"
          enableSelection={false}
          serverSide={true}
          totalCount={displayTotalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onSearchChange={handleSearchChange}
          refreshData={handleRefresh}
          searchValue={searchText}
          defaultSortColumn="interviewDateTime"
          defaultSortDirection="desc"
          primaryColor="#1976d2"
          secondaryColor="#e3f2fd"
          loading={loading}
        />
      )}

      <Drawer
        anchor="right"
        open={editDrawer.open}
        onClose={handleCloseEditDrawer}
        PaperProps={{
          sx: { width: { xs: "60%", sm: "50%", md: "50%" } },
        }}
      >
        {editDrawer.data && (
          <InterviewFormWrapper
            formType={editDrawer.data.formType || "edit"}
            data={editDrawer.data}
            onClose={handleCloseEditDrawer}
            onSuccess={handleInterviewUpdated}
            showCoordinatorView={false}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Interview?"
        content={`Do you really want to delete the interview for ${
          confirmDialog.interview?.candidateFullName ||
          confirmDialog.interview?.candidateEmailId ||
          "this candidate"
        }? This action cannot be undone.`}
        onClose={() => setConfirmDialog({ open: false, interview: null })}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default RecruiterInterviews;