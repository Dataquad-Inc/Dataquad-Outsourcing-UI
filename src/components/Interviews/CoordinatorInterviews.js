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
import DataTable from "../muiComponents/DataTabel";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { getStatusChip, getInterviewLevelChip } from "../../utils/statusUtils";
import ReusableExpandedContent from "../muiComponents/ReusableExpandedContent";
import InternalFeedbackCell from "./FeedBack";
import DownloadResume from "../../utils/DownloadResume";
import { API_BASE_URL } from "../../Services/httpService";
import EditInterviewForm from "./EditInterviewForm";
import { clearCoordinatorFilter, clearTeamLeadFilter } from "../../redux/interviewSlice";

const processInterviewData = (interviews) => {
  if (!Array.isArray(interviews)) return [];
  return interviews.map((interview) => ({
    ...interview,
    interviewId: interview.interviewId || `${interview.candidateId}_${interview.jobId}`,
    interviewStatus: interview.latestInterviewStatus,
  }));
};

const CoordinatorInterviews = () => {
  const dispatch = useDispatch();
  const { userId } = useSelector((state) => state.auth);
  const {
    isFilteredDataRequested,
    filterInterviewsForCoordinator,
    filterInterviewsForTeamLeadTeam,
    isCoordinatorFilterActive,
    isTeamLeadFilterActive,
    loading: reduxLoading
  } = useSelector((state) => state.interview);
  
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

  // New function to get team lead ID for coordinator view
  const getTeamLeadId = async () => {
    try {
      const response = await httpService.get(
        `/users/AllAssociatedUsers?entity=US&userId=${userId}`
      );
      setTeamLeadId(response.data); // Store the team lead ID
      return response.data;
    } catch (err) {
      console.error("Error fetching team lead ID:", err);
      ToastService.error("Failed to load coordinator data");
      throw err;
    }
  };

  // REVERSED: Regular view now uses the coordinator API logic
  const fetchInterviews = async () => {
    try {
      setLoading(true);
      
      // First get the team lead ID for regular view
      const teamLeadId = await getTeamLeadId();
      
      // Use team lead ID for regular view
      const response = await httpService.get(
        `/candidate/interviews/teamlead/${teamLeadId}`
      );
      
      const teamInterviews = response.data?.teamInterviews || [];
      const processedData = processInterviewData(teamInterviews);
      setInterviews(processedData);
      setError(null);
    } catch (err) {
      // setError("Failed to fetch interview data");
      console.error("Error fetching interviews:", err);
      ToastService.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  // REVERSED: Coordinator view now uses the original regular API logic
  const fetchCoordinatorInterviews = async () => {
    try {
      setCoordinatorLoading(true);
      
      // Use the original regular endpoint for coordinator view
      const response = await httpService.get(
        `/candidate/interviews/interviewsByUserId/${userId}?coordinator=true`
      );
      
      const processedData = processInterviewData(response.data || []);
      setCoordinatorInterviews(processedData);
      setError(null);
    } catch (err) {
      // setError("Failed to fetch coordinator interviews");
      console.error("Error fetching coordinator interviews:", err);
      ToastService.error("Failed to load coordinator interviews");
    } finally {
      setCoordinatorLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [userId]);

  const handleToggleCoordinatorView = () => {
    setShowCoordinatorView(!showCoordinatorView);
    if (!showCoordinatorView && coordinatorInterviews.length === 0) {
      fetchCoordinatorInterviews();
    }
  };

  // Add effect to handle filtered data updates
  useEffect(() => {
    console.log("Filter state changed:", {
      isFilteredDataRequested,
      isCoordinatorFilterActive,
      isTeamLeadFilterActive,
      filterInterviewsForCoordinator: filterInterviewsForCoordinator?.length,
      filterInterviewsForTeamLeadTeam: filterInterviewsForTeamLeadTeam?.length,
    });
  }, [
    isFilteredDataRequested,
    isCoordinatorFilterActive,
    isTeamLeadFilterActive,
    filterInterviewsForCoordinator,
    filterInterviewsForTeamLeadTeam,
  ]);

  // Create a custom date change handler for team view
  const handleTeamViewDateChange = (startDate, endDate) => {
    if (startDate && endDate && teamLeadId) {
      console.log("Team view date filter applied with teamLeadId:", teamLeadId);
    }
  };

  const filterInterviewsByLevel = (interviews) => {
    if (levelFilter === "ALL") return interviews;
    return interviews.filter((interview) => {
      if (levelFilter === "INTERNAL") return interview.interviewLevel === "INTERNAL";
      if (levelFilter === "EXTERNAL") return interview.interviewLevel !== "INTERNAL";
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
        if (showCoordinatorView) {
          fetchCoordinatorInterviews();
        } else {
          fetchInterviews();
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

  const getDisplayData = () => {
    console.log("getDisplayData called:", {
      showCoordinatorView,
      isCoordinatorFilterActive,
      isTeamLeadFilterActive,
      filterInterviewsForCoordinator: filterInterviewsForCoordinator?.length,
      filterInterviewsForTeamLeadTeam: filterInterviewsForTeamLeadTeam?.length,
      interviews: interviews?.length,
      coordinatorInterviews: coordinatorInterviews?.length,
    });

    // For self view: check if coordinator filter is active
    if (showCoordinatorView) {
      if (isCoordinatorFilterActive && filterInterviewsForCoordinator?.length > 0) {
        console.log("Using filtered coordinator data");
        return processInterviewData(filterInterviewsForCoordinator);
      } else if (isCoordinatorFilterActive && filterInterviewsForCoordinator?.length === 0) {
        console.log("Filter active but no results");
        return [];
      } else {
        console.log("Using regular coordinator data");
        return coordinatorInterviews;
      }
    } 
    // For team view: check if team lead filter is active
    else {
      if (isTeamLeadFilterActive && filterInterviewsForTeamLeadTeam?.length > 0) {
        console.log("Using filtered team lead data");
        return processInterviewData(filterInterviewsForTeamLeadTeam);
      } else if (isTeamLeadFilterActive && filterInterviewsForTeamLeadTeam?.length === 0) {
        console.log("Filter active but no results");
        return [];
      } else {
        console.log("Using regular team lead data");
        return interviews;
      }
    }
  };

  // Add function to clear filters
  const handleClearFilters = () => {
    if (showCoordinatorView) {
      dispatch(clearCoordinatorFilter());
    } else {
      dispatch(clearTeamLeadFilter());
    }
    // Also clear the level filter
    setLevelFilter("ALL");
  };

  const handleEdit = (row, isReschedule = false) => {
    setEditDrawer({
      open: true,
      data: { ...row, isReschedule },
    });
  };

  const handleCloseEditDrawer = () => {
    setEditDrawer({ open: false, data: null });
  };

  const handleInterviewUpdated = () => {
    if (showCoordinatorView) {
      fetchCoordinatorInterviews();
    } else {
      fetchInterviews();
    }
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
    if (loading || coordinatorLoading || reduxLoading) {
      return (
        <Box sx={{ p: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2">Loading details...</Typography>
        </Box>
      );
    }
    return <ReusableExpandedContent row={row} config={getExpandedContentConfig(row)} />;
  };

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
      key: "interviewDateTime",
      label: "Interview Date & Time",
      width: 200,
      render: (row) => formatDateTime(row.interviewDateTime),
    },
    {
      key: "latestInterviewStatus",
      label: "Status",
      width: 140,
      render: (row) => getStatusChip(row.latestInterviewStatus, row),
    },
    {
      key: "zoomLink",
      label: "Meeting",
      width: 120,
      render: (row) =>
        loading || coordinatorLoading || reduxLoading ? (
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
          loading={loading || coordinatorLoading || reduxLoading}
          isCoordinator={false}
          candidateName={row.candidateFullName}
          type="comments"
        />
      ),
    },
    {
      key:"internalFeedback",
      label:"FeedBack",
      sortable: false,
      filterable: false,
      width: 160,
       render: (row) => (
        <InternalFeedbackCell
          value={row.internalFeedback}
          loading={loading || coordinatorLoading || reduxLoading}
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
              `${API_BASE_URL}/candidate/download-resume/${candidate.candidateId}/${candidate.jobId}?format=${format}`}
          />
        </Box>
      ),
    },
  ];

  const displayData = getDisplayData();
  const filteredData = showCoordinatorView ? displayData : filterInterviewsByLevel(displayData);

  const processedData = (loading || coordinatorLoading || reduxLoading)
    ? []
    : filteredData.map((row) => ({
        ...row,
        expandContent: renderExpandedContent(row),
        isExpanded: expandedRows[row.interviewId],
      }));

  return (
    <Box sx={{ p: 1 }}>
      {(loading && interviews.length === 0 && !showCoordinatorView) ||
      (coordinatorLoading && coordinatorInterviews.length === 0 && showCoordinatorView) ? (
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
              <DateRangeFilter 
                component={showCoordinatorView ? "InterviewsForCoordinator" : "InterviewsForTeamLead"}
                onClearFilter={handleClearFilters}
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

          <DataTable
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
            loading={loading || coordinatorLoading || reduxLoading}
          />

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

          <Drawer
            anchor="right"
            open={editDrawer.open}
            onClose={handleCloseEditDrawer}
            PaperProps={{ sx: { width: { xs: "60%", sm: "50%", md: "50%" } } }}
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