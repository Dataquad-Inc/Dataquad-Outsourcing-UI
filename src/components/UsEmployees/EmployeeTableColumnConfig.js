import React from "react";
import { Box, IconButton, Skeleton } from "@mui/material";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import AssignmentInd from "@mui/icons-material/AssignmentInd";
import Person from "@mui/icons-material/Person";
import Email from "@mui/icons-material/Email";
import Engineering from "@mui/icons-material/Engineering";
import CalendarToday from "@mui/icons-material/CalendarToday";
import Phone from "@mui/icons-material/Phone";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Wc from "@mui/icons-material/Wc";
import Badge from "@mui/icons-material/Badge";
import Cake from "@mui/icons-material/Cake";
import formatPhoneNumber from "../../utils/formatPhoneNumber";

const renderValue = (value, width = 100, loading) =>
  loading ? <Skeleton width={width} /> : value;

const iconLabel = (IconComp, text) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <IconComp fontSize="small" /> {text}
  </Box>
);

const getEmployeeColumns = ({ handleEdit, handleDelete, loading }) => [
  {
    id: "employeeId",
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
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "email",
    label: iconLabel(Email, "Work Email"),
    render: (v) => renderValue(v, 180, loading),
  },
  {
    id: "designation",
    label: iconLabel(Engineering, "Designation"),
    render: (v) => renderValue(v, 150, loading),
  },
  {
    id: "joiningDate",
    label: iconLabel(CalendarToday, "Joining Date"),
    render: (v) => renderValue(new Date(v).toLocaleDateString(), 120, loading),
  },
  {
    id: "gender",
    label: iconLabel(Wc, "Gender"),
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "dob",
    label: iconLabel(Cake, "DOB"),
    render: (v) => renderValue(new Date(v).toLocaleDateString(), 120, loading),
  },
  {
    id: "phoneNumber",
    label: iconLabel(Phone, "Phone Number"),
    render: (v) => renderValue(formatPhoneNumber(v), 130, loading),
  },
  {
    id: "personalemail",
    label: iconLabel(Email, "Personal Email"),
    render: (v) => renderValue(v, 180, loading),
  },
  {
    id: "status",
    label: iconLabel(CheckCircle, "Status"),
    render: (v) => renderValue(v, 100, loading),
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
          <IconButton
            color="primary"
            onClick={() => handleEdit(row)}
            title="Edit Employee"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete(row)}
            title="Delete Employee"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
  },
];

export default getEmployeeColumns;
