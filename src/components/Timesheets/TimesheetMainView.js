import React from 'react';
import {
  Container, Typography, Box, Grid, TextField, Select, MenuItem, Button, Chip, CircularProgress, Table, TableHead, TableBody, TableRow, TableCell, Alert, Snackbar, FormControl, InputLabel, Card, CardContent, Avatar, List, ListItem, ListItemAvatar, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Input, FormHelperText, LinearProgress, Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { AccessTime, AttachFile, Delete, CloudUpload, ThumbDown, Visibility, CalendarMonth, Person, Work } from '@mui/icons-material';
import TimesheetTableSection from './TimesheetTableSection';
import enGB from 'date-fns/locale/en-GB';
import AttachmentHandlers from './AttachmentHanlders';

const TimesheetMainView = (props) => {
  // All props are passed from TimeSheets.js
  const {
    alert, handleCloseAlert, selectedProject, setSelectedProject, clients, role,
    selectedEmployee, setSelectedEmployee, externalEmployeesOptions, calendarValue,
    setCalendarValue, CustomDay, highlightedWeek, currentTimesheet, currentWeekInfo,
    isSubmitted, pendingAttachments, loading, getProjectConfig, getWorkingDaysHours,
    getPercentageColor, calculatePercentage, handleHourChange, isFieldEditable,
    notes, handleNotesChange, fetchOrCreateTimesheet, saveTimesheet, submitWeeklyTimesheet,
    isFridayInPresentWeek, onApprove, onReject, onCancel, adminActionLoading,
    hasUnsavedChanges, rejectionReason, setRejectionReason, rejectDialogOpen,
    setRejectDialogOpen, uploadDialogOpen, setUploadDialogOpen, uploading,
    handleUploadAttachments, handleFileSelect, fileInputRef, selectedFiles,
    setSelectedFiles, attachments, handleRemoveAttachment, projectDetails,
    timesheetData, getWeekDates, getSelectedProjectDetails, getTotalWorkingDays,
    selectedWeekStart, isPresentWeek, handleRejectTimesheet, formatFileSize,
    isCreateMode, isAddingNewTimesheet, handleCancelAddTimesheet, handleAddTimesheetClick,
    tempEmployeeForAdd, setTempEmployeeForAdd, handleViewAttachments, AttachmentsDialog,
    employeeProjects,
    loadingEmployeeProjects,
    handleEmployeeChange,
    prepopulatedEmployee,
    isEditMode,
    setIsEditMode,
    handleEditTimesheet,
    canEditTimesheet,
    isDateInCurrentMonth,
    getDateForDay,
    isDateInSelectedWeekMonth,
    isDateInCalendarMonth,
    monthlyTimesheetData,
    currentMonthWeeks,
    monthlyViewMode,
    fetchMonthlyTimesheetData,
    selectedMonthRange,
    navigationSource,
    handleViewAttachmentFile,
    handleDownloadAttachmentFile, 
    viewLoading, AttachmentViewDialog, 
    downloadLoading, getAttachmentViewDialog, 
    monthlyTotalWorkingHours, monthlyTotalWorkingHoursForEmployee,submitLoading

  } = props;

  // FIXED: Determine when to show calendar and table sections
  const shouldShowCalendar = selectedProject &&
    !monthlyViewMode &&
    (role === 'EXTERNALEMPLOYEE' || isCreateMode || isAddingNewTimesheet);

  const shouldShowTimesheetSection = selectedProject && !loading &&
    ((selectedWeekStart && currentTimesheet && !monthlyViewMode) ||
      (monthlyViewMode && monthlyTimesheetData && monthlyTimesheetData.length > 0));

  const safeGetWorkingDaysHours = (timesheet) => {
    if (!timesheet) return 0;
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      .reduce((total, day) => total + (timesheet[day] || 0), 0);
  };

  const safeCalculatePercentage = (timesheet) => {
    if (!timesheet) return 0;
    return calculatePercentage(timesheet);
  };

  // const safeIsFieldEditable = (timesheet, day, leaveType, calendarDate) => {
  //   if (!timesheet) return false;
  //   return isFieldEditable(timesheet, day, leaveType, calendarDate);
  // };

  const safeIsFieldEditable = (timesheet, day, leaveType, calendarDate, isEditMode = false) => {
    if (!timesheet) return false;

    if (day === 'saturday' || day === 'sunday') {
      return false;
    }

    // In edit mode, allow editing regardless of calendar month (except weekends)
    if (isEditMode) {
      return true;
    }

    const dayDate = getDateForDay(selectedWeekStart, day);
    const isInCalendarMonth = dayDate ? isDateInCalendarMonth(dayDate, calendarDate) : false;

    if (!isInCalendarMonth && !isEditMode) {
      return false;
    }
    // SPECIAL CASE: Allow editing for rejected timesheets for EXTERNALEMPLOYEE
    const isRejectedAndExternalEmployee = timesheet.status === 'REJECTED' &&
      role === 'EXTERNALEMPLOYEE';

    if (isRejectedAndExternalEmployee) {
      return true; // Allow editing for rejected timesheets for EXTERNALEMPLOYEE
    }

    // For SUPERADMIN and ACCOUNTS, allow editing if not submitted
    if ((role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE" || role === "ADMIN") && !isSubmitted) {
      return true;
    }

    if (timesheet.status === 'REJECTED') {
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
    }

    // For non-rejected timesheets, use original validation
    return isFieldEditable(timesheet, day, leaveType, calendarDate);
  };
  // Calculate total hours for monthly view
  const calculateMonthlyTotalHours = () => {
    if (!monthlyTimesheetData || monthlyTimesheetData.length === 0) return 0;

    return monthlyTimesheetData.reduce((total, weekData) => {
      if (weekData.timesheet) {
        return total + safeGetWorkingDaysHours(weekData.timesheet);
      }
      return total;
    }, 0);
  };

  // Calculate submitted vs pending timesheets for monthly view
  const calculateMonthlyStatus = () => {
    if (!monthlyTimesheetData || monthlyTimesheetData.length === 0) {
      return { submitted: 0, pending: 0 };
    }

    const submitted = monthlyTimesheetData.filter(
      weekData => weekData.timesheet && weekData.timesheet.status === 'SUBMITTED'
    ).length;

    const pending = monthlyTimesheetData.filter(
      weekData => weekData.timesheet && weekData.timesheet.status === 'PENDING'
    ).length;

    return { submitted, pending };
  };

  const monthlyStatus = calculateMonthlyStatus();
  const monthlyTotalHours = calculateMonthlyTotalHours();

  console.log('TimesheetMainView render state:', {
    selectedProject,
    monthlyViewMode,
    shouldShowCalendar,
    shouldShowTimesheetSection,
    role,
    selectedEmployee,
    monthlyTimesheetData: monthlyTimesheetData?.length,
    currentTimesheet: !!currentTimesheet
  });

  const getDisplayMonth = () => {
    console.log('getDisplayMonth called with:', {
      selectedMonthRange,
      navigationSource,
      calendarValue
    });

    // If we have selectedMonthRange from prepopulated data AND it matches the navigation source, use that
    if (selectedMonthRange && selectedMonthRange.start) {
      // Check if this is from a valid prepopulation source
      const isValidPrepopulatedSource = navigationSource === 'url' ||
        navigationSource === 'state' ||
        navigationSource === 'timesheetsForAdmins';

      if (isValidPrepopulatedSource) {
        console.log('Using prepopulated month for display:', selectedMonthRange.start);
        return new Date(selectedMonthRange.start);
      }
    }

    // Otherwise use calendarValue
    console.log('Using calendar value for display:', calendarValue);
    return calendarValue;
  };

  const startDate = selectedMonthRange ? new Date(selectedMonthRange.start) : null;
  const monthName = startDate
    ? startDate.toLocaleString('default', { month: 'long' })
    : '';

  console.log('Determined monthName:', monthName, 'from startDate:', startDate);

  const getMonthNameFromApi = () => {
    if (timesheetData && timesheetData.monthStartDate) {
      const monthStartDate = new Date(timesheetData.monthStartDate);
      return monthStartDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    return '';
  };

  // Get month range from API response
  const getMonthRangeFromApi = () => {
    if (timesheetData && timesheetData.monthStartDate && timesheetData.monthEndDate) {
      return {
        start: timesheetData.monthStartDate,
        end: timesheetData.monthEndDate
      };
    }
    return selectedMonthRange;
  };

  const apiMonthRange = getMonthRangeFromApi();
  const apiMonthName = getMonthNameFromApi();

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
            Timesheet Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {monthlyViewMode
              ? `Monthly view for ${selectedEmployee ? externalEmployeesOptions?.find(emp => emp.value === selectedEmployee)?.label || 'selected employee' : 'employee'}`
              : 'Manage your work hours and leave'
            }
          </Typography>
        </Box>
      </Box>

      {/* Combined Project and Week Selection Card */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            {monthlyViewMode ? 'Employee and Project (Monthly View)' : 'Select Project and Week'}
          </Typography>

          <Grid container spacing={3} alignItems="flex-start">
            {/* Left Side: Project & Employee + Calendar */}
            <Grid item xs={12} md={monthlyViewMode ? 8 : 5}>
              {/* Employee and Project dropdowns in row for createMode and monthlyViewMode */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 2,
                  flexWrap: 'wrap'
                }}
              >
                {/* Employee Selection - Show for admin roles or create mode */}
                {((role === "SUPERADMIN" || role === "ACCOUNTS" || role === "INVOICE" || role === "ADMIN") || (isCreateMode || isAddingNewTimesheet)) && (
                  <FormControl
                    size="small"
                    sx={{
                      flex: 1,
                      width: '10%'
                    }}
                  >
                    <InputLabel id="employee-select-label">Select Employee</InputLabel>
                    <Select
                      labelId="employee-select-label"
                      value={isAddingNewTimesheet ? tempEmployeeForAdd : selectedEmployee}
                      label="Select Employee"
                      onChange={(e) => {
                        console.log('Employee selection changed:', e.target.value);
                        handleEmployeeChange(e.target.value);
                      }}
                      disabled={loadingEmployeeProjects}
                    >
                      <MenuItem value="">
                        {loadingEmployeeProjects ? 'Loading employees...' : 'Choose an employee...'}
                      </MenuItem>

                      {/* Show loading state */}
                      {loadingEmployeeProjects && (
                        <MenuItem value="" disabled>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} />
                            Loading employees...
                          </Box>
                        </MenuItem>
                      )}

                      {!loadingEmployeeProjects && externalEmployeesOptions && externalEmployeesOptions.map((emp) => (
                        <MenuItem
                          key={emp.value}
                          value={emp.value}
                        >
                          {emp.label}
                          {monthlyViewMode && selectedEmployee === emp.value}
                        </MenuItem>
                      ))}
                    </Select>

                    {/* Loading indicator */}
                    {loadingEmployeeProjects && (
                      <FormHelperText>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={12} />
                          Loading employee data...
                        </Box>
                      </FormHelperText>
                    )}

                    {/* Monthly view indicator */}
                    {monthlyViewMode && selectedEmployee && !loadingEmployeeProjects && (
                      <FormHelperText sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        Monthly View Mode - Showing timesheet data by month
                      </FormHelperText>
                    )}
                  </FormControl>
                )}

                {/* Project Dropdown */}
                <FormControl
                  size="small"
                  sx={{
                    flex: 1,
                    minWidth: "10%",
                    ...(role === 'EXTERNALEMPLOYEE' && {
                      width: '50%',
                      maxWidth: '50%'
                    })
                  }}
                >
                  <InputLabel id="project-select-label">
                    {monthlyViewMode ? 'Filter by Project (Optional)' : 'Select Project'}
                  </InputLabel>
                  <Select
                    labelId="project-select-label"
                    value={selectedProject}
                    label={monthlyViewMode ? 'Filter by Project (Optional)' : 'Select Project'}
                    onChange={(e) => {
                      console.log('Project selected:', e.target.value);
                      setSelectedProject(e.target.value);

                      // If in monthly view mode, refresh data with the new project filter
                      if (monthlyViewMode && selectedEmployee) {
                        console.log('Refreshing monthly data with project filter');
                        fetchMonthlyTimesheetData(selectedEmployee);
                      }
                    }}
                    disabled={
                      loading ||
                      loadingEmployeeProjects ||
                      ((role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === 'INVOICE' || role === 'ADMIN') &&
                        (!selectedEmployee && !tempEmployeeForAdd))
                    }
                  >
                    <MenuItem value="">
                      {monthlyViewMode ? 'All Projects' : 'Choose a project...'}
                    </MenuItem>

                    {/* Loading state */}
                    {loadingEmployeeProjects && (
                      <MenuItem value="" disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          Loading projects...
                        </Box>
                      </MenuItem>
                    )}

                    {/* Show employee projects when employee is selected (admin roles) */}
                    {(role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === 'INVOICE' || role === 'ADMIN') && (selectedEmployee || tempEmployeeForAdd) && !loadingEmployeeProjects ? (
                      employeeProjects && employeeProjects.length > 0 ? (
                        employeeProjects.map((project, index) => (
                          <MenuItem
                            key={project.projectId || project.id || project || index}
                            value={project.projectName || project.name || project}
                          >
                            {project.projectName || project.name || project}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>
                          No projects found for this employee
                        </MenuItem>
                      )
                    ) : (
                      // For EXTERNALEMPLOYEE role, show regular clients
                      role === 'EXTERNALEMPLOYEE' && clients && clients.map((clientName, index) => (
                        <MenuItem key={index} value={clientName}>
                          {clientName}
                        </MenuItem>
                      ))
                    )}
                  </Select>

                  {/* Project filter help text for monthly view */}
                  {monthlyViewMode && !loadingEmployeeProjects && (
                    <FormHelperText sx={{ color: 'info.main' }}>
                      {selectedProject
                        ? `Filtering by project: ${selectedProject}`
                        : 'Showing all projects - select a project to filter'
                      }
                    </FormHelperText>
                  )}
                </FormControl>
              </Box>

              {/* Monthly Summary - Moved below the dropdowns */}
              {monthlyViewMode && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Monthly Summary {selectedMonthRange
                      ? new Date(selectedMonthRange.start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                      : calendarValue.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Typography>

                  {/* Employee Info Card */}
                  <Card variant="outlined" sx={{ mb: 2, bgcolor: 'grey.50' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {/* Date range from selectedMonthRange */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarMonth color="primary" sx={{ fontSize: 20, mr: 1 }} />
                        <Typography variant="subtitle2" color="primary.main">
                          Date Range
                        </Typography>
                      </Box>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">From Date</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {apiMonthRange?.start ? new Date(apiMonthRange.start).toLocaleDateString('en-GB') :
                              selectedMonthRange?.start ? new Date(selectedMonthRange.start).toLocaleDateString('en-GB') : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">To Date</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {apiMonthRange?.end ? new Date(apiMonthRange.end).toLocaleDateString('en-GB') :
                              selectedMonthRange?.end ? new Date(selectedMonthRange.end).toLocaleDateString('en-GB') : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>

                      {/* Rest of the employee info */}
                      {timesheetData && timesheetData.length > 0 && (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 2 }}>
                            <Work color="primary" sx={{ fontSize: 20, mr: 1 }} />
                            <Typography variant="subtitle2" color="primary.main">
                              Project Information
                            </Typography>
                          </Box>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Approver</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {timesheetData[0].approver || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Total Working Hours</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {/* {currentTimesheet ? safeGetWorkingDaysHours(currentTimesheet) : '0'} */}
                                {monthlyTotalWorkingHours}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Frequency</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {timesheetData[0].timesheetType || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Client</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {timesheetData[0].clientName || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Start Date</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {timesheetData[0].startDate || 'N/A'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              )}


              {monthlyViewMode && (
                <Box sx={{ mt: 3 }}>
                  {/* Attachments Card */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Attachments
                    </Typography>
                    <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        {timesheetData && timesheetData.length > 0 && timesheetData.some(ts => ts.attachments?.length > 0) ? (
                          <Box>
                            <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                              {timesheetData.flatMap((timesheet) =>
                                timesheet?.attachments
                                  ?.filter((att) => att.uploaded !== false) // Show all attachments that aren't explicitly marked as not uploaded
                                  .map((attachment, index) => (
                                    <ListItem
                                      key={`${timesheet.timesheetId}-${attachment.id || index}`}
                                      secondaryAction={
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                          <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={() => handleViewAttachmentFile(attachment, timesheet)}
                                            title="View Attachment"
                                            disabled={viewLoading}
                                          >
                                            {viewLoading ? <CircularProgress size={16} /> : <Visibility fontSize="small" />}
                                          </IconButton>
                                          <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={() => handleDownloadAttachmentFile(attachment, timesheet)}
                                            title="Download Attachment"
                                          >
                                            <CloudUpload fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      }
                                    >
                                      <ListItemAvatar>
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main' }}>
                                          <AttachFile sx={{ fontSize: 14 }} />
                                        </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText
                                        primary={
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2">
                                              {attachment.filename || attachment.name || `Attachment ${index + 1}`}
                                            </Typography>
                                            <Chip label="Uploaded" size="small" color="success" variant="outlined" />
                                          </Box>
                                        }
                                        secondary={`${formatFileSize(attachment.size || 0)} • ${new Date(
                                          attachment.uploadedAt || attachment.uploadDate
                                        ).toLocaleDateString()} • Week: ${new Date(timesheet.weekStartDate).toLocaleDateString()} - ${new Date(timesheet.weekEndDate).toLocaleDateString()}`}
                                        primaryTypographyProps={{ variant: "body2" }}
                                        secondaryTypographyProps={{ variant: "caption" }}
                                      />
                                    </ListItem>
                                  ))
                              )}
                            </List>
                            {/* Fixed: Remove the problematic "View All Attachments" button or fix it */}
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              {timesheetData.reduce((total, ts) => total + (ts.attachments?.length || 0), 0)} attachment(s) found across all weeks
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No uploaded attachments found for this period
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              )}
              {/* Calendar - Only show for non-monthly view */}
              {shouldShowCalendar && (
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    boxShadow: 2,
                    p: { xs: 1, sm: 2 },
                    mt: 3,
                    width: "100%",
                    minHeight: { xs: 320, sm: 345 },
                    height: "auto",
                    bgcolor: "grey.50",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Select Week
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
                    <DateCalendar
                      value={calendarValue}
                      onChange={(newValue) => {
                        console.log('Calendar date changed:', newValue);
                        setCalendarValue(newValue);
                      }}
                      slots={{ day: CustomDay }}
                      showDaysOutsideCurrentMonth={true}
                      disableFuture={false}
                      sx={{
                        width: "100%",
                        maxWidth: "100%",
                        "& .MuiDayCalendar-monthContainer": {
                          width: "100%",
                          overflow: "hidden",
                        },
                        "& .MuiDayCalendar-weekContainer": {
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: 0,
                          margin: 0,
                          width: "100%",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          "&:last-child": {
                            borderBottom: "none",
                          }
                        },
                        "& .MuiDayCalendar-header": {
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: 0,
                          paddingLeft: 0,
                          paddingRight: 0,
                          marginBottom: 0,
                          borderBottom: "2px solid",
                          borderColor: "primary.main",
                        },
                        "& .MuiDayCalendar-weekDayLabel": {
                          fontSize: { xs: "0.7rem", sm: "0.875rem" },
                          fontWeight: "bold",
                          color: "text.primary",
                          width: "100%",
                          height: { xs: "32px", sm: "40px" },
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRight: "1px solid",
                          borderColor: "divider",
                          bgcolor: "grey.100",
                          "&:last-child": {
                            borderRight: "none",
                          }
                        },
                        "& .MuiPickersDay-root": {
                          borderRadius: 0,
                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                          width: "100%",
                          height: { xs: "36px", sm: "44px" },
                          minWidth: "auto",
                          borderRight: "1px solid",
                          borderColor: "divider",
                          "&:last-child": {
                            borderRight: "none",
                          },
                          "&:hover": {
                            backgroundColor: "primary.light",
                            borderRadius: 0,
                          },
                          "&.Mui-disabled": {
                            color: "text.disabled",
                            backgroundColor: "grey.50",
                          },
                        },
                        "& .Mui-selected": {
                          backgroundColor: "primary.main !important",
                          color: "#fff",
                          borderRadius: 0,
                          "&:hover": {
                            backgroundColor: "primary.dark !important",
                          }
                        },
                        "& .MuiPickersDay-dayOutsideMonth": {
                          color: "text.disabled",
                          backgroundColor: "grey.50",
                          pointerEvents: "none",
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Box>
              )}

            </Grid>

            {/* Right Side: Project Details or Monthly View Info */}
            <Grid item xs={12} md={monthlyViewMode ? 4 : 7}>
              {monthlyViewMode ? (
                <Box>
                  {/* Monthly Summary content removed from here - it's now above */}
                  {/* Keep any other content you want to show in the right column during monthly view */}
                </Box>
              ) : (
                /* Weekly View Project Details - Show for all roles including INVOICE and ACCOUNTS */
                projectDetails && (
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Project Details
                    </Typography>

                    <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Client</Typography>
                            <Typography variant="body1" fontWeight="medium">{selectedProject}</Typography>
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
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Working Days</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedWeekStart
                                ? getWeekDates(selectedWeekStart).weekDays.filter(
                                  (day) => day.getDay() >= 1 && day.getDay() <= 5
                                ).length + " days"
                                : "0 days"}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Total Working Hours</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {/* {currentTimesheet ? safeGetWorkingDaysHours(currentTimesheet) : '0'} */}
                              {monthlyTotalWorkingHoursForEmployee}
                            </Typography>
                          </Grid>

                        </Grid>
                      </CardContent>
                    </Card>

                    {/* Attachments Section */}
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Attachments
                        </Typography>
                        {(role === "EXTERNALEMPLOYEE") && (
                          <IconButton
                            size="small"
                            onClick={() => setUploadDialogOpen(true)}
                            disabled={!currentTimesheet || isSubmitted}
                            sx={{ ml: 1 }}
                          >
                            <AttachFile fontSize="small" />
                          </IconButton>
                        )}
                      </Box>

                      {role === "EXTERNALEMPLOYEE" ? (
                        attachments.length > 0 ? (
                          <List dense sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, maxHeight: 200, overflow: "auto" }}>
                            {attachments.map((file) => (
                              <ListItem
                                key={file.id}
                                secondaryAction={
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => handleRemoveAttachment(file.id)}
                                    disabled={!currentTimesheet || isSubmitted}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                }
                              >
                                <ListItemAvatar>
                                  <Avatar sx={{ width: 24, height: 24, bgcolor: file.uploaded ? "success.main" : "warning.main" }}>
                                    <AttachFile sx={{ fontSize: 14 }} />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2">{file.name}</Typography>
                                      {!file.uploaded && (
                                        <Chip label="Pending" size="small" color="warning" variant="outlined" />
                                      )}
                                    </Box>
                                  }
                                  secondary={formatFileSize(file.size) + " • " + file.uploadDate.toLocaleDateString()}
                                  primaryTypographyProps={{ variant: "body2" }}
                                  secondaryTypographyProps={{ variant: "caption" }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            Kindly upload attachments here
                          </Typography>
                        )
                      ) : (
                        timesheetData && Array.isArray(timesheetData) && timesheetData.length > 0 && timesheetData.some(ts => ts.attachments?.length > 0) ? (
                          <Box>
                            <List dense sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, maxHeight: 200, overflow: "auto" }}>
                              {timesheetData.flatMap((timesheet) =>
                                timesheet?.attachments
                                  ?.filter((att) => att.uploaded)
                                  .map((attachment) => (
                                    <ListItem
                                      key={attachment.id}
                                      secondaryAction={
                                        <IconButton edge="end" size="small" onClick={() => handleViewAttachmentFile(attachment, timesheet)}>
                                          <Visibility fontSize="small" />
                                        </IconButton>
                                      }
                                    >
                                      <ListItemAvatar>
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: "success.main" }}>
                                          <AttachFile sx={{ fontSize: 14 }} />
                                        </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText
                                        primary={
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2">
                                              {attachment.filename || attachment.name}
                                            </Typography>
                                            <Chip label="Uploaded" size="small" color="success" variant="outlined" />
                                          </Box>
                                        }
                                        secondary={`${formatFileSize(attachment.size || 0)} • ${new Date(
                                          attachment.uploadedAt || attachment.uploadDate
                                        ).toLocaleDateString()} • ${timesheet.project || "Unknown Project"}`}
                                        primaryTypographyProps={{ variant: "body2" }}
                                        secondaryTypographyProps={{ variant: "caption" }}
                                      />
                                    </ListItem>
                                  ))
                              )}
                            </List>
                            <Button
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => timesheetData[0] && handleViewAttachments(timesheetData[0])}
                              sx={{ mt: 1 }}
                            >
                              View All Attachments
                            </Button>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No uploaded attachments found
                          </Typography>
                        )
                      )}
                    </Box>
                  </Box>
                )
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading State for Monthly View */}
      {monthlyViewMode && loading && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Loading monthly timesheet data...
            </Typography>
          </CardContent>
        </Card>
      )}

      {submitLoading && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Submitting for approval
            </Typography>
          </CardContent>
        </Card>
      ) }

      {/* Timesheet Table Section - Show for both weekly and monthly views */}
      {shouldShowTimesheetSection && !loading && (
        <TimesheetTableSection
          selectedProject={selectedProject}
          currentTimesheet={currentTimesheet}
          currentWeekInfo={currentWeekInfo}
          isSubmitted={isSubmitted}
          pendingAttachments={pendingAttachments}
          loading={loading}
          getProjectConfig={getProjectConfig}
          getWorkingDaysHours={safeGetWorkingDaysHours}
          getPercentageColor={getPercentageColor}
          calculatePercentage={safeCalculatePercentage}
          handleHourChange={handleHourChange}
          safeIsFieldEditable={safeIsFieldEditable}
          notes={notes}
          handleNotesChange={handleNotesChange}
          fetchOrCreateTimesheet={fetchOrCreateTimesheet}
          saveTimesheet={saveTimesheet}
          submitWeeklyTimesheet={submitWeeklyTimesheet}
          isFridayInPresentWeek={isFridayInPresentWeek}
          role={role}
          onApprove={onApprove}
          onReject={onReject}
          onCancel={onCancel}
          adminActionLoading={adminActionLoading}
          hasUnsavedChanges={hasUnsavedChanges}
          selectedEmployee={selectedEmployee}
          isAddingNewTimesheet={isAddingNewTimesheet}
          isCreateMode={isCreateMode}
          getDateForDay={getDateForDay}
          isDateInSelectedWeekMonth={isDateInSelectedWeekMonth}
          selectedWeekStart={selectedWeekStart}
          canEditTimesheet={canEditTimesheet}
          isEditMode={isEditMode}
          calendarValue={calendarValue}
          isDateInCalendarMonth={isDateInCalendarMonth}
          monthlyTimesheetData={monthlyTimesheetData}
          currentMonthWeeks={currentMonthWeeks}
          monthlyViewMode={monthlyViewMode}
          selectedMonthRange={selectedMonthRange}
          getDisplayMonth={getDisplayMonth}
          handleViewAttachmentFile={handleViewAttachmentFile}
          handleDownloadAttachmentFile={handleDownloadAttachmentFile}
           fetchMonthlyTimesheetData={ fetchMonthlyTimesheetData}
           submitLoading={submitLoading}
        />
      )}

      {/* Week-specific alerts - Only show for non-monthly view */}
      {!monthlyViewMode && selectedWeekStart && !isPresentWeek(selectedWeekStart) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This is a previous week's timesheet and cannot be edited or submitted.
        </Alert>
      )}

      {!monthlyViewMode && isPresentWeek(selectedWeekStart) && !isFridayInPresentWeek() && (
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

      {/* Reject Timesheet Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Timesheet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            type="text"
            variant="outlined"
            multiline
            fullWidth
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRejectTimesheet}
            variant="contained"
            color="error"
            disabled={!rejectionReason.trim() || adminActionLoading}
            startIcon={adminActionLoading ? <CircularProgress size={16} /> : <ThumbDown />}
          >
            {adminActionLoading ? 'Processing...' : 'Reject Timesheet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Empty State - Show when no project is selected */}
      {!selectedProject && !loading && (
        <Card>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <AccessTime sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {monthlyViewMode
                ? (selectedEmployee ? 'Select a Project to Filter Data' : 'Select Employee to View Monthly Timesheets')
                : 'No Project Selected'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {monthlyViewMode
                ? (selectedEmployee
                  ? 'Choose a project to filter timesheet data, or leave empty to view all projects'
                  : 'Please select an employee to view their monthly timesheet data'
                )
                : 'Please select a project to start managing your timesheet'
              }
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Monthly View Empty State - Show when employee selected but no data */}
      {monthlyViewMode && selectedEmployee && !loading && monthlyTimesheetData?.length === 0 && (
        <Card>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <AccessTime sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Timesheet Data Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No timesheet data available for {externalEmployeesOptions?.find(emp => emp.value === selectedEmployee)?.label || 'selected employee'}
              {' '}in {selectedMonthRange
                ? new Date(selectedMonthRange.start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : calendarValue.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {selectedProject && (
                <><br />Project filter: {selectedProject}</>
              )}
            </Typography>
          </CardContent>
        </Card>
      )}

      {AttachmentViewDialog && <AttachmentViewDialog />}


      {/* Render Attachments Dialog */}
      {AttachmentsDialog && <AttachmentsDialog />}
    </Container>
  );
};

export default TimesheetMainView;