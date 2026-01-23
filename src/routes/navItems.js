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

export const inNavItems = [
  {
    text: "Home",
    path: "home",
    icon: <HomeIcon />,
    roles: [
      "ADMIN",
      "SUPERADMIN",
      "EMPLOYEE",
      "BDM",
      "TEAMLEAD",
      "PARTNER",
      "INVOICE",
      "COORDINATOR",
    ],
  },
  {
    text: "Users",
    path: "users",
    icon: <GroupIcon />,
    roles: ["ADMIN", "SUPERADMIN", "INVOICE", "COORDINATOR"],
  },

  {
    text: "Team-list",
    path: "ind-team",
    icon: <GroupIcon />,
    roles: ["ADMIN", "SUPERADMIN", "INVOICE", "COORDINATOR"],
  },
  {
    text: "Team Metrices",
    path: "team-metrics",
    icon: <InsightsIcon />,
    roles: ["ADMIN", "SUPERADMIN"],
  },
  {
    text: "Clients",
    path: "clients",
    icon: <BusinessIcon />,
    roles: ["SUPERADMIN", "BDM", "PARTNER", "INVOICE", "COORDINATOR"],
  },
  {
    text: "Requirements",
    path: "requirements",
    icon: <ListAltIcon />,
    roles: ["SUPERADMIN", "BDM", "TEAMLEAD", "COORDINATOR"],
  },
  {
    text: "Assigned",
    path: "assigned",
    icon: <AssignmentIcon />,
    roles: ["ADMIN", "EMPLOYEE", "BDM", "TEAMLEAD"],
  },
  {
    text: "InProgress",
    path: "InProgress",
    icon: <AutorenewIcon />,
    roles: [
      "ADMIN",
      "SUPERADMIN",
      "EMPLOYEE",
      "BDM",
      "TEAMLEAD",
      "PARTNER",
      "PAYROLLADMIN",
      "COORDINATOR",
    ],
  },
  // {
  //   text: "Submissions",
  //   path: "submissions",
  //   icon: <SendIcon />,
  //   roles: [
  //     "ADMIN",
  //     "EMPLOYEE",
  //     "BDM",
  //     "TEAMLEAD",
  //     "SUPERADMIN",
  //     "COORDINATOR",
  //   ],
  // },
  {
    text: "Submissions",
    path: "submissions-all",
    icon: <SendIcon />,
    roles: [
      "SUPERADMIN",
      "ADMIN",
      "EMPLOYEE",
      "BDM",
      "TEAMLEAD",
      "SUPERADMIN",
      "COORDINATOR",
    ],
  },

  //   {
  //     text: 'Job Form',
  //     path: 'jobForm',
  //     icon: <PersonAddIcon />,
  //     roles: ['ADMIN', 'SUPERADMIN', 'BDM'],
  //   },
  {
    text: "Interviews",
    path: "interviews",
    icon: <EventNoteIcon />,
    roles: [
      "ADMIN",
      "EMPLOYEE",
      "BDM",
      "TEAMLEAD",
      "SUPERADMIN",
      "COORDINATOR",
    ],
  },

  //   {
  //     text: 'Add Client',
  //     path: 'addNewClient',
  //     icon: <PersonAddIcon />,
  //     roles: [ 'SUPERADMIN', 'BDM'],
  //   },
  // {
  //   text: "Submissions",
  //   path: "submissions-all",
  //   icon: <AssignmentTurnedInIcon />,
  //   roles: ["SUPERADMIN"],
  // },
  // {
  //   text: "Interviews",
  //   path: "interviews-all",
  //   // path: "interviews",
  //   icon: <EventNoteIcon />,
  //   roles: ["SUPERADMIN"],
  // },
  {
    text: "Placements",
    path: "placements",
    icon: <PersonAddIcon />,
    roles: ["SUPERADMIN", "PARTNER", "ADMIN", "INVOICE"],
  },
  {
    text: "Bench",
    path: "bench-users",
    icon: <HourglassIcon />,
    roles: ["ADMIN", "SUPERADMIN", "BDM", "TEAMLEAD", "PARTNER", "EMPLOYEE"],
  },
  {
    text: "Timesheet",
    path: "timesheets",
    icon: <AssignmentTurnedInIcon />,
    roles: ["EXTERNALEMPLOYEE"],
  },
  {
    text: "Timesheets",
    path: "timesheetsForAdmins",
    icon: <AssignmentTurnedInIcon />,
    roles: ["SUPERADMIN", "ADMIN", "ACCOUNTS", "INVOICE", "ADMIN"],
  },
];
