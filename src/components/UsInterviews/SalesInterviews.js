import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import CustomDataTable from '../../ui-lib/CustomDataTable';
import { interviewsAPI } from '../../utils/api';
import ColumnsForInterviews from './ColumnsForInterviews';

const SalesInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const columns = ColumnsForInterviews();
  const { userId } = useSelector(state => state.auth);

  const fetchInterviews = useCallback(async (currentPage = page, currentRowsPerPage = rowsPerPage, searchTerm = search, currentFilters = filters) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage,
        size: currentRowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...currentFilters
      };

      const response = await interviewsAPI.getSalesInterviews(userId, params);
      
      if (response.success) {
        setInterviews(response.data.content || []);
        setTotal(response.data.totalElements || 0);
      } else {
        setError(response.message || 'Failed to fetch interviews');
        setInterviews([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
      setError('An error occurred while fetching interviews');
      setInterviews([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, filters, userId]);

  // Initial fetch and when dependencies change
  useEffect(() => {
    if (userId) {
      fetchInterviews();
    }
  }, [fetchInterviews, userId]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userId) {
        setPage(0);
        fetchInterviews(0, rowsPerPage, search, filters);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, fetchInterviews, rowsPerPage, filters, userId]);

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  // Handle search change
  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  // Handle search clear
  const handleSearchClear = () => {
    setSearch('');
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchInterviews();
  };

  // Handle filters change
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  const transformedRows = interviews.map(interview => ({
    ...interview,
  }));

  return (
    <div style={{ padding: '16px' }}>
      <CustomDataTable
        title="My Interviews"
        columns={columns}
        rows={transformedRows}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        search={search}
        loading={loading}
        filters={filters}
        filterStorageKey="salesInterviewFilters"
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        onRefresh={handleRefresh}
        onFiltersChange={handleFiltersChange}
      />
      
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          color: '#c62828',
          padding: '12px',
          borderRadius: '4px',
          marginTop: '16px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default SalesInterviews;