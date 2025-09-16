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
  filterOptions = {}, // Pass filter options from parent component
}) => [
  {
    id: "jobId",
    label: "Job ID",
    applyFilter: true,
    filterType: "text",
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
    applyFilter: true,
    filterType: "text",
    filterOptions: filterOptions.clientName || [],
    render: (v) => renderValue(v),
  },
  {
    id: "jobTitle",
    label: "Job Title",
    applyFilter: true,
    filterType: "text",
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
    id: "jobType",
    label: "Job Type",
    applyFilter: true,
    filterType: "text",
    filterOptions: filterOptions.jobType || [],
    render: (v) => (v ? <Chip label={v} size="small" /> : "-"),
  },
  {
    id: "location",
    label: "Location",
    applyFilter: true,
    filterType: "text",
    filterOptions: filterOptions.location || [],
    render: (v) => renderValue(v),
  },
  {
    id: "experienceRequired",
    label: "Exp Req",
    applyFilter: true,
    filterType: "number",
    render: (v) => renderValue(v),
  },
  {
    id: "noticePeriod",
    label: "Notice Period (Days)",
    applyFilter: true,
    filterType: "number",
    render: (v) => renderValue(v),
  },
  {
    id: "qualification",
    label: "Qualification",
    applyFilter: true,
    filterType: "text",
    filterOptions: filterOptions.qualification || [],
    render: (v) => renderValue(v),
  },
  {
    id: "salaryPackage",
    label: "Salary Package (LPA)",
    applyFilter: true,
    filterType: "number",
    render: (v) => renderValue(v),
  },
  {
    id: "noOfPositions",
    label: "No. of Positions",
    applyFilter: true,
    filterType: "number",
    render: (v) => renderValue(v),
  },
  {
    id: "visaType",
    label: "Visa Type",
    applyFilter: true,
    filterType: "text",
    filterOptions: filterOptions.visaType || [],
    render: (v) => renderValue(v),
  },
  {
    id: "assignedBy",
    label: "Assigned By",
    applyFilter: true,
    filterType: "text",
    filterOptions: filterOptions.assignedBy || [],
    render: (v) => renderValue(v),
  },
  {
    id: "assignedUsers",
    label: "Assigned Users",
    applyFilter: false,
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
    applyFilter: false,
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
    applyFilter: true,
    filterType: "text",
    filterOptions: filterOptions.status || [],
    render: (v) => (v ? <Chip label={v} size="small" /> : "-"),
  },
  {
    id: "createdAt",
    label: "Created At",
    applyFilter: false,
    filterType: "dateRange",
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    id: "updatedAt",
    label: "Updated At",
    applyFilter: false,
    filterType: "dateRange",
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    id: "actions",
    label: "Actions",
    applyFilter: false,
    render: (_, row) => (
      <Box sx={{ display: "flex", gap: 1 }}>
        <IconButton onClick={() => handleEdit(row.jobId)}>
          <Edit fontSize="small" />
        </IconButton>
        <IconButton color="error" onClick={() => handleDelete(row.jobId)}>
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    ),
    align: "center",
  },
];

export default getRequirementsColumns;
