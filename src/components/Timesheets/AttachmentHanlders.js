import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  uploadTimesheetAttachments,
  deleteTimesheetAttachments,
  getTimesheetAttachmentsById,
} from '../../redux/timesheetSlice';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  CircularProgress,
} from '@mui/material';
import { CloudDownload } from '@mui/icons-material';
import axios from 'axios';
import ToastService from '../../Services/toastService';
import {
  extractErrorMessage,
  triggerDownload,
  getEditableDateRange,
  formatDateToYMD,
  getWeekDates,
  getDateForDay,
  isDateInCalendarMonth,
} from './timesheetUtils';

export const useAttachmentsHandler = () => {
  const dispatch = useDispatch();

  // Attachment states
  const [attachments, setAttachments] = useState([]);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // View attachment states
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [selectedTimesheetAttachments, setSelectedTimesheetAttachments] = useState([]);
  const [viewAttachmentDialogOpen, setViewAttachmentDialogOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(null);
  const [attachmentContent, setAttachmentContent] = useState(null);
  const [attachmentType, setAttachmentType] = useState('');
  const [viewLoading, setViewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState('');
  const [calendarValue, setCalendarValue] = useState(new Date());


    useEffect(() => {
      return () => {
        if (attachmentContent && (attachmentType === 'pdf' || attachmentType === 'image')) {
          if (typeof attachmentContent === 'string') {
            window.URL.revokeObjectURL(attachmentContent);
          }
        }
      };
    }, [attachmentContent, attachmentType]);
    

  const getWorkingDateRange = (timesheet) => {
    if (!timesheet || !selectedWeekStart) return null;

    // Get the week start date
    const weekStartDate = new Date(selectedWeekStart);

    // Calculate Monday and Friday of the current week
    const monday = new Date(weekStartDate);
    const friday = new Date(weekStartDate);
    friday.setDate(monday.getDate() + 4); // Friday is 4 days after Monday

    // If current month view is active, limit to current month dates
    if (calendarValue) {
      const currentMonth = calendarValue.getMonth();
      const currentYear = calendarValue.getFullYear();

      // Check if Monday is in current month
      const mondayInCurrentMonth = monday.getMonth() === currentMonth && monday.getFullYear() === currentYear;
      // Check if Friday is in current month  
      const fridayInCurrentMonth = friday.getMonth() === currentMonth && friday.getFullYear() === currentYear;

      if (mondayInCurrentMonth && fridayInCurrentMonth) {
        // Both in current month - use full week
        return {
          start: formatDateToYMD(monday),
          end: formatDateToYMD(friday)
        };
      } else if (mondayInCurrentMonth && !fridayInCurrentMonth) {
        // Only Monday side in current month
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        return {
          start: formatDateToYMD(monday),
          end: formatDateToYMD(lastDayOfMonth)
        };
      } else if (!mondayInCurrentMonth && fridayInCurrentMonth) {
        // Only Friday side in current month
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        return {
          start: formatDateToYMD(firstDayOfMonth),
          end: formatDateToYMD(friday)
        };
      }
    }

    // Default to Monday-Friday range
    return {
      start: formatDateToYMD(monday),
      end: formatDateToYMD(friday)
    };
  };

  const getEditableDateRange = (timesheet) => {
    if (!timesheet || !selectedWeekStart) return null;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const datesWithHours = [];

    days.forEach(day => {
      const dayDate = getDateForDay(selectedWeekStart, day);
      if (dayDate) {
        // Check if this day has ANY hours (working, sick leave, or holiday)
        const hasWorkingHours = timesheet[day] > 0;
        const hasSickLeave = timesheet.sickLeave && timesheet.sickLeave[day] > 0;
        const hasHoliday = timesheet.companyHoliday && timesheet.companyHoliday[day] > 0;
        const hasAnyHours = hasWorkingHours || hasSickLeave || hasHoliday;

        // Include date if it has hours, regardless of editability
        if (hasAnyHours) {
          datesWithHours.push(formatDateToYMD(dayDate));
        }
      }
    });

    if (datesWithHours.length === 0) {
      // Fallback: if no hours found, use the current calendar month weekdays
      days.forEach(day => {
        const dayDate = getDateForDay(selectedWeekStart, day);
        if (dayDate && isDateInCalendarMonth(dayDate, calendarValue)) {
          datesWithHours.push(formatDateToYMD(dayDate));
        }
      });
    }

    if (datesWithHours.length === 0) {
      // Final fallback: use the entire week (Monday to Friday)
      days.forEach(day => {
        const dayDate = getDateForDay(selectedWeekStart, day);
        if (dayDate) {
          datesWithHours.push(formatDateToYMD(dayDate));
        }
      });
    }

    if (datesWithHours.length === 0) return null;

    // Sort dates and return start and end
    datesWithHours.sort();
    return {
      start: datesWithHours[0],
      end: datesWithHours[datesWithHours.length - 1]
    };
  };


const uploadFilesToServer = async (timesheetId, files, startDate = null, endDate = null, currentTimesheet, selectedWeekStart) => {
  try {
    let finalStartDate = startDate;
    let finalEndDate = endDate;

    if ((!startDate || !endDate) && currentTimesheet) {
      console.log('Dates are null, calculating from timesheet...');

      // Use getWorkingDateRange for attachment uploads
      // This ensures the date range aligns with the timesheet week structure (Mon-Fri in current month)
      const dateRange = getEditableDateRange(currentTimesheet);
      
      if (dateRange) {
        finalStartDate = dateRange.start;
        finalEndDate = dateRange.end;
        console.log('Using calculated working date range:', dateRange);
      } else {
        // Fallback: Calculate Monday-Friday range within current month
        const weekStartDate = new Date(selectedWeekStart);
        const monday = new Date(weekStartDate);
        const friday = new Date(weekStartDate);
        friday.setDate(monday.getDate() + 4);
        
        // Check if we need to limit to current month
        if (calendarValue) {
          const currentMonth = calendarValue.getMonth();
          const currentYear = calendarValue.getFullYear();
          
          const mondayInCurrentMonth = monday.getMonth() === currentMonth && monday.getFullYear() === currentYear;
          const fridayInCurrentMonth = friday.getMonth() === currentMonth && friday.getFullYear() === currentYear;
          
          if (mondayInCurrentMonth && fridayInCurrentMonth) {
            finalStartDate = formatDateToYMD(monday);
            finalEndDate = formatDateToYMD(friday);
          } else if (mondayInCurrentMonth && !fridayInCurrentMonth) {
            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
            finalStartDate = formatDateToYMD(monday);
            finalEndDate = formatDateToYMD(lastDayOfMonth);
          } else if (!mondayInCurrentMonth && fridayInCurrentMonth) {
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
            finalStartDate = formatDateToYMD(firstDayOfMonth);
            finalEndDate = formatDateToYMD(friday);
          } else {
            // If neither in current month, use the week range as is
            finalStartDate = formatDateToYMD(monday);
            finalEndDate = formatDateToYMD(friday);
          }
        } else {
          finalStartDate = formatDateToYMD(monday);
          finalEndDate = formatDateToYMD(friday);
        }
        
        console.log('Using calculated fallback range:', { finalStartDate, finalEndDate });
      }
    }

    const uploadParams = {
      timesheetId,
      files
    };

    if (finalStartDate && finalEndDate && finalStartDate !== 'null' && finalEndDate !== 'null') {
      uploadParams.attachmentStartDate = finalStartDate;
      uploadParams.attachmentEndDate = finalEndDate;
      console.log('Including date parameters:', { finalStartDate, finalEndDate });
    } else {
      console.log('Skipping date parameters - they are null or invalid');
    }

    const resultAction = await dispatch(uploadTimesheetAttachments(uploadParams));

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

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    console.log('Files selected:', files);
    setSelectedFiles(files);
  };

const handleUploadAttachments = async (currentTimesheet, selectedWeekStart, setHasUnsavedChanges) => {
  if (selectedFiles.length === 0) {
    ToastService.warning('Please select at least one file to upload');
    return;
  }

  setUploading(true);

  try {
    if (currentTimesheet && currentTimesheet.id) {
      console.log('Timesheet has ID, uploading directly to server');

      // For attachment uploads, use the working date range (Monday-Friday within current month)
      // This ensures attachments align with the timesheet week structure
      const dateRange = getEditableDateRange(currentTimesheet)
      
      console.log('Date range for upload:', dateRange);
      
      const uploadResponse = await uploadFilesToServer(
        currentTimesheet.id,
        selectedFiles,
        dateRange ? dateRange.start : null,
        dateRange ? dateRange.end : null,
        currentTimesheet,
        selectedWeekStart
      );

      if (uploadResponse && uploadResponse.success) {
        const newAttachments = selectedFiles.map((file, index) => ({
          id: Date.now() * 1000 + Math.floor(Math.random() * 1000) + index,
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
      // Store files temporarily if no timesheet ID
      console.log('No timesheet ID, storing files for later upload');
      const tempAttachments = selectedFiles.map((file, index) => ({
        id: Date.now() * 1000 + Math.floor(Math.random() * 1000) + index,
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
      setHasUnsavedChanges(true);
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

  const handleRemoveAttachment = async (attachmentId, currentTimesheet, setHasUnsavedChanges) => {
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

  const handleViewAttachmentFile = async (attachment, timesheet = null) => {
    try {
      const attachmentId = attachment.id || attachment.attachmentId;

      if (!attachmentId) {
        ToastService.error('No attachment ID found');
        return;
      }

      setViewLoading(true);

      const response = await axios.get(
        `/timesheet/attachments/${attachmentId}/download?view=true`,
        {
          responseType: 'blob',
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

  // Return all state and functions
  return {
    // State
    attachments,
    setAttachments,
    pendingAttachments,
    setPendingAttachments,
    uploadDialogOpen,
    setUploadDialogOpen,
    uploading,
    setUploading,
    selectedFiles,
    setSelectedFiles,
    fileInputRef,
    attachmentsDialogOpen,
    setAttachmentsDialogOpen,
    selectedTimesheetAttachments,
    setSelectedTimesheetAttachments,
    viewAttachmentDialogOpen,
    setViewAttachmentDialogOpen,
    currentAttachment,
    setCurrentAttachment,
    attachmentContent,
    setAttachmentContent,
    attachmentType,
    setAttachmentType,
    viewLoading,
    setViewLoading,
    downloadLoading,
    setDownloadLoading,
    selectedWeekStart,
    setSelectedWeekStart,
    calendarValue,
    setCalendarValue,

    // Functions
    getWorkingDateRange,
    getEditableDateRange,
    uploadFilesToServer,
    handleFileSelect,
    handleUploadAttachments,
    fetchTimesheetAttachments,
    handleRemoveAttachment,
    handleViewAttachments,
    handleViewAttachmentFile,
    handleDownloadAttachmentFile,
    AttachmentViewDialog,
  };
};