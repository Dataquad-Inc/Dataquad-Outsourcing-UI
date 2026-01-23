import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Link,
  CircularProgress,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarTodayIcon,
  Edit,
  Delete,
} from "@mui/icons-material";
import DownloadResume from "../../utils/DownloadResume";
import { API_BASE_URL } from "../../Services/httpService";

export const generateSubmissionColumns = (handlers = {}, role = "EMPLOYEE", loadingStates = {}) => {
  const {
    handleEdit = () => {},
    handleDelete = () => {},
    handleMoveToBenchClick = () => {},
    openScheduleDrawer = () => {},
    handleJobIdClick = () => {},
    moveToBenchLoading = false,
    downloadLoading = false,
    scheduleLoading = false,
  } = handlers;

  return [
    {
      key: "candidateId",
      label: "Candidate ID",
      type: "text",
      sortable: false,
      filterable: false,
      width: 120,
      render: (row) => (
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
    {
      key: "fullName",
      label: "Full Name",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: (row) => (
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
      render: (row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
      render: (row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
      sortable: false,
      filterable: false,
      width: 100,
      render: (row) => {
        const canClickJobId = role === "SUPERADMIN" || role === "COORDINATOR" || 
                              role === "TEAMLEAD" || role === "BDM" || role === "ADMIN";

        if (canClickJobId) {
          return (
            <Link
              component="button"
              variant="body2"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleJobIdClick(row.jobId);
              }}
              sx={{
                textDecoration: "none",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {row.jobId}
            </Link>
          );
        } else {
          return (
            <Typography variant="body2" color="primary">
              {row.jobId}
            </Typography>
          );
        }
      },
    },
    {
      key: "candidateEmailId",
      label: "Email",
      type: "text",
      sortable: false,
      filterable: false,
      width: 220,
      render: (row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EmailIcon fontSize="small" color="action" />
          <Typography
            variant="body2"
            sx={{
              color: "#7d1fcfff",
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `mailto:${row.emailId || row.candidateEmailId}`;
            }}
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
       sortable: false,
      filterable: false,
      width: 120,
      render: (row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PhoneIcon fontSize="small" color="action" />
          <Typography variant="body2">{row.contactNumber}</Typography>
        </Box>
      ),
    },
    {
      key: "status",
      label: "Status",
      type: "text",
       sortable: false,
      filterable: false,
      width: 180,
      align: "center",
      render: (row) => {
        const getStatusColor = (status) => {
          switch (status) {
            case "PROCESSED FOR INTERVIEW":
              return "success";
            case "MOVED TO INTERVIEW":
              return "primary";
            case "SCREEN REJECT":
            case "CLIENT REJECT":
              return "error";
            case "DUPLICATE":
              return "warning";
            default:
              return "default";
          }
        };

        return (
          <Chip
            label={row.status}
            variant="outlined"
            size="small"
            color={getStatusColor(row.status)}
          />
        );
      },
    },
    {
      key: "moveToBench",
      label: "Move to Bench",
      sortable: false,
      filterable: false,
      width: 130,
      align: "center",
      render: (row) => (
        <Button
          variant="outlined"
          size="small"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleMoveToBenchClick(row, e);
          }}
          disabled={moveToBenchLoading}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 2,
            py: 0.5,
          }}
        >
          {moveToBenchLoading ? (
            <CircularProgress size={16} />
          ) : "To Bench"}
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
      render: (row) => (
        <Button
          variant="contained"
          size="small"
          color="primary"
          startIcon={
            scheduleLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <CalendarTodayIcon fontSize="small" />
            )
          }
          onClick={(e) => {
            console.log("=== Schedule Button Clicked ===");
            console.log("Row:", row);
            e.preventDefault();
            e.stopPropagation();
            
            if (!scheduleLoading) {
              openScheduleDrawer(row, e);
            }
          }}
          disabled={scheduleLoading}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 2,
            py: 0.5,
            minWidth: 140,
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          {scheduleLoading ? "Opening..." : "Schedule"}
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
      render: (row) => (
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
          <DownloadResume
            candidate={{ ...row, jobId: row.jobId }}
            getDownloadUrl={(candidate, format) =>
              `${API_BASE_URL}/candidate/download-resume/${candidate.candidateId}/${candidate.jobId}?format=${format}`
            }
          />
          <Tooltip title="Edit Candidate">
            <IconButton
              size="small"
              onClick={(e) => {
                console.log("=== Edit Button Clicked ===");
                console.log("Row:", row);
                e.stopPropagation();
                e.preventDefault();
                handleEdit(row, e);
              }}
              sx={{ color: "info.main" }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Candidate">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDelete(row.submissionId, e);
              }}
              sx={{ color: "error.main" }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
};