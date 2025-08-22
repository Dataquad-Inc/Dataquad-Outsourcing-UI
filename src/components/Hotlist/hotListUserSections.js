import { validateDate } from "@mui/x-date-pickers";

const getHotListUserSections = (employees) => {
  return [
    {
      section: "Hidden Fields", // This section won't be rendered but preserves the ID
      fields: [
        {
          name: "consultantId",
          type: "hidden", // Special type for hidden fields
          required: false,
        },
      ],
    },
    {
      section: "Basic Info",
      fields: [
        {
          name: "name",
          label: "Full Name",
          type: "text",
          required: true,
          icon: "Person",
        },
        {
          name: "emailId",
          label: "Email",
          type: "text",
          required: true,
          icon: "Email",
        },
        { name: "grade", label: "Grade", type: "text", icon: "School" },
        {
          name: "location",
          label: "Location",
          type: "text",
          icon: "LocationOn",
        },
      ],
    },
    {
      section: "Contact Details",
      fields: [
        {
          name: "marketingContact",
          label: "Marketing Contact",
          type: "phone",
          required: true,
          icon: "Phone",
        },
        {
          name: "personalContact",
          label: "Personal Contact",
          type: "phone",
          required: true,
          icon: "Smartphone",
        },
        {
          name: "linkedInUrl",
          label: "LinkedIn URL",
          type: "link",
          icon: "LinkedIn",
        },
      ],
    },
    {
      section: "Team Info",
      fields: [
        {
          name: "reference",
          label: "Reference",
          type: "text",
          icon: "PersonSearch",
        },
        {
          name: "teamleadId",
          label: "Teamlead",
          type: "select",
          icon: "Group",
          required: true,
          options: employees.map((emp) => ({
            label: emp.employeeName,
            value: emp.employeeId,
          })),
        },
        {
          name: "salesExecutive",
          label: "Sales Executive",
          type: "text",
          icon: "BusinessCenter",
        },
      ],
    },
    {
      section: "Status & Role",
      fields: [
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          icon: "Adjust",
          options: [
            { label: "Available", value: "Available" },
            { label: "Busy", value: "Busy" },
            { label: "On Project", value: "On Project" },
          ],
        },
        {
          name: "remoteOnsite",
          label: "Remote/Onsite",
          type: "select",
          required: true,
          icon: "Public",
          options: [
            { label: "Remote", value: "Remote" },
            { label: "Onsite", value: "Onsite" },
            { label: "Hybrid", value: "Hybrid" },
          ],
        },
        {
          name: "passport",
          label: "Passport",
          type: "select",
          required: true,
          icon: "TravelExplore",
          options: [
            { label: "Yes", value: "Yes" },
            { label: "No", value: "No" },
          ],
        },
        {
          name: "marketingVisa",
          label: "Marketing Visa",
          type: "select",
          required: true,
          icon: "VerifiedUser",
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
        },
        {
          name: "actualVisa",
          label: "Actual Visa",
          type: "select",
          required: true,
          icon: "Gavel",
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
        },

        {
          name: "relocation",
          label: "Relocation",
          type: "select",
          icon: "CompareArrows",
          options: [
            { label: "Yes", value: "Yes" },
            { label: "No", value: "No" },
          ],
        },
      ],
    },
    {
      section: "Tech & Experience",
      fields: [
        { name: "technology", label: "Technology", type: "text", icon: "Code" },
        {
          name: "experience",
          label: "Experience",
          type: "text",
          icon: "Timeline",
        },
      ],
    },
    {
      section: "Dates",
      fields: [
        {
          name: "originalDOB",
          label: "Original DOB",
          type: "date",
          icon: "CalendarToday",
        },
        {
          name: "editedDOB",
          label: "Edited DOB",
          type: "date",
          icon: "EditCalendar",
        },
        {
          name: "marketingStartDate",
          label: "Marketing Start Date",
          type: "date",
          icon: "Event",
        },
      ],
    },
    {
      section: "Compensation",
      fields: [
        {
          name: "billRate",
          label: "Bill Rate",
          type: "text",
          required: true,
          icon: "AttachMoney",
        },
        {
          name: "payroll",
          label: "Payroll",
          type: "select",
          icon: "RequestQuote",
          options: [
            { label: "W2", value: "W2" },
            { label: "C2C", value: "C2C" },
          ],
        },
      ],
    },
    {
      section: "Resume Upload",
      fields: [
        {
          name: "resumes",
          label: "Upload Resume",
          type: "file",
          required: true,
          multiple: true,
          accept: ".pdf,.doc,.docx",
          maxSize: 10,
          icon: "UploadFile",
        },
      ],
    },
    {
      section: "Supporting Documents",
      fields: [
        {
          name: "documents",
          label: "Upload Supporting Documents",
          type: "file",
          required: false,
          multiple: true,
          accept: ".pdf,.jpg,.png,.doc,.docx",
          maxSize: 10,
          icon: "AttachFile",
        },
      ],
    },
    {
      section: "Additional Remarks",
      fields: [
        {
          name: "remarks",
          label: "Remarks",
          type: "textarea",
          icon: "Comment",
        },
      ],
    },
  ];
};

export default getHotListUserSections;
