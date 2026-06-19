// src/components/AttendanceManagement.jsx
import React, { useState } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Typography,
} from '@mui/material';
import { Calendar, Briefcase, Gift, Settings } from 'lucide-react';
import AttendanceCycleTab from './AttendanceCycleTab';
import HolidayTab from './HolidayTab';
import AttendanceGridTab from './AttendanceGridTab';
import WeekOffConfigTab from './WeekOffConfigTab';
import AttendanceSummaryTab from './AttendanceSummaryTab';


const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ padding: '24px 0' }}>
    {value === index && children}
  </div>
);

const AttendanceManagement = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: 'Attendance Grid', icon: Calendar, component: AttendanceGridTab },
    { label: 'Attendance Summary', icon: Calendar, component: AttendanceSummaryTab },
    { label: 'Attendance Cycles', icon: Briefcase, component: AttendanceCycleTab },
    { label: 'Holidays', icon: Gift, component: HolidayTab },
    { label: 'Week Off Config', icon: Settings, component: WeekOffConfigTab },
  ];

  return (
    <Paper sx={{ height: '100vh', borderRadius: 0 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          {tabs.map((tab, idx) => (
            <Tab
              key={idx}
              label={tab.label}
              icon={<tab.icon size={18} />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {tabs.map((tab, idx) => (
        <TabPanel key={idx} value={activeTab} index={idx}>
          <tab.component />
        </TabPanel>
      ))}
    </Paper>
  );
};

export default AttendanceManagement;