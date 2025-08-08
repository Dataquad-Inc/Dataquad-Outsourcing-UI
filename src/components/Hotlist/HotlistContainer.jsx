import { Box } from "@mui/material";
import React from "react";
import { Outlet } from "react-router-dom";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Home } from "@mui/icons-material";
import { useSelector } from "react-redux";

const HotlistContainer = () => {
  const { role } = useSelector((state) => state.auth);

  const tabs = [
    {
      label: "Home",
      icon: <Home />,
      path: "/dashboard/us-home",
    },
    {
      label: "My Hotlist",
      icon: <ListAltIcon />,
      path: "/dashboard/hotlist/consultants",
    },
    {
      label: "Add Consultant",
      icon: <PersonAddIcon />,
      path: "/dashboard/hotlist/create",
    },
  ];

  if (role === "TEAMLEAD") {
    tabs.splice(2, 0, {
      label: "Team Hotlist",
      icon: <ListAltIcon />,
      path: "/dashboard/hotlist/team-consultants",
    });
  } else if (role === "SUPERADMIN") {
    tabs.splice(2, 0, {
      label: "Consultants", // Changed label for SUPERADMIN
      icon: <ListAltIcon />,
      path: "/dashboard/hotlist/team-consultants",
    });
  }

  return (
    <Box>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </Box>
  );
};

export default HotlistContainer;
