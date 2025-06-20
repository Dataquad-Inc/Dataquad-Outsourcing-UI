import React, { useState, useEffect } from "react";
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
  ButtonGroup,
} from "@mui/material";
import { Download, Edit, Delete } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import DataTable from "../muiComponents/DataTabel";
import CandidateSubmissionDrawer from "../Assigned/CandidateSubmissionDrawer";
import ScheduleInterviewForm from "./ScheduleInterviewForm";
import httpService from "../../Services/httpService";
import { useDispatch, useSelector } from "react-redux";
import DateRangeFilter from "../muiComponents/DateRangeFilter";
import { fetchSubmissionsTeamLead } from "../../redux/submissionSlice";

import { showToast } from "../../utils/ToastNotification";
import { downloadFile } from "../../utils/downloadUtils";
import DownloadResume from "../../utils/DownloadResume";
import { API_BASE_URL } from "../../Services/httpService";
import { filterSubmissionsByTeamlead } from "../../redux/submissionSlice";

const Submission = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [candidateData, setCandidateData] = useState(null);
  const [mode, setMode] = useState("add");
  const [moveToBenchLoading, setMoveToBenchLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const { isFilteredDataRequested } = useSelector((state) => state.bench);
  const {
    filteredSubmissionsForRecruiter,
    selfSubmissionsTL,
    teamSubmissionsTL,
  } = useSelector((state) => state.submission);
  const [isTeamData, setIsTeamData] = useState(false);

  const { userId, role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      let submissions = [];

      if (role === "SUPERADMIN") {
        const response = await httpService.get("/candidate/submissions");
        submissions = response?.data?.data || response?.data || [];
      } else if (role === "TEAMLEAD") {
        // Using Redux for TEAMLEAD
        dispatch(fetchSubmissionsTeamLead());
        return; // Exit the function here as Redux will handle data
      } else if (role === "EMPLOYEE" || role === "BDM") {
        const response = await httpService.get(
          `/candidate/submissionsByUserId/${userId}`
        );
        submissions = response?.data?.data || response?.data || [];
      }

      console.log("submissions", submissions);

      // Set data only if submissions were fetched
      if (submissions.length) {
        setData(submissions);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching candidate submissions:", error);
      showSnackbar("Failed to fetch submissions", "error");
    } finally {
      setLoading(false);
    }
  };

  console.log("sl", selfSubmissionsTL);
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
    showToast(message, severity); // Use the imported showToast function
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleMoveToBench = async (row, e) => {
    e.stopPropagation();

    if (
      window.confirm(
        `Are you sure you want to move ${row.fullName} to the bench?`
      )
    ) {
      try {
        setMoveToBenchLoading(true);

        // Create FormData for the bench request
        const formData = new FormData();
        formData.append("fullName", row.fullName);
        formData.append("email", row.emailId || row.candidateEmailId);
        formData.append("contactNumber", row.contactNumber);
        formData.append("relevantExperience", row.relevantExperience || "");
        formData.append("totalExperience", row.totalExperience || "");

        // Convert skills array to JSON string if needed
        if (Array.isArray(row.skills)) {
          formData.append("skills", JSON.stringify(row.skills));
        } else if (typeof row.skills === "string") {
          // If skills is already a string, split it and convert to JSON
          const skillsArray = row.skills
            .split(",")
            .map((skill) => skill.trim());
          formData.append("skills", JSON.stringify(skillsArray));
        } else {
          // If skills is null or undefined, send empty array
          formData.append("skills", JSON.stringify([]));
        }

        formData.append("linkedin", row.linkedin || "");
        formData.append("referredBy", row.userEmail || "");

        // Fetch resume using the correct endpoint with both jobId and candidateId
        try {
          const response = await httpService.get(
            `/candidate/download-resume/${row.jobId}/${row.candidateId}`,
            {
              responseType: "blob",
            }
          );

          // Get file name from content-disposition or create a default one
          const fileName = response.headers["content-disposition"]
            ? response.headers["content-disposition"].split("filename=")[1]
            : `resume_${row.candidateId}.pdf`;

          // Create a file from the blob
          const contentType = response.headers["content-type"];
          const file = new File([response.data], fileName, {
            type: contentType,
          });

          // Use the correct field name for the API
          formData.append("resumeFiles", file);
        } catch (error) {
          console.error("Error fetching resume:", error);
          // Continue with the bench submission even if resume fetch fails
        }

        // Send to bench endpoint
        await httpService.post("/candidate/bench/save", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Remove from current list
        setData(data.filter((item) => item.submissionId !== row.submissionId));

        showSnackbar(
          `${row.fullName} has been moved to the bench successfully!`
        );
      } catch (error) {
        console.error("Error moving candidate to bench:", error);
        showSnackbar(
          "Failed to move candidate to bench. Please try again.",
          "error"
        );
      } finally {
        setMoveToBenchLoading(false);
      }
    }
  };

  const downloadResume = async (jobId, candidateId, e) => {
    e.stopPropagation();

    try {
      setDownloadLoading(true);

      // Make the request with proper responseType
      const response = await httpService.get(
        `/candidate/download-resume/${candidateId}/${jobId}`
      );

      // Check for empty response
      if (!response.data || response.data.byteLength === 0) {
        throw new Error("Empty file received");
      }

      // Get filename from headers or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `resume_${candidateId}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      // Determine content type from headers or default to PDF
      const contentType = response.headers["content-type"] || "application/pdf";

      // Create the blob
      const blob = new Blob([response.data], { type: contentType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      showSnackbar("Resume downloaded successfully");
    } catch (error) {
      console.error("Download failed:", error);
      showSnackbar("Failed to download resume", "error");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleEdit = (row, e) => {
    e.stopPropagation();
    setCandidateData(row);
    setMode("edit");
    setOpenDrawer(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const selected = event.target.id;
    if (selected === "team") {
      setIsTeamData(true);
      return;
    }
    setIsTeamData(false);
  };

  const handleDelete = async (submissionId, e) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to delete this candidate submission?"
      )
    ) {
      try {
        await httpService.delete(`/candidate/deletesubmission/${submissionId}`);
        fetchData();
        showSnackbar("Candidate submission deleted successfully");
      } catch (error) {
        console.error("Error deleting candidate submission:", error);
        showSnackbar("Failed to delete candidate submission", "error");
      }
    }
  };

  const openNewCandidateDrawer = () => {
    setCandidateData(null);
    setMode("add");
    setOpenDrawer(true);
  };

  const closeDrawer = () => {
    setOpenDrawer(false);
  };

  const openScheduleDrawer = (row, e) => {
    e.stopPropagation();
    setScheduleData(row);
    setScheduleDrawerOpen(true);
  };

  const closeScheduleDrawer = () => {
    setScheduleDrawerOpen(false);
  };

  // const componentName = role === 'SUPERADMIN' ? 'allSubmissions' : 'RecruiterSubmission';
  // Dynamically determine componentName based on role
  const componentName = (() => {
    if (role === "SUPERADMIN") return "allSubmissions";
    if (role === "TEAMLEAD") return "SubmissionsForTeamLead";
    if (role === "EMPLOYEE" || role === "BDM") return "RecruiterSubmission";
    return ""; // Fallback for other roles (optional)
  })();

  const generateColumns = (loading = false) => [
    {
      key: "candidateId",
      label: "Candidate ID",
      type: "text",
      sortable: true,
      filterable: true,
      width: 120,
      render: loading
        ? () => <Skeleton variant="text" width={80} />
        : (row) => (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: "primary.main",
                fontFamily: "monospace",
              }}
            >
              {row.candidateId}
            </Typography>
          ),
    },
    ,
    {
      key: "fullName",
      label: "Full Name",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: loading
        ? () => <Skeleton variant="text" width={120} />
        : (row) => (
            <Typography
              variant="body1"
              sx={{
                fontWeight: 450,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {row.fullName}
            </Typography>
          ),
    },
    {
      key: "clientName",
      label: "Client",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: loading
        ? () => <Skeleton variant="text" width={100} />
        : (row) => (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <BusinessIcon fontSize="small" color="action" />
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                {row.clientName}
              </Typography>
            </Box>
          ),
    },
    {
      key: "recruiterName",
      label: "Recruiter",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: loading
        ? () => <Skeleton variant="text" width={100} />
        : (row) => (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <BusinessIcon fontSize="small" color="action" />
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                {row.recruiterName}
              </Typography>
            </Box>
          ),
    },
    {
      key: "jobId",
      label: "Job ID",
      type: "text",
      sortable: true,
      filterable: true,
      width: 100,
      render: loading
        ? () => <Skeleton variant="text" width={60} />
        : (row) => (
            <Chip
              label={row.jobId}
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          ),
    },
    {
      key: "candidateEmailId",
      label: "Email",
      type: "text",
      sortable: true,
      filterable: true,
      width: 220,
      render: loading
        ? () => <Skeleton variant="text" width={180} />
        : (row) => (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <EmailIcon fontSize="small" color="action" />
              <Typography
                variant="body2"
                sx={{
                  color: "secondary.main",
                  textDecoration: "underline",
                  cursor: "pointer",
                  "&:hover": { color: "secondary.dark" },
                }}
                onClick={() =>
                  (window.location.href = `mailto:${
                    row.candidateEmailId || row.candidateEmailId
                  }`)
                }
              >
                {row.emailId || row.candidateEmailId}
              </Typography>
            </Box>
          ),
    },
    {
      key: "contactNumber",
      label: "Contact",
      type: "text",
      sortable: true,
      filterable: true,
      width: 120,
      render: loading
        ? () => <Skeleton variant="text" width={80} />
        : (row) => (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2">{row.contactNumber}</Typography>
            </Box>
          ),
    },
    {
      key: "submissionId",
      label: "Submission ID",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: loading
        ? () => <Skeleton variant="text" width={120} />
        : (row) => (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: "text.secondary",
                fontFamily: "monospace",
              }}
            >
              {row.submissionId}
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
      render: loading
        ? () => <Skeleton variant="text" width={100} />
        : (row) => (
            <Button
              variant="outlined"
              size="small"
              color="secondary"
              onClick={(e) => handleMoveToBench(row, e)}
              disabled={moveToBenchLoading}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 2,
                py: 0.5,
                "&:hover": {
                  backgroundColor: "secondary.light",
                  color: "secondary.contrastText",
                },
              }}
            >
              {moveToBenchLoading ? <CircularProgress size={20} /> : "To Bench"}
            </Button>
          ),
    },
    {
      key: "schedule",
      label: "Schedule Interview",
      sortable: false,
      filterable: false,
      width: 160,
      align: "center",
      render: loading
        ? () => <Skeleton variant="text" width={120} />
        : (row) => (
            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<CalendarTodayIcon fontSize="small" />}
              onClick={(e) => openScheduleDrawer(row, e)}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 2,
                py: 0.5,
              }}
            >
              Schedule
            </Button>
          ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      filterable: false,
      width: 150,
      align: "center",
      render: loading
        ? () => (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="circular" width={32} height={32} />
              ))}
            </Box>
          )
        : (row) => (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1,
                "& .MuiIconButton-root": {
                  backgroundColor: "action.hover",
                  "&:hover": {
                    backgroundColor: "action.selected",
                  },
                },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* <Tooltip title="Download Resume">
            <IconButton
              size="small"
              onClick={(e) => downloadResume(row.jobId, row.candidateId, e)}
              disabled={downloadLoading}
              sx={{ color: 'success.main' }}
            >
              {downloadLoading ? (
                <CircularProgress size={16} />
              ) : (
                <Download fontSize="small" />
              )}
            </IconButton>
          </Tooltip> */}
              <DownloadResume
                candidate={{ ...row, jobId: row.jobId }} // ✅ Combine row and jobId
                getDownloadUrl={(candidate, format) =>
                  `${API_BASE_URL}/candidate/download-resume/${candidate.candidateId}/${candidate.jobId}?format=${format}`
                }
              />

              <Tooltip title="Edit Candidate">
                <IconButton
                  size="small"
                  onClick={(e) => handleEdit(row, e)}
                  sx={{ color: "info.main" }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Candidate">
                <IconButton
                  size="small"
                  j
                  onClick={(e) => handleDelete(row.submissionId, e)}
                  sx={{ color: "error.main" }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ),
    },
  ];

  const columns = generateColumns(loading);

  return (
    <div>
      {loading ? (
        <Box sx={{ p: 3 }}>
          {/* Header Skeleton */}
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

          {/* Tabs Skeleton (if TEAMLEAD) */}
          {role === "TEAMLEAD" && (
            <Box sx={{ mb: 3 }}>
              <Skeleton variant="rectangular" width="100%" height={48} />
            </Box>
          )}

          {/* Table Skeleton */}
          <Box sx={{ width: "100%" ,height:'100%'}}>
            {/* Simulate Table Header as a Line */}
            <Skeleton
              variant="rectangular"
              width="100%"
              height={40}
              sx={{ mb: 1 }}
            />

            {/* Simulate Table Rows as Horizontal Lines */}
            {Array(8)
              .fill(null)
              .map((_, i) => (
                <Skeleton
                  key={`line-${i}`}
                  variant="rectangular"
                  width="100%"
                  height={40}
                  sx={{ mb: 1 }}
                />
              ))}
          </Box>
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
              Submissions List
            </Typography>

            <DateRangeFilter component={componentName} />
          </Stack>

          {role === "TEAMLEAD" && (
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab id="self" label="Self Submissions" />
                <Tab id="team" label="Team Submissions" />
              </Tabs>
            </Paper>
          )}

          <DataTable
            data={
              isFilteredDataRequested
                ? role === "TEAMLEAD"
                  ? isTeamData
                    ? teamSubmissionsTL
                    : selfSubmissionsTL
                  : filteredSubmissionsForRecruiter
                : role === "TEAMLEAD"
                ? isTeamData
                  ? teamSubmissionsTL
                  : selfSubmissionsTL
                : data || []
            }
            columns={columns}
            title="Candidate Submissions"
            enableSelection={false}
            defaultSortColumn="submissionId"
            defaultSortDirection="desc"
            defaultRowsPerPage={10}
            refreshData={fetchData}
            primaryColor="#00796b"
            secondaryColor="#e0f2f1"
            customStyles={{
              headerBackground: "#1976d2",
              rowHover: "#e0f2f1",
              selectedRow: "#b2dfdb",
            }}
            onAddNew={openNewCandidateDrawer}
            uniqueId="submissionId"
          />

          <Drawer anchor="right" open={openDrawer} onClose={closeDrawer}>
            <CandidateSubmissionDrawer
              candidateData={candidateData}
              setCandidateData={setCandidateData}
              onClose={closeDrawer}
              mode={mode}
              refreshData={fetchData}
              userId={userId}
            />
          </Drawer>

          <Drawer
            anchor="right"
            open={scheduleDrawerOpen}
            onClose={closeScheduleDrawer}
            PaperProps={{
              sx: {
                width: { xs: "100%", sm: "50%", md: "50%", lg: "50%" },
                p: 2,
                pt: 0,
                borderTopLeftRadius: 12,
                borderBottomLeftRadius: 12,
                boxShadow: 3,
                backgroundColor: "#fafafa",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                Schedule Interview
              </Typography>
              <IconButton onClick={closeScheduleDrawer}>
                <CloseIcon />
              </IconButton>
            </Box>

            <ScheduleInterviewForm
              data={scheduleData}
              onClose={closeScheduleDrawer}
              refreshData={fetchData}
            />
          </Drawer>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </div>
  );
};

export default Submission;
