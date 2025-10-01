import React from "react";
import { Box, IconButton, Skeleton } from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";

// ✅ Permission logic
const hasPermission = (userRole) => {
  if (userRole === "SALESEXECUTIVE") {
    return false; // ❌ No permission
  }
  return true; // ✅ Everyone else has permission
};

const renderValue = (value, width = 100, loading) =>
  loading ? <Skeleton width={width} /> : value;

const getHotListColumns = ({
  handleNavigate,
  handleEdit,
  handleDelete,
  loading,
  userRole,
  userId, // still passed but not used
  filterOptions = {},
}) => [
  // ✅ Actions column first
  {
    id: "actions",
    label: "Actions",
    render: (_, row) => {
      if (loading) {
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
        );
      }

      const canEdit = hasPermission(userRole);
      const canDelete = hasPermission(userRole);

      if (!canEdit && !canDelete) {
        return <Box sx={{ minWidth: 80 }}>-</Box>;
      }

      return (
        <Box sx={{ display: "flex", gap: 1 }}>
          {canEdit && (
            <IconButton
              color="primary"
              onClick={() => handleEdit(row)}
              title="Edit candidate"
            >
              <Edit fontSize="small" />
            </IconButton>
          )}
          {canDelete && (
            <IconButton
              color="error"
              onClick={() => handleDelete(row)}
              title="Delete candidate"
            >
              <Delete fontSize="small" />
            </IconButton>
          )}
        </Box>
      );
    },
  },

  // ✅ Other columns with filter options
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
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.marketingVisa || [],
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "actualVisa",
    label: "Actual Visa",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.actualVisa || [],
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "approvalStatus",
    label: "Approval Status",
    filterType: "text",
    applyFilter: true,
     filterOptions: filterOptions.approvalStatus || [],
    render: (v) => renderValue(v, 50, loading), 
  }
];

export default getHotListColumns;
