import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  TextField,
  Box,
  Typography,
  Toolbar,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  InputAdornment,
  Chip,
  Badge,
  Tooltip,
  Checkbox,
  Button,
  Divider,
  Menu,
  CircularProgress,
  Collapse,
  alpha,
  MenuItem,
} from "@mui/material";
import {
  Search,
  FilterList,
  Clear,
  ViewColumn,
  MoreVert,
  Refresh,
  DarkMode,
  LightMode,
  CloudDownload,
  Send,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import * as XLSX from "xlsx";


const exportToCsv = (data, columns) => {
  const headerRow = columns.map((c) => c.label).join(",");
  const dataRows = data.map((row) =>
    columns
      .map((c) => {
        if (c.key === "actions") return "";
        const v = row[c.key];
        return typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v;
      })
      .join(","),
  );
  const blob = new Blob([[headerRow, ...dataRows].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "data_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToExcel = (data, columns, fileName = "data_export") => {
  const visibleColumns = columns.filter(
    (c) => c.visible !== false && c.key !== "actions",
  );
  const headers = visibleColumns.map((c) => c.label);
  const excelData = data.map((row) => {
    const rowData = {};
    visibleColumns.forEach((c) => {
      rowData[c.label] = row[c.key];
    });
    return rowData;
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData, { header: headers });
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

const ListItemIcon = ({ children, ...props }) => (
  <Box sx={{ mr: 2, display: "inline-flex", minWidth: "24px", ...props }}>
    {children}
  </Box>
);



const DataTablePaginated = ({
  data: initialData = [],
  columns: initialColumns = [],
  title = "Data Table",
  loading = false,
  enableSelection = true,
  defaultSortColumn,
  defaultSortDirection = "asc",
  defaultRowsPerPage = 10,
  customTableHeight,
  customTableWidth,
  onRowClick,
  refreshData,
  customStyles = {},
  primaryColor = "#1976d2",
  secondaryColor = "#f5f5f5",
  uniqueId = "id",
  serverSide = false,
  totalCount = 0,
  page: externalPage,
  rowsPerPage: externalRowsPerPage,
  onPageChange,
  onSortChange,
  onFilterChange,
  onSearchChange,
  enableFinancialValidation = false,
  enableSendEmail = false,
  onSendEmail,
  onRequestOtpVerification,
  isFinancialVerified,
  userFilteredDataCount,
  enableLocalFiltering = false,
  onExportData,
  onRowsPerPageChange,
  enableServerSideFiltering = false,
  searchValue = "",
}) => {
  // ── Derived columns ──────────────────────────────────────────────────────
  const processedColumns = useMemo(
    () =>
      initialColumns.map((column) => ({
        ...column,
        sortable: column.sortable !== false,
        filterable: column.filterable !== false,
        visible: column.visible !== false,
        type: column.type || "text",
        width: column.width || "auto",
        options: column.options || [],
      })),
    [initialColumns],
  );

  // ── State ────────────────────────────────────────────────────────────────
  const [data, setData] = useState(initialData);
  const [columns, setColumns] = useState(processedColumns);
  const [filteredData, setFilteredData] = useState(initialData);
  const [order, setOrder] = useState(defaultSortDirection);
  const [orderBy, setOrderBy] = useState(
    defaultSortColumn || processedColumns[0]?.key || uniqueId,
  );
  const [searchInput, setSearchInput] = useState(searchValue || "");
  const [searchQuery, setSearchQuery] = useState(searchValue || "");
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState(null);
  const [optionsMenu, setOptionsMenu] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [densePadding, setDensePadding] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  // Internal pagination state (used when external not provided)
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(defaultRowsPerPage);

  // Use external pagination if provided, otherwise use internal
  const currentPage = externalPage !== undefined ? externalPage : internalPage;
  const currentRowsPerPage = externalRowsPerPage !== undefined ? externalRowsPerPage : internalRowsPerPage;

  const tableHeight = customTableHeight || "100%";
  const tableWidth = customTableWidth || "100%";

  const tableStyles = {
    headerBackground: darkMode ? alpha(primaryColor, 0.8) : primaryColor,
    headerText: "#ffffff",
    rowHover: alpha(primaryColor, 0.1),
    selectedRow: darkMode ? alpha(primaryColor, 0.2) : alpha(primaryColor, 0.15),
    paper: {
      backgroundColor: darkMode ? "#333" : "#fff",
      color: darkMode ? "#fff" : "#333",
    },
    ...customStyles,
  };

  // ── Compute visible columns early ─────────────────────────────────────────
  const visibleColumns = useMemo(() =>
    columns.filter((c) => c.visible !== false),
    [columns]
  );

  const filterableColumns = useMemo(() =>
    columns.filter((col) => col.filterable && col.visible !== false),
    [columns]
  );

  // ── Sync external searchValue ────────────────────────────────────────────
  useEffect(() => {
    if (searchValue !== undefined && searchValue !== searchInput) {
      setSearchInput(searchValue);
      setSearchQuery(searchValue);
    }
  }, [searchValue]);

  // ── Sync data ────────────────────────────────────────────────────────────
  useEffect(() => {
    setData(initialData);
    if (!serverSide || enableLocalFiltering) setFilteredData(initialData);
  }, [initialData, serverSide, enableLocalFiltering]);

  useEffect(() => {
    setColumns(processedColumns);
  }, [processedColumns]);

  // ── Comparators ──────────────────────────────────────────────────────────
  const descendingComparator = (a, b, key) => {
    const aVal = a[key] ?? "";
    const bVal = b[key] ?? "";
    if (bVal < aVal) return -1;
    if (bVal > aVal) return 1;
    return 0;
  };

  const getComparator = (ord, key) =>
    ord === "desc"
      ? (a, b) => descendingComparator(a, b, key)
      : (a, b) => -descendingComparator(a, b, key);

  // ── Sort ─────────────────────────────────────────────────────────────────
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    const newOrder = isAsc ? "desc" : "asc";
    setOrder(newOrder);
    setOrderBy(property);

    // For server-side sorting, trigger the callback
    if (serverSide && !enableLocalFiltering && onSortChange) {
      onSortChange(
        property,
        newOrder,
        currentPage,
        currentRowsPerPage,
        filters,
        searchQuery,
      );
    }
  };

  // ── Pagination ───────────────────────────────────────────────────────────
const handleChangePage = (_, newPage) => {
  if (serverSide && onPageChange) {
    onPageChange(newPage, currentRowsPerPage); // ← always call server
  }
  setInternalPage(newPage); // ← also update internal state
};

const handleChangeRowsPerPage = (e) => {
  const newRowsPerPage = parseInt(e.target.value, 10);
  setInternalRowsPerPage(newRowsPerPage);
  setInternalPage(0);

  if (serverSide) {
    if (onRowsPerPageChange) onRowsPerPageChange(newRowsPerPage);
    if (onPageChange) onPageChange(0, newRowsPerPage); // ← always call server
  }
};
  // ── Search ───────────────────────────────────────────────────────────────
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (serverSide && !enableLocalFiltering) {
      // Pure server-side: trigger search on server
      setSearchQuery(value);
      if (onSearchChange) {
        onSearchChange(
          value,
          currentPage,
          currentRowsPerPage,
          orderBy,
          order,
        );
      }
    } else {
      // Client-side or server-side with local filtering: just update input
      // Search will be applied in the useEffect
      setSearchQuery(value);
    }
  };

  const handleSearchClick = () => {
    const trimmed = searchInput.trim();
    setSearchQuery(trimmed);

    if (serverSide && !enableLocalFiltering && onSearchChange) {
      onSearchChange(
        trimmed,
        currentPage,
        currentRowsPerPage,
        orderBy,
        order,
      );
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") handleSearchClick();
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");

    if (serverSide && !enableLocalFiltering && onSearchChange) {
      onSearchChange(
        "",
        currentPage,
        currentRowsPerPage,
        orderBy,
        order,
      );
    }
  };

  // ── Filters ──────────────────────────────────────────────────────────────
  const toggleFilters = () => setShowFilters((v) => !v);
  const toggleAdvancedFilters = () => setAdvancedFiltersOpen((v) => !v);

  const handleFilterChange = (column, value) => {
    const newFilters = { ...filters, [column]: value };
    setFilters(newFilters);

    if ((serverSide && !enableLocalFiltering) && onFilterChange) {
      onFilterChange(
        newFilters,
        currentPage,
        currentRowsPerPage,
        orderBy,
        order,
        searchQuery,
      );
    }
  };

  const clearAllFilters = () => {
    setFilters({});

    if ((serverSide && !enableLocalFiltering) && onFilterChange) {
      onFilterChange(
        {},
        currentPage,
        currentRowsPerPage,
        orderBy,
        order,
        searchQuery,
      );
    }
  };

  /**
   * Returns options for a column filter dropdown.
   * Uses column.options if provided, otherwise derives unique values from data.
   */
  const getColumnFilterOptions = (columnKey) => {
    const column = columns.find((c) => c.key === columnKey);
    if (column?.options?.length > 0) return column.options;
    return [...new Set(data.map((row) => row[columnKey]))]
      .filter((v) => v !== null && v !== undefined)
      .sort();
  };

  // ── Selection ────────────────────────────────────────────────────────────
  const handleSelectAllClick = (e) => {
    if (e.target.checked) {
      const src = (serverSide && !enableLocalFiltering) ? data : filteredData;
      setSelectedRows(src.map((row) => row[uniqueId]));
    } else {
      setSelectedRows([]);
    }
  };

  const handleCheckboxClick = (e, id) => {
    e.stopPropagation();
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const isRowSelected = (id) => selectedRows.includes(id);

  // ── Column visibility ────────────────────────────────────────────────────
  const handleColumnVisibilityMenuOpen = (e) => setColumnVisibilityMenu(e.currentTarget);
  const handleColumnVisibilityMenuClose = () => setColumnVisibilityMenu(null);

  const toggleColumnVisibility = (key) =>
    setColumns((cols) =>
      cols.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)),
    );

  // ── Options menu ─────────────────────────────────────────────────────────
  const handleOptionsMenuOpen = (e) => setOptionsMenu(e.currentTarget);
  const handleOptionsMenuClose = () => setOptionsMenu(null);

  const toggleDarkMode = () => setDarkMode((v) => !v);
  const toggleDensePadding = () => setDensePadding((v) => !v);

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExportData = (format = "csv") => {
    if (enableFinancialValidation && !isFinancialVerified) {
      onRequestOtpVerification(() => performExport(format));
      return;
    }
    performExport(format);
  };

  const performExport = (format) => {
    if (serverSide && !enableLocalFiltering && onExportData) {
      onExportData(format, {
        page: currentPage,
        rowsPerPage: currentRowsPerPage,
        orderBy,
        order,
        filters,
        searchQuery,
      });
      handleOptionsMenuClose();
      return;
    }
    const visibleCols = columns.filter((c) => c.visible !== false);
    const src = (serverSide && !enableLocalFiltering) ? data : filteredData;
    if (format === "csv") exportToCsv(src, visibleCols);
    else exportToExcel(src, visibleCols);
    handleOptionsMenuClose();
  };

  // ── Row expand ───────────────────────────────────────────────────────────
  const handleRowExpand = (id) =>
    setExpandedRow((prev) => (prev === id ? null : id));

  // ── Reset ────────────────────────────────────────────────────────────────
  const resetAllSettings = () => {
    setSearchQuery("");
    setSearchInput("");
    setFilters({});
    setSelectedRows([]);
    setColumns(processedColumns);
    setOrder(defaultSortDirection);
    setOrderBy(defaultSortColumn || processedColumns[0]?.key || uniqueId);
    setDarkMode(false);
    setDensePadding(false);
    setShowFilters(false);
    setAdvancedFiltersOpen(false);
    setInternalPage(0);
    setInternalRowsPerPage(defaultRowsPerPage);
    handleOptionsMenuClose();

    if (serverSide && !enableLocalFiltering && onPageChange) {
      onPageChange(0, defaultRowsPerPage);
    }
    if (serverSide && !enableLocalFiltering && onSearchChange) {
      onSearchChange("", 0, currentRowsPerPage, orderBy, order);
    }
  };

  useEffect(() => {
    if (serverSide && !enableLocalFiltering) return;

    let result = [...data];

    // Apply search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((row) =>
        columns.some((col) => {
          // Skip columns that are not visible or are actions
          if (!col.visible || col.key === 'actions') return false;

          const value = row[col.key];
          if (value === null || value === undefined) return false;

          // Handle different data types
          if (Array.isArray(value)) {
            return value.some(v =>
              String(v).toLowerCase().includes(q)
            );
          }

          if (typeof value === 'object') {
            return false; 
          }

          return String(value).toLowerCase().includes(q);
        })
      );
    }

    // Apply column filters
    Object.keys(filters).forEach((key) => {
      const filterValue = filters[key];
      if (filterValue === "" || filterValue === null || filterValue === undefined) return;

      result = result.filter((row) => {
        const rowValue = row[key];
        if (rowValue === null || rowValue === undefined) return false;

        // Handle select filters (exact match)
        if (typeof filterValue === "string" && columns.find(c => c.key === key)?.type === "select") {
          return String(rowValue).toLowerCase() === String(filterValue).toLowerCase();
        }

        // Handle text filters (partial match)
        if (typeof filterValue === "string") {
          return String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase());
        }

        // Handle array filters
        if (Array.isArray(filterValue)) {
          return filterValue.includes(String(rowValue).toLowerCase());
        }

        // Handle number filters
        if (typeof rowValue === "number" && !isNaN(filterValue)) {
          return rowValue === Number(filterValue);
        }

        return false;
      });
    });

    // Apply sorting
    result = result.sort(getComparator(order, orderBy));
    setFilteredData(result);
  }, [searchQuery, filters, data, order, orderBy, columns, serverSide, enableLocalFiltering]);

  // ── Display data and total count ─────────────────────────────────────────
 const displayData = useMemo(() => {
  if (serverSide && !enableLocalFiltering) {
    return data;
  }
  if (serverSide && enableLocalFiltering) {
    return filteredData; // ← server already gave us exactly one page, just filter it
  }
  // Pure client-side: slice locally
  const p = currentPage;
  const rpp = currentRowsPerPage;
  return filteredData.slice(p * rpp, p * rpp + rpp);
}, [serverSide, enableLocalFiltering, data, filteredData, currentPage, currentRowsPerPage]);

const totalRowCount = useMemo(() => {
  if (serverSide && enableLocalFiltering) {
    // If actively searching, show filtered count; otherwise show server total
    return searchQuery || Object.keys(filters).length > 0
      ? filteredData.length
      : totalCount;
  }
  if (serverSide) {
    return totalCount;
  }
  return filteredData.length;
}, [serverSide, enableLocalFiltering, totalCount, filteredData, searchQuery, filters]);

  const shouldShowFilters = !serverSide || enableLocalFiltering || enableServerSideFiltering;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ width: tableWidth }}>
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          mb: 2,
          backgroundColor: tableStyles.paper.backgroundColor,
          color: tableStyles.paper.color,
          transition: "all 0.3s ease",
        }}
      >
        {/* ── Toolbar ── */}
        <Toolbar
          variant="dense"
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ flex: "1 1 auto", color: tableStyles.paper.color }}
          >
            {title}
            {selectedRows.length > 0 && (
              <Chip
                label={`${selectedRows.length} selected`}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            {/* Search field */}
            <TextField
              variant="outlined"
              size="small"
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyPress={handleSearchKeyPress}
              placeholder="Search..."
              disabled={serverSide && !onSearchChange && !enableLocalFiltering}
              sx={{
                width: { xs: "100%", sm: 200 },
                "& .MuiOutlinedInput-root": {
                  color: tableStyles.paper.color,
                  "& fieldset": { borderColor: alpha(tableStyles.paper.color, 0.5) },
                  "&:hover fieldset": { borderColor: alpha(tableStyles.paper.color, 0.7) },
                  "&.Mui-focused fieldset": { borderColor: primaryColor },
                },
                "& .MuiInputLabel-root": { color: alpha(tableStyles.paper.color, 0.7) },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: alpha(tableStyles.paper.color, 0.7) }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput && (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="clear search"
                      onClick={clearSearch}
                      edge="end"
                      size="small"
                      sx={{ color: alpha(tableStyles.paper.color, 0.7) }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Filter toggle */}
            {shouldShowFilters && (
              <Tooltip title="Show/Hide Filters">
                <IconButton
                  onClick={toggleFilters}
                  aria-label="filter list"
                  sx={{
                    color: showFilters
                      ? primaryColor
                      : alpha(tableStyles.paper.color, 0.7),
                  }}
                >
                  <Badge
                    color="primary"
                    variant="dot"
                    invisible={Object.keys(filters).length === 0}
                  >
                    <FilterList />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}

            {/* Column visibility */}
            <Tooltip title="Column Visibility">
              <IconButton
                onClick={handleColumnVisibilityMenuOpen}
                aria-label="column visibility"
                sx={{ color: alpha(tableStyles.paper.color, 0.7) }}
              >
                <ViewColumn />
              </IconButton>
            </Tooltip>

            {/* Refresh */}
            {refreshData && (
              <Tooltip title="Refresh Data">
                <IconButton
                  onClick={refreshData}
                  aria-label="refresh data"
                  sx={{ color: alpha(tableStyles.paper.color, 0.7) }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}

            {/* More options */}
            <Tooltip title="Table Options">
              <IconButton
                onClick={handleOptionsMenuOpen}
                aria-label="table options"
                sx={{ color: alpha(tableStyles.paper.color, 0.7) }}
              >
                <MoreVert />
              </IconButton>
            </Tooltip>

            {/* Column visibility menu */}
            <Menu
              id="column-visibility-menu"
              anchorEl={columnVisibilityMenu}
              open={Boolean(columnVisibilityMenu)}
              onClose={handleColumnVisibilityMenuClose}
              PaperProps={{
                sx: {
                  maxHeight: 300,
                  width: 200,
                  backgroundColor: darkMode ? "#444" : "#fff",
                  color: darkMode ? "#fff" : "#333",
                },
              }}
            >
              {columns.map((column) => (
                <MenuItem
                  key={column.key}
                  onClick={() => toggleColumnVisibility(column.key)}
                  sx={{
                    backgroundColor: darkMode ? "#444" : "#fff",
                    color: darkMode ? "#fff" : "#333",
                  }}
                >
                  <Checkbox
                    checked={column.visible !== false}
                    color="primary"
                    size="small"
                  />
                  {column.label}
                </MenuItem>
              ))}
            </Menu>

            {/* Options menu */}
            <Menu
              id="options-menu"
              anchorEl={optionsMenu}
              open={Boolean(optionsMenu)}
              onClose={handleOptionsMenuClose}
              PaperProps={{
                sx: {
                  width: 220,
                  backgroundColor: darkMode ? "#444" : "#fff",
                  color: darkMode ? "#fff" : "#333",
                },
              }}
            >
              <MenuItem onClick={toggleDarkMode}>
                <ListItemIcon>
                  {darkMode ? (
                    <LightMode fontSize="small" sx={{ color: darkMode ? "#fff" : "#333" }} />
                  ) : (
                    <DarkMode fontSize="small" sx={{ color: darkMode ? "#fff" : "#333" }} />
                  )}
                </ListItemIcon>
                {darkMode ? "Light Mode" : "Dark Mode"}
              </MenuItem>

              <MenuItem onClick={toggleDensePadding}>
                <ListItemIcon>
                  <Checkbox
                    checked={densePadding}
                    size="small"
                    sx={{ p: 0, m: 0, color: darkMode ? "#fff" : "#333" }}
                  />
                </ListItemIcon>
                Compact Mode
              </MenuItem>

              {enableSendEmail && onSendEmail && (
                <>
                  <MenuItem
                    onClick={() => {
                      onSendEmail();
                      handleOptionsMenuClose();
                    }}
                  >
                    <ListItemIcon>
                      <Send fontSize="small" sx={{ color: darkMode ? "#fff" : "#333" }} />
                    </ListItemIcon>
                    Send Email
                    {userFilteredDataCount !== undefined && (
                      <Chip
                        label={`${userFilteredDataCount} records`}
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </MenuItem>
                  <Divider />
                </>
              )}

              <Divider />

              <MenuItem
                onClick={() => handleExportData("csv")}
                disabled={enableFinancialValidation && !isFinancialVerified}
              >
                <ListItemIcon>
                  <CloudDownload fontSize="small" />
                </ListItemIcon>
                Export to CSV
              </MenuItem>
              <MenuItem
                onClick={() => handleExportData("excel")}
                disabled={enableFinancialValidation && !isFinancialVerified}
              >
                <ListItemIcon>
                  <CloudDownload fontSize="small" />
                </ListItemIcon>
                Export to Excel
              </MenuItem>

              <Divider />
              <MenuItem onClick={resetAllSettings}>
                <ListItemIcon>
                  <Refresh fontSize="small" sx={{ color: darkMode ? "#fff" : "#333" }} />
                </ListItemIcon>
                Reset All Settings
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>

        {/* ── Filter panel ── */}
        <Collapse in={showFilters}>
          <Box
            sx={{
              p: 2,
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              borderBottom: 1,
              borderColor: "divider",
              backgroundColor: darkMode
                ? alpha(primaryColor, 0.05)
                : alpha(primaryColor, 0.03),
            }}
          >
            {filterableColumns
              // Show first 3 unless advanced is open
              .slice(0, advancedFiltersOpen ? filterableColumns.length : 3)
              .map((column) => (
                <FormControl
                  key={column.key}
                  size="small"
                  variant="outlined"
                  sx={{
                    minWidth: 150,
                    "& .MuiInputLabel-outlined": {
                      color: alpha(tableStyles.paper.color, 0.7),
                      "&.Mui-focused": { color: primaryColor },
                    },
                    "& .MuiOutlinedInput-root": {
                      color: tableStyles.paper.color,
                      "& fieldset": { borderColor: alpha(tableStyles.paper.color, 0.5) },
                      "&:hover fieldset": { borderColor: alpha(tableStyles.paper.color, 0.7) },
                      "&.Mui-focused fieldset": { borderColor: primaryColor },
                    },
                  }}
                >
                  {column.type === "select" ? (
                    <>
                      <InputLabel id={`filter-${column.key}-label`}>
                        {column.label}
                      </InputLabel>
                      <Select
                        labelId={`filter-${column.key}-label`}
                        value={filters[column.key] || ""}
                        label={column.label}
                        onChange={(e) => handleFilterChange(column.key, e.target.value)}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 300,
                              backgroundColor: darkMode ? "#444" : "#fff",
                              color: darkMode ? "#fff" : "#333",
                            },
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {getColumnFilterOptions(column.key).map((option) => (
                          <MenuItem
                            key={option}
                            value={option}
                            sx={{
                              backgroundColor: darkMode ? "#444" : "#fff",
                              color: darkMode ? "#fff" : "#333",
                              "&:hover": { backgroundColor: darkMode ? "#555" : "#f5f5f5" },
                            }}
                          >
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </>
                  ) : (
                    <TextField
                      id={column.key}
                      label={column.label}
                      type={column.type}
                      value={filters[column.key] || ""}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      size="small"
                      variant="outlined"
                      placeholder={column.type === "date" ? undefined : column.label}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: tableStyles.paper.color,
                          "& fieldset": { borderColor: alpha(tableStyles.paper.color, 0.5) },
                          "&:hover fieldset": { borderColor: alpha(tableStyles.paper.color, 0.7) },
                          "&.Mui-focused fieldset": { borderColor: primaryColor },
                        },
                        "& .MuiInputLabel-root": {
                          color: alpha(tableStyles.paper.color, 0.7),
                        },
                      }}
                    />
                  )}
                </FormControl>
              ))}

            <Box sx={{ display: "flex", alignItems: "center", ml: "auto" }}>
              <Button
                size="small"
                onClick={clearAllFilters}
                startIcon={<Clear />}
                variant="outlined"
                sx={{
                  borderColor: alpha(tableStyles.paper.color, 0.5),
                  color: tableStyles.paper.color,
                  "&:hover": {
                    borderColor: alpha(tableStyles.paper.color, 0.7),
                    backgroundColor: alpha(tableStyles.paper.color, 0.05),
                  },
                }}
              >
                Clear
              </Button>

              {/* More / Less button — only shown when there are more than 3 filterable columns */}
              {filterableColumns.length > 3 && (
                <Button
                  size="small"
                  onClick={toggleAdvancedFilters}
                  endIcon={advancedFiltersOpen ? <ExpandLess /> : <ExpandMore />}
                  sx={{ ml: 1, color: tableStyles.paper.color }}
                >
                  {advancedFiltersOpen ? "Less" : "More"}
                </Button>
              )}
            </Box>
          </Box>
        </Collapse>

        {/* ── Table ── */}
        <TableContainer
          sx={{
            height: tableHeight,
            width: tableWidth,
            overflow: "auto",
            position: "relative",
            maxHeight: "calc(100vh - 70px)",
          }}
        >
          {loading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: alpha(tableStyles.paper.backgroundColor, 0.7),
                zIndex: 10,
              }}
            >
              <CircularProgress color="primary" />
            </Box>
          )}

          <Table
            stickyHeader
            aria-label="data table"
            size={densePadding ? "small" : "medium"}
          >
            <TableHead>
              <TableRow>
                {enableSelection && (
                  <TableCell
                    padding="checkbox"
                    sx={{
                      backgroundColor: tableStyles.headerBackground,
                      position: "sticky",
                      left: 0,
                      zIndex: 3,
                    }}
                  >
                    <Checkbox
                      color="primary"
                      indeterminate={
                        selectedRows.length > 0 &&
                        selectedRows.length <
                        ((serverSide && !enableLocalFiltering) ? data.length : filteredData.length)
                      }
                      checked={
                        ((serverSide && !enableLocalFiltering) ? data.length > 0 : filteredData.length > 0) &&
                        selectedRows.length ===
                        ((serverSide && !enableLocalFiltering) ? data.length : filteredData.length)
                      }
                      onChange={handleSelectAllClick}
                      sx={{ color: tableStyles.headerText }}
                    />
                  </TableCell>
                )}

                {visibleColumns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || "left"}
                    sortDirection={orderBy === column.key ? order : false}
                    style={{
                      minWidth: column.width,
                      width: column.width,
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                      backgroundColor: tableStyles.headerBackground,
                    }}
                    sx={{
                      color: tableStyles.headerText,
                      whiteSpace: "nowrap",
                      "& .MuiTableSortLabel-root": {
                        color: `${tableStyles.headerText} !important`,
                        "&:hover": { color: "rgba(255,255,255,0.7) !important" },
                        "&.Mui-active": { color: `${tableStyles.headerText} !important` },
                      },
                      "& .MuiTableSortLabel-icon": {
                        color: "rgba(255,255,255,0.7) !important",
                      },
                    }}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={orderBy === column.key}
                        direction={orderBy === column.key ? order : "asc"}
                        onClick={() => handleSort(column.key)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + (enableSelection ? 1 : 0)}
                    align="center"
                    sx={{ py: 3 }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      {loading ? "Loading..." : "No records found"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((row) => {
                  const rowId = row[uniqueId];
                  const isItemSelected = isRowSelected(rowId);
                  const isExpanded = expandedRow === rowId;

                  return (
                    <React.Fragment key={rowId}>
                      <TableRow
                        hover
                        onClick={() => {
                          if (onRowClick) onRowClick(row);
                          handleRowExpand(rowId);
                        }}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        selected={isItemSelected}
                        sx={{
                          cursor: "pointer",
                          "&.MuiTableRow-root.Mui-selected": {
                            backgroundColor: tableStyles.selectedRow,
                          },
                          "&.MuiTableRow-root:hover": {
                            backgroundColor: tableStyles.rowHover,
                          },
                        }}
                      >
                        {enableSelection && (
                          <TableCell
                            padding="checkbox"
                            sx={{
                              backgroundColor: tableStyles.paper.backgroundColor,
                              position: "sticky",
                              left: 0,
                              zIndex: 2,
                            }}
                          >
                            <Checkbox
                              checked={isItemSelected}
                              color="primary"
                              onClick={(e) => handleCheckboxClick(e, rowId)}
                            />
                          </TableCell>
                        )}

                        {visibleColumns.map((column) => (
                          <TableCell
                            key={`${rowId}-${column.key}`}
                            align={column.align || "left"}
                            sx={{ backgroundColor: "inherit", position: "inherit", zIndex: 0 }}
                          >
                            {column.render
                              ? column.render(row)
                              : row[column.key] !== null && row[column.key] !== undefined
                                ? row[column.key]
                                : "-"}
                          </TableCell>
                        ))}
                      </TableRow>

                      {row.expandContent && (
                        <TableRow>
                          <TableCell
                            colSpan={visibleColumns.length + (enableSelection ? 1 : 0)}
                            style={{ paddingBottom: 0, paddingTop: 0 }}
                          >
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2 }}>
                                {typeof row.expandContent === "function"
                                  ? row.expandContent(row)
                                  : row.expandContent}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Pagination ── */}
        <TablePagination
          rowsPerPageOptions={[10, 20, 40, 60, 80, 100]}
          component="div"
          count={totalRowCount}
          rowsPerPage={currentRowsPerPage}
          page={currentPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            color: tableStyles.paper.color,
            "& .MuiTablePagination-selectIcon": { color: tableStyles.paper.color },
            "& .MuiTablePagination-actions .MuiIconButton-root": {
              color: alpha(tableStyles.paper.color, 0.7),
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default DataTablePaginated;