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

const getHotListColumns = ({
  handleNavigate,
  handleEdit,
  handleDelete,
  loading,
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
    id: "recruiterName",
    label: iconLabel(Person, "Recruiter"),
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "teamleadName",
    label: iconLabel(Person, "Teamlead"),
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
  // {
  //   id: "grade",
  //   label: iconLabel(Grade, "Grade"),
  //   render: (v) => renderValue(v, 50, loading),
  // },
  {
    id: "marketingContact",
    label: iconLabel(Contacts, "Marketing Contact"),
    render: (v) => renderValue(v, 120, loading),
  },
  // {
  //   id: "personalContact",
  //   label: iconLabel(Phone, "Personal Contact"),
  //   render: (v) => renderValue(formatPhoneNumber(v), 120, loading),
  // },
  // {
  //   id: "reference",
  //   label: iconLabel(Info, "Reference"),
  //   render: (v) => renderValue(v, 100, loading),
  // },
  // {
  //   id: "recruiterId",
  //   label: iconLabel(SupervisorAccount, "Recruiter"),
  //   render: (v) => renderValue(v, 80, loading),
  // },
  // {
  //   id: "teamleadId",
  //   label: iconLabel(Group, "Team Lead"),
  //   render: (v) => renderValue(v, 80, loading),
  // },
  // {
  //   id: "status",
  //   label: iconLabel(CheckCircle, "Status"),
  //   render: (v) => renderValue(v, 100, loading),
  // },
  // {
  //   id: "passport",
  //   label: iconLabel(FaPassport,"Passport"),
  //   render: (v) => renderValue(v, 60, loading),
  // },
  {
    id: "salesExecutive",
    label: iconLabel(SupervisorAccount, "Sales Executive"),
    render: (v) => renderValue(v, 100, loading),
  },
  // {
  //   id: "remoteOnsite",
  //   label: iconLabel(Public, "Remote/Onsite"),
  //   render: (v) => renderValue(v, 100, loading),
  // },

  {
    id: "experience",
    label: iconLabel(Grade, "Experience (Yrs)"),
    filterType: "number",
    render: (v) => renderValue(v, 50, loading),
  },
  {
    id: "location",
    label: iconLabel(LocationOn, "Location"),
    render: (v) => renderValue(v, 100, loading),
  },
  // {
  //   id: "originalDOB",
  //   label: iconLabel(CalendarToday, "Original DOB"),
  //   render: (v) => renderValue(new Date(v).toLocaleDateString(), 100, loading),
  // },
  // {
  //   id: "editedDOB",
  //   label: iconLabel(CalendarToday, "Edited DOB"),
  //   render: (v) => renderValue(new Date(v).toLocaleDateString(), 100, loading),
  // },
  // {
  //   id: "linkedInUrl",
  //   label: iconLabel(LinkedIn, "LinkedIn"),
  //   render: (v) =>
  //     loading ? (
  //       <Skeleton width={150} />
  //     ) : (
  //       <a href={v} target="_blank" rel="noopener noreferrer">
  //         {v}
  //       </a>
  //     ),
  // },
  // {
  //   id: "relocation",
  //   label: iconLabel(FlightTakeoff, "Relocation"),
  //   render: (v) => renderValue(v, 80, loading),
  // },
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
  // {
  //   id: "marketingStartDate",
  //   label: iconLabel(CalendarToday, "Marketing Start"),
  //   render: (v) => renderValue(new Date(v).toLocaleDateString(), 90, loading),
  // },
  {
    id: "remarks",
    label: iconLabel(Comment, "Remarks"),
    render: (v) => renderValue(v, 200, loading),
  },
  // {
  //   id: "consultantAddedTimeStamp",
  //   label: iconLabel(CalendarToday, "Created Date"),
  //   filterType: "date",
  //   render: (v) => renderValue(new Date(v).toLocaleDateString(), 90, loading),
  // },
  // {
  //   id: "updatedTimeStamp",
  //   label: iconLabel(Update, "Updated Date"),
  //   render: (v) => renderValue(new Date(v).toLocaleDateString(), 90, loading),
  // },
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
            title="Edit candidate"
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDelete(row)}
            title="Delete candidate"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
  },
];

export default getHotListColumns;
