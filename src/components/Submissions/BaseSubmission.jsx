import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  Box,
  IconButton,
  Tooltip,
  CircularProgress,
  Drawer,
  Typography,
  Skeleton,
  Snackbar,
  Alert,
  Stack,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import DataTablePaginated from "../muiComponents/DataTablePaginated";
import CandidateSubmissionDrawer from "../Assigned/CandidateSubmissionDrawer";
import ScheduleInterviewForm from "./ScheduleInterviewForm";
import httpService from "../../Services/httpService";
import { useSelector } from "react-redux";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { showToast } from "../../utils/ToastNotification";
import { useNavigate } from "react-router-dom";
import { generateSubmissionColumns } from "./submissionColumns";

const BaseSubmission = ({
  data,
  loading,
  componentName,
  title = "Submissions List",
  onAddNew,
  refreshData,
  enableTeamLeadTabs = false,
  isTeamData = false,
  setIsTeamData = () => {},
  tabValue = 0,
  setTabValue = () => {},
  customData = [],
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
  onFilterChange,
  onSearchChange,
  enableServerSideFiltering = false,
  role,
  // NEW PROPS for date range integration
  onDateRangeChange = () => {},
  isFiltered = false,
}) => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [candidateData, setCandidateData] = useState(null);
  const [mode, setMode] = useState("add");
  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [moveToBenchLoading, setMoveToBenchLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [moveToBenchDialogOpen, setMoveToBenchDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({});

  const { isFilteredDataRequested } = useSelector((state) => state.bench);
  const { filteredSubmissionsList, filteredSubmissionsForRecruiter } = useSelector(
    (state) => state.submission,
  );
  const { userId } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleTabChange = useCallback(
    (event, newValue) => {
      if (!isMountedRef.current) return;

      setTabValue(event, newValue);
    },
    [setTabValue],
  );

  const handleJobIdClick = useCallback(
    (jobId) => {
      navigate(`/dashboard/requirements/job-details/${jobId}`, {
        state: { from: "/dashboard/submissions" },
      });
    },
    [navigate],
  );

  const handleMoveToBenchClick = useCallback((row, e) => {
    if (e) e.stopPropagation();
    if (!isMountedRef.current) return;

    setSelectedCandidate(row);
    setRemarks(row.remarks || "");
    setMoveToBenchDialogOpen(true);
  }, []);

  const handleMoveToBenchConfirm = async () => {
    if (!selectedCandidate || !isMountedRef.current) return;

    try {
      setMoveToBenchLoading(true);
      const row = selectedCandidate;
      const formData = new FormData();

      formData.append("fullName", row.fullName);
      formData.append("email", row.emailId || row.candidateEmailId);
      formData.append("contactNumber", row.contactNumber);
      formData.append("relevantExperience", row.relevantExperience || "");
      formData.append("totalExperience", row.totalExperience || "");
      formData.append("technology", row.technology || "");

      if (Array.isArray(row.skills)) {
        formData.append("skills", JSON.stringify(row.skills));
      } else if (typeof row.skills === "string") {
        const skillsArray = row.skills.split(",").map((skill) => skill.trim());
        formData.append("skills", JSON.stringify(skillsArray));
      } else {
        formData.append("skills", JSON.stringify([]));
      }

      formData.append("linkedin", row.linkedin || "");
      formData.append("referredBy", row.recruiterName || "");
      formData.append("remarks", remarks);

      try {
        const response = await httpService.get(
          `/candidate/download-resume/${row.candidateId}/${row.jobId}`,
          {
            responseType: "blob",
          },
        );

        let fileName = `resume_${row.candidateId}.pdf`;
        if (response.headers["content-disposition"]) {
          const contentDisposition = response.headers["content-disposition"];
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            fileName = filenameMatch[1];
          }
        }

        const blob = new Blob([response.data], {
          type: response.headers["content-type"] || "application/pdf",
        });
        const file = new File([blob], fileName);

        formData.append("resumeFile", file);
      } catch (error) {
        console.error("Error fetching resume:", error);
        showToast("Resume not found, submitting without it", "warning");
      }

      await httpService.post("/candidate/bench/save", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (isMountedRef.current) {
        refreshData?.();
        showToast(`${row.fullName} moved to bench successfully!`, "success");
        setMoveToBenchDialogOpen(false);
        setSelectedCandidate(null);
        setRemarks("");
      }
    } catch (error) {
      console.error("Move to bench failed:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to move candidate to bench";
      showToast(errorMsg, "error");
    } finally {
      if (isMountedRef.current) {
        setMoveToBenchLoading(false);
      }
    }
  };

  const handleMoveToBenchCancel = useCallback(() => {
    if (!isMountedRef.current) return;

    setMoveToBenchDialogOpen(false);
    setSelectedCandidate(null);
    setRemarks("");
  }, []);

  const handleEdit = useCallback(
    (row, e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      if (!isMountedRef.current) return;

      if (scheduleDrawerOpen) {
        setScheduleDrawerOpen(false);
        setScheduleData(null);
      }

      setCandidateData(row);
      setMode("edit");
      setOpenDrawer(true);
    },
    [scheduleDrawerOpen],
  );

  const handleDelete = useCallback(
    async (submissionId, e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      if (!isMountedRef.current) return;

      if (
        window.confirm(
          "Are you sure you want to delete this candidate submission?",
        )
      ) {
        try {
          await httpService.delete(
            `/candidate/deletesubmission/${submissionId}`,
          );
          if (isMountedRef.current) {
            refreshData?.();
            showToast("Candidate submission deleted successfully", "success");
          }
        } catch (error) {
          console.error("Error deleting candidate submission:", error);
          if (isMountedRef.current) {
            showToast("Failed to delete candidate submission", "error");
          }
        }
      }
    },
    [refreshData],
  );

  const openNewCandidateDrawer = useCallback(() => {
    if (!isMountedRef.current) return;

    setCandidateData(null);
    setMode("add");
    setOpenDrawer(true);
  }, []);

  const closeDrawer = useCallback(() => {
    if (!isMountedRef.current) return;

    setOpenDrawer(false);
    setTimeout(() => {
      if (isMountedRef.current) {
        setCandidateData(null);
        setMode("add");
      }
    }, 300);
  }, []);

  const openScheduleDrawer = useCallback(
    (row, e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      if (!isMountedRef.current) return;

      if (openDrawer) {
        setOpenDrawer(false);
        setCandidateData(null);
      }

      setScheduleData(row);
      setScheduleDrawerOpen(true);
    },
    [openDrawer],
  );

  const closeScheduleDrawer = useCallback(() => {
    if (!isMountedRef.current) return;

    setScheduleDrawerOpen(false);
    setTimeout(() => {
      if (isMountedRef.current) {
        setScheduleData(null);
      }
    }, 300);
  }, []);

  const handleScheduleSuccess = useCallback(() => {
    if (!isMountedRef.current) return;

    refreshData?.();
    closeScheduleDrawer();
    showToast("Interview scheduled successfully!", "success");
  }, [refreshData, closeScheduleDrawer]);

  const handleSortChangeCallback = useCallback(
    (orderBy, order, page, rowsPerPage) => {
      // Sorting disabled
    },
    [],
  );

  const handleFilterChangeCallback = useCallback(
    (filters, page, rowsPerPage, orderBy, order, searchQuery) => {
      setFilters(filters);
      onFilterChange?.(filters, page, rowsPerPage, orderBy, order, searchQuery);
    },
    [onFilterChange],
  );

  const handleSearchChangeCallback = useCallback(
    (searchQuery, page, rowsPerPage, orderBy, order) => {
      setSearchQuery(searchQuery);
      onSearchChange?.(searchQuery, page, rowsPerPage, orderBy, order);
    },
    [onSearchChange],
  );

  const handlePageChangeCallback = useCallback(
    (newPage, rowsPerPage) => {
      onPageChange?.(newPage, rowsPerPage);
    },
    [onPageChange],
  );

  const handleRowsPerPageChangeCallback = useCallback(
    (newRowsPerPage) => {
      onRowsPerPageChange?.(newRowsPerPage);
    },
    [onRowsPerPageChange],
  );

  const handlers = useMemo(
    () => ({
      handleEdit,
      handleDelete,
      handleMoveToBenchClick,
      openScheduleDrawer,
      handleJobIdClick,
      moveToBenchLoading,
      downloadLoading,
      scheduleLoading,
    }),
    [
      handleEdit,
      handleDelete,
      handleMoveToBenchClick,
      openScheduleDrawer,
      handleJobIdClick,
      moveToBenchLoading,
      downloadLoading,
      scheduleLoading,
    ],
  );

  const columns = useMemo(
    () => generateSubmissionColumns(handlers, role, { scheduleLoading }),
    [handlers, role, scheduleLoading],
  );

  const displayData = useMemo(() => {
    if (customData.length > 0) {
      return customData;
    }
    
    // Show filtered data from Redux when filtered
    if (isFiltered && filteredSubmissionsList && filteredSubmissionsList.length > 0) {
      return filteredSubmissionsList;
    }
    
    // Legacy check for recruiter filtered data
    if (isFilteredDataRequested && role !== "TEAMLEAD") {
      return filteredSubmissionsForRecruiter;
    }
    
    return data || [];
  }, [
    customData,
    isFiltered,
    filteredSubmissionsList,
    isFilteredDataRequested,
    role,
    filteredSubmissionsForRecruiter,
    data,
  ]);

  const displayTitle = useMemo(() => {
    const total = pagination?.totalElements;
    const baseTitle = title;
    
    if (isFiltered && total) {
      return `${baseTitle} (Filtered: ${total} total)`;
    } else if (total) {
      return `${baseTitle} (${total} total)`;
    }
    return baseTitle;
  }, [title, pagination?.totalElements, isFiltered]);

  // Memoized Skeleton loading component
  const LoadingSkeleton = useMemo(
    () => (
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" width={300} height={40} />
        </Box>

        {enableTeamLeadTabs && (
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="rectangular" width="100%" height={48} />
          </Box>
        )}

        <Box sx={{ width: "100%", height: "100%" }}>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={40}
            sx={{ mb: 1 }}
          />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width="100%"
              height={40}
              sx={{ mb: 1 }}
            />
          ))}
        </Box>
      </Box>
    ),
    [enableTeamLeadTabs],
  );

  if (loading) {
    return LoadingSkeleton;
  }

  return (
    <div>
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
          {displayTitle}
        </Typography>
        <DateRangeFilter 
          component={componentName} 
          onDateChange={onDateRangeChange}
        />
      </Stack>

      {enableTeamLeadTabs && (
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Team Submissions" />
            <Tab label="Self Submissions" />
          </Tabs>
        </Paper>
      )}

      <DataTablePaginated
        data={displayData}
        columns={columns}
        title={displayTitle}
        enableSelection={false}
        defaultSortColumn="submissionId"
        defaultSortDirection="desc"
        defaultRowsPerPage={pagination?.pageSize || 10}
        refreshData={refreshData}
        primaryColor="#00796b"
        secondaryColor="#e0f2f1"
        customStyles={{
          headerBackground: "#1976d2",
          rowHover: "#e0f2f1",
          selectedRow: "#b2dfdb",
        }}
        onAddNew={onAddNew || openNewCandidateDrawer}
        uniqueId="submissionId"
        serverSide={true}
        totalCount={pagination?.totalElements || 0}
        page={pagination?.currentPage || 0}
        rowsPerPage={pagination?.pageSize || 10}
        onPageChange={handlePageChangeCallback}
        onRowsPerPageChange={handleRowsPerPageChangeCallback}
        onSortChange={handleSortChangeCallback}
        onFilterChange={handleFilterChangeCallback}
        onSearchChange={handleSearchChangeCallback}
        enableLocalFiltering={false}
        enableServerSideFiltering={enableServerSideFiltering}
        searchValue={searchQuery}
      />

      <Dialog
        open={moveToBenchDialogOpen}
        onClose={handleMoveToBenchCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Move Candidate to Bench</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to move {selectedCandidate?.fullName} to the
            bench? Please add any remarks below.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="remarks"
            label="Remarks"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMoveToBenchCancel} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleMoveToBenchConfirm}
            color="primary"
            variant="contained"
            disabled={moveToBenchLoading}
          >
            {moveToBenchLoading ? (
              <CircularProgress size={24} />
            ) : (
              "Move to Bench"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        open={openDrawer}
        onClose={closeDrawer}
        anchor="right"
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: "80%", md: "70%", lg: "60%" },
          },
        }}
      >
        <Box sx={{ height: "100%", overflow: "auto" }}>
          {openDrawer && (
            <CandidateSubmissionDrawer
              candidateData={candidateData}
              setCandidateData={setCandidateData}
              onClose={closeDrawer}
              mode={mode}
              refreshData={refreshData}
              userId={userId}
            />
          )}
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={scheduleDrawerOpen}
        onClose={closeScheduleDrawer}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: "80%", md: "70%", lg: "60%" },
          },
        }}
      >
        <Box sx={{ height: "100%", overflow: "auto" }}>
          {scheduleDrawerOpen && scheduleData && (
            <ScheduleInterviewForm
              data={scheduleData}
              onClose={closeScheduleDrawer}
              onSuccess={handleScheduleSuccess}
              refreshData={refreshData}
            />
          )}
        </Box>
      </Drawer>
    </div>
  );
};

export default React.memo(BaseSubmission);