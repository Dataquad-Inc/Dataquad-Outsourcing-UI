import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  AttachFile,
  CloudDownload,
  Close
} from '@mui/icons-material';
import ToastService from '../../Services/toastService';

// Helper function to trigger file download
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

// Create a separate component for the attachment dialog
export const AttachmentViewDialogComponent = ({
  open,
  onClose,
  currentAttachment,
  attachmentContent,
  attachmentType,
  viewLoading,
  onDownload
}) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachFile />
          <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
            {currentAttachment?.filename || 'Attachment'}
          </Typography>
          <IconButton
            size="small"
            onClick={onDownload}
            title="Download"
            disabled={viewLoading}
          >
            <CloudDownload />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleClose}
            title="Close"
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0, overflow: 'hidden' }}>
        {viewLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading attachment...</Typography>
          </Box>
        ) : (
          <>
            {/* PDF Viewer */}
            {attachmentType === 'pdf' && attachmentContent && (
              <iframe
                src={`${attachmentContent}#toolbar=0&navpanes=0&scrollbar=0`}
                title="PDF Preview"
                style={{ width: "100%", height: "80vh", border: "none" }}
              />
            )}
            
            {/* Image Viewer */}
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
                  onClick={onDownload}
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
          onClick={onDownload}
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

// Custom hook for attachment handling
export const useAttachmentHandlers = () => {
  // State for dialog management
  const [viewAttachmentDialogOpen, setViewAttachmentDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  
  // State for current attachment
  const [currentAttachment, setCurrentAttachment] = useState(null);
  const [attachmentContent, setAttachmentContent] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);

  // View attachment handler
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
          baseURL: 'https://mymulya.com' 
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

  // Download attachment handler
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
          baseURL: 'https://mymulya.com' 
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

  const handleDownloadFromDialog = () => {
    if (currentAttachment?.blob) {
      triggerDownload(currentAttachment.blob, currentAttachment.filename);
    } else if (attachmentType === 'text' && attachmentContent) {
      const blob = new Blob([attachmentContent], { 
        type: currentAttachment?.contentType || 'text/plain' 
      });
      triggerDownload(blob, currentAttachment?.filename || 'textfile.txt');
    }
  };

  const handleCloseDialog = () => {
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

  // Return the handlers and the dialog component
 return {
    handleViewAttachmentFile,
    handleDownloadAttachmentFile,
    viewLoading,
    downloadLoading,
    getAttachmentViewDialog: (props) => (
      <AttachmentViewDialogComponent
        open={viewAttachmentDialogOpen}
        onClose={handleCloseDialog}
        currentAttachment={currentAttachment}
        attachmentContent={attachmentContent}
        attachmentType={attachmentType}
        viewLoading={viewLoading}
        onDownload={handleDownloadFromDialog}
        {...props}
      />
    )
  };
};