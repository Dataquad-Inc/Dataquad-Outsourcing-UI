import React from "react";
import { Box, IconButton, Skeleton } from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";

import formatPhoneNumber from "../../utils/formatPhoneNumber";

// Role-based permission checker
const hasPermission = (userRole, userId, row, action) => {
  if (userRole === "SUPERADMIN") {
    return true;
  }

  if (userRole === "TEAMLEAD") {
    return row.teamleadId === userId;
  }

  if (userRole === "RECRUITER") {
    return row.recruiterId === userId;
  }

  if (userRole === "SALESEXECUTIVE") {
    return row.salesExecutiveId === userId;
  }

  return false;
};

const renderValue = (value, width = 100, loading) =>
  loading ? <Skeleton width={width} /> : value;

const getHotListColumns = ({
  handleNavigate,
  handleEdit,
  handleDelete,
  loading,
  userRole,
  userId,
}) => [
  // ✅ Actions column moved first
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

      const canEdit = hasPermission(userRole, userId, row, "edit");
      const canDelete = hasPermission(userRole, userId, row, "delete");

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

  // ✅ Other columns (without icons in headers)
  {
    id: "consultantId",
    label: "Consultant ID",
    filterType: "text",
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
    render: (v) => renderValue(v, 120, loading),
  },
  {
    id: "teamleadName",
    label: "Team Lead",
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "salesExecutive",
    label: "Sales Executive",
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "recruiterName",
    label: "Recruiter",
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "reference",
    label: "Reference",
    render: (v) => renderValue(v, 80, loading),
  },

  // {
  //   id: "technology",
  //   label: "Technology",
  //   render: (v) => renderValue(v, 100, loading),
  // },
  // {
  //   id: "emailId",
  //   label: "Consultant Email",
  //   filterType: "text",
  //   render: (v) => renderValue(v, 150, loading),
  // },
  // {
  //   id: "marketingContact",
  //   label: "Marketing Contact",
  //   render: (v) => renderValue(v, 120, loading),
  // },
  {
    id: "experience",
    label: "Exp (Yrs)",
    filterType: "number",
    render: (v) => renderValue(v, 50, loading),
  },
  {
    id: "billRate",
    label: "Bill Rate",
    render: (v) => renderValue(`$${v}`, 60, loading),
  },
  {
    id: "payroll",
    label: "Payroll",
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "marketingVisa",
    label: "Marketing Visa",
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "actualVisa",
    label: "Actual Visa",
    render: (v) => renderValue(v, 80, loading),
  },
];

export default getHotListColumns;
