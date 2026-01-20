import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';

import {
  fetchClientsForProjects,
  fetchTimesheetsByUserId,
  fetchTimesheetsByUserIdWithDateRange,
  createTimesheet,
  submitWeeklyTimesheet as submitWeeklyTimesheetAction,
  submitMonthlyTimesheet as submitMonthlyTimesheetAction,
  clearError,
  resetTimesheets,
} from '../../redux/timesheetSlice';
import { fetchEmployees } from '../../redux/employeesSlice';
import {
  getMondayOfWeek,
  formatDateToYMD,
  getDateForDay,
  getWeekDates,
  getCurrentWeek,
  getWeekDatesArray,
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
  getProjectConfig,
} from './timesheetUtils';


import TimesheetMainView from './TimesheetMainView';
import httpService from '../../Services/httpService';
import { useLocation, useNavigate } from 'react-router-dom';
import ToastService from '../../Services/toastService';
import { useAttachmentsHandler } from './AttachmentHanlders';
import useTimesheetApprovalHandlers from './useTimesheetApprovalHandlers';

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

  // Calendar and timesheet states
  const [timesheetType, setTimesheetType] = useState('MONTHLY');

  const [monthlyViewMode, setMonthlyViewMode] = useState(false);
  const [monthlyTimesheetData, setMonthlyTimesheetData] = useState([]);
  const [currentMonthWeeks, setCurrentMonthWeeks] = useState([]);
  // Add this state variable
  const [selectedMonthRange, setSelectedMonthRange] = useState(null);
  const [currentTimesheet, setCurrentTimesheet] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [highlightedWeek, setHighlightedWeek] = useState([]);
  const [notes, setNotes] = useState('');

  // Add new state for tracking submission status
  const [isSubmitted, setIsSubmitted] = useState(false);

  const navigate = useNavigate()
  const attachmentsHandler = useAttachmentsHandler();
  const approvalHandlers = useTimesheetApprovalHandlers();
  // Extract state and functions from attachments handler
  const {
    attachments,
    setAttachments,
    pendingAttachments,
    setPendingAttachments,
    uploadDialogOpen,
    setUploadDialogOpen,
    uploading,
    selectedFiles,
    setSelectedFiles,
    fileInputRef,
    viewLoading,
    downloadLoading,
    selectedWeekStart,
    setSelectedWeekStart,
    calendarValue,
    setCalendarValue,

    // Functions
    getWorkingDateRange,
    getEditableDateRange,
    handleFileSelect,
    handleUploadAttachments,
    handleRemoveAttachment,
    handleViewAttachments,
    handleViewAttachmentFile,
    handleDownloadAttachmentFile,
    AttachmentViewDialog,
    fetchTimesheetAttachments,
    uploadFilesToServer
  } = attachmentsHandler;

  const {
    adminActionLoading,
    rejectionReason,
    rejectDialogOpen,
    setRejectionReason,
    setRejectDialogOpen,
    handleApproveTimesheet,
    handleRejectTimesheet,
    openRejectDialog,
    closeRejectDialog
  } = approvalHandlers;

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

  // Add this with your other state declarations
  const [loadingEmployeeProjects, setLoadingEmployeeProjects] = useState(false);

  //add this for prepopulation
  const [prepopulatedEmployee, setPrepopulatedEmployee] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const location = useLocation();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [navigationSource, setNavigationSource] = useState('');


  const [monthlyTotalWorkingHours, setMonthlyTotalWorkingHours] = useState(0);
  const [monthlyTotalWorkingHoursForEmployee, setMonthlyTotalWorkingHoursForEmployee] = useState(0);

  const [submitLoading, setSubmitLoading] = useState(false);
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
    const currentPath = window.location.pathname;
    setIsCreateMode(currentPath.includes('/timesheets/create'));
  }, []);

  // Add this useEffect to load employees data for SUPERADMIN/ACCOUNTS roles
  useEffect(() => {
    if (role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE" || role === "ADMIN") {
      dispatch(fetchEmployees());
      if (isCreateMode) {
        setIsAddingNewTimesheet(true);
      }
    }
  }, [dispatch, role, isCreateMode]);

  useEffect(() => {
    if (isAddingNewTimesheet && tempEmployeeForAdd && !selectedProject) {
      console.log('Employee selected in add mode, fetching projects immediately');
    }
  }, [tempEmployeeForAdd, isAddingNewTimesheet]);

  useEffect(() => {
    // Only fetch/create timesheet if we have all required data
    if (selectedProject && selectedWeekStart) {
      if ((role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE" || role === 'ADMIN') && !isAddingNewTimesheet && !isCreateMode) {
        if (selectedEmployee) {
          console.log('Fetching timesheet for admin role with selected employee');
          fetchOrCreateTimesheet();
        }
      }
      else if (role === 'EXTERNALEMPLOYEE' || isAddingNewTimesheet || isCreateMode) {
        console.log('Fetching timesheet for external employee or add/create mode');
        fetchOrCreateTimesheet();
      }
    } else {
      setCurrentTimesheet(null);
      setHasUnsavedChanges(false);
    }
  }, [selectedProject, selectedWeekStart, selectedEmployee, role, isAddingNewTimesheet, isCreateMode]);

  useEffect(() => {
    if ((role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE" || role === "ADMIN")) {
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


  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(resetTimesheets());
    };
  }, [dispatch]);


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

        if (employeeData.monthStart && employeeData.monthEnd) {
          const monthRange = {
            start: employeeData.monthStart,
            end: employeeData.monthEnd
          };
          setSelectedMonthRange(monthRange);
          console.log('Set selected month range from prepopulated data:', monthRange);

          if (employeeData.selectedMonth !== null && employeeData.selectedYear !== null) {
            const targetDate = new Date(employeeData.selectedYear, employeeData.selectedMonth, 1);
            setCalendarValue(targetDate);
            console.log('Set calendar to prepopulated month:', targetDate);
          }
        }
        if (role === 'ACCOUNTS' || role === "ADMIN") {
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
    if (prepopulatedEmployee && (role === 'ACCOUNTS' || role === "ADMIN")) {
      console.log('Prepopulating employee for monthly view:', prepopulatedEmployee);

      // Set monthly view mode based on the prepopulated data
      const shouldEnableMonthlyView = prepopulatedEmployee.enableMonthlyView ||
        location.state?.monthlyView ||
        new URLSearchParams(window.location.search).get('monthlyView') === 'true';

      if (shouldEnableMonthlyView) {
        setMonthlyViewMode(true);
        console.log('Monthly view mode enabled for ACCOUNTS/INVOICE role');
      }

      handleEmployeeChange(prepopulatedEmployee.userId, (projectsData) => {
        // Auto-select the first project if available
        if (projectsData.length > 0) {
          const firstProject = projectsData[0];
          const projectName = firstProject.projectName || firstProject;
          console.log('Auto-selecting project:', projectName);
          setSelectedProject(projectName);

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
      if (window.history.state && window.history.state.usr) {
        window.history.replaceState({ ...window.history.state, usr: {} }, '');
      }
    };
  }, []);


  useEffect(() => {
    if ((role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE" || role === "ADMIN") && selectedEmployee) {
      setSelectedProject('');
      setCurrentTimesheet(null);
      setEmployeeProjects([]);
    }
  }, [selectedEmployee, role]);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const monthlyViewParam = urlParams.get('monthlyView');

    if ((role === 'ACCOUNTS' || role === 'ADMIN') && monthlyViewParam === 'true') {
      setMonthlyViewMode(true);
      if (selectedEmployee) {
        fetchMonthlyTimesheetData(selectedEmployee);
      }
    }
  }, [role, selectedEmployee, window.location.search]);


  const handleEmployeeChange = async (employeeId, callback) => {
    console.log('Employee changed to:', employeeId);
    if (navigationSource !== 'url' && navigationSource !== 'state') {
      setSelectedProject('');
      setCurrentTimesheet(null);
      setAttachments([]);
      setPendingAttachments([]);
      setHasUnsavedChanges(false);
      setMonthlyTimesheetData([]);
      setCurrentMonthWeeks([]);
    }

    if (isCreateMode || isAddingNewTimesheet) {
      setTempEmployeeForAdd(employeeId);
      setSelectedEmployee(employeeId);
      setMonthlyViewMode(false);
    } else {
      setSelectedEmployee(employeeId);
      if (role === 'ACCOUNTS' || role === 'ADMIN') {
        setMonthlyViewMode(true);
        console.log('Setting monthly view for ACCOUNTS/INVOICE role');
      } else {
        setMonthlyViewMode(false);
      }
    }

    if (employeeId && (role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE" || role === "ADMIN")) {
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
        } else if (monthlyViewMode && (role === 'ACCOUNTS' || role === 'ADMIN') && !isCreateMode && !isAddingNewTimesheet) {

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
        setEmployeeProjects([]);
        const errorMessage = extractErrorMessage(error);
        ToastService.error(errorMessage || 'Failed to fetch employee projects');
      } finally {
        setLoadingEmployeeProjects(false);
      }
    }
  };

  useEffect(() => {
    if (prepopulatedEmployee && (role === 'ACCOUNTS' || role === 'ADMIN')) {
      console.log('Prepopulating employee for monthly view:', prepopulatedEmployee);
      handleEmployeeChange(prepopulatedEmployee.userId, handleProjectPrepopulation);

      setMonthlyViewMode(true);
      const currentDate = new Date();
      setCalendarValue(currentDate);
      setPrepopulatedEmployee(null);

      if (window.location.search.includes('prepopulate')) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [prepopulatedEmployee, role]);

  useEffect(() => {
    const handlePrepopulation = async () => {
      if (!prepopulatedEmployee || !(role === 'ACCOUNTS' || role === 'ADMIN')) {
        setIsInitialLoad(false);
        return;
      }
      try {
        setSelectedEmployee(prepopulatedEmployee.userId);

        if (prepopulatedEmployee.monthStart && prepopulatedEmployee.monthEnd) {
          const monthRange = {
            start: prepopulatedEmployee.monthStart,
            end: prepopulatedEmployee.monthEnd
          };
          setSelectedMonthRange(monthRange);
        }

        if (prepopulatedEmployee.selectedMonth !== undefined && prepopulatedEmployee.selectedYear !== undefined) {
          const targetDate = new Date(prepopulatedEmployee.selectedYear, prepopulatedEmployee.selectedMonth, 1);
          setCalendarValue(targetDate);
        }

        if (!selectedMonthRange && prepopulatedEmployee.selectedMonth !== undefined && prepopulatedEmployee.selectedYear !== undefined) {
          const selectedDate = new Date(prepopulatedEmployee.selectedYear, prepopulatedEmployee.selectedMonth, 1);
          setCalendarValue(selectedDate);
        }

        setLoadingEmployeeProjects(true);

        const response = await httpService.get(`/timesheet/vendors/${prepopulatedEmployee.userId}`);

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

        if (projectsData.length > 0) {
          const firstProject = projectsData[0];
          const projectName = firstProject.projectName || firstProject;
          console.log('Auto-selecting project:', projectName);
          setSelectedProject(projectName);

          setTimeout(async () => {
            console.log('Fetching monthly data for prepopulated employee with selectedMonthRange:', selectedMonthRange);
            await fetchMonthlyTimesheetData(prepopulatedEmployee.userId);
          }, 100);
        }

        setPrepopulatedEmployee(null);
        setNavigationSource('');

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
      setSelectedProject(projectName);

      const currentWeek = getCurrentWeek();
      setSelectedWeekStart(currentWeek.startString);
      setCalendarValue(new Date(currentWeek.startString));
      setHighlightedWeek(getWeekDatesArray(new Date(currentWeek.startString)));
    }
  };

  const CustomDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;

    const isHighlighted = highlightedWeek.some(
      (weekDay) =>
        weekDay.toISOString().split('T')[0] === day.toISOString().split('T')[0]
    );

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

  useEffect(() => {
    if (selectedProject && !selectedWeekStart) {
      const weekInfo = getWeekDates(calendarValue);
      const currentWeek = getCurrentWeek();
      setSelectedWeekStart(weekInfo.startString);
      setCalendarValue(new Date(currentWeek.startString));
      setHighlightedWeek(getWeekDatesArray(new Date(currentWeek.startString)));
    }
  }, [selectedProject]);

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
      if ((role === 'ACCOUNTS' || role === 'ADMIN') && selectedEmployee && timesheetData.length > 0) {
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
    if (monthlyViewMode && selectedEmployee && (role === 'ACCOUNTS' || role === 'ADMIN')) {
      // Only fetch if we don't have selectedMonthRange (manual calendar change)
      if (!selectedMonthRange) {
        fetchMonthlyTimesheetData(selectedEmployee);
      } else {
        console.log('Calendar month changed but selectedMonthRange exists, skipping auto-refresh');
      }
    } else if (selectedProject && selectedWeekStart && currentTimesheet) {
      console.log('Calendar month changed, refreshing weekly data');
      fetchOrCreateTimesheet();
    }
  }, [calendarValue.getMonth(), calendarValue.getFullYear()]);

 // Complete fetchOrCreateTimesheet function with fix
const fetchOrCreateTimesheet = async () => {
  if (!selectedProject || !selectedWeekStart) return;

  if (isCreateMode || isAddingNewTimesheet) {
    const employeeId = tempEmployeeForAdd || selectedEmployee;
    if (employeeId && selectedProject) {
      setLoading(true);
      try {
        let resultAction;
        if (role === 'EXTERNALEMPLOYEE' || isCreateMode || isAddingNewTimesheet) {
          const selectedDate = new Date(calendarValue);
          const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
          const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

          const monthStartStr = formatDateToYMD(monthStart);
          const monthEndStr = formatDateToYMD(monthEnd);

          resultAction = await dispatch(fetchTimesheetsByUserIdWithDateRange({
            userId: employeeId,
            monthStart: monthStartStr,
            monthEnd: monthEndStr
          }));
          ToastService.info('Fetching timesheets for the selected month range');
        } else {
          resultAction = await dispatch(fetchTimesheetsByUserId(employeeId));
        }

        if (fetchTimesheetsByUserId.fulfilled.match(resultAction) || fetchTimesheetsByUserIdWithDateRange.fulfilled.match(resultAction)) {
          const response = resultAction.payload;
          const timesheetData = role === 'EXTERNALEMPLOYEE' || isCreateMode || isAddingNewTimesheet ?
            (response?.data?.timesheets || []) :
            (response?.data || []);

          console.log('🔍 Existing timesheets found:', timesheetData.length);
          ToastService.info(`Found ${timesheetData.length} existing timesheets for the employee`);

          const timesheetsArray = Array.isArray(timesheetData) ? timesheetData : [];
          
          // CRITICAL FIX: Find timesheet by checking if any date in the timesheet falls within the selected week
          const weekStart = new Date(selectedWeekStart);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          console.log('🔍 Looking for timesheet overlapping with week:', {
            weekStart: formatDateToYMD(weekStart),
            weekEnd: formatDateToYMD(weekEnd),
            selectedProject
          });

          const existingTimesheet = timesheetsArray.find(ts => {
            const tsWeekStart = new Date(ts.weekStartDate);
            const tsWeekEnd = new Date(ts.weekEndDate);
            const hasProjectEntries = ts.workingEntries?.some(entry => entry.project === selectedProject) ||
                                     ts.nonWorkingEntries?.some(entry => entry.project === selectedProject);
            
            // Check if there's any overlap between the timesheet's date range and selected week
            const hasOverlap = (tsWeekStart <= weekEnd && tsWeekEnd >= weekStart);
            
            console.log('  Checking timesheet:', {
              id: ts.timesheetId,
              tsRange: `${formatDateToYMD(tsWeekStart)} - ${formatDateToYMD(tsWeekEnd)}`,
              hasOverlap,
              hasProjectEntries
            });
            
            return hasOverlap && hasProjectEntries;
          });

          const totalWorkingHours = response?.data?.totalWorkingHours || 0;
          setMonthlyTotalWorkingHoursForEmployee(totalWorkingHours);

          if (existingTimesheet) {
            console.log(" Timesheet found, transforming with current calendar month:", existingTimesheet.timesheetId);
            
            // CRITICAL FIX: Always pass current calendarValue to transform function
            const transformed = transformTimesheet(existingTimesheet, calendarValue);
            const safeTransformed = { ...getEmptyTimesheet(selectedProject), ...transformed };
            
            console.log(' Transformed result:', safeTransformed);
            
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

            ToastService.success('Existing timesheet found for this week and project');
          } else {
            console.log(" No existing timesheet found, creating new empty timesheet");
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
        }
      } catch (error) {
        console.error("Error checking existing timesheets in create mode:", error);
        const errorMessage = extractErrorMessage(error);
        ToastService.error(errorMessage);
        setMonthlyTotalWorkingHoursForEmployee(0);
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
      return;
    }
  }

  if ((role === 'ACCOUNTS' || role === 'ADMIN') && !isCreateMode && !isAddingNewTimesheet) {
    console.log('Using monthly view for ACCOUNTS/ADMIN role');
    await fetchMonthlyTimesheetData(selectedEmployee || userId);
    return;
  }

  const isMonthlyView = (role === 'ACCOUNTS' || role === 'ADMIN') && !isCreateMode && !isAddingNewTimesheet;

  if (isMonthlyView) {
    setLoading(true);
    try {
      const targetUserId = selectedEmployee || userId;
      const selectedDate = new Date(calendarValue);
      const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const monthStartStr = formatDateToYMD(monthStart);
      const monthEndStr = formatDateToYMD(monthEnd);

      const resultAction = await dispatch(fetchTimesheetsByUserIdWithDateRange({
        userId: targetUserId,
        monthStart: monthStartStr,
        monthEnd: monthEndStr
      }));

      if (fetchTimesheetsByUserIdWithDateRange.fulfilled.match(resultAction)) {
        const response = resultAction.payload;
        const timesheetData = response?.data?.timesheets || [];
        setTimeSheetData(timesheetData);

        const weeks = getWeeksInMonth(calendarValue);
        setCurrentMonthWeeks(weeks);

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
        ToastService.info('Monthly timesheet data loaded');
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

  setLoading(true);
  try {
    const targetUserId = selectedEmployee || userId;

    let resultAction;
    if (role === 'EXTERNALEMPLOYEE') {
      const selectedDate = new Date(calendarValue);
      const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const monthStartStr = formatDateToYMD(monthStart);
      const monthEndStr = formatDateToYMD(monthEnd);

      console.log('🔍 Fetching timesheets for month:', { monthStartStr, monthEndStr });

      resultAction = await dispatch(fetchTimesheetsByUserIdWithDateRange({
        userId: targetUserId,
        monthStart: monthStartStr,
        monthEnd: monthEndStr
      }));
    } else {
      resultAction = await dispatch(fetchTimesheetsByUserId(targetUserId));
    }

    if (fetchTimesheetsByUserId.fulfilled.match(resultAction) || fetchTimesheetsByUserIdWithDateRange.fulfilled.match(resultAction)) {
      const response = resultAction.payload;
      const timesheetData = role === 'EXTERNALEMPLOYEE' ?
        (response?.data?.timesheets || []) :
        (response?.data || []);

      console.log('📦 Weekly timesheet data received:', timesheetData.length, 'timesheets');
      ToastService.success(`Fetched timesheets successfully`);
      
      const totalWorkingHours = response?.data?.totalWorkingHours || 0;
      setMonthlyTotalWorkingHoursForEmployee(totalWorkingHours);
      setTimeSheetData(timesheetData);

      let existingTimesheet = null;

      if (response?.success && timesheetData) {
        const timesheetsArray = Array.isArray(timesheetData) ? timesheetData : [];

        // CRITICAL FIX: Find timesheet by checking if any date in the timesheet overlaps with the selected week
        const weekStart = new Date(selectedWeekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        console.log('🔍 Looking for timesheet overlapping with week:', {
          weekStart: formatDateToYMD(weekStart),
          weekEnd: formatDateToYMD(weekEnd),
          selectedProject
        });

        existingTimesheet = timesheetsArray.find(ts => {
          const tsWeekStart = new Date(ts.weekStartDate);
          const tsWeekEnd = new Date(ts.weekEndDate);
          const hasProjectEntries = ts.workingEntries?.some(entry => entry.project === selectedProject) ||
                                   ts.nonWorkingEntries?.some(entry => entry.project === selectedProject);
          
          // Check if there's any overlap between the timesheet's date range and selected week
          const hasOverlap = (tsWeekStart <= weekEnd && tsWeekEnd >= weekStart);
          
          console.log('  Checking timesheet:', {
            id: ts.timesheetId,
            tsRange: `${formatDateToYMD(tsWeekStart)} - ${formatDateToYMD(tsWeekEnd)}`,
            hasOverlap,
            hasProjectEntries,
            project: selectedProject
          });
          
          return hasOverlap && hasProjectEntries;
        });
      }

      if (existingTimesheet) {
        console.log("✅ Existing timesheet found:", existingTimesheet.timesheetId);
        console.log("📅 Transforming with calendar month:", calendarValue.toISOString());
        ToastService.info('Existing timesheet loaded for the selected week and project');
        
        // CRITICAL FIX: Always pass current calendarValue to transform function
        const transformed = transformTimesheet(existingTimesheet, calendarValue);
        const safeTransformed = { ...getEmptyTimesheet(selectedProject), ...transformed };
        
        console.log('📊 Final transformed data:', {
          id: safeTransformed.id,
          status: safeTransformed.status,
          monday: safeTransformed.monday,
          tuesday: safeTransformed.tuesday,
          wednesday: safeTransformed.wednesday,
          thursday: safeTransformed.thursday,
          friday: safeTransformed.friday
        });
        
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
        console.log(" No existing timesheet found, creating new one");
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

// Updated transformTimesheet function with better logging
const transformTimesheet = (apiTimesheet, currentCalendarMonth) => {
  console.log('🟢 ========== TRANSFORM TIMESHEET START ==========');
  console.log('📥 Input:', {
    timesheetId: apiTimesheet?.timesheetId,
    weekStartDate: apiTimesheet?.weekStartDate,
    weekEndDate: apiTimesheet?.weekEndDate,
    currentCalendarMonth: currentCalendarMonth.toISOString(),
    selectedWeekStart,
    selectedProject,
    workingEntriesCount: apiTimesheet?.workingEntries?.length || 0,
    nonWorkingEntriesCount: apiTimesheet?.nonWorkingEntries?.length || 0
  });

  if (!apiTimesheet) {
    console.log('❌ No timesheet provided');
    return null;
  }

  const currentMonth = currentCalendarMonth.getMonth();
  const currentYear = currentCalendarMonth.getFullYear();

  console.log('📅 Current calendar context:', {
    month: currentMonth + 1,
    year: currentYear
  });

  // Generate week dates based on selectedWeekStart
  const actualWeekStart = new Date(selectedWeekStart);
  const weekDates = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(actualWeekStart);
    date.setDate(actualWeekStart.getDate() + i);
    weekDates.push(date);
  }
  
  console.log(' Week dates generated:', weekDates.map(d => formatDateToYMD(d)));

  // Create day-to-date mappings
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayToDateMap = {};
  const dateToDayMap = {};
  
  days.forEach((day, index) => {
    const date = weekDates[index];
    const dateStr = formatDateToYMD(date);
    dayToDateMap[day] = date;
    dateToDayMap[dateStr] = day;
  });

  console.log(' Date-to-Day mapping created:', dateToDayMap);

  // Calculate status based on current month entries
  let currentMonthStatus = 'DRAFT';
  const hasAnyEntriesInCurrentMonth = apiTimesheet.workingEntries?.some(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === currentMonth && 
           entryDate.getFullYear() === currentYear &&
           entry.project === selectedProject;
  }) || apiTimesheet.nonWorkingEntries?.some(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === currentMonth && 
           entryDate.getFullYear() === currentYear;
  });

  if (hasAnyEntriesInCurrentMonth && apiTimesheet.status && apiTimesheet.status !== 'DRAFT') {
    currentMonthStatus = apiTimesheet.status;
  } else if (hasAnyEntriesInCurrentMonth) {
    currentMonthStatus = 'DRAFT';
  }

  console.log('📊 Status:', {
    apiStatus: apiTimesheet.status,
    hasEntriesInCurrentMonth: hasAnyEntriesInCurrentMonth,
    calculatedStatus: currentMonthStatus
  });

  const submitted = (currentMonthStatus === 'SUBMITTED' ||
    currentMonthStatus === 'APPROVED' ||
    currentMonthStatus === 'PENDING_APPROVAL') && !isEditMode;
  setIsSubmitted(submitted);

  const transformed = {
    id: apiTimesheet.timesheetId || null,
    userId: apiTimesheet.userId || userId,
    project: selectedProject,
    timesheetType: apiTimesheet.timesheetType || 'WEEKLY',
    status: currentMonthStatus,
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
    isEditable: isEditMode || (!submitted && (currentMonthStatus === 'DRAFT' || !currentMonthStatus)),
    percentageOfTarget: apiTimesheet.percentageOfTarget || 0,
    dayStatuses: {
      monday: 'Working', tuesday: 'Working', wednesday: 'Working',
      thursday: 'Working', friday: 'Working', saturday: 'Working', sunday: 'Working'
    },
    sickLeave: {
      monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
      friday: 0, saturday: 0, sunday: 0
    },
    companyHoliday: {
      monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
      friday: 0, saturday: 0, sunday: 0
    },
    clientName: apiTimesheet.clientName || '',
    approver: apiTimesheet.approver || ''
  };

  const daysWithNonWorkingData = new Set();

  // Process non-working entries
  console.log(' Processing', apiTimesheet.nonWorkingEntries?.length || 0, 'non-working entries');
  if (apiTimesheet.nonWorkingEntries) {
    apiTimesheet.nonWorkingEntries.forEach((entry, idx) => {
      const entryDateStr = entry.date;
      const dayName = dateToDayMap[entryDateStr];
      
      console.log(`  [${idx + 1}]`, {
        date: entryDateStr,
        dayName: dayName || 'NOT IN WEEK',
        hours: entry.hours,
        description: entry.description
      });
      
      if (dayName) {
        const entryDate = new Date(entry.date);
        const isInCurrentMonth = entryDate.getMonth() === currentMonth && 
                                 entryDate.getFullYear() === currentYear;
        
        console.log(`      → In current month: ${isInCurrentMonth}`);
        
        if (isInCurrentMonth) {
          const hours = parseFloat(entry.hours) || 0;
          const desc = entry.description?.toLowerCase() || '';
          
          if (desc.includes('sick leave')) {
            transformed.sickLeave[dayName] = hours;
            daysWithNonWorkingData.add(dayName);
            console.log(`       Set ${hours}h sick leave for ${dayName}`);
          } else if (desc.includes('holiday')) {
            transformed.companyHoliday[dayName] = hours;
            daysWithNonWorkingData.add(dayName);
            console.log(`       Set ${hours}h holiday for ${dayName}`);
          }
        }
      }
    });
  }

  // Process working entries
  console.log('🔄 Processing', apiTimesheet.workingEntries?.length || 0, 'working entries');
  if (apiTimesheet.workingEntries) {
    apiTimesheet.workingEntries.forEach((entry, idx) => {
      const entryDateStr = entry.date;
      const dayName = dateToDayMap[entryDateStr];
      
      console.log(`  [${idx + 1}]`, {
        date: entryDateStr,
        dayName: dayName || 'NOT IN WEEK',
        hours: entry.hours,
        project: entry.project
      });
      
      if (dayName && entry.project === selectedProject) {
        const entryDate = new Date(entry.date);
        const isInCurrentMonth = entryDate.getMonth() === currentMonth && 
                                 entryDate.getFullYear() === currentYear;
        
        console.log(`      → In current month: ${isInCurrentMonth}, Has non-working: ${daysWithNonWorkingData.has(dayName)}`);
        
        if (isInCurrentMonth && !daysWithNonWorkingData.has(dayName)) {
          const hours = parseFloat(entry.hours) || 0;
          transformed[dayName] = hours;
          console.log(`       Set ${hours}h working for ${dayName}`);
        }
      }
    });
  }

  // Set defaults for empty days
  if (currentMonthStatus === 'DRAFT' || (currentMonthStatus === 'REJECTED' && !isEditMode)) {
    console.log(' Setting default hours for DRAFT/REJECTED status');
    days.forEach(day => {
      const dayDate = dayToDateMap[day];
      const isInCurrentMonth = dayDate && 
        dayDate.getMonth() === currentMonth && 
        dayDate.getFullYear() === currentYear;

      if (isInCurrentMonth && 
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day) &&
          !daysWithNonWorkingData.has(day) && 
          transformed[day] === 0) {
        
        const dayDateStr = formatDateToYMD(dayDate);
        const hasEntry = apiTimesheet.workingEntries?.some(e => e.date === dayDateStr && e.project === selectedProject) ||
                        apiTimesheet.nonWorkingEntries?.some(e => e.date === dayDateStr);

        if (!hasEntry) {
          transformed[day] = 8;
          console.log(`   Set default 8h for ${day}`);
        }
      }
    });
  }

  transformed.percentageOfTarget = calculatePercentage(transformed);
  setNotes(transformed.notes);

  console.log(' ========== TRANSFORM COMPLETE ==========');
  console.log(' Output hours:', {
    monday: transformed.monday,
    tuesday: transformed.tuesday,
    wednesday: transformed.wednesday,
    thursday: transformed.thursday,
    friday: transformed.friday,
    saturday: transformed.saturday,
    sunday: transformed.sunday
  });

  return transformed;
};

  useEffect(() => {
    if ((role === 'ACCOUNTS' || role === 'ADMIN') && selectedEmployee && !isCreateMode && !isAddingNewTimesheet) {
      console.log('Auto-enabling monthly view for ACCOUNTS/INVOICE role');
      setMonthlyViewMode(true);
      if (selectedEmployee && calendarValue && !loading) {
        fetchMonthlyTimesheetData(selectedEmployee);
      }
    } else if (role !== 'ACCOUNTS' && role !== 'ADMIN') {
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
    // This ensures refresh button uses the correct month range
    if (selectedMonthRange && selectedMonthRange.start && selectedMonthRange.end) {
      monthStartStr = selectedMonthRange.start;
      monthEndStr = selectedMonthRange.end;
      console.log('Using selectedMonthRange for API call:', selectedMonthRange);
    } else {
      // Fallback to calendar value only if no selectedMonthRange
      const selectedDate = new Date(calendarValue);
      const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      monthStartStr = formatDateToYMD(monthStart);
      monthEndStr = formatDateToYMD(monthEnd);
      console.log('Using calendar value for month range (fallback):', { monthStartStr, monthEndStr });
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

      setTimeSheetData(timesheetData);

      const targetDate = selectedMonthRange && selectedMonthRange.start
        ? new Date(selectedMonthRange.start)
        : new Date(calendarValue);

      const weeks = getWeeksInMonth(targetDate);
      setCurrentMonthWeeks(weeks);

      const monthlyData = weeks.map(week => {
        // FIX: Check if any timesheet overlaps with this week using both start and end dates
        const weekTimesheet = timesheetData.find(ts => {
          const tsWeekStart = new Date(ts.weekStartDate);
          const tsWeekEnd = new Date(ts.weekEndDate);
          const weekStart = new Date(week.startString);
          const weekEnd = new Date(week.endString);
          
          // Check if the timesheet week overlaps with the calendar week
          const hasOverlap = (tsWeekStart <= weekEnd && tsWeekEnd >= weekStart);
          const hasProject = !selectedProject || ts.workingEntries?.some(entry => entry.project === selectedProject);
          
          return hasOverlap && hasProject;
        });

        return {
          ...week,
          timesheet: weekTimesheet ? transformTimesheetForMonthlyView(weekTimesheet, targetDate) : null,
          hasData: !!weekTimesheet,
          status: weekTimesheet?.status || 'NO_DATA'
        };
      });

      console.log('Processed monthly data with correct date range:', monthlyData);
      setMonthlyTimesheetData(monthlyData);
      ToastService.success('Monthly timesheet data loaded successfully');

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

  const currentMonth = currentCalendarMonth.getMonth();
  const currentYear = currentCalendarMonth.getFullYear();

  // Use the actual weekStartDate and weekEndDate from API
  const weekStart = new Date(apiTimesheet.weekStartDate);
  const weekEnd = new Date(apiTimesheet.weekEndDate);
  
  // Generate dates based on the actual range from API
  const weekDates = [];
  const currentDate = new Date(weekStart);
  
  while (currentDate <= weekEnd) {
    weekDates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Filter to only dates in the current calendar month
  const currentMonthDates = weekDates.filter(date =>
    date.getMonth() === currentMonth && date.getFullYear() === currentYear
  );

  // Check if this timesheet has ANY overlap with current month
  const hasOverlapWithCurrentMonth = currentMonthDates.length > 0;

  // If no overlap with current month, return null
  if (!hasOverlapWithCurrentMonth) {
    console.log('No overlap with current month:', {
      weekStart: apiTimesheet.weekStartDate,
      weekEnd: apiTimesheet.weekEndDate,
      currentMonth: currentMonth + 1,
      currentYear,
      currentMonthDatesCount: currentMonthDates.length
    });
    return null;
  }

  // Get ALL entries (working + non-working) for the CURRENT MONTH only
  const currentMonthEntries = [
    ...(apiTimesheet.workingEntries || []),
    ...(apiTimesheet.nonWorkingEntries || [])
  ].filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === currentMonth &&
      entryDate.getFullYear() === currentYear;
  });

  // If no entries for current month, return null
  if (currentMonthEntries.length === 0) {
    console.log('No entries for current month:', {
      weekStart: apiTimesheet.weekStartDate,
      weekEnd: apiTimesheet.weekEndDate, 
      currentMonth: currentMonth + 1,
      currentMonthEntriesCount: currentMonthEntries.length
    });
    return null;
  }

  // Calculate status independently for each month
  const datesWithEntries = new Set();
  currentMonthEntries.forEach(entry => {
    const entryDate = new Date(entry.date);
    datesWithEntries.add(entryDate.toISOString().split('T')[0]);
  });

  // Check if we have entries for all weekdays in current month portion
  const currentMonthWeekdays = currentMonthDates.filter(date => {
    const day = date.getDay();
    return day !== 0 && day !== 6; // Exclude Sunday (0) and Saturday (6)
  });

  const allWeekdaysHaveEntries = currentMonthWeekdays.every(date =>
    datesWithEntries.has(date.toISOString().split('T')[0])
  );

  // Check if ALL current month entries have hours > 0
  const allEntriesHaveHours = currentMonthEntries.every(entry =>
    parseFloat(entry.hours) > 0
  );

  let currentMonthStatus = 'DRAFT';

  if (apiTimesheet.status &&
    (apiTimesheet.status === 'PENDING_APPROVAL' ||
      apiTimesheet.status === 'APPROVED' ||
      apiTimesheet.status === 'SUBMITTED') &&
    allWeekdaysHaveEntries &&
    allEntriesHaveHours) {
    currentMonthStatus = apiTimesheet.status;
  } else {
    currentMonthStatus = 'DRAFT';
  }

  console.log('Monthly view status calculation:', {
    timesheetId: apiTimesheet.timesheetId,
    weekStart: apiTimesheet.weekStartDate,
    weekEnd: apiTimesheet.weekEndDate,
    currentMonth: currentMonth + 1,
    currentYear,
    weekDatesCount: weekDates.length,
    currentMonthDates: currentMonthDates.length,
    currentMonthEntries: currentMonthEntries.length,
    allWeekdaysHaveEntries,
    allEntriesHaveHours,
    overallStatus: apiTimesheet.status,
    calculatedStatus: currentMonthStatus
  });

  const transformed = {
    id: apiTimesheet.timesheetId || null,
    userId: apiTimesheet.userId || userId,
    project: selectedProject || (apiTimesheet.workingEntries?.[0]?.project) || '',
    timesheetType: apiTimesheet.timesheetType || 'MONTHLY',
    status: currentMonthStatus,
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
    isEditable: false,
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
  };

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Process working entries - ONLY for current month
  if (apiTimesheet.workingEntries) {
    apiTimesheet.workingEntries.forEach(entry => {
      const entryDate = new Date(entry.date);

      // Only process if entry is in current calendar month
      if (entryDate.getMonth() !== currentMonth || entryDate.getFullYear() !== currentYear) {
        return;
      }

      const dayOfWeek = entryDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayName = days[dayOfWeek];
      const hours = parseFloat(entry.hours) || 0;

      if (dayName && entry.project === (selectedProject || transformed.project)) {
        transformed[dayName] = hours;
      }
    });
  }

  // Process non-working entries - ONLY for current month
  if (apiTimesheet.nonWorkingEntries) {
    apiTimesheet.nonWorkingEntries.forEach(entry => {
      const entryDate = new Date(entry.date);

      // Only process if entry is in current calendar month
      if (entryDate.getMonth() !== currentMonth || entryDate.getFullYear() !== currentYear) {
        return;
      }

      const dayOfWeek = entryDate.getDay();
      const dayName = days[dayOfWeek];
      const hours = parseFloat(entry.hours) || 0;
      const description = entry.description?.toLowerCase() || '';

      if (dayName) {
        if (description.includes('sick leave')) {
          transformed.sickLeave[dayName] = hours;
        } else if (description.includes('company holiday') || description.includes('holiday')) {
          transformed.companyHoliday[dayName] = hours;
        }
      }
    });
  }

  return transformed;
};

  const isFridayInPresentWeek = () => {
    if (!selectedWeekStart || !isPresentWeek(selectedWeekStart)) return false;

    const today = new Date();
    return today.getDay() === 5;
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

    if (timesheet.status === 'PENDING_APPROVAL') {
      return false;
    }

    // FIFTH: For APPROVED status, fields should be read-only
    if (timesheet.status === 'APPROVED') {
      return false; // Not editable, but data will still be shown
    }

    // SIXTH: For admin roles, allow editing of DRAFT timesheets
    if ((role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "ADMIN") && timesheet.status === 'DRAFT') {
      return true;
    }

    // SEVENTH: For EXTERNALEMPLOYEE, check if timesheet is editable and not submitted
    if (role === 'EXTERNALEMPLOYEE') {
      // Only allow editing if status is DRAFT or null/undefined
      const isDraftOrNew = !timesheet.status || timesheet.status === 'DRAFT';
      return isDraftOrNew && timesheet.isEditable !== false;
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

    return false; // Default to non-editable for safety
  };

  const handleHourChange = (day, value, type = 'regular') => {
    // FIRST CHECK: Always block Saturday and Sunday regardless of any other conditions
    if (day === 'saturday' || day === 'sunday') {
      ToastService.error('Weekend hours cannot be entered');
      return;
    }

    if (!currentTimesheet) return;

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
    const targetUserId = employeeId || selectedEmployee || userId

    const newTimesheet = {
      id: null,
      userId: targetUserId,
      project: selectedProject,
      status: 'DRAFT',
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

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    days.forEach(day => {
      const dayDate = getDateForDay(selectedWeekStart, day);
      const isInCalendarMonth = dayDate ? isDateInCalendarMonth(dayDate, calendarValue) : false;
      if (isInCalendarMonth) {
        newTimesheet[day] = 8; // Only set default for new timesheets in current month
      } else {
        newTimesheet[day] = 0;
      }
    });

    setCurrentTimesheet(newTimesheet);
    setNotes('');
    setHasUnsavedChanges(false);
    setIsSubmitted(false);

    console.log('New timesheet created for create mode:', newTimesheet);
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

    // Check if this is a rejected timesheet that needs special handling
    const isRejectedTimesheet = currentTimesheet.status === 'REJECTED';
    const shouldForceIncludeDays = isRejectedTimesheet && !isEditMode && !isEdit;

    if (isEditMode || isEdit) {
      console.log("Saving edited timesheet in edit mode:", currentTimesheet.id);
      setLoading(true);

      try {
        const workingHours = getWorkingDaysHours(currentTimesheet);
        const targetUserId = selectedEmployee || userId;

        // Create working entries - for edit mode, process ONLY enabled days
        const workingEntries = [];
        const nonWorkingEntries = [];
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        days.forEach((day, index) => {
          // FIXED: Calculate the correct date for each day based on the selected week start
          const weekStartDate = new Date(selectedWeekStart);
          const dayDate = new Date(weekStartDate);
          dayDate.setDate(weekStartDate.getDate() + index); // Add index to get correct day

          const dateStr = formatDateToYMD(dayDate);

          // Check if this day has any non-working entries
          const hasSickLeave = currentTimesheet.sickLeave && currentTimesheet.sickLeave[day] > 0;
          const hasHoliday = currentTimesheet.companyHoliday && currentTimesheet.companyHoliday[day] > 0;
          const hasAnyNonWorkingEntry = hasSickLeave || hasHoliday;

          // Check if this day is enabled (in current calendar month)
          const isInCalendarMonth = isDateInCalendarMonth(dayDate, calendarValue);

          // FIXED: For rejected timesheets, include all days in current month when in edit mode
          let shouldIncludeDay = isInCalendarMonth;

          if (isRejectedTimesheet && !isEditMode && !isEdit) {
            // For rejected timesheets not in edit mode, only include days with data
            const hasWorkingHours = currentTimesheet[day] > 0;
            shouldIncludeDay = (hasWorkingHours || hasAnyNonWorkingEntry) && isInCalendarMonth;
          }

          // FIXED: Additional check to ensure dates belong to the correct timesheet week
          const weekStart = new Date(selectedWeekStart);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);

          const isInSelectedWeek = dayDate >= weekStart && dayDate <= weekEnd;

          // Only process days that should be included and are in the correct week
          if (shouldIncludeDay && isInSelectedWeek) {
            // CRITICAL FIX: Only add working entry if there's NO non-working entry for this day
            if (!hasAnyNonWorkingEntry && currentTimesheet[day] >= 0 && !['saturday', 'sunday'].includes(day)) {
              workingEntries.push({
                date: dateStr,
                hours: currentTimesheet[day],
                project: selectedProject
              });
            }

            // Sick leave - only if > 0
            if (hasSickLeave) {
              nonWorkingEntries.push({
                date: dateStr,
                hours: currentTimesheet.sickLeave[day],
                description: 'Sick Leave',
                project: selectedProject
              });
            }

            // Company holiday - only if > 0
            if (hasHoliday) {
              nonWorkingEntries.push({
                date: dateStr,
                hours: currentTimesheet.companyHoliday[day],
                description: 'Company Holiday',
                project: selectedProject
              });
            }
          }
        });

        const timesheetPayload = {
          date: selectedWeekStart,
          workingEntries,
          nonWorkingEntries,
          notes: notes || '',
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
            ToastService.success("Timesheet updated successfully");
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

        // Create working entries - ONLY for enabled days
        const workingEntries = [];
        const nonWorkingEntries = [];
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        days.forEach((day, index) => {
          // FIXED: Calculate the correct date for each day based on the selected week start
          const weekStartDate = new Date(selectedWeekStart);
          const dayDate = new Date(weekStartDate);
          dayDate.setDate(weekStartDate.getDate() + index); // Add index to get correct day

          const dateStr = formatDateToYMD(dayDate);

          // Check if this day has any non-working entries
          const hasSickLeave = currentTimesheet.sickLeave && currentTimesheet.sickLeave[day] > 0;
          const hasHoliday = currentTimesheet.companyHoliday && currentTimesheet.companyHoliday[day] > 0;
          const hasAnyNonWorkingEntry = hasSickLeave || hasHoliday;

          // Check if this day is enabled (in current calendar month)
          const isInCalendarMonth = isDateInCalendarMonth(dayDate, calendarValue);

          // For rejected timesheets in create mode, we need to be more permissive
          const shouldIncludeDay = isInCalendarMonth || shouldForceIncludeDays;

          // Only process days that are in the current calendar month (or force include for rejected)
          if (shouldIncludeDay) {
            // CRITICAL FIX: Only add working entry if there's NO non-working entry for this day
            if (!hasAnyNonWorkingEntry && currentTimesheet[day] >= 0 && !['saturday', 'sunday'].includes(day)) {
              workingEntries.push({
                date: dateStr,
                hours: currentTimesheet[day],
                project: selectedProject
              });
            }

            // Sick leave - only if > 0
            if (hasSickLeave) {
              nonWorkingEntries.push({
                date: dateStr,
                hours: currentTimesheet.sickLeave[day],
                description: 'Sick Leave',
                project: selectedProject
              });
            }

            // Company holiday - only if > 0
            if (hasHoliday) {
              nonWorkingEntries.push({
                date: dateStr,
                hours: currentTimesheet.companyHoliday[day],
                description: 'Company Holiday',
                project: selectedProject
              });
            }
          }
        });

        // Validate that we have at least some data (can be 0 hours for all days)
        const hasAnyData = workingEntries.length > 0 || nonWorkingEntries.length > 0;
        if (!hasAnyData) {
          ToastService.error("Cannot save timesheet with no data");
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
            setHasUnsavedChanges(false);

            // IMPORTANT: Update the current timesheet with the new ID
            if (response.data?.timesheetId) {
              setCurrentTimesheet(prev => ({
                ...prev,
                id: response.data.timesheetId,
                status: 'DRAFT' || 'REJECTED'
              }));
            }

            // Update timesheetData immediately with the complete timesheet information
            setTimeSheetData(prevData => {
              const newTimesheetForTable = {
                timesheetId: response.data?.timesheetId,
                userId: targetUserId,
                weekStartDate: selectedWeekStart,
                weekEndDate: getWeekDates(selectedWeekStart).endString,
                status: 'DRAFT',
                project: selectedProject,
                workingEntries: workingEntries,
                nonWorkingEntries: nonWorkingEntries,
                notes: notes || '',
                timesheetType: 'MONTHLY',
                monday: currentTimesheet.monday, // Direct from current state
                tuesday: currentTimesheet.tuesday,
                wednesday: currentTimesheet.wednesday,
                thursday: currentTimesheet.thursday,
                friday: currentTimesheet.friday,
                saturday: currentTimesheet.saturday,
                sunday: currentTimesheet.sunday,
                sickLeave: { ...currentTimesheet.sickLeave },
                companyHoliday: { ...currentTimesheet.companyHoliday },
                id: response.data?.timesheetId,
                startDate: selectedWeekStart,
                endDate: getWeekDates(selectedWeekStart).endString,
                isEditable: true
              };

              // Check if this timesheet already exists in the data
              const existingIndex = prevData.findIndex(ts =>
                ts.timesheetId === newTimesheetForTable.timesheetId ||
                (ts.weekStartDate === selectedWeekStart &&
                  ts.workingEntries?.some(entry => entry.project === selectedProject))
              );

              if (existingIndex >= 0) {
                const updatedData = [...prevData];
                updatedData[existingIndex] = {
                  ...updatedData[existingIndex],
                  ...newTimesheetForTable,
                  monday: currentTimesheet.monday,
                  tuesday: currentTimesheet.tuesday,
                  wednesday: currentTimesheet.wednesday,
                  thursday: currentTimesheet.thursday,
                  friday: currentTimesheet.friday,
                  saturday: currentTimesheet.saturday,
                  sunday: currentTimesheet.sunday,
                  sickLeave: { ...currentTimesheet.sickLeave },
                  companyHoliday: { ...currentTimesheet.companyHoliday }
                };
                return updatedData;
              } else {
                return [...prevData, newTimesheetForTable];
              }
            });

            ToastService.success("Timesheet created successfully");

            if (pendingAttachments.length > 0 && response.data?.timesheetId) {
              console.log("Uploading pending attachments for new timesheet:", pendingAttachments);
              try {
                const filesToUpload = pendingAttachments.map(att => att.file);

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

    const workingHours = getWorkingDaysHours(currentTimesheet);
    const targetUserId = selectedEmployee || userId;

    setLoading(true);
    try {
      // Create working entries - handle rejected timesheets specially
      const workingEntries = [];
      const nonWorkingEntries = [];
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      days.forEach((day, index) => {
        // FIXED: Calculate the correct date for each day based on the selected week start
        const weekStartDate = new Date(selectedWeekStart);
        const dayDate = new Date(weekStartDate);
        dayDate.setDate(weekStartDate.getDate() + index); // Add index to get correct day

        const dateStr = formatDateToYMD(dayDate);

        // Check if this day has any non-working entries
        const hasSickLeave = currentTimesheet.sickLeave && currentTimesheet.sickLeave[day] > 0;
        const hasHoliday = currentTimesheet.companyHoliday && currentTimesheet.companyHoliday[day] > 0;
        const hasAnyNonWorkingEntry = hasSickLeave || hasHoliday;

        let shouldIncludeDay = false;

        if (isRejectedTimesheet) {
          // FIXED: For rejected timesheets, include days that are in the CURRENT WEEK's month
          const isInCalendarMonth = isDateInCalendarMonth(dayDate, calendarValue);

          // For rejected timesheets in edit mode, include all days in the current week's month
          if (isEditMode || isEdit) {
            shouldIncludeDay = isInCalendarMonth;
          } else {
            // For non-edit mode, use the original logic (only days with data)
            const hasWorkingHours = currentTimesheet[day] > 0;
            shouldIncludeDay = (hasWorkingHours || hasAnyNonWorkingEntry) && isInCalendarMonth;
          }
        } else {
          // For non-rejected timesheets, use normal logic
          const isInCalendarMonth = isDateInCalendarMonth(dayDate, calendarValue);
          const isEditable = isFieldEditable(currentTimesheet, day, null, calendarValue);
          shouldIncludeDay = isInCalendarMonth && isEditable;
        }

        // FIXED: Additional check to ensure dates belong to the correct timesheet week
        // Only include dates that fall within the selected week's date range
        const weekStart = new Date(selectedWeekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // End of the week

        const isInSelectedWeek = dayDate >= weekStart && dayDate <= weekEnd;

        if (shouldIncludeDay && isInSelectedWeek) {
          // CRITICAL FIX: Only add working entry if there's NO non-working entry for this day
          if (!hasAnyNonWorkingEntry && currentTimesheet[day] >= 0 && !['saturday', 'sunday'].includes(day)) {
            workingEntries.push({
              date: dateStr,
              hours: currentTimesheet[day],
              project: selectedProject
            });
          }

          // Sick leave - only if > 0
          if (hasSickLeave) {
            nonWorkingEntries.push({
              date: dateStr,
              hours: currentTimesheet.sickLeave[day],
              description: 'Sick Leave',
              project: selectedProject
            });
          }

          // Company holiday - only if > 0
          if (hasHoliday) {
            nonWorkingEntries.push({
              date: dateStr,
              hours: currentTimesheet.companyHoliday[day],
              description: 'Company Holiday',
              project: selectedProject
            });
          }
        }
      });

      // If it's a rejected timesheet and we have no entries, check if user intended to save
      if (workingEntries.length === 0 && nonWorkingEntries.length === 0) {
        if (isRejectedTimesheet) {
          const hasAnyHours = days.some(day => {
            const weekStartDate = new Date(selectedWeekStart);
            const dayDate = new Date(weekStartDate);
            dayDate.setDate(weekStartDate.getDate() + days.indexOf(day)); // Use indexOf to get correct index

            if (!dayDate) return false;

            const isInCalendarMonth = isDateInCalendarMonth(dayDate, calendarValue);
            if (!isInCalendarMonth) return false;

            const hasWorkingHours = currentTimesheet[day] > 0;
            const hasSickLeave = currentTimesheet.sickLeave && currentTimesheet.sickLeave[day] > 0;
            const hasHoliday = currentTimesheet.companyHoliday && currentTimesheet.companyHoliday[day] > 0;

            return hasWorkingHours || hasSickLeave || hasHoliday;
          });

          if (hasAnyHours) {
            // User entered hours but they're not being included - this is an error
            ToastService.error("Cannot save timesheet - entered hours are not in the current calendar month");
          } else {
            ToastService.error("Cannot save timesheet with no data");
          }
        } else {
          ToastService.error("Cannot save timesheet with no data");
        }
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

        if (!currentTimesheet.id && response.data?.timesheetId) {
          setCurrentTimesheet(prev => ({
            ...prev,
            id: response.data.timesheetId,
            status: 'DRAFT' || 'REJECTED'
          }));
        }

        setTimeSheetData(prevData => {
          const updatedTimesheet = {
            timesheetId: response.data?.timesheetId || currentTimesheet.id,
            userId: targetUserId,
            weekStartDate: selectedWeekStart,
            weekEndDate: getWeekDates(selectedWeekStart).endString,
            status: 'DRAFT' || 'REJECTED',
            project: selectedProject,
            workingEntries: workingEntries,
            nonWorkingEntries: nonWorkingEntries,
            notes: notes || '',
            timesheetType: 'MONTHLY',
            monday: currentTimesheet.monday,
            tuesday: currentTimesheet.tuesday,
            wednesday: currentTimesheet.wednesday,
            thursday: currentTimesheet.thursday,
            friday: currentTimesheet.friday,
            saturday: currentTimesheet.saturday,
            sunday: currentTimesheet.sunday,
            sickLeave: { ...currentTimesheet.sickLeave },
            companyHoliday: { ...currentTimesheet.companyHoliday },
            id: response.data?.timesheetId || currentTimesheet.id,
            startDate: selectedWeekStart,
            endDate: getWeekDates(selectedWeekStart).endString,
            isEditable: true
          };

          const existingIndex = prevData.findIndex(ts =>
            ts.timesheetId === updatedTimesheet.timesheetId ||
            (ts.weekStartDate === selectedWeekStart &&
              ts.workingEntries?.some(entry => entry.project === selectedProject))
          );

          if (existingIndex >= 0) {
            const updatedData = [...prevData];
            updatedData[existingIndex] = {
              ...updatedData[existingIndex],
              ...updatedTimesheet,
              // Force update hour fields
              monday: currentTimesheet.monday,
              tuesday: currentTimesheet.tuesday,
              wednesday: currentTimesheet.wednesday,
              thursday: currentTimesheet.thursday,
              friday: currentTimesheet.friday,
              saturday: currentTimesheet.saturday,
              sunday: currentTimesheet.sunday,
              sickLeave: { ...currentTimesheet.sickLeave },
              companyHoliday: { ...currentTimesheet.companyHoliday }
            };
            return updatedData;
          } else {
            return [...prevData, updatedTimesheet];
          }
        });


        if (!isSubmission && pendingAttachments.length > 0 && response.data?.timesheetId && role === "EXTERNALEMPLOYEE") {
          console.log("Uploading pending attachments:", pendingAttachments);
          try {
            const filesToUpload = pendingAttachments.map(att => att.file);

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

        if (role === 'EXTERNALEMPLOYEE' || isCreateMode || isAddingNewTimesheet) {
          console.log('Force refreshing timesheet data');

          setCurrentTimesheet(null);

          setTimeout(() => {
            fetchOrCreateTimesheet();
          }, 500);

        } else if (monthlyViewMode && (role === 'ACCOUNTS' || role === 'ADMIN')) {

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
    setEmployeeProjects([]); // Clear projects to force refresh

    // Set current week as default
    const currentWeek = getCurrentWeek();
    setSelectedWeekStart(currentWeek.startString);
    setCalendarValue(new Date(currentWeek.startString));
    setHighlightedWeek(getWeekDatesArray(new Date(currentWeek.startString)));
  };


  useEffect(() => {
    if (selectedProject && (isCreateMode || isAddingNewTimesheet) && (tempEmployeeForAdd || selectedEmployee)) {
      if (!selectedWeekStart) {
        const currentWeek = getCurrentWeek();
        setSelectedWeekStart(currentWeek.startString);
        setCalendarValue(new Date(currentWeek.startString));
        setHighlightedWeek(getWeekDatesArray(new Date(currentWeek.startString)));
      } else {
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

  useEffect(() => {
    if ((isCreateMode || isAddingNewTimesheet) && timesheetData.length > 0 && !currentTimesheet) {
      console.log('Timesheet data updated in create mode, setting current timesheet');

      const newTimesheet = timesheetData.find(ts =>
        ts.project === selectedProject &&
        ts.startDate === selectedWeekStart
      );

      if (newTimesheet) {
        setCurrentTimesheet(newTimesheet);
      }
    }
  }, [timesheetData, isCreateMode, isAddingNewTimesheet, selectedProject, selectedWeekStart]);

  const shouldIncludeDates = (timesheet) => {
    const editableRange = getEditableDateRange(timesheet);
    return editableRange !== null;
  };

  const submitWeeklyTimesheetHandler = async () => {
    if (!currentTimesheet) return;
    setSubmitLoading(true);
    try {

      if ((isCreateMode || isAddingNewTimesheet) && hasUnsavedChanges) {
        console.log('Create/Add mode: Saving timesheet before submission');
        await saveTimesheet(false);

        await new Promise(resolve => setTimeout(resolve, 1500));

        if (!currentTimesheet?.id) {
          ToastService.error('Failed to create timesheet. Please try saving again.');
          setLoading(false);
          return;
        }
      }

      if (hasUnsavedChanges && !isCreateMode && !isAddingNewTimesheet) {
        console.log('Saving unsaved changes before submission');
        await saveTimesheet(false);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const timesheetType = currentTimesheet.timesheetType || "MONTHLY";

      console.log(`Submitting ${timesheetType} timesheet`);
      const effectiveTimesheetType = (isCreateMode || isAddingNewTimesheet) ? "MONTHLY" : timesheetType;

      let startDate;
      if (effectiveTimesheetType === "MONTHLY") {
        const selectedDate = new Date(calendarValue);
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        startDate = formatDateToYMD(monthStart);
      } else {
        startDate = selectedWeekStart;
      }
      const actionToDispatch = (isCreateMode || isAddingNewTimesheet)
        ? submitMonthlyTimesheetAction
        : (effectiveTimesheetType === "MONTHLY"
          ? submitMonthlyTimesheetAction
          : submitWeeklyTimesheetAction);

      let submitParams;

      if (effectiveTimesheetType === "MONTHLY") {
        submitParams = {
          userId: selectedEmployee || userId,
          monthStartDate: startDate
        };
      } else {
        submitParams = {
          userId: selectedEmployee || userId,
          weekStart: startDate
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
          const errorMessage = extractErrorMessage(submitResponse);
          ToastService.error(errorMessage);
        }
      } else {
        const errorMessage = extractErrorMessage(resultAction.payload);
        ToastService.error(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage);
    } finally {
      // setLoading(false);
      setSubmitLoading(false);
    }
  };


  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };


  const currentWeekInfo = selectedProject && calendarValue ? getWeekDates(calendarValue) : null;

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const getSelectedProjectDetails = () => {
    if (!selectedProject || !currentTimesheet) return null;
    return {
      name: selectedProject,
      client: currentTimesheet.clientName || 'N/A',
      approver: currentTimesheet.approver || 'N/A',
      location: 'N/A',
      frequency: currentTimesheet.timesheetType || "N/A",
      startDate: currentTimesheet.startDate || 'N/A'
    };
  };

  const getTotalWorkingDays = () => {
    if (!currentTimesheet) return 0;
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      .filter(day => currentTimesheet[day] > 0)
      .length;
  };


  // Updated approval handler that passes all required parameters
  const handleApproveTimesheetWrapper = async (timesheet = null, weekData = null) => {
    const targetTimesheet = timesheet || currentTimesheet;
    await handleApproveTimesheet(
      targetTimesheet,
      weekData,
      monthlyViewMode,
      selectedMonthRange,
      selectedEmployee,
      userId,
      fetchOrCreateTimesheet,
      fetchMonthlyTimesheetData
    );
  };

  // Updated rejection handler that passes all required parameters
  const handleRejectTimesheetWrapper = async (timesheet = null, weekData = null) => {
    const targetTimesheet = timesheet || currentTimesheet;

    await handleRejectTimesheet(
      targetTimesheet,
      weekData,
      monthlyViewMode,
      selectedMonthRange,
      selectedEmployee,
      userId,
      fetchOrCreateTimesheet,
      fetchMonthlyTimesheetData
    );
  };

  const handleUploadAttachmentsWrapper = () => {
    handleUploadAttachments(currentTimesheet, selectedWeekStart, setHasUnsavedChanges);
  };

  const handleRemoveAttachmentWrapper = (attachmentId) => {
    handleRemoveAttachment(attachmentId, currentTimesheet, setHasUnsavedChanges);
  };

  const projectDetails = getSelectedProjectDetails();

  const onBackToTimesheets = () => {
    navigate('/dashboard/timesheetsForAdmins');
  };

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
      // onApprove={handleApproveTimesheet}
      onApprove={handleApproveTimesheetWrapper}
      onReject={openRejectDialog}
      adminActionLoading={adminActionLoading}
      hasUnsavedChanges={hasUnsavedChanges}
      rejectionReason={rejectionReason}
      setRejectionReason={setRejectionReason}
      rejectDialogOpen={rejectDialogOpen}
      setRejectDialogOpen={setRejectDialogOpen}
      uploadDialogOpen={uploadDialogOpen}
      setUploadDialogOpen={setUploadDialogOpen}
      uploading={uploading || uploadLoading}
      handleUploadAttachments={handleUploadAttachmentsWrapper}
      handleFileSelect={handleFileSelect}
      fileInputRef={fileInputRef}
      selectedFiles={selectedFiles}
      setSelectedFiles={setSelectedFiles}
      attachments={attachments}
      handleRemoveAttachment={handleRemoveAttachmentWrapper}
      projectDetails={projectDetails}
      timesheetData={timesheetData || []}
      getWeekDates={getWeekDates}
      getSelectedProjectDetails={getSelectedProjectDetails}
      getTotalWorkingDays={getTotalWorkingDays}
      selectedWeekStart={selectedWeekStart}
      isPresentWeek={isPresentWeek}
      // handleRejectTimesheet={handleRejectTimesheet}
      handleRejectTimesheet={handleRejectTimesheetWrapper}
      formatFileSize={formatFileSize}
      isCreateMode={isCreateMode}
      isAddingNewTimesheet={isAddingNewTimesheet}
      // handleCancelAddTimesheet={handleCancelAddTimesheet}
      handleAddTimesheetClick={handleAddTimesheetClick}
      tempEmployeeForAdd={tempEmployeeForAdd}
      setTempEmployeeForAdd={setTempEmployeeForAdd}
      handleViewAttachments={handleViewAttachments}
      loadingEmployeeProjects={loadingEmployeeProjects}
      handleEmployeeChange={handleEmployeeChange}
      employeeProjects={employeeProjects}
      isEditMode={isEditMode}
      setIsEditMode={setIsEditMode}
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
      submitLoading={submitLoading}
      onBackToTimesheets={onBackToTimesheets}
    />
  );
};

export default Timesheets
