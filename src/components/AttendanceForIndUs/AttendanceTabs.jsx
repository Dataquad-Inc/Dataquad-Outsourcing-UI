// src/components/AttendanceForIndUs/AttendanceTabs.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Typography,
} from '@mui/material';
import {
  LayoutDashboard,
  Calendar,
  Send,
  Eye,
  BarChart3,
} from 'lucide-react';

// Import components
import AttendanceDashboard from './AttendanceDashboard';
import AttendanceSummary from './AttendanceSummary';
import HolidayTab from './HolidayTab';
import WeeklyAttendanceHRMS from './WeeklyAttendanceHRMS';
import WeeklyAttendanceSUPERADMIN from './WeeklyAttendanceSUPERADMIN';

/* ============================================================
   TAB PANEL COMPONENT
   ============================================================ */

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ padding: '24px 0' }}>
    {value === index && children}
  </div>
);

/* ============================================================
   ATTENDANCE TABS NAVIGATION
   ============================================================ */

const AttendanceTabs = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Get role from Redux auth state
  const { role } = useSelector((state) => state.auth);
  const userRole = role || 'HRMS'; // Default to HRMS if role not set

  // Define tabs based on user role
  const getTabs = () => {
    const baseTabs = [
      { 
        label: 'Dashboard', 
        icon: LayoutDashboard, 
        component: AttendanceDashboard,
        showFor: ['HRMS', 'SUPERADMIN', 'EMPLOYEE'],
      },
      { 
        label: 'Summary', 
        icon: BarChart3, 
        component: AttendanceSummary,
        showFor: ['HRMS', 'SUPERADMIN', 'EMPLOYEE'],
      },
    ];

    // Holidays tab - only for HRMS and SUPERADMIN
    if (['HRMS', 'SUPERADMIN'].includes(userRole)) {
      baseTabs.push({
        label: 'Holidays',
        icon: Calendar,
        component: HolidayTab,
        showFor: ['HRMS', 'SUPERADMIN'],
      });
    }

    // Weekly attendance tabs - different for HRMS and SUPERADMIN
    if (userRole === 'HRMS') {
      baseTabs.push({
        label: 'Submit',
        icon: Send,
        component: WeeklyAttendanceHRMS,
        showFor: ['HRMS'],
      });
    }

    if (userRole === 'SUPERADMIN') {
      baseTabs.push({
        label: 'Review',
        icon: Eye,
        component: WeeklyAttendanceSUPERADMIN,
        showFor: ['SUPERADMIN'],
      });
    }

    return baseTabs.filter(tab => tab.showFor.includes(userRole));
  };

  const tabs = getTabs();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Paper sx={{ height: '100%', borderRadius: 0, bgcolor: '#F3F5FA' }}>
      {/* Tabs Header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white', px: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '13px',
              minHeight: 56,
              py: 0,
              px: 2.5,
              color: '#5B6478',
              '&.Mui-selected': {
                color: '#0F7C82',
                fontWeight: 600,
              },
              '&:hover': {
                color: '#0F7C82',
                bgcolor: 'rgba(15, 124, 130, 0.04)',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#0F7C82',
              height: 3,
            },
          }}
        >
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === idx;
            
            return (
              <Tab
                key={idx}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon 
                      size={18} 
                      style={{ 
                        color: isActive ? '#0F7C82' : '#8790A6',
                      }} 
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#0F7C82' : '#5B6478',
                      }}
                    >
                      {tab.label}
                    </Typography>
                  </Box>
                }
                iconPosition="start"
              />
            );
          })}
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {tabs.map((tab, idx) => (
        <TabPanel key={idx} value={activeTab} index={idx}>
          <tab.component />
        </TabPanel>
      ))}
    </Paper>
  );
};

export default AttendanceTabs;