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
  ToggleButtonGroup,
  ToggleButton,
  TextField,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  Refresh as RefreshIcon,
  SupervisorAccount as CoordinatorIcon,
} from "@mui/icons-material";
import httpService, { API_BASE_URL } from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../../utils/dateformate";
import DataTablePaginated from "../muiComponents/DataTablePaginated";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { getStatusChip, getInterviewLevelChip } from "../../utils/statusUtils";
import ConfirmDialog from "../muiComponents/ConfirmDialog";
import InternalFeedbackCell from "./FeedBack";
import DownloadResume from "../../utils/DownloadResume";
import MoveToBench from "./MoveToBench";
import InterviewFormWrapper from "./InterviewFormWrapper";
import { filterInterviewsByRecruiter, clearRecruiterFilter } from "../../redux/interviewSlice";

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

const BDMInterviews = () => {
  const { userId } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState("");

  // Date filter state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Data state
  const [interviews, setInterviews] = useState([]);
  const [coordinatorInterviews, setCoordinatorInterviews] = useState([]);
  const [showCoordinatorView, setShowCoordinatorView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coordinatorLoading, setCoordinatorLoading] = useState(false);
  const [error, setError] = useState(null);
  const [moveToBenchLoading, setMoveToBenchLoading] = useState(false);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    interview: null,
  });
  const [editDrawer, setEditDrawer] = useState({
    open: false,
    data: null,
  });
  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    interview: null,
  });
  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [levelFilter, setLevelFilter] = useState("ALL");

  // Redux selectors for filtered data
  const { filterInterviewsForRecruiter, filterInterviewsForRecruiterTotalCount, isRecruiterFilterActive } = useSelector((state) => state.interview);

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
        setInterviews(processInterviewData(responseData));
        setTotalCount(responseData.length);
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

  const fetchCoordinatorInterviews = useCallback(async (pageNo, size, search, forceFetch = false) => {
    if (isFetching.current && !forceFetch) return;

    const fetchId = ++currentFetchId.current;
    isFetching.current = true;

    try {
      setCoordinatorLoading(true);
      let url = `/candidate/interviews/interviewsByUserId/${userId}?coordinator=true&page=${pageNo}&size=${size}`;
      
      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const response = await httpService.get(url);
      const responseData = response?.data?.data;

      if (fetchId === currentFetchId.current) {
        setCoordinatorInterviews(processInterviewData(responseData?.content || []));
        setTotalCount(responseData?.totalElements || 0);
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

  // Standard paginated fetch (skips when date filter is active)
  useEffect(() => {
    if (!initialLoadDone.current) return;
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

  // Date-range filtered fetch with pagination + search - Using UPDATED paginated thunk
  useEffect(() => {
    if (!startDate || !endDate) return;

    setLoading(true);
    dispatch(
      filterInterviewsByRecruiter({
        startDate,
        endDate,
        page,
        size: rowsPerPage,
        ...(searchText && { search: searchText }),
      })
    ).finally(() => setLoading(false));
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
    if (showCoordinatorView) {
      fetchCoordinatorInterviews(page, rowsPerPage, searchText, true);
    } else {
      fetchInterviews(page, rowsPerPage, searchText, true);
    }
  }, [isDateFiltered, startDate, endDate, showCoordinatorView, fetchCoordinatorInterviews, fetchInterviews, page, rowsPerPage, searchText, dispatch]);

  const handleToggleCoordinatorView = () => {
    setShowCoordinatorView(!showCoordinatorView);
    setPage(0);
    setSearchText("");
    setStartDate(null);
    setEndDate(null);
    dispatch(clearRecruiterFilter());
  };

  const filterInterviewsByLevel = (interviewsList) => {
    if (levelFilter === "ALL" || showCoordinatorView) return interviewsList;
    
    return interviewsList.filter((interview) => {
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
  };

  const handleLevelFilterChange = (event, newFilter) => {
    if (newFilter !== null) setLevelFilter(newFilter);
  };

  const handleJobIdClick = (jobId) => {
    navigate(`/dashboard/requirements/job-details/${jobId}`, {
      state: { from: "/dashboard/bdm-interviews" },
    });
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
        isCoordinatorView: showCoordinatorView,
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
      ToastService.error("Feedback cannot be empty");
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
        ToastService.success("Feedback submitted successfully!");
        handleCloseFeedbackDialog();
        handleRefresh();
      } else {
        throw new Error(response.data.message || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      ToastService.error(error.message || "Error submitting feedback");
    } finally {
      setIsSubmittingFeedback(false);
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
      {
        key: "clientName",
        label: "Client Name",
        render: (row) => row.clientName,
      },
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
        label: "Date & Time",
        width: 180,
        render: (row) => formatDateTime(row.interviewDateTime),
      },
      {
        key: "duration",
        label: "Duration (min)",
        width: 120,
        align: "center",
        render: (row) => row.duration,
      },
      {
        key: "zoomLink",
        label: "Meeting",
        width: 120,
        render: (row) => row.zoomLink ? (
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
      baseColumns.push(
        {
          key: "recruiterName",
          label: "Recruiter",
          width: 150,
          render: (row) => (
            <Tooltip title={row.recruiterEmail || ""}>
              <Typography>
                {row.recruiterName || "Unknown"}
                {row.recruiterEmail && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    {row.recruiterEmail}
                  </Typography>
                )}
              </Typography>
            </Tooltip>
          ),
        },
        {
          key: "comments",
          label: "Recruiter Comments",
          sortable: false,
          filterable: false,
          width: 160,
          render: (row) => (
            <InternalFeedbackCell
              value={row.comments}
              loading={coordinatorLoading}
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
          render: (row) => (
            <InternalFeedbackCell
              value={row.internalFeedback}
              loading={loading}
              candidateName={row.candidateFullName}
              type="feedback"
            />
          ),
        }
      );
    } else {
      baseColumns.push(
        {
          key: "internalFeedback",
          label: "Internal Feedback",
          width: 120,
          render: (row) => (
            <InternalFeedbackCell
              value={row.internalFeedback}
              loading={loading}
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
          render: (row) => (
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
        const showReschedule = ["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(status);
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
                  <EditIcon fontSize="small" />
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
                  <DeleteIcon fontSize="small" />
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
                  <EditIcon fontSize="small" />
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

  // Get display data based on view and filters
  const getDisplayData = () => {
    if (showCoordinatorView) {
      return filterInterviewsByLevel(coordinatorInterviews);
    }
    
    if (isDateFiltered) {
      return filterInterviewsByLevel(filterInterviewsForRecruiter);
    }
    
    return filterInterviewsByLevel(interviews);
  };

  const getTotalCount = () => {
    if (showCoordinatorView) {
      return totalCount;
    }
    if (isDateFiltered) {
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
        <Typography variant="h6" color="primary">
          {showCoordinatorView
            ? "Coordinator Interviews"
            : "BDM Interviews Management"}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant={showCoordinatorView ? "contained" : "outlined"}
            startIcon={<CoordinatorIcon />}
            onClick={handleToggleCoordinatorView}
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
          <DateRangeFilter
            component="bdmInterviews"
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

      {(loading && !interviews.length && !isDateFiltered) ||
      (coordinatorLoading && !coordinatorInterviews.length && showCoordinatorView) ? (
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
                : "BDM Interviews"
            }
            loading={loading || coordinatorLoading}
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
          />

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
    </Box>
  );
};

export default BDMInterviews;