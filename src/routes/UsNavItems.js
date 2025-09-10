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
import { icons } from "lucide-react";

const commonRoles = [
  "SUPERADMIN",
  "EMPLOYEE",
  "TEAMLEAD",
  "RECRUITER",
  "SALESEXECUTIVE",
  "ADMIN",
];

// Adroit Route Config
export const usNavItems = (role) => [
  {
    text: "Home",
    path: "us-home",
    icon: <HomeIcon />,
    roles: [
      "SUPERADMIN",
      "EMPLOYEE",
      "TEAMLEAD",
      "RECRUITER",
      "SALESEXECUTIVE",
      "ADMIN",
    ],
  },
  {
    text: "Hotlist",
    path: role === "SUPERADMIN" ? "hotlist/master" : "hotlist/consultants",
    icon: <GroupIcon />,
    roles: [
      "SUPERADMIN",
      "EMPLOYEE",
      "TEAMLEAD",
      "RECRUITER",
      "SALESEXECUTIVE",
      "ADMIN",
    ],
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
    roles: ["SUPERADMIN", "ADMIN"],
  },

  {
    text: "Requirements",
    path: "us-requirements",
    icon: <AssignmentIcon />, // more meaningful than reusing hourglass
    roles: ["SUPERADMIN", "TEAMLEAD"],
  },
  {
    text: "Submissions",
    // path: "us-submissions",
    icon: <SendIcon />, // submission looks better with a send icon
    roles: commonRoles,
  },
];
