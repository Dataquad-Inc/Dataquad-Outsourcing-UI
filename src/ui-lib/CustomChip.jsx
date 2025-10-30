import React from "react";
import Chip from "@mui/material/Chip";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import BusinessIcon from "@mui/icons-material/Business";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FlightIcon from "@mui/icons-material/Flight";
import AirplaneTicketIcon from "@mui/icons-material/AirplaneTicket";
import VerifiedIcon from "@mui/icons-material/Verified";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";

const roleConfig = {
  SUPERADMIN: {
    color: "#d32f2f",
    icon: SupervisorAccountIcon,
    label: "Super Admin",
  },
  ADMIN: {
    color: "#9c27b0",
    icon: AdminPanelSettingsIcon,
    label: "Admin",
  },
  TEAMLEAD: {
    color: "#0288d1",
    icon: GroupsIcon,
    label: "Team Lead",
  },
  RECRUITER: {
    color: "#1976d2",
    icon: WorkIcon,
    label: "Recruiter",
  },
  SALESEXECUTIVE: {
    color: "#ed6c02",
    icon: BusinessCenterIcon,
    label: "Sales Executive",
  },
  EMPLOYEE: {
    color: "#2e7d32",
    icon: PersonIcon,
    label: "Employee",
  },
  GRANDSALES: {
    color: "#f57c00",
    icon: BusinessIcon,
    label: "Grand Sales",
  },
};

const jobTypeConfig = {
  FULLTIME: {
    color: "#2e7d32",
    icon: BusinessIcon,
    label: "Full Time",
  },
  PARTTIME: {
    color: "#E91E63",
    icon: ScheduleIcon,
    label: "Part Time",
  },
  CONTRACT: {
    color: "#0288d1",
    icon: AssignmentIcon,
    label: "Contract",
  },
  INTERNSHIP: {
    color: "#9c27b0",
    icon: WorkIcon,
    label: "Internship",
  },
  FREELANCE: {
    color: "#d32f2f",
    icon: BusinessCenterIcon,
    label: "Freelance",
  },
};

const visaTypeConfig = {
  H1B: { color: "#1976d2", icon: FlightIcon, label: "H1B" },
  OPT: { color: "#2e7d32", icon: AirplaneTicketIcon, label: "OPT" },
  STEM_OPT: { color: "#7b1fa2", icon: AirplaneTicketIcon, label: "STEM OPT" },
  OPT_EAD: { color: "#0288d1", icon: VerifiedIcon, label: "OPT EAD" },
  H4_EAD: { color: "#ff9800", icon: FlightIcon, label: "H4 EAD" },
  GC_EAD: { color: "#8bc34a", icon: VerifiedIcon, label: "GC EAD" },
  CPT: { color: "#00acc1", icon: BusinessCenterIcon, label: "CPT" },
  GC: { color: "#43a047", icon: VerifiedIcon, label: "Green Card" },
  CITIZEN: { color: "#607d8b", icon: EmojiPeopleIcon, label: "Citizen" },
};



const CustomChip = ({
  role,
  jobType,
  visaType,
  size = "medium",
  variant = "outlined",
  label: customLabel,
}) => {
  let config;

  if (role) {
    config = roleConfig[role?.toUpperCase()] || {
      color: "#616161",
      icon: PersonIcon,
      label: "Unknown Role",
    };
  } else if (jobType) {
    config = jobTypeConfig[jobType?.toUpperCase()] || {
      color: "#616161",
      icon: BusinessIcon,
      label: customLabel || jobType || "Unknown Job",
    };
  } else if (visaType) {
    config = visaTypeConfig[visaType?.toUpperCase()] || {
      color: "#616161",
      icon: FlightIcon,
      label: customLabel || visaType || "Unknown Visa",
    };
  } else if (customLabel) {
    config = {
      color: "#616161",
      icon: BusinessIcon,
      label: customLabel,
    };
  } else {
    config = {
      color: "#616161",
      icon: BusinessIcon,
      label: "Unknown",
    };
  }

  const IconComponent = config.icon;

  return (
    <Chip
      icon={<IconComponent />}
      label={config.label}
      variant={variant}
      size={size}
      sx={{
        borderColor: config.color,
        color: config.color,
        fontWeight: 500,
        backgroundColor:
          variant === "filled" ? `${config.color}15` : "transparent",
        "& .MuiChip-icon": {
          color: config.color,
          fontSize: size === "small" ? "18px" : "20px",
        },
        "&:hover": {
          backgroundColor: `${config.color}10`,
        },
      }}
    />
  );
};

export default CustomChip;
