// navigationHelpers.js
/**
 * Navigation helper functions for timesheet management
 */

import dayjs from "dayjs";

import ToastService from "../../Services/toastService";

/**
 * Handles navigation to employee timesheet detail page with role-based logic
 * @param {Object} row - The employee row data
 * @param {Function} navigate - React Router navigate function
 * @param {string} userRole - Current user's role
 * @param {string} [basePath='/dashboard/timesheetsForAdmins'] - Base path for navigation
 */
export const handleEmployeeNameClick = (row, navigate, userRole, basePath = '/dashboard/timesheetsForAdmins') => {
  // If user has ACCOUNTS role, navigate to Timesheets component instead of employee detail
  if (userRole === 'ACCOUNTS') {
    navigate('/dashboard/timesheets');
    ToastService.info('Redirected to timesheets management');
    return;
  }

  // Extract userId with fallback options
  const userId = row.userId || row.employeeId || 'ADRTIN1235';
  
  // Validate required data
  if (!row.employeeName) {
    console.warn('Employee name is missing from row data');
    ToastService.warning('Employee data is incomplete');
    return;
  }

  if (!userId) {
    console.warn('User ID is missing from row data');
    ToastService.warning('Employee ID is missing');
    return;
  }

  // Construct navigation path
  const navigationPath = `${basePath}/employee/${userId}`;
  
  // Navigate with state for back navigation
  navigate(navigationPath, {
    state: { 
      from: basePath,
      employeeData: {
        userId,
        employeeName: row.employeeName,
        employeeType: row.employeeType,
        clientName: row.clientName
      }
    }
  });
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
  navigate(backPath);
};

/**
 * Utility function to extract and validate employee data from row
 * @param {Object} row - The employee row data
 * @returns {Object} Validated employee data object
 */
export const extractEmployeeData = (row) => {
  return {
    userId: row.userId || row.employeeId || null,
    employeeName: row.employeeName || '',
    employeeType: row.employeeType || '',
    clientName: row.clientName || '',
    totalWorkingHours: row.totalWorkingHours || 0,
    totalWorkingDays: row.totalWorkingDays || 0,
    totalLeavesEntitled: row.totalLeavesEntitled || 0,
    totalLeavesSpent: row.totalLeavesSpent || 0
  };
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
  
  return {
    employeeDetail: userRole === 'ACCOUNTS' ? '/dashboard/timesheets' : `${basePath}/employee/${userId}`,
    employeeList: basePath,
    addTimesheet: '/dashboard/timesheets',
    shouldRedirectToTimesheets: userRole === 'ACCOUNTS'
  };
};

/**
 * Gets status color for timesheet status
 * @param {string} status - Timesheet status
 * @returns {string} MUI color name
 */
export const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'APPROVED': return 'success';
    case 'DRAFT': return 'warning';
    case 'PENDING': return 'info';
    case 'REJECTED': return 'error';
    default: return 'default';
  }
};

/**
 * Formats date for display
 * @param {string} dateString - Date string
 * @param {string} format - Date format (default: 'MMM DD, YYYY')
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, format = 'MMM DD, YYYY') => {
  if (!dateString) return 'N/A';
  return dayjs(dateString).format(format);
};

/**
 * Calculates total hours from working entries
 * @param {Array} workingEntries - Array of working entries
 * @returns {number} Total hours
 */
export const calculateTotalHours = (workingEntries) => {
  if (!workingEntries || !Array.isArray(workingEntries)) return 0;
  return workingEntries.reduce((total, entry) => total + (entry.hours || 0), 0);
};

/**
 * Validates timesheet data
 * @param {Object} timesheetData - Timesheet data object
 * @returns {Object} Validation result with isValid and errors
 */
export const validateTimesheetData = (timesheetData) => {
  const errors = [];
  
  if (!timesheetData.employeeName) {
    errors.push('Employee name is required');
  }
  
  if (!timesheetData.userId) {
    errors.push('User ID is required');
  }
  
  if (!timesheetData.weekStartDate || !timesheetData.weekEndDate) {
    errors.push('Week dates are required');
  }
  
  return {
    isValid: errors.length === 0,
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
      return user.role || '';
    }
    
    // Try to get from sessionStorage
    const sessionUserData = sessionStorage.getItem('user');
    if (sessionUserData) {
      const user = JSON.parse(sessionUserData);
      return user.role || '';
    }
    
    return '';
  } catch (error) {
    console.error('Error getting user role:', error);
    return '';
  }
};