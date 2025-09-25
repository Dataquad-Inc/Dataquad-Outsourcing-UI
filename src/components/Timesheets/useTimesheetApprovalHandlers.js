import { useDispatch } from 'react-redux';
import { useState } from 'react';
import {
  approveTimesheet,
  approveTimesheetMonthly,
  rejectTimesheet,
  rejectTimesheetMonthly,
} from '../../redux/timesheetSlice';
import ToastService from '../../Services/toastService';
import { extractErrorMessage } from './timesheetUtils';

// Custom hook for timesheet approval and rejection functionality
export const useTimesheetApprovalHandlers = () => {
  const dispatch = useDispatch();
  
  // State management for approval/rejection
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
   const [currentTimesheet, setCurrentTimesheet] = useState(null);

  // Handle timesheet approval
  const handleApproveTimesheet = async (timesheet = null, weekData = null, monthlyViewMode = false, selectedMonthRange = null, selectedEmployee = null, userId = null, fetchOrCreateTimesheet = null, fetchMonthlyTimesheetData = null) => {
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
            if (selectedEmployee && fetchMonthlyTimesheetData) {
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
            if (fetchOrCreateTimesheet) {
              setTimeout(() => {
                fetchOrCreateTimesheet();
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
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
      const errorMessage = extractErrorMessage(error);
      ToastService.error(errorMessage || 'Failed to approve timesheet');
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Handle timesheet rejection
  const handleRejectTimesheet = async (timesheet = null, weekData = null, monthlyViewMode = false, selectedMonthRange = null, selectedEmployee = null, userId = null, fetchOrCreateTimesheet = null, fetchMonthlyTimesheetData = null) => {
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

      if (isMonthlyTimesheet) {
        // For monthly view, use the selectedMonthRange from prepopulated data
        if (!selectedMonthRange) {
          ToastService.error('No month range selected for rejection');
          return;
        }

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
            if (selectedEmployee && fetchMonthlyTimesheetData) {
              setTimeout(() => {
                fetchMonthlyTimesheetData(selectedEmployee);
              }, 500);
            }
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
            if (fetchOrCreateTimesheet) {
              setTimeout(() => {
                fetchOrCreateTimesheet();
              }, 500);
            }
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

  // Utility function to open rejection dialog
  const openRejectDialog = () => {
    setRejectDialogOpen(true);
  };

  // Utility function to close rejection dialog
  const closeRejectDialog = () => {
    setRejectDialogOpen(false);
    setRejectionReason('');
  };

  // Return all state and functions for external use
  return {
    // State
    adminActionLoading,
    rejectionReason,
    rejectDialogOpen,
    
    // Setters
    setRejectionReason,
    setRejectDialogOpen,
    
    // Functions
    handleApproveTimesheet,
    handleRejectTimesheet,
    openRejectDialog,
    closeRejectDialog
  };
};

// Export individual functions for use without hook
export const approveTimesheetHandler = async (
  dispatch,
  timesheet,
  weekData,
  monthlyViewMode,
  selectedMonthRange,
  selectedEmployee,
  userId,
  fetchOrCreateTimesheet,
  fetchMonthlyTimesheetData
) => {
  const targetTimesheet = timesheet || null;

  if (!targetTimesheet && !weekData) {
    console.error('No timesheet or weekData provided for approval');
    ToastService.error('No timesheet data available for approval');
    return false;
  }

  try {
    let resultAction;
    const effectiveTimesheet = targetTimesheet || weekData?.timesheet;
    const isMonthlyTimesheet = monthlyViewMode || (effectiveTimesheet?.timesheetType === 'MONTHLY');

    if (isMonthlyTimesheet) {
      if (!selectedMonthRange) {
        ToastService.error('No month range selected for approval');
        return false;
      }

      if (!selectedEmployee) {
        ToastService.error('No employee selected for approval');
        return false;
      }

      resultAction = await dispatch(approveTimesheetMonthly({
        userId: selectedEmployee,
        start: selectedMonthRange.start,
        end: selectedMonthRange.end
      }));

      if (approveTimesheetMonthly.fulfilled.match(resultAction)) {
        const response = resultAction.payload;
        if (response.success) {
          ToastService.success('Timesheet approved successfully');
          if (selectedEmployee && fetchMonthlyTimesheetData) {
            setTimeout(() => {
              fetchMonthlyTimesheetData(selectedEmployee);
            }, 500);
          }
          return true;
        } else {
          const errorMessage = extractErrorMessage(response);
          ToastService.error(errorMessage || 'Failed to approve timesheet');
          return false;
        }
      } else {
        const errorMessage = extractErrorMessage(resultAction.payload);
        ToastService.error(errorMessage || 'Failed to approve timesheet');
        return false;
      }
    } else {
      const timesheetId = effectiveTimesheet?.id || effectiveTimesheet?.timesheetId;
      if (!timesheetId) {
        throw new Error('No timesheet ID found for approval');
      }

      resultAction = await dispatch(approveTimesheet({
        timesheetId: timesheetId,
        userId: userId
      }));

      if (approveTimesheet.fulfilled.match(resultAction)) {
        const response = resultAction.payload;
        if (response.success) {
          ToastService.success('Timesheet approved successfully');
          if (fetchOrCreateTimesheet) {
            setTimeout(() => {
              fetchOrCreateTimesheet();
            }, 500);
          }
          return true;
        } else {
          const errorMessage = extractErrorMessage(response);
          ToastService.error(errorMessage || 'Failed to approve timesheet');
          return false;
        }
      } else {
        const errorMessage = extractErrorMessage(resultAction.payload);
        ToastService.error(errorMessage || 'Failed to approve timesheet');
        return false;
      }
    }
  } catch (error) {
    console.error('Error approving timesheet:', error);
    const errorMessage = extractErrorMessage(error);
    ToastService.error(errorMessage || 'Failed to approve timesheet');
    return false;
  }
};

export const rejectTimesheetHandler = async (
  dispatch,
  rejectionReason,
  timesheet,
  weekData,
  monthlyViewMode,
  selectedMonthRange,
  selectedEmployee,
  userId,
  fetchOrCreateTimesheet,
  fetchMonthlyTimesheetData
) => {
  const targetTimesheet = timesheet || null;

  if (!targetTimesheet && !weekData) {
    console.error('No timesheet or weekData provided for rejection');
    return false;
  }

  if (!rejectionReason.trim()) {
    ToastService.error('Please provide a rejection reason');
    return false;
  }

  try {
    let resultAction;
    const isMonthlyTimesheet = monthlyViewMode || (targetTimesheet?.timesheetType === 'MONTHLY');

    if (isMonthlyTimesheet) {
      if (!selectedMonthRange) {
        ToastService.error('No month range selected for rejection');
        return false;
      }

      resultAction = await dispatch(rejectTimesheetMonthly({
        userId: selectedEmployee,
        start: selectedMonthRange.start,
        end: selectedMonthRange.end,
        reason: rejectionReason.trim()
      }));

      if (rejectTimesheetMonthly.fulfilled.match(resultAction)) {
        const response = resultAction.payload;
        if (response.success) {
          ToastService.success('Timesheet rejected successfully');
          if (selectedEmployee && fetchMonthlyTimesheetData) {
            setTimeout(() => {
              fetchMonthlyTimesheetData(selectedEmployee);
            }, 500);
          }
          return true;
        } else {
          const errorMessage = extractErrorMessage(response);
          ToastService.error(errorMessage || 'Failed to reject timesheet');
          return false;
        }
      } else {
        const errorMessage = extractErrorMessage(resultAction.payload);
        ToastService.error(errorMessage || 'Failed to reject timesheet');
        return false;
      }
    } else {
      const timesheetId = targetTimesheet?.id || targetTimesheet?.timesheetId;
      if (!timesheetId) {
        throw new Error('No timesheet ID found for rejection');
      }

      resultAction = await dispatch(rejectTimesheet({
        timesheetId: timesheetId,
        userId: userId,
        reason: rejectionReason.trim()
      }));

      if (rejectTimesheet.fulfilled.match(resultAction)) {
        const response = resultAction.payload;
        if (response.success) {
          ToastService.success('Timesheet rejected successfully');
          if (fetchOrCreateTimesheet) {
            setTimeout(() => {
              fetchOrCreateTimesheet();
            }, 500);
          }
          return true;
        } else {
          const errorMessage = extractErrorMessage(response);
          ToastService.error(errorMessage || 'Failed to reject timesheet');
          return false;
        }
      } else {
        const errorMessage = extractErrorMessage(resultAction.payload);
        ToastService.error(errorMessage || 'Failed to reject timesheet');
        return false;
      }
    }
  } catch (error) {
    console.error('Error rejecting timesheet:', error);
    const errorMessage = extractErrorMessage(error);
    ToastService.error(errorMessage);
    return false;
  }
};

export default useTimesheetApprovalHandlers;