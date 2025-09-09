import React from "react";
import {
  Box,
  IconButton,
  Chip,
  Typography,
  Link,
  Tooltip,
} from "@mui/material";
import { Edit, Delete, Visibility, Download } from "@mui/icons-material";

const renderValue = (value) => value || "-";

const getRequirementsColumns = ({
  handleEdit,
  handleDelete,
  handleNagivateToReqProfile,
  handleDownloadJD,
}) => [
  {
    id: "jobId",
    label: "Job ID",
    render: (v, row) =>
      v ? (
        <Link
          component="button"
          onClick={() => handleNagivateToReqProfile(row)}
          underline="hover"
        >
          {v}
        </Link>
      ) : (
        "-"
      ),
  },
  {
    id: "clientName",
    label: "Client",
    render: (v) => renderValue(v),
  },
  {
    id: "jobTitle",
    label: "Job Title",
    render: (v) => renderValue(v),
  },
  {
    id: "jobType",
    label: "Job Type",
    render: (v) => (v ? <Chip label={v} size="small" /> : "-"),
  },
  {
    id: "location",
    label: "Location",
    render: (v) => renderValue(v),
  },
  {
    id: "experienceRequired",
    label: "Experience Required",
    render: (v) => renderValue(v),
  },
  {
    id: "noticePeriod",
    label: "Notice Period (Days)",
    render: (v) => renderValue(v),
  },
  {
    id: "relevantExperience",
    label: "Relevant Experience",
    render: (v) => renderValue(v),
  },
  {
    id: "qualification",
    label: "Qualification",
    render: (v) => renderValue(v),
  },
  {
    id: "salaryPackage",
    label: "Salary Package (LPA)",
    render: (v) => renderValue(v),
  },
  {
    id: "noOfPositions",
    label: "No. of Positions",
    render: (v) => renderValue(v),
  },
  {
    id: "visaType",
    label: "Visa Type",
    render: (v) => renderValue(v),
  },
  {
    id: "assignedBy",
    label: "Assigned By",
    render: (v) => renderValue(v),
  },
  {
    id: "assignedUsers",
    label: "Assigned Users",
    render: (v) =>
      v && v.length
        ? v.map((user) => (
            <Chip
              key={user.userId}
              label={user.userName}
              size="small"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))
        : "-",
  },
  {
    id: "jobDescription",
    label: "Description",
    render: (v, row) =>
      v ? (
        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
          {v}
        </Typography>
      ) : row.jobDescription == null ? (
        <Tooltip title="Download JD File">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleDownloadJD(row.jobId)}
          >
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        "-"
      ),
  },
  {
    id: "status",
    label: "Status",
    render: (v) => (v ? <Chip label={v} size="small" /> : "-"),
  },
  {
    id: "createdAt",
    label: "Created At",
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    id: "updatedAt",
    label: "Updated At",
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    id: "actions",
    label: "Actions",
    render: (_, row) => (
      <Box sx={{ display: "flex", gap: 1 }}>
        {/* <IconButton color="primary" onClick={() => handleEdit(row)}>
          <Edit fontSize="small" />
        </IconButton> */}
        <IconButton color="error" onClick={() => handleDelete(row.jobId)}>
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    ),
    align: "center",
  },
];

export default getRequirementsColumns;
