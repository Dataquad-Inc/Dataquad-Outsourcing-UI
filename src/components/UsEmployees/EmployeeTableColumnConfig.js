import React from "react";
import { Box, IconButton, Skeleton, Chip, Tooltip, Link } from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import AssignmentInd from "@mui/icons-material/AssignmentInd";
import Person from "@mui/icons-material/Person";
import Email from "@mui/icons-material/Email";
import CalendarToday from "@mui/icons-material/CalendarToday";
import Phone from "@mui/icons-material/Phone";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Badge from "@mui/icons-material/Badge";
import formatPhoneNumber from "../../utils/formatPhoneNumber";

const renderValue = (value, width = 100, loading) =>
  loading ? <Skeleton width={width} /> : value ?? "-";

const iconLabel = (IconComp, text) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <IconComp fontSize="small" /> {text}
  </Box>
);

const getEmployeeColumns = ({ handleEdit, handleDelete, loading }) => [
  {
    id: "userId",
    label: iconLabel(AssignmentInd, "Employee ID"),
    render: (v) => renderValue(v, 120, loading),
  },
  {
    id: "userName",
    label: iconLabel(Person, "Name"),
    render: (v) => renderValue(v, 150, loading),
  },
  {
    id: "roles",
    label: iconLabel(Badge, "Role"),
    render: (v) =>
      loading ? (
        <Skeleton width={80} />
      ) : Array.isArray(v) ? (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {v.map((role, i) => (
            <Chip key={i} label={role} size="small" variant="outlined" />
          ))}
        </Box>
      ) : (
        renderValue(v, 100, loading)
      ),
  },
  {
    id: "email",
    label: iconLabel(Email, "Work Email"),
    render: (v) =>
      loading ? (
        <Skeleton width={180} />
      ) : (
        <Link href={`mailto:${v}`} underline="hover">
          {v}
        </Link>
      ),
  },
  {
    id: "joiningDate",
    label: iconLabel(CalendarToday, "Joining Date"),
    render: (v) =>
      renderValue(
        v
          ? new Date(v).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-",
        120,
        loading
      ),
  },
  {
    id: "phoneNumber",
    label: iconLabel(Phone, "Phone Number"),
    render: (v) =>
      loading ? (
        <Skeleton width={130} />
      ) : (
        <Link href={`tel:${v}`} underline="hover">
          {formatPhoneNumber(v)}
        </Link>
      ),
  },
  {
    id: "personalemail",
    label: iconLabel(Email, "Personal Email"),
    render: (v) =>
      loading ? (
        <Skeleton width={180} />
      ) : (
        <Link href={`mailto:${v}`} underline="hover">
          {v}
        </Link>
      ),
  },
  {
    id: "status",
    label: iconLabel(CheckCircle, "Status"),
    render: (v) =>
      loading ? (
        <Skeleton width={100} />
      ) : (
        <Chip
          label={v}
          size="small"
          color={v === "ACTIVE" ? "success" : "default"}
          sx={{ fontWeight: "bold" }}
        />
      ),
  },
  {
    id: "actions",
    label: iconLabel(Edit, "Actions"),
    render: (_, row) =>
      loading ? (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      ) : (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit Employee">
            <IconButton color="primary" onClick={() => handleEdit(row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Employee">
            <IconButton color="error" onClick={() => handleDelete(row)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
  },
];

export default getEmployeeColumns;
