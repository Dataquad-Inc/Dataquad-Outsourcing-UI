import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Alert,
  Paper,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  Grid,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Assignment as AssignmentIcon,
  Upload as UploadIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils";
import { ConfirmDialog } from "../../ui-lib/ConfirmDialog"; // Import your custom ConfirmDialog
import { CustomModal } from "../../ui-lib/CustomModal"; // Import your custom Modal
import { useSelector } from "react-redux";

const Documents = ({ consultantId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [resumeFiles, setResumeFiles] = useState([]);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const { userId } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchDocuments();
  }, [consultantId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(
        `https://mymulya.com/hotlist/getDocumentDetails/${consultantId}`
      );
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const result = await res.json();

      if (result.success) {
        setDocuments(result.data || []);
      } else {
        setErrorMsg(result.error?.errorMessage || "Failed to fetch documents");
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const res = await fetch(
        `https://mymulya.com/hotlist/download-document/${documentId}`
      );
      if (!res.ok) throw new Error("Failed to download document");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || `Document_${documentId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccessToast(
        `Document "${fileName || documentId}" downloaded successfully.`
      );
    } catch (error) {
      showErrorToast(`Download failed: ${error.message}`);
    }
  };

  const handleDeleteClick = (documentId, fileName) => {
    setDocumentToDelete({ documentId, fileName });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    
    try {
      const res = await fetch(
        `https://mymulya.com/hotlist/deleteDocument/${documentToDelete.documentId}/${userId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete document");

      showSuccessToast(`Document "${documentToDelete.documentId}" deleted successfully.`);

      setDocuments((prev) =>
        prev.filter((doc) => doc.documentId !== documentToDelete.documentId)
      );
    } catch (error) {
      showErrorToast(`Delete failed: ${error.message}`);
    } finally {
      setDeleteConfirmOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (resumeFiles.length === 0 && documentFiles.length === 0) {
      showErrorToast("Please select at least one file to upload");
      return;
    }

    const formData = new FormData();
    
    // Add resume files as a list
    resumeFiles.forEach((file, index) => {
      // Optional file size limit (e.g., 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast(`Resume file "${file.name}" size should not exceed 5MB`);
        return;
      }
      formData.append("resumes", file);
    });
    
    // Add document files as a list
    documentFiles.forEach((file, index) => {
      // Optional file size limit (e.g., 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast(`Document file "${file.name}" size should not exceed 5MB`);
        return;
      }
      formData.append("documents", file);
    });

    try {
      setUploading(true);
      const res = await fetch(
        `https://mymulya.com/hotlist/addDocument/${consultantId}`,
        {
          method: "POST",
          body: formData,
        }
      );
      
      if (!res.ok) throw new Error("Failed to upload documents");

      const result = await res.json();
      if (result.success) {
        showSuccessToast("Documents uploaded successfully");
        fetchDocuments();
        setUploadDialogOpen(false);
        setResumeFiles([]);
        setDocumentFiles([]);
      } else {
        throw new Error(result.error?.errorMessage || "Upload failed");
      }
    } catch (error) {
      showErrorToast(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleResumeFileChange = (event) => {
    const files = Array.from(event.target.files);
    setResumeFiles(prev => [...prev, ...files]);
  };

  const handleDocumentFileChange = (event) => {
    const files = Array.from(event.target.files);
    setDocumentFiles(prev => [...prev, ...files]);
  };

  const removeResumeFile = (index) => {
    setResumeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocumentFile = (index) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (documentType) => {
    const type = documentType?.toLowerCase();
    if (type?.includes("resume") || type?.includes("cv")) {
      return <AssignmentIcon />;
    }
    return <FileIcon />;
  };

  const getDocumentTypeColor = (documentType) => {
    const type = documentType?.toLowerCase();
    if (type?.includes("resume") || type?.includes("cv")) return "primary";
    if (type?.includes("certificate")) return "success";
    if (type?.includes("identity")) return "warning";
    return "default";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  // Upload modal actions
  const uploadModalActions = (
    <>
      <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
      <Button
        onClick={handleUploadSubmit}
        variant="contained"
        disabled={uploading || (resumeFiles.length === 0 && documentFiles.length === 0)}
      >
        {uploading ? "Uploading..." : "Upload"}
      </Button>
    </>
  );

  if (loading) {
    return (
      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
      >
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading documents...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <AssignmentIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Documents ({documents.length})
              </Typography>
            </Stack>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Add Documents
            </Button>
          </Stack>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMsg}
            </Alert>
          )}

          {documents.length === 0 ? (
            <Alert severity="info" sx={{ textAlign: "center" }}>
              <Typography variant="body1">
                No documents found for this consultant
              </Typography>
            </Alert>
          ) : (
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <List sx={{ p: 0 }}>
                {documents.map((doc, index) => (
                  <React.Fragment key={doc.documentId}>
                    <ListItem
                      sx={{
                        py: 2,
                        px: 3,
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            edge="end"
                            color="primary"
                            onClick={() =>
                              handleDownload(doc.documentId, doc.fileName)
                            }
                            title="Download Document"
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => handleDeleteClick(doc.documentId, doc.fileName)}
                            title="Delete Document"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        sx={{ flex: 1 }}
                      >
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor: "primary.50",
                            color: "primary.main",
                          }}
                        >
                          {getFileIcon(doc.documentType)}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <ListItemText
                            primary={
                              <Typography
                                variant="subtitle1"
                                fontWeight="600"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {doc.fileName}
                              </Typography>
                            }
                            secondary={
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ mt: 0.5 }}
                              >
                                <Chip
                                  label={doc.documentType}
                                  size="small"
                                  color={getDocumentTypeColor(doc.documentType)}
                                  variant="outlined"
                                />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  •
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {new Date(doc.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </Typography>
                                {doc.fileSize && (
                                  <>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      •
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {formatFileSize(doc.fileSize)}
                                    </Typography>
                                  </>
                                )}
                              </Stack>
                            }
                          />
                        </Box>
                      </Stack>
                    </ListItem>
                    {index < documents.length - 1 && <Divider sx={{ mx: 3 }} />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal using CustomModal */}
      <CustomModal
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        title="Upload Documents"
        actions={uploadModalActions}
        maxWidth="md"
      >
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Resume/CV Files
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<UploadIcon />}
              sx={{ mb: 2 }}
            >
              Add Resume Files
              <input
                type="file"
                hidden
                multiple
                onChange={handleResumeFileChange}
                accept=".pdf,.doc,.docx"
              />
            </Button>
            
            {resumeFiles.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Selected Resume Files:
                </Typography>
                <List dense>
                  {resumeFiles.map((file, index) => (
                    <ListItem 
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => removeResumeFile(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={file.name}
                        secondary={formatFileSize(file.size)}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Other Documents
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<UploadIcon />}
              sx={{ mb: 2 }}
            >
              Add Document Files
              <input
                type="file"
                hidden
                multiple
                onChange={handleDocumentFileChange}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
            </Button>
            
            {documentFiles.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Selected Document Files:
                </Typography>
                <List dense>
                  {documentFiles.map((file, index) => (
                    <ListItem 
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => removeDocumentFile(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={file.name}
                        secondary={formatFileSize(file.size)}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Grid>
        </Grid>
      </CustomModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${documentToDelete?.fileName || 'this document'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
        loading={uploading}
      />
    </>
  );
};

export default Documents;