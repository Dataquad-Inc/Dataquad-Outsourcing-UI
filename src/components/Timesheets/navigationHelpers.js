// navigationHelpers.js
/**
 * Navigation helper functions for timesheet management
 */

import dayjs from "dayjs";

import ToastService from "../../Services/toastService";
import httpService from "../../Services/httpService";
import {formatDateToYMD} from './timesheetUtils';

/**
 * Handles navigation to employee timesheet detail page with role-based logic
 * @param {Object} row - The employee row data
 * @param {Function} navigate - React Router navigate function
 * @param {string} userRole - Current user's role
 * @param {string} [basePath='/dashboard/timesheetsForAdmins'] - Base path for navigation
 */
// navigationHelpers.js - Updated handleEmployeeNameClick function

// Update handleEmployeeNameClick function:
export const handleEmployeeNameClick = (row, navigate, role, selectedMonth = null, selectedYear = null) => {
  if (role === 'ACCOUNTS' || role === 'INVOICE') {
    const month = selectedMonth !== null ? selectedMonth : new Date().getMonth();
    const year = selectedYear !== null ? selectedYear : new Date().getFullYear();
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    const monthStartStr = formatDateToYMD(monthStart);
    const monthEndStr = formatDateToYMD(monthEnd);

    const prepopulatedData = {
      userId: row.userId || row.employeeId,
      employeeName: row.employeeName,
      employeeType: row.employeeType,
      clientName: row.clientName,
      enableMonthlyView: true,
      monthStart: monthStartStr,
      monthEnd: monthEndStr,
      selectedMonth: month,
      selectedYear: year,
      timestamp: Date.now(),
      forceRefresh: true
    };

    // Store in localStorage for immediate access
    localStorage.setItem('prepopulatedEmployee', JSON.stringify(prepopulatedData));

    const urlParams = new URLSearchParams({
      prepopulate: 'true',
      employeeId: prepopulatedData.userId,
      employeeName: encodeURIComponent(prepopulatedData.employeeName),
      employeeType: prepopulatedData.employeeType,
      clientName: encodeURIComponent(prepopulatedData.clientName),
      monthStart: monthStartStr,
      monthEnd: monthEndStr,
      selectedMonth: month.toString(),
      selectedYear: year.toString(),
      monthlyView: 'true',
      forceRefresh: 'true'
    });

    navigate(`/dashboard/timesheets?${urlParams.toString()}`, {
      state: {
        prepopulatedEmployee: prepopulatedData,
        monthlyView: true,
        from: '/dashboard/timesheetsForAdmins'
      }
    });
  }
};

/**
 * Handles back navigation from employee detail page
 * @param {Function} navigate - React Router navigate function
 * @param {Object} location - React Router location object
 * @param {string} [defaultPath='/dashboard/timesheetsForAdmins'] - Default back path
 */
export const handleBackNavigation = (navigate, location, defaultPath = '/dashboard/timesheetsForAdmins') => {
  // Use the 'from' state if available, otherwise use default path
  const backPath = location?.state?.from || defaultPath;
  console.log('Navigating back to:', backPath);
  navigate(backPath);
};

/**
 * Fetches employee projects from the API
 * @param {string} userId - Employee user ID
 * @returns {Promise} API response promise
 */
export const fetchEmployeeProjects = async (userId) => {
  try {
    console.log('Fetching projects for user:', userId);
    const response = await httpService.get(`/timesheet/vendors/${userId}`);
    console.log('Projects API response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee projects:', error);
    throw error;
  }
};

/**
 * Utility function to extract and validate employee data from row
 * @param {Object} row - The employee row data
 * @returns {Object} Validated employee data object
 */
export const extractEmployeeData = (row) => {
  const extractedData = {
    userId: row.userId || row.employeeId || null,
    employeeName: row.employeeName || '',
    employeeType: row.employeeType || '',
    clientName: row.clientName || '',
    totalWorkingHours: row.totalWorkingHours || 0,
    totalWorkingDays: row.totalWorkingDays || 0,
    totalLeavesEntitled: row.totalLeavesEntitled || 0,
    totalLeavesSpent: row.totalLeavesSpent || 0,
    timestamp: Date.now()
  };
  
  console.log('Extracted employee data:', extractedData);
  return extractedData;
};

/**
 * Generates timesheet navigation paths with role consideration
 * @param {string} userRole - Current user's role
 * @param {string} userId - Employee user ID
 * @param {string} employeeName - Employee name
 * @param {string} [basePath='/dashboard/timesheetsForAdmins'] - Base path
 * @returns {Object} Navigation paths object
 */
export const generateTimesheetPaths = (userRole, userId, employeeName, basePath = '/dashboard/timesheetsForAdmins') => {
  const encodedName = encodeURIComponent(employeeName);
  
  const paths = {
    employeeDetail: userRole === 'ACCOUNTS' || userRole === "INVOICE" ? '/dashboard/timesheets' : `${basePath}/employee/${userId}`,
    employeeList: basePath,
    addTimesheet: '/dashboard/timesheets',
    shouldRedirectToTimesheets: userRole === 'ACCOUNTS' || userRole === "INVOICE",
    shouldUseMonthlyView: userRole === 'ACCOUNTS' || userRole === "INVOICE"
  };
  
  console.log('Generated timesheet paths for role', userRole, ':', paths);
  return paths;
};


// navigationHelpers.js - Add this function
export const clearAllNavigationState = () => {
  try {
    // Clear all storage locations
    localStorage.removeItem('prepopulatedEmployee');
    sessionStorage.removeItem('prepopulatedEmployee');
    sessionStorage.removeItem('selectedEmployeeData');
    
    // Clear URL parameters if needed
    if (window.location.search.includes('prepopulate')) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
    
    console.log('Cleared all navigation state');
  } catch (error) {
    console.warn('Error clearing navigation state:', error);
  }
};

/**
 * Gets status color for timesheet status
 * @param {string} status - Timesheet status
 * @returns {string} MUI color name
 */
export const getStatusColor = (status) => {
  const statusColors = {
    'APPROVED': 'success',
    'DRAFT': 'warning',
    'PENDING': 'info',
    'PENDING_APPROVAL': 'info',
    'REJECTED': 'error',
    'SUBMITTED': 'info'
  };
  
  const color = statusColors[status?.toUpperCase()] || 'default';
  console.log(`Status color for ${status}:`, color);
  return color;
};

/**
 * Formats date for display
 * @param {string} dateString - Date string
 * @param {string} format - Date format (default: 'MMM DD, YYYY')
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, format = 'MMM DD, YYYY') => {
  if (!dateString) return 'N/A';
  
  try {
    const formattedDate = dayjs(dateString).format(format);
    console.log(`Formatted date ${dateString} to ${formattedDate}`);
    return formattedDate;
  } catch (error) {
    console.warn('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
};

/**
 * Calculates total hours from working entries
 * @param {Array} workingEntries - Array of working entries
 * @returns {number} Total hours
 */
export const calculateTotalHours = (workingEntries) => {
  if (!workingEntries || !Array.isArray(workingEntries)) {
    console.log('No working entries provided for hour calculation');
    return 0;
  }
  
  const total = workingEntries.reduce((total, entry) => {
    const hours = parseFloat(entry.hours) || 0;
    return total + hours;
  }, 0);
  
  console.log(`Calculated total hours: ${total} from ${workingEntries.length} entries`);
  return total;
};

/**
 * Validates timesheet data
 * @param {Object} timesheetData - Timesheet data object
 * @returns {Object} Validation result with isValid and errors
 */
export const validateTimesheetData = (timesheetData) => {
  const errors = [];
  
  if (!timesheetData) {
    errors.push('Timesheet data is required');
  } else {
    if (!timesheetData.employeeName) {
      errors.push('Employee name is required');
    }
    
    if (!timesheetData.userId) {
      errors.push('User ID is required');
    }
    
    if (!timesheetData.weekStartDate && !timesheetData.startDate) {
      errors.push('Start date is required');
    }
    
    if (!timesheetData.weekEndDate && !timesheetData.endDate) {
      errors.push('End date is required');
    }
  }
  
  const isValid = errors.length === 0;
  console.log('Timesheet validation result:', { isValid, errors });
  
  return {
    isValid,
    errors
  };
};

/**
 * Gets current user role from authentication context or storage
 * @returns {string} User role or empty string if not found
 */
export const getCurrentUserRole = () => {
  try {
    // Try to get from localStorage (common approach)
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      const role = user.role || '';
      console.log('Got user role from localStorage:', role);
      return role;
    }
    
    // Try to get from sessionStorage
    const sessionUserData = sessionStorage.getItem('user');
    if (sessionUserData) {
      const user = JSON.parse(sessionUserData);
      const role = user.role || '';
      console.log('Got user role from sessionStorage:', role);
      return role;
    }
    
    console.warn('No user role found in storage');
    return '';
  } catch (error) {
    console.error('Error getting user role:', error);
    return '';
  }
};

/**
 * Clears prepopulated employee data from all storage locations
 * @returns {void}
 */
export const clearPrepopulatedEmployeeData = () => {
  try {
    localStorage.removeItem('prepopulatedEmployee');
    sessionStorage.removeItem('prepopulatedEmployee');
    console.log('Cleared prepopulated employee data from storage');
  } catch (error) {
    console.warn('Error clearing prepopulated employee data:', error);
  }
};

/**
 * Gets prepopulated employee data from various sources
 * @param {Object} location - React Router location object
 * @returns {Object|null} Prepopulated employee data or null
 */
export const getPrepopulatedEmployeeData = (location) => {
  try {
    // First check URL parameters (highest priority)
    const urlParams = new URLSearchParams(window.location.search);
    const shouldPrepopulate = urlParams.get('prepopulate') === 'true';
    
    if (shouldPrepopulate) {
      const employeeData = {
        userId: urlParams.get('employeeId') || '',
        employeeName: decodeURIComponent(urlParams.get('employeeName') || ''),
        employeeType: urlParams.get('employeeType') || '',
        clientName: decodeURIComponent(urlParams.get('clientName') || ''),
        enableMonthlyView: urlParams.get('monthlyView') === 'true',
        forceMonthlyView: urlParams.get('forceMonthly') === 'true',
        autoSelectProject: urlParams.get('autoProject') === 'true',
        source: urlParams.get('source') || 'url'
      };
      
      if (employeeData.userId && employeeData.employeeName) {
        console.log('Found prepopulated data from URL params:', employeeData);
        return employeeData;
      }
    }

    // Then check location state
    if (location.state?.prepopulatedEmployee) {
      console.log('Found prepopulated data from location state:', location.state.prepopulatedEmployee);
      return location.state.prepopulatedEmployee;
    }

    // Then check localStorage as fallback
    const storedEmployee = localStorage.getItem('prepopulatedEmployee');
    if (storedEmployee) {
      const employeeData = JSON.parse(storedEmployee);
      console.log('Found prepopulated data from localStorage:', employeeData);
      return employeeData;
    }

    console.log('No prepopulated employee data found');
    return null;
  } catch (error) {
    console.warn('Error getting prepopulated employee data:', error);
    return null;
  }
};

/**
 * Determines if the current navigation should use monthly view
 * @param {string} userRole - Current user role
 * @param {Object} employeeData - Employee data object
 * @returns {boolean} Whether to use monthly view
 */
export const shouldUseMonthlyView = (userRole, employeeData = null) => {
  const isAccountsOrInvoice = userRole === 'ACCOUNTS' || userRole === 'INVOICE';
  const hasMonthlyViewFlag = employeeData?.enableMonthlyView || employeeData?.forceMonthlyView;
  
  const useMonthlyView = isAccountsOrInvoice && (hasMonthlyViewFlag || true); // Default to true for ACCOUNTS/INVOICE
  console.log('Should use monthly view:', { userRole, hasMonthlyViewFlag, useMonthlyView });
  
  return useMonthlyView;
};