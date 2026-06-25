import React from "react";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import { Outlet } from "react-router-dom";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupIcon from "@mui/icons-material/Group";
import { useSelector } from "react-redux";

const RequirementsContainer = () => {
  const { role } = useSelector((state) => state.auth);
  const tabs = [
    {
      label: role === "RECRUITER" ? "Self Requirements" : "Requirements",
      icon: <ListAltIcon />,
      path: "/dashboard/us-requirements",
    },
    (role !== "SUPERADMIN" && role !== "GRANDSALES" && role !== "ADMIN") && {
      label: "All Requirements",
      icon: <GroupIcon />,
      path: "/dashboard/us-requirements/all-requirements",
    },
    (role !== "GRANDSALES") && {
      label: "Post Requirement",
      icon: <PersonAddIcon />,
      path: "/dashboard/us-requirements/create-requirement",
    },
  ].filter(Boolean);

  return (
    <>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </>
  );
};

export default RequirementsContainer;