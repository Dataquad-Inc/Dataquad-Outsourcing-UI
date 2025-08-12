import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Box,
  CssBaseline,
  Toolbar,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useSelector } from "react-redux";

import SideNav from "./SideNav";
import Header from "./Header";
import Footer from "./Footer";

const drawerWidth = 240;
const collapsedWidth = 72;

const HEADER_HEIGHT = 64; // adjust if your header height differs
const FOOTER_HEIGHT = 50; // adjust to your footer height

const Dashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const { isAuthenticated, logInTimeStamp } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (logInTimeStamp) {
      const loginTime = new Date(logInTimeStamp).getTime();
      const currentTime = new Date().getTime();
      const sessionDuration = 8 * 60 * 60 * 1000;

      if (currentTime - loginTime > sessionDuration) {
        navigate("/");
      }
    }
  }, [logInTimeStamp, navigate]);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <CssBaseline />

      {/* Fixed Header */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: HEADER_HEIGHT,
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Header
          handleDrawerToggle={handleDrawerToggle}
          isCollapsed={isCollapsed}
          drawerWidth={drawerWidth}
          collapsedWidth={collapsedWidth}
        />
      </Box>

      {/* Main container between header and footer */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          position: "fixed",
          top: HEADER_HEIGHT,
          left: 0,
          width: "100%",
          height: `calc(100vh - ${HEADER_HEIGHT + FOOTER_HEIGHT}px)`,
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <Box
          component="nav"
          sx={{
            width: { sm: isCollapsed ? collapsedWidth : drawerWidth },
            flexShrink: 0,
            height: "100%",
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            overflowY: "auto",
          }}
        >
          <SideNav
            handleDrawerToggle={handleDrawerToggle}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            mobileOpen={mobileOpen}
          />
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: "100%",
            overflowY: "auto",
            backgroundColor:
              theme.palette.mode === "dark"
                ? theme.palette.background.default
                : theme.palette.grey[100],
            
          }}
        >
          {/* <Toolbar /> For consistent spacing if needed */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              minHeight: "100%",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <Outlet />
          </Paper>
        </Box>
      </Box>

      {/* Fixed Footer */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          height: FOOTER_HEIGHT,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Footer />
      </Box>
    </>
  );
};

export default Dashboard;
