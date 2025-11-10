import React from "react";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import { Outlet } from "react-router-dom";
import ListAltIcon from "@mui/icons-material/ListAlt";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ScheduleIcon from "@mui/icons-material/Schedule";

const InterviewsContainer = () => {
  const tabs = [
    {
      label: "All Interviews",
      icon: <ListAltIcon />,
      path: "/dashboard/interviews",
    },
    // {
    //   label: "My Interviews",
    //   icon: <EventAvailableIcon />,
    //   path: "/dashboard/interviews/my-interviews",
    // },
    // {
    //   label: "Schedule Interview",
    //   icon: <ScheduleIcon />,
    //   path: "/dashboard/interviews/schedule",
    // },
    // {
    //   label: "Interview Calendar",
    //   icon: <PersonAddIcon />,
    //   path: "/dashboard/interviews/calendar",
    // },
  ];

  return (
    <>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </>
  );
};

export default InterviewsContainer;