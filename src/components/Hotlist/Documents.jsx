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
  Dialog,
  DialogContent,
  DialogTitle,
  AppBar,
  Toolbar,
  Slide,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Assignment as AssignmentIcon,
  Upload as UploadIcon,
  Add as AddIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Image as ImageIcon,
  Visibility as ViewIcon,
  OpenInNew as OpenInNewIcon,
  TableChart as ExcelIcon,
  Slideshow as PptIcon,
  Audiotrack as AudioIcon,
  Videocam as VideoIcon,
  Archive as ZipIcon,
  Code as CodeIcon,
} from "@mui/icons-material";
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils";
import { ConfirmDialog } from "../../ui-lib/ConfirmDialog";
import { CustomModal } from "../../ui-lib/CustomModal";
import { useSelector } from "react-redux";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
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

  const handlePreview = async (document) => {
    setPreviewDocument(document);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewContent(null);

    try {
      const res = await fetch(
        `https://mymulya.com/hotlist/download-document/${document.documentId}`
      );
      if (!res.ok) throw new Error("Failed to load document for preview");

      const blob = await res.blob();

      // Check file type and handle accordingly
      const fileType = getFileType(document.fileName);
      const url = URL.createObjectURL(blob);

      if (fileType === "pdf") {
        // PDF files
        setPreviewContent(
          <iframe
            src={url}
            width="100%"
            height="100%"
            frameBorder="0"
            title={document.fileName}
            style={{ minHeight: "70vh" }}
          />
        );
      } else if (fileType === "image") {
        // Image files
        setPreviewContent(
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <img
              src={url}
              alt={document.fileName}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
              }}
            />
          </Box>
        );
      } else if (fileType === "text") {
        // Text files - read and display content
        const text = await blob.text();
        setPreviewContent(
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {document.fileName}
            </Typography>
            <Paper
              variant="outlined"
              sx={{ p: 2, maxHeight: "60vh", overflow: "auto" }}
            >
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  margin: 0,
                }}
              >
                {text}
              </pre>
            </Paper>
          </Box>
        );
      } else if (fileType === "word") {
        // Word documents - use Microsoft Office Online viewer
        // First, we need to make the file publicly accessible for the viewer
        // Since we can't do that directly, we'll provide download and open options
        setPreviewContent(
          <Box sx={{ textAlign: "center", p: 4 }}>
            <DocIcon sx={{ fontSize: 60, color: "#2953ac" }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              {document.fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Word document preview is available through the Office Online
              Viewer.
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() =>
                  handleDownload(document.documentId, document.fileName)
                }
              >
                Download
              </Button>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => {
                  // Use Microsoft Office Online Viewer
                  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                    url
                  )}`;
                  window.open(officeViewerUrl, "_blank");
                }}
              >
                View Online
              </Button>
            </Box>
            <Typography
              variant="caption"
              display="block"
              sx={{ mt: 3, color: "text.secondary" }}
            >
              Note: The online viewer may take a moment to load your document.
            </Typography>
          </Box>
        );
      } else if (fileType === "excel") {
        // Excel files
        setPreviewContent(
          <Box sx={{ textAlign: "center", p: 4 }}>
            <ExcelIcon sx={{ fontSize: 60, color: "#217346" }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              {document.fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Excel spreadsheet preview is available through the Office Online
              Viewer.
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() =>
                  handleDownload(document.documentId, document.fileName)
                }
              >
                Download
              </Button>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => {
                  // Use Microsoft Office Online Viewer
                  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                    url
                  )}`;
                  window.open(officeViewerUrl, "_blank");
                }}
              >
                View Online
              </Button>
            </Box>
          </Box>
        );
      } else if (fileType === "powerpoint") {
        // PowerPoint files
        setPreviewContent(
          <Box sx={{ textAlign: "center", p: 4 }}>
            <PptIcon sx={{ fontSize: 60, color: "#d24726" }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              {document.fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              PowerPoint presentation preview is available through the Office
              Online Viewer.
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() =>
                  handleDownload(document.documentId, document.fileName)
                }
              >
                Download
              </Button>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => {
                  // Use Microsoft Office Online Viewer
                  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                    url
                  )}`;
                  window.open(officeViewerUrl, "_blank");
                }}
              >
                View Online
              </Button>
            </Box>
          </Box>
        );
      } else if (fileType === "audio") {
        // Audio files
        setPreviewContent(
          <Box sx={{ textAlign: "center", p: 4 }}>
            <AudioIcon sx={{ fontSize: 60, color: "#9c27b0" }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 3 }}>
              {document.fileName}
            </Typography>
            <audio controls style={{ width: "100%", maxWidth: "400px" }}>
              <source src={url} type={blob.type} />
              Your browser does not support the audio element.
            </audio>
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() =>
                  handleDownload(document.documentId, document.fileName)
                }
              >
                Download
              </Button>
            </Box>
          </Box>
        );
      } else if (fileType === "video") {
        // Video files
        setPreviewContent(
          <Box sx={{ textAlign: "center", p: 2 }}>
            <VideoIcon sx={{ fontSize: 60, color: "#f44336" }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
              {document.fileName}
            </Typography>
            <video controls style={{ maxWidth: "100%", maxHeight: "60vh" }}>
              <source src={url} type={blob.type} />
              Your browser does not support the video element.
            </video>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() =>
                  handleDownload(document.documentId, document.fileName)
                }
              >
                Download
              </Button>
            </Box>
          </Box>
        );
      } else if (fileType === "zip") {
        // Compressed files
        setPreviewContent(
          <Box sx={{ textAlign: "center", p: 4 }}>
            <ZipIcon sx={{ fontSize: 60, color: "#795548" }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              {document.fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Compressed file preview is not available. Please download to
              extract contents.
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() =>
                handleDownload(document.documentId, document.fileName)
              }
            >
              Download File
            </Button>
          </Box>
        );
      } else {
        // For all other types, show download option
        setPreviewContent(
          <Box sx={{ textAlign: "center", p: 4 }}>
            {getPreviewIcon(document.fileName)}
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              {document.fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Preview not available for this file type. Please download to view.
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() =>
                  handleDownload(document.documentId, document.fileName)
                }
              >
                Download
              </Button>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open(url, "_blank")}
              >
                Open in New Tab
              </Button>
            </Box>
          </Box>
        );
      }
    } catch (error) {
      showErrorToast(`Preview failed: ${error.message}`);
      setPreviewContent(
        <Box sx={{ textAlign: "center", p: 4 }}>
          <Typography color="error">
            Failed to load preview. Please try downloading the file.
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() =>
              handleDownload(
                previewDocument.documentId,
                previewDocument.fileName
              )
            }
            sx={{ mt: 2 }}
          >
            Download File
          </Button>
        </Box>
      );
    } finally {
      setPreviewLoading(false);
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

      showSuccessToast(
        `Document "${documentToDelete.fileName}" deleted successfully.`
      );

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
      if (file.size > 30 * 1024 * 1024) {
        showErrorToast(`Resume file "${file.name}" size should not exceed 5MB`);
        return;
      }
      formData.append("resumes", file);
    });

    // Add document files as a list
    documentFiles.forEach((file, index) => {
      if (file.size > 30 * 1024 * 1024) {
        showErrorToast(
          `Document file "${file.name}" size should not exceed 5MB`
        );
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
    setResumeFiles((prev) => [...prev, ...files]);
  };

  const handleDocumentFileChange = (event) => {
    const files = Array.from(event.target.files);
    setDocumentFiles((prev) => [...prev, ...files]);
  };

  const removeResumeFile = (index) => {
    setResumeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDocumentFile = (index) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
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

  const getFileType = (fileName) => {
    if (!fileName) return "other";

    const extension = fileName.split(".").pop().toLowerCase();

    // PDF files
    if (["pdf"].includes(extension)) return "pdf";

    // Image files
    if (
      ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "tiff"].includes(
        extension
      )
    )
      return "image";

    // Text files
    if (
      ["txt", "csv", "json", "xml", "html", "htm", "css", "js", "log"].includes(
        extension
      )
    )
      return "text";

    // Word documents
    if (["doc", "docx"].includes(extension)) return "word";

    // Excel files
    if (["xls", "xlsx", "xlsm"].includes(extension)) return "excel";

    // PowerPoint files
    if (["ppt", "pptx"].includes(extension)) return "powerpoint";

    // Audio files
    if (["mp3", "wav", "ogg", "m4a", "flac"].includes(extension))
      return "audio";

    // Video files
    if (["mp4", "webm", "ogg", "mov", "avi", "wmv"].includes(extension))
      return "video";

    // Compressed files
    if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return "zip";

    return "other";
  };

  const getPreviewIcon = (fileName) => {
    const fileType = getFileType(fileName);
    switch (fileType) {
      case "pdf":
        return <PdfIcon sx={{ fontSize: 40, color: "#f40f02" }} />;
      case "word":
        return <DocIcon sx={{ fontSize: 40, color: "#2953ac" }} />;
      case "excel":
        return <ExcelIcon sx={{ fontSize: 40, color: "#217346" }} />;
      case "powerpoint":
        return <PptIcon sx={{ fontSize: 40, color: "#d24726" }} />;
      case "image":
        return <ImageIcon sx={{ fontSize: 40, color: "#2ecc71" }} />;
      case "audio":
        return <AudioIcon sx={{ fontSize: 40, color: "#9c27b0" }} />;
      case "video":
        return <VideoIcon sx={{ fontSize: 40, color: "#f44336" }} />;
      case "zip":
        return <ZipIcon sx={{ fontSize: 40, color: "#795548" }} />;
      case "text":
        return <CodeIcon sx={{ fontSize: 40, color: "#333" }} />;
      default:
        return <FileIcon sx={{ fontSize: 40 }} />;
    }
  };

  // Upload modal actions
  const uploadModalActions = (
    <>
      <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
      <Button
        onClick={handleUploadSubmit}
        variant="contained"
        disabled={
          uploading || (resumeFiles.length === 0 && documentFiles.length === 0)
        }
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
                          cursor: "pointer",
                        },
                      }}
                      onClick={() => handlePreview(doc)}
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            edge="end"
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(doc);
                            }}
                            title="Preview Document"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(doc.documentId, doc.fileName);
                            }}
                            title="Download Document"
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(doc.documentId, doc.fileName);
                            }}
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
        message={`Are you sure you want to delete "${
          documentToDelete?.fileName || "this document"
        }"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
        loading={uploading}
      />

      {/* Document Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen
        TransitionComponent={Transition}
      >
        <AppBar position="sticky" elevation={1} color="default">
          <Toolbar>
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              {previewDocument && getPreviewIcon(previewDocument.fileName)}
              <Box sx={{ ml: 2 }}>
                <Typography variant="h6" noWrap>
                  {previewDocument?.fileName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {previewDocument && formatFileSize(previewDocument.fileSize)}
                </Typography>
              </Box>
            </Box>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() =>
                handleDownload(
                  previewDocument.documentId,
                  previewDocument.fileName
                )
              }
              sx={{ mr: 2 }}
            >
              Download
            </Button>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setPreviewOpen(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <DialogContent
          sx={{
            p: 0,
            backgroundColor: "#f5f5f5",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "80vh",
          }}
        >
          {previewLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading preview...</Typography>
            </Box>
          ) : (
            previewContent
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Documents;
