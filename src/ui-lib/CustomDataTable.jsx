import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  useTheme,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  LinearProgress,
  Backdrop,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Collapse,
  Checkbox,
  Popover,
  FormGroup,
  FormControlLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LoadingSpinner } from "./LoadingSpinner";

const CustomDataTable = ({
  title,
  columns,
  rows,
  total,
  page,
  rowsPerPage,
  search,
  loading,
  filters = {},
  filterStorageKey,
  onPageChange,
  onRowsPerPageChange,
  onSearchChange,
  onSearchClear,
  onRefresh,
  onFiltersChange,
}) => {
  const theme = useTheme();
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(() => {
    if (filterStorageKey) {
      try {
        const stored = localStorage.getItem(filterStorageKey);
        return stored ? JSON.parse(stored) : filters;
      } catch (error) {
        console.error("Error loading filters from localStorage:", error);
        return filters;
      }
    }
    return filters;
  });

  const [columnSelectorAnchor, setColumnSelectorAnchor] = useState(null);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const storageKey = filterStorageKey ? `${filterStorageKey}_columns` : null;

    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const validatedVisibility = {};
          columns.forEach((col) => {
            validatedVisibility[col.id] =
              parsed[col.id] !== undefined
                ? parsed[col.id]
                : col.hidden !== true;
          });
          return validatedVisibility;
        }
      } catch (error) {
        console.error(
          "Error loading column visibility from localStorage:",
          error
        );
      }
    }

    return columns.reduce((acc, col) => {
      acc[col.id] = col.hidden !== true;
      return acc;
    }, {});
  });

  const FILTER_FIELD_WIDTH = 200;

  const filterableColumns = columns.filter((col) => col.applyFilter === true);

  useEffect(() => {
    if (JSON.stringify(filters) !== JSON.stringify(localFilters)) {
      setLocalFilters(filters);
    }
  }, [filters]);

  useEffect(() => {
    if (filterStorageKey) {
      try {
        localStorage.setItem(filterStorageKey, JSON.stringify(localFilters));
      } catch (error) {
        console.error("Error saving filters to localStorage:", error);
      }
    }
  }, [localFilters, filterStorageKey]);

  useEffect(() => {
    const storageKey = filterStorageKey ? `${filterStorageKey}_columns` : null;
    if (storageKey && visibleColumns) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
      } catch (error) {
        console.error("Error saving column visibility to localStorage:", error);
      }
    }
  }, [visibleColumns, filterStorageKey]);

  const handleFilterChange = (columnId, value, filterType) => {
    const newFilters = { ...localFilters };

    if (value === "" || value === null || value === undefined) {
      delete newFilters[columnId];
    } else {
      newFilters[columnId] = {
        value,
        type: filterType,
      };
    }

    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange?.(localFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onFiltersChange?.({});
    if (filterStorageKey) {
      try {
        localStorage.removeItem(filterStorageKey);
      } catch (error) {
        console.error("Error clearing filters from localStorage:", error);
      }
    }
  };

  const toggleColumnVisibility = (columnId) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const handleResetColumns = () => {
    const defaultVisibility = columns.reduce((acc, col) => {
      acc[col.id] = col.hidden !== true;
      return acc;
    }, {});

    setVisibleColumns(defaultVisibility);

    const storageKey = filterStorageKey ? `${filterStorageKey}_columns` : null;
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error("Error resetting columns in localStorage:", error);
      }
    }
  };

  // Excel export function
  const handleExportExcel = async () => {
    try {
      // Import the required libraries dynamically
      const XLSX = await import("xlsx");

      // Get visible columns only
      const visibleCols = columns.filter((col) => visibleColumns[col.id]);

      // Prepare header row
      const headers = visibleCols.map((col) => col.label);

      // Prepare data rows
      const dataRows = (Array.isArray(rows) ? rows : []).map((row) =>
        visibleCols.map((col) => {
          const cellValue = col.render
            ? col.render(row[col.id], row)
            : row[col.id];

          // Handle React elements and other non-string values
          if (typeof cellValue === "string" || typeof cellValue === "number") {
            return cellValue;
          } else if (React.isValidElement(cellValue)) {
            // For React elements, try to extract text content
            return cellValue.props?.children || cellValue.props?.value || "";
          } else if (cellValue instanceof Date) {
            return cellValue.toLocaleDateString();
          }
          return cellValue?.toString?.() || "";
        })
      );

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

      // Auto-size columns
      const colWidths = headers.map((header, colIndex) => {
        const maxDataLength = Math.max(
          header.length,
          ...dataRows.map((row) => String(row[colIndex] || "").length)
        );
        return { wch: Math.min(Math.max(maxDataLength, 8), 50) }; // Min 8, max 50 chars
      });
      worksheet["!cols"] = colWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, title || "Sheet1");

      // Generate file and download
      const fileName = `${title || "table_export"}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      // Fallback to CSV if XLSX library fails to load
      handleExportCSV();
    }
  };

  // Fallback CSV export function
  const handleExportCSV = () => {
    // Get visible columns only
    const visibleCols = columns.filter((col) => visibleColumns[col.id]);

    // Prepare header row
    const headers = visibleCols.map((col) => col.label);

    // Prepare data rows
    const dataRows = (Array.isArray(rows) ? rows : []).map((row) =>
      visibleCols.map((col) => {
        const cellValue = col.render
          ? col.render(row[col.id], row)
          : row[col.id];
        // Handle React elements and other non-string values
        return typeof cellValue === "string" || typeof cellValue === "number"
          ? cellValue
          : cellValue?.toString?.() || "";
      })
    );

    // Combine headers and data
    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...dataRows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title || "table_export"}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderFilterInput = (column) => {
    const currentFilter = localFilters[column.id];
    const currentValue = currentFilter?.value || "";

    switch (column.filterType) {
      case "select":
        return (
          <FormControl
            size="small"
            sx={{
              minWidth: FILTER_FIELD_WIDTH,
              maxWidth: FILTER_FIELD_WIDTH,
              width: FILTER_FIELD_WIDTH,
            }}
          >
            <InputLabel>{column.label}</InputLabel>
            <Select
              value={currentValue}
              label={column.label}
              onChange={(e) =>
                handleFilterChange(column.id, e.target.value, "select")
              }
              sx={{ width: FILTER_FIELD_WIDTH }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 350,
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {column.filterOptions?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "date":
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={column.label}
              value={currentValue ? new Date(currentValue) : null}
              onChange={(date) =>
                handleFilterChange(column.id, date?.toISOString(), "date")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  sx={{
                    minWidth: FILTER_FIELD_WIDTH,
                    maxWidth: FILTER_FIELD_WIDTH,
                    width: FILTER_FIELD_WIDTH,
                  }}
                />
              )}
            />
          </LocalizationProvider>
        );

      case "dateRange":
        return (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexDirection: "column",
              minWidth: FILTER_FIELD_WIDTH,
              maxWidth: FILTER_FIELD_WIDTH,
              width: FILTER_FIELD_WIDTH,
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label={`${column.label} From`}
                value={currentValue?.from ? new Date(currentValue.from) : null}
                onChange={(date) =>
                  handleFilterChange(
                    column.id,
                    {
                      ...currentValue,
                      from: date?.toISOString(),
                    },
                    "dateRange"
                  )
                }
                renderInput={(params) => (
                  <TextField {...params} size="small" sx={{ width: "100%" }} />
                )}
              />
              <DatePicker
                label={`${column.label} To`}
                value={currentValue?.to ? new Date(currentValue.to) : null}
                onChange={(date) =>
                  handleFilterChange(
                    column.id,
                    {
                      ...currentValue,
                      to: date?.toISOString(),
                    },
                    "dateRange"
                  )
                }
                renderInput={(params) => (
                  <TextField {...params} size="small" sx={{ width: "100%" }} />
                )}
              />
            </LocalizationProvider>
          </Box>
        );

      case "number":
        return (
          <TextField
            size="small"
            type="number"
            label={column.label}
            value={currentValue}
            onChange={(e) =>
              handleFilterChange(column.id, e.target.value, "number")
            }
            sx={{
              minWidth: FILTER_FIELD_WIDTH,
              maxWidth: FILTER_FIELD_WIDTH,
              width: FILTER_FIELD_WIDTH,
            }}
          />
        );

      case "text":
      default:
        return (
          <TextField
            size="small"
            label={column.label}
            value={currentValue}
            onChange={(e) =>
              handleFilterChange(column.id, e.target.value, "text")
            }
            sx={{
              minWidth: FILTER_FIELD_WIDTH,
              maxWidth: FILTER_FIELD_WIDTH,
              width: FILTER_FIELD_WIDTH,
            }}
          />
        );
    }
  };

  const activeFiltersCount = Object.keys(localFilters).length;
  const visibleColumnsCount =
    Object.values(visibleColumns).filter(Boolean).length;
  const hiddenColumnsCount = columns.length - visibleColumnsCount;

  return (
    <Paper
      sx={{
        p: 2,
        boxShadow: theme.shadows[3],
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.primary.main,
          }}
        >
          {title}
        </Typography>

        <Box display="flex" gap={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={onSearchChange}
            sx={{
              minWidth: 220,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: theme.palette.background.default,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={onSearchClear}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Download Excel Button */}
          <IconButton
            onClick={handleExportExcel}
            title="Download as Excel"
            sx={{
              color: theme.palette.primary.main,
              "&:hover": { backgroundColor: theme.palette.action.hover },
            }}
          >
            <FileDownloadIcon />
          </IconButton>

          {/* Column Selector Button */}
          <IconButton
            onClick={(e) => setColumnSelectorAnchor(e.currentTarget)}
            sx={{
              color: theme.palette.primary.main,
              "&:hover": { backgroundColor: theme.palette.action.hover },
            }}
          >
            <Box sx={{ position: "relative" }}>
              <ViewColumnIcon />
              {hiddenColumnsCount > 0 && (
                <Chip
                  size="small"
                  label={hiddenColumnsCount}
                  sx={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    fontSize: "0.6rem",
                  }}
                  color="primary"
                />
              )}
            </Box>
          </IconButton>

          {/* Filter Toggle Button */}
          {filterableColumns.length > 0 && (
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                color:
                  showFilters || activeFiltersCount > 0
                    ? theme.palette.primary.main
                    : theme.palette.action.active,
                "&:hover": { backgroundColor: theme.palette.action.hover },
              }}
            >
              {activeFiltersCount > 0 ? (
                <Box sx={{ position: "relative" }}>
                  <FilterListIcon />
                  <Chip
                    size="small"
                    label={activeFiltersCount}
                    sx={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      minWidth: 16,
                      height: 16,
                      fontSize: "0.6rem",
                    }}
                    color="primary"
                  />
                </Box>
              ) : (
                <FilterListIcon />
              )}
            </IconButton>
          )}

          <IconButton
            onClick={onRefresh}
            sx={{
              color: theme.palette.primary.main,
              "&:hover": { backgroundColor: theme.palette.action.hover },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Column Selector Popover */}
      <Popover
        open={Boolean(columnSelectorAnchor)}
        anchorEl={columnSelectorAnchor}
        onClose={() => setColumnSelectorAnchor(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box sx={{ p: 2, minWidth: 200, maxHeight: 400 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Visible Columns
            </Typography>
            <Button
              size="small"
              onClick={handleResetColumns}
              disabled={hiddenColumnsCount === 0}
            >
              Reset
            </Button>
          </Box>
          <FormGroup>
            {columns.map((column) => (
              <FormControlLabel
                key={column.id}
                control={
                  <Checkbox
                    checked={!!visibleColumns[column.id]}
                    onChange={() => toggleColumnVisibility(column.id)}
                  />
                }
                label={column.label}
              />
            ))}
          </FormGroup>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            {visibleColumnsCount} of {columns.length} columns visible
          </Typography>
        </Box>
      </Popover>

      {/* First 4 Filters Row */}
      {filterableColumns.length > 0 && (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 2,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          {filterableColumns.slice(0, 4).map((column) => (
            <Box
              key={column.id}
              sx={{
                minWidth: FILTER_FIELD_WIDTH,
                maxWidth: FILTER_FIELD_WIDTH,
                width: FILTER_FIELD_WIDTH,
              }}
            >
              {renderFilterInput(column)}
            </Box>
          ))}

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
              startIcon={<FilterListOffIcon />}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleApplyFilters}
              startIcon={<FilterListIcon />}
            >
              Apply
            </Button>
          </Box>

          {filterableColumns.length > 4 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Hide More" : "More Filters"}
            </Button>
          )}
        </Box>
      )}

      {/* Additional Filters Accordion */}
      {filterableColumns.length > 4 && (
        <Collapse in={showFilters}>
          <Paper
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: theme.palette.grey[50],
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Additional Filters
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 2,
              }}
            >
              {filterableColumns.slice(4).map((column) => (
                <Box
                  key={column.id}
                  sx={{
                    minWidth: FILTER_FIELD_WIDTH,
                    maxWidth: FILTER_FIELD_WIDTH,
                    width: FILTER_FIELD_WIDTH,
                  }}
                >
                  {renderFilterInput(column)}
                </Box>
              ))}
            </Box>
          </Paper>
        </Collapse>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="body2" sx={{ mr: 1, alignSelf: "center" }}>
            Active Filters:
          </Typography>
          {Object.entries(localFilters).map(([columnId, filter]) => {
            const column = columns.find((col) => col.id === columnId);
            const displayValue =
              filter.type === "dateRange"
                ? `${
                    filter.value.from
                      ? new Date(filter.value.from).toLocaleDateString()
                      : ""
                  } - ${
                    filter.value.to
                      ? new Date(filter.value.to).toLocaleDateString()
                      : ""
                  }`
                : filter.type === "date"
                ? new Date(filter.value).toLocaleDateString()
                : filter.value;

            return (
              <Chip
                key={columnId}
                label={`${column?.label}: ${displayValue}`}
                size="small"
                onDelete={() => {
                  handleFilterChange(columnId, null, filter.type);
                  const updatedFilters = Object.fromEntries(
                    Object.entries(localFilters).filter(
                      ([id]) => id !== columnId
                    )
                  );
                  onFiltersChange?.(updatedFilters);
                }}
                color="primary"
                variant="outlined"
              />
            );
          })}
        </Box>
      )}

      {/* Table */}
      <Box sx={{ position: "relative" }}>
        {loading && (
          <LinearProgress
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              borderRadius: "4px 4px 0 0",
            }}
            color="primary"
          />
        )}
        <TableContainer sx={{ maxHeight: "85vh" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                {columns
                  .filter((col) => visibleColumns[col.id])
                  .map((col, index) => (
                    <TableCell
                      key={col.id}
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        "&:first-of-type": {
                          borderTopLeftRadius: "8px",
                        },
                        "&:last-of-type": {
                          borderTopRightRadius: "8px",
                        },
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {col.label}
                        {col.applyFilter && (
                          <FilterListIcon
                            sx={{
                              fontSize: 16,
                              opacity: localFilters[col.id] ? 1 : 0.5,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {!loading && (!Array.isArray(rows) || rows.length === 0) ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumnsCount}
                    align="center"
                    sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
                  >
                    <Typography color="text.secondary">
                      No records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(rows) ? rows : []).map((row, i) => (
                  <TableRow
                    key={i}
                    hover
                    sx={{
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    {columns
                      .filter((col) => visibleColumns[col.id])
                      .map((col) => (
                        <TableCell
                          key={col.id}
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          {col.render
                            ? col.render(row[col.id], row)
                            : row[col.id]}
                        </TableCell>
                      ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {loading && (
          <Backdrop
            open
            sx={{
              position: "absolute",
              zIndex: theme.zIndex.modal + 1,
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          >
            <LoadingSpinner />
          </Backdrop>
        )}
      </Box>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[20, 40, 80, 100]}
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
            {
              color: theme.palette.text.secondary,
            },
        }}
      />
    </Paper>
  );
};

export default CustomDataTable;
