import React from "react";
import { Box, Skeleton } from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import ReusableMenu from "../../ui-lib/ReusableMenu";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn"; 
import CustomChip from "../../ui-lib/CustomChip";

// ✅ Permission logic
const hasPermission = (userRole) => {
  return userRole !== "SALESEXECUTIVE"; // ❌ Sales Executive has no edit/delete
};

const renderValue = (value, width = 100, loading) =>
  loading ? <Skeleton width={width} /> : value;

const getHotListColumns = ({
  handleNavigate,
  handleEdit,
  handleDelete,
  handleView,
  handleNavigateRTR, // 🆕 New callback for RTR
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
          <Box sx={{ display: "flex", gap: 1 }}>
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
        );
      }

      const canEdit = hasPermission(userRole);
      const canDelete = hasPermission(userRole);
      const canView = true;
      const canSubmitRTR = true; // 🆕 Allow all roles to submit RTR (optional restriction possible)

      if (!canEdit && !canDelete && !canView && !canSubmitRTR) {
        return <Box sx={{ minWidth: 80 }}>-</Box>;
      }

      // ✅ Build actions dynamically
      const actionOptions = [];

      if (canView)
        actionOptions.push({
          label: "View Candidate",
          icon: <Visibility fontSize="small" color="info" />,
          action: () => handleView(row),
        });

      if (canEdit)
        actionOptions.push({
          label: "Edit Candidate",
          icon: <Edit fontSize="small" color="primary" />,
          action: () => handleEdit(row),
        });

      if (canDelete)
        actionOptions.push({
          label: "Delete Candidate",
          icon: <Delete fontSize="small" color="error" />,
          action: () => handleDelete(row),
        });

      // 🆕 New Submit RTR action
      if (canSubmitRTR)
        actionOptions.push({
          label: "Submit RTR",
          icon: <AssignmentTurnedInIcon fontSize="small" color="success" />,
          action: () => handleNavigateRTR(row),
        });

      return (
        <ReusableMenu
          options={actionOptions.map((opt) => opt.label)}
          onSelect={(label) => {
            const selected = actionOptions.find((opt) => opt.label === label);
            if (selected) selected.action();
          }}
          icon={<MoreVertIcon />}
          menuWidth="18ch"
        />
      );
    },
  },

  // ✅ Other columns
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

export default getHotListColumns;
