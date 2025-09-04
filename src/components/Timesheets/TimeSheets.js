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
  deleteTimesheetAttachments,
  approveTimesheet,
  rejectTimesheet,
  cancelTimesheet,
  clearError,
  resetTimesheets,
  getTimesheetAttachmentsById
} from '../../redux/timesheetSlice';
import { fetchEmployees } from '../../redux/employeesSlice';

// Import utility functions and components
import {
  getMondayOfWeek,
  formatDateToYMD,
  getDateForDay,
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
import { useLocation } from 'react-router-dom';
import ToastService from '../../Services/toastService';

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

  //add this for prepopulation
  const [prepopulatedEmployee, setPrepopulatedEmployee] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const location = useLocation();

  const dispatch = useDispatch();



  useEffect(() => {
    dispatch(fetchClientsForProjects())
  }, [dispatch])


  // Add debug logging to understand what's happening
  useEffect(() => {
    if (selectedWeekStart) {
      console.log('=== DATE DEBUGGING ===');
      console.log('Selected Week Start:', selectedWeekStart);

      const currentDate = new Date();
      console.log('Current Date:', currentDate.toLocaleDateString());
      console.log('Current Month:', currentDate.getMonth() + 1);

      const weekStartDate = new Date(selectedWeekStart);
      console.log('Week Start Month:', weekStartDate.getMonth() + 1);

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      days.forEach(day => {
        const date = getDateForDay(selectedWeekStart, day);
        const isInSelectedMonth = date ? isDateInSelectedWeekMonth(date, selectedWeekStart) : false;

        console.log(`${day}: ${date?.toLocaleDateString()} | In Selected Month: ${isInSelectedMonth} | Month: ${date ? date.getMonth() + 1 : 'N/A'}`);
      });
    }
  }, [selectedWeekStart]);


  console.log('Clients from Redux:', clients);

  const clientsData = Array.isArray(clients) ? clients : [];

  console.log('Mapped Clients Data:', clientsData);

  useEffect(() => {
    // Check if we're in create mode based on URL
    const currentPath = window.location.pathname;
    setIsCreateMode(currentPath.includes('/timesheets/create'));
  }, []);

  // Add this useEffect to load employees data for SUPERADMIN/ACCOUNTS roles
  useEffect(() => {
    if (role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE") {
      dispatch(fetchEmployees());

      // In create mode, auto-enable employee selection
      if (isCreateMode) {
        setIsAddingNewTimesheet(true);
      }
    }
  }, [dispatch, role, isCreateMode]);

  useEffect(() => {
    // Immediately fetch projects when employee changes in add mode
    if (isAddingNewTimesheet && tempEmployeeForAdd && !selectedProject) {
      console.log('Employee selected in add mode, fetching projects immediately');
      // The fetchEmployeeProjects useEffect will handle the actual API call
    }
  }, [tempEmployeeForAdd, isAddingNewTimesheet]);

  useEffect(() => {
    // Only fetch/create timesheet if we have all required data
    if (selectedProject && selectedWeekStart) {
      // For normal mode, need selectedEmployee for admin roles
      if ((role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE") && !isAddingNewTimesheet && !isCreateMode) {
        if (selectedEmployee) {
          console.log('Fetching timesheet for admin role with selected employee');
          fetchOrCreateTimesheet();
        }
      }
      // For external employee or add/create modes
      else if (role === 'EXTERNALEMPLOYEE' || isAddingNewTimesheet || isCreateMode) {
        console.log('Fetching timesheet for external employee or add/create mode');
        fetchOrCreateTimesheet();
      }
    } else {
      // Clear timesheet if missing required data
      setCurrentTimesheet(null);
      setHasUnsavedChanges(false);
    }
  }, [selectedProject, selectedWeekStart, selectedEmployee, role, isAddingNewTimesheet, isCreateMode]);

  useEffect(() => {
    if ((role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE")) {
      // When employee changes in normal mode (not add/create), clear everything
      if (isAddingNewTimesheet && isCreateMode) {
        setSelectedProject('');
        setCurrentTimesheet(null);
        setEmployeeProjects([]);
        setAttachments([]);
        setPendingAttachments([]);
        setHasUnsavedChanges(false);
      }
    }
  }, [selectedEmployee, role, isAddingNewTimesheet, isCreateMode]);

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
    // Check for prepopulated employee data from navigation
    const checkPrepopulatedEmployee = () => {
      // First check location state
      if (location.state?.prepopulatedEmployee) {
        setPrepopulatedEmployee(location.state.prepopulatedEmployee);
        return;
      }

      // Then check localStorage as fallback
      try {
        const storedEmployee = localStorage.getItem('prepopulatedEmployee');
        if (storedEmployee) {
          const employeeData = JSON.parse(storedEmployee);
          setPrepopulatedEmployee(employeeData);
          localStorage.removeItem('prepopulatedEmployee'); // Clean up
        }
      } catch (error) {
        console.warn('Error reading prepopulated employee from localStorage:', error);
      }
    };

    checkPrepopulatedEmployee();
  }, [location.state]);


  // Add this useEffect to handle prepopulation when employee data is available
  useEffect(() => {
    if (prepopulatedEmployee && (role === 'ACCOUNTS' || role === 'INVOICE')) {
      console.log('Prepopulating employee:', prepopulatedEmployee);

      // Set the employee and trigger project fetch with callback
      handleEmployeeChange(prepopulatedEmployee.userId, handleProjectPrepopulation);

      // Clear the prepopulated data after use
      setPrepopulatedEmployee(null);
    }
  }, [prepopulatedEmployee, role]);



  useEffect(() => {
    return () => {
      // Clean up location state to prevent re-prepopulation on back navigation
      if (window.history.state && window.history.state.usr) {
        window.history.replaceState({ ...window.history.state, usr: {} }, '');
      }
    };
  }, []);


  // Add this useEffect after the existing useEffects
  // In your useEffect that handles employee changes
  useEffect(() => {
    if ((role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE") && selectedEmployee) {
      setSelectedProject(''); // This should already exist
      setCurrentTimesheet(null); // This should already exist
      // Force re-render by ensuring employeeProjects is cleared first
      setEmployeeProjects([]);
    }
  }, [selectedEmployee, role]);




 const handleEmployeeChange = async (employeeId, callback) => {
  console.log('Employee changed to:', employeeId);

  // Reset project selection and timesheet when employee changes
  setSelectedProject('');
  setCurrentTimesheet(null);
  setAttachments([]);
  setPendingAttachments([]);
  setHasUnsavedChanges(false);

  if (isCreateMode || isAddingNewTimesheet) {
    setTempEmployeeForAdd(employeeId);
    setSelectedEmployee(employeeId);
  } else {
    setSelectedEmployee(employeeId);
  }

  // Immediately fetch projects for the selected employee
  if (employeeId && (role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE")) {
    setLoadingEmployeeProjects(true);
    try {
      console.log('Fetching projects for employee:', employeeId);
      const response = await httpService.get(`/timesheet/vendors/${employeeId}`);
      console.log('Employee projects API response:', response);

      let projectsData = [];
      if (response.data && response.data.success) {
        // Handle both array of strings and array of objects
        if (Array.isArray(response.data.data)) {
          projectsData = response.data.data.map((project, index) => {
            if (typeof project === 'string') {
              return {
                projectId: index,
                projectName: project
              };
            } else {
              return project;
            }
          });
        }
      }

      console.log('Processed employeeProjects:', projectsData);
      setEmployeeProjects(projectsData);

      // Execute callback if provided (for prepopulation)
      if (callback && typeof callback === 'function') {
        callback(projectsData);
      }
    } catch (error) {
      console.error('Error fetching employee projects:', error);
      setEmployeeProjects([]);
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage || 'Failed to fetch employee projects');
    } finally {
      setLoadingEmployeeProjects(false);
    }
  } else {
    setEmployeeProjects([]);
    setLoadingEmployeeProjects(false);
  }
};


  // Timesheets.js - Add this function
  const handleProjectPrepopulation = (projectsData) => {
    if (projectsData.length > 0 && prepopulatedEmployee) {
      // Auto-select the first project for the prepopulated employee
      const firstProject = projectsData[0];
      const projectName = firstProject.projectName || firstProject;

      console.log('Auto-selecting project for prepopulated employee:', projectName);
      setSelectedProject(projectName);

      // Set current week for the timesheet
      const currentWeek = getCurrentWeek();
      setSelectedWeekStart(currentWeek.startString);
      setCalendarValue(new Date(currentWeek.startString));
      setHighlightedWeek(getWeekDatesArray(new Date(currentWeek.startString)));
    }
  };
  // Custom day renderer for calendar
  const CustomDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;

    const isHighlighted = highlightedWeek.some(
      (weekDay) =>
        weekDay.toISOString().split('T')[0] === day.toISOString().split('T')[0]
    );

    // Disable days that are outside the current month
    const isDisabled = outsideCurrentMonth;

    return (
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
        disabled={isDisabled}
        sx={{
          borderRadius: 0,
          width: "100%",
          height: "100%",
          minWidth: "auto",
          border: "none",
          ...(isHighlighted && {
            backgroundColor: '#4caf50 !important',
            color: '#fff !important',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#45a049 !important',
            },
            '&.Mui-selected': {
              backgroundColor: '#2e7d32 !important',
              color: '#fff !important',
            },
          }),
          ...(outsideCurrentMonth && {
            color: 'text.disabled',
            backgroundColor: 'grey.50',
            pointerEvents: 'none', // Disable interaction
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
  // Update highlighted week and selected week when calendar value changes
  useEffect(() => {
    if (calendarValue && selectedProject) {
      const monday = getMondayOfWeek(calendarValue);
      const weekInfo = getWeekDates(monday);
      const weekDates = getWeekDatesArray(monday);

      setHighlightedWeek(weekDates);
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

  useEffect(() => {
    const fetchEmployeeAttachments = async () => {
      if ((role === 'ACCOUNTS' || role === 'INVOICE') && selectedEmployee && timesheetData.length > 0) {
        // Find the current week's timesheet for the selected employee
        const currentWeekTimesheet = timesheetData.find(ts => {
          const tsWeekStart = new Date(ts.weekStartDate).toISOString().split('T')[0];
          return tsWeekStart === selectedWeekStart;
        });

        if (currentWeekTimesheet && currentWeekTimesheet.timesheetId) {
          const attachments = await fetchTimesheetAttachments(currentWeekTimesheet.timesheetId);
          setAttachments(attachments);
        }
      }
    };

    fetchEmployeeAttachments();
  }, [selectedEmployee, timesheetData, selectedWeekStart, role]);

const extractErrorMessage = (errorData) => {
  if (typeof errorData === 'string') {
    return errorData;
  }
  
  if (errorData?.error?.errorMessage) {
    return errorData.error.errorMessage;
  }
  
  if (errorData?.message) {
    return errorData.message;
  }
  
  if (errorData?.data?.message) {
    return errorData.data.message;
  }
  
  if (errorData instanceof Error) {
    return errorData.message;
  }
  
  return 'An unexpected error occurred';
};

// 1. Fixed fetchOrCreateTimesheet function
const fetchOrCreateTimesheet = async () => {
  if (!selectedProject || !selectedWeekStart) return;

  // Special handling for add timesheet mode
  if (isAddingNewTimesheet || (isCreateMode && tempEmployeeForAdd)) {
    const employeeId = tempEmployeeForAdd || selectedEmployee;
    if (employeeId) {
      console.log("Creating new timesheet for employee in add/create mode:", employeeId);
      setCurrentTimesheet(getEmptyTimesheet(selectedProject));
      await createNewTimesheetForEmployee(employeeId);
    }
    return;
  }

  setLoading(true);
  try {
    const targetUserId = selectedEmployee || userId;

    console.log("Fetching timesheet for:", {
      targetUserId,
      selectedProject,
      selectedWeekStart,
      selectedEmployee,
      userId
    });

    const resultAction = await dispatch(fetchTimesheetsByUserId(targetUserId));

    if (fetchTimesheetsByUserId.fulfilled.match(resultAction)) {
      const response = resultAction.payload;

      console.log("Full API response:", response);
      
      // Handle response properly - ensure we extract data correctly
      const timesheetData = response?.data || [];
      setTimeSheetData(timesheetData);

      let existingTimesheet = null;

      if (response?.success && Array.isArray(timesheetData)) {
        existingTimesheet = timesheetData.find(ts => {
          const tsWeekStart = new Date(ts.weekStartDate).toISOString().split("T")[0];
          const hasProjectEntries = ts.workingEntries?.some(entry => entry.project === selectedProject);
          console.log("Checking timesheet:", {
            tsWeekStart,
            selectedWeekStart,
            hasProjectEntries,
            timesheetId: ts.timesheetId
          });
          return tsWeekStart === selectedWeekStart && hasProjectEntries;
        });
      }

      console.log("Found existing timesheet:", existingTimesheet);

      if (existingTimesheet) {
        const transformed = transformTimesheet(existingTimesheet);
        const safeTransformed = { ...getEmptyTimesheet(selectedProject), ...transformed };
        console.log("Transformed timesheet:", safeTransformed);
        setCurrentTimesheet(safeTransformed);

        if (existingTimesheet.attachments?.length > 0) {
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
        ToastService.success("Timesheet loaded successfully");
      } else {
        console.log("No existing timesheet found, creating new one");
        setCurrentTimesheet(getEmptyTimesheet(selectedProject));
        await createNewTimesheetForEmployee(targetUserId);
        setAttachments([]);
      }
    } else {
      // Handle error response properly - extract string message
      const errorMessage = extractErrorMessage(resultAction.payload);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error("Error fetching timesheet:", error);
    
    // Extract proper error message
    const errorMessage = extractErrorMessage(error);
    ToastService.error(errorMessage);
    setCurrentTimesheet(getEmptyTimesheet(selectedProject));
    await createNewTimesheetForEmployee(selectedEmployee || userId);
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

    // Check if timesheet is submitted/approved (but not if in edit mode for rejected timesheets)
    const submitted = (apiTimesheet.status === 'SUBMITTED' ||
      apiTimesheet.status === 'APPROVED' ||
      apiTimesheet.status === 'PENDING_APPROVAL') && !isEditMode;
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
      // Allow editing if in edit mode for rejected timesheets
      isEditable: isEditMode || (!submitted && (apiTimesheet.status === 'DRAFT' || !apiTimesheet.status)),
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
      clientName: apiTimesheet.clientName || '',
      approver: apiTimesheet.approver || '',
      startDate: apiTimesheet.startDate || apiTimesheet.weekStartDate || ''
    };

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    console.log('Processing working entries:', apiTimesheet.workingEntries);

    // Process working entries - only for dates in selected week's month
    if (apiTimesheet.workingEntries) {
      apiTimesheet.workingEntries.forEach(entry => {
        console.log('Processing working entry:', entry);

        const entryDate = new Date(entry.date);

        // Skip entries for dates outside selected week's month
        if (!isDateInSelectedWeekMonth(entryDate, selectedWeekStart)) {
          console.log('Skipping entry outside selected week month:', entry.date);
          return;
        }

        const dayOfWeek = entryDate.getDay();
        const hours = parseFloat(entry.hours) || 0;
        const dayName = days[dayOfWeek];

        console.log('Working entry details:', {
          date: entry.date,
          dayOfWeek,
          dayName,
          hours,
          project: entry.project,
          inSelectedWeekMonth: isDateInSelectedWeekMonth(entryDate, selectedWeekStart)
        });

        if (dayName && transformed.hasOwnProperty(dayName) && entry.project === selectedProject) {
          console.log(`Adding ${hours} working hours to ${dayName}`);
          transformed[dayName] += hours;
        }
      });
    }

    console.log('Processing non-working entries:', apiTimesheet.nonWorkingEntries);

    // Process non-working entries - only for dates in selected week's month
    if (apiTimesheet.nonWorkingEntries) {
      apiTimesheet.nonWorkingEntries.forEach(entry => {
        console.log('Processing non-working entry:', entry);

        const entryDate = new Date(entry.date);

        // Skip entries for dates outside selected week's month
        if (!isDateInSelectedWeekMonth(entryDate, selectedWeekStart)) {
          console.log('Skipping non-working entry outside selected week month:', entry.date);
          return;
        }

        const dayOfWeek = entryDate.getDay();
        const hours = parseFloat(entry.hours) || 0;
        const dayName = days[dayOfWeek];
        const description = entry.description?.toLowerCase() || '';

        console.log('Non-working entry details:', {
          date: entry.date,
          dayOfWeek,
          dayName,
          hours,
          description,
          inSelectedWeekMonth: isDateInSelectedWeekMonth(entryDate, selectedWeekStart)
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


  const isDateInCurrentMonth = (date, referenceDate = new Date()) => {
    const targetDate = new Date(date);
    const refDate = new Date(referenceDate);

    return targetDate.getMonth() === refDate.getMonth() &&
      targetDate.getFullYear() === refDate.getFullYear();
  };


  // Use the calendar month for validation, not the week's month
  const isDateInCalendarMonth = (date, calendarDate) => {
    if (!date || !calendarDate) return false;

    const targetDate = new Date(date);
    const calDate = new Date(calendarDate);

    return targetDate.getMonth() === calDate.getMonth() &&
      targetDate.getFullYear() === calDate.getFullYear();
  };


  const isDateInSelectedWeekMonth = (date, selectedWeekStart) => {
    if (!selectedWeekStart) return false;

    const targetDate = new Date(date);
    const weekStartDate = new Date(selectedWeekStart);

    // Use the selected week's month, not the current calendar month
    return targetDate.getMonth() === weekStartDate.getMonth() &&
      targetDate.getFullYear() === weekStartDate.getFullYear();
  };

  // Enhanced field editable check based on calendar month
const isFieldEditable = (timesheet, day, leaveType = null, calendarDate) => {
  // Always disable Saturday and Sunday
  if (day === 'saturday' || day === 'sunday') {
    return false;
  }

  // Check if the date for this day is in the calendar month
  if (calendarDate && selectedWeekStart) {
    const dayDate = getDateForDay(selectedWeekStart, day);
    if (dayDate && !isDateInCalendarMonth(dayDate, calendarDate)) {
      return false; // Disable if date is outside calendar month
    }
  }

  // SUPERADMIN and ACCOUNTS can always edit (except submitted timesheets)
  if ((role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE") && !isSubmitted) {
    return true;
  }

  // EXTERNALEMPLOYEE follows original logic
  if (isSubmitted || (timesheet && !timesheet.isEditable)) return false;

  // For main hours row, check if any leave type has hours for this day
  if (!leaveType) {
    const hasSickLeave = timesheet.sickLeave && timesheet.sickLeave[day] > 0;
    const hasHoliday = timesheet.companyHoliday && timesheet.companyHoliday[day] > 0;
    if (hasSickLeave || hasHoliday) return false;
  }

  // For leave types, check if the opposite leave type exists
  if (leaveType === 'sickLeave') {
    if (timesheet.companyHoliday && timesheet.companyHoliday[day] > 0) {
      return false;
    }
    // Allow editing sick leave even if regular hours exist (they'll be cleared)
  } else if (leaveType === 'companyHoliday') {
    if (timesheet.sickLeave && timesheet.sickLeave[day] > 0) {
      return false;
    }
    // Allow editing holiday even if regular hours exist (they'll be cleared)
  }

  return true;
};

const resetToDefaultHours = (day, timesheet) => {
  // For weekdays (Monday-Friday), default to 8 hours
  if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day)) {
    return 8;
  }
  // For weekends, default to 0
  return 0;
};

 const handleHourChange = (day, value, type = 'regular') => {
  if (!currentTimesheet || day === 'saturday' || day === 'sunday') return;

  const numValue = parseFloat(value) || 0;

  // Validate hour limits (maximum 8 hours for any type)
  if (numValue < 0 || numValue > 8) {
    if (numValue > 8) {
      ToastService.error(`Maximum 8 hours allowed per day`);
    }
    return;
  }

  console.log('Hour change:', { day, value, numValue, type });

  // Check if field is editable based on calendar month
  const isEditable = isFieldEditable(currentTimesheet, day, type === 'regular' ? null : type, calendarValue);

  if (!isEditable) {
    const dayDate = getDateForDay(selectedWeekStart, day);
    const dateStr = dayDate ? dayDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : day;

    ToastService.error(`Cannot enter hours on ${dateStr} - date is not in the current calendar month`);
    return;
  }

  setCurrentTimesheet(prev => {
    const updated = { ...prev };
    
    if (type === 'regular') {
      // For regular hours, check if there's already leave hours for this day
      const hasSickLeave = prev.sickLeave && prev.sickLeave[day] > 0;
      const hasHoliday = prev.companyHoliday && prev.companyHoliday[day] > 0;

      if (hasSickLeave || hasHoliday) {
        ToastService.error(`Cannot enter regular hours on ${day} - leave/holiday already exists`);
        return prev; // Don't update if leave/holiday exists
      }

      updated[day] = numValue;
      
      // If setting regular hours to > 0, clear any leave hours
      if (numValue > 0) {
        if (updated.sickLeave) updated.sickLeave[day] = 0;
        if (updated.companyHoliday) updated.companyHoliday[day] = 0;
      }
      
    } else if (type === 'sickLeave') {
      // Set sick leave hours
      updated.sickLeave = { ...prev.sickLeave, [day]: numValue };
      
      // If setting sick leave to > 0, clear regular hours and holiday
      if (numValue > 0) {
        updated[day] = 0;
        if (updated.companyHoliday) updated.companyHoliday[day] = 0;
      } else {
        // If setting sick leave to 0, reset to default regular hours
        updated[day] = resetToDefaultHours(day, prev);
      }
      
    } else if (type === 'companyHoliday') {
      // Set holiday hours
      updated.companyHoliday = { ...prev.companyHoliday, [day]: numValue };
      
      // If setting holiday to > 0, clear regular hours and sick leave
      if (numValue > 0) {
        updated[day] = 0;
        if (updated.sickLeave) updated.sickLeave[day] = 0;
      } else {
        // If setting holiday to 0, reset to default regular hours
        updated[day] = resetToDefaultHours(day, prev);
      }
    }

    console.log('Updated timesheet after hour change:', updated);
    return updated;
  });

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

    console.log('Creating new timesheet for employee:', {
      targetUserId,
      selectedProject,
      weekInfo,
      employeeId,
      selectedEmployee
    });

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
      percentageOfTarget: 100, // Set to 100% for default 8 hours per day
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

    console.log('New timesheet created:', newTimesheet);
  };


  const handleCancelAddTimesheet = () => {
    console.log('Cancelling add timesheet mode');
    setIsAddingNewTimesheet(false);
    setTempEmployeeForAdd('');
    setSelectedEmployee('');
    setSelectedProject('');
    setCurrentTimesheet(null);
    setEmployeeProjects([]);
    setAttachments([]);
    setPendingAttachments([]);
    setHasUnsavedChanges(false);

    // Reset week selection to current week
    const currentWeek = getCurrentWeek();
    setSelectedWeekStart(currentWeek.startString);
    setCalendarValue(new Date(currentWeek.startString));
    setHighlightedWeek(getWeekDatesArray(new Date(currentWeek.startString)));
  };

  const getEmptyTimesheet = (project = null) => ({
    id: null,
    project: project,
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
    sickLeave: {
      monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
      friday: 0, saturday: 0, sunday: 0
    },
    companyHoliday: {
      monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
      friday: 0, saturday: 0, sunday: 0
    }
  });


  //  Save Timesheet
const saveTimesheet = async (isSubmission = false, isEdit = false) => {
  if (!currentTimesheet) return;

  const workingHours = getWorkingDaysHours(currentTimesheet);
  const targetUserId = isAddingNewTimesheet
    ? tempEmployeeForAdd
    : (selectedEmployee || userId);

  console.log("Saving timesheet:", { currentTimesheet, workingHours, isSubmission, targetUserId, isEdit });

  setLoading(true);
  try {
    const workingEntries = [];
    const nonWorkingEntries = [];
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

    // Get the Monday of the selected week
    const monday = getMondayOfWeek(calendarValue);

    days.forEach((day, index) => {
      const entryDate = new Date(monday);
      entryDate.setDate(monday.getDate() + index);
      const dateString = entryDate.toLocaleDateString("en-CA");

      // Skip entries for dates outside selected week's month
      if (!isDateInSelectedWeekMonth(entryDate, selectedWeekStart)) {
        console.log('Skipping entry outside selected week month:', dateString);
        return;
      }

      const dayHours = currentTimesheet[day] || 0;
      const sickLeaveHours = currentTimesheet.sickLeave?.[day] || 0;
      const holidayHours = currentTimesheet.companyHoliday?.[day] || 0;

      if (dayHours > 0) {
        workingEntries.push({
          date: dateString,
          project: currentTimesheet.project,
          hours: dayHours,
          description: `Work - ${day.charAt(0).toUpperCase() + day.slice(1)}`
        });
      }

      if (sickLeaveHours > 0) {
        nonWorkingEntries.push({
          date: dateString,
          project: currentTimesheet.project,
          hours: sickLeaveHours,
          description: `Sick Leave - ${day.charAt(0).toUpperCase() + day.slice(1)}`
        });
      }

      if (holidayHours > 0) {
        nonWorkingEntries.push({
          date: dateString,
          hours: holidayHours,
          description: `Company Holiday - ${day.charAt(0).toUpperCase() + day.slice(1)}`
        });
      }
    });

    const timesheetData = {
      date: selectedWeekStart,
      workingEntries,
      nonWorkingEntries,
      notes
    };

    console.log("Sending timesheet data:", JSON.stringify(timesheetData, null, 2));

    let response;

    // Determine which API call to use
    const shouldUpdate = isEdit ||
      (currentTimesheet.id !== null && currentTimesheet.id !== undefined) ||
      (role === 'EXTERNALEMPLOYEE' && isEditMode);

    if (shouldUpdate) {
      // Use updateTimesheet for edits or existing timesheets
      const resultAction = await dispatch(updateTimesheet({
        timesheetId: currentTimesheet.id,
        userId: targetUserId,
        timesheetData
      }));

      if (updateTimesheet.fulfilled.match(resultAction)) {
        response = resultAction.payload;
        console.log("Updated timesheet via updateTimesheet API");
      } else {
        // Handle error properly - extract string message
        const errorMessage = extractErrorMessage(resultAction.payload);
        ToastService.error(errorMessage);
        return;
      }
    } else {
      // Use createTimesheet for new timesheets (Save Draft)
      const resultAction = await dispatch(createTimesheet({
        userId: targetUserId,
        timesheetData
      }));

      if (createTimesheet.fulfilled.match(resultAction)) {
        response = resultAction.payload;
        console.log("Created timesheet via createTimesheet API");
      } else {
        // Handle error properly - extract string message
        const errorMessage = extractErrorMessage(resultAction.payload);
        
        // Special handling for duplicate entry error
        if (errorMessage.toLowerCase().includes('duplicate')) {
          ToastService.error("A timesheet already exists for this week and project. Please update the existing timesheet instead.");
        } else {
          ToastService.error(errorMessage);
        }
        return;
      }
    }

    console.log("Save response:", response);

    // Handle response properly - check for success flag
    if (response?.success) {
      let timesheetId = currentTimesheet.id;

      if (!shouldUpdate && response.data?.timesheetId) {
        timesheetId = response.data.timesheetId;
        setCurrentTimesheet(prev => ({ ...prev, id: timesheetId }));
      }

      // Handle attachments for EXTERNALEMPLOYEE
      if (!isSubmission && pendingAttachments.length > 0 && timesheetId && role === "EXTERNALEMPLOYEE") {
        console.log("Uploading pending attachments:", pendingAttachments);
        try {
          const filesToUpload = pendingAttachments.map(att => att.file);
          const uploadResponse = await uploadFilesToServer(timesheetId, filesToUpload);

          if (uploadResponse?.success) {
            const uploadedAttachments = pendingAttachments.map(att => ({
              ...att,
              uploaded: true,
              file: undefined,
              url: uploadResponse.fileUrls?.find(url => url.includes(att.name))
            }));

            setAttachments(prev => [...prev.filter(a => a.uploaded), ...uploadedAttachments]);
            setPendingAttachments([]);
            ToastService.success(`Timesheet saved and ${pendingAttachments.length} attachment(s) uploaded`);
          } else {
            ToastService.warning(`Timesheet saved but failed to upload some attachments`);
          }
        } catch (uploadError) {
          console.error("Error uploading pending attachments:", uploadError);
          ToastService.error("Failed to upload attachments after saving timesheet");
        }
      } else {
        const action = shouldUpdate ? "updated" : "created";
        ToastService.success(`Timesheet ${action} successfully`);
      }

      setHasUnsavedChanges(false);

      // Reset edit mode if it was an edit operation
      if (isEdit || isEditMode) {
        setIsEditMode(false);
        // Refresh the timesheet to get updated status
        setTimeout(() => {
          fetchOrCreateTimesheet();
        }, 1000);
      }
    } else {
      // Handle API error response properly - extract string message
      const errorMessage = extractErrorMessage(response);
      
      // Special handling for duplicate entry error
      if (errorMessage.toLowerCase().includes('duplicate')) {
        ToastService.error("A timesheet already exists for this week and project. Please update the existing timesheet instead.");
      } else {
        ToastService.error(errorMessage);
      }
    }
  } catch (error) {
    console.error("Error saving timesheet:", error);
    
    // Handle network/unexpected errors - extract string message
    const errorMessage = extractErrorMessage(error);
    
    // Special handling for duplicate entry error
    if (errorMessage.toLowerCase().includes('duplicate')) {
      ToastService.error("A timesheet already exists for this week and project. Please update the existing timesheet instead.");
    } else {
      ToastService.error(errorMessage);
    }
  } finally {
    setLoading(false);
  }
};


  const handleEditTimesheet = () => {
    setIsEditMode(true);
    // Make timesheet editable
    setCurrentTimesheet(prev => ({
      ...prev,
      isEditable: true
    }));
    ToastService.info("Timesheet is now in edit mode. You can modify and save changes.");
  };

  // Add function to check if timesheet can be edited (rejected status)
  const canEditTimesheet = () => {
    return currentTimesheet &&
      currentTimesheet.status === 'REJECTED' &&
      role === 'EXTERNALEMPLOYEE';
  };


  const handleAddTimesheetClick = (employeeId) => {
    console.log('Adding timesheet for employee:', employeeId);

    // Set the temporary employee and trigger the add mode
    setTempEmployeeForAdd(employeeId);
    setIsAddingNewTimesheet(true);
    setSelectedEmployee(employeeId);

    // Clear any existing timesheet data
    setCurrentTimesheet(null);
    setSelectedProject('');
    setAttachments([]);
    setPendingAttachments([]);
    setHasUnsavedChanges(false);
    setEmployeeProjects([]); // Clear projects to force refresh

    // Set current week as default
    const currentWeek = getCurrentWeek();
    setSelectedWeekStart(currentWeek.startString);
    setCalendarValue(new Date(currentWeek.startString));
    setHighlightedWeek(getWeekDatesArray(new Date(currentWeek.startString)));

    console.log('Add timesheet mode activated for employee:', employeeId);
  };

  // 5. Replace the useEffect that handles project creation in create mode in Timesheets.js
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
        const targetEmployeeId = tempEmployeeForAdd || selectedEmployee;
        console.log('Creating timesheet for selected project and employee:', {
          selectedProject,
          targetEmployeeId,
          selectedWeekStart
        });
        createNewTimesheetForEmployee(targetEmployeeId);
      }
    }
  }, [selectedProject, isCreateMode, isAddingNewTimesheet, tempEmployeeForAdd, selectedEmployee, selectedWeekStart]);



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
      const errorMessage = extractErrorMessage(resultAction.payload);
      throw new Error(errorMessage || 'Failed to upload attachments');
    }
  } catch (error) {
    console.error('Error uploading files:', error);
    const errorMessage = extractErrorMessage(error);
    throw new Error(errorMessage);
  }
};


  const deleteTimesheet = async () => {
    if (!currentTimesheet) return;

    try {
      const resultAction = await dispatch(deleteTimesheetAttachments(currentTimesheet.id));
      if (deleteTimesheetAttachments.fulfilled.match(resultAction)) {
        ToastService.success('Timesheet deleted successfully');
        // Optionally, refresh the timesheet list or update the state
      } else {
        ToastService.error(resultAction.payload || 'Failed to delete timesheet');
      }
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      ToastService.error('Error deleting timesheet: ' + error.message);
    }
  }

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

    const startDate = selectedWeekStart;
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
              const uploadedAttachments = pendingAttachments.map(att => ({
                ...att,
                uploaded: true,
                file: undefined,
                url: uploadResponse.fileUrls?.find(url => url.includes(att.name))
              }));

              setAttachments(prev => [...prev.filter(a => a.uploaded), ...uploadedAttachments]);
              setPendingAttachments([]);
              ToastService.success(`Timesheet submitted successfully and ${pendingAttachments.length} attachment(s) uploaded`);
            } else {
              ToastService.warning('Timesheet submitted successfully but failed to upload some attachments');
            }
          } catch (uploadError) {
            console.error('Error uploading pending attachments:', uploadError);
            const uploadErrorMessage = extractErrorMessage(uploadError);
            ToastService.error(`Timesheet submitted successfully but failed to upload attachments: ${uploadErrorMessage}`);
          }
        } else {
          ToastService.success('Timesheet submitted successfully for approval');
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
        // Handle API error response properly - extract string message
        const errorMessage = extractErrorMessage(submitResponse);
        ToastService.error(errorMessage);
      }
    } else {
      // Handle Redux action rejection - extract string message
      const errorMessage = extractErrorMessage(resultAction.payload);
      ToastService.error(errorMessage);
    }

  } catch (error) {
    console.error('Error submitting weekly timesheet:', error);
    
    // Handle network/unexpected errors - extract string message
    const errorMessage = extractErrorMessage(error);
    ToastService.error(errorMessage);
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
    ToastService.warning('Please select at least one file to upload');
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
        ToastService.success(`${selectedFiles.length} file(s) uploaded successfully`);
      } else {
        const errorMessage = extractErrorMessage(uploadResponse);
        ToastService.error(errorMessage || 'Failed to upload files to server');
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
      ToastService.info(`${selectedFiles.length} file(s) added and will be uploaded when timesheet is saved`);
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
    const errorMessage = extractErrorMessage(error);
    ToastService.error(errorMessage);
  } finally {
    setUploading(false);
  }
};



  const fetchTimesheetAttachments = async (timesheetId) => {
    if (!timesheetId) return [];

    try {
      const resultAction = await dispatch(getTimesheetAttachmentsById(timesheetId));
      if (getTimesheetAttachmentsById.fulfilled.match(resultAction)) {
        return resultAction.payload.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching attachments:', error);
      return [];
    }
  };

  const handleRemoveAttachment = async (attachmentId) => {
    const attachmentToRemove = attachments.find(att => att.id === attachmentId);
    console.log('Removing attachment:', attachmentToRemove);

    try {
      // If the attachment is already uploaded to the server, delete it from there too
      if (attachmentToRemove && attachmentToRemove.uploaded && currentTimesheet?.id) {
        const resultAction = await dispatch(deleteTimesheetAttachments({
          attachmentId: attachmentToRemove.id,
          timesheetId: currentTimesheet.id // Add timesheetId parameter
        }));

        if (deleteTimesheetAttachments.fulfilled.match(resultAction)) {
          console.log('Attachment deleted successfully from server');
        } else {
          console.error('Failed to delete attachment from server:', resultAction.payload);
          // Don't proceed with local removal if server deletion failed
          return;
        }
      }

      // Remove from local state regardless of server status
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));

      // Remove from pending attachments if it exists there
      if (attachmentToRemove && !attachmentToRemove.uploaded) {
        setPendingAttachments(prev => prev.filter(att => att.id !== attachmentId));
      }

      setHasUnsavedChanges(true);
      console.log('Attachment removed locally');

    } catch (error) {
      console.error('Error removing attachment:', error);
    }
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    // setTimeout(() => {
    //   setAlert(prev => ({ ...prev, open: false }));
    // }, 5000);
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
    const resultAction = await dispatch(approveTimesheet({
      timesheetId: currentTimesheet.id,
      userId
    }));

    if (approveTimesheet.fulfilled.match(resultAction)) {
      const response = resultAction.payload;

      if (response.success) {
        ToastService.success('Timesheet approved successfully');
        fetchOrCreateTimesheet();
      } else {
        const errorMessage = extractErrorMessage(response);
        ToastService.error(errorMessage || 'Failed to approve timesheet');
      }
    } else {
      const errorMessage = extractErrorMessage(resultAction.payload);
      ToastService.error(errorMessage || 'Failed to approve timesheet');
    }
  } catch (error) {
    console.error('Error approving timesheet:', error);
    const errorMessage = extractErrorMessage(error);
    ToastService.error(errorMessage);
  } finally {
    setAdminActionLoading(false);
  }
};

 const handleRejectTimesheet = async () => {
  if (!currentTimesheet || !currentTimesheet.id || !rejectionReason.trim()) return;

  setAdminActionLoading(true);
  try {
    const resultAction = await dispatch(rejectTimesheet({
      timesheetId: currentTimesheet.id,
      userId,
      reason: rejectionReason.trim()
    }));

    if (rejectTimesheet.fulfilled.match(resultAction)) {
      const response = resultAction.payload;

      if (response.success) {
        ToastService.success('Timesheet rejected successfully');
        setRejectDialogOpen(false);
        setRejectionReason('');
        fetchOrCreateTimesheet();
      } else {
        const errorMessage = extractErrorMessage(response);
        ToastService.error(errorMessage || 'Failed to reject timesheet');
      }
    } else {
      const errorMessage = extractErrorMessage(resultAction.payload);
      ToastService.error(errorMessage || 'Failed to reject timesheet');
    }
  } catch (error) {
    console.error('Error rejecting timesheet:', error);
    const errorMessage = extractErrorMessage(error);
    ToastService.error(errorMessage);
  } finally {
    setAdminActionLoading(false);
  }
};


const handleCancelTimesheet = async () => {
  if (!currentTimesheet) return;

  setAdminActionLoading(true);
  try {
    const resultAction = await dispatch(cancelTimesheet({
      timesheetId: currentTimesheet.id,
      userId
    }));

    if (cancelTimesheet.fulfilled.match(resultAction)) {
      const response = resultAction.payload;

      if (response.success) {
        ToastService.success('Timesheet cancelled successfully');
        // Refresh the timesheet data
        fetchOrCreateTimesheet();
      } else {
        const errorMessage = extractErrorMessage(response);
        ToastService.error(errorMessage || 'Failed to cancel timesheet');
      }
    } else {
      const errorMessage = extractErrorMessage(resultAction.payload);
      ToastService.error(errorMessage || 'Failed to cancel timesheet');
    }
  } catch (error) {
    console.error('Error cancelling timesheet:', error);
    const errorMessage = extractErrorMessage(error.errorMessage);
    ToastService.error(errorMessage);
  } finally {
    setAdminActionLoading(false);
  }
};

  // Timesheets.js - Add this function
 const handleViewAttachments = async (timesheet) => {
  try {
    if (timesheet.id) {
      const attachments = await fetchTimesheetAttachments(timesheet.id);
      if (attachments.length > 0) {
        setSelectedTimesheetAttachments(attachments);
        setAttachmentsDialogOpen(true);
      } else {
        ToastService.info('No attachments found for this timesheet');
      }
    } else {
      ToastService.warning('No timesheet ID available to fetch attachments');
    }
  } catch (error) {
    console.error('Error viewing attachments:', error);
    const errorMessage = extractErrorMessage(error);
    ToastService.error(errorMessage);
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
      clients={clientsData}
      role={role}
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
      saveTimesheet={(isSubmission = false, isEdit = false) => saveTimesheet(isSubmission, isEdit)}
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

      isEditMode={isEditMode}
      setIsEditMode={setIsEditMode}
      handleEditTimesheet={handleEditTimesheet}
      canEditTimesheet={canEditTimesheet}
      isDateInCurrentMonth={isDateInCurrentMonth}
      getDateForDay={getDateForDay}
      //  isDateInSelectedWeekContext={isDateInSelectedWeekContext}
      isDateInSelectedWeekMonth={isDateInSelectedWeekMonth}
      isDateInCalendarMonth={isDateInCalendarMonth}


    />
  );
};

export default Timesheets