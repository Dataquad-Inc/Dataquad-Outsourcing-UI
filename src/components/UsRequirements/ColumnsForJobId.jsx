
import { formatDateTime } from "../../utils/dateformate";
import { ViewMoreCell } from "../../utils/ViewMoreCell";

import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { Download } from "@mui/icons-material";
import { render } from "@testing-library/react";


export const generateCandidatesColumns = ({ handleDownloadResume, handleNavigateToSubmissionIdProfile }) => [
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
      </Box>
    ),
    align: "center",
    width: "150px",
  },
  {
    id: "submissionId",
    field: "submissionId",
    label: "Submission ID",
    render: (v, row) => (<>
      <Button onClick={() => handleNavigateToSubmissionIdProfile(row.submissionId)}>{v}</Button>
    </>)
  },
  {
    id: "candidateName",
    field: "candidateName",
    label: "Candidate Name",
  },
  {
    id: "candidateEmail",
    field: "candidateEmail",
    label: "Email",
  },
  {
    id: "mobileNumber",
    field: "mobileNumber",
    label: "Mobile Number",
  },
  {
    id: "dob",
    field: "dob",
    label: "Date of Birth",
  },
  {
    id: "visaType",
    field: "visaType",
    label: "Visa Type",
  },
  {
    id: "billRate",
    field: "billRate",
    label: "Bill Rate",
  },
  {
    id: "payRate",
    field: "payRate",
    label: "Pay Rate",
  },
  {
    id: "noticePeriod",
    field: "noticePeriod",
    label: "Notice Period",
  },
  {
    id: "currentLocation",
    field: "currentLocation",
    label: "Current Location",
  },
  {
    id: "relocation",
    field: "relocation",
    label: "Relocation",
  },
  {
    id: "totalExperience",
    field: "totalExperience",
    label: "Total Experience",
  },
  {
    id: "relevantExperience",
    field: "relevantExperience",
    label: "Relevant Experience",
  },
  {
    id: "qualification",
    field: "qualification",
    label: "Qualification",
    render: (v, row) => (
      <ViewMoreCell
        value={v}
        label="Qualification"
        // identifier={row.qualification}
        maxLength={50}
        maxWidth={120}
      />
    ),
  },
  {
    id: "employmentType",
    field: "employmentType",
    label: "Employment Type",
  },
  {
    id: "confirmRTR",
    field: "confirmRTR",
    label: "Confirm RTR",
  },
  {
    id: "overallFeedback",
    field: "overallFeedback",
    label: "Overall Feedback",
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
  },
  {
    id: "recruiterName",
    field: "recruiterName",
    label: "Recruiter Name",
  },
  {
    id: "createdAt",
    field: "createdAt",
    label: "Created At",
    render: (v) => (v ? formatDateTime(v) : "-"),
  },
  {
    id: "updatedAt",
    field: "updatedAt",
    label: "Updated At",
    render: (v) => (v ? formatDateTime(v) : "-"),
  },
  {
    id: "updatedBy",
    field: "updatedBy",
    label: "Updated By",
  },
];