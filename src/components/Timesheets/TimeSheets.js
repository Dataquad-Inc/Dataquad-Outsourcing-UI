import React, { useState, useEffect, useRef } from 'react';
import {
  AccessTime,
  Save,
  CheckCircle,
  Refresh,
  CalendarToday,
  AttachFile,
  Delete,
  Add,
  CloudUpload,
} from '@mui/icons-material';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Select,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  FormHelperText,
  LinearProgress,
  Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { useSelector } from 'react-redux';
import httpService from '../../Services/httpService';
import { enGB } from 'date-fns/locale';
import axios from 'axios';
import { timeClockClasses } from '@mui/x-date-pickers';

const Timesheets = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  // Filter states
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedLeaveType, setSelectedLeaveType] = useState('');

  const [timesheetData, setTimeSheetData] = useState([]);
  const [pendingAttachments, setPendingAttachments] = useState([]);

  // Calendar and timesheet states
  const [selectedWeekStart, setSelectedWeekStart] = useState('');
  const [currentTimesheet, setCurrentTimesheet] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [calendarValue, setCalendarValue] = useState(new Date());
  const [highlightedWeek, setHighlightedWeek] = useState([]);
  const [notes, setNotes] = useState('');

  // Add new state for tracking submission status
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Leave types
  const leaveTypes = [
    { value: '', label: 'No Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'holiday', label: 'Company Holiday' },
  ];

  // Attachment states
  const [attachments, setAttachments] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const { userId } = useSelector((state) => state.auth);

  // Sample projects with additional details
  const projects = [
    {
      name: 'Project Alpha',
      client: 'Client A',
      approver: 'John Smith',
      location: 'New York',
      frequency: 'Weekly',
    },
    {
      name: 'Project Beta',
      client: 'Client B',
      approver: 'Sarah Johnson',
      location: 'London',
      frequency: 'Bi-weekly',
    },
    {
      name: 'Project Gamma',
      client: 'Client C',
      approver: 'Michael Chen',
      location: 'Singapore',
      frequency: 'Weekly',
    },
    {
      name: 'Project Delta',
      client: 'Client D',
      approver: 'Emma Wilson',
      location: 'Sydney',
      frequency: 'Monthly',
    },
    {
      name: 'Internal Tasks',
      client: 'Internal',
      approver: 'HR Department',
      location: 'All Locations',
      frequency: 'Weekly',
    }
  ];

 
// Utility function to get Monday of the week for any given date
const getMondayOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate difference to Monday
  // If it's Sunday (day = 0), we need to go back 6 days to get to previous Monday
  // Otherwise, subtract (day - 1) to get to Monday
  const diff = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  
  return monday;
};

// Helper function to format date as YYYY-MM-DD consistently
const formatDateToYMD = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Then update getWeekDates to use this:
const getWeekDates = (startDate) => {
  const start = new Date(startDate);
  const monday = getMondayOfWeek(start);
  
  const end = new Date(monday);
  end.setDate(monday.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start: monday,
    end,
    startString: formatDateToYMD(monday), // Use consistent formatting
    endString: formatDateToYMD(end),      // Use consistent formatting
    weekDates: {
      monday: new Date(monday),
      tuesday: new Date(monday.getTime() + 24 * 60 * 60 * 1000),
      wednesday: new Date(monday.getTime() + 2 * 24 * 60 * 60 * 1000),
      thursday: new Date(monday.getTime() + 3 * 24 * 60 * 60 * 1000),
      friday: new Date(monday.getTime() + 4 * 24 * 60 * 60 * 1000),
      saturday: new Date(monday.getTime() + 5 * 24 * 60 * 60 * 1000),
      sunday: new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000)
    }
  };
};

  // Get current week
  const getCurrentWeek = () => {
    const today = new Date();
    return getWeekDates(today);
  };

  // Function to get week dates for highlighting in calendar
  const getWeekDatesArray = (date) => {
    const weekInfo = getWeekDates(new Date(date));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekInfo.start);
      date.setDate(weekInfo.start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Custom day renderer for calendar
  const CustomDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;

    const isHighlighted = highlightedWeek.some(
      (weekDay) =>
        weekDay.toISOString().split('T')[0] === day.toISOString().split('T')[0]
    );

    return (
      <PickersDay
        {...other}
        outsideCurrentMonth={isHighlighted ? false : outsideCurrentMonth}
        day={day}
        sx={{
          ...(isHighlighted && {
            backgroundColor: 'green',
            color: '#fff',
            '&:hover': {
              backgroundColor: 'green',
            },
            // 👇 override MUI's default selected styling
            '&.Mui-selected': {
              backgroundColor: 'green',
            },
          }),
        }}
      />
    );
  };

  // Initialize with current week when project is selected
  useEffect(() => {
    if (selectedProject && !selectedWeekStart) {
      const weekInfo = getWeekDates(calendarValue);
      const currentWeek = getCurrentWeek();
      setSelectedWeekStart(weekInfo.startString);
      setCalendarValue(new Date(currentWeek.startString));
      setHighlightedWeek(getWeekDatesArray(new Date(currentWeek.startString)));
    }
  }, [selectedProject]);

  // Update highlighted week and selected week when calendar value changes
  useEffect(() => {
    if (calendarValue && selectedProject) {
      const weekInfo = getWeekDates(calendarValue);
      const weekDates = getWeekDatesArray(calendarValue);
      setHighlightedWeek(weekDates);

      // Always update selectedWeekStart to match the selected week
      setSelectedWeekStart(weekInfo.startString);

      setCurrentTimesheet((prev) => prev ? {
        ...prev,
        startDate: weekInfo.startString,
        endDate: weekInfo.endString
      } : prev);
    }
  }, [calendarValue, selectedProject]);

  // Fetch or create timesheet when week is selected
  useEffect(() => {
    if (selectedProject && selectedWeekStart) {
      fetchOrCreateTimesheet();
    } else {
      setCurrentTimesheet(null);
      setHasUnsavedChanges(false);
    }
  }, [selectedProject, selectedWeekStart]);

  const fetchOrCreateTimesheet = async () => {
    if (!selectedProject || !selectedWeekStart) return;

    setLoading(true);
    try {
      console.log('Fetching timesheet for:', { userId, selectedProject, selectedWeekStart });
      
      const response = await axios.get(
        `http://192.168.0.182:7071/timesheet/getTimesheetsByUserId?userId=${userId}`
      );

      console.log('Full API response:', response.data);
      setTimeSheetData(response.data.data || []);
      
      let existingTimesheet = null;

      if (response && response.data && response.data.success && response.data.data) {
        // Find existing timesheet for this week AND project
        existingTimesheet = response.data.data.find(ts => {
          const tsWeekStart = new Date(ts.weekStartDate).toISOString().split('T')[0];
          // Check if any working entry matches the selected project
          const hasProjectEntries = ts.workingEntries && ts.workingEntries.some(entry => entry.project === selectedProject);
          console.log('Checking timesheet:', { 
            tsWeekStart, 
            selectedWeekStart, 
            hasProjectEntries, 
            timesheetId: ts.timesheetId 
          });
          return tsWeekStart === selectedWeekStart && hasProjectEntries;
        });
      }

      console.log('Found existing timesheet:', existingTimesheet);

      if (existingTimesheet) {
        const transformed = transformTimesheet(existingTimesheet);
        console.log('Transformed timesheet:', transformed);
        setCurrentTimesheet(transformed);

        // Handle attachments
        if (existingTimesheet.attachments && existingTimesheet.attachments.length > 0) {
          const processedAttachments = existingTimesheet.attachments.map(att => ({
            id: att.id,
            name: att.filename,
            size: 0, // Size not provided in API response
            type: att.filetype,
            uploadDate: new Date(att.uploadedAt),
            uploaded: true,
            url: null // URL not provided in API response
          }));
          setAttachments(processedAttachments);
        } else {
          setAttachments([]);
        }
        showAlert('Timesheet loaded successfully', 'success');
      } else {
        console.log('No existing timesheet found, creating new one');
        createNewTimesheet();
        setAttachments([]);
      }
    } catch (error) {
      console.error('Error fetching timesheet:', error);
      showAlert(`Failed to fetch timesheet: ${error.message}`, 'error');
      createNewTimesheet();
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewTimesheet = () => {
    const weekInfo = getWeekDates(selectedWeekStart);

    const newTimesheet = {
      id: null, // New timesheet
      userId,
      project: selectedProject,
      status: 'Working',
      startDate: weekInfo.startString,
      endDate: weekInfo.endString,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
      notes: '',
      entries: [],
      isEditable: true,
      percentageOfTarget: 0,
      dayStatuses: {
        monday: 'Working',
        tuesday: 'Working',
        wednesday: 'Working',
        thursday: 'Working',
        friday: 'Working',
        saturday: 'Working',
        sunday: 'Working'
      },
      // Initialize leave hours
      sickLeave: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
      },
      companyHoliday: {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0
      }
    };

    setCurrentTimesheet(newTimesheet);
    setNotes('');
    setHasUnsavedChanges(false);
    setIsSubmitted(false);
    // Don't clear attachments when creating new timesheet - keep pending ones
  };

 const transformTimesheet = (apiTimesheet) => {
  if (!apiTimesheet) {
    console.log('No timesheet found, returning null');
    return null;
  }

  console.log('Transforming timesheet:', apiTimesheet);

  // Check if timesheet is submitted/approved
  const submitted = apiTimesheet.status === 'SUBMITTED' || apiTimesheet.status === 'APPROVED' || apiTimesheet.status === 'PENDING_APPROVAL';
  setIsSubmitted(submitted);

  const transformed = {
    id: apiTimesheet.timesheetId || null,
    userId: apiTimesheet.userId || userId,
    project: selectedProject,
    status: apiTimesheet.status || 'DRAFT',
    startDate: apiTimesheet.weekStartDate || '',
    endDate: apiTimesheet.weekEndDate || '',
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
    notes: apiTimesheet.notes || '',
    workingEntries: apiTimesheet.workingEntries || [],
    nonWorkingEntries: apiTimesheet.nonWorkingEntries || [],
    isEditable: !submitted && (apiTimesheet.status === 'DRAFT' || !apiTimesheet.status),
    percentageOfTarget: apiTimesheet.percentageOfTarget || 0,
    dayStatuses: {
      monday: 'Working',
      tuesday: 'Working',
      wednesday: 'Working',
      thursday: 'Working',
      friday: 'Working',
      saturday: 'Working',
      sunday: 'Working'
    },
    sickLeave: {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    },
    companyHoliday: {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    },
    // Add API project details
    clientName: apiTimesheet.clientName || '',
    approver: apiTimesheet.approver || '',
    startDate: apiTimesheet.startDate || apiTimesheet.weekStartDate || ''
  };

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  console.log('Processing working entries:', apiTimesheet.workingEntries);

  // Process working entries
  if (apiTimesheet.workingEntries) {
    apiTimesheet.workingEntries.forEach(entry => {
      console.log('Processing working entry:', entry);
      
      const entryDate = new Date(entry.date);
      const dayOfWeek = entryDate.getDay();
      const hours = parseFloat(entry.hours) || 0;
      const dayName = days[dayOfWeek];

      console.log('Working entry details:', {
        date: entry.date,
        dayOfWeek,
        dayName,
        hours,
        project: entry.project
      });

      if (dayName && transformed.hasOwnProperty(dayName) && entry.project === selectedProject) {
        console.log(`Adding ${hours} working hours to ${dayName}`);
        transformed[dayName] += hours;
      }
    });
  }

  console.log('Processing non-working entries:', apiTimesheet.nonWorkingEntries);

  // Process non-working entries (sick leave, holidays)
  if (apiTimesheet.nonWorkingEntries) {
    apiTimesheet.nonWorkingEntries.forEach(entry => {
      console.log('Processing non-working entry:', entry);
      
      const entryDate = new Date(entry.date);
      const dayOfWeek = entryDate.getDay();
      const hours = parseFloat(entry.hours) || 0;
      const dayName = days[dayOfWeek];
      const description = entry.description?.toLowerCase() || '';

      console.log('Non-working entry details:', {
        date: entry.date,
        dayOfWeek,
        dayName,
        hours,
        description
      });

      if (dayName && transformed.hasOwnProperty(dayName)) {
        if (description.includes('sick leave')) {
          console.log(`Adding ${hours} sick leave hours to ${dayName}`);
          transformed.sickLeave[dayName] += hours;
        } else if (description.includes('company holiday') || description.includes('holiday')) {
          console.log(`Adding ${hours} holiday hours to ${dayName}`);
          transformed.companyHoliday[dayName] += hours;
        }
      }
    });
  }

  console.log('Final transformed timesheet:', transformed);

  transformed.percentageOfTarget = calculatePercentage(transformed);
  setNotes(transformed.notes);
  return transformed;
};

  const getProjectConfig = (projectName) => {
    const configs = {
      "Project Alpha": { label: "Alpha", color: "success" },
      "Project Beta": { label: "Beta", color: "warning" },
      "Project Gamma": { label: "Gamma", color: "primary" },
      "Project Delta": { label: "Delta", color: "error" },
      "Internal Tasks": { label: "Internal", color: "default" }
    };
    return configs[projectName] || { label: projectName, color: "default" };
  };


  

// Add this function to check if current week is the present week
const isPresentWeek = (weekStartDate) => {
  const currentWeek = getCurrentWeek();
  return weekStartDate === currentWeek.startString;
};

// Add this function to check if it's Friday in the present week
const isFridayInPresentWeek = () => {
  if (!selectedWeekStart || !isPresentWeek(selectedWeekStart)) return false;
  
  const today = new Date();
  return today.getDay() === 5; // 5 = Friday (0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday)
};

// Modify the isFieldEditable function to disable previous weeks
const isFieldEditable = (timesheet, day, leaveType = null) => {
  // If timesheet is submitted, no fields are editable
  if (isSubmitted || (timesheet && !timesheet.isEditable)) return false;
  
  // Saturday and Sunday are always disabled
  if (day === 'saturday' || day === 'sunday') {
    return false;
  }

  // Disable previous weeks (only current week should be editable)
  if (selectedWeekStart && !isPresentWeek(selectedWeekStart)) {
    return false;
  }

  // For main hours row, check if any leave type has hours for this day
  if (!leaveType) {
    const hasSickLeave = timesheet.sickLeave && timesheet.sickLeave[day] > 0;
    const hasHoliday = timesheet.companyHoliday && timesheet.companyHoliday[day] > 0;

    if (hasSickLeave || hasHoliday) return false;
  }

  return true;
};
  const handleHourChange = (day, value, type = 'regular') => {
    if (!currentTimesheet || day === 'saturday' || day === 'sunday') return;

    const numValue = parseFloat(value) || 0;
    if (numValue < 0 || numValue > 24) return;

    console.log('Hour change:', { day, value, numValue, type });

    if (type === 'regular') {
      if (!isFieldEditable(currentTimesheet, day)) {
        showAlert(`Cannot enter hours on ${day} due to leave/holiday`, 'error');
        return;
      }

      setCurrentTimesheet(prev => {
        const updated = { ...prev, [day]: numValue };
        console.log('Updated timesheet after regular hours change:', updated);
        return updated;
      });
    } else if (type === 'sickLeave') {
      // Check if there's already holiday hours for this day
      if (currentTimesheet.companyHoliday[day] > 0) {
        showAlert(`Cannot add sick leave on ${day} - company holiday already exists`, 'error');
        return;
      }

      setCurrentTimesheet(prev => {
        const updated = {
          ...prev,
          sickLeave: {
            ...prev.sickLeave,
            [day]: numValue
          },
          // Set main hours to zero when sick leave is entered
          [day]: numValue > 0 ? 0 : prev[day]
        };
        console.log('Updated timesheet after sick leave change:', updated);
        return updated;
      });
    } else if (type === 'companyHoliday') {
      // Check if there's already sick leave hours for this day
      if (currentTimesheet.sickLeave[day] > 0) {
        showAlert(`Cannot add company holiday on ${day} - sick leave already exists`, 'error');
        return;
      }

      setCurrentTimesheet(prev => {
        const updated = {
          ...prev,
          companyHoliday: {
            ...prev.companyHoliday,
            [day]: numValue
          },
          // Set main hours to zero when holiday is entered
          [day]: numValue > 0 ? 0 : prev[day]
        };
        console.log('Updated timesheet after holiday change:', updated);
        return updated;
      });
    }

    setHasUnsavedChanges(true);
  };

  const handleNotesChange = (value) => {
    setNotes(value);
    setCurrentTimesheet(prev => ({
      ...prev,
      notes: value
    }));
    setHasUnsavedChanges(true);
  };

  const calculatePercentage = (timesheet) => {
    const workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const totalHours = workingDays.reduce((total, day) => total + (timesheet[day] || 0), 0);
    return Math.min(Math.round((totalHours / 40) * 100), 100);
  };

  const getWorkingDaysHours = (timesheet) => {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      .reduce((total, day) => total + (timesheet[day] || 0), 0);
  };

  const saveTimesheet = async (isSubmission = false) => {
    if (!currentTimesheet) return;

    const workingHours = getWorkingDaysHours(currentTimesheet);
    console.log('Saving timesheet:', { currentTimesheet, workingHours, isSubmission });

    setLoading(true);
    try {
      const workingEntries = [];
      const nonWorkingEntries = [];
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      // Get the Monday of the selected week
      const monday = getMondayOfWeek(calendarValue);

      days.forEach((day, index) => {
        const entryDate = new Date(monday);
        entryDate.setDate(monday.getDate() + index);
        const dateString = entryDate.toISOString().split('T')[0];

        const dayHours = currentTimesheet[day] || 0;
        const sickLeaveHours = currentTimesheet.sickLeave[day] || 0;
        const holidayHours = currentTimesheet.companyHoliday[day] || 0;

        // Add regular working hours
        if (dayHours > 0) {
          workingEntries.push({
            date: dateString,
            project: currentTimesheet.project,
            hours: dayHours,
            description: `Work - ${day.charAt(0).toUpperCase() + day.slice(1)}`
          });
        }

        // Add sick leave as non-working entry
        if (sickLeaveHours > 0) {
          nonWorkingEntries.push({
            date: dateString,
            project: currentTimesheet.project,
            hours: sickLeaveHours,
            description: `Sick Leave - ${day.charAt(0).toUpperCase() + day.slice(1)}`
          });
        }

        // Add company holiday as non-working entry
        if (holidayHours > 0) {
          nonWorkingEntries.push({
            date: dateString,
            hours: holidayHours,
            description: `Company Holiday - ${day.charAt(0).toUpperCase() + day.slice(1)}`
          });
        }
      });

      const isUpdate = currentTimesheet.id !== null && currentTimesheet.id !== undefined;
      let response;

      // Create payload that matches backend structure
      const timesheetData = {
        type: 'WEEKLY',
        date: monday.toISOString().split('T')[0],
        workingEntries: workingEntries,
        nonWorkingEntries: nonWorkingEntries,
        notes: notes
      };

      console.log('Sending timesheet data:', JSON.stringify(timesheetData, null, 2));
      console.log('Is update:', isUpdate);
      console.log('Timesheet ID:', currentTimesheet.id);

      if (isUpdate) {
        response = await axios.patch(
          `http://192.168.0.182:7071/timesheet/update-timesheet/${currentTimesheet.id}?userId=${userId}`,
          timesheetData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        response = await axios.post(
          `http://192.168.0.182:7071/timesheet/daily-entry?userId=${userId}`,
          timesheetData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      console.log('Save response:', response.data);

      if (response && response.data && response.data.success) {
        let timesheetId = currentTimesheet.id;

        // Update the current timesheet with the returned ID if it's a new timesheet
        if (!isUpdate && response.data.data && response.data.data.timesheetId) {
          timesheetId = response.data.data.timesheetId;
          setCurrentTimesheet(prev => ({
            ...prev,
            id: timesheetId
          }));
        }

        // Upload attachments only if not submitting (attachments are handled separately for submission)
        if (!isSubmission && pendingAttachments.length > 0 && timesheetId) {
          console.log('Uploading pending attachments:', pendingAttachments);
          try {
            const filesToUpload = pendingAttachments.map(att => att.file);
            const uploadResponse = await uploadFilesToServer(timesheetId, filesToUpload);
            console.log('Upload response:', uploadResponse);

            if (uploadResponse && uploadResponse.success) {
              // Update attachments to show as uploaded
              const uploadedAttachments = pendingAttachments.map(att => ({
                ...att,
                uploaded: true,
                file: undefined, // Remove file object after upload
                url: uploadResponse.fileUrls?.find(url => url.includes(att.name))
              }));
              
              setAttachments(prev => [...prev.filter(a => a.uploaded), ...uploadedAttachments]);
              setPendingAttachments([]);
              showAlert(`Timesheet saved and ${pendingAttachments.length} attachment(s) uploaded`, 'success');
            } else {
              showAlert(`Timesheet saved but failed to upload some attachments`, 'warning');
            }
          } catch (uploadError) {
            console.error('Error uploading pending attachments:', uploadError);
            showAlert(`Timesheet saved but failed to upload attachments`, 'warning');
          }
        } else {
          showAlert(`Timesheet ${isUpdate ? 'updated' : 'created'} successfully`, 'success');
        }

        setHasUnsavedChanges(false);
        
        // Force refresh the timesheet data from server
        console.log('Refreshing timesheet data after save');
        setTimeout(() => {
          fetchOrCreateTimesheet();
        }, 1000); // Add small delay to ensure server has processed the save
        
      } else {
        const errorMessage = response?.data?.error?.errorMessage ||
          response?.data?.message ||
          `Failed to ${isUpdate ? 'update' : 'create'} timesheet`;
        showAlert(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error saving timesheet:', error);
      const errorMessage = error.response?.data?.error?.errorMessage ||
        error.response?.data?.message ||
        error.message ||
        'Failed to save timesheet';
      showAlert(`Failed to save timesheet: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const uploadFilesToServer = async (timesheetId, files) => {
    console.log('Uploading files to server:', { timesheetId, files });
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        console.log('Adding file to FormData:', file.name);
        formData.append('files', file);
      });

      // Log FormData contents
      for (let pair of formData.entries()) {
        console.log('FormData entry:', pair[0], pair[1]);
      }

      const response = await axios.post(
        `http://192.168.0.182:7071/timesheet/${timesheetId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('File upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error uploading files:', error);
      console.error('Upload error response:', error.response?.data);
      throw error;
    }
  };

 const submitWeeklyTimesheet = async () => {
  if (!currentTimesheet) return;

  try {
    setLoading(true);
    console.log('Submitting weekly timesheet');

    // First save if there are unsaved changes
    if (hasUnsavedChanges) {
      console.log('Saving unsaved changes before submission');
      await saveTimesheet(false);
      // Wait for save to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

     const monday = getMondayOfWeek(calendarValue);
    const startDate = monday.toISOString().split('T')[0];
    console.log('Submitting timesheet with:', { userId, startDate });

    const submitResponse = await axios.post(
      `http://192.168.0.182:7071/timesheet/submit-weekly?userId=${userId}&startDate=${startDate}`,
      {},
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Submit response:', submitResponse.data);

    if (submitResponse && submitResponse.data && submitResponse.data.success) {
      // Upload pending attachments after successful submission
      if (pendingAttachments.length > 0 && currentTimesheet.id) {
        console.log('Uploading pending attachments after submission:', pendingAttachments);
        try {
          const filesToUpload = pendingAttachments.map(att => att.file);
          const uploadResponse = await uploadFilesToServer(currentTimesheet.id, filesToUpload);
          console.log('Upload response:', uploadResponse);

          if (uploadResponse && uploadResponse.success) {
            // Update attachments to show as uploaded
            const uploadedAttachments = pendingAttachments.map(att => ({
              ...att,
              uploaded: true,
              file: undefined,
              url: uploadResponse.fileUrls?.find(url => url.includes(att.name))
            }));
            
            setAttachments(prev => [...prev.filter(a => a.uploaded), ...uploadedAttachments]);
            setPendingAttachments([]);
            showAlert(`Timesheet submitted successfully and ${pendingAttachments.length} attachment(s) uploaded`, 'success');
          } else {
            showAlert(`Timesheet submitted successfully but failed to upload some attachments`, 'warning');
          }
        } catch (uploadError) {
          console.error('Error uploading pending attachments:', uploadError);
          showAlert(`Timesheet submitted successfully but failed to upload attachments: ${uploadError.message}`, 'warning');
        }
      } else {
        showAlert('Timesheet submitted successfully for approval', 'success');
      }

      // Mark as submitted and refresh data
      setIsSubmitted(true);
      setCurrentTimesheet(prev => ({
        ...prev,
        isEditable: false,
        status: 'PENDING_APPROVAL'
      }));
      setHasUnsavedChanges(false);

      // Refresh timesheet data
      setTimeout(() => {
        fetchOrCreateTimesheet();
      }, 1000);

    } else {
      const errorMessage = submitResponse?.data?.error?.errorMessage ||
        submitResponse?.data?.message ||
        'Failed to submit timesheet';
      showAlert(errorMessage, 'error');
    }

  } catch (error) {
    console.error('Error submitting weekly timesheet:', error);
    const errorMessage = error.response?.data?.error?.errorMessage ||
      error.response?.data?.message ||
      error.message ||
      'Failed to submit weekly timesheet';
    showAlert(`Failed to submit timesheet: ${errorMessage}`, 'error');
  } finally {
    setLoading(false);
  }
};

  // Attachment handling functions
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    console.log('Files selected:', files);
    setSelectedFiles(files);
  };

  const handleUploadAttachments = async () => {
    if (selectedFiles.length === 0) {
      showAlert('Please select at least one file to upload', 'warning');
      return;
    }

    console.log('Handling attachment upload:', selectedFiles);

    setUploading(true);

    try {
      // If timesheet has ID, upload to server immediately
      if (currentTimesheet && currentTimesheet.id) {
        console.log('Timesheet has ID, uploading directly to server');
        const uploadResponse = await uploadFilesToServer(currentTimesheet.id, selectedFiles);

        if (uploadResponse && uploadResponse.success) {
          const newAttachments = selectedFiles.map((file, index) => ({
            id: Date.now() + Math.random() + index,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date(),
            url: uploadResponse.fileUrls ? uploadResponse.fileUrls.find(url => url.includes(file.name)) : null,
            uploaded: true
          }));

          setAttachments(prev => [...prev, ...newAttachments]);
          showAlert(`${selectedFiles.length} file(s) uploaded successfully`, 'success');
        } else {
          showAlert('Failed to upload files to server', 'error');
        }
      } else {
        // Store files temporarily if no timesheet ID - they'll be uploaded on save/submit
        console.log('No timesheet ID, storing files for later upload');
        const tempAttachments = selectedFiles.map((file, index) => ({
          id: Date.now() + Math.random() + index,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadDate: new Date(),
          file: file, // Store actual file for later upload
          uploaded: false
        }));

        setAttachments(prev => [...prev, ...tempAttachments]);
        setPendingAttachments(prev => [...prev, ...tempAttachments]);
        showAlert(`${selectedFiles.length} file(s) added and will be uploaded when timesheet is saved`, 'info');
        setHasUnsavedChanges(true); // Mark as having unsaved changes
      }

      setUploadDialogOpen(false);
      setSelectedFiles([]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing files:', error);
      showAlert('Failed to process files', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (attachmentId) => {
    const attachmentToRemove = attachments.find(att => att.id === attachmentId);
    console.log('Removing attachment:', attachmentToRemove);

    // Remove from attachments
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));

    // Remove from pending attachments if it exists there
    if (attachmentToRemove && !attachmentToRemove.uploaded) {
      setPendingAttachments(prev => prev.filter(att => att.id !== attachmentId));
    }

    setHasUnsavedChanges(true);
    showAlert('Attachment removed', 'info');
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, open: false }));
    }, 5000);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'success.main';
    if (percentage >= 70) return 'warning.main';
    return 'error.main';
  };

  const currentWeekInfo = selectedProject && calendarValue ? getWeekDates(calendarValue) : null;

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  // Get selected project details
const getSelectedProjectDetails = () => {
  if (!selectedProject || !currentTimesheet) return null;
  
  // Use data from API response if available
  return {
    name: selectedProject,
    client: currentTimesheet.clientName || 'N/A',
    approver: currentTimesheet.approver || 'N/A',
    location: 'N/A', // You might need to add this to your API response
    frequency: 'Weekly',
    startDate: currentTimesheet.startDate || 'N/A'
  };
};
  // Calculate total working days in the selected week
  const getTotalWorkingDays = () => {
    if (!currentTimesheet) return 0;
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      .filter(day => currentTimesheet[day] > 0)
      .length;
  };

  const projectDetails = getSelectedProjectDetails();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Alert */}
      <Snackbar
        open={alert.open}
        autoHideDuration={5000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
        <AccessTime color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary">
            Weekly Timesheet Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your weekly work hours and leave
          </Typography>
        </Box>
      </Box>

      {/* Combined Project and Week Selection Card */}
  <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
  <CardContent sx={{ p: 2 }}>
    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
      Select Project and Week
    </Typography>

    <Grid container spacing={2}>
      {/* Project Dropdown (Left) */}
      <Grid item xs={12} md={6}>
    <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="project-select-label">Select Project</InputLabel>
              <Select
                labelId="project-select-label"
                value={selectedProject}
                label="Select Project"
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <MenuItem value="">Choose a project...</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.name} value={project.name}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

        {/* Calendar directly below dropdown */}
        {selectedProject && (
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              boxShadow: 2,
              p: 1,
              mt: 2,
              ml: 0, // no left margin
              maxWidth: 360,
              height: 320,
              bgcolor: "grey.50",
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
              <DateCalendar
                value={calendarValue}
                onChange={(newValue) => setCalendarValue(newValue)}
                slots={{ day: CustomDay }}
                sx={{
                  "& .MuiPickersDay-root": {
                    borderRadius: "50%",
                    fontSize: "0.85rem",
                    "&:hover": { backgroundColor: "primary.light" },
                  },
                  "& .Mui-selected": {
                    backgroundColor: "primary.main !important",
                    color: "#fff",
                  },
                  "& .MuiPickersCalendarHeader-root": {
                    px: 1,
                    py: 0.5,
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        )}
      </Grid>

      {/* Project Details (Right) */}
      <Grid item xs={12} md={6}>
{projectDetails && (
  <Box>
    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
      Project Details
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">Client</Typography>
        <Typography variant="body1" fontWeight="medium">{projectDetails.client}</Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">Start Date</Typography>
        <Typography variant="body1" fontWeight="medium">{projectDetails.startDate}</Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">Approver</Typography>
        <Typography variant="body1" fontWeight="medium">{projectDetails.approver}</Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="body2" color="text.secondary">Frequency</Typography>
        <Typography variant="body1" fontWeight="medium">{projectDetails.frequency}</Typography>
      </Grid>
      {/* ... rest of the code ... */}
    </Grid>
  </Box>
)}
      </Grid>
    </Grid>
  </CardContent>
</Card>

      {/* Timesheet Calendar View */}
      {selectedProject && selectedWeekStart && currentTimesheet && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Typography variant="h6" fontWeight="bold">
                  Timesheet for {selectedProject}
                </Typography>
                <Chip
                  label={getProjectConfig(selectedProject).label}
                  color={getProjectConfig(selectedProject).color}
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1">
                  Total: <strong>{getWorkingDaysHours(currentTimesheet)} hours</strong>
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  color={getPercentageColor(calculatePercentage(currentTimesheet))}
                >
                  {calculatePercentage(currentTimesheet)}%
                </Typography>
              </Box>
            </Box>

            {/* Add submission status indicator */}
            {isSubmitted && (
              <Alert severity="info" sx={{ mb: 2 }}>
                This timesheet has been submitted and cannot be edited.
              </Alert>
            )}

            {/* Show pending attachments warning */}
            {pendingAttachments.length > 0 && !isSubmitted && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                You have {pendingAttachments.length} attachment(s) that will be uploaded when you submit the timesheet.
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto', mt: 2 }}>
                <Table
                  sx={{
                    minWidth: 800,
                    '& .MuiTableCell-root': {
                      py: 1,
                      px: 0.5
                    }
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 120, fontWeight: 'bold', py: 1 }}>
                        Type
                      </TableCell>
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                        const isWeekend = day === 'saturday' || day === 'sunday';
                        const dayDate = currentWeekInfo?.weekDates[day];
                        return (
                          <TableCell
                            key={day}
                            align="center"
                            sx={{
                              minWidth: 60,
                              fontWeight: 'bold',
                              color: isWeekend ? 'text.secondary' : 'text.primary',
                              py: 1,
                              px: 0.5
                            }}
                          >
                            <Box>
                              <Typography variant="body2" sx={{
                                textTransform: 'uppercase',
                                fontSize: '0.8rem',
                              }}>
                                <b>{day.slice(0, 3)} {dayDate && (
                                  <b>{formatDate(dayDate)}</b>
                                )}</b>
                              </Typography>
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {/* Work Hours Row */}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', pl: 2, py: 1 }}>
                        Work Hours
                      </TableCell>
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                        const isWeekend = day === 'saturday' || day === 'sunday';
                        return (
                          <TableCell key={day} align="center" sx={{ py: 1, px: 0.5 }}>
                            <TextField
                              type="number"
                              value={currentTimesheet[day] || 0}
                              onChange={(e) => handleHourChange(day, e.target.value)}
                              disabled={!isFieldEditable(currentTimesheet, day)}
                              inputProps={{
                                min: 0,
                                max: 24,
                                step: 0.25,
                                style: {
                                  textAlign: 'center',
                                  fontWeight: currentTimesheet[day] > 0 ? 'bold' : 'normal',
                                  padding: '4px',
                                  width: '50px'
                                }
                              }}
                              sx={{
                                '& .MuiInputBase-root': {
                                  backgroundColor: !isFieldEditable(currentTimesheet, day) ? 'grey.100' : 'white',
                                  '&.Mui-disabled': {
                                    backgroundColor: 'grey.50',
                                    color: 'text.secondary'
                                  }
                                }
                              }}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* Sick Leave Row */}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', pl: 2, py: 1 }}>
                        Sick Leave/Company Holiday
                      </TableCell>
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                        const isWeekend = day === 'saturday' || day === 'sunday';
                        return (
                          <TableCell key={day} align="center" sx={{ py: 1, px: 0.5 }}>
                            <TextField
                              type="number"
                              value={currentTimesheet.sickLeave[day] || 0}
                              onChange={(e) => handleHourChange(day, e.target.value, 'sickLeave')}
                              disabled={!isFieldEditable(currentTimesheet, day, 'sickLeave') || isWeekend}
                              inputProps={{
                                min: 0,
                                max: 24,
                                step: 0.25,
                                style: {
                                  textAlign: 'center',
                                  fontWeight: currentTimesheet.sickLeave[day] > 0 ? 'bold' : 'normal',
                                  padding: '4px',
                                  width: '50px'
                                }
                              }}
                              sx={{
                                '& .MuiInputBase-root': {
                                  backgroundColor: !isFieldEditable(currentTimesheet, day, 'sickLeave') || isWeekend ? 'grey.50' : 'white',
                                  '&.Mui-disabled': {
                                    backgroundColor: 'grey.50',
                                    color: 'text.secondary'
                                  }
                                }
                              }}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>)}

            {/* Notes and Actions Section */}
            <Box sx={{ mt: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Notes & Additional Information
              </Typography>

              <TextField
                multiline
                rows={3}
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add any notes or comments about this timesheet..."
                disabled={isSubmitted || !currentTimesheet.isEditable}
                sx={{ mb: 3, width: '50%' }}
              />

              {/* Progress and Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2 }}>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchOrCreateTimesheet}
                    disabled={loading}
                  >
                    Refresh
                  </Button>

                  <Button
  variant="contained"
  startIcon={loading ? <CircularProgress size={16} /> : <Save />}
  onClick={() => saveTimesheet(false)}
  disabled={loading || !hasUnsavedChanges || isSubmitted || !isPresentWeek(selectedWeekStart)}
  sx={{ minWidth: 120 }}
>
  {loading ? 'Saving...' : 'Save Draft'}
</Button>

                  <Button
  variant="contained"
  color="success"
  startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}
  onClick={submitWeeklyTimesheet}
  disabled={loading || isSubmitted || !isFridayInPresentWeek()}
  sx={{ minWidth: 140 }}
>
  {loading ? 'Submitting...' : 'Submit for Approval'}
</Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}



     {selectedWeekStart && !isPresentWeek(selectedWeekStart) && (
  <Alert severity="info" sx={{ mb: 2 }}>
    This is a previous week's timesheet and cannot be edited or submitted.
  </Alert>
)} 


{isPresentWeek(selectedWeekStart) && !isFridayInPresentWeek() && (
  <Alert severity="info" sx={{ mb: 2 }}>
    Timesheet can only be submitted on Friday of the current week.
  </Alert>
)}

      {/* Upload Attachment Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUpload />
            Upload Attachments
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Input
              type="file"
              inputProps={{ multiple: true }}
              onChange={handleFileSelect}
              inputRef={fileInputRef}
              fullWidth
              sx={{ mb: 1 }}
            />
            <FormHelperText>
              Select one or more files to attach to this timesheet
            </FormHelperText>

            {selectedFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Selected files:
                </Typography>
                <List dense>
                  {selectedFiles.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={file.name}
                        secondary={formatFileSize(file.size)}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
              setSelectedFiles([]);
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUploadAttachments}
            variant="contained"
            disabled={uploading || selectedFiles.length === 0}
            startIcon={uploading ? <CircularProgress size={16} /> : null}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Empty State */}
      {!selectedProject && (
        <Card>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <AccessTime sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Project Selected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please select a project to start managing your timesheet
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Timesheets;