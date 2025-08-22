import React from "react";
import Chip from "@mui/material/Chip";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";

const roleConfig = {
  SUPERADMIN: { 
    color: "#d32f2f", 
    icon: SupervisorAccountIcon,
    label: "Super Admin"
  },
  ADMIN: { 
    color: "#9c27b0", 
    icon: AdminPanelSettingsIcon,
    label: "Admin"
  },
  TEAMLEAD: { 
    color: "#0288d1", 
    icon: GroupsIcon,
    label: "Team Lead"
  },
  RECRUITER: { 
    color: "#1976d2", 
    icon: WorkIcon,
    label: "Recruiter"
  },
  SALESEXECUTIVE: { 
    color: "#ed6c02", 
    icon: BusinessCenterIcon,
    label: "Sales Executive"
  },
  EMPLOYEE: { 
    color: "#2e7d32", 
    icon: PersonIcon,
    label: "Employee"
  },
};

const CustomChip = ({ role, size = "medium", variant = "outlined" }) => {
  const config = roleConfig[role?.toUpperCase()] || {
    color: "#616161",
    icon: PersonIcon,
    label: "Unknown"
  };

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
        backgroundColor: variant === "filled" ? `${config.color}15` : "transparent",
        "& .MuiChip-icon": { 
          color: config.color 
        },
        "&:hover": {
          backgroundColor: `${config.color}08`,
        }
      }}
    />
  );
};

export default CustomChip;