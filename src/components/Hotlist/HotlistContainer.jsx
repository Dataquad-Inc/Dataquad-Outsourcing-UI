import { Box } from "@mui/material";
import React from "react";
import { Outlet } from "react-router-dom";
import TabsNavigation from "../../ui-lib/TabsNavigation";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Home } from "@mui/icons-material";
import { useSelector } from "react-redux";

const HotlistContainer = () => {
  const { role } = useSelector((state) => state.auth);

  let tabs = [];

  if (role === "SUPERADMIN" || role === "ADMIN") {
    // Tabs for SUPERADMIN
    tabs = [
      {
        label: "Home",
        icon: <Home />,
        path: "/dashboard/us-home",
      },
      {
        label: "Grand Hotlist",
        icon: <ListAltIcon />,
        path: "/dashboard/hotlist/master",
      },

      {
        label: "W2 Hotlist",
        icon: <ListAltIcon />,
        path: "/dashboard/hotlist/w2",
      },
      {
        label: "Fulltime Hotlist",
        icon: <ListAltIcon />,
        path: "/dashboard/hotlist/fulltime",
      },
      {
        label: "Guest Hotlist",
        icon: <ListAltIcon />,
        path: "/dashboard/hotlist/gurest-consultants",
      },

      // {
      //   label: "Add Consultant",
      //   icon: <PersonAddIcon />,
      //   path: "/dashboard/hotlist/create",
      // },
    ];
  } else if (role === "TEAMLEAD" || role === "GRANDSALES") {
    tabs = [
      {
        label: "Home",
        icon: <Home />,
        path: "/dashboard/us-home",
      },
      {
        label: "Grand Hotlist",
        icon: <ListAltIcon />,
        path: "/dashboard/hotlist/master",
      },
      {
        label: "My Hotlist",
        icon: <ListAltIcon />,
        path: "/dashboard/hotlist/consultants",
      },
    ];

    // Show only for TEAMLEAD / RECRUITER
    if (role === "TEAMLEAD" || role === "SALESEXECUTIVE") {
      tabs.splice(2, 0, {
        label: "Team Consultants",
        icon: <ListAltIcon />,
        path: "/dashboard/hotlist/team-consultants",
      });
    }
  } else {
    // Tabs for TEAMLEAD, RECRUITER, SALESEXECUTIVE, etc.

    tabs = [
      {
        label: "Home",
        icon: <Home />,
        path: "/dashboard/us-home",
      },
      // {
      //   label: "Grand Hotlist",
      //   icon: <ListAltIcon />,
      //   path: "/dashboard/hotlist/master",
      // },
      {
        label: "My Hotlist",
        icon: <ListAltIcon />,
        path: "/dashboard/hotlist/consultants",
      },
    ];

    // Show only for TEAMLEAD / RECRUITER
    if (role === "TEAMLEAD" || role === "SALESEXECUTIVE") {
      tabs.splice(2, 0, {
        label: "Team Consultants",
        icon: <ListAltIcon />,
        path: "/dashboard/hotlist/team-consultants",
      });
    }

    // // Add Consultant tab only if NOT SALESEXECUTIVE
    // if (role !== "SALESEXECUTIVE") {
    //   tabs.push({
    //     label: "Add Consultant",
    //     icon: <PersonAddIcon />,
    //     path: "/dashboard/hotlist/create",
    //   });
    // }
  }

  return (
    <Box>
      <TabsNavigation tabs={tabs} />
      <Outlet />
    </Box>
  );
};

export default HotlistContainer;
