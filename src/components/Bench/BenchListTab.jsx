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
} from "@mui/material";
import {
  Edit,
  Delete,
  Visibility,
  Add,
  Clear as ClearIcon,
  SearchOff as SearchOffIcon,
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
      <SearchOffIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2, opacity: 0.5 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No candidates found
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 400, mx: "auto" }}>
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

// ─── BenchListTab ──────────────────────────────────────────────────────────────
/**
 * Props:
 *   onAddClick – optional callback so BenchPage can intercept "Add" if needed
 */
const BenchListTab = ({ onAddClick }) => {
  const [benchData,           setBenchData]           = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [selectedCandidate,   setSelectedCandidate]   = useState(null);
  const [isViewModalOpen,     setIsViewModalOpen]     = useState(false);
  const [deleteDialogOpen,    setDeleteDialogOpen]    = useState(false);
  const [candidateToDelete,   setCandidateToDelete]   = useState(null);
  const [loadingBenchRegister,setLoadingBenchRegister]= useState(null);
  const [exportingBench,      setExportingBench]      = useState(false);

  const [isFormOpen,      setIsFormOpen]      = useState(false);
  const [editCandidateId, setEditCandidateId] = useState(null);

  const [page,        setPage]        = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount,  setTotalCount]  = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [noResultsFound, setNoResultsFound] = useState(false);

  const isUpdating = useRef(false);

  // ── Fetch bench list ──────────────────────────────────────────────────────────
  const fetchBenchList = useCallback(async (currentPage, currentRowsPerPage, search) => {
    try {
      setLoading(true);
      setNoResultsFound(false);

      const params = { page: currentPage, size: currentRowsPerPage };
      if (search && search.trim()) params.search = search.trim();

      const response     = await httpService.get("/candidate/bench/getBenchList", params);
      const responseData = response.data;
      const data  = Array.isArray(responseData) ? responseData : responseData.data || [];
      const total = Array.isArray(responseData) ? responseData.length : responseData.totalItems || 0;

      setBenchData(data);
      setTotalCount(total);

      if (total === 0 && search && search.trim()) {
        setNoResultsFound(true);
        ToastService.info(`No candidates found matching "${search}"`);
      } else if (total > 0) {
        ToastService.success(`Loaded ${data?.length || 0} bench candidates (Total: ${total})`);
      }
    } catch (error) {
      ToastService.error("Failed to load bench candidates");
      setBenchData([]);
      setTotalCount(0);
      if (search?.trim()) setNoResultsFound(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isUpdating.current) return;
    isUpdating.current = true;
    fetchBenchList(page, rowsPerPage, searchKeyword);
    setTimeout(() => { isUpdating.current = false; }, 0);
  }, [page, rowsPerPage, searchKeyword, fetchBenchList]);

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
    if (onAddClick) { onAddClick(); return; }
    setEditCandidateId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (row) => {
    setEditCandidateId(row.id);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => fetchBenchList(page, rowsPerPage, searchKeyword);

  const handleDelete = (row) => {
    setCandidateToDelete(row);
    setDeleteDialogOpen(true);
    ToastService.warning(`Preparing to delete ${row.fullName}`);
  };

  const confirmDelete = async () => {
    try {
      const toastId = ToastService.loading("Deleting candidate...");
      await httpService.delete(`/candidate/bench/deletebench/${candidateToDelete.id}`);
      ToastService.update(toastId, "Candidate deleted successfully!", "success");
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
      await httpService.post("/candidate/register", payload);
      ToastService.update(toastId, "Register request sent successfully", "success");
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
      ToastService.error(error?.response?.data?.message || "Failed to export bench data");
    } finally {
      setExportingBench(false);
    }
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
      render: isLoading ? () => <Skeleton variant="text" width={80} height={24} /> : undefined,
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
              <Tooltip title={row.isRegistered ? "Already Registered" : "Send Register Request"}>
                <span>
                  <IconButton
                    size="small"
                    color={row.isRegistered ? "success" : "primary"}
                    onClick={() => handleBenchCandidate(row)}
                    disabled={loadingBenchRegister === row.id || row.isRegistered}
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
      render: isLoading ? () => <Skeleton variant="text" width={140} height={24} /> : undefined,
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
      render: isLoading ? () => <Skeleton variant="text" width={180} height={24} /> : undefined,
    },
    {
      key: "contactNumber",
      label: "Contact Number",
      type: "text",
      sortable: true,
      filterable: true,
      width: 150,
      render: isLoading ? () => <Skeleton variant="text" width={100} height={24} /> : undefined,
    },
    {
      key: "referredBy",
      label: "Referred By",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: isLoading ? () => <Skeleton variant="text" width={120} height={24} /> : undefined,
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
              <Chip key={i} label={tag} size="small" color="info" variant="outlined" />
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
      render: (row) => <InternalFeedbackCell value={row.remarks} type="remarks" />,
      sortable: true,
      filterable: true,
      width: 150,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      filterable: false,
      width: 200,
      align: "center",
      render: isLoading
        ? () => (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
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
              <Tooltip title="View">
                <IconButton color="info" size="small" onClick={() => handleView(row)}>
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton color="primary" size="small" onClick={() => handleEdit(row)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton color="error" size="small" onClick={() => handleDelete(row)}>
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
          enableSelection={false}
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
        />
      )}

      {/* Add / Edit form */}
      <BenchCandidateForm
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditCandidateId(null); }}
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
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{candidateToDelete?.fullName}</strong> from the bench list?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BenchListTab;