import React from "react";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import { Outlet } from "react-router-dom";
import ListAltIcon from "@mui/icons-material/ListAlt";

const InterviewsContainer = () => {
  const tabs = [
    {
      label: "All Interviews",
      icon: <ListAltIcon />,
      path: "/dashboard/us-interviews",
    },
  ];

  return (
    <>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </>
  );
};

export default InterviewsContainer;