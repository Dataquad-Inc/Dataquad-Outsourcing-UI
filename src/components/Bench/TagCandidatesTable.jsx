import React, { useState, useMemo } from "react";
import {
  Box,
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
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Skeleton,
  Paper,
  Divider,
  Button,
  CircularProgress,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  SearchOff as SearchOffIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import axios from "axios";

// ─── Sorting helpers ───────────────────────────────────────────────────────────
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
  const stabilized = array.map((el, idx) => [el, idx]);
  stabilized.sort((a, b) => {
    const o = comparator(a[0], b[0]);
    return o !== 0 ? o : a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

// ─── Column definitions ────────────────────────────────────────────────────────
const COLUMNS = [
  { id: "id",              label: "ID",          width: 80  },
  { id: "fullName",        label: "Full Name",   width: 180 },
  { id: "email",           label: "Email",       width: 220 },
  { id: "contactNumber",   label: "Contact",     width: 140 },
  { id: "totalExperience", label: "Exp (Yrs)",   width: 110 },
  { id: "tags",            label: "Tags",        width: 180, noSort: true },
  { id: "referredBy",      label: "Referred By", width: 160 },
];

// ─── Search filter ─────────────────────────────────────────────────────────────
function applySearch(rows, keyword) {
  if (!keyword.trim()) return rows;
  const kw = keyword.toLowerCase();
  return rows.filter((r) =>
    [
      r.fullName,
      r.email,
      r.technology,
      r.contactNumber,
      r.referredBy,
      Array.isArray(r.skills) ? r.skills.join(" ") : "",
      Array.isArray(r.tags) ? r.tags.join(" ") : r.tags ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(kw),
  );
}

// ─── Cell renderers ────────────────────────────────────────────────────────────
function TagsCell({ tags }) {
  if (!tags) return <>—</>;
  const arr = Array.isArray(tags) ? tags : [tags];
  if (arr.length === 0) return <>—</>;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {arr.map((t, i) => (
        <Chip key={i} label={t} size="small" color="info" variant="outlined" />
      ))}
    </Box>
  );
}

function CellValue({ col, row }) {
  if (col.id === "tags") return <TagsCell tags={row.tags} />;
  if (col.id === "email")
    return (
      <Typography
        variant="body2"
        sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {row.email || "—"}
      </Typography>
    );
  if (col.id === "fullName")
    return <Typography variant="body2" fontWeight={500}>{row.fullName || "—"}</Typography>;
  return <>{row[col.id] ?? "—"}</>;
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────────
function SkeletonRows() {
  return Array.from({ length: 6 }).map((_, i) => (
    <TableRow key={i}>
      <TableCell padding="checkbox">
        <Skeleton variant="rectangular" width={18} height={18} />
      </TableCell>
      {COLUMNS.map((col) => (
        <TableCell key={col.id}>
          <Skeleton variant="text" width="80%" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ search, tagName }) {
  return (
    <TableRow>
      <TableCell colSpan={COLUMNS.length + 1} align="center" sx={{ py: 8 }}>
        <SearchOffIcon
          sx={{ fontSize: 52, color: "text.disabled", mb: 1, display: "block", mx: "auto" }}
        />
        <Typography variant="body2" color="text.secondary">
          {search
            ? `No candidates match "${search}"`
            : `No candidates found for tag "${tagName}"`}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

// ─── TagCandidatesTable ────────────────────────────────────────────────────────
/**
 * Props:
 *   rows    – candidate array (fetched by parent)
 *   loading – boolean
 *   tagName – string (for empty-state label)
 */
const TagCandidatesTable = ({ rows = [], loading = false, tagName = "" }) => {
  const theme = useTheme();

  const [order,       setOrder]       = useState("asc");
  const [orderBy,     setOrderBy]     = useState("id");
  const [selected,    setSelected]    = useState([]);
  const [page,        setPage]        = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search,      setSearch]      = useState("");

  // ── NEW: Job ID + submit state ──────────────────────────────────────────────
  const [jobId,        setJobId]        = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [submitResult, setSubmitResult] = useState(null); // { type: "success"|"error", message }

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(0); };
  const clearSearch = () => { setSearch(""); setPage(0); };

  const handleRequestSort = (colId) => {
    setOrder(orderBy === colId && order === "asc" ? "desc" : "asc");
    setOrderBy(colId);
    setPage(0);
  };

  const filteredRows = useMemo(() => applySearch(rows, search), [rows, search]);
  const sortedRows   = useMemo(
    () => stableSort(filteredRows, getComparator(order, orderBy)),
    [filteredRows, order, orderBy],
  );
  const pagedRows = useMemo(
    () => sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedRows, page, rowsPerPage],
  );

  const numSelected = selected.length;
  const rowCount    = filteredRows.length;

  const handleSelectAll = (e) =>
    setSelected(e.target.checked ? filteredRows.map((r) => r.id) : []);
  const handleSelectRow = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  const isSelected = (id) => selected.includes(id);

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!jobId.trim()) {
      setSubmitResult({ type: "error", message: "Please enter a Job ID before submitting." });
      return;
    }
    if (selected.length === 0) {
      setSubmitResult({ type: "error", message: "Please select at least one candidate." });
      return;
    }

    // Map selected row IDs → benchIds from the actual row objects
    const benchIds = rows
      .filter((r) => selected.includes(r.id))
      .map((r) => r.id);        // ← adjust field name if different

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await axios.post(
        "https://mymulya.com/candidate/submit-bench",
        { benchIds, jobId: jobId.trim() },
      );

      const { message, submittedBenchIds, skippedBenchIds } = response.data;

      let detail = message;
      if (skippedBenchIds?.length > 0) {
        detail += ` (${skippedBenchIds.length} skipped: ${skippedBenchIds.join(", ")})`;
      }

      setSubmitResult({ type: "success", message: detail });
      setSelected([]); // clear selection on success
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Submission failed. Please try again.";
      setSubmitResult({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = numSelected > 0 && jobId.trim() !== "" && !submitting;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>

      {/* ── Submit Result Banner ─────────────────────────────────────────────── */}
      {submitResult && (
        <Box
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor:
              submitResult.type === "success"
                ? alpha(theme.palette.success.main, 0.1)
                : alpha(theme.palette.error.main, 0.1),
            borderBottom: `1px solid ${
              submitResult.type === "success"
                ? theme.palette.success.light
                : theme.palette.error.light
            }`,
          }}
        >
          <Typography
            variant="body2"
            color={submitResult.type === "success" ? "success.dark" : "error.dark"}
            fontWeight={500}
          >
            {submitResult.type === "success" ? "✓ " : "✕ "}
            {submitResult.message}
          </Typography>
          <IconButton size="small" onClick={() => setSubmitResult(null)}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <Toolbar
        sx={{
          px: 2,
          py: 1,
          gap: 2,
          flexWrap: "wrap",
          minHeight: "56px !important",
          ...(numSelected > 0 && { bgcolor: alpha(theme.palette.primary.main, 0.08) }),
        }}
      >
        {numSelected > 0 ? (
          <>
            {/* Selection mode: show count + Job ID input + Submit button */}
            <Typography variant="subtitle1" color="primary" fontWeight={600}>
              {numSelected} row{numSelected > 1 ? "s" : ""} selected
            </Typography>

            <Box sx={{ flex: 1 }} />

            <TextField
              size="small"
              placeholder="Enter Job ID…"
              value={jobId}
              onChange={(e) => {
                setJobId(e.target.value);
                setSubmitResult(null);
              }}
              sx={{ width: 200 }}
              error={submitResult?.type === "error" && !jobId.trim()}
            />

            <Button
              variant="contained"
              size="small"
              startIcon={
                submitting
                  ? <CircularProgress size={14} color="inherit" />
                  : <SendIcon fontSize="small" />
              }
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {submitting ? "Submitting…" : "Submit to Job"}
            </Button>
          </>
        ) : (
          <>
            {/* Normal mode: search + count */}
            <TextField
              size="small"
              placeholder="Search candidates…"
              value={search}
              onChange={handleSearchChange}
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={clearSearch}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
              {loading
                ? "Loading…"
                : `${filteredRows.length} of ${rows.length} candidate${rows.length !== 1 ? "s" : ""}`}
            </Typography>
          </>
        )}
      </Toolbar>

      <Divider />

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <TableContainer sx={{ maxHeight: "60vh" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                sx={{
                  bgcolor: "background.paper",
                  borderBottom: `2px solid ${theme.palette.divider}`,
                }}
              >
                <Checkbox
                  size="small"
                  indeterminate={numSelected > 0 && numSelected < rowCount}
                  checked={rowCount > 0 && numSelected === rowCount}
                  onChange={handleSelectAll}
                />
              </TableCell>
              {COLUMNS.map((col) => (
                <TableCell
                  key={col.id}
                  sx={{
                    width: col.width,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    bgcolor: "background.paper",
                    borderBottom: `2px solid ${theme.palette.divider}`,
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
              <SkeletonRows />
            ) : pagedRows.length === 0 ? (
              <EmptyState search={search} tagName={tagName} />
            ) : (
              pagedRows.map((row) => {
                const rowSelected = isSelected(row.id);
                return (
                  <TableRow
                    key={row.id}
                    hover
                    selected={rowSelected}
                    onClick={() => handleSelectRow(row.id)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={rowSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => handleSelectRow(row.id)}
                      />
                    </TableCell>
                    {COLUMNS.map((col) => (
                      <TableCell key={col.id}>
                        <CellValue col={col} row={row} />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider />

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      <TablePagination
        component="div"
        count={filteredRows.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 20, 50]}
      />
    </Paper>
  );
};

export default TagCandidatesTable;