import { InputAdornment } from "@mui/material";



export const placementFormFields = {
  consultantFields: [
    {
      id: "candidateFullName",
      label: "Consultant Name",
      type: "text",
      required: true,
      grid: { xs: 12, sm: 6 },
      helperText: "Enter consultant's full name",
    },
    {
      id: "candidateEmailId",
      label: "Email",
      type: "email",
      required: true,
      grid: { xs: 12, sm: 6 },
      helperText: "Example: name@example.com",
    },
    {
      id: "candidateContactNo",
      label: "Phone",
      type: "tel",
      required: true,
      grid: { xs: 12, sm: 6 },
      helperText: "10 digits only",
      inputProps: { maxLength: 15 },
    },
    {
      id: "technology",
      label: "Technology",
      type: "text",
      required: true,
      grid: { xs: 12, sm: 6 },
    },
  ],
  
  clientFields: [
    {
      id: "clientName",
      label: "Client",
      type: "text",
      required: true,
      grid: { xs: 12, sm: 6 },
    },
    {
      id: "vendorName",
      label: "Vendor",
      type: "text",
      required: true,
      grid: { xs: 12, sm: 6 },
    },
  ],
  
  dateFields: [
    {
      id: "startDate",
      label: "Start Date",
      isDate: true,
      required: true,
      grid: { xs: 12, sm: 6 },
    },
    {
      id: "endDate",
      label: "End Date",
      isDate: true,
      grid: { xs: 12, sm: 6 },
    },
  ],
  
  financialFields: [
    {
      id: "billRate",
      label: "Bill Rate",
      type: "text",
      required: true,
      grid: { xs: 12, sm: 6 },
      inputProps: {
        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
      },
    },
    {
      id: "payRate",
      label: "Pay Rate",
      type: "text",
      required: true,
      grid: { xs: 12, sm: 6 },
      inputProps: {
        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
      },
    },
    {
      id: "grossProfit",
      label: "Gross Profit",
      type: "text",
      readOnly: true,
      grid: { xs: 12, sm: 6 },
      inputProps: {
        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        readOnly: true,
      },
    },
  ],
  
  employmentFields: [
    {
      id: "employmentType",
      label: "Employment Type",
      type: "select",
      required: true,
      grid: { xs: 12, sm: 6 },
      options: [
        { value: "W2", label: "W2" },
        { value: "1099", label: "1099" },
        { value: "C2C", label: "C2C" },
        { value: "Full-time", label: "Full-time" },
        { value: "Part-time", label: "Part-time" },
        { value: "Contract", label: "Contract" },
        { value: "Contract-to-hire", label: "Contract-to-hire" },
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      required: true,
      grid: { xs: 12, sm: 6 },
      options: [
        { value: "Active", label: "Active" },
        { value: "On Hold", label: "On Hold" },
        { value: "Completed", label: "Completed" },
        { value: "Terminated", label: "Terminated" },
        { value: "Cancelled", label: "Cancelled" },
      ],
    },
  ],
  
  internalFields: [
    {
      id: "recruiterName",
      label: "Recruiter",
      type: "text",
      grid: { xs: 12, sm: 6 },
    },
    {
      id: "sales",
      label: "Sales",
      type: "text",
      grid: { xs: 12, sm: 6 },
    },
    {
      id: "statusMessage",
      label: "Status Message",
      type: "text",
      grid: { xs: 12 },
    },
    {
      id: "remarks",
      label: "Remarks",
      type: "text",
      multiline: true,
      rows: 3,
      grid: { xs: 12 },
    },
  ]
};