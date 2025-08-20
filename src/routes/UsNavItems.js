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
import BadgeIcon from '@mui/icons-material/Badge';

// Adroit Route Config
export const usNavItems = [
  {
    text: "Home",
    path: "us-home",
    icon: <HomeIcon />,
    roles: ["SUPERADMIN", "EMPLOYEE", "TEAMLEAD","RECRUITER","SALESEXECUTIVE"],
  },
 {
    text: "Hotlist",
    path: "hotlist/consultants", // or just "hotlist"
    icon: <GroupIcon />,
    roles: ["SUPERADMIN", "EMPLOYEE", "TEAMLEAD","RECRUITER", "SALESEXECUTIVE"],
  },
  {
    text: "Employees",
    path: "us-employees/employeeslist", // or just "hotlist"
    icon: <BadgeIcon />,
    roles: ["SUPERADMIN"],
  },
 
];