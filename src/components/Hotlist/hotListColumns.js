import React from "react";
import { Box, Skeleton, IconButton, Tooltip, Button } from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CustomChip from "../../ui-lib/CustomChip";
import DialogValueViewer from "../../ui-lib/DialogValueViewer";

// ✅ Permission logic
const hasPermission = (userRole) => {
  return userRole !== "SALESEXECUTIVE";
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const renderValue = (value, width = 100, loading) =>
  loading ? <Skeleton width={width} /> : value;

// Helper to safely coerce any value to a string for DialogValueViewer
const getSafeValue = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value))
    return value
      .map((item) =>
        typeof item === "object" && item !== null
          ? item.userName || item.name || JSON.stringify(item)
          : String(item)
      )
      .join(", ");
  if (typeof value === "object") {
    if (value.userName) return value.userName;
    if (value.name) return value.name;
    return JSON.stringify(value);
  }
  return String(value);
};

// Renders a string column cell with DialogValueViewer truncation.
// Falls back to plain renderValue when loading.
const renderStringCell = (v, loading, width = 100) => {
  if (loading) return <Skeleton width={width} />;
  if (v === null || v === undefined || v === "") return "-";
  return (
    <DialogValueViewer
      value={getSafeValue(v)}
      label=""
      renderTrigger={(onClick) => (
        <span
          onClick={onClick}
          style={{
            display: "inline-flex",
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          {getSafeValue(v)}
        </span>
      )}
    />
  );
};

const getHotListColumns = ({
  handleNavigate,
  handleEdit,
  handleDelete,
  handleView,
  handleNavigateRTR,
  handleMoveToYetToOnboard,
  loading,
  userRole,
  userId,
  filterOptions = {},
}) => [
  // ✅ Actions column
  {
    id: "consultantId",
    label: "Consultant ID",
    filterType: "text",
    applyFilter: true,
    render: (value, row) =>
      loading ? (
        <Skeleton width={100} />
      ) : (
        <Box
          sx={{
            color: "primary.main",
            textDecoration: "underline",
            cursor: "pointer",
            "&:hover": { textDecoration: "none" },
          }}
          onClick={() => handleNavigate(row.consultantId)}
        >
          {value}
        </Box>
      ),
  },
  {
    id: "name",
    label: "Consultant Name",
    filterType: "text",
    applyFilter: true,
    render: (v) => renderStringCell(v, loading, 120),
  },
  {
    id: "technology",
    label: "Technology",
    filterType: "text",
    applyFilter: true,
    render: (v) => renderStringCell(v, loading, 100),
  },
  {
    id: "teamleadName",
    label: "Team Lead",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.teamleadName || [],
    render: (v) => renderStringCell(v, loading, 80),
  },
  {
    id: "salesExecutive",
    label: "Sales Executive",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.salesExecutive || [],
    render: (v) => renderStringCell(v, loading, 100),
  },
  {
    id: "recruiterName",
    label: "Recruiter",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.recruiterName || [],
    render: (v) => renderStringCell(v, loading, 80),
  },
  {
    id: "reference",
    label: "Reference",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.reference || [],
    render: (v) => renderStringCell(v, loading, 80),
  },
  {
    id: "remoteOnsite",
    label: "Working Mode",
    filterType: "select",
    applyFilter: true,
    filterOptions: [
      { label: "Remote", value: "Remote" },
      { label: "Onsite", value: "Onsite" },
      { label: "Hybrid", value: "Hybrid" },
    ],
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "experience",
    label: "Exp (Yrs)",
    filterType: "number",
    applyFilter: true,
    render: (v) => renderValue(v, 50, loading),
  },
  {
    id: "location",
    label: "Location",
    filterType: "text",
    applyFilter: true,
    render: (v) => renderStringCell(v, loading, 50),
  },
  {
    id: "billRate",
    label: "Bill Rate",
    filterType: "number",
    applyFilter: true,
    render: (v) => renderValue(`$${v}`, 60, loading),
  },
  {
    id: "payroll",
    label: "Payroll",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.payroll || [],
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "marketingVisa",
    label: "Marketing Visa",
    filterType: "select",
    applyFilter: true,
    filterOptions: [
      { label: "H1B", value: "H1B" },
      { label: "OPT", value: "OPT" },
      { label: "STEM_OPT", value: "STEM OPT" },
      { label: "OPT_EAD", value: "OPT EAD" },
      { label: "H4_EAD", value: "H4 EAD" },
      { label: "GC_EAD", value: "GC EAD" },
      { label: "CPT", value: "CPT" },
      { label: "GC", value: "Green Card" },
      { label: "Citizen", value: "Citizen" },
      { label: "Other", value: "Other" },
    ],
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "actualVisa",
    label: "Actual Visa",
    filterType: "select",
    applyFilter: true,
    filterOptions: [
      { label: "H1B", value: "H1B" },
      { label: "OPT", value: "OPT" },
      { label: "STEM_OPT", value: "STEM OPT" },
      { label: "OPT_EAD", value: "OPT EAD" },
      { label: "H4_EAD", value: "H4 EAD" },
      { label: "GC_EAD", value: "GC EAD" },
      { label: "CPT", value: "CPT" },
      { label: "GC", value: "Green Card" },
      { label: "Citizen", value: "Citizen" },
      { label: "Other", value: "Other" },
    ],
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "originalDOB",
    label: "DOB",
    filterType: "text",
    applyFilter: true,
    render: (v) => (loading ? <Skeleton width={80} /> : formatDate(v)),
  },
  {
    id: "editedDOB",
    label: "Edited DOB",
    filterType: "text",
    applyFilter: true,
    render: (v) => (loading ? <Skeleton width={80} /> : formatDate(v)),
  },
  {
    id: "approvalStatus",
    label: "Approval Status",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.approvalStatus || [],
    render: (v) => renderStringCell(v, loading, 50),
  },
  {
    id: "Yet-To-OnBoard",
    label: "Move Yet-To-OnBoard",
    width: 180,
    render: (_, row) => (
      <Button
        variant="text"
        color="primary"
        disabled={loading}
        onClick={() => handleMoveToYetToOnboard(row)}
        sx={{
          textTransform: "none",
          minWidth: 180,
        }}
      >
        Move Yet-To-OnBoard
      </Button>
    ),
  },
  {
    id: "actions",
    label: "Actions",
    render: (_, row) => {
      if (loading) {
        return (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton width={60} height={32} />
          </Box>
        );
      }

      const canEdit = hasPermission(userRole);
      const canDelete = userRole === "SUPERADMIN"; // 👈 Restrict delete
      const canSubmitRTR = true;

      return (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {/* View */}
          {/* <Tooltip title="View Candidate">
            <IconButton
              size="small"
              color="info"
              onClick={() => handleView(row)}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip> */}

          {/* Edit */}
          {canEdit && (
            <Tooltip title="Edit Candidate">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleEdit(row)}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Delete (Only SUPERADMIN) */}
          {canDelete && (
            <Tooltip title="Delete Candidate">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(row)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Submit RTR */}
          {/* <Tooltip title="Submit RTR">
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<AssignmentTurnedInIcon fontSize="small" />}
              onClick={() => handleNavigateRTR(row)}
              sx={{
                minWidth: "auto",
                px: 1.5,
                py: 0.5,
                fontSize: "0.75rem",
                textTransform: "none",
                whiteSpace: "nowrap",
                height: "32px",
              }}
            >
              Submit RTR
            </Button>
          </Tooltip> */}
        </Box>
      );
    },
  },
];

export const getW2HotlistColumns = ({
  handleNavigate,
  handleEdit,
  handleDelete,
  handleView,
  handleNavigateRTR,
  loading,
  userRole,
  userId,
  filterOptions = {},
}) => [
  // ✅ Actions column
  {
    id: "consultantId",
    label: "Consultant ID",
    filterType: "text",
    applyFilter: true,
    render: (value, row) =>
      loading ? (
        <Skeleton width={100} />
      ) : (
        <Box
          sx={{
            color: "primary.main",
            textDecoration: "underline",
            cursor: "pointer",
            "&:hover": { textDecoration: "none" },
          }}
          onClick={() => handleNavigate(row.consultantId)}
        >
          {value}
        </Box>
      ),
  },
  {
    id: "name",
    label: "Consultant Name",
    filterType: "text",
    applyFilter: true,
    render: (v) => renderStringCell(v, loading, 120),
  },
  {
    id: "technology",
    label: "Technology",
    filterType: "text",
    applyFilter: true,
    render: (v) => renderStringCell(v, loading, 100),
  },
  {
    id: "teamleadName",
    label: "Team Lead",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.teamleadName || [],
    render: (v) => renderStringCell(v, loading, 80),
  },
  {
    id: "salesExecutive",
    label: "Sales Executive",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.salesExecutive || [],
    render: (v) => renderStringCell(v, loading, 100),
  },
  {
    id: "recruiterName",
    label: "Recruiter",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.recruiterName || [],
    render: (v) => renderStringCell(v, loading, 80),
  },
  {
    id: "reference",
    label: "Reference",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.reference || [],
    render: (v) => renderStringCell(v, loading, 80),
  },
  {
    id: "originalDOB",
    label: "Original DOB",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.originalDOB || [],
    render: (v) => (loading ? <Skeleton width={80} /> : formatDate(v)),
  },
  {
    id: "editedDOB",
    label: "Edited DOB",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.editedDOB || [],
    render: (v) => (loading ? <Skeleton width={80} /> : formatDate(v)),
  },
  {
    id: "remoteOnsite",
    label: "Working Mode",
    filterType: "select",
    applyFilter: true,
    filterOptions: [
      { label: "Remote", value: "Remote" },
      { label: "Onsite", value: "Onsite" },
      { label: "Hybrid", value: "Hybrid" },
    ],
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "experience",
    label: "Exp (Yrs)",
    filterType: "number",
    applyFilter: true,
    render: (v) => renderValue(v, 50, loading),
  },
  {
    id: "location",
    label: "Location",
    filterType: "text",
    applyFilter: true,
    render: (v) => renderStringCell(v, loading, 50),
  },
  {
    id: "billRate",
    label: "Bill Rate",
    filterType: "number",
    applyFilter: true,
    render: (v) => renderValue(`$${v}`, 60, loading),
  },
  {
    id: "payroll",
    label: "Payroll",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.payroll || [],
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "marketingVisa",
    label: "Marketing Visa",
    filterType: "select",
    applyFilter: true,
    filterOptions: [
      { label: "H1B", value: "H1B" },
      { label: "OPT", value: "OPT" },
      { label: "STEM_OPT", value: "STEM OPT" },
      { label: "OPT_EAD", value: "OPT EAD" },
      { label: "H4_EAD", value: "H4 EAD" },
      { label: "GC_EAD", value: "GC EAD" },
      { label: "CPT", value: "CPT" },
      { label: "GC", value: "Green Card" },
      { label: "Citizen", value: "Citizen" },
      { label: "Other", value: "Other" },
    ],
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "actualVisa",
    label: "Actual Visa",
    filterType: "select",
    applyFilter: true,
    filterOptions: [
      { label: "H1B", value: "H1B" },
      { label: "OPT", value: "OPT" },
      { label: "STEM_OPT", value: "STEM OPT" },
      { label: "OPT_EAD", value: "OPT EAD" },
      { label: "H4_EAD", value: "H4 EAD" },
      { label: "GC_EAD", value: "GC EAD" },
      { label: "CPT", value: "CPT" },
      { label: "GC", value: "Green Card" },
      { label: "Citizen", value: "Citizen" },
      { label: "Other", value: "Other" },
    ],
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "approvalStatus",
    label: "Approval Status",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.approvalStatus || [],
    render: (v) => renderStringCell(v, loading, 50),
  },
  {
    id: "actions",
    label: "Actions",
    render: (_, row) => {
      if (loading) {
        return (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton width={60} height={32} />
          </Box>
        );
      }

      const canEdit = hasPermission(userRole);
      const canDelete = userRole === "SUPERADMIN"; // 👈 Restrict delete
      const canSubmitRTR = true;

      return (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {/* View */}
          <Tooltip title="View Candidate">
            <IconButton
              size="small"
              color="info"
              onClick={() => handleView(row)}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Edit */}
          {canEdit && (
            <Tooltip title="Edit Candidate">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleEdit(row)}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Delete (Only SUPERADMIN) */}
          {canDelete && (
            <Tooltip title="Delete Candidate">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(row)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Submit RTR */}
          {/* <Tooltip title="Submit RTR">
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<AssignmentTurnedInIcon fontSize="small" />}
              onClick={() => handleNavigateRTR(row)}
              sx={{
                minWidth: "auto",
                px: 1.5,
                py: 0.5,
                fontSize: "0.75rem",
                textTransform: "none",
                whiteSpace: "nowrap",
                height: "32px",
              }}
            >
              Submit RTR
            </Button>
          </Tooltip> */}
        </Box>
      );
    },
  },
];

// hotlist columns

export default getHotListColumns;