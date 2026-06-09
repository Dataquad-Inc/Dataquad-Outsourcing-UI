import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Skeleton,
  Chip,
  Stack,
  CircularProgress,
  Paper,
  alpha,
  useTheme,
  Popover,
  TextField,
} from "@mui/material";
import {
  Edit,
  Delete,
  Visibility,
  Add,
  Clear as ClearIcon,
  SearchOff as SearchOffIcon,
  Work as WorkIcon,
  Send as SendIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { User2Icon } from "lucide-react";
import ToastService from "../../Services/toastService";
import BenchCandidateForm from "./BenchForm";
import CandidateDetails from "./CandidateDetails";
import InternalFeedbackCell from "../Interviews/FeedBack";
import httpService, { API_BASE_URL } from "../../Services/httpService";
import DataTablePaginated from "../muiComponents/DataTablePaginated";
import DownloadResume from "../../utils/DownloadResume";
import { exportFile } from "../../utils/exportFile";
import axios from "axios";

// ─── No results state ──────────────────────────────────────────────────────────
function NoResultsState({ searchKeyword, onClear }) {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        textAlign: "center",
        py: 8,
        px: 3,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
      }}
    >
      <SearchOffIcon
        sx={{ fontSize: 64, color: "text.secondary", mb: 2, opacity: 0.5 }}
      />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No candidates found
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1, maxWidth: 400, mx: "auto" }}
      >
        {searchKeyword
          ? `No bench candidates match "${searchKeyword}". Try a different term or clear the search.`
          : 'No bench candidates available. Click "Add" to add new candidates.'}
      </Typography>
      {searchKeyword && (
        <Button
          onClick={onClear}
          variant="outlined"
          color="primary"
          startIcon={<ClearIcon />}
          sx={{ mt: 3 }}
        >
          Clear Search
        </Button>
      )}
    </Paper>
  );
}

// ─── Submit to Job Popover (Single Row) ─────────────────────────────────────
function SubmitToJobPopover({ anchorEl, row, onClose }) {
  const [jobId, setJobId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (anchorEl) {
      setJobId("");
      setResult(null);
      setSubmitting(false);
    }
  }, [anchorEl, row?.id]);

  const handleSubmit = async () => {
    if (!jobId.trim()) return;

    setSubmitting(true);
    setResult(null);

    try {
      const response = await axios.post(
        "https://mymulya.com/candidate/submit-bench",
        {
          benchIds: [row.id],
          jobId: jobId.trim(),
        },
      );

      const { message, skippedBenchIds } = response.data;
      let detail = message || "Submitted successfully!";
      if (skippedBenchIds?.length > 0) {
        detail += ` (skipped: ${skippedBenchIds.join(", ")})`;
      }

      setResult({ type: "success", message: detail });
      ToastService.success(detail);
      setTimeout(() => onClose(), 1800);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Submission failed. Please try again.";
      setResult({ type: "error", message: msg });
      ToastService.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { p: 2, width: 280, borderRadius: 2 } } }}
    >
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
        Submit to Job
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 1.5 }}
      >
        Candidate: <strong>{row?.fullName}</strong>
      </Typography>

      <TextField
        size="small"
        fullWidth
        label="Job ID"
        placeholder="Enter Job ID…"
        value={jobId}
        onChange={(e) => {
          setJobId(e.target.value);
          setResult(null);
        }}
        onKeyDown={(e) =>
          e.key === "Enter" && !submitting && jobId.trim() && handleSubmit()
        }
        disabled={submitting}
        autoFocus
        sx={{ mb: 1.5 }}
      />

      {result && (
        <Typography
          variant="caption"
          color={result.type === "success" ? "success.main" : "error.main"}
          sx={{ display: "block", mb: 1.5 }}
        >
          {result.type === "success" ? "✓ " : "✕ "}
          {result.message}
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button
          size="small"
          onClick={onClose}
          disabled={submitting}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleSubmit}
          disabled={!jobId.trim() || submitting}
          startIcon={
            submitting ? (
              <CircularProgress size={12} color="inherit" />
            ) : (
              <SendIcon fontSize="small" />
            )
          }
        >
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </Box>
    </Popover>
  );
}

// ─── Batch Email Dialog ─────────────────────────────────────────────────────
function BatchEmailDialog({ open, onClose, onSend, selectedCount, sending }) {
  const [subject, setSubject] = useState("");
  const [mailBody, setMailBody] = useState("");

  const handleSend = () => {
    if (subject.trim() && mailBody.trim()) {
      onSend(subject, mailBody);
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSubject("");
      setMailBody("");
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Send Email to {selectedCount} Candidate{selectedCount > 1 ? "s" : ""}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            required
            placeholder="Enter email subject..."
          />
          <TextField
            label="Mail Body"
            value={mailBody}
            onChange={(e) => setMailBody(e.target.value)}
            fullWidth
            multiline
            rows={8}
            required
            placeholder="Enter email content..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          color="primary"
          disabled={!subject.trim() || !mailBody.trim() || sending}
          startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
        >
          {sending ? "Sending..." : "Send"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Batch Job Submission Dialog ────────────────────────────────────────────
function BatchJobDialog({ open, onClose, onSubmit, selectedCount, submitting }) {
  const [jobId, setJobId] = useState("");

  const handleSubmit = () => {
    if (jobId.trim()) {
      onSubmit(jobId.trim());
    }
  };

  useEffect(() => {
    if (open) {
      setJobId("");
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Submit {selectedCount} Candidate{selectedCount > 1 ? "s" : ""} to Job
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Selected candidates will be submitted to the job with the following ID:
          </Typography>
          <TextField
            label="Job ID"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            fullWidth
            required
            placeholder="Enter Job ID..."
            autoFocus
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          disabled={!jobId.trim() || submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : <WorkIcon />}
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── BenchListTab ──────────────────────────────────────────────────────────────
const BenchListTab = ({ onAddClick }) => {
  const [benchData, setBenchData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [loadingBenchRegister, setLoadingBenchRegister] = useState(null);
  const [exportingBench, setExportingBench] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editCandidateId, setEditCandidateId] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [noResultsFound, setNoResultsFound] = useState(false);

  // ── Selection state for checkboxes ──────────────────────────────────────────
  const [selectedRows, setSelectedRows] = useState([]);

  // ── Batch email state ───────────────────────────────────────────────────────
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // ── Batch job submission state ──────────────────────────────────────────────
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);

  // ── Per-row submit-to-job popover state ─────────────────────────────────────
  const [submitPopoverAnchor, setSubmitPopoverAnchor] = useState(null);
  const [submitPopoverRow, setSubmitPopoverRow] = useState(null);

  const isUpdating = useRef(false);

  // ── Fetch bench list ──────────────────────────────────────────────────────────
  const fetchBenchList = useCallback(
    async (currentPage, currentRowsPerPage, search) => {
      try {
        setLoading(true);
        setNoResultsFound(false);

        const params = { page: currentPage, size: currentRowsPerPage };
        if (search && search.trim()) params.search = search.trim();

        const response = await httpService.get(
          "/candidate/bench/getBenchList",
          params,
        );
        const responseData = response.data;
        const data = Array.isArray(responseData)
          ? responseData
          : responseData.data || [];
        const total = Array.isArray(responseData)
          ? responseData.length
          : responseData.totalItems || 0;

        setBenchData(data);
        setTotalCount(total);

        if (total === 0 && search && search.trim()) {
          setNoResultsFound(true);
          ToastService.info(`No candidates found matching "${search}"`);
        }
      } catch (error) {
        ToastService.error("Failed to load bench candidates");
        setBenchData([]);
        setTotalCount(0);
        if (search?.trim()) setNoResultsFound(true);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (isUpdating.current) return;
    isUpdating.current = true;
    fetchBenchList(page, rowsPerPage, searchKeyword);
    setTimeout(() => {
      isUpdating.current = false;
    }, 0);
  }, [page, rowsPerPage, searchKeyword, fetchBenchList]);

  // Clear selection when data changes (page change, search, etc.)
  useEffect(() => {
    setSelectedRows([]);
  }, [page, rowsPerPage, searchKeyword, benchData]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleView = (row) => {
    setSelectedCandidate({
      ...row,
      filterCriteria: {
        showBasicInfo: true,
        showContact: true,
        showExperience: true,
        showSkills: true,
        showEducation: true,
        showDocuments: true,
      },
    });
    setIsViewModalOpen(true);
    ToastService.info(`Viewing details for ${row.fullName}`);
  };

  const handleAdd = () => {
    if (onAddClick) {
      onAddClick();
      return;
    }
    setEditCandidateId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (row) => {
    setEditCandidateId(row.id);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () =>
    fetchBenchList(page, rowsPerPage, searchKeyword);

  const handleDelete = (row) => {
    setCandidateToDelete(row);
    setDeleteDialogOpen(true);
    ToastService.warning(`Preparing to delete ${row.fullName}`);
  };

  const confirmDelete = async () => {
    try {
      const toastId = ToastService.loading("Deleting candidate...");
      await httpService.delete(
        `/candidate/bench/deletebench/${candidateToDelete.id}`,
      );
      ToastService.update(
        toastId,
        "Candidate deleted successfully!",
        "success",
      );
      fetchBenchList(page, rowsPerPage, searchKeyword);
      setDeleteDialogOpen(false);
    } catch {
      ToastService.error("Failed to delete candidate");
    }
  };

  const handlePageChange = (newPage, newRowsPerPage) => {
    setPage(newPage);
    if (newRowsPerPage !== undefined && newRowsPerPage !== rowsPerPage)
      setRowsPerPage(newRowsPerPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleSearch = (keyword) => {
    setSearchKeyword(keyword);
    setPage(0);
    setNoResultsFound(false);
  };

  const handleBenchCandidate = async (candidate) => {
    let toastId;
    try {
      const payload = {
        email: candidate.email,
        fullName: candidate.fullName,
        phone: candidate.contactNumber,
        status: "ACTIVE",
        role: "BENCH",
      };
      setLoadingBenchRegister(candidate.id);
      toastId = ToastService.loading("Sending register request...");
      await new Promise((r) => setTimeout(r, 1000));
      await httpService.post(`/candidate/bench-create-user/${candidate.id}`, payload);
      ToastService.update(
        toastId,
        "Register request sent successfully",
        "success",
      );
      fetchBenchList(page, rowsPerPage, searchKeyword);
    } catch (error) {
      ToastService.update(
        toastId,
        error?.response?.data?.error?.errorMessage ||
          error?.response?.data?.message ||
          "Failed to send register request",
        "error",
        { autoClose: 5000 },
      );
    } finally {
      setLoadingBenchRegister(null);
    }
  };

  const handleExportBenchData = async (format, exportParams) => {
    if (exportingBench) return;
    try {
      setExportingBench(true);
      const params = {
        page: 0,
        size: totalCount,
        ...(exportParams?.searchQuery && { search: exportParams.searchQuery }),
      };
      const fileName = `bench_candidates_${new Date().toISOString().split("T")[0]}`;
      await exportFile(
        "/candidate/bench/getBenchList",
        fileName,
        format,
        params,
        exportParams?.selectedColumns,
      );
    } catch (error) {
      console.error("Bench export error:", error);
      ToastService.error(
        error?.response?.data?.message || "Failed to export bench data",
      );
    } finally {
      setExportingBench(false);
    }
  };

  // ── Batch Email Handler ──────────────────────────────────────────
  const handleBatchEmail = async (subject, mailBody) => {
    // Get selected candidates' emails
    const selectedEmails = benchData
      .filter((candidate) => selectedRows.includes(candidate.id))
      .map((candidate) => candidate.email)
      .filter((email) => email && email.trim() !== "");

    if (selectedEmails.length === 0) {
      ToastService.error("Selected candidates don't have valid email addresses.");
      setEmailDialogOpen(false);
      return;
    }

    setSendingEmail(true);

    try {
      const emailPayload = {
        emails: selectedEmails,
        subject: subject,
        body: mailBody
      };

      // Replace with your actual email API endpoint
      const response = await axios.post("https://your-api-endpoint/send-email", emailPayload);

      ToastService.success(
        response.data.message || `Email sent successfully to ${selectedEmails.length} candidate(s)!`
      );
      
      setEmailDialogOpen(false);
      setSelectedRows([]);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to send email. Please try again.";
      ToastService.error(msg);
    } finally {
      setSendingEmail(false);
    }
  };

  // ── Batch Job Submission Handler ────────────────────────────────────────────
  const handleBatchJobSubmit = async (jobId) => {
    const benchIds = benchData
      .filter((candidate) => selectedRows.includes(candidate.id))
      .map((candidate) => candidate.id);

    if (benchIds.length === 0) {
      ToastService.error("No candidates selected.");
      setJobDialogOpen(false);
      return;
    }

    setSubmittingJob(true);

    try {
      const response = await axios.post(
        "https://mymulya.com/candidate/submit-bench",
        {
          benchIds: benchIds,
          jobId: jobId,
        },
      );

      const { message, skippedBenchIds } = response.data;

      let detail = message || "Submitted successfully!";
      if (skippedBenchIds?.length > 0) {
        detail += ` (${skippedBenchIds.length} candidates were already submitted)`;
      }

      ToastService.success(detail);
      setJobDialogOpen(false);
      setSelectedRows([]);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Submission failed. Please try again.";
      ToastService.error(msg);
    } finally {
      setSubmittingJob(false);
    }
  };

  // ── Open submit-to-job popover for a row ──────────────────────────────────────
  const handleOpenSubmitPopover = (event, row) => {
    event.stopPropagation();
    setSubmitPopoverAnchor(event.currentTarget);
    setSubmitPopoverRow(row);
  };

  const handleCloseSubmitPopover = () => {
    setSubmitPopoverAnchor(null);
    setSubmitPopoverRow(null);
  };

  // ── Selection change handler from DataTablePaginated ────────────────────────
  const handleSelectionChange = (selected) => {
    setSelectedRows(selected);
  };

  // ── Batch action buttons (visible when rows are selected) ───────────────────
  const renderBatchActions = () => {
    if (selectedRows.length === 0) return null;

    return (
      <Paper
        elevation={3}
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          {selectedRows.length} candidate{selectedRows.length > 1 ? "s" : ""} selected
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<EmailIcon />}
            onClick={() => setEmailDialogOpen(true)}
            size="small"
            sx={{ bgcolor: "white", color: "primary.main", "&:hover": { bgcolor: "#f5f5f5" } }}
          >
            Send Email
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<WorkIcon />}
            onClick={() => setJobDialogOpen(true)}
            size="small"
          >
            Submit to Job
          </Button>
         
        </Stack>
      </Paper>
    );
  };

  // ── Column definitions ────────────────────────────────────────────────────────
  const generateColumns = (isLoading = false) => [
    {
      key: "id",
      label: "Bench ID",
      type: "text",
      sortable: true,
      filterable: true,
      width: 120,
      render: isLoading
        ? () => <Skeleton variant="text" width={80} height={24} />
        : undefined,
    },
    {
      key: "fullName",
      label: "Full Name",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: isLoading
        ? () => <Skeleton variant="text" width={140} height={24} />
        : (row) => (
            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip
                title={
                  row.isRegistered
                    ? "Already Registered"
                    : "Send Register Request"
                }
              >
                <span>
                  <IconButton
                    size="small"
                    color={row.isRegistered ? "success" : "primary"}
                    onClick={() => handleBenchCandidate(row)}
                    disabled={
                      loadingBenchRegister === row.id || row.isRegistered
                    }
                  >
                    {loadingBenchRegister === row.id ? (
                      <CircularProgress size={16} color="info" />
                    ) : row.isRegistered ? (
                      <HowToRegIcon fontSize="small" color="success" />
                    ) : (
                      <PersonAddIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              {row.fullName}
            </Box>
          ),
    },
    {
      key: "technology",
      label: "Technology",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: isLoading
        ? () => <Skeleton variant="text" width={140} height={24} />
        : undefined,
    },
    {
      key: "skills",
      label: "Skills",
      type: "text",
      sortable: true,
      filterable: true,
      width: 250,
      render: (row) =>
        isLoading ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Skeleton variant="rounded" width={60} height={24} />
            <Skeleton variant="rounded" width={80} height={24} />
          </Box>
        ) : !row.skills || row.skills.length === 0 ? (
          "N/A"
        ) : Array.isArray(row.skills) ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {row.skills.slice(0, 3).map((skill, i) => (
              <Chip key={i} label={skill} size="small" />
            ))}
            {row.skills.length > 3 && (
              <Chip label={`+${row.skills.length - 3}`} size="small" />
            )}
          </Box>
        ) : (
          "Invalid Data"
        ),
    },
    {
      key: "email",
      label: "Email",
      type: "text",
      sortable: true,
      filterable: true,
      width: 220,
      render: isLoading
        ? () => <Skeleton variant="text" width={180} height={24} />
        : undefined,
    },
    {
      key: "contactNumber",
      label: "Contact Number",
      type: "text",
      sortable: true,
      filterable: true,
      width: 150,
      render: isLoading
        ? () => <Skeleton variant="text" width={100} height={24} />
        : undefined,
    },
    {
      key: "referredBy",
      label: "Referred By",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: isLoading
        ? () => <Skeleton variant="text" width={120} height={24} />
        : undefined,
    },
    {
      key: "tags",
      label: "Tag",
      type: "text",
      sortable: true,
      filterable: true,
      width: 150,
      render: (row) =>
        isLoading ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Skeleton variant="rounded" width={60} height={24} />
            <Skeleton variant="rounded" width={60} height={24} />
          </Box>
        ) : !row.tags ||
          (Array.isArray(row.tags) ? row.tags.length === 0 : !row.tags) ? (
          "N/A"
        ) : Array.isArray(row.tags) ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {row.tags.map((tag, i) => (
              <Chip
                key={i}
                label={tag}
                size="small"
                color="info"
                variant="outlined"
              />
            ))}
          </Box>
        ) : (
          <Chip label={row.tags} size="small" color="info" variant="outlined" />
        ),
    },
    {
      key: "totalExperience",
      label: "Total Exp (Yrs)",
      type: "text",
      sortable: true,
      filterable: true,
      width: 150,
      render: isLoading
        ? () => <Skeleton variant="text" width={80} height={24} />
        : (row) => row.totalExperience || "N/A",
    },
    {
      key: "relevantExperience",
      label: "Rel Exp (Yrs)",
      type: "text",
      sortable: true,
      filterable: true,
      width: 150,
      render: isLoading
        ? () => <Skeleton variant="text" width={80} height={24} />
        : (row) => row.relevantExperience || "N/A",
    },
    {
      key: "remarks",
      label: "Remarks",
      type: "text",
      align: "center",
      render: (row) => (
        <InternalFeedbackCell value={row.remarks} type="remarks" />
      ),
      sortable: true,
      filterable: true,
      width: 150,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      filterable: false,
      width: 230,
      align: "center",
      render: isLoading
        ? () => (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
          )
        : (row) => (
            <Box
              sx={{ display: "flex", justifyContent: "center", gap: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip title="Submit to Job">
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  onClick={(e) => handleOpenSubmitPopover(e, row)}
                  sx={{
                    minWidth: 80,
                    textTransform: "none",
                  }}
                >
                  Submit
                </Button>
              </Tooltip>

              <Tooltip title="View">
                <IconButton
                  color="info"
                  size="small"
                  onClick={() => handleView(row)}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Edit">
                <IconButton
                  color="primary"
                  size="small"
                  onClick={() => handleEdit(row)}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete">
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => handleDelete(row)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>

              <DownloadResume
                candidate={{
                  candidateId: row?.id ?? "NO_ID",
                  jobId: row?.jobId ?? "NO_JOB_ID",
                  fullName: row?.fullName ?? "NO_NAME",
                }}
                getDownloadUrl={(candidate, format) =>
                  `${API_BASE_URL}/candidate/bench/download/${candidate.candidateId}?format=${format}`
                }
              />
            </Box>
          ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Add button header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        sx={{ mb: 2 }}
      >
        <Button
          variant="text"
          color="primary"
          onClick={handleAdd}
          disabled={loading}
          startIcon={<Add />}
        >
          <User2Icon size={18} style={{ marginLeft: 4 }} />
        </Button>
      </Stack>

      {/* Batch Action Buttons - Now ABOVE the table */}
      {renderBatchActions()}

      {/* Table or empty state */}
      {noResultsFound && !loading && benchData.length === 0 ? (
        <NoResultsState
          searchKeyword={searchKeyword}
          onClear={() => handleSearch("")}
        />
      ) : (
        <DataTablePaginated
          data={benchData || []}
          columns={generateColumns(loading)}
          title="Bench List"
          loading={loading}
          enableSelection={true}
          checkboxRequired={false}
          uniqueId="id"
          defaultSortColumn="id"
          defaultSortDirection="desc"
          defaultRowsPerPage={rowsPerPage}
          serverSide={true}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 40, 60, 80, 100]}
          refreshData={() => fetchBenchList(page, rowsPerPage, searchKeyword)}
          onSearchChange={handleSearch}
          searchValue={searchKeyword}
          enableLocalFiltering={false}
          enableServerSideFiltering={false}
          enableExport={true}
          onExportData={handleExportBenchData}
          onSelectionChange={handleSelectionChange}
        />
      )}

      {/* Per-row Submit to Job Popover */}
      <SubmitToJobPopover
        anchorEl={submitPopoverAnchor}
        row={submitPopoverRow}
        onClose={handleCloseSubmitPopover}
      />

      {/* Batch Email Dialog */}
      <BatchEmailDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        onSend={handleBatchEmail}
        selectedCount={selectedRows.length}
        sending={sendingEmail}
      />

      {/* Batch Job Submission Dialog */}
      <BatchJobDialog
        open={jobDialogOpen}
        onClose={() => setJobDialogOpen(false)}
        onSubmit={handleBatchJobSubmit}
        selectedCount={selectedRows.length}
        submitting={submittingJob}
      />

      {/* Add / Edit form */}
      <BenchCandidateForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditCandidateId(null);
        }}
        onSuccess={handleFormSuccess}
        id={editCandidateId}
        initialData={
          editCandidateId
            ? benchData.find((item) => item.id === editCandidateId)
            : null
        }
      />

      {/* View modal */}
      <Dialog
        open={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          ToastService.info("Closed candidate details view");
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Candidate Details — {selectedCandidate?.fullName}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCandidate ? (
            <CandidateDetails candidate={selectedCandidate} />
          ) : (
            <Box sx={{ p: 3 }}>
              <Skeleton variant="rectangular" width="100%" height={400} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewModalOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{candidateToDelete?.fullName}</strong> from the bench list?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BenchListTab;