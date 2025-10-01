import React from "react";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import { Outlet } from "react-router-dom";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const IndTeamContainer = () => {
  const tabs = [
    {
      label: "Team-list",
      icon: <ListAltIcon />,
      path: "/dashboard/ind-team",
    },
    {
      label: "Create-team",
      icon: <PersonAddIcon />,
      path: "/dashboard/ind-team/create-team",
    },
  ];
  return (
    <>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </>
  );
};

export default IndTeamContainer;
