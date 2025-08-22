import React from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
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
  onPageChange,
  onRowsPerPageChange,
  onSearchChange,
  onSearchClear,
  onRefresh,
}) => {
  const theme = useTheme();

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
                {columns.map((col, index) => (
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
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {!loading && (!Array.isArray(rows) || rows.length === 0) ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
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
                    {columns.map((col) => (
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
