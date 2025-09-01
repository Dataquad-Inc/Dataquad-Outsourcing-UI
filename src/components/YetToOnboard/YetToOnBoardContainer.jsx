import { Box } from "@mui/material";
import React from "react";
import { Outlet } from "react-router-dom";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const YetToOnBoardContainer = () => {
  const tabs = [
    {
      label: "Yet To Onboard",
      icon: <ListAltIcon />,
      path: "/dashboard/yet-to-onboard",
    },
    {
      label: "Add Consultant",
      icon: <PersonAddIcon />,
      path: "/dashboard/yet-to-onboard/create-consultant",
    },
  ];

  return (
    <Box>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </Box>
  );
};

export default YetToOnBoardContainer;
