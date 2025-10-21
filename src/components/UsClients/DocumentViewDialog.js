import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Paper,
    List,
    ListItem,
    ListItemText,
    Chip,
    Stack,
    Divider,
    AppBar,
    Toolbar,
    Slide
} from '@mui/material'
import {
    Close,
    Download,
    Visibility,
    Warning,
    PictureAsPdf,
    Image,
    Description,
    InsertDriveFile,
    OpenInNew as OpenInNewIcon,
    TableChart as ExcelIcon,
    Slideshow as PptIcon,
    Audiotrack as AudioIcon,
    Videocam as VideoIcon,
    Archive as ZipIcon,
    Code as CodeIcon,
} from '@mui/icons-material'

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const DocumentViewDialog = ({ open, onClose, client, documents }) => {
    const [loading, setLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // New states for enhanced preview
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewDocument, setPreviewDocument] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewContent, setPreviewContent] = useState(null);
    const [availableFiles, setAvailableFiles] = useState([]);
    const [filesLoading, setFilesLoading] = useState(false);

    // Load files when dialog opens
    useEffect(() => {
        if (open && client) {
            loadFiles();
        } else {
            setAvailableFiles([]);
        }
    }, [open, client]);

    const loadFiles = async () => {
        if (!client || !client.supportingDocuments) return;

        setFilesLoading(true);
        setError(null);
        
        try {
            // Map supportingDocuments to file objects
            const fileObjects = client.supportingDocuments.map((doc) => ({
                id: doc.id,
                name: doc.fileName,
                size: doc.size,
                type: getFileType(doc.fileName),
                contentType: doc.contentType,
                uploadedAt: doc.uploadedAt,
                filePath: doc.filePath
            }));
            
            setAvailableFiles(fileObjects);
        } catch (error) {
            console.error('Error loading files:', error);
            setError('Failed to load documents: ' + error.message);
        } finally {
            setFilesLoading(false);
        }
    };

    const fetchFileBlob = async (documentId) => {
        try {
            const apiUrl = `https://mymulya.com/api/us/requirements/client/download/${documentId}`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            return blob;
        } catch (error) {
            console.error('Error fetching file:', error);
            throw error;
        }
    };

    const handlePreview = async (file) => {
        setPreviewDocument(file);
        setPreviewOpen(true);
        setPreviewLoading(true);
        setPreviewContent(null);

        try {
            await previewFile(file);
        } catch (error) {
            console.error('Preview failed:', error);
            setPreviewContent(
                <Box sx={{ textAlign: "center", p: 4 }}>
                    <Typography color="error">
                        Failed to load preview: {error.message}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={() => handleDownloadIndividualFile(file)}
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

    const previewFile = async (file) => {
        const fileType = getFileType(file.name);

        try {
            // Fetch the file blob
            const fileBlob = await fetchFileBlob(file.id);

            if (fileType === "pdf") {
                const pdfBlob = new Blob([fileBlob], { type: 'application/pdf' });
                const pdfUrl = URL.createObjectURL(pdfBlob);

                setPreviewContent(
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
                            <iframe
                                src={pdfUrl}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                title={file.name}
                                style={{
                                    border: 'none',
                                    display: 'block'
                                }}
                            />
                        </Box>
                        <Box sx={{ p: 1, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary">
                                PDF Viewer - {file.name}
                            </Typography>
                        </Box>
                    </Box>
                );
            } else if (fileType === "image") {
                const url = URL.createObjectURL(fileBlob);
                setPreviewContent(
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 2, width: '100%', height: '100%' }}>
                        <img
                            src={url}
                            alt={file.name}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                            }}
                            onLoad={() => URL.revokeObjectURL(url)}
                            onError={(e) => {
                                URL.revokeObjectURL(url);
                                setPreviewContent(
                                    <Box sx={{ textAlign: "center", p: 4 }}>
                                        <Image sx={{ fontSize: 60, color: "#2ecc71" }} />
                                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                                            {file.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            Image cannot be displayed. Please download to view.
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<Download />}
                                            onClick={() => handleDownloadIndividualFile(file)}
                                        >
                                            Download Image
                                        </Button>
                                    </Box>
                                );
                            }}
                        />
                    </Box>
                );
            } else if (["word", "excel", "powerpoint"].includes(fileType)) {
                const url = URL.createObjectURL(fileBlob);
                setPreviewContent(
                    <Box sx={{ textAlign: "center", p: 4 }}>
                        {getPreviewIcon(file.name)}
                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                            {file.name}
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => handleDownloadIndividualFile(file)}
                            >
                                Download
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => {
                                    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
                                    window.open(officeViewerUrl, "_blank");
                                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                                }}
                            >
                                View Online
                            </Button>
                        </Box>
                    </Box>
                );
            } else if (fileType === "text") {
                try {
                    const text = await fileBlob.text();
                    setPreviewContent(
                        <Box sx={{ p: 3, width: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                {file.name}
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
                } catch (textError) {
                    setPreviewContent(
                        <Box sx={{ textAlign: "center", p: 4 }}>
                            {getPreviewIcon(file.name)}
                            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                                {file.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Cannot display file content. Please download to view.
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => handleDownloadIndividualFile(file)}
                            >
                                Download File
                            </Button>
                        </Box>
                    );
                }
            } else if (fileType === "audio") {
                const url = URL.createObjectURL(fileBlob);
                setPreviewContent(
                    <Box sx={{ textAlign: "center", p: 4 }}>
                        <AudioIcon sx={{ fontSize: 60, color: "#9c27b0" }} />
                        <Typography variant="h6" sx={{ mt: 2, mb: 3 }}>
                            {file.name}
                        </Typography>
                        <audio
                            controls
                            style={{ width: "100%", maxWidth: "400px" }}
                            onEnded={() => URL.revokeObjectURL(url)}
                        >
                            <source src={url} type={fileBlob.type} />
                            Your browser does not support the audio element.
                        </audio>
                        <Box sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => handleDownloadIndividualFile(file)}
                            >
                                Download
                            </Button>
                        </Box>
                    </Box>
                );
            } else if (fileType === "video") {
                const url = URL.createObjectURL(fileBlob);
                setPreviewContent(
                    <Box sx={{ textAlign: "center", p: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <VideoIcon sx={{ fontSize: 60, color: "#f44336", mb: 2 }} />
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            {file.name}
                        </Typography>
                        <Box sx={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <video
                                controls
                                style={{ maxWidth: "100%", maxHeight: "60vh" }}
                                onEnded={() => URL.revokeObjectURL(url)}
                            >
                                <source src={url} type={fileBlob.type} />
                                Your browser does not support the video element.
                            </video>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => handleDownloadIndividualFile(file)}
                            >
                                Download
                            </Button>
                        </Box>
                    </Box>
                );
            } else {
                const url = URL.createObjectURL(fileBlob);
                setPreviewContent(
                    <Box sx={{ textAlign: "center", p: 4 }}>
                        {getPreviewIcon(file.name)}
                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                            {file.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Preview not available for this file type.
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => handleDownloadIndividualFile(file)}
                            >
                                Download
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => {
                                    window.open(url, "_blank");
                                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                                }}
                            >
                                Open in New Tab
                            </Button>
                        </Box>
                    </Box>
                );
            }
        } catch (error) {
            console.error('Error previewing file:', error);
            setPreviewContent(
                <Box sx={{ textAlign: "center", p: 4 }}>
                    <Typography color="error">
                        Failed to load preview: {error.message}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={() => handleDownloadIndividualFile(file)}
                        sx={{ mt: 2 }}
                    >
                        Download File
                    </Button>
                </Box>
            );
        }
    };

    const handleDownloadIndividualFile = async (file) => {
        try {
            const fileBlob = await fetchFileBlob(file.id);
            const url = URL.createObjectURL(fileBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(url), 1000);

            showSuccess(`Downloaded ${file.name} successfully!`);
        } catch (error) {
            console.error('Error downloading file:', error);
            setError(`Download failed: ${error.message}`);
        }
    };

    const handleDownloadAll = async () => {
        if (!client || !client.supportingDocuments || client.supportingDocuments.length === 0) {
            setError('No documents available to download');
            return;
        }

        setDownloadLoading(true);
        setError(null);

        try {
            // Download all files sequentially
            for (const doc of client.supportingDocuments) {
                const fileBlob = await fetchFileBlob(doc.id);
                const url = URL.createObjectURL(fileBlob);

                const link = document.createElement('a');
                link.href = url;
                link.download = doc.fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setTimeout(() => URL.revokeObjectURL(url), 1000);
                
                // Small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            showSuccess('All documents downloaded successfully!');

        } catch (error) {
            console.error('Error downloading documents:', error);
            setError(`Download failed: ${error.message}`);
        } finally {
            setDownloadLoading(false);
        }
    };

    const showSuccess = (message) => {
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
        }, 3000);
    };

    const getFileType = (fileName) => {
        if (!fileName) return "other";

        const extension = fileName.split(".").pop().toLowerCase();

        if (["pdf"].includes(extension)) return "pdf";
        if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "tiff"].includes(extension)) return "image";
        if (["txt", "csv", "json", "xml", "html", "htm", "css", "js", "log"].includes(extension)) return "text";
        if (["doc", "docx"].includes(extension)) return "word";
        if (["xls", "xlsx", "xlsm"].includes(extension)) return "excel";
        if (["ppt", "pptx"].includes(extension)) return "powerpoint";
        if (["mp3", "wav", "ogg", "m4a", "flac"].includes(extension)) return "audio";
        if (["mp4", "webm", "ogg", "mov", "avi", "wmv"].includes(extension)) return "video";
        if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return "zip";

        return "other";
    };

    const getPreviewIcon = (fileName) => {
        const fileType = getFileType(fileName);
        switch (fileType) {
            case "pdf":
                return <PictureAsPdf sx={{ fontSize: 40, color: "#f40f02" }} />;
            case "word":
                return <Description sx={{ fontSize: 40, color: "#2953ac" }} />;
            case "excel":
                return <ExcelIcon sx={{ fontSize: 40, color: "#217346" }} />;
            case "powerpoint":
                return <PptIcon sx={{ fontSize: 40, color: "#d24726" }} />;
            case "image":
                return <Image sx={{ fontSize: 40, color: "#2ecc71" }} />;
            case "audio":
                return <AudioIcon sx={{ fontSize: 40, color: "#9c27b0" }} />;
            case "video":
                return <VideoIcon sx={{ fontSize: 40, color: "#f44336" }} />;
            case "zip":
                return <ZipIcon sx={{ fontSize: 40, color: "#795548" }} />;
            case "text":
                return <CodeIcon sx={{ fontSize: 40, color: "#333" }} />;
            default:
                return <InsertDriveFile sx={{ fontSize: 40 }} />;
        }
    };

    const getFileIcon = (filename) => {
        if (!filename) return <InsertDriveFile />;

        const ext = filename.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) return <PictureAsPdf color="error" />;
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return <Image color="primary" />;
        return <Description color="action" />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return "N/A";
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                            Documents - {client?.clientName}
                        </Typography>
                        <IconButton onClick={onClose}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers>
                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 2 }}
                            icon={<Warning />}
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Download completed successfully!
                        </Alert>
                    )}

                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            <strong>Note:</strong> Click on any document to preview or download it individually.
                        </Typography>
                    </Alert>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {availableFiles.length} document(s) available
                    </Typography>

                    {/* Document List */}
                    {filesLoading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                            <CircularProgress />
                            <Typography sx={{ ml: 2 }}>Loading documents...</Typography>
                        </Box>
                    ) : (
                        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                            <List sx={{ p: 0 }}>
                                {availableFiles.map((file, index) => (
                                    <React.Fragment key={file.id}>
                                        <ListItem
                                            sx={{
                                                py: 2,
                                                px: 3,
                                                "&:hover": {
                                                    bgcolor: "action.hover",
                                                    cursor: "pointer",
                                                },
                                            }}
                                            onClick={() => handlePreview(file)}
                                            secondaryAction={
                                                <Stack direction="row" spacing={1}>
                                                    <IconButton
                                                        edge="end"
                                                        color="info"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePreview(file);
                                                        }}
                                                        title="Preview Document"
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                    <IconButton
                                                        edge="end"
                                                        color="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownloadIndividualFile(file);
                                                        }}
                                                        title="Download Document"
                                                    >
                                                        <Download />
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
                                                    {getFileIcon(file.name)}
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
                                                                {file.name}
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
                                                                    label={file.type}
                                                                    size="small"
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                >
                                                                    {formatFileSize(file.size)}
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                >
                                                                    • {formatDate(file.uploadedAt)}
                                                                </Typography>
                                                            </Stack>
                                                        }
                                                    />
                                                </Box>
                                            </Stack>
                                        </ListItem>
                                        {index < availableFiles.length - 1 && <Divider sx={{ mx: 3 }} />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Paper>
                    )}

                    {availableFiles.length === 0 && !filesLoading && (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                            <Typography color="text.secondary">
                                No documents available
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>Close</Button>
                    <Button
                        onClick={handleDownloadAll}
                        variant="contained"
                        startIcon={downloadLoading ? <CircularProgress size={16} /> : <Download />}
                        disabled={downloadLoading || availableFiles.length === 0}
                    >
                        {downloadLoading ? 'Downloading...' : `Download All (${availableFiles.length})`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Enhanced Preview Dialog */}
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
                            {previewDocument && getPreviewIcon(previewDocument.name)}
                            <Box sx={{ ml: 2 }}>
                                <Typography variant="h6" noWrap>
                                    {previewDocument?.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {previewDocument && formatFileSize(previewDocument.size)}
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            startIcon={<Download />}
                            onClick={() => handleDownloadIndividualFile(previewDocument)}
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
                            <Close />
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

export default DocumentViewDialog;