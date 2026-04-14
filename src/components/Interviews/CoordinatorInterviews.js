import React, { useState, useEffect } from "react";
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
import DateRangeFilterUtil from "../muiComponents/DateRangeFilterUtil";
import { getStatusChip, getInterviewLevelChip } from "../../utils/statusUtils";
import ReusableExpandedContent from "../muiComponents/ReusableExpandedContent";
import InternalFeedbackCell from "./FeedBack";
import DownloadResume from "../../utils/DownloadResume";
import { API_BASE_URL } from "../../Services/httpService";
import EditInterviewForm from "./EditInterviewForm";
import DataTablePaginated from "../muiComponents/DataTablePaginated";

const processInterviewData = (interviews) => {
  if (!Array.isArray(interviews)) return [];
  return interviews.map((interview) => ({
    ...interview,
    interviewId:
      interview.interviewId || `${interview.candidateId}_${interview.jobId}`,
    interviewStatus: interview.latestInterviewStatus,
  }));
};

const CoordinatorInterviews = () => {
  const dispatch = useDispatch();
  const { userId } = useSelector((state) => state.auth);

  // ─── Date-range filter state — Team View ──────────────────────────────────
  const [teamFilteredData, setTeamFilteredData] = useState(null);
  const [teamFilterLoading, setTeamFilterLoading] = useState(false);
  const [teamFilterStartDate, setTeamFilterStartDate] = useState(null);
  const [teamFilterEndDate, setTeamFilterEndDate] = useState(null);

  // ─── Date-range filter state — Self View ──────────────────────────────────
  const [selfFilteredData, setSelfFilteredData] = useState(null);
  const [selfFilterLoading, setSelfFilterLoading] = useState(false);
  const [selfFilterStartDate, setSelfFilterStartDate] = useState(null);
  const [selfFilterEndDate, setSelfFilterEndDate] = useState(null);

  const [interviews, setInterviews] = useState([]);
  const [coordinatorInterviews, setCoordinatorInterviews] = useState([]);
  const [showCoordinatorView, setShowCoordinatorView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coordinatorLoading, setCoordinatorLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    interview: null,
  });
  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [editDrawer, setEditDrawer] = useState({ open: false, data: null });
  const [teamLeadId, setTeamLeadId] = useState(null);
  const navigate = useNavigate();

  // ─── Team view pagination state ───────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Self view pagination state ───────────────────────────────────────────
  const [coordPage, setCoordPage] = useState(0);
  const [coordRowsPerPage, setCoordRowsPerPage] = useState(10);
  const [coordTotalCount, setCoordTotalCount] = useState(0);
  const [coordSearchQuery, setCoordSearchQuery] = useState("");

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const validatePage = (n) => {
    const num = Number(n);
    return !isNaN(num) && num >= 0 ? num : 0;
  };
  const validateSize = (n) => {
    const num = Number(n);
    return !isNaN(num) && num > 0 ? num : 10;
  };

  // ─── Team lead ID ─────────────────────────────────────────────────────────
  const getTeamLeadId = async () => {
    try {
      const response = await httpService.get(
        `/users/AllAssociatedUsers?entity=US&userId=${userId}`,
      );
      setTeamLeadId(response.data);
      return response.data;
    } catch (err) {
      console.error("Error fetching team lead ID:", err);
      ToastService.error("Failed to load coordinator data");
      throw err;
    }
  };

  // ─── Fetch: Team View ─────────────────────────────────────────────────────
  const fetchInterviews = async (
    pageNum = 0,
    pageSize = rowsPerPage,
    searchText = "",
  ) => {
    const validPage = validatePage(pageNum);
    const validSize = validateSize(pageSize);

    try {
      setLoading(true);
      const resolvedTeamLeadId = await getTeamLeadId();

      const params = new URLSearchParams({
        page: validPage,
        size: validSize,
        ...(searchText && { searchText }),
      });

      const response = await httpService.get(
        `/candidate/interviews/teamlead/${resolvedTeamLeadId}?${params}`,
      );

      const responseData = response.data;
      const teamInterviews =
        responseData?.data?.content ||
        responseData?.teamInterviews ||
        responseData?.data ||
        responseData?.content ||
        [];
      setInterviews(processInterviewData(teamInterviews));

      const total =
        responseData?.data?.totalElements ??
        responseData?.totalElements ??
        responseData?.data?.totalCount ??
        responseData?.totalCount ??
        0;
      setTotalCount(total);
      setError(null);
    } catch (err) {
      console.error("Error fetching interviews:", err);
      ToastService.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch: date-range filtered — Team View ───────────────────────────────
  const fetchTeamFilteredInterviews = async (
    startDate,
    endDate,
    pageNum = 0,
    pageSize = rowsPerPage,
    searchText = searchQuery,
  ) => {
    const validPage = validatePage(pageNum);
    const validSize = validateSize(pageSize);

    try {
      setTeamFilterLoading(true);
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

      setTeamFilteredData(data);
      setTotalCount(response.data?.totalElements || 0);
    } catch (err) {
      console.error("Error fetching filtered interviews:", err);
      ToastService.error("Failed to filter interviews");
    } finally {
      setTeamFilterLoading(false);
    }
  };

  // ─── Fetch: Self View ─────────────────────────────────────────────────────
  const fetchCoordinatorInterviews = async (
    pageNum = 0,
    pageSize = coordRowsPerPage,
    searchText = "",
  ) => {
    const validPage = validatePage(pageNum);
    const validSize = validateSize(pageSize);

    const params = new URLSearchParams({
      page: validPage,
      size: validSize,
      coordinator: true,
      ...(searchText && { searchText }),
    });

    try {
      setCoordinatorLoading(true);
      const response = await httpService.get(
        `/candidate/interviews/interviewsByUserId/${userId}?${params.toString()}`,
      );

      const responseData = response.data;
      setCoordinatorInterviews(
        processInterviewData(
          responseData?.data?.content ||
            responseData?.data ||
            responseData?.content ||
            responseData ||
            [],
        ),
      );

      const total =
        responseData?.data?.totalElements ??
        responseData?.totalElements ??
        responseData?.data?.totalCount ??
        responseData?.totalCount ??
        0;
      setCoordTotalCount(total);
      setError(null);
    } catch (err) {
      console.error("Error fetching coordinator interviews:", err);
      ToastService.error("Failed to load coordinator interviews");
    } finally {
      setCoordinatorLoading(false);
    }
  };

  // ─── Fetch: date-range filtered — Self View ───────────────────────────────
  const fetchSelfFilteredInterviews = async (
    startDate,
    endDate,
    pageNum = 0,
    pageSize = coordRowsPerPage,
    searchText = coordSearchQuery,
  ) => {
    const validPage = validatePage(pageNum);
    const validSize = validateSize(pageSize);

    try {
      setSelfFilterLoading(true);
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

      setSelfFilteredData(data);
      setCoordTotalCount(response.data?.totalElements || 0);
    } catch (err) {
      console.error("Error fetching filtered self interviews:", err);
      ToastService.error("Failed to filter interviews");
    } finally {
      setSelfFilterLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews(0, rowsPerPage, "");
  }, [userId]);

  // ─── Toggle view: reset self-view pagination & clear its date filter ──────
  const handleToggleCoordinatorView = () => {
    const nextView = !showCoordinatorView;
    setShowCoordinatorView(nextView);
    if (nextView) {
      setCoordPage(0);
      setCoordSearchQuery("");
      setSelfFilteredData(null);
      setSelfFilterStartDate(null);
      setSelfFilterEndDate(null);
      fetchCoordinatorInterviews(0, coordRowsPerPage, "");
    } else {
      // switching back to team view — clear team filter
      setTeamFilteredData(null);
      setTeamFilterStartDate(null);
      setTeamFilterEndDate(null);
    }
  };

  // ─── Date-range handlers — Team View ─────────────────────────────────────
  const handleTeamDateChange = (startDate, endDate) => {
    if (startDate && endDate) {
      setTeamFilterStartDate(startDate);
      setTeamFilterEndDate(endDate);
      setPage(0);
      fetchTeamFilteredInterviews(startDate, endDate, 0, rowsPerPage, "");
    }
  };

  const handleClearTeamDateFilter = () => {
    setTeamFilteredData(null);
    setTeamFilterStartDate(null);
    setTeamFilterEndDate(null);
    setPage(0);
    fetchInterviews(0, rowsPerPage, searchQuery);
  };

  // ─── Date-range handlers — Self View ─────────────────────────────────────
  const handleSelfDateChange = (startDate, endDate) => {
    if (startDate && endDate) {
      setSelfFilterStartDate(startDate);
      setSelfFilterEndDate(endDate);
      setCoordPage(0);
      fetchSelfFilteredInterviews(startDate, endDate, 0, coordRowsPerPage, "");
    }
  };

  const handleClearSelfDateFilter = () => {
    setSelfFilteredData(null);
    setSelfFilterStartDate(null);
    setSelfFilterEndDate(null);
    setCoordPage(0);
    fetchCoordinatorInterviews(0, coordRowsPerPage, coordSearchQuery);
  };

  // ─── Level filter ─────────────────────────────────────────────────────────
  const filterInterviewsByLevel = (data) => {
    if (levelFilter === "ALL") return data;
    return data.filter((interview) => {
      if (levelFilter === "INTERNAL")
        return interview.interviewLevel === "INTERNAL";
      if (levelFilter === "EXTERNAL")
        return interview.interviewLevel !== "INTERNAL";
      if (levelFilter === "L1") return interview.interviewLevel === "L1";
      if (levelFilter === "L2") return interview.interviewLevel === "L2";
      if (levelFilter === "L3") return interview.interviewLevel === "L3";
      return false;
    });
  };

  const handleLevelFilterChange = (event, newFilter) => {
    if (newFilter !== null) setLevelFilter(newFilter);
  };

  const handleJobIdClick = (jobId) => {
    navigate(`/dashboard/requirements/job-details/${jobId}`);
  };

  const toggleRowExpansion = (interviewId) => {
    setExpandedRows((prev) => ({ ...prev, [interviewId]: !prev[interviewId] }));
  };

  // ─── Feedback handlers ────────────────────────────────────────────────────
  const handleOpenFeedbackDialog = (interview) => {
    setFeedbackDialog({ open: true, interview });
    setFeedback(interview.internalFeedback || "");
  };

  const handleCloseFeedbackDialog = () => {
    setFeedbackDialog({ open: false, interview: null });
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
      if (!interview || !interview.interviewId)
        throw new Error("Missing interview data");

      const response = await httpService.put(
        `/candidate/updateInterviewByCoordinator/${userId}/${interview.interviewId}`,
        { internalFeedBack: feedback },
      );

      if (response.data.success) {
        ToastService.success("Feedback submitted successfully!");
        handleCloseFeedbackDialog();
        if (showCoordinatorView) {
          fetchCoordinatorInterviews(
            coordPage,
            coordRowsPerPage,
            coordSearchQuery,
          );
        } else {
          fetchInterviews(page, rowsPerPage, searchQuery);
        }
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

  // ─── Edit handlers ────────────────────────────────────────────────────────
  const handleEdit = (row, isReschedule = false) => {
    setEditDrawer({ open: true, data: { ...row, isReschedule } });
  };

  const handleCloseEditDrawer = () =>
    setEditDrawer({ open: false, data: null });

  const handleInterviewUpdated = () => {
    if (showCoordinatorView) {
      fetchCoordinatorInterviews(coordPage, coordRowsPerPage, coordSearchQuery);
    } else {
      fetchInterviews(page, rowsPerPage, searchQuery);
    }
    handleCloseEditDrawer();
  };

  // ─── Team view pagination handlers ───────────────────────────────────────
  const handlePageChange = (newPage, newRowsPerPage) => {
    const validPage = validatePage(newPage);
    setPage(validPage);

    if (teamFilteredData !== null) {
      fetchTeamFilteredInterviews(
        teamFilterStartDate,
        teamFilterEndDate,
        validPage,
        newRowsPerPage ?? rowsPerPage,
        searchQuery,
      );
    } else {
      fetchInterviews(validPage, newRowsPerPage ?? rowsPerPage, searchQuery);
    }
  };

  const handleRowsPerPageChange = (newSize) => {
    const validSize = validateSize(newSize);
    setRowsPerPage(validSize);
    setPage(0);

    if (teamFilteredData !== null) {
      fetchTeamFilteredInterviews(
        teamFilterStartDate,
        teamFilterEndDate,
        0,
        validSize,
        searchQuery,
      );
    } else {
      fetchInterviews(0, validSize, searchQuery);
    }
  };

  const handleSearchChange = (value, newPage = 0, newSize = rowsPerPage) => {
    setSearchQuery(value);
    setPage(newPage);

    if (teamFilteredData !== null) {
      fetchTeamFilteredInterviews(
        teamFilterStartDate,
        teamFilterEndDate,
        newPage,
        newSize,
        value,
      );
    } else {
      fetchInterviews(newPage, newSize, value);
    }
  };

  // ─── Self view pagination handlers ───────────────────────────────────────
  const handleCoordPageChange = (newPage, newRowsPerPage) => {
    const validPage = validatePage(newPage);
    setCoordPage(validPage);

    if (selfFilteredData !== null) {
      fetchSelfFilteredInterviews(
        selfFilterStartDate,
        selfFilterEndDate,
        validPage,
        newRowsPerPage ?? coordRowsPerPage,
        coordSearchQuery,
      );
    } else {
      fetchCoordinatorInterviews(
        validPage,
        newRowsPerPage ?? coordRowsPerPage,
        coordSearchQuery,
      );
    }
  };

  const handleCoordRowsPerPageChange = (newSize) => {
    const validSize = validateSize(newSize);
    setCoordRowsPerPage(validSize);
    setCoordPage(0);

    if (selfFilteredData !== null) {
      fetchSelfFilteredInterviews(
        selfFilterStartDate,
        selfFilterEndDate,
        0,
        validSize,
        coordSearchQuery,
      );
    } else {
      fetchCoordinatorInterviews(0, validSize, coordSearchQuery);
    }
  };

  const handleCoordSearchChange = (
    value,
    newPage = 0,
    newSize = coordRowsPerPage,
  ) => {
    setCoordSearchQuery(value);
    setCoordPage(newPage);

    if (selfFilteredData !== null) {
      fetchSelfFilteredInterviews(
        selfFilterStartDate,
        selfFilterEndDate,
        newPage,
        newSize,
        value,
      );
    } else {
      fetchCoordinatorInterviews(newPage, newSize, value);
    }
  };

  // ─── Display data resolution ──────────────────────────────────────────────
  const getDisplayData = () => {
    if (showCoordinatorView) {
      const data =
        selfFilteredData !== null ? selfFilteredData : coordinatorInterviews;
      return data;
    } else {
      const data =
        teamFilteredData !== null ? teamFilteredData : interviews;
      return filterInterviewsByLevel(data);
    }
  };

  // ─── Expanded content ─────────────────────────────────────────────────────
  const getExpandedContentConfig = (row) => ({
    title: "Interview Details",
    description: { key: "notes", fallback: "No additional notes available." },
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
    return (
      <ReusableExpandedContent
        row={row}
        config={getExpandedContentConfig(row)}
      />
    );
  };

  // ─── Columns ──────────────────────────────────────────────────────────────
  const columns = [
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
    },
    {
      key: "technology",
      label: "Technologies",
      width: 180,
      sortable: true,
      render: (row) => row.technology,
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
    { key: "recruiterName", label: "Recruiter", width: 120 },
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
      render: (row) => getStatusChip(row.latestInterviewStatus, row),
    },
    {
      key: "interviewDateTime",
      label: "Interview Date & Time",
      width: 200,
      render: (row) => formatDateTime(row.interviewDateTime),
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
      label: "FeedBack",
      sortable: false,
      filterable: false,
      width: 160,
      render: (row) => (
        <InternalFeedbackCell
          value={row.internalFeedback}
          loading={loading || coordinatorLoading}
          isCoordinator={false}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: 200,
      render: (row) => (
        <Box sx={{ display: "flex", gap: 1 }}>
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
        </Box>
      ),
    },
  ];

  const isActiveFilterLoading = showCoordinatorView
    ? selfFilterLoading
    : teamFilterLoading;

  const processedData =
    loading || coordinatorLoading || isActiveFilterLoading
      ? []
      : getDisplayData().map((row) => ({
          ...row,
          expandContent: renderExpandedContent(row),
          isExpanded: expandedRows[row.interviewId],
        }));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 1 }}>
      {(loading && interviews.length === 0 && !showCoordinatorView) ||
      (coordinatorLoading &&
        coordinatorInterviews.length === 0 &&
        showCoordinatorView) ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress sx={{ color: "#1976d2" }} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography color="error">{error}</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={
              showCoordinatorView ? fetchCoordinatorInterviews : fetchInterviews
            }
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
          {/* ── Header bar ── */}
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
                ? "Self View - Interviews"
                : "Team View - Interviews"}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Button
                variant={showCoordinatorView ? "contained" : "outlined"}
                startIcon={<CoordinatorIcon />}
                onClick={handleToggleCoordinatorView}
                sx={{
                  color: showCoordinatorView ? "white" : "#1976d2",
                  borderColor: "#1976d2",
                  backgroundColor: showCoordinatorView
                    ? "#1976d2"
                    : "transparent",
                  "&:hover": {
                    borderColor: "#1565c0",
                    backgroundColor: showCoordinatorView
                      ? "#1565c0"
                      : "#e3f2fd",
                  },
                }}
              >
                {showCoordinatorView ? "Team View" : "Self View"}
              </Button>

              {/* ── DateRangeFilterUtil — switches callbacks per active view ── */}
              {showCoordinatorView ? (
                <DateRangeFilterUtil
                  key="self-filter"
                  onDateChange={handleSelfDateChange}
                  onClearFilter={handleClearSelfDateFilter}
                />
              ) : (
                <DateRangeFilterUtil
                  key="team-filter"
                  onDateChange={handleTeamDateChange}
                  onClearFilter={handleClearTeamDateFilter}
                />
              )}
            </Box>
          </Stack>

          {/* ── Level filter toggle (Team View only) ── */}
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
                      "&:hover": { backgroundColor: "#1565c0" },
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

          <DataTablePaginated
            data={processedData || []}
            columns={columns}
            title={showCoordinatorView ? "Self Interviews" : "Team Interviews"}
            enableSelection={false}
            defaultSortColumn="interviewDateTime"
            defaultSortDirection="desc"
            defaultRowsPerPage={10}
            refreshData={
              showCoordinatorView ? fetchCoordinatorInterviews : fetchInterviews
            }
            primaryColor="#1976d2"
            secondaryColor="#e3f2fd"
            customStyles={{
              headerBackground: "#1976d2",
              rowHover: "#f5f5f5",
              selectedRow: "#e3f2fd",
            }}
            uniqueId="interviewId"
            enableRowExpansion={true}
            onRowExpandToggle={toggleRowExpansion}
            loading={loading || coordinatorLoading || isActiveFilterLoading}
            serverSide={true}
            totalCount={showCoordinatorView ? coordTotalCount : totalCount}
            page={showCoordinatorView ? coordPage : page}
            rowsPerPage={
              showCoordinatorView ? coordRowsPerPage : rowsPerPage
            }
            onPageChange={
              showCoordinatorView ? handleCoordPageChange : handlePageChange
            }
            onRowsPerPageChange={
              showCoordinatorView
                ? handleCoordRowsPerPageChange
                : handleRowsPerPageChange
            }
            onSearchChange={
              showCoordinatorView ? handleCoordSearchChange : handleSearchChange
            }
          />

          {/* ── Feedback dialog ── */}
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

          {/* ── Edit drawer ── */}
          <Drawer
            anchor="right"
            open={editDrawer.open}
            onClose={handleCloseEditDrawer}
            PaperProps={{
              sx: { width: { xs: "60%", sm: "50%", md: "50%" } },
            }}
          >
            {editDrawer.data && (
              <EditInterviewForm
                data={editDrawer.data}
                onClose={handleCloseEditDrawer}
                onSuccess={handleInterviewUpdated}
              />
            )}
          </Drawer>
        </>
      )}
    </Box>
  );
};

export default CoordinatorInterviews;