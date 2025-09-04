import React from 'react';
import {
  Container, Typography, Box, Grid, TextField, Select, MenuItem, Button, Chip, CircularProgress, Table, TableHead, TableBody, TableRow, TableCell, Alert, Snackbar, FormControl, InputLabel, Card, CardContent, Avatar, List, ListItem, ListItemAvatar, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Input, FormHelperText, LinearProgress, Divider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { AccessTime, AttachFile, Delete, CloudUpload, ThumbDown, Visibility } from '@mui/icons-material';
import TimesheetTableSection from './TimesheetTableSection';
import enGB from 'date-fns/locale/en-GB';

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
    handleEmployeeChange
  } = props;

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
            Weekly Timesheet Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your weekly work hours and leave
          </Typography>
        </Box>
      </Box>

      {/* Combined Project and Week Selection Card */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
            Select Project and Week
          </Typography>

          <Grid container spacing={3} alignItems="flex-start">
            {/* Left Side: Project & Employee + Calendar */}
            <Grid item xs={12} md={5}>
              <Grid container spacing={2}>

 {((role === "SUPERADMIN" || role === "ACCOUNTS" ) || (isCreateMode && isAddingNewTimesheet)) && (
  <Grid item xs={12} md={6}>
    <FormControl fullWidth size="small">
      <InputLabel id="employee-select-label">Select Employee</InputLabel>
      <Select
        labelId="employee-select-label"
        value={isAddingNewTimesheet ? tempEmployeeForAdd : selectedEmployee}
        label="Select Employee"
        onChange={(e) => handleEmployeeChange(e.target.value)}
      >
        <MenuItem value="">Choose an employee...</MenuItem>
        {externalEmployeesOptions && externalEmployeesOptions.map((emp) => (
          <MenuItem key={emp.value} value={emp.value}>
            {emp.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>
)}

                {/* Project Dropdown */}
    
<Grid item xs={12} md={6}>
  <FormControl fullWidth size="small">
    <InputLabel id="project-select-label">Select Project</InputLabel>
    <Select
      labelId="project-select-label"
      value={selectedProject}
      label="Select Project"
      onChange={(e) => {
        console.log('Project selected:', e.target.value);
        setSelectedProject(e.target.value);
      }}
      disabled={
        loading || 
        loadingEmployeeProjects ||
        ((role === 'SUPERADMIN' || role === 'ACCOUNTS') && 
         (!selectedEmployee && !tempEmployeeForAdd))
      }
    >
      <MenuItem value="">Choose a project...</MenuItem>

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
      {(role === 'SUPERADMIN' || role === 'ACCOUNTS') && (selectedEmployee || tempEmployeeForAdd) && !loadingEmployeeProjects ? (
        employeeProjects && employeeProjects.length > 0 ? (
        employeeProjects.map((project) => (
  <MenuItem 
    key={project.projectId || project.id || project} 
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
  </FormControl>
</Grid>
              </Grid>

              {/* Calendar */}
              {selectedProject && (
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
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
                    <DateCalendar
                      value={calendarValue}
                      onChange={(newValue) => setCalendarValue(newValue)}
                      slots={{ day: CustomDay }}
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
                        },
                        "& .MuiPickersCalendarHeader-root": {
                          px: 1,
                          py: 0.5,
                        },
                        "& .MuiPickersCalendarHeader-labelContainer": {
                          fontSize: { xs: "0.9rem", sm: "1rem" },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Box>
              )}
            </Grid>

            {/* Right Side: Project Details */}
            <Grid item xs={12} md={7}>
              {projectDetails && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Project Details
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Client */}
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Client</Typography>
                      <Typography variant="body1" fontWeight="medium">{projectDetails.client}</Typography>
                    </Grid>
                    {/* Start Date */}
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Start Date</Typography>
                      <Typography variant="body1" fontWeight="medium">{projectDetails.startDate}</Typography>
                    </Grid>
                    {/* Approver */}
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Approver</Typography>
                      <Typography variant="body1" fontWeight="medium">{projectDetails.approver}</Typography>
                    </Grid>
                    {/* Frequency */}
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Frequency</Typography>
                      <Typography variant="body1" fontWeight="medium">{projectDetails.frequency}</Typography>
                    </Grid>
                    {/* Working Days */}
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


                    {/* Attachments */}
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      {/* Header Row */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
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

                      {/* EXTERNALEMPLOYEE View - Show their own attachments */}
                      {role === "EXTERNALEMPLOYEE" ? (
                        attachments.length > 0 ? (
                          <List
                            dense
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                              maxHeight: 200,
                              overflow: "auto",
                            }}
                          >
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
                                  <Avatar
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      bgcolor: file.uploaded ? "success.main" : "warning.main",
                                    }}
                                  >
                                    <AttachFile sx={{ fontSize: 14 }} />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <Typography variant="body2">{file.name}</Typography>
                                      {!file.uploaded && (
                                        <Chip label="Pending" size="small" color="warning" variant="outlined" />
                                      )}
                                    </Box>
                                  }
                                  secondary={
                                    formatFileSize(file.size) + " • " + file.uploadDate.toLocaleDateString()
                                  }
                                  primaryTypographyProps={{ variant: "body2" }}
                                  secondaryTypographyProps={{ variant: "caption" }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No attachments added to this timesheet
                          </Typography>
                        )
                      ) : (
                        /* SUPERADMIN/ACCOUNTS View - Show all uploaded attachments */
                        timesheetData && Array.isArray(timesheetData) && timesheetData.length > 0 && timesheetData.some(ts => ts.attachments?.length > 0) ? (
                          <Box>
                            <List
                              dense
                              sx={{
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1,
                                maxHeight: 200,
                                overflow: "auto",
                              }}
                            >
                              {timesheetData.flatMap((timesheet) =>
                                timesheet?.attachments
                                  ?.filter((att) => att.uploaded)
                                  .map((attachment) => (
                                    <ListItem
                                      key={attachment.id}
                                      secondaryAction={
                                        <IconButton
                                          edge="end"
                                          size="small"
                                          onClick={() => handleViewAttachments(timesheet)}
                                        >
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
                                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                    </Grid>

                  </Grid>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Timesheet Calendar View */}
      {selectedProject && selectedWeekStart && currentTimesheet && (
        <TimesheetTableSection
          selectedProject={selectedProject}
          currentTimesheet={currentTimesheet}
          currentWeekInfo={currentWeekInfo}
          isSubmitted={isSubmitted}
          pendingAttachments={pendingAttachments}
          loading={loading}
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

        />
      )}

      {selectedWeekStart && !isPresentWeek(selectedWeekStart) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This is a previous week's timesheet and cannot be edited or submitted.
        </Alert>
      )}

      {isPresentWeek(selectedWeekStart) && !isFridayInPresentWeek() && (
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
                        secondary={props.formatFileSize(file.size)}
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
            fullWidth
            variant="outlined"
            multiline
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

      {/* Empty State */}
      {!selectedProject && (
        <Card>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <AccessTime sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Project Selected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please select a project to start managing your timesheet
            </Typography>
          </CardContent>
        </Card>
      )}
      {props.AttachmentsDialog && <props.AttachmentsDialog />}
    </Container>
  );
};

export default TimesheetMainView;