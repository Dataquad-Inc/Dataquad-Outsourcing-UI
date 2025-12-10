import { formatDateTime } from "../../utils/dateformate";

export const generateCandidatesColumns = () => [
  {
    id: "submissionId",
    field: "submissionId",
    label: "Submission ID",
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