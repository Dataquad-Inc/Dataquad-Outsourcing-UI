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
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  VideoCall as VideoCallIcon,
  SupervisorAccount as CoordinatorIcon,
} from "@mui/icons-material";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../../utils/dateformate";
import DataTablePaginated from "../muiComponents/DataTablePaginated";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { getStatusChip, getInterviewLevelChip } from "../../utils/statusUtils";
import ReusableExpandedContent from "../muiComponents/ReusableExpandedContent";
import InternalFeedbackCell from "./FeedBack";
import DownloadResume from "../../utils/DownloadResume";
import { API_BASE_URL } from "../../Services/httpService";
import InterviewFormWrapper from "./InterviewFormWrapper";
import { 
  clearCoordinatorFilter, 
  clearTeamLeadFilter,
  filterInterviewsByCoordinator,
  filterInterviewsByTeamLead
} from "../../redux/interviewSlice";

const processInterviewData = (interviews) => {
  if (!Array.isArray(interviews)) return [];
  return interviews.map((interview) => ({
    ...interview,
    interviewId: interview.interviewId || `${interview.candidateId}_${interview.jobId}`,
    interviewStatus: interview.latestInterviewStatus,
    candidateFullName:
      interview.candidateFullName ||
      interview.candidateEmailId?.split("@")[0] ||
      "Unknown Candidate",
  }));
};

const CoordinatorInterviews = () => {
  const dispatch = useDispatch();
  const { userId } = useSelector((state) => state.auth);
  const navigate = useNavigate();

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
  const [coordinatorInterviews, setCoordinatorInterviews] = useState([]);
  const [showCoordinatorView, setShowCoordinatorView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coordinatorLoading, setCoordinatorLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [editDrawer, setEditDrawer] = useState({ open: false, data: null });
  const [teamLeadId, setTeamLeadId] = useState(null);
  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    interview: null,
  });
  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Redux selectors for filtered data
  const {
    filterInterviewsForCoordinator,
    filterInterviewsForCoordinatorTotalCount,
    filterInterviewsForTeamLeadTeam,
    filterInterviewsForTeamLeadTeamTotalCount,
    isCoordinatorFilterActive,
    isTeamLeadFilterActive,
  } = useSelector((state) => state.interview);

  // Refs for preventing duplicate requests
  const initialLoadDone = useRef(false);
  const isFetching = useRef(false);
  const currentFetchId = useRef(0);

  // Derived: is date range active?
  const isDateFiltered = !!(startDate && endDate);

  // Get team lead ID for team view
  const getTeamLeadId = useCallback(async () => {
    try {
      const response = await httpService.get(
        `/users/AllAssociatedUsers?entity=US&userId=${userId}`
      );
      setTeamLeadId(response.data);
      return response.data;
    } catch (err) {
      console.error("Error fetching team lead ID:", err);
      ToastService.error("Failed to load coordinator data");
      throw err;
    }
  }, [userId]);

  // Fetch team interviews (Team View)
  const fetchTeamInterviews = useCallback(async (pageNo, size, search, forceFetch = false) => {
    if (isFetching.current && !forceFetch) return;

    const fetchId = ++currentFetchId.current;
    isFetching.current = true;

    try {
      setLoading(true);
      
      // Get team lead ID if not already available
      let leadId = teamLeadId;
      if (!leadId) {
        leadId = await getTeamLeadId();
      }
      
      let url = `/candidate/interviews/teamlead/${leadId}?page=${pageNo}&size=${size}`;
      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      
      const response = await httpService.get(url);
      const responseData = response.data;
      const teamInterviews = responseData?.teamInterviews || [];

      if (fetchId === currentFetchId.current) {
        setInterviews(processInterviewData(teamInterviews));
        setTotalCount(responseData?.teamTotalElements || 0); 
        setError(null);
      }
    } catch (err) {
      if (fetchId === currentFetchId.current) {
        console.error("Error fetching team interviews:", err);
        setError("Failed to load team interviews");
        ToastService.error("Failed to load team interviews");
      }
    } finally {
      if (fetchId === currentFetchId.current) {
        setLoading(false);
        isFetching.current = false;
      }
    }
  }, [teamLeadId, getTeamLeadId]);

  // Fetch self interviews (Self/Coordinator View)
  const fetchSelfInterviews = useCallback(async (pageNo, size, search, forceFetch = false) => {
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
      const responseData = response.data;
      
      if (fetchId === currentFetchId.current) {
        setCoordinatorInterviews(processInterviewData(responseData?.content ||[]));
        setTotalCount(responseData?.totalElements || 0);
        setError(null);
      }
    } catch (err) {
      if (fetchId === currentFetchId.current) {
        console.error("Error fetching self interviews:", err);
        setError("Failed to load self interviews");
        ToastService.error("Failed to load self interviews");
      }
    } finally {
      if (fetchId === currentFetchId.current) {
        setCoordinatorLoading(false);
        isFetching.current = false;
      }
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      if (showCoordinatorView) {
        await fetchSelfInterviews(0, 10, "");
      } else {
        await fetchTeamInterviews(0, 10, "");
      }
      initialLoadDone.current = true;
    };
    
    loadInitialData();
  }, [showCoordinatorView, fetchSelfInterviews, fetchTeamInterviews]);

  // Standard paginated fetch (skips when date filter is active)
  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (isDateFiltered) return;

    const timeoutId = setTimeout(() => {
      if (showCoordinatorView) {
        fetchSelfInterviews(page, rowsPerPage, searchText);
      } else {
        fetchTeamInterviews(page, rowsPerPage, searchText);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [page, rowsPerPage, searchText, showCoordinatorView, fetchSelfInterviews, fetchTeamInterviews, isDateFiltered]);

  // Date-range filtered fetch with pagination + search
  useEffect(() => {
    if (!startDate || !endDate) return;

    if (showCoordinatorView) {
      dispatch(
        filterInterviewsByCoordinator({
          startDate,
          endDate,
          page,
          size: rowsPerPage,
          ...(searchText && { search: searchText }),
        })
      );
    } else {
      dispatch(
        filterInterviewsByTeamLead({
          startDate,
          endDate,
          teamLeadId,
          page,
          size: rowsPerPage,
          ...(searchText && { search: searchText }),
        })
      );
    }
  }, [startDate, endDate, page, rowsPerPage, searchText, showCoordinatorView, teamLeadId, dispatch]);

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
    if (showCoordinatorView) {
      dispatch(clearCoordinatorFilter());
    } else {
      dispatch(clearTeamLeadFilter());
    }
  }, [showCoordinatorView, dispatch]);

  const handleRefresh = useCallback(() => {
    if (isDateFiltered) {
      if (showCoordinatorView) {
        dispatch(
          filterInterviewsByCoordinator({
            startDate,
            endDate,
            page,
            size: rowsPerPage,
            ...(searchText && { search: searchText }),
          })
        );
      } else {
        dispatch(
          filterInterviewsByTeamLead({
            startDate,
            endDate,
            teamLeadId,
            page,
            size: rowsPerPage,
            ...(searchText && { search: searchText }),
          })
        );
      }
      return;
    }
    
    if (showCoordinatorView) {
      fetchSelfInterviews(page, rowsPerPage, searchText, true);
    } else {
      fetchTeamInterviews(page, rowsPerPage, searchText, true);
    }
  }, [isDateFiltered, showCoordinatorView, startDate, endDate, page, rowsPerPage, searchText, teamLeadId, dispatch, fetchSelfInterviews, fetchTeamInterviews]);

  const handleToggleCoordinatorView = () => {
    setShowCoordinatorView(!showCoordinatorView);
    setPage(0);
    setSearchText("");
    setStartDate(null);
    setEndDate(null);
    // Clear filters when switching views
    if (showCoordinatorView) {
      dispatch(clearCoordinatorFilter());
    } else {
      dispatch(clearTeamLeadFilter());
    }
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

  const handleLevelFilterChange = (event, newFilter) => {
    if (newFilter !== null) setLevelFilter(newFilter);
  };

  const handleJobIdClick = (jobId) => {
    navigate(`/dashboard/requirements/job-details/${jobId}`, {
      state: { from: "/dashboard/coordinator-interviews" },
    });
  };

  const toggleRowExpansion = (interviewId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [interviewId]: !prev[interviewId],
    }));
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

  const getExpandedContentConfig = (row) => ({
    title: "Interview Details",
    description: {
      key: "notes",
      fallback: "No additional notes available.",
    },
    backgroundColor: "#f5f5f5",
    sections: [
      {
        title: "Candidate Information",
        fields: [
          { label: "Name", key: "candidateFullName", fallback: "-" },
          { label: "Email", key: "candidateEmailId", fallback: "-" },
        ],
      },
      {
        title: "Interview Details",
        fields: [
          {
            label: "Interview Date & Time",
            key: "interviewDateTime",
            fallback: "-",
            format: (value) => formatDateTime(value),
          },
          { label: "Level", key: "interviewLevel", fallback: "-" },
          { label: "Status", key: "latestInterviewStatus", fallback: "-" },
        ],
      },
    ],
    actions: [
      {
        label: "Edit Interview",
        icon: <EditIcon fontSize="small" />,
        onClick: (row) => handleEdit(row),
        variant: "outlined",
        size: "small",
        color: "primary",
      },
    ],
  });

  const renderExpandedContent = (row) => {
    if (loading || coordinatorLoading) {
      return (
        <Box sx={{ p: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2">Loading details...</Typography>
        </Box>
      );
    }
    return <ReusableExpandedContent row={row} config={getExpandedContentConfig(row)} />;
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
        key: "clientName",
        label: "Client",
        width: 150,
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
        label: "Interview Date & Time",
        width: 200,
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
        render: (row) => (
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
          )
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
            loading={loading || coordinatorLoading}
            isCoordinator={false}
            candidateName={row.candidateFullName}
            type="comments"
          />
        ),
      },
      {
        key: "internalFeedback",
        label: "Feedback",
        sortable: false,
        filterable: false,
        width: 160,
        render: (row) => (
          <InternalFeedbackCell
            value={row.internalFeedback}
            loading={loading || coordinatorLoading}
            candidateName={row.candidateFullName}
            type="feedback"
          />
        ),
      },
      {
        key: "actions",
        label: "Actions",
        width: 200,
        align: "center",
        render: (row) => {
          const status = row.latestInterviewStatus?.toUpperCase();
          const showReschedule = ["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(status);

          return (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => toggleRowExpansion(row.interviewId)}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleEdit(row)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <DownloadResume 
                candidate={{ ...row, jobId: row.jobId }}
                getDownloadUrl={(candidate, format) =>
                  `${API_BASE_URL}/candidate/download-resume/${candidate.candidateId}/${candidate.jobId}?format=${format}`
                }
              />

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
            </Box>
          );
        },
      },
    ];

    return baseColumns;
  };

  // Get display data based on view and filters
  const getDisplayData = () => {
    if (showCoordinatorView) {
      if (isDateFiltered) {
        return filterInterviewsByLevel(filterInterviewsForCoordinator);
      }
      return filterInterviewsByLevel(coordinatorInterviews);
    } else {
      if (isDateFiltered) {
        return filterInterviewsByLevel(filterInterviewsForTeamLeadTeam);
      }
      return filterInterviewsByLevel(interviews);
    }
  };

  const getTotalCount = () => {
    if (showCoordinatorView) {
      if (isDateFiltered) {
        return filterInterviewsForCoordinatorTotalCount;
      }
      return totalCount;
    } else {
      if (isDateFiltered) {
        return filterInterviewsForTeamLeadTeamTotalCount;
      }
      return totalCount;
    }
  };

  const processedData = getDisplayData();
  const displayTotalCount = getTotalCount();

  // Add expand content to rows
  const dataWithExpansion = processedData.map((row) => ({
    ...row,
    expandContent: renderExpandedContent(row),
    isExpanded: expandedRows[row.interviewId],
  }));

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
          {showCoordinatorView ? "Self View - Interviews" : "Team View - Interviews"}
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
            {showCoordinatorView ? "Team View" : "Self View"}
          </Button>
          <DateRangeFilter 
            component={showCoordinatorView ? "InterviewsForCoordinator" : "InterviewsForTeamLead"}
            onDateChange={handleDateChange}
            onClearFilter={handleClearDateFilter}
            teamLeadId={!showCoordinatorView ? teamLeadId : null}
          />
        </Box>
      </Stack>

      {/* Only show level filter buttons for Team View */}
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

      {(loading && !interviews.length && !showCoordinatorView && !isDateFiltered) ||
      (coordinatorLoading && !coordinatorInterviews.length && showCoordinatorView && !isDateFiltered) ? (
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
            data={dataWithExpansion}
            columns={getTableColumns()}
            title={showCoordinatorView ? "Self Interviews" : "Team Interviews"}
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
            uniqueId="interviewId"
            enableRowExpansion={true}
            onRowExpandToggle={toggleRowExpansion}
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

          <Dialog
            open={feedbackDialog.open}
            onClose={handleCloseFeedbackDialog}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle sx={{ px: 4, pt: 3 }}>
              Feedback for {feedbackDialog.interview?.candidateFullName || "Candidate"}
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

export default CoordinatorInterviews;