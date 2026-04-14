import React, { useEffect, useState } from "react";
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
import DateRangeFilterUtil from "../muiComponents/DateRangeFilterUtil";
import CustomDataTable from "../../ui-lib/CustomDataTable"; // ← new table

//superadmin interviews
const AllInterviews = () => {
  const [filteredData, setFilteredData] = useState(null);
  const [filterLoading, setFilterLoading] = useState(false);

  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);

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
  const { filteredInterviewList } = useSelector((state) => state.interview);

  const [levelFilter, setLevelFilter] = useState(
    role === "COORDINATOR" ? "INTERNAL" : "ALL",
  );

  const navigate = useNavigate();

  // Server-side pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20); // CustomDataTable defaults to 20
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Helpers ────────────────────────────────────────────────────────────────
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

  const validatePage = (pageNum) => {
    const num = Number(pageNum);
    return !isNaN(num) && num >= 0 ? num : 0;
  };

  const validateSize = (size) => {
    const num = Number(size);
    return !isNaN(num) && num > 0 ? num : 20;
  };

  // ─── Fetch functions ─────────────────────────────────────────────────────────
  const fetchInterviews = async (
    pageNum = 0,
    size = rowsPerPage,
    searchText = "",
  ) => {
    const validPage = validatePage(pageNum);
    const validSize = validateSize(size);

    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: validPage,
        size: validSize,
        ...(searchText && { searchText }),
      }).toString();

      const response = await httpService.get(
        `/candidate/interviews/interviewsByUserId/${userId}?${queryParams}`,
      );

      setInterviews(
        processInterviewData(response.data.data || response.data || []),
      );
      setTotalCount(response.data.length || response.data.totalElements);

      setError(null);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      setError("Failed to load interviews");
      ToastService.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredInterviews = async (
    startDate,
    endDate,
    pageNum = 0,
    pageSize = rowsPerPage,
    searchText = searchQuery,
  ) => {
    const validPage = validatePage(pageNum);
    const validSize = validateSize(pageSize);

    try {
      setFilterLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
        page: validPage,
        size: validSize,
        ...(searchText && { searchText }),
      });

      const response = await httpService.get(
        `/candidate/interviews/filterByDate?${params}`,
      );

      const data = processInterviewData(
        Array.isArray(response.data)
          ? response.data
          : response.data?.data || [],
      );

      setFilteredData(data);
      setTotalCount(response.data.totalElements || 0);
    } catch (error) {
      console.error("Error fetching filtered interviews:", error);
      ToastService.error("Failed to filter interviews");
    } finally {
      setFilterLoading(false);
    }
  };

  const fetchCoordinatorInterviews = async () => {
    try {
      setCoordinatorLoading(true);
      const response = await httpService.get(
        `/candidate/interviews/interviewsByUserId/${userId}?coordinator=true`,
      );
      setCoordinatorInterviews(
        processInterviewData(response.data.data || response.data || []),
      );
      setError(null);
    } catch (error) {
      console.error("Error fetching coordinator interviews:", error);
      setError("Failed to load coordinator interviews");
      ToastService.error("Failed to load coordinator interviews");
    } finally {
      setCoordinatorLoading(false);
    }
  };

  // ─── Feedback handlers ───────────────────────────────────────────────────────
  const handleCloseFeedbackDialog = () => {
    setFeedbackDialog({ open: false, interview: null });
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
      if (!interview || !interview.interviewId)
        throw new Error("Missing interview data");

      const response = await httpService.put(
        `/candidate/updateInterviewByCoordinator/${userId}/${interview.interviewId}`,
        { internalFeedBack: feedback },
      );

      if (response.data.success) {
        showToast("Feedback submitted successfully!", "success");
        handleCloseFeedbackDialog();
        if (showCoordinatorView) {
          fetchCoordinatorInterviews();
        } else {
          fetchInterviews(page, rowsPerPage, searchQuery);
        }
      } else {
        throw new Error(response.data.message || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showToast(error.message || "Error submitting feedback", "error");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // ─── CRUD / navigation handlers ──────────────────────────────────────────────
  const handleEdit = (row, isReschedule = false, isScheduleJoining = false) => {
    const formType = isScheduleJoining
      ? "schedule"
      : isReschedule
        ? "reschedule"
        : "edit";
    setEditDrawer({
      open: true,
      data: {
        ...row,
        formType,
        isReschedule,
        isScheduleJoining,
        fromView: showCoordinatorView ? "coordinator" : "recruiter",
        isCoordinatorView: showCoordinatorView,
      },
    });
  };

  const handleBenchSuccess = (row) => {
    if (showCoordinatorView) {
      setCoordinatorInterviews((prev) =>
        prev.filter((item) => item.submissionId !== row.submissionId),
      );
    } else {
      setInterviews((prev) =>
        prev.filter((item) => item.submissionId !== row.submissionId),
      );
    }
    if (isFilteredDataRequested) {
      dispatch(
        filterInterviewsByDateRange(
          filteredInterviewList.filter(
            (item) => item.submissionId !== row.submissionId,
          ),
        ),
      );
    }
  };

  const handleCloseEditDrawer = () =>
    setEditDrawer({ open: false, data: null });

  const handleInterviewUpdated = () => {
    if (showCoordinatorView) {
      fetchCoordinatorInterviews();
    } else {
      fetchInterviews(page, rowsPerPage, searchQuery);
    }
    handleCloseEditDrawer();
  };

  const handleJobIdClick = (jobId) => {
    navigate(`/dashboard/requirements/job-details/${jobId}`, {
      state: { from: "/dashboard/interviews" },
    });
  };

  const handleDelete = (row) =>
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

      if (showCoordinatorView) {
        await fetchCoordinatorInterviews();
      } else {
        await fetchInterviews(page, rowsPerPage, searchQuery);
      }
      ToastService.update(toastId, "Interview deleted successfully", "success");
    } catch (error) {
      ToastService.error("Failed to delete interview");
      console.error("Error deleting interview:", error);
    } finally {
      setConfirmDialog({ open: false, interview: null });
    }
  };

  // ─── Level filter ────────────────────────────────────────────────────────────
  const handleLevelFilterChange = (event, newFilter) => {
    if (newFilter !== null) setLevelFilter(newFilter);
  };

  const filterInterviewsByLevel = (interviews) => {
    if (levelFilter === "ALL" && !showCoordinatorView) return interviews;

    if (showCoordinatorView) {
      return interviews.filter((i) => i.interviewLevel === "INTERNAL");
    }

    return interviews.filter((interview) => {
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

  // ─── CustomDataTable columns ─────────────────────────────────────────────────
  // NOTE: CustomDataTable passes render(cellValue, row) — we use `row` (2nd arg)
  // for all multi-field renders, and `cellValue` for simple single-field renders.
  const getTableColumns = () => {
    const isLoading = loading || coordinatorLoading;

    const baseColumns = [
      {
        id: "jobId",
        label: "Job ID",
        render: (_val, row) =>
          isLoading ? (
            <Skeleton width={80} height={24} />
          ) : (
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
      },
      {
        id: "technology",
        label: "Technologies",
        render: (val) =>
          isLoading ? <Skeleton width={100} height={24} /> : val,
      },
      {
        id: "candidateFullName",
        label: "Candidate",
        render: (_val, row) =>
          isLoading ? (
            <Skeleton width={120} height={24} />
          ) : (
            <Box>
              <Typography variant="body2">{row.candidateFullName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {row.candidateEmailId}
              </Typography>
            </Box>
          ),
      },
      {
        id: "candidateContactNo",
        label: "Contact No",
        render: (val) =>
          isLoading ? <Skeleton width={100} height={24} /> : val,
      },
      {
        id: "recruiterName",
        label: "Recruiter",
        render: (_val, row) =>
          isLoading ? (
            <Skeleton width={120} height={24} />
          ) : (
            <Tooltip title={row.recruiterEmail || ""}>
              <Box>
                <Typography variant="body2">
                  {row.recruiterName || "Unknown"}
                </Typography>
                {row.recruiterEmail && (
                  <Typography variant="caption" color="text.secondary">
                    {row.recruiterEmail}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          ),
      },
      {
        id: "clientName",
        label: "Client Name",
        render: (val) =>
          isLoading ? <Skeleton width={120} height={24} /> : val,
      },
      {
        id: "interviewLevel",
        label: "Level",
        render: (val) =>
          isLoading ? (
            <Skeleton variant="rectangular" width={100} height={24} />
          ) : (
            getInterviewLevelChip(val)
          ),
      },
      {
        id: "latestInterviewStatus",
        label: "Status",
        render: (_val, row) =>
          isLoading ? (
            <Skeleton variant="rectangular" width={100} height={24} />
          ) : (
            getStatusChip(row.latestInterviewStatus, row, dispatch)
          ),
      },
      {
        id: "interviewDateTime",
        label: "Date & Time",
        render: (val) =>
          isLoading ? (
            <Skeleton width={150} height={24} />
          ) : (
            formatDateTime(val)
          ),
      },
      {
        id: "duration",
        label: "Duration (min)",
        render: (val) =>
          isLoading ? <Skeleton width={50} height={24} /> : val,
      },
      {
        id: "zoomLink",
        label: "Meeting",
        render: (val) =>
          isLoading ? (
            <Skeleton variant="rectangular" width={120} height={24} />
          ) : val ? (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<VideoCallIcon />}
              href={val}
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
      baseColumns.push(
        {
          id: "comments",
          label: "Recruiter Comments",
          render: (_val, row) => (
            <InternalFeedbackCell
              value={row.comments}
              loading={isLoading}
              isCoordinator={false}
              candidateName={row.candidateFullName}
              type="comments"
            />
          ),
        },
        {
          id: "internalFeedback",
          label: "Internal Feedback",
          render: (_val, row) =>
            isLoading ? (
              <Skeleton width={120} height={24} />
            ) : (
              <InternalFeedbackCell
                value={row.internalFeedback}
                loading={isLoading}
                candidateName={row.candidateFullName}
                type="feedback"
              />
            ),
        },
      );
    } else {
      baseColumns.push(
        {
          id: "internalFeedback",
          label: "Internal Feedback",
          render: (_val, row) =>
            isLoading ? (
              <Skeleton width={120} height={24} />
            ) : (
              <InternalFeedbackCell
                value={row.internalFeedback}
                loading={isLoading}
                candidateName={row.candidateFullName}
              />
            ),
        },
        {
          id: "moveToBench",
          label: "Move to Bench",
          render: (_val, row) =>
            isLoading ? (
              <Skeleton variant="text" width={100} />
            ) : (
              <MoveToBench
                row={row}
                onSuccess={handleBenchSuccess}
                isLoading={moveToBenchLoading}
              />
            ),
        },
      );
    }

    // Actions column
    baseColumns.push({
      id: "actions",
      label: "Actions",
      render: (_val, row) => {
        const status = row.latestInterviewStatus?.toUpperCase();
        const showReschedule = ["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(
          status,
        );
        const showScheduleJoining = status === "SELECTED";

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {!showCoordinatorView && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleEdit(row)}
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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

  // ─── Data resolution ─────────────────────────────────────────────────────────
  const getDisplayData = () => {
    let data;
    if (showCoordinatorView) {
      data = coordinatorInterviews;
    } else {
      data = filteredData !== null ? filteredData : interviews;
    }
    return filterInterviewsByLevel(data);
  };

  const handleCoordinatorViewToggle = () => {
    setShowCoordinatorView((prev) => !prev);
    if (!showCoordinatorView && coordinatorInterviews.length === 0) {
      fetchCoordinatorInterviews();
    }
  };

  // ─── Pagination / search handlers (CustomDataTable signature) ─────────────────
  // CustomDataTable calls onPageChange(event, newPage) — same as MUI TablePagination
  const handlePageChange = (event, newPage) => {
    const validPage = validatePage(newPage);
    setPage(validPage);

    if (filteredData !== null) {
      fetchFilteredInterviews(
        filterStartDate,
        filterEndDate,
        validPage,
        rowsPerPage,
        searchQuery,
      );
    } else {
      fetchInterviews(validPage, rowsPerPage, searchQuery);
    }
  };

  // CustomDataTable calls onRowsPerPageChange(event) where event.target.value is the new size
  const handleRowsPerPageChange = (event) => {
    const newSize = validateSize(parseInt(event.target.value, 10));
    setRowsPerPage(newSize);
    setPage(0);

    if (filteredData !== null) {
      fetchFilteredInterviews(
        filterStartDate,
        filterEndDate,
        0,
        newSize,
        searchQuery,
      );
    } else {
      fetchInterviews(0, newSize, searchQuery);
    }
  };

  // CustomDataTable calls onSearchChange(event) — it passes the full event
  const handleSearchChange = (event) => {
    const value = event?.target?.value ?? "";
    setSearchQuery(value);
    setPage(0);

    if (filteredData !== null) {
      fetchFilteredInterviews(
        filterStartDate,
        filterEndDate,
        0,
        rowsPerPage,
        value,
      );
    } else {
      fetchInterviews(0, rowsPerPage, value);
    }
  };

  // CustomDataTable calls onSearchClear with no args
  const handleSearchClear = () => {
    setSearchQuery("");
    setPage(0);

    if (filteredData !== null) {
      fetchFilteredInterviews(
        filterStartDate,
        filterEndDate,
        0,
        rowsPerPage,
        "",
      );
    } else {
      fetchInterviews(0, rowsPerPage, "");
    }
  };

  const handleRefresh = () => {
    if (showCoordinatorView) {
      fetchCoordinatorInterviews();
    } else {
      fetchInterviews(page, rowsPerPage, searchQuery);
    }
  };

  // ─── Date range handlers ──────────────────────────────────────────────────────
  const handleDateChange = (startDate, endDate) => {
    if (startDate && endDate) {
      setFilterStartDate(startDate);
      setFilterEndDate(endDate);
      setPage(0);
      fetchFilteredInterviews(startDate, endDate, 0, rowsPerPage, "");
    }
  };

  const handleClearDateFilter = () => {
    setFilteredData(null);
    setFilterStartDate(null);
    setFilterEndDate(null);
    setPage(0);
    fetchInterviews(0, rowsPerPage, searchQuery);
  };

  // ─── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchInterviews(0, rowsPerPage, "");
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────────
  const tableTitle = showCoordinatorView
    ? "Coordinator Interviews"
    : levelFilter === "INTERNAL"
      ? "Internal Interviews"
      : levelFilter === "EXTERNAL"
        ? "External Interviews"
        : "Interviews Management";

  return (
    <>
      {/* Header bar */}
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
          <DateRangeFilterUtil
            onDateChange={handleDateChange}
            onClearFilter={handleClearDateFilter}
          />
        </Box>
      </Stack>

      {/* Level filter toggle */}
      {!showCoordinatorView && (
        <Box sx={{ mb: 2, display: "flex", justifyContent: "start" }}>
          <ToggleButtonGroup
            value={levelFilter}
            exclusive
            onChange={handleLevelFilterChange}
            aria-label="interview level filter"
            sx={{
              flexWrap: "wrap",
              gap: 1,
              "& .MuiToggleButton-root": {
                px: 2,
                py: 1,
                borderRadius: 1,
                border: "1px solid rgba(25, 118, 210, 0.5)",
                "&.Mui-selected": {
                  backgroundColor: "#1976d2",
                  color: "white",
                  "&:hover": { backgroundColor: "#1565c0" },
                },
                "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.08)" },
              },
            }}
          >
            <ToggleButton value="ALL">ALL</ToggleButton>
            <ToggleButton value="INTERNAL">INTERNAL</ToggleButton>
            <ToggleButton value="EXTERNAL">EXTERNAL</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Initial loading spinner (before first data arrives) */}
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
          <CustomDataTable
            title={tableTitle}
            columns={getTableColumns()}
            rows={getDisplayData()}
            total={totalCount}
            page={page}
            rowsPerPage={rowsPerPage}
            search={searchQuery}
            loading={loading || coordinatorLoading || filterLoading}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onSearchChange={handleSearchChange}
            onSearchClear={handleSearchClear}
            onRefresh={handleRefresh}
            filterStorageKey="allInterviews_filters"
          />

          {/* Edit / reschedule drawer */}
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

          {/* Delete confirm dialog */}
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

          {/* Feedback dialog */}
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
