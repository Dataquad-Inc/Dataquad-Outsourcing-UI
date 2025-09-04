import React from "react";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import { Outlet } from "react-router-dom";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const RequirementsContainer = () => {
  const tabs = [
    {
      label: "Requirements",
      icon: <ListAltIcon />,
      path: "/dashboard/us-requirements",
    },
    {
      label: "Post Requirement",
      icon: <PersonAddIcon />,
      path: "/dashboard/us-requirements/create-requirement",
    },
  ];

  return (
    <>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </>
  );
};

export default RequirementsContainer;