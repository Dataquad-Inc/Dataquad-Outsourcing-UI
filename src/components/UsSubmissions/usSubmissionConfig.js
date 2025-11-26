const getUSSubmissionFieldsConfig = (employees = []) => {
  const recruiterOptions = employees.map((emp) => ({
    label: emp.employeeName || emp.name,
    value: emp.employeeId,
  }));

  return [
    {
      section: "Personal Details",
      fields: [
        {
          name: "candidateName",
          label: "Candidate Name",
          type: "text",
          required: true,
          placeholder: "Enter candidate full name",
        },
        {
          name: "candidateEmail",
          label: "Candidate Email",
          type: "email",
          required: true,
        },
        {
          name: "mobileNumber",
          label: "Mobile Number",
          type: "phone",
          required: true,
        },
        {
          name: "dob",
          label: "Date of Birth",
          type: "date",
        },
      ],
    },

    {
      section: "Job & Recruiter Details",
      fields: [
        {
          name: "jobId",
          label: "Job ID",
          type: "text",
          required: true,
          disabled: true,
        },
        {
          name: "recruiterId",
          label: "Recruiter",
          type: "select",
          required: true,
          options: recruiterOptions,
          placeholder: "Select recruiter",
        },
        {
          name: "visaType",
          label: "Visa Type",
          type: "select",
          required: true,
          options: [
            { label: "H1B", value: "H1B" },
            { label: "OPT", value: "OPT" },
            { label: "H4 EAD", value: "H4 EAD" },
            { label: "GC", value: "Green Card" },
            { label: "Citizen", value: "Citizen" },
            { label: "Other", value: "Other" },
          ],
        },
        {
          name: "employmentType",
          label: "Employment Type",
          type: "select",
          options: [
            { value: "Full-time", label: "Full-time" },
            { value: "Part-time", label: "Part-time" },
            { value: "Contract", label: "Contract" },
          ],
        },
      ],
    },

    {
      section: "Experience & Skills",
      fields: [
        {
          name: "totalExperience",
          label: "Total Experience (Years)",
          type: "number",
        },
        {
          name: "relevantExperience",
          label: "Relevant Experience (Years)",
          type: "number",
        },
        {
          name: "qualification",
          label: "Qualification",
          type: "text",
        },
        {
          name: "requiredTechnologiesRating",
          label: "Technical Skills Rating (1 - 5)",
          type: "number",
          min: 1,
          max: 5,
        },
      ],
    },

    {
      section: "Compensation",
      fields: [
        {
          name: "currentCTC",
          label: "Current CTC",
          type: "text",
        },
        {
          name: "expectedCTC",
          label: "Expected CTC",
          type: "text",
        },
        {
          name: "billRate",
          label: "Bill Rate (Optional)",
          type: "text",
        },
      ],
    },

    {
      section: "Additional Info",
      fields: [
        {
          name: "currentLocation",
          label: "Current Location",
          type: "text",
        },
        {
          name: "relocation",
          label: "Willing to Relocate?",
          type: "select",
          options: [
            { label: "Yes", value: "Yes" },
            { label: "No", value: "No" },
          ],
        },
        {
          name: "communicationSkillsRating",
          label: "Communication Rating",
          type: "select",
          options: [
            { value: "Poor", label: "Poor" },
            { value: "Average", label: "Average" },
            { value: "Good", label: "Good" },
            { value: "Excellent", label: "Excellent" },
          ],
        },
        {
          name: "overallFeedback",
          label: "Overall Feedback",
          type: "textarea",
          rows: 4,
          placeholder: "Enter feedback about candidate",
        },
      ],
    },

    {
      section: "Attachments",
      fields: [
        {
          name: "resume",
          label: "Upload Resume",
          type: "file",
          accept: ".pdf, .doc, .docx",
          helperText: "Upload candidate resume (PDF/DOC/DOCX)",
        },
      ],
    },
  ];
};

export default getUSSubmissionFieldsConfig;
