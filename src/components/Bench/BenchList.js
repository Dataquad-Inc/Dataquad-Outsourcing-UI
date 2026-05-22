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
  Tab,
  Tabs,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Paper,
  Avatar,
  alpha,
  useTheme,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Checkbox,
  Toolbar,
  Slide,
  Divider,
} from "@mui/material";
import {
  Edit,
  Delete,
  Visibility,
  Add,
  BarChart,
  TableChart,
  Computer,
  Storage,
  Code,
  Cloud,
  Security,
  DataUsage,
  AccountTree,
  Search as SearchIcon,
  Clear as ClearIcon,
  SearchOff as SearchOffIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ToastService from "../../Services/toastService";
import BenchCandidateForm from "./BenchForm";
import CandidateDetails from "./CandidateDetails";
import { useDispatch, useSelector } from "react-redux";
import {
  filterBenchListByDateRange,
  setFilteredDataRequested,
} from "../../redux/benchSlice";
import { User2Icon } from "lucide-react";
import InternalFeedbackCell from "../Interviews/FeedBack";
import httpService, { API_BASE_URL } from "../../Services/httpService";
import DataTablePaginated from "../muiComponents/DataTablePaginated";
import DownloadResume from "../../utils/DownloadResume";
import { exportFile } from "../../utils/exportFile";

// ─────────────────────────────────────────────
// Tab Panel
// ─────────────────────────────────────────────
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bench-tabpanel-${index}`}
      aria-labelledby={`bench-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `bench-tab-${index}`,
    "aria-controls": `bench-tabpanel-${index}`,
  };
}

// ─────────────────────────────────────────────
// Tech icon helper
// ─────────────────────────────────────────────
const getTechIcon = (techName, theme) => {
  const name = (techName || "").toLowerCase();
  if (name.includes("java")) return <Code sx={{ color: "#f89820" }} />;
  if (name.includes("react") || name.includes("frontend"))
    return <Storage sx={{ color: "#61dafb" }} />;
  if (name.includes("sap")) return <DataUsage sx={{ color: "#0f7e3f" }} />;
  if (name.includes("cloud") || name.includes("aws"))
    return <Cloud sx={{ color: "#ff9900" }} />;
  if (name.includes("security")) return <Security sx={{ color: "#d32f2f" }} />;
  if (name.includes("full stack"))
    return <AccountTree sx={{ color: "#9c27b0" }} />;
  return <Computer sx={{ color: theme.palette.primary.main }} />;
};

// ─────────────────────────────────────────────
// Sorting helpers for client-side DataTable
// ─────────────────────────────────────────────
function descendingComparator(a, b, orderBy) {
  const av = a[orderBy] ?? "";
  const bv = b[orderBy] ?? "";
  if (bv < av) return -1;
  if (bv > av) return 1;
  return 0;
}
function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
function stableSort(array, comparator) {
  const stabilized = array.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

// ─────────────────────────────────────────────
// Tag Candidates Dialog — client-side DataTable
// ─────────────────────────────────────────────
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TAG_COLUMNS = [
  { id: "id", label: "ID", width: 80 },
  { id: "fullName", label: "Full Name", width: 180 },
  { id: "technology", label: "Technology", width: 160 },
  { id: "email", label: "Email", width: 220 },
  { id: "contactNumber", label: "Contact", width: 140 },
  { id: "totalExperience", label: "Exp (Yrs)", width: 110 },
  { id: "skills", label: "Skills", width: 220, noSort: true },
  { id: "tags", label: "Tags", width: 160, noSort: true },
  { id: "referredBy", label: "Referred By", width: 160 },
  { id: "actions", label: "Actions", width: 120, noSort: true, align: "center" },
];

function TagCandidatesDialog({ open, tagName, onClose }) {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Table state
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("id");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  // Delete inside this dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  // Fetch candidates by tag
  useEffect(() => {
    if (!open || !tagName) return;
    setRows([]);
    setSelected([]);
    setPage(0);
    setSearch("");
    setLoading(true);
    httpService
      .get("/candidate/benchprofiles/by-tag", { tagName })
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.candidates || res.data?.content || [];
        setRows(data);
      })
      .catch(() => {
        ToastService.error("Failed to load candidates for this tag");
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [open, tagName]);

  // Filtered rows (client-side search)
  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return rows;
    const kw = search.toLowerCase();
    return rows.filter(
      (r) =>
        (r.fullName || "").toLowerCase().includes(kw) ||
        (r.email || "").toLowerCase().includes(kw) ||
        (r.technology || "").toLowerCase().includes(kw) ||
        (r.contactNumber || "").toLowerCase().includes(kw) ||
        (r.referredBy || "").toLowerCase().includes(kw) ||
        (Array.isArray(r.skills) ? r.skills.join(" ") : "")
          .toLowerCase()
          .includes(kw) ||
        (Array.isArray(r.tags) ? r.tags.join(" ") : "")
          .toLowerCase()
          .includes(kw),
    );
  }, [rows, search]);

  const sortedRows = React.useMemo(
    () => stableSort(filteredRows, getComparator(order, orderBy)),
    [filteredRows, order, orderBy],
  );

  const pagedRows = React.useMemo(
    () => sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedRows, page, rowsPerPage],
  );

  // Sorting
  const handleRequestSort = (colId) => {
    const isAsc = orderBy === colId && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(colId);
  };

  // Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(filteredRows.map((r) => r.id));
    } else {
      setSelected([]);
    }
  };
  const handleSelectRow = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };
  const isSelected = (id) => selected.includes(id);

  // Pagination
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Delete
  const handleDeleteClick = (row) => {
    setRowToDelete(row);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = async () => {
    try {
      const toastId = ToastService.loading("Deleting candidate...");
      await httpService.delete(`/candidate/bench/deletebench/${rowToDelete.id}`);
      ToastService.update(toastId, "Deleted successfully!", "success");
      setRows((prev) => prev.filter((r) => r.id !== rowToDelete.id));
      setSelected((prev) => prev.filter((id) => id !== rowToDelete.id));
    } catch {
      ToastService.error("Failed to delete candidate");
    } finally {
      setDeleteDialogOpen(false);
      setRowToDelete(null);
    }
  };

  // Bulk delete selected
  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    try {
      const toastId = ToastService.loading(`Deleting ${selected.length} candidates...`);
      await Promise.all(
        selected.map((id) =>
          httpService.delete(`/candidate/bench/deletebench/${id}`),
        ),
      );
      ToastService.update(toastId, "Deleted selected candidates!", "success");
      setRows((prev) => prev.filter((r) => !selected.includes(r.id)));
      setSelected([]);
    } catch {
      ToastService.error("Failed to delete some candidates");
    }
  };

  const numSelected = selected.length;
  const rowCount = filteredRows.length;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: "70vh",
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                width: 36,
                height: 36,
              }}
            >
              {getTechIcon(tagName || "", theme)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {tagName} — Candidates
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {loading
                  ? "Loading…"
                  : `${filteredRows.length} of ${rows.length} candidate${rows.length !== 1 ? "s" : ""}`}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Toolbar: search + bulk actions */}
          <Toolbar
            sx={{
              px: 2,
              py: 1.5,
              gap: 2,
              ...(numSelected > 0 && {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              }),
            }}
          >
            {numSelected > 0 ? (
              <>
                <Typography
                  variant="subtitle1"
                  color="primary"
                  fontWeight={600}
                  sx={{ flex: 1 }}
                >
                  {numSelected} selected
                </Typography>
                <Tooltip title="Delete selected">
                  <IconButton color="error" onClick={handleDeleteSelected}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <TextField
                size="small"
                placeholder="Search candidates…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                sx={{ width: 320 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearch("");
                          setPage(0);
                        }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </Toolbar>

          <Divider />

          {/* Table */}
          <TableContainer sx={{ maxHeight: "55vh" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {/* Checkbox column */}
                  <TableCell padding="checkbox" sx={{ bgcolor: "background.paper" }}>
                    <Checkbox
                      indeterminate={
                        numSelected > 0 && numSelected < rowCount
                      }
                      checked={rowCount > 0 && numSelected === rowCount}
                      onChange={handleSelectAll}
                      size="small"
                    />
                  </TableCell>
                  {TAG_COLUMNS.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align || "left"}
                      sx={{
                        width: col.width,
                        fontWeight: 700,
                        bgcolor: "background.paper",
                        whiteSpace: "nowrap",
                      }}
                      sortDirection={orderBy === col.id ? order : false}
                    >
                      {col.noSort ? (
                        col.label
                      ) : (
                        <TableSortLabel
                          active={orderBy === col.id}
                          direction={orderBy === col.id ? order : "asc"}
                          onClick={() => handleRequestSort(col.id)}
                        >
                          {col.label}
                        </TableSortLabel>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell padding="checkbox">
                        <Skeleton variant="rectangular" width={18} height={18} />
                      </TableCell>
                      {TAG_COLUMNS.map((col) => (
                        <TableCell key={col.id}>
                          <Skeleton variant="text" width="80%" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : pagedRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={TAG_COLUMNS.length + 1}
                      align="center"
                      sx={{ py: 6 }}
                    >
                      <SearchOffIcon
                        sx={{
                          fontSize: 48,
                          color: "text.disabled",
                          mb: 1,
                          display: "block",
                          mx: "auto",
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {search
                          ? `No candidates match "${search}"`
                          : "No candidates found for this tag"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedRows.map((row) => {
                    const isRowSelected = isSelected(row.id);
                    return (
                      <TableRow
                        key={row.id}
                        hover
                        selected={isRowSelected}
                        onClick={() => handleSelectRow(row.id)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isRowSelected}
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => handleSelectRow(row.id)}
                          />
                        </TableCell>
                        {/* ID */}
                        <TableCell>{row.id}</TableCell>
                        {/* Full Name */}
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {row.fullName || "—"}
                          </Typography>
                        </TableCell>
                        {/* Technology */}
                        <TableCell>{row.technology || "—"}</TableCell>
                        {/* Email */}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.email || "—"}
                          </Typography>
                        </TableCell>
                        {/* Contact */}
                        <TableCell>{row.contactNumber || "—"}</TableCell>
                        {/* Experience */}
                        <TableCell>{row.totalExperience ?? "—"}</TableCell>
                        {/* Skills */}
                        <TableCell>
                          {Array.isArray(row.skills) && row.skills.length > 0 ? (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                              {row.skills.slice(0, 3).map((s, i) => (
                                <Chip key={i} label={s} size="small" />
                              ))}
                              {row.skills.length > 3 && (
                                <Chip
                                  label={`+${row.skills.length - 3}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        {/* Tags */}
                        <TableCell>
                          {Array.isArray(row.tags) && row.tags.length > 0 ? (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                              {row.tags.map((t, i) => (
                                <Chip
                                  key={i}
                                  label={t}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          ) : row.tags ? (
                            <Chip
                              label={row.tags}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        {/* Referred By */}
                        <TableCell>{row.referredBy || "—"}</TableCell>
                        {/* Actions */}
                        <TableCell
                          align="center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Stack
                            direction="row"
                            justifyContent="center"
                            spacing={0.5}
                          >
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() =>
                                  ToastService.info(
                                    `Edit ${row.fullName} — wire up BenchCandidateForm here`,
                                  )
                                }
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(row)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider />

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={onClose} variant="outlined" color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inner delete confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{rowToDelete?.fullName}</strong> from the bench list? This
            action cannot be undone.
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
}

// ─────────────────────────────────────────────
// Main BenchList Component
// ─────────────────────────────────────────────
const BenchList = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // ── Bench List tab states ──
  const [benchData, setBenchData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [loadingBenchRegister, setLoadingBenchRegister] = useState(null);
  const [exportingBench, setExportingBench] = useState(false);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editCandidateId, setEditCandidateId] = useState(null);

  // Pagination + search
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [noResultsFound, setNoResultsFound] = useState(false);

  // ── Summary tab states ──
  const [techSummary, setTechSummary] = useState([]);
  const [filteredTechSummary, setFilteredTechSummary] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [techSearchKeyword, setTechSearchKeyword] = useState("");

  // ── Tag Dialog state ──
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);

  const dispatch = useDispatch();
  const isUpdating = useRef(false);

  // ── Fetch bench list ──
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
        } else if (total > 0) {
          ToastService.success(
            `Loaded ${data?.length || 0} bench candidates (Total: ${total})`,
          );
        }
      } catch (error) {
        console.error("Failed to fetch bench list:", error);
        ToastService.error("Failed to load bench candidates");
        setBenchData([]);
        setTotalCount(0);
        if (searchKeyword.trim()) setNoResultsFound(true);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ── Fetch tech summary ──
  const fetchTechSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const response = await httpService.get("/candidate/tag-count");
      const tagData = response.data || response;

      if (Array.isArray(tagData) && tagData.length > 0) {
        const summaryArray = tagData
          .map((item) => ({
            tagName: item["tag name"] || item.tagName || item.tag,
            count: item.count || 0,
          }))
          .sort((a, b) => b.count - a.count);

        setTechSummary(summaryArray);
        setFilteredTechSummary(summaryArray);
        setTotalCandidates(summaryArray.reduce((s, i) => s + i.count, 0));
      } else {
        setTechSummary([]);
        setFilteredTechSummary([]);
        setTotalCandidates(0);
        ToastService.info("No technology tags found");
      }
    } catch (error) {
      console.error("Failed to fetch technology summary:", error);
      ToastService.error("Failed to load technology summary");
      setTechSummary([]);
      setFilteredTechSummary([]);
      setTotalCandidates(0);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ── Tech search ──
  const handleTechSearch = (e) => {
    const kw = e.target.value.toLowerCase();
    setTechSearchKeyword(kw);
    setFilteredTechSummary(
      kw.trim() === ""
        ? techSummary
        : techSummary.filter((t) =>
            t.tagName.toLowerCase().includes(kw),
          ),
    );
  };
  const clearTechSearch = () => {
    setTechSearchKeyword("");
    setFilteredTechSummary(techSummary);
  };

  // ── Effect: fetch on tab / pagination / search change ──
  useEffect(() => {
    if (activeTab === 0) {
      if (isUpdating.current) return;
      isUpdating.current = true;
      fetchBenchList(page, rowsPerPage, searchKeyword);
      setTimeout(() => { isUpdating.current = false; }, 0);
    } else if (activeTab === 1) {
      fetchTechSummary();
    }
  }, [activeTab, page, rowsPerPage, searchKeyword, fetchBenchList, fetchTechSummary]);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    if (newValue === 1) setTechSearchKeyword("");
  };

  // ── Card click → open tag dialog ──
  const handleCardClick = (tech) => {
    setSelectedTag(tech.tagName);
    setTagDialogOpen(true);
  };

  // ── Bench list handlers ──
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
    setEditCandidateId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (row) => {
    setEditCandidateId(row.id);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditCandidateId(null);
  };

  const handleFormSuccess = () => {
    fetchBenchList(page, rowsPerPage, searchKeyword);
    if (activeTab === 1) fetchTechSummary();
  };

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
      ToastService.update(toastId, "Candidate deleted successfully!", "success");
      fetchBenchList(page, rowsPerPage, searchKeyword);
      if (activeTab === 1) fetchTechSummary();
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
      const endpoint = "/candidate/bench/getBenchList";
      const params = {
        page: 0,
        size: totalCount,
        ...(exportParams?.searchQuery && { search: exportParams.searchQuery }),
      };
      const fileName = `bench_candidates_${new Date().toISOString().split("T")[0]}`;
      await exportFile(endpoint, fileName, format, params, exportParams?.selectedColumns);
    } catch (error) {
      console.error("Bench export error:", error);
      ToastService.error(error?.response?.data?.message || "Failed to export bench data");
    } finally {
      setExportingBench(false);
    }
  };

  // ── Column definitions ──
  const generateColumns = (loading = false) => [
    {
      key: "id",
      label: "Bench ID",
      type: "text",
      sortable: true,
      filterable: true,
      width: 120,
      render: loading ? () => <Skeleton variant="text" width={80} height={24} /> : undefined,
    },
    {
      key: "fullName",
      label: "Full Name",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: loading
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
      render: loading ? () => <Skeleton variant="text" width={140} height={24} /> : undefined,
    },
    {
      key: "skills",
      label: "Skills",
      type: "text",
      sortable: true,
      filterable: true,
      width: 250,
      render: (row) =>
        loading ? (
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
      render: loading ? () => <Skeleton variant="text" width={180} height={24} /> : undefined,
    },
    {
      key: "contactNumber",
      label: "Contact Number",
      type: "text",
      sortable: true,
      filterable: true,
      width: 150,
      render: loading ? () => <Skeleton variant="text" width={100} height={24} /> : undefined,
    },
    {
      key: "referredBy",
      label: "Referred By",
      type: "text",
      sortable: true,
      filterable: true,
      width: 180,
      render: loading ? () => <Skeleton variant="text" width={120} height={24} /> : undefined,
    },
    {
      key: "tags",
      label: "Tag",
      type: "text",
      sortable: true,
      filterable: true,
      width: 150,
      render: (row) =>
        loading ? (
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
      render: loading
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
      render: loading
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
      render: loading
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

  // ── Summary cards ──
  const renderSummaryCards = () => {
    if (summaryLoading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="40%" height={24} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (filteredTechSummary.length === 0 && !summaryLoading) {
      return (
        <Paper
          elevation={0}
          sx={{
            textAlign: "center",
            py: 8,
            px: 3,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
          }}
        >
          <SearchOffIcon
            sx={{ fontSize: 64, color: "text.secondary", mb: 2, opacity: 0.5 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {techSearchKeyword
              ? "No matching technologies found"
              : "No technology tags found"}
          </Typography>
          {techSearchKeyword && (
            <>
              <Typography
                variant="body2"
                sx={{ mt: 1, maxWidth: 400, mx: "auto", color: "text.secondary" }}
              >
                No results for{" "}
                <Box component="span" sx={{ color: "error.main", fontWeight: 600 }}>
                  "{techSearchKeyword}"
                </Box>
                . Try a different term or clear the search.
              </Typography>
              <Button
                onClick={clearTechSearch}
                variant="outlined"
                color="primary"
                startIcon={<ClearIcon />}
                sx={{ mt: 3 }}
              >
                Clear Search
              </Button>
            </>
          )}
        </Paper>
      );
    }

    return (
      <>
        {/* Search bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search technologies… (e.g. Java, React, Python)"
            value={techSearchKeyword}
            onChange={handleTechSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: techSearchKeyword && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={clearTechSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
              },
            }}
          />
        </Box>

        {/* Cards grid — each card is clickable */}
        <Grid container spacing={3}>
          {filteredTechSummary.map((tech, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  overflow: "visible",
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: theme.shadows[6] },
                }}
              >
                {/* CardActionArea makes the whole card clickable */}
                <CardActionArea
                  onClick={() => handleCardClick(tech)}
                  sx={{ height: "100%", borderRadius: 3 }}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          width: 48,
                          height: 48,
                        }}
                      >
                        {getTechIcon(tech.tagName, theme)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={600}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {tech.tagName}
                        </Typography>
                      </Box>
                      {/* Visual hint that card is clickable */}
                      <Tooltip title={`View ${tech.tagName} candidates`}>
                        <OpenInNewIcon
                          fontSize="small"
                          sx={{ color: "action.active", opacity: 0.5 }}
                        />
                      </Tooltip>
                    </Stack>

                    <Stack
                      direction="row"
                      alignItems="baseline"
                      justifyContent="space-between"
                      sx={{ mt: 1 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <PeopleIcon
                          fontSize="small"
                          sx={{ color: "text.secondary", fontSize: 14 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Candidates
                        </Typography>
                      </Stack>
                      <Typography variant="h5" fontWeight={700} color="primary.main">
                        {tech.count}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ mt: 1, display: "block", opacity: 0.8 }}
                    >
                      Click to view list →
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </>
    );
  };

  // ── No results for bench list table ──
  const NoResultsComponent = () => (
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
          onClick={() => handleSearch("")}
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

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          flexWrap: "wrap",
          mb: 2,
          p: 2,
          backgroundColor: "#f9f9f9",
          borderRadius: 2,
          boxShadow: 1,
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" color="primary">
          Bench Candidate Management
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ ml: "auto" }}>
          <Button variant="text" color="primary" onClick={handleAdd} disabled={loading}>
            <Add /> <User2Icon />
          </Button>
        </Stack>
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="bench management tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<TableChart />} iconPosition="start" label="Bench List" {...a11yProps(0)} />
          <Tab
            icon={<BarChart />}
            iconPosition="start"
            label="Technology Summary"
            {...a11yProps(1)}
          />
        </Tabs>
      </Box>

      {/* Bench List Tab */}
      <TabPanel value={activeTab} index={0}>
        {noResultsFound && !loading && benchData.length === 0 ? (
          <NoResultsComponent />
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
      </TabPanel>

      {/* Technology Summary Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ p: 1 }}>{renderSummaryCards()}</Box>
      </TabPanel>

      {/* ── Tag Candidates Dialog ── */}
      <TagCandidatesDialog
        open={tagDialogOpen}
        tagName={selectedTag}
        onClose={() => {
          setTagDialogOpen(false);
          setSelectedTag(null);
        }}
      />

      {/* Add / Edit Form */}
      <BenchCandidateForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        id={editCandidateId}
        initialData={
          editCandidateId
            ? benchData.find((item) => item.id === editCandidateId)
            : null
        }
      />

      {/* View Modal */}
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              Candidate Details — {selectedCandidate?.fullName}
            </Typography>
          </Box>
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

      {/* Delete Confirmation Dialog */}
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
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BenchList;