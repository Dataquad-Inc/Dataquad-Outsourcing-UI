import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  Typography,
  useTheme,
  Box,
  IconButton,
  InputAdornment,
  LinearProgress,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import { LoadingSpinner } from "./LoadingSpinner";

const CustomTable = React.memo(
  ({ columns, fetchData, title = "Data Table", refreshKey }) => {
    const theme = useTheme();
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    // Refs to track current request and prevent stale updates
    const currentRequestRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Custom hook for debouncing
    const useDebounce = (value, delay) => {
      const [debouncedValue, setDebouncedValue] = useState(value);

      useEffect(() => {
        const handler = setTimeout(() => {
          setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
      }, [value, delay]);

      return debouncedValue;
    };

    const debouncedSearch = useDebounce(search, 500);

    // Memoized load data function
    const loadData = useCallback(
      async (requestParams) => {
        // Cancel previous request if it exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        const requestId = Date.now();
        currentRequestRef.current = requestId;

        setLoading(true);

        try {
          const result = await fetchData({
            ...requestParams,
            signal: abortControllerRef.current.signal,
          });

          // Only update state if this is still the latest request
          if (currentRequestRef.current === requestId) {
            setRows(result.data || []);
            setTotal(result.total || 0);
          }
        } catch (error) {
          if (
            error.name !== "AbortError" &&
            currentRequestRef.current === requestId
          ) {
            console.error("Failed to fetch data:", error);
            setRows([]);
            setTotal(0);
          }
        } finally {
          if (currentRequestRef.current === requestId) {
            setLoading(false);
          }
        }
      },
      [fetchData]
    );

    // Memoized request parameters
    const requestParams = useMemo(
      () => ({
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearch,
      }),
      [page, rowsPerPage, debouncedSearch]
    );

    // Effect to load data when parameters change
    useEffect(() => {
      loadData(requestParams);
    }, [loadData, requestParams, refreshKey]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, []);

    // Optimized handlers with useCallback
    const handleChangePage = useCallback((_, newPage) => {
      setPage(newPage);
    }, []);

    const handleChangeRowsPerPage = useCallback((event) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    }, []);

    const handleSearchChange = useCallback((event) => {
      setSearch(event.target.value);
      setPage(0);
    }, []);

    const handleSearchClear = useCallback(() => {
      setSearch("");
      setPage(0);
    }, []);

    const handleRefresh = useCallback(() => {
      loadData(requestParams);
    }, [loadData, requestParams]);

    // Memoized search input props
    const searchInputProps = useMemo(
      () => ({
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon
              sx={{
                color: search
                  ? theme.palette.primary.main
                  : theme.palette.action.active,
              }}
            />
          </InputAdornment>
        ),
        endAdornment: search && (
          <InputAdornment position="end">
            <IconButton size="small" onClick={handleSearchClear}>
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ),
      }),
      [
        search,
        handleSearchClear,
        theme.palette.primary.main,
        theme.palette.action.active,
      ]
    );

    return (
      <Paper
        sx={{
          p: 2,
          boxShadow: theme.shadows[4],
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          mb={3}
          flexWrap="wrap"
          justifyContent="space-between"
        >
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 600,
              flex: 1,
              minWidth: 200,
            }}
          >
            {title}
          </Typography>

          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              variant="outlined"
              placeholder="Search..."
              size="small"
              value={search}
              onChange={handleSearchChange}
              sx={{
                minWidth: 300,
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.shape.borderRadius * 3,
                  backgroundColor: theme.palette.background.default,
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                  "&.Mui-focused": {
                    backgroundColor: theme.palette.background.paper,
                  },
                },
              }}
              InputProps={searchInputProps}
            />

            <IconButton
              onClick={handleRefresh}
              sx={{
                color: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: theme.palette.primary.main + "10",
                },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Table Container */}
        <Box sx={{ position: "relative" }}>
          {/* Top Linear Progress */}
          {loading && (
            <LinearProgress
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1,
                borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
              }}
            />
          )}

          <TableContainer
            sx={{
              maxHeight: "80vh",
              overflowY: "auto",
              borderRadius: theme.shape.borderRadius,
              border: `1px solid ${theme.palette.divider}`,
              "&::-webkit-scrollbar": {
                width: 8,
                height: 8,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: theme.palette.primary.main + "40",
                borderRadius: 4,
                "&:hover": {
                  backgroundColor: theme.palette.primary.main + "60",
                },
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: theme.palette.background.default,
              },
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                        backgroundColor: theme.palette.primary.light,
                        color: theme.palette.primary.contrastText,
                        borderBottom: `2px solid ${theme.palette.primary.dark}`,
                        py: 2,
                      }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      align="center"
                      sx={{ py: 4 }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontStyle: "italic",
                        }}
                      >
                        No records found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, i) => (
                    <TableRow
                      key={i}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: theme.palette.action.hover,
                        },
                        "&:nth-of-type(even)": {
                          backgroundColor: theme.palette.background.default,
                        },
                      }}
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={col.id}
                          sx={{
                            whiteSpace: "nowrap",
                            py: 1.5,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            color: theme.palette.text.primary,
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

          {/* Bottom Linear Progress */}
          {/* Bottom Linear Progress */}
          {loading && (
            <>
              <LinearProgress
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1,
                  borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
                }}
              />
              <Backdrop
                open={true}
                sx={{
                  position: "absolute",
                  zIndex: theme.zIndex.modal + 1,
                  color: "#fff",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LoadingSpinner />
              </Backdrop>
            </>
          )}
        </Box>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Rows per page"
          sx={{
            mt: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            pt: 2,
            "& .MuiTablePagination-toolbar": {
              color: theme.palette.text.primary,
            },
            "& .MuiTablePagination-selectLabel": {
              color: theme.palette.text.secondary,
            },
            "& .MuiTablePagination-displayedRows": {
              color: theme.palette.text.secondary,
            },
          }}
        />
      </Paper>
    );
  }
);

CustomTable.displayName = "CustomTable";

export default CustomTable;
