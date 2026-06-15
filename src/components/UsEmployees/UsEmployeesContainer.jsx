import React from "react";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const UsEmployeesContainer = () => {
  const { role } = useSelector((state) => state.auth);
  const canManageEmployees = role !== "COORDINATOR";
  const canViewTeams = canManageEmployees || role === "COORDINATOR";

  const tabs = [
    {
      label: "Employees List",
      icon: <ListAltIcon />,
      path: "/dashboard/us-employees/employeeslist",
    },
    ...(canViewTeams
      ? [
          {
            label: "Team List",
            icon: <ListAltIcon />,
            path: "/dashboard/us-employees/teamlist",
          },
        ]
      : []),
    ...(canManageEmployees
      ? [
          {
            label: "Onboard Employee",
            icon: <PersonAddIcon />,
            path: "/dashboard/us-employees/onboardemployee",
          },
          {
            label: "Create Team",
            icon: <PersonAddIcon />,
            path: "/dashboard/us-employees/create-team",
          },
        ]
      : []),
  ];

  return (
    <>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </>
  );
};

export default UsEmployeesContainer;
