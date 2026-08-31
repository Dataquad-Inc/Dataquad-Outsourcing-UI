import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Close,
  CloudUpload,
  Delete,
  Download,
  AttachFile,
  InsertDriveFile,
  PictureAsPdf,
  Description,
  Image,
  Refresh,
} from '@mui/icons-material';
import httpService from '../../Services/httpService';
import ToastService from '../../Services/toastService';

const DocumentManager = ({ open, onClose, placementId, placementName }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);

  // Fetch documents when dialog opens
  useEffect(() => {
    if (open && placementId) {
      fetchDocuments();
    } else {
      // Reset state when dialog closes
      setSelectedFiles([]);
      setError(null);
      const fileInput = document.getElementById('file-upload-input');
      if (fileInput) fileInput.value = '';
    }
  }, [open, placementId]);

  const fetchDocuments = async () => {
    if (!placementId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await httpService.get(`/candidate/placement/${placementId}/docs`);
      if (response.status === 200 && response.data.success) {
        setDocuments(response.data.data || []);
      } else {
        setError('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error?.response?.data?.message || 'Failed to fetch documents');
      ToastService.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      ToastService.warning('Please select files to upload');
      return;
    }

    setUploading(true);
    setError(null);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await httpService.post(
        `/candidate/placement/${placementId}/docs/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 201 && response.data.success) {
        const uploadedDocs = response.data.data || [];
        
        ToastService.success(
          `${uploadedDocs.length || selectedFiles.length} document(s) uploaded successfully`
        );
        
        // Clear selected files
        setSelectedFiles([]);
        const fileInput = document.getElementById('file-upload-input');
        if (fileInput) fileInput.value = '';

        // Fetch the latest documents to ensure we have the complete list
        await fetchDocuments();
      } else {
        setError('Upload failed. Please try again.');
        ToastService.error('Failed to upload documents');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to upload documents';
      setError(errorMsg);
      ToastService.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (documentId, fileName) => {
    if (!documentId) {
      ToastService.error('Invalid document ID');
      return;
    }

    try {
      ToastService.loading('Downloading document...', { toastId: 'downloadDoc' });
      
      const response = await httpService.get(
        `/candidate/placement/docs/${documentId}/download`,
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `document_${documentId}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      ToastService.dismiss('downloadDoc');
      ToastService.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      ToastService.dismiss('downloadDoc');
      ToastService.error(error?.response?.data?.message || 'Failed to download document');
    }
  };

  const handleDelete = async (documentId, fileName) => {
    if (!documentId) {
      ToastService.error('Invalid document ID');
      return;
    }

    try {
      const response = await httpService.delete(
        `/candidate/placement/docs/${documentId}`
      );

      if (response.status === 200 && response.data.success) {
        ToastService.success('Document deleted successfully');
        // Remove from local state immediately
        setDocuments(prevDocs => prevDocs.filter(doc => {
          const docId = doc.documentId || doc.id;
          return docId !== documentId;
        }));
      } else {
        ToastService.error('Failed to delete document');
        // Refresh to ensure consistency
        await fetchDocuments();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      ToastService.error(error?.response?.data?.message || 'Failed to delete document');
      // Refresh to ensure consistency
      await fetchDocuments();
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <InsertDriveFile />;
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PictureAsPdf sx={{ color: '#d32f2f', fontSize: 32 }} />;
      case 'doc':
      case 'docx':
        return <Description sx={{ color: '#1976d2', fontSize: 32 }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image sx={{ color: '#2e7d32', fontSize: 32 }} />;
      default:
        return <InsertDriveFile sx={{ fontSize: 32 }} />;
    }
  };

  const getFileTypeColor = (fileName) => {
    if (!fileName) return 'default';
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'error';
      case 'doc':
      case 'docx':
        return 'primary';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'success';
      default:
        return 'default';
    }
  };

  const getFileTypeLabel = (fileName) => {
    if (!fileName) return 'Unknown';
    const extension = fileName.split('.').pop()?.toUpperCase();
    return extension || 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      setError(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    const fileInput = document.getElementById('file-upload-input');
    if (fileInput) fileInput.value = '';
  };

  const getTotalFileSize = () => {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #eee',
          pb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Document Manager
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {placementName ? `${placementName} (${placementId})` : `Placement: ${placementId}`}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="close">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 2 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Upload Section */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            mb: 3,
            borderStyle: 'dashed',
            borderWidth: 2,
            backgroundColor: '#fafafa',
            ...(selectedFiles.length > 0 && {
              borderColor: 'primary.main',
              backgroundColor: 'primary.50',
            }),
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Upload Documents
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              component="label"
              startIcon={<AttachFile />}
              disabled={uploading}
            >
              Select Files
              <input
                id="file-upload-input"
                type="file"
                hidden
                multiple
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
              />
            </Button>

            <Button
              variant="contained"
              color="primary"
              startIcon={<CloudUpload />}
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? <CircularProgress size={24} /> : 'Upload'}
            </Button>

            {selectedFiles.length > 0 && (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={clearSelectedFiles}
                  disabled={uploading}
                >
                  Clear All
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {selectedFiles.length} file(s) selected ({formatFileSize(getTotalFileSize())})
                </Typography>
              </>
            )}
          </Box>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <List dense sx={{ mt: 2, maxHeight: 150, overflow: 'auto' }}>
              {selectedFiles.map((file, index) => (
                <ListItem
                  key={index}
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: 1,
                    mb: 0.5,
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2" noWrap>
                        {file.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.size)}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => removeSelectedFile(index)}
                      disabled={uploading}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          {selectedFiles.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Drag & drop files here or click "Select Files" to choose files
            </Typography>
          )}
        </Paper>

        {/* Documents List */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Uploaded Documents ({documents.length})
          </Typography>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={fetchDocuments} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : documents.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No documents uploaded yet
            </Typography>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
            <List dense>
              {documents.map((doc, index) => {
                // Handle different possible ID field names
                const docId = doc.documentId || doc.id || index;
                return (
                  <React.Fragment key={docId}>
                    <ListItem
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        py: 1.5,
                      }}
                    >
                      <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                        {getFileIcon(doc.fileName)}
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium" noWrap>
                            {doc.fileName || `Document ${docId}`}
                          </Typography>
                        }
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }} flexWrap="wrap">
                            <Chip
                              label={getFileTypeLabel(doc.fileName)}
                              size="small"
                              color={getFileTypeColor(doc.fileName)}
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Uploaded: {formatDate(doc.createdAt)}
                            </Typography>
                            {doc.documentType && doc.documentType !== 'GENERAL' && (
                              <Chip
                                label={doc.documentType}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            )}
                            {doc.fileType && (
                              <Typography variant="caption" color="text.secondary">
                                Type: {doc.fileType}
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Download">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleDownload(docId, doc.fileName)}
                            sx={{ mr: 0.5 }}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleDelete(docId, doc.fileName)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < documents.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #eee', py: 2, px: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button
          onClick={fetchDocuments}
          variant="text"
          disabled={loading}
          startIcon={<Refresh />}
        >
          Refresh
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentManager;