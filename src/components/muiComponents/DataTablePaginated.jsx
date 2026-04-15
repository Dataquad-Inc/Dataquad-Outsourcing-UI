import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Box,
  Typography,
  Toolbar,
  TablePagination,
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
} from "@mui/icons-material";
import * as XLSX from "xlsx";

const exportToCsv = (data, columns) => {
  const headerRow = columns.map((column) => column.label).join(",");
  const dataRows = data.map((row) =>
    columns
      .map((column) => {
        if (column.key === "actions") return "";
        const value = row[column.key];
        return typeof value === "string"
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      })
      .join(","),
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

const exportToExcel = (data, columns, fileName = "data_export") => {
  const visibleColumns = columns.filter(
    (col) => col.visible !== false && col.key !== "actions",
  );
  const headers = visibleColumns.map((col) => col.label);

  const excelData = data.map((row) => {
    const rowData = {};
    visibleColumns.forEach((col) => {
      rowData[col.label] = row[col.key];
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
  // New prop for external search value
  searchValue = "",
}) => {
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
  const [order, setOrder] = useState(defaultSortDirection);
  const [orderBy, setOrderBy] = useState(
    defaultSortColumn || columns[0]?.key || uniqueId,
  );
  const [searchInput, setSearchInput] = useState(searchValue || "");
  const [searchQuery, setSearchQuery] = useState(searchValue || "");
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState(null);
  const [optionsMenu, setOptionsMenu] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [densePadding, setDensePadding] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const tableHeight = customTableHeight || "100%";
  const tableWidth = customTableWidth || "100%";

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

  // Sync search input with external searchValue prop
  useEffect(() => {
    if (searchValue !== undefined) {
      setSearchInput(searchValue);
      setSearchQuery(searchValue);
    }
  }, [searchValue]);

  useEffect(() => {
    setData(initialData);
    if (!serverSide || enableLocalFiltering) {
      setFilteredData(initialData);
    }
  }, [initialData, serverSide, enableLocalFiltering]);

  useEffect(() => {
    setColumns(processedColumns);
  }, [processedColumns]);

  const handleChangePage = (event, newPage) => {
    console.log(
      `handleChangePage: newPage=${newPage}, currentRowsPerPage=${externalRowsPerPage || defaultRowsPerPage}`,
    );

    if (serverSide && onPageChange) {
      onPageChange(newPage, externalRowsPerPage || defaultRowsPerPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    console.log(`handleChangeRowsPerPage: newRowsPerPage=${newRowsPerPage}`);

    if (serverSide) {
      if (onRowsPerPageChange) {
        onRowsPerPageChange(newRowsPerPage);
      }
      if (onPageChange) {
        onPageChange(0, newRowsPerPage);
      }
    }
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    const newOrder = isAsc ? "desc" : "asc";

    setOrder(newOrder);
    setOrderBy(property);

    if (serverSide && onSortChange) {
      onSortChange(
        property,
        newOrder,
        externalPage || 0,
        externalRowsPerPage || defaultRowsPerPage,
        filters,
        searchQuery,
      );
    }
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

  const handleSearchInputChange = (event) => {
    const value = event.target.value;
    setSearchInput(value);
    
    // For real-time search (without debounce)
    if (serverSide && onSearchChange && !enableLocalFiltering) {
      // Call search immediately for server-side
      setSearchQuery(value);
      onSearchChange(
        value,
        0, // Reset to first page when searching
        externalRowsPerPage || defaultRowsPerPage,
        orderBy,
        order,
      );
    }
  };

  const handleSearchClick = () => {
    const trimmedSearch = searchInput.trim();
    setSearchQuery(trimmedSearch);

    if (serverSide && onSearchChange) {
      onSearchChange(
        trimmedSearch,
        0, // Reset to first page when searching
        externalRowsPerPage || defaultRowsPerPage,
        orderBy,
        order,
      );
    }
  };

  const handleSearchKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearchClick();
    }
  };

  const clearSearch = () => {
    const emptyValue = "";
    setSearchInput(emptyValue);
    setSearchQuery(emptyValue);
    
    if (serverSide && onSearchChange) {
      onSearchChange(
        emptyValue,
        externalPage || 0,
        externalRowsPerPage || defaultRowsPerPage,
        orderBy,
        order,
      );
    }
  };

  const handleFilterChange = (column, value) => {
    const newFilters = {
      ...filters,
      [column]: value,
    };

    setFilters(newFilters);

    if ((serverSide || enableServerSideFiltering) && onFilterChange) {
      onFilterChange(
        newFilters,
        externalPage || 0,
        externalRowsPerPage || defaultRowsPerPage,
        orderBy,
        order,
        searchQuery,
      );
    }
  };

  const clearAllFilters = () => {
    setFilters({});
    if ((serverSide || enableServerSideFiltering) && onFilterChange) {
      onFilterChange(
        {},
        externalPage || 0,
        externalRowsPerPage || defaultRowsPerPage,
        orderBy,
        order,
        searchQuery,
      );
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const dataToSelect = serverSide ? data : filteredData;
      const newSelected = dataToSelect.map((row) => row[uniqueId]);
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
        col.key === columnKey ? { ...col, visible: !col.visible } : col,
      ),
    );
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleDensePadding = () => {
    setDensePadding(!densePadding);
  };

  const handleExportData = (format = "csv") => {
    if (enableFinancialValidation && !isFinancialVerified) {
      onRequestOtpVerification(() => {
        performExport(format);
      });
      return;
    }

    performExport(format);
  };

  const performExport = (format) => {
    if (serverSide && onExportData) {
      onExportData(format, {
        page: externalPage || 0,
        rowsPerPage: externalRowsPerPage || defaultRowsPerPage,
        orderBy,
        order,
        filters,
        searchQuery,
      });
      handleOptionsMenuClose();
      return;
    }

    const visibleColumns = columns.filter((col) => col.visible !== false);
    const dataToExport = serverSide ? data : filteredData;

    if (format === "csv") {
      exportToCsv(dataToExport, visibleColumns);
    } else {
      exportToExcel(dataToExport, visibleColumns);
    }

    handleOptionsMenuClose();
  };

  const handleRowExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const resetAllSettings = () => {
    const emptyValue = "";
    setSearchQuery(emptyValue);
    setSearchInput(emptyValue);
    setFilters({});
    setSelectedRows([]);
    setColumns(processedColumns);
    setOrder(defaultSortDirection);
    setOrderBy(defaultSortColumn || columns[0]?.key || uniqueId);
    setDarkMode(false);
    setDensePadding(false);
    setShowFilters(false);
    handleOptionsMenuClose();

    if (serverSide && onPageChange) {
      onPageChange(0, defaultRowsPerPage);
    }
    
    // Call external reset if needed
    if (serverSide && onSearchChange) {
      onSearchChange(
        emptyValue,
        0,
        externalRowsPerPage || defaultRowsPerPage,
        orderBy,
        order,
      );
    }
  };

  useEffect(() => {
    if (serverSide && !enableLocalFiltering) return;

    let result = [...data];

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

    result = result.sort(getComparator(order, orderBy));

    setFilteredData(result);
  }, [
    searchQuery,
    filters,
    data,
    order,
    orderBy,
    columns,
    serverSide,
    enableLocalFiltering,
  ]);

  const displayData = useMemo(() => {
    if (serverSide) {
      return data;
    } else {
      const page = externalPage || 0;
      const rowsPerPage = externalRowsPerPage || defaultRowsPerPage;
      return filteredData.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      );
    }
  }, [
    serverSide,
    data,
    filteredData,
    externalPage,
    externalRowsPerPage,
    defaultRowsPerPage,
  ]);

  const totalRowCount = serverSide ? totalCount : filteredData.length;

  const visibleColumns = columns.filter((column) => column.visible !== false);

  const shouldShowFilters =
    !serverSide || enableLocalFiltering || enableServerSideFiltering;

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
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyPress={handleSearchKeyPress}
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
                endAdornment: (
                  <InputAdornment position="end">
                    {searchInput && (
                      <IconButton
                        aria-label="clear search"
                        onClick={clearSearch}
                        edge="end"
                        size="small"
                        sx={{
                          color: alpha(tableStyles.paper.color, 0.7),
                        }}
                      >
                        <Clear fontSize="small" />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
              placeholder="Search..."
              disabled={serverSide && !onSearchChange}
            />

            {shouldShowFilters && (
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
            )}

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
                      <Send
                        fontSize="small"
                        sx={{ color: darkMode ? "#fff" : "#333" }}
                      />
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
                        selectedRows.length <
                          (serverSide ? data.length : filteredData.length)
                      }
                      checked={
                        (serverSide
                          ? data.length > 0
                          : filteredData.length > 0) &&
                        selectedRows.length ===
                          (serverSide ? data.length : filteredData.length)
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
                    }}
                  >
                    {column.label}
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
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 40, 60, 80, 100]}
          component="div"
          count={totalRowCount}
          rowsPerPage={externalRowsPerPage || defaultRowsPerPage}
          page={externalPage || 0}
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

export default DataTablePaginated;