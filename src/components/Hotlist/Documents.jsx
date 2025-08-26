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
} from "@mui/material";
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Assignment as AssignmentIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import { showErrorToast, showSuccessToast } from "../../utils/toastUtils";
import showDeleteConfirm from "../../utils/showDeleteConfirm";

const Documents = ({ consultantId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploading, setUploading] = useState(false);

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

 
    showSuccessToast(`Document "${fileName || documentId}" downloaded successfully.`);
  } catch (error) {
    
    showErrorToast(`Download failed: ${error.message}`);
  }
};

 const handleDelete = (documentId, fileName) => {
  showDeleteConfirm(
    async () => {
      try {
        const res = await fetch(
          `https://mymulya.com/hotlist/deleteDocument/${documentId}`,
          { method: "DELETE" }
        );

        if (!res.ok) throw new Error("Failed to delete document");

        // ✅ Success toast
        showSuccessToast(`Document "${documentId}" deleted successfully.`);

     
        setDocuments((prev) =>
          prev.filter((doc) => doc.documentId !== documentId)
        );
      } catch (error) {
       
        showErrorToast(`Delete failed: ${error.message}`);
      }
    },
    fileName || "this document"
  );
};


  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Optional file size limit (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should not exceed 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await fetch(
        `https://mymulya.com/hotlist/addDocument/${consultantId}`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!res.ok) throw new Error("Failed to upload document");

      const result = await res.json();
      if (result.success) {
        alert("Document uploaded successfully");
        fetchDocuments();
      } else {
        throw new Error(result.error?.errorMessage || "Upload failed");
      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      event.target.value = ""; // reset input
    }
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
            component="label"
            startIcon={<UploadIcon />}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Document"}
            <input
              type="file"
              hidden
              onChange={handleUpload}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            />
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
                          onClick={() => handleDelete(doc.documentId)}
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
  );
};

export default Documents;
