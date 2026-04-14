import React, { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Typography,
  Button,
  Link,
  Stack,
  CircularProgress,
  Drawer,
  Skeleton,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import httpService from "../../Services/httpService";
import ToastService from "../../Services/toastService";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatDateTime } from "../../utils/dateformate";
import { API_BASE_URL } from "../../Services/httpService";
import DateRangeFilterUtil from "../muiComponents/DateRangeFilterUtil";
import { getStatusChip, getInterviewLevelChip } from "../../utils/statusUtils";
import ConfirmDialog from "../muiComponents/ConfirmDialog";
import MoveToBench from "./MoveToBench";
import DownloadResume from "../../utils/DownloadResume";
import InternalFeedbackCell from "./FeedBack";
import InterviewFormWrapper from "./InterviewFormWrapper";
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

const RecruiterInterviews = () => {
  const dispatch = useDispatch();
  const { userId } = useSelector((state) => state.auth);

  // ─── Date-range filter state ──────────────────────────────────────────────
  const [filteredData, setFilteredData] = useState(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    interview: null,
  });
  const [editDrawer, setEditDrawer] = useState({ open: false, data: null });
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [moveToBenchLoading, setMoveToBenchLoading] = useState(false);
  const navigate = useNavigate();

  // ─── Server-side pagination state ────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const validatePage = (pageNum) => {
    const num = Number(pageNum);
    return !isNaN(num) && num >= 0 ? num : 0;
  };

  const validateSize = (size) => {
    const num = Number(size);
    return !isNaN(num) && num > 0 ? num : 10;
  };

  // ─── Fetch: standard paginated interviews ─────────────────────────────────
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
      const response = await httpService.get(
        `/candidate/interviews/interviewsByUserId/${userId}?${params}`,
      );
      const responseData = response.data;
      const processedData = processInterviewData(
        responseData?.data?.content ||
          responseData?.data ||
          responseData?.content ||
          responseData ||
          [],
      );
      setInterviews(processedData);

      const total = responseData.length;
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

  // ─── Fetch: date-range filtered interviews ────────────────────────────────
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
      setTotalCount(response.data?.data?.length);
    } catch (err) {
      console.error("Error fetching filtered interviews:", err);
      ToastService.error("Failed to filter interviews");
    } finally {
      setFilterLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews(0, rowsPerPage, "");
  }, [userId]);

  // ─── Date-range handlers ──────────────────────────────────────────────────
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

  // ─── CRUD handlers ────────────────────────────────────────────────────────
  const handleBenchSuccess = (row) => {
    setInterviews((prev) =>
      prev.filter((item) => item.interviewId !== row.interviewId),
    );
  };

  const handleJobIdClick = (jobId) => {
    navigate(`/dashboard/requirements/job-details/${jobId}`);
  };

  const handleEdit = (row, isReschedule = false, isScheduleJoining = false) => {
    let formType = "edit";
    if (isReschedule) formType = "reschedule";
    else if (isScheduleJoining) formType = "schedule";

    setEditDrawer({
      open: true,
      data: { ...row, formType, isReschedule, isScheduleJoining },
    });
  };

  const handleCloseEditDrawer = () =>
    setEditDrawer({ open: false, data: null });

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

  // ─── Pagination / search handlers ─────────────────────────────────────────
  const handlePageChange = (newPage, newRowsPerPage) => {
    const validPage = validatePage(newPage);
    setPage(validPage);

    if (filteredData !== null) {
      fetchFilteredInterviews(
        filterStartDate,
        filterEndDate,
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

    if (filteredData !== null) {
      fetchFilteredInterviews(
        filterStartDate,
        filterEndDate,
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

    if (filteredData !== null) {
      fetchFilteredInterviews(
        filterStartDate,
        filterEndDate,
        newPage,
        newSize,
        value,
      );
    } else {
      fetchInterviews(newPage, newSize, value);
    }
  };

  // ─── Display data ─────────────────────────────────────────────────────────
  const getDisplayData = () => {
    const data = filteredData !== null ? filteredData : interviews;
    return filterInterviewsByLevel(data);
  };

  const processedData = loading || filterLoading ? [] : getDisplayData();

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
        const showReschedule = ["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(
          status,
        );
        const showScheduleJoining = status === "SELECTED";

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

  // ─── Render ───────────────────────────────────────────────────────────────
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="h6" color="primary">
                My Scheduled Interviews
              </Typography>
            </Box>
            {/* ── DateRangeFilterUtil wired with callbacks ── */}
            <DateRangeFilterUtil
              onDateChange={handleDateChange}
              onClearFilter={handleClearDateFilter}
            />
          </Stack>

          {/* ── Level filter toggle ── */}
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

          <DataTablePaginated
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
            loading={loading || filterLoading}
            serverSide={true}
            totalCount={totalCount}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onSearchChange={handleSearchChange}
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
        </>
      )}
    </Box>
  );
};

export default RecruiterInterviews;
