import React from "react";
import { Box, Skeleton } from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import ReusableMenu from "../../ui-lib/ReusableMenu";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useSelector } from "react-redux";

// ✅ Permission logic
const hasPermission = (userRole) => {
  return userRole === "SALESEXECUTIVE" || userRole === "TEAMLEAD" || userRole === "SUPERADMIN" || userRole === "GRANDSALES"; // ❌ Sales Executive has no edit/delete
};


const renderValue = (value, width = 100, loading) =>
  loading ? <Skeleton width={width} /> : value;

const getRTRListColumns = ({
  handleNavigate,
  handleEdit,
  handleDelete,
  handleView,
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
      
      
 
      if (!canEdit && !canDelete && !canView) {
        return <Box sx={{ minWidth: 80 }}>-</Box>;
      }

      // ✅ Build actions dynamically
      const actionOptions = [];

      
      if (canEdit)
        actionOptions.push({
          label: "Edit RTR",
          icon: <Edit fontSize="small" color="primary" />,
          action: () => handleEdit(row),
        });

      if (canDelete)
        actionOptions.push({
          label: "Delete RTR",
          icon: <Delete fontSize="small" color="error" />,
          action: () => handleDelete(row),
        });

      return (
        <ReusableMenu
          options={actionOptions.map((opt) => opt.label)}
          onSelect={(label) => {
            const selected = actionOptions.find((opt) => opt.label === label);
            if (selected) selected.action();
          }}
          icon={<MoreVertIcon />}
          menuWidth="15ch"
        />
      );
    },
  },

  // ✅ RTR specific columns
  {
    id: "rtrId",
    label: "RTR ID",
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
          onClick={() => handleNavigate(row.rtrId)}
        >
          {value}
        </Box>
      ),
  },
  {
    id: "consultantName",
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
    filterOptions: filterOptions.technology || [],
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "clientName",
    label: "Client Name",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.clientName || [],
    render: (v) => renderValue(v, 120, loading),
  },
  {
    id: "ratePart",
    label: "Rate Part",
    filterType: "text",
    applyFilter: true,
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "rtrStatus",
    label: "RTR Status",
    filterType: "select",
    applyFilter: true,
    filterOptions: [
      { label: "Submitted", value: "Submitted" },
      { label: "In Review", value: "In Review" },
      { label: "Approved", value: "Approved" },
      { label: "Rejected", value: "Rejected" },
      { label: "On Hold", value: "On Hold" },
    ],
    render: (v) => {
      const getStatusColor = (status) => {
        switch (status) {
          case "Approved":
            return "success.main";
          case "Rejected":
            return "error.main";
          case "In Review":
            return "warning.main";
          case "On Hold":
            return "text.secondary";
          default:
            return "primary.main";
        }
      };

      return loading ? (
        <Skeleton width={80} />
      ) : (
        <Box
          sx={{
            color: getStatusColor(v),
            fontWeight: "bold",
            fontSize: "0.875rem",
          }}
        >
          {v}
        </Box>
      );
    },
  },
  {
    id: "salesExecutive",
    label: "Sales Executive",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.salesExecutive || [],
    render: (v) => renderValue(v, 100, loading),
  },
  (userRole === "TEAMLEAD" && {
    id: "createdBy",
    label: "Submitted By",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.createdBy || [],
    render: (v) => renderValue(v, 100, loading),
  }),
  {
    id: "vendorName",
    label: "Vendor Name",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.vendorName || [],
    render: (v) => renderValue(v, 120, loading),
  },
  {
    id: "vendorEmailId",
    label: "Vendor Email",
    filterType: "text",
    applyFilter: true,
    render: (v) => renderValue(v, 150, loading),
  },
  {
    id: "vendorMobileNumber",
    label: "Vendor Mobile",
    filterType: "text",
    applyFilter: true,
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "vendorCompany",
    label: "Vendor Company",
    filterType: "text",
    applyFilter: true,
    render: (v) => renderValue(v, 120, loading),
  },
  {
    id: "vendorLinkedIn",
    label: "Vendor LinkedIn",
    filterType: "text",
    applyFilter: true,
    render: (v) =>
      loading ? (
        <Skeleton width={120} />
      ) : v ? (
        <Box
          component="a"
          href={v.startsWith("http") ? v : `https://${v}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "primary.main",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          View LinkedIn
        </Box>
      ) : (
        "-"
      ),
  },
  {
    id: "implementationPartner",
    label: "Implementation Partner",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.implementationPartner || [],
    render: (v) => renderValue(v, 120, loading),
  },
];

export default getRTRListColumns;
