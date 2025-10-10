import React from "react";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import { Outlet } from "react-router-dom";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const ClientsContainer = () => {
  const tabs = [
    {
      label: "Clients List",
      icon: <ListAltIcon />,
      path: "/dashboard/us-clients",
    },
    {
      label: "Create Client",
      icon: <PersonAddIcon />,
      path: "/dashboard/us-clients/us-create",
    },
  ];

  return (
    <>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </>
  );
};

export default ClientsContainer;