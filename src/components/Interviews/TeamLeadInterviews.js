import React, { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Typography,
  Button,
  CircularProgress,
  Drawer,
  Stack,
  Tooltip,
  Tabs,
  Tab,
  Link,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  Refresh as RefreshIcon,
  People,
  Person,
  SupervisorAccount as CoordinatorIcon,
} from "@mui/icons-material";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import { useSelector, useDispatch } from "react-redux";
import DateRangeFilterUtil from "../muiComponents/DateRangeFilterUtil";
import { getStatusChip, getInterviewLevelChip } from "../../utils/statusUtils";
import ConfirmDialog from "../muiComponents/ConfirmDialog";
import { formatDateTime } from "../../utils/dateformate";
import {
  fetchInterviewsTeamLead,
  filterInterviewsByTeamLead,
} from "../../redux/interviewSlice";
import { useNavigate } from "react-router-dom";
import InternalFeedbackCell from "./FeedBack";
import { API_BASE_URL } from "../../Services/httpService";
import DownloadResume from "../../utils/DownloadResume";
import MoveToBench from "./MoveToBench";
import InterviewFormWrapper from "./InterviewFormWrapper";
import DataTablePaginated from "../muiComponents/DataTablePaginated";

const processInterviewData = (interviews) => {
  if (!Array.isArray(interviews)) return [];
  return interviews.map((interview) => {
    const interviewStatus =
      interview.interviewStatus ||
      interview.latestInterviewStatus ||
      "SCHEDULED";
    return {
      ...interview,
      interviewId:
        interview.interviewId || `${interview.candidateId}_${interview.jobId}`,
      interviewStatus,
    };
  });
};

const TeamLeadInterviews = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    interview: null,
  });
  const [editDrawer, setEditDrawer] = useState({ open: false, data: null });
  const [showCoordinatorView, setShowCoordinatorView] = useState(false);
  const [coordinatorInterviews, setCoordinatorInterviews] = useState([]);
  const [coordinatorLoading, setCoordinatorLoading] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    interview: null,
  });
  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [moveToBenchLoading, setMoveToBenchLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userId } = useSelector((state) => state.auth);
  const { selfInterviewsTL, teamInterviewsTL } = useSelector(
    (state) => state.interview,
  );

  // ─── Regular view pagination state ───────────────────────────────────────
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Coordinator view pagination state ───────────────────────────────────
  const [coordPage, setCoordPage] = useState(0);
  const [coordRowsPerPage, setCoordRowsPerPage] = useState(10);
  const [coordTotalCount, setCoordTotalCount] = useState(0);
  const [coordSearchQuery, setCoordSearchQuery] = useState("");

  // ─── Date-range filter state — Regular view (My/Team tabs) ───────────────
  const [regularFilteredData, setRegularFilteredData] = useState(null);
  const [regularFilterLoading, setRegularFilterLoading] = useState(false);
  const [regularFilterStartDate, setRegularFilterStartDate] = useState(null);
  const [regularFilterEndDate, setRegularFilterEndDate] = useState(null);

  // ─── Date-range filter state — Coordinator view ───────────────────────────
  const [coordFilteredData, setCoordFilteredData] = useState(null);
  const [coordFilterLoading, setCoordFilterLoading] = useState(false);
  const [coordFilterStartDate, setCoordFilterStartDate] = useState(null);
  const [coordFilterEndDate, setCoordFilterEndDate] = useState(null);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const validatePage = (n) => {
    const num = Number(n);
    return !isNaN(num) && num >= 0 ? num : 0;
  };
  const validateSize = (n) => {
    const num = Number(n);
    return !isNaN(num) && num > 0 ? num : 10;
  };

  // ─── Fetch: My Interviews & Team Interviews ───────────────────────────────
  const fetchInterviews = async (
    pageNum = 0,
    pageSize = rowsPerPage,
    searchText = "",
  ) => {
    const validPage = validatePage(pageNum);
    const validSize = validateSize(pageSize);

    const params = new URLSearchParams({
      page: validPage,
      size: validSize,
      ...(searchText && { searchText }),
    });

    try {
      setLoading(true);
      const result = await dispatch(fetchInterviewsTeamLead(params)).unwrap();
      console.log('log result from the teamlead interviews =====',result );

      const total = result.length;

      setTotalCount(total);
      setError(null);
    } catch (err) {
      setError("Failed to fetch interview data");
      console.error("Error fetching interviews:", err);
      ToastService.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch: date-range filtered — Regular view ───────────────────────────
  const fetchRegularFilteredInterviews = async (
    startDate,
    endDate,
    pageNum = 0,
    pageSize = rowsPerPage,
    searchText = searchQuery,
  ) => {
    const validPage = validatePage(pageNum);
    const validSize = validateSize(pageSize);

    try {
      setRegularFilterLoading(true);
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

      setRegularFilteredData(data);
      setTotalCount(response.data.data.length );
    } catch (err) {
      console.error("Error fetching filtered interviews:", err);
      ToastService.error("Failed to filter interviews");
    } finally {
      setRegularFilterLoading(false);
    }
  };

  // ─── Fetch: Coordinator Interviews ───────────────────────────────────────
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
        `/candidate/interviews/interviewsByUserId/${userId}?${params}`,
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

      const total = responseData?.length;
      setCoordTotalCount(total);
      setError(null);
    } catch (error) {
      console.error("Error fetching coordinator interviews:", error);
      ToastService.error("Failed to load coordinator interviews");
    } finally {
      setCoordinatorLoading(false);
    }
  };

  // ─── Fetch: date-range filtered — Coordinator view ───────────────────────
  const fetchCoordFilteredInterviews = async (
    startDate,
    endDate,
    pageNum = 0,
    pageSize = coordRowsPerPage,
    searchText = coordSearchQuery,
  ) => {
    const validPage = validatePage(pageNum);
    const validSize = validateSize(pageSize);

    try {
      setCoordFilterLoading(true);
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

      setCoordFilteredData(data);
      setCoordTotalCount(response.data.length || 0);
    } catch (err) {
      console.error("Error fetching filtered coordinator interviews:", err);
      ToastService.error("Failed to filter interviews");
    } finally {
      setCoordFilterLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews(0, rowsPerPage, "");
  }, [userId]);

  // ─── Date-range handlers — Regular view ──────────────────────────────────
  const handleRegularDateChange = (startDate, endDate) => {
    if (startDate && endDate) {
      setRegularFilterStartDate(startDate);
      setRegularFilterEndDate(endDate);
      setPage(0);
      fetchRegularFilteredInterviews(startDate, endDate, 0, rowsPerPage, "");
    }
  };

  const handleClearRegularDateFilter = () => {
    setRegularFilteredData(null);
    setRegularFilterStartDate(null);
    setRegularFilterEndDate(null);
    setPage(0);
    fetchInterviews(0, rowsPerPage, searchQuery);
  };

  // ─── Date-range handlers — Coordinator view ───────────────────────────────
  const handleCoordDateChange = (startDate, endDate) => {
    if (startDate && endDate) {
      setCoordFilterStartDate(startDate);
      setCoordFilterEndDate(endDate);
      setCoordPage(0);
      fetchCoordFilteredInterviews(startDate, endDate, 0, coordRowsPerPage, "");
    }
  };

  const handleClearCoordDateFilter = () => {
    setCoordFilteredData(null);
    setCoordFilterStartDate(null);
    setCoordFilterEndDate(null);
    setCoordPage(0);
    fetchCoordinatorInterviews(0, coordRowsPerPage, coordSearchQuery);
  };

  // ─── Coordinator toggle ───────────────────────────────────────────────────
  const handleCoordinatorViewToggle = () => {
    const nextView = !showCoordinatorView;
    setShowCoordinatorView(nextView);
    if (nextView) {
      setCoordPage(0);
      setCoordSearchQuery("");
      setCoordFilteredData(null);
      setCoordFilterStartDate(null);
      setCoordFilterEndDate(null);
      fetchCoordinatorInterviews(0, coordRowsPerPage, "");
    } else {
      setRegularFilteredData(null);
      setRegularFilterStartDate(null);
      setRegularFilterEndDate(null);
    }
  };

  // ─── Tab change: reset regular pagination & clear date filter ────────────
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setSearchQuery("");
    setRegularFilteredData(null);
    setRegularFilterStartDate(null);
    setRegularFilterEndDate(null);
    fetchInterviews(0, rowsPerPage, "");
  };

  const handleLevelFilterChange = (event, newFilter) => {
    if (newFilter !== null) setLevelFilter(newFilter);
  };

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

  // ─── Regular view pagination handlers ────────────────────────────────────
  const handlePageChange = (newPage, newRowsPerPage) => {
    const validPage = validatePage(newPage);
    setPage(validPage);

    if (regularFilteredData !== null) {
      fetchRegularFilteredInterviews(
        regularFilterStartDate,
        regularFilterEndDate,
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

    if (regularFilteredData !== null) {
      fetchRegularFilteredInterviews(
        regularFilterStartDate,
        regularFilterEndDate,
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

    if (regularFilteredData !== null) {
      fetchRegularFilteredInterviews(
        regularFilterStartDate,
        regularFilterEndDate,
        newPage,
        newSize,
        value,
      );
    } else {
      fetchInterviews(newPage, newSize, value);
    }
  };

  // ─── Coordinator view pagination handlers ─────────────────────────────────
  const handleCoordPageChange = (newPage, newRowsPerPage) => {
    const validPage = validatePage(newPage);
    setCoordPage(validPage);

    if (coordFilteredData !== null) {
      fetchCoordFilteredInterviews(
        coordFilterStartDate,
        coordFilterEndDate,
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

    if (coordFilteredData !== null) {
      fetchCoordFilteredInterviews(
        coordFilterStartDate,
        coordFilterEndDate,
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

    if (coordFilteredData !== null) {
      fetchCoordFilteredInterviews(
        coordFilterStartDate,
        coordFilterEndDate,
        newPage,
        newSize,
        value,
      );
    } else {
      fetchCoordinatorInterviews(newPage, newSize, value);
    }
  };

  const handleCloseEditDrawer = () =>
    setEditDrawer({ open: false, data: null });

  const handleJobIdClick = (jobId) => {
    navigate(`/dashboard/requirements/job-details/${jobId}`, {
      state: { from: "/dashboard/interviews" },
    });
  };

  const handleInterviewUpdated = () => {
    fetchInterviews(page, rowsPerPage, searchQuery);
    handleCloseEditDrawer();
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
      await fetchInterviews(page, rowsPerPage, searchQuery);
      ToastService.update(toastId, "Interview deleted successfully", "success");
    } catch (error) {
      ToastService.error("Failed to delete interview");
      console.error("Error deleting interview:", error);
    } finally {
      setConfirmDialog({ open: false, interview: null });
    }
  };

  const handleBenchSuccess = (row) => {
    if (showCoordinatorView) {
      setCoordinatorInterviews((prev) =>
        prev.filter((item) => item.submissionId !== row.submissionId),
      );
    } else {
      if (activeTab === 0) {
        dispatch(
          filterInterviewsByTeamLead({
            selfInterviews: selfInterviewsTL.filter(
              (item) => item.submissionId !== row.submissionId,
            ),
            teamInterviews: teamInterviewsTL,
          }),
        );
      } else {
        dispatch(
          filterInterviewsByTeamLead({
            selfInterviews: selfInterviewsTL,
            teamInterviews: teamInterviewsTL.filter(
              (item) => item.submissionId !== row.submissionId,
            ),
          }),
        );
      }
    }
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

  // ─── Columns ──────────────────────────────────────────────────────────────
  const getTableColumns = () => {
    const baseColumns = [
      {
        key: "jobId",
        label: "Job ID",
        sortable: true,
        filterable: true,
        width: 120,
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
        sortable: true,
        filterable: true,
        width: 120,
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
        render: (row) =>
          getStatusChip(row.latestInterviewStatus, row, dispatch),
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
    ];

    if (showCoordinatorView) {
      baseColumns.push(
        {
          key: "comments",
          label: "Recruiter Comments",
          width: 120,
          render: (row) => (
            <InternalFeedbackCell
              value={row.comments}
              loading={loading || coordinatorLoading}
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
              loading={loading || coordinatorLoading}
              candidateName={row.candidateFullName}
              type="feedback"
            />
          ),
        },
      );
    } else {
      baseColumns.push({
        key: "internalFeedback",
        label: "Internal Feedback",
        width: 120,
        render: (row) => (
          <InternalFeedbackCell
            value={row.internalFeedback}
            loading={loading || coordinatorLoading}
            candidateName={row.candidateFullName}
            type="feedback"
          />
        ),
      });
    }

    baseColumns.push({
      key: "actions",
      label: "Actions",
      width: 200,
      render: (row) => {
        const status = row.latestInterviewStatus?.toUpperCase();
        const showReschedule = ["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(
          status,
        );
        const showScheduleJoining = status === "SELECTED";

        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            {!showCoordinatorView && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleEdit(row)}
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

  // ─── Display data resolution ──────────────────────────────────────────────
  const processedSelfInterviews = processInterviewData(selfInterviewsTL || []);
  const processedTeamInterviews = processInterviewData(teamInterviewsTL || []);

  let displayData = [];
  let tableTitle = "Interviews";

  if (showCoordinatorView) {
    const raw =
      coordFilteredData !== null ? coordFilteredData : coordinatorInterviews;
    displayData = filterInterviewsByLevel(raw);
    tableTitle = "Coordinator Interviews";
  } else {
    const raw =
      regularFilteredData !== null
        ? regularFilteredData
        : activeTab === 0
          ? processedSelfInterviews
          : processedTeamInterviews;
    displayData = filterInterviewsByLevel(raw);
    tableTitle =
      levelFilter === "INTERNAL"
        ? "Internal Interviews"
        : levelFilter === "EXTERNAL"
          ? "External Interviews"
          : activeTab === 0
            ? "My Interviews"
            : "Team Interviews";
  }

  const isActiveFilterLoading = showCoordinatorView
    ? coordFilterLoading
    : regularFilterLoading;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 1 }}>
      {loading &&
      selfInterviewsTL.length === 0 &&
      teamInterviewsTL.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress sx={{ color: "#1976d2" }} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography color="error">{error}</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchInterviews()}
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
              Team Lead Interviews
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Button
                variant={showCoordinatorView ? "contained" : "outlined"}
                startIcon={<CoordinatorIcon />}
                onClick={handleCoordinatorViewToggle}
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
                {showCoordinatorView ? "Regular View" : "Coordinator View"}
              </Button>

              {/* ── DateRangeFilterUtil — switches callbacks per active view ── */}
              {showCoordinatorView ? (
                <DateRangeFilterUtil
                  key="coord-filter"
                  onDateChange={handleCoordDateChange}
                  onClearFilter={handleClearCoordDateFilter}
                />
              ) : (
                <DateRangeFilterUtil
                  key="regular-filter"
                  onDateChange={handleRegularDateChange}
                  onClearFilter={handleClearRegularDateFilter}
                />
              )}
            </Box>
          </Stack>

          {/* ── Level filter toggle ── */}
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

          {/* ── Tabs (regular view only) ── */}
          {!showCoordinatorView && (
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Person fontSize="small" />
                      <span>
                        My Interviews (
                        {
                          filterInterviewsByLevel(processedSelfInterviews)
                            .length
                        }
                        )
                      </span>
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <People fontSize="small" />
                      <span>
                        Team Interviews (
                        {
                          filterInterviewsByLevel(processedTeamInterviews)
                            .length
                        }
                        )
                      </span>
                    </Box>
                  }
                />
              </Tabs>
            </Box>
          )}

          <DataTablePaginated
            data={displayData}
            columns={getTableColumns()}
            title={tableTitle}
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
            loading={loading || coordinatorLoading || isActiveFilterLoading}
            serverSide={true}
            totalCount={showCoordinatorView ? coordTotalCount : totalCount}
            page={showCoordinatorView ? coordPage : page}
            rowsPerPage={showCoordinatorView ? coordRowsPerPage : rowsPerPage}
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
              <InterviewFormWrapper
                formType={editDrawer.data.formType || "edit"}
                data={editDrawer.data}
                onClose={handleCloseEditDrawer}
                onSuccess={handleInterviewUpdated}
                showCoordinatorView={showCoordinatorView}
              />
            )}
          </Drawer>

          {/* ── Delete confirm dialog ── */}
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
        </>
      )}
    </Box>
  );
};

export default TeamLeadInterviews;
