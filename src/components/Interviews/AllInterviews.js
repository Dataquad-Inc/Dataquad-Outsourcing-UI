import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Skeleton,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Link,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Visibility,
  Edit,
  Delete,
  VideoCall as VideoCallIcon,
  Refresh as RefreshIcon,
  SupervisorAccount as CoordinatorIcon,
} from "@mui/icons-material";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import { useSelector, useDispatch } from "react-redux";
import { getStatusChip, getInterviewLevelChip } from "../../utils/statusUtils";
import ConfirmDialog from "../muiComponents/ConfirmDialog";
import { filterInterviewsByDateRange } from "../../redux/interviewSlice";
import { formatDateTime } from "../../utils/dateformate";
import { showToast } from "../../utils/ToastNotification";
import MoveToBench from "./MoveToBench";
import { useNavigate } from "react-router-dom";
import InternalFeedbackCell from "./FeedBack";
import DownloadResume from "../../utils/DownloadResume";
import { API_BASE_URL } from "../../Services/httpService";
import InterviewFormWrapper from "./InterviewFormWrapper";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import DataTablePaginated from "../muiComponents/DataTablePaginated";

const AllInterviews = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState("");

  // ── Date filter state (mirrors Requirements.jsx pattern) ─────────────────
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [interviews, setInterviews] = useState([]);
  const [coordinatorInterviews, setCoordinatorInterviews] = useState([]);
  const [showCoordinatorView, setShowCoordinatorView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coordinatorLoading, setCoordinatorLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    interview: null,
  });
  const [editDrawer, setEditDrawer] = useState({ open: false, data: null });
  const [moveToBenchLoading, setMoveToBenchLoading] = useState(false);

  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    interview: null,
  });
  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const dispatch = useDispatch();
  const { userId, role } = useSelector((state) => state.auth);
  const { isFilteredDataRequested } = useSelector((state) => state.bench);
  // ── Pull filteredTotalCount alongside filteredInterviewList ───────────────
  const { filteredInterviewList, filteredTotalCount } = useSelector((state) => state.interview);

  const [levelFilter, setLevelFilter] = useState(
    role === "COORDINATOR" ? "INTERNAL" : "ALL"
  );

  const navigate = useNavigate();
  
  // Use refs to track if initial load is done and prevent multiple calls
  const initialLoadDone = useRef(false);
  const isFetching = useRef(false);
  const currentFetchId = useRef(0);

  // ── Derived: is a date range currently active? ────────────────────────────
  const isDateFiltered = !!(startDate && endDate);

  const processInterviewData = (data) =>
    data.map((interview) => ({
      ...interview,
      candidateFullName:
        interview.candidateFullName ||
        interview.candidateEmailId?.split("@")[0] ||
        "Unknown Candidate",
      interviewStatus:
        interview.latestInterviewStatus ||
        interview.interviewStatus ||
        "SCHEDULED",
    }));

  const fetchInterviews = useCallback(async (
    pageNo,
    size,
    search,
    forceFetch = false
  ) => {
    // Prevent concurrent fetches
    if (isFetching.current && !forceFetch) {
      return;
    }

    const fetchId = ++currentFetchId.current;
    isFetching.current = true;

    try {
      setLoading(true);

      let url = `/candidate/interviews/interviewsByUserId/${userId}?page=${pageNo}&size=${size}`;
      
      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const response = await httpService.get(url);

      // Only update state if this is the latest fetch
      if (fetchId === currentFetchId.current) {
        const responseData = response.data;
        setInterviews(processInterviewData(responseData.content));
        setTotalCount(responseData?.totalElements);
        setError(null);
      }
    } catch (error) {
      if (fetchId === currentFetchId.current) {
        console.error("Error fetching interviews:", error);
        setError("Failed to load interviews");
        ToastService.error("Failed to load interviews");
      }
    } finally {
      if (fetchId === currentFetchId.current) {
        setLoading(false);
        isFetching.current = false;
      }
    }
  }, [userId]);

  const fetchCoordinatorInterviews = useCallback(async (
    pageNo,
    size,
    search,
    forceFetch = false
  ) => {
    // Prevent concurrent fetches
    if (isFetching.current && !forceFetch) {
      return;
    }

    const fetchId = ++currentFetchId.current;
    isFetching.current = true;

    try {
      setCoordinatorLoading(true);

      let url = `/candidate/interviews/interviewsByUserId/${userId}?coordinator=true&page=${pageNo}&size=${size}`;
      
      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const response = await httpService.get(url);

      // Only update state if this is the latest fetch
      if (fetchId === currentFetchId.current) {
        const responseData = response?.data?.data;
        setCoordinatorInterviews(processInterviewData(responseData.content));
        setTotalCount(responseData.totalElements);
        setError(null);
      }
    } catch (error) {
      if (fetchId === currentFetchId.current) {
        console.error("Error fetching coordinator interviews:", error);
        setError("Failed to load coordinator interviews");
        ToastService.error("Failed to load coordinator interviews");
      }
    } finally {
      if (fetchId === currentFetchId.current) {
        setCoordinatorLoading(false);
        isFetching.current = false;
      }
    }
  }, [userId]);

  // ── Standard paginated fetch (skips when date filter is active) ───────────
  useEffect(() => {
    if (!initialLoadDone.current) {
      return;
    }

    // When date filter is active, the date-range effect below handles fetching
    if (isDateFiltered) return;

    const timeoutId = setTimeout(() => {
      if (showCoordinatorView) {
        fetchCoordinatorInterviews(page, rowsPerPage, searchText);
      } else {
        fetchInterviews(page, rowsPerPage, searchText);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [page, rowsPerPage, searchText, showCoordinatorView, fetchInterviews, fetchCoordinatorInterviews, isDateFiltered]);

  // Initial load only once
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchInterviews(0, 10, "");
      initialLoadDone.current = true;
    };
    
    loadInitialData();
  }, [fetchInterviews]);

  // ── Date-range filtered fetch with pagination + search ────────────────────
  // Mirrors the pattern in Requirements.jsx exactly.
  useEffect(() => {
    if (!startDate || !endDate) return;

    setLoading(true);
    dispatch(
      filterInterviewsByDateRange({
        startDate,
        endDate,
        page,
        size: rowsPerPage,
        ...(searchText && { search: searchText }),
      })
    ).finally(() => setLoading(false));
  }, [startDate, endDate, page, rowsPerPage, searchText, dispatch]);

  // Reset to page 0 whenever the date range itself changes
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

  // ── Date filter handlers ──────────────────────────────────────────────────
  const handleDateChange = useCallback((start, end) => {
    setStartDate(start);
    setEndDate(end);
    setPage(0);
  }, []);

  const handleClearDateFilter = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setPage(0);
  }, []);

  const handleRefresh = useCallback(() => {
    if (isDateFiltered) {
      dispatch(
        filterInterviewsByDateRange({
          startDate,
          endDate,
          page,
          size: rowsPerPage,
          ...(searchText && { search: searchText }),
        })
      );
      return;
    }
    if (showCoordinatorView) {
      fetchCoordinatorInterviews(page, rowsPerPage, searchText, true);
    } else {
      fetchInterviews(page, rowsPerPage, searchText, true);
    }
  }, [isDateFiltered, startDate, endDate, showCoordinatorView, fetchCoordinatorInterviews, fetchInterviews, page, rowsPerPage, searchText, dispatch]);

  const handleOpenFeedbackDialog = (interview) => {
    setFeedbackDialog({
      open: true,
      interview: interview,
    });
    setFeedback(interview.internalFeedback || "");
  };

  const handleCloseFeedbackDialog = () => {
    setFeedbackDialog({
      open: false,
      interview: null,
    });
    setFeedback("");
    setIsSubmittingFeedback(false);
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      showToast("Feedback cannot be empty", "error");
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      const { interview } = feedbackDialog;
      if (!interview || !interview.interviewId) {
        throw new Error("Missing interview data");
      }

      const response = await httpService.put(
        `/candidate/updateInterviewByCoordinator/${userId}/${interview.interviewId}`,
        { internalFeedBack: feedback }
      );

      if (response.data.success) {
        showToast("Feedback submitted successfully!", "success");
        handleCloseFeedbackDialog();
        handleRefresh();
      } else {
        throw new Error(response.data.message || "Failed to submit feedback");
      }
      return response.data;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showToast(error.message || "Error submitting feedback", "error");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleEdit = (row, isReschedule = false, isScheduleJoining = false) => {
    let formType;
    
    if (isScheduleJoining) {
      formType = "schedule";
    } else if (isReschedule) {
      formType = "reschedule"; 
    } else {
      formType = "edit";
    }

    setEditDrawer({
      open: true,
      data: { 
        ...row, 
        formType,
        isReschedule,
        isScheduleJoining,
        fromView: showCoordinatorView ? "coordinator" : "recruiter",
        isCoordinatorView: showCoordinatorView 
      },
    });
  };

  const handleBenchSuccess = (row) => {
    if (showCoordinatorView) {
      setCoordinatorInterviews((prev) =>
        prev.filter((item) => item.submissionId !== row.submissionId)
      );
    } else {
      setInterviews((prev) =>
        prev.filter((item) => item.submissionId !== row.submissionId)
      );
    }
    if (isFilteredDataRequested) {
      dispatch(
        filterInterviewsByDateRange(
          filteredInterviewList.filter(
            (item) => item.submissionId !== row.submissionId
          )
        )
      );
    }
  };

  const handleCloseEditDrawer = () =>
    setEditDrawer({ open: false, data: null });

  const handleInterviewUpdated = () => {
    handleRefresh();
    handleCloseEditDrawer();
  };

  const handleJobIdClick = (jobId) => {
    navigate(`/dashboard/requirements/job-details/${jobId}`, {
      state: { from: "/dashboard/interviews" },
    });
  };

  const handleDelete = async (row) =>
    setConfirmDialog({ open: true, interview: row });

  const handleConfirmDelete = async () => {
    const { interview } = confirmDialog;
    if (!interview) return;

    try {
      const toastId = ToastService.loading("Deleting interview...");
      const deleteEndpoint =
        interview.candidateId && interview.jobId
          ? `/candidate/deleteinterview/${interview.candidateId}/${interview.jobId}`
          : `/interview/${interview.interviewId}`;

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

  const handleLevelFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setLevelFilter(newFilter);
    }
  };

  const filterInterviewsByLevel = (interviews) => {
    if (levelFilter === "ALL" && !showCoordinatorView) return interviews;
    
    if (showCoordinatorView) {
      return interviews.filter(interview => interview.interviewLevel === "INTERNAL");
    }

    return interviews.filter((interview) => {
      if (levelFilter === "INTERNAL") {
        return interview.interviewLevel === "INTERNAL";
      }
      if (levelFilter === "EXTERNAL") {
        return interview.interviewLevel !== "INTERNAL";
      }
      if (levelFilter === "EXTERNAL L1") {
        return interview.interviewLevel === "L1";
      }
      if (levelFilter === "EXTERNAL L2") {
        return interview.interviewLevel === "L2";
      }
      if (levelFilter === "EXTERNAL L3") {
        return interview.interviewLevel === "L3";
      }
      return false;
    });
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
        width: 120,
      },
      {
        key: "technology",
        label: "Technologies",
        sortable: true,
        render: (row) => row.technology,
        filterable: true,
        width: 120,
      },
      {
        key: "candidateFullName",
        label: "Candidate",
        width: 180,
        render: (row) =>
          loading || coordinatorLoading ? (
            <Skeleton width={120} height={24} />
          ) : (
            <Box>
              <Typography>{row.candidateFullName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {row.candidateEmailId}
              </Typography>
            </Box>
          ),
      },
      {
        key: "candidateContactNo",
        label: "Contact No",
        width: 120,
        render: (row) =>
          loading || coordinatorLoading ? (
            <Skeleton width={100} height={24} />
          ) : (
            row.candidateContactNo
          ),
      },
      {
        key: "recruiterName",
        label: "Recruiter",
        width: 150,
        render: (row) =>
          loading || coordinatorLoading ? (
            <Skeleton width={120} height={24} />
          ) : (
            <Tooltip title={row.recruiterEmail || ""}>
              <Typography>
                {row.recruiterName || "Unknown"}
                {row.recruiterEmail && (
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    {row.recruiterEmail}
                  </Typography>
                )}
              </Typography>
            </Tooltip>
          ),
      },
      {
        key: "clientName",
        label: "Client Name",
        width: 150,
        render: (row) =>
          loading || coordinatorLoading ? (
            <Skeleton width={120} height={24} />
          ) : (
            row.clientName
          ),
      },
      {
        key: "interviewLevel",
        label: "Level",
        width: 120,
        render: (row) =>
          loading || coordinatorLoading ? (
            <Skeleton variant="rectangular" width={100} height={24} />
          ) : (
            getInterviewLevelChip(row.interviewLevel)
          ),
      },
      {
        key: "latestInterviewStatus",
        label: "Status",
        width: 140,
        render: (row) =>
          loading || coordinatorLoading ? (
            <Skeleton variant="rectangular" width={100} height={24} />
          ) : (
            getStatusChip(row.latestInterviewStatus, row, dispatch)
          ),
      },
      {
        key: "interviewDateTime",
        label: "Date & Time",
        width: 180,
        render: (row) =>
          loading || coordinatorLoading ? (
            <Skeleton width={150} height={24} />
          ) : (
            formatDateTime(row.interviewDateTime)
          ),
      },
      {
        key: "duration",
        label: "Duration (min)",
        width: 120,
        align: "center",
        render: (row) =>
          loading || coordinatorLoading ? (
            <Skeleton width={50} height={24} />
          ) : (
            row.duration
          ),
      },
      {
        key: "zoomLink",
        label: "Meeting",
        width: 120,
        render: (row) =>
          loading || coordinatorLoading ? (
            <Skeleton variant="rectangular" width={120} height={24} />
          ) : row.zoomLink ? (
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
    ];

    if (showCoordinatorView) {
      baseColumns.push({
        key: "comments",
        label: "Recruiter Comments",
        sortable: false,
        filterable: false,
        width: 160,
        render: (row) => (
          <InternalFeedbackCell
            value={row.comments}
            loading={loading || coordinatorLoading}
            isCoordinator={false}
            candidateName={row.candidateFullName}
            type="comments"
          />
        ),
      },
      {
        key: "internalFeedback",
        label: "Internal Feedback",
        width: 120,
        align: "center",
        render: (row) =>
          loading || coordinatorLoading ? (
            <Skeleton width={120} height={24} />
          ) : (
            <InternalFeedbackCell
              value={row.internalFeedback}
              loading={loading || coordinatorLoading}
              candidateName={row.candidateFullName}
              type="feedback"
            />
          ),
      });
    } else {
      baseColumns.push(
        {
          key: "internalFeedback",
          label: "Internal Feedback",
          width: 120,
          align: "center",
          render: (row) =>
            loading || coordinatorLoading ? (
              <Skeleton width={120} height={24} />
            ) : (
              <InternalFeedbackCell
                value={row.internalFeedback}
                loading={loading || coordinatorLoading}
                candidateName={row.candidateFullName}
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
          render:
            loading || coordinatorLoading
              ? () => <Skeleton variant="text" width={100} />
              : (row) => (
                  <MoveToBench
                    row={row}
                    onSuccess={handleBenchSuccess}
                    isLoading={moveToBenchLoading}
                  />
                ),
        }
      );
    }

    baseColumns.push({
      key: "actions",
      label: "Actions",
      width: 200,
      align: "center",
      render: (row) => {
        const status = row.latestInterviewStatus?.toUpperCase();
        const showReschedule = ["CANCELLED","NO_SHOW","RESCHEDULED"].includes(status);
        const showScheduleJoining = status === "SELECTED";

        return (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
            {!showCoordinatorView && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleEdit(row)}
                  disabled={loading || coordinatorLoading}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {!showCoordinatorView && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(row)}
                  disabled={loading || coordinatorLoading}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {showCoordinatorView && (
              <DownloadResume 
                candidate={{ ...row, jobId: row.jobId }}
                getDownloadUrl={(candidate, format) =>
                  `${API_BASE_URL}/candidate/download-resume/${candidate.candidateId}/${candidate.jobId}?format=${format}`
                }
              />
            )}

            {showCoordinatorView && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleEdit(row)}
                  disabled={loading || coordinatorLoading}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {showReschedule && !showCoordinatorView && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleEdit(row, true)}
                sx={{ px: 1, py: 0.5 }}
              >
                Reschedule
              </Button>
            )}

            {showScheduleJoining && !showCoordinatorView && (
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
    });

    return baseColumns;
  };

  // ── Display data: date-filtered list takes priority over live-fetched data ─
  const getDisplayData = () => {
    let data;
    if (showCoordinatorView) {
      data = coordinatorInterviews;
    } else {
      data = isDateFiltered ? filteredInterviewList : interviews;
    }
    return filterInterviewsByLevel(data);
  };

  const processedData = getDisplayData();

  const handleCoordinatorViewToggle = () => {
    setShowCoordinatorView(!showCoordinatorView);
    setPage(0);
    setSearchText("");
  };

  return (
    <>
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
        <Typography variant="h6" color="primary">
          {showCoordinatorView
            ? "Coordinator Interviews"
            : "Interviews Management"}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant={showCoordinatorView ? "contained" : "outlined"}
            startIcon={<CoordinatorIcon />}
            onClick={handleCoordinatorViewToggle}
            sx={{
              color: showCoordinatorView ? "white" : "#1976d2",
              borderColor: "#1976d2",
              backgroundColor: showCoordinatorView ? "#1976d2" : "transparent",
              "&:hover": {
                borderColor: "#1565c0",
                backgroundColor: showCoordinatorView ? "#1565c0" : "#e3f2fd",
              },
            }}
          >
            {showCoordinatorView ? "Regular View" : "Coordinator View"}
          </Button>
          {/* ── DateRangeFilter now receives callbacks for paginated date filtering ── */}
          <DateRangeFilter
            component="allInterviews"
            onDateChange={handleDateChange}
            onClearFilter={handleClearDateFilter}
          />
        </Box>
      </Stack>

      {!showCoordinatorView && (
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
      )}

      {(loading && !interviews.length) ||
      (coordinatorLoading && !coordinatorInterviews.length) ? (
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
        <>
          <DataTablePaginated
            data={processedData}
            columns={getTableColumns()}
            title={
              showCoordinatorView
                ? "Coordinator Interviews"
                : levelFilter === "INTERNAL"
                ? "Internal Interviews"
                : levelFilter === "EXTERNAL"
                ? "External Interviews"
                : "Interviews"
            }
            loading={loading || coordinatorLoading}
            enableSelection={false}
            serverSide={true}
            // ── totalCount switches between filtered and standard count ──────
            totalCount={isDateFiltered ? filteredTotalCount : totalCount}
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
          />

          <Drawer
            anchor="right"
            open={editDrawer.open}
            onClose={handleCloseEditDrawer}
            PaperProps={{ sx: { width: { xs: "60%", sm: "50%", md: "50%" } } }}
          >
            {editDrawer.data && (
              <InterviewFormWrapper
                formType={editDrawer.data.formType || "edit"}
                data={editDrawer.data}
                onClose={handleCloseEditDrawer}
                onSuccess={handleInterviewUpdated}
                showCoordinatorView={showCoordinatorView}
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

          <Dialog
            open={feedbackDialog.open}
            onClose={handleCloseFeedbackDialog}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle sx={{ px: 4, pt: 3 }}>
              Feedback for{" "}
              {feedbackDialog.interview?.candidateFullName || "Candidate"}
            </DialogTitle>
            <DialogContent sx={{ px: 2, py: 2 }}>
              <Box sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Feedback"
                  multiline
                  minRows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 4, pb: 3 }}>
              <Button onClick={handleCloseFeedbackDialog}>Cancel</Button>
              <Button
                onClick={handleSubmitFeedback}
                variant="contained"
                color="primary"
                disabled={!feedback.trim() || isSubmittingFeedback}
              >
                {isSubmittingFeedback ? (
                  <CircularProgress size={24} />
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </>
  );
};

export default AllInterviews;