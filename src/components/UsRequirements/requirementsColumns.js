import React from "react";
import {
  Box,
  IconButton,
  Skeleton,
  Chip,
  Tooltip,
  Link,
  Typography,
  Avatar,
  AvatarGroup,
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
import AssignmentInd from "@mui/icons-material/AssignmentInd";
import Badge from "@mui/icons-material/Badge";
import AccessTime from "@mui/icons-material/AccessTime";

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
  "IN PROGRESS": "info",
};

// Job Mode → Chip Color mapping
const jobModeColors = {
  Remote: "#901E3E",
  Onsite: "#065084",
  Hybrid: "#EB5B00",
};

// Employment Type → Chip Color mapping
const employmentTypeColors = {
  "Full-time": "success",
  "Part-time": "info",
  Contract: "warning",
  Internship: "secondary",
  FullTime: "success",
  PartTime: "info",
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const truncateText = (text, maxLength = 50) => {
  if (!text) return "-";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
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
    id: "jobType", // Updated field name
    label: "Job Type",
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
    id: "noOfPositions",
    label: iconLabel(Group, "Positions"),
    render: (v) => renderValue(v, 80, loading),
    minWidth: 80,
    align: "center",
  },
  {
    id: "experienceRequired", // Updated field name
    label: iconLabel(Timeline, "Experience"),
    render: (v) => renderValue(v, 100, loading),
    minWidth: 100,
  },
  {
    id: "relevantExperience",
    label: iconLabel(TrendingUp, "Rel. Exp"),
    render: (v) => renderValue(v, 120, loading),
    minWidth: 120,
  },
  {
    id: "qualification",
    label: iconLabel(School, "Qualification"),
    render: (v) =>
      loading ? (
        <Skeleton width={150} />
      ) : v ? (
        <Tooltip title={v}>
          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
            {truncateText(v, 20)}
          </Typography>
        </Tooltip>
      ) : (
        "-"
      ),
    minWidth: 150,
  },
  {
    id: "salaryPackage",
    label: iconLabel(Payments, "Salary"),
    render: (v) =>
      loading ? (
        <Skeleton width={120} />
      ) : v ? (
        <Typography
          variant="body2"
          sx={{ fontWeight: "medium", color: "success.main" }}
        >
          {v}
        </Typography>
      ) : (
        "-"
      ),
    minWidth: 130,
  },
  {
    id: "noticePeriod",
    label: iconLabel(AccessTime, "Notice Period"),
    render: (v) => renderValue(v, 100, loading),
    minWidth: 120,
  },
  {
    id: "visaType",
    label: iconLabel(Badge, "Visa Type"),
    render: (v) =>
      loading ? (
        <Skeleton width={80} />
      ) : v ? (
        <Chip label={v} size="small" color="secondary" variant="filled" />
      ) : (
        "-"
      ),
    minWidth: 100,
  },
  {
    id: "assignedBy",
    label: iconLabel(AssignmentInd, "Assigned By"),
    render: (v) => renderValue(v, 100, loading),
    minWidth: 120,
  },
  {
    id: "assignedUsers",
    label: iconLabel(Group, "Assigned Users"),
    render: (v) =>
      loading ? (
        <Skeleton width={120} />
      ) : v && Array.isArray(v) && v.length > 0 ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AvatarGroup
            max={3}
            sx={{
              "& .MuiAvatar-root": {
                width: 24,
                height: 24,
                fontSize: "0.75rem",
              },
            }}
          >
            {v.map((user, index) => (
              <Avatar key={user.userId || index} title={user.userName}>
                {user.userName?.charAt(0)?.toUpperCase() || "U"}
              </Avatar>
            ))}
          </AvatarGroup>
          {v.length > 3 && (
            <Typography variant="caption" color="text.secondary">
              +{v.length - 3}
            </Typography>
          )}
        </Box>
      ) : (
        "-"
      ),
    minWidth: 140,
  },
  {
    id: "jobDescription",
    label: iconLabel(Comment, "Description"),
    render: (v) =>
      loading ? (
        <Skeleton width={200} />
      ) : v ? (
        <Tooltip title={v}>
          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
            {truncateText(v, 40)}
          </Typography>
        </Tooltip>
      ) : (
        "-"
      ),
    minWidth: 200,
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
    minWidth: 120,
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
