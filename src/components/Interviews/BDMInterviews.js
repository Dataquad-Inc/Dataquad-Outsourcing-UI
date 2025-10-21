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
  ToggleButtonGroup,
  ToggleButton,
  TextField,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  SupervisorAccount as CoordinatorIcon,
} from "@mui/icons-material";
import httpService, { API_BASE_URL } from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../../utils/dateformate";
import DataTable from "../muiComponents/DataTabel";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { getStatusChip, getInterviewLevelChip } from "../../utils/statusUtils";
import ConfirmDialog from "../muiComponents/ConfirmDialog";
import EditInterviewForm from "./EditInterviewForm";
import InternalFeedbackCell from "./FeedBack";
import DownloadResume from "../../utils/DownloadResume";
import MoveToBench from "./MoveToBench";
import InterviewFormWrapper from "./InterviewFormWrapper";

const processInterviewData = (interviews) => {
  if (!Array.isArray(interviews)) return [];
  return interviews.map((interview) => ({
    ...interview,
    interviewId:
      interview.interviewId || `${interview.candidateId}_${interview.jobId}`,
    interviewStatus: interview.latestInterviewStatus,
  }));
};

const BDMInterviews = () => {
  const { userId } = useSelector((state) => state.auth);
  const [interviews, setInterviews] = useState([]);
  const [coordinatorInterviews, setCoordinatorInterviews] = useState([]);
  const [showCoordinatorView, setShowCoordinatorView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coordinatorLoading, setCoordinatorLoading] = useState(false);
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
  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    interview: null,
  });
  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [levelFilter, setLevelFilter] = useState("ALL");
  const navigate = useNavigate();

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await httpService.get(
        `/candidate/interviews/interviewsByUserId/${userId}`
      );
      const processedData = processInterviewData(response.data || []);
      setInterviews(processedData);
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
      const processedData = processInterviewData(response.data || []);
      setCoordinatorInterviews(processedData);
      setError(null);
    } catch (err) {
      setError("Failed to fetch coordinator interviews");
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

  const filterInterviewsByLevel = (interviews) => {
    if (levelFilter === "ALL") return interviews;
    return interviews.filter((interview) => {
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

  const handleBenchSuccess = (row) => {
    setInterviews((prevInterviews) =>
      prevInterviews.filter((item) => item.interviewId !== row.interviewId)
    );
  };

  const handleLevelFilterChange = (event, newFilter) => {
    if (newFilter !== null) setLevelFilter(newFilter);
  };

  const handleJobIdClick = (jobId) => {
    navigate(`/dashboard/requirements/job-details/${jobId}`);
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
        isCoordinatorView: showCoordinatorView,
      },
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
      if (showCoordinatorView) {
        await fetchCoordinatorInterviews();
      } else {
        await fetchInterviews();
      }
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



  const getColumns = () => {
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
      { key: "duration", label: "Duration (min)", width: 120, align: "center" },

      {
        key: "moveToBench",
        label: "Move to Bench",
        sortable: false,
        filterable: false,
        width: 130,
        align: "center",
        render: (row) => (
          <MoveToBench row={row} onSuccess={handleBenchSuccess} />
        ),
      },
    ];

    if (showCoordinatorView) {
      baseColumns.splice(4, 0, {
        key: "recruiterName",
        label: "Recruiter",
        width: 120,
      });

      baseColumns.push(
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
      baseColumns.push({
        key: "internalFeedback",
        label: "Internal Feedback",
        render: (row) => (
          <InternalFeedbackCell
            value={row.internalFeedback}
            loading={loading}
            candidateName={row.candidateFullName}
          />
        ),
      });
    }

    return baseColumns;
  };

  const getActionButtons = (row) => {
    const status = row.latestInterviewStatus?.toUpperCase();
    const showReschedule =
      ["CANCELLED", "NO_SHOW"].includes(status) && !showCoordinatorView;

    const getButtonText = () => {
      switch (status) {
        case "SELECTED":
          return "Schedule Joining";
        case "CANCELLED":
        case "RESCHEDULED":
        case "NO_SHOW":
          return "Reschedule";
        default:
          return "Update";
      }
    };

    return (
      <Box sx={{ display: "flex", gap: 1 }}>
       

        <IconButton
          onClick={() => handleEdit(row)}
          color="primary"
          size="small"
          title="Edit Interview"
        >
          <EditIcon fontSize="small" />
        </IconButton>

        <DownloadResume
          candidate={{ ...row, jobId: row.jobId }}
          getDownloadUrl={(candidate, format) =>
            `${API_BASE_URL}/candidate/download-resume/${candidate.candidateId}/${candidate.jobId}?format=${format}`
          }
        />

        {!showCoordinatorView && (
          <>
            <IconButton
              onClick={() => handleDelete(row)}
              color="error"
              size="small"
              title="Delete Interview"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </>
        )}

        {showReschedule && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleEdit(row, true)}
            sx={{ px: 1, py: 0.5 }}
          >
            {getButtonText()}
          </Button>
        )}
      </Box>
    );
  };

  const columns = [
    ...getColumns(),
    {
      key: "actions",
      label: "Actions",
      width: 200,
      render: (row) => getActionButtons(row),
    },
  ];

  const getDisplayData = () => {
    const data = showCoordinatorView ? coordinatorInterviews : interviews;
    return filterInterviewsByLevel(data);
  };

  const processedData =
    (loading && !showCoordinatorView) ||
    (coordinatorLoading && showCoordinatorView)
      ? []
      : getDisplayData().map((row) => ({
          ...row,
        
        }));

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
                ? "Coordinator View - Interviews"
                : "My Scheduled Interviews"}
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
                {showCoordinatorView ? "Regular View" : "Coordinator View"}
              </Button>
              <DateRangeFilter component="InterviewsForRecruiter" />
            </Box>
          </Stack>
          {!showCoordinatorView && (
            <>
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
                  <ToggleButton
                    value="INTERNAL"
                    aria-label="internal interviews"
                  >
                    INTERNAL
                  </ToggleButton>
                  <ToggleButton
                    value="EXTERNAL"
                    aria-label="external interviews"
                  >
                    EXTERNAL
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </>
          )}

          <DataTable
            data={processedData || []}
            columns={columns}
            title={
              showCoordinatorView
                ? "Coordinator Interviews"
                : levelFilter === "INTERNAL"
                ? "Internal Interviews"
                : levelFilter === "EXTERNAL"
                ? "External Interviews"
                : "Interviews"
            }
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
