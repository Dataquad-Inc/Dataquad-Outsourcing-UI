import React from "react";
import { Box, Skeleton, IconButton, Tooltip } from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import CalendarToday from "@mui/icons-material/CalendarToday"; // ✅ Schedule Interview
import { useSelector } from "react-redux";

// ✅ Permission logic
const canEdit = (role) =>
  role === "TEAMLEAD" || role === "SUPERADMIN" ||role === "SALESEXECUTIVE";

const canDelete = (role) =>
  role === "TEAMLEAD" || role === "SUPERADMIN" ;

const canScheduleInterview = (role) =>
  role === "TEAMLEAD" || role === "SUPERADMIN" || role === "SALESEXECUTIVE";

const renderValue = (value, width = 100, loading) =>
  loading ? <Skeleton width={width} /> : value;

const getRTRListColumns = ({
  handleNavigate,
  handleEdit,
  handleDelete,
  handleView,
  handleScheduleInterview, // ✅ Added handler for schedule interview
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
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
        );
      }

      const allowEdit = canEdit(userRole);
      const allowDelete = canDelete(userRole);
      const allowSchedule = canScheduleInterview(userRole);

      if (!allowEdit && !allowDelete && !allowSchedule) {
        return <Box sx={{ minWidth: 80 }}>-</Box>;
      }

      return (
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          {/* ✅ Schedule Interview Button */}
          {allowSchedule && (
            <Tooltip title="Schedule Interview">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleScheduleInterview(row)}
              >
                <CalendarToday fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* ✅ Edit Button */}
          {allowEdit && (
            <Tooltip title="Edit RTR">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleEdit(row)}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* ✅ Delete Button — Only SuperAdmin & TeamLead */}
          {allowDelete && (
            <Tooltip title="Delete RTR">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(row)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      );
    },
  },

  // ✅ RTR columns
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
  userRole === "TEAMLEAD" && {
    id: "createdByName",
    label: "Submitted By",
    filterType: "text",
    applyFilter: true,
    filterOptions: filterOptions.createdByName || [],
    render: (v) => renderValue(v, 100, loading),
  },
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
