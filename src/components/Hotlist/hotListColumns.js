import React from "react";
import { Box, IconButton, Skeleton } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import formatPhoneNumber from "../../utils/formatPhoneNumber";

const renderValue = (value, width = 100, loading) =>
  loading ? <Skeleton width={width} /> : value;

const getHotListColumns = ({
  handleNavigate,
  handleEdit,
  handleDelete,
  loading,
}) => [
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
    label: "Candidate",
    filterType: "text",
    render: (v) => renderValue(v, 120, loading),
  },
  {
    id: "emailId",
    label: "Email",
    filterType: "text",
    render: (v) => renderValue(v, 150, loading),
  },
  { id: "grade", label: "Grade", render: (v) => renderValue(v, 50, loading) },
  {
    id: "marketingContact",
    label: "Marketing Contact",
    render: (v) => renderValue(v, 120, loading),
  },
  {
    id: "personalContact",
    label: "Personal Contact",
    render: (v) => renderValue(formatPhoneNumber(v), 120, loading),
  },
  {
    id: "reference",
    label: "Reference",
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "recruiter",
    label: "Recruiter",
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "teamLead",
    label: "Team Lead",
    render: (v) => renderValue(v, 80, loading),
  },
  {
    id: "status",
    label: "Status",
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "passport",
    label: "Passport",
    render: (v) => renderValue(v, 60, loading),
  },
  {
    id: "salesExecutive",
    label: "Sales Executive",
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "remoteOnsite",
    label: "Remote/Onsite",
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "technology",
    label: "Technology",
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "experience",
    label: "Experience (Yrs)",
    filterType: "number",
    render: (v) => renderValue(v, 50, loading),
  },
  {
    id: "location",
    label: "Location",
    render: (v) => renderValue(v, 100, loading),
  },
  {
    id: "originalDOB",
    label: "Original DOB",
    render: (v) => renderValue(new Date(v).toLocaleDateString(), 100, loading),
  },
  {
    id: "editedDOB",
    label: "Edited DOB",
    render: (v) => renderValue(new Date(v).toLocaleDateString(), 100, loading),
  },
  {
    id: "linkedInUrl",
    label: "LinkedIn",
    render: (v) =>
      loading ? (
        <Skeleton width={150} />
      ) : (
        <a href={v} target="_blank" rel="noopener noreferrer">
          {v}
        </a>
      ),
  },
  {
    id: "relocation",
    label: "Relocation",
    render: (v) => renderValue(v, 80, loading),
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
    id: "marketingStartDate",
    label: "Marketing Start",
    render: (v) => renderValue(new Date(v).toLocaleDateString(), 90, loading),
  },
  {
    id: "remarks",
    label: "Remarks",
    render: (v) => renderValue(v, 200, loading),
  },
  {
    id: "consultantAddedTimeStamp",
    label: "Created Date",
    filterType: "date",
    render: (v) => renderValue(new Date(v).toLocaleDateString(), 90, loading),
  },
  {
    id: "updatedTimeStamp",
    label: "Updated Date",
    render: (v) => renderValue(new Date(v).toLocaleDateString(), 90, loading),
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
  {
    id: "actions",
    label: "Actions",
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
