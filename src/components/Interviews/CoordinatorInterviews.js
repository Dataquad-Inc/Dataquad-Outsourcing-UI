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
} from "@mui/material";
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import { useSelector } from "react-redux";
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

const processInterviewData = (interviews) => {
  if (!Array.isArray(interviews)) return [];
  return interviews.map((interview) => ({
    ...interview,
    interviewId: interview.interviewId || `${interview.candidateId}_${interview.jobId}`,
    interviewStatus: interview.latestInterviewStatus,
  }));
};

const CoordinatorInterviews = () => {
  const { userId } = useSelector((state) => state.auth);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const navigate = useNavigate();

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await httpService.get(
        `/candidate/interviews/interviewsByUserId/${userId}?coordinator=true`
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

  useEffect(() => {
    fetchInterviews();
  }, [userId]);

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
        fetchInterviews();
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
    fetchInterviews();
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
    if (loading) {
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
          loading ? (
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
          loading={loading}
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
          loading={loading}
          isCoordinator={false}
          // candidateName={row.candidateFullName}
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
           {/* <Button
            variant="outlined"
            size="small"
            onClick={() => handleOpenFeedbackDialog(row)}
          >
            Feedback
          </Button> */}
      
        </Box>
      ),
    },
  ];

  const processedData = loading
    ? []
    : filterInterviewsByLevel(interviews).map((row) => ({
        ...row,
        expandContent: renderExpandedContent(row),
        isExpanded: expandedRows[row.interviewId],
      }));

  return (
    <Box sx={{ p: 1 }}>
      {loading && interviews.length === 0 ? (
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
              Coordinator Interviews
            </Typography>
            <DateRangeFilter component="InterviewsForRecruiter" />
          </Stack>

          {/* <Box sx={{ mb: 2, display: "flex", justifyContent: "start" }}>
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
          </Box> */}

          <DataTable
            data={processedData || []}
            columns={columns}
            title="Coordinator Interviews"
            enableSelection={false}
            defaultSortColumn="interviewDateTime"
            defaultSortDirection="desc"
            defaultRowsPerPage={10}
            refreshData={fetchInterviews}
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
              {/* <Button
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
              </Button> */}
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