const getRequirementsSections = (isEditMode = false) => {
  return [
    {
      section: "Job Details",
      fields: [
        {
          name: "clientName",
          label: "Client Name",
          type: "text",
          required: true,
          icon: "Business",
          helperText: "Enter the full name of the client company",
        },
        {
          name: "jobTitle",
          label: "Job Title",
          type: "text",
          required: true,
          icon: "Work",
          helperText: "Specific role title (e.g., Senior Frontend Developer)",
        },
        {
          name: "jobMode",
          label: "Job Mode",
          type: "select",
          required: true,
          icon: "BusinessCenter",
          options: [
            { label: "Remote", value: "Remote" },
            { label: "Onsite", value: "Onsite" },
            { label: "Hybrid", value: "Hybrid" },
          ],
          helperText: "Select the work arrangement for this position",
        },
        {
          name: "location",
          label: "Job Location",
          type: "text",
          required: true,
          icon: "LocationOn",
          helperText: "City, State or specific office location",
        },
        {
          name: "employmentType",
          label: "Employment Type",
          type: "select",
          required: true,
          icon: "WorkHistory",
          options: [
            { label: "Full Time", value: "FullTime" },
            { label: "Part Time", value: "PartTime" },
            { label: "Contract", value: "Contract" },
            { label: "Internship", value: "Internship" },
          ],
          helperText: "Select the type of employment offered",
        },
        {
          name: "noOfPositions",
          label: "Number of Positions",
          type: "number",
          required: true,
          icon: "Group",
          helperText: "How many openings are available for this role",
        },
        {
          name: "assignedBy",
          label: "Assigned By",
          type: "text",
          icon: "AssignmentInd",
          helperText: "Person or team who assigned this requirement",
        },
      ],
    },
    {
      section: "Requirements",
      fields: [
        {
          name: "skills",
          label: "Required Skills",
          type: "text",
          required: true,
          icon: "Code",
          helperText:
            "Comma-separated list of technical skills (e.g., React, Node.js, AWS)",
        },
        {
          name: "experience",
          label: "Total Experience (Years)",
          type: "number",
          required: true,
          icon: "Timeline",
          helperText: "Minimum years of professional experience required",
        },
        {
          name: "relevantExperience",
          label: "Relevant Experience (Years)",
          type: "number",
          icon: "TrendingUp",
          helperText:
            "Years of experience specifically in this role/technology",
        },
        {
          name: "qualification",
          label: "Minimum Qualification",
          type: "text",
          icon: "School",
          helperText:
            "Educational requirements (e.g., Bachelor's in Computer Science)",
        },
        {
          name: "noticePeriod",
          label: "Notice Period",
          type: "number",
          icon: "Schedule",
          helperText: "Maximum notice period acceptable (in days)",
        },
      ],
    },
    {
      section: "Compensation",
      fields: [
        {
          name: "salaryPackage",
          label: "Salary Package",
          type: "number",
          icon: "Payments",
          helperText: "Annual compensation in USD (if disclosed)",
        },
        {
          name: "payrollType",
          label: "Payroll Type",
          type: "select",
          icon: "RequestQuote",
          options: [
            { label: "W2", value: "W2" },
            { label: "C2C", value: "C2C" },
            { label: "1099", value: "1099" },
          ],
          helperText: "Select the employment classification",
        },
      ],
    },
    {
      section: "Status & Dates",
      fields: [
        {
          name: "status",
          label: "Job Status",
          type: "select",
          required: true,
          icon: "Adjust",
          options: [
            { label: "Open", value: "Open" },
            { label: "Closed", value: "Closed" },
            { label: "On Hold", value: "OnHold" },
            { label: "Cancelled", value: "Cancelled" },
          ],
          helperText: "Current status of this job requirement",
        },
        {
          name: "jobPostedDate",
          label: "Job Posted Date",
          type: "date",
          icon: "Event",
          helperText: "When this position was officially posted",
        },
        {
          name: "jobClosingDate",
          label: "Job Closing Date",
          type: "date",
          icon: "EventBusy",
          helperText: "Last date to accept applications",
        },
      ],
    },
    {
      section: "Description & Attachments",
      fields: [
        {
          name: "jobDescription",
          label: "Job Description",
          type: "textarea",
          required: false,
          icon: "Description",
          helperText:
            "Detailed description of roles, responsibilities, and expectations",
        },
        {
          name: "jdFile",
          label: "Upload Job Description File",
          type: "file",
          required: !isEditMode,
          multiple: false,
          accept: ".pdf,.doc,.docx",
          maxSize: 5,
          icon: "UploadFile",
          helperText: "Upload PDF or Word document (max 5MB)",
        },
      ],
    },
    {
      section: "Additional Notes",
      fields: [
        {
          name: "notes",
          label: "Notes / Remarks",
          type: "textarea",
          icon: "Comment",
          helperText: "Any additional information or special instructions",
        },
      ],
    },
  ];
};

export default getRequirementsSections;