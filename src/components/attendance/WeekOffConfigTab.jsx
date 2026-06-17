import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { Settings, RotateCcw, Calendar, Info } from 'lucide-react';
import { weekOffAPI } from '../../Services/attendanceService';

const WeekOffConfigTab = () => {
  const theme = useTheme();
  const [weekOffConfig, setWeekOffConfig] = useState({
    1: false, // Monday
    2: false,
    3: false,
    4: false,
    5: false,
    6: true,  // Saturday
    7: true,  // Sunday
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const days = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
  };

  useEffect(() => {
    fetchWeekOffConfig();
  }, []);

  const fetchWeekOffConfig = async () => {
    setLoading(true);
    try {
      const response = await weekOffAPI.getWeekOffDays('IN');
      const weekOffDays = response.data;
      const newConfig = { ...weekOffConfig };
      Object.keys(days).forEach(day => {
        newConfig[parseInt(day)] = weekOffDays.includes(parseInt(day));
      });
      setWeekOffConfig(newConfig);
    } catch (error) {
      console.error('Error fetching week off config:', error);
      setSnackbar({ open: true, message: 'Failed to load configuration', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (day) => {
    const newValue = !weekOffConfig[day];
    setWeekOffConfig(prev => ({ ...prev, [day]: newValue }));
    
    setSaving(true);
    try {
      await weekOffAPI.configureWeekOff(day, newValue, 'IN');
      setSnackbar({ open: true, message: `Configuration updated for ${days[day]}`, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error updating configuration', severity: 'error' });
      setWeekOffConfig(prev => ({ ...prev, [day]: !newValue }));
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (window.confirm('Reset week off configuration to default (Saturday & Sunday)?')) {
      setSaving(true);
      try {
        await weekOffAPI.resetToDefault('IN');
        await fetchWeekOffConfig();
        setSnackbar({ open: true, message: 'Configuration reset to default', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Error resetting configuration', severity: 'error' });
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight={400} gap={2}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary">Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 1 }}>
      {/* Header section */}
      <Box display="flex" justifyContent="space-between" alignItems="start" mb={4}>
        <Box>
          <Typography variant="h5" fontWeight="600" gutterBottom>
            Week Off Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage standard scheduled rest days for your regional employee workspace.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RotateCcw size={16} />}
          onClick={handleResetToDefault}
          disabled={saving}
          sx={{ borderColor: theme.palette.divider, borderRadius: 1.5 }}
        >
          Reset to Default
        </Button>
      </Box>

      {saving && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress color="success" />
        </Box>
      )}

      <Grid container spacing={{ xs: 4, md: 6 }}>
        {/* Left Side: Interactive Planner without Card wrappers */}
        <Grid item xs={12} md={7}>
          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
            <Settings size={20} color={theme.palette.primary.main} />
            <Typography variant="subtitle1" fontWeight="600">
              Weekly Schedule Planner
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {Object.entries(days).map(([dayNum, dayName]) => {
              const isWeekOff = weekOffConfig[parseInt(dayNum)];
              return (
                <Box
                  key={dayNum}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    px: 2,
                    bgcolor: isWeekOff 
                      ? alpha(theme.palette.success.main, 0.06) 
                      : theme.palette.action.hover,
                    border: '1px solid',
                    borderColor: isWeekOff 
                      ? alpha(theme.palette.success.main, 0.15) 
                      : 'transparent',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: isWeekOff 
                        ? alpha(theme.palette.success.main, 0.3) 
                        : theme.palette.divider,
                    }
                  }}
                >
                  <Typography variant="body1" fontWeight={isWeekOff ? '600' : '500'}>
                    {dayName}
                  </Typography>
                  
                  <FormControlLabel
                    sx={{ mr: 0 }}
                    control={
                      <Switch
                        checked={isWeekOff}
                        onChange={() => handleToggle(parseInt(dayNum))}
                        disabled={saving}
                        color="success"
                      />
                    }
                    label={
                      <Chip 
                        label={isWeekOff ? "Week Off" : "Working"} 
                        size="small" 
                        color={isWeekOff ? "success" : "default"}
                        variant={isWeekOff ? "filled" : "outlined"}
                        sx={{ width: 85, fontWeight: '500' }}
                      />
                    }
                    labelPlacement="start"
                  />
                </Box>
              );
            })}
          </Box>
        </Grid>

        {/* Right Side: Active breakdown summary and Policies */}
        <Grid item xs={12} md={5}>
          <Box display="flex" flexDirection="column" gap={4}>
            <Box>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Calendar size={20} color={theme.palette.success.main} />
                <Typography variant="subtitle1" fontWeight="600">
                  Active Overview
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Designated Week Offs
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(days).filter(([num]) => weekOffConfig[parseInt(num)]).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>None configured</Typography>
                  ) : (
                    Object.entries(days)
                      .filter(([dayNum]) => weekOffConfig[parseInt(dayNum)])
                      .map(([dayNum, dayName]) => (
                        <Chip key={dayNum} label={dayName} color="success" size="small" sx={{ fontWeight: '500' }} />
                      ))
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Standard Production Days
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(days)
                    .filter(([dayNum]) => !weekOffConfig[parseInt(dayNum)])
                    .map(([dayNum, dayName]) => (
                      <Chip key={dayNum} label={dayName} variant="outlined" size="small" />
                    ))}
                </Box>
              </Box>
            </Box>

            <Alert 
              severity="info" 
              icon={<Info size={20} />}
              sx={{ borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}
            >
              <Typography variant="subtitle2" fontWeight="600" mb={0.5}>
                System Automation Properties
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.84rem', lineHeight: '1.6' }}>
                <li>Chosen Rest days instantly mark automated roster lines with default status <strong>'WO'</strong>.</li>
                <li>Adjustments will exclusively dictate workflows for <strong>future calendar generations</strong>.</li>
                <li>Archived historic data parameters and locking periods remain unaffected.</li>
              </ul>
            </Alert>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ boxShadow: 3 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WeekOffConfigTab;