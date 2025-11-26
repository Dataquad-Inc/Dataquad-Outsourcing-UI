import React from "react";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import ListIcon from "@mui/icons-material/List";
import UploadIcon from "@mui/icons-material/Upload";

const UsSubmissionsContainer = () => {
  const location = useLocation();

  // Redirect if on the base path
  if (location.pathname === "/dashboard/us-submissions") {
    return <Navigate to="/dashboard/us-submissions/submissions-list" replace />;
  }

  const tabs = [
    {
      label: "Submissions List",
      icon: <ListIcon />,
      path: "/dashboard/us-submissions/submissions-list",
    },
    {
      label: "Create Submission",
      icon: <UploadIcon />,
      path: "/dashboard/us-submissions/create-submission",
    },
  ];

  return (
    <div>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </div>
  );
};

export default UsSubmissionsContainer;