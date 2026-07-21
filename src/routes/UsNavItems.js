import AssignmentIcon from "@mui/icons-material/Assignment";
import SendIcon from "@mui/icons-material/Send";
import ListAltIcon from "@mui/icons-material/ListAlt";
import EventNoteIcon from "@mui/icons-material/EventNote";
import GroupIcon from "@mui/icons-material/Group";
import BusinessIcon from "@mui/icons-material/Business";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import HourglassIcon from "@mui/icons-material/HourglassTop";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import InsightsIcon from "@mui/icons-material/Insights";
import HomeIcon from "@mui/icons-material/Home";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import PeopleIcon from "@mui/icons-material/People";
import BadgeIcon from "@mui/icons-material/Badge";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

const commonRoles = [
  "SUPERADMIN",
  "EMPLOYEE",
  "TEAMLEAD",
  "RECRUITER",
  "SALESEXECUTIVE",
  "ADMIN",
  "GRANDSALES",
];

// ✅ Adroit Route Config
export const usNavItems = (role) => [
  {
    text: "Home",
    path: "us-home",
    icon: <HomeIcon />,
    roles: [...commonRoles, "COORDINATOR"],
  },
  {
    text: "Hotlist",
    path:
      role === "SUPERADMIN" ||
      role === "ADMIN" ||
      role === "TEAMLEAD" ||
      role === "GRANDSALES"
        ? "hotlist/master"
        : "hotlist/consultants",
    icon: <GroupIcon />,
    roles: commonRoles,
  },
  {
    text: "Yet To Onboard",
    path: "yet-to-onboard",
    icon: <HourglassIcon />,
    roles: ["SUPERADMIN", "TEAMLEAD", "RECRUITER", "ADMIN"],
  },
  {
    text: "Employees",
    path: "us-employees/employeeslist",
    icon: <BadgeIcon />,
    roles: ["SUPERADMIN", "ADMIN", "HRMS", "COORDINATOR"],
  },
  {
    text: "HRMS",
    path: "hrms",
    icon: <ManageAccountsIcon />,
    roles: ["SUPERADMIN", "HRMS"],
  },
  {
    text: "Requirements",
    path: "us-requirements",
    icon: <AssignmentIcon />,
    roles: ["SUPERADMIN", "TEAMLEAD", "GRANDSALES", "RECRUITER"],
  },
  {
    text: "InProgress",
    path: "us-inprogress",
    icon: <AutorenewIcon />,
    roles: [...commonRoles, "COORDINATOR"],
  },
  {
    text: "RTR",
    path: "rtr/rtr-list",
    icon: <ListAltIcon />,
    roles: [...commonRoles, "COORDINATOR"],
  },
  {
    text: "Submissions",
    path: "us-submissions/submissions-list", // Fixed path
    icon: <SendIcon />,
    roles: ["SUPERADMIN", "TEAMLEAD", "ADMIN", "GRANDSALES", "RECRUITER", "COORDINATOR"],
  },
  {
    text: "Clients",
    path: "us-clients",
    icon: <BusinessIcon />,
    roles: commonRoles,
  },
  {
    text: "Interviews",
    path: "us-interviews",
    icon: <EventNoteIcon />,
    roles: ["SUPERADMIN", "SALESEXECUTIVE", "TEAMLEAD", "COORDINATOR"],
  },
  
  {
    text: "Placements",
    path: "us-placements", // Fixed path
    icon: <PersonAddIcon />,
    roles: ["SUPERADMIN"],
  },
  {
    text: "Attendance",
    path: "attendance",
    icon: <CalendarMonthIcon />,
    roles: ["SUPERADMIN", "HRMS"],
  },
];
