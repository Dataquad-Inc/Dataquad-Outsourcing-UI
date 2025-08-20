import React from "react";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import { Outlet } from "react-router-dom";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Home } from "@mui/icons-material";

const UsEmployeesContainer = () => {
  const tabs = [
    
    {
      label: "Employees",
      icon: <ListAltIcon />,
      path: "/dashboard/us-employees/employeeslist",
    },
    // {
    //   label: "Add New Employee",
    //   icon: <PersonAddIcon />,
    //   path: "/dashboard/us-employees/onboardemployee",
    // },
  ];
  return (
    <>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </>
  );
};

export default UsEmployeesContainer;
