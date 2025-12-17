import React from "react";
import {
  Box,
  IconButton,
  Chip,
  Typography,
  Link,
  Tooltip,
} from "@mui/material";
import {
  Edit,
  Delete,
  Visibility,
  Download,
  Person,
  Email,
  Phone,
} from "@mui/icons-material";
import CustomChip from "../../ui-lib/CustomChip";
import { ViewMoreCell } from "../../utils/ViewMoreCell";
import { render } from "@testing-library/react";
import { AlignJustify } from "lucide-react";

const renderValue = (value) => value || "-";

const getSubmissionsColumns = ({
  handleNavigateToSubmissionProfile,
  handleEdit,
  handleDelete,
  handleDownloadResume,
  handleViewResume,
  userRole,
  filterOptions = {},
}) => {
  return [
    {
      id: "submissionId",
      label: "Submission ID",
      applyFilter: true,
      filterType: "text",
      filterOptions: filterOptions.submissionId || [],
      render: (v, row) => (
        <Box
          sx={{
            cursor: "pointer",
            textDecoration: "underline",
            color: "primary.main",
            "&:hover": {
              textDecoration: "none",
            },
          }}
          onClick={() => handleNavigateToSubmissionProfile(row.submissionId)}
        >
          <Typography variant="body2" sx={{ fontWeight: "medium" }}>
            {renderValue(v)}
          </Typography>
        </Box>
      ),
      width: "180px",
    },
    {
      id: "candidateName",
      label: "Candidate Name",
      applyFilter: true,
      filterType: "text",
      filterOptions: filterOptions.candidateName || [],
      render: (v) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Person fontSize="small" color="action" />
          <Typography variant="body2" sx={{ fontWeight: "medium" }}>
            {renderValue(v)}
          </Typography>
        </Box>
      ),
      width: "180px",
    },
    {
      id: "candidateEmail",
      label: "Email",
      applyFilter: true,
      filterType: "text",
      render: (v) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Email fontSize="small" color="action" />
          <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
            {renderValue(
              v)}
          </Typography>
        </Box>
      ),
      width: "160px",
      align: "center",
    },
    {
      id: "mobileNumber",
      label: "Mobile",
      applyFilter: true,
      filterType: "text",
      render: (value) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.875rem",
            whiteSpace: "nowrap", // prevents breaking
          }}
        >
          {value || "N/A"}
        </Typography>
      ),
    },
    {
      id: "jobId",
      label: "Job ID",
      applyFilter: true,
      filterType: "text",
      render: (v) => (
        <Chip label={v} size="small" variant="outlined" color="primary" />
      ),
      width: "110px",
    },
    {
      id: "recruiterName",
      label: "Recruiter",
      applyFilter: true,
      filterType: "text",
      filterOptions: filterOptions.recruiterName || [],
      render: (v) => renderValue(v),
      width: "150px",
    },
    {
      id: "visaType",
      label: "Visa Type",
      applyFilter: true,
      filterType: "select",
      filterOptions: [
        { value: "H1B", label: "H1B" },
        { value: "OPT", label: "OPT" },
        { value: "STEM_OPT", label: "STEM OPT" },
        { value: "OPT_EAD", label: "OPT EAD" },
        { value: "H4_EAD", label: "H4 EAD" },
        { value: "GC_EAD", label: "GC EAD" },
        { value: "CPT", label: "CPT" },
        { value: "GC", label: "Green Card" },
        { value: "Citizen", label: "Citizen" },
      ],
      render: (v) => (v ? <CustomChip visaType={v} size="small" /> : "-"),
      width: "120px",
    },
    {
      id: "billRate",
      label: "Bill Rate ($)",
      applyFilter: true,
      filterType: "number",
      render: (v) => (v ? `$${v}` : "-"),
      width: "110px",
    },
    {
      id: "currentCTC",
      label: "Current CTC ($)",
      applyFilter: true,
      filterType: "number",
      render: (v) => (v ? `$${v}` : "-"),
      width: "120px",
    },
    {
      id: "expectedCTC",
      label: "Expected CTC ($)",
      applyFilter: true,
      filterType: "number",
      render: (v) => (v ? `$${v}` : "-"),
      width: "120px",
    },
    {
      id: "totalExperience",
      label: "Total Exp (Yrs)",
      applyFilter: true,
      filterType: "number",
      render: (v) => (v ? `${v} yrs` : "-"),
      width: "120px",
    },
    {
      id: "relevantExperience",
      label: "Relevant Exp (Yrs)",
      applyFilter: true,
      filterType: "number",
      render: (v) => (v ? `${v} yrs` : "-"),
      width: "130px",
    },
    {
      id: "noticePeriod",
      label: "Notice Period",
      applyFilter: true,
      filterType: "text",
      render: (v) => renderValue(v),
      width: "130px",
    },
    {
      id: "currentLocation",
      label: "Location",
      applyFilter: true,
      filterType: "text",
      filterOptions: filterOptions.currentLocation || [],
      render: (v) => renderValue(v),
      width: "150px",
    },
    {
      id: "qualification",
      label: "Qualification",
      applyFilter: true,
      filterType: "select",
      filterOptions: filterOptions.qualification || [],
      render: (v,row) => (
        <ViewMoreCell
          value={v}
          label="Qualification" 
          maxLength={10}
          maxWidth={120}
        />    
      ),
      width: "140px",
    },
    {
      id: "employmentType",
      label: "Employment Type",
      applyFilter: true,
      filterType: "select",
      filterOptions: [
        { value: "Full-time", label: "Full-time" },
        { value: "Part-time", label: "Part-time" },
        { value: "Contract", label: "Contract" },
        { value: "C2C", label: "C2C" },
        { value: "W2", label: "W2" },
      ],
      render: (v) => (
        <Chip
          label={v}
          size="small"
          color={v === "Full-time" ? "primary" : "default"}
          variant="outlined"
        />
      ),
      width: "130px",
    },
    {
      id: "relocation",
      label: "Relocation",
      applyFilter: true,
      filterType: "select",
      filterOptions: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
      render: (v) => (
        <Chip
          label={v ? "Yes" : "No"}
          size="small"
          color={v ? "success" : "default"}
          variant="outlined"
        />
      ),
      width: "100px",
    },
    // {
    //   id: "communicationSkillsRating",
    //   label: "Communication",
    //   applyFilter: true,
    //   filterType: "number",
    //   render: (v) => (v ? `${v}/10` : "-"),
    //   width: "120px",
    // },
    // {
    //   id: "requiredTechnologiesRating",
    //   label: "Tech Rating",
    //   applyFilter: true,
    //   filterType: "number",
    //   render: (v) => (v ? `${v}/10` : "-"),
    //   width: "100px",
    // },
    {
      id: "overallFeedback",
      label: "Feedback",
      applyFilter: false,
      render: (v, row) => (
        <ViewMoreCell
          value={v} 
          label="Overall Feedback"
          identifier={row.candidateName}
          maxLength={50}
          maxWidth={120}
        />
      ),    
      width: "200px",
    },
      {
      id: "actions",
      label: "Actions",
      applyFilter: false,
      render: (_, row) => (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Tooltip title="Download Resume">
            <IconButton
              size="small"
              onClick={() =>
                handleDownloadResume(row.submissionId, row.candidateName)
              }
            >
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit Submission">
            <IconButton
              size="small"
              onClick={() => handleEdit(row.submissionId)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Delete Only for SUPERADMIN */}
          {userRole === "SUPERADMIN" && (
            <Tooltip title="Delete Submission">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(row.submissionId)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
      align: "center",
      width: "150px",
    },
  ];
};

export default getSubmissionsColumns;
