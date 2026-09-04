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
  Visibility,
  People,
  Person,
  SupervisorAccount as CoordinatorIcon,
} from "@mui/icons-material";
import DataTable from "../muiComponents/DataTabel";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import { useSelector, useDispatch } from "react-redux";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { getStatusChip, getInterviewLevelChip } from "../../utils/statusUtils";
import ConfirmDialog from "../muiComponents/ConfirmDialog";
import EditInterviewForm from "./EditInterviewForm";
import ReusableExpandedContent from "../muiComponents/ReusableExpandedContent";
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
  const [editDrawer, setEditDrawer] = useState({
    open: false,
    data: null,
  });
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
  const { userId, role } = useSelector((state) => state.auth);
  const { isFilteredDataRequested } = useSelector((state) => state.bench);
  const {
    selfInterviewsTL,
    teamInterviewsTL,
    filterInterviewsForTeamLeadTeam,
    filterInterviewsForTeamLeadSelf,
  } = useSelector((state) => state.interview);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      await dispatch(fetchInterviewsTeamLead()).unwrap();
      setError(null);
    } catch (err) {
      setError("Failed to fetch interview data");
      console.error("Error fetching interviews:", err);
      ToastService.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinatorInterviews = async () => {
    try {
      setCoordinatorLoading(true);
      const response = await httpService.get(
        `/candidate/interviews/interviewsByUserId/${userId}?coordinator=true`
      );
      setCoordinatorInterviews(
        processInterviewData(response.data.data || response.data || [])
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

  const handleBenchSuccess = (row) => {
    if (showCoordinatorView) {
      setCoordinatorInterviews((prev) =>
        prev.filter((item) => item.submissionId !== row.submissionId)
      );
    } else {
      // Update both self and team interviews
      if (activeTab === 0) {
        // Self interviews
        dispatch(
          filterInterviewsByTeamLead({
            selfInterviews: selfInterviewsTL.filter(
              (item) => item.submissionId !== row.submissionId
            ),
            teamInterviews: teamInterviewsTL,
          })
        );
      } else {
        // Team interviews
        dispatch(
          filterInterviewsByTeamLead({
            selfInterviews: selfInterviewsTL,
            teamInterviews: teamInterviewsTL.filter(
              (item) => item.submissionId !== row.submissionId
            ),
          })
        );
      }
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleLevelFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setLevelFilter(newFilter);
    }
  };

  const filterInterviewsByLevel = (interviews) => {
    if (levelFilter === "ALL") return interviews;
    
    return interviews.filter((interview) => {
      if (levelFilter === "INTERNAL") {
        return interview.interviewLevel === "INTERNAL";
      }
      if (levelFilter === "EXTERNAL") {
        return interview.interviewLevel !== "INTERNAL";
      }
      if (levelFilter === "L1") {
        return interview.interviewLevel === "L1";
      }
      if (levelFilter === "L2") {
        return interview.interviewLevel === "L2";
      }
      if (levelFilter === "L3") {
        return interview.interviewLevel === "L3";
      }
      return false;
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
      formType, // This is now explicitly set
      isReschedule,
      isScheduleJoining,
      fromView: showCoordinatorView ? "coordinator" : "recruiter",
      isCoordinatorView: showCoordinatorView 
    },
  });
};

  const handleCloseEditDrawer = () => {
    setEditDrawer({
      open: false,
      data: null,
    });
  };

  const handleJobIdClick = (jobId) => {
    navigate(`/dashboard/requirements/job-details/${jobId}`, {
      state: { from: "/dashboard/interviews" }
    });
  };
  
  const handleInterviewUpdated = () => {
    fetchInterviews();
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
      await fetchInterviews();
      ToastService.update(toastId, "Interview deleted successfully", "success");
    } catch (error) {
      ToastService.error("Failed to delete interview");
      console.error("Error deleting interview:", error);
    } finally {
      setConfirmDialog({ open: false, interview: null });
    }
  };



  const handleCoordinatorViewToggle = () => {
    setShowCoordinatorView(!showCoordinatorView);
    if (!showCoordinatorView && coordinatorInterviews.length === 0) {
      fetchCoordinatorInterviews();
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
        width: 120
      },
      {
        key: "technology",
        label: "Technologies",
        sortable: true,
        render: (row) => row.technology,
        filterable: true,
        width: 120
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
    ];

    if (showCoordinatorView) {
      baseColumns.push({
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
      }
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

    baseColumns.push(
      {
  key: "actions",
  label: "Actions",
  width: 200,
  render: (row) => {
    const status = row.latestInterviewStatus?.toUpperCase();
    const showReschedule = ["CANCELLED","NO_SHOW","RESCHEDULED"].includes(status);
    const showScheduleJoining = status === "SELECTED";

    return (
      <Box sx={{ display: "flex", gap: 1 }}>
       

        {/* Edit Button - always visible except in coordinator view */}
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

        {/* Delete Button - always visible except in coordinator view */}
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

        {/* Download Resume - only in coordinator view */}
        {showCoordinatorView && (
          <DownloadResume 
            candidate={{ ...row, jobId: row.jobId }}
            getDownloadUrl={(candidate, format) =>
              `${API_BASE_URL}/candidate/download-resume/${candidate.candidateId}/${candidate.jobId}?format=${format}`
            }
          />
        )}

        {/* Edit Button in coordinator view */}
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

        {/* Conditional Buttons */}
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
}
    );

    return baseColumns;
  };

  // Process data for each tab
  const processedSelfInterviews = processInterviewData(selfInterviewsTL || []);
  const processedTeamInterviews = processInterviewData(teamInterviewsTL || []);
  
  // Process filtered data if available
  const processedFilteredSelfInterviews = processInterviewData(filterInterviewsForTeamLeadSelf || []);
  const processedFilteredTeamInterviews = processInterviewData(filterInterviewsForTeamLeadTeam || []);

  // Map data with expanded content
  const mapDataWithExpandedContent = (data) => {
    return data.map((row) => ({
      ...row,

    }));
  };

  const selfInterviewData = mapDataWithExpandedContent(processedSelfInterviews);
  const teamInterviewData = mapDataWithExpandedContent(processedTeamInterviews);
  const filteredSelfInterviewData = mapDataWithExpandedContent(processedFilteredSelfInterviews);
  const filteredTeamInterviewData = mapDataWithExpandedContent(processedFilteredTeamInterviews);
  const coordinatorData = mapDataWithExpandedContent(coordinatorInterviews);

  // Apply level filter to the data
  const getFilteredData = (data) => {
    return filterInterviewsByLevel(data);
  };

  // Determine which data to display based on filtering and tab selection
  let displayData = [];
  let tableTitle = showCoordinatorView ? "Coordinator Interviews" : levelFilter === "INTERNAL" ? "Internal Interviews" : levelFilter === "EXTERNAL" 
              ? "External Interviews" : "Interviews";
  
  if (showCoordinatorView) {
    displayData = getFilteredData(coordinatorData);
    tableTitle = "Coordinator Interviews";
  } else if (isFilteredDataRequested) {
    displayData = activeTab === 0 
      ? getFilteredData(filteredSelfInterviewData) 
      : getFilteredData(filteredTeamInterviewData);
    tableTitle = activeTab === 0 ? "Filtered My Interviews" : "Filtered Team Interviews";
  } else {
    displayData = activeTab === 0 
      ? getFilteredData(selfInterviewData) 
      : getFilteredData(teamInterviewData);
    tableTitle = activeTab === 0 ? "My Interviews" : "Team Interviews";
  }

  useEffect(() => {
    fetchInterviews();
  }, [userId]);

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
            onClick={fetchInterviews}
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
                  backgroundColor: showCoordinatorView ? "#1976d2" : "transparent",
                  "&:hover": {
                    borderColor: "#1565c0",
                    backgroundColor: showCoordinatorView ? "#1565c0" : "#e3f2fd",
                  },
                }}
              >
                {showCoordinatorView ? "Regular View" : "Coordinator View"}
              </Button>
              <DateRangeFilter component="InterviewsForTeamLead" />
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

          {!showCoordinatorView && (
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Person fontSize="small" />
                      <span>
                        My Interviews ({isFilteredDataRequested 
                          ? filterInterviewsByLevel(filteredSelfInterviewData).length 
                          : filterInterviewsByLevel(selfInterviewData).length})
                      </span>
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <People fontSize="small" />
                      <span>
                        Team Interviews ({isFilteredDataRequested 
                          ? filterInterviewsByLevel(filteredTeamInterviewData).length 
                          : filterInterviewsByLevel(teamInterviewData).length})
                      </span>
                    </Box>
                  }
                />
              </Tabs>
            </Box>
          )}

          <DataTable
            data={displayData}
            columns={getTableColumns()}
            title={tableTitle}
            enableSelection={false}
            defaultSortColumn="interviewDateTime"
            defaultSortDirection="desc"
            defaultRowsPerPage={10}
            refreshData={showCoordinatorView ? fetchCoordinatorInterviews : fetchInterviews}
            primaryColor="#1976d2"
            secondaryColor="#e3f2fd"
            customStyles={{
              headerBackground: "#1976d2",
              rowHover: "#f5f5f5",
              selectedRow: "#e3f2fd",
            }}
            
           
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
      formType={editDrawer.data.formType || "edit"} // Default to edit if not specified
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

export default TeamLeadInterviews;