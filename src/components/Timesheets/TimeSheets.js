import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';

import {
  fetchClientsForProjects,
  fetchTimesheetsByUserId,
  fetchTimesheetsByUserIdWithDateRange,
  createTimesheet,
  updateTimesheet,
  submitWeeklyTimesheet as submitWeeklyTimesheetAction,
  submitMonthlyTimesheet as submitMonthlyTimesheetAction,
  uploadTimesheetAttachments,
  deleteTimesheetAttachments,
  approveTimesheet,
  approveTimesheetMonthly,
  rejectTimesheet,
  rejectTimesheetMonthly,
  clearError,
  resetTimesheets,
  getTimesheetAttachmentsById,
  viewTimesheetAttachment,
  downloadTimesheetAttachment
} from '../../redux/timesheetSlice';
import { fetchEmployees } from '../../redux/employeesSlice';

import {
  getMondayOfWeek,
  formatDateToYMD,
  getDateForDay,
  getWeekDates,
  getCurrentWeek,
  getWeekDatesArray,
  formatDate,
  formatFileSize,
  getPercentageColor,
  getWeeksInMonth,
  extractErrorMessage,
  isDateInSelectedWeekMonth,
  isDateInCalendarMonth,
  isDateInCurrentMonth,
  isDateInSelectedWeek,
  isPresentWeek,
  resetToDefaultHours,
  getWorkingDaysHours,
  getProjectConfig
} from './timesheetUtils';
import TimesheetMainView from './TimesheetMainView';
import httpService from '../../Services/httpService';
import { Avatar, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemAvatar, ListItemText, TextField, Typography } from '@mui/material';
import { Box } from 'lucide-react';
import {
  AttachFile, Close, CloudUpload,
  CloudDownload
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import ToastService from '../../Services/toastService';
import axios from 'axios';


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
  const [timesheetType, setTimesheetType] = useState('MONTHLY');

  const [monthlyViewMode, setMonthlyViewMode] = useState(false);
  const [monthlyTimesheetData, setMonthlyTimesheetData] = useState([]);
  const [currentMonthWeeks, setCurrentMonthWeeks] = useState([]);
  // Add this state variable
  const [selectedMonthRange, setSelectedMonthRange] = useState(null);
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [navigationSource, setNavigationSource] = useState('');

  const [viewLoading, setViewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);


  // Add these state variables to your component
  const [viewAttachmentDialogOpen, setViewAttachmentDialogOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(null);
  const [attachmentContent, setAttachmentContent] = useState(null);
  const [attachmentType, setAttachmentType] = useState('');
  const [monthlyTotalWorkingHours, setMonthlyTotalWorkingHours] = useState(0);
  const [monthlyTotalWorkingHoursForEmployee, setMonthlyTotalWorkingHoursForEmployee] = useState(0);

  const dispatch = useDispatch();

  const selectedDate = new Date(calendarValue);
  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const startDate = formatDateToYMD(monthStart);

  useEffect(() => {
    if (role === "EXTERNALEMPLOYEE") {
      dispatch(fetchClientsForProjects())
    }
  }, [dispatch])

  const clientsData = Array.isArray(clients) ? clients : [];

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


  // Timesheets.js - Replace the existing prepopulation useEffect with this
  useEffect(() => {
    const checkPrepopulatedEmployee = async () => {
      console.log('Checking for prepopulated employee data...');

      let employeeData = null;
      let navigationSource = '';
      const urlParams = new URLSearchParams(window.location.search);
      const shouldPrepopulate = urlParams.get('prepopulate') === 'true';

      if (shouldPrepopulate) {
        employeeData = {
          userId: urlParams.get('employeeId') || '',
          employeeName: decodeURIComponent(urlParams.get('employeeName') || ''),
          employeeType: urlParams.get('employeeType') || '',
          clientName: decodeURIComponent(urlParams.get('clientName') || ''),
          enableMonthlyView: urlParams.get('monthlyView') === 'true',
          monthStart: urlParams.get('monthStart') || '',
          monthEnd: urlParams.get('monthEnd') || '',
          selectedMonth: parseInt(urlParams.get('selectedMonth')) || null,
          selectedYear: parseInt(urlParams.get('selectedYear')) || null,
          forceRefresh: urlParams.get('forceRefresh') === 'true'
        };
        navigationSource = 'url';
      }
      if (!employeeData && location.state?.prepopulatedEmployee) {
        employeeData = location.state.prepopulatedEmployee;
        navigationSource = 'state';
      }
      if (!employeeData) {
        try {
          const storedEmployee = localStorage.getItem('prepopulatedEmployee');
          if (storedEmployee) {
            employeeData = JSON.parse(storedEmployee);
            navigationSource = 'localStorage';
            localStorage.removeItem('prepopulatedEmployee'); // Clean up
          }
        } catch (error) {
          console.warn('Error reading prepopulated employee from localStorage:', error);
        }
      }
      if (employeeData && employeeData.userId && employeeData.employeeName) {
        console.log('Found prepopulated employee data with dates:', employeeData, 'from:', navigationSource);

        setNavigationSource(navigationSource);
        setPrepopulatedEmployee(employeeData);

        // FIXED: Set selected month range IMMEDIATELY if available
        if (employeeData.monthStart && employeeData.monthEnd) {
          const monthRange = {
            start: employeeData.monthStart,
            end: employeeData.monthEnd
          };
          setSelectedMonthRange(monthRange);
          console.log('Set selected month range from prepopulated data:', monthRange);

          // FIXED: Set calendar to the correct month from prepopulated data
          if (employeeData.selectedMonth !== null && employeeData.selectedYear !== null) {
            const targetDate = new Date(employeeData.selectedYear, employeeData.selectedMonth, 1);
            setCalendarValue(targetDate);
            console.log('Set calendar to prepopulated month:', targetDate);
          }
        }
        if (role === 'ACCOUNTS' || role === 'INVOICE') {
          console.log('Setting monthly view for ACCOUNTS/INVOICE role');
          setMonthlyViewMode(true);
        }
      } else {
        console.log('No valid prepopulated employee data found');
        setIsInitialLoad(false);
      }
    };
    // Run only on initial load or when location.state changes
    if (isInitialLoad || location.state?.prepopulatedEmployee) {
      checkPrepopulatedEmployee();
    }
  }, [location.state, isInitialLoad, role]);


  useEffect(() => {
    if (prepopulatedEmployee && (role === 'ACCOUNTS' || role === 'INVOICE')) {
      console.log('Prepopulating employee for monthly view:', prepopulatedEmployee);

      // Set monthly view mode based on the prepopulated data
      const shouldEnableMonthlyView = prepopulatedEmployee.enableMonthlyView ||
        location.state?.monthlyView ||
        new URLSearchParams(window.location.search).get('monthlyView') === 'true';

      if (shouldEnableMonthlyView) {
        setMonthlyViewMode(true);
        console.log('Monthly view mode enabled for ACCOUNTS/INVOICE role');
      }

      // Set the employee and trigger project fetch with callback
      handleEmployeeChange(prepopulatedEmployee.userId, (projectsData) => {
        // Auto-select the first project if available
        if (projectsData.length > 0) {
          const firstProject = projectsData[0];
          const projectName = firstProject.projectName || firstProject;
          console.log('Auto-selecting project:', projectName);
          setSelectedProject(projectName);

          // Fetch monthly data after project is selected
          setTimeout(() => {
            if (shouldEnableMonthlyView) {
              fetchMonthlyTimesheetData(prepopulatedEmployee.userId);
            }
          }, 100);
        }
      });
      setPrepopulatedEmployee(null);
    }
  }, [prepopulatedEmployee, role, location.state]);

  useEffect(() => {
    return () => {
      // Clean up location state to prevent re-prepopulation on back navigation
      if (window.history.state && window.history.state.usr) {
        window.history.replaceState({ ...window.history.state, usr: {} }, '');
      }
    };
  }, []);


  useEffect(() => {
    if ((role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE") && selectedEmployee) {
      setSelectedProject('');
      setCurrentTimesheet(null);
      // Force re-render by ensuring employeeProjects is cleared first
      setEmployeeProjects([]);
    }
  }, [selectedEmployee, role]);


  useEffect(() => {
    // Check URL parameters for monthly view flag
    const urlParams = new URLSearchParams(window.location.search);
    const monthlyViewParam = urlParams.get('monthlyView');

    if ((role === 'ACCOUNTS' || role === 'INVOICE') && monthlyViewParam === 'true') {
      setMonthlyViewMode(true);
      console.log('Monthly view enabled from URL parameter');

      // If we have an employee selected, fetch monthly data
      if (selectedEmployee) {
        fetchMonthlyTimesheetData(selectedEmployee);
      }
    }
  }, [role, selectedEmployee, window.location.search]);


  const handleEmployeeChange = async (employeeId, callback) => {
    console.log('Employee changed to:', employeeId);
    if (navigationSource !== 'url' && navigationSource !== 'state') {
      // Reset states only for manual selection, but preserve selectedMonthRange
      setSelectedProject('');
      setCurrentTimesheet(null);
      setAttachments([]);
      setPendingAttachments([]);
      setHasUnsavedChanges(false);
      setMonthlyTimesheetData([]);
      setCurrentMonthWeeks([]);
      // Don't reset selectedMonthRange here
    }

    if (isCreateMode || isAddingNewTimesheet) {
      setTempEmployeeForAdd(employeeId);
      setSelectedEmployee(employeeId);
      setMonthlyViewMode(false);
    } else {
      setSelectedEmployee(employeeId);

      // Set monthly view for ACCOUNTS/INVOICE
      if (role === 'ACCOUNTS' || role === 'INVOICE') {
        setMonthlyViewMode(true);
        console.log('Setting monthly view for ACCOUNTS/INVOICE role');
      } else {
        setMonthlyViewMode(false);
      }
    }

    if (employeeId && (role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE")) {
      setLoadingEmployeeProjects(true);
      try {
        const response = await httpService.get(`/timesheet/vendors/${employeeId}`);

        let projectsData = [];
        if (response.data && response.data.success) {
          if (Array.isArray(response.data.data)) {
            projectsData = response.data.data.map((project, index) => {
              if (typeof project === 'string') {
                return { projectId: index, projectName: project };
              }
              return project;
            });
          }
        }

        setEmployeeProjects(projectsData);

        if (callback && typeof callback === 'function') {
          callback(projectsData);
        } else if (monthlyViewMode && (role === 'ACCOUNTS' || role === 'INVOICE') && !isCreateMode && !isAddingNewTimesheet) {
          // FIXED: Only auto-fetch if we don't have selectedMonthRange from prepopulation
          if (!selectedMonthRange) {
            setTimeout(() => {
              if (employeeId && calendarValue) {
                fetchMonthlyTimesheetData(employeeId);
              }
            }, 100);
          } else {
            console.log('Skipping auto-fetch due to existing selectedMonthRange');
          }
        }
      } catch (error) {
        console.error('Error fetching employee projects:', error);
        setEmployeeProjects([]);
        const errorMessage = extractErrorMessage(error);
        ToastService.error(errorMessage || 'Failed to fetch employee projects');
      } finally {
        setLoadingEmployeeProjects(false);
      }
    }
  };

  useEffect(() => {
    if (prepopulatedEmployee && (role === 'ACCOUNTS' || role === 'INVOICE')) {
      console.log('Prepopulating employee for monthly view:', prepopulatedEmployee);


      handleEmployeeChange(prepopulatedEmployee.userId, handleProjectPrepopulation);

      setMonthlyViewMode(true);

      const currentDate = new Date();
      setCalendarValue(currentDate);

      setPrepopulatedEmployee(null);

      // Clean up URL parameters
      if (window.location.search.includes('prepopulate')) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [prepopulatedEmployee, role]);

  useEffect(() => {
    const handlePrepopulation = async () => {
      if (!prepopulatedEmployee || !(role === 'ACCOUNTS' || role === 'INVOICE')) {
        setIsInitialLoad(false);
        return;
      }

      console.log('Handling prepopulated employee with dates:', prepopulatedEmployee);

      try {

        setSelectedEmployee(prepopulatedEmployee.userId);

        if (prepopulatedEmployee.monthStart && prepopulatedEmployee.monthEnd) {
          const monthRange = {
            start: prepopulatedEmployee.monthStart,
            end: prepopulatedEmployee.monthEnd
          };
          setSelectedMonthRange(monthRange);
          console.log('Set selected month range from prepopulated data:', monthRange);
        }

        if (prepopulatedEmployee.selectedMonth !== undefined && prepopulatedEmployee.selectedYear !== undefined) {
          const targetDate = new Date(prepopulatedEmployee.selectedYear, prepopulatedEmployee.selectedMonth, 1);
          setCalendarValue(targetDate);
          console.log('Set calendar to prepopulated month:', targetDate);
        }

        if (!selectedMonthRange && prepopulatedEmployee.selectedMonth !== undefined && prepopulatedEmployee.selectedYear !== undefined) {
          const selectedDate = new Date(prepopulatedEmployee.selectedYear, prepopulatedEmployee.selectedMonth, 1);
          setCalendarValue(selectedDate);
          console.log('Setting calendar to selected month:', selectedDate);
        }

        setLoadingEmployeeProjects(true);

        const response = await httpService.get(`/timesheet/vendors/${prepopulatedEmployee.userId}`);
        console.log('Employee projects response:', response);

        let projectsData = [];
        if (response.data && response.data.success) {
          if (Array.isArray(response.data.data)) {
            projectsData = response.data.data.map((project, index) => {
              if (typeof project === 'string') {
                return { projectId: index, projectName: project };
              }
              return project;
            });
          }
        }

        console.log('Setting employee projects:', projectsData);
        setEmployeeProjects(projectsData);

        // Auto-select first project if available
        if (projectsData.length > 0) {
          const firstProject = projectsData[0];
          const projectName = firstProject.projectName || firstProject;
          console.log('Auto-selecting project:', projectName);
          setSelectedProject(projectName);

          // FIXED: Use selectedMonthRange for API call with delay to ensure state is set
          setTimeout(async () => {
            console.log('Fetching monthly data for prepopulated employee with selectedMonthRange:', selectedMonthRange);
            await fetchMonthlyTimesheetData(prepopulatedEmployee.userId);
          }, 100);
        }

        // Clean up prepopulated data
        setPrepopulatedEmployee(null);
        setNavigationSource('');

        // Clean up URL parameters
        if (window.location.search.includes('prepopulate')) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }

      } catch (error) {
        console.error('Error handling prepopulated employee:', error);
        const errorMessage = extractErrorMessage(error);
        ToastService.error(errorMessage || 'Failed to load employee data');
      } finally {
        setLoadingEmployeeProjects(false);
        setIsInitialLoad(false);
      }
    };

    handlePrepopulation();
  }, [prepopulatedEmployee, role, selectedMonthRange]);

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
            pointerEvents: 'none',
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
          // Add validation for weekStartDate
          if (!ts.weekStartDate || ts.weekStartDate === null || ts.weekStartDate === undefined) {
            console.warn('Invalid weekStartDate found in timesheet:', ts);
            return false;
          }

          try {
            const tsWeekStart = new Date(ts.weekStartDate).toISOString().split('T')[0];
            return tsWeekStart === selectedWeekStart;
          } catch (error) {
            console.error('Error processing weekStartDate:', ts.weekStartDate, error);
            return false;
          }
        });

        if (currentWeekTimesheet && currentWeekTimesheet.timesheetId) {
          try {
            const attachments = await fetchTimesheetAttachments(currentWeekTimesheet.timesheetId);
            setAttachments(attachments);
          } catch (error) {
            console.error('Error fetching timesheet attachments:', error);
            setAttachments([]);
          }
        }
      }
    };

    fetchEmployeeAttachments();
  }, [selectedEmployee, timesheetData, selectedWeekStart, role]);


  useEffect(() => {
    if (monthlyViewMode && selectedEmployee && (role === 'ACCOUNTS' || role === 'INVOICE')) {
      // Only fetch if we don't have selectedMonthRange (manual calendar change)
      if (!selectedMonthRange) {
        console.log('Calendar month changed in monthly view (no selectedMonthRange), refreshing data');
        fetchMonthlyTimesheetData(selectedEmployee);
      } else {
        console.log('Calendar month changed but selectedMonthRange exists, skipping auto-refresh');
      }
    } else if (selectedProject && selectedWeekStart && currentTimesheet) {
      console.log('Calendar month changed, refreshing weekly data');
      fetchOrCreateTimesheet();
    }
  }, [calendarValue.getMonth(), calendarValue.getFullYear()]);

  const fetchOrCreateTimesheet = async () => {
    if (!selectedProject || !selectedWeekStart) return;

    // Handle create mode - we need to fetch existing timesheets to check for duplicates
    if (isCreateMode || isAddingNewTimesheet) {
      const employeeId = tempEmployeeForAdd || selectedEmployee;
      if (employeeId && selectedProject) {
        console.log("Create/add mode - checking for existing timesheets for employee:", employeeId);

        setLoading(true);
        try {
          // First fetch existing timesheets to check for duplicates
          let resultAction;

          // MODIFICATION: Use fetchTimesheetsByUserIdWithDateRange for EXTERNALEMPLOYEE role in create/add mode
          if (role === 'EXTERNALEMPLOYEE' || isCreateMode || isAddingNewTimesheet) {
            // Calculate month start and end based on current calendar month
            const selectedDate = new Date(calendarValue);
            const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

            const monthStartStr = formatDateToYMD(monthStart);
            const monthEndStr = formatDateToYMD(monthEnd);

            console.log('Fetching timesheets for EXTERNALEMPLOYEE in create/add mode with date range:', {
              employeeId,
              monthStart: monthStartStr,
              monthEnd: monthEndStr
            });

            resultAction = await dispatch(fetchTimesheetsByUserIdWithDateRange({
              userId: employeeId,
              monthStart: monthStartStr,
              monthEnd: monthEndStr
            }));
          } else {
            // For other roles, use the regular API without date range
            console.log('Fetching timesheets for other roles in create/add mode without date range:', {
              employeeId
            });

            resultAction = await dispatch(fetchTimesheetsByUserId(employeeId));
          }

          if (fetchTimesheetsByUserId.fulfilled.match(resultAction) || fetchTimesheetsByUserIdWithDateRange.fulfilled.match(resultAction)) {
            const response = resultAction.payload;

            // Extract timesheets from the nested structure based on which API was used
            const timesheetData = role === 'EXTERNALEMPLOYEE' || isCreateMode || isAddingNewTimesheet ?
              (response?.data?.timesheets || []) :
              (response?.data || []);

            console.log('Existing timesheets found:', timesheetData);

            // Check if timesheet already exists for this week and project
            const timesheetsArray = Array.isArray(timesheetData) ? timesheetData : [];
            const existingTimesheet = timesheetsArray.find(ts => {
              const tsWeekStart = new Date(ts.weekStartDate).toISOString().split("T")[0];
              const hasProjectEntries = ts.workingEntries?.some(entry => entry.project === selectedProject);
              return tsWeekStart === selectedWeekStart && hasProjectEntries;
            });


            const totalWorkingHours = response?.data?.totalWorkingHours || 0;
            setMonthlyTotalWorkingHoursForEmployee(totalWorkingHours);

            if (existingTimesheet) {
              console.log("Timesheet already exists for this week and project:", existingTimesheet);
              // Transform and use existing timesheet
              const transformed = transformTimesheet(existingTimesheet, calendarValue);
              const safeTransformed = { ...getEmptyTimesheet(selectedProject), ...transformed };
              setCurrentTimesheet(safeTransformed);
              setNotes(safeTransformed.notes || '');
              setIsSubmitted(safeTransformed.status === 'SUBMITTED' || safeTransformed.status === 'APPROVED' || safeTransformed.status === 'PENDING_APPROVAL');
              setHasUnsavedChanges(false);

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

              ToastService.info('Existing timesheet found for this week and project');
            } else {
              console.log("No existing timesheet found, creating new empty timesheet");
              // Create empty timesheet
              const emptyTimesheet = getEmptyTimesheet(selectedProject);
              setCurrentTimesheet(emptyTimesheet);
              setNotes('');
              setHasUnsavedChanges(false);
              setIsSubmitted(false);
              setAttachments([]);
            }
          } else {
            const errorMessage = extractErrorMessage(resultAction.payload);
            throw new Error(errorMessage);
            setMonthlyTotalWorkingHoursForEmployee(0)
          }
        } catch (error) {
          console.error("Error checking existing timesheets in create mode:", error);
          const errorMessage = extractErrorMessage(error);
          ToastService.error(errorMessage);
          setMonthlyTotalWorkingHoursForEmployee(0)
          // Fallback: create empty timesheet
          const emptyTimesheet = getEmptyTimesheet(selectedProject);
          setCurrentTimesheet(emptyTimesheet);
          setNotes('');
          setHasUnsavedChanges(false);
          setIsSubmitted(false);
          setAttachments([]);
        } finally {
          setLoading(false);
        }
        return;
      } else {
        console.log('Cannot create timesheet - missing employeeId or project:', {
          employeeId,
          selectedProject
        });
        return;
      }
    }

    // Rest of the function remains unchanged...
    if ((role === 'ACCOUNTS' || role === 'INVOICE') && !isCreateMode && !isAddingNewTimesheet) {
      console.log('Using monthly view for ACCOUNTS/INVOICE role');
      await fetchMonthlyTimesheetData(selectedEmployee || userId);
      return;
    }

    const isMonthlyView = (role === 'ACCOUNTS' || role === 'INVOICE') && !isCreateMode && !isAddingNewTimesheet;

    if (isMonthlyView) {
      // Fetch monthly data for ACCOUNTS/INVOICE roles
      setLoading(true);
      try {
        const targetUserId = selectedEmployee || userId;

        // Calculate month start and end based on selected month/year
        const selectedDate = new Date(calendarValue);
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

        const monthStartStr = formatDateToYMD(monthStart);
        const monthEndStr = formatDateToYMD(monthEnd);

        console.log('Fetching monthly data for ACCOUNTS/INVOICE view:', {
          targetUserId,
          monthStart: monthStartStr,
          monthEnd: monthEndStr
        });

        // Use the date range API for monthly view
        const resultAction = await dispatch(fetchTimesheetsByUserIdWithDateRange({
          userId: targetUserId,
          monthStart: monthStartStr,
          monthEnd: monthEndStr
        }));

        if (fetchTimesheetsByUserIdWithDateRange.fulfilled.match(resultAction)) {
          const response = resultAction.payload;

          // Extract timesheets from the nested structure
          const timesheetData = response?.data?.timesheets || [];
          console.log('Monthly timesheet data received:', timesheetData);

          setTimeSheetData(timesheetData);

          // Generate weeks for current month
          const weeks = getWeeksInMonth(calendarValue);
          setCurrentMonthWeeks(weeks);

          // Process monthly timesheet data
          const monthlyData = weeks.map(week => {
            const weekTimesheet = timesheetData.find(ts => {
              const tsWeekStart = new Date(ts.weekStartDate).toISOString().split("T")[0];
              return tsWeekStart === week.startString &&
                ts.workingEntries?.some(entry => entry.project === selectedProject);
            });

            return {
              ...week,
              timesheet: weekTimesheet ? transformTimesheet(weekTimesheet, calendarValue) : null,
              hasData: !!weekTimesheet,
              status: weekTimesheet?.status || 'NO_DATA'
            };
          });

          setMonthlyTimesheetData(monthlyData);
          setMonthlyViewMode(true);
        } else {
          const errorMessage = extractErrorMessage(resultAction.payload);
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("Error fetching monthly timesheet:", error);
        const errorMessage = extractErrorMessage(error);
        ToastService.error(errorMessage);
        setMonthlyTimesheetData([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Rest of the function remains unchanged...
    setLoading(true);
    try {
      const targetUserId = selectedEmployee || userId;

      let resultAction;
      if (role === 'EXTERNALEMPLOYEE') {
        // Calculate month start and end based on current calendar month
        const selectedDate = new Date(calendarValue);
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

        const monthStartStr = formatDateToYMD(monthStart);
        const monthEndStr = formatDateToYMD(monthEnd);

        console.log('Fetching timesheets for EXTERNALEMPLOYEE with date range:', {
          targetUserId,
          monthStart: monthStartStr,
          monthEnd: monthEndStr
        });

        resultAction = await dispatch(fetchTimesheetsByUserIdWithDateRange({
          userId: targetUserId,
          monthStart: monthStartStr,
          monthEnd: monthEndStr
        }));
      } else {
        // For other roles, use the regular API without date range
        console.log('Fetching timesheets for other roles without date range:', {
          targetUserId
        });

        resultAction = await dispatch(fetchTimesheetsByUserId(targetUserId));
      }

      if (fetchTimesheetsByUserId.fulfilled.match(resultAction) || fetchTimesheetsByUserIdWithDateRange.fulfilled.match(resultAction)) {
        const response = resultAction.payload;

        // Extract timesheets from the nested structure
        const timesheetData = role === 'EXTERNALEMPLOYEE' ?
          (response?.data?.timesheets || []) :
          (response?.data || []);

        console.log('Weekly timesheet data received:', timesheetData);
        const totalWorkingHours = response?.data?.totalWorkingHours || 0;
        setMonthlyTotalWorkingHoursForEmployee(totalWorkingHours);

        setTimeSheetData(timesheetData);

        let existingTimesheet = null;

        if (response?.success && timesheetData) {
          // Ensure timesheetData is always treated as an array
          const timesheetsArray = Array.isArray(timesheetData) ? timesheetData : [];

          existingTimesheet = timesheetsArray.find(ts => {
            const tsWeekStart = new Date(ts.weekStartDate).toISOString().split("T")[0];
            const hasProjectEntries = ts.workingEntries?.some(entry => entry.project === selectedProject);
            return tsWeekStart === selectedWeekStart && hasProjectEntries;
          });
        }

        if (existingTimesheet) {
          console.log("Existing timesheet found:", existingTimesheet);
          // PASS CURRENT CALENDAR MONTH TO TRANSFORM FUNCTION
          const transformed = transformTimesheet(existingTimesheet, calendarValue);
          const safeTransformed = { ...getEmptyTimesheet(selectedProject), ...transformed };
          setCurrentTimesheet(safeTransformed);
          setNotes(safeTransformed.notes || '');
          setIsSubmitted(safeTransformed.status === 'SUBMITTED' || safeTransformed.status === 'APPROVED' || safeTransformed.status === 'PENDING_APPROVAL');

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

          setHasUnsavedChanges(false);
        } else {
          console.log("No existing timesheet found, creating new one");
          const emptyTimesheet = getEmptyTimesheet(selectedProject);
          setCurrentTimesheet(emptyTimesheet);
          setNotes('');
          setHasUnsavedChanges(false);
          setIsSubmitted(false);
          setAttachments([]);

          await createNewTimesheetForEmployee(targetUserId);
        }
      } else {
        const errorMessage = extractErrorMessage(resultAction.payload);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error fetching timesheet:", error);
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);

      // Fallback: create empty timesheet on error
      const emptyTimesheet = getEmptyTimesheet(selectedProject);
      setCurrentTimesheet(emptyTimesheet);
      setNotes('');
      setHasUnsavedChanges(false);
      setIsSubmitted(false);
      setAttachments([]);

      await createNewTimesheetForEmployee(selectedEmployee || userId);
    } finally {
      setLoading(false);
    }
  };


  const transformTimesheet = (apiTimesheet, currentCalendarMonth) => {
    if (!apiTimesheet) {
      console.log('No timesheet found, returning null');
      return null;
    }

    console.log('Transforming timesheet with calendar month:', currentCalendarMonth);

    const submitted = (apiTimesheet.status === 'SUBMITTED' ||
      apiTimesheet.status === 'APPROVED' ||
      apiTimesheet.status === 'PENDING_APPROVAL') && !isEditMode;
    setIsSubmitted(submitted);

    const transformed = {
      id: apiTimesheet.timesheetId || null,
      userId: apiTimesheet.userId || userId,
      project: selectedProject,
      timesheetType: apiTimesheet.timesheetType || 'WEEKLY',
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

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    // Process working entries - FILTER BY CURRENT CALENDAR MONTH
    if (apiTimesheet.workingEntries && apiTimesheet.workingEntries.length > 0) {
      apiTimesheet.workingEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const dayOfWeek = entryDate.getDay();

        let dayIndex;
        if (dayOfWeek === 0) {
          dayIndex = 6;
        } else {
          dayIndex = dayOfWeek - 1;
        }

        const dayName = days[dayIndex];
        const hours = parseFloat(entry.hours) || 0;




        // FILTER: Only process entries that are in the current calendar month
        const isInCalendarMonth = isDateInCalendarMonth(entryDate, currentCalendarMonth);
        const isInSelectedWeek = isDateInSelectedWeek(entryDate, selectedWeekStart);

        if (dayName && isInCalendarMonth && isInSelectedWeek && entry.project === selectedProject) {
          console.log(`Adding ${hours} working hours to ${dayName} for date ${entry.date}`);
          transformed[dayName] += hours;
        }
      });
    }

    // Process non-working entries - FILTER BY CURRENT CALENDAR MONTH
    if (apiTimesheet.nonWorkingEntries) {
      apiTimesheet.nonWorkingEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const dayOfWeek = entryDate.getDay();

        let dayIndex;
        if (dayOfWeek === 0) {
          dayIndex = 6;
        } else {
          dayIndex = dayOfWeek - 1;
        }

        const dayName = days[dayIndex];
        const hours = parseFloat(entry.hours) || 0;
        const description = entry.description?.toLowerCase() || '';

        // FILTER: Only process entries that are in the current calendar month
        const isInCalendarMonth = apiTimesheet.status === 'REJECTED' ?
          true : // Always true for rejected timesheets
          isDateInCalendarMonth(entryDate, currentCalendarMonth);

        const isInSelectedWeek = isDateInSelectedWeek(entryDate, selectedWeekStart);

        if (dayName && isInCalendarMonth && isInSelectedWeek) {
          if (description.includes('sick leave')) {
            transformed.sickLeave[dayName] += hours;
          } else if (description.includes('company holiday') || description.includes('holiday')) {
            transformed.companyHoliday[dayName] += hours;
          }
        }
      });
    }

    // Set default values for days - BYPASS CALENDAR MONTH CHECK FOR REJECTED TIMESHEETS
    if (apiTimesheet.status !== 'REJECTED') {
      days.forEach(day => {
        const dayDate = getDateForDay(selectedWeekStart, day);
        const isInCalendarMonth = dayDate ? isDateInCalendarMonth(dayDate, currentCalendarMonth) : false;

        if (isInCalendarMonth && transformed[day] === 0 &&
          transformed.sickLeave[day] === 0 &&
          transformed.companyHoliday[day] === 0) {
          // Set default 8 hours for weekdays in current month
          if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day)) {
            transformed[day] = 8;
          }
        }
      });
    }

    transformed.percentageOfTarget = calculatePercentage(transformed);
    setNotes(transformed.notes);
    return transformed;
  };



  useEffect(() => {
    if ((role === 'ACCOUNTS' || role === 'INVOICE') && selectedEmployee && !isCreateMode && !isAddingNewTimesheet) {
      console.log('Auto-enabling monthly view for ACCOUNTS/INVOICE role');
      setMonthlyViewMode(true);

      // Fetch monthly data if we have the required data
      if (selectedEmployee && calendarValue && !loading) {
        fetchMonthlyTimesheetData(selectedEmployee);
      }
    } else if (role !== 'ACCOUNTS' && role !== 'INVOICE') {
      setMonthlyViewMode(false);
    }
  }, [role, selectedEmployee, isCreateMode, isAddingNewTimesheet]);

  // Enhanced fetchMonthlyTimesheetData function
  const fetchMonthlyTimesheetData = async (employeeId) => {
    if (!employeeId) {
      console.log('Cannot fetch monthly data - missing employeeId');
      return;
    }

    if (loading) {
      console.log('Already loading, skipping duplicate call');
      return;
    }

    setLoading(true);
    try {
      let monthStartStr, monthEndStr;

      if (selectedMonthRange && (navigationSource === 'url' || navigationSource === 'state')) {
        monthStartStr = selectedMonthRange.start;
        monthEndStr = selectedMonthRange.end;
        console.log('Using prepopulated month range from admin:', selectedMonthRange);
      } else {
        const selectedDate = new Date(calendarValue);
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

        monthStartStr = formatDateToYMD(monthStart);
        monthEndStr = formatDateToYMD(monthEnd);
        console.log('Using calendar value for month range:', { monthStartStr, monthEndStr });
      }

      const resultAction = await dispatch(fetchTimesheetsByUserIdWithDateRange({
        userId: employeeId,
        monthStart: monthStartStr,
        monthEnd: monthEndStr
      }));

      if (fetchTimesheetsByUserIdWithDateRange.fulfilled.match(resultAction)) {
        const response = resultAction.payload;
        const timesheetData = response?.data?.timesheets || [];

        // EXTRACT TOTAL WORKING HOURS FROM API RESPONSE
        const totalWorkingHours = response?.data?.totalWorkingHours || 0;
        setMonthlyTotalWorkingHours(totalWorkingHours);

        console.log('Monthly timesheet data received:', {
          timesheetData,
          totalWorkingHours,
          fullResponse: response
        });

        setTimeSheetData(timesheetData);

        const targetDate = (selectedMonthRange && (navigationSource === 'url' || navigationSource === 'state'))
          ? new Date(selectedMonthRange.start)
          : new Date(calendarValue);

        const weeks = getWeeksInMonth(targetDate);
        setCurrentMonthWeeks(weeks);

        const monthlyData = weeks.map(week => {
          const weekTimesheet = timesheetData.find(ts => {
            const tsWeekStart = new Date(ts.weekStartDate).toISOString().split("T")[0];
            const hasProject = !selectedProject || ts.workingEntries?.some(entry => entry.project === selectedProject);
            return tsWeekStart === week.startString && hasProject;
          });

          return {
            ...week,
            timesheet: weekTimesheet ? transformTimesheetForMonthlyView(weekTimesheet, targetDate) : null,
            hasData: !!weekTimesheet,
            status: weekTimesheet?.status || 'NO_DATA'
          };
        });

        console.log('Processed monthly data:', monthlyData);
        setMonthlyTimesheetData(monthlyData);

      } else {
        console.error('API call failed:', resultAction.payload);
        const errorMessage = extractErrorMessage(resultAction.payload);
        ToastService.error(errorMessage);
        setMonthlyTimesheetData([]);
        setMonthlyTotalWorkingHours(0);
      }
    } catch (error) {
      console.error("Error fetching monthly timesheet:", error);
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
      setMonthlyTimesheetData([]);
      setMonthlyTotalWorkingHours(0);
    } finally {
      setLoading(false);
    }
  };
  console.log("monthly data..", monthlyTimesheetData)
  const transformTimesheetForMonthlyView = (apiTimesheet, currentCalendarMonth) => {
    if (!apiTimesheet) return null;

    const transformed = {
      id: apiTimesheet.timesheetId || null,
      userId: apiTimesheet.userId || userId,
      project: selectedProject || (apiTimesheet.workingEntries?.[0]?.project) || '',
      timesheetType: apiTimesheet.timesheetType || 'MONTHLY',
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
      isEditable: false, // Monthly view is read-only for ACCOUNTS/INVOICE
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

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    // Process working entries
    if (apiTimesheet.workingEntries) {
      apiTimesheet.workingEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const dayOfWeek = entryDate.getDay();

        let dayIndex;
        if (dayOfWeek === 0) {
          dayIndex = 6;
        } else {
          dayIndex = dayOfWeek - 1;
        }

        const dayName = days[dayIndex];
        const hours = parseFloat(entry.hours) || 0;

        if (dayName && entry.project === (selectedProject || transformed.project)) {
          transformed[dayName] += hours;
        }
      });
    }

    // Process non-working entries
    if (apiTimesheet.nonWorkingEntries) {
      apiTimesheet.nonWorkingEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const dayOfWeek = entryDate.getDay();

        let dayIndex;
        if (dayOfWeek === 0) {
          dayIndex = 6;
        } else {
          dayIndex = dayOfWeek - 1;
        }

        const dayName = days[dayIndex];
        const hours = parseFloat(entry.hours) || 0;
        const description = entry.description?.toLowerCase() || '';

        if (dayName) {
          if (description.includes('sick leave')) {
            transformed.sickLeave[dayName] += hours;
          } else if (description.includes('company holiday') || description.includes('holiday')) {
            transformed.companyHoliday[dayName] += hours;
          }
        }
      });
    }

    return transformed;
  };

  // Add this function to check if it's Friday in the present week
  const isFridayInPresentWeek = () => {
    if (!selectedWeekStart || !isPresentWeek(selectedWeekStart)) return false;

    const today = new Date();
    return today.getDay() === 5; // 5 = Friday (0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday)
  };


  const isFieldEditable = (timesheet, day, leaveType = null, calendarDate, isEditMode = false) => {
    if (!timesheet) {
      console.warn('isFieldEditable called with null/undefined timesheet');
      return false;
    }

    // FIRST: Always block Saturday and Sunday
    if (day === 'saturday' || day === 'sunday') {
      return false;
    }

    // SECOND: Check if day is in current calendar month (apply to ALL timesheets)
    const dayDate = getDateForDay(selectedWeekStart, day);
    const isInCalendarMonth = dayDate ? isDateInCalendarMonth(dayDate, calendarDate) : false;

    if (!isInCalendarMonth && !isEditMode) {
      return false;
    }

    // THIRD: Special case for rejected timesheets - only allow editing in edit mode
    const isRejectedTimesheet = timesheet.status === 'REJECTED';
    const isExternalEmployeeOrCreateMode = role === 'EXTERNALEMPLOYEE' || isCreateMode;

    // For rejected timesheets, only allow editing if we're in edit mode
    if (isRejectedTimesheet) {
      if (!isEditMode) {
        return false; // This fixes the main issue - fields stay disabled when not in edit mode
      }

      if (isExternalEmployeeOrCreateMode) {
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
        } else if (leaveType === 'companyHoliday') {
          if (timesheet.sickLeave && timesheet.sickLeave[day] > 0) {
            return false;
          }
        }

        return true;
      }
    }

    // FOURTH: For non-rejected timesheets, apply normal validation
    if ((role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE") && !isSubmitted) {
      return true;
    }

    // For EXTERNALEMPLOYEE, check if timesheet is editable and not submitted
    if (role === 'EXTERNALEMPLOYEE' && (isSubmitted || (timesheet && !timesheet.isEditable))) {
      return false;
    }

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
    } else if (leaveType === 'companyHoliday') {
      if (timesheet.sickLeave && timesheet.sickLeave[day] > 0) {
        return false;
      }
    }

    return true;
  };

  const handleHourChange = (day, value, type = 'regular') => {
    // FIRST CHECK: Always block Saturday and Sunday regardless of any other conditions
    if (day === 'saturday' || day === 'sunday') {
      ToastService.error('Weekend hours cannot be entered');
      return;
    }

    if (!currentTimesheet) return;

    // Skip calendar month validation if in edit mode
    if (!isEditMode) {
      const dayDate = getDateForDay(selectedWeekStart, day);
      const isInCalendarMonth = dayDate ? isDateInCalendarMonth(dayDate, calendarValue) : false;

      if (!isInCalendarMonth) {
        const dateStr = dayDate ? dayDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : day;
        ToastService.error(`Cannot enter hours on ${dateStr} - date is not in the current calendar month`);
        return;
      }
    }

    const numValue = parseFloat(value) || 0;

    // Validate hour limits (maximum 8 hours for any type)
    if (numValue < 0 || numValue > 8) {
      if (numValue > 8) {
        ToastService.error(`Maximum 8 hours allowed per day`);
      }
      return;
    }

    console.log('Hour change:', { day, value, numValue, type });

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
          updated[day] = 0; // Clear work hours
          if (updated.companyHoliday) updated.companyHoliday[day] = 0;
        } else {
          // If setting sick leave to 0, set default work hours ONLY if no other leave exists
          const hasHoliday = prev.companyHoliday && prev.companyHoliday[day] > 0;
          if (!hasHoliday) {
            updated[day] = resetToDefaultHours(day, prev);
          }
        }

      } else if (type === 'companyHoliday') {
        // Set holiday hours
        updated.companyHoliday = { ...prev.companyHoliday, [day]: numValue };

        // If setting holiday to > 0, clear regular hours and sick leave
        if (numValue > 0) {
          updated[day] = 0; // Clear work hours
          if (updated.sickLeave) updated.sickLeave[day] = 0;
        } else {
          // If setting holiday to 0, set default work hours ONLY if no other leave exists
          const hasSickLeave = prev.sickLeave && prev.sickLeave[day] > 0;
          if (!hasSickLeave) {
            updated[day] = resetToDefaultHours(day, prev);
          }
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
    if (!timesheet) {
      console.warn('calculatePercentage called with null/undefined timesheet');
      return 0;
    }

    // Calculate based on actual working days with hours in the selected week
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    let totalWorkingHours = 0;
    let availableWorkingDays = 0;

    weekDays.forEach(day => {
      const dayDate = getDateForDay(selectedWeekStart, day);
      const dayHours = timesheet[day] || 0;

      // Only count days that have hours (not disabled/empty)
      if (dayHours > 0 && dayDate) {
        availableWorkingDays++;
        totalWorkingHours += dayHours;
      }
    });

    // Target is 8 hours per available working day that has hours
    const targetHours = availableWorkingDays * 8;
    return targetHours > 0 ? Math.min(Math.round((totalWorkingHours / targetHours) * 100), 100) : 0;
  };


  const createNewTimesheetForEmployee = (employeeId = null) => {
    const weekInfo = getWeekDates(selectedWeekStart);
    const targetUserId = employeeId || selectedEmployee || userId;

    console.log('Creating new timesheet for employee:', {
      targetUserId,
      selectedProject,
      weekInfo,
      employeeId,
      selectedEmployee,
      isCreateMode
    });

    const newTimesheet = {
      id: null,
      userId: targetUserId,
      project: selectedProject,
      status: 'DRAFT',
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
      percentageOfTarget: 100,
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
      workingEntries: [],
      nonWorkingEntries: []
    };

    // For create mode, set default hours based on calendar month
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    days.forEach(day => {
      const dayDate = getDateForDay(selectedWeekStart, day);
      const isInCalendarMonth = dayDate ? isDateInCalendarMonth(dayDate, calendarValue) : false;
      if (isInCalendarMonth) {
        newTimesheet[day] = 8;
      } else {
        newTimesheet[day] = 0;
      }
    });

    setCurrentTimesheet(newTimesheet);
    setNotes('');
    setHasUnsavedChanges(false);
    setIsSubmitted(false);

    console.log('New timesheet created for create mode:', newTimesheet);

    // For create mode, we don't want to add to timesheetData immediately
    if (!isCreateMode) {
      setTimeSheetData(prev => [...prev, newTimesheet]);
    }
  };



  const getEmptyTimesheet = (project = null) => {
    const weekInfo = getWeekDates(selectedWeekStart);
    const emptyTimesheet = {
      id: null,
      project: project,
      startDate: weekInfo.startString,
      endDate: weekInfo.endString,
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
      },
      isEditable: true,
      status: 'DRAFT'
    };

    // Only set default hours for non-rejected timesheets in current calendar month
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    days.forEach(day => {
      const dayDate = getDateForDay(selectedWeekStart, day);
      const isInCalendarMonth = dayDate ? isDateInCalendarMonth(dayDate, calendarValue) : false;
      if (isInCalendarMonth) {
        emptyTimesheet[day] = 8;
      }
    });

    return emptyTimesheet;
  };
  const saveTimesheet = async (isSubmission = false, isEdit = false) => {
    if (!currentTimesheet) return;

    if (isEditMode || isEdit) {
      console.log("Saving edited timesheet in edit mode:", currentTimesheet.id);
      setLoading(true);

      try {
        const workingHours = getWorkingDaysHours(currentTimesheet);
        const targetUserId = selectedEmployee || userId;

        // Create working entries - for edit mode, process ALL days regardless of calendar month
        const workingEntries = [];
        const nonWorkingEntries = [];
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        days.forEach(day => {
          const dayDate = getDateForDay(selectedWeekStart, day);
          if (!dayDate) return;

          const dateStr = formatDateToYMD(dayDate);

          // Regular working hours
          if (currentTimesheet[day] > 0) {
            workingEntries.push({
              date: dateStr,
              hours: currentTimesheet[day],
              project: selectedProject
            });
          }

          // Sick leave
          if (currentTimesheet.sickLeave && currentTimesheet.sickLeave[day] > 0) {
            nonWorkingEntries.push({
              date: dateStr,
              hours: currentTimesheet.sickLeave[day],
              description: 'Sick Leave',
            });
          }

          // Company holiday
          if (currentTimesheet.companyHoliday && currentTimesheet.companyHoliday[day] > 0) {
            nonWorkingEntries.push({
              date: dateStr,
              hours: currentTimesheet.companyHoliday[day],
              description: 'Company Holiday',
            });
          }
        });

        const timesheetPayload = {
          date: selectedWeekStart,
          workingEntries,
          nonWorkingEntries,
          notes: notes || '',
          status: 'PENDING_APPROVAL' // Set back to pending approval after edit
        };

        console.log("Updating timesheet in edit mode:", timesheetPayload);

        const resultAction = await dispatch(createTimesheet({
          timesheetId: currentTimesheet.id,
          userId: targetUserId,
          timesheetData: timesheetPayload
        }));

        if (createTimesheet.fulfilled.match(resultAction)) {
          const response = resultAction.payload;

          if (response?.success) {
            ToastService.success("Timesheet updated and resubmitted for approval");
            setIsEditMode(false);
            setHasUnsavedChanges(false);

            // Update the timesheet status locally
            setCurrentTimesheet(prev => ({
              ...prev,
              status: 'PENDING_APPROVAL',
              isEditable: false
            }));

            // Refresh the data
            setTimeout(() => {
              fetchOrCreateTimesheet();
            }, 500);
          } else {
            const errorMessage = extractErrorMessage(response);
            ToastService.error(errorMessage);
          }
        } else {
          const errorMessage = extractErrorMessage(resultAction.payload);
          ToastService.error(errorMessage);
        }
      } catch (error) {
        console.error("Error updating timesheet:", error);
        const errorMessage = extractErrorMessage(error);
        ToastService.error(errorMessage);
      } finally {
        setLoading(false);
      }
      return; // IMPORTANT: Return early after handling edit mode
    }

    // Handle create mode saving
    if (isCreateMode || isAddingNewTimesheet) {
      console.log("Saving timesheet in create/add mode");
      setLoading(true);

      try {
        const workingHours = getWorkingDaysHours(currentTimesheet);
        const targetUserId = tempEmployeeForAdd || selectedEmployee || userId;

        if (!targetUserId) {
          ToastService.error("No employee selected for timesheet creation");
          setLoading(false);
          return;
        }

        // Create working entries
        const workingEntries = [];
        const nonWorkingEntries = [];
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        days.forEach(day => {
          const dayDate = getDateForDay(selectedWeekStart, day);
          if (!dayDate) return;

          // Only process days that are in the current calendar month
          const isInCalendarMonth = isDateInCalendarMonth(dayDate, calendarValue);
          if (!isInCalendarMonth) return;

          const dateStr = formatDateToYMD(dayDate);

          // Regular working hours
          if (currentTimesheet[day] > 0) {
            workingEntries.push({
              date: dateStr,
              hours: currentTimesheet[day],
              project: selectedProject
            });
          }

          // Sick leave
          if (currentTimesheet.sickLeave && currentTimesheet.sickLeave[day] > 0) {
            nonWorkingEntries.push({
              date: dateStr,
              hours: currentTimesheet.sickLeave[day],
              description: 'Sick Leave',
            });
          }

          // Company holiday
          if (currentTimesheet.companyHoliday && currentTimesheet.companyHoliday[day] > 0) {
            nonWorkingEntries.push({
              date: dateStr,
              hours: currentTimesheet.companyHoliday[day],
              description: 'Company Holiday',
            });
          }
        });

        // Validate that we have at least one entry
        if (workingEntries.length === 0 && nonWorkingEntries.length === 0) {
          ToastService.error("Cannot save timesheet with no valid entries");
          setLoading(false);
          return;
        }

        const timesheetPayload = {
          date: selectedWeekStart,
          workingEntries,
          nonWorkingEntries,
          notes: notes || ''
        };

        console.log("Creating new timesheet in create mode:", timesheetPayload);

        const resultAction = await dispatch(createTimesheet({
          userId: targetUserId,
          timesheetData: timesheetPayload
        }));

        if (createTimesheet.fulfilled.match(resultAction)) {
          const response = resultAction.payload;

          if (response?.success) {
            ToastService.success("Timesheet created successfully");
            setHasUnsavedChanges(false);

            // Handle attachments if any
            if (pendingAttachments.length > 0 && response.data?.timesheetId) {
              console.log("Uploading pending attachments for new timesheet:", pendingAttachments);
              try {
                const filesToUpload = pendingAttachments.map(att => att.file);

                // Check if dates should be included based on working hours
                const editableRange = getEditableDateRange(currentTimesheet);
                const uploadResponse = await uploadFilesToServer(
                  response.data.timesheetId,
                  filesToUpload,
                  editableRange ? editableRange.start : null,
                  editableRange ? editableRange.end : null
                );

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
            }

            // Refresh to get the newly created timesheet with ID
            setTimeout(() => {
              fetchOrCreateTimesheet();
            }, 500);
          } else {
            const errorMessage = extractErrorMessage(response);
            ToastService.error(errorMessage);
          }
        } else {
          const errorMessage = extractErrorMessage(resultAction.payload);
          ToastService.error(errorMessage);
        }
      } catch (error) {
        console.error("Error creating timesheet in create mode:", error);
        const errorMessage = extractErrorMessage(error);
        ToastService.error(errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }



    if (isEditMode && currentTimesheet.id) {
      console.log("Saving edited timesheet in edit mode:", currentTimesheet.id);
      setLoading(true);

      try {
        const workingHours = getWorkingDaysHours(currentTimesheet);
        const targetUserId = selectedEmployee || userId;

        // Create working entries - for edit mode, process ALL days regardless of calendar month
        const workingEntries = [];
        const nonWorkingEntries = [];
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        days.forEach(day => {
          const dayDate = getDateForDay(selectedWeekStart, day);
          if (!dayDate) return;

          const dateStr = formatDateToYMD(dayDate);

          // Regular working hours
          if (currentTimesheet[day] > 0) {
            workingEntries.push({
              date: dateStr,
              hours: currentTimesheet[day],
              project: selectedProject
            });
          }

          // Sick leave
          if (currentTimesheet.sickLeave && currentTimesheet.sickLeave[day] > 0) {
            nonWorkingEntries.push({
              date: dateStr,
              hours: currentTimesheet.sickLeave[day],
              description: 'Sick Leave',
            });
          }

          // Company holiday
          if (currentTimesheet.companyHoliday && currentTimesheet.companyHoliday[day] > 0) {
            nonWorkingEntries.push({
              date: dateStr,
              hours: currentTimesheet.companyHoliday[day],
              description: 'Company Holiday',
            });
          }
        });

        const timesheetPayload = {
          date: selectedWeekStart,
          workingEntries,
          nonWorkingEntries,
          notes: notes || '',
          status: 'PENDING_APPROVAL' // Set back to pending approval after edit
        };

        console.log("Updating timesheet in edit mode:", timesheetPayload);

        const resultAction = await dispatch(createTimesheet({
          timesheetId: currentTimesheet.id,
          userId: targetUserId,
          timesheetData: timesheetPayload
        }));

        if (createTimesheet.fulfilled.match(resultAction)) {
          const response = resultAction.payload;

          if (response?.success) {
            ToastService.success("Timesheet updated and resubmitted for approval");
            setIsEditMode(false);
            setHasUnsavedChanges(false);

            // Update the timesheet status locally
            setCurrentTimesheet(prev => ({
              ...prev,
              status: 'PENDING_APPROVAL',
              isEditable: false
            }));

            // Refresh the data
            setTimeout(() => {
              fetchOrCreateTimesheet();
            }, 500);
          } else {
            const errorMessage = extractErrorMessage(response);
            ToastService.error(errorMessage);
          }
        } else {
          const errorMessage = extractErrorMessage(resultAction.payload);
          ToastService.error(errorMessage);
        }
      } catch (error) {
        console.error("Error updating timesheet:", error);
        const errorMessage = extractErrorMessage(error);
        ToastService.error(errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Regular save for existing timesheets (not in create or edit mode)
    const workingHours = getWorkingDaysHours(currentTimesheet);
    const targetUserId = selectedEmployee || userId;

    console.log("Saving timesheet:", { currentTimesheet, workingHours, isSubmission, targetUserId });

    setLoading(true);
    try {
      // Create working entries
      const workingEntries = [];
      const nonWorkingEntries = [];
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      days.forEach(day => {
        const dayDate = getDateForDay(selectedWeekStart, day);
        if (!dayDate) return;

        // Only process days that are in the current calendar month
        const isInCalendarMonth = isDateInCalendarMonth(dayDate, calendarValue);
        if (!isInCalendarMonth) return;

        const dateStr = formatDateToYMD(dayDate);

        // Regular working hours
        if (currentTimesheet[day] > 0) {
          workingEntries.push({
            date: dateStr,
            hours: currentTimesheet[day],
            project: selectedProject
          });
        }

        // Sick leave
        if (currentTimesheet.sickLeave && currentTimesheet.sickLeave[day] > 0) {
          nonWorkingEntries.push({
            date: dateStr,
            hours: currentTimesheet.sickLeave[day],
            description: 'Sick Leave',
          });
        }

        // Company holiday
        if (currentTimesheet.companyHoliday && currentTimesheet.companyHoliday[day] > 0) {
          nonWorkingEntries.push({
            date: dateStr,
            hours: currentTimesheet.companyHoliday[day],
            description: 'Company Holiday',
          });
        }
      });

      // Validate that we have at least one entry
      if (workingEntries.length === 0 && nonWorkingEntries.length === 0) {
        ToastService.error("Cannot save timesheet with no valid entries");
        setLoading(false);
        return;
      }

      const timesheetPayload = {
        date: selectedWeekStart,
        workingEntries,
        nonWorkingEntries,
        notes: notes || ''
      };

      console.log("Sending timesheet data:", JSON.stringify(timesheetPayload, null, 2));

      let response;

      if (currentTimesheet.id) {
        // Use update API for existing timesheets
        console.log("Using update API for existing timesheet");
        const resultAction = await dispatch(createTimesheet({
          timesheetId: currentTimesheet.id,
          userId: targetUserId,
          timesheetData: timesheetPayload
        }));

        if (createTimesheet.fulfilled.match(resultAction)) {
          response = resultAction.payload;
          console.log("Updated timesheet via updateTimesheet API");
        } else {
          const errorMessage = extractErrorMessage(resultAction.payload);
          ToastService.error(errorMessage);
          setLoading(false);
          return;
        }
      } else {
        // Use create API for new timesheets
        console.log("Using create API for new timesheet");
        const resultAction = await dispatch(createTimesheet({
          userId: targetUserId,
          timesheetData: timesheetPayload
        }));

        if (createTimesheet.fulfilled.match(resultAction)) {
          response = resultAction.payload;
          console.log("Created timesheet via createTimesheet API");
        } else {
          const errorMessage = extractErrorMessage(resultAction.payload);

          if (errorMessage.toLowerCase().includes('duplicate')) {
            ToastService.error("A timesheet already exists for this week and project. Please refresh the page to edit the existing timesheet.");
          } else {
            ToastService.error(errorMessage);
          }
          setLoading(false);
          return;
        }
      }

      console.log("Save response:", response);

      if (response?.success) {
        ToastService.success(currentTimesheet.id ? "Timesheet updated successfully" : "Timesheet created successfully");

        // Handle attachments for EXTERNALEMPLOYEE
        if (!isSubmission && pendingAttachments.length > 0 && response.data?.timesheetId && role === "EXTERNALEMPLOYEE") {
          console.log("Uploading pending attachments:", pendingAttachments);
          try {
            const filesToUpload = pendingAttachments.map(att => att.file);

            // Check if dates should be included based on working hours
            const includeDates = shouldIncludeDates(currentTimesheet);
            const uploadResponse = await uploadFilesToServer(
              response.data.timesheetId,
              filesToUpload,
              includeDates ? selectedWeekStart : null,
              includeDates ? getWeekDates(selectedWeekStart).endString : null
            );

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
        }

        setHasUnsavedChanges(false);

        if (isEdit) {
          setIsEditMode(false);
        }

        // Force refresh the timesheet data
        if (role === 'EXTERNALEMPLOYEE' || isCreateMode || isAddingNewTimesheet) {
          console.log('Force refreshing timesheet data');

          // Clear current timesheet to trigger re-fetch
          setCurrentTimesheet(null);

          // Force re-fetch the timesheet data with a small delay
          setTimeout(() => {
            fetchOrCreateTimesheet();
          }, 300);
        } else if (monthlyViewMode && (role === 'ACCOUNTS' || role === 'INVOICE')) {
          // For monthly view, refresh monthly data
          console.log('Refreshing monthly view data after save');
          setTimeout(() => {
            if (selectedEmployee) {
              fetchMonthlyTimesheetData(selectedEmployee);
            }
          }, 500);
        }

      } else {
        const errorMessage = extractErrorMessage(response);

        if (errorMessage.toLowerCase().includes('duplicate')) {
          ToastService.error("A timesheet already exists for this week and project. Please refresh the page to edit the existing timesheet.");
        } else {
          ToastService.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error saving timesheet:", error);

      const errorMessage = extractErrorMessage(error);

      if (errorMessage.toLowerCase().includes('duplicate')) {
        ToastService.error("A timesheet already exists for this week and project. Please refresh the page to edit the existing timesheet.");
      } else {
        ToastService.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditTimesheet = async () => {
    if (!currentTimesheet || !currentTimesheet.id) {
      ToastService.error('No timesheet available for editing');
      return;
    }

    try {
      // For rejected timesheets, we don't need to change the calendar month
      // Just enable edit mode immediately

      console.log('Enabling edit mode for rejected timesheet:', currentTimesheet.id);

      // Set edit mode first to allow immediate editing
      setIsEditMode(true);

      // Update the backend to mark as editable (DRAFT status)
      const result = await dispatch(createTimesheet({
        timesheetId: currentTimesheet.id,
        userId: selectedEmployee || userId,
        timesheetData: {
          date: selectedWeekStart,
          workingEntries: [], // Will be populated from current state
          nonWorkingEntries: [], // Will be populated from current state
          notes: notes || currentTimesheet.notes || '',
          status: 'DRAFT', // Change status to DRAFT for editing
          isEditable: true
        }
      })).unwrap();

      // If successful, update local state
      if (result.success) {
        setCurrentTimesheet(prev => ({
          ...prev,
          isEditable: true,
          status: 'DRAFT' // Update status to DRAFT
        }));
        setHasUnsavedChanges(false);
        ToastService.success("Timesheet is now in edit mode. You can modify and save changes.");
      } else {
        ToastService.error('Failed to enable edit mode');
        setIsEditMode(false); // Revert if failed
      }
    } catch (error) {
      console.error('Error enabling edit mode:', error);
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage || 'Failed to enable edit mode');
      setIsEditMode(false);
    }
  };
  // Add function to check if timesheet can be edited (rejected status)
  const canEditTimesheet = () => {
    return currentTimesheet &&
      currentTimesheet.status === 'REJECTED' &&
      (role === 'EXTERNALEMPLOYEE' || isCreateMode) &&
      !isEditMode; // Only show edit button if not already in edit mode
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


  useEffect(() => {
    // When calendar value changes, refresh the timesheet to show correct data for the new month
    if (selectedProject && selectedWeekStart && currentTimesheet) {
      console.log('Calendar month changed, refreshing timesheet data for new month');
      fetchOrCreateTimesheet();
    }
  }, [calendarValue.getMonth(), calendarValue.getFullYear()]);

  useEffect(() => {
    if (prepopulatedEmployee && prepopulatedEmployee.monthStart && prepopulatedEmployee.monthEnd) {
      // Set selectedMonthRange from prepopulated data
      const monthRange = {
        start: prepopulatedEmployee.monthStart,
        end: prepopulatedEmployee.monthEnd
      };
      setSelectedMonthRange(monthRange);
      console.log('Set selectedMonthRange from prepopulated data:', monthRange);

      // Also set navigationSource if it's not already set
      if (!navigationSource && prepopulatedEmployee.source) {
        setNavigationSource(prepopulatedEmployee.source);
      }
    }
  }, [prepopulatedEmployee]);

  // Add this useEffect after your existing useEffects
  useEffect(() => {
    // This will trigger when timesheetData changes and we're in create mode
    if ((isCreateMode || isAddingNewTimesheet) && timesheetData.length > 0 && !currentTimesheet) {
      console.log('Timesheet data updated in create mode, setting current timesheet');

      // Find the newly created timesheet in the data
      const newTimesheet = timesheetData.find(ts =>
        ts.project === selectedProject &&
        ts.startDate === selectedWeekStart
      );

      if (newTimesheet) {
        setCurrentTimesheet(newTimesheet);
      }
    }
  }, [timesheetData, isCreateMode, isAddingNewTimesheet, selectedProject, selectedWeekStart]);

  // Add this useEffect to clean up blob URLs
  useEffect(() => {
    return () => {
      if (attachmentContent && (attachmentType === 'pdf' || attachmentType === 'image')) {
        if (typeof attachmentContent === 'string') {
          window.URL.revokeObjectURL(attachmentContent);
        }
      }
    };
  }, [attachmentContent, attachmentType]);


  const getEditableDateRange = (timesheet) => {
    if (!timesheet || !selectedWeekStart) return null;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const editableDates = [];

    days.forEach(day => {
      const dayDate = getDateForDay(selectedWeekStart, day);
      if (dayDate) {
        const isInCalendarMonth = isDateInCalendarMonth(dayDate, calendarValue);
        const isEditable = isFieldEditable(timesheet, day, null, calendarValue);

        // Check if this day has any working hours or leave hours
        const hasWorkingHours = timesheet[day] > 0;
        const hasSickLeave = timesheet.sickLeave && timesheet.sickLeave[day] > 0;
        const hasHoliday = timesheet.companyHoliday && timesheet.companyHoliday[day] > 0;
        const hasAnyHours = hasWorkingHours || hasSickLeave || hasHoliday;

        if (isInCalendarMonth && isEditable && hasAnyHours) {
          editableDates.push(formatDateToYMD(dayDate));
        }
      }
    });

    if (editableDates.length === 0) return null;

    // Sort dates and return start and end
    editableDates.sort();
    return {
      start: editableDates[0],
      end: editableDates[editableDates.length - 1]
    };
  };

  const shouldIncludeDates = (timesheet) => {
    const editableRange = getEditableDateRange(timesheet);
    return editableRange !== null;
  };

  const uploadFilesToServer = async (timesheetId, files, startDate = null, endDate = null) => {
    console.log('Uploading files to server:', {
      timesheetId,
      files,
      startDate,
      endDate
    });

    try {
      const resultAction = await dispatch(uploadTimesheetAttachments({
        timesheetId,
        files,
        attachmentStartDate: startDate, // Add start date parameter
        attachmentEndDate: endDate       // Add end date parameter
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

  const submitWeeklyTimesheetHandler = async () => {
    if (!currentTimesheet) return;

    try {
      setLoading(true);

      // First save if there are unsaved changes
      if (hasUnsavedChanges) {
        console.log('Saving unsaved changes before submission');
        await saveTimesheet(false);
        // Wait for save to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Extract timesheetType from currentTimesheet (from API response)
      const timesheetType = currentTimesheet.timesheetType || "WEEKLY"; // Default to WEEKLY if not specified

      console.log(`Submitting ${timesheetType} timesheet`);

      // Get the correct start date based on timesheet type
      let startDate;
      if (timesheetType === "MONTHLY") {
        // For monthly, use the first day of the selected calendar month
        const selectedDate = new Date(calendarValue);
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        startDate = formatDateToYMD(monthStart);
      } else {
        // For weekly, use the selected week start
        startDate = selectedWeekStart;
      }

      console.log('Submitting timesheet with:', {
        userId,
        startDate,
        timesheetType,
        timesheetId: currentTimesheet.id,
        calendarMonth: calendarValue.getMonth() + 1,
        calendarYear: calendarValue.getFullYear()
      });

      // Choose correct Redux action
      const actionToDispatch = timesheetType === "MONTHLY"
        ? submitMonthlyTimesheetAction
        : submitWeeklyTimesheetAction;

      // Dispatch action with correct parameters
      let submitParams;

      if (timesheetType === "MONTHLY") {
        submitParams = {
          userId,
          monthStartDate: startDate // Use monthStart for monthly timesheets
        };
      } else {
        submitParams = {
          userId,
          weekStart: startDate // Use weekStart for weekly timesheets
        };
      }

      const resultAction = await dispatch(actionToDispatch(submitParams));

      if (actionToDispatch.fulfilled.match(resultAction)) {
        const submitResponse = resultAction.payload;

        console.log('Submit response:', submitResponse);

        if (submitResponse && submitResponse.success) {
          // Upload pending attachments after successful submission
          if (pendingAttachments.length > 0 && currentTimesheet.id) {
            console.log('Uploading pending attachments after submission:', pendingAttachments);
            try {
              const filesToUpload = pendingAttachments.map(att => att.file);

              // Check if dates should be included based on working hours
              const editableRange = getEditableDateRange(currentTimesheet);
              const uploadResponse = await uploadFilesToServer(
                currentTimesheet.id,
                filesToUpload,
                editableRange ? editableRange.start : null,
                editableRange ? editableRange.end : null
              );

              console.log('Upload response:', uploadResponse);

              if (uploadResponse && uploadResponse.success) {
                const uploadedAttachments = pendingAttachments.map(att => ({
                  ...att,
                  uploaded: true,
                  file: undefined,
                  url: uploadResponse.fileUrls?.find(url => url.includes(att.name))
                }));

                setAttachments(prev => [
                  ...prev.filter(a => a.uploaded),
                  ...uploadedAttachments
                ]);
                setPendingAttachments([]);
                ToastService.success(
                  `Timesheet submitted successfully and ${pendingAttachments.length} attachment(s) uploaded`
                );
              } else {
                ToastService.warning(
                  'Timesheet submitted successfully but failed to upload some attachments'
                );
              }
            } catch (uploadError) {
              console.error('Error uploading pending attachments:', uploadError);
              const uploadErrorMessage = extractErrorMessage(uploadError);
              ToastService.error(
                `Timesheet submitted successfully but failed to upload attachments: ${uploadErrorMessage}`
              );
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
      console.error('Error submitting timesheet:', error);

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

        // Check if dates should be included based on working hours
        const editableRange = getEditableDateRange(currentTimesheet);
        const uploadResponse = await uploadFilesToServer(
          currentTimesheet.id,
          selectedFiles,
          editableRange ? editableRange.start : null,
          editableRange ? editableRange.end : null
        );

        if (uploadResponse && uploadResponse.success) {
          const newAttachments = selectedFiles.map((file, index) => ({
            id: Date.now() * 1000 + Math.floor(Math.random() * 1000) + index, // Integer only
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
          id: Date.now() * 1000 + Math.floor(Math.random() * 1000) + index, // Integer only
          name: file.name,
          size: file.size,
          type: file.type,
          uploadDate: new Date(),
          file: file,
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

  const handleApproveTimesheet = async (timesheet = null, weekData = null) => {
    // If no parameters provided, try to use currentTimesheet (for backward compatibility)
    const targetTimesheet = timesheet || currentTimesheet;

    // For monthly view, we might not have a specific timesheet but weekData
    if (!targetTimesheet && !weekData) {
      console.error('No timesheet or weekData provided for approval');
      ToastService.error('No timesheet data available for approval');
      return;
    }

    setAdminActionLoading(true);
    try {
      let resultAction;

      // Determine if this is a monthly timesheet
      const effectiveTimesheet = targetTimesheet || weekData?.timesheet;
      const isMonthlyTimesheet = monthlyViewMode || (effectiveTimesheet?.timesheetType === 'MONTHLY');

      if (isMonthlyTimesheet) {
        // For monthly view, use the selectedMonthRange from prepopulated data
        if (!selectedMonthRange) {
          ToastService.error('No month range selected for approval');
          setAdminActionLoading(false);
          return;
        }

        if (!selectedEmployee) {
          ToastService.error('No employee selected for approval');
          setAdminActionLoading(false);
          return;
        }


        resultAction = await dispatch(approveTimesheetMonthly({
          userId: selectedEmployee,
          start: selectedMonthRange.start,
          end: selectedMonthRange.end
        }));

        // Check if monthly approval succeeded using Redux Toolkit pattern
        if (approveTimesheetMonthly.fulfilled.match(resultAction)) {
          const response = resultAction.payload;

          if (response.success) {
            ToastService.success('Timesheet approved successfully');
            // Refresh the data based on current view mode
            if (selectedEmployee) {
              setTimeout(() => {
                fetchMonthlyTimesheetData(selectedEmployee);
              }, 500);
            }
          } else {
            const errorMessage = extractErrorMessage(response);
            ToastService.error(errorMessage || 'Failed to approve timesheet');
          }
        } else {
          const errorMessage = extractErrorMessage(resultAction.payload);
          ToastService.error(errorMessage || 'Failed to approve timesheet');
        }
      } else {
        // For weekly timesheets, use the original approach
        const timesheetId = effectiveTimesheet?.id || effectiveTimesheet?.timesheetId;

        if (!timesheetId) {
          throw new Error('No timesheet ID found for approval');
        }

        console.log('Approving weekly timesheet with ID:', timesheetId);

        resultAction = await dispatch(approveTimesheet({
          timesheetId: timesheetId,
          userId: userId
        }));

        // Check if weekly approval succeeded using Redux Toolkit pattern
        if (approveTimesheet.fulfilled.match(resultAction)) {
          const response = resultAction.payload;

          if (response.success) {
            ToastService.success('Timesheet approved successfully');
            // Refresh the data
            setTimeout(() => {
              fetchOrCreateTimesheet();
            }, 500);
          } else {
            const errorMessage = extractErrorMessage(response);
            ToastService.error(errorMessage || 'Failed to approve timesheet');
          }
        } else {
          const errorMessage = extractErrorMessage(resultAction.payload);
          ToastService.error(errorMessage || 'Failed to approve timesheet');
        }
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage || 'Failed to approve timesheet');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleRejectTimesheet = async (timesheet = null, weekData = null) => {
    const targetTimesheet = timesheet || currentTimesheet;

    if (!targetTimesheet && !weekData) {
      console.error('No timesheet or weekData provided for rejection');
      return;
    }

    if (!rejectionReason.trim()) {
      ToastService.error('Please provide a rejection reason');
      return;
    }

    setAdminActionLoading(true);
    try {
      let resultAction;
      const isMonthlyTimesheet = monthlyViewMode || (targetTimesheet?.timesheetType === 'MONTHLY');

      console.log('Rejecting timesheet:', {
        targetTimesheet,
        isMonthlyTimesheet,
        monthlyViewMode,
        weekData,
        rejectionReason
      });

      if (isMonthlyTimesheet) {
        // For monthly view, use the selectedMonthRange from prepopulated data
        if (!selectedMonthRange) {
          ToastService.error('No month range selected for rejection');
          return;
        }

        console.log('Rejecting monthly timesheet with params:', {
          userId: selectedEmployee,
          start: selectedMonthRange.start,
          end: selectedMonthRange.end,
          reason: rejectionReason.trim()
        });

        resultAction = await dispatch(rejectTimesheetMonthly({
          userId: selectedEmployee,
          start: selectedMonthRange.start,
          end: selectedMonthRange.end,
          reason: rejectionReason.trim()
        }));

        // Check if monthly rejection succeeded
        if (rejectTimesheetMonthly.fulfilled.match(resultAction)) {
          const response = resultAction.payload;

          if (response.success) {
            ToastService.success('Timesheet rejected successfully');
            setRejectDialogOpen(false);
            setRejectionReason('');

            // Refresh the data based on current view mode
            setTimeout(() => {
              fetchMonthlyTimesheetData(selectedEmployee);
            }, 500);
          } else {
            const errorMessage = extractErrorMessage(response);
            ToastService.error(errorMessage || 'Failed to reject timesheet');
          }
        } else {
          const errorMessage = extractErrorMessage(resultAction.payload);
          ToastService.error(errorMessage || 'Failed to reject timesheet');
        }
      } else {
        // For weekly timesheets, use the original approach
        const timesheetId = targetTimesheet?.id || targetTimesheet?.timesheetId;

        if (!timesheetId) {
          throw new Error('No timesheet ID found for rejection');
        }

        console.log('Rejecting weekly timesheet with ID:', timesheetId);

        resultAction = await dispatch(rejectTimesheet({
          timesheetId: timesheetId,
          userId: userId,
          reason: rejectionReason.trim()
        }));

        // Check if weekly rejection succeeded
        if (rejectTimesheet.fulfilled.match(resultAction)) {
          const response = resultAction.payload;

          if (response.success) {
            ToastService.success('Timesheet rejected successfully');
            setRejectDialogOpen(false);
            setRejectionReason('');

            // Refresh the data based on current view mode
            setTimeout(() => {
              fetchOrCreateTimesheet();
            }, 500);
          } else {
            const errorMessage = extractErrorMessage(response);
            ToastService.error(errorMessage || 'Failed to reject timesheet');
          }
        } else {
          const errorMessage = extractErrorMessage(resultAction.payload);
          ToastService.error(errorMessage || 'Failed to reject timesheet');
        }
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
    } finally {
      setAdminActionLoading(false);
    }
  };

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

  const triggerDownload = (blob, filename) => {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'download';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      ToastService.info('File downloaded successfully');
    } catch (error) {
      console.error('Error triggering download:', error);
      ToastService.error('Failed to download file');
    }
  };


  const handleViewAttachmentFile = async (attachment, timesheet = null) => {
    try {
      const attachmentId = attachment.id || attachment.attachmentId;

      if (!attachmentId) {
        ToastService.error('No attachment ID found');
        return;
      }

      setViewLoading(true);

      // Direct axios call like your working sample
      const response = await axios.get(
        `/timesheet/attachments/${attachmentId}/download?view=true`,
        {
          responseType: 'blob',
          // Use your base URL
          baseURL: 'https://mymulya.com/'
        }
      );

      const blob = response.data;
      const contentType = blob.type || response.headers['content-type'] || '';

      // Get filename from headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = attachment.filename || attachment.name || `attachment_${attachmentId}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create object URL
      const objectUrl = URL.createObjectURL(blob);

      // Set the current attachment for the dialog
      setCurrentAttachment({
        ...attachment,
        filename: filename,
        contentType: contentType,
        objectUrl: objectUrl,
        blob: blob
      });

      // Determine file type for rendering
      if (contentType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
        setAttachmentType('pdf');
        setAttachmentContent(objectUrl);
      }
      else if (contentType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(filename)) {
        setAttachmentType('image');
        setAttachmentContent(objectUrl);
      }
      else if (contentType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(filename)) {
        setAttachmentType('video');
        setAttachmentContent(objectUrl);
      }
      else if (contentType.startsWith('audio/') || /\.(mp3|wav|ogg|aac|flac)$/i.test(filename)) {
        setAttachmentType('audio');
        setAttachmentContent(objectUrl);
      }
      else if (contentType.includes('text') || /\.(txt|json|xml|csv|log|md|js|html|css)$/i.test(filename)) {
        try {
          const text = await blob.text();
          setAttachmentContent(text);
          setAttachmentType('text');
        } catch (textError) {
          console.error('Error reading text file:', textError);
          // Fallback to download
          triggerDownload(blob, filename);
          setViewLoading(false);
          URL.revokeObjectURL(objectUrl);
          return;
        }
      }
      else {
        // For unsupported types, show download option
        setAttachmentType('other');
        setAttachmentContent(objectUrl);
      }

      // Open the dialog
      setViewAttachmentDialogOpen(true);

    } catch (error) {
      console.error('Error viewing attachment:', error);
      ToastService.error('Failed to view attachment');
    } finally {
      setViewLoading(false);
    }
  };

  // Simplified download handler
  const handleDownloadAttachmentFile = async (attachment, timesheet = null) => {
    try {
      const attachmentId = attachment.id || attachment.attachmentId;
      const filename = attachment.filename || attachment.name;

      if (!attachmentId) {
        ToastService.error('No attachment ID found');
        return;
      }

      setDownloadLoading(true);

      // Direct axios call for download
      const response = await axios.get(
        `/timesheet/attachments/${attachmentId}/download`,
        {
          responseType: 'blob',
          baseURL: 'https://mymulya.com/'
        }
      );

      const blob = response.data;

      // Get filename from headers if not provided
      let downloadFilename = filename;
      const contentDisposition = response.headers['content-disposition'];

      if (contentDisposition && !downloadFilename) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          downloadFilename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      if (!downloadFilename) {
        downloadFilename = `attachment_${attachmentId}`;
      }

      // Trigger download
      triggerDownload(blob, downloadFilename);
      ToastService.success('Download started successfully');

    } catch (error) {
      console.error('Error downloading attachment:', error);
      ToastService.error('Failed to download attachment');
    } finally {
      setDownloadLoading(false);
    }
  };

  // Updated AttachmentViewDialog - simplified like your working sample
  const AttachmentViewDialog = () => {
    const handleDownload = () => {
      if (currentAttachment?.blob) {
        triggerDownload(currentAttachment.blob, currentAttachment.filename);
      } else if (attachmentType === 'text' && attachmentContent) {
        const blob = new Blob([attachmentContent], {
          type: currentAttachment?.contentType || 'text/plain'
        });
        triggerDownload(blob, currentAttachment?.filename || 'textfile.txt');
      }
    };

    const handleClose = () => {
      setViewAttachmentDialogOpen(false);

      // Clean up object URL
      if (currentAttachment?.objectUrl) {
        URL.revokeObjectURL(currentAttachment.objectUrl);
      }

      // Reset states
      setAttachmentContent(null);
      setAttachmentType(null);
      setCurrentAttachment(null);
    };

    return (
      <Dialog
        open={viewAttachmentDialogOpen}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Typography variant='h4'>Attachments</Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0, overflow: 'hidden' }}>
          {viewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading attachment...</Typography>
            </Box>
          ) : (
            <>
              {/* PDF Viewer - exactly like your working sample */}
              {attachmentType === 'pdf' && attachmentContent && (
                <iframe
                  src={`${attachmentContent}#toolbar=0&navpanes=0&scrollbar=0`}
                  title="PDF Preview"
                  style={{ width: "100%", height: "80vh", border: "none" }}
                />
              )}

              {/* Image Viewer - exactly like your working sample */}
              {attachmentType === 'image' && attachmentContent && (
                <img
                  src={attachmentContent}
                  alt="Attachment"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    display: "block",
                    margin: "0 auto"
                  }}
                />
              )}

              {/* Video Viewer */}
              {attachmentType === 'video' && attachmentContent && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <video
                    controls
                    style={{ maxWidth: '100%', maxHeight: '80vh' }}
                  >
                    <source src={attachmentContent} type={currentAttachment?.contentType} />
                    Your browser does not support the video tag.
                  </video>
                </Box>
              )}

              {/* Audio Viewer */}
              {attachmentType === 'audio' && attachmentContent && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <audio controls style={{ width: '100%' }}>
                    <source src={attachmentContent} type={currentAttachment?.contentType} />
                    Your browser does not support the audio tag.
                  </audio>
                </Box>
              )}

              {/* Text Viewer */}
              {attachmentType === 'text' && (
                <Box sx={{ p: 2, height: '80vh', overflow: 'auto' }}>
                  <TextField
                    multiline
                    fullWidth
                    value={attachmentContent || ''}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        '& .MuiInputBase-input': {
                          height: '70vh !important',
                          overflow: 'auto !important'
                        }
                      }
                    }}
                    variant="outlined"
                  />
                </Box>
              )}

              {/* Unsupported file types */}
              {attachmentType === 'other' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    File Preview Not Available
                  </Typography>
                  <Typography variant="body1" color="text.secondary" textAlign="center" gutterBottom>
                    {currentAttachment?.filename}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
                    Unsupported file type: {currentAttachment?.contentType}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CloudDownload />}
                    onClick={handleDownload}
                    size="large"
                  >
                    Download to View
                  </Button>
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            Close
          </Button>
          <Button
            onClick={handleDownload}
            variant="contained"
            startIcon={<CloudDownload />}
            disabled={viewLoading}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
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
      submitWeeklyTimesheet={submitWeeklyTimesheetHandler}
      isFridayInPresentWeek={isFridayInPresentWeek}
      onApprove={handleApproveTimesheet}
      onReject={() => setRejectDialogOpen(true)}
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
      // handleCancelAddTimesheet={handleCancelAddTimesheet}
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
      isDateInSelectedWeekMonth={isDateInSelectedWeekMonth}
      isDateInCalendarMonth={isDateInCalendarMonth}
      monthlyTimesheetData={monthlyTimesheetData}
      currentMonthWeeks={currentMonthWeeks}
      monthlyViewMode={monthlyViewMode}
      fetchMonthlyTimesheetData={fetchMonthlyTimesheetData}
      selectedMonthRange={selectedMonthRange}
      navigationSource={navigationSource}
      handleViewAttachmentFile={handleViewAttachmentFile}
      handleDownloadAttachmentFile={handleDownloadAttachmentFile}
      viewLoading={viewLoading}
      downloadLoading={downloadLoading}
      AttachmentViewDialog={AttachmentViewDialog}
      monthlyTotalWorkingHours={monthlyTotalWorkingHours}
      monthlyTotalWorkingHoursForEmployee={monthlyTotalWorkingHoursForEmployee}
    />
  );
};

export default Timesheets

