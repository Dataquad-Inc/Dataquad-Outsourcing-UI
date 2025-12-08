import React from "react";
import {
  Box,
  IconButton,
  Chip,
  Typography,
  Link,
  Tooltip,
  Button,
} from "@mui/material";
import { Edit, Delete, Visibility, Download, PersonAdd } from "@mui/icons-material";
import { formatDateTime } from "../../utils/dateformate";
import CustomChip from "../../ui-lib/CustomChip";

const renderValue = (value) => value || "-";

const getRequirementsColumns = ({
  handleEdit,
  handleDelete,
  handleNagivateToReqProfile,
  handleDownloadJD,
  handleViewDescription,
  handleSubmitCandidate,
  userRole,
  filterOptions = {}, // Pass filter options from parent component
}) => [
  {
    id: "actions",
    label: "Actions",
    applyFilter: false,
    render: (_, row) => (
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => handleEdit(row.jobId)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        {(userRole==="SUPERADMIN") &&(<Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(row.jobId)}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>)}
        {(userRole === "RECRUITER" || userRole === "TEAMLEAD") && (
          <Tooltip title="Submit Candidate">
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<PersonAdd fontSize="small" />}
              onClick={() => handleSubmitCandidate(row)}
              sx={{
                textTransform: "none",
                minWidth: "auto",
                px: 1,
                py: 0.5,
                fontSize: "0.75rem",
                whiteSpace: "nowrap",
              }}
            >
              Submit
            </Button>
          </Tooltip>
        )}
      </Box>
    ),
    align: "center",
    width: "180px", // Adjusted width for compact layout
  },
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
    render: (value) =>
      value ? <CustomChip jobType={value} size="small" /> : "-",
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
    filterType: "select",
    filterOptions: [
      { value: "H1B", label: "H1B" },
      { value: "OPT", label: "OPT" },
      { value: "STEM_OPT", label: "STEM OPT" },
      { value: "OPT_EAD", label: "OPT EAD" },
      { value: "H4_EAD", label: "H4 EAD" },
      { value: "GC_EAD", label: "GC EAD" },
      { value: "CPT", label: "CPT" },
      { value: "GC", label: "Green Card" },
      { value: "Citizen", label: "Citizen" },
    ],
    render: (value) =>
      value ? <CustomChip visaType={value} size="small" /> : "-",
  },
  {
    id: "assignedByName",
    label: "Assigned By",
    applyFilter: true,
    filterType: "text",
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
    render: (v, row) => {
      if (v) {
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
              {v.length > 50 ? `${v.substring(0, 50)}...` : v}
            </Typography>

            {/* "More" as icon + text button */}
            {v.length > 50 && (
              <Button
                variant="text"
                size="small"
                color="primary"
                startIcon={<Visibility fontSize="small" />}
                onClick={() => handleViewDescription(v, row.jobTitle)}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  minWidth: "auto",
                }}
              >
                More
              </Button>
            )}
          </Box>
        );
      } else if (row.jobDescription == null) {
        return (
          <Tooltip title="Download JD File">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleDownloadJD(row.jobId)}
            >
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      } else {
        return "-";
      }
    },
  },
  {
    id: "status",
    label: "Status",
    applyFilter: true,
    filterType: "select",
    filterOptions: [
      { label: "Open", value: "Open" },
      { label: "In Progress", value: "IN PROGRESS" },
      { label: "Closed", value: "Closed" },
      { label: "On Hold", value: "On_Hold" },
      { label: "Cancelled", value: "Cancelled" },
    ],
    render: (v) => (v ? <Chip label={v} size="small" /> : "-"),
  },
  {
    id: "createdAt",
    label: "Created At",
    applyFilter: false,
    filterType: "dateRange",
    render: (v) => (v ? formatDateTime(v) : "-"),
  },
  {
    id: "updatedAt",
    label: "Updated At",
    applyFilter: false,
    filterType: "dateRange",
    render: (v) => (v ? formatDateTime(v) : "-"),
  },
];

export default getRequirementsColumns;