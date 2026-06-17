import React from "react";
import { Box } from "@mui/material";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { Outlet } from "react-router-dom";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import { useSelector } from "react-redux";

const RtrContainer = () => {
  const { role } = useSelector((state) => state.auth);
  const canCreateRtr = role !== "COORDINATOR";

  const tabs = [
    {
      label: "RTR List",
      icon: <ListAltIcon />,
      path: "/dashboard/rtr/rtr-list",
    },
    ...(canCreateRtr
      ? [
          {
            label: " Create RTR",
            icon: <ListAltIcon />,
            path: "/dashboard/rtr/create-direct-rtr",
          },
        ]
      : []),
  ];

  return (
    <Box>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </Box>
  );
};

export default RtrContainer;
