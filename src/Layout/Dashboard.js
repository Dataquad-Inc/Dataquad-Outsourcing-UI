import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Toolbar,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useSelector } from 'react-redux';

// Import the separated components
import SideNav from './SideNav';
import Header from './Header';
import Footer from './Footer';

const drawerWidth = 240;
const collapsedWidth = 72;

const Dashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  // Get auth state from Redux
  const { isAuthenticated, logInTimeStamp, role } = useSelector((state) => state.auth);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Check login timestamp to determine if session is still valid
  useEffect(() => {
    if (logInTimeStamp) {
      const loginTime = new Date(logInTimeStamp).getTime();
      const currentTime = new Date().getTime();
      const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      
      if (currentTime - loginTime > sessionDuration) {
        // Session expired, redirect to login
        navigate('/');
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

  if (!isAuthenticated) {
    // Don't render anything while redirecting
    return null;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* Header Component */}
      <Header 
        handleDrawerToggle={handleDrawerToggle}
        isCollapsed={isCollapsed}
        drawerWidth={drawerWidth}
        collapsedWidth={collapsedWidth}
      />
      
      {/* Navigation Component */}
      <Box
        component="nav"
        sx={{
          width: { sm: isCollapsed ? collapsedWidth : drawerWidth },
          flexShrink: { sm: 0 },
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
          width: { xs: '100%', sm: `calc(100% - ${isCollapsed ? collapsedWidth : drawerWidth}px)` },
          height: '100vh',
          overflow: 'auto',
          backgroundColor: theme.palette.mode === 'dark' 
            ? theme.palette.background.default 
            : theme.palette.grey[100],
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar /> 
        <Box >
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1, 
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              minHeight: 'calc(100vh - 140px)'
            }}
          >
            <Outlet />
          </Paper>
        </Box>
        <Footer />
      </Box>
      
    </Box>
  );
};

export default Dashboard;