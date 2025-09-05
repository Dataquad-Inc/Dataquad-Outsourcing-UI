// Updated TimesheetTableSection.jsx
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
  calendarValue, isDateInCalendarMonth
}) => (

  <Card sx={{ mb: 3 }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Typography variant="h6" fontWeight="bold">
            Timesheet for {selectedProject}
            {(role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE") && selectedEmployee && (
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
          {(role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE") && currentTimesheet && (
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

      {(role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE") && !selectedEmployee && (
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
                  const isEditable = isFieldEditable(currentTimesheet, day, null, calendarValue) && isInCalendarMonth;

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
                        disabled={!isEditable}
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
                  const isEditable = isFieldEditable(currentTimesheet, day, 'sickLeave', calendarValue) && isInCalendarMonth && !isWeekend;

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
                        disabled={!isEditable}
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
      )}

      {/* Notes and Actions Section */}
      <Box sx={{ mt: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Notes & Additional Information
        </Typography>


        {role === 'EXTERNALEMPLOYEE' && canEditTimesheet && currentTimesheet.status === 'REJECTED' && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Edit />}
            onClick={handleEditTimesheet}
            disabled={loading || adminActionLoading}
            sx={{ minWidth: 120 }}
          >
            Edit Timesheet
          </Button>
        )}

        {role === 'EXTERNALEMPLOYEE' && isEditMode && (
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={16} /> : <Save />}
            onClick={() => saveTimesheet(false, true)} // Pass true for isEdit parameter
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}

        <TextField
          multiline
          rows={3}
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add any notes or comments about this timesheet..."
          disabled={
            role === 'EXTERNALEMPLOYEE'
              ? (isSubmitted || !currentTimesheet.isEditable)
              : false // SUPERADMIN and ACCOUNTS can always edit notes
          }
          sx={{ mb: 3, width: '50%' }}
        />

        {/* Progress and Actions */}
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

            {/* Show different buttons based on role and mode */}
            {(role === 'SUPERADMIN' || role === 'ACCOUNTS' || role === "INVOICE") && !isAddingNewTimesheet && !isCreateMode ? (
              <>
                {/* Admin action buttons - only show if employee is selected and timesheet exists */}
                {selectedEmployee && currentTimesheet && (
                  <>
                    <Button
                      onClick={onApprove}
                      variant="contained"
                      color="success"
                      disabled={adminActionLoading || currentTimesheet.status === 'APPROVED'}
                      startIcon={adminActionLoading ? <CircularProgress size={16} /> : <ThumbUp />}
                    >
                      {adminActionLoading ? 'Processing...' : 'Approve'}
                    </Button>

                    <Button
                      onClick={onReject}
                      variant="contained"
                      color="error"
                      disabled={adminActionLoading || currentTimesheet.status === 'REJECTED'}
                      startIcon={adminActionLoading ? <CircularProgress size={16} /> : <ThumbDown />}
                    >
                      {adminActionLoading ? 'Processing...' : 'Reject'}
                    </Button>

                    <Button
                      onClick={onCancel}
                      variant="outlined"
                      color="default"
                      disabled={adminActionLoading || currentTimesheet.status === 'CANCELLED'}
                      startIcon={adminActionLoading ? <CircularProgress size={16} /> : <Cancel />}
                    >
                      {adminActionLoading ? 'Processing...' : 'Cancel'}
                    </Button>
                  </>
                )}

                {/* Save button for admins (can save anytime) */}
                {selectedEmployee && currentTimesheet && (
                  <Button
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                    onClick={() => saveTimesheet(false)}
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
                  disabled={loading || (role === 'EXTERNALEMPLOYEE' && isSubmitted)}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}
                  onClick={submitWeeklyTimesheet}
                  // disabled={loading || (role === 'EXTERNALEMPLOYEE' && (isSubmitted || !isFridayInPresentWeek()))}
                  sx={{ minWidth: 140 }}
                >
                  {loading ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default TimesheetTableSection;
