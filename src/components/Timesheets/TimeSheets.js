import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';

// Import Redux actions
import {
  fetchClientsForProjects,
  fetchTimesheetsByUserId,
  createTimesheet,
  updateTimesheet,
  submitWeeklyTimesheet as submitWeeklyTimesheetAction,
  uploadTimesheetAttachments,
  approveTimesheet,
  rejectTimesheet,
  cancelTimesheet,
  clearError,
  resetTimesheets
} from '../../redux/timesheetSlice';
import { fetchEmployees } from '../../redux/employeesSlice';

// Import utility functions and components
import {
  getMondayOfWeek,
  formatDateToYMD,
  getWeekDates,
  getCurrentWeek,
  getWeekDatesArray,
  formatDate,
  formatFileSize,
  getPercentageColor
} from './timesheetUtils';
import TimesheetMainView from './TimesheetMainView';
import httpService from '../../Services/httpService';
import { Avatar, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';
import { Box } from 'lucide-react';
import { AttachFile, CloudUpload } from '@mui/icons-material';

const Timesheets = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [isCreateMode, setIsCreateMode] = useState(false);

  // Filter states
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
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

  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

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

  // Redux state and dispatch
  const { userId, role } = useSelector((state) => state.auth);
  const { employeesList } = useSelector((state) => state.employee);
  const { 
    timesheets, 
    loading: timesheetLoading, 
    error: timesheetError,
    uploadLoading,
    uploadError,
    actionLoading,
    actionError,
    clients
  } = useSelector((state) => state.timesheet);

  const [isAddingNewTimesheet, setIsAddingNewTimesheet] = useState(false);
const [tempEmployeeForAdd, setTempEmployeeForAdd] = useState('');


// Timesheets.js - Add these state variables
const [employeeProjects, setEmployeeProjects] = useState([]);
const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
const [selectedTimesheetAttachments, setSelectedTimesheetAttachments] = useState([]);

// Add this with your other state declarations
const [loadingEmployeeProjects, setLoadingEmployeeProjects] = useState(false);

  const dispatch = useDispatch();

  // const projects = [
  //   {
  //     name: 'Project Alpha',
  //     client: 'Client A',
  //     approver: 'John Smith',
  //     location: 'New York',
  //     frequency: 'Weekly',
  //   },
  //   {
  //     name: 'Project Beta',
  //     client: 'Client B',
  //     approver: 'Sarah Johnson',
  //     location: 'London',
  //     frequency: 'Bi-weekly',
  //   },
  //   {
  //     name: 'Project Gamma',
  //     client: 'Client C',
  //     approver: 'Michael Chen',
  //     location: 'Singapore',
  //     frequency: 'Weekly',
  //   },
  //   {
  //     name: 'Project Delta',
  //     client: 'Client D',
  //     approver: 'Emma Wilson',
  //     location: 'Sydney',
  //     frequency: 'Monthly',
  //   },
  //   {
  //     name: 'Internal Tasks',
  //     client: 'Internal',
  //     approver: 'HR Department',
  //     location: 'All Locations',
  //     frequency: 'Weekly',
  //   }
  // ];

  useEffect(()=>{
    dispatch(fetchClientsForProjects())
  },[dispatch])


  console.log('Clients from Redux:', clients);

  // const clientsData=clients.map((client) => {
  //    return client;
  // });

  const clientsData=Array.isArray(clients) ? clients : [];

  console.log('Mapped Clients Data:', clientsData);

  useEffect(() => {
  // Check if we're in create mode based on URL
  const currentPath = window.location.pathname;
  setIsCreateMode(currentPath.includes('/timesheets/create'));
}, []);

  // Add this useEffect to load employees data for SUPERADMIN/ACCOUNTS roles
useEffect(() => {
  if (role === 'SUPERADMIN' || role === 'ACCOUNTS') {
    dispatch(fetchEmployees());
    
    // In create mode, auto-enable employee selection
    if (isCreateMode) {
      setIsAddingNewTimesheet(true);
    }
  }
}, [dispatch, role, isCreateMode]);
  // Fix the existing useEffect
  useEffect(() => {
    if (selectedEmployee || (role === 'EXTERNALEMPLOYEE')) {
      // Refetch timesheet when employee selection changes
      if (selectedProject && selectedWeekStart) {
        fetchOrCreateTimesheet();
      }
    }
  }, [selectedEmployee, selectedProject, selectedWeekStart]);

  // Fix the project change useEffect  
  useEffect(() => {
    if ((role === 'SUPERADMIN' || role === 'ACCOUNTS')) {
      setSelectedEmployee(''); // Reset employee selection when project changes
      setCurrentTimesheet(null); // Clear current timesheet
    }
  }, [selectedProject, role]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(resetTimesheets());
    };
  }, [dispatch]);

  // Show alert when there's an error from Redux
  useEffect(() => {
    if (timesheetError) {
      showAlert(timesheetError, 'error');
    }
    if (uploadError) {
      showAlert(uploadError, 'error');
    }
    if (actionError) {
      showAlert(actionError, 'error');
    }
  }, [timesheetError, uploadError, actionError]);

  const externalEmployeesOptions = employeesList?.filter(
    (emp) => (emp.roles === "EXTERNALEMPLOYEE") &&
      emp.status === "ACTIVE"
  )
    ?.map((emp) => ({
      label: `${emp.userName} (${emp.employeeId})`,
      value: emp.employeeId,
    })) || []


    // Add this useEffect after your existing useEffects in Timesheets.js
useEffect(() => {
  // When project is selected in create/add mode, create timesheet immediately
  if (selectedProject && (isCreateMode || isAddingNewTimesheet) && (tempEmployeeForAdd || selectedEmployee)) {
    if (!selectedWeekStart) {
      // Set current week if not set
      const currentWeek = getCurrentWeek();
      setSelectedWeekStart(currentWeek.startString);
      setCalendarValue(new Date(currentWeek.startString));
      setHighlightedWeek(getWeekDatesArray(new Date(currentWeek.startString)));
    } else {
      // Create timesheet for the selected project and employee
      createNewTimesheetForEmployee(tempEmployeeForAdd || selectedEmployee);
    }
  }
}, [selectedProject, isCreateMode, isAddingNewTimesheet, tempEmployeeForAdd, selectedEmployee, selectedWeekStart]);


useEffect(() => {
  const fetchEmployeeProjects = async () => {
    // Get the employee ID from the right source based on mode
    let employeeToFetch = null;
    
    if (isCreateMode || isAddingNewTimesheet) {
      employeeToFetch = tempEmployeeForAdd || selectedEmployee;
    } else {
      employeeToFetch = selectedEmployee;
    }
    
    if (employeeToFetch && (role === 'SUPERADMIN' || role === 'ACCOUNTS')) {
      try {
        setLoadingEmployeeProjects(true);
        console.log('Fetching projects for employee:', employeeToFetch);
        
        const response = await httpService.get(`/timesheet/vendors/${employeeToFetch}`);
        console.log('Employee projects API response:', response);
        
        let projectsData = [];
        if (response.data && response.data.success) {
          projectsData = response.data.data || [];
        }
        
        console.log('Setting employeeProjects to:', projectsData);
        setEmployeeProjects(projectsData);
      } catch (error) {
        console.error('Error fetching employee projects:', error);
        setEmployeeProjects([]);
        showAlert('Failed to fetch employee projects', 'error');
      } finally {
        setLoadingEmployeeProjects(false);
      }
    } else {
      console.log('Clearing employee projects - no employee selected');
      setEmployeeProjects([]);
    }
  };

  fetchEmployeeProjects();
}, [selectedEmployee, tempEmployeeForAdd, role, isCreateMode, isAddingNewTimesheet]);

// Add this useEffect after the existing useEffects
// In your useEffect that handles employee changes
useEffect(() => {
  if ((role === 'SUPERADMIN' || role === 'ACCOUNTS') && selectedEmployee) {
    setSelectedProject(''); // This should already exist
    setCurrentTimesheet(null); // This should already exist
    // Force re-render by ensuring employeeProjects is cleared first
    setEmployeeProjects([]);
  }
}, [selectedEmployee, role]);


// Add this function with your other handler functions
const handleEmployeeChange = (employeeId) => {
  console.log('Employee changed to:', employeeId);
  
  // Reset project selection and timesheet when employee changes
  setSelectedProject('');
  setCurrentTimesheet(null);
  setEmployeeProjects([]);
  
  if (isCreateMode || isAddingNewTimesheet) {
    // In create/add mode
    setTempEmployeeForAdd(employeeId);
    setSelectedEmployee(employeeId);
  } else {
    // In normal view mode
    setSelectedEmployee(employeeId);
  }
  
  console.log('Employee projects will be fetched for:', employeeId);
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
          borderRadius: 0, // Remove circular shape
          width: "100%",
          height: "100%",
          minWidth: "auto",
          border: "none",
          ...(isHighlighted && {
            backgroundColor: '#4caf50 !important', // Green background for highlighted week
            color: '#fff !important',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#45a049 !important', // Darker green on hover
            },
            // Override MUI's default selected styling
            '&.Mui-selected': {
              backgroundColor: '#2e7d32 !important', // Even darker green for selected day in highlighted week
              color: '#fff !important',
            },
          }),
          ...(outsideCurrentMonth && !isHighlighted && {
            color: 'text.disabled',
            backgroundColor: 'grey.50',
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

  // Special handling for add timesheet mode
  if (isAddingNewTimesheet || (isCreateMode && tempEmployeeForAdd)) {
    const employeeId = tempEmployeeForAdd || selectedEmployee;
    if (employeeId) {
      createNewTimesheetForEmployee(employeeId);
    }
    return;
  }

  setLoading(true);
  try {
    // Use selectedEmployee if available (for SUPERADMIN/ACCOUNTS), otherwise use current userId
    const targetUserId = selectedEmployee || userId;

    console.log('Fetching timesheet for:', { 
      targetUserId, 
      selectedProject, 
      selectedWeekStart,
      selectedEmployee,
      userId 
    });

    // Use Redux action instead of direct HTTP call
    const resultAction = await dispatch(fetchTimesheetsByUserId(targetUserId));

    if (fetchTimesheetsByUserId.fulfilled.match(resultAction)) {
      const response = resultAction.payload;
      
      console.log('Full API response:', response);
      setTimeSheetData(response.data || []);

      let existingTimesheet = null;

      if (response && response.success && response.data) {
        // Find existing timesheet for this week AND project
        existingTimesheet = response.data.find(ts => {
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
            size: 0,
            type: att.filetype,
            uploadDate: new Date(att.uploadedAt),
            uploaded: true,
            url: null
          }));
          setAttachments(processedAttachments);
        } else {
          setAttachments([]);
        }
        showAlert('Timesheet loaded successfully', 'success');
      } else {
        console.log('No existing timesheet found, creating new one');
        createNewTimesheetForEmployee(targetUserId); // Pass the target user ID
        setAttachments([]);
      }
    } else {
      throw new Error(resultAction.payload || 'Failed to fetch timesheets');
    }
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    showAlert(`Failed to fetch timesheet: ${error.message}`, 'error');
    createNewTimesheetForEmployee(selectedEmployee || userId); // Pass the target user ID
    setAttachments([]);
  } finally {
    setLoading(false);
  }
};

  const createNewTimesheet = () => {
    const weekInfo = getWeekDates(selectedWeekStart);
    const targetUserId = selectedEmployee || userId;

    const newTimesheet = {
      id: null,
      userId: targetUserId,
      project: selectedProject,
      status: 'Working',
      startDate: weekInfo.startString,
      endDate: weekInfo.endString,
      monday: 8,
      tuesday: 8,
      wednesday: 8,
      thursday: 8,
      friday: 8,
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

  const isFieldEditable = (timesheet, day, leaveType = null) => {
    // SUPERADMIN and ACCOUNTS can always edit (except submitted timesheets)
    if ((role === 'SUPERADMIN' || role === 'ACCOUNTS') && !isSubmitted) {
      // Saturday and Sunday are always disabled
      if (day === 'saturday' || day === 'sunday') {
        return false;
      }
      return true;
    }

    // EXTERNALEMPLOYEE follows original logic
    if (isSubmitted || (timesheet && !timesheet.isEditable)) return false;

    if (day === 'saturday' || day === 'sunday') {
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

const createNewTimesheetForEmployee = (employeeId = null) => {
  const weekInfo = getWeekDates(selectedWeekStart);
  const targetUserId = employeeId || selectedEmployee || userId;

  console.log('Creating new timesheet for employee:', targetUserId);

  const newTimesheet = {
    id: null,
    userId: targetUserId, // Use the target user ID
    project: selectedProject,
    status: 'Working',
    startDate: weekInfo.startString,
    endDate: weekInfo.endString,
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
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
};

const handleCancelAddTimesheet = () => {
  setIsAddingNewTimesheet(false);
  setTempEmployeeForAdd('');
  setSelectedEmployee(''); // Reset to no employee selected
  setCurrentTimesheet(null); // Clear the current timesheet
};

  const saveTimesheet = async (isSubmission = false) => {
    if (!currentTimesheet) return;

    const workingHours = getWorkingDaysHours(currentTimesheet);
    // const targetUserId = selectedEmployee || userId;
    const targetUserId = isAddingNewTimesheet ? tempEmployeeForAdd : (selectedEmployee || userId);

    console.log('Saving timesheet:', { currentTimesheet, workingHours, isSubmission, targetUserId });

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
        const dateString = entryDate.toLocaleDateString('en-CA');

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

      const timesheetData = {
        type: 'WEEKLY',
        date: currentWeekInfo.startString,
        workingEntries: workingEntries,
        nonWorkingEntries: nonWorkingEntries,
        notes: notes
      };

      console.log('Sending timesheet data:', JSON.stringify(timesheetData, null, 2));

      if (isUpdate) {
        // Use Redux action instead of direct HTTP call
        const resultAction =await dispatch(updateTimesheet({
          timesheetId: currentTimesheet.id,
          userId: targetUserId,
          timesheetData
        }));
        
        if (updateTimesheet.fulfilled.match(resultAction)) {
          response = resultAction.payload;
        } else {
          throw new Error(resultAction.payload || 'Failed to update timesheet');
        }
      } else {
        // Use Redux action instead of direct HTTP call
        const resultAction = dispatch(createTimesheet({
          userId: targetUserId,
          timesheetData
        }));
        
        if (createTimesheet.fulfilled.match(resultAction)) {
          response = resultAction.payload;
        } else {
          throw new Error(resultAction.payload || 'Failed to create timesheet');
        }
      }

      console.log('Save response:', response);

      if (response && response.success) {
        let timesheetId = currentTimesheet.id;

        if (!isUpdate && response.data && response.data.timesheetId) {
          timesheetId = response.data.timesheetId;
          setCurrentTimesheet(prev => ({
            ...prev,
            id: timesheetId
          }));
        }

        // Handle attachment uploads for EXTERNALEMPLOYEE role only
        if (!isSubmission && pendingAttachments.length > 0 && timesheetId && role === 'EXTERNALEMPLOYEE') {
          console.log('Uploading pending attachments:', pendingAttachments);
          try {
            const filesToUpload = pendingAttachments.map(att => att.file);
            const uploadResponse = await uploadFilesToServer(timesheetId, filesToUpload);

            if (uploadResponse && uploadResponse.success) {
              const uploadedAttachments = pendingAttachments.map(att => ({
                ...att,
                uploaded: true,
                file: undefined,
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
        setTimeout(() => {
          fetchOrCreateTimesheet();
        }, 1000);

      } else {
        const errorMessage = response?.error?.errorMessage ||
          response?.message ||
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


const handleAddTimesheetClick = (employeeId) => {
  console.log('Adding timesheet for employee:', employeeId);
  setTempEmployeeForAdd(employeeId);
  setIsAddingNewTimesheet(true);
  setSelectedEmployee(employeeId);
  
  // Clear any existing timesheet data
  setCurrentTimesheet(null);
  setSelectedProject('');
  setAttachments([]);
  setPendingAttachments([]);
  setHasUnsavedChanges(false);
  
  // Set current week as default
  const currentWeek = getCurrentWeek();
  setSelectedWeekStart(currentWeek.startString);
  setCalendarValue(new Date(currentWeek.startString));
  setHighlightedWeek(getWeekDatesArray(new Date(currentWeek.startString)));
  
  console.log('Add timesheet mode activated for employee:', employeeId);
};


const uploadFilesToServer = async (timesheetId, files) => {
  console.log('Uploading files to server:', { timesheetId, files });

  try {
    const resultAction = await dispatch(uploadTimesheetAttachments({
      timesheetId,
      files
    }));
    
    if (uploadTimesheetAttachments.fulfilled.match(resultAction)) {
      return resultAction.payload;
    } else {
      throw new Error(resultAction.payload || 'Failed to upload attachments');
    }
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

  const submitWeeklyTimesheetHandler = async () => {
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

      // const monday = getMondayOfWeek(calendarValue);
      const startDate = selectedWeekStart
      console.log('Submitting timesheet with:', { userId, startDate });

      // Use Redux action instead of direct HTTP call
      const resultAction = await dispatch(submitWeeklyTimesheetAction({
        userId,
        weekStart: startDate
      }));
      
      if (submitWeeklyTimesheetAction.fulfilled.match(resultAction)) {
        const submitResponse = resultAction.payload;
        
        console.log('Submit response:', submitResponse);

        if (submitResponse && submitResponse.success) {
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
          const errorMessage = submitResponse?.error?.errorMessage ||
            submitResponse?.message ||
            'Failed to submit timesheet';
          showAlert(errorMessage, 'error');
        }
      } else {
        throw new Error(resultAction.payload || 'Failed to submit timesheet');
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

  const handleApproveTimesheet = async () => {
    if (!currentTimesheet || !currentTimesheet.id) return;

    setAdminActionLoading(true);
    try {
      // Use Redux action instead of direct HTTP call
      const resultAction = dispatch(approveTimesheet({
        timesheetId: currentTimesheet.id,
        userId
      }));
      
      if (approveTimesheet.fulfilled.match(resultAction)) {
        const response = resultAction.payload;
        
        if (response.success) {
          showAlert('Timesheet approved successfully', 'success');
          fetchOrCreateTimesheet();
        } else {
          showAlert('Failed to approve timesheet', 'error');
        }
      } else {
        throw new Error(resultAction.payload || 'Failed to approve timesheet');
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
      showAlert('Failed to approve timesheet', 'error');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleRejectTimesheet = async () => {
    if (!currentTimesheet || !currentTimesheet.id || !rejectionReason.trim()) return;

    setAdminActionLoading(true);
    try {
      // Use Redux action instead of direct HTTP call
      const resultAction = await dispatch(rejectTimesheet({
        timesheetId: currentTimesheet.id,
        userId,
        reason: rejectionReason.trim()
      }));
      
      if (rejectTimesheet.fulfilled.match(resultAction)) {
        const response = resultAction.payload;
        
        if (response.success) {
          showAlert('Timesheet rejected successfully', 'success');
          setRejectDialogOpen(false);
          setRejectionReason('');
          fetchOrCreateTimesheet();
        } else {
          showAlert('Failed to reject timesheet', 'error');
        }
      } else {
        throw new Error(resultAction.payload || 'Failed to reject timesheet');
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      showAlert('Failed to reject timesheet', 'error');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleCancelTimesheet = async () => {
    if (!currentTimesheet) return;

    setAdminActionLoading(true);
    try {
      // Use Redux action instead of direct HTTP call
      const resultAction =await dispatch(cancelTimesheet({
        timesheetId: currentTimesheet.id,
        userId
      }));
      
      if (cancelTimesheet.fulfilled.match(resultAction)) {
        const response = resultAction.payload;
        
        if (response.success) {
          showAlert('Timesheet cancelled successfully', 'success');
          // Refresh the timesheet data
          fetchOrCreateTimesheet();
        } else {
          showAlert('Failed to cancel timesheet', 'error');
        }
      } else {
        throw new Error(resultAction.payload || 'Failed to cancel timesheet');
      }
    } catch (error) {
      console.error('Error cancelling timesheet:', error);
      showAlert('Failed to cancel timesheet', 'error');
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Timesheets.js - Add this function
const handleViewAttachments = (timesheet) => {
  if (timesheet.attachments && timesheet.attachments.length > 0) {
    setSelectedTimesheetAttachments(timesheet.attachments);
    setAttachmentsDialogOpen(true);
  } else {
    showAlert('No attachments found for this timesheet', 'info');
  }
};
  

  const projectDetails = getSelectedProjectDetails();

  // Timesheets.js - Add this component before the return statement
const AttachmentsDialog = () => (
  <Dialog
    open={attachmentsDialogOpen}
    onClose={() => setAttachmentsDialogOpen(false)}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AttachFile />
        Timesheet Attachments
      </Box>
    </DialogTitle>
    <DialogContent>
      <Box sx={{ py: 2 }}>
        {selectedTimesheetAttachments.length > 0 ? (
          <List>
            {selectedTimesheetAttachments.map((attachment, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => window.open(attachment.url || '#', '_blank')}
                    disabled={!attachment.url}
                  >
                    <CloudUpload />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <AttachFile />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={attachment.filename || attachment.name || `Attachment ${index + 1}`}
                  secondary={
                    attachment.uploadedAt 
                      ? `Uploaded: ${new Date(attachment.uploadedAt).toLocaleDateString()}`
                      : attachment.uploadDate 
                        ? `Uploaded: ${attachment.uploadDate.toLocaleDateString()}`
                        : 'Upload date not available'
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No attachments available
          </Typography>
        )}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setAttachmentsDialogOpen(false)}>Close</Button>
    </DialogActions>
  </Dialog>
);

  // Render the new main view component, passing all props needed for UI
  return (
    <TimesheetMainView
      alert={alert}
      handleCloseAlert={handleCloseAlert}
      selectedProject={selectedProject}
      setSelectedProject={setSelectedProject}
      // projects={projects}
      clients={clientsData}
      role={isAddingNewTimesheet ? 'EXTERNALEMPLOYEE' : role}
      selectedEmployee={selectedEmployee}
      setSelectedEmployee={setSelectedEmployee}
      externalEmployeesOptions={externalEmployeesOptions}
      calendarValue={calendarValue}
      setCalendarValue={setCalendarValue}
      CustomDay={CustomDay}
      highlightedWeek={highlightedWeek}
      currentTimesheet={currentTimesheet}
      currentWeekInfo={currentWeekInfo}
      isSubmitted={isSubmitted}
      pendingAttachments={pendingAttachments}
      loading={loading || timesheetLoading || actionLoading}
      getProjectConfig={getProjectConfig}
      getWorkingDaysHours={getWorkingDaysHours}
      getPercentageColor={getPercentageColor}
      calculatePercentage={calculatePercentage}
      handleHourChange={handleHourChange}
      isFieldEditable={isFieldEditable}
      notes={notes}
      handleNotesChange={handleNotesChange}
      fetchOrCreateTimesheet={fetchOrCreateTimesheet}
      saveTimesheet={saveTimesheet}
      // submitWeeklyTimesheet={submitWeeklyTimesheet}
      submitWeeklyTimesheet={submitWeeklyTimesheetHandler}
      isFridayInPresentWeek={isFridayInPresentWeek}
      onApprove={handleApproveTimesheet}
      onReject={() => setRejectDialogOpen(true)}
      onCancel={handleCancelTimesheet}
      adminActionLoading={adminActionLoading}
      hasUnsavedChanges={hasUnsavedChanges}
      rejectionReason={rejectionReason}
      setRejectionReason={setRejectionReason}
      rejectDialogOpen={rejectDialogOpen}
      setRejectDialogOpen={setRejectDialogOpen}
      uploadDialogOpen={uploadDialogOpen}
      setUploadDialogOpen={setUploadDialogOpen}
      uploading={uploading || uploadLoading}
      handleUploadAttachments={handleUploadAttachments}
      handleFileSelect={handleFileSelect}
      fileInputRef={fileInputRef}
      selectedFiles={selectedFiles}
      setSelectedFiles={setSelectedFiles}
      attachments={attachments}
      handleRemoveAttachment={handleRemoveAttachment}
      projectDetails={projectDetails}
      timesheetData={timesheetData || []}
      getWeekDates={getWeekDates}
      getSelectedProjectDetails={getSelectedProjectDetails}
      getTotalWorkingDays={getTotalWorkingDays}
      selectedWeekStart={selectedWeekStart}
      isPresentWeek={isPresentWeek}
      handleRejectTimesheet={handleRejectTimesheet}
      formatFileSize={formatFileSize}
      isCreateMode={isCreateMode}
      isAddingNewTimesheet={isAddingNewTimesheet}
      handleCancelAddTimesheet={handleCancelAddTimesheet}
      handleAddTimesheetClick={handleAddTimesheetClick}
      tempEmployeeForAdd={tempEmployeeForAdd}
      setTempEmployeeForAdd={setTempEmployeeForAdd}
       handleViewAttachments={handleViewAttachments}
      AttachmentsDialog={AttachmentsDialog}
      loadingEmployeeProjects={loadingEmployeeProjects}
  handleEmployeeChange={handleEmployeeChange}
  employeeProjects={employeeProjects}
    />
  );
};

export default Timesheets;