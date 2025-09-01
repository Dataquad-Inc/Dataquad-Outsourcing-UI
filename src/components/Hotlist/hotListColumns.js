import React from "react";
import { Box, IconButton, Skeleton } from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import AssignmentInd from "@mui/icons-material/AssignmentInd";
import Person from "@mui/icons-material/Person";
import Email from "@mui/icons-material/Email";
import Grade from "@mui/icons-material/Grade";
import Contacts from "@mui/icons-material/Contacts";
import Phone from "@mui/icons-material/Phone";
import Info from "@mui/icons-material/Info";
import SupervisorAccount from "@mui/icons-material/SupervisorAccount";
import Group from "@mui/icons-material/Group";
import CheckCircle from "@mui/icons-material/CheckCircle";
import { FaPassport } from "react-icons/fa";
import Engineering from "@mui/icons-material/Engineering";
import LocationOn from "@mui/icons-material/LocationOn";
import CalendarToday from "@mui/icons-material/CalendarToday";
import LinkedIn from "@mui/icons-material/LinkedIn";
import FlightTakeoff from "@mui/icons-material/FlightTakeoff";
import MonetizationOn from "@mui/icons-material/MonetizationOn";
import Payment from "@mui/icons-material/Payment";
import Comment from "@mui/icons-material/Comment";
import Update from "@mui/icons-material/Update";
import { RiVisaFill } from "react-icons/ri";
import Public from "@mui/icons-material/Public";

import formatPhoneNumber from "../../utils/formatPhoneNumber";

const renderValue = (value, width = 100, loading) =>
  loading ? <Skeleton width={width} /> : value;

const iconLabel = (IconComp, text) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <IconComp fontSize="small" /> {text}
  </Box>
);

// Role-based permission checker
const hasPermission = (userRole, userId, row, action) => {
  // Admin has full access
  if (userRole === "SUPERADMIN") {
    return true;
  }

  // Team Lead permissions
  if (userRole === "TEAMLEAD") {
    // Team leads can edit/delete consultants in their team
    return row.teamleadId === userId;
  }

  // Recruiter permissions
  if (userRole === "RECRUITER") {
    // Recruiters can only edit/delete consultants they added
    return row.recruiterId === userId;
  }

  // Sales Executive permissions
  if (userRole === "SALESEXECUTIVE") {
    // Sales executives can edit/delete their own consultants
    return row.salesExecutiveId === userId;
  }

  // Default: no permission
  return false;
};

const getHotListColumns = ({
  handleNavigate,
  handleEdit,
  handleDelete,
  loading,
  userRole, // Add userRole parameter
  userId, // Add userId parameter
}) => [
  {
    id: "consultantId",
    label: iconLabel(AssignmentInd, "Consultant ID"),
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
    label: iconLabel(Person, "Consultant Name"),
    filterType: "text",
    render: (v) => renderValue(v, 120, loading),
  },
  {
    id: "teamleadName",
    label: iconLabel(Person, "Teamlead"),
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "salesExecutive",
    label: iconLabel(SupervisorAccount, "Sales Executive"),
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "recruiterName",
    label: iconLabel(Person, "Recruiter"),
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "technology",
    label: iconLabel(Engineering, "Technology"),
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "emailId",
    label: iconLabel(Email, "Consultant Email"),
    filterType: "text",
    render: (v) => renderValue(v, 150, loading),
  },
  {
    id: "marketingContact",
    label: iconLabel(Contacts, "Marketing Contact"),
    render: (v) => renderValue(v, 120, loading),
  },
  {
    id: "experience",
    label: iconLabel(Grade, "Experience (Yrs)"),
    filterType: "number",
    render: (v) => renderValue(v, 50, loading),
  },
  {
    id: "billRate",
    label: iconLabel(MonetizationOn, "Bill Rate"),
    render: (v) => renderValue(`$${v}`, 60, loading),
  },
  {
    id: "payroll",
    label: iconLabel(Payment, "Payroll"),
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "marketingVisa",
    label: iconLabel(RiVisaFill, "Marketing Visa"),
    render: (v) => renderValue(v, 80, loading),
  },

  {
    id: "actualVisa",
    label: iconLabel(RiVisaFill, "Actual Visa"),
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "actions",
    label: iconLabel(Edit, "Actions"),
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

      // If no permissions, show empty box or minimal content
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
];

export default getHotListColumns;
