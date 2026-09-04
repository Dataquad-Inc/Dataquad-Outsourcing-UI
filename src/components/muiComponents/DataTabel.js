import React, { useState, useEffect, useMemo } from "react";
/**
 * Client-side DataTable.
 * Prefer DataTablePaginated.jsx with serverSide for large list pages.
 */
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
  TableFooter,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  useTheme,
  alpha,
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
  ExpandMore,
  ExpandLess,
  Send
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { useDispatch, useSelector } from "react-redux";

// CSV Export function
const exportToCsv = (data, columns) => {
  const headerRow = columns.map((column) => column.label).join(",");
  const dataRows = data.map((row) =>
    columns
      .map((column) => {
        if (column.key === "actions") return "";
        const value = row[column.key];
        // Handle special values that might break CSV format
        return typeof value === "string"
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      })
      .join(",")
  );

  const csvContent = [headerRow, ...dataRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "data_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Excel Export function
const exportToExcel = (data, columns, fileName = "data_export") => {
  // Filter visible columns and map to Excel headers
  const visibleColumns = columns.filter(
    (col) => col.visible !== false && col.key !== "actions"
  );
  const headers = visibleColumns.map((col) => col.label);

  // Prepare data for Excel
  const excelData = data.map((row) => {
    const rowData = {};
    visibleColumns.forEach((col) => {
      rowData[col.label] = row[col.key];
    });
    return rowData;
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData, { header: headers });

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  // Generate Excel file and download
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

const DataTable = ({
  data: initialData = [],
  columns: initialColumns = [],
  title = "Data Table",
  loading = false,
  enableSelection = true,
  defaultSortColumn,
  defaultSortDirection = "asc",
  defaultRowsPerPage = 15,
  customTableHeight,
  customTableWidth,
  onRowClick,
  customSearch,
  refreshData,
  customStyles = {},
  primaryColor = "#1976d2",
  secondaryColor = "#f5f5f5",
  uniqueId = "id",
  enableFinancialValidation = false,
  enableSendEmail = false,
  onSendEmail, // Added missing prop
  onRequestOtpVerification, // callback to trigger OTP verification
  isFinancialVerified, // boolean to check if financial data is verified
  userFilteredDataCount, // Added missing prop
  enableColumnTotals = false,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { userId } = useSelector(state => state.auth);

  // Parse initial columns to add additional properties if not present
  const processedColumns = useMemo(() => {
    return initialColumns.map((column) => ({
      ...column,
      sortable: column.sortable !== false,
      filterable: column.filterable !== false,
      visible: column.visible !== false,
      type: column.type || "text",
      width: column.width || "auto",
      options: column.options || [],
    }));
  }, [initialColumns]);

  const [data, setData] = useState(initialData);
  const [columns, setColumns] = useState(processedColumns);
  const [filteredData, setFilteredData] = useState(initialData);
  // const [order, setOrder] = useState(defaultSortDirection);
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState(
    defaultSortColumn || columns[0]?.key || uniqueId
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState(null);
  const [optionsMenu, setOptionsMenu] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [densePadding, setDensePadding] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  // Calculate or use provided dimensions
  const tableHeight = customTableHeight || "100%";
  const tableWidth = customTableWidth || "100%";

  // Base styles that can be customized
  const tableStyles = {
    headerBackground: darkMode ? alpha(primaryColor, 0.8) : primaryColor,
    headerText: "#ffffff",
    rowHover: darkMode ? alpha(primaryColor, 0.1) : alpha(primaryColor, 0.1),
    selectedRow: darkMode
      ? alpha(primaryColor, 0.2)
      : alpha(primaryColor, 0.15),
    paper: {
      backgroundColor: darkMode ? "#333" : "#fff",
      color: darkMode ? "#fff" : "#333",
    },
    ...customStyles,
  };

  // Update data when initialData changes
  useEffect(() => {
    setData(initialData);
    setFilteredData(initialData);
  }, [initialData]);

  // Update columns when initialColumns changes
  useEffect(() => {
    setColumns(processedColumns);
  }, [processedColumns]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const getComparator = (order, orderBy) => {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    const aVal =
      a[orderBy] === null || a[orderBy] === undefined ? "" : a[orderBy];
    const bVal =
      b[orderBy] === null || b[orderBy] === undefined ? "" : b[orderBy];

    if (bVal < aVal) return -1;
    if (bVal > aVal) return 1;
    return 0;
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleFilterChange = (column, value) => {
    setFilters({
      ...filters,
      [column]: value,
    });
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const toggleAdvancedFilters = () => {
    setAdvancedFiltersOpen(!advancedFiltersOpen);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredData.map((row) => row[uniqueId]);
      setSelectedRows(newSelected);
    } else {
      setSelectedRows([]);
    }
  };

  const handleCheckboxClick = (event, id) => {
    event.stopPropagation();

    const selectedIndex = selectedRows.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedRows, id];
    } else {
      newSelected = selectedRows.filter((rowId) => rowId !== id);
    }

    setSelectedRows(newSelected);
  };

  const isRowSelected = (id) => selectedRows.indexOf(id) !== -1;

  const handleColumnVisibilityMenuOpen = (event) => {
    setColumnVisibilityMenu(event.currentTarget);
  };

  const handleColumnVisibilityMenuClose = () => {
    setColumnVisibilityMenu(null);
  };

  const handleOptionsMenuOpen = (event) => {
    setOptionsMenu(event.currentTarget);
  };

  const handleOptionsMenuClose = () => {
    setOptionsMenu(null);
  };

  const toggleColumnVisibility = (columnKey) => {
    setColumns(
      columns.map((col) =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleDensePadding = () => {
    setDensePadding(!densePadding);
  };

  const handleExportData = (format = "csv") => {
    // Check if financial validation is required and not verified
    if (enableFinancialValidation && !isFinancialVerified) {
      // Trigger OTP verification flow from parent
      onRequestOtpVerification(() => {
        // This callback will be executed after successful verification
        performExport(format);
      });
      return;
    }
    
    performExport(format);
  };

  const performExport = (format) => {
    const visibleColumns = columns.filter((col) => col.visible !== false);
    
    if (format === "csv") {
      exportToCsv(filteredData, visibleColumns);
    } else {
      exportToExcel(filteredData, visibleColumns);
    }
    
    handleOptionsMenuClose();
  };

  const handleRowExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const resetAllSettings = () => {
    setSearchQuery("");
    setFilters({});
    setSelectedRows([]);
    setColumns(processedColumns);
    setOrder(defaultSortDirection);
    setOrderBy(defaultSortColumn || columns[0]?.key || uniqueId);
    setPage(0);
    setRowsPerPage(defaultRowsPerPage);
    setDarkMode(false);
    setDensePadding(false);
    setShowFilters(false);
    setAdvancedFiltersOpen(false);
    handleOptionsMenuClose();
  };

  // Apply filters, search and sorting
  useEffect(() => {
    let result = [...data];
    const previousFilteredLength = filteredData.length;

    // Search functionality
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      result = result.filter((row) => {
        return columns.some((column) => {
          if (!column.visible) return false;
          const value = row[column.key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(lowercasedQuery);
        });
      });
    }

    // Filter functionality
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== "" &&
        filters[key] !== null &&
        filters[key] !== undefined
      ) {
        result = result.filter((row) => {
          const rowValue = row[key];
          const filterValue = filters[key];

          if (rowValue === null || rowValue === undefined) return false;

          if (typeof rowValue === "number") {
            return rowValue === Number(filterValue);
          }

          if (Array.isArray(filterValue)) {
            return filterValue.includes(String(rowValue).toLowerCase());
          }

          return String(rowValue)
            .toLowerCase()
            .includes(String(filterValue).toLowerCase());
        });
      }
    });

    // Sorting
    result = result.sort(getComparator(order, orderBy));

    setFilteredData(result);
    
    // Only reset page if the filtered data length has changed due to search/filter
    // OR if the current page would be out of bounds
    if (result.length !== previousFilteredLength || 
        (page > 0 && page * rowsPerPage >= result.length)) {
      setPage(0);
    }
  }, [searchQuery, filters, data, order, orderBy, columns, filteredData.length, page, rowsPerPage]);

  useEffect(() => {
    if (filteredData.length > 0) {
      const sortedData = [...filteredData].sort(getComparator(order, orderBy));
      setFilteredData(sortedData);
    }
  }, [order, orderBy]);

  // Find column options for filtering if not explicitly provided
  const getColumnFilterOptions = (columnKey) => {
    const column = columns.find((col) => col.key === columnKey);

    if (column.options && column.options.length > 0) {
      return column.options;
    }

    // Dynamically generate options from data
    const uniqueValues = [...new Set(data.map((row) => row[columnKey]))].filter(
      (val) => val !== null && val !== undefined
    );

    return uniqueValues.sort();
  };

  // The visible columns
  const visibleColumns = columns.filter((column) => column.visible !== false);

  const columnTotals = useMemo(() => {
    if (!enableColumnTotals) return {};
    const totals = {};
    visibleColumns.forEach((column) => {
      if (!column.total) return;
      totals[column.key] = filteredData.reduce((sum, row) => {
        const value = Number(row[column.key]);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0);
    });
    return totals;
  }, [enableColumnTotals, visibleColumns, filteredData]);

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
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
          variant="dense"
        >
          <Typography
            sx={{
              flex: "1 1 auto",
              color: tableStyles.paper.color,
            }}
            variant="h6"
            component="div"
          >
            {title}{" "}
            {selectedRows.length > 0 && (
              <Chip
                label={`${selectedRows.length} selected`}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearch}
              sx={{
                width: { xs: "100%", sm: 200 },
                "& .MuiOutlinedInput-root": {
                  color: tableStyles.paper.color,
                  "& fieldset": {
                    borderColor: alpha(tableStyles.paper.color, 0.5),
                  },
                  "&:hover fieldset": {
                    borderColor: alpha(tableStyles.paper.color, 0.7),
                  },
                  "&.Mui-focused fieldset": { borderColor: primaryColor },
                },
                "& .MuiInputLabel-root": {
                  color: alpha(tableStyles.paper.color, 0.7),
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search
                      sx={{ color: alpha(tableStyles.paper.color, 0.7) }}
                    />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
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

            <Tooltip title="Show/Hide Filters">
              <IconButton
                onClick={toggleFilters}
                aria-label="filter list"
                color={showFilters ? "primary" : "default"}
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

            <Tooltip title="Column Visibility">
              <IconButton
                onClick={handleColumnVisibilityMenuOpen}
                aria-label="column visibility"
                sx={{ color: alpha(tableStyles.paper.color, 0.7) }}
              >
                <ViewColumn />
              </IconButton>
            </Tooltip>

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

            <Tooltip title="Table Options">
              <IconButton
                onClick={handleOptionsMenuOpen}
                aria-label="table options"
                sx={{ color: alpha(tableStyles.paper.color, 0.7) }}
              >
                <MoreVert />
              </IconButton>
            </Tooltip>

            {/* Column Visibility Menu */}
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

            {/* Options Menu */}
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
                    <LightMode
                      fontSize="small"
                      sx={{ color: darkMode ? "#fff" : "#333" }}
                    />
                  ) : (
                    <DarkMode
                      fontSize="small"
                      sx={{ color: darkMode ? "#fff" : "#333" }}
                    />
                  )}
                </ListItemIcon>
                {darkMode ? "Light Mode" : "Dark Mode"}
              </MenuItem>
              <MenuItem onClick={toggleDensePadding}>
                <ListItemIcon >
                  <Checkbox checked={densePadding} size="small"  sx={{ p: 0, m: 0 }} />
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
                      <Send fontSize="small" sx={{ color: darkMode ? '#fff' : '#333' }} />
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
                  <Refresh
                    fontSize="small"
                    sx={{ color: darkMode ? "#fff" : "#333" }}
                  />
                </ListItemIcon>
                Reset All Settings
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>

        {/* Basic Filters */}
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
            {columns
              .filter((col) => col.filterable && col.visible !== false)
              .slice(0, advancedFiltersOpen ? columns.length : 3)
              .map((column) => (
                <FormControl
                  key={column.key}
                  size="small"
                  variant="outlined"
                  sx={{
                    minWidth: 150,
                    "& .MuiInputLabel-outlined": {
                      color: alpha(tableStyles.paper.color, 0.7),
                      "&.Mui-focused": {
                        color: primaryColor,
                      },
                    },
                    "& .MuiOutlinedInput-root": {
                      color: tableStyles.paper.color,
                      "& fieldset": {
                        borderColor: alpha(tableStyles.paper.color, 0.5),
                      },
                      "&:hover fieldset": {
                        borderColor: alpha(tableStyles.paper.color, 0.7),
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: primaryColor,
                      },
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
                        id={`filter-${column.key}`}
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
                              "&:hover": {
                                backgroundColor: darkMode ? "#555" : "#f5f5f5",
                              },
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
                      placeholder={
                        column.type === "date" ? undefined : column.label
                      }
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
                  ml: 1,
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

              {columns.filter((col) => col.filterable && col.visible !== false)
                .length > 3 && (
                <Button
                  size="small"
                  onClick={toggleAdvancedFilters}
                  endIcon={
                    advancedFiltersOpen ? <ExpandLess /> : <ExpandMore />
                  }
                  sx={{
                    ml: 1,
                    color: tableStyles.paper.color,
                  }}
                >
                  {advancedFiltersOpen ? "Less" : "More"}
                </Button>
              )}
            </Box>
          </Box>
        </Collapse>

        {/* Main Table */}
        <TableContainer
          sx={{
            height: tableHeight,
            width: tableWidth,
            overflow: "auto",
            position: "relative",
            maxHeight: "calc(100vh - 70px)", // Adjust this value as needed
          }}
        >
          {loading && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
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
                        selectedRows.length < filteredData.length
                      }
                      checked={
                        filteredData.length > 0 &&
                        selectedRows.length === filteredData.length
                      }
                      onChange={handleSelectAllClick}
                      sx={{ color: tableStyles.headerText }}
                    />
                  </TableCell>
                )}

                {visibleColumns.map((column) => (
                  <TableCell
                    key={column.key}
                    sortDirection={orderBy === column.key ? order : false}
                    align={column.align || "left"}
                    style={{
                      minWidth: column.width,
                      width: column.width,
                      position: "sticky", // Make all headers sticky
                      top: 0,
                      zIndex: 2,
                      backgroundColor: tableStyles.headerBackground,
                    }}
                    sx={{
                      color: tableStyles.headerText,
                      whiteSpace: "nowrap",
                      "& .MuiTableSortLabel-root": {
                        color: `${tableStyles.headerText} !important`,
                        "&:hover": {
                          color: "rgba(255, 255, 255, 0.7) !important",
                        },
                        "&.Mui-active": {
                          color: `${tableStyles.headerText} !important`,
                        },
                      },
                      "& .MuiTableSortLabel-icon": {
                        color: "rgba(255, 255, 255, 0.7) !important",
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
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => {
                  const rowId = row[uniqueId];
                  const isItemSelected = isRowSelected(rowId);
                  const isExpanded = expandedRow === rowId;

                  return (
                    <React.Fragment key={rowId}>
                      <TableRow
                        hover
                        onClick={(event) => {
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
                              backgroundColor:
                                tableStyles.paper.backgroundColor,
                              position: "sticky",
                              left: 0,
                              zIndex: 2,
                            }}
                          >
                            <Checkbox
                              checked={isItemSelected}
                              color="primary"
                              onClick={(event) =>
                                handleCheckboxClick(event, rowId)
                              }
                            />
                          </TableCell>
                        )}

                        {visibleColumns.map((column) => (
                          <TableCell
                            key={`${rowId}-${column.key}`}
                            align={column.align || "left"}
                            sx={{
                              backgroundColor: "inherit",
                              position: "inherit",
                              zIndex: 0,
                            }}
                          >
                            {column.render
                              ? column.render(row)
                              : row[column.key] !== null &&
                                row[column.key] !== undefined
                              ? row[column.key]
                              : "-"}
                          </TableCell>
                        ))}
                      </TableRow>

                      {row.expandContent && (
                        <TableRow>
                          <TableCell
                            colSpan={
                              visibleColumns.length + (enableSelection ? 1 : 0)
                            }
                            style={{ paddingBottom: 0, paddingTop: 0 }}
                          >
                            <Collapse
                              in={isExpanded}
                              timeout="auto"
                              unmountOnExit
                            >
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
                })}
            </TableBody>
            {enableColumnTotals && (
              <TableFooter>
                <TableRow
                  sx={{
                    position: "sticky",
                    bottom: 0,
                    zIndex: 3,
                    backgroundColor: darkMode
                      ? alpha(primaryColor, 0.35)
                      : alpha(primaryColor, 0.12),
                  }}
                >
                  {enableSelection && (
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        borderTop: `2px solid ${primaryColor}`,
                      }}
                    />
                  )}
                  {visibleColumns.map((column, index) => {
                    const isFirstVisible = index === 0;
                    const showLabel = isFirstVisible && !column.total;
                    return (
                      <TableCell
                        key={`footer-${column.key}`}
                        align={column.total ? "right" : column.align || "left"}
                        sx={{
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          borderTop: `2px solid ${primaryColor}`,
                        }}
                      >
                        {column.total
                          ? columnTotals[column.key] || 0
                          : showLabel
                            ? `Total (${filteredData.length})`
                            : ""}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[20, 40, 60, 80, 100]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            color: tableStyles.paper.color,
            "& .MuiTablePagination-selectIcon": {
              color: tableStyles.paper.color,
            },
            "& .MuiTablePagination-actions": {
              "& .MuiIconButton-root": {
                color: alpha(tableStyles.paper.color, 0.7),
              },
            },
          }}
        />
      </Paper>
    </Box>
  );
};

// ListItemIcon component
const ListItemIcon = ({ children, ...props }) => (
  <Box sx={{ mr: 2, display: "inline-flex", minWidth: "24px", ...props }}>
    {children}
  </Box>
);

export default DataTable;