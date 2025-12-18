import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";
import {
  Download,
  Visibility,
  Close,
  Description,
  Delete,
  ArrowBack,
} from "@mui/icons-material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { showErrorToast } from "../../utils/toastUtils";
import { useSelector } from "react-redux";

const CandidateProfile = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [candidateData, setCandidateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const { role } = useSelector((state) => state.auth)

  useEffect(() => {
    fetchCandidateData();
  }, []);

  const fetchCandidateData = async () => {
    try {
      const response = await fetch(
        `https://mymulya.com/api/us/requirements/get-submission/by-id/${submissionId}`
      );
      if (!response.ok) throw new Error("Failed to fetch candidate data");

      const data = await response.json();
      setCandidateData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const MIME_EXTENSION_MAP = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "text/plain": "txt",
    "application/zip": "zip",
  };

  const handleDownloadResume = async (submissionId, candidateName) => {
    try {
      const response = await fetch(
        `https://mymulya.com/api/us/requirements/download-resume/${submissionId}`,
        { method: "GET", headers: { "Content-Type": "application/octet-stream" } }
      );

      if (!response.ok) throw new Error("Failed to download resume");

      const blob = await response.blob();

      const contentDisposition = response.headers.get("content-disposition");
      let fileName = `Resume-${candidateName}-${submissionId}`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match?.[1]) {
          fileName = match[1];
        }
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && MIME_EXTENSION_MAP[contentType]) {
          fileName += `.${MIME_EXTENSION_MAP[contentType]}`;
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading resume:", error);
      showErrorToast("Failed to download resume");
    }
  };

  const handleViewResume = async () => {
    try {
      const response = await fetch(
        `https://mymulya.com/api/us/requirements/download-resume/${submissionId}`
      );
      if (!response.ok) throw new Error("Failed to view resume");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setViewingFile({
        name: `${candidateData.candidateName}_Resume.pdf`,
        url,
      });
    } catch (err) {
      alert("Failed to view document: " + err.message);
    }
  };

  const handleDownloadDocument = async (fileName) => {
    try {
      const response = await fetch(
        `https://mymulya.com/api/us/requirements/download-multidoc/${submissionId}/${encodeURIComponent(
          fileName
        )}`
      );
      if (!response.ok) throw new Error("Failed to download document");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download: " + err.message);
    }
  };

  const handleViewDocument = async (fileName) => {
    try {
      const response = await fetch(
        `https://mymulya.com/api/us/requirements/download-multidoc/${submissionId}/${encodeURIComponent(
          fileName
        )}`
      );
      if (!response.ok) throw new Error("Failed to view document");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setViewingFile({ name: fileName, url });
    } catch (err) {
      alert("Failed to view document: " + err.message);
    }
  };

  const handleDeleteDocument = async (fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`))
      return;

    try {
      const response = await fetch(
        `https://mymulya.com/api/us/requirements/delete-multi-doc/${submissionId}/${encodeURIComponent(
          fileName
        )}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete document");

      setCandidateData((prev) => ({
        ...prev,
        fileName: prev.fileName.filter((f) => f !== fileName),
      }));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleBackClick = () => {
    if (location.state?.from) {
      navigate(location.state.from, { state: { tabIndex: 1 } });
    } else {
      navigate("/dashboard/us-submissions");
    }
  };

  const getBackButtonText = () => {
    const fromPath = location.state?.from;

    if (fromPath && fromPath.includes('/dashboard/us-requirements')) {
      return "Back to Candidates";
    }
    else if (fromPath && fromPath.includes('/dashboard/us-submissions')) {
      return "Back to Submissions";
    }
    else {
      return "Back";
    }
  };

  const handleCloseViewer = () => {
    if (viewingFile) {
      window.URL.revokeObjectURL(viewingFile.url);
      setViewingFile(null);
    }
  };

  // UI STATES
  if (loading)
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );

  if (!candidateData) return null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5", p: 2 }}>
      {/* ⭐ BACK TO SUBMISSIONS BUTTON ⭐ */}
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={() => handleBackClick()}
        sx={{ mb: 2 }}
      >
        {getBackButtonText()}
      </Button>

      <Card sx={{ p: 1 }}>
        <CardContent>
          <Typography variant="h4" fontWeight="bold">
            {candidateData.candidateName}
          </Typography>

          <Typography color="text.secondary">
            ID: {candidateData.submissionId}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Section title="Contact Information">
            <InfoRow label="Email" value={candidateData.candidateEmail} />
            <InfoRow label="Mobile" value={candidateData.mobileNumber} />
            <InfoRow label="Location" value={candidateData.currentLocation} />
            <InfoRow label="DOB" value={candidateData.dob} />
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="Professional Details">
            <InfoRow
              label="Total Experience"
              value={`${candidateData.totalExperience} years`}
            />
            <InfoRow
              label="Relevant Experience"
              value={`${candidateData.relevantExperience} years`}
            />
            <InfoRow
              label="Qualification"
              value={candidateData.qualification}
            />
            <InfoRow label="Visa Type" value={candidateData.visaType} />
            <InfoRow
              label="Notice Period"
              value={`${candidateData.noticePeriod} days`}
            />
            <InfoRow
              label="Employment Type"
              value={candidateData.employmentType}
            />
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="Compensation">
            <InfoRow
              label="Bill Rate"
              value={`$${candidateData.billRate}/hr`}
            />
            <InfoRow label="Pay Rate" value={`$${candidateData.payRate}/hr`} />
            <InfoRow label="Recruiter" value={candidateData.recruiterName} />
          </Section>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Documents & Resume
          </Typography>

          <List sx={{ mt: 1 }}>
            <DocItem
              title={`${candidateData.candidateName}_Resume.pdf`}
              onView={handleViewResume}
              onDownload={handleDownloadResume}
              onDelete={null}
            />

            {candidateData.fileName?.map((fileName, idx) => (
              <DocItem
                key={idx}
                title={fileName}
                onView={() => handleViewDocument(fileName)}
                onDownload={() => handleDownloadDocument(fileName)}
                onDelete={() => handleDeleteDocument(fileName)}
              />
            ))}
          </List>
        </CardContent>
      </Card>

      <Dialog
        open={!!viewingFile}
        onClose={handleCloseViewer}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">{viewingFile?.name}</Typography>
          <IconButton onClick={handleCloseViewer}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, height: "80vh" }}>
          {viewingFile && (
            <iframe
              src={viewingFile.url}
              title={viewingFile.name}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// SMALL COMPONENTS
const Section = ({ title, children }) => (
  <Box>
    <Typography variant="h6" fontWeight="bold" gutterBottom>
      {title}
    </Typography>
    <Box sx={{ display: "grid", gap: 1.2 }}>{children}</Box>
  </Box>
);

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography color="text.secondary" variant="body2">
      {label}
    </Typography>
    <Typography fontWeight="medium" variant="body2">
      {value}
    </Typography>
  </Box>
);

const DocItem = ({ title, onView, onDownload, onDelete }) => (
  <ListItem
    sx={{
      bgcolor: "#f9f9f9",
      borderRadius: 1,
      mb: 1,
      border: "1px solid #e0e0e0",
    }}
  >
    <Description sx={{ mr: 2, color: "primary.main" }} />
    <ListItemText
      primary={<Typography fontWeight="medium">{title}</Typography>}
      secondary="Document"
    />

    <IconButton color="primary" onClick={onView} sx={{ mr: 1 }}>
      <Visibility />
    </IconButton>

    <IconButton color="primary" onClick={onDownload} sx={{ mr: 1 }}>
      <Download />
    </IconButton>

    {onDelete && (
      <IconButton color="error" onClick={onDelete}>
        <Delete />
      </IconButton>
    )}
  </ListItem>
);

export default CandidateProfile;
