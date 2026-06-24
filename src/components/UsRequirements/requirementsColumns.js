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
import {
  Edit,
  Delete,
  Visibility,
  Download,
  PersonAdd,
} from "@mui/icons-material";
import { formatDateTime } from "../../utils/dateformate";
import CustomChip from "../../ui-lib/CustomChip";
import DialogValueViewer from "../../ui-lib/DialogValueViewer";
import { renderStatus } from "../../utils/requirementsStatusChip";

// Safe render function for any value type
const renderValue = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'object' && item !== null) {
        return item.userName || item.name || JSON.stringify(item);
      }
      return String(item);
    }).join(", ");
  }
  if (typeof value === 'object') {
    if (value.userName) return value.userName;
    if (value.name) return value.name;
    return JSON.stringify(value);
  }
  return String(value);
};

// Helper function to safely get string value for DialogValueViewer
const getSafeValue = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'object' && item !== null) {
        return item.userName || item.name || JSON.stringify(item);
      }
      return String(item);
    }).join(", ");
  }
  if (typeof value === 'object') {
    if (value.userName) return value.userName;
    if (value.name) return value.name;
    return JSON.stringify(value);
  }
  return String(value);
};

const getRequirementsColumns = ({
  handleEdit,
  handleDelete,
  handleNagivateToReqProfile,
  handleDownloadJD,
  handleViewDescription,
  handleSubmitCandidate,
  userRole,
  filterOptions = {},
  handleColumnClick = null,
}) => [
  {
    id: "createdAt",
    label: "Created Date",
    applyFilter: true,
    filterType: "dateRange",
    align: "center",
    render: (v) => (v ? formatDateTime(v) : "-"),
  },
  {
    id: "updatedAt",
    label: "Updated Date",
    applyFilter: false,
    align: "center",
    render: (v) => (v ? formatDateTime(v) : "-"),
  },
  {
    id: "jobId",
    label: "Job ID",
    applyFilter: true,
    filterType: "text",
    align: "center",
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
    align: "center",
    filterOptions: filterOptions.clientName || [],
    render: (v, row) =>
      v ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <DialogValueViewer
            value={getSafeValue(v)}
            label="Client"
            renderTrigger={(onClick) => (
              <span
                onClick={(e) => {
                  onClick(e);
                  if (handleColumnClick) {
                    handleColumnClick('clientName', v, row, e);
                  }
                }}
                style={{
                  display: "inline-flex",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {renderValue(v)}
              </span>
            )}
          />
        </Box>
      ) : "-",
  },
  {
    id: "jobTitle",
    label: "Job Title",
    applyFilter: true,
    filterType: "text",
    align: "center",
    width: 50,
    render: (v, row) =>
      v ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <DialogValueViewer
            value={getSafeValue(v)}
            label="Job Title"
            renderTrigger={(onClick) => (
              <span
                onClick={(e) => {
                  handleNagivateToReqProfile(row);
                  onClick(e);
                  if (handleColumnClick) {
                    handleColumnClick('jobTitle', v, row, e);
                  }
                }}
                style={{
                  display: "inline-flex",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {v}
              </span>
            )}
          />
        </Box>
      ) : "-",
  },
  {
    id: "status",
    label: "Status",
    applyFilter: true,
    filterType: "select",
    align: "center",
    filterOptions: [
      { label: "Open", value: "Open" },
      { label: "In Progress", value: "In Progress" },
      { label: "Closed", value: "Closed" },
      { label: "On Hold", value: "On Hold" },
      { label: "Cancelled", value: "Cancelled" },
    ],
    render: (v) =>
      v ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <DialogValueViewer
            value={getSafeValue(v)}
            label="Status"
            renderTrigger={(onClick) => (
              <span
                onClick={(e) => {
                  onClick(e);
                  if (handleColumnClick) {
                    handleColumnClick('status', v, null, e);
                  }
                }}
                style={{
                  display: "inline-flex",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {renderStatus(v)}
              </span>
            )}
          />
        </Box>
      ) : "-",
  },
  {
    id: "jobDescription",
    label: "Description",
    applyFilter: true,
    align: "center",
    render: (v, row) => {
      if (v) {
        const displayText = typeof v === 'string' ? v : renderValue(v);
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
            }}
          >
            <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
              {typeof displayText === 'string' && displayText.length > 50 
                ? `${displayText.substring(0, 50)}...` 
                : displayText}
            </Typography>

            {typeof displayText === 'string' && displayText.length > 50 && (
              <Button
                variant="text"
                size="small"
                color="primary"
                startIcon={<Visibility fontSize="small" />}
                onClick={() => handleViewDescription(displayText, row.jobTitle)}
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
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Tooltip title="Download JD File">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleDownloadJD(row.jobId)}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      } else {
        return "-";
      }
    },
  },
  {
    id: "jobType",
    label: "Job Type",
    applyFilter: true,
    filterType: "text",
    align: "center",
    filterOptions: filterOptions.jobType || [],
    render: (value) =>
      value ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <DialogValueViewer
            value={getSafeValue(value)}
            label="Job Type"
            renderTrigger={(onClick) => (
              <span
                onClick={(e) => {
                  onClick(e);
                  if (handleColumnClick) {
                    handleColumnClick('jobType', value, null, e);
                  }
                }}
                style={{
                  display: "inline-flex",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                <CustomChip jobType={value} size="small" />
              </span>
            )}
          />
        </Box>
      ) : "-",
  },
  {
    id: "assignedByName",
    label: "Assigned By",
    applyFilter: true,
    filterType: "text",
    align: "center",
    render: (v) =>
      v ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <DialogValueViewer
            value={getSafeValue(v)}
            label="Assigned By"
            renderTrigger={(onClick) => (
              <span
                onClick={(e) => {
                  onClick(e);
                  if (handleColumnClick) {
                    handleColumnClick('assignedByName', v, null, e);
                  }
                }}
                style={{
                  display: "inline-flex",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {renderValue(v)}
              </span>
            )}
          />
        </Box>
      ) : "-",
  },
  {
    id: "assignedUsers",
    label: "Assigned Users",
    applyFilter: true,
    align: "center",
    exportValue: (v) => {
      if (!v || v.length === 0) return "N/A";
      if (Array.isArray(v)) {
        return v.map((user) => {
          if (typeof user === 'object' && user !== null) {
            return user.userName || user.name || JSON.stringify(user);
          }
          return String(user);
        }).join(", ");
      }
      return String(v);
    },
    render: (v) => {
      if (!v || v.length === 0) return "-";
      if (Array.isArray(v)) {
        const displayText = v.map((user) => {
          if (typeof user === 'object' && user !== null) {
            return user.userName || user.name || JSON.stringify(user);
          }
          return String(user);
        }).join(", ");
        
        return (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <DialogValueViewer
              value={displayText}
              label="Assigned Users"
              renderTrigger={(onClick) => (
                <span
                  onClick={(e) => {
                    onClick(e);
                    if (handleColumnClick) {
                      handleColumnClick('assignedUsers', v, null, e);
                    }
                  }}
                  style={{
                    display: "inline-flex",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  <small>{displayText}</small>
                </span>
              )}
            />
          </Box>
        );
      }
      return "-";
    },
  },
  {
    id: "submissions",
    label: "Submissions",
    applyFilter: true,
    filterType: "text",
    align: "center",
    filterOptions: filterOptions.submissions || [],
    render: (v) => renderValue(v),
  },
  {
    id: "interviews",
    label: "Interviews",
    applyFilter: true,
    filterType: "text",
    align: "center",
    filterOptions: filterOptions.interviews || [],
    render: (v) => renderValue(v),
  },
  {
    id: "billRate",
    label: "Bill Rate",
    applyFilter: true,
    filterType: "number",
    align: "center",
    filterOptions: [],
    render: (v) => renderValue(v),
  },
  {
    id: "payRate",
    label: "Pay Rate",
    applyFilter: true,
    filterType: "number",
    align: "center",
    filterOptions: [],
    render: (v) => renderValue(v),
  },
  {
    id: "visaType",
    label: "Visa Type",
    applyFilter: true,
    filterType: "select",
    align: "center",
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
      value ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <DialogValueViewer
            value={getSafeValue(value)}
            label="Visa Type"
            renderTrigger={(onClick) => (
              <CustomChip
                visaType={value}
                size="small"
                onClick={(e) => {
                  onClick(e);
                  if (handleColumnClick) {
                    handleColumnClick('visaType', value, null, e);
                  }
                }}
                sx={{
                  maxWidth: "100px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              />
            )}
          />
        </Box>
      ) : "-",
  },
  {
    id: "experienceRequired",
    label: "Exp Req",
    applyFilter: true,
    filterType: "number",
    align: "center",
    render: (v) => renderValue(v), // No click handler - just displays value
  },
  {
    id: "noticePeriod",
    label: "Notice Period (Days)",
    applyFilter: true,
    filterType: "number",
    align: "center",
    render: (v) => renderValue(v), // No click handler - just displays value
  },
  {
    id: "qualification",
    label: "Qualification",
    applyFilter: true,
    filterType: "text",
    align: "center",
    filterOptions: filterOptions.qualification || [],
    render: (v) =>
      v ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <DialogValueViewer
            value={getSafeValue(v)}
            label="Qualification"
            renderTrigger={(onClick) => (
              <span
                onClick={(e) => {
                  onClick(e);
                  if (handleColumnClick) {
                    handleColumnClick('qualification', v, null, e);
                  }
                }}
                style={{
                  display: "inline-flex",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {renderValue(v)}
              </span>
            )}
          />
        </Box>
      ) : "-",
  },
  {
    id: "noOfPositions",
    label: "No. of Positions",
    applyFilter: true,
    filterType: "number",
    align: "center",
    render: (v) => renderValue(v), // No click handler - just displays value
  },
  {
    id: "location",
    label: "Location",
    applyFilter: true,
    filterType: "text",
    align: "center",
    filterOptions: filterOptions.location || [],
    render: (v) =>
      v ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <DialogValueViewer
            value={getSafeValue(v)}
            label="Location"
            renderTrigger={(onClick) => (
              <span
                onClick={(e) => {
                  onClick(e);
                  if (handleColumnClick) {
                    handleColumnClick('location', v, null, e);
                  }
                }}
                style={{
                  display: "inline-flex",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {renderValue(v)}
              </span>
            )}
          />
        </Box>
      ) : "-",
  },
  {
    id: "actions",
    label: "Actions",
    applyFilter: true,
    align: "center",
    width: "180px",
    render: (_, row) => (
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => handleEdit(row.jobId)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        {userRole === "SUPERADMIN" && (
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(row.jobId)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {(userRole === "RECRUITER" || userRole === "TEAMLEAD" || userRole === "GRANDSALES") && (
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
  },
];

export default getRequirementsColumns;