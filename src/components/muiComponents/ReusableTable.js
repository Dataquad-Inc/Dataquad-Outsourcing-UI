import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';

/**
 * A reusable table component with pagination, styling, and customizable rendering
 * @param {Object} props - Component props
 * @param {Array} props.columns - Array of column definitions with key, label, and optional render function
 * @param {Array} props.data - Array of data objects to display in the table
 * @param {boolean} [props.loading] - Loading state for the table
 * @param {string} [props.emptyMessage] - Message to display when there's no data
 * @param {Object} [props.sx] - Additional styles for the Paper component
 * @param {number} [props.defaultRowsPerPage] - Default number of rows per page (default: 10)
 * @param {Array} [props.rowsPerPageOptions] - Options for rows per page (default: [10, 15, 20, 25])
 * @param {number} [props.maxHeight] - Maximum height for the table container (default: 650px)
 * @returns {JSX.Element} The ReusableTable component
 */
const ReusableTable = ({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = "No data available", 
  sx = {},
  defaultRowsPerPage = 10,
  rowsPerPageOptions = [10, 15, 20, 25],
  maxHeight = 650
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  // Ensure data is always an array
  const tableData = Array.isArray(data) ? data : [];

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  };

  // Loading state
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="200px"
        flexDirection="column"
      >
        <CircularProgress size={40} color="primary" />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading data...
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (tableData.length === 0) {
    return (
      <Paper 
        sx={{ 
          borderRadius: '8px', 
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)', 
          padding: '20px',
          textAlign: 'center',
          ...sx
        }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      sx={{ 
        borderRadius: '8px', 
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)', 
        padding: '10px',
        ...sx
      }}
    >
      <TableContainer sx={{ maxHeight, overflowY: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col, index) => (
                <TableCell
                  key={index}
                  sx={{
                    backgroundColor: '#2A4DBD',
                    color: 'white',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    borderBottom: '2px solid #ddd',
                    borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '12px',
                    '&:last-child': { borderRight: 'none' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  sx={{
                    '&:nth-of-type(even)': { backgroundColor: '#F8F9FC' },
                    '&:hover': { backgroundColor: '#E7ECFF' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  {columns.map((col, colIndex) => (
                    <TableCell
                      key={colIndex}
                      sx={{
                        borderBottom: '1px solid #eaeaea',
                        borderRight: '1px solid #eaeaea',
                        '&:last-child': { borderRight: 'none' },
                        padding: '12px',
                        minHeight: '48px',
                        fontSize: '0.95rem',
                        textAlign: 'center',
                        color: '#333',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                      }}
                    >
                      {col.render 
                        ? col.render(row[col.key], row) 
                        : (row[col.key] !== undefined && row[col.key] !== null) 
                          ? row[col.key] 
                          : '—'
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={tableData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ 
          backgroundColor: '#F8F9FC',
          borderTop: '1px solid #eaeaea',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
        }}
      />
    </Paper>
  );
};

export default ReusableTable;