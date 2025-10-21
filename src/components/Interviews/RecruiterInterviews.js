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
  Skeleton,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../../utils/dateformate";
import { API_BASE_URL } from "../../Services/httpService";
import DataTable from "../muiComponents/DataTabel";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { getStatusChip, getInterviewLevelChip } from "../../utils/statusUtils";
import ConfirmDialog from "../muiComponents/ConfirmDialog";
import EditInterviewForm from "./EditInterviewForm";
import ReusableExpandedContent from "../muiComponents/ReusableExpandedContent";
import MoveToBench from "./MoveToBench";
import DownloadResume from "../../utils/DownloadResume";
import InternalFeedbackCell from "./FeedBack";
import {
  clearFilteredData,
  clearRecruiterFilter,
} from "../../redux/interviewSlice"; // Import the action
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

const RecruiterInterviews = () => {
  const dispatch = useDispatch();
  const { userId, role } = useSelector((state) => state.auth);
  const {
    isFilteredDataRequested,
    isRecruiterFilterActive,
    filterInterviewsForRecruiter,
    loading: reduxLoading,
  } = useSelector((state) => state.interview);

  const [interviews, setInterviews] = useState([]);
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
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [moveToBenchLoading, setMoveToBenchLoading] = useState(false);
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

  useEffect(() => {
    fetchInterviews();
  }, [userId]);

  // Add effect to handle filtered data updates
  useEffect(() => {
    console.log("Filter state changed:", {
      isFilteredDataRequested,
      isRecruiterFilterActive,
      filterInterviewsForRecruiter: filterInterviewsForRecruiter.length,
    });
  }, [
    isFilteredDataRequested,
    isRecruiterFilterActive,
    filterInterviewsForRecruiter,
  ]);

  const handleBenchSuccess = (row) => {
    setInterviews((prevInterviews) =>
      prevInterviews.filter((item) => item.interviewId !== row.interviewId)
    );
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

  const handleLevelFilterChange = (event, newFilter) => {
    if (newFilter !== null) setLevelFilter(newFilter);
  };

  const handleJobIdClick = (jobId) => {
    navigate(`/dashboard/requirements/job-details/${jobId}`);
  };

  const handleEdit = (row, isReschedule = false, isScheduleJoining = false) => {
    let formType = "edit"; // Default to edit

    if (isReschedule) {
      formType = "reschedule";
    } else if (isScheduleJoining) {
      formType = "schedule";
    }

    setEditDrawer({
      open: true,
      data: {
        ...row,
        formType,
        isReschedule,
        isScheduleJoining,
      },
    });
  };

  const handleCloseEditDrawer = () => {
    setEditDrawer({ open: false, data: null });
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
      render: loading
        ? () => <Skeleton variant="text" width={100} />
        : (row) => (
            <MoveToBench
              row={row}
              onSuccess={handleBenchSuccess}
              isLoading={moveToBenchLoading}
            />
          ),
    },
    // {
    //   key: "zoomLink",
    //   label: "Meeting",
    //   width: 120,
    //   render: (row) =>
    //     row.zoomLink ? (
    //       <Button
    //         size="small"
    //         variant="outlined"
    //         color="primary"
    //         startIcon={<VideoCallIcon />}
    //         href={row.zoomLink}
    //         target="_blank"
    //         rel="noopener noreferrer"
    //         sx={{ px: 1, py: 0.5 }}
    //       >
    //         Join
    //       </Button>
    //     ) : (
    //       <Typography variant="body2" color="text.secondary">
    //         No link
    //       </Typography>
    //     ),
    // },
    {
      key: "internalFeedback",
      label: "Internal Feedback",
      render: (row) => (
        <InternalFeedbackCell
          value={row.internalFeedback}
          loading={loading}
          isCoordinator={false}
          candidateName={row.candidateFullName}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: 200,
      render: (row) => {
        const status = row.latestInterviewStatus?.toUpperCase();
        const showReschedule = ["CANCELLED", "NO_SHOW"].includes(status);
        const showScheduleJoining = status === "SELECTED";

        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            {/* Regular Edit Button - always shows edit form */}
            <IconButton
              onClick={() => handleEdit(row)}
              color="primary"
              size="small"
              title="Edit Interview"
            >
              <EditIcon fontSize="small" />
            </IconButton>

            <IconButton
              onClick={() => handleDelete(row)}
              color="error"
              size="small"
              title="Delete Interview"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>

            <DownloadResume
              candidate={row}
              getDownloadUrl={(candidate, format) =>
                `${API_BASE_URL}/candidate/download-resume/${candidate.candidateId}/${candidate.jobId}?format=${format}`
              }
            />

            {/* Conditional Buttons */}
            {showReschedule && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleEdit(row, true)}
                sx={{ px: 1, py: 0.5 }}
              >
                Reschedule
              </Button>
            )}

            {showScheduleJoining && (
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
    },
  ];

  // Updated function to get display data with better logic
  const getDisplayData = () => {
    if (isRecruiterFilterActive && filterInterviewsForRecruiter.length > 0) {
      // Use filtered data from Redux
      return processInterviewData(filterInterviewsForRecruiter);
    } else if (
      isFilteredDataRequested &&
      filterInterviewsForRecruiter.length === 0
    ) {
      // Filter was applied but no results
      return [];
    } else {
      // Use original interviews data
      return interviews;
    }
  };

  // Add function to clear filters
  const handleClearFilters = () => {
    dispatch(clearRecruiterFilter());
    // Also clear the level filter
    setLevelFilter("ALL");
  };

  const displayData = getDisplayData();
  const filteredData = filterInterviewsByLevel(displayData);

  const processedData =
    loading || reduxLoading
      ? []
      : filteredData.map((row) => ({
          ...row,
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="h6" color="primary">
                My Scheduled Interviews
              </Typography>
            </Box>
            <DateRangeFilter component="InterviewsForRecruiter" />
          </Stack>

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

          <DataTable
            data={processedData || []}
            columns={columns}
            title="My Interviews"
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
            loading={loading || reduxLoading}
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
                //  showCoordinatorView={showCoordinatorView}
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
        </>
      )}
    </Box>
  );
};

export default RecruiterInterviews;
