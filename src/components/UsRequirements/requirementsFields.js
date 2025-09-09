const getRequirementsSections = (isEditMode = false, employees = []) => {
  // Transform employees array for dropdown options
  const employeeOptions = employees.map((emp) => ({
    label: emp.employeeName || emp.name || emp.email,
    value: emp.employeeId,
  }));

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
          name: "visaType",
          label: "Type of Visa",
          type: "select",
          required: true,
          icon: "BusinessCenter",
          options: [
            { value: "H1B", label: "H1B" },
            { value: "OPT", label: "OPT" },
            { value: "STEM_OPT", label: "STEM OPT" },
            { value: "OPT_EAD", label: "OPT EAD" },
            { value: "H4_EAD", label: "H4 EAD" },
            { value: "GC_EAD", label: "GC EAD" },
            { value: "CPT", label: "CPT" },
            { value: "GC", label: "Green Card" },
            { value: "Citizen", label: "Citizen" },
            { value: "Other", label: "Other" },
          ],
          helperText: "Select the visa type required for this position",
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
          name: "jobType",
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
          name: "experienceRequired",
          label: "Experience Required",
          type: "text",
          required: true,
          icon: "Timeline",
          helperText:
            "Required experience details (e.g., '5+ years in React, Node.js')",
        },
        {
          name: "relevantExperience",
          label: "Relevant Experience",
          type: "text",
          icon: "TrendingUp",
          helperText: "Specific relevant experience requirements",
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
          type: "text",
          icon: "Schedule",
          helperText:
            "Notice period requirements (e.g., '30 days', 'Immediate')",
        },
      ],
    },
    {
      section: "Compensation",
      fields: [
        {
          name: "salaryPackage",
          label: "Salary Package",
          type: "text",
          icon: "Payments",
          helperText: "Salary details (e.g., '$120,000 per year', '$50/hour')",
        },
      ],
    },
    {
      section: "Status & Assignment",
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
          name: "assignedUsers",
          label: "Assign to Users",
          type: "multiselect",
          icon: "Group",
          options: employeeOptions,
          helperText: "Select users to assign this requirement to",
        },
      ],
    },
    {
      section: "Job Description",
      fields: [
        {
          name: "jobDescriptionType",
          label: "How would you like to provide the job description?",
          type: "radio",
          required: true,
          icon: "Description",
          options: [
            { label: "Enter as Text", value: "text" },
            { label: "Upload File", value: "file" },
          ],
          helperText:
            "Choose whether to type the job description or upload a file",
          defaultValue: "text",
        },
        {
          name: "jobDescription",
          label: "Job Description",
          type: "textarea",
          required: true,
          icon: "Description",
          helperText:
            "Enter detailed job description, requirements, and responsibilities",
          rows: 6,
          placeholder: "Enter job description here...",
          // This field should only show when jobDescriptionType is "text"
          conditionalDisplay: {
            field: "jobDescriptionType",
            condition: "equals",
            value: "text",
          },
        },
        {
          name: "jobDescriptionFile",
          label: "Job Description File",
          type: "file",
          required: true,
          icon: "AttachFile",
          helperText: "Upload job description file (.pdf, .doc, .docx, .txt)",
          accept: ".pdf,.doc,.docx,.txt",
          // This field should only show when jobDescriptionType is "file"
          conditionalDisplay: {
            field: "jobDescriptionType",
            condition: "equals",
            value: "file",
          },
        },
      ],
    },
  ];
};

export default getRequirementsSections;
