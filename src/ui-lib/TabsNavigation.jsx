import React, { useEffect, useState } from "react";
import { Tabs, Tab, Divider } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

const TabsNavigation = ({ tabs = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);

  // Set active tab based on current path
  useEffect(() => {
    // Try exact match first
    let activeIndex = tabs.findIndex((tab) => location.pathname === tab.path);
    
    // If no exact match, try startsWith but prioritize longer paths
    if (activeIndex === -1) {
      // Sort by path length descending to match most specific path first
      const sortedTabs = [...tabs].map((tab, index) => ({ ...tab, originalIndex: index }))
        .sort((a, b) => b.path.length - a.path.length);
      
      const matchedTab = sortedTabs.find((tab) =>
        location.pathname.startsWith(tab.path)
      );
      
      activeIndex = matchedTab ? matchedTab.originalIndex : 0;
    }
    
    setTabIndex(activeIndex);
  }, [location.pathname, tabs]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    navigate(tabs[newValue].path);
  };

  return (
    <>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        variant="standard"
        textColor="primary"
        indicatorColor="primary"
        sx={{ px: 2 }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            icon={tab.icon}
            iconPosition="start"
            label={tab.label}
            sx={{ fontWeight: 500, textTransform: "none", px: 2 }}
          />
        ))}
      </Tabs>
      <Divider />
    </>
  );
};

export default TabsNavigation;