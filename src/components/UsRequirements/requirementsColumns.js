import React from "react";
import {
  Box,
  IconButton,
  Skeleton,
  Chip,
  Tooltip,
  Link,
  Typography,
} from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Business from "@mui/icons-material/Business";
import Work from "@mui/icons-material/Work";
import LocationOn from "@mui/icons-material/LocationOn";
import Group from "@mui/icons-material/Group";
import Code from "@mui/icons-material/Code";
import Timeline from "@mui/icons-material/Timeline";
import TrendingUp from "@mui/icons-material/TrendingUp";
import School from "@mui/icons-material/School";
import Schedule from "@mui/icons-material/Schedule";
import Payments from "@mui/icons-material/Payments";
import RequestQuote from "@mui/icons-material/RequestQuote";
import Adjust from "@mui/icons-material/Adjust";
import Event from "@mui/icons-material/Event";
import EventBusy from "@mui/icons-material/EventBusy";
import Description from "@mui/icons-material/Description";
import Comment from "@mui/icons-material/Comment";
import Download from "@mui/icons-material/Download";
import OpenInNew from "@mui/icons-material/OpenInNew";
import Visibility from "@mui/icons-material/Visibility";

const renderValue = (value, width = 100, loading) =>
  loading ? <Skeleton width={width} /> : value ?? "-";

const iconLabel = (IconComp, text) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <IconComp fontSize="small" /> {text}
  </Box>
);

// Status → Chip Color mapping
const statusColors = {
  Open: "success",
  Closed: "default",
  OnHold: "warning",
  Cancelled: "error",
};

// Job Mode → Chip Color mapping
const jobModeColors = {
  Remote: "#901E3E",
  Onsite: "#065084",
  Hybrid: "#EB5B00",
};

// Employment Type → Chip Color mapping
const employmentTypeColors = {
  FullTime: "success",
  PartTime: "info",
  Contract: "warning",
  Internship: "secondary",
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getRequirementsColumns = ({
  handleEdit,
  handleDelete,
  loading,
  onViewJD,
  handleNagivateToReqProfile,
}) => [
  {
    id: "jobId",
    label: iconLabel(Business, "Job ID"),
    render: (v, row) =>
      loading ? (
        <Skeleton width={80} />
      ) : v ? (
        <Link
          component="button"
          variant="body2"
          onClick={() =>
            handleNagivateToReqProfile && handleNagivateToReqProfile(row)
          }
          sx={{ textDecoration: "none", fontWeight: "bold" }}
        >
          {v}
        </Link>
      ) : (
        "-"
      ),
    minWidth: 100,
  },
  {
    id: "clientName",
    label: iconLabel(Business, "Client"),
    render: (v) => renderValue(v, 120, loading),
    minWidth: 120,
  },
  {
    id: "jobTitle",
    label: iconLabel(Work, "Job Title"),
    render: (v, row) =>
      loading ? (
        <Skeleton width={150} />
      ) : v ? (
        <Link
          component="button"
          variant="body2"
          onClick={() =>
            handleNagivateToReqProfile && handleNagivateToReqProfile(row)
          }
          sx={{ textDecoration: "none", fontWeight: "medium" }}
        >
          {v}
        </Link>
      ) : (
        "-"
      ),
    minWidth: 150,
  },
  {
    id: "jobMode",
    label: "Work Mode",
    render: (v) =>
      loading ? (
        <Skeleton width={80} />
      ) : v ? (
        <Chip
          label={v}
          size="small"
          variant="outlined"
          sx={{
            borderColor: jobModeColors[v] || "grey.400",
            color: jobModeColors[v] || "text.primary",
          }}
        />
      ) : (
        "-"
      ),
    minWidth: 100,
  },
  {
    id: "location",
    label: iconLabel(LocationOn, "Location"),
    render: (v) => renderValue(v, 120, loading),
    minWidth: 120,
  },
  {
    id: "employmentType",
    label: "Employment Type",
    render: (v) =>
      loading ? (
        <Skeleton width={100} />
      ) : v ? (
        <Chip
          label={v}
          size="small"
          color={employmentTypeColors[v] || "default"}
          variant="outlined"
        />
      ) : (
        "-"
      ),
    minWidth: 120,
  },
  {
    id: "noOfPositions",
    label: iconLabel(Group, "Positions"),
    render: (v) => renderValue(v, 80, loading),
    minWidth: 80,
    align: "center",
  },
  {
    id: "skills",
    label: iconLabel(Code, "Skills"),
    render: (v) =>
      loading ? (
        <Skeleton width={150} />
      ) : v ? (
        <Box sx={{ maxWidth: 200 }}>
          <Typography variant="body2" noWrap title={v}>
            {v}
          </Typography>
        </Box>
      ) : (
        "-"
      ),
    minWidth: 150,
  },
  {
    id: "experience",
    label: iconLabel(Timeline, "Exp (Yrs)"),
    render: (v) => renderValue(v ? `${v}+` : null, 80, loading),
    minWidth: 80,
    align: "center",
  },
  {
    id: "relevantExperience",
    label: iconLabel(TrendingUp, "Rel. Exp"),
    render: (v) => renderValue(v ? `${v}+` : null, 80, loading),
    minWidth: 80,
    align: "center",
  },
  {
    id: "status",
    label: iconLabel(Adjust, "Status"),
    render: (v) =>
      loading ? (
        <Skeleton width={80} />
      ) : v ? (
        <Chip
          label={v}
          size="small"
          color={statusColors[v] || "default"}
          sx={{ fontWeight: "bold" }}
        />
      ) : (
        "-"
      ),
    minWidth: 100,
  },
  {
    id: "jobPostedDate",
    label: iconLabel(Event, "Posted Date"),
    render: (v) => renderValue(formatDate(v), 100, loading),
    minWidth: 100,
  },
  {
    id: "jobClosingDate",
    label: iconLabel(EventBusy, "Closing Date"),
    render: (v) => renderValue(formatDate(v), 100, loading),
    minWidth: 100,
  },
  {
    id: "jdFile",
    label: iconLabel(Description, "JD File"),
    render: (v, row) =>
      loading ? (
        <Skeleton width={40} />
      ) : v ? (
        <Tooltip title="Download JD">
          <IconButton
            size="small"
            color="primary"
            onClick={() => onViewJD && onViewJD(row)}
          >
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        "-"
      ),
    minWidth: 80,
    align: "center",
  },
  {
    id: "actions",
    label: "Actions",
    render: (_, row) =>
      loading ? (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      ) : (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="View Requirement Profile">
            <IconButton
              color="info"
              onClick={() =>
                handleNagivateToReqProfile && handleNagivateToReqProfile(row)
              }
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Requirement">
            <IconButton color="primary" onClick={() => handleEdit(row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Requirement">
            <IconButton color="error" onClick={() => handleDelete(row)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    minWidth: 140,
    align: "center",
  },
];

export default getRequirementsColumns;