import { validateDate } from "@mui/x-date-pickers";
import { is } from "date-fns/locale";

const getHotListUserSections = (
  employees,
  recruiters,
  salesExecutives,
  onTeamleadChange = null,
  isEditMode = false
) => {
  return [
    {
      section: "Hidden Fields",
      fields: [
        {
          name: "consultantId",
          type: "hidden",
          required: false,
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
          name: "teamLeadId",
          label: "Teamlead",
          type: "select",
          icon: "Group",
          searchable: true, // Force searchable
          placeholder: "Search team lead...", // Custom placeholder
          // required: true,
          options: employees.map((emp) => ({
            label: emp.employeeName,
            value: emp.employeeId,
          })),
          onChange: onTeamleadChange, // Add onChange handler
        },
        {
          name: "salesExecutiveId",
          label: "Select Sales Executive",
          type: "select",
          icon: "BusinessCenter",
          searchable: true, // Force searchable
          placeholder: "Search Sales Executive...", // Custom placeholder
          options: salesExecutives.map((emp) => ({
            label: emp.userName,
            value: emp.userId,
          })),
          // In edit mode, if no options available but we have a value, show placeholder
          placeholder:
            isEditMode && salesExecutives.length === 0
              ? "Sales Executive will load when team lead is selected"
              : undefined,
        },
        {
          name: "recruiterId",
          label: "Select Recruiter",
          type: "select",
          icon: "BusinessCenter",
          searchable: true, // Force searchable
          placeholder: "Search recruiter...",
          options: recruiters.map((emp) => ({
            label: emp.userName,
            value: emp.userId,
          })),
          // In edit mode, if no options available but we have a value, show placeholder
          placeholder:
            isEditMode && recruiters.length === 0
              ? "Recruiter will load when team lead is selected"
              : undefined,
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
        {
          name: "isAssignAll",
          label: "Assign to All",
          type: "checkbox",
          required: false,
          icon: "CheckBox",
          defaultChecked: false,
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
          required:true,
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
            { label: "ACTIVE", value: "Active" },
            { label: "INACTIVE", value: "InActive" },
            { label: "ON HOLD", value: "On Hold" },
            { label: "PLACED", value: "Placed" },
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
          searchable: true, // Force searchable
          placeholder: "Search visa...", // Custom placeholder
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
          searchable: true, // Force searchable
          placeholder: "Search visa...", // Custom placeholder
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
            { label: "FULL-TIME", value: "FULL-TIME" },
            { label: "CONTRACT", value: "CONTRACT" },
            { label: "GUEST-HOUSE", value: "GUEST-HOUSE" },
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
          required: !isEditMode, // Make optional in edit mode
          multiple: true,
          accept: ".pdf,.doc,.docx",
          maxSize: 25,
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
          maxSize: 25,
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
