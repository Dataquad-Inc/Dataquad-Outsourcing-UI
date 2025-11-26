import React from "react";
import { Box, Skeleton, IconButton, Tooltip, Button } from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CustomChip from "../../ui-lib/CustomChip";

// ✅ Permission logic
const hasPermission = (userRole) => {
  return userRole !== "SALESEXECUTIVE";
};

const renderValue = (value, width = 100, loading) =>
  loading ? <Skeleton width={width} /> : value;

const getHotListColumns = ({
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
          <Tooltip title="Submit RTR">
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
          </Tooltip>
        </Box>
      );
    },
  },

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
    render: (v) => renderValue(v, 120, loading),
  },
  {
    id: "status",
    label: "status",
    filterType: "select",
    applyFilter: true,
    filterOptions: [
      { label: "Active", value: "Active" },
      { label: "InActive", value: "InActive" },
      { label: "Hold", value: "Hold" },
    ],
    render: (v) => renderValue(v, 120, loading),
  },
  {
    id: "technology",
    label: "Technology",
    filterType: "text",
    applyFilter: true,
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "teamleadName",
    label: "Team Lead",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.teamleadName || [],
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "salesExecutive",
    label: "Sales Executive",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.salesExecutive || [],
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "recruiterName",
    label: "Recruiter",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.recruiterName || [],
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "reference",
    label: "Reference",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.reference || [],
    render: (v) => renderValue(v, 80, loading),
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
    render: (v) => renderValue(v, 50, loading),
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
    render: (v) => renderValue(v, 50, loading),
  },
];

// hotlist columns

export default getHotListColumns;
