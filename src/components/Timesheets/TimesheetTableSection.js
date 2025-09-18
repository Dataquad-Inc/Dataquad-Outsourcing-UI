import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button
} from '@mui/material';
import { Refresh, Save, CheckCircle, ThumbUp, ThumbDown, Cancel, Edit } from '@mui/icons-material';

const TimesheetTableSection = ({
  selectedProject,
  currentTimesheet,
  currentWeekInfo,
  isSubmitted,
  pendingAttachments,
  loading,
  getProjectConfig,
  getWorkingDaysHours,
  getPercentageColor,
  calculatePercentage,
  handleHourChange,
  isFieldEditable,
  safeIsFieldEditable,
  notes,
  handleNotesChange,
  fetchOrCreateTimesheet,
  saveTimesheet,
  submitWeeklyTimesheet,
  isFridayInPresentWeek,
  // New props for admin actions
  role,
  onApprove,
  onReject,
  onCancel,
  adminActionLoading,
  hasUnsavedChanges,
  selectedEmployee,
  isAddingNewTimesheet,
  isCreateMode,
  getDateForDay,
  isDateInSelectedWeekMonth,
  handleEditTimesheet,
  selectedWeekStart,
  canEditTimesheet,
  isEditMode,
  calendarValue,
  isDateInCalendarMonth,
  monthlyTimesheetData, // New prop
  currentMonthWeeks,
  handleRejectTimesheet,
  selectedMonthRange,
  projectDetails
}) => (

  <Card sx={{ mb: 3 }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Typography variant="h6" fontWeight="bold">
            Timesheet for {selectedProject}
            {(role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE" || role === "ADMIN") && selectedEmployee && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                (Employee: {selectedEmployee})
              </Typography>
            )}
          </Typography>
          <Chip
            label={getProjectConfig(selectedProject).label}
            color={getProjectConfig(selectedProject).color}
            size="small"
          />
          {/* Status chip for admin roles */}
          {(role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE" || role === 'EXTERNALEMPLOYEE' || role === "ADMIN") && currentTimesheet && (
            <Chip
              label={currentTimesheet.status || 'DRAFT'}
              color={
                currentTimesheet.status === 'APPROVED' ? 'success' :
                  currentTimesheet.status === 'PENDING_APPROVAL' ? 'warning' :
                    currentTimesheet.status === 'REJECTED' ? 'error' : 'default'
              }
              size="small"
              variant="outlined"
            />
          )}
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

      {/* Role-specific alerts */}
      {role === 'EXTERNALEMPLOYEE' && isSubmitted && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This timesheet has been submitted and cannot be edited.
        </Alert>
      )}

      {(role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE" || role === "ADMIN") && !selectedEmployee && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please select an employee to view and manage their timesheet.
        </Alert>
      )}

      {role === 'EXTERNALEMPLOYEE' && pendingAttachments.length > 0 && !isSubmitted && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have {pendingAttachments.length} attachment(s) that will be uploaded when you submit the timesheet.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        // Check if we should render monthly view (ACCOUNTS/INVOICE roles)
        (role === 'ACCOUNTS' || role === 'ADMIN') && monthlyTimesheetData && monthlyTimesheetData.length > 0 ? (
          // Monthly view - render multiple week tables
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
              Monthly Timesheet View - {selectedMonthRange
                ? new Date(selectedMonthRange.start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : calendarValue.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>

            {monthlyTimesheetData.map((weekData, weekIndex) => (
              <Box key={weekIndex} sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Week {weekData.weekNumber} ({weekData.startDate.toLocaleDateString()} - {weekData.endDate.toLocaleDateString()})
                  </Typography>
                  <Chip
                    label={weekData.status || 'NO_DATA'}
                    color={
                      weekData.status === 'APPROVED' ? 'success' :
                        weekData.status === 'PENDING_APPROVAL' ? 'warning' :
                          weekData.status === 'REJECTED' ? 'error' : 'default'
                    }
                    size="small"
                  />
                </Box>

                {weekData.timesheet ? (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 800, '& .MuiTableCell-root': { py: 1, px: 0.5 } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ minWidth: 120, fontWeight: 'bold', py: 1 }}>
                            Type
                          </TableCell>
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                            const dayDate = getDateForDay(weekData.startString, day);
                            return (
                              <TableCell key={day} align="center" sx={{ minWidth: 60, fontWeight: 'bold', py: 1, px: 0.5 }}>
                                <Box>
                                  <Typography variant="body2" sx={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                    <b>{day.slice(0, 3)}</b>
                                  </Typography>
                                  {dayDate && (
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                      {dayDate.toLocaleDateString('en-IN', { day: '2-digit' })}
                                    </Typography>
                                  )}
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
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                            <TableCell key={day} align="center" sx={{ py: 1, px: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                                {weekData.timesheet[day] || 0}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>

                        {/* Leave Hours Row */}
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', pl: 2, py: 1 }}>
                            Leave Hours
                          </TableCell>
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                            <TableCell key={day} align="center" sx={{ py: 1, px: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                                {(weekData.timesheet.sickLeave?.[day] || 0) + (weekData.timesheet.companyHoliday?.[day] || 0)}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No timesheet data available for this week
                  </Typography>
                )}

                {weekData.timesheet?.notes && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold">Notes:</Typography>
                    <Typography variant="body2">{weekData.timesheet.notes}</Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        ) : (
          // Original single week view for EXTERNALEMPLOYEE
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
                    const dayDate = getDateForDay(selectedWeekStart, day);
                    const isInCalendarMonth = dayDate ? isDateInCalendarMonth(dayDate, calendarValue) : false;

                    return (
                      <TableCell
                        key={day}
                        align="center"
                        sx={{
                          minWidth: 60,
                          fontWeight: 'bold',
                          color: isWeekend ? 'text.secondary' : (isInCalendarMonth ? 'text.primary' : 'text.disabled'),
                          py: 1,
                          px: 0.5,
                          backgroundColor: !isInCalendarMonth ? 'grey.50' : 'transparent'
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{
                            textTransform: 'uppercase',
                            fontSize: '0.8rem',
                            opacity: isInCalendarMonth ? 1 : 0.6
                          }}>
                            <b>{day.slice(0, 3)}</b>
                          </Typography>
                          {dayDate && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.7rem',
                                opacity: isInCalendarMonth ? 1 : 0.6
                              }}
                            >
                              {dayDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </Typography>
                          )}
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
                    const dayDate = getDateForDay(selectedWeekStart, day);
                    const isInCalendarMonth = dayDate ? isDateInCalendarMonth(dayDate, calendarValue) : false;
                    const isEditable = safeIsFieldEditable(currentTimesheet, day, null, calendarValue, isEditMode) &&
                      !((isAddingNewTimesheet && isSubmitted));
                    return (
                      <TableCell key={day} align="center" sx={{
                        py: 1,
                        px: 0.5,
                        backgroundColor: !isInCalendarMonth ? 'grey.50' : 'transparent'
                      }}>
                        <TextField
                          type="text"
                          value={currentTimesheet[day] || 0}
                          onChange={(e) => handleHourChange(day, e.target.value)}
                          disabled={!isEditable || (isAddingNewTimesheet && isSubmitted)}
                          inputProps={{
                            min: 0,
                            max: 8,
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
                              backgroundColor: !isEditable ? 'grey.100' : 'white',
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
                    const dayDate = getDateForDay(selectedWeekStart, day);
                    const isInCalendarMonth = dayDate ? isDateInCalendarMonth(dayDate, calendarValue) : false;
                    const isEditable = safeIsFieldEditable(currentTimesheet, day, 'sickLeave', calendarValue, isEditMode) && !isWeekend;
                    return (
                      <TableCell key={day} align="center" sx={{
                        py: 1,
                        px: 0.5,
                        backgroundColor: !isInCalendarMonth ? 'grey.50' : 'transparent'
                      }}>
                        <TextField
                          type="text"
                          value={currentTimesheet.sickLeave[day] || 0}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            handleHourChange(day, value === 8 ? value : '', 'sickLeave');
                          }}
                          disabled={!isEditable || (isAddingNewTimesheet && isSubmitted)}
                          inputProps={{
                            min: 0,
                            max: 8,
                            step: 1,
                            style: {
                              textAlign: 'center',
                              fontWeight: currentTimesheet.sickLeave[day] > 0 ? 'bold' : 'normal',
                              padding: '4px',
                              width: '50px'
                            }
                          }}
                          sx={{
                            '& .MuiInputBase-root': {
                              backgroundColor: !isEditable ? 'grey.100' : 'white',
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
          </Box>
        )
      )}
      
      {/* Notes and Actions Section - Always render notes field for all roles, but conditionally show actions */}
      <Box sx={{ mt: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Notes & Additional Information
        </Typography>

        <TextField
          multiline
          rows={3}
          value={notes}
          onChange={(e) => {
            // Only allow editing for EXTERNALEMPLOYEE or in create/add modes
            if (role === 'EXTERNALEMPLOYEE' || isCreateMode || isAddingNewTimesheet) {
              handleNotesChange(e.target.value);
            }
          }}
          placeholder="Notes and comments about this timesheet..."
          // disabled={role === 'EXTERNALEMPLOYEE' ? (isSubmitted || currentTimesheet.isEditable) : false}
          disabled={currentTimesheet?.status==="PENDING_APPROVAL" || currentTimesheet?.status==="APROVED"}
          sx={{ mb: 3, width: '100%' }}
        />

        {/* Progress and Actions */}
        {/* Only show action buttons for non-ACCOUNTS/INVOICE roles */}
        {(role !== 'ACCOUNTS' && role !== 'ADMIN') && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchOrCreateTimesheet}
                disabled={loading || adminActionLoading}
              >
                Refresh
              </Button>

              {/* Edit button for rejected timesheets - Show for all roles */}
              {currentTimesheet?.status === 'REJECTED' && !isEditMode && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Edit />}
                  // onClick={handleEditTimesheet}
                  onClick={() => saveTimesheet(false)}
                  disabled={loading || adminActionLoading}
                  sx={{ minWidth: 120 }}
                >
                  Edit
                </Button>
              )}

              {/* Show different buttons based on role and mode */}
              {(role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE" || role === "ADMIN") && !isAddingNewTimesheet && !isCreateMode ? (
                <>
                  {/* Admin action buttons */}
                  {selectedEmployee && monthlyTimesheetData && monthlyTimesheetData.length > 0 && (
                    <>
                      <Button
                        onClick={() => { onApprove(currentTimesheet) }}
                        variant="contained"
                        color="success"
                        disabled={adminActionLoading}
                        startIcon={adminActionLoading ? <CircularProgress size={16} /> : <ThumbUp />}
                      >
                        {adminActionLoading ? 'Processing...' : 'Approve'}
                      </Button>

                      <Button
                        onClick={() => onReject()}
                        variant="contained"
                        color="error"
                        disabled={adminActionLoading}
                        startIcon={adminActionLoading ? <CircularProgress size={16} /> : <ThumbDown />}
                      >
                        {adminActionLoading ? 'Processing...' : 'Reject'}
                      </Button>
                    </>
                  )}

                  {/* Save button for admins */}
                  {selectedEmployee && currentTimesheet && (
                    <Button
                      variant="outlined"
                      startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                      onClick={() => saveTimesheet(false, true)}
                      disabled={loading}
                      sx={{ minWidth: 120 }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                </>
              ) : (
                /* EXTERNALEMPLOYEE buttons OR admin in create/add mode */
                <>
                  <Button
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                    onClick={() => saveTimesheet(false)}
                    disabled={loading || (role === 'EXTERNALEMPLOYEE' && isSubmitted) || currentTimesheet?.status === 'REJECTED'}
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? 'Saving...' : 'Save Draft'}
                  </Button>

                  {/* Save Changes button when in edit mode */}
                  {isEditMode && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                      onClick={() => saveTimesheet(false, true)}
                      disabled={loading}
                      sx={{ minWidth: 140 }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}

                  {/* Submit button for create mode and EXTERNALEMPLOYEE */}
                  {(isCreateMode || isAddingNewTimesheet || role === 'EXTERNALEMPLOYEE') && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}
                      onClick={submitWeeklyTimesheet}
                      sx={{ minWidth: 140 }}
                      disabled={currentTimesheet?.status === "PENDING_APPROVAL"}
                    >
                      {loading ? 'Submitting...' : 'Submit for Approval'}
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Actions Section for ACCOUNTS and INVOICE roles */}
      {(role === 'ACCOUNTS' || role === 'ADMIN') && (
        <Box sx={{ mt: 4, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchOrCreateTimesheet}
                disabled={loading || adminActionLoading}
              >
                Refresh
              </Button>

              {/* Edit button for rejected timesheets in ACCOUNTS/INVOICE view */}
              {currentTimesheet?.status === 'REJECTED' && !isEditMode && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Edit />}
                  onClick={handleEditTimesheet}
                  disabled={loading || adminActionLoading}
                  sx={{ minWidth: 120 }}
                >
                  Edit
                </Button>
              )}

              {/* Admin action buttons - only show if employee is selected and timesheet exists */}
              {selectedEmployee && monthlyTimesheetData && monthlyTimesheetData.length > 0 && (
                <>
                  <Button
                    onClick={() => onApprove(null, monthlyTimesheetData[0])}
                    variant="contained"
                    color="success"
                    startIcon={adminActionLoading ? <CircularProgress size={16} /> : <ThumbUp />}
                  >
                    {adminActionLoading ? 'Processing...' : 'Approve'}
                  </Button>

                  <Button
                    onClick={() => onReject()}
                    variant="contained"
                    color="error"
                    disabled={adminActionLoading}
                    startIcon={adminActionLoading ? <CircularProgress size={16} /> : <ThumbDown />}
                  >
                    {adminActionLoading ? 'Processing...' : 'Reject'}
                  </Button>
                </>
              )}

              {/* Save button for admins (can save anytime) */}
              {selectedEmployee && currentTimesheet && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                    onClick={() => saveTimesheet(false)}
                    disabled={loading || (role === 'EXTERNALEMPLOYEE' && isSubmitted) || currentTimesheet?.status === 'REJECTED' ||  currentTimesheet?.status === "PENDING_APPROVAL" }
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </Button>

                  <Button
                    variant="contained"
                    color="success"
                    startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}
                    onClick={submitWeeklyTimesheet || currentTimesheet?.status}
                    disabled={currentTimesheet?.status === "PENDING_APPROVAL"}
                    sx={{ minWidth: 140 }}
                  >
                    {loading ? 'Submitting...' : 'Submit for Approval'}
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </CardContent>
  </Card>
);

export default TimesheetTableSection;